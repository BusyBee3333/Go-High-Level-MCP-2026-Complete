import { describe, it, expect } from '@jest/globals';
import { ToolRegistry } from '../../src/tool-registry.js';

/**
 * Regression tests for the v3 API surface.
 *
 * These guard against the specific defects found during the v2→v3 migration
 * audit: removed/renamed endpoints leaking into v3 mode, and duplicate
 * (v2+v3) tools for the same method+path.
 */

// The registry reads GHL_API_GENERATION from the env, so toggle it per suite.
function visibleNames(gen: 'v3' | 'v2'): string[] {
  process.env.GHL_API_GENERATION = gen;
  // Minimal stub client — the registry only needs it to construct.
  const stub: any = {
    getConfig: () => ({ locationId: 'l', version: gen === 'v3' ? 'v3' : '2023-02-21', apiGeneration: gen }),
    makeRequest: async () => ({ success: true }),
  };
  const reg = new ToolRegistry(stub);
  return reg.getToolInventory().map((t) => t.name);
}

describe('v3 surface: removed/renamed endpoints', () => {
  // Each entry is the exact generated tool name for an endpoint that v3
  // removed or renamed. It must be HIDDEN in v3 mode and VISIBLE in v2 mode.
  const removedInV3 = [
    'official_contacts_get_contacts',            // GET /contacts/ — removed
    'official_users_get_user_by_location',       // GET /users/ — removed
    'official_oauth_get_location_access_token',  // POST /oauth/locationToken — removed w/o deprecation
    'official_oauth_get_installed_location',     // GET /oauth/installedLocations — removed w/o deprecation
    'official_contacts_remove_contact_from_every_campaign_2', // removeAll — renamed to remove-all
  ];

  it('hides removed/renamed endpoints in v3 mode', () => {
    const v3 = new Set(visibleNames('v3'));
    for (const name of removedInV3) {
      expect(v3.has(name)).toBe(false);
    }
  });

  it('keeps removed/renamed endpoints available in v2 mode (legacy access)', () => {
    const v2 = new Set(visibleNames('v2'));
    for (const name of removedInV3) {
      expect(v2.has(name)).toBe(true);
    }
  });

  it('exposes the v3 rename targets in v3 mode', () => {
    const v3 = new Set(visibleNames('v3'));
    // remove-all is the v3 rename of removeAll.
    expect(v3.has('official_contacts_remove_contact_from_every_campaign')).toBe(true);
  });
});

describe('v3 surface: no duplicate method+path', () => {
  it('exposes at most one tool per method+path in v3 mode', () => {
    process.env.GHL_API_GENERATION = 'v3';
    const stub: any = {
      getConfig: () => ({ locationId: 'l', version: 'v3', apiGeneration: 'v3' }),
      makeRequest: async () => ({ success: true }),
    };
    const tools = new ToolRegistry(stub).getToolInventory();
    const byPath = new Map<string, string[]>();
    for (const t of tools as any[]) {
      const o = t._meta?.official;
      if (!o?.path) continue;
      const k = `${o.method} ${o.path}`;
      if (!byPath.has(k)) byPath.set(k, []);
      byPath.get(k)!.push(t.name);
    }
    const dups = [...byPath.entries()].filter(([, ns]) => ns.length > 1);
    expect(dups).toEqual([]);
  });
});
