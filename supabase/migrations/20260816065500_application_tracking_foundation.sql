-- 1. Enhance Applications Table
ALTER TABLE public.applications 
ADD COLUMN IF NOT EXISTS notes TEXT,
ADD COLUMN IF NOT EXISTS source_reference TEXT,
ADD COLUMN IF NOT EXISTS department TEXT,
ADD COLUMN IF NOT EXISTS application_date DATE DEFAULT CURRENT_DATE,
ADD COLUMN IF NOT EXISTS last_status_change_at TIMESTAMPTZ DEFAULT now(),
ADD COLUMN IF NOT EXISTS official_source_id TEXT, -- For later integration with official APIs
ADD COLUMN IF NOT EXISTS is_official_status BOOLEAN DEFAULT false;

-- Update status constraint
ALTER TABLE public.applications DROP CONSTRAINT IF EXISTS applications_status_check;
ALTER TABLE public.applications ADD CONSTRAINT applications_status_check 
CHECK (status IN ('draft', 'submitted', 'under_review', 'documents_required', 'approved', 'rejected', 'completed', 'cancelled'));

-- 2. Enhance Application Events
ALTER TABLE public.application_events 
ADD COLUMN IF NOT EXISTS actor_id UUID REFERENCES auth.users(id), -- who made the change
ADD COLUMN IF NOT EXISTS notes TEXT,
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

-- 3. Security Hardening
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.application_events ENABLE ROW LEVEL SECURITY;

-- Explicitly ensure user isolation
DROP POLICY IF EXISTS "Users can manage their own applications" ON public.applications;
CREATE POLICY "Users can manage their own applications"
ON public.applications FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage their own app events" ON public.application_events;
CREATE POLICY "Users can manage their own app events"
ON public.application_events FOR ALL
TO authenticated
USING (EXISTS (SELECT 1 FROM public.applications WHERE id = application_id AND user_id = auth.uid()))
WITH CHECK (EXISTS (SELECT 1 FROM public.applications WHERE id = application_id AND user_id = auth.uid()));

-- 4. Automatic status history trigger
CREATE OR REPLACE FUNCTION public.log_application_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'INSERT') OR (OLD.status IS DISTINCT FROM NEW.status) THEN
    INSERT INTO public.application_events (
      application_id,
      stage,
      status,
      description,
      notes,
      created_at
    ) VALUES (
      NEW.id,
      NEW.status,
      'completed', -- 'completed' in events means it has happened
      'Application status updated to ' || NEW.status,
      NEW.notes,
      now()
    );
    NEW.last_status_change_at = now();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS tr_log_application_status_change ON public.applications;
CREATE TRIGGER tr_log_application_status_change
BEFORE INSERT OR UPDATE OF status ON public.applications
FOR EACH ROW EXECUTE FUNCTION public.log_application_status_change();

-- 5. Grants
GRANT ALL ON public.applications TO authenticated;
GRANT ALL ON public.application_events TO authenticated;
GRANT ALL ON public.applications TO service_role;
GRANT ALL ON public.application_events TO service_role;
