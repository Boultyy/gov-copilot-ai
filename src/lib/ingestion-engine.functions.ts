import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";

// Reusable adapter interface
export interface SourceAdapter {
  validateConfiguration(): Promise<{ valid: boolean; error?: string }>;
  testConnection(): Promise<{ success: boolean; error?: string }>;
  fetchRecords(): Promise<any[]>;
  normalizeRecord(raw: any): any;
  validateRecord(normalized: any): boolean;
  calculateContentHash(raw: any): string;
}

/**
 * Data.gov.in Adapter
 * Handles fetching from the Open Government Data (OGD) platform.
 */
class DataGovInAdapter implements SourceAdapter {
  private apiKey: string | undefined;
  private endpoint: string;

  constructor(apiKey: string | undefined, endpoint: string) {
    this.apiKey = apiKey;
    this.endpoint = endpoint;
  }

  async validateConfiguration(): Promise<{ valid: boolean; error?: string }> {
    if (!this.apiKey) {
      return { valid: false, error: "DATA.GOV.IN API KEY REQUIRED" };
    }
    return { valid: true };
  }

  async testConnection(): Promise<{ success: boolean; error?: string }> {
    const config = await this.validateConfiguration();
    if (!config.valid) return { success: false, error: config.error };

    try {
      const url = `https://api.data.gov.in${this.endpoint}?api-key=${this.apiKey}&format=json&limit=1`;
      const response = await fetch(url);
      if (!response.ok) {
        return { success: false, error: `HTTP ${response.status}: ${await response.text()}` };
      }
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }

  async fetchRecords(): Promise<any[]> {
    const config = await this.validateConfiguration();
    if (!config.valid) throw new Error(config.error);

    let allRecords: any[] = [];
    let offset = 0;
    const limit = 100;

    // Fetch initial page to get total
    const url = `https://api.data.gov.in${this.endpoint}?api-key=${this.apiKey}&format=json&limit=${limit}&offset=${offset}`;
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Failed to fetch: ${response.status}`);
    
    const data = await response.json();
    if (data.records) {
      allRecords = allRecords.concat(data.records);
    }

    return allRecords;
  }

  normalizeRecord(raw: any): any {
    // Mapping for Data.gov.in scheme metadata resource
    return {
      name: raw.scheme_name || raw.title,
      department: raw.department || raw.ministry,
      ministry: raw.ministry,
      description: raw.description || raw.objective,
      benefits: raw.benefits,
      government_level: 'Central', // Default for data.gov.in central datasets
      verification_status: 'pending_verification',
      official_url: raw.link || raw.url
    };
  }

  validateRecord(normalized: any): boolean {
    return !!(normalized.name && normalized.department);
  }

  calculateContentHash(raw: any): string {
    return btoa(JSON.stringify(raw)).substring(0, 255);
  }
}

export const syncSource = createServerFn({ method: "POST" })
  .validator((data: { sourceId: string }) => z.object({ sourceId: z.string() }).parse(data))
  .handler(async ({ data }) => {
    const { sourceId } = data;
    
    // 1. Fetch source configuration
    const { data: source, error: sourceError } = await supabase
      .from('scheme_sources')
      .select('*')
      .eq('id', sourceId)
      .single();
      
    if (sourceError || !source) throw new Error("Source not found");

    // 2. Initialize Adapter (using secret if available)
    const apiKey = process.env.DATA_GOV_IN_API_KEY;
    const adapter = new DataGovInAdapter(apiKey, source.endpoint || '');

    // 3. Log start
    const { data: log, error: logError } = await supabase
      .from('scheme_sync_logs')
      .insert({ source_id: sourceId, status: 'processing' })
      .select()
      .single();
      
    if (logError) throw logError;

    try {
      // 4. Test connection
      const connection = await adapter.testConnection();
      if (!connection.success) {
        throw new Error(connection.error);
      }

      // 5. Fetch
      const rawRecords = await adapter.fetchRecords();
      
      let inserted = 0;
      let skipped = 0;
      let rejected = 0;
      let duplicates = 0;

      for (const raw of rawRecords) {
        const hash = adapter.calculateContentHash(raw);
        
        // Check for duplicates in staging
        const { data: existing } = await supabase
          .from('scheme_source_records')
          .select('id')
          .eq('content_hash', hash)
          .eq('source_id', sourceId)
          .maybeSingle();

        if (existing) {
          duplicates++;
          continue;
        }

        // 6. Stage raw record
        const { error: stageError } = await supabase
          .from('scheme_source_records')
          .insert({
            source_id: sourceId,
            raw_payload: raw,
            content_hash: hash,
            processing_status: 'pending'
          });
          
        if (stageError) {
          skipped++;
          continue;
        }
        
        // 7. Auto-import if valid
        const normalized = adapter.normalizeRecord(raw);
        if (adapter.validateRecord(normalized)) {
          const { error: importError } = await supabase
            .from('schemes')
            .insert({
              ...normalized,
              source_id: sourceId,
              source_record_id: hash // Using hash as reference for now
            });
            
          if (importError) {
            // Log import error but continue
            console.error("Import error:", importError);
          } else {
            inserted++;
          }
        } else {
          rejected++;
        }
      }

      // 8. Update log
      await supabase
        .from('scheme_sync_logs')
        .update({
          status: 'completed',
          finished_at: new Date().toISOString(),
          records_fetched: rawRecords.length,
          records_inserted: inserted,
          records_skipped: skipped,
          error_message: `Duplicates: ${duplicates}, Rejected: ${rejected}`
        })
        .eq('id', log.id);

      return { 
        success: true, 
        fetched: rawRecords.length,
        inserted, 
        duplicates,
        rejected 
      };
    } catch (err: any) {
      await supabase
        .from('scheme_sync_logs')
        .update({
          status: 'failed',
          finished_at: new Date().toISOString(),
          error_message: err.message
        })
        .eq('id', log.id);
        
      return { success: false, error: err.message };
    }
  });
