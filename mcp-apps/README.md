# GoHighLevel MCP Apps

Companion MCP Apps for the GoHighLevel MCP server. This package keeps interactive UI resources separate from the core MCP server so the API/tool runtime stays lean.

## Apps

- `show_ghl_tool_explorer_app` - browse/filter the generated MCP tool inventory.
- `show_ghl_contact_360_app` - contact lookup workspace with related conversations and opportunities.
- `show_ghl_pipeline_command_app` - pipeline and opportunity review workspace.
- `show_ghl_ads_reporting_app` - ads and attribution reporting workspace.
- `show_ghl_agency_health_app` - location setup and operations health overview.

All apps are registered as MCP tools linked to the shared `ui://ghl-mcp-apps/app.html` resource.

## Setup

From the repo root:

```bash
npm run build
npm run apps:install
npm run apps:build
```

MCP Apps use `@modelcontextprotocol/ext-apps`, which requires Node 20+.

Optional live data:

```bash
GHL_API_KEY=your_private_integration_api_key
GHL_LOCATION_ID=your_location_id
GHL_BASE_URL=https://services.leadconnectorhq.com
GHL_API_VERSION=2021-07-28
```

Without GHL credentials, the Tool Explorer app still works from `docs/tool-inventory.json`; live GHL data panels show a credentials-needed state.

## Run

Stdio:

```bash
npm run apps:start:stdio
```

Streamable HTTP:

```bash
npm run apps:start:http
```

HTTP endpoint:

```text
http://localhost:3001/mcp
```

Browser preview:

```text
http://localhost:3001/preview
http://localhost:3001/preview?app=contact-360
http://localhost:3001/preview?app=pipeline-command
http://localhost:3001/preview?app=ads-reporting
http://localhost:3001/preview?app=agency-health
```

The preview route is for local visual testing in a normal browser. Real MCP hosts still open the app through the MCP tool/resource flow.

## Client Config

Example stdio entry:

```json
{
  "mcpServers": {
    "ghl-apps": {
      "command": "node",
      "args": ["/absolute/path/to/Go-High-Level-MCP-2026-Complete/mcp-apps/dist/main.js"],
      "env": {
        "GHL_API_KEY": "your_private_integration_api_key",
        "GHL_LOCATION_ID": "your_location_id",
        "GHL_BASE_URL": "https://services.leadconnectorhq.com",
        "GHL_API_VERSION": "2021-07-28"
      }
    }
  }
}
```

Use this alongside the main `ghl` MCP server entry when a host supports MCP Apps/resources.
