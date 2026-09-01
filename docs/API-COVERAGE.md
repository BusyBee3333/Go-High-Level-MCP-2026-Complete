# API Coverage

The repo tracks official HighLevel API coverage and generated MCP tools.

Current summary:

- Official endpoint references parsed: `1221` (v3 repo: `627`, v2 repo: `590`, current live-docs v3: `4`)
- Current/default v3 coverage: `661 / 661` (100%)
- Legacy v2 compatibility coverage: `590 / 590` (100%)
- Dual-generation union coverage: `681 / 681` (100%)
- Generated official endpoint tools: `543`
- MCP tools in the full registry: `927`
- Local-only endpoint references: current v3 `265`; dual-generation union `245`

The scanner reads both the v2 (`apps/*.json`) and v3 (`apps/v3/*-v3.json`) OpenAPI fragments from the official docs repo. v3 endpoints are the source of truth; superseded v2 entries are retained for `GHL_API_GENERATION=v2` legacy mode.

Important files:

- `docs/GHL-API-COVERAGE-REPORT.md`
- `docs/GHL-LOCAL-ENDPOINT-CLASSIFICATION.md`
- `docs/api-sources.lock.json`
- `docs/ghl-api-coverage.json`
- `docs/API-DASHBOARD.md`
- `docs/tool-inventory.json`

Refresh only when intentionally updating API coverage:

```bash
npm run scan:ghl-api
```
