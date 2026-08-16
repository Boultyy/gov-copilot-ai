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
      docChunks = await searchUserDocuments({ data: { query: content, limit: 3 } });
    } catch (e) {
      console.warn("User document search failed:", e);
    }

    const schemeContext = schemes && schemes.length > 0 
      ? schemes.map(s => `
        [GOVT SCHEME]
        Scheme: ${s.name}
        Benefits: ${s.benefits}
        Eligibility: ${s.eligibility_summary}
        Official Source: ${s.official_source}
      `).join("\n---\n")
      : "";

    const userDocContext = docChunks && docChunks.length > 0
      ? docChunks.map(c => `
        [USER DOCUMENT CHUNK]
        Source Document: ${c.document_name}
        Content: ${c.content}
        Similarity: ${Math.round(c.similarity * 100)}%
      `).join("\n---\n")
      : "";

    const combinedContext = `
      GOVERNMENT SCHEMES CONTEXT:
      ${schemeContext || "No relevant government schemes found."}
      
      USER DOCUMENTS CONTEXT:
      ${userDocContext || "No relevant information found in your uploaded documents."}
    `;

    // 4. Call AI Gateway
    const { createAiGateway } = await import("@/lib/ai-gateway.server");
    const ai = createAiGateway();

    const systemPrompt = `
      You are GovCopilot, a professional AI assistant for the Indian Government.
      
      CRITICAL INSTRUCTIONS:
      1. You must ONLY provide information if it is present in the provided context (Gov Schemes or User Documents).
      2. If neither context contains the answer, state that you couldn't find verified information in the database or your documents.
      3. DO NOT invent facts.
      4. Always cite your sources using [Name of Scheme] or [Document Name].
      5. If answering from user documents, mention the document name clearly.
      
      COMBINED CONTEXT:
      ${combinedContext}
    `;

    // Get last 5 messages for history
    const { data: history } = await supabase
      .from("messages")
      .select("role, content")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: false })
      .limit(5);
    
    const aiMessages = [
      { role: "system", content: systemPrompt },
      ...(history?.reverse().map(m => ({ role: m.role as "user" | "assistant", content: m.content })) || []),
      { role: "user", content: content }
    ];

    const response = await ai.chat.completions.create({
      model: "gpt-4o",
      messages: aiMessages as any,
      temperature: 0.2, 
    }).catch(err => {
      console.error("AI Gateway Full Error Details:", JSON.stringify(err, Object.getOwnPropertyNames(err)));
      throw new Error(`AI Citizen Copilot is temporarily unavailable. Error: ${err.message || 'Unknown error'}`);
    });

    const aiContent = response.choices[0].message.content || "I apologize, I encountered an error.";

    // 5. Prepare citations for metadata
    const citations = [
      ...(schemes?.map(s => ({ type: 'govt', name: s.name, url: s.source_url })) || []),
      ...(docChunks?.map(c => ({ type: 'user_doc', name: c.document_name })) || [])
    ];

    // 6. Save AI response
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
  });
