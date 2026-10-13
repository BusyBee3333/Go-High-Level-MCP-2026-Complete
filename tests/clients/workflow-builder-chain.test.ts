import { describe, it, expect, afterEach, jest } from '@jest/globals';
import { WorkflowBuilderClient } from '../../src/clients/workflow-builder-client.js';

type Template = { id: string; type: string; next?: unknown; parentKey?: string; cat?: string };

function mockBuilder(current: Record<string, unknown>) {
  const captured: { putBody?: Record<string, any> } = {};
  global.fetch = jest.fn(async (input: string | URL | Request, init?: RequestInit) => {
    const url = String(input);
    if (url.startsWith('https://securetoken.googleapis.com/')) {
      return new Response(JSON.stringify({ id_token: 'id', refresh_token: 'refresh' }), { status: 200 });
    }
    if (url.endsWith('/workflow/loc-1/wf-1') && (init?.method || 'GET') === 'GET') {
      const body = captured.putBody
        ? { ...current, workflowData: captured.putBody.workflowData }
        : current;
      return new Response(JSON.stringify(body), { status: 200 });
    }
    if (url.endsWith('/workflow/loc-1/wf-1') && init?.method === 'PUT') {
      captured.putBody = JSON.parse(String(init.body || '{}'));
      return new Response(JSON.stringify({ ok: true }), { status: 200 });
    }
    throw new Error(`Unexpected fetch: ${init?.method || 'GET'} ${url}`);
  }) as typeof fetch;
  const client = new WorkflowBuilderClient({
    apiKey: 'pit', firebaseApiKey: 'fb', firebaseRefreshToken: 'refresh',
    locationId: 'loc-1', userId: 'user-1',
  });
  return { client, captured };
}

const base = { _id: 'wf-1', name: 'Draft', status: 'draft', version: 1, dataVersion: 1, workflowData: { templates: [] } };

describe('WorkflowBuilderClient action chaining', () => {
  const originalFetch = global.fetch;
  afterEach(() => { global.fetch = originalFetch; jest.restoreAllMocks(); });

  it('links linear steps with a single string next id, not an array', async () => {
    const { client, captured } = mockBuilder(base);
    await client.updateWorkflow('wf-1', {
      actions: [
        { id: 'a', name: 'Create contact', type: 'create_update_contact' },
        { id: 'b', name: 'Tag', type: 'add_contact_tag', attributes: { tags: ['x'] } },
        { id: 'c', name: 'Wait', type: 'wait' },
      ],
    });
    const t = captured.putBody!.workflowData.templates as Template[];
    expect(t.map(x => x.next)).toEqual(['b', 'c', undefined]);
    expect(t.map(x => x.parentKey)).toEqual([undefined, 'a', 'b']);
    for (const step of t) expect(Array.isArray(step.next)).toBe(false);
  });

  it('collapses an explicit single-element array next on a non-branch step', async () => {
    const { client, captured } = mockBuilder(base);
    await client.updateWorkflow('wf-1', {
      actions: [
        { id: 'a', name: 'Tag', type: 'add_contact_tag', next: ['b'] },
        { id: 'b', name: 'Wait', type: 'wait', next: [] },
      ],
    });
    const t = captured.putBody!.workflowData.templates as Template[];
    expect(t[0].next).toBe('b');
    expect(t[1].next).toBeUndefined();
  });

  it('keeps array next on if/else and multi-path branch points', async () => {
    const { client, captured } = mockBuilder(base);
    await client.updateWorkflow('wf-1', {
      actions: [
        { id: 'a', name: 'If/else', type: 'if_else', cat: 'conditions', next: ['y', 'n'] },
        { id: 'p', name: 'Find opp', type: 'find_opportunity', cat: 'multi-path', next: ['t1', 't2'], parentKey: 'z' },
      ],
    });
    const t = captured.putBody!.workflowData.templates as Template[];
    expect(t[0].next).toEqual(['y', 'n']);
    expect(t[1].next).toEqual(['t1', 't2']);
  });

  it('remaps string next ids when cloning a linear workflow', async () => {
    const source = {
      ...base,
      workflowData: {
        templates: [
          { id: 'a', name: 'Tag', type: 'add_contact_tag', next: 'b' },
          { id: 'b', name: 'Wait', type: 'wait', parentKey: 'a' },
        ],
      },
    };
    const calls: string[] = [];
    let putBody: Record<string, any> | undefined;
    global.fetch = jest.fn(async (input: string | URL | Request, init?: RequestInit) => {
      const url = String(input);
      const method = init?.method || 'GET';
      calls.push(`${method} ${url}`);
      if (url.startsWith('https://securetoken.googleapis.com/')) {
        return new Response(JSON.stringify({ id_token: 'id' }), { status: 200 });
      }
      if (url.endsWith('/workflow/loc-1') && method === 'POST') {
        return new Response(JSON.stringify({ id: 'wf-2' }), { status: 200 });
      }
      if (url.endsWith('/workflow/loc-1/wf-1')) return new Response(JSON.stringify(source), { status: 200 });
      if (url.endsWith('/workflow/loc-1/wf-2') && method === 'GET') {
        return new Response(JSON.stringify(putBody ? { ...base, _id: 'wf-2', workflowData: putBody.workflowData } : { ...base, _id: 'wf-2' }), { status: 200 });
      }
      if (url.endsWith('/workflow/loc-1/wf-2') && method === 'PUT') {
        putBody = JSON.parse(String(init!.body || '{}'));
        return new Response(JSON.stringify({ ok: true }), { status: 200 });
      }
      throw new Error(`Unexpected fetch: ${method} ${url}`);
    }) as typeof fetch;
    const client = new WorkflowBuilderClient({
      apiKey: 'pit', firebaseApiKey: 'fb', firebaseRefreshToken: 'refresh', locationId: 'loc-1', userId: 'user-1',
    });
    await client.cloneWorkflow('wf-1', 'Copy');
    const t = putBody!.workflowData.templates as Template[];
    expect(typeof t[0].next).toBe('string');
    expect(t[0].next).toBe(t[1].id);
    expect(t[0].next).not.toBe('b');
    expect(t[1].parentKey).toBe(t[0].id);
  });
});
