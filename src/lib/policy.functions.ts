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

    // 1. Fetch policies
    const { data: policyA, error: errA } = await supabaseAdmin
      .from("documents")
      .select("id, name, status")
      .eq("id", policyAId)
      .eq("user_id", userId)
      .single();

    const { data: policyB, error: errB } = await supabaseAdmin
      .from("documents")
      .select("id, name, status")
      .eq("id", policyBId)
      .eq("user_id", userId)
      .single();

    if (errA || errB || !policyA || !policyB) {
      throw new Error("Policies not found or unauthorized access.");
    }

    // 2. Retrieve chunks for context
    const { data: chunksA } = await supabaseAdmin
      .from("document_chunks")
      .select("content, page_number")
      .eq("document_id", policyAId)
      .limit(10); // Representative sample for logic

    const { data: chunksB } = await supabaseAdmin
      .from("document_chunks")
      .select("content, page_number")
      .eq("document_id", policyBId)
      .limit(10);

    // 3. AI Analysis via AI Gateway
    const { createAiGateway } = await import("@/lib/ai-gateway.server");
    const ai = createAiGateway();

    const contentA = chunksA?.map(c => c.content).join("\n") || "";
    const contentB = chunksB?.map(c => c.content).join("\n") || "";

    const prompt = `Compare these two government policies and identify potential conflicts.
    
    Policy A: ${policyA.name}
    Content Excerpt: ${contentA}
    
    Policy B: ${policyB.name}
    Content Excerpt: ${contentB}
    
    Identify conflicts: contradictory deadline, contradictory eligibility, conflicting procedure, conflicting definition, conflicting authority, missing requirement, ambiguous provision.
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

    // 4. Save to Database
    const { data: comp, error: compError } = await supabaseAdmin
      .from("policy_comparisons")
      .insert({
        user_id: userId,
        // Using existing columns, but note: the migration used 'policies' table FKs.
        // If 'policies' table isn't populated yet, we might need a shim or migration update.
        // For now, assume the user is comparing 'documents'.
        result_summary: result.summary,
      })
      .select()
      .single();

    if (compError) throw new Error("Failed to save comparison");

    if (result.conflicts && result.conflicts.length > 0) {
      await supabaseAdmin.from("policy_conflicts").insert(
        result.conflicts.map((c: any) => ({
          comparison_id: comp.id,
          clause_title: c.clause_title,
          severity: c.severity,
          doc_a_value: c.doc_a_value,
          doc_b_value: c.doc_b_value,
          issue: c.issue,
          recommendation: c.recommendation
        }))
      );
    }


    return comp;
  });

export const getPolicyComparisons = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { userId, supabase } = context;
    const { data, error } = await supabase
      .from("policy_comparisons")
      .select(`
        *,
        policy_conflicts (*)
      `)
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) throw new Error("Failed to fetch comparisons");
    return data;
  });

