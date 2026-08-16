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
        page: z.number().default(1),
        pageSize: z.number().default(10),
      })
      .optional()
      .parse(data)
  )
  .handler(async ({ data }) => {
    const page = data?.page || 1;
    const pageSize = data?.pageSize || 10;
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let queryBuilder = supabase
      .from("schemes")
      .select(`
        *,
        scheme_requirements (*)
      `, { count: 'exact' });

    queryBuilder = queryBuilder.eq("active_status", true);
    queryBuilder = queryBuilder.eq("verification_status", "verified");

    if (data?.query) {
      queryBuilder = queryBuilder.or(`name.ilike.%${data.query}%,official_name.ilike.%${data.query}%,short_name.ilike.%${data.query}%`);
    }

    if (data?.type) {
      queryBuilder = queryBuilder.eq("government_level", data.type);
    }

    if (data?.category) {
      queryBuilder = queryBuilder.eq("category", data.category);
    }

    if (data?.state) {
      queryBuilder = queryBuilder.eq("state_ut", data.state);
    }

    const { data: schemes, error, count } = await queryBuilder
      .order("created_at", { ascending: false })
      .range(from, to);

    if (error) {
      console.error("Error fetching schemes:", error);
      throw new Error("Failed to fetch schemes");
    }

    return {
      schemes: schemes || [],
      totalCount: count || 0,
      page,
      pageSize,
      hasMore: (count || 0) > to + 1
    };
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
