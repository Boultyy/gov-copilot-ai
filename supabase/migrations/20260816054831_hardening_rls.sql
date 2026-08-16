-- Hardening RLS for private user data

-- 1. Profiles: Users can read and update their own profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile" ON public.profiles
FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles
FOR UPDATE USING (auth.uid() = id);

-- 2. Conversations: Users can manage their own conversations
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own conversations" ON public.conversations;
CREATE POLICY "Users can manage own conversations" ON public.conversations
FOR ALL TO authenticated USING (auth.uid() = user_id);

-- 3. Messages: Users can manage their own messages
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own messages" ON public.messages;
CREATE POLICY "Users can manage own messages" ON public.messages
FOR ALL TO authenticated USING (auth.uid() = user_id);

-- 4. Documents: Users can manage their own documents
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own documents" ON public.documents;
CREATE POLICY "Users can manage own documents" ON public.documents
FOR ALL TO authenticated USING (auth.uid() = user_id);

-- 5. Document Chunks: Indirect protection via documents table or inherit user_id
ALTER TABLE public.document_chunks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own document chunks" ON public.document_chunks;
CREATE POLICY "Users can view own document chunks" ON public.document_chunks
FOR SELECT TO authenticated 
USING (EXISTS (
  SELECT 1 FROM public.documents 
  WHERE documents.id = document_chunks.document_id 
  AND documents.user_id = auth.uid()
));

-- 6. Applications: Users can manage their own applications
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own applications" ON public.applications;
CREATE POLICY "Users can manage own applications" ON public.applications
FOR ALL TO authenticated USING (auth.uid() = user_id);

-- 7. Policy Analysis: Private comparisons and conflicts
ALTER TABLE public.policy_comparisons ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own policy comparisons" ON public.policy_comparisons;
CREATE POLICY "Users can manage own policy comparisons" ON public.policy_comparisons
FOR ALL TO authenticated USING (auth.uid() = user_id);

ALTER TABLE public.policy_conflicts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own policy conflicts" ON public.policy_conflicts;
CREATE POLICY "Users can view own policy conflicts" ON public.policy_conflicts
FOR SELECT TO authenticated 
USING (EXISTS (
  SELECT 1 FROM public.policy_comparisons 
  WHERE policy_comparisons.id = policy_conflicts.comparison_id 
  AND policy_comparisons.user_id = auth.uid()
));

-- 8. AI Generations: Private history
ALTER TABLE public.ai_generations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own AI generations" ON public.ai_generations;
CREATE POLICY "Users can manage own AI generations" ON public.ai_generations
FOR ALL TO authenticated USING (auth.uid() = user_id);

-- 9. Audit Logs: Strictly for the user themselves to see their history
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own audit logs" ON public.audit_logs;
CREATE POLICY "Users can view own audit logs" ON public.audit_logs
FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- 10. Public Information: Read access for schemes and services
-- We assume these are public/global for all authenticated users
ALTER TABLE public.schemes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow read for authenticated users" ON public.schemes;
CREATE POLICY "Allow read for authenticated users" ON public.schemes
FOR SELECT TO authenticated USING (true);

ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow read for authenticated users" ON public.services;
CREATE POLICY "Allow read for authenticated users" ON public.services
FOR SELECT TO authenticated USING (true);

-- Ensure anon can also read if the application intended it
DROP POLICY IF EXISTS "Allow read for anon" ON public.schemes;
CREATE POLICY "Allow read for anon" ON public.schemes
FOR SELECT TO anon USING (true);

DROP POLICY IF EXISTS "Allow read for anon" ON public.services;
CREATE POLICY "Allow read for anon" ON public.services
FOR SELECT TO anon USING (true);

GRANT SELECT ON public.schemes TO authenticated, anon;
GRANT SELECT ON public.services TO authenticated, anon;
GRANT SELECT ON public.scheme_requirements TO authenticated, anon;
GRANT SELECT ON public.service_steps TO authenticated, anon;
GRANT SELECT ON public.service_requirements TO authenticated, anon;
