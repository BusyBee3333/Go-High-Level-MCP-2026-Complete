import { describe, it, expect, jest } from '@jest/globals';
import { OfficialSpecTools } from '../../src/tools/official-spec-tools.js';
import type { GHLToolClient, GHLToolConfig, GHLToolResponse, HttpMethod } from '../../src/tools/ghl-tool-client.js';

/**
 * Minimal in-memory GHLToolClient that records the last request and can be
 * configured with a userType / apiGeneration for preflight + version tests.
 */
class MockToolClient implements GHLToolClient {
  public lastVersion: string | undefined;
  public lastApp: string | undefined;
  public lastPath: string | undefined;
  public lastMethod: HttpMethod | undefined;
  constructor(private cfg: GHLToolConfig) {}
  getConfig(): Readonly<GHLToolConfig> { return this.cfg; }
  async makeRequest<T = any>(
    method: HttpMethod,
    path: string,
    _body?: Record<string, unknown>,
    options?: { version?: string; app?: string }
  ): Promise<GHLToolResponse<T>> {
    this.lastMethod = method;
    this.lastPath = path;
    this.lastVersion = options?.version;
    this.lastApp = options?.app;
    return { success: true, data: { ok: true } as any };
  }
}

describe('OfficialSpecTools v3 routing + access preflight', () => {
  it('sends the per-endpoint version header (ad-publishing stays 2021-07-28)', async () => {
    const client = new MockToolClient({ locationId: 'loc', apiGeneration: 'v3', version: 'v3' });
    const tools = new OfficialSpecTools(client);

    // Find an ad-publishing GET endpoint that declares 2021-07-28 and has no
    // path params (no {param} tokens in the path) so we don't need to supply them.
    const adEndpoint = tools.getToolDefinitions().find((t: any) => {
      const o = t._meta?.official || {};
      return o.app === 'ad-publishing'
        && o.versions?.includes('2021-07-28')
        && o.method === 'GET'
        && !String(o.path || '').includes('{');
    }) as any;
    expect(adEndpoint).toBeDefined();

    // Provide placeholder values for any path/query params the endpoint needs.
    const args: Record<string, unknown> = { locationId: 'loc' };
    await tools.handleToolCall(adEndpoint.name, args);

    expect(client.lastVersion).toBe('2021-07-28');
  });

  it('sends v3 for a v3-declaring endpoint', async () => {
    const client = new MockToolClient({ locationId: 'loc', apiGeneration: 'v3', version: 'v3' });
    const tools = new OfficialSpecTools(client);

    const v3Endpoint = tools.getToolDefinitions().find((t: any) => {
      const o = t._meta?.official || {};
      return o.versions?.includes('v3')
        && o.method === 'GET'
        && !String(o.path || '').includes('{');
    }) as any;
    expect(v3Endpoint).toBeDefined();

    await tools.handleToolCall(v3Endpoint.name, { locationId: 'loc' });
    expect(client.lastVersion).toBe('v3');
  });

  it('rejects an agency-only endpoint when the token is Location-scoped', async () => {
    const client = new MockToolClient({
      locationId: 'loc',
      apiGeneration: 'v3',
      version: 'v3',
      userType: 'Location',
    });
    const tools = new OfficialSpecTools(client);

    const agencyOnly = tools.getToolDefinitions().find((t: any) => t._meta?.official?.accessLevel === 'agency-only');
    if (!agencyOnly) {
      // No agency-only endpoint in the current registry — skip gracefully.
      return;
    }

    // Provide any path params the endpoint declares so the preflight (which
    // runs before buildPath) is the thing under test.
    const pathParams: string[] = agencyOnly._meta?.official?.pathParams || [];
    const args: Record<string, unknown> = { locationId: 'loc' };
    for (const p of pathParams) args[p] = 'x';

    await expect(tools.handleToolCall(agencyOnly.name, args)).rejects.toThrow(/Agency/);
    // The preflight must fire before any network call.
    expect(client.lastMethod).toBeUndefined();
  });

  it('passes the access preflight when the token type matches', async () => {
    const client = new MockToolClient({
      locationId: 'loc',
      apiGeneration: 'v3',
      version: 'v3',
      userType: 'Company',
    });
    const tools = new OfficialSpecTools(client);

    const agencyOnly = tools.getToolDefinitions().find((t: any) => t._meta?.official?.accessLevel === 'agency-only');
    if (!agencyOnly) return;

    const pathParams: string[] = agencyOnly._meta?.official?.pathParams || [];
    const args: Record<string, unknown> = { locationId: 'loc' };
    for (const p of pathParams) args[p] = 'x';

    await tools.handleToolCall(agencyOnly.name, args);
    expect(client.lastMethod).toBeDefined();
  });

  it('includes access-level info in tool descriptions for restricted endpoints', () => {
    const client = new MockToolClient({ locationId: 'loc', apiGeneration: 'v3', version: 'v3' });
    const tools = new OfficialSpecTools(client);
    const defs = tools.getToolDefinitions() as any[];

    const restricted = defs.find((d) => d._meta?.official?.accessLevel === 'agency-only');
    if (restricted) {
      expect(restricted.description).toContain('agency-only');
    }
  });
});
