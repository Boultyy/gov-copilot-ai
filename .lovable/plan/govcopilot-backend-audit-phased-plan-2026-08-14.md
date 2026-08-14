# GovCopilot Backend Audit & Phased Plan

No project files were changed. This is an audit plus a build order.

## 1. What exists today

The app is a pure frontend MVP on TanStack Start (React 19, Vite, Tailwind v4, shadcn, Recharts). There is no backend, no database, no auth, no file persistence, and no AI calls.

Every module reads from one file: `src/lib/demo-data.ts` (534 lines). Uploads in `src/components/dropzone.tsx` stay in React state only — nothing leaves the browser. "AI" responses are `setTimeout` delays that return a fixed object.

| Module | Real today | Faked today |
| --- | --- | --- |
| Decision Intelligence (`routes/index.tsx`) | Charts, layout, interactions | KPIs, case/grievance series, insights, activity feed |
| Document Intelligence (`routes/documents.tsx`) | Chat UI, citation cards, dropzone | File never uploaded/parsed; single canned answer + citations |
| Workflow Copilot (`routes/workflow.tsx`) | Search filter, checklist state | Service catalogue; checklist progress lost on reload |
| Policy Conflict Checker (`routes/policy.tsx`) | Comparison UI, severity badges | Both documents, conflicts, missing clauses, compliance |
| Draft Generator (`routes/drafts.tsx`) | Form, preview, copy | Output ignores the prompt; download disabled |

## 2. What each module actually needs

**Document Intelligence** — real upload, text extraction per page, chunking, embeddings, vector search, and an LLM answer constrained to retrieved chunks with page-accurate citations. This is the only module that genuinely needs pgvector.

**Policy Conflict Checker** — same ingestion pipeline, then clause-level alignment between two documents and an LLM comparison pass that returns structured JSON (conflict, missing clause, compliance item + severity). Results must be stored as a comparison run, not recomputed on every view.

**Workflow Copilot** — plain CRUD. Service catalogue, steps, documents, checklist templates, plus per-user checklist progress. No AI required; optional semantic search later.

**Draft Generator** — LLM generation from a template + user instruction, plus persistence of generated drafts, reference numbers, and versions. Downloads need a server-rendered DOCX/PDF written to Storage.

**Decision Intelligence** — aggregate reads over the operational tables (cases, grievances, activity), best served by SQL views or RPCs rather than client-side aggregation. AI insights should be a periodically generated, cached row — not a per-page-load LLM call.

## 3. Database entities required

- `profiles`, `user_roles` (+ `app_role` enum, `has_role()` security-definer function) — roles never on the profile row
- `departments`
- `documents`, `document_pages`, `document_chunks` (chunk embedding `vector(1536)`, HNSW index)
- `ingestion_jobs` (status, error, progress)
- `chat_sessions`, `chat_messages`, `message_citations`
- `policy_comparisons`, `policy_findings`
- `services`, `service_steps`, `service_documents`, `service_checklist_items`, `user_checklist_progress`
- `drafts`, `draft_versions`, `draft_templates`
- `cases`, `grievances`, `activity_log`, `ai_insights`
- Aggregate views/RPCs for the dashboard

Every new public table gets explicit GRANTs, RLS enabled, and policies scoped to `auth.uid()` or `has_role()`.

## 4. Auth & authorization

Email/password sign-in, department-scoped access, roles: `admin`, `officer`, `viewer`. Documents, chats, drafts, and comparisons are owner- or department-scoped. Service catalogue and published workflow content are readable by all signed-in users; only `admin` writes them. Nothing public/anon except marketing routes.

## 5. Storage & processing

Two Storage buckets: `documents` (private, path `{user_id}/{document_id}/original.pdf`) and `exports` (private, generated DOCX/PDF). Uploads go direct from browser to Storage with RLS on the bucket; only the metadata row goes through a server function. Parsing, chunking, and embedding run server-side and asynchronously — never in the request that handles the upload.

## 6. Server-side vs client-side

Must stay server-side: all LLM and embedding API keys, embedding generation, vector search, structured policy comparison, draft rendering/export, dashboard aggregates, any admin write. Client may do: direct Storage upload, RLS-scoped reads of its own rows, realtime subscription to job status.

Important constraint for this stack: this is TanStack Start, so app-internal backend logic belongs in `createServerFn` handlers, not Supabase Edge Functions. Edge Functions are only worth adding for the long-running ingestion worker if it exceeds the request budget; otherwise keep everything in server functions and use a job row + polling.

## 7. AI provider

Your ask is to avoid Lovable Cloud AI for core AI. That works: put your own provider key (OpenAI-compatible) in a server secret and call it from server functions. The one place to reconsider is if you don't want to manage a provider account at all for the hackathon — Lovable AI Gateway removes key management and gives the same chat + embeddings surface. Either way the call sites are identical and swappable, so pick one and keep a single `src/lib/ai.server.ts` adapter.

## 8. Phased plan

Each phase is independently shippable and testable.

**Phase 0 — Enable Cloud/Supabase, nothing else.** Confirm client + server env wiring, no tables. Test: app still builds and renders demo data.

**Phase 1 — Auth.** `profiles`, `user_roles`, `has_role()`, trigger on signup, `/auth` route, `_authenticated` layout around the five modules. Test: sign up, sign in, protected route redirect.

**Phase 2 — Workflow Copilot (CRUD only).** Service tables seeded via migration INSERTs from `demo-data.ts`, read through server functions, per-user checklist progress. Test: checklist survives reload; search hits the DB. This proves the whole data path with zero AI risk.

**Phase 3 — Document upload + ingestion.** Storage bucket, `documents`/`ingestion_jobs`, direct upload, server-side text extraction + page splitting, job status in the UI. No AI yet. Test: upload a PDF, see pages extracted and status reach `ready`.

**Phase 4 — Embeddings + RAG chat.** pgvector, `document_chunks`, embedding job, `match_chunks` RPC, ask-question server function returning answer + real citations, chat history persisted. Test: ask a question whose answer only exists in an uploaded file; verify the cited page.

**Phase 5 — Policy Conflict Checker.** Reuse Phase 3/4 ingestion, add `policy_comparisons`/`policy_findings`, structured-output comparison server function, persisted runs. Test: two divergent policies produce stored, re-openable findings.

**Phase 6 — Draft Generator.** `draft_templates`/`drafts`/`draft_versions`, generation server function honouring the prompt, version history, DOCX export to `exports` bucket. Test: two different prompts produce two different drafts; download works.

**Phase 7 — Decision Intelligence on real data.** `cases`, `grievances`, `activity_log`, aggregate views, `ai_insights` generated on a schedule and cached. Test: dashboard numbers change when underlying rows change.

**Phase 8 — Hardening.** Security scan, RLS review per table, rate limits on AI endpoints, error/empty/loading states, remove `demo-data.ts` imports that are no longer referenced.

Ordering rationale: auth first because RLS depends on it, Workflow before Documents because it validates the plumbing cheaply, and Decision Intelligence last because it aggregates data the earlier phases create.
