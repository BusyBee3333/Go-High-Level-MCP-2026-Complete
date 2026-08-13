# GoHighLevel MCP API Dashboard

Generated from official GHL docs commit: 0af86a4

## Coverage

- Official GHL docs source: https://github.com/GoHighLevel/highlevel-api-docs.git
- Official docs commit: 0af86a4
- Official endpoints parsed: 675
- Official endpoints covered: 675
- Coverage: 100%
- MCP tools in registry: 937
- Read tools: 448
- Write tools: 371
- Delete/destructive tools: 118
- Local-only endpoint references tracked: 251

## Stability Tiers

- Official OpenAPI tools: 300
- Live-docs supplemental tools: 11
- Legacy-compatible tools: 497
- Private/internal unstable tools: 87
- Deprecated/compatibility tools: 42

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
| official-emails | 25 |
| official-saas | 24 |
| payments | 22 |
| conversations | 20 |
| phone-numbers | 20 |
| official-social-media-posting | 20 |
| social-media | 19 |
| invoices | 18 |
| templates | 18 |
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
