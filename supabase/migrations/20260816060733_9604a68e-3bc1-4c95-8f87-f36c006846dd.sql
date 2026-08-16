ALTER TABLE public.schemes 
ADD COLUMN IF NOT EXISTS official_name TEXT,
ADD COLUMN IF NOT EXISTS short_name TEXT,
ADD COLUMN IF NOT EXISTS government_level TEXT,
ADD COLUMN IF NOT EXISTS state_ut TEXT,
ADD COLUMN IF NOT EXISTS subcategory TEXT,
ADD COLUMN IF NOT EXISTS benefits TEXT,
ADD COLUMN IF NOT EXISTS eligibility_rules JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS required_documents JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS source_name TEXT,
ADD COLUMN IF NOT EXISTS source_type TEXT,
ADD COLUMN IF NOT EXISTS source_record_id TEXT,
ADD COLUMN IF NOT EXISTS source_last_updated_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS last_verified_at TIMESTAMPTZ DEFAULT now(),
ADD COLUMN IF NOT EXISTS active_status BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS verification_status TEXT DEFAULT 'draft';

-- Constraints
ALTER TABLE public.schemes DROP CONSTRAINT IF EXISTS schemes_government_level_check;
ALTER TABLE public.schemes ADD CONSTRAINT schemes_government_level_check CHECK (government_level IN ('Central', 'State', 'UT', 'Local'));

ALTER TABLE public.schemes DROP CONSTRAINT IF EXISTS schemes_verification_status_check;
ALTER TABLE public.schemes ADD CONSTRAINT schemes_verification_status_check CHECK (verification_status IN ('draft', 'pending_verification', 'verified', 'archived'));

-- Indexes
CREATE INDEX IF NOT EXISTS idx_schemes_official_name ON public.schemes (official_name);
CREATE INDEX IF NOT EXISTS idx_schemes_short_name ON public.schemes (short_name);
CREATE INDEX IF NOT EXISTS idx_schemes_ministry ON public.schemes (ministry);
CREATE INDEX IF NOT EXISTS idx_schemes_state_ut ON public.schemes (state_ut);
CREATE INDEX IF NOT EXISTS idx_schemes_category ON public.schemes (category);
CREATE INDEX IF NOT EXISTS idx_schemes_active_status ON public.schemes (active_status);
CREATE INDEX IF NOT EXISTS idx_schemes_verification_status ON public.schemes (verification_status);

-- Security
ALTER TABLE public.schemes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view verified schemes" ON public.schemes;
CREATE POLICY "Public can view verified schemes"
ON public.schemes FOR SELECT
USING (verification_status = 'verified' AND active_status = true);

DROP POLICY IF EXISTS "Service role has full access to schemes" ON public.schemes;
CREATE POLICY "Service role has full access to schemes"
ON public.schemes FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Data Sync
UPDATE public.schemes SET official_name = name WHERE official_name IS NULL;
UPDATE public.schemes SET verification_status = 'verified' WHERE verification_status = 'draft' OR verification_status IS NULL;
UPDATE public.schemes SET government_level = type WHERE (government_level IS NULL OR government_level = '') AND type IN ('Central', 'State', 'UT', 'Local');

-- Access
GRANT SELECT ON public.schemes TO authenticated;
GRANT SELECT ON public.schemes TO anon;
GRANT ALL ON public.schemes TO service_role;