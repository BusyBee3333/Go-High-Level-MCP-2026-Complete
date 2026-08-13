import { describe, expect, it } from '@jest/globals';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const repoRoot = join(__dirname, '..', '..');

function readJson(path: string) {
  return JSON.parse(readFileSync(join(repoRoot, path), 'utf8'));
}

describe('npm package release metadata', () => {
  it('keeps the package lock root version aligned with package.json', () => {
    const pkg = readJson('package.json');
    const lock = readJson('package-lock.json');

    expect(lock.version).toBe(pkg.version);
    expect(lock.packages[''].version).toBe(pkg.version);
    expect(pkg.scripts.prepack).toBe('npm run build');
  });

  it('builds the published server executable with a Node shebang', () => {
    const pkg = readJson('package.json');
    const serverBin = readFileSync(join(repoRoot, pkg.bin['ghl-mcp-server']), 'utf8');

    expect(serverBin.startsWith('#!/usr/bin/env node\n')).toBe(true);
  });
});
