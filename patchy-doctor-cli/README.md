# Patchy Doctor CLI

Local read-only CLI for the flow we want:

1. Read local GoHighLevel evidence.
2. Build a PatchyHub-style account map and risk digest.
3. Recommend the Doctor sequence from the findings.
4. Write JSON, Markdown, and HTML reports for approval.

This does not write to GHL. It does not call Supabase. It is the local bridge until a real PatchyHub workspace/system import is connected.

## Run Burton

From the repo root:

```sh
node patchy-doctor-cli/bin/patchy-doctor.mjs run --account burton --location-id DZEpRd43MxUJKdtrev9t --evidence tmp/patchy-live-burton --out tmp/patchy-doctor
```

Or from this folder:

```sh
npm run analyze:burton
```

Outputs:

- `patchy-brain-map.json`
- `patchy-doctor-plan.md`
- `patchy-doctor-dashboard.html`

## What It Uses

For Burton, it reads these files when present:

- `burton-live-inventory-readonly.json`
- `burton-internal-workflow-audit.json`
- `burton-tag-truth-analysis.json`
- `burton-optimized-account-doctor-plan.json`
- `burton-account-cleanup-action-report.json`
- `burton-conversation-evidence-rollup-full.json`

Missing files become warnings, not crashes.

## Current Role

This is not the full PatchyHub app. The real PatchyHub loop is database-backed: Browser Connect import, Brain workers, MCP map digest, intent claims, and verification. This CLI mimics the decision layer locally so chat can say: “run the account through Patchy, then tell the Doctors what to do.”

## Commands

Collect live read-only evidence:

```sh
node patchy-doctor-cli/bin/patchy-doctor.mjs collect --location-id DZEpRd43MxUJKdtrev9t --evidence tmp/patchy-live-burton
```

Analyze already-collected evidence:

```sh
node patchy-doctor-cli/bin/patchy-doctor.mjs analyze --account burton --input tmp/patchy-live-burton --out tmp/patchy-doctor
```

Collect and analyze in one command:

```sh
node patchy-doctor-cli/bin/patchy-doctor.mjs run --account burton --location-id DZEpRd43MxUJKdtrev9t --evidence tmp/patchy-live-burton --out tmp/patchy-doctor
```

Full message export is opt-in:

```sh
node patchy-doctor-cli/bin/patchy-doctor.mjs collect --location-id DZEpRd43MxUJKdtrev9t --evidence tmp/patchy-live-burton --include-messages --max-message-pages 250
```

## Auth Bootstrap

If the saved GHL refresh token has expired, grab the active-tab auth blob from GHL:

```js
localStorage.getItem('a')
```

Then save and rotate it:

```sh
node patchy-doctor-cli/bin/patchy-doctor.mjs bootstrap-auth --auth-blob-file tmp/ghl-auth-blob.txt
```

You can also pass a refresh token directly:

```sh
node patchy-doctor-cli/bin/patchy-doctor.mjs bootstrap-auth --refresh-token '<refreshJwt>'
```
