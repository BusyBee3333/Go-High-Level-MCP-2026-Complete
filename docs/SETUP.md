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
# GHL_USER_TYPE=Location # or Company; optional access preflight
MCP_SERVER_PORT=8000
OPENAI_API_KEY=your_openai_key_here_optional
```

`GHL_API_VERSION=v3` selects the current named HighLevel API version. The MCP routes endpoint exceptions automatically: ad-publishing remains mostly on `2021-07-28`; Conversations use `v3` in current mode and `2021-04-15` in legacy v2 mode. Set `GHL_API_GENERATION=v2` for the legacy surface; the starter `v3` value is then replaced by the `2023-02-21` fallback.

## Modes

- No credentials: build, test, list tools, and generate placeholder MCP config.
- Credentials provided: run `npm run auth-check` to verify live GHL access.
- Apps preview: run `npm run apps:setup` and `npm run apps:preview`.
- Production: use `GHL_TOOL_PROFILE=stable` or `curated`.

## Platform Notes

- macOS/Linux: normal npm commands work.
- Windows: use PowerShell or WSL. Quote repo paths that contain spaces.
- Cloud agents: localhost previews may not be visible to the human.
