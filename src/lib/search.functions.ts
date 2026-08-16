import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export const globalSearch = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: { query: string }) => z.object({ query: z.string().min(1) }).parse(data))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { query } = data;

    // 1. Structured Data Search (Schemes, Services, Applications)
    const schemesPromise = supabaseAdmin
      .from("schemes")
      .select("id, name, government_level, state_ut, department, official_source, source_url, last_verified_at")
      .eq("active_status", true)
      .eq("verification_status", "verified")
      .or(`name.ilike.%${query}%,description.ilike.%${query}%`)
      .limit(5);

    const servicesPromise = supabase
      .from("services")
      .select("id, name, department")
      .or(`name.ilike.%${query}%,description.ilike.%${query}%`)
      .limit(5);

    const appsPromise = supabase
      .from("applications")
      .select("id, external_app_id, status, department")
      .eq("user_id", userId)
      .or(`external_app_id.ilike.%${query}%,notes.ilike.%${query}%`)
      .limit(5);

    // 2. Document Semantic Search
    const { searchUserDocuments } = await import("./documents.functions");
    let docResults: any[] = [];
    try {
      docResults = await searchUserDocuments({ data: { query, limit: 5 } });
    } catch (e) {
      console.warn("Global Search: Document vector search failed", e);
    }

    const [
      { data: schemes },
      { data: services },
      { data: apps },
    ] = await Promise.all([schemesPromise, servicesPromise, appsPromise]);

    return {
      schemes: (schemes || []).map((s: any) => ({
        id: s.id as string,
        name: s.name as string,
        government_level: s.government_level as string,
        department: s.department as string,
        last_verified_at: s.last_verified_at as string
      })),
      services: (services || []).map((s: any) => ({
        id: s.id as string,
        name: s.name as string,
        department: s.department as string
      })),
      applications: (apps || []).map((a: any) => ({
        id: a.id as string,
        external_app_id: a.external_app_id as string,
        status: a.status as string,
        department: a.department as string
      })),
      documents: (docResults || []).map((d: any) => ({
        document_name: d.document_name as string,
        content: d.content as string
      })),
    };
  });
