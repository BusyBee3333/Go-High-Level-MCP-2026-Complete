# Live Smoke Testing

Live smoke tests verify that the MCP server's GHL assumptions still work against a real account. They are read-only by default and intentionally avoid printing account data.

## Command

```sh
npm run smoke:ghl-live
```

The command skips when `GHL_API_KEY` or `GHL_LOCATION_ID` is missing.

## Current Checks

The smoke script performs read-only requests for:

- Location lookup.
- Contact search with `pageLimit=1`.
- User search with `limit=1`.
- Email v3 campaign and template lists.
- Calendars and products.
- Opportunity pipelines and opportunity search.

Only successful HTTP responses pass. Authentication, scope, tenant, server, and network failures fail the run and are summarized by area.

## Policy

- Do not create, update, delete, send, publish, charge, enroll, or trigger live GHL resources in default smoke tests.
- The optional `GHL_LIVE_WRITE_SMOKE=1` path currently adds only a non-mutating `POST /notes/search` check and also requires `GHL_LIVE_SMOKE_CONTACT_ID`.
- Do not run live smoke tests in public CI with real credentials.
- Keep logs to status codes and check names; never print tokens, full response bodies, contacts, messages, invoices, or location data.
- Add new checks only when they cover a high-value MCP area and can be kept read-only.

## Environment

```sh
GHL_API_KEY=...
GHL_LOCATION_ID=...
GHL_BASE_URL=https://services.leadconnectorhq.com
GHL_API_VERSION=v3
GHL_API_GENERATION=v3
GHL_LIVE_SMOKE_TIMEOUT_MS=15000
```
