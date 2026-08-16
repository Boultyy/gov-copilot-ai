-- Create Verification Logs table
CREATE TABLE IF NOT EXISTS public.scheme_verification_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    scheme_id UUID NOT NULL REFERENCES public.schemes(id) ON DELETE CASCADE,
    reviewer_id UUID NOT NULL REFERENCES auth.users(id),
    action TEXT NOT NULL, -- 'approve', 'reject', 'archive', 're-verify'
    previous_status TEXT,
    new_status TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexing for performance
CREATE INDEX IF NOT EXISTS idx_verification_logs_scheme ON public.scheme_verification_logs(scheme_id);
CREATE INDEX IF NOT EXISTS idx_verification_logs_reviewer ON public.scheme_verification_logs(reviewer_id);

-- RLS for verification logs
ALTER TABLE public.scheme_verification_logs ENABLE ROW LEVEL SECURITY;

-- Grants
GRANT SELECT, INSERT ON public.scheme_verification_logs TO authenticated;
GRANT ALL ON public.scheme_verification_logs TO service_role;

-- Policies
DROP POLICY IF EXISTS "Admins can view all verification logs" ON public.scheme_verification_logs;
CREATE POLICY "Admins can view all verification logs"
ON public.scheme_verification_logs
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can insert verification logs" ON public.scheme_verification_logs;
CREATE POLICY "Admins can insert verification logs"
ON public.scheme_verification_logs
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));