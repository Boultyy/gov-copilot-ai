import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

/**
 * Creates a new conversation for the Citizen Copilot.
 */
export const startNewConversation = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: { title?: string; type?: string }) =>
    z.object({ 
      title: z.string().optional(),
      type: z.string().optional()
    }).parse(data)
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    const { data: conversation, error } = await supabase
      .from("conversations")
      .insert({
        user_id: userId,
        title: data.title || "New Conversation",
        type: data.type || "copilot"
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating conversation:", error);
      throw new Error("Failed to create conversation");
    }

    return conversation;
  });

/**
 * Fetches the user's conversation history.
 */
export const getConversations = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;

    const { data, error } = await supabase
      .from("conversations")
      .select("*")
      .eq("user_id", userId)
      .eq("type", "copilot")
      .order("updated_at", { ascending: false });

    if (error) {
      console.error("Error fetching conversations:", error);
      throw new Error("Failed to fetch conversations");
    }

    return data;
  });

/**
 * Fetches messages for a specific conversation.
 */
export const getConversationMessages = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .validator((data: { conversationId: string }) =>
    z.object({ conversationId: z.string().uuid() }).parse(data)
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    // Verify ownership via RLS or explicit check
    const { data: messages, error } = await supabase
      .from("messages")
      .select("*")
      .eq("conversation_id", data.conversationId)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Error fetching messages:", error);
      throw new Error("Failed to fetch messages");
    }

    return messages;
  });

/**
 * The core AI Engine for Citizen Copilot.
 * Grounded in verified government data.
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

    // 2. Retrieve Context (Schemes)
    // We use a simple ILIKE search for now as a baseline for grounding.
    // In a full RAG setup, we'd use vector search.
    const { data: schemes } = await supabaseAdmin
      .from("schemes")
      .select("*")
      .eq("verification_status", "verified")
      .or(`name.ilike.%${content}%,description.ilike.%${content}%,benefits.ilike.%${content}%`)
      .limit(3);

    const contextStr = schemes && schemes.length > 0 
      ? schemes.map(s => `
        Scheme: ${s.name}
        Department: ${s.department}
        Benefits: ${s.benefits}
        Eligibility: ${s.eligibility_summary}
        Source: ${s.official_source} (${s.source_url || 'N/A'})
        Last Verified: ${s.last_verified_at || s.created_at}
      `).join("\n---\n")
      : "No specific government scheme records found matching this query in the verified database.";

    // 3. Call AI Gateway
    const { createAiGateway } = await import("@/lib/ai-gateway.server");
    const ai = createAiGateway();

    const systemPrompt = `
      You are GovCopilot, a professional AI assistant for the Indian Government.
      
      CRITICAL INSTRUCTIONS:
      1. You must ONLY provide authoritative government information if it is present in the provided context.
      2. If the context does not contain the answer, state that the information could not be verified in the official database.
      3. DO NOT invent schemes, eligibility, benefits, URLs, or contacts.
      4. Distinguish between your explanation and official data.
      5. Always cite your sources using the data provided in the context.
      6. If you find matching schemes, return a JSON-like structure in your response that the UI can parse, but also explain it naturally.
      
      CONTEXT FROM VERIFIED DATABASE:
      ${contextStr}
    `;

    // Get last 5 messages for history
    const { data: history } = await supabase
      .from("messages")
      .select("role, content")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: false })
      .limit(5);
    
    const messages = [
      { role: "system", content: systemPrompt },
      ...(history?.reverse().map(m => ({ role: m.role as "user" | "assistant", content: m.content })) || []),
      { role: "user", content: content }
    ];

    const response = await ai.chat.completions.create({
      model: "gpt-4o",
      messages: messages as any,
      temperature: 0.2, // Low temperature for factual accuracy
    });

    const aiContent = response.choices[0].message.content || "I apologize, I encountered an error generating a response.";

    // 4. Save AI response
    const { data: aiMsg, error: aiMsgError } = await supabase
      .from("messages")
      .insert({
        conversation_id: conversationId,
        role: "assistant",
        content: aiContent,
        metadata: {
          sources: schemes?.map(s => ({
            name: s.name,
            source: s.official_source,
            url: s.source_url,
            verified_at: s.last_verified_at
          })) || []
        }
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
