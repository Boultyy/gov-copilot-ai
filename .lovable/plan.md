# Plan - Fix Scheme Retrieval and Grounding

Improve the retrieval logic to prioritize deterministic and exact matching over fuzzy/semantic matching to ensure queries like "PM-KISAN" return the correct record instead of unrelated schemes.

## Technical Details

### 1. Database Reconciliation
- Deduplicate PM-KISAN records in `public.schemes`.
- The `verified` record (`7a596cab-a9fc-409a-bf7b-42bd1c87969d`) will be treated as canonical.
- The `pending_verification` duplicate (`dcce1243-5af1-4bfe-9b24-c8b8c01133dc`) will be marked as a duplicate or removed.

### 2. Search Logic Upgrade (`src/lib/schemes.server.ts`)
- Implement a `normalizeSchemeName` helper.
- Introduce a tiered search strategy:
  1. Exact normalized name/official_name match.
  2. Alias matching (e.g., "PM-KISAN" -> "PM KISAN").
  3. Token-based matching.
  4. Restricted fuzzy matching with a confidence threshold.
- Add `NO_SCHEME_MATCH` handling.

### 3. Intent and Context Grounding (`src/lib/copilot.functions.ts`)
- Separate intent extraction from scheme identification.
- Inherit scheme context in conversational follow-ups.
- Inject `CANONICAL_SCHEME_ID` and `CANONICAL_SCHEME_NAME` into the AI system prompt.
- Add `[COPILOT_RETRIEVAL]` diagnostic logging.

### 4. Verification
- Run test cases for PM-KISAN, aliases, discovery queries, and nonexistent schemes.
