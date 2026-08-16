# Plan: AI Citizen Copilot Implementation

Implement a production-ready AI Copilot grounded in verified government data, with session persistence and secure server-side AI processing.

## Architecture

```text
User Input -> Intent Identification -> Context Retrieval (Schemes/Docs) -> Server-side LLM -> Grounded Response
```

## Proposed Changes

### Database & Schema
- No new tables required; will use existing `conversations` and `messages` tables.
- Update RLS policies for `conversations` and `messages` if necessary to ensure strict isolation.

### Server-side Logic (Server Functions)
- **src/lib/copilot.functions.ts**:
    - `startNewConversation`: Create a new conversation record.
    - `getConversations`: Fetch user's conversation list.
    - `getConversationMessages`: Fetch messages for a specific conversation.
    - `sendCopilotMessage`: The core AI engine.
        1.  Validate input and session.
        2.  Identify intent (Scheme search vs. General info).
        3.  Retrieve Context:
            - If scheme-related: Search `public.schemes` (verified only).
            - If doc-related: Search `public.document_chunks` (future-proofing).
        4.  Call AI Gateway: Send prompt with retrieved context.
        5.  Persistence: Save user message and AI response to `messages` table.
        6.  Return structured response with citations.

### UI/UX Refinement
- **src/routes/_authenticated/copilot.tsx**:
    - Integrate with TanStack Query and `copilot.functions.ts`.
    - Implement real loading, error, and empty states.
    - Render citations and sources for scheme-related answers.
    - Support "New Conversation" and conversation history switching.
    - Grounded indicators (e.g., "Official Source Verified").

## Technical Details

- **AI Model**: Use `gpt-4o` via Lovable AI Gateway for high-reasoning grounding.
- **Context Grounding**:
    - Query `schemes` table using text search (and vector search if available, otherwise ILIKE for now).
    - Limit history to last 5-10 messages to manage context window and costs.
- **Security**: All AI calls are server-side; Supabase RLS protects data at the database level.
- **Citations**: AI will be instructed to return citations as metadata, which the UI will render as clickable badges.

## Verification Plan

- **Manual Testing**:
    - Ask about "PM Surya Ghar" (should return grounded info from DB).
    - Ask about a non-existent scheme (should state it can't verify info).
    - Verify conversation history persists across refreshes.
    - Verify one user cannot see another's conversations.
- **Automated Testing**:
    - Verify server function returns structured JSON with `sources` array.
