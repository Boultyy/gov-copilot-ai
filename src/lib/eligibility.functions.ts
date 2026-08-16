import { createServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { z } from "zod";

export const evaluateEligibility = createServerFn({ method: "POST" })
  .inputValidator((data) =>
    z
      .object({
        schemeId: z.string().uuid(),
        userData: z.object({
          age: z.number().optional(),
          state: z.string().optional(),
          district: z.string().optional(),
          income: z.number().optional(),
          occupation: z.string().optional(),
          employmentStatus: z.string().optional(),
          studentStatus: z.boolean().optional(),
          farmerStatus: z.boolean().optional(),
          gender: z.string().optional(),
          category: z.string().optional(), // General, OBC, SC, ST
        }),
      })
      .parse(data)
  )
  .handler(async ({ data }) => {
    const { schemeId, userData } = data;

    // 1. Fetch scheme requirements from DB
    const { data: requirements, error } = await supabase
      .from("scheme_requirements")
      .select("*")
      .eq("scheme_id", schemeId);

    if (error) {
      console.error("Error fetching requirements:", error);
      throw new Error("Failed to fetch eligibility rules");
    }

    // 2. Fetch scheme metadata for source/verification info
    const { data: scheme } = await supabase
      .from("schemes")
      .select("name, official_source, last_verified_at, verification_status")
      .eq("id", schemeId)
      .single();

    const results = {
      status: "insufficient_information" as "eligible" | "not_eligible" | "insufficient_information",
      matching: [] as string[],
      unmet: [] as string[],
      missing: [] as string[],
      explanation: "",
      source: scheme?.official_source || "Official Portal",
      verificationDate: scheme?.last_verified_at || new Date().toISOString(),
    };

    if (!requirements || requirements.length === 0) {
      results.explanation = "No specific eligibility criteria found for this scheme in the database.";
      return results;
    }

    // 3. Structured Evaluation Logic
    // We iterate through requirements and compare against userData
    for (const req of requirements) {
      const desc = req.description.toLowerCase();
      
      // Age check
      if (desc.includes("age") || desc.includes("years old")) {
        if (userData.age === undefined) {
          results.missing.push("Age information");
          continue;
        }
        // Basic parser for "above X", "below X", "between X and Y"
        const ageMatch = desc.match(/(\d+)/g);
        if (ageMatch) {
          const limit = parseInt(ageMatch[0]);
          if (desc.includes("above") || desc.includes("greater") || desc.includes("minimum")) {
             if (userData.age >= limit) results.matching.push(req.description);
             else results.unmet.push(req.description);
          } else if (desc.includes("below") || desc.includes("less") || desc.includes("maximum")) {
             if (userData.age <= limit) results.matching.push(req.description);
             else results.unmet.push(req.description);
          } else {
             results.matching.push(req.description + " (Manual verification needed)");
          }
        } else {
           results.missing.push(req.description);
        }
        continue;
      }

      // Income check
      if (desc.includes("income")) {
        if (userData.income === undefined) {
          results.missing.push("Annual household income");
          continue;
        }
        const incomeMatch = desc.match(/(\d+)/g);
        if (incomeMatch) {
          const limit = parseInt(incomeMatch.join("").replace(/,/g, ""));
          if (userData.income <= limit) results.matching.push(req.description);
          else results.unmet.push(req.description);
        } else {
          results.missing.push(req.description);
        }
        continue;
      }

      // State check
      if (desc.includes("resident of") || desc.includes("state")) {
        if (!userData.state) {
          results.missing.push("State of residence");
          continue;
        }
        if (desc.includes(userData.state.toLowerCase())) results.matching.push(req.description);
        else results.unmet.push(req.description);
        continue;
      }

      // Occupation / Farmer status
      if (desc.includes("farmer")) {
        if (userData.farmerStatus === undefined) {
          results.missing.push("Farmer status");
          continue;
        }
        if (userData.farmerStatus) results.matching.push(req.description);
        else results.unmet.push(req.description);
        continue;
      }

      // Default to missing if we can't auto-evaluate
      results.missing.push(req.description);
    }

    // 4. Determine Final Status
    if (results.unmet.length > 0) {
      results.status = "not_eligible";
      results.explanation = "Based on the provided details, you do not meet one or more mandatory criteria for this scheme.";
    } else if (results.missing.length > 0) {
      results.status = "insufficient_information";
      results.explanation = "We need more information to confirm your eligibility for this scheme.";
    } else {
      results.status = "eligible";
      results.explanation = "Congratulations! Based on the structured rules in our database, you appear to be eligible for this scheme.";
    }

    return results;
  });
