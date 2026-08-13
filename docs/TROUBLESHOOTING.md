# Troubleshooting

## Missing GHL_API_KEY

Run:

```bash
cp .env.example .env
```

Then add `GHL_API_KEY` to `.env`.

## Missing GHL_LOCATION_ID

Add the HighLevel sub-account Location ID to `.env`.

## Wrong API Version

Keep:

```bash
GHL_API_VERSION=v3
```

This is the HighLevel API `Version` header — a named version released 2026-06-11, not a date. Most modules use `v3`; ad-publishing and Conversations keep their own dated headers, routed automatically.

## Build Output Missing

```bash
npm run build
```

## Client Does Not Show Tools

- Confirm MCP config uses an absolute path to `dist/server.js`.
- Confirm `npm run build` passes.
- Start with `GHL_TOOL_PROFILE=curated`.
- Restart the MCP client after changing config.

## Bad Token Or Location

```bash
npm run auth-check
```

If it fails, verify the token has access to the target location.

## Port Conflict

Set:

```bash
MCP_SERVER_PORT=8010
GHL_MCP_APPS_PORT=3002
```

## Repo Path With Spaces

Generated MCP config uses absolute paths. If manually running shell commands, quote paths.

