# V3 API Migration Guide

This document explains the GoHighLevel (HighLevel) v3 API migration shipped in
this update, how it affects the MCP, and how to opt into legacy behavior if you
need it.

## TL;DR

- The MCP now targets **v3** by default. Set `GHL_API_VERSION=v3` (a named
  version, not a date).
- v3 is **not** a single global header. Most modules send `v3`, but
  **ad-publishing keeps `2021-07-28`** and **Conversations keep
  `2021-04-15`**. The MCP routes the correct header per endpoint automatically.
- To fall back to the pre-v3 surface, set `GHL_API_GENERATION=v2`. Removed
  endpoints (`GET /contacts/`, `GET /users/`, old email/brand-board routes)
  become available again.
- Set `GHL_USER_TYPE=Location` or `Company` to enable the access-level
  preflight, which rejects calls to endpoints whose security scheme requires the
  other token type before the API does.

## What changed in v3 (released 2026-06-11)

### Version header

Before v3, the `Version` header was a date (`2021-04-15`, `2021-07-28`,
`2023-02-21`). v3 introduced a **named** version: the literal string `v3`.
Each module's spec declares which versions its endpoints accept, so the MCP
reads those declarations and routes accordingly:

| Module | Version header |
| --- | --- |
| Contacts, Opportunities, OAuth, Emails, Brand Boards, SaaS, Email-ISV | `v3` |
| Ad-publishing (94 of 95 endpoints) | `2021-07-28` |
| Ad-publishing `publishing-progress` (1 endpoint) | `v3` |
| Conversations | `2021-04-15` (unchanged) |

The router lives in `src/clients/version-router.ts`.

### Removed endpoints

These were removed in v3. In v3 mode the MCP hides the corresponding tools; in
v2 mode they reappear.

- `GET /contacts/` — use `POST /contacts/search` instead.
- `GET /users/` — use the users search endpoints instead.
- `/emails/builder/*` and `/emails/public/v2/*` — replaced by the
  `/emails/locations/{locationId}/...` v3 suite.
- `/brand-boards/public/v1/.../voices` — replaced by
  `/brand-boards/locations/{locationId}/brand-voices`.
- `/oauth/installedLocations` and `/oauth/locationToken` — removed **without
  deprecation**; replaced by kebab-case `/oauth/installed-locations` and
  `/oauth/location-token`.
- `/contacts/{contactId}/campaigns/removeAll` — renamed to `remove-all`.
- `PUT /ad-publishing/facebook/ads-v2` — renamed to `/ad-publishing/facebook/ads`.

### OAuth went camelCase

`POST /oauth/token` request and response bodies flipped from `snake_case`
(`client_id`, `access_token`, `expires_in`) to `camelCase` (`clientId`,
`accessToken`, `expiresIn`). The `GHLTokenResponse` type now carries both
shapes; `normalizeTokenResponse()` returns the canonical camelCase form.

The full v3 OAuth surface is small: `POST /oauth/token`,
`POST /oauth/location-token`, `GET /oauth/installed-locations`. Earlier
hand-written tools that referenced non-existent paths (`/oauth/apps`,
`/oauth/api-keys`, `/integrations/connected`) were removed after live
verification showed they 404.

### New endpoints

- **Notes** (top-level module, 2026-04-21): `POST /notes/`, `/notes/search`,
  `GET|PUT|DELETE /notes/{id}`, `PATCH /notes/{id}/attachments`,
  `PUT /notes/{id}/relations`, `POST /notes/{id}/restore`.
- **Opportunities pipelines CRUD** (2026-06-26): `POST /opportunities/pipelines/`,
  `GET|PUT|DELETE /opportunities/pipelines/{pipelineId}`.
- **SaaS**: `POST /saas/allow-attach-rebilling/{locationId}`;
  `GET /saas/locations` now requires `companyId`.
- **Brand Boards v3 brand-voices**: full CRUD under
  `/brand-boards/locations/{locationId}/brand-voices`.
- **Emails v3 suite**: campaigns, templates, folders, workflows, bulk actions
  under `/emails/locations/{locationId}/...`.

### Breaking parameter changes

- `GET /opportunities/search` now **requires `locationId`** and uses camelCase
  params: `pipelineId`, `pipelineStageId`, `contactId`, `assignedTo` (the old
  `snake_case` forms are gone). The MCP accepts either casing and translates.

### Security schemes

v3 added two strict security components:

- `Agency-Access-Only` — accepts **only** an Agency/Company access token.
- `Location-Access-Only` — accepts **only** a Location access token.

The existing `Agency-Access` / `Location-Access` schemes still accept a Private
Integration token of the matching level. The MCP tags each endpoint with its
required access level and, when `GHL_USER_TYPE` is set, rejects mismatched
calls up front with a clear error instead of letting the API return a 401.

## Configuration

```bash
# Required (unchanged)
GHL_API_KEY=...
GHL_LOCATION_ID=...

# v3 (default)
GHL_API_VERSION=v3
GHL_API_GENERATION=v3

# Opt into the legacy pre-v3 surface
# GHL_API_GENERATION=v2

# Enable access-level preflight (optional)
# GHL_USER_TYPE=Location   # or Company
```

## Base URL & rate limits (unchanged)

- Base URL: `https://services.leadconnectorhq.com`
- Burst: 100 requests / 10 seconds per app per resource.
- Daily: 200,000 requests / day per app per resource.

## Live validation (2026-08-07)

The v3 routing was validated against the live GHL API:

- **Version header acceptance confirmed.** `POST /contacts/search` with
  `Version: v3` is accepted (proceeds to scope check); `Version: 9999-99-99` is
  rejected with "version header is invalid"; no header is rejected with
  "version header was not found." This proves the named `v3` header is genuine.
- **v3 OAuth paths confirmed.** `POST /oauth/location-token` and
  `GET /oauth/installed-locations` exist on the live API (return auth errors,
  not 404). The old camelCase paths were removed without deprecation.
- **Ghost endpoints removed.** An earlier hand-written `oauth-tools.ts`
  exposed `/oauth/apps`, `/oauth/api-keys`, `/integrations/connected`, and
  `GET /oauth/location-token`, none of which exist in any published spec and
  all of which return 404 against the live API. They were removed.

### What still needs a real token

The Private Integration Token used for validation had **no scopes granted**,
so every read returned 401 "not authorized for this scope." Before deploying,
run `npm run smoke:ghl-live` with a token that has real scopes (contacts,
calendars, opportunities, etc.) against a location the token owns, to confirm
the full read/write paths return actual data.

## For MCP maintainers

- The coverage scanner reads both `apps/*.json` and `apps/v3/*-v3.json`. Run
  `npm run scan:ghl-api` to refresh all generated artifacts.
- `docs/api-sources.lock.json` is now `schemaVersion: 2` with
  `primaryApiVersion: "v3"`.
- Each generated endpoint entry carries `specTier` (`v2` | `v3` |
  `live-docs`), `accessLevel`, `securitySchemes`, and (when applicable)
  `supersededBy` / `removedInV3`.
- Hand-written tools that call `makeRequest` directly should pass
  `{ version: 'v3' }` for v3 modules and use `assertAccess()` for endpoints
  with strict security schemes. See `src/tools/notes-tools.ts` for the pattern.
- The v3-mode visibility gate hides any endpoint with `supersededBy === 'v3'`
  or in the `V3_REMOVED_PATHS` / `V3_RENAMED_PATHS` lists in the scanner.
