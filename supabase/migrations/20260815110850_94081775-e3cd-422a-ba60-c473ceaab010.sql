-- Revoke default public execution for security definer functions
revoke execute on function public.has_role(uuid, app_role) from public;
revoke execute on function public.has_role(uuid, app_role) from anon;
revoke execute on function public.has_role(uuid, app_role) from authenticated;

revoke execute on function public.handle_new_user() from public;
revoke execute on function public.handle_new_user() from anon;
revoke execute on function public.handle_new_user() from authenticated;

-- Grant execution only to service_role (and authenticated for has_role if needed, 
-- but RLS uses it via security definer owner, so public/auth usually don't need direct execute)
grant execute on function public.has_role(uuid, app_role) to service_role;
grant execute on function public.handle_new_user() to service_role;
