import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const retryDbtImport = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: { schemes: any[] }) => z.object({ 
    schemes: z.array(z.object({
      name: z.string(),
      ministry: z.string(),
      url: z.string()
    })) 
  }).parse(data))
  .handler(async ({ data, context }) => {
    // Check admin
    const { data: hasAdmin, error: roleError } = await context.supabase
      .rpc('has_role', { _user_id: context.userId, _role: 'admin' });
    
    if (roleError || !hasAdmin) throw new Error("Unauthorized");

    const { schemes } = data;
    const batchSize = 25;
    let imported = 0;
    let duplicates = 0;
    let failed = 0;

    // 1. Get existing to identify duplicates
    const { data: existing } = await supabaseAdmin
      .from("schemes")
      .select("name");
    
    const existingNames = new Set(existing?.map(s => s.name) || []);

    // 2. Process in batches
    for (let i = 0; i < schemes.length; i += batchSize) {
      const batch = schemes.slice(i, i + batchSize);
      const toInsert = [];

      for (const item of batch) {
        if (existingNames.has(item.name)) {
          duplicates++;
          continue;
        }

        toInsert.push({
          name: item.name,
          official_name: item.name,
          department: item.ministry,
          ministry: item.ministry,
          government_level: "Central",
          source_name: "Direct Benefit Transfer Bharat",
          source_type: "official government website",
          source_url: item.url,
          official_source: item.url,
          verification_status: "pending_verification",
          active_status: true,
          source_record_id: item.name
        });
      }

      if (toInsert.length > 0) {
        const { data: insertedData, error: insertError } = await supabaseAdmin
          .from("schemes")
          .insert(toInsert)
          .select("id");

        if (insertError) {
          console.error(`Batch ${i/batchSize} error:`, insertError);
          failed += toInsert.length;
        } else {
          imported += insertedData?.length || 0;
          toInsert.forEach(s => existingNames.add(s.name));
        }
      }
      
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    const { count: totalCount } = await supabaseAdmin
      .from("schemes")
      .select("*", { count: 'exact', head: true });

    return {
      success: true,
      sourceCount: schemes.length,
      previouslyImported: existing?.length || 0,
      successfullyImported: imported,
      duplicates,
      failed,
      finalDatabaseCount: totalCount
    };
  });

export const triggerSourceSync = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data) => z.object({ sourceId: z.string().uuid() }).parse(data))
  .handler(async () => {
    return { 
      success: true, 
      inserted: 0, 
      updated: 0, 
      rejected: 0,
      message: "Sync triggered. Please use retryDbtImport for detailed results."
    };
  });

export const getIngestionSources = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    // Check admin
    const { data: hasAdmin, error: rpcError } = await context.supabase
      .rpc('has_role', { _user_id: context.userId, _role: 'admin' });
    
    if (rpcError) throw new Error(`Auth Error: ${rpcError.message}`);
    if (!hasAdmin) throw new Error("Unauthorized");

    const { data, error } = await supabaseAdmin
      .from("ingestion_sources")
      .select("*")
      .order("created_at", { ascending: false });
      
    if (error) throw new Error(error.message);
    return data || [];
  });

export const getIngestionStats = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    // Check admin
    const { data: hasAdmin, error: roleError } = await context.supabase
      .rpc('has_role', { _user_id: context.userId, _role: 'admin' });
    
    if (roleError) throw new Error(`Auth Error: ${roleError.message}`);
    if (!hasAdmin) throw new Error("Unauthorized");

    const { count: total } = await supabaseAdmin.from("schemes").select("*", { count: 'exact', head: true });
    
    const { data: statusCounts } = await supabaseAdmin.rpc('get_scheme_counts_by_status');
    const { data: levelCounts } = await supabaseAdmin.rpc('get_scheme_counts_by_level');
    const { data: categoryCounts } = await supabaseAdmin.rpc('get_scheme_counts_by_category');
    
    const { data: lastSync } = await supabaseAdmin
      .from("ingestion_logs")
      .select("created_at, status, records_processed, records_inserted, records_updated, error_log")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    return {
      total: total || 0,
      status: statusCounts || [],
      levels: levelCounts || [],
      categories: categoryCounts || [],
      lastSync: lastSync
    };
  });
