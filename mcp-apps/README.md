# GoHighLevel MCP Apps

Companion MCP Apps for the GoHighLevel MCP server. This package keeps interactive UI resources separate from the core MCP server so the API/tool runtime stays lean.

## Apps

- `show_ghl_tool_explorer_app` - browse/filter the generated MCP tool inventory.
- `show_ghl_contact_workspace_app` - full CRM contact form with notes, tags, tasks, messages, appointments, and opportunities.
- `show_ghl_lead_intake_app` - form submissions, uncontacted leads, duplicate checks, qualification, and workflow enrollment.
- `show_ghl_conversation_inbox_app` - SMS/email inbox with thread context and reply composer.
- `show_ghl_pipeline_board_app` - sales pipeline board, opportunity form, stale deal queue, and next actions.
- `show_ghl_appointment_desk_app` - calendars, free slots, booking, reschedule, resources, and appointment notes.
- `show_ghl_automation_launcher_app` - campaigns, workflows, scheduled messages, and contact enrollment.
- `show_ghl_reputation_center_app` - reviews inbox, reply composer, review requests, links, and stats.
- `show_ghl_ads_dashboard_app` - ads, attribution, funnels, conversions, and revenue reporting.
- `show_ghl_billing_commerce_app` - invoices, estimates, orders, transactions, subscriptions, coupons, and products.
- `show_ghl_agency_admin_app` - locations, users, snapshots, phone, media, setup health, and rollout controls.

Legacy aliases from the first prototype still work: `show_ghl_contact_360_app`, `show_ghl_pipeline_command_app`, `show_ghl_ads_reporting_app`, and `show_ghl_agency_health_app`.

All apps are registered as MCP tools linked to the shared `ui://ghl-mcp-apps/app.html` resource.

The app actions now point at the main server's curated CRM workflow tools where possible. Those tools stage confirmation queues for writes, so the UI can ask an agent to prepare a lead intake, appointment booking, review reply, invoice, or snapshot rollout without immediately mutating GHL data.

## Setup

From the repo root:

```bash
npm run build
npm run apps:setup
```

MCP Apps use `@modelcontextprotocol/ext-apps`, which requires Node 20+.

Optional live data:

```bash
GHL_API_KEY=your_private_integration_api_key
GHL_LOCATION_ID=your_location_id
GHL_BASE_URL=https://services.leadconnectorhq.com
GHL_API_VERSION=v3
GHL_API_GENERATION=v3
# GHL_USER_TYPE=Location # or Company; optional access preflight
```

`GHL_API_VERSION=v3` selects the current named HighLevel API version. Routing is per endpoint: ad-publishing remains mostly dated; Conversations use `v3` in current mode and `2021-04-15` in legacy v2 mode. Set `GHL_API_GENERATION=v2` for the legacy surface; the starter `v3` value is then replaced by the `2023-02-21` fallback.

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
http://localhost:3001/preview?app=contact-workspace
http://localhost:3001/preview?app=lead-intake
http://localhost:3001/preview?app=conversation-inbox
http://localhost:3001/preview?app=pipeline-board
http://localhost:3001/preview?app=appointment-desk
http://localhost:3001/preview?app=automation-launcher
http://localhost:3001/preview?app=reputation-center
http://localhost:3001/preview?app=ads-dashboard
http://localhost:3001/preview?app=billing-commerce
http://localhost:3001/preview?app=agency-admin
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
        "GHL_API_VERSION": "v3",
        "GHL_API_GENERATION": "v3"
      }
    }
  }
}
```

Use this alongside the main `ghl` MCP server entry when a host supports MCP Apps/resources.

For agent-first usage, run the main MCP server with `GHL_TOOL_PROFILE=curated` so the host sees the 32 high-level workflow tools instead of the full raw endpoint catalog.
