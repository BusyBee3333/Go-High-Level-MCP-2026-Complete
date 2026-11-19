import { describe, it, expect, afterEach, jest } from '@jest/globals';
import { WorkflowBuilderClient } from '../src/clients/workflow-builder-client.js';

describe('WorkflowBuilderClient.updateWorkflow', () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
    jest.restoreAllMocks();
  });

  it('preserves existing workflow execution settings when replacing actions', async () => {
    const current = {
      _id: 'workflow-1',
      name: 'Draft workflow',
      status: 'draft',
      version: 4,
      dataVersion: 7,
      timezone: 'account',
      stopOnResponse: true,
      allowMultiple: true,
      allowMultipleOpportunity: false,
      autoMarkAsRead: true,
      removeContactFromLastStep: true,
      workflowData: { templates: [] },
    };
    let putBody: Record<string, unknown> | undefined;
    let workflowReads = 0;

    global.fetch = jest.fn(async (input: string | URL | Request, init?: RequestInit) => {
      const url = String(input);
      if (url.startsWith('https://securetoken.googleapis.com/')) {
        return new Response(JSON.stringify({
          id_token: 'firebase-id-token',
          refresh_token: 'firebase-refresh-token',
        }), { status: 200, headers: { 'content-type': 'application/json' } });
      }
      if (url.endsWith('/workflow/location-1/workflow-1') && init?.method === 'GET') {
        workflowReads += 1;
        return new Response(JSON.stringify(current), { status: 200, headers: { 'content-type': 'application/json' } });
      }
      if (url.endsWith('/workflow/location-1/workflow-1') && init?.method === 'PUT') {
        putBody = JSON.parse(String(init.body || '{}'));
        return new Response(JSON.stringify({ ok: true }), { status: 200, headers: { 'content-type': 'application/json' } });
      }
      throw new Error(`Unexpected fetch: ${init?.method || 'GET'} ${url}`);
    }) as typeof fetch;

    const client = new WorkflowBuilderClient({
      apiKey: 'pit-test',
      firebaseApiKey: 'firebase-key',
      firebaseRefreshToken: 'firebase-refresh-token',
      locationId: 'location-1',
      userId: 'user-1',
    });

    await client.updateWorkflow('workflow-1', {
      actions: [{ name: 'Call 1', type: 'task-notification', attributes: { title: 'Call 1' } }],
    });

    expect(workflowReads).toBe(2);
    expect(putBody).toMatchObject({
      status: 'draft',
      stopOnResponse: true,
      allowMultiple: true,
      allowMultipleOpportunity: false,
      autoMarkAsRead: true,
      removeContactFromLastStep: true,
    });
  });
});
