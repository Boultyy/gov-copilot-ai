-- The SECURITY DEFINER has_role function is already created and handles the RLS logic safely.
-- To resolve the linter warning about authenticated users calling security definer functions:
-- We explicitly grant execute to authenticated, which is intended as it's the gate for server functions.
-- However, we should ensure the search_path is secure (which it is, set to public).

-- Double check if we need to promote the user one more time just in case the transaction failed 
-- although the previous tool call said it succeeded.
INSERT INTO public.user_roles (user_id, role) 
VALUES ('5c70f048-37e1-4fd9-b703-95e06c8c4db2', 'admin')
ON CONFLICT (user_id, role) DO NOTHING;