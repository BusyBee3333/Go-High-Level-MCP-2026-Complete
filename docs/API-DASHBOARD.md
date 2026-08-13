# GoHighLevel MCP API Dashboard

Generated from official GHL docs commit: 0af86a4

## Coverage

- Official GHL docs source: https://github.com/GoHighLevel/highlevel-api-docs.git
- Official docs commit: 0af86a4
- Current/default v3 official endpoints: 661 / 661
- Current/default v3 coverage: 100%
- Legacy v2 compatibility endpoints: 590 / 590
- Dual-generation endpoint union: 681 / 681
- MCP tools in registry: 926
- Read tools: 445
- Write tools: 365
- Delete/destructive tools: 116
- Current-v3 local-only endpoint references tracked: 265
- Dual-generation local-only endpoint references tracked: 245

## Stability Tiers

- Official OpenAPI tools: 301
- Live-docs supplemental tools: 4
- Legacy-compatible tools: 492
- Private/internal unstable tools: 88
- Deprecated/compatibility tools: 41

## Largest Tool Categories

| Category | Tools |
| --- | ---: |
| official-ad-publishing | 95 |
| agent-workspace | 43 |
| calendar | 39 |
| official-calendars | 33 |
| courses | 32 |
| contacts | 31 |
| official-social-planner | 29 |
| locations | 27 |
| official-saas | 24 |
| payments | 22 |
| conversations | 20 |
| phone-numbers | 20 |
| official-social-media-posting | 20 |
| social-media | 19 |
| invoices | 18 |
| templates | 18 |
| official-emails | 18 |
| stores | 17 |
| affiliates | 17 |
| reputation | 15 |

## Maintenance Commands

```bash
npm run tools:doctor
npm run tools:report
npm run scan:ghl-api
npm run ci:ghl-api-drift
```

The daily API drift workflow refreshes the official GoHighLevel docs snapshot and opens a PR when generated MCP artifacts change.
