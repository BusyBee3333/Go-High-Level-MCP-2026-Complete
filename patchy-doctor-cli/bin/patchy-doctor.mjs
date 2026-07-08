#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');
const DEFAULT_BURTON_LOCATION_ID = 'DZEpRd43MxUJKdtrev9t';
const AUTH_LIB = '/Users/jakeshore/.agents/skills/ghl-auth/scripts/ghl-auth-lib.mjs';
const AUTH_ENV_PATH = '/Users/jakeshore/.agents/skills/ghl-workflow-builder/.env';

function parseArgs(argv) {
  const args = { _: [] };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (!arg.startsWith('--')) {
      args._.push(arg);
      continue;
    }
    const key = arg.slice(2);
    const next = argv[i + 1];
    if (!next || next.startsWith('--')) {
      args[key] = true;
    } else {
      args[key] = next;
      i += 1;
    }
  }
  return args;
}

function readJsonIfExists(file) {
  if (!fs.existsSync(file)) return { ok: false, missing: true, file };
  try {
    return { ok: true, file, data: JSON.parse(fs.readFileSync(file, 'utf8')) };
  } catch (error) {
    return { ok: false, file, error: error.message };
  }
}

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function boolArg(value) {
  return value === true || value === 'true' || value === '1' || value === 'yes';
}

function arraysFrom(data, keys) {
  if (Array.isArray(data)) return data;
  for (const key of keys) {
    if (Array.isArray(data?.[key])) return data[key];
  }
  return [];
}

async function getLiveAuthHeaders(locationId = DEFAULT_BURTON_LOCATION_ID) {
  const candidates = await getLiveAuthHeaderCandidates();
  const base = 'https://services.leadconnectorhq.com';
  const failures = [];
  for (const candidate of candidates) {
    const probe = await fetchJson({
      base,
      endpoint: `/locations/${encodeURIComponent(locationId)}`,
      headers: candidate.headers,
      attempts: 1,
    });
    if (probe.ok) return candidate.headers;
    failures.push({ label: candidate.label, status: probe.status, message: probe.data?.message || probe.data?.error || null });
  }
  throw new Error(`No local GHL credential worked for ${locationId}: ${JSON.stringify(failures)}`);
}

async function getLiveAuthHeaderCandidates() {
  const localEnv = readMergedGhlEnv();
  const candidates = [];
  if (fs.existsSync(AUTH_LIB)) {
    const { getAuth } = await import(AUTH_LIB);
    try {
      const { headers } = await getAuth();
      candidates.push({ label: 'refresh-jwt', headers });
    } catch (error) {
      // Fall through to PIT/Firebase/local-token paths. Some saved refresh JWTs
      // expire before other local credentials do.
      console.error(`GHL refresh auth failed; trying local fallback credentials (${error.message})`);
    }
  }

  for (const [label, token] of [
    ['pit-token', process.env.GHL_PIT_TOKEN || localEnv.GHL_PIT_TOKEN],
    ['saved-auth-token', process.env.GHL_AUTH_TOKEN || localEnv.GHL_AUTH_TOKEN],
    ['api-key-token', process.env.GHL_API_KEY || localEnv.GHL_API_KEY],
  ]) {
    if (!token) continue;
    candidates.push({
      label,
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        Version: '2021-07-28',
        channel: 'APP',
        source: 'WEB_USER',
      },
    });
  }

  const firebaseHeaders = await maybeGetFirebaseHeaders(localEnv);
  if (firebaseHeaders) candidates.push({ label: 'firebase-token-id', headers: firebaseHeaders });

  if (!candidates.length) {
    throw new Error(`No GHL auth available. Expected ${AUTH_LIB}, GHL_AUTH_TOKEN, GHL_PIT_TOKEN, GHL_API_KEY, or Firebase fallback credentials.`);
  }
  return candidates;
}

async function maybeGetFirebaseHeaders(localEnv) {
  const firebaseRefreshToken = process.env.GHL_FIREBASE_REFRESH_TOKEN || localEnv.GHL_FIREBASE_REFRESH_TOKEN;
  const firebaseApiKey = process.env.GHL_FIREBASE_API_KEY || localEnv.GHL_FIREBASE_API_KEY;
  const apiKey = process.env.GHL_API_KEY || localEnv.GHL_API_KEY;
  if (!firebaseRefreshToken || !firebaseApiKey || !apiKey) return null;
  const response = await fetch(`https://securetoken.googleapis.com/v1/token?key=${encodeURIComponent(firebaseApiKey)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=refresh_token&refresh_token=${encodeURIComponent(firebaseRefreshToken)}`,
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok || !data.id_token) return null;
  if (data.refresh_token && data.refresh_token !== firebaseRefreshToken) {
    saveEnvValues(AUTH_ENV_PATH, { ...localEnv, GHL_FIREBASE_REFRESH_TOKEN: data.refresh_token });
  }
  return {
    Authorization: `Bearer ${apiKey}`,
    'token-id': data.id_token,
    channel: 'APP',
    'Content-Type': 'application/json',
    Version: '2021-07-28',
  };
}

function readMergedGhlEnv() {
  const files = [
    path.resolve(process.cwd(), '.env'),
    path.resolve(process.cwd(), '../GHL MCP/.env'),
    AUTH_ENV_PATH,
    '/Users/jakeshore/.codex/skills/ghl-workflow-builder/.env',
  ];
  const merged = {};
  for (const file of files) {
    if (!fs.existsSync(file)) continue;
    Object.assign(merged, readEnvFile(file));
  }
  return merged;
}

function decodeBase64UrlPart(part) {
  const normalized = String(part).replace(/-/g, '+').replace(/_/g, '/');
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=');
  return Buffer.from(padded, 'base64').toString('utf8');
}

function decodeGhlAuthBlob(rawValue) {
  if (!rawValue) throw new Error('No auth blob value provided.');
  let value = String(rawValue).trim();
  if ((value.startsWith("'") && value.endsWith("'")) || (value.startsWith('"') && value.endsWith('"'))) {
    try {
      value = JSON.parse(value);
    } catch {
      value = value.slice(1, -1);
    }
  }
  let decodedText = value;
  try {
    const parsed = JSON.parse(value);
    if (typeof parsed === 'string') decodedText = parsed;
    else if (parsed && typeof parsed === 'object') return parsed;
  } catch {
    // The value may already be the base64 payload or a raw refresh token.
  }
  try {
    return JSON.parse(Buffer.from(decodedText, 'base64').toString('utf8'));
  } catch {
    if (decodedText.split('.').length === 3) {
      return { refreshToken: decodedText };
    }
    throw new Error('Could not decode GHL auth blob. Expected localStorage.getItem("a") or a refresh JWT.');
  }
}

async function rotateRefreshToken(refreshToken) {
  const response = await fetch('https://services.leadconnectorhq.com/auth/refresh', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
  });
  const text = await response.text();
  let data;
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = { raw: text };
  }
  if (!response.ok || !data.jwt || !data.refreshJwt) {
    throw new Error(`GHL refresh failed (${response.status}): ${JSON.stringify(data).slice(0, 600)}`);
  }
  return data;
}

function readEnvFile(file) {
  const env = {};
  if (!fs.existsSync(file)) return env;
  for (const line of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
    const match = line.match(/^([^#=][^=]*)=(.*)$/);
    if (match) env[match[1].trim()] = match[2].trim();
  }
  return env;
}

function saveEnvValues(file, values) {
  const lines = fs.existsSync(file) ? fs.readFileSync(file, 'utf8').split(/\r?\n/) : [];
  const remaining = new Map(Object.entries(values));
  const output = lines.map((line) => {
    const match = line.match(/^([^#=][^=]*)=/);
    if (match && remaining.has(match[1].trim())) {
      const key = match[1].trim();
      const value = remaining.get(key);
      remaining.delete(key);
      return `${key}=${value}`;
    }
    return line;
  });
  for (const [key, value] of remaining.entries()) output.push(`${key}=${value}`);
  ensureDir(path.dirname(file));
  fs.writeFileSync(file, `${output.join('\n').replace(/\n+$/, '')}\n`);
}

async function runBootstrapAuth(args) {
  let refreshToken = args['refresh-token'] || args.refreshToken || null;
  let authBlob = args['auth-blob'] || null;
  if (args['auth-blob-file']) {
    authBlob = fs.readFileSync(path.resolve(process.cwd(), args['auth-blob-file']), 'utf8').trim();
  }
  if (!refreshToken && authBlob) {
    const decoded = decodeGhlAuthBlob(authBlob);
    refreshToken = decoded.refreshToken || decoded.refreshJwt || decoded.authRefreshToken;
  }
  if (!refreshToken) {
    throw new Error('Provide --auth-blob, --auth-blob-file, or --refresh-token.');
  }

  const rotated = await rotateRefreshToken(refreshToken);
  const payload = JSON.parse(decodeBase64UrlPart(rotated.jwt.split('.')[1]));
  const existing = readEnvFile(AUTH_ENV_PATH);
  saveEnvValues(AUTH_ENV_PATH, {
    ...existing,
    GHL_AUTH_TOKEN: rotated.jwt,
    GHL_REFRESH_TOKEN: rotated.refreshJwt,
    GHL_USER_ID: payload.user_id || payload.userId || existing.GHL_USER_ID || '',
    GHL_COMPANY_ID: payload.company_id || payload.companyId || existing.GHL_COMPANY_ID || '',
  });
  console.log(JSON.stringify({
    ok: true,
    envPath: AUTH_ENV_PATH,
    userId: payload.user_id || payload.userId || null,
    companyId: payload.company_id || payload.companyId || null,
    expiresAt: payload.exp ? new Date(payload.exp * 1000).toISOString() : null,
  }, null, 2));
}

async function fetchJson({ base, endpoint, headers, method = 'GET', body, attempts = 3 }) {
  let last = null;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    const response = await fetch(`${base}${endpoint}`, {
      method,
      headers: { Accept: 'application/json', ...headers },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    const text = await response.text();
    let data;
    try {
      data = text ? JSON.parse(text) : {};
    } catch {
      data = { raw: text };
    }
    if (response.ok) return { ok: true, status: response.status, data };
    last = { status: response.status, data };
    const retryable = [408, 429, 500, 502, 503, 504].includes(response.status) || /timeout|temporarily|rate/i.test(text);
    if (!retryable || attempt === attempts) break;
    await sleep(750 * attempt);
  }
  return { ok: false, status: last?.status || 0, data: last?.data || null };
}

async function collectWorkflowList(locationId, headers) {
  const base = 'https://backend.leadconnectorhq.com/workflow';
  const rows = [];
  let count = null;
  const limit = 100;
  for (let offset = 0; offset < 10000; offset += limit) {
    const query = new URLSearchParams({
      type: 'workflow',
      limit: String(limit),
      offset: String(offset),
      sortBy: 'name',
      sortOrder: 'asc',
      includeCustomObjects: 'true',
      includeObjectiveBuilder: 'true',
    });
    const result = await fetchJson({ base, endpoint: `/${locationId}/list?${query.toString()}`, headers });
    if (!result.ok) return { ...result, rows, count };
    const pageRows = Array.isArray(result.data.rows)
      ? result.data.rows
      : Array.isArray(result.data.workflows)
        ? result.data.workflows
        : [];
    if (typeof result.data.count === 'number') count = result.data.count;
    rows.push(...pageRows);
    if (pageRows.length < limit) break;
    if (typeof count === 'number' && rows.length >= count) break;
  }
  return { ok: true, status: 200, rows, count: count ?? rows.length };
}

async function collectWorkflowDetails(locationId, headers, workflowRows, maxDetails) {
  const base = 'https://backend.leadconnectorhq.com/workflow';
  const details = [];
  const failures = [];
  const selected = workflowRows.slice(0, maxDetails);
  for (const row of selected) {
    const id = row._id || row.id;
    if (!id) continue;
    const result = await fetchJson({ base, endpoint: `/${locationId}/${encodeURIComponent(id)}`, headers, attempts: 2 });
    if (result.ok) details.push(result.data);
    else failures.push({ id, name: row.name, status: result.status, error: result.data });
    await sleep(80);
  }
  return {
    ok: failures.length === 0,
    status: failures.length === 0 ? 200 : 207,
    requested: selected.length,
    details,
    failures,
  };
}

async function collectMessageExport(locationId, headers, maxPages) {
  const base = 'https://services.leadconnectorhq.com';
  const messages = [];
  let cursor = '';
  let reportedTotal = 0;
  const limit = 1000;
  for (let page = 0; page < maxPages; page += 1) {
    const endpoint = `/conversations/messages/export?locationId=${encodeURIComponent(locationId)}&limit=${limit}${cursor ? `&cursor=${encodeURIComponent(cursor)}` : ''}`;
    const result = await fetchJson({ base, endpoint, headers, attempts: 4 });
    if (!result.ok) return { ok: false, status: result.status, messages, reportedTotal, error: result.data };
    const batch = arraysFrom(result.data, ['messages', 'items', 'data']);
    reportedTotal = Number(result.data.total || result.data.count || reportedTotal || 0);
    messages.push(...batch);
    cursor = result.data.nextCursor || result.data.cursor || result.data.meta?.nextCursor || result.data.pagination?.nextCursor || '';
    if (!cursor || batch.length === 0) break;
  }
  return {
    ok: true,
    status: 200,
    source: 'GET /conversations/messages/export',
    reportedTotal,
    messagesScanned: messages.length,
    complete: reportedTotal > 0 ? messages.length >= reportedTotal : !cursor,
    cursorRemaining: Boolean(cursor),
    messages,
  };
}

function liveInventoryResult(status, data) {
  return { status, data };
}

async function collectLiveEvidence(args) {
  const locationId = args['location-id'] || args.locationId || DEFAULT_BURTON_LOCATION_ID;
  const evidenceDir = path.resolve(process.cwd(), args.evidence || args.out || `tmp/patchy-live-${locationId}`);
  const includeMessages = boolArg(args['include-messages']);
  const maxMessagePages = Number(args['max-message-pages'] || 0);
  const maxWorkflowDetails = Number(args['max-workflow-details'] || 200);
  const maxConversations = Number(args['max-conversations'] || 100);
  ensureDir(evidenceDir);

  const headers = await getLiveAuthHeaders(locationId);
  const services = 'https://services.leadconnectorhq.com';
  const read = async (name, endpoint) => {
    const result = await fetchJson({ base: services, endpoint, headers });
    return { name, endpoint, ...result };
  };

  const [tags, pipelines, customFields, conversations, calendars, forms, location] = await Promise.all([
    read('tags', `/locations/${encodeURIComponent(locationId)}/tags`),
    read('pipelines', `/opportunities/pipelines?locationId=${encodeURIComponent(locationId)}`),
    read('customFields', `/locations/${encodeURIComponent(locationId)}/customFields?model=contact`),
    read('conversations', `/conversations/search?locationId=${encodeURIComponent(locationId)}&limit=${encodeURIComponent(maxConversations)}`),
    read('calendars', `/calendars/?locationId=${encodeURIComponent(locationId)}&showDrafted=true`),
    read('forms', `/forms/?locationId=${encodeURIComponent(locationId)}&limit=100`),
    read('location', `/locations/${encodeURIComponent(locationId)}`),
  ]);

  const workflowList = await collectWorkflowList(locationId, headers);
  const workflowDetails = await collectWorkflowDetails(locationId, headers, workflowList.rows || [], maxWorkflowDetails);
  const messages = includeMessages && maxMessagePages > 0
    ? await collectMessageExport(locationId, headers, maxMessagePages)
    : { ok: true, skipped: true, reason: 'Pass --include-messages --max-message-pages N to collect full message export.' };

  const liveInventory = {
    generatedAt: new Date().toISOString(),
    locationId,
    source: 'patchy-doctor live read-only collect',
    writesExecuted: false,
    results: {
      tags: liveInventoryResult(tags.status, tags.data),
      pipelines: liveInventoryResult(pipelines.status, pipelines.data),
      workflows: liveInventoryResult(workflowList.status, { workflows: workflowList.rows, count: workflowList.count }),
      customFields: liveInventoryResult(customFields.status, customFields.data),
      conversations: liveInventoryResult(conversations.status, conversations.data),
      calendars: liveInventoryResult(calendars.status, calendars.data),
      forms: liveInventoryResult(forms.status, forms.data),
      location: liveInventoryResult(location.status, location.data),
    },
  };

  const workflowAudit = buildWorkflowAuditFromLive(workflowList.rows || [], workflowDetails.details || []);
  const tagTruth = buildTagTruthFromLive(locationId, tags.data);
  const actionReport = buildActionReportFromLive({
    locationId,
    inventory: liveInventory,
    workflowAudit,
    workflowDetails,
    messages,
  });

  const files = {
    liveInventory: path.join(evidenceDir, 'burton-live-inventory-readonly.json'),
    workflowAudit: path.join(evidenceDir, 'burton-internal-workflow-audit.json'),
    tagTruth: path.join(evidenceDir, 'burton-tag-truth-analysis.json'),
    actionReport: path.join(evidenceDir, 'burton-account-cleanup-action-report.json'),
    workflowDetails: path.join(evidenceDir, 'patchy-live-workflow-details.json'),
    messages: path.join(evidenceDir, 'patchy-live-message-export.json'),
    manifest: path.join(evidenceDir, 'patchy-live-collect-manifest.json'),
  };

  fs.writeFileSync(files.liveInventory, `${JSON.stringify(liveInventory, null, 2)}\n`);
  fs.writeFileSync(files.workflowAudit, `${JSON.stringify({ content: [{ type: 'text', text: JSON.stringify(workflowAudit, null, 2) }] }, null, 2)}\n`);
  fs.writeFileSync(files.tagTruth, `${JSON.stringify(tagTruth, null, 2)}\n`);
  fs.writeFileSync(files.actionReport, `${JSON.stringify(actionReport, null, 2)}\n`);
  fs.writeFileSync(files.workflowDetails, `${JSON.stringify(workflowDetails, null, 2)}\n`);
  fs.writeFileSync(files.messages, `${JSON.stringify(messages, null, 2)}\n`);
  fs.writeFileSync(files.manifest, `${JSON.stringify({
    generatedAt: new Date().toISOString(),
    locationId,
    evidenceDir,
    writesExecuted: false,
    files,
    endpointStatus: Object.fromEntries(
      [tags, pipelines, customFields, conversations, calendars, forms, location].map((item) => [
        item.name,
        { ok: item.ok, status: item.status, endpoint: item.endpoint },
      ]),
    ),
    workflowList: { ok: workflowList.ok, status: workflowList.status, count: workflowList.count || workflowList.rows?.length || 0 },
    workflowDetails: { ok: workflowDetails.ok, status: workflowDetails.status, requested: workflowDetails.requested, failures: workflowDetails.failures.length },
    messages: { ok: messages.ok, skipped: messages.skipped || false, messagesScanned: messages.messagesScanned || messages.messages?.length || 0 },
  }, null, 2)}\n`);

  return { locationId, evidenceDir, files, workflowList, workflowDetails, messages };
}

function buildWorkflowAuditFromLive(workflowRows, details) {
  const detailById = new Map(details.map((detail) => [detail._id || detail.id, detail]));
  const flagged = [];
  for (const row of workflowRows) {
    const id = row._id || row.id;
    const detail = detailById.get(id) || row;
    const templates = detail.workflowData?.templates || detail.structure?.templates || detail.templates || [];
    const triggers = detail.triggers || detail.workflowData?.triggers || [];
    const issues = [];
    if (!Array.isArray(triggers) || triggers.length === 0) {
      issues.push('no_triggers: workflow has no trigger, so it cannot start automatically.');
    }
    if (!Array.isArray(templates) || templates.length === 0) {
      issues.push('no_actions: workflow has no action templates visible in the internal read.');
    }
    if (issues.length) {
      flagged.push({ id, name: row.name || detail.name, status: row.status || detail.status || 'unknown', issues });
    }
  }
  const nameCounts = countBy(workflowRows, (row) => String(row.name || '').trim().toLowerCase());
  for (const [name, count] of Object.entries(nameCounts)) {
    if (name && count > 1) {
      for (const row of workflowRows.filter((candidate) => String(candidate.name || '').trim().toLowerCase() === name)) {
        const existing = flagged.find((item) => item.id === (row._id || row.id));
        if (existing) existing.issues.push('duplicate_name: another workflow has the same name.');
        else flagged.push({ id: row._id || row.id, name: row.name, status: row.status || 'unknown', issues: ['duplicate_name: another workflow has the same name.'] });
      }
    }
  }
  return {
    auditedCount: workflowRows.length,
    flaggedCount: flagged.length,
    limitation: 'Live read-only structural audit. Checks visible triggers/actions from internal workflow reads; strategy and copy quality still need Workflow Doctor review.',
    flagged,
    issueCounts: {
      no_triggers: flagged.filter((row) => row.issues.some((issue) => issue.startsWith('no_triggers'))).length,
      no_actions: flagged.filter((row) => row.issues.some((issue) => issue.startsWith('no_actions'))).length,
      duplicate_name: flagged.filter((row) => row.issues.some((issue) => issue.startsWith('duplicate_name'))).length,
    },
    statusCounts: countBy(workflowRows, (row) => row.status || 'unknown'),
  };
}

function buildTagTruthFromLive(locationId, tagsData) {
  const tags = arraysFrom(tagsData, ['tags', 'data', 'items']);
  const normalized = tags.map((tag) => ({ tag: tag.name || tag.tag || tag.value || tag.id, count: tag.count || tag.contactsCount || 0 }));
  const suppressionWords = /\b(stop|unsubscribe|dnd|do not|no promo|suppression|opt out|opt-out)\b/i;
  const trainingWords = /\b(training|webinar|lesson|registered|attended|invite|everwebinar)\b/i;
  return {
    generatedAt: new Date().toISOString(),
    locationId,
    coverage: { source: 'live tag inventory only', contactAssignmentsKnown: false },
    currentTagInventory: {
      uniqueTagsUsed: normalized.length,
      topTags: normalized.sort((a, b) => b.count - a.count).slice(0, 100),
      suppressionTags: normalized.filter((row) => suppressionWords.test(row.tag)),
      trainingRelatedTags: normalized.filter((row) => trainingWords.test(row.tag)),
    },
    recommendations: [
      'Run Tag Doctor after Workflow Doctor checks tag dependencies.',
      'Do not treat legacy suppression tags as proof of opt-out without conversation evidence.',
      'Move behavioral segments to custom fields and smart lists.',
    ],
    proposedBatchPlan: { writesExecuted: false, approvalRequired: true },
  };
}

function buildActionReportFromLive({ locationId, inventory, workflowAudit, workflowDetails, messages }) {
  const workflows = arraysFrom(inventory.results.workflows.data, ['workflows']);
  const tags = arraysFrom(inventory.results.tags.data, ['tags']);
  const pipelines = arraysFrom(inventory.results.pipelines.data, ['pipelines']);
  const conversations = arraysFrom(inventory.results.conversations.data, ['conversations', 'items', 'data']);
  const missingRecipes = inferMissingRecipesFromLive(workflows);
  return {
    generatedAt: new Date().toISOString(),
    locationId,
    result: {
      workflow: { name: 'patchy_live_account_brain', title: 'Patchy Live Account Brain', access: 'read' },
      summary: 'Live read-only evidence collected and converted into a Patchy/Doctor routing report.',
      locationId,
      confirmationRequired: false,
      actionReport: {
        title: 'Patchy Live Account Brain Report',
        locationId,
        evidenceGrade: workflowDetails.failures?.length ? 'medium' : 'high',
        blockers: workflowAudit.flaggedCount ? ['workflow_internals_need_doctor_review'] : [],
        evidenceCoverage: {
          workflowsInspected: workflows.length,
          workflowDetailsRead: workflowDetails.details?.length || 0,
          tagsInspected: tags.length,
          pipelinesInspected: pipelines.length,
          conversationsSampled: conversations.length,
          messagesScanned: messages.messagesScanned || messages.messages?.length || 0,
        },
        doctorFindings: {
          conversation: {
            issueCounts: {},
            channelDistribution: {},
            directionDistribution: {},
            stageDistribution: {},
            awaitingReplyContacts: null,
            stalledAwaitingReplyContacts: null,
          },
          cleanup: {
            stageDistribution: {},
            snapshotBlockers: workflowAudit.flaggedCount ? ['critical_workflows_missing_or_unverified'] : [],
          },
          automation: {
            missingRecipes,
            weakRecipes: workflowAudit.flagged.slice(0, 10).map((row) => ({
              recipeKey: 'workflow_needs_review',
              workflowId: row.id,
              workflowName: row.name,
              status: row.status,
              blockers: row.issues,
              evidenceGrade: 'weak',
            })),
            readyForSnapshot: workflowAudit.flaggedCount === 0,
          },
          snapshot: {
            readyForGoldenSnapshot: workflowAudit.flaggedCount === 0,
            blockers: workflowAudit.flaggedCount ? ['automation_internals_not_verified', 'tag_dependency_review_missing'] : [],
          },
        },
        proposedActions: [
          {
            id: 'P01',
            priority: 'critical',
            doctor: 'Workflow Doctor',
            category: 'workflow',
            action: 'Deep-read flagged workflows and separate true broken workflows from unsupported metadata.',
            why: `${workflowAudit.flaggedCount} workflows were flagged by live structural audit.`,
            guardrail: 'Read-only until owner approves exact workflow changes.',
          },
          {
            id: 'P02',
            priority: 'high',
            doctor: 'Tag Doctor',
            category: 'taxonomy',
            action: 'Review live tags and dependency risk before tag cleanup.',
            why: `${tags.length} live tags found.`,
            guardrail: 'Do not delete tags until workflow dependencies and local backup are present.',
          },
          {
            id: 'P03',
            priority: 'high',
            doctor: 'Pipeline Doctor',
            category: 'pipeline',
            action: 'Verify canonical sales pipeline and stage map.',
            why: `${pipelines.length} live pipelines found.`,
            guardrail: 'Do not move opportunities until stage IDs are verified.',
          },
        ],
      },
    },
  };
}

function inferMissingRecipesFromLive(workflows) {
  const names = workflows.map((workflow) => String(workflow.name || '').toLowerCase()).join('\n');
  const recipes = [
    ['speed_to_lead', ['speed', 'new lead', 'lead intake']],
    ['lesson_opened_follow_up', ['lesson opened', 'lesson open']],
    ['lesson_completed_offer_follow_up', ['lesson completed', 'offer shown']],
    ['checkout_abandonment', ['checkout', 'abandon']],
    ['converted_onboarding', ['onboarding', 'grant access', 'welcome']],
    ['no_show_recovery', ['no show', 'no-show']],
    ['missed_call', ['missed call']],
    ['cancellation_save', ['cancel', 'save']],
  ];
  return recipes.filter(([, terms]) => !terms.some((term) => names.includes(term))).map(([key]) => key);
}

function parseWorkflowAudit(raw) {
  if (!raw?.ok) return null;
  const data = raw.data;
  if (data?.auditedCount) return data;
  const content = data?.content;
  const text = Array.isArray(content)
    ? content.find((part) => part?.type === 'text')?.text
    : content?.[0]?.text;
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function arrayFromInventoryResult(result, key) {
  const data = result?.data;
  if (!data) return [];
  if (Array.isArray(data)) return data;
  if (Array.isArray(data[key])) return data[key];
  if (key === 'workflows' && Array.isArray(data.rows)) return data.rows;
  return [];
}

function normalizeInventory(liveInventory) {
  const results = liveInventory?.data?.results || {};
  const rows = Object.values(results);
  const tags = rows.flatMap((row) => arrayFromInventoryResult(row, 'tags'));
  const pipelines = rows.flatMap((row) => arrayFromInventoryResult(row, 'pipelines'));
  const workflows = rows.flatMap((row) => arrayFromInventoryResult(row, 'workflows'));
  const tasks = rows.flatMap((row) => arrayFromInventoryResult(row, 'tasks'));
  const pipelineStages = pipelines.flatMap((pipeline) =>
    (pipeline.stages || []).map((stage) => ({
      ...stage,
      pipelineId: pipeline.id,
      pipelineName: pipeline.name,
    })),
  );
  return { tags, pipelines, pipelineStages, workflows, tasks };
}

function countBy(rows, pick) {
  const counts = {};
  for (const row of rows || []) {
    const key = pick(row) || 'unknown';
    counts[key] = (counts[key] || 0) + 1;
  }
  return Object.fromEntries(Object.entries(counts).sort((a, b) => b[1] - a[1]));
}

function topRows(rows, n = 20) {
  return [...(rows || [])].slice(0, n);
}

function getActionReport(actionReport) {
  return actionReport?.data?.result?.actionReport || actionReport?.data?.actionReport || null;
}

function buildPatchyMap(evidence) {
  const inventory = normalizeInventory(evidence.liveInventory);
  const workflowAudit = parseWorkflowAudit(evidence.workflowAudit);
  const tagTruth = evidence.tagTruth?.data || {};
  const optimizedPlan = evidence.optimizedPlan?.data || {};
  const actionReport = getActionReport(evidence.actionReport);
  const conversation = actionReport?.doctorFindings?.conversation || {};
  const cleanup = actionReport?.doctorFindings?.cleanup || {};
  const automation = actionReport?.doctorFindings?.automation || {};
  const snapshot = actionReport?.doctorFindings?.snapshot || {};
  const proposedActions = actionReport?.proposedActions || evidence.actionReport?.data?.result?.proposedActions || [];

  const workflowStatusCounts = workflowAudit?.statusCounts || countBy(inventory.workflows, (w) => w.status);
  const flaggedWorkflows = workflowAudit?.flagged || [];
  const flaggedPublished = flaggedWorkflows.filter((w) => w.status === 'published').length;
  const currentTopTags = tagTruth.currentTagInventory?.topTags || [];
  const suppressionTags = tagTruth.currentTagInventory?.suppressionTags || [];
  const trainingTags = tagTruth.currentTagInventory?.trainingRelatedTags || [];

  const findings = [];
  const addFinding = (finding) => findings.push(finding);

  addFinding({
    id: 'workflow-structure-risk',
    severity: workflowAudit?.flaggedCount ? 'critical' : 'unknown',
    area: 'workflows',
    title: 'Workflow structure is not trusted yet',
    evidence: {
      audited: workflowAudit?.auditedCount ?? inventory.workflows.length,
      flagged: workflowAudit?.flaggedCount ?? flaggedWorkflows.length,
      flaggedPublished,
      issueCounts: workflowAudit?.issueCounts || {},
      statusCounts: workflowStatusCounts,
      limitation: workflowAudit?.limitation || 'No internal workflow audit file found.',
    },
    interpretation:
      'PatchyHub would not let downstream Doctors depend on old automation behavior until workflow internals are deep-read and verified.',
  });

  addFinding({
    id: 'tag-taxonomy-noise',
    severity: (tagTruth.currentTagInventory?.uniqueTagsUsed || inventory.tags.length) > 50 ? 'high' : 'medium',
    area: 'tags',
    title: 'Legacy tags are too noisy to be the analysis source of truth',
    evidence: {
      liveTagCount: inventory.tags.length,
      uniqueTagsUsedOnContacts: tagTruth.currentTagInventory?.uniqueTagsUsed ?? null,
      topTags: topRows(currentTopTags, 12),
      suppressionTagCandidates: suppressionTags.length,
      trainingTagCandidates: trainingTags.length,
    },
    interpretation:
      'Tags should become a compact durable layer. Behavioral/account-analysis segments should move to custom fields and smart lists.',
  });

  addFinding({
    id: 'field-migration-needed',
    severity: optimizedPlan.proposedTagAssignmentsMovedToFields ? 'high' : 'unknown',
    area: 'custom_fields',
    title: 'Many discovered segments belong in fields, not tags',
    evidence: {
      optimizedUniqueTags: optimizedPlan.optimizedUniqueTags ?? null,
      optimizedTagAssignmentsToAdd: optimizedPlan.optimizedTagAssignmentsToAdd ?? null,
      tagAssignmentsMovedToFields: optimizedPlan.proposedTagAssignmentsMovedToFields ?? null,
      customFieldsPerContact: optimizedPlan.customFieldsPerContact ?? null,
      totalCustomFieldValuesToSet: optimizedPlan.totalCustomFieldValuesToSet ?? null,
      smartLists: optimizedPlan.smartLists || [],
    },
    interpretation:
      'PatchyHub would route this to Tag Doctor plus Organization Doctor before Bulk Apply. Smart lists become the filter layer.',
  });

  addFinding({
    id: 'pipeline-stage-gap',
    severity: (cleanup.snapshotBlockers || []).includes('pipeline_stages_not_canonical') ? 'critical' : 'medium',
    area: 'pipelines',
    title: 'Pipeline and stage map must be canonical before opportunity writes',
    evidence: {
      livePipelines: inventory.pipelines.map((p) => ({
        id: p.id,
        name: p.name,
        stageCount: (p.stages || []).length,
      })),
      stageDistribution: cleanup.stageDistribution || {},
      opportunitiesToCreateOrUpdate: optimizedPlan.opportunitiesToCreateOrUpdate ?? null,
      snapshotBlockers: cleanup.snapshotBlockers || [],
    },
    interpretation:
      'Pipeline Doctor should verify or create the canonical pipeline before any opportunity migration.',
  });

  addFinding({
    id: 'revenue-leak-signals',
    severity: 'high',
    area: 'sales',
    title: 'Conversation and task evidence show follow-up revenue leaks',
    evidence: {
      issueCounts: conversation.issueCounts || {},
      awaitingReplyContacts: conversation.awaitingReplyContacts ?? null,
      stalledAwaitingReplyContacts: conversation.stalledAwaitingReplyContacts ?? null,
      stageDistribution: conversation.stageDistribution || {},
      channelDistribution: conversation.channelDistribution || {},
    },
    interpretation:
      'Conversation Doctor should feed Follow-Up, Template, and Automation Doctors. Automation should remain draft until workflow internals are verified.',
  });

  addFinding({
    id: 'automation-recipe-gap',
    severity: (automation.missingRecipes || []).length ? 'high' : 'medium',
    area: 'automation',
    title: 'Several revenue workflows are missing or weakly evidenced',
    evidence: {
      missingRecipes: automation.missingRecipes || [],
      weakRecipes: automation.weakRecipes || [],
      readyForSnapshot: automation.readyForSnapshot ?? false,
    },
    interpretation:
      'Automation Doctor can draft recipe packets, but Workflow Doctor must inspect and test before publishing.',
  });

  addFinding({
    id: 'snapshot-not-ready',
    severity: snapshot.readyForGoldenSnapshot === false ? 'critical' : 'unknown',
    area: 'snapshot',
    title: 'Account is not snapshot-ready',
    evidence: {
      readyForGoldenSnapshot: snapshot.readyForGoldenSnapshot ?? false,
      blockers: snapshot.blockers || actionReport?.blockers || [],
    },
    interpretation:
      'Snapshot Readiness Doctor should run only after cleanup writes, verification, workflow internals, and dependency checks are clean.',
  });

  const modules = inferModules({ inventory, currentTopTags, proposedActions, automation, conversation });
  const doctorPlan = recommendDoctors({ findings, proposedActions, optimizedPlan, actionReport });

  return {
    generatedAt: new Date().toISOString(),
    mode: 'read-only',
    account: 'Burton Method',
    locationId:
      evidence.liveInventory?.data?.locationId ||
      evidence.tagTruth?.data?.locationId ||
      optimizedPlan.locationId ||
      actionReport?.locationId ||
      null,
    sourceFiles: Object.fromEntries(
      Object.entries(evidence).map(([key, value]) => [
        key,
        {
          file: value.file,
          ok: value.ok,
          missing: Boolean(value.missing),
          error: value.error || null,
        },
      ]),
    ),
    patchyConceptsApplied: [
      'import/map account surfaces',
      'separate verified structure from unverified claims',
      'flag dependency and contradiction risk before writes',
      'route specialist Doctors from map findings',
      'keep destructive actions gated behind approval and backup',
    ],
    inventorySummary: {
      tags: inventory.tags.length,
      pipelines: inventory.pipelines.length,
      pipelineStages: inventory.pipelineStages.length,
      workflows: inventory.workflows.length,
      tasks: inventory.tasks.length,
      workflowStatuses: workflowStatusCounts,
    },
    modules,
    findings,
    approvalCandidates: proposedActions,
    doctorPlan,
    hardGates: [
      'Do not run Bulk Apply Doctor until exact write packets are approved.',
      'Do not delete legacy tags until a local contact/tag backup exists and dependency checks are reviewed.',
      'Do not publish or enroll contacts into workflows until Workflow Doctor verifies internals and test evidence.',
      'Do not promote a snapshot until Snapshot Readiness Doctor reports no blockers.',
    ],
  };
}

function inferModules({ inventory, currentTopTags, proposedActions, automation, conversation }) {
  const workflowNames = inventory.workflows.map((w) => w.name || '').join('\n').toLowerCase();
  const tagNames = currentTopTags.map((t) => t.tag || '').join('\n').toLowerCase();
  const actionText = proposedActions.map((a) => `${a.doctor || ''} ${a.category || ''} ${a.action || ''}`).join('\n').toLowerCase();
  const has = (terms) => terms.some((term) => workflowNames.includes(term) || tagNames.includes(term) || actionText.includes(term));
  const modules = [];
  const push = (id, name, confidence, evidence, recommendedDoctors) => modules.push({ id, name, confidence, evidence, recommendedDoctors });

  push('sales-pipeline', 'Lead Journey / Sales Pipeline', 'high', {
    livePipelineCount: inventory.pipelines.length,
    stageSignalCount: Object.keys(conversation.stageDistribution || {}).length,
  }, ['Pipeline Doctor', 'Conversation Doctor', 'Bulk Apply Doctor']);

  if (has(['training', 'webinar', 'lesson', 'everwebinar'])) {
    push('training-webinar', 'Training / Lesson Funnel', 'high', {
      missingRecipes: (automation.missingRecipes || []).filter((r) => /lesson|no_show|training|checkout|offer/.test(r)),
    }, ['Workflow Doctor', 'Template Doctor', 'Automation Doctor']);
  }
  if (has(['discord', 'community'])) {
    push('discord-community', 'Discord / Community Access', 'medium', {}, ['Tag Doctor', 'Workflow Doctor']);
  }
  if (has(['cancel', 'refund', 'support', 'complaint'])) {
    push('support-cancellation', 'Support / Cancellation Risk', 'medium', {}, ['Conversation Doctor', 'Workflow Doctor']);
  }
  if (has(['stop', 'unsubscribe', 'do not', 'dnd', 'suppression'])) {
    push('suppression-compliance', 'Suppression / Consent', 'high', {}, ['Conversation Doctor', 'Tag Doctor']);
  }
  push('account-taxonomy', 'Account Taxonomy / Smart Lists', 'high', {
    liveTagCount: inventory.tags.length,
  }, ['Organization Doctor', 'Tag Doctor', 'Smart List Doctor']);

  return modules;
}

function recommendDoctors({ findings, proposedActions, optimizedPlan, actionReport }) {
  const byFinding = (id) => findings.find((finding) => finding.id === id);
  const actionCountByDoctor = countBy(proposedActions, (a) => a.doctor || 'Unassigned');
  return [
    {
      order: 1,
      doctor: 'Patchy Import / Map Doctor',
      mode: 'read-only',
      why: 'Create the account map and trust ledger before specialist analysis.',
      inputs: ['live inventory', 'workflow audit', 'tag inventory', 'action report'],
      findingsUsed: findings.map((f) => f.id),
      output: 'Patchy brain map, blockers, module guesses, and routing plan.',
    },
    {
      order: 2,
      doctor: 'Organization Doctor',
      mode: 'read-only',
      why: 'Normalize the account surfaces: tags, fields, pipelines, workflows, forms, calendars, templates, and dependency risk.',
      inputs: ['Patchy map', 'live inventory'],
      findingsUsed: ['tag-taxonomy-noise', 'field-migration-needed', 'pipeline-stage-gap'],
      output: 'Canonical taxonomy and dependency review packet.',
    },
    {
      order: 3,
      doctor: 'Workflow Doctor',
      mode: 'read-only',
      why: byFinding('workflow-structure-risk')?.interpretation,
      inputs: ['workflow inventory', 'internal workflow audit', 'automation recipe gaps'],
      findingsUsed: ['workflow-structure-risk', 'automation-recipe-gap'],
      output: 'Workflow internals verification, broken/draft/duplicate workflow list, automation safety gates.',
      localPriority: actionCountByDoctor['Conversation + Workflow Doctor'] ? 'high' : 'critical',
    },
    {
      order: 4,
      doctor: 'Pipeline Doctor',
      mode: 'read-only first, write only after approval',
      why: byFinding('pipeline-stage-gap')?.interpretation,
      inputs: ['pipeline inventory', 'stage distribution', 'opportunity plan'],
      findingsUsed: ['pipeline-stage-gap'],
      output: 'Canonical pipeline/stage map and opportunity migration readiness.',
    },
    {
      order: 5,
      doctor: 'Tag Doctor',
      mode: 'read-only first, write only after approval',
      why: byFinding('tag-taxonomy-noise')?.interpretation,
      inputs: ['tag inventory', 'optimized tag plan', 'smart list plan'],
      findingsUsed: ['tag-taxonomy-noise', 'field-migration-needed'],
      output: `${optimizedPlan.optimizedUniqueTags ?? 'optimized'} durable tags, field migrations, dependency-safe delete plan.`,
    },
    {
      order: 6,
      doctor: 'Conversation Doctor',
      mode: 'read-only classification, write only after approval',
      why: byFinding('revenue-leak-signals')?.interpretation,
      inputs: ['conversation evidence', 'message export', 'contact plan'],
      findingsUsed: ['revenue-leak-signals'],
      output: 'Stage, suppression, intent, follow-up, support risk, score, and score reason.',
    },
    {
      order: 7,
      doctor: 'Template Doctor',
      mode: 'draft only',
      why: 'Repeated manual replies should become reviewed saved templates before automation uses them.',
      inputs: ['repeated-message evidence', 'conversation Doctor segments'],
      findingsUsed: ['revenue-leak-signals', 'automation-recipe-gap'],
      output: 'Saved reply/template candidates with evidence examples.',
    },
    {
      order: 8,
      doctor: 'Automation Doctor',
      mode: 'draft only',
      why: 'Build revenue recovery recipes only after Workflow Doctor confirms account automation behavior.',
      inputs: ['workflow Doctor findings', 'template Doctor output', 'missing recipe list'],
      findingsUsed: ['automation-recipe-gap', 'workflow-structure-risk'],
      output: 'Draft automation recipe packets for approval.',
    },
    {
      order: 9,
      doctor: 'Action Report Doctor',
      mode: 'read-only',
      why: 'Combine Patchy findings and Doctor outputs into an exact approval packet.',
      inputs: ['all previous Doctor outputs'],
      findingsUsed: findings.map((f) => f.id),
      output: 'Approval dashboard with counts, examples, write packets, and rollback evidence.',
    },
    {
      order: 10,
      doctor: 'Bulk Apply Doctor',
      mode: 'write gated',
      why: 'Only writes after backups and owner approval.',
      inputs: ['approved write packets', 'local backups', 'verified pipeline/stage IDs'],
      findingsUsed: [],
      output: 'Applied tags, fields, opportunities, and verification reports.',
      blockedUntil: ['approval', 'backup', 'dependency review', 'workflow safety decision'],
    },
    {
      order: 11,
      doctor: 'Snapshot Readiness Doctor',
      mode: 'read-only verification',
      why: byFinding('snapshot-not-ready')?.interpretation,
      inputs: ['post-write verification', 'workflow internals', 'tag dependency proof', 'manifest'],
      findingsUsed: ['snapshot-not-ready'],
      output: 'Snapshot readiness pass/fail with remaining blockers.',
      currentStatus: actionReport?.doctorFindings?.snapshot?.readyForGoldenSnapshot === true ? 'ready' : 'not_ready',
    },
  ];
}

function renderMarkdown(map) {
  const lines = [];
  lines.push(`# ${map.account} Patchy Brain Doctor Plan`);
  lines.push('');
  lines.push(`Generated: ${map.generatedAt}`);
  lines.push(`Location: ${map.locationId || 'unknown'}`);
  lines.push(`Mode: ${map.mode}. No GHL writes were made.`);
  lines.push('');
  lines.push('## Executive Read');
  lines.push('');
  lines.push('PatchyHub should be the brain first: import/map the account, judge trust and dependencies, then route the Doctors. This CLI produced that local read-only brain pass from the available evidence files.');
  lines.push('');
  lines.push('## Inventory');
  lines.push('');
  lines.push(`- Workflows: ${map.inventorySummary.workflows}`);
  lines.push(`- Workflow statuses: ${Object.entries(map.inventorySummary.workflowStatuses).map(([k, v]) => `${k} ${v}`).join(', ')}`);
  lines.push(`- Tags: ${map.inventorySummary.tags}`);
  lines.push(`- Pipelines: ${map.inventorySummary.pipelines}`);
  lines.push(`- Pipeline stages: ${map.inventorySummary.pipelineStages}`);
  lines.push('');
  lines.push('## Patchy Findings');
  lines.push('');
  for (const finding of map.findings) {
    lines.push(`### ${finding.title}`);
    lines.push('');
    lines.push(`- Severity: ${finding.severity}`);
    lines.push(`- Area: ${finding.area}`);
    lines.push(`- Interpretation: ${finding.interpretation}`);
    lines.push('');
  }
  lines.push('## Recommended Doctor Order');
  lines.push('');
  for (const step of map.doctorPlan) {
    lines.push(`${step.order}. **${step.doctor}** (${step.mode})`);
    lines.push(`   - Why: ${step.why}`);
    lines.push(`   - Output: ${step.output}`);
    if (step.blockedUntil) lines.push(`   - Blocked until: ${step.blockedUntil.join(', ')}`);
  }
  lines.push('');
  lines.push('## Modules Patchy Detected');
  lines.push('');
  for (const module of map.modules) {
    lines.push(`- **${module.name}** (${module.confidence}) -> ${module.recommendedDoctors.join(', ')}`);
  }
  lines.push('');
  lines.push('## Hard Gates');
  lines.push('');
  for (const gate of map.hardGates) lines.push(`- ${gate}`);
  lines.push('');
  lines.push('## Source Files');
  lines.push('');
  for (const [key, source] of Object.entries(map.sourceFiles)) {
    lines.push(`- ${key}: ${source.ok ? 'ok' : source.missing ? 'missing' : `error - ${source.error}`} (${source.file})`);
  }
  return lines.join('\n');
}

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (char) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  })[char]);
}

function renderHtml(map) {
  const findingCards = map.findings.map((finding) => `
    <article class="card finding ${escapeHtml(finding.severity)}">
      <div class="meta">${escapeHtml(finding.area)} · ${escapeHtml(finding.severity)}</div>
      <h3>${escapeHtml(finding.title)}</h3>
      <p>${escapeHtml(finding.interpretation)}</p>
      <details><summary>Evidence</summary><pre>${escapeHtml(JSON.stringify(finding.evidence, null, 2))}</pre></details>
    </article>`).join('');
  const doctorRows = map.doctorPlan.map((step) => `
    <tr>
      <td>${step.order}</td>
      <td><strong>${escapeHtml(step.doctor)}</strong><br><small>${escapeHtml(step.mode)}</small></td>
      <td>${escapeHtml(step.why)}</td>
      <td>${escapeHtml(step.output)}</td>
    </tr>`).join('');
  const moduleRows = map.modules.map((module) => `
    <tr><td>${escapeHtml(module.name)}</td><td>${escapeHtml(module.confidence)}</td><td>${escapeHtml(module.recommendedDoctors.join(', '))}</td></tr>`).join('');
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(map.account)} Patchy Doctor Plan</title>
  <style>
    body{margin:0;background:#f5f7f8;color:#17202a;font-family:Inter,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}
    main{max-width:1180px;margin:0 auto;padding:32px 22px 56px}
    .hero{background:#111c24;color:white;border-radius:8px;padding:30px}
    .eyebrow{font-size:12px;text-transform:uppercase;letter-spacing:.08em;color:#9ec7ff}
    h1{margin:8px 0 10px;font-size:34px;letter-spacing:0} h2{margin-top:30px}
    .grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(190px,1fr));gap:14px;margin:18px 0}
    .card{background:white;border:1px solid #dce2e8;border-radius:8px;padding:18px}
    .metric{font-size:28px;font-weight:750}.label{color:#657282;font-size:13px}.meta{font-size:12px;color:#657282;text-transform:uppercase;letter-spacing:.06em}
    .finding.critical{border-left:4px solid #b42318}.finding.high{border-left:4px solid #d97706}.finding.medium{border-left:4px solid #2563eb}
    table{width:100%;border-collapse:collapse;background:white;border:1px solid #dce2e8;border-radius:8px;overflow:hidden}
    th,td{text-align:left;padding:10px 12px;border-bottom:1px solid #edf0f3;vertical-align:top;font-size:14px}
    th{background:#edf3f8} pre{white-space:pre-wrap;overflow:auto;background:#f8fafc;padding:12px;border-radius:6px}
  </style>
</head>
<body>
<main>
  <section class="hero">
    <div class="eyebrow">Patchy first · Doctors second · read-only</div>
    <h1>${escapeHtml(map.account)} Doctor Routing Plan</h1>
    <p>This is the local Patchy brain pass. It maps account evidence, flags risks, and tells the Doctors what to run next.</p>
  </section>
  <section class="grid">
    <div class="card"><div class="metric">${map.inventorySummary.workflows}</div><div class="label">workflows</div></div>
    <div class="card"><div class="metric">${map.inventorySummary.tags}</div><div class="label">live tags</div></div>
    <div class="card"><div class="metric">${map.inventorySummary.pipelines}</div><div class="label">pipelines</div></div>
    <div class="card"><div class="metric">${map.findings.filter((f) => f.severity === 'critical').length}</div><div class="label">critical findings</div></div>
  </section>
  <h2>Findings</h2>
  <section class="grid">${findingCards}</section>
  <h2>Doctor Order</h2>
  <table><thead><tr><th>#</th><th>Doctor</th><th>Why</th><th>Output</th></tr></thead><tbody>${doctorRows}</tbody></table>
  <h2>Detected Modules</h2>
  <table><thead><tr><th>Module</th><th>Confidence</th><th>Doctors</th></tr></thead><tbody>${moduleRows}</tbody></table>
  <h2>Hard Gates</h2>
  <ul>${map.hardGates.map((gate) => `<li>${escapeHtml(gate)}</li>`).join('')}</ul>
</main>
</body>
</html>`;
}

function runAnalyze(args) {
  const account = args.account || 'burton';
  const inputDir = path.resolve(process.cwd(), args.input || '../tmp');
  const outDir = path.resolve(process.cwd(), args.out || path.join(inputDir, 'patchy-doctor'));
  if (account !== 'burton') {
    throw new Error(`Only --account burton is wired in this first local version. Got: ${account}`);
  }

  const evidence = {
    liveInventory: readJsonIfExists(path.join(inputDir, 'burton-live-inventory-readonly.json')),
    workflowAudit: readJsonIfExists(path.join(inputDir, 'burton-internal-workflow-audit.json')),
    tagTruth: readJsonIfExists(path.join(inputDir, 'burton-tag-truth-analysis.json')),
    optimizedPlan: readJsonIfExists(path.join(inputDir, 'burton-optimized-account-doctor-plan.json')),
    actionReport: readJsonIfExists(path.join(inputDir, 'burton-account-cleanup-action-report.json')),
    conversationRollup: readJsonIfExists(path.join(inputDir, 'burton-conversation-evidence-rollup-full.json')),
  };

  const map = buildPatchyMap(evidence);
  ensureDir(outDir);
  const jsonPath = path.join(outDir, 'patchy-brain-map.json');
  const mdPath = path.join(outDir, 'patchy-doctor-plan.md');
  const htmlPath = path.join(outDir, 'patchy-doctor-dashboard.html');
  fs.writeFileSync(jsonPath, JSON.stringify(map, null, 2));
  fs.writeFileSync(mdPath, renderMarkdown(map));
  fs.writeFileSync(htmlPath, renderHtml(map));

  console.log(JSON.stringify({
    ok: true,
    mode: map.mode,
    account: map.account,
    locationId: map.locationId,
    outputs: { json: jsonPath, markdown: mdPath, html: htmlPath },
    findings: map.findings.map((f) => ({ id: f.id, severity: f.severity, area: f.area })),
    nextDoctors: map.doctorPlan.slice(0, 5).map((d) => `${d.order}. ${d.doctor}`),
  }, null, 2));
}

async function runCollect(args) {
  const result = await collectLiveEvidence(args);
  console.log(JSON.stringify({
    ok: true,
    mode: 'read-only',
    locationId: result.locationId,
    evidenceDir: result.evidenceDir,
    files: result.files,
    workflows: {
      count: result.workflowList.count || result.workflowList.rows?.length || 0,
      detailReads: result.workflowDetails.details?.length || 0,
      detailFailures: result.workflowDetails.failures?.length || 0,
    },
    messages: {
      skipped: result.messages.skipped || false,
      messagesScanned: result.messages.messagesScanned || result.messages.messages?.length || 0,
    },
  }, null, 2));
}

async function runCollectAndAnalyze(args) {
  const collected = await collectLiveEvidence(args);
  const analyzeArgs = {
    ...args,
    input: collected.evidenceDir,
    out: args.out || path.join(collected.evidenceDir, 'patchy-doctor-report'),
  };
  runAnalyze(analyzeArgs);
}

function printHelp() {
  console.log(`patchy-doctor

Usage:
  patchy-doctor bootstrap-auth --auth-blob-file tmp/ghl-auth-blob.txt
  patchy-doctor collect --location-id DZEpRd43MxUJKdtrev9t --evidence tmp/patchy-live-burton
  patchy-doctor run --account burton --location-id DZEpRd43MxUJKdtrev9t --evidence tmp/patchy-live-burton --out tmp/patchy-doctor
  patchy-doctor analyze --account burton --input tmp --out tmp/patchy-doctor

Commands:
  bootstrap-auth Save a fresh GHL refresh token from active-tab localStorage/auth blob.
  collect   Connect to real GHL and save read-only evidence locally.
  run       Collect live evidence, then build the PatchyHub-style Doctor routing plan.
  analyze   Build a local PatchyHub-style map and Doctor routing plan.

Options:
  --account   Account adapter to use. Currently: burton
  --location-id GHL sub-account/location ID. Defaults to Burton Method.
  --evidence  Directory to write collected live evidence.
  --input     Directory containing local evidence JSON files.
  --out       Output directory for JSON/Markdown/HTML.
  --include-messages Include cursor-based message export during collect.
  --max-message-pages Page cap for message export when included.
  --auth-blob-file File containing localStorage.getItem('a') from GHL.
  --refresh-token Raw GHL refresh token.
`);
}

const args = parseArgs(process.argv.slice(2));
const command = args._[0];
try {
  if (!command || command === 'help' || args.help) {
    printHelp();
  } else if (command === 'bootstrap-auth') {
    await runBootstrapAuth(args);
  } else if (command === 'collect') {
    await runCollect(args);
  } else if (command === 'run') {
    await runCollectAndAnalyze(args);
  } else if (command === 'analyze') {
    runAnalyze(args);
  } else {
    throw new Error(`Unknown command: ${command}`);
  }
} catch (error) {
  console.error(`patchy-doctor failed: ${error.message}`);
  process.exitCode = 1;
}
