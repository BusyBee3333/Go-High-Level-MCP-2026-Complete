#!/usr/bin/env node

import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(__dirname, '..');
const docsRepoUrl = 'https://github.com/GoHighLevel/highlevel-api-docs.git';
const defaultDocsDir = join(repoRoot, 'tmp', 'highlevel-api-docs');
const defaultReportPath = join(repoRoot, 'docs', 'GHL-API-COVERAGE-REPORT.md');
const defaultJsonPath = join(repoRoot, 'docs', 'ghl-api-coverage.json');
const defaultLockPath = join(repoRoot, 'docs', 'api-sources.lock.json');
const sourceVerifiedDate = '2026-08-12';
/** The current canonical GHL API version (named, released 2026-06-11). */
const PRIMARY_API_VERSION = 'v3';
const httpMethods = new Set(['get', 'post', 'put', 'patch', 'delete']);

/**
 * Canonical app-name aliases. The v2 and v3 OpenAPI specs sometimes use
 * different app names for the same product (e.g. `ad-manager` in apps/ vs
 * `ad-publishing` in apps/v3/; `social-media-posting` vs `social-planner`;
 * `saas-api` vs `saas`). Mapping these to a single canonical name lets the
 * supersession logic recognize that a v2 endpoint and a v3 endpoint describe
 * the same operation, so the v2 duplicate can be hidden in v3 mode.
 */
const APP_NAME_ALIASES = {
  'ad-manager': 'ad-publishing',
  'saas-api': 'saas',
  // NOTE: social-media-posting is NOT aliased to social-planner. The v3 spec
  // keeps the /social-media-posting/oauth/* paths unchanged, so those are
  // genuinely current endpoints, not renames.
};
function canonicalApp(app) {
  return APP_NAME_ALIASES[app] || app;
}

/**
 * Endpoints removed in v3 (per the 2026-06-11 changelog) that have NO v3
 * replacement at the same path. These are flagged removedInV3 so the registry
 * hides them in v3 mode (they're retained for v2/legacy compatibility).
 * Path renames are expressed as [from, to] pairs so the old path is treated
 * as superseded by the new path.
 */
const V3_REMOVED_PATHS = new Set([
  'GET /contacts/',
  'GET /users/',
]);
const V3_RENAMED_PATHS = [
  // [method, oldPath, newPath] — old path is superseded by the new one in v3.
  ['DELETE', '/contacts/{contactId}/campaigns/removeAll', '/contacts/{contactId}/campaigns/remove-all'],
  ['POST', '/oauth/locationToken', '/oauth/location-token'],
  ['GET', '/oauth/locationToken', '/oauth/location-token'],
  ['GET', '/oauth/installedLocations', '/oauth/installed-locations'],
  // v3 dropped the -v2 suffix on the facebook ads upsert endpoint.
  ['PUT', '/ad-publishing/facebook/ads-v2', '/ad-publishing/facebook/ads'],
];

/**
 * Corrections backed by evidence elsewhere in the same locked official docs
 * snapshot. Keep these explicit and machine-readable instead of silently
 * mutating generated schemas.
 *
 * The canonical v3 SaaS route accidentally marks all three query parameters
 * required, while its deprecated alias in the same spec contains the corrected
 * contract: companyId is required and the two Stripe identifiers are optional.
 */
const OFFICIAL_SPEC_CORRECTIONS = new Map([
  [
    'apps/v3/saas-v3.json GET /saas/locations',
    {
      queryParamRequired: {
        customerId: false,
        subscriptionId: false,
        companyId: true,
      },
      evidence: 'apps/v3/saas-v3.json GET /saas-api/public-api/locations',
      reason: 'The equivalent route in the same locked v3 spec reflects the corrected optional Stripe identifier contract.',
    },
  ],
]);

// Live-docs supplemental endpoints: these are documented on the GHL docs site
// but have not yet been published into the OpenAPI spec files in the docs repo.
// Removed Email Campaign V2 routes remain part of the promised v2 compatibility
// surface. They are modeled explicitly as v2-only below so they can never leak
// into the generated v3 registry.
const legacyEmailV2SupplementalEndpoints = [
  ['POST', '/emails/public/v2/locations/{locationId}/campaigns/email-campaign', 'create-email-campaign-v2', 'Create Email Campaign V2', 'create-email-campaign-v-2'],
  ['GET', '/emails/public/v2/locations/{locationId}/campaigns/emails', 'list-email-campaigns-v2', 'List Email Campaigns V2', 'list-email-campaigns-v-2'],
  ['PATCH', '/emails/public/v2/locations/{locationId}/campaigns/{campaignId}', 'update-email-campaign-v2', 'Update Email Campaign V2', 'update-email-campaign-v-2'],
  ['DELETE', '/emails/public/v2/locations/{locationId}/campaigns/{campaignId}', 'delete-email-campaign-v2', 'Delete Email Campaign V2', 'delete-campaign-v-2'],
  ['GET', '/emails/public/v2/locations/{locationId}/campaigns/workflows', 'list-workflow-campaigns-v2', 'List Workflow Campaigns V2', 'list-workflow-campaigns-v-2'],
  ['GET', '/emails/public/v2/locations/{locationId}/campaigns/bulk-actions', 'list-bulk-action-campaigns-v2', 'List Bulk Action Campaigns V2', 'list-bulk-action-campaigns-v-2'],
  ['POST', '/emails/public/v2/locations/{locationId}/campaigns/{campaignId}/schedule', 'schedule-email-campaign-v2', 'Schedule Campaign V2', 'schedule-campaign-v-2'],
  ['POST', '/emails/public/v2/locations/{locationId}/templates', 'create-email-template-v2', 'Create Email Template V2', 'create-email-template-v-2'],
  ['GET', '/emails/public/v2/locations/{locationId}/templates', 'list-email-templates-v2', 'List Email Templates V2', 'list-email-templates-v-2'],
  ['POST', '/emails/public/v2/locations/{locationId}/templates/import', 'import-email-template-v2', 'Import Email Template V2', 'import-email-template-v-2'],
  ['POST', '/emails/public/v2/locations/{locationId}/templates/folders', 'create-template-folder-v2', 'Create Email Template Folder V2', 'create-template-folder-v-2'],
  ['DELETE', '/emails/public/v2/locations/{locationId}/templates/{templateId}', 'delete-email-template-v2', 'Delete Email Template V2', 'delete-email-template-v-2'],
  ['PATCH', '/emails/public/v2/locations/{locationId}/templates/{templateId}', 'update-email-template-v2', 'Update Email Template V2', 'update-email-template-v-2'],
  ['GET', '/emails/public/v2/locations/{locationId}/campaigns/stats/{source}/{sourceId}', 'get-campaign-stats-v2', 'Get Campaign Statistics V2', 'get-campaign-stats-under-campaigns-v-2'],
].map(([method, path, operationId, summary, slug]) => ({
  method,
  path,
  app: 'emails',
  operationId,
  summary,
  sourceFile: `live-docs:ghl/emails/${slug}`,
  versions: ['2023-02-21'],
  specTier: 'v2',
  deprecated: true,
  supersededByV3: true,
}));

const supplementalOfficialEndpoints = [
  ...legacyEmailV2SupplementalEndpoints,
  // ── Opportunities pipelines CRUD (2026-06-26 changelog) ─────────────────
  // Live on the docs site (sitemap confirms create/get/update/delete-pipeline
  // pages) but not yet in apps/v3/opportunities-v3.json. Modeled from the live
  // docs; will be reconciled when the spec catches up.
  {
    method: 'POST',
    path: '/opportunities/pipelines/',
    app: 'opportunities',
    operationId: 'create-pipeline',
    summary: 'Create a pipeline (v3, live-docs)',
    sourceFile: 'live-docs:ghl/opportunities/create-pipeline',
    versions: ['v3'],
  },
  {
    method: 'GET',
    path: '/opportunities/pipelines/{pipelineId}',
    app: 'opportunities',
    operationId: 'get-pipeline',
    summary: 'Get a pipeline by ID (v3, live-docs)',
    sourceFile: 'live-docs:ghl/opportunities/get-pipeline',
    versions: ['v3'],
  },
  {
    method: 'PUT',
    path: '/opportunities/pipelines/{pipelineId}',
    app: 'opportunities',
    operationId: 'update-pipeline',
    summary: 'Update a pipeline by ID (v3, live-docs)',
    sourceFile: 'live-docs:ghl/opportunities/update-pipeline',
    versions: ['v3'],
  },
  {
    method: 'DELETE',
    path: '/opportunities/pipelines/{pipelineId}',
    app: 'opportunities',
    operationId: 'delete-pipeline',
    summary: 'Delete a pipeline by ID (v3, live-docs)',
    sourceFile: 'live-docs:ghl/opportunities/delete-pipeline',
    versions: ['v3'],
  },
  // NOTE: /saas/allow-attach-rebilling/{locationId} is already in
  // apps/v3/saas-v3.json, so it does not need a live-docs supplemental entry.
];

const args = parseArgs(process.argv.slice(2));
const docsDir = args['docs-dir'] ? resolveFromRoot(args['docs-dir']) : defaultDocsDir;
const reportPath = args.out ? resolveFromRoot(args.out) : defaultReportPath;
const jsonPath = args.json ? resolveFromRoot(args.json) : defaultJsonPath;
const lockPath = args.lock ? resolveFromRoot(args.lock) : defaultLockPath;

ensureDocsRepo(docsDir, args.refresh === true);

const official = extractOfficialEndpoints(docsDir);
const local = extractLocalEndpoints(join(repoRoot, 'src'));
const changelogFindings = [
  {
    date: '2026-06-11',
    area: 'v3 release',
    change: 'Major v3 migration: named "v3" Version header introduced for contacts, opportunities, oauth, emails, brand-boards, saas, email-isv. GET /contacts/ and GET /users/ removed. OAuth went camelCase. /oauth/installedLocations and /oauth/locationToken removed (replaced by kebab-case). New Agency-Access-Only and Location-Access-Only security schemes. Full emails v3 suite (/emails/locations/{locationId}/...) and brand-boards brand-voices suite added.',
    source: 'https://marketplace.gohighlevel.com/docs/Changelog/index.html',
  },
  {
    date: '2026-08-06',
    area: 'SaaS',
    change: 'GET /saas/locations now requires companyId query parameter; customerId and subscriptionId became optional.',
    source: 'https://marketplace.gohighlevel.com/docs/Changelog/index.html',
  },
  {
    date: '2026-06-26',
    area: 'Opportunities',
    change: 'Pipeline CRUD endpoints added: POST/DELETE/GET/PUT /opportunities/pipelines and /opportunities/pipelines/{pipelineId}.',
    source: 'https://marketplace.gohighlevel.com/docs/Changelog/index.html',
  },
  {
    date: '2026-06-18',
    area: 'Ad Publishing / SaaS',
    change: 'Added GET /ad-publishing/facebook/campaigns/{campaignId}/publishing-progress (the only ad-publishing endpoint on v3) and POST /saas/allow-attach-rebilling/{locationId}.',
    source: 'https://marketplace.gohighlevel.com/docs/Changelog/index.html',
  },
  {
    date: '2026-04-28',
    area: 'Users/Contacts',
    change: 'GET /users/ and GET /contacts/ deprecated (removed in v3 on 2026-06-11).',
    source: 'https://marketplace.gohighlevel.com/docs/Changelog/index.html',
  },
  {
    date: '2026-04-21',
    area: 'Notes',
    change: 'Top-level Notes endpoints added: POST /notes/, POST /notes/search, DELETE /notes/{id}, GET /notes/{id}, PUT /notes/{id}, PATCH /notes/{id}/attachments, PUT /notes/{id}/relations, POST /notes/{id}/restore',
    source: 'https://marketplace.gohighlevel.com/docs/Changelog/index.html',
  },
  {
    date: '2026-04-15',
    area: 'Users/Scopes',
    change: 'New user scope enum values added for audit logs, location management, and payments settings',
    source: 'https://marketplace.gohighlevel.com/docs/Changelog/index.html',
  },
];

const comparison = compareEndpoints(official.endpoints, local.endpoints);
const report = buildReport({ official, local, comparison, changelogFindings, docsDir });
const sourceLock = buildSourceLock({ official, comparison });

mkdirSync(dirname(reportPath), { recursive: true });
writeFileSync(reportPath, report);
writeFileSync(jsonPath, JSON.stringify({ official, local, comparison, changelogFindings }, null, 2));
writeFileSync(lockPath, JSON.stringify(sourceLock, null, 2) + '\n');

console.log(`Wrote ${relative(repoRoot, reportPath)}`);
console.log(`Wrote ${relative(repoRoot, jsonPath)}`);
console.log(`Wrote ${relative(repoRoot, lockPath)}`);
console.log(`Official endpoints: ${official.endpoints.length}`);
console.log(`Local endpoint references: ${local.endpoints.length}`);
console.log(`Likely missing official endpoints: ${comparison.missingOfficial.length}`);
console.log(`Potential local-only endpoints: ${comparison.localOnly.length}`);

function parseArgs(argv) {
  const parsed = {};
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (!arg.startsWith('--')) continue;
    const key = arg.slice(2);
    const next = argv[i + 1];
    if (!next || next.startsWith('--')) {
      parsed[key] = true;
    } else {
      parsed[key] = next;
      i += 1;
    }
  }
  return parsed;
}

function resolveFromRoot(path) {
  return path.startsWith('/') ? path : join(repoRoot, path);
}

function runGit(args, cwd = repoRoot) {
  return execFileSync('git', args, { cwd, encoding: 'utf8' }).trim();
}

function ensureDocsRepo(dir, refresh) {
  if (!isExpectedDocsRepo(dir)) {
    if (existsSync(dir)) rmSync(dir, { recursive: true, force: true });
    mkdirSync(dirname(dir), { recursive: true });
    runGit(['clone', '--depth', '1', docsRepoUrl, dir]);
    return;
  }

  if (refresh) {
    runGit(['fetch', '--depth', '1', 'origin', 'main'], dir);
    runGit(['checkout', 'FETCH_HEAD'], dir);
  }
}

function isExpectedDocsRepo(dir) {
  if (!existsSync(dir)) return false;
  const gitRoot = safeGit(['rev-parse', '--show-toplevel'], dir);
  if (gitRoot !== dir) return false;

  const originUrl = safeGit(['config', '--get', 'remote.origin.url'], dir);
  return normalizeGitUrl(originUrl) === normalizeGitUrl(docsRepoUrl);
}

function normalizeGitUrl(url) {
  return url
    .trim()
    .replace(/^git@github\.com:/, 'https://github.com/')
    .replace(/\.git$/, '');
}

function extractOfficialEndpoints(dir) {
  const appsDir = join(dir, 'apps');
  const endpoints = [];
  const seenV3Keys = new Set();

  // ── v3 tier: apps/v3/*.json ────────────────────────────────────────────
  // Read v3 first so we can mark the v2 counterparts as superseded when both
  // exist for the same method+path. v3 specs declare `versions: ['v3']`.
  const v3Dir = join(appsDir, 'v3');
  if (existsSync(v3Dir)) {
    for (const file of readdirSync(v3Dir).filter((name) => name.endsWith('.json')).sort()) {
      const appName = file.replace(/-v3\.json$/, '').replace(/\.json$/, '');
      const spec = readSpec(join(v3Dir, file));
      if (!spec) continue;
      for (const [path, operations] of Object.entries(spec.paths ?? {})) {
        for (const [method, operation] of Object.entries(operations ?? {})) {
          if (!httpMethods.has(method.toLowerCase())) continue;
          const key = makeKey(method, path);
          const sourceFile = `apps/v3/${file}`;
          const correction = OFFICIAL_SPEC_CORRECTIONS.get(`${sourceFile} ${method.toUpperCase()} ${path}`);
          seenV3Keys.add(key);
          endpoints.push({
            key,
            method: method.toUpperCase(),
            path,
            normalizedPath: normalizePath(path),
            app: appName,
            operationId: operation.operationId ?? '',
            summary: operation.summary ?? '',
            versions: extractVersions(operation),
            scopes: extractScopes(operation),
            securitySchemes: extractSecuritySchemes(operation),
            deprecated: Boolean(operation.deprecated),
            specTier: 'v3',
            sourceFile,
            queryParamRequiredOverrides: correction?.queryParamRequired,
            correctionEvidence: correction ? {
              evidence: correction.evidence,
              reason: correction.reason,
            } : undefined,
          });
        }
      }
    }
  }

  // ── v2 tier: apps/*.json (top-level only; v3/ is handled above) ─────────
  for (const file of readdirSync(appsDir).filter((name) => name.endsWith('.json')).sort()) {
    const appName = file.replace(/\.json$/, '');
    const spec = readSpec(join(appsDir, file));
    if (!spec) continue;
    for (const [path, operations] of Object.entries(spec.paths ?? {})) {
      for (const [method, operation] of Object.entries(operations ?? {})) {
        if (!httpMethods.has(method.toLowerCase())) continue;
        const key = makeKey(method, path);
        const methodUpper = method.toUpperCase();
        // A v2 endpoint is superseded in v3 if:
        //  (a) a v3 spec covers the exact method+path, OR
        //  (b) the path was renamed in v3 (old path → new path), OR
        //  (c) the endpoint was removed outright in v3 (no replacement).
        const exactMatch = seenV3Keys.has(key);
        const rename = V3_RENAMED_PATHS.find(([m, from]) => m === methodUpper && from === path);
        const removed = V3_REMOVED_PATHS.has(`${methodUpper} ${path}`);
        const supersededByV3 = Boolean(exactMatch || rename || removed);
        endpoints.push({
          key,
          method: methodUpper,
          path,
          normalizedPath: normalizePath(path),
          app: appName,
          canonicalApp: canonicalApp(appName),
          operationId: operation.operationId ?? '',
          summary: operation.summary ?? '',
          versions: extractVersions(operation),
          scopes: extractScopes(operation),
          securitySchemes: extractSecuritySchemes(operation),
          // If superseded, the v2 entry is hidden in v3 mode by the registry.
          deprecated: Boolean(operation.deprecated) || supersededByV3,
          supersededByV3,
          removedInV3: removed,
          specTier: 'v2',
          sourceFile: `apps/${file}`,
        });
      }
    }
  }

  endpoints.push(...supplementalOfficialEndpoints.map((endpoint) => ({
    key: makeKey(endpoint.method, endpoint.path),
    method: endpoint.method,
    path: endpoint.path,
    normalizedPath: normalizePath(endpoint.path),
    app: endpoint.app,
    operationId: endpoint.operationId,
    summary: endpoint.summary,
    versions: endpoint.versions ?? [PRIMARY_API_VERSION],
    scopes: [],
    securitySchemes: [],
    deprecated: endpoint.deprecated ?? false,
    supersededByV3: endpoint.supersededByV3 ?? false,
    specTier: endpoint.specTier ?? 'live-docs',
    sourceFile: endpoint.sourceFile,
  })));

  const commit = runGit(['rev-parse', 'HEAD'], dir);
  const tag = safeGit(['describe', '--tags', '--always'], dir);
  return { repo: docsRepoUrl, commit, tag, endpoints };
}

function readSpec(file) {
  try {
    return JSON.parse(readFileSync(file, 'utf8'));
  } catch {
    return null;
  }
}

function extractVersions(operation) {
  const versions = new Set();
  for (const param of operation.parameters ?? []) {
    if (param.name === 'Version') {
      for (const value of param.schema?.enum ?? []) versions.add(String(value));
      if (param.schema?.example) versions.add(String(param.schema.example));
    }
  }
  return [...versions].sort();
}

function extractScopes(operation) {
  const scopes = new Set();
  for (const security of operation.security ?? []) {
    for (const values of Object.values(security)) {
      for (const scope of values ?? []) scopes.add(scope);
    }
  }
  return [...scopes].sort();
}

/**
 * Capture the security scheme *names* (the keys of each security requirement
 * object), e.g. `Agency-Access-Only`, `Location-Access-Only`, `bearer`.
 * These drive the v3 access-level preflight. Distinct from extractScopes,
 * which only captures the scope strings inside each scheme.
 */
function extractSecuritySchemes(operation) {
  const schemes = new Set();
  for (const security of operation.security ?? []) {
    for (const name of Object.keys(security)) schemes.add(name);
  }
  return [...schemes].sort();
}

function extractLocalEndpoints(srcDir) {
  const registration = findRegisteredToolSources(srcDir);
  const files = registration.reachableFiles
    .filter((file) => file.endsWith('.ts') && !file.includes('/ui/'));
  const endpoints = [];

  const makeRequestRegex = /makeRequest\(\s*['"`](GET|POST|PUT|PATCH|DELETE)['"`]\s*,\s*(`[^`]+`|'[^']+'|"[^"]+")/g;
  const axiosRegex = /axiosInstance\.(get|post|put|patch|delete)\s*\(\s*(`[^`]+`|'[^']+'|"[^"]+")/g;

  for (const file of files) {
    const text = readFileSync(file, 'utf8');
    for (const match of text.matchAll(makeRequestRegex)) {
      addLocalEndpoint(endpoints, file, match[1], match[2], 'makeRequest');
    }
    for (const match of text.matchAll(axiosRegex)) {
      addLocalEndpoint(endpoints, file, match[1], match[2], 'axiosInstance');
    }
  }

  endpoints.push(...extractGeneratedOfficialSpecEndpoints(join(srcDir, 'tools', 'official-spec-endpoints.json')));

  return {
    endpoints,
    filesScanned: files.length,
    registeredToolModules: registration.registeredToolModules.map((file) => relative(repoRoot, file)),
    reachableSourceFiles: files.map((file) => relative(repoRoot, file)),
  };
}

/**
 * Resolve the concrete modules registered by ToolRegistry, then walk their
 * relative imports. Scanning every TypeScript file lets dead or abandoned tool
 * classes claim API coverage even though no MCP caller can reach them.
 */
function findRegisteredToolSources(srcDir) {
  const registryFile = join(srcDir, 'tool-registry.ts');
  const registrySource = readFileSync(registryFile, 'utf8');
  const importedSymbols = new Map();

  const namedImportRegex = /import\s+(?:type\s+)?\{([^}]+)\}\s+from\s+['"]([^'"]+)['"]/g;
  for (const match of registrySource.matchAll(namedImportRegex)) {
    const resolved = resolveRelativeModule(registryFile, match[2]);
    if (!resolved) continue;
    for (const item of match[1].split(',')) {
      const parts = item.trim().split(/\s+as\s+/);
      const localName = parts[1] || parts[0];
      if (localName) importedSymbols.set(localName.trim(), resolved);
    }
  }

  const instanceClasses = new Map();
  for (const match of registrySource.matchAll(/const\s+(\w+)\s*=\s*new\s+(\w+)\s*\(/g)) {
    instanceClasses.set(match[1], match[2]);
  }

  const registeredToolModules = [];
  for (const match of registrySource.matchAll(/this\.addModule\(\s*[^,]+,\s*(\w+)\s*,/g)) {
    const className = instanceClasses.get(match[1]);
    const file = className ? importedSymbols.get(className) : undefined;
    if (file) registeredToolModules.push(file);
  }

  if (registeredToolModules.length === 0) {
    throw new Error('Could not resolve any registered tool modules from src/tool-registry.ts');
  }

  const reachable = new Set();
  const queue = [...new Set(registeredToolModules)];
  while (queue.length > 0) {
    const file = queue.shift();
    if (!file || reachable.has(file)) continue;
    reachable.add(file);
    const source = readFileSync(file, 'utf8');
    for (const specifier of extractRelativeImports(source)) {
      const imported = resolveRelativeModule(file, specifier);
      if (imported && !reachable.has(imported)) queue.push(imported);
    }
  }

  return {
    registeredToolModules: [...new Set(registeredToolModules)].sort(),
    reachableFiles: [...reachable].sort(),
  };
}

function extractRelativeImports(source) {
  const imports = new Set();
  const fromRegex = /(?:import|export)\s+(?:type\s+)?(?:[\s\S]*?\s+from\s+)?['"](\.[^'"]+)['"]/g;
  for (const match of source.matchAll(fromRegex)) imports.add(match[1]);
  const dynamicRegex = /import\(\s*['"](\.[^'"]+)['"]\s*\)/g;
  for (const match of source.matchAll(dynamicRegex)) imports.add(match[1]);
  return imports;
}

function resolveRelativeModule(fromFile, specifier) {
  if (!specifier.startsWith('.')) return undefined;
  const base = join(dirname(fromFile), specifier);
  const candidates = specifier.endsWith('.js')
    ? [base.slice(0, -3) + '.ts']
    : specifier.endsWith('.ts')
      ? [base]
      : [base + '.ts', join(base, 'index.ts')];
  return candidates.find((candidate) => existsSync(candidate));
}

function extractGeneratedOfficialSpecEndpoints(file) {
  if (!existsSync(file)) return [];
  try {
    const endpoints = JSON.parse(readFileSync(file, 'utf8'));
    return endpoints.map((endpoint) => ({
      key: makeKey(endpoint.method, endpoint.path),
      method: endpoint.method,
      path: endpoint.path,
      normalizedPath: normalizePath(endpoint.path),
      sourceFile: relative(repoRoot, file),
      caller: 'official-spec-generated',
    }));
  } catch {
    return [];
  }
}

function addLocalEndpoint(endpoints, file, method, rawPath, caller) {
  const path = cleanLocalPath(rawPath);
  if (!path.startsWith('/')) return;
  endpoints.push({
    key: makeKey(method, path),
    method: method.toUpperCase(),
    path,
    normalizedPath: normalizePath(path),
    sourceFile: relative(repoRoot, file),
    caller,
  });
}

function cleanLocalPath(rawPath) {
  let value = rawPath.slice(1, -1);
  value = value.replace(/\$\{[^}]+\}/g, '{param}');
  value = value.replace(/\?.*$/, '');
  value = value.replace(/([^/])\{param\}$/, '$1');
  value = value.replace(/\/+/g, '/');
  return value;
}

function normalizePath(path) {
  return path
    .replace(/\?.*$/, '')
    .replace(/\$\{[^}]+\}/g, '{param}')
    .replace(/\{[^}/]+\}/g, '{}')
    .replace(/:[^/]+/g, '{}')
    .replace(/\/+/g, '/')
    .replace(/\/$/, '') || '/';
}

function makeKey(method, path) {
  return `${method.toUpperCase()} ${normalizePath(path)}`;
}

function listFiles(dir) {
  const entries = readdirSync(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...listFiles(fullPath));
    } else if (entry.isFile()) {
      files.push(fullPath);
    }
  }
  return files;
}

function compareEndpoints(officialEndpoints, localEndpoints) {
  // For coverage purposes, a superseded v2 entry (same method+path exists in
  // the v3 tier) is not counted as a separate official endpoint — the v3
  // entry is the source of truth in v3 mode. The v2 entry is still emitted
  // to the registry so it can be surfaced in v2/legacy mode.
  const countedOfficial = officialEndpoints.filter((endpoint) => !endpoint.supersededByV3);
  const v2CompatibilityOfficial = officialEndpoints.filter((endpoint) => endpoint.specTier === 'v2');

  const officialByKey = groupBy(countedOfficial, (endpoint) => endpoint.key);
  const localByKey = groupBy(localEndpoints, (endpoint) => endpoint.key);
  const officialKeys = new Set(officialByKey.keys());
  const localKeys = new Set(localByKey.keys());

  const missingOfficial = [...officialKeys]
    .filter((key) => !localKeys.has(key))
    .sort()
    .map((key) => officialByKey.get(key)[0]);
  const localOnly = [...localKeys]
    .filter((key) => !officialKeys.has(key))
    .sort()
    .map((key) => localByKey.get(key)[0]);

  const byApp = {};
  for (const endpoint of countedOfficial) {
    byApp[endpoint.app] ??= { official: 0, covered: 0, missing: 0 };
    byApp[endpoint.app].official += 1;
    if (localKeys.has(endpoint.key)) byApp[endpoint.app].covered += 1;
    else byApp[endpoint.app].missing += 1;
  }

  const currentV3 = summarizeCoverageSurface(countedOfficial, localByKey);
  const v2Compatibility = summarizeCoverageSurface(v2CompatibilityOfficial, localByKey);
  const dualGeneration = summarizeCoverageSurface(officialEndpoints, localByKey);

  return {
    // Backward-compatible aliases describe the current/default v3 surface.
    coveredCount: currentV3.coveredCount,
    officialUniqueCount: currentV3.officialUniqueCount,
    localUniqueCount: localKeys.size,
    coveragePercent: currentV3.coveragePercent,
    missingOfficial,
    localOnly,
    byApp,
    currentV3,
    v2Compatibility,
    dualGeneration,
  };
}

function summarizeCoverageSurface(officialEndpoints, localByKey) {
  const officialByKey = groupBy(officialEndpoints, (endpoint) => endpoint.key);
  const officialKeys = new Set(officialByKey.keys());
  const coveredKeys = [...officialKeys].filter((key) => localByKey.has(key));
  const missingOfficial = [...officialKeys]
    .filter((key) => !localByKey.has(key))
    .sort()
    .map((key) => officialByKey.get(key)[0]);
  const localOnly = [...localByKey.keys()]
    .filter((key) => !officialKeys.has(key))
    .sort()
    .map((key) => localByKey.get(key)[0]);

  return {
    officialUniqueCount: officialKeys.size,
    coveredCount: coveredKeys.length,
    coveragePercent: officialKeys.size === 0
      ? 0
      : Math.round((coveredKeys.length / officialKeys.size) * 1000) / 10,
    missingOfficial,
    localOnlyCount: localOnly.length,
  };
}

function buildSourceLock({ official, comparison }) {
  const supplemental = official.endpoints
    .filter((endpoint) => endpoint.sourceFile?.startsWith('live-docs:'))
    .map((endpoint) => ({
      method: endpoint.method,
      path: endpoint.path,
      app: endpoint.app,
      operationId: endpoint.operationId,
      source: endpoint.sourceFile,
      version: endpoint.versions?.[0] || PRIMARY_API_VERSION,
      verifiedDate: sourceVerifiedDate,
    }))
    .sort((a, b) => `${a.method} ${a.path}`.localeCompare(`${b.method} ${b.path}`));

  const v3EndpointCount = official.endpoints.filter((e) => e.specTier === 'v3').length;
  const v2EndpointCount = official.endpoints.filter((e) => e.specTier === 'v2').length;
  const corrections = official.endpoints
    .filter((endpoint) => endpoint.correctionEvidence)
    .map((endpoint) => ({
      method: endpoint.method,
      path: endpoint.path,
      source: endpoint.sourceFile,
      ...endpoint.correctionEvidence,
      queryParamRequired: endpoint.queryParamRequiredOverrides,
    }))
    .sort((a, b) => `${a.method} ${a.path}`.localeCompare(`${b.method} ${b.path}`));

  return {
    schemaVersion: 2,
    verifiedDate: sourceVerifiedDate,
    primaryApiVersion: PRIMARY_API_VERSION,
    apiGenerationDefault: 'v3',
    officialDocs: {
      repo: official.repo,
      branch: 'main',
      commit: official.commit,
      tag: official.tag,
      expectedEndpointReferences: official.endpoints.length,
      expectedUniqueEndpoints: comparison.officialUniqueCount,
      v3Endpoints: v3EndpointCount,
      v2Endpoints: v2EndpointCount,
    },
    liveDocsSupplemental: {
      expectedEndpointReferences: supplemental.length,
      endpoints: supplemental,
    },
    officialSpecCorrections: corrections,
    coverageSurfaces: {
      currentV3: {
        expectedUniqueEndpoints: comparison.currentV3.officialUniqueCount,
        expectedCoveredEndpoints: comparison.currentV3.coveredCount,
      },
      legacyV2: {
        expectedUniqueEndpoints: comparison.v2Compatibility.officialUniqueCount,
        expectedCoveredEndpoints: comparison.v2Compatibility.coveredCount,
      },
      dualGenerationUnion: {
        expectedUniqueEndpoints: comparison.dualGeneration.officialUniqueCount,
        expectedCoveredEndpoints: comparison.dualGeneration.coveredCount,
      },
    },
    acceptance: {
      expectedMissingOfficialEndpoints: 0,
      expectedCoveragePercent: 100,
    },
  };
}

function groupBy(items, keyFn) {
  const map = new Map();
  for (const item of items) {
    const key = keyFn(item);
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(item);
  }
  return map;
}

function safeGit(args, cwd) {
  try {
    return runGit(args, cwd);
  } catch {
    return '';
  }
}

function buildReport({ official, local, comparison, changelogFindings, docsDir }) {
  const highPriorityApps = new Set(['users', 'emails', 'campaigns', 'contacts', 'calendars', 'marketplace']);
  const missingHighPriority = comparison.missingOfficial
    .filter((endpoint) => highPriorityApps.has(endpoint.app))
    .slice(0, 80);
  const localOnlyHighRisk = comparison.localOnly
    .filter((endpoint) => !endpoint.path.startsWith('/notes'))
    .filter((endpoint) => /\/users\/?$|\/campaigns|\/emails/.test(endpoint.path))
    .slice(0, 80);
  const appRows = Object.entries(comparison.byApp)
    .sort(([, a], [, b]) => b.missing - a.missing || b.official - a.official)
    .map(([app, stats]) => `| ${app} | ${stats.official} | ${stats.covered} | ${stats.missing} |`)
    .join('\n');

  return `# GHL API Coverage Report

Generated from official GHL docs commit: ${official.tag}

## Source Snapshot

- Official docs repo: ${official.repo}
- Docs checkout: \`${relative(repoRoot, docsDir)}\`
- Docs commit: \`${official.commit}\`
- Docs tag/description: \`${official.tag}\`
- Official endpoint references parsed: ${official.endpoints.length}
- Local endpoint references parsed: ${local.endpoints.length}
- Registered tool modules discovered: ${local.registeredToolModules.length}
- Local TypeScript files scanned: ${local.filesScanned}

## Coverage Summary

- Current/default v3 unique official endpoints: ${comparison.currentV3.officialUniqueCount}
- Legacy v2 compatibility unique official endpoints: ${comparison.v2Compatibility.officialUniqueCount}
- Dual-generation unique official endpoint union: ${comparison.dualGeneration.officialUniqueCount}
- Unique local endpoints: ${comparison.localUniqueCount}
- Current v3 exact-match coverage: ${comparison.currentV3.coveredCount} / ${comparison.currentV3.officialUniqueCount} (${comparison.currentV3.coveragePercent}%)
- Legacy v2 exact-match coverage: ${comparison.v2Compatibility.coveredCount} / ${comparison.v2Compatibility.officialUniqueCount} (${comparison.v2Compatibility.coveragePercent}%)
- Dual-generation exact-match coverage: ${comparison.dualGeneration.coveredCount} / ${comparison.dualGeneration.officialUniqueCount} (${comparison.dualGeneration.coveragePercent}%)
- Likely missing current v3 official endpoints: ${comparison.currentV3.missingOfficial.length}
- Potential current-v3 local-only/deprecated/private endpoints: ${comparison.currentV3.localOnlyCount}
- Potential dual-generation local-only/deprecated/private endpoints: ${comparison.dualGeneration.localOnlyCount}

Only files reachable from modules registered by \`ToolRegistry\` are counted as hand-written coverage. Exact matching is intentionally conservative. Dynamic path generation, aliases, and compatibility wrappers may create false positives, but this gives us a repeatable first-pass map.

## Changelog-Only Findings To Plan Around

${changelogFindings.map((item) => `- ${item.date} — ${item.area}: ${item.change} (${item.source})`).join('\n')}

## Coverage By Official App Area

| App area | Official endpoints | Exact local matches | Missing |
| --- | ---: | ---: | ---: |
${appRows}

## High-Priority Missing Official Endpoints

${formatEndpointList(missingHighPriority)}

## Potential Local-Only High-Risk Endpoints

These deserve manual review because they may be legacy, private, renamed, or simply not matched by the scanner.

${formatEndpointList(localOnlyHighRisk)}

## Recommended Update Plan

1. The scanner now reads both the v2 (\`apps/*.json\`) and v3 (\`apps/v3/*-v3.json\`) OpenAPI fragments. v3 endpoints (named \`v3\` version header) are the source of truth; superseded v2 entries are retained for legacy/v2-mode visibility.
2. Ad-publishing stays on the legacy \`2021-07-28\` version header for 94 of 95 endpoints (only the publishing-progress endpoint uses \`v3\`). The per-endpoint version router in \`src/clients/version-router.ts\` handles this automatically.
3. Core Conversations and Messages routes use named \`v3\` in the current generation and \`2021-04-15\` only in legacy v2 mode.
4. \`GET /contacts/\` and \`GET /users/\` are removed in v3; callers must use \`POST /contacts/search\` and the users search endpoints instead. The hand-written contact/user tools route accordingly in v3 mode.
5. OAuth migrated to camelCase (\`clientId\`, \`accessToken\`, ...) and new kebab-case paths (\`/oauth/installed-locations\`, \`/oauth/location-token\`). The old camelCase paths were removed without deprecation.
6. New modules covered: top-level \`/notes/\`, opportunities pipelines CRUD, \`/saas/allow-attach-rebilling/{locationId}\`, brand-boards v3 brand-voices, and the full \`/emails/locations/{locationId}/...\` v3 email suite.
7. Two new security schemes (\`Agency-Access-Only\`, \`Location-Access-Only\`) are captured per endpoint as \`securitySchemes\` and drive the access-level preflight in \`OfficialSpecTools\`.
8. Removed Email Campaign V2 supplemental endpoints are retained as deprecated v2-only coverage and hidden from the v3 surface.

## Full Machine-Readable Output

See \`${relative(repoRoot, jsonPath)}\` for the complete parsed endpoint lists.
`;
}

function formatEndpointList(endpoints) {
  if (endpoints.length === 0) return '- None found.';
  return endpoints
    .map((endpoint) => {
      const source = endpoint.sourceFile ?? endpoint.sourceFile;
      const extra = endpoint.summary || endpoint.operationId || endpoint.caller || '';
      return `- \`${endpoint.method} ${endpoint.path}\` — ${endpoint.app ?? endpoint.sourceFile}${extra ? ` — ${extra}` : ''}${source && endpoint.app ? ` (\`${source}\`)` : ''}`;
    })
    .join('\n');
}
