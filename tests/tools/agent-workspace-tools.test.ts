import { AgentWorkspaceTools } from '../../src/tools/agent-workspace-tools';
import type { GHLApiClient } from '../../src/clients/ghl-api-client';

type RecordedCall = { method: string; path: string; body?: unknown };

type Handler = (call: RecordedCall) => unknown;

function createClient(handler: Handler) {
  const calls: RecordedCall[] = [];
  const makeRequest = jest.fn(async (method: string, path: string, body?: unknown) => {
    const call: RecordedCall = { method, path, body };
    calls.push(call);
    const result = handler(call);
    if (result instanceof Error) throw result;
    return { success: true, data: result };
  });

  const client = {
    getConfig: () => ({
      baseUrl: 'https://example.invalid',
      accessToken: 'test-token',
      locationId: 'loc_1',
      version: '2021-07-28',
      apiGeneration: 'v3',
    }),
    makeRequest,
  };

  return { tools: new AgentWorkspaceTools(client as unknown as GHLApiClient), calls, makeRequest };
}

type ReadResult = {
  label: string;
  tool: string;
  path: string;
  success: boolean;
  data?: unknown;
  pagination?: { returned?: number; total?: number; hasMore: boolean; nextPage?: number; nextPageUrl?: string };
  error?: string;
};

function readResult(result: any, label: string): ReadResult {
  const found = (result.readResults as ReadResult[]).find((item) => item.label === label);
  if (!found) throw new Error(`Missing read result: ${label}`);
  return found;
}

describe('AgentWorkspaceTools read plan requests', () => {
  it('queries contact search with the documented POST body instead of a GET query string', async () => {
    const { tools, calls } = createClient((call) => {
      if (call.path === '/contacts/search') return { contacts: [{ id: 'c1' }], total: 1 };
      return { id: 'c1' };
    });

    await tools.handleToolCall('crm_contact_workspace', { contactId: 'c1', query: 'jane@example.com' });

    const searchCalls = calls.filter((call) => call.path === '/contacts/search');
    expect(searchCalls).toHaveLength(1);
    expect(searchCalls[0].method).toBe('POST');
    expect(searchCalls[0].body).toEqual({ locationId: 'loc_1', pageLimit: 20, query: 'jane@example.com' });
    expect(calls.some((call) => call.method === 'GET' && call.path.startsWith('/contacts/search'))).toBe(false);
  });

  it('keeps the raw search term in the body so reserved characters are not double encoded', async () => {
    const { tools, calls } = createClient((call) => {
      if (call.path === '/contacts/search') return { contacts: [], total: 0 };
      return {};
    });

    await tools.handleToolCall('crm_contact_workspace', { contactId: 'c1', query: 'a+b c&d' });

    const searchCall = calls.find((call) => call.path === '/contacts/search');
    expect(searchCall?.body).toMatchObject({ query: 'a+b c&d' });
  });

  it('skips the contact search read when no query is supplied', async () => {
    const { tools, calls } = createClient(() => ({}));

    await tools.handleToolCall('crm_contact_workspace', { contactId: 'c1' });

    expect(calls.some((call) => call.path === '/contacts/search')).toBe(false);
  });

  it('requests an explicit opportunity page size so a page is not mistaken for the whole result set', async () => {
    const { tools, calls } = createClient((call) => {
      if (call.path.startsWith('/opportunities/search')) {
        return { opportunities: Array.from({ length: 20 }, (_value, index) => ({ id: `o${index}` })), meta: { total: 57 } };
      }
      return {};
    });

    await tools.handleToolCall('crm_search_everything', {});

    const opportunityCall = calls.find((call) => call.path.startsWith('/opportunities/search'));
    expect(opportunityCall?.path).toContain('limit=20');
    expect(opportunityCall?.path).toContain('locationId=loc_1');
  });
});

describe('AgentWorkspaceTools failure and pagination reporting', () => {
  it('reports a rejected contact search as a failure instead of an empty result', async () => {
    const { tools } = createClient((call) => {
      if (call.path === '/contacts/search') {
        return new Error('GHL API Error (400): Property query should not exist');
      }
      return {};
    });

    const result: any = await tools.handleToolCall('crm_contact_workspace', { contactId: 'c1', query: 'jane' });
    const searchRead = readResult(result, 'Contact search');

    expect(searchRead.success).toBe(false);
    expect(searchRead.error).toContain('400');
    expect(searchRead.data).toBeUndefined();
    expect(result.resultSummary.failedReads).toBe(1);
    expect(result.readWarnings.join(' ')).toContain('Contact search failed');
    expect(result.readWarnings.join(' ')).toContain('not an empty result');
  });

  it('surfaces partial opportunity pages with total, returned count and next-page details', async () => {
    const { tools } = createClient((call) => {
      if (call.path.startsWith('/opportunities/search')) {
        return {
          opportunities: Array.from({ length: 20 }, (_value, index) => ({ id: `o${index}` })),
          meta: { total: 57, nextPageUrl: 'https://services.leadconnectorhq.com/opportunities/search?page=2', nextPage: 2 },
        };
      }
      return {};
    });

    const result: any = await tools.handleToolCall('crm_search_everything', {});
    const opportunityRead = readResult(result, 'Opportunities');

    expect(opportunityRead.pagination).toEqual({
      returned: 20,
      total: 57,
      hasMore: true,
      nextPage: 2,
      nextPageUrl: 'https://services.leadconnectorhq.com/opportunities/search?page=2',
    });
    expect(result.resultSummary.truncatedReads).toBe(1);
    const warning = result.readWarnings.find((item: string) => item.startsWith('Opportunities returned'));
    expect(warning).toContain('20 of 57 records');
    expect(warning).toContain('nextPageUrl');
  });

  it('stays quiet when a page is the complete result set', async () => {
    const { tools } = createClient((call) => {
      if (call.path.startsWith('/opportunities/search')) {
        return { opportunities: [{ id: 'o1' }, { id: 'o2' }], meta: { total: 2 } };
      }
      return {};
    });

    const result: any = await tools.handleToolCall('crm_search_everything', {});
    const opportunityRead = readResult(result, 'Opportunities');

    expect(opportunityRead.pagination?.hasMore).toBe(false);
    expect(result.resultSummary.truncatedReads).toBe(0);
    expect(result.readWarnings).toEqual([]);
  });

  it('leaves responses without pagination metadata untouched', async () => {
    const { tools } = createClient((call) => {
      if (call.path.startsWith('/opportunities/search')) return [{ id: 'o1' }];
      return {};
    });

    const result: any = await tools.handleToolCall('crm_search_everything', {});

    expect(readResult(result, 'Opportunities').pagination).toBeUndefined();
    expect(result.readWarnings).toEqual([]);
  });
});
