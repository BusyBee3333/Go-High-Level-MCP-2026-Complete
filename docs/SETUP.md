# Setup

Use Node 20+ for both the core server and MCP Apps.

## Standard Setup

```bash
npm install
cp .env.example .env
npm run build
npm run doctor
```

`npm run setup` can create `.env`, build, and print next steps.

## Environment

Required:

```bash
GHL_API_KEY=your_private_integration_api_key
GHL_LOCATION_ID=your_location_id
```

Optional:

```bash
GHL_BASE_URL=https://services.leadconnectorhq.com
GHL_API_VERSION=v3
GHL_API_GENERATION=v3
MCP_SERVER_PORT=8000
OPENAI_API_KEY=your_openai_key_here_optional
```

`GHL_API_VERSION=v3` is the HighLevel API `Version` header — a named version released 2026-06-11, not a date. Most modules use `v3`; ad-publishing keeps `2021-07-28` and Conversations keep `2021-04-15`, routed automatically. Set `GHL_API_GENERATION=v2` to opt into the legacy pre-v3 surface.

## Modes

- No credentials: build, test, list tools, and generate placeholder MCP config.
- Credentials provided: run `npm run auth-check` to verify live GHL access.
- Apps preview: run `npm run apps:setup` and `npm run apps:preview`.
- Production: use `GHL_TOOL_PROFILE=stable` or `curated`.

## Platform Notes

- macOS/Linux: normal npm commands work.
- Windows: use PowerShell or WSL. Quote repo paths that contain spaces.
- Cloud agents: localhost previews may not be visible to the human.

