import { describe, expect, it } from '@jest/globals';
import { spawnSync } from 'node:child_process';
import { existsSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const repoRoot = join(__dirname, '..', '..');
const cli = join(repoRoot, 'scripts', 'ghl-mcp.mjs');

function runCli(args: string[], env: NodeJS.ProcessEnv = {}) {
  return spawnSync(process.execPath, [cli, ...args], {
    cwd: repoRoot,
    env: {
      ...process.env,
      // Keep the CLI from loading the developer's local .env; these tests
      // must behave identically on machines with and without credentials.
      GHL_SKIP_DOTENV: '1',
      GHL_API_KEY: '',
      GHL_LOCATION_ID: '',
      GHL_API_VERSION: '',
      GHL_API_GENERATION: '',
      GHL_USER_TYPE: '',
      GHL_TOOL_PROFILE: '',
      ...env,
    },
    encoding: 'utf8',
  });
}

describe('ghl-mcp onboarding CLI', () => {
  it('emits machine-readable doctor status with human next steps', () => {
    const result = runCli(['doctor', '--json']);

    expect(result.status).toBe(0);
    const payload = JSON.parse(result.stdout);
    expect(payload.status).toBe('needsHumanAction');
    expect(payload.summary.needsHumanAction).toBeGreaterThanOrEqual(2);
    expect(payload.checks).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          name: 'GHL_API_KEY',
          ok: false,
          nextStep: expect.stringContaining('.env'),
        }),
        expect.objectContaining({
          name: 'GHL_LOCATION_ID',
          ok: false,
          nextStep: expect.stringContaining('Location ID'),
        }),
      ])
    );
  });

  it('generates curated-profile client config with absolute server path', () => {
    const result = runCli(['configure', 'claude', '--profile', 'curated', '--json']);

    expect(result.status).toBe(0);
    const payload = JSON.parse(result.stdout);
    const server = payload.config.mcpServers.ghl;
    expect(payload.client).toBe('claude');
    expect(payload.profile).toBe('curated');
    expect(server.args[0]).toBe(join(repoRoot, 'dist', 'server.js'));
    expect(server.env).toMatchObject({
      GHL_API_VERSION: 'v3',
      GHL_API_GENERATION: 'v3',
      GHL_TOOL_PROFILE: 'curated',
    });
  });

  it('preserves legacy generation and token type in generated client config', () => {
    const result = runCli(['configure', 'codex', '--profile', 'stable', '--json'], {
      GHL_API_VERSION: 'v3',
      GHL_API_GENERATION: 'v2',
      GHL_USER_TYPE: 'Company',
    });

    expect(result.status).toBe(0);
    const server = JSON.parse(result.stdout).config.mcpServers.ghl;
    expect(server.env).toMatchObject({
      GHL_API_VERSION: '2023-02-21',
      GHL_API_GENERATION: 'v2',
      GHL_USER_TYPE: 'Company',
      GHL_TOOL_PROFILE: 'stable',
    });
  });

  it('runs agent-check without credentials and reports needs-human-action instead of failing setup', () => {
    const reportPath = join(repoRoot, 'SETUP_STATUS.md');
    if (existsSync(reportPath)) rmSync(reportPath);

    const result = runCli(['agent-check', '--skip-tests', '--no-network', '--json', '--write-report']);

    expect(result.status).toBe(0);
    const payload = JSON.parse(result.stdout);
    expect(payload.status).toBe('needsHumanAction');
    expect(payload.safety.destructiveToolsRun).toBe(false);
    expect(payload.auth.status).toBe('skipped');
    expect(payload.config.client).toBe('codex');
    expect(existsSync(reportPath)).toBe(true);

    rmSync(reportPath);
  }, 30000);

  it('runs first-run and ready in no-network mode with parseable setup grades', () => {
    const firstRun = runCli(['first-run', '--skip-tests', '--no-network', '--json']);
    expect(firstRun.status).toBe(0);
    const firstRunPayload = JSON.parse(firstRun.stdout);
    expect(firstRunPayload.command).toBe('first-run');
    expect(firstRunPayload.grade).toBe('needs-credentials');
    expect(firstRunPayload.nextCommand).toContain('configure');

    const ready = runCli(['ready', '--skip-tests', '--no-network', '--json']);
    expect(ready.status).toBe(0);
    const readyPayload = JSON.parse(ready.stdout);
    expect(readyPayload.command).toBe('ready');
    expect(readyPayload.grade).toBe('needs-credentials');
  }, 30000);

  it('explains common setup errors and emits demo preview instructions', () => {
    const explain = runCli(['explain-error', 'Location is not active', '--json']);
    expect(explain.status).toBe(0);
    const explanation = JSON.parse(explain.stdout);
    expect(explanation.code).toBe('location-inactive');
    expect(explanation.nextSteps.join(' ')).toContain('Location ID');

    const demo = runCli(['demo', '--json']);
    expect(demo.status).toBe(0);
    const payload = JSON.parse(demo.stdout);
    expect(payload.url).toBe('http://localhost:3001/preview');
    expect(payload.commands).toContain('npm run apps:preview');
  });

  it('connect emits safe config plus setup grade without requiring credentials', () => {
    const result = runCli(['connect', 'codex', '--skip-tests', '--no-network', '--json']);

    expect(result.status).toBe(0);
    const payload = JSON.parse(result.stdout);
    expect(payload.command).toBe('connect');
    expect(payload.client).toBe('codex');
    expect(payload.profile).toBe('curated');
    expect(payload.grade).toBe('needs-credentials');
    expect(payload.config.mcpServers.ghl.env.GHL_TOOL_PROFILE).toBe('curated');
    expect(payload.remainingHumanActions.join(' ')).toContain('GHL_API_KEY');
  }, 30000);

  it('can write client config safely with backup semantics', () => {
    const target = join(repoRoot, 'tmp', 'test-mcp-config.json');
    const backup = `${target}.bak`;
    if (existsSync(target)) rmSync(target);
    if (existsSync(backup)) rmSync(backup);

    const first = runCli(['configure', 'codex', '--profile', 'stable', '--write', '--target', target, '--json']);
    expect(first.status).toBe(0);
    const firstPayload = JSON.parse(first.stdout);
    expect(firstPayload.wrote).toBe(target);
    expect(firstPayload.backup).toBeNull();

    const second = runCli(['configure', 'codex', '--profile', 'curated', '--write', '--target', target, '--json']);
    expect(second.status).toBe(0);
    const secondPayload = JSON.parse(second.stdout);
    expect(secondPayload.backup).toBe(backup);

    rmSync(target);
    rmSync(backup);
  });

  it('discovers the complete registry and describes tool input schemas', () => {
    const list = runCli(['tools', '--profile', 'full', '--json', '--compact']);
    expect(list.status).toBe(0);
    const inventory = JSON.parse(list.stdout);
    expect(inventory.profile).toBe('full');
    expect(inventory.count).toBeGreaterThan(900);
    expect(inventory.tools).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: 'get_contact', access: 'read' }),
        expect.objectContaining({ name: 'create_contact', access: 'write' }),
      ])
    );

    const describe = runCli(['describe', 'get_contact', '--profile', 'full', '--json']);
    expect(describe.status).toBe(0);
    const tool = JSON.parse(describe.stdout);
    expect(tool.inputSchema.required).toContain('contactId');
    expect(tool.inputSchema.properties.contactId.type).toBe('string');
    expect(tool.invocation.direct).toContain('--contact-id');
  });

  it('resolves schema-aware flags and repeated array values without making a network call', () => {
    const read = runCli(['get_contact', '--contact-id', 'contact-123', '--dry-run', '--json', '--compact']);
    expect(read.status).toBe(0);
    expect(JSON.parse(read.stdout)).toMatchObject({
      ok: true,
      dryRun: true,
      tool: 'get_contact',
      arguments: { contactId: 'contact-123' },
      wouldRequireConfirmation: false,
    });

    const write = runCli([
      'create_contact',
      '--email',
      'cli-test@example.invalid',
      '--tags',
      'lead',
      '--tags',
      'website',
      '--dry-run',
      '--json',
    ]);
    expect(write.status).toBe(0);
    expect(JSON.parse(write.stdout)).toMatchObject({
      ok: true,
      access: 'write',
      arguments: {
        email: 'cli-test@example.invalid',
        tags: ['lead', 'website'],
      },
      wouldRequireConfirmation: true,
    });

    const filtered = runCli([
      'search_conversations',
      '--status',
      'unread',
      '--limit',
      '25',
      '--dry-run',
      '--json',
    ]);
    expect(filtered.status).toBe(0);
    expect(JSON.parse(filtered.stdout).arguments).toEqual({ status: 'unread', limit: 25 });
  });

  it('accepts JSON input and nested --set values in dry-run mode', () => {
    const result = runCli([
      'call',
      'create_contact',
      '--input',
      '{"email":"cli-test@example.invalid"}',
      '--set',
      'custom.source="agent"',
      '--dry-run',
      '--json',
    ]);

    expect(result.status).toBe(0);
    expect(JSON.parse(result.stdout).arguments).toEqual({
      email: 'cli-test@example.invalid',
      custom: { source: 'agent' },
    });
  });

  it('refuses write tools without confirmation before requiring credentials', () => {
    const result = runCli(['call', 'create_contact', '--email', 'cli-test@example.invalid', '--json', '--compact']);

    expect(result.status).toBe(1);
    const payload = JSON.parse(result.stderr.split('\n').find((line) => line.startsWith('{')) || '{}');
    expect(payload).toMatchObject({
      ok: false,
      tool: 'create_contact',
      access: 'write',
      error: { message: expect.stringContaining('--confirm') },
    });
  });

  it('loads an explicit location profile and injects its locationId into tool input', () => {
    const profilePath = join(repoRoot, 'tmp', 'test-ghl-cli.env');
    writeFileSync(profilePath, [
      'GHL_API_KEY=test-token-not-real',
      'GHL_LOCATION_ID=location-from-profile',
      'GHL_API_VERSION=v3',
      'GHL_API_GENERATION=v3',
      '',
    ].join('\n'));

    const result = runCli([
      'get_location',
      '--env-file',
      profilePath,
      '--dry-run',
      '--json',
      '--compact',
    ]);

    expect(result.status).toBe(0);
    expect(JSON.parse(result.stdout).arguments).toEqual({ locationId: 'location-from-profile' });
    rmSync(profilePath);
  });

  it('validates enum and numeric constraints before contacting GHL', () => {
    const enumResult = runCli([
      'search_conversations',
      '--status',
      'not-a-real-status',
      '--dry-run',
      '--json',
      '--compact',
    ]);
    expect(enumResult.status).toBe(1);
    expect(enumResult.stderr).toContain('must be one of');

    const numberResult = runCli([
      'search_conversations',
      '--limit',
      '101',
      '--dry-run',
      '--json',
      '--compact',
    ]);
    expect(numberResult.status).toBe(1);
    expect(numberResult.stderr).toContain('must be at most 100');
  });
});
