import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

// Re-export common functions
export { startNewConversation, getConversations, getConversationMessages } from "./copilot.functions.original";

/**
 * The core AI Engine for Citizen Copilot.
 * Grounded in verified government data AND user documents.
 */
export const sendCopilotMessage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: { conversationId: string; content: string }) =>
    z.object({
      conversationId: z.string().uuid(),
      content: z.string().min(1)
    }).parse(data)
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { conversationId, content } = data;

    // 1. Save user message
    const { error: userMsgError } = await supabase
      .from("messages")
      .insert({
        conversation_id: conversationId,
        role: "user",
        content: content
      });

    if (userMsgError) throw new Error("Failed to save user message");

    // 2. Retrieve Government Context (Enhanced Scheme Search)
    const { searchSchemes, fetchOfficialSchemeDetail } = await import("./schemes.server");
    const schemes = await searchSchemes(content);

    // 3. Official Web Enrichment (if scheme found but detail likely missing)
    let webContext = "";
    if (schemes && schemes.length > 0) {
      const topScheme = schemes[0];
      // Only fetch if intent seems to be deep information (eligibility, benefits, how to apply)
      const needsDeepInfo = /eligib|benefit|apply|document|how to|process|register|cost|fee|deadline/i.test(content);
      
      if (needsDeepInfo && topScheme.source_url) {
        const officialText = await fetchOfficialSchemeDetail(topScheme.source_url);
        if (officialText) {
          webContext = `
            [ADDITIONAL CURRENT INFO FROM OFFICIAL SOURCE: ${topScheme.source_url}]
            ${officialText}
          `;
        }
      }
    }

    // 4. Retrieve User Document Context (Vector Search)
    const { searchUserDocuments } = await import("./documents.functions");
    let docChunks: any[] = [];
    try {
      docChunks = await searchUserDocuments({ data: { query: content, limit: 5 } });
    } catch (e: any) {
      console.warn("User document search failed:", e);
      docChunks = [];
    }

    // 5. Build Context
    const schemeContext = schemes && schemes.length > 0 
      ? schemes.map(s => `
        [GOVERNMENT SCHEME]
        Name: ${s.name}
        Official Name: ${s.official_name || s.name}
        Ministry/Department: ${s.ministry || s.department || 'N/A'}
        Benefits: ${s.benefits || 'Check official source'}
        Eligibility: ${s.eligibility_summary || 'Check official source'}
        Source: ${s.source_name || 'Official Government Source'}
        Official URL: ${s.source_url || 'N/A'}
      `).join("\n---\n")
      : "";

    const userDocContext = docChunks && docChunks.length > 0
      ? docChunks.map((c, i) => `
        [USER DOCUMENT SOURCE #${i+1}]
        Document: ${c.document_name}
        Content Snippet: ${c.content}
        Page: ${c.page_number || 'N/A'}
      `).join("\n---\n")
      : "";

    const combinedContext = `
      VERIFIED GOVERNMENT DATABASE RECORDS:
      ${schemeContext || "No specific government schemes found in database matching this query."}
      
      ${webContext ? `LIVE OFFICIAL WEB EVIDENCE:\n${webContext}` : ""}

      USER'S PERSONAL DOCUMENTS:
      ${userDocContext || "No relevant information found in the user's uploaded documents."}
    `;

    // 6. Call AI Gateway
    const { createAiGateway } = await import("@/lib/ai-gateway.server");
    const ai = createAiGateway();

    const systemPrompt = `
      You are GovCopilot, the official AI Government Scheme Assistant for Indian citizens.
      
      CRITICAL INSTRUCTIONS:
      1. Primary Duty: Help citizens discover, understand, and access government schemes using ONLY the provided Verified Government Information.
      2. Anti-Hallucination: DO NOT invent scheme names, eligibility rules, benefit amounts, launch dates, or application URLs.
      3. Missing Info: If context doesn't have the answer, say "I couldn't verify that detail from official government sources available to me."
      4. Hybrid Search: User database records first. If Live Web Evidence is present, use it for the most current details (eligibility, benefits, process).
      5. Tone: Professional, clear, helpful, and empathetic. Avoid jargon.
      6. Citations: Always mention the scheme name and link to the official URL provided in the context.
      7. Follow-ups: Maintain context of which scheme is being discussed.
      
      CONTEXT:
      ${combinedContext}
    `;

    // Get message history for continuity
    const { data: history } = await supabase
      .from("messages")
      .select("role, content")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: false })
      .limit(10);
    
    const messages = [
      { role: "system", content: systemPrompt },
      ...(history?.reverse().map(m => ({ role: m.role as "user" | "assistant", content: m.content })) || []),
      { role: "user", content: content }
    ];

    try {
      const response = await ai.chat.completions.create({
        // Fallback to gpt-4o-mini if gemini 404s, but using user's requested model
        model: "google/gemini-2.0-flash",
        messages: messages as any,
        temperature: 0.1,
      });

      const aiContent = response.choices[0].message.content || "I apologize, but I am unable to process your request at the moment.";

      // 7. Citations for Metadata
      const citations = [
        ...(schemes?.map(s => ({ type: 'govt', name: s.name, url: s.source_url })) || []),
        ...(docChunks?.map(c => ({ 
          type: 'user_doc', 
          name: c.document_name, 
          page: c.page_number,
          snippet: c.content.substring(0, 100) + "..."
        })) || [])
      ];

      // 8. Save AI response
      const { data: aiMsg, error: aiMsgError } = await supabase
        .from("messages")
        .insert({
          conversation_id: conversationId,
          role: "assistant",
          content: aiContent,
          metadata: { sources: citations }
        })
        .select()
        .single();

      if (aiMsgError) throw new Error("Failed to save AI response");

      // Update conversation timestamp
      await supabase
        .from("conversations")
        .update({ updated_at: new Date().toISOString() })
        .eq("id", conversationId);

      return aiMsg;
    } catch (err: any) {
      console.error("AI Gateway Completion Error details:", err);
      
      // Handle the known 404 entitlement issue
      if (err.status === 404 || err.message?.includes("404")) {
         throw new Error("Citizen Copilot is temporarily unavailable due to a Lovable AI Gateway configuration issue (404). Please ensure 'Lovable AI' is enabled and 'Gemini' or 'OpenAI' models are accessible in your project's Cloud settings.");
      }
      
      throw new Error(`Citizen Copilot error: ${err.message}`);
    }
  });
