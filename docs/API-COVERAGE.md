# API Coverage

The repo tracks official HighLevel API coverage and generated MCP tools.

Current summary:

- Official endpoints parsed: `1221` (v3: 627, v2: 576, live-docs: 18)
- Unique official endpoints (v3 + non-superseded v2): `681`
- Official endpoint coverage: `681 / 681` (100%)
- Generated official endpoint tools: `545`
- MCP tools in registry: `943`
- Local-only endpoint references tracked: `253`

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

