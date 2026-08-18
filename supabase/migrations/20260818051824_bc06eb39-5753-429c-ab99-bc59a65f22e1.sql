-- Phase 2: Create Source Registry
DO $$ BEGIN
    CREATE TYPE public.scheme_source_type AS ENUM (
        'official_api',
        'official_dataset',
        'official_csv',
        'official_json',
        'official_feed',
        'manual_official_source'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS public.scheme_sources (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    source_name text NOT NULL,
    source_type public.scheme_source_type NOT NULL,
    organization text,
    government_level text CHECK (government_level IN ('Central', 'State', 'UT')),
    state_ut text,
    base_url text,
    endpoint text,
    dataset_id text,
    authentication_required boolean DEFAULT false,
    configured boolean DEFAULT false,
    enabled boolean DEFAULT false,
    authorized boolean DEFAULT false,
    last_sync_at timestamp with time zone,
    last_success_at timestamp with time zone,
    last_failure_at timestamp with time zone,
    last_error text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.scheme_sources TO authenticated;
GRANT ALL ON public.scheme_sources TO service_role;

ALTER TABLE public.scheme_sources ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    CREATE POLICY "Admins can manage scheme sources"
    ON public.scheme_sources
    FOR ALL
    TO authenticated
    USING (public.has_role(auth.uid(), 'admin'));
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE POLICY "Authenticated users can view scheme sources"
    ON public.scheme_sources
    FOR SELECT
    TO authenticated
    USING (true);
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Phase 3: Create Raw Import Layer
CREATE TABLE IF NOT EXISTS public.scheme_source_records (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    source_id uuid REFERENCES public.scheme_sources(id) ON DELETE CASCADE NOT NULL,
    source_record_id text,
    raw_payload jsonb NOT NULL,
    fetched_at timestamp with time zone DEFAULT now() NOT NULL,
    source_updated_at timestamp with time zone,
    content_hash text,
    processing_status text DEFAULT 'pending' CHECK (processing_status IN ('pending', 'processing', 'completed', 'failed', 'skipped')),
    processing_error text,
    normalized_scheme_id uuid REFERENCES public.schemes(id) ON DELETE SET NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_scheme_source_records_source_id ON public.scheme_source_records(source_id);
CREATE INDEX IF NOT EXISTS idx_scheme_source_records_status ON public.scheme_source_records(processing_status);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.scheme_source_records TO authenticated;
GRANT ALL ON public.scheme_source_records TO service_role;

ALTER TABLE public.scheme_source_records ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    CREATE POLICY "Admins can manage scheme records"
    ON public.scheme_source_records
    FOR ALL
    TO authenticated
    USING (public.has_role(auth.uid(), 'admin'));
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Phase 9: Category Mapping
CREATE TABLE IF NOT EXISTS public.scheme_category_mappings (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    source_id uuid REFERENCES public.scheme_sources(id) ON DELETE CASCADE,
    source_category text NOT NULL,
    mapped_category text NOT NULL,
    is_ambiguous boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    UNIQUE(source_id, source_category)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.scheme_category_mappings TO authenticated;
GRANT ALL ON public.scheme_category_mappings TO service_role;

ALTER TABLE public.scheme_category_mappings ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    CREATE POLICY "Admins can manage category mappings"
    ON public.scheme_category_mappings
    FOR ALL
    TO authenticated
    USING (public.has_role(auth.uid(), 'admin'));
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Phase 14: Sync History
CREATE TABLE IF NOT EXISTS public.scheme_sync_logs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    source_id uuid REFERENCES public.scheme_sources(id) ON DELETE CASCADE NOT NULL,
    started_at timestamp with time zone DEFAULT now() NOT NULL,
    finished_at timestamp with time zone,
    status text NOT NULL,
    records_fetched integer DEFAULT 0,
    records_inserted integer DEFAULT 0,
    records_updated integer DEFAULT 0,
    records_skipped integer DEFAULT 0,
    records_failed integer DEFAULT 0,
    error_message text
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.scheme_sync_logs TO authenticated;
GRANT ALL ON public.scheme_sync_logs TO service_role;

ALTER TABLE public.scheme_sync_logs ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    CREATE POLICY "Admins can view sync logs"
    ON public.scheme_sync_logs
    FOR SELECT
    TO authenticated
    USING (public.has_role(auth.uid(), 'admin'));
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;