---
title: Save Scheme Copilot Chat History
description: Implement persistent chat history for the Scheme Copilot using Supabase tables, RLS, and server functions.
---

## Goals
- Create a database schema to store chat sessions and messages for the Scheme Copilot.
- Ensure chat history is private to the authenticated user.
- Load existing chat history when the user opens the application.
- Save new messages in real-time to the database.

## Technical Details

### Database Schema
We will add two new tables to the `public` schema:
- `scheme_chat_sessions`: To track unique chat threads (optional, but good for organization).
- `scheme_chat_messages`: To store individual messages.

```sql
CREATE TABLE public.scheme_chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

GRANT SELECT, INSERT ON public.scheme_chat_messages TO authenticated;
GRANT ALL ON public.scheme_chat_messages TO service_role;

ALTER TABLE public.scheme_chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own chat messages"
ON public.scheme_chat_messages FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own chat messages"
ON public.scheme_chat_messages FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);
```

### Server Functions
We will create `src/lib/chat.functions.ts` to handle:
- `getChatHistory`: Fetch all messages for the current user.
- `saveChatMessage`: Save a new message to the database.

### Frontend Integration
Update `src/components/chat/floating-chat.tsx`:
- Use `useQuery` to fetch history on mount.
- Use `useMutation` or direct `useServerFn` calls to save messages.
- Add a loading state for when history is being fetched.
- Ensure it only attempts to save/load if a user is authenticated.

## Implementation Plan
1. **Migration**: Create the `scheme_chat_messages` table with RLS.
2. **Server Functions**: Implement `getChatHistory` and `saveChatMessage` using `createServerFn`.
3. **Frontend**: Wire up the server functions to the `FloatingChat` component.
