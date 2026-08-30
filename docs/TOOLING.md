# Companion Tooling

This repo ships a GoHighLevel MCP server plus a small tooling loop that keeps the tool surface aligned with GHL's public API docs. The tooling is intentionally practical: scan upstream docs, classify coverage, generate missing official tools, generate the API dashboard/tool inventory, smoke test read-only live calls, and open a daily drift PR when upstream changes.

## Quick Commands

Run these from the repo root.

| Command | Purpose |
| --- | --- |
| `npm run build` | Compile the MCP server. |
| `npm run start:stdio` | Start the stdio MCP server for desktop clients. |
| `npm run start:http` | Start the HTTP MCP server. |
| `npm run lint` | Type-check/build-check the server. |
| `npm test` | Run Jest tests. |
| `npm run scan:ghl-api` | Refresh official docs, generated official tools, source lock, coverage JSON/report, dashboard, inventory, and local-only classification. |
| `npm run validate:api-lock` | Confirm `docs/api-sources.lock.json` matches generated coverage. |
| `npm run ci:ghl-api-drift` | CI guard that fails when generated API coverage artifacts are stale. |
| `npm run smoke:ghl-live` | Run read-only live GHL checks when credentials are present. |
| `npm run tools:doctor` | Check local setup, build output, credentials, and API coverage state. |
| `npm run tools:list` | List the registered MCP tools from the built registry. |
| `npm run cli` | Start the full-registry CLI (interactive in a terminal). |
| `npm run tools:report` | Generate `docs/API-DASHBOARD.md` and `docs/tool-inventory.json`. |
| `npm run tools:explorer` | Print the local `docs/tool-explorer.html` path for browsing the inventory. |
| `npm run tools:configure` | Print a stdio MCP client config snippet. |
| `npm run tools:update-api` | Run the full official API refresh pipeline. |

## Tool Profiles

The built registry supports `GHL_TOOL_PROFILE`:

- `full` - default, all raw endpoint tools plus curated agent workflow tools.
- `curated` - only the high-level `agent-workspace` tools designed for chat CRM work and confirmation queues.
- `raw` - the endpoint-level tools without the curated workflow layer.
- `official` - explicit official OpenAPI and live-docs supplemental tools only.
- `stable` - official, live-docs supplemental, curated, and legacy-compatible tools; hides deprecated and private/unstable tools.

Examples:

```bash
GHL_TOOL_PROFILE=curated npm run tools:list
GHL_TOOL_PROFILE=curated npm run start:stdio
GHL_TOOL_PROFILE=raw npm run start:http
GHL_TOOL_PROFILE=official npm run tools:list
GHL_TOOL_PROFILE=stable npm run start:stdio
```

## Tooling Map

- [Full Registry CLI](CLI.md) covers installation, discovery, schemas, input modes, location profiles, safety, and agent usage.
- [CLI Commands](tooling/cli-commands.md) covers server, scanner, generator, CI, and smoke commands.
- [API Coverage Dashboard](tooling/api-coverage.md) explains `docs/GHL-API-COVERAGE-REPORT.md`, `docs/GHL-LOCAL-ENDPOINT-CLASSIFICATION.md`, `docs/api-sources.lock.json`, and `docs/ghl-api-coverage.json`.
- [Client Config Generator](tooling/client-config-generator.md) defines the recommended generated config shapes for MCP clients.
- [Live Smoke Testing](tooling/live-smoke-testing.md) documents the read-only smoke policy and required environment variables.
- [Daily Drift PR Flow](tooling/daily-drift-pr-flow.md) describes the scheduled refresh workflow and review rules.
- [Tool Metadata Categories](tooling/tool-metadata-categories.md) defines the MCP `_meta.labels` conventions used by generated and handwritten tools.

## Operating Rule

Generated API coverage artifacts are outputs, not hand-authored docs. If they drift, run `npm run scan:ghl-api`, review the diff, and commit the generated changes with any deliberate MCP tool updates.
