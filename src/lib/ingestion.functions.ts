import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

// Helper to calculate hash for change detection
const calculateFingerprint = (data: any) => {
  const significantFields = {
    name: data.name,
    official_name: data.official_name,
    description: data.description,
    ministry: data.ministry,
    government_level: data.government_level,
    category: data.category,
    application_url: data.application_url,
    benefits: data.benefits,
    eligibility_rules: data.eligibility_rules,
    required_documents: data.required_documents,
    active_status: data.active_status
  };
  return btoa(JSON.stringify(significantFields));
};

export const triggerSourceSync = createServerFn({ method: "POST" })
  .inputValidator((data) => z.object({ sourceId: z.string().uuid() }).parse(data))
  .handler(async ({ data }) => {
    const { sourceId } = data;

    const { data: source, error: sourceError } = await supabaseAdmin
      .from("ingestion_sources")
      .select("*")
      .eq("id", sourceId)
      .single();

    if (sourceError || !source) throw new Error(`Source not found`);

    // Update attempted sync
    await supabaseAdmin
      .from("ingestion_sources")
      .update({ last_attempted_sync_at: new Date().toISOString() } as any)
      .eq("id", sourceId);

    const { data: log, error: logError } = await supabaseAdmin
      .from("ingestion_logs")
      .insert({ source_id: sourceId, status: "processing" } as any)
      .select()
      .single();

    if (logError || !log) throw new Error(`Log error`);

    try {
      // Mock data representing changes
      const mockExternalData = [
        {
          external_id: "GOI-SCH-101",
          scheme_name: "PM Vishwakarma",
          ministry_name: "Ministry of MSME",
          level: "Central",
          cat: "Livelihood",
          desc: "Updated description to test change detection.",
          url: "https://pmvishwakarma.gov.in/",
          updated_at: new Date().toISOString()
        }
      ];

      let recordsInserted = 0;
      let recordsUpdated = 0;
      let recordsReview = 0;

      for (const item of mockExternalData) {
        const normalized: any = {
          official_name: item.scheme_name,
          name: item.scheme_name,
          description: item.desc,
          ministry: item.ministry_name,
          government_level: item.level,
          category: item.cat,
          application_url: item.url,
          source_name: source.name,
          source_type: source.source_type,
          source_record_id: item.external_id,
          active_status: true,
        };

        // 1. Find existing via mapping or name
        const { data: mapping } = await supabaseAdmin
          .from("scheme_source_mapping")
          .select("scheme_id, raw_data")
          .eq("source_id", sourceId)
          .eq("external_record_id", item.external_id)
          .maybeSingle();

        let schemeId = mapping?.scheme_id;
        
        if (!schemeId) {
          const { data: existing } = await supabaseAdmin
            .from("schemes")
            .select("id")
            .eq("official_name", normalized.official_name)
            .maybeSingle();
          schemeId = existing?.id;
        }

        if (schemeId) {
          // Change Detection Logic
          const { data: current } = await supabaseAdmin
            .from("schemes")
            .select("*")
            .eq("id", schemeId)
            .single();

          const fieldsToTrack = ['description', 'ministry', 'category', 'application_url'];
          let hasChanges = false;

          for (const field of fieldsToTrack) {
            if (current[field] !== normalized[field]) {
              hasChanges = true;
              // Record History
              await supabaseAdmin.from("scheme_change_history").insert({
                scheme_id: schemeId,
                source_id: sourceId,
                field_name: field,
                old_value: current[field] as any,
                new_value: normalized[field] as any,
                source_updated_at: item.updated_at
              } as any);
            }
          }

          if (hasChanges) {
            // Mark for review instead of silent overwrite of verified data
            await supabaseAdmin.from("schemes").update({
              ...normalized,
              verification_status: 'pending_verification'
            } as any).eq("id", schemeId);
            recordsReview++;
            recordsUpdated++;
          }
        } else {
          // New Record
          const { data: inserted } = await supabaseAdmin
            .from("schemes")
            .insert({ ...normalized, verification_status: 'pending_verification' } as any)
            .select()
            .single();
          schemeId = inserted!.id;
          recordsInserted++;
        }

        // Upsert Mapping
        await supabaseAdmin.from("scheme_source_mapping").upsert({
          scheme_id: schemeId,
          source_id: sourceId,
          external_record_id: item.external_id,
          raw_data: item as any,
          source_url: item.url
        } as any, { onConflict: 'source_id,external_record_id' });
      }

      await supabaseAdmin.from("ingestion_logs").update({
        status: "success",
        records_processed: mockExternalData.length,
        records_inserted: recordsInserted,
        records_updated: recordsUpdated,
        records_requiring_review: recordsReview
      } as any).eq("id", log.id);

      await supabaseAdmin.from("ingestion_sources").update({
        last_sync_at: new Date().toISOString(),
        last_sync_status: "success",
        source_last_updated_at: mockExternalData[0]?.updated_at
      } as any).eq("id", sourceId);

      return { success: true };
    } catch (err: any) {
      await supabaseAdmin.from("ingestion_logs").update({ 
        status: "failed", 
        error_log: { message: err.message } as any 
      } as any).eq("id", log.id);
      throw err;
    }
  });

export const getIngestionSources = createServerFn({ method: "GET" })
  .handler(async () => {
    const { data, error } = await supabaseAdmin.from("ingestion_sources").select("*").order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data || [];
  });

