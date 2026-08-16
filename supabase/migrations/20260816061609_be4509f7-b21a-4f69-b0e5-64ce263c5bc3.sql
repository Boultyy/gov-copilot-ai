-- Create scheme_change_history table for tracking modifications
CREATE TABLE IF NOT EXISTS public.scheme_change_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    scheme_id UUID NOT NULL REFERENCES public.schemes(id) ON DELETE CASCADE,
    source_id UUID REFERENCES public.ingestion_sources(id) ON DELETE SET NULL,
    field_name TEXT NOT NULL,
    old_value JSONB,
    new_value JSONB,
    detected_at TIMESTAMPTZ DEFAULT now(),
    source_updated_at TIMESTAMPTZ,
    verification_status TEXT DEFAULT 'pending_verification',
    verified_by UUID REFERENCES auth.users(id),
    verified_at TIMESTAMPTZ
);

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_scheme_change_history_scheme_id ON public.scheme_change_history(scheme_id);
CREATE INDEX IF NOT EXISTS idx_scheme_change_history_detected_at ON public.scheme_change_history(detected_at);

-- RLS
ALTER TABLE public.scheme_change_history ENABLE ROW LEVEL SECURITY;

-- Grants
GRANT ALL ON public.scheme_change_history TO service_role;
GRANT SELECT ON public.scheme_change_history TO authenticated;

-- Policy
DO $$ BEGIN
    CREATE POLICY "Admins can manage change history" ON public.scheme_change_history
        FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- Update ingestion_logs to include more metrics as requested
ALTER TABLE public.ingestion_logs 
ADD COLUMN IF NOT EXISTS records_archived INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS records_requiring_review INTEGER DEFAULT 0;

-- Update ingestion_sources for tracking
ALTER TABLE public.ingestion_sources
ADD COLUMN IF NOT EXISTS last_attempted_sync_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS source_last_updated_at TIMESTAMPTZ;
