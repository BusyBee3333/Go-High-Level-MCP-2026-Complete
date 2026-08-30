# Agent Setup Guide

Use this file when an AI/dev agent is setting up the repo for a human.

## Goal

Install, build, validate, and generate MCP client config for the GoHighLevel MCP server without inventing credentials or running unsafe tools.

## Safety Rules

- Do not commit `.env`.
- Do not print full API keys.
- Do not run write/destructive GHL tools unless the human explicitly approves.
- Keep `GHL_API_VERSION=v3` for the current surface. Routing is per endpoint: ad-publishing remains mostly dated; Conversations use `v3` in current mode and `2021-04-15` in legacy v2 mode. Set `GHL_API_GENERATION=v2` for the legacy surface; the starter `v3` value is then replaced by the `2023-02-21` fallback.
- Use `GHL_TOOL_PROFILE=curated` by default.
- Stop and ask the human for missing `GHL_API_KEY`, missing `GHL_LOCATION_ID`, invalid auth, or an unsupported MCP client.

## Minimum Setup

```bash
npm install
cp .env.example .env
npm run build
npm run doctor
npm run agent:check
```

If `.env` already exists, do not overwrite it.

## No-Credentials Mode

If credentials are not available, still run:

```bash
npm run build
npm run doctor -- --json
npm run agent:check -- --skip-tests --no-network --json
npm run configure:codex
```

Report that live auth is blocked until the human supplies credentials.

## Credentials Mode

After the human supplies credentials, update `.env` and run:

```bash
npm run doctor
npm run auth-check
npm run agent:check
```

`auth-check` is read-only.

## Client Config

Generate the config for the requested client:

```bash
npm run configure:codex
npm run configure:claude
npm run configure:cursor
npm run configure:windsurf
```

Use `node scripts/ghl-mcp.mjs configure codex --profile stable` only when the human asks for a production/stable profile. Use `--profile full` only for advanced users.

## Direct CLI

When the agent needs shell access to the same tools, install the local command and use the registry-first workflow:

```bash
npm link
ghl tools --search <concept> --json
ghl describe <exact-tool-name> --json
ghl <exact-tool-name> <arguments> --dry-run --compact
```

Use `--env-file <path>` for a location-specific credential profile. Execute reads only when they are in scope. A write or delete must be authorized and include `--confirm`; the CLI refuses it otherwise. See `docs/CLI.md`.

## Optional Apps Preview

Only if requested:

```bash
npm run apps:setup
npm run apps:preview
```

Report `http://localhost:3001/preview` for local browser use. In cloud agent environments, localhost may not be visible to the human.

## Final Handoff Checklist

Report:

- Node version compatibility.
- Dependency install status.
- `.env` exists and was not committed.
- Build status.
- Test status, if tests were run.
- Doctor status.
- Auth status, if credentials were provided.
- MCP client config generated.
- Direct CLI install and discovery status, when requested.
- Tool profile used.
- Remaining human actions.
- Confirmation that no write/destructive tools were run.
- Confirmation that no full secrets were printed.

## Copy/Paste Prompt

```text
Follow AGENT_SETUP.md and set this repo up for my MCP client using the curated tool profile. Ask me for GHL_API_KEY and GHL_LOCATION_ID if missing. Do not run write or destructive tools. Do not commit secrets. Finish with a short setup report and the MCP config I should use.
```
