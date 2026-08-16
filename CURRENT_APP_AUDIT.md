# Current App Audit: GovCopilot AI

This audit was conducted to assess the current implementation of GovCopilot AI to identify gaps between the current MVP and a production-ready system.

## Product Area Audit

### 1. Dashboard (Landing)
- **Current Route:** `/`
- **Components:** `LandingDashboard` (inline in route file), `Card`, `Button`, `Badge`.
- **Data Sources:** Hardcoded array `featuredServices` and inline arrays for features/how-it-works.
- **Status:** **Purely Static UI**. No real metrics or dynamic data.

### 2. Copilot (AI Assistant Workspace)
- **Current Route:** `/_authenticated/copilot`
- **Components:** `Copilot` (inline), `Card`, `Badge`, `Input`.
- **Data Sources:** Hardcoded `suggestedPrompts`.
- **Simulated AI Behavior:** Uses `setTimeout` with a hardcoded response containing a PM Surya Ghar recommendation.
- **State Management:** Local `useState` for messages and input.
- **Status:** **Simulated**. No real LLM integration.

### 3. Schemes (Scheme Discovery)
- **Current Route:** `/_authenticated/schemes`
- **Components:** `Schemes` (inline), `Card`, `Badge`, `Input`.
- **Data Sources:** `mockSchemes` (inline).
- **Hardcoded Data:** List of 4 schemes (PM Surya Ghar, Ayushman Bharat, Lakhpati Didi, State Housing).
- **Status:** **Simulated UI**. Search and filters are local-only filters on the mock array.

### 4. Eligibility (Eligibility Check)
- **Current Route:** `/_authenticated/eligibility`
- **Components:** Eligibility wizard.
- **Status:** **Simulated UI**. (Based on UI review, it uses a multi-step form with mock results).

### 5. Documents (AI Document Intelligence)
- **Current Route:** `/_authenticated/documents`
- **Components:** `Dropzone`, `Card`, `Textarea`.
- **Data Sources:** `demoDocuments`, `documentQA`, `suggestedDocQuestions` from `src/lib/demo-data.ts`.
- **Simulated AI Behavior:** Uses `setTimeout` to return a hardcoded response with static citations from `documentQA.default`.
- **Forms/Inputs:** Drag-and-drop file upload (local state only), textarea for questions.
- **Status:** **Simulated**. No RAG, no document parsing, no vector search.

### 6. Applications (Application Tracker)
- **Current Route:** `/_authenticated/applications`
- **Components:** `Applications` (inline), `Card`, `Badge`, `Timeline`.
- **Data Sources:** `myApplications` (inline).
- **Hardcoded Data:** A single application for "PM Surya Ghar" (ID: APP-8829-X).
- **Status:** **Simulated UI**. No real application database.

### 7. Policy Checker
- **Current Route:** `/_authenticated/policy`
- **Components:** Conflict table, compliance checklist.
- **Data Sources:** `conflicts`, `missingClauses`, `complianceChecks` from `src/lib/demo-data.ts`.
- **Status:** **Simulated**. Compares static objects instead of uploaded documents.

### 8. Draft Generator
- **Current Route:** `/_authenticated/drafts`
- **Components:** Draft type selector, prompt input.
- **Data Sources:** `draftTypes` from `src/lib/demo-data.ts`.
- **Simulated AI Behavior:** Returns the `sample` text associated with the selected `draftType`.
- **Status:** **Simulated**. No real generation logic.

### 9. Search (Global Search)
- **Status:** **Partially implemented**. Search bars exist in Schemes/Workflow but are local filters. No global cross-module search.

### 10. Profile & Settings
- **Status:** **Foundation only**. Migration exists for `profiles` and `user_roles`. Auth page exists at `/auth`.

---

## Technical Audit

### 1. Existing Backend/API Calls
- **Database:** Supabase/PostgreSQL foundation is present.
- **Tables:** `profiles`, `user_roles`, `scheme_chat_messages`.
- **Server Functions:** `src/lib/chat.functions.ts` handles saving/loading "Scheme Copilot" messages.
- **Floating Chat:** `src/components/chat/floating-chat.tsx` is the **only component with real persistence** using `createServerFn`.

### 2. Missing Backend Functionality
- **RAG System:** No vector store (pgvector) or embedding logic.
- **Document Processing:** No backend file parsing or storage integration beyond RLS foundation.
- **Service Database:** All schemes/services are in `demo-data.ts`.
- **Workflow Engine:** Procedure tracking and checklist state are not persisted.
- **AI Integration:** No real-time LLM calls (OpenAI/Anthropic/Lovable AI Gateway).

### 3. Existing Dependencies
- **Framework:** TanStack Start v1 (React 19).
- **UI:** Tailwind CSS v4, Lucide React, Shadcn UI (Radix).
- **Data Fetching:** TanStack Query.
- **Database/Auth:** Supabase.
- **Charts:** Recharts.

### 4. Security Concerns
- **Auth Gates:** `_authenticated.tsx` layout is used, which is good.
- **RLS:** Basic RLS enabled on profiles and chat messages.
- **Input Validation:** Zod is used in `chat.functions.ts`, which is good.
