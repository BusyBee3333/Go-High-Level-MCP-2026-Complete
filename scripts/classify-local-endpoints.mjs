#!/usr/bin/env node

import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(__dirname, '..');
const coveragePath = join(repoRoot, 'docs', 'ghl-api-coverage.json');
const outPath = join(repoRoot, 'docs', 'GHL-LOCAL-ENDPOINT-CLASSIFICATION.md');
const coverage = JSON.parse(readFileSync(coveragePath, 'utf8'));

const buckets = {
  officialScannerMissed: [],
  liveDocsSupplemental: [],
  legacyStillUseful: [],
  privateInternalUnstable: [],
  deprecatedOrAliased: [],
  needsReview: [],
};

for (const endpoint of coverage.comparison.localOnly) {
  if (isLiveDocsSupplemental(endpoint)) buckets.liveDocsSupplemental.push(endpoint);
  else if (endpoint.path.startsWith('/notes')) buckets.legacyStillUseful.push(endpoint);
  else if (isDeprecatedOrAliased(endpoint)) buckets.deprecatedOrAliased.push(endpoint);
  else if (isPrivateOrInternal(endpoint)) buckets.privateInternalUnstable.push(endpoint);
  else if (isLegacyStillUseful(endpoint)) buckets.legacyStillUseful.push(endpoint);
  else if (isLikelyScannerMissed(endpoint)) buckets.officialScannerMissed.push(endpoint);
  else buckets.needsReview.push(endpoint);
}

const report = `# GHL Local-Only Endpoint Classification

Generated from \`docs/ghl-api-coverage.json\`.

This report heuristically groups every endpoint reference in \`comparison.localOnly\`, which is relative to the current/default v3 surface. A current-v3 local-only reference is not automatically wrong or unofficial: it may be a known legacy v2 endpoint, a live-docs compatibility supplement, a wrapper, or a private/internal route. Treat these categories as triage signals, not verification or removal decisions.

## Summary

- Current-v3 local-only endpoint references: ${coverage.comparison.localOnly.length}
- Official but scanner-missed candidates: ${buckets.officialScannerMissed.length}
- Known legacy v2 live-docs supplements: ${buckets.liveDocsSupplemental.length}
- Legacy but still useful: ${buckets.legacyStillUseful.length}
- Private/internal and unstable: ${buckets.privateInternalUnstable.length}
- Deprecated or compatibility aliases: ${buckets.deprecatedOrAliased.length}
- Needs manual review: ${buckets.needsReview.length}

## Official But Scanner-Missed Candidates

These are pattern-based candidates only. Check them against current live docs before treating them as official or promoting them into the current-v3 supplemental list.

${format(buckets.officialScannerMissed)}

## Known Legacy V2 Live-Docs Supplements

These Email V2 routes are already tracked as legacy live-docs supplements for \`GHL_API_GENERATION=v2\`. They remain local-only relative to the current-v3 surface by design; their presence here does not mean the scanner missed them.

${format(buckets.liveDocsSupplemental)}

## Legacy But Still Useful

These are heuristic compatibility candidates. Verify actual availability and usage before retaining them, and make the stability profile clear for any route that remains exposed.

${format(buckets.legacyStillUseful)}

## Private/Internal And Unstable

These should remain opt-in or clearly labeled because they appear private, internal, marketplace-specific, or less stable than public REST APIs.

${format(buckets.privateInternalUnstable)}

## Deprecated Or Compatibility Aliases

These should be preserved only as aliases/wrappers where useful, with newer official endpoints preferred in docs and examples.

${format(buckets.deprecatedOrAliased)}

## Needs Manual Review

${format(buckets.needsReview)}
`;

mkdirSync(dirname(outPath), { recursive: true });
writeFileSync(outPath, report);
console.log(`Wrote ${outPath}`);

function format(items) {
  if (!items.length) return '- None';
  return items.map((item) => `- \`${item.method} ${item.path}\` (${item.sourceFile})`).join('\n');
}

function isLiveDocsSupplemental(endpoint) {
  return /^\/emails\/public\/v2\//.test(endpoint.path);
}

function isDeprecatedOrAliased(endpoint) {
  return /\/campaigns|\/emails\/schedule|\/emails\/builder|\/contacts\/[^/]+\/campaigns|scheduled-messages/i.test(endpoint.path);
}

function isPrivateOrInternal(endpoint) {
  return /oauth|login|firebase|integrations|internal|marketplace|social-media-posting|saas|snapshots|phone|voice-ai|proposals|custom-menus/i.test(endpoint.path);
}

function isLegacyStillUseful(endpoint) {
  return /\/notes|workflow|trigger|affiliates|reporting|courses|templates|smartlists|reputation|webhooks|forms|funnels|companies|links/i.test(endpoint.path);
}

function isLikelyScannerMissed(endpoint) {
  return /[{}]|\{param\}/.test(endpoint.path);
}
