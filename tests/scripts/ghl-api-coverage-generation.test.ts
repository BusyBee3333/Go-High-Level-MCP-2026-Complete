import { describe, expect, it } from '@jest/globals';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const repoRoot = join(__dirname, '..', '..');

describe('GHL API coverage generation', () => {
  it('keeps generated official-spec tool names within custom tool limits without renaming valid stable names', () => {
    const endpoints = JSON.parse(readFileSync(join(repoRoot, 'src', 'tools', 'official-spec-endpoints.json'), 'utf8'));
    const names = endpoints.map((endpoint: any) => endpoint.name);

    expect(names.every((name: string) => name.length <= 64)).toBe(true);
    expect(names).toContain('official_ad_manager_fb_get_reporting');
    expect(names).not.toContain('official_payments_custom_provider_marketplace_app_update_capabilities');
    expect(names).toContain('official_payments_custom_provider_marketplace_app_update_9a8c6e');
  });
});
