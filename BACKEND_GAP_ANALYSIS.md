# Backend Gap Analysis: GovCopilot AI

This document maps every current feature from its mock implementation to the requirements of a production-ready full-stack system.

## 1. AI Document Intelligence
- **CURRENT IMPLEMENTATION:** Returns a single hardcoded response (`documentQA.default`) with static citations after a `setTimeout`.
- **WHAT A REAL BACKEND REQUIRES:** A RAG (Retrieval-Augmented Generation) pipeline.
- **WHAT DATABASE DATA IS REQUIRED:** 
    - `documents` table (metadata, storage path, status).
    - `document_chunks` table (text content, metadata).
    - `document_embeddings` (vector column using `pgvector`).
- **WHAT SERVER-SIDE LOGIC IS REQUIRED:**
    - PDF/Docx parser (server-side).
    - Text chunking and embedding generation.
    - Vector similarity search.
- **WHAT AI IS REQUIRED:** Embedding model (e.g., text-embedding-3-small) and LLM (e.g., GPT-4o) for synthesis.
- **WHAT SECURITY IS REQUIRED:** RLS on documents and chunks to ensure users only query their own files.

## 2. Workflow Copilot
- **CURRENT IMPLEMENTATION:** Maps query to a static `services` array in `demo-data.ts`. Checklist state is local `useState`.
- **WHAT A REAL BACKEND REQUIRES:** A searchable service directory and persistence for user progress.
- **WHAT DATABASE DATA IS REQUIRED:**
    - `services` table (department, name, fee, timeline).
    - `service_steps` table (ordered steps for each service).
    - `user_service_progress` table (checklist state, current step, user_id).
- **WHAT SERVER-SIDE LOGIC IS REQUIRED:** CRUD for services (admin) and progress updates (user).
- **WHAT AI IS REQUIRED:** Semantic search to map citizen queries to technical service names.
- **WHAT SECURITY IS REQUIRED:** Write access restricted to the user's own progress rows.

## 3. Scheme Discovery & Eligibility
- **CURRENT IMPLEMENTATION:** Local filtering on `mockSchemes`. Eligibility is a mock multi-step form.
- **WHAT A REAL BACKEND REQUIRES:** Centralized scheme database and an eligibility rules engine.
- **WHAT DATABASE DATA IS REQUIRED:**
    - `schemes` table (criteria, benefits, provider).
    - `eligibility_rules` (JSONB field or related table defining logic).
- **WHAT SERVER-SIDE LOGIC IS REQUIRED:** A function to evaluate user profile data against scheme criteria.
- **WHAT AI IS REQUIRED:** Assistant to explain *why* a user is or isn't eligible.
- **WHAT SECURITY IS REQUIRED:** Public read for schemes; private evaluation for users.

## 4. Policy Conflict Checker
- **CURRENT IMPLEMENTATION:** Displays static `conflicts` between two hardcoded names.
- **WHAT A REAL BACKEND REQUIRES:** Document comparison engine.
- **WHAT DATABASE DATA IS REQUIRED:** `policy_comparisons` table (history of runs, results).
- **WHAT SERVER-SIDE LOGIC IS REQUIRED:** Extraction of clauses from two different files and comparison logic.
- **WHAT AI IS REQUIRED:** High-reasoning LLM to identify semantic contradictions between legal/policy texts.
- **WHAT SECURITY IS REQUIRED:** PII scrubbing before sending to AI providers.

## 5. Decision Intelligence Dashboard
- **CURRENT IMPLEMENTATION:** Static Recharts components using `casesByMonth` and `kpis` mock data.
- **WHAT A REAL BACKEND REQUIRES:** Real-time analytics aggregation.
- **WHAT DATABASE DATA IS REQUIRED:** Views or materialized views aggregating data from `applications`, `grievances`, and `audit_logs`.
- **WHAT SERVER-SIDE LOGIC IS REQUIRED:** Analytics functions with date range filtering.
- **WHAT AI IS REQUIRED:** Automated insight generation (anomaly detection in grievance counts).
- **WHAT SECURITY IS REQUIRED:** Role-based access (RBAC) – only admins/moderators should see aggregate stats.

## 6. AI Draft Generator
- **CURRENT IMPLEMENTATION:** Returns static `sample` text from a list.
- **WHAT A REAL BACKEND REQUIRES:** Dynamic template generation.
- **WHAT DATABASE DATA IS REQUIRED:** `ai_generations` table to store history and `draft_templates` for standard government formats.
- **WHAT SERVER-SIDE LOGIC IS REQUIRED:** Context assembly (prompt + user data + template).
- **WHAT AI IS REQUIRED:** LLM fine-tuned or prompted for official government tone (Indian English/Regional languages).
- **WHAT SECURITY IS REQUIRED:** Audit logging for every generated official document.

---

## Recommended Implementation Order

1.  **Phase 2: Data Foundation** (Schemes, Services, Procedures)
    - Move all `demo-data.ts` objects into PostgreSQL tables.
    - Implement `createServerFn` to fetch these from the DB instead of importing the file.

2.  **Phase 3: RAG Infrastructure**
    - Enable `pgvector`.
    - Set up `storage` buckets for document uploads.
    - Implement document parsing and embedding server functions.

3.  **Phase 4: Real Copilot Integration**
    - Replace mock `setTimeout` in `copilot.tsx` and `documents.tsx` with real LLM calls via AI Gateway.
    - Connect the vector search to the document chat.

4.  **Phase 5: User State & Workflows**
    - Implement persistence for Eligibility results, Workflow checklists, and Application tracking.

5.  **Phase 6: Advanced AI Features**
    - Implement Policy Comparison and AI Draft Generation.

6.  **Phase 7: Decision Intelligence**
    - Connect the Dashboard to real data views once data exists.
