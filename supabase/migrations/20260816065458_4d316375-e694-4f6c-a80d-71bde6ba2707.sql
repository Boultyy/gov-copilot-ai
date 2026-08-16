-- Run the migration content just created
ALTER TABLE public.applications 
ADD COLUMN IF NOT EXISTS notes TEXT,
ADD COLUMN IF NOT EXISTS source_reference TEXT,
ADD COLUMN IF NOT EXISTS department TEXT,
ADD COLUMN IF NOT EXISTS application_date DATE DEFAULT CURRENT_DATE,
ADD COLUMN IF NOT EXISTS last_status_change_at TIMESTAMPTZ DEFAULT now(),
ADD COLUMN IF NOT EXISTS official_source_id TEXT,
ADD COLUMN IF NOT EXISTS is_official_status BOOLEAN DEFAULT false;

ALTER TABLE public.applications DROP CONSTRAINT IF EXISTS applications_status_check;
ALTER TABLE public.applications ADD CONSTRAINT applications_status_check 
CHECK (status IN ('draft', 'submitted', 'under_review', 'documents_required', 'approved', 'rejected', 'completed', 'cancelled'));

ALTER TABLE public.application_events 
ADD COLUMN IF NOT EXISTS actor_id UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS notes TEXT,
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

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
      'completed',
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
