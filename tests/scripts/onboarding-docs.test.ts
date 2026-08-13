import { describe, expect, it } from '@jest/globals';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const repoRoot = join(__dirname, '..', '..');

function read(path: string) {
  return readFileSync(join(repoRoot, path), 'utf8');
}

describe('onboarding documentation and scripts', () => {
  it('keeps required setup scripts in package.json', () => {
    const pkg = JSON.parse(read('package.json'));

    for (const script of [
      'setup',
      'connect',
      'first-run',
      'ready',
      'demo',
      'explain-error',
      'doctor',
      'auth-check',
      'agent:setup',
      'agent:check',
      'configure:codex',
      'configure:claude',
      'configure:cursor',
      'configure:windsurf',
      'apps:setup',
      'apps:dev',
      'apps:preview',
      'clean',
      'reset-local',
    ]) {
      expect(pkg.scripts[script]).toBeTruthy();
    }

    expect(pkg.engines.node).toBe('>=20.0.0');
  });

  it('documents and preserves the current HighLevel API Version header default', () => {
    const files = [
      '.env.example',
      'README.md',
      'QUICKSTART.md',
      'AGENT_SETUP.md',
      'docs/SETUP.md',
      'docs/TROUBLESHOOTING.md',
      'mcp-apps/README.md',
    ];

    // v3 (named version, released 2026-06-11) is the current default.
    for (const file of files) {
      const contents = read(file);
      expect(contents).toContain('GHL_API_VERSION=v3');
    }

    // The docs explain that the version is a named identifier, not a year/date.
    expect(read('README.md')).toContain('not a date');
    expect(read('scripts/ghl-mcp.mjs')).toContain('not a date');
  });

  it('keeps .env.example aligned with setup environment variables', () => {
    const envExample = read('.env.example');

    for (const name of [
      'GHL_API_KEY',
      'GHL_LOCATION_ID',
      'GHL_BASE_URL',
      'GHL_API_VERSION',
      'MCP_SERVER_PORT',
      'OPENAI_API_KEY',
    ]) {
      expect(envExample).toContain(`${name}=`);
    }
  });

  it('ships agent-facing setup docs, Docker assets, and onboarding CI', () => {
    for (const file of [
      'QUICKSTART.md',
      'AGENT_SETUP.md',
      'docs/SETUP.md',
      'docs/USAGE.md',
      'docs/TROUBLESHOOTING.md',
      'docs/CLIENTS.md',
      'docs/TOOL-PROFILES.md',
      'docs/RECIPES.md',
      'docs/SAFETY.md',
      'docs/DEPLOYMENT.md',
      'docs/DEVELOPMENT.md',
      'docs/API-COVERAGE.md',
      'Dockerfile',
      'docker-compose.yml',
      '.dockerignore',
      '.github/workflows/onboarding.yml',
    ]) {
      expect(existsSync(join(repoRoot, file))).toBe(true);
    }
  });
});
