# CLI Commands

Use these commands from the repository root. The companion command manages the MCP server and the `ghl` command exposes the same registry as a direct, agent-friendly CLI.

## Full Registry CLI

| Command | Use |
| --- | --- |
| `ghl tools --profile full` | List every tool visible in the selected API generation. |
| `ghl tools --search <text> --json` | Search names, descriptions, and categories with machine-readable output. |
| `ghl describe <name> --json` | Return metadata plus the complete MCP input schema. |
| `ghl call <name> --input '<json>'` | Execute any read-only tool. |
| `ghl <name> --kebab-case-arg <value>` | Execute a tool directly with schema-aware flags. |
| `ghl <name> ... --dry-run` | Resolve and validate arguments without contacting GHL. |
| `ghl <name> ... --confirm` | Authorize one write/delete invocation. |
| `ghl shell` | Start the interactive CLI shell. |

Run `npm link` once to install `ghl` and `ghl-mcp` from the checkout. See [`docs/CLI.md`](../CLI.md) for input modes, credential profiles, safety behavior, and output contracts.

## Server Commands

| Command | Use |
| --- | --- |
| `npm run build` | Builds the MCP server into `dist/`. |
| `npm run dev` | Starts the TypeScript entry point with `nodemon` for local iteration. |
| `npm run start:stdio` | Starts the stdio MCP server from `dist/server.js`. Use this for most desktop MCP clients. |
| `npm run start:http` | Starts the HTTP server from `dist/main.js`. Use this for HTTP transports and local `/tools` inspection. |
| `npm run start:legacy` | Starts the older HTTP entry point from `dist/http-server.js` when compatibility testing it. |

## Quality Commands

| Command | Use |
| --- | --- |
| `npm run lint` | Runs the build checker without emitting server output. |
| `npm test` | Runs Jest tests. |
| `npm run test:coverage` | Runs Jest with coverage reporting. |
| `npm run validate:api-lock` | Verifies `docs/api-sources.lock.json` matches generated API coverage artifacts. |

## Companion CLI Commands

| Command | Use |
| --- | --- |
| `npm run tools:doctor` | Checks Node, build output, local env, and generated API coverage state. |
| `npm run tools:list` | Lists registered MCP tools from the built registry. Supports `--search`, `--category`, and `--stability`. |
| `npm run tools:report` | Writes `docs/API-DASHBOARD.md` and `docs/tool-inventory.json`. |
| `npm run tools:explorer` | Prints the local static explorer path for browsing `docs/tool-inventory.json`. |
| `npm run tools:configure` | Prints a Codex-compatible stdio MCP config snippet. |
| `npm run tools:update-api` | Runs the official API refresh pipeline. |
| `node scripts/ghl-mcp.mjs test-tool <name> '<json>'` | Backward-compatible execution alias. Write/delete tools require `--confirm`. |

The package also exposes `ghl-mcp` as a bin command after install or publish.

## API Coverage Commands

| Command | Use |
| --- | --- |
| `npm run scan:ghl-api` | Refreshes the upstream GHL docs checkout, regenerates official spec tools, rescans coverage, validates the source lock, classifies local-only endpoints, and regenerates the dashboard/inventory. |
| `npm run ci:ghl-api-drift` | Runs the scanner and fails if generated coverage, source lock, dashboard, inventory, or generated official tools changed. |
| `node scripts/scan-ghl-api-coverage.mjs --refresh` | Refreshes `tmp/highlevel-api-docs` from `GoHighLevel/highlevel-api-docs` and writes coverage outputs. |
| `node scripts/generate-official-spec-tools.mjs` | Regenerates official fallback MCP tools from `docs/ghl-api-coverage.json`. |

## Live Smoke Command

`npm run smoke:ghl-live` runs representative read-only checks against the configured GHL account, including Email v3 campaign/template lists and opportunity search. It exits cleanly without credentials, so it can be wired into local preflight without leaking secrets into CI logs.

Required variables:

```sh
GHL_API_KEY=...
GHL_LOCATION_ID=...
```

Optional variables:

```sh
GHL_BASE_URL=https://services.leadconnectorhq.com
GHL_API_VERSION=v3
GHL_API_GENERATION=v3
GHL_LIVE_SMOKE_TIMEOUT_MS=15000
```

The optional `GHL_LIVE_WRITE_SMOKE=1` path currently adds only the non-mutating `POST /notes/search` check and requires `GHL_LIVE_SMOKE_CONTACT_ID`. It does not validate create, update, delete, send, publish, charge, enroll, or trigger behavior.
