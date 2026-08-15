-- Create scheme_chat_messages table
CREATE TABLE public.scheme_chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Grant access to authenticated users and service_role
GRANT SELECT, INSERT ON public.scheme_chat_messages TO authenticated;
GRANT ALL ON public.scheme_chat_messages TO service_role;

-- Enable Row Level Security
ALTER TABLE public.scheme_chat_messages ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own chat messages"
ON public.scheme_chat_messages FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own chat messages"
ON public.scheme_chat_messages FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Create index for performance
CREATE INDEX idx_scheme_chat_messages_user_id ON public.scheme_chat_messages(user_id);
CREATE INDEX idx_scheme_chat_messages_created_at ON public.scheme_chat_messages(created_at);