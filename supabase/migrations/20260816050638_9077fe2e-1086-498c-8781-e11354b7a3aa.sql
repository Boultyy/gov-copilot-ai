-- profiles hardening
DROP POLICY IF EXISTS "Public profiles are viewable by everyone." ON public.profiles;
CREATE POLICY "Users can view own profile." ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);

-- scheme_chat_messages hardening
-- Ensure users can only insert their own messages and only as 'user' role
-- (AI responses currently saved by client, so we allow assistant role for now but enforce user_id)
DROP POLICY IF EXISTS "Users can insert their own chat messages" ON public.scheme_chat_messages;
CREATE POLICY "Users can insert their own chat messages"
ON public.scheme_chat_messages FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);
