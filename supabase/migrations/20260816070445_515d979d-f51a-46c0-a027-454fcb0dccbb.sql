-- Create drafts table
CREATE TABLE public.drafts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'draft',
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Grant access
GRANT SELECT, INSERT, UPDATE, DELETE ON public.drafts TO authenticated;
GRANT ALL ON public.drafts TO service_role;

-- Enable RLS
ALTER TABLE public.drafts ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can manage their own drafts"
ON public.drafts FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Create AI generations logging table
CREATE TABLE IF NOT EXISTS public.ai_generations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    feature TEXT NOT NULL,
    prompt TEXT NOT NULL,
    response TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

GRANT SELECT, INSERT ON public.ai_generations TO authenticated;
GRANT ALL ON public.ai_generations TO service_role;

ALTER TABLE public.ai_generations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own generations"
ON public.ai_generations FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own generations"
ON public.ai_generations FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Performance Indexes
CREATE INDEX idx_drafts_user_id ON public.drafts(user_id);
CREATE INDEX idx_drafts_type ON public.drafts(type);
CREATE INDEX idx_ai_generations_user_id ON public.ai_generations(user_id);