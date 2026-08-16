-- Hardening security definer functions
ALTER FUNCTION public.log_application_status_change() SET search_path = public;

-- Revoke public execute from security definer functions (they are for internal triggers)
REVOKE EXECUTE ON FUNCTION public.log_application_status_change() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.log_application_status_change() FROM anon;
REVOKE EXECUTE ON FUNCTION public.log_application_status_change() FROM authenticated;
GRANT EXECUTE ON FUNCTION public.log_application_status_change() TO service_role;

-- Fix the other existing SECURITY DEFINER functions from previous turns if they were flagged
-- Note: has_role is typically security definer
ALTER FUNCTION public.has_role(uuid, app_role) SET search_path = public;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO service_role;

-- match_document_chunks
ALTER FUNCTION public.match_document_chunks(extensions.vector, float, int, uuid) SET search_path = public;
REVOKE EXECUTE ON FUNCTION public.match_document_chunks(extensions.vector, float, int, uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.match_document_chunks(extensions.vector, float, int, uuid) FROM anon;
GRANT EXECUTE ON FUNCTION public.match_document_chunks(extensions.vector, float, int, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.match_document_chunks(extensions.vector, float, int, uuid) TO service_role;
