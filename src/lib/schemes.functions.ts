import { createServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { z } from "zod";

export const getSchemes = createServerFn({ method: "GET" })
  .inputValidator((data) =>
    z
      .object({
        query: z.string().optional(),
        type: z.enum(["Central", "State"]).optional(),
        category: z.string().optional(),
        state: z.string().optional(),
      })
      .optional()
      .parse(data)
  )
  .handler(async ({ data }) => {
    let queryBuilder = supabase
      .from("schemes")
      .select(`
        *,
        scheme_requirements (*)
      `);

    if (data?.query) {
      queryBuilder = queryBuilder.ilike("name", `%${data.query}%`);
    }

    if (data?.type) {
      queryBuilder = queryBuilder.eq("type", data.type);
    }

    if (data?.category) {
      queryBuilder = queryBuilder.eq("category", data.category);
    }

    if (data?.state) {
      queryBuilder = queryBuilder.eq("state_or_ut", data.state);
    }

    const { data: schemes, error } = await queryBuilder;

    if (error) {
      console.error("Error fetching schemes:", error);
      throw new Error("Failed to fetch schemes");
    }

    return schemes || [];
  });

export const getSchemeById = createServerFn({ method: "GET" })
  .inputValidator((data) => z.string().uuid().parse(data))
  .handler(async ({ data: id }) => {
    const { data: scheme, error } = await supabase
      .from("schemes")
      .select(`
        *,
        scheme_requirements (*)
      `)
      .eq("id", id)
      .single();

    if (error) {
      console.error("Error fetching scheme details:", error);
      throw new Error("Failed to fetch scheme details");
    }

    return scheme;
  });
