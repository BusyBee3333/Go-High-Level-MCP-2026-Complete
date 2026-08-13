import { describe, expect, it } from '@jest/globals';
import { AgentWorkspaceTools } from '../../src/tools/agent-workspace-tools.js';
import { CampaignsTools } from '../../src/tools/campaigns-tools.js';
import { WorkflowInsightsTools } from '../../src/tools/workflow-insights-tools.js';

type Generation = 'v3' | 'v2';
type RequestCall = {
  method: string;
  path: string;
  body: unknown;
  options?: { version?: string };
};

function captureClient(generation: Generation) {
  const calls: RequestCall[] = [];
  const client = {
    getConfig: () => ({
      accessToken: 'token',
      baseUrl: 'https://services.leadconnectorhq.com',
      version: 'v3',
      locationId: 'location-123',
      apiGeneration: generation,
    }),
    makeRequest: async (method: string, path: string, body?: unknown, options?: { version?: string }) => {
      calls.push({ method, path, body, options });
      return { success: true, data: {} };
    },
  };
  return { client, calls };
}

describe('mixed-generation handwritten and composed routing', () => {
  it.each([
    ['v3', 'v3'],
    ['v2', '2021-07-28'],
  ] as const)('routes get_campaigns through the official %s endpoint/version', async (generation, version) => {
    const { client, calls } = captureClient(generation);

    await new CampaignsTools(client).handleToolCall('get_campaigns', {
      locationId: 'location-123',
      status: 'draft',
    });

    expect(calls).toEqual([expect.objectContaining({
      method: 'GET',
      path: '/campaigns/?locationId=location-123&status=draft',
      options: { version },
    })]);
    expect(calls[0].path).not.toContain('/emails/schedule');
  });

  it.each([
    ['v3', '/emails/locations/location-123/campaigns/emails?limit=20', 'v3', 'v3'],
    ['v2', '/emails/schedule?locationId=location-123&campaignsOnly=true&showStats=true&limit=25', '2021-07-28', '2021-04-15'],
  ] as const)(
    'captures workflow-insights %s email and Calendar versions',
    async (generation, emailPath, emailVersion, calendarVersion) => {
      const { client, calls } = captureClient(generation);

      await new WorkflowInsightsTools(client).handleToolCall('audit_location_ads_setup', {
        locationId: 'location-123',
      });

      expect(calls).toContainEqual(expect.objectContaining({
        method: 'GET',
        path: emailPath,
        options: { version: emailVersion },
      }));
      expect(calls).toContainEqual(expect.objectContaining({
        method: 'GET',
        path: '/calendars/?locationId=location-123&showDrafted=true',
        options: { version: calendarVersion },
      }));
      if (generation === 'v3') {
        expect(calls.some((call) => call.path.includes('/emails/schedule'))).toBe(false);
        expect(calls.some((call) => call.path.includes('/emails/public/v2'))).toBe(false);
      }
    },
  );

  it.each([
    ['v3', '/emails/locations/location-123/campaigns/emails?limit=5', 'v3', 'v3', 'locationId'],
    ['v2', '/emails/public/v2/locations/location-123/campaigns/emails?limit=5', '2023-02-21', '2021-04-15', 'location_id'],
  ] as const)(
    'captures curated workspace %s paths and exact versions',
    async (generation, emailPath, emailVersion, calendarVersion, opportunityLocationKey) => {
      const { client, calls } = captureClient(generation);
      const tools = new AgentWorkspaceTools(client as never);

      await tools.handleToolCall('crm_location_overview');
      await tools.handleToolCall('crm_daily_briefing');

      expect(calls).toContainEqual(expect.objectContaining({
        method: 'GET',
        path: emailPath,
        options: { version: emailVersion },
      }));
      expect(calls).toContainEqual(expect.objectContaining({
        method: 'GET',
        path: '/calendars/?locationId=location-123',
        options: { version: calendarVersion },
      }));
      expect(calls.some((call) => call.path === `/opportunities/search?${opportunityLocationKey}=location-123&status=open`)).toBe(true);
      if (generation === 'v3') {
        expect(calls.some((call) => call.path.includes('/emails/public/v2'))).toBe(false);
        expect(calls.some((call) => call.path.includes('/emails/schedule'))).toBe(false);
      }
    },
  );
});
