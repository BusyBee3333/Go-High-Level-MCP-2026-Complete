# GoHighLevel MCP Server

Model Context Protocol server for GoHighLevel. It exposes GHL API operations as MCP tools over stdio, Streamable HTTP, legacy SSE, and optional MCP Apps.

New here? Start with [QUICKSTART.md](QUICKSTART.md).

Using an AI/dev agent? Give it [AGENT_SETUP.md](AGENT_SETUP.md) and say: "Set this up for my MCP client using the curated profile. Ask me for credentials if needed. Do not run write tools."

## 5-Minute Quickstart

Requirements:

- Node 20+
- A GoHighLevel private integration token or OAuth access token
- A GoHighLevel Location ID

```bash
npm install
cp .env.example .env
npm run build
npm run doctor
npm run configure:codex
```

Add your credentials to `.env`:

```bash
GHL_API_KEY=your_private_integration_api_key
GHL_LOCATION_ID=your_location_id
GHL_BASE_URL=https://services.leadconnectorhq.com
GHL_API_VERSION=v3
GHL_API_GENERATION=v3
# GHL_USER_TYPE=Location # or Company; optional access preflight
```

`GHL_API_VERSION=v3` is the current named HighLevel API `Version` header, not a date. Routing is per endpoint: ad-publishing remains mostly on `2021-07-28`; Conversations use `v3` in current mode and `2021-04-15` in legacy v2 mode. Set `GHL_API_GENERATION=v2` for the legacy surface; the starter `GHL_API_VERSION=v3` value is then replaced by the `2023-02-21` fallback. See [docs/V3-MIGRATION.md](docs/V3-MIGRATION.md).

Then verify live auth:

```bash
npm run auth-check
```

## Setup Commands

```bash
npm run setup                 # Create .env if needed, build, and print next steps
npm run first-run             # One-command beginner setup/readiness flow
npm run connect               # Setup plus client config generation
npm run ready                 # Fast readiness check
npm run demo                  # Print MCP Apps demo preview instructions
npm run explain-error -- "Location is not active"
npm run doctor                # Human-readable setup check
npm run doctor -- --json      # Agent-readable setup check
npm run agent:check           # Safe validation for AI/dev agents
npm run auth-check            # Read-only GHL token/location check
```

Missing credentials are reported as `needsHumanAction`, not as a broken install. This lets agents build and configure the repo without inventing secrets.

## MCP Client Config

Beginner configs use `GHL_TOOL_PROFILE=curated` so agents see the high-level workflow tools first.

```bash
npm run configure:codex
npm run configure:claude
npm run configure:cursor
npm run configure:windsurf
```

Advanced examples:

```bash
node scripts/ghl-mcp.mjs configure codex --profile stable
node scripts/ghl-mcp.mjs configure codex --profile full
node scripts/ghl-mcp.mjs configure codex --profile curated --json
```

## Tool Profiles

- `curated` - recommended for agents; high-level CRM workflows with confirmation queues.
- `stable` - production-friendly; official, supplemental, curated, and legacy-compatible tools.
- `full` - everything.
- `official` - official OpenAPI and live-docs supplemental tools.
- `raw` - endpoint-level tools only.

## Run

```bash
npm run start:stdio       # Desktop MCP clients
npm run start:http        # Streamable HTTP at /mcp
npm run start:legacy      # Legacy SSE at /sse
```

HTTP also exposes:

- `GET /health`
- `GET /capabilities`
- `GET /tools`
- `POST /execute`
- `POST /tools/call`

## MCP Apps

```bash
npm run apps:setup
npm run apps:preview
```

Open `http://localhost:3001/preview`. Without GHL credentials, the apps use preview/demo states and tell you exactly which env vars are missing.

## Tool Discovery

```bash
npm run tools:list
npm run tools:list -- --search contacts
npm run tools:list -- --category contacts
npm run tools:list -- --stability official
npm run tools:list -- --access write
npm run tools:list -- --destructive
npm run tools:explorer
```

The static explorer is `docs/tool-explorer.html`.

## Full Registry CLI

The package also exposes every visible MCP tool through the schema-driven `ghl` command. The CLI reads the live registry, so generated API refreshes do not require hand-written subcommands.

```bash
npm link
ghl tools --search contacts --json
ghl describe get_contact --json
ghl get_contact --contact-id CONTACT_ID --dry-run
ghl get_contact --contact-id CONTACT_ID
```

Tool calls accept schema-aware flags, JSON, files, or stdin and emit JSON by default. All write/delete tools require `--confirm`; `--dry-run` validates and resolves any call without contacting GHL. Use `--env-file` or `GHL_ENV_FILE` to keep location-specific credentials outside the repository.

See [docs/CLI.md](docs/CLI.md) for installation, discovery, input formats, safety behavior, and agent usage.

## High-Level Agent Tools

Start agents with the curated profile and prefer these high-level tools before raw endpoints:

- `crm_location_overview`
- `crm_daily_briefing`
- `crm_search_everything`
- `crm_next_best_actions`
- `crm_get_next_page`
- `crm_prepare_contact_followup`
- `crm_prepare_lead_reactivation`
- `crm_prepare_missed_call_response`
- `crm_prepare_pipeline_cleanup`
- `crm_prepare_review_request_batch`
- `crm_prepare_invoice_followup`

## Docs

- [Update Log](UPDATE_LOG.md)
- [Setup](docs/SETUP.md)
- [Usage](docs/USAGE.md)
- [Clients](docs/CLIENTS.md)
- [Tool Profiles](docs/TOOL-PROFILES.md)
- [Recipes](docs/RECIPES.md)
- [Safety](docs/SAFETY.md)
- [Troubleshooting](docs/TROUBLESHOOTING.md)
- [Deployment](docs/DEPLOYMENT.md)
- [Development](docs/DEVELOPMENT.md)
- [API Coverage](docs/API-COVERAGE.md)
- [Companion Tooling](docs/TOOLING.md)

## Update History

| Date | Update # | Included |
| --- | ---: | --- |
| 2026-08-30 | 4 | Full-registry `ghl` CLI with dynamic discovery/schemas, JSON and schema-aware inputs, isolated env profiles, dry runs, write confirmation gates, and agent-friendly output. See [UPDATE_LOG.md](UPDATE_LOG.md) and [docs/CLI.md](docs/CLI.md). |
| 2026-08-07 | 3 | v3 API migration with per-endpoint version routing, v2 compatibility mode, access-level preflight, and 100% declared current/legacy coverage. See [UPDATE_LOG.md](UPDATE_LOG.md). |
| 2026-06-11 | 2 | Simplicity and power layer: easy setup commands, safe config writing, grouped live smoke checks, and high-level curated CRM agent tools. See [UPDATE_LOG.md](UPDATE_LOG.md) for the full permanent update description. |
| 2026-06-11 | 1 | Onboarding and agent setup overhaul. See [UPDATE_LOG.md](UPDATE_LOG.md) for the full permanent update description. |

## API Coverage

- Official endpoint references parsed: `1221` (v3 repo: `627`, v2 repo: `590`, current live-docs v3: `4`)
- Current/default v3 coverage: `661 / 661` (100%)
- Legacy v2 compatibility coverage: `590 / 590` (100%)
- Dual-generation union coverage: `681 / 681` (100%)
- Generated official endpoint tools: `543`
- MCP tools in the full registry: `926`
- Local-only endpoint references: current v3 `265`; dual-generation union `245`

The scanner reads both the v2 (`apps/*.json`) and v3 (`apps/v3/*-v3.json`) OpenAPI fragments. v3 endpoints are the source of truth; superseded v2 entries are retained for `GHL_API_GENERATION=v2` legacy mode.

## Safety

- `.env` is ignored and must never be committed.
- `test-tool` refuses write/destructive tools unless `--confirm` is supplied.
- Curated workflow tools stage confirmation queues for writes.
- Use `curated` for beginners and `stable` for production.
