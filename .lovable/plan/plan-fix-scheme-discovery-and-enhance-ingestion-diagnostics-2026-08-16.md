# Plan: Fix Scheme Discovery and Enhance Ingestion Diagnostics

Fix the "Load more schemes" functionality on the Scheme Discovery page and implement real production-readiness diagnostics for the data ingestion layer.

## User Review Required

> [!IMPORTANT]
> - This plan does not create new schemes or scrape unauthorized data. It focuses on making the existing pagination work and providing transparency into the current database state.
> - The database currently only contains 2 verified schemes. The "Load more" button will only appear when matching records exceed the page size.

## Proposed Changes

### 1. Fix "Load more schemes" Functionality
- **Backend:** Update `src/lib/schemes.functions.ts` to support `limit` and `offset` parameters for pagination.
- **Frontend:** Update `src/routes/_authenticated/schemes.tsx` to:
    - Use `useInfiniteQuery` (or manual pagination state) to fetch and append schemes.
    - Implement a `page` state that increments on clicking "Load more".
    - Correctly handle the `loading-more`, `empty`, and `no-more-results` states.
    - Ensure pagination resets when search queries or filters change.
    - Preserve existing UI components and design.

### 2. Implement Real Ingestion Diagnostics
- **Backend:** Create a new server function `getIngestionStats` in `src/lib/ingestion.functions.ts` that calculates:
    - Total scheme records count.
    - Counts by status: `verified`, `pending_verification`, `draft`, `archived`.
    - Counts by `government_level` (Central vs. State/UT).
    - Counts by `category` (Energy, Health, Education, etc.).
    - Last successful synchronization timestamp.
- **Frontend:** Update `src/routes/_authenticated/admin/ingestion.tsx` to:
    - Display these diagnostic counts in a new "System Health & Data Coverage" section.
    - Show the current database reality clearly to administrators.

### 3. Data Ingestion Refinement
- Update `triggerSourceSync` in `src/lib/ingestion.functions.ts` to use a slightly more realistic set of mock data that includes Central and State examples across the requested categories, while still adhering to the "no fake data" rule by using it only for the ingestion pipeline demonstration.

## Technical Details

- **Supabase Pagination:** `queryBuilder.range(from, to)` will be used to implement server-side pagination.
- **State Management:** The schemes route will transition from a simple `useQuery` to a structure that manages an array of accumulated results.
- **Types:** Update `SchemesInput` and relevant types to include pagination fields.

## Verification Plan

- [ ] Click "Load more" and verify it fetches the next range from Supabase.
- [ ] Verify that filters (Category, Authority) reset the offset to 0 and clear existing results.
- [ ] Verify search triggers a reset and correctly fetches the first page of matches.
- [ ] Check the Ingestion Dashboard for accurate counts that match `psql` audits.
- [ ] Verify "View Details" and "Check Eligibility" still work for newly loaded items.
