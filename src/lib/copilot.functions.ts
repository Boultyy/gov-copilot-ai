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

    // 2. Retrieve Government Context (Schemes)
    const { data: schemes } = await supabaseAdmin
      .from("schemes")
      .select("*")
      .eq("verification_status", "verified")
      .or(`name.ilike.%${content}%,description.ilike.%${content}%,benefits.ilike.%${content}%`)
      .limit(3);

    // 3. Retrieve User Document Context (Vector Search)
    const { searchUserDocuments } = await import("./documents.functions");
    let docChunks: any[] = [];
    try {
      docChunks = await searchUserDocuments({ data: { query: content, limit: 5 } });
    } catch (e: any) {
      console.warn("User document search failed:", e);
      docChunks = [];
    }

    // 4. Build Context
    const schemeContext = schemes && schemes.length > 0 
      ? schemes.map(s => `
        [GOVERNMENT SCHEME]
        Name: ${s.name}
        Benefits: ${s.benefits}
        Eligibility: ${s.eligibility_summary}
        Source: ${s.official_source || 'Official Government Source'}
        URL: ${s.source_url || 'N/A'}
      `).join("\n---\n")
      : "";

    const userDocContext = docChunks && docChunks.length > 0
      ? docChunks.map((c, i) => `
        [USER DOCUMENT SOURCE #${i+1}]
        Document: ${c.document_name}
        Content Snippet: ${c.content}
        Page: ${c.page_number || 'N/A'}
        Section: ${c.metadata?.section_title || 'N/A'}
      `).join("\n---\n")
      : "";

    const combinedContext = `
      Verified Government Information:
      ${schemeContext || "No highly relevant government schemes found for this specific query."}
      
      User's Personal Documents:
      ${userDocContext || "No relevant information found in the user's uploaded documents."}
    `;

    // 5. Call AI Gateway
    const { createAiGateway } = await import("@/lib/ai-gateway.server");
    const ai = createAiGateway();

    const systemPrompt = `
      You are GovCopilot, an official AI assistant for Indian citizens.
      
      Grounded Reasoning Instructions:
      1. Your primary goal is to answer using the provided Verified Government Information and User's Personal Documents.
      2. If the answer is found in User's Personal Documents, explicitly mention the document name.
      3. If the answer is a Government Scheme, use the official name and cite the source.
      4. If the provided context does not contain enough information to answer accurately, politely state that you couldn't find verified information in the database or the user's documents. 
      5. DO NOT invent facts, URLs, or document contents.
      6. Use a professional, helpful, and empathetic tone.
      
      Context Provided:
      ${combinedContext}
    `;

    // Get message history for continuity
    const { data: history } = await supabase
      .from("messages")
      .select("role, content")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: false })
      .limit(6);
    
    const messages = [
      { role: "system", content: systemPrompt },
      ...(history?.reverse().map(m => ({ role: m.role as "user" | "assistant", content: m.content })) || []),
      { role: "user", content: content }
    ];

    try {
      const response = await ai.chat.completions.create({
        model: "gpt-4o",
        messages: messages as any,
        temperature: 0.1,
      });

      const aiContent = response.choices[0].message.content || "I apologize, but I am unable to process your request at the moment.";

      // 6. Citations for Metadata
      const citations = [
        ...(schemes?.map(s => ({ type: 'govt', name: s.name, url: s.source_url })) || []),
        ...(docChunks?.map(c => ({ 
          type: 'user_doc', 
          name: c.document_name, 
          page: c.page_number,
          snippet: c.content.substring(0, 100) + "..."
        })) || [])
      ];

      // 7. Save AI response
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
      
      const isNotFound = err.status === 404 || err.message?.includes("404");
      const errorMessage = isNotFound
        ? "Citizen Copilot is temporarily unavailable due to a Lovable AI Gateway configuration issue (404). Please ensure 'Lovable AI' is enabled and 'Gemini' or 'OpenAI' models are accessible in your project's Cloud settings."
        : `Citizen Copilot error: ${err.message}`;

      throw new Error(errorMessage);
    }
  });
