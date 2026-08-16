import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

// Define the normalization logic for scheme data
const SchemeSchema = z.object({
  name: z.string(),
  official_name: z.string().optional(),
  short_name: z.string().optional(),
  description: z.string(),
  ministry: z.string(),
  department: z.string().optional(),
  government_level: z.enum(['Central', 'State', 'UT', 'Local']),
  state_ut: z.string().optional(),
  category: z.string(),
  subcategory: z.string().optional(),
  benefits: z.string().optional(),
  eligibility_rules: z.any().optional(),
  required_documents: z.any().optional(),
  application_url: z.string().url().optional(),
  source_name: z.string(),
  source_type: z.string(),
  source_record_id: z.string(),
});

/**
 * Triggers a manual sync for a specific government data source.
 * This runs entirely on the server to protect API credentials and perform secure fetching.
 */
export const triggerSourceSync = createServerFn({ method: "POST" })
  .inputValidator((data) => z.object({ sourceId: z.string().uuid() }).parse(data))
  .handler(async ({ data }) => {
    const { sourceId } = data;

    // 1. Fetch source configuration
    const { data: source, error: sourceError } = await supabaseAdmin
      .from("ingestion_sources")
      .select("*")
      .eq("id", sourceId)
      .single();

    if (sourceError || !source) {
      throw new Error(`Source not found: ${sourceError?.message}`);
    }

    // 2. Initialize log
    const { data: log, error: logError } = await supabaseAdmin
      .from("ingestion_logs")
      .insert({ source_id: sourceId, status: "processing" })
      .select()
      .single();

    if (logError || !log) {
      throw new Error(`Failed to create sync log: ${logError?.message}`);
    }

    try {
      // 3. Perform Fetch (Mocking external GoI API call for now)
      // In a real scenario, this would use fetch(source.base_url + source.api_endpoint)
      // and handle source-specific auth from source.auth_config
      console.log(`Fetching from ${source.name}...`);
      
      // Simulate successful fetch of 2 records
      const mockExternalData = [
        {
          external_id: "GOI-SCH-101",
          scheme_name: "PM Vishwakarma",
          ministry_name: "Ministry of MSME",
          level: "Central",
          cat: "Livelihood",
          desc: "A Central Sector Scheme to provide end-to-end support to artisans and craftspeople.",
          url: "https://pmvishwakarma.gov.in/"
        },
        {
          external_id: "GOI-SCH-102",
          scheme_name: "Lakhpati Didi",
          ministry_name: "Ministry of Rural Development",
          level: "Central",
          cat: "Women Empowerment",
          desc: "Targeting women in SHGs to earn a sustainable income of at least Rs 1 Lakh per annum.",
          url: "https://daynrlm.gov.in/"
        }
      ];

      let recordsInserted = 0;
      let recordsUpdated = 0;

      // 4. Process & Normalize
      for (const item of mockExternalData) {
        const normalized: any = {
          name: item.scheme_name,
          official_name: item.scheme_name,
          description: item.desc,
          ministry: item.ministry_name,
          government_level: item.level,
          category: item.cat,
          application_url: item.url,
          source_name: source.name,
          source_type: source.source_type,
          source_record_id: item.external_id,
          verification_status: "pending_verification",
          active_status: true,
        };

        // 5. Upsert Scheme (Deduplication Logic)
        const { data: existingScheme } = await supabaseAdmin
          .from("schemes")
          .select("id")
          .eq("official_name", normalized.official_name)
          .maybeSingle();

        let schemeId: string;

        if (existingScheme) {
          const { data: updated } = await supabaseAdmin
            .from("schemes")
            .update(normalized)
            .eq("id", existingScheme.id)
            .select()
            .single();
          schemeId = updated!.id;
          recordsUpdated++;
        } else {
          const { data: inserted } = await supabaseAdmin
            .from("schemes")
            .insert(normalized)
            .select()
            .single();
          schemeId = inserted!.id;
          recordsInserted++;
        }

        // 6. Record Provenance
        await supabaseAdmin
          .from("scheme_source_mapping")
          .upsert({
            scheme_id: schemeId,
            source_id: sourceId,
            external_record_id: item.external_id,
            raw_data: item as any,
            source_url: item.url,
          } as any, { onConflict: 'source_id,external_record_id' });
      }

      // 7. Finalize Log
      await supabaseAdmin
        .from("ingestion_logs")
        .update({
          status: "success",
          records_processed: mockExternalData.length,
          records_inserted: recordsInserted,
          records_updated: recordsUpdated
        } as any)
        .eq("id", log.id);

      await supabaseAdmin
        .from("ingestion_sources")
        .update({
          last_sync_at: new Date().toISOString(),
          last_sync_status: "success"
        })
        .eq("id", sourceId);

      return { success: true, processed: mockExternalData.length };
    } catch (err: any) {
      await supabaseAdmin
        .from("ingestion_logs")
        .update({ status: "failed", last_sync_error: err.message })
        .eq("id", log.id);
      
      throw err;
    }
  });

/**
 * Fetches configured ingestion sources.
 */
export const getIngestionSources = createServerFn({ method: "GET" })
  .handler(async () => {
    const { data, error } = await supabaseAdmin
      .from("ingestion_sources")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw new Error(error.message);
    return data || [];
  });
