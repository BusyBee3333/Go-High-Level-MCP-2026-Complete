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
GHL_API_GENERATION=v3
GHL_API_VERSION=v3
```

This selects the current named HighLevel API version. The MCP still routes endpoint-specific exceptions: ad-publishing remains mostly on `2021-07-28`; Conversations use `v3` in current mode and `2021-04-15` in legacy v2 mode.

For the legacy surface, use:

```bash
GHL_API_GENERATION=v2
GHL_API_VERSION=2023-02-21
```

Setting only `GHL_API_GENERATION=v2` is also sufficient: v2 mode replaces the starter `GHL_API_VERSION=v3` value with the `2023-02-21` fallback.

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
