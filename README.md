# GoHighLevel MCP Server

Model Context Protocol server for GoHighLevel. It exposes GHL API operations as MCP tools over stdio, Streamable HTTP, and legacy SSE.

## Current API Coverage

- Official GHL endpoints parsed: `576`
- Official endpoint coverage: `576 / 576`
- Generated official endpoint tools: `238`
- MCP tools in registry: `802`
- Local-only endpoint references tracked for review: `253`
- Daily GitHub Actions refresh opens a PR when the official GHL API docs change.

Coverage artifacts:

- `docs/GHL-API-COVERAGE-REPORT.md`
- `docs/GHL-LOCAL-ENDPOINT-CLASSIFICATION.md`
- `docs/ghl-api-coverage.json`
- `docs/API-DASHBOARD.md`
- `docs/tool-inventory.json`

## Companion Tooling

The MCP server stays focused on MCP transports and GHL tool execution. Companion tooling lives beside it for setup, inspection, updates, and examples.

```bash
npm run tools:doctor       # Check build output, env, and API coverage health
npm run tools:list         # Browse the registered MCP tool inventory
npm run tools:report       # Regenerate the API dashboard and tool inventory JSON
npm run tools:explorer     # Print the local static tool explorer path
npm run tools:configure    # Print a Claude-compatible MCP config snippet
npm run tools:update-api   # Refresh official GHL API coverage and generated tools
```

Direct CLI usage:

```bash
npx ghl-mcp doctor
npx ghl-mcp list-tools --search ads
npx ghl-mcp configure claude
npx ghl-mcp test-tool search_contacts '{"locationId":"your_location_id","pageLimit":1}'
```

See `docs/TOOLING.md` for the full tooling map.

## Recipes And Agent Starters

The `examples/` directory turns the tool surface into practical MCP workflows:

- `examples/recipes/` — structured JSON recipes for lead intake, appointment booking, pipeline follow-up, ads reporting, review requests, location health checks, and more.
- `examples/agents/` — starter assistant prompts for CRM, appointment setting, pipeline management, ads reporting, and agency operations.
- `docs/tool-explorer.html` — static browser explorer for `docs/tool-inventory.json`.

Recipes use real MCP tool names and include confirmation points for actions like outbound messages, appointment creation, workflow enrollment, deletes, and snapshot pushes.

## MCP Apps

`mcp-apps/` contains companion MCP Apps for hosts that support interactive MCP resources. They run as a separate app server so the core MCP API server stays lean.

MCP Apps require Node 20+ because they use `@modelcontextprotocol/ext-apps`.

```bash
npm run build
npm run apps:install
npm run apps:build
npm run apps:start:stdio
```

Included app tools:

- `show_ghl_tool_explorer_app`
- `show_ghl_contact_360_app`
- `show_ghl_pipeline_command_app`
- `show_ghl_ads_reporting_app`
- `show_ghl_agency_health_app`

See `mcp-apps/README.md` for host config and HTTP mode.

For a normal browser preview:

```bash
npm run apps:start:http
```

Open `http://localhost:3001/preview`.

## Transports

- `npm run start:stdio` — stdio MCP server for desktop MCP clients.
- `npm run start:http` — Streamable HTTP server at `/mcp`.
- `npm run start:legacy` — legacy SSE server at `/sse`.

The HTTP server also exposes:

- `GET /health`
- `GET /capabilities`
- `GET /tools`
- `POST /execute`
- `POST /tools/call`

## Setup

```bash
npm install
cp .env.example .env
```

Set:

```bash
GHL_API_KEY=your_private_integration_api_key
GHL_LOCATION_ID=your_location_id
GHL_BASE_URL=https://services.leadconnectorhq.com
GHL_API_VERSION=2021-07-28
```

Build and run:

```bash
npm run build
npm run start:stdio
```

For HTTP:

```bash
npm run start:http
```

## MCP Client Config

Example stdio config:

```json
{
  "mcpServers": {
    "ghl": {
      "command": "node",
      "args": ["/absolute/path/to/Go-High-Level-MCP-2026-Complete/dist/server.js"],
      "env": {
        "GHL_API_KEY": "your_private_integration_api_key",
        "GHL_LOCATION_ID": "your_location_id",
        "GHL_BASE_URL": "https://services.leadconnectorhq.com",
        "GHL_API_VERSION": "2021-07-28"
      }
    }
  }
}
```

## Scripts

```bash
npm run build              # Compile server files to dist/
npm run lint               # Fast TypeScript syntax/transpile check
npm test                   # Jest tests
npm run scan:ghl-api       # Refresh official GHL API coverage and generated tools
npm run ci:ghl-api-drift   # Fail if generated API artifacts are stale
npm run smoke:ghl-live     # Optional read-only live checks when GHL env vars are set
npm run tools:doctor       # Check local MCP setup
npm run tools:report       # Generate API dashboard and tool inventory
npm run tools:explorer     # Show the static tool explorer file path
```

## Daily API Refresh

`.github/workflows/ghl-api-drift.yml` runs daily. It:

1. Pulls the latest official `GoHighLevel/highlevel-api-docs` snapshot.
2. Regenerates coverage docs and generated official endpoint tools.
3. Opens a PR if any generated artifacts changed.

PRs and pushes also run drift checks so stale generated files do not silently land.

## Project Layout

```text
src/
  clients/       GHL API clients
  tools/         MCP tool modules
  types/         shared TypeScript types
  main.ts        Streamable HTTP MCP server
  server.ts      stdio MCP server
  http-server.ts legacy SSE MCP server
scripts/         API scanner, generator, build, smoke test
docs/            generated API coverage reports
examples/        MCP recipes and starter agent templates
mcp-apps/        companion MCP Apps server and bundled UI
tests/           Jest tests
```

## Notes

- `src/tools/official-spec-tools.ts` and `src/tools/official-spec-endpoints.json` are generated. Do not edit them by hand.
- Run `npm run scan:ghl-api` after GHL API docs change.
- The live smoke test is opt-in and only runs when `GHL_API_KEY` and `GHL_LOCATION_ID` are present.
