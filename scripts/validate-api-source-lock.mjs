#!/usr/bin/env node

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(__dirname, '..');
const lockPath = join(repoRoot, 'docs', 'api-sources.lock.json');
const coveragePath = join(repoRoot, 'docs', 'ghl-api-coverage.json');

const lock = JSON.parse(readFileSync(lockPath, 'utf8'));
const coverage = JSON.parse(readFileSync(coveragePath, 'utf8'));
const failures = [];

// schemaVersion 1 = v2-only lock (pre-v3). schemaVersion 2 = v3-aware lock.
check(lock.schemaVersion === 2, 'api source lock schemaVersion must be 2 (v3-aware)');
// v3 is the canonical named version; v2-mode still works via GHL_API_GENERATION=v2.
check(lock.primaryApiVersion === 'v3', 'primary API version must be the named v3 version');
check(lock.apiGenerationDefault === 'v3', 'api generation default must be v3');
check(lock.officialDocs?.repo === coverage.official?.repo, 'official docs repo mismatch');
check(lock.officialDocs?.commit === coverage.official?.commit, 'official docs commit mismatch');
check(lock.officialDocs?.tag === coverage.official?.tag, 'official docs tag mismatch');
check(lock.officialDocs?.expectedEndpointReferences === coverage.official?.endpoints?.length, 'official endpoint reference count mismatch');
check(lock.officialDocs?.expectedUniqueEndpoints === coverage.comparison?.officialUniqueCount, 'official unique endpoint count mismatch');
check(lock.acceptance?.expectedMissingOfficialEndpoints === coverage.comparison?.missingOfficial?.length, 'missing official endpoint count mismatch');
check(lock.acceptance?.expectedCoveragePercent === coverage.comparison?.coveragePercent, 'coverage percent mismatch');

const supplemental = coverage.official.endpoints.filter((endpoint) => endpoint.sourceFile?.startsWith('live-docs:'));
check(lock.liveDocsSupplemental?.expectedEndpointReferences === supplemental.length, 'live-docs supplemental count mismatch');

const lockedSupplemental = new Set((lock.liveDocsSupplemental?.endpoints || []).map(endpointKey));
const actualSupplemental = new Set(supplemental.map(endpointKey));
check(setsEqual(lockedSupplemental, actualSupplemental), 'live-docs supplemental endpoint set mismatch');

if (failures.length) {
  console.error('API source lock validation failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('API source lock is consistent with coverage artifacts.');

function check(condition, message) {
  if (!condition) failures.push(message);
}

function endpointKey(endpoint) {
  return `${endpoint.method} ${endpoint.path}`;
}

function setsEqual(a, b) {
  if (a.size !== b.size) return false;
  for (const item of a) {
    if (!b.has(item)) return false;
  }
  return true;
}
