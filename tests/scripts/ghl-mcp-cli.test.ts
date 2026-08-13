import { describe, expect, it } from '@jest/globals';
import { spawnSync } from 'node:child_process';
import { existsSync, rmSync } from 'node:fs';
import { join } from 'node:path';

const repoRoot = join(__dirname, '..', '..');
const cli = join(repoRoot, 'scripts', 'ghl-mcp.mjs');

function runCli(args: string[], env: NodeJS.ProcessEnv = {}) {
  return spawnSync(process.execPath, [cli, ...args], {
    cwd: repoRoot,
    env: {
      ...process.env,
      GHL_API_KEY: '',
      GHL_LOCATION_ID: '',
      GHL_API_VERSION: '',
      GHL_API_GENERATION: '',
      GHL_USER_TYPE: '',
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
});
