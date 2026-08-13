#!/usr/bin/env node

import { copyFileSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { spawnSync } from 'node:child_process';
import { createInterface } from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const command = args[0] || 'help';

loadDotEnv();

const commands = {
  help,
  setup,
  connect,
  'first-run': firstRun,
  ready,
  demo,
  doctor,
  'agent-check': agentCheck,
  'auth-check': authCheck,
  'explain-error': explainError,
  'list-tools': listTools,
  'test-tool': testTool,
  'env-template': envTemplate,
  configure,
  'update-api': updateApi,
  explorer,
  report,
};

if (!commands[command]) {
  fail(`Unknown command: ${command}\n\n${helpText()}`);
}

await commands[command](args.slice(1));

function help() {
  console.log(helpText());
}

function helpText() {
  return `GoHighLevel MCP companion CLI

Usage:
  ghl-mcp <command> [options]

Commands:
  doctor                     Check local setup, build output, env, and API coverage files
  setup                      Create .env when needed, optionally collect credentials, build, and print next steps
  connect                    Interactive setup plus client config generation
  first-run                  Run the beginner setup validator and print the next best command
  ready                      Fast readiness check for local setup and optional live auth
  demo                       Print the MCP Apps demo/preview command and URL
  agent-check                Run safe setup validation for AI/dev agents
  auth-check                 Run a read-only GHL API token/location check
  explain-error <message>    Explain a common setup or GHL API error with next steps
  list-tools                 List MCP tools from the built registry
  test-tool <name> [json]    Execute one tool locally with JSON arguments
  env-template               Print a minimal .env template
  configure <client>         Print MCP client config JSON for codex, cursor, windsurf
  update-api                 Refresh official GHL API scan and generated tools
  explorer                   Print the local static tool explorer path
  report                     Generate docs/API-DASHBOARD.md and docs/tool-inventory.json

Options:
  --json                     Emit JSON where supported
  --profile <name>           Tool profile for generated config: curated, stable, full, official, raw
  --client <name>            MCP client for agent-check: codex, claude, cursor, windsurf
  --skip-tests               Skip npm test in agent-check
  --with-apps                Include MCP Apps install/build in setup or agent-check
  --write-report             Write SETUP_STATUS.md from agent-check
  --write                    Write generated MCP config to --target with backup
  --target <path>            Target path for --write config output
  --inline-env               Inline non-secret env values in generated config; keeps API key placeholder
  --fix                      Apply safe local fixes such as creating .env from .env.example
  --ci                       Non-interactive CI-friendly mode
  --no-network               Avoid network checks such as auth-check and npm install
  --search <text>            Filter list-tools output
  --category <name>          Filter list-tools output by category/module
  --access <name>            Filter list-tools output by read, write, or delete
  --stability <tier>         Filter by official, live-docs-supplemental, legacy-compatible, private-or-unstable, deprecated
  --destructive              Filter list-tools output to destructive tools
  --confirm                  Allow test-tool to run write/destructive tools
`;
}

async function doctor() {
  const options = parseOptions(args.slice(1));
  const result = getDoctorResult();
  if (options.json) {
    console.log(JSON.stringify(result, null, 2));
    if (result.status === 'fail') process.exitCode = 1;
    return;
  }

  printChecks(result.checks);
  printDoctorNextSteps(result);
  if (result.status === 'fail') process.exitCode = 1;
}

function getDoctorResult() {
  const pkg = readJson('package.json');
  const coverage = readCoverage();
  const checks = [
    check('Node >= 20', Number(process.versions.node.split('.')[0]) >= 20, process.version, 'Install Node 20 or newer, then rerun npm install.'),
    check('package.json', Boolean(pkg.name), pkg.name || 'missing'),
    check('dist/server.js', existsSync(join(repoRoot, 'dist/server.js')), existsSync(join(repoRoot, 'dist/server.js')) ? 'present' : 'run npm run build', 'Run npm run build from the repo root.'),
    check('dist/main.js', existsSync(join(repoRoot, 'dist/main.js')), existsSync(join(repoRoot, 'dist/main.js')) ? 'present' : 'run npm run build', 'Run npm run build from the repo root.'),
    check('coverage report', Boolean(coverage), 'docs/ghl-api-coverage.json', 'Run npm run scan:ghl-api only if generated coverage artifacts are missing or intentionally refreshed.'),
    check('GHL_API_KEY', Boolean(process.env.GHL_API_KEY), mask(process.env.GHL_API_KEY), 'Add GHL_API_KEY to .env. Use a HighLevel private integration or OAuth access token.'),
    check('GHL_LOCATION_ID', Boolean(process.env.GHL_LOCATION_ID), process.env.GHL_LOCATION_ID || 'missing', 'Add GHL_LOCATION_ID to .env. In HighLevel this is the sub-account Location ID.'),
    check('GHL_API_VERSION', Boolean(process.env.GHL_API_VERSION || 'v3'), process.env.GHL_API_VERSION || 'v3', 'v3 is the current HighLevel API version. Most modules use "v3"; ad-publishing and Conversations keep their own dated headers, routed automatically.'),
  ];

  if (coverage) {
    checks.push(
      check('official endpoint coverage', coverage.comparison?.coveragePercent === 100, `${coverage.comparison?.coveredCount || 0}/${coverage.comparison?.officialUniqueCount || 0}`, 'Run npm run scan:ghl-api if official API coverage intentionally changed.'),
      check('generated official tools data', existsSync(join(repoRoot, 'src/tools/official-spec-endpoints.json')), 'src/tools/official-spec-endpoints.json', 'Run npm run scan:ghl-api to regenerate official endpoint tool data.')
    );
  }

  const missingCredentials = checks.some((item) => ['GHL_API_KEY', 'GHL_LOCATION_ID'].includes(item.name) && !item.ok);
  const hardFailures = checks.some((item) => !item.ok && !['GHL_API_KEY', 'GHL_LOCATION_ID'].includes(item.name));
  return {
    status: hardFailures ? 'fail' : missingCredentials ? 'needsHumanAction' : 'ok',
    summary: {
      total: checks.length,
      passed: checks.filter((item) => item.ok).length,
      failed: checks.filter((item) => !item.ok).length,
      needsHumanAction: checks.filter((item) => ['GHL_API_KEY', 'GHL_LOCATION_ID'].includes(item.name) && !item.ok).length,
    },
    checks,
    apiVersionNote: 'GHL_API_VERSION=v3 is the HighLevel API Version header (a named version released 2026-06-11, not a date). Most modules use "v3"; ad-publishing keeps 2021-07-28 and Conversations keep 2021-04-15, routed automatically per endpoint. Set GHL_API_GENERATION=v2 to opt into the legacy pre-v3 surface.',
  };
}

async function setup(argv) {
  const options = parseOptions(argv);
  const interactive = !options.ci && !options.nonInteractive && process.stdin.isTTY;
  const envPath = join(repoRoot, '.env');
  const actions = [];

  if (!existsSync(envPath)) {
    copyFileSync(join(repoRoot, '.env.example'), envPath);
    actions.push('Created .env from .env.example');
  }

  if (interactive) {
    const rl = createInterface({ input, output });
    const updates = {};
    if (!process.env.GHL_API_KEY) {
      const value = await rl.question('GHL_API_KEY (leave blank to skip): ');
      if (value.trim()) updates.GHL_API_KEY = value.trim();
    }
    if (!process.env.GHL_LOCATION_ID) {
      const value = await rl.question('GHL_LOCATION_ID (leave blank to skip): ');
      if (value.trim()) updates.GHL_LOCATION_ID = value.trim();
    }
    rl.close();
    if (Object.keys(updates).length) {
      mergeDotEnv(updates);
      Object.assign(process.env, updates);
      actions.push(`Updated .env with ${Object.keys(updates).join(', ')}`);
    }
  }

  if (!options.noNetwork && !existsSync(join(repoRoot, 'node_modules'))) {
    runStep('npm install', ['npm', ['install']], actions);
  }
  runStep('npm run build', ['npm', ['run', 'build']], actions);
  if (options.withApps) {
    if (!options.noNetwork && !existsSync(join(repoRoot, 'mcp-apps', 'node_modules'))) runStep('npm run apps:install', ['npm', ['run', 'apps:install']], actions);
    runStep('npm run apps:build', ['npm', ['run', 'apps:build']], actions);
  }

  console.log('Setup complete.');
  for (const action of actions) console.log(`ok ${action}`);
  console.log('\nNext steps:');
  console.log('1. Add GHL_API_KEY and GHL_LOCATION_ID to .env if they are still placeholders.');
  console.log('2. Run npm run doctor.');
  console.log('3. Run npm run auth-check when credentials are present.');
  console.log('4. Run npm run configure:codex or another configure:* command for your MCP client.');
}

async function connect(argv) {
  const options = parseOptions(argv);
  const client = options.client || argv.find((item) => !item.startsWith('--')) || 'codex';
  const profile = options.profile || 'curated';
  const validation = await buildAgentCheckPayload({
    ...options,
    client,
    profile,
    skipTests: options.skipTests ?? true,
  });
  const config = buildConfig(client, profile, { inlineEnv: options.inlineEnv });
  const payload = {
    command: 'connect',
    client,
    profile,
    grade: setupGrade(validation),
    status: validation.status,
    config,
    nextSteps: [
      `Paste this config into ${client}.`,
      'Run npm run ready after credentials are present.',
      'Run npm run smoke:ghl-live for read-only live coverage checks.',
    ],
    remainingHumanActions: validation.remainingHumanActions,
    apiVersionNote: apiVersionNote(),
  };
  printPayload(payload, options.json);
  if (validation.status === 'fail') process.exitCode = 1;
}

async function firstRun(argv) {
  const options = parseOptions(argv);
  const payload = await buildAgentCheckPayload({ ...options, client: options.client || 'codex' });
  const result = {
    command: 'first-run',
    grade: setupGrade(payload),
    nextCommand: nextCommandForGrade(payload),
    ...payload,
  };
  printPayload(result, options.json);
  if (result.grade === 'missing-build' || result.grade === 'unsupported-node') process.exitCode = 1;
}

async function ready(argv) {
  const options = parseOptions(argv);
  const payload = await buildAgentCheckPayload({ ...options, client: options.client || 'codex' });
  const result = {
    command: 'ready',
    grade: setupGrade(payload),
    ...payload,
  };
  printPayload(result, options.json);
  if (['invalid-credentials', 'missing-build', 'unsupported-node'].includes(result.grade)) process.exitCode = 1;
}

function demo(argv) {
  const options = parseOptions(argv);
  const payload = {
    command: 'demo',
    url: 'http://localhost:3001/preview',
    mode: 'demo-data',
    commands: ['npm run apps:setup', 'npm run apps:preview'],
    note: 'The MCP Apps preview works without GHL credentials using demo/preview data.',
  };
  printPayload(payload, options.json);
}

async function agentCheck(argv) {
  const options = parseOptions(argv);
  const payload = await buildAgentCheckPayload(options);

  if (options.writeReport) writeSetupStatus(payload);
  if (options.json) {
    console.log(JSON.stringify(payload, null, 2));
  } else {
    printAgentCheck(payload);
  }
  if (payload.status === 'fail') process.exitCode = 1;
}

async function buildAgentCheckPayload(options) {
  const client = options.client || 'codex';
  const steps = [];
  const safety = { destructiveToolsRun: false, writeToolsRun: false };

  if (options.fix && !existsSync(join(repoRoot, '.env'))) {
    copyFileSync(join(repoRoot, '.env.example'), join(repoRoot, '.env'));
    steps.push(stepResult('create .env', true, 'Created .env from .env.example'));
  }

  steps.push(stepResult('Node >= 20', Number(process.versions.node.split('.')[0]) >= 20, process.version));
  steps.push(stepResult('dependencies', existsSync(join(repoRoot, 'node_modules')) || options.noNetwork, existsSync(join(repoRoot, 'node_modules')) ? 'node_modules present' : options.noNetwork ? 'skipped because --no-network was set' : 'node_modules missing'));

  if (!options.noNetwork && !existsSync(join(repoRoot, 'node_modules'))) {
    steps.push(runCheckStep('npm install', 'npm', ['install']));
  }
  steps.push(runCheckStep('npm run build', 'npm', ['run', 'build']));
  steps.push(runCheckStep('npm run lint', 'npm', ['run', 'lint']));
  if (!options.skipTests) steps.push(runCheckStep('npm test', 'npm', ['test']));
  if (options.withApps) {
    if (!options.noNetwork && !existsSync(join(repoRoot, 'mcp-apps', 'node_modules'))) steps.push(runCheckStep('npm run apps:install', 'npm', ['run', 'apps:install']));
    steps.push(runCheckStep('npm run apps:build', 'npm', ['run', 'apps:build']));
  }

  const doctorResult = getDoctorResult();
  const hasCredentials = Boolean(process.env.GHL_API_KEY && process.env.GHL_LOCATION_ID);
  const auth = hasCredentials && !options.noNetwork
    ? runCheckStep('auth-check', process.execPath, [cliPath(), 'auth-check'])
    : stepResult('auth-check', true, hasCredentials ? 'skipped because --no-network was set' : 'skipped until GHL_API_KEY and GHL_LOCATION_ID are provided', 'skipped');
  const config = buildConfig(client, options.profile || 'curated');
  const hardFailure = steps.some((step) => !step.ok) || doctorResult.status === 'fail' || auth.ok === false;
  const status = hardFailure ? 'fail' : doctorResult.status === 'needsHumanAction' || auth.status === 'skipped' ? 'needsHumanAction' : 'ok';
  return {
    status,
    mode: options.noNetwork ? 'no-network' : hasCredentials ? 'credentials-provided' : 'no-credentials',
    steps,
    doctor: doctorResult,
    auth,
    config: { client, profile: options.profile || 'curated', config },
    safety,
    remainingHumanActions: remainingActions(doctorResult, auth),
  };
}

async function authCheck() {
  const apiKey = requireEnv('GHL_API_KEY');
  const locationId = requireEnv('GHL_LOCATION_ID');
  const baseUrl = process.env.GHL_BASE_URL || 'https://services.leadconnectorhq.com';
  const version = process.env.GHL_API_VERSION || 'v3';
  const response = await fetch(`${baseUrl}/locations/${encodeURIComponent(locationId)}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      Version: version,
      Accept: 'application/json',
    },
  });

  console.log(`${response.ok ? 'ok' : 'fail'} auth-check: HTTP ${response.status}`);
  if (!response.ok) {
    const text = await response.text();
    console.log(text.slice(0, 600));
    process.exit(1);
  }
}

async function listTools(argv) {
  const inventory = await getInventory();
  const options = parseOptions(argv);
  const filtered = inventory.filter((tool) => {
    if (options.search && !`${tool.name} ${tool.description} ${tool.category}`.toLowerCase().includes(options.search.toLowerCase())) return false;
    if (options.category && tool.category !== options.category && tool.module !== options.category) return false;
    if (options.access && tool.access !== options.access) return false;
    if (options.stability && tool.stability !== options.stability) return false;
    if (options.destructive && !tool.destructive) return false;
    return true;
  });

  if (options.json) {
    console.log(JSON.stringify({ count: filtered.length, tools: filtered }, null, 2));
    return;
  }

  console.log(`Tools: ${filtered.length}`);
  for (const tool of filtered) {
    const flags = [tool.access, tool.stability, tool.destructive ? 'destructive' : ''].filter(Boolean).join(', ');
    console.log(`${tool.name}  [${tool.category}; ${flags}]`);
  }
}

async function testTool(argv) {
  const name = argv[0];
  if (!name) fail('Usage: ghl-mcp test-tool <name> [json-arguments] [--confirm]');
  const options = parseOptions(argv.slice(1));
  const jsonArg = argv.find((item, index) => index > 0 && item.trim().startsWith('{'));
  const toolArgs = jsonArg ? JSON.parse(jsonArg) : {};
  const inventory = await getInventory();
  const tool = inventory.find((item) => item.name === name);
  if (!tool) fail(`Unknown tool: ${name}`);
  if (!tool.readOnly && !options.confirm) {
    fail(`Refusing to run ${tool.access} tool without --confirm: ${name}`);
  }

  const { ToolRegistry } = await importBuilt('tool-registry.js');
  const { EnhancedGHLClient } = await importBuilt('enhanced-ghl-client.js');
  const client = new EnhancedGHLClient(readGhlConfig());
  const registry = new ToolRegistry(client);
  const result = await registry.callTool(name, toolArgs);
  console.log(JSON.stringify(result, null, 2));
}

function envTemplate() {
  console.log(`GHL_API_KEY=your_private_integration_api_key
GHL_LOCATION_ID=your_location_id
GHL_BASE_URL=https://services.leadconnectorhq.com
GHL_API_VERSION=v3
MCP_SERVER_PORT=8000
NODE_ENV=development`);
}

function configure(argv) {
  const options = parseOptions(argv);
  const client = (argv.find((item) => !item.startsWith('--') && !['curated', 'stable', 'full', 'official', 'raw'].includes(item)) || 'codex').toLowerCase();
  const profile = options.profile || 'curated';
  const config = buildConfig(client, profile, { inlineEnv: options.inlineEnv });
  if (options.write) {
    const target = options.target ? resolve(repoRoot, options.target) : join(repoRoot, `${client}-mcp-config.json`);
    const backup = writeConfigFile(target, config);
    const payload = { client, profile, config, wrote: target, backup, apiVersionNote: apiVersionNote() };
    printPayload(payload, options.json);
    return;
  }
  if (options.json) {
    console.log(JSON.stringify({ client, profile, config, apiVersionNote: apiVersionNote() }, null, 2));
    return;
  }
  console.log(JSON.stringify(config, null, 2));
  console.log(`\nUsing GHL_TOOL_PROFILE=${profile}. ${apiVersionNote()}`);
}

function explainError(argv) {
  const options = parseOptions(argv);
  const message = argv.filter((item) => !item.startsWith('--')).join(' ') || 'unknown';
  const payload = explainErrorMessage(message);
  printPayload(payload, options.json);
}

function updateApi(argv) {
  const options = parseOptions(argv);
  const result = spawnSync('npm', ['run', options.check ? 'ci:ghl-api-drift' : 'scan:ghl-api'], {
    cwd: repoRoot,
    stdio: 'inherit',
    shell: false,
  });
  process.exit(result.status || 0);
}

function explorer() {
  const explorerPath = join(repoRoot, 'docs/tool-explorer.html');
  console.log(explorerPath);
  console.log('Run npm run tools:report first if docs/tool-inventory.json is stale.');
}

async function report() {
  const coverage = readCoverage();
  if (!coverage) fail('Missing docs/ghl-api-coverage.json. Run npm run scan:ghl-api first.');
  const inventory = await getInventory();
  const byCategory = countBy(inventory, 'category');
  const byAccess = countBy(inventory, 'access');
  const byStability = countBy(inventory, 'stability');
  const officialCommit = coverage.official?.commit || 'unknown';
  const shortCommit = coverage.official?.tag || officialCommit.slice(0, 7);
  const generatedFrom = {
    officialDocsCommit: officialCommit,
    officialDocsTag: shortCommit,
    coveragePercent: coverage.comparison?.coveragePercent || 0,
  };

  mkdirSync(join(repoRoot, 'docs'), { recursive: true });
  writeFileSync(join(repoRoot, 'docs/tool-inventory.json'), JSON.stringify({ generatedFrom, tools: inventory }, null, 2) + '\n');

  const topCategories = Object.entries(byCategory)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20)
    .map(([name, count]) => `| ${name} | ${count} |`)
    .join('\n');

  const dashboard = `# GoHighLevel MCP API Dashboard

Generated from official GHL docs commit: ${shortCommit}

## Coverage

- Official GHL docs source: ${coverage.official?.repo || 'unknown'}
- Official docs commit: ${shortCommit}
- Official endpoints parsed: ${coverage.comparison?.officialUniqueCount || 0}
- Official endpoints covered: ${coverage.comparison?.coveredCount || 0}
- Coverage: ${coverage.comparison?.coveragePercent || 0}%
- MCP tools in registry: ${inventory.length}
- Read tools: ${byAccess.read || 0}
- Write tools: ${(byAccess.write || 0)}
- Delete/destructive tools: ${(byAccess.delete || 0)}
- Local-only endpoint references tracked: ${coverage.comparison?.localOnly?.length || 0}

## Stability Tiers

- Official OpenAPI tools: ${byStability.official || 0}
- Live-docs supplemental tools: ${byStability['live-docs-supplemental'] || 0}
- Legacy-compatible tools: ${byStability['legacy-compatible'] || 0}
- Private/internal unstable tools: ${byStability['private-or-unstable'] || 0}
- Deprecated/compatibility tools: ${byStability.deprecated || 0}

## Largest Tool Categories

| Category | Tools |
| --- | ---: |
${topCategories}

## Maintenance Commands

\`\`\`bash
npm run tools:doctor
npm run tools:report
npm run scan:ghl-api
npm run ci:ghl-api-drift
\`\`\`

The daily API drift workflow refreshes the official GoHighLevel docs snapshot and opens a PR when generated MCP artifacts change.
`;

  writeFileSync(join(repoRoot, 'docs/API-DASHBOARD.md'), dashboard);
  console.log('Wrote docs/API-DASHBOARD.md');
  console.log('Wrote docs/tool-inventory.json');
}

async function getInventory() {
  ensureBuilt();
  const { ToolRegistry } = await importBuilt('tool-registry.js');
  const { EnhancedGHLClient } = await importBuilt('enhanced-ghl-client.js');
  const client = new EnhancedGHLClient({
    accessToken: process.env.GHL_API_KEY || 'tooling-token',
    baseUrl: process.env.GHL_BASE_URL || 'https://services.leadconnectorhq.com',
    version: process.env.GHL_API_VERSION || 'v3',
    locationId: process.env.GHL_LOCATION_ID || 'tooling-location',
  });
  return new ToolRegistry(client).getToolInventory();
}

function ensureBuilt() {
  if (existsSync(join(repoRoot, 'dist/tool-registry.js')) && existsSync(join(repoRoot, 'dist/enhanced-ghl-client.js'))) return;
  console.log('Build output missing; running npm run build...');
  const result = spawnSync('npm', ['run', 'build'], { cwd: repoRoot, stdio: 'inherit' });
  if (result.status !== 0) process.exit(result.status || 1);
}

function importBuilt(file) {
  return import(pathToFileURL(join(repoRoot, 'dist', file)).href);
}

function readGhlConfig() {
  return {
    accessToken: requireEnv('GHL_API_KEY'),
    baseUrl: process.env.GHL_BASE_URL || 'https://services.leadconnectorhq.com',
    version: process.env.GHL_API_VERSION || 'v3',
    locationId: requireEnv('GHL_LOCATION_ID'),
  };
}

function readCoverage() {
  try {
    return readJson('docs/ghl-api-coverage.json');
  } catch {
    return null;
  }
}

function readJson(path) {
  return JSON.parse(readFileSync(join(repoRoot, path), 'utf8'));
}

function loadDotEnv() {
  const path = join(repoRoot, '.env');
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, 'utf8').split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim().replace(/^['"]|['"]$/g, '');
    if (!process.env[key]) process.env[key] = value;
  }
}

function parseOptions(argv) {
  const options = {};
  for (let i = 0; i < argv.length; i += 1) {
    const item = argv[i];
    if (item === '--json') options.json = true;
    if (item === '--confirm') options.confirm = true;
    if (item === '--check') options.check = true;
    if (item === '--skip-tests') options.skipTests = true;
    if (item === '--with-apps') options.withApps = true;
    if (item === '--write-report') options.writeReport = true;
    if (item === '--write') options.write = true;
    if (item === '--inline-env') options.inlineEnv = true;
    if (item === '--destructive') options.destructive = true;
    if (item === '--fix') options.fix = true;
    if (item === '--ci') options.ci = true;
    if (item === '--no-network') options.noNetwork = true;
    if (item === '--non-interactive') options.nonInteractive = true;
    if (item === '--profile') options.profile = argv[++i] || 'curated';
    if (item === '--client') options.client = (argv[++i] || 'codex').toLowerCase();
    if (item === '--target') options.target = argv[++i] || '';
    if (item === '--search') options.search = argv[++i] || '';
    if (item === '--category') options.category = argv[++i] || '';
    if (item === '--access') options.access = argv[++i] || '';
    if (item === '--stability') options.stability = argv[++i] || '';
  }
  return options;
}

function check(name, ok, detail, nextStep = '') {
  return { name, ok, detail, nextStep: ok ? '' : nextStep };
}

function printChecks(checks) {
  for (const item of checks) {
    console.log(`${item.ok ? 'ok' : 'fail'} ${item.name}: ${item.detail}`);
    if (!item.ok && item.nextStep) console.log(`  next: ${item.nextStep}`);
  }
}

function printDoctorNextSteps(result) {
  if (result.status === 'ok') {
    console.log('\nReady. Next: npm run auth-check, then npm run configure:codex.');
    return;
  }
  console.log('\nNext steps:');
  for (const item of result.checks.filter((check) => !check.ok && check.nextStep)) {
    console.log(`- ${item.nextStep}`);
  }
  console.log(`- ${apiVersionNote()}`);
}

function countBy(items, key) {
  return items.reduce((acc, item) => {
    const value = item[key] || 'unknown';
    acc[value] = (acc[value] || 0) + 1;
    return acc;
  }, {});
}

function requireEnv(name) {
  if (!process.env[name]) fail(`${name} is required`);
  return process.env[name];
}

function mask(value) {
  if (!value) return 'missing';
  return `${value.slice(0, 4)}...${value.slice(-4)}`;
}

function cliPath() {
  return join(repoRoot, 'scripts', 'ghl-mcp.mjs');
}

function apiVersionNote() {
  return 'GHL_API_VERSION=v3 is the HighLevel API Version header (a named version released 2026-06-11, not a date). Most modules use "v3"; ad-publishing keeps 2021-07-28 and Conversations keep 2021-04-15, routed automatically. Set GHL_API_GENERATION=v2 for the legacy pre-v3 surface.';
}

function buildConfig(client, profile, buildOptions = {}) {
  if (!['codex', 'claude', 'cursor', 'windsurf'].includes(client)) fail('Supported clients: codex, claude, cursor, windsurf');
  if (!['curated', 'stable', 'full', 'official', 'raw'].includes(profile)) fail('Supported profiles: curated, stable, full, official, raw');
  return {
    mcpServers: {
      ghl: {
        command: 'node',
        args: [join(repoRoot, 'dist/server.js')],
        env: {
          GHL_API_KEY: '${GHL_API_KEY}',
          GHL_LOCATION_ID: buildOptions.inlineEnv ? (process.env.GHL_LOCATION_ID || '${GHL_LOCATION_ID}') : '${GHL_LOCATION_ID}',
          GHL_BASE_URL: process.env.GHL_BASE_URL || 'https://services.leadconnectorhq.com',
          GHL_API_VERSION: process.env.GHL_API_VERSION || 'v3',
          GHL_TOOL_PROFILE: profile,
        },
      },
    },
  };
}

function writeConfigFile(target, config) {
  mkdirSync(dirname(target), { recursive: true });
  const backup = existsSync(target) ? `${target}.bak` : null;
  if (backup) copyFileSync(target, backup);
  writeFileSync(target, JSON.stringify(config, null, 2) + '\n');
  return backup;
}

function setupGrade(payload) {
  if (payload.steps.some((step) => step.name === 'Node >= 20' && !step.ok)) return 'unsupported-node';
  if (payload.steps.some((step) => step.name === 'npm run build' && !step.ok)) return 'missing-build';
  if (payload.auth.status === 'fail') return 'invalid-credentials';
  if (payload.doctor.status === 'needsHumanAction') return 'needs-credentials';
  if (payload.auth.status === 'skipped') return 'ready-no-live-auth';
  if (payload.status === 'ok') return 'ready';
  return payload.status;
}

function nextCommandForGrade(payload) {
  const grade = setupGrade(payload);
  if (grade === 'needs-credentials') return `Add GHL_API_KEY and GHL_LOCATION_ID to .env, then run npm run ready. You can still run npm run configure:${payload.config.client} now for placeholder MCP config.`;
  if (grade === 'ready-no-live-auth') return 'Run npm run auth-check when network access and credentials are available.';
  if (grade === 'invalid-credentials') return 'Run npm run explain-error with the auth error, then verify the token and Location ID in HighLevel.';
  if (grade === 'missing-build') return 'Run npm run build.';
  if (grade === 'unsupported-node') return 'Install Node 20 or newer.';
  return `Paste the ${payload.config.client} MCP config from npm run configure:${payload.config.client}.`;
}

function explainErrorMessage(message) {
  const normalized = message.toLowerCase();
  if (normalized.includes('location is not active')) {
    return {
      code: 'location-inactive',
      meaning: 'HighLevel accepted the request shape but the configured Location ID is inactive or unavailable to this token.',
      nextSteps: [
        'Confirm the Location ID belongs to an active HighLevel sub-account.',
        'Confirm the private integration token has access to that Location ID.',
        'Run npm run auth-check again after the location is active.',
      ],
    };
  }
  if (normalized.includes('companyid')) {
    return {
      code: 'company-id-required',
      meaning: 'The endpoint needs a HighLevel companyId. The live smoke command derives it from the location response.',
      nextSteps: ['Run npm run smoke:ghl-live with a valid Location ID.', 'For direct user search calls, include companyId when the endpoint requires it.'],
    };
  }
  if (normalized.includes('unauthorized') || normalized.includes('401')) {
    return {
      code: 'unauthorized',
      meaning: 'The token does not have access to the requested resource or scope.',
      nextSteps: ['Verify the token is active.', 'Verify scopes and location access.', 'Run npm run auth-check.'],
    };
  }
  if (normalized.includes('dist/server.js') || normalized.includes('build')) {
    return {
      code: 'missing-build',
      meaning: 'The MCP client points at built output that does not exist yet.',
      nextSteps: ['Run npm run build.', 'Regenerate client config after the build succeeds.'],
    };
  }
  if (normalized.includes('node')) {
    return {
      code: 'unsupported-node',
      meaning: 'This repo expects Node 20 or newer.',
      nextSteps: ['Install Node 20+.', 'Run npm install again after switching Node versions.'],
    };
  }
  return {
    code: 'unknown',
    meaning: 'This is not one of the known setup errors yet.',
    nextSteps: ['Run npm run doctor -- --json.', 'Run npm run agent:check -- --json.', 'Use the first failing check as the next fix.'],
  };
}

function printPayload(payload, json) {
  if (json) {
    console.log(JSON.stringify(payload, null, 2));
    return;
  }
  if (payload.command) console.log(`${payload.command}: ${payload.grade || payload.mode || 'ok'}`);
  if (payload.url) console.log(payload.url);
  if (payload.nextCommand) console.log(`next: ${payload.nextCommand}`);
  if (payload.code) {
    console.log(`${payload.code}: ${payload.meaning}`);
    for (const step of payload.nextSteps || []) console.log(`- ${step}`);
  }
  if (payload.wrote) {
    console.log(`Wrote ${payload.wrote}`);
    if (payload.backup) console.log(`Backup ${payload.backup}`);
  }
}

function runStep(label, command, actions) {
  const [cmd, commandArgs] = command;
  const result = spawnSync(cmd, commandArgs, { cwd: repoRoot, stdio: 'inherit', shell: false });
  if (result.status !== 0) process.exit(result.status || 1);
  actions.push(label);
}

function runCheckStep(name, cmd, commandArgs) {
  const result = spawnSync(cmd, commandArgs, { cwd: repoRoot, encoding: 'utf8', shell: false });
  return stepResult(name, result.status === 0, result.status === 0 ? 'passed' : (result.stderr || result.stdout || 'failed').slice(0, 800));
}

function stepResult(name, ok, detail, status) {
  return { name, ok, status: status || (ok ? 'ok' : 'fail'), detail };
}

function remainingActions(doctorResult, auth) {
  const actions = doctorResult.checks.filter((item) => !item.ok && item.nextStep).map((item) => item.nextStep);
  if (auth.status === 'skipped') actions.push('Run npm run auth-check after adding real GHL credentials.');
  if (auth.status === 'fail') actions.push('Verify that GHL_API_KEY is active and has access to the configured GHL_LOCATION_ID. HighLevel returned an auth/location error.');
  return [...new Set(actions)];
}

function printAgentCheck(payload) {
  console.log(`agent-check: ${payload.status}`);
  for (const step of payload.steps) console.log(`${step.ok ? 'ok' : 'fail'} ${step.name}: ${step.detail}`);
  console.log(`${payload.auth.ok ? 'ok' : 'fail'} ${payload.auth.name}: ${payload.auth.detail}`);
  console.log(`config: ${payload.config.client} (${payload.config.profile})`);
  if (payload.remainingHumanActions.length) {
    console.log('\nRemaining human actions:');
    for (const action of payload.remainingHumanActions) console.log(`- ${action}`);
  }
}

function writeSetupStatus(payload) {
  const lines = [
    '# Setup Status',
    '',
    `Status: ${payload.status}`,
    `Mode: ${payload.mode}`,
    '',
    '## Checks',
    ...payload.steps.map((step) => `- ${step.ok ? 'ok' : 'fail'} ${step.name}: ${step.detail}`),
    `- ${payload.auth.ok ? 'ok' : 'fail'} ${payload.auth.name}: ${payload.auth.detail}`,
    '',
    '## MCP Config',
    `- Client: ${payload.config.client}`,
    `- Tool profile: ${payload.config.profile}`,
    `- Server path: ${payload.config.config.mcpServers.ghl.args[0]}`,
    '',
    '## Safety',
    `- Destructive tools run: ${payload.safety.destructiveToolsRun ? 'yes' : 'no'}`,
    `- Write tools run: ${payload.safety.writeToolsRun ? 'yes' : 'no'}`,
    '',
    '## Remaining Human Actions',
    ...(payload.remainingHumanActions.length ? payload.remainingHumanActions.map((action) => `- ${action}`) : ['- None']),
    '',
    apiVersionNote(),
    '',
  ];
  writeFileSync(join(repoRoot, 'SETUP_STATUS.md'), lines.join('\n'));
}

function mergeDotEnv(updates) {
  const envPath = join(repoRoot, '.env');
  const existing = existsSync(envPath) ? readFileSync(envPath, 'utf8').split(/\r?\n/) : [];
  const seen = new Set();
  const next = existing.map((line) => {
    const key = line.includes('=') ? line.slice(0, line.indexOf('=')).trim() : '';
    if (!Object.prototype.hasOwnProperty.call(updates, key)) return line;
    seen.add(key);
    return `${key}=${updates[key]}`;
  });
  for (const [key, value] of Object.entries(updates)) {
    if (!seen.has(key)) next.push(`${key}=${value}`);
  }
  writeFileSync(envPath, next.join('\n').replace(/\n*$/, '\n'));
}

function fail(message) {
  console.error(message);
  process.exit(1);
}
