# Client Config Generator

The config generator emits MCP client snippets from the server's runtime settings. It generates client-specific JSON without changing server behavior.

```sh
npm run tools:configure
node scripts/ghl-mcp.mjs configure codex
```

## Inputs

Use environment variables already understood by the server:

| Variable | Required | Purpose |
| --- | --- | --- |
| `GHL_API_KEY` | Yes | Bearer token used by the MCP server when calling GHL. |
| `GHL_LOCATION_ID` | Yes | Default location ID supplied to tools that accept `locationId`. |
| `GHL_BASE_URL` | No | Defaults to `https://services.leadconnectorhq.com`. |
| `GHL_API_VERSION` | No | Defaults to `v3` in current mode and `2023-02-21` in legacy v2 mode. |
| `GHL_API_GENERATION` | No | `v3` by default; set `v2` to expose the legacy surface. |
| `GHL_USER_TYPE` | No | `Location` or `Company`; enables access-level preflight when known. |

## Recommended Outputs

### Stdio MCP Client

```json
{
  "mcpServers": {
    "ghl": {
      "command": "node",
      "args": ["/absolute/path/to/Go-High-Level-MCP-2026-Complete/dist/server.js"],
      "env": {
        "GHL_API_KEY": "${GHL_API_KEY}",
        "GHL_LOCATION_ID": "${GHL_LOCATION_ID}",
        "GHL_BASE_URL": "${GHL_BASE_URL}",
        "GHL_API_VERSION": "${GHL_API_VERSION}",
        "GHL_API_GENERATION": "${GHL_API_GENERATION}",
        "GHL_USER_TYPE": "${GHL_USER_TYPE}"
      }
    }
  }
}
```

### HTTP MCP Client

```json
{
  "mcpServers": {
    "go-high-level": {
      "url": "http://localhost:3000/mcp",
      "headers": {
        "Authorization": "Bearer ${GHL_API_KEY}",
        "X-GHL-Location-ID": "${GHL_LOCATION_ID}"
      }
    }
  }
}
```

## Generator Rules

- Never write secrets into committed files.
- Prefer absolute paths in generated stdio configs.
- Preserve `GHL_API_VERSION` even when using the default so client behavior is explicit.
- Preserve `GHL_API_GENERATION` and a valid configured `GHL_USER_TYPE`.
- Emit one named server entry, `ghl`, unless the caller asks for multiple locations.
- For multiple locations, generate one MCP server entry per location and suffix names predictably, such as `ghl-main` and `ghl-client-a`.

## Validation

After generating config, run:

```sh
npm run build
npm run start:stdio
```

For HTTP clients, also run `npm run start:http` and inspect the local tool listing before handing the config to users.
