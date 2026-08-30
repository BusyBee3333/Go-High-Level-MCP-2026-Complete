# GoHighLevel CLI

The `ghl` command exposes the same dynamic tool registry as the MCP server. It does not maintain a second endpoint list: when generated or hand-written MCP tools change, CLI discovery, schemas, and execution change with them.

The full v3 registry currently contains more than 900 tools. Use discovery instead of guessing names or arguments.

## Install locally

```bash
npm install
npm run build
npm link
ghl version
```

`npm link` installs both `ghl` and the backward-compatible `ghl-mcp` command from the current checkout.

## Configure a profile

The CLI reads the repository `.env` by default. You can bind a command to a separate, permission-restricted profile without changing the repository:

```bash
chmod 600 ~/.config/ghl/my-location.env
ghl doctor --env-file ~/.config/ghl/my-location.env --json
```

```dotenv
GHL_API_KEY=your_private_integration_token
GHL_LOCATION_ID=your_location_id
GHL_BASE_URL=https://services.leadconnectorhq.com
GHL_API_VERSION=v3
GHL_API_GENERATION=v3
```

You can also set `GHL_ENV_FILE` once in a wrapper or shell profile. An explicit `--env-file` or `GHL_ENV_FILE` is authoritative for that invocation, which helps prevent credentials from one GHL location being reused with another location by accident.

Never commit a credential profile. Prefer mode `0600`, and do not pass tokens as command-line arguments because shell history can retain them.

## Discover tools

```bash
ghl tools --profile full
ghl tools --search contacts --json
ghl tools --category opportunities --access read
ghl tools --stability official --names-only
ghl describe get_contact --json
```

Profiles match the MCP server:

- `curated`: high-level agent workflows.
- `stable`: curated, official, supplemental, and legacy-compatible tools.
- `full`: every visible tool in the selected API generation.
- `official`: official OpenAPI and live-docs supplemental tools.
- `raw`: endpoint-level tools without curated workspace tools.

The CLI defaults to `full` unless `GHL_TOOL_PROFILE` or `--profile` selects another profile.

## Call any tool

Use the exact MCP tool name as a direct command or after `call`:

```bash
ghl get_contact --contact-id CONTACT_ID
ghl call get_contact --input '{"contactId":"CONTACT_ID"}'
```

Tool input can come from any of these sources:

```bash
# Schema-aware flags. Kebab case maps to the schema's camelCase property.
ghl search_contacts --query Jane --limit 25

# One JSON object.
ghl call get_contact --input '{"contactId":"CONTACT_ID"}'

# JSON file or @file shorthand.
ghl call update_contact --input-file ./update.json --dry-run
ghl call update_contact @update.json --dry-run

# Standard input.
printf '%s' '{"contactId":"CONTACT_ID"}' | ghl call get_contact --stdin

# Nested overrides. Values are parsed as JSON when possible.
ghl call create_contact \
  --input '{"email":"jane@example.com"}' \
  --set 'customFields[0].key="source"' \
  --set 'customFields[0].value="website"' \
  --dry-run
```

Repeated flags accumulate when the schema property is an array:

```bash
ghl create_contact \
  --email jane@example.com \
  --tags lead \
  --tags website \
  --dry-run
```

The CLI validates required arguments before contacting GHL. `GHL_LOCATION_ID` is automatically supplied when a tool schema has a `locationId` property and the caller did not provide it.

## Safety model

Read-only tools run without a confirmation flag. Every write or delete tool is refused unless the same invocation includes `--confirm`.

```bash
# Resolves and validates arguments but never contacts GHL.
ghl create_contact --email jane@example.com --dry-run

# Performs the write.
ghl create_contact --email jane@example.com --confirm
```

`--dry-run` never requires credentials or `--confirm`. It prints the resolved arguments, access classification, destructive classification, and whether live execution would require confirmation.

The confirmation gate is CLI-local defense in depth. It does not replace GHL token scopes, account permissions, canary testing, or application-specific approval requirements.

## Output and exit behavior

Tool calls emit a JSON envelope by default:

```json
{
  "ok": true,
  "tool": "get_contact",
  "access": "read",
  "destructive": false,
  "result": {}
}
```

Useful output flags:

- `--compact`: one-line JSON for logs and shell pipelines.
- `--result-only`: emit only the underlying tool result.
- `--json`: explicitly request JSON on commands that also support human-readable output, such as `tools`, `describe`, and `doctor`.

Validation, configuration, transport, and GHL API errors exit nonzero. Tool-call errors are emitted as a redacted JSON error envelope.

## Interactive shell

Run `ghl` in an interactive terminal, or run `ghl shell`, to keep a simple command prompt open:

```text
ghl> tools --search calendar
ghl> describe get_contact
ghl> get_contact --contact-id CONTACT_ID
ghl> exit
```

Each shell line executes through the same isolated one-shot CLI path, including environment loading and confirmation checks.

## Agent workflow

A dependable agent sequence is:

1. Search with `ghl tools --search <concept> --json`.
2. Inspect the exact schema with `ghl describe <tool> --json`.
3. Resolve the call with `--dry-run --compact`.
4. Execute reads directly.
5. For writes, inspect the dry-run and add `--confirm` only when the write is authorized.

The legacy commands remain available:

- `ghl-mcp list-tools` aliases discovery.
- `ghl-mcp test-tool <name> '<json>'` aliases execution and emits the underlying result for compatibility.
