# Plan: Government Scheme Data Ingestion Layer

Establish a scalable, secure, and verifiable pipeline for importing real government scheme data from official sources (APIs, datasets, etc.) into GovCopilot.

## Database Foundation

### 1. Ingestion Sources Table
Store configuration for each data source.
- `id`: UUID primary key
- `name`: Human-readable name (e.g., "data.gov.in")
- `source_type`: enum (`official_api`, `official_dataset`, `official_csv`, `official_json`, `authorized_partner_feed`, `manual_verified_import`)
- `base_url`: Root URL of the source
- `api_endpoint`: Specific endpoint path if applicable
- `dataset_identifier`: ID/Name of the specific dataset
- `auth_config`: JSONB (secrets handled via server functions/vault)
- `refresh_frequency`: Interval for updates
- `enabled`: Boolean
- `last_sync_at`: Timestamp
- `last_sync_status`: enum (`success`, `failed`)
- `last_sync_error`: Text

### 2. Ingestion Logs Table
Audit trail for every import operation.
- `id`: UUID
- `source_id`: FK to ingestion_sources
- `status`: enum (`pending`, `processing`, `completed`, `failed`)
- `records_processed`: Integer
- `records_inserted`: Integer
- `records_updated`: Integer
- `error_log`: JSONB
- `created_at`: Timestamp

### 3. Scheme Source Mapping Table
Link every record to its provenance.
- `scheme_id`: FK to public.schemes
- `source_id`: FK to ingestion_sources
- `external_record_id`: ID from the source system
- `raw_data`: JSONB (snapshot of original data)
- `source_url`: Specific URL for this record
- `last_observed_at`: Timestamp

## Backend Infrastructure (Server-Side Only)

### 1. Ingestion Engine (Server Function)
- `ingestFromSource(sourceId)`: Triggered by admin.
- Fetches data using server-side `fetch`.
- Normalizes data according to GovCopilot schema.
- Performs deduplication (matching by `official_name` and `source_record_id`).
- Inserts as `pending_verification` by default.

### 2. Validation Layer
- Zod schema validation for normalized data.
- Basic deduplication logic based on name + ministry + state hash.

## Implementation Steps

### Phase 1: Database Schema
- Migration to create `ingestion_sources`, `ingestion_logs`, and `scheme_source_mapping`.
- Enable RLS: `service_role` and `admin` only.

### Phase 2: Ingestion Server Functions
- Create `src/lib/ingestion.functions.ts`.
- Implement basic fetch logic for JSON/CSV sources.
- Implement normalization logic for `data.gov.in` style datasets.

### Phase 3: Admin UI (Minimal)
- Add "Data Management" section to Sidebar.
- List sources and button to "Sync Now".
- Show recent sync logs.

## Security & Provenance
- External API calls occur only in `createServerFn` (server-side).
- Provenance stored for every record; `verification_status` enforced.
- No client-side exposure of base URLs or API keys.
