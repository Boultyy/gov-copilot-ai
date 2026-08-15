GRANT DELETE ON public.scheme_chat_messages TO authenticated;

CREATE POLICY "Users can delete their own chat messages"
ON public.scheme_chat_messages FOR DELETE
TO authenticated
USING (auth.uid() = user_id);