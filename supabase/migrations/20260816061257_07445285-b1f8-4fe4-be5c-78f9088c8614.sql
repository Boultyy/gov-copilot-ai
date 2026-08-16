-- Create types for ingestion
DO $$ BEGIN
    CREATE TYPE public.ingestion_source_type AS ENUM (
        'official_api', 
        'official_dataset', 
        'official_csv', 
        'official_json', 
        'authorized_partner_feed', 
        'manual_verified_import'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE public.ingestion_sync_status AS ENUM (
        'success', 
        'failed',
        'pending',
        'processing'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Ingestion Sources Table
CREATE TABLE IF NOT EXISTS public.ingestion_sources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    source_type public.ingestion_source_type NOT NULL,
    base_url TEXT,
    api_endpoint TEXT,
    dataset_identifier TEXT,
    auth_config JSONB DEFAULT '{}'::jsonb,
    refresh_frequency_seconds INTEGER DEFAULT 86400,
    enabled BOOLEAN DEFAULT true,
    last_sync_at TIMESTAMPTZ,
    last_sync_status public.ingestion_sync_status,
    last_sync_error TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Ingestion Logs Table
CREATE TABLE IF NOT EXISTS public.ingestion_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_id UUID REFERENCES public.ingestion_sources(id) ON DELETE CASCADE,
    status public.ingestion_sync_status DEFAULT 'pending',
    records_processed INTEGER DEFAULT 0,
    records_inserted INTEGER DEFAULT 0,
    records_updated INTEGER DEFAULT 0,
    error_log JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Scheme Source Mapping (Provenance)
CREATE TABLE IF NOT EXISTS public.scheme_source_mapping (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    scheme_id UUID REFERENCES public.schemes(id) ON DELETE CASCADE,
    source_id UUID REFERENCES public.ingestion_sources(id) ON DELETE SET NULL,
    external_record_id TEXT,
    raw_data JSONB,
    source_url TEXT,
    last_observed_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(source_id, external_record_id)
);

-- RLS
ALTER TABLE public.ingestion_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ingestion_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scheme_source_mapping ENABLE ROW LEVEL SECURITY;

-- Grants
GRANT ALL ON public.ingestion_sources TO service_role;
GRANT ALL ON public.ingestion_logs TO service_role;
GRANT ALL ON public.scheme_source_mapping TO service_role;

GRANT SELECT ON public.ingestion_sources TO authenticated;
GRANT SELECT ON public.ingestion_logs TO authenticated;
GRANT SELECT ON public.scheme_source_mapping TO authenticated;

-- Policies
DO $$ BEGIN
    CREATE POLICY "Admins can manage ingestion sources" ON public.ingestion_sources
        FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE POLICY "Admins can view ingestion logs" ON public.ingestion_logs
        FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE POLICY "Admins can view mappings" ON public.scheme_source_mapping
        FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- Seed a sample source (Data.gov.in)
INSERT INTO public.ingestion_sources (name, source_type, base_url, api_endpoint, dataset_identifier)
VALUES ('Data.gov.in - Official Portal', 'official_api', 'https://api.data.gov.in', '/resource', 'sample-scheme-dataset-id')
ON CONFLICT DO NOTHING;