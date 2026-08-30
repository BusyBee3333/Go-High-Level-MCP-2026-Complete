# Quickstart

This is the shortest safe path from clone to a working GoHighLevel MCP server.

## Requirements

- Node 20 or newer.
- A HighLevel private integration token or OAuth access token.
- A HighLevel sub-account Location ID.

If your repo path contains spaces or apostrophes, quote paths in shell commands. Generated MCP config uses absolute paths automatically.

## Install

```bash
npm install
cp .env.example .env
npm run build
npm run doctor
```

Expected result: `doctor` should pass Node, package, build output, and coverage checks. If credentials are missing, it reports `needsHumanAction` and tells you to edit `.env`.

## Credentials

Set these in `.env`:

```bash
GHL_API_KEY=your_private_integration_api_key
GHL_LOCATION_ID=your_location_id
GHL_BASE_URL=https://services.leadconnectorhq.com
GHL_API_VERSION=v3
GHL_API_GENERATION=v3
```

`GHL_API_VERSION=v3` is the current named HighLevel API `Version` header. The MCP routes exceptions per endpoint: ad-publishing remains mostly dated; Conversations use `v3` in current mode and `2021-04-15` in legacy v2 mode. Set `GHL_API_GENERATION=v2` for the legacy surface; the starter `v3` value is then replaced by the `2023-02-21` fallback.

Where to find values:

- API key: HighLevel private integrations or OAuth app credentials.
- Location ID: the HighLevel sub-account/location settings or URL/context for the location you want the server to operate on.

Then run:

```bash
npm run auth-check
```

## Configure A Client

Use the curated profile first:

```bash
npm run configure:codex
npm run configure:claude
npm run configure:cursor
npm run configure:windsurf
```

Paste the JSON into your MCP client config.

## Try The Server

```bash
npm run start:stdio
```

For HTTP inspection:

```bash
npm run start:http
curl http://localhost:8000/health
curl http://localhost:8000/tools
```

## Try The CLI

```bash
npm link
ghl tools --search contacts --json
ghl describe get_contact --json
ghl get_contact --contact-id CONTACT_ID --dry-run
```

The CLI exposes the same registry as MCP. Reads can run directly; every write/delete invocation requires `--confirm`. See [`docs/CLI.md`](docs/CLI.md).

## Optional Apps Preview

```bash
npm run apps:setup
npm run apps:preview
```

Open `http://localhost:3001/preview`.
