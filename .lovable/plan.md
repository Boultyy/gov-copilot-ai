# Agent integrations (MCP) for GovCopilot

Expose GovCopilot's modules as tools an AI assistant (Claude, ChatGPT, Cursor, Lovable chat) can call over MCP.

## Access decision

The access question was skipped, so this plan takes the safe default: the MCP server is **protected with OAuth**. Callers sign in as a user of this app before any tool runs.

GovCopilot currently has no accounts, so this adds Lovable Cloud (database + auth) purely to power the OAuth sign-in and consent screen. The app's five modules keep working exactly as they do now on demo data — nothing in the UI changes except a small consent page used during connection.

If you'd rather ship a no-login server (fine here, since every tool would serve only hardcoded demo data), say "make the MCP public" and I'll drop the Cloud/auth work entirely.

## Tools to expose

| Tool | What it does |
| --- | --- |
| `search_services` | Search government services by name or department; returns matches. |
| `get_service_procedure` | Full step-by-step procedure, required documents, timeline, fee and readiness checklist for one service. |
| `ask_documents` | Ask a question against the indexed demo documents; returns the answer with clause/page citations. |
| `check_policy_conflicts` | Returns conflicts, missing clauses and compliance checks from the policy comparison. |
| `get_dashboard_insights` | KPIs, cases by month, grievance breakdown, AI insights and recent activity. |
| `generate_draft` | Given a document type (letter, notice, circular, RTI reply, office order), instruction and reference number, returns a formatted draft. |

All tools are read-only and answer from the existing `src/lib/demo-data.ts`, so results match the UI exactly.

## Technical details

- Install `@lovable.dev/mcp-js` and `zod`; add the package to the existing `minimumReleaseAgeExcludes` list in `bunfig.toml`.
- One tool per file under `src/lib/mcp/tools/`, registered in `src/lib/mcp/index.ts` via `defineMcp` (name `india-copilot`, title `India Copilot`).
- Add `mcpPlugin()` to `vite.config.ts`; it generates the `/mcp` endpoint and OAuth metadata routes — no hand-written routes.
- Enable Lovable Cloud, then activate the OAuth 2.1 authorization server and add the consent route at `src/routes/[.]lovable.oauth.consent.tsx` with approve/deny plus a sign-in fallback.
- Configure `auth: auth.oauth.issuer(...)` in the MCP entry using the project ref, audience `authenticated`.
- Validate the generated manifest after the edits so the Agent integrations panel lists the tools with titles, descriptions and read-only badges.
- Keep the existing favicon.

## Out of scope

No change to the five module UIs, no new data model, no real document parsing — tools return the same demo data the app already shows.
