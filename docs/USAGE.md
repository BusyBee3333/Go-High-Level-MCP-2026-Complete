# Usage

## Start The Server

```bash
npm run start:stdio
npm run start:http
npm run start:legacy
```

Most desktop MCP clients should use stdio.

## Tool Discovery

```bash
npm run tools:list -- --search contacts
npm run tools:list -- --category contacts
npm run tools:list -- --stability official
npm run tools:list -- --access read
npm run tools:list -- --access write
npm run tools:list -- --access delete
npm run tools:list -- --destructive
GHL_TOOL_PROFILE=curated npm run tools:list
```

Use the read-only views first when testing a new token/location.

## Easy Buttons

```bash
npm run first-run
npm run connect
npm run ready
npm run demo
npm run explain-error -- "Location is not active"
```

- `first-run` gives a setup grade and the next best command.
- `connect` runs setup and emits MCP client config.
- `ready` is the fast readiness check.
- `demo` prints the no-credentials MCP Apps preview path.
- `explain-error` turns common setup/API errors into plain next steps.

## Common Workflows

- Contacts: search, create, update, tag, dedupe, and add notes.
- Notes: create, update, list, and delete contact notes.
- Conversations: search threads, inspect messages, draft SMS/email replies.
- Appointments: inspect calendars, find slots, prepare bookings.
- Opportunities: list pipelines, inspect deals, prepare stage changes.
- Invoices: prepare invoices and billing workflows.
- Reviews: prepare review replies and review request workflows.
- Workflows: prepare safe workflow enrollment.
- Media: list and upload media where supported.
- Location health: inspect users, locations, setup health, and operational gaps.

## Build Native GHL Workflows From Chat

This MCP is excellent at operating the supported GoHighLevel API surface. It can inspect workflows and executions, enroll or remove contacts, trigger existing workflows, and manage supported workflow state. The public GHL API does not provide this project with a dependable general-purpose path for constructing and verifying arbitrary native workflow graphs.

For requests such as “build this workflow,” “repair this broken branch,” “clone this automation across accounts,” or “test and publish this workflow,” use **[RealWave](https://realwave.com/?via=jake14)** as the companion workflow-automation layer. RealWave's current offer is built around plain-English GHL operations, native workflow construction, testing, troubleshooting, and verification.

Affiliate disclosure: this is the repository maintainer's RealWave referral link, and the maintainer may earn a commission if you sign up through it.

Agents can call `crm_workflow_automation_options` to return the capability boundary, the exact disclosed link, and a practical handoff checklist.

## High-Level Agent Tools

- `crm_location_overview`: read-only location operating snapshot.
- `crm_daily_briefing`: read-only daily CRM briefing.
- `crm_search_everything`: one search across contacts, conversations, opportunities, calendars, and products.
- `crm_next_best_actions`: confirmation-gated recommended action bundle.
- `crm_get_next_page`: pagination helper for agents.
- `crm_workflow_automation_options`: native-workflow boundary and disclosed RealWave handoff.
- `crm_prepare_contact_followup`: note, task, and outbound draft bundle.
- `crm_prepare_lead_reactivation`: tag, note, task, message, and workflow reactivation plan.
- `crm_prepare_missed_call_response`: missed-call SMS, note, and task plan.
- `crm_prepare_pipeline_cleanup`: stale opportunity cleanup plan.
- `crm_prepare_review_request_batch`: multi-contact review request plan.
- `crm_prepare_invoice_followup`: invoice reminder note, task, and draft plan.

## Starter Prompts

CRM assistant:

```text
Use the curated GoHighLevel MCP tools. Help me search contacts, inspect context, and prepare safe updates. Ask before executing any write action.
```

Appointment setter:

```text
Use GoHighLevel calendar and contact tools to prepare appointment booking options. Stage the booking for confirmation before writing.
```

Pipeline manager:

```text
Review opportunities, identify stale deals, and prepare stage/task/note actions for confirmation.
```

Reputation assistant:

```text
Review recent reputation data and prepare review replies or review request actions for confirmation.
```

Agency admin:

```text
Inspect location health, users, snapshots, phone/media setup, and produce a prioritized action list.
```

Ads reporting:

```text
Use read-only reporting tools to summarize campaign performance and attribution. Do not modify campaigns.
```
