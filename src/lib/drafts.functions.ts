import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

/**
 * Generates an AI draft based on user input.
 */
export const generateDraft = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: { type: string; prompt: string; reference?: string; context?: any }) =>
    z.object({
      type: z.string(),
      prompt: z.string().min(5),
      reference: z.string().optional(),
      context: z.any().optional(),
    }).parse(data)
  )
  .handler(async ({ data, context }) => {
    const { userId } = context;
    const { createAiGateway } = await import("@/lib/ai-gateway.server");
    const ai = createAiGateway();

    const systemPrompt = `
      You are GovCopilot, an AI assistant for the Government of India.
      Your task is to generate official drafts (letters, notices, circulars, RTI replies, or citizen applications).
      
      RULES:
      1. Use formal, official Indian government tone and format.
      2. DO NOT invent government rules, legal requirements, official deadlines, or official contacts.
      3. If specific information is not provided, use [Placeholders] like [Reference No.], [Date], [Department Name].
      4. Clearly label that this is an AI-generated draft requiring official review.
      5. Ground your response in the provided instruction and document type.
      
      Document Type: ${data.type}
      Reference Number: ${data.reference || "Not provided"}
    `;

    try {
      const response = await ai.chat.completions.create({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Generate a draft for: ${data.prompt}` }
        ],
        temperature: 0.7,
      });

      const content = response.choices[0].message.content || "Failed to generate content.";

      // 2. Log AI Generation (using types from schema)
      await supabaseAdmin.from("ai_generations").insert({
        user_id: userId,
        generation_type: "draft_generator",
        prompt: data.prompt,
        generated_content: content,
        metadata: {
          type: data.type,
          reference: data.reference,
          model: "google/gemini-2.5-flash"
        }
      });

      return { content };
    } catch (err: any) {
      console.error("AI Generation Error:", err);
      throw new Error(`Failed to generate draft: ${err.message}`);
    }
  });

/**
 * Saves a draft to the database.
 */
export const saveDraft = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: { id?: string; type: string; title: string; content: string; status?: string }) =>
    z.object({
      id: z.string().uuid().optional(),
      type: z.string(),
      title: z.string(),
      content: z.string(),
      status: z.string().optional().default("draft"),
    }).parse(data)
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    if (data.id) {
      const { data: draft, error } = await supabase
        .from("drafts")
        .update({
          type: data.type,
          title: data.title,
          content: data.content,
          status: data.status,
          updated_at: new Date().toISOString(),
        })
        .eq("id", data.id)
        .eq("user_id", userId)
        .select()
        .single();

      if (error) throw new Error(`Failed to update draft: ${error.message}`);
      return draft;
    } else {
      const { data: draft, error } = await supabase
        .from("drafts")
        .insert({
          user_id: userId,
          type: data.type,
          title: data.title,
          content: data.content,
          status: data.status,
        })
        .select()
        .single();

      if (error) throw new Error(`Failed to save draft: ${error.message}`);
      return draft;
    }
  });

/**
 * Fetches user's drafts.
 */
export const getDrafts = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data, error } = await supabase
      .from("drafts")
      .select("*")
      .eq("user_id", userId)
      .order("updated_at", { ascending: false });

    if (error) throw new Error(`Failed to fetch drafts: ${error.message}`);
    return data;
  });

/**
 * Deletes a draft.
 */
export const deleteDraft = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: { id: string }) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { error } = await supabase
      .from("drafts")
      .delete()
      .eq("id", data.id)
      .eq("user_id", userId);

    if (error) throw new Error(`Failed to delete draft: ${error.message}`);
    return { success: true };
  });

