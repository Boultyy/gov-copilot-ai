import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

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
