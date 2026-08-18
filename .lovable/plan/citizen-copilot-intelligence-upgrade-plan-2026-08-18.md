# Citizen Copilot Intelligence Upgrade Plan

Upgrade the backend intelligence of Citizen Copilot to be a grounded Government Scheme Assistant without changing the existing UI.

## Phase 1: Audit and Analysis
- Inspect `src/lib/copilot.functions.ts` to trace current retrieval logic.
- Identify bottlenecks: currently uses simple `ilike` filters and direct AI calls.
- Verify existing database schema for schemes and user documents.

## Phase 2: Enhanced Database Retrieval
- Implement a more robust scheme search in `src/lib/schemes.server.ts`.
- Support normalized names, aliases (e.g., "PM-KISAN" vs "Pradhan Mantri Kisan Samman Nidhi"), and ministry/category keyword matching.
- Prioritize verified records from DBT Bharat.

## Phase 3: Intent Detection and Enrichment
- Add an intent classifier to determine if a query is for info, eligibility, application, or discovery.
- Implement "Official Web Enrichment" using the `source_url` from the database.
- Use a server-side fetcher to retrieve current metadata from official government portals when database detail is insufficient.

## Phase 4: Hybrid RAG Pipeline
- **Step 1:** Search database for relevant schemes.
- **Step 2:** If detail is missing, fetch from official URL (hierarchical priority).
- **Step 3:** Construct context with both database and official web evidence.
- **Step 4:** Generate natural, grounded response via AI (preventing hallucinations).

## Phase 5: AI Logic and Anti-Hallucination
- Update system instructions to strictly use provided context.
- Implement explicit checks to ensure no fabrication of URLs, dates, or rules.
- Maintain follow-up context (e.g., "Who launched it?").

## Phase 6: Performance Optimization
- Parallelize database and web retrieval where possible.
- Implement sensible timeouts and error handling for external fetches.
- Use streaming responses to improve perceived responsiveness.

## Technical Details
- **AI Gateway:** Fix the 404 issue by verifying `LOVABLE_API_KEY` and project entitlements, or implementing a clean server-side fallback to Gemini.
- **Scraping:** Use basic `fetch` and structured parsing for enrichment; avoid bypass techniques.
- **Grounding:** Explicitly cite official sources in the metadata returned to the UI.

## Validation
- Test with 15 specific queries (PM-KISAN, Farmers, Solar Energy, etc.).
- Verify UI remains identical while backend accuracy improves.
- Ensure 0% fabrication rate for missing data.
