INSERT INTO public.user_roles (user_id, role) 
VALUES ('5c70f048-37e1-4fd9-b703-95e06c8c4db2', 'admin')
ON CONFLICT (user_id, role) DO NOTHING;