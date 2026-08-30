#!/usr/bin/env node

import { copyFileSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { spawnSync } from 'node:child_process';
import { createInterface } from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const command = args[0] || (process.stdin.isTTY ? 'shell' : 'help');

loadDotEnv();
if (process.env.GHL_ENV_FILE) loadEnvFile(resolve(process.env.GHL_ENV_FILE), true);

const commands = {
  help,
  version,
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
  tools: toolsCommand,
  describe: describeTool,
  schema: describeTool,
  call: callTool,
  exec: callTool,
  'test-tool': testTool,
  shell,
  'env-template': envTemplate,
  configure,
  'update-api': updateApi,
  explorer,
  report,
};

function help() {
  console.log(helpText());
}

function helpText() {
  return `GoHighLevel CLI and MCP companion

Usage:
  ghl-mcp <command> [options]
  ghl <command> [options]
  ghl <tool-name> [tool options]

Commands:
  tools [list]               Discover every exposed MCP tool
  describe <tool-name>       Show a tool's metadata and complete input schema
  call <tool-name>           Execute any MCP tool from the shell
  <tool-name>                Shorthand for call <tool-name>
  shell                      Start an interactive CLI shell
  doctor                     Check local setup, build output, env, and API coverage files
  setup                      Create .env when needed, optionally collect credentials, build, and print next steps
  connect                    Interactive setup plus client config generation
  first-run                  Run the beginner setup validator and print the next best command
  ready                      Fast readiness check for local setup and optional live auth
  demo                       Print the MCP Apps demo/preview command and URL
  agent-check                Run safe setup validation for AI/dev agents
  auth-check                 Run a read-only GHL API token/location check
  explain-error <message>    Explain a common setup or GHL API error with next steps
  list-tools                 Backward-compatible alias for tools list
  test-tool <name> [json]    Backward-compatible alias for call
  env-template               Print a minimal .env template
  configure <client>         Print MCP client config JSON for codex, cursor, windsurf
  update-api                 Refresh official GHL API scan and generated tools
  explorer                   Print the local static tool explorer path
  report                     Generate docs/API-DASHBOARD.md and docs/tool-inventory.json

Options:
  --json                     Emit JSON where supported
  --compact                  Emit compact one-line JSON for tool calls
  --result-only              Emit only the tool result instead of the CLI envelope
  --input <json>             Merge a JSON object into tool arguments
  --input-file <path>        Merge tool arguments from a JSON file; use - for stdin
  --env-file <path>          Load an explicit credential/location profile for this invocation
  --stdin                    Read a JSON object from stdin
  --set <path=value>         Set a tool argument; repeat and use dots for nested fields
  --dry-run                  Validate and print the resolved call without contacting GHL
  --location-id <id>         Override GHL_LOCATION_ID for this invocation
  --api-generation <v3|v2>   Override the active GHL API generation
  --api-version <value>      Override the fallback Version header
  --user-type <type>         Override GHL_USER_TYPE with Location or Company
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
  --confirm                  Allow a write/delete tool to execute

Tool arguments can also be passed as schema-aware flags:
  ghl get_contact --contact-id CONTACT_ID
  ghl call search_contacts --query Jane --limit 25
  ghl create_contact --email jane@example.com --tags '["lead","website"]' --confirm
  ghl call update_contact --input-file ./update.json --confirm
`;
}

function version() {
  const pkg = readJson('package.json');
  console.log(pkg.version);
}

async function doctor(argv) {
  const options = parseOptions(argv);
  applyRuntimeOptions(options);
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
  const apiGeneration = getApiGeneration();
  const apiVersion = getApiVersion(apiGeneration);
  const generatedToolsPath = [
    'src/tools/official-spec-endpoints.json',
    'dist/tools/official-spec-endpoints.json',
  ].find((path) => existsSync(join(repoRoot, path)));
  const checks = [
    check('Node >= 20', Number(process.versions.node.split('.')[0]) >= 20, process.version, 'Install Node 20 or newer, then rerun npm install.'),
    check('package.json', Boolean(pkg.name), pkg.name || 'missing'),
    check('dist/server.js', existsSync(join(repoRoot, 'dist/server.js')), existsSync(join(repoRoot, 'dist/server.js')) ? 'present' : 'run npm run build', 'Run npm run build from the repo root.'),
    check('dist/main.js', existsSync(join(repoRoot, 'dist/main.js')), existsSync(join(repoRoot, 'dist/main.js')) ? 'present' : 'run npm run build', 'Run npm run build from the repo root.'),
    check('coverage report', Boolean(coverage), 'docs/ghl-api-coverage.json', 'Run npm run scan:ghl-api only if generated coverage artifacts are missing or intentionally refreshed.'),
    check('GHL_API_KEY', Boolean(process.env.GHL_API_KEY), mask(process.env.GHL_API_KEY), 'Add GHL_API_KEY to .env. Use a HighLevel private integration or OAuth access token.'),
    check('GHL_LOCATION_ID', Boolean(process.env.GHL_LOCATION_ID), process.env.GHL_LOCATION_ID || 'missing', 'Add GHL_LOCATION_ID to .env. In HighLevel this is the sub-account Location ID.'),
    check('GHL_API_VERSION', Boolean(apiVersion), apiVersion, 'The default is v3 in current mode and 2023-02-21 in legacy v2 mode. Endpoint-specific routing may override it.'),
  ];

  if (coverage) {
    checks.push(
      check('official endpoint coverage', coverage.comparison?.coveragePercent === 100, `${coverage.comparison?.coveredCount || 0}/${coverage.comparison?.officialUniqueCount || 0}`, 'Run npm run scan:ghl-api if official API coverage intentionally changed.'),
      check('generated official tools data', Boolean(generatedToolsPath), generatedToolsPath || 'missing', 'Run npm run build or npm run scan:ghl-api to restore generated official endpoint tool data.')
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
    apiVersionNote: apiVersionNote(),
  };
}

async function setup(argv) {
  const options = parseOptions(argv);
  applyRuntimeOptions(options);
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
  applyRuntimeOptions(options);
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
  applyRuntimeOptions(options);
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
  applyRuntimeOptions(options);
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
  applyRuntimeOptions(options);
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

async function authCheck(argv) {
  applyRuntimeOptions(parseOptions(argv));
  const apiKey = requireEnv('GHL_API_KEY');
  const locationId = requireEnv('GHL_LOCATION_ID');
  const baseUrl = process.env.GHL_BASE_URL || 'https://services.leadconnectorhq.com';
  const version = getApiVersion(getApiGeneration());
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
  const options = parseOptions(argv);
  applyRuntimeOptions(options);
  const inventory = await getInventory();
  const filtered = inventory.filter((tool) => {
    if (options.search && !`${tool.name} ${tool.description} ${tool.category}`.toLowerCase().includes(options.search.toLowerCase())) return false;
    if (options.category && tool.category !== options.category && tool.module !== options.category) return false;
    if (options.access && tool.access !== options.access) return false;
    if (options.stability && tool.stability !== options.stability) return false;
    if (options.destructive && !tool.destructive) return false;
    return true;
  });

  if (options.namesOnly) {
    console.log(filtered.map((tool) => tool.name).join('\n'));
    return;
  }

  if (options.json) {
    printJson({ count: filtered.length, profile: getToolProfile(), tools: filtered }, options);
    return;
  }

  console.log(`Tools: ${filtered.length} (profile: ${getToolProfile()})`);
  for (const tool of filtered) {
    const flags = [tool.access, tool.stability, tool.destructive ? 'destructive' : ''].filter(Boolean).join(', ');
    console.log(`${tool.name}  [${tool.category}; ${flags}]`);
  }
}

async function toolsCommand(argv) {
  const subcommand = argv[0];
  if (!subcommand || subcommand.startsWith('-') || subcommand === 'list') {
    return listTools(subcommand === 'list' ? argv.slice(1) : argv);
  }
  if (subcommand === 'describe' || subcommand === 'schema') return describeTool(argv.slice(1));
  if (subcommand === 'call' || subcommand === 'exec') return callTool(argv.slice(1));
  fail('Usage: ghl tools [list|describe <tool>|call <tool>] [options]');
}

async function describeTool(argv) {
  const name = argv[0];
  if (!name || name.startsWith('-')) fail('Usage: ghl describe <tool-name> [--json] [--profile <name>]');
  const options = parseOptions(argv.slice(1));
  applyRuntimeOptions(options);
  const catalog = await getToolCatalog();
  const tool = catalog.inventory.find((item) => item.name === name);
  const definition = catalog.definitions.find((item) => item.name === name);
  if (!tool || !definition) failUnknownTool(name, catalog.inventory, false);

  const schema = normalizeInputSchema(definition);
  const payload = {
    ...tool,
    inputSchema: schema,
    invocation: {
      direct: buildInvocationExample(name, schema),
      json: `ghl call ${name} --input '{...}'${tool.readOnly ? '' : ' --confirm'}`,
      dryRun: `ghl call ${name} --input '{...}' --dry-run`,
    },
  };

  if (options.json) {
    printJson(payload, options);
    return;
  }

  const flags = [tool.access, tool.stability, tool.destructive ? 'destructive' : ''].filter(Boolean).join(', ');
  console.log(`${tool.name} [${flags}]`);
  console.log(tool.description || 'No description.');
  console.log(`Category: ${tool.category}  Module: ${tool.module}`);
  if (tool.scopes.length) console.log(`Scopes: ${tool.scopes.join(', ')}`);
  console.log('\nArguments:');
  const properties = schema.properties || {};
  if (!Object.keys(properties).length) console.log('  (none)');
  for (const [propertyName, propertySchema] of Object.entries(properties)) {
    const required = schema.required?.includes(propertyName) ? 'required' : 'optional';
    const type = schemaTypeLabel(propertySchema);
    console.log(`  --${toKebabCase(propertyName)} <${type}>  ${required}${propertySchema.description ? `; ${propertySchema.description}` : ''}`);
  }
  console.log(`\nExample: ${payload.invocation.direct}`);
}

async function callTool(argv) {
  const name = argv[0];
  if (!name || name.startsWith('-')) fail('Usage: ghl call <tool-name> [tool options]');
  return executeToolCommand(name, argv.slice(1));
}

async function testTool(argv) {
  const name = argv[0];
  if (!name) fail('Usage: ghl-mcp test-tool <name> [json-arguments] [--confirm]');
  return executeToolCommand(name, argv.slice(1), { legacyAlias: true });
}

async function executeToolCommand(name, argv, context = {}) {
  const options = parseOptions(argv);
  applyRuntimeOptions(options);
  const catalog = await getToolCatalog();
  const tool = catalog.inventory.find((item) => item.name === name);
  const definition = catalog.definitions.find((item) => item.name === name);
  if (!tool || !definition) failUnknownTool(name, catalog.inventory, Boolean(context.direct));

  const schema = normalizeInputSchema(definition);
  let toolArgs;
  try {
    toolArgs = resolveToolArguments(argv, schema, options, name);
    validateToolArguments(name, toolArgs, schema);
  } catch (error) {
    failToolCall(name, error, options);
  }

  if (!tool.readOnly && !options.confirm && !options.dryRun) {
    failToolCall(name, `Refusing to run ${tool.access} tool without --confirm`, options, {
      access: tool.access,
      destructive: tool.destructive,
    });
  }

  if (options.dryRun) {
    printToolResult({
      ok: true,
      dryRun: true,
      tool: name,
      access: tool.access,
      destructive: tool.destructive,
      arguments: toolArgs,
      wouldRequireConfirmation: !tool.readOnly,
    }, options);
    return;
  }

  try {
    const registry = await createToolRegistry(readGhlConfig());
    const result = await registry.callTool(name, toolArgs);
    if (result === undefined) throw new Error(`Tool is not visible in the ${getToolProfile()} profile`);
    if (options.resultOnly || context.legacyAlias) {
      printJson(result, options);
      return;
    }
    printToolResult({
      ok: true,
      tool: name,
      access: tool.access,
      destructive: tool.destructive,
      result,
    }, options);
  } catch (error) {
    failToolCall(name, error, options, { access: tool.access, destructive: tool.destructive });
  }
}

async function shell() {
  if (!process.stdin.isTTY) {
    help();
    return;
  }

  console.log('GoHighLevel CLI shell. Type help for commands, exit to quit.');
  const rl = createInterface({ input, output });
  while (true) {
    let line;
    try {
      line = await rl.question('ghl> ');
    } catch {
      break;
    }
    const trimmed = line.trim();
    if (!trimmed) continue;
    if (trimmed === 'exit' || trimmed === 'quit') break;
    const shellArgs = splitShellWords(trimmed);
    const result = spawnSync(process.execPath, [cliPath(), ...shellArgs], {
      cwd: process.cwd(),
      env: process.env,
      stdio: 'inherit',
      shell: false,
    });
    if (result.error) console.error(sanitizeErrorMessage(result.error));
  }
  rl.close();
}

function envTemplate() {
  console.log(`GHL_API_KEY=your_private_integration_api_key
GHL_LOCATION_ID=your_location_id
GHL_BASE_URL=https://services.leadconnectorhq.com
GHL_API_VERSION=v3
GHL_API_GENERATION=v3
# GHL_USER_TYPE=Location
MCP_SERVER_PORT=8000
NODE_ENV=development`);
}

function configure(argv) {
  const options = parseOptions(argv);
  applyRuntimeOptions(options);
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
    coveragePercent: coverage.comparison?.currentV3?.coveragePercent ?? coverage.comparison?.coveragePercent ?? 0,
    currentV3: coverage.comparison?.currentV3,
    legacyV2: coverage.comparison?.v2Compatibility,
    dualGenerationUnion: coverage.comparison?.dualGeneration,
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
- Current/default v3 official endpoints: ${coverage.comparison?.currentV3?.coveredCount ?? coverage.comparison?.coveredCount ?? 0} / ${coverage.comparison?.currentV3?.officialUniqueCount ?? coverage.comparison?.officialUniqueCount ?? 0}
- Current/default v3 coverage: ${coverage.comparison?.currentV3?.coveragePercent ?? coverage.comparison?.coveragePercent ?? 0}%
- Legacy v2 compatibility endpoints: ${coverage.comparison?.v2Compatibility?.coveredCount ?? 0} / ${coverage.comparison?.v2Compatibility?.officialUniqueCount ?? 0}
- Dual-generation endpoint union: ${coverage.comparison?.dualGeneration?.coveredCount ?? 0} / ${coverage.comparison?.dualGeneration?.officialUniqueCount ?? 0}
- MCP tools in registry: ${inventory.length}
- Read tools: ${byAccess.read || 0}
- Write tools: ${(byAccess.write || 0)}
- Delete/destructive tools: ${(byAccess.delete || 0)}
- Current-v3 local-only endpoint references tracked: ${coverage.comparison?.currentV3?.localOnlyCount ?? coverage.comparison?.localOnly?.length ?? 0}
- Dual-generation local-only endpoint references tracked: ${coverage.comparison?.dualGeneration?.localOnlyCount ?? 0}

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
  return (await getToolCatalog()).inventory;
}

async function getToolCatalog() {
  const apiGeneration = getApiGeneration();
  const registry = await createToolRegistry({
    accessToken: process.env.GHL_API_KEY || 'tooling-token',
    baseUrl: process.env.GHL_BASE_URL || 'https://services.leadconnectorhq.com',
    version: getApiVersion(apiGeneration),
    locationId: process.env.GHL_LOCATION_ID || 'tooling-location',
    apiGeneration,
    userType: getUserType(),
  });
  return {
    registry,
    inventory: registry.getToolInventory(),
    definitions: registry.getAllToolDefinitions(),
  };
}

async function createToolRegistry(config) {
  ensureBuilt();
  const { ToolRegistry } = await importBuilt('tool-registry.js');
  const { EnhancedGHLClient } = await importBuilt('enhanced-ghl-client.js');
  return new ToolRegistry(new EnhancedGHLClient(config));
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
  const apiGeneration = getApiGeneration();
  if (!process.env.GHL_API_KEY) throw new Error('GHL_API_KEY is required');
  if (!process.env.GHL_LOCATION_ID) throw new Error('GHL_LOCATION_ID is required');
  return {
    accessToken: process.env.GHL_API_KEY,
    baseUrl: process.env.GHL_BASE_URL || 'https://services.leadconnectorhq.com',
    version: getApiVersion(apiGeneration),
    locationId: process.env.GHL_LOCATION_ID,
    apiGeneration,
    userType: getUserType(),
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
  // GHL_SKIP_DOTENV lets callers (primarily tests) opt out of reading the
  // repo .env, so a developer's real credentials cannot leak into a run that
  // deliberately blanked its environment.
  if (process.env.GHL_SKIP_DOTENV) return;
  const path = join(repoRoot, '.env');
  if (!existsSync(path)) return;
  loadEnvFile(path, false);
}

function loadEnvFile(path, override) {
  if (!existsSync(path)) fail(`Environment file not found: ${path}`);
  for (const line of readFileSync(path, 'utf8').split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim().replace(/^['"]|['"]$/g, '');
    if (override || !process.env[key]) process.env[key] = value;
  }
}

function parseOptions(argv) {
  const options = { sets: [], inputs: [], inputFiles: [] };
  for (let i = 0; i < argv.length; i += 1) {
    const raw = argv[i];
    const equalIndex = raw.startsWith('--') ? raw.indexOf('=') : -1;
    const item = equalIndex > 0 ? raw.slice(0, equalIndex) : raw;
    const inlineValue = equalIndex > 0 ? raw.slice(equalIndex + 1) : undefined;
    const takeValue = (fallback = '') => inlineValue ?? argv[++i] ?? fallback;

    if (item === '--json') options.json = true;
    if (item === '--compact') options.compact = true;
    if (item === '--result-only') options.resultOnly = true;
    if (item === '--confirm') options.confirm = true;
    if (item === '--dry-run') options.dryRun = true;
    if (item === '--stdin') options.stdin = true;
    if (item === '--names-only') options.namesOnly = true;
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
    if (item === '--profile') options.profile = takeValue('curated');
    if (item === '--client') options.client = takeValue('codex').toLowerCase();
    if (item === '--target') options.target = takeValue();
    if (item === '--search') options.search = takeValue();
    if (item === '--category') options.category = takeValue();
    if (item === '--access') options.access = takeValue();
    if (item === '--stability') options.stability = takeValue();
    if (item === '--input') options.inputs.push(takeValue());
    if (item === '--input-file') options.inputFiles.push(takeValue());
    if (item === '--env-file') options.envFile = takeValue();
    if (item === '--set') options.sets.push(takeValue());
    if (item === '--location-id') options.locationId = takeValue();
    if (item === '--api-generation') options.apiGeneration = takeValue();
    if (item === '--api-version') options.apiVersion = takeValue();
    if (item === '--user-type') options.userType = takeValue();
  }
  return options;
}

const TOOL_BOOLEAN_OPTIONS = new Set([
  '--json', '--compact', '--result-only', '--confirm', '--dry-run', '--stdin',
]);

const TOOL_VALUE_OPTIONS = new Set([
  '--profile', '--input', '--input-file', '--set', '--location-id',
  '--env-file', '--api-generation', '--api-version', '--user-type',
]);

function applyRuntimeOptions(options) {
  if (options.envFile) loadEnvFile(resolve(process.cwd(), options.envFile), true);
  if (options.profile) {
    if (!['curated', 'stable', 'full', 'official', 'raw'].includes(options.profile)) {
      fail('Supported profiles: curated, stable, full, official, raw');
    }
    process.env.GHL_TOOL_PROFILE = options.profile;
  }
  if (options.locationId) process.env.GHL_LOCATION_ID = options.locationId;
  if (options.apiGeneration) {
    if (!['v3', 'v2'].includes(options.apiGeneration)) fail('Supported API generations: v3, v2');
    process.env.GHL_API_GENERATION = options.apiGeneration;
  }
  if (options.apiVersion) process.env.GHL_API_VERSION = options.apiVersion;
  if (options.userType) {
    if (!['Location', 'Company'].includes(options.userType)) fail('Supported user types: Location, Company');
    process.env.GHL_USER_TYPE = options.userType;
  }
}

function getToolProfile() {
  const profile = (process.env.GHL_TOOL_PROFILE || 'full').toLowerCase();
  return ['curated', 'stable', 'full', 'official', 'raw'].includes(profile) ? profile : 'full';
}

function normalizeInputSchema(definition) {
  const schema = definition?.inputSchema || definition?.input_schema || {};
  return {
    type: 'object',
    ...schema,
    properties: schema.properties || {},
    required: Array.isArray(schema.required) ? schema.required.map(String) : [],
  };
}

function resolveToolArguments(argv, schema, options, toolName) {
  const resolved = {};
  const properties = schema.properties || {};
  let readStdin = false;

  for (let i = 0; i < argv.length; i += 1) {
    const raw = argv[i];
    const equalIndex = raw.startsWith('--') ? raw.indexOf('=') : -1;
    const flag = equalIndex > 0 ? raw.slice(0, equalIndex) : raw;
    const inlineValue = equalIndex > 0 ? raw.slice(equalIndex + 1) : undefined;
    const nextValue = () => inlineValue ?? argv[++i];

    if (TOOL_BOOLEAN_OPTIONS.has(flag)) {
      if (flag === '--stdin' && !readStdin) {
        mergeToolInput(resolved, parseInputObject(readFileSync(0, 'utf8'), 'stdin'));
        readStdin = true;
      }
      continue;
    }
    if (TOOL_VALUE_OPTIONS.has(flag)) {
      const value = nextValue();
      if (value === undefined) throw new Error(`${flag} requires a value`);
      if (flag === '--input') mergeToolInput(resolved, parseInputObject(value, '--input'));
      if (flag === '--input-file') mergeToolInput(resolved, readInputFile(value));
      if (flag === '--set') applySetExpression(resolved, value);
      continue;
    }
    if (raw.startsWith('--')) {
      const negative = flag.startsWith('--no-');
      const requestedName = flag.slice(negative ? 5 : 2);
      const propertyName = resolveSchemaProperty(requestedName, properties);
      if (!propertyName) {
        throw new Error(`Unknown argument ${flag}. Run "ghl describe ${toolName}" to inspect its schema.`);
      }
      let value;
      if (negative) {
        value = false;
      } else if (inlineValue !== undefined) {
        value = inlineValue;
      } else if (argv[i + 1] !== undefined && !argv[i + 1].startsWith('--')) {
        value = argv[++i];
      } else {
        value = true;
      }
      assignToolProperty(resolved, propertyName, value, properties[propertyName]);
      continue;
    }
    if (raw.startsWith('{')) {
      mergeToolInput(resolved, parseInputObject(raw, 'positional JSON'));
      continue;
    }
    if (raw.startsWith('@')) {
      mergeToolInput(resolved, readInputFile(raw.slice(1)));
      continue;
    }
    throw new Error(`Unexpected positional argument: ${raw}`);
  }

  const locationProperty = Object.keys(properties).find((name) => normalizeName(name) === 'locationid');
  if (locationProperty && !Object.prototype.hasOwnProperty.call(resolved, locationProperty) && process.env.GHL_LOCATION_ID) {
    resolved[locationProperty] = process.env.GHL_LOCATION_ID;
  }
  return resolved;
}

function parseInputObject(text, source) {
  let value;
  try {
    value = JSON.parse(String(text).trim() || '{}');
  } catch (error) {
    throw new Error(`Invalid JSON from ${source}: ${error.message}`);
  }
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error(`${source} must contain a JSON object`);
  }
  return value;
}

function readInputFile(path) {
  if (path === '-') return parseInputObject(readFileSync(0, 'utf8'), 'stdin');
  const absolutePath = resolve(process.cwd(), path);
  try {
    return parseInputObject(readFileSync(absolutePath, 'utf8'), absolutePath);
  } catch (error) {
    if (error.code === 'ENOENT') throw new Error(`Input file not found: ${absolutePath}`);
    throw error;
  }
}

function mergeToolInput(target, value) {
  Object.assign(target, value);
}

function resolveSchemaProperty(requestedName, properties) {
  if (Object.prototype.hasOwnProperty.call(properties, requestedName)) return requestedName;
  const camelName = requestedName.replace(/[-_]([a-zA-Z0-9])/g, (_match, char) => char.toUpperCase());
  if (Object.prototype.hasOwnProperty.call(properties, camelName)) return camelName;
  const normalized = normalizeName(requestedName);
  return Object.keys(properties).find((name) => normalizeName(name) === normalized);
}

function normalizeName(value) {
  return String(value).replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
}

function assignToolProperty(target, propertyName, rawValue, propertySchema = {}) {
  const value = coerceToolValue(rawValue, propertySchema);
  if (propertySchema.type === 'array' && Array.isArray(target[propertyName])) {
    target[propertyName].push(...value);
  } else {
    target[propertyName] = value;
  }
}

function coerceToolValue(rawValue, schema = {}) {
  if (typeof rawValue !== 'string') {
    if (schema.type === 'array' && !Array.isArray(rawValue)) return [rawValue];
    return rawValue;
  }
  if (schema.type === 'string') return rawValue;
  if (schema.type === 'boolean') {
    if (/^(true|1|yes)$/i.test(rawValue)) return true;
    if (/^(false|0|no)$/i.test(rawValue)) return false;
    throw new Error(`Expected a boolean, received: ${rawValue}`);
  }
  if (schema.type === 'integer' || schema.type === 'number') {
    const value = Number(rawValue);
    if (!Number.isFinite(value) || (schema.type === 'integer' && !Number.isInteger(value))) {
      throw new Error(`Expected ${schema.type}, received: ${rawValue}`);
    }
    return value;
  }
  if (schema.type === 'array') {
    if (rawValue.trim().startsWith('[')) {
      const parsed = JSON.parse(rawValue);
      if (!Array.isArray(parsed)) throw new Error(`Expected an array, received: ${rawValue}`);
      return parsed;
    }
    return [coerceToolValue(rawValue, schema.items || {})];
  }
  if (schema.type === 'object') {
    const parsed = JSON.parse(rawValue);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error(`Expected an object, received: ${rawValue}`);
    return parsed;
  }
  return parseLooseValue(rawValue);
}

function parseLooseValue(rawValue) {
  const trimmed = rawValue.trim();
  if (!trimmed) return rawValue;
  if (!/^(?:true|false|null|-?\d|\[|\{|\")/.test(trimmed)) return rawValue;
  try {
    return JSON.parse(trimmed);
  } catch {
    return rawValue;
  }
}

function applySetExpression(target, expression) {
  const equalIndex = expression.indexOf('=');
  if (equalIndex <= 0) throw new Error(`--set expects path=value, received: ${expression}`);
  const path = expression.slice(0, equalIndex);
  const value = parseLooseValue(expression.slice(equalIndex + 1));
  const segments = path.replace(/\[([^\]]+)\]/g, '.$1').split('.').filter(Boolean);
  if (!segments.length || segments.some((part) => ['__proto__', 'prototype', 'constructor'].includes(part))) {
    throw new Error(`Unsafe or empty --set path: ${path}`);
  }
  let cursor = target;
  for (let i = 0; i < segments.length - 1; i += 1) {
    const segment = segments[i];
    const nextIsIndex = /^\d+$/.test(segments[i + 1]);
    if (!cursor[segment] || typeof cursor[segment] !== 'object') cursor[segment] = nextIsIndex ? [] : {};
    cursor = cursor[segment];
  }
  cursor[segments.at(-1)] = value;
}

function validateToolArguments(name, toolArgs, schema) {
  const missing = (schema.required || []).filter((property) => !Object.prototype.hasOwnProperty.call(toolArgs, property));
  if (missing.length) {
    throw new Error(`Missing required argument${missing.length === 1 ? '' : 's'} for ${name}: ${missing.join(', ')}`);
  }
  for (const [property, value] of Object.entries(toolArgs)) {
    const propertySchema = schema.properties?.[property];
    if (!propertySchema) {
      if (schema.additionalProperties === false) throw new Error(`Unknown argument for ${name}: ${property}`);
      continue;
    }
    validateSchemaValue(property, value, propertySchema);
  }
}

function validateSchemaValue(path, value, schema = {}) {
  if (schema.oneOf) {
    const matches = schema.oneOf.some((candidate) => {
      try {
        validateSchemaValue(path, value, candidate);
        return true;
      } catch {
        return false;
      }
    });
    if (!matches) throw new Error(`Argument ${path} does not match any supported schema variant`);
    return;
  }
  if (Array.isArray(schema.enum) && !schema.enum.some((candidate) => Object.is(candidate, value))) {
    throw new Error(`Argument ${path} must be one of: ${schema.enum.map(String).join(', ')}`);
  }
  if (schema.type === 'string' && typeof value !== 'string') throw new Error(`Argument ${path} must be a string`);
  if (schema.type === 'boolean' && typeof value !== 'boolean') throw new Error(`Argument ${path} must be a boolean`);
  if (schema.type === 'number' && (typeof value !== 'number' || !Number.isFinite(value))) throw new Error(`Argument ${path} must be a number`);
  if (schema.type === 'integer' && (typeof value !== 'number' || !Number.isInteger(value))) throw new Error(`Argument ${path} must be an integer`);
  if (schema.type === 'object' && (!value || typeof value !== 'object' || Array.isArray(value))) throw new Error(`Argument ${path} must be an object`);
  if (schema.type === 'array') {
    if (!Array.isArray(value)) throw new Error(`Argument ${path} must be an array`);
    value.forEach((item, index) => validateSchemaValue(`${path}[${index}]`, item, schema.items || {}));
  }
  if (typeof value === 'number') {
    if (schema.minimum !== undefined && value < schema.minimum) throw new Error(`Argument ${path} must be at least ${schema.minimum}`);
    if (schema.maximum !== undefined && value > schema.maximum) throw new Error(`Argument ${path} must be at most ${schema.maximum}`);
  }
}

function schemaTypeLabel(schema = {}) {
  if (Array.isArray(schema.type)) return schema.type.join('|');
  if (schema.type === 'array') return `${schemaTypeLabel(schema.items || { type: 'value' })}[]`;
  return schema.type || 'value';
}

function toKebabCase(value) {
  return String(value).replace(/([a-z0-9])([A-Z])/g, '$1-$2').replace(/_/g, '-').toLowerCase();
}

function buildInvocationExample(name, schema) {
  const requiredFlags = (schema.required || []).map((property) => `--${toKebabCase(property)} <${property}>`);
  return ['ghl', name, ...requiredFlags].join(' ');
}

function failUnknownTool(name, inventory, direct) {
  const suggestions = inventory
    .map((tool) => ({ name: tool.name, distance: editDistance(name, tool.name) }))
    .sort((a, b) => a.distance - b.distance || a.name.localeCompare(b.name))
    .slice(0, 5)
    .map((item) => item.name);
  const label = direct ? 'command or tool' : 'tool';
  fail(`Unknown ${label}: ${name}${suggestions.length ? `\nClosest tools: ${suggestions.join(', ')}` : ''}\nRun "ghl tools --search <text>" to search the registry.`);
}

function editDistance(left, right) {
  const a = String(left);
  const b = String(right);
  const row = Array.from({ length: b.length + 1 }, (_value, index) => index);
  for (let i = 1; i <= a.length; i += 1) {
    let previous = row[0];
    row[0] = i;
    for (let j = 1; j <= b.length; j += 1) {
      const current = row[j];
      row[j] = Math.min(row[j] + 1, row[j - 1] + 1, previous + (a[i - 1] === b[j - 1] ? 0 : 1));
      previous = current;
    }
  }
  return row[b.length];
}

function printToolResult(payload, options) {
  printJson(payload, options);
}

function printJson(payload, options = {}) {
  console.log(JSON.stringify(payload, null, options.compact ? 0 : 2));
}

function failToolCall(name, error, options, details = {}) {
  const message = sanitizeErrorMessage(error);
  const payload = { ok: false, tool: name, ...details, error: { message } };
  console.error(JSON.stringify(payload, null, options.compact ? 0 : 2));
  process.exit(1);
}

function sanitizeErrorMessage(error) {
  return String(error?.message || error || 'Unknown error')
    .replace(/(Bearer\s+)[A-Za-z0-9._~+\/-]+/gi, '$1[REDACTED]')
    .replace(/((?:api[_-]?key|access[_-]?token|authorization)["']?\s*[:=]\s*["']?)[^"'\s,}]+/gi, '$1[REDACTED]');
}

function splitShellWords(line) {
  const words = [];
  let current = '';
  let quote = '';
  let escaped = false;
  for (const char of line) {
    if (escaped) {
      current += char;
      escaped = false;
    } else if (char === '\\') {
      escaped = true;
    } else if (quote) {
      if (char === quote) quote = '';
      else current += char;
    } else if (char === '"' || char === "'") {
      quote = char;
    } else if (/\s/.test(char)) {
      if (current) {
        words.push(current);
        current = '';
      }
    } else {
      current += char;
    }
  }
  if (escaped) current += '\\';
  if (current) words.push(current);
  return words;
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
  return 'GHL_API_VERSION=v3 is the current named HighLevel Version header, not a date. Routing is per endpoint: ad-publishing remains mostly on 2021-07-28; Conversations use v3 in current mode and 2021-04-15 in legacy v2 mode. Set GHL_API_GENERATION=v2 for the legacy surface; v2 mode replaces an unset or starter v3 value with the 2023-02-21 fallback.';
}

function getApiGeneration() {
  return process.env.GHL_API_GENERATION === 'v2' ? 'v2' : 'v3';
}

function getApiVersion(apiGeneration = getApiGeneration()) {
  const configured = process.env.GHL_API_VERSION;
  if (apiGeneration === 'v2' && (!configured || configured === 'v3')) return '2023-02-21';
  return configured || 'v3';
}

function getUserType() {
  return process.env.GHL_USER_TYPE === 'Company' || process.env.GHL_USER_TYPE === 'Location'
    ? process.env.GHL_USER_TYPE
    : undefined;
}

function buildConfig(client, profile, buildOptions = {}) {
  if (!['codex', 'claude', 'cursor', 'windsurf'].includes(client)) fail('Supported clients: codex, claude, cursor, windsurf');
  if (!['curated', 'stable', 'full', 'official', 'raw'].includes(profile)) fail('Supported profiles: curated, stable, full, official, raw');
  const apiGeneration = getApiGeneration();
  const userType = getUserType();
  return {
    mcpServers: {
      ghl: {
        command: 'node',
        args: [join(repoRoot, 'dist/server.js')],
        env: {
          GHL_API_KEY: '${GHL_API_KEY}',
          GHL_LOCATION_ID: buildOptions.inlineEnv ? (process.env.GHL_LOCATION_ID || '${GHL_LOCATION_ID}') : '${GHL_LOCATION_ID}',
          GHL_BASE_URL: process.env.GHL_BASE_URL || 'https://services.leadconnectorhq.com',
          GHL_API_VERSION: getApiVersion(apiGeneration),
          GHL_API_GENERATION: apiGeneration,
          ...(userType ? { GHL_USER_TYPE: userType } : {}),
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

if (!commands[command]) {
  await executeToolCommand(command, args.slice(1), { direct: true });
} else {
  await commands[command](args.slice(1));
}
