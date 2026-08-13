import { describe, expect, it } from '@jest/globals';
import { spawn, spawnSync } from 'node:child_process';
import { createServer } from 'node:http';
import { join } from 'node:path';

const repoRoot = join(__dirname, '..', '..');
const script = join(repoRoot, 'scripts', 'ghl-live-smoke.mjs');

function listen(server: ReturnType<typeof createServer>): Promise<number> {
  return new Promise((resolve) => {
    server.listen(0, '127.0.0.1', () => {
      const address = server.address();
      if (typeof address === 'object' && address) resolve(address.port);
    });
  });
}

function runNode(args: string[], env: NodeJS.ProcessEnv): Promise<{ status: number | null; stdout: string; stderr: string }> {
  return new Promise((resolve) => {
    const child = spawn(process.execPath, args, {
      cwd: repoRoot,
      env,
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    let stdout = '';
    let stderr = '';
    child.stdout.on('data', (chunk) => {
      stdout += chunk.toString();
    });
    child.stderr.on('data', (chunk) => {
      stderr += chunk.toString();
    });
    child.on('close', (status) => resolve({ status, stdout, stderr }));
  });
}

describe('ghl-live-smoke', () => {
  it('exits cleanly when credentials are not provided', () => {
    const result = spawnSync(process.execPath, [script], {
      cwd: repoRoot,
      env: { ...process.env, GHL_API_KEY: '', GHL_LOCATION_ID: '' },
      encoding: 'utf8',
    });

    expect(result.status).toBe(0);
    expect(result.stdout).toContain('Skipping live smoke');
  });

  it('fails when credentials are present but GHL returns HTTP 401', async () => {
    const server = createServer((_req, res) => {
      res.writeHead(401, { 'content-type': 'application/json' });
      res.end(JSON.stringify({ message: 'Location is not active' }));
    });
    const port = await listen(server);

    try {
      const result = await runNode([script], {
        ...process.env,
        GHL_BASE_URL: `http://127.0.0.1:${port}`,
        GHL_API_KEY: 'pit-test',
        GHL_LOCATION_ID: 'loc-test',
        GHL_LIVE_SMOKE_TIMEOUT_MS: '5000',
      });

      expect(result.status).toBe(1);
      expect(result.stdout).toContain('fail location [locations; GET] HTTP 401');
      // location + 8 read checks = 9 total
      expect(result.stdout).toContain('Live smoke complete: 0/9 checks passed.');
      expect(result.stdout).toContain('By area:');
      expect(result.stdout).toContain('- locations: 0/1');
    } finally {
      await new Promise<void>((resolve) => server.close(() => resolve()));
    }
  });
});
