# GHL API Coverage Report

Generated from official GHL docs commit: 0af86a4

## Source Snapshot

- Official docs repo: https://github.com/GoHighLevel/highlevel-api-docs.git
- Docs checkout: `tmp/highlevel-api-docs`
- Docs commit: `0af86a4cbd48c66a4071c7e509d1079f9f10ed17`
- Docs tag/description: `0af86a4`
- Official endpoint references parsed: 1221
- Local endpoint references parsed: 1137
- Registered tool modules discovered: 49
- Local TypeScript files scanned: 55

## Coverage Summary

- Current/default v3 unique official endpoints: 661
- Legacy v2 compatibility unique official endpoints: 590
- Dual-generation unique official endpoint union: 681
- Unique local endpoints: 926
- Current v3 exact-match coverage: 661 / 661 (100%)
- Legacy v2 exact-match coverage: 590 / 590 (100%)
- Dual-generation exact-match coverage: 681 / 681 (100%)
- Likely missing current v3 official endpoints: 0
- Potential current-v3 local-only/deprecated/private endpoints: 265
- Potential dual-generation local-only/deprecated/private endpoints: 245

Only files reachable from modules registered by `ToolRegistry` are counted as hand-written coverage. Exact matching is intentionally conservative. Dynamic path generation, aliases, and compatibility wrappers may create false positives, but this gives us a repeatable first-pass map.

## Changelog-Only Findings To Plan Around

- 2026-06-11 — v3 release: Major v3 migration: named "v3" Version header introduced for contacts, opportunities, oauth, emails, brand-boards, saas, email-isv. GET /contacts/ and GET /users/ removed. OAuth went camelCase. /oauth/installedLocations and /oauth/locationToken removed (replaced by kebab-case). New Agency-Access-Only and Location-Access-Only security schemes. Full emails v3 suite (/emails/locations/{locationId}/...) and brand-boards brand-voices suite added. (https://marketplace.gohighlevel.com/docs/Changelog/index.html)
- 2026-08-06 — SaaS: GET /saas/locations now requires companyId query parameter; customerId and subscriptionId became optional. (https://marketplace.gohighlevel.com/docs/Changelog/index.html)
- 2026-06-26 — Opportunities: Pipeline CRUD endpoints added: POST/DELETE/GET/PUT /opportunities/pipelines and /opportunities/pipelines/{pipelineId}. (https://marketplace.gohighlevel.com/docs/Changelog/index.html)
- 2026-06-18 — Ad Publishing / SaaS: Added GET /ad-publishing/facebook/campaigns/{campaignId}/publishing-progress (the only ad-publishing endpoint on v3) and POST /saas/allow-attach-rebilling/{locationId}. (https://marketplace.gohighlevel.com/docs/Changelog/index.html)
- 2026-04-28 — Users/Contacts: GET /users/ and GET /contacts/ deprecated (removed in v3 on 2026-06-11). (https://marketplace.gohighlevel.com/docs/Changelog/index.html)
- 2026-04-21 — Notes: Top-level Notes endpoints added: POST /notes/, POST /notes/search, DELETE /notes/{id}, GET /notes/{id}, PUT /notes/{id}, PATCH /notes/{id}/attachments, PUT /notes/{id}/relations, POST /notes/{id}/restore (https://marketplace.gohighlevel.com/docs/Changelog/index.html)
- 2026-04-15 — Users/Scopes: New user scope enum values added for audit logs, location management, and payments settings (https://marketplace.gohighlevel.com/docs/Changelog/index.html)

## Coverage By Official App Area

| App area | Official endpoints | Exact local matches | Missing |
| --- | ---: | ---: | ---: |
| ad-publishing | 95 | 95 | 0 |
| calendars | 59 | 59 | 0 |
| social-planner | 45 | 45 | 0 |
| invoices | 42 | 42 | 0 |
| locations | 32 | 32 | 0 |
| contacts | 31 | 31 | 0 |
| conversations | 30 | 30 | 0 |
| products | 27 | 27 | 0 |
| saas | 25 | 25 | 0 |
| emails | 23 | 23 | 0 |
| payments | 23 | 23 | 0 |
| social-media-posting | 20 | 20 | 0 |
| store | 18 | 18 | 0 |
| opportunities | 16 | 16 | 0 |
| knowledge-base | 14 | 14 | 0 |
| conversation-ai | 12 | 12 | 0 |
| agent-studio | 11 | 11 | 0 |
| brand-boards | 11 | 11 | 0 |
| voice-ai | 11 | 11 | 0 |
| associations | 10 | 10 | 0 |
| marketplace | 9 | 9 | 0 |
| objects | 9 | 9 | 0 |
| chat-widget | 8 | 8 | 0 |
| custom-fields | 8 | 8 | 0 |
| blogs | 7 | 7 | 0 |
| funnels | 7 | 7 | 0 |
| medias | 7 | 7 | 0 |
| links | 6 | 6 | 0 |
| users | 6 | 6 | 0 |
| businesses | 5 | 5 | 0 |
| custom-menus | 5 | 5 | 0 |
| affiliate-manager | 4 | 4 | 0 |
| phone-system | 4 | 4 | 0 |
| proposals | 4 | 4 | 0 |
| snapshots | 4 | 4 | 0 |
| forms | 3 | 3 | 0 |
| oauth | 3 | 3 | 0 |
| surveys | 2 | 2 | 0 |
| campaigns | 1 | 1 | 0 |
| companies | 1 | 1 | 0 |
| courses | 1 | 1 | 0 |
| email-isv | 1 | 1 | 0 |
| workflows | 1 | 1 | 0 |

## High-Priority Missing Official Endpoints

- None found.

## Potential Local-Only High-Risk Endpoints

These deserve manual review because they may be legacy, private, renamed, or simply not matched by the scanner.

- `DELETE /affiliates/campaigns/{param}` — src/tools/affiliates-tools.ts — makeRequest
- `DELETE /campaigns/scheduled-messages/{param}` — src/tools/campaigns-tools.ts — makeRequest
- `DELETE /campaigns/{param}` — src/tools/campaigns-tools.ts — makeRequest
- `DELETE /contacts/{param}/campaigns` — src/clients/ghl-api-client.ts — axiosInstance
- `DELETE /contacts/{contactId}/campaigns/removeAll` — src/tools/official-spec-endpoints.json — official-spec-generated
- `DELETE /emails/public/v2/locations/{param}/campaigns/{param}` — src/tools/email-tools.ts — makeRequest
- `DELETE /emails/public/v2/locations/{locationId}/templates/{templateId}` — src/tools/official-spec-endpoints.json — official-spec-generated
- `GET /affiliates/campaigns` — src/tools/affiliates-tools.ts — makeRequest
- `GET /affiliates/campaigns/{param}` — src/tools/affiliates-tools.ts — makeRequest
- `GET /campaigns/scheduled-messages` — src/tools/campaigns-tools.ts — makeRequest
- `GET /campaigns/{param}` — src/tools/campaigns-tools.ts — makeRequest
- `GET /campaigns/{param}/recipients` — src/tools/campaigns-tools.ts — makeRequest
- `GET /campaigns/{param}/stats` — src/tools/campaigns-tools.ts — makeRequest
- `GET /emails/public/v2/locations/{param}/campaigns/bulk-actions` — src/tools/email-tools.ts — makeRequest
- `GET /emails/public/v2/locations/{param}/campaigns/emails` — src/tools/email-tools.ts — makeRequest
- `GET /emails/public/v2/locations/{locationId}/campaigns/stats/{source}/{sourceId}` — src/tools/official-spec-endpoints.json — official-spec-generated
- `GET /emails/public/v2/locations/{param}/campaigns/workflows` — src/tools/email-tools.ts — makeRequest
- `GET /emails/public/v2/locations/{locationId}/templates` — src/tools/official-spec-endpoints.json — official-spec-generated
- `GET /reporting/emails` — src/tools/reporting-tools.ts — makeRequest
- `GET /users/` — src/tools/official-spec-endpoints.json — official-spec-generated
- `PATCH /emails/public/v2/locations/{param}/campaigns/{param}` — src/tools/email-tools.ts — makeRequest
- `PATCH /emails/public/v2/locations/{locationId}/templates/{templateId}` — src/tools/official-spec-endpoints.json — official-spec-generated
- `POST /affiliates/campaigns` — src/tools/affiliates-tools.ts — makeRequest
- `POST /campaigns/` — src/tools/campaigns-tools.ts — makeRequest
- `POST /campaigns/{param}/pause` — src/tools/campaigns-tools.ts — makeRequest
- `POST /campaigns/{param}/resume` — src/tools/campaigns-tools.ts — makeRequest
- `POST /campaigns/{param}/start` — src/tools/campaigns-tools.ts — makeRequest
- `POST /emails/public/v2/locations/{param}/campaigns/email-campaign` — src/tools/email-tools.ts — makeRequest
- `POST /emails/public/v2/locations/{param}/campaigns/{param}/schedule` — src/tools/email-tools.ts — makeRequest
- `POST /emails/public/v2/locations/{locationId}/templates` — src/tools/official-spec-endpoints.json — official-spec-generated
- `POST /emails/public/v2/locations/{locationId}/templates/folders` — src/tools/official-spec-endpoints.json — official-spec-generated
- `POST /emails/public/v2/locations/{locationId}/templates/import` — src/tools/official-spec-endpoints.json — official-spec-generated
- `PUT /affiliates/campaigns/{param}` — src/tools/affiliates-tools.ts — makeRequest
- `PUT /campaigns/{param}` — src/tools/campaigns-tools.ts — makeRequest

## Recommended Update Plan

1. The scanner now reads both the v2 (`apps/*.json`) and v3 (`apps/v3/*-v3.json`) OpenAPI fragments. v3 endpoints (named `v3` version header) are the source of truth; superseded v2 entries are retained for legacy/v2-mode visibility.
2. Ad-publishing stays on the legacy `2021-07-28` version header for 94 of 95 endpoints (only the publishing-progress endpoint uses `v3`). The per-endpoint version router in `src/clients/version-router.ts` handles this automatically.
3. Core Conversations and Messages routes use named `v3` in the current generation and `2021-04-15` only in legacy v2 mode.
4. `GET /contacts/` and `GET /users/` are removed in v3; callers must use `POST /contacts/search` and the users search endpoints instead. The hand-written contact/user tools route accordingly in v3 mode.
5. OAuth migrated to camelCase (`clientId`, `accessToken`, ...) and new kebab-case paths (`/oauth/installed-locations`, `/oauth/location-token`). The old camelCase paths were removed without deprecation.
6. New modules covered: top-level `/notes/`, opportunities pipelines CRUD, `/saas/allow-attach-rebilling/{locationId}`, brand-boards v3 brand-voices, and the full `/emails/locations/{locationId}/...` v3 email suite.
7. Two new security schemes (`Agency-Access-Only`, `Location-Access-Only`) are captured per endpoint as `securitySchemes` and drive the access-level preflight in `OfficialSpecTools`.
8. Removed Email Campaign V2 supplemental endpoints are retained as deprecated v2-only coverage and hidden from the v3 surface.

## Full Machine-Readable Output

See `docs/ghl-api-coverage.json` for the complete parsed endpoint lists.
