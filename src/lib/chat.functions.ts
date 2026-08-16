import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const getSchemeChatHistory = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;

    const { data, error } = await supabase
      .from("scheme_chat_messages")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Error fetching chat history:", error);
      throw new Error("Failed to fetch chat history");
    }

    return data;
  });

export const saveSchemeChatMessage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: { role: "user" | "assistant"; content: string }) => 
    z.object({
      role: z.enum(["user", "assistant"]),
      content: z.string().min(1)
    }).parse(data)
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    // Security: Only allow assistant role if we can verify the backend context 
    // For now, since client calls this for mock responses, we allow it but enforce user_id
    const { data: insertedData, error } = await supabase
      .from("scheme_chat_messages")
      .insert({
        user_id: userId,
        role: data.role,
        content: data.content
      })
      .select()
      .single();

    if (error) {
      console.error("Error saving chat message:", error);
      throw new Error("Failed to save chat message");
    }

    return insertedData;
  });


export const deleteSchemeChatMessage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: { id: string }) =>
    z.object({ id: z.string().uuid() }).parse(data)
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    const { error } = await supabase
      .from("scheme_chat_messages")
      .delete()
      .eq("id", data.id)
      .eq("user_id", userId);

    if (error) {
      console.error("Error deleting chat message:", error);
      throw new Error("Failed to delete chat message");
    }

    return { success: true };
  });

export const clearSchemeChatHistory = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;

    const { error } = await supabase
      .from("scheme_chat_messages")
      .delete()
      .eq("user_id", userId);

    if (error) {
      console.error("Error clearing chat history:", error);
      throw new Error("Failed to clear chat history");
    }

    return { success: true };
  });
