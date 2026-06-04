# GoHighLevel MCP API Dashboard

Generated from official GHL docs commit: ae4d260

## Coverage

- Official GHL docs source: https://github.com/GoHighLevel/highlevel-api-docs.git
- Official docs commit: ae4d260
- Official endpoints parsed: 576
- Official endpoints covered: 576
- Coverage: 100%
- MCP tools in registry: 834
- Read tools: 414
- Write tools: 314
- Delete/destructive tools: 106
- Local-only endpoint references tracked: 253

## Largest Tool Categories

| Category | Tools |
| --- | ---: |
| official-ad-manager | 94 |
| calendar | 39 |
| courses | 32 |
| agent-workspace | 32 |
| contacts | 31 |
| locations | 27 |
| official-social-media-posting | 24 |
| payments | 22 |
| official-saas-api | 21 |
| conversations | 20 |
| phone-numbers | 20 |
| social-media | 19 |
| invoices | 18 |
| templates | 18 |
| stores | 17 |
| affiliates | 17 |
| reputation | 15 |
| phone-system | 15 |
| official-calendars | 15 |
| workflows | 14 |

## Maintenance Commands

```bash
npm run tools:doctor
npm run tools:report
npm run scan:ghl-api
npm run ci:ghl-api-drift
```

The daily API drift workflow refreshes the official GoHighLevel docs snapshot and opens a PR when generated MCP artifacts change.
