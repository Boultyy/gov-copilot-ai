import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export const comparePolicies = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator(
    z.object({
      policyAId: z.string().uuid(),
      policyBId: z.string().uuid(),
    })
  )
  .handler(async ({ data, context }) => {
    const { userId } = context;
    const { policyAId, policyBId } = data;

    // 1. Validate ownership
    const { data: policies, error: fetchError } = await supabaseAdmin
      .from("policies")
      .select("id, content, title")
      .in("id", [policyAId, policyBId])
      .eq("user_id", userId);

    if (fetchError || policies.length !== 2) {
      throw new Error("Policies not found or unauthorized access.");
    }

    const policyA = policies.find((p) => p.id === policyAId)!;
    const policyB = policies.find((p) => p.id === policyBId)!;

    // 2. AI Analysis via AI Gateway
    const { createAiGateway } = await import("@/lib/ai-gateway.server");
    const ai = createAiGateway();

    const prompt = `Compare these two government policies and identify potential conflicts.
    
    Policy A: ${policyA.title}
    Content: ${policyA.content}
    
    Policy B: ${policyB.title}
    Content: ${policyB.content}
    
    Identify conflicts (e.g., deadlines, eligibility, procedure, definition, authority, missing requirements, ambiguous provisions).
    For each conflict, return structured JSON:
    {
      "conflicts": [
        {
          "clause_title": "...",
          "severity": "high" | "medium" | "low",
          "doc_a_value": "...",
          "doc_b_value": "...",
          "issue": "...",
          "recommendation": "..."
        }
      ],
      "summary": "..."
    }
    Only include conflicts with evidence from the text. Label as "Potential conflict requiring human review."`;

    const response = await ai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");

    // 3. Save to Database
    const { data: comp, error: compError } = await supabaseAdmin
      .from("policy_comparisons")
      .insert({
        user_id: userId,
        policy_a_id: policyAId,
        policy_b_id: policyBId,
        result_summary: result.summary,
      })
      .select()
      .single();

    if (compError) throw new Error("Failed to save comparison");

    if (result.conflicts && result.conflicts.length > 0) {
      await supabaseAdmin.from("policy_conflicts").insert(
        result.conflicts.map((c: any) => ({
          comparison_id: comp.id,
          ...c,
        }))
      );
    }

    return comp;
  });
