import { registerAppResource, registerAppTool, RESOURCE_MIME_TYPE } from '@modelcontextprotocol/ext-apps/server';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { CallToolResult, ReadResourceResult } from '@modelcontextprotocol/sdk/types.js';
import { readFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { z } from 'zod';

type ToolInventoryItem = {
  name: string;
  category: string;
  access: string;
  method?: string;
  path?: string;
  source?: string;
};

type AppPayload = {
  appId: string;
  title: string;
  summary: string;
  status: string;
  metrics?: Array<{ label: string; value: string | number }>;
  data?: Record<string, unknown>;
  suggestedToolCalls?: Array<{
    label: string;
    tool: string;
    arguments?: Record<string, unknown>;
    requiresConfirmation?: boolean;
  }>;
};

const appDir = dirname(fileURLToPath(import.meta.url));
const packageRoot = appDir.endsWith(`${process.platform === 'win32' ? '\\' : '/'}dist`) ? resolve(appDir, '..') : appDir;
const repoRoot = resolve(packageRoot, '..');
const htmlPath = join(packageRoot, 'dist', 'mcp-app.html');
const appResourceUri = 'ui://ghl-mcp-apps/app.html';

export function createServer(): McpServer {
  const server = new McpServer({
    name: 'ghl-mcp-apps',
    version: '0.1.0',
  });

  registerAppResource(
    server,
    'GoHighLevel MCP Apps',
    appResourceUri,
    {
      mimeType: RESOURCE_MIME_TYPE,
      description: 'Interactive GoHighLevel MCP companion apps.',
    },
    async (): Promise<ReadResourceResult> => ({
      contents: [
        {
          uri: appResourceUri,
          mimeType: RESOURCE_MIME_TYPE,
          text: await readFile(htmlPath, 'utf8'),
        },
      ],
    }),
  );

  registerGhlAppTool(server, 'show_ghl_tool_explorer_app', {
    title: 'Open GHL Tool Explorer',
    description: 'Open an interactive explorer for the registered GoHighLevel MCP tools.',
    appId: 'tool-explorer',
    build: async () => buildToolExplorerPayload(),
  });

  registerGhlAppTool(server, 'show_ghl_contact_360_app', {
    title: 'Open Contact 360',
    description: 'Open a contact-focused GHL workspace with contact, conversation, and opportunity context.',
    appId: 'contact-360',
    inputSchema: {
      contactId: z.string().optional(),
      query: z.string().optional(),
      locationId: z.string().optional(),
    },
    build: async (args) => buildContactPayload(args),
  });

  registerGhlAppTool(server, 'show_ghl_pipeline_command_app', {
    title: 'Open Pipeline Command Center',
    description: 'Open a pipeline workspace for opportunity review and follow-up planning.',
    appId: 'pipeline-command',
    inputSchema: {
      locationId: z.string().optional(),
      pipelineId: z.string().optional(),
      status: z.string().optional(),
    },
    build: async (args) => buildPipelinePayload(args),
  });

  registerGhlAppTool(server, 'show_ghl_ads_reporting_app', {
    title: 'Open Ads Reporting Dashboard',
    description: 'Open an ads and attribution reporting workspace for GHL locations.',
    appId: 'ads-reporting',
    inputSchema: {
      startDate: z.string().optional(),
      endDate: z.string().optional(),
      locationId: z.string().optional(),
    },
    build: async (args) => buildAdsPayload(args),
  });

  registerGhlAppTool(server, 'show_ghl_agency_health_app', {
    title: 'Open Agency Health Check',
    description: 'Open a setup and operational health check for a GHL location.',
    appId: 'agency-health',
    inputSchema: {
      locationId: z.string().optional(),
    },
    build: async (args) => buildAgencyHealthPayload(args),
  });

  return server;
}

export async function buildPreviewPayload(appId: string, args: Record<string, unknown> = {}): Promise<AppPayload> {
  if (appId === 'contact-360') return buildContactPayload(args);
  if (appId === 'pipeline-command') return buildPipelinePayload(args);
  if (appId === 'ads-reporting') return buildAdsPayload(args);
  if (appId === 'agency-health') return buildAgencyHealthPayload(args);
  return buildToolExplorerPayload();
}

function registerGhlAppTool(
  server: McpServer,
  name: string,
  config: {
    title: string;
    description: string;
    appId: string;
    inputSchema?: Record<string, z.ZodTypeAny>;
    build: (args: Record<string, unknown>) => Promise<AppPayload>;
  },
): void {
  registerAppTool(
    server,
    name,
    {
      title: config.title,
      description: config.description,
      inputSchema: config.inputSchema || {},
      outputSchema: z.object({ payload: z.any() }),
      _meta: {
        ui: {
          resourceUri: appResourceUri,
          visibility: ['model', 'app'],
        },
        labels: {
          category: 'ghl-mcp-app',
          access: 'read',
          source: 'mcp-apps',
        },
      },
    },
    async (args): Promise<CallToolResult> => {
      const payload = await config.build(args || {});
      return {
        content: [{ type: 'text', text: `${payload.title}: ${payload.summary}` }],
        structuredContent: { payload },
      };
    },
  );
}

async function buildToolExplorerPayload(): Promise<AppPayload> {
  const tools = await readToolInventory();
  const categories = new Set(tools.map((tool) => tool.category));
  return {
    appId: 'tool-explorer',
    title: 'GHL Tool Explorer',
    summary: 'Browse, filter, and inspect the GoHighLevel MCP tool surface.',
    status: 'ready',
    metrics: [
      { label: 'Tools', value: tools.length },
      { label: 'Categories', value: categories.size },
      { label: 'Read', value: tools.filter((tool) => tool.access === 'read').length },
      { label: 'Destructive', value: tools.filter((tool) => tool.access === 'delete').length },
    ],
    data: { tools },
  };
}

async function buildContactPayload(args: Record<string, unknown>): Promise<AppPayload> {
  const locationId = stringArg(args.locationId) || process.env.GHL_LOCATION_ID || '';
  const query = stringArg(args.query);
  const contactId = stringArg(args.contactId);
  const [contact, contacts, conversations, opportunities] = await Promise.all([
    contactId ? callReadTool('get_contact', { contactId }) : Promise.resolve(null),
    query ? callReadTool('search_contacts', { locationId, query, pageLimit: 5 }) : Promise.resolve(null),
    callReadTool('search_conversations', { locationId, limit: 5 }),
    callReadTool('search_opportunities', { locationId, limit: 10 }),
  ]);

  return {
    appId: 'contact-360',
    title: 'Contact 360',
    summary: contactId || query
      ? 'Contact, conversation, and opportunity context for the selected lookup.'
      : 'Open with a contactId or query to load contact-specific context.',
    status: credentialsReady() ? 'ready' : 'needs credentials',
    metrics: [
      { label: 'Contacts Found', value: countRecords(contacts || contact) },
      { label: 'Conversations', value: countRecords(conversations) },
      { label: 'Opportunities', value: countRecords(opportunities) },
    ],
    data: {
      contact: contact || firstRecord(contacts),
      conversations: recordsFrom(conversations),
      opportunities: recordsFrom(opportunities),
      notes: [],
    },
    suggestedToolCalls: [
      { label: 'Search contacts', tool: 'search_contacts', arguments: { locationId, query: query || '' } },
      { label: 'Create follow-up task', tool: 'create_task', arguments: { contactId: contactId || '{{contactId}}' }, requiresConfirmation: true },
      { label: 'Send message', tool: 'send_sms', arguments: { contactId: contactId || '{{contactId}}', message: '{{message}}' }, requiresConfirmation: true },
    ],
  };
}

async function buildPipelinePayload(args: Record<string, unknown>): Promise<AppPayload> {
  const locationId = stringArg(args.locationId) || process.env.GHL_LOCATION_ID || '';
  const pipelineId = stringArg(args.pipelineId);
  const status = stringArg(args.status);
  const [pipelines, opportunities] = await Promise.all([
    callReadTool('get_pipelines', { locationId }),
    callReadTool('search_opportunities', { locationId, pipelineId, status, limit: 50 }),
  ]);
  const opportunityRecords = recordsFrom(opportunities);
  const staleOpportunities = opportunityRecords.slice(0, 8);

  return {
    appId: 'pipeline-command',
    title: 'Pipeline Command Center',
    summary: 'Review pipelines, active opportunities, and follow-up candidates.',
    status: credentialsReady() ? 'ready' : 'needs credentials',
    metrics: [
      { label: 'Pipelines', value: countRecords(pipelines) },
      { label: 'Opportunities', value: opportunityRecords.length },
      { label: 'Follow-up Candidates', value: staleOpportunities.length },
    ],
    data: {
      pipelines: recordsFrom(pipelines),
      opportunities: opportunityRecords,
      staleOpportunities,
    },
    suggestedToolCalls: [
      { label: 'Refresh opportunities', tool: 'search_opportunities', arguments: { locationId, pipelineId, status } },
      { label: 'Update opportunity status', tool: 'update_opportunity_status', arguments: { opportunityId: '{{opportunityId}}', status: '{{status}}' }, requiresConfirmation: true },
    ],
  };
}

async function buildAdsPayload(args: Record<string, unknown>): Promise<AppPayload> {
  const locationId = stringArg(args.locationId) || process.env.GHL_LOCATION_ID || '';
  const endDate = stringArg(args.endDate) || new Date().toISOString().slice(0, 10);
  const startDate = stringArg(args.startDate) || daysAgo(7);
  const [adReports, attribution] = await Promise.all([
    callReadTool('get_ad_reports', { locationId, startDate, endDate }),
    callReadTool('get_attribution_report', { locationId, startDate, endDate }),
  ]);

  return {
    appId: 'ads-reporting',
    title: 'Ads Reporting Dashboard',
    summary: `Ads and attribution workspace for ${startDate} through ${endDate}.`,
    status: credentialsReady() ? 'ready' : 'needs credentials',
    metrics: [
      { label: 'Ad Records', value: countRecords(adReports) },
      { label: 'Attribution Records', value: countRecords(attribution) },
      { label: 'Days', value: 7 },
    ],
    data: {
      adReports: recordsFrom(adReports),
      attribution: recordsFrom(attribution),
    },
    suggestedToolCalls: [
      { label: 'Get ad reports', tool: 'get_ad_reports', arguments: { locationId, startDate, endDate } },
      { label: 'Get attribution report', tool: 'get_attribution_report', arguments: { locationId, startDate, endDate } },
    ],
  };
}

async function buildAgencyHealthPayload(args: Record<string, unknown>): Promise<AppPayload> {
  const locationId = stringArg(args.locationId) || process.env.GHL_LOCATION_ID || '';
  const [location, users, calendars, pipelines] = await Promise.all([
    locationId ? callReadTool('get_location', { locationId }) : Promise.resolve(null),
    callReadTool('search_users', { locationId, limit: 20 }),
    callReadTool('get_calendars', { locationId }),
    callReadTool('get_pipelines', { locationId }),
  ]);

  return {
    appId: 'agency-health',
    title: 'Agency Health Check',
    summary: 'A compact location setup and operations overview.',
    status: credentialsReady() ? 'ready' : 'needs credentials',
    metrics: [
      { label: 'Users', value: countRecords(users) },
      { label: 'Calendars', value: countRecords(calendars) },
      { label: 'Pipelines', value: countRecords(pipelines) },
    ],
    data: {
      location,
      users: recordsFrom(users),
      calendars: recordsFrom(calendars),
      pipelines: recordsFrom(pipelines),
    },
    suggestedToolCalls: [
      { label: 'Refresh users', tool: 'search_users', arguments: { locationId, limit: 20 } },
      { label: 'Open calendar audit', tool: 'get_calendars', arguments: { locationId } },
    ],
  };
}

async function callReadTool(name: string, args: Record<string, unknown>): Promise<unknown> {
  if (!credentialsReady()) return { status: 'skipped', reason: 'Set GHL_API_KEY and GHL_LOCATION_ID to load live data.' };
  try {
    const registry = await createRegistry();
    return await registry.callTool(name, compact(args));
  } catch (error) {
    return { status: 'error', message: error instanceof Error ? error.message : String(error) };
  }
}

async function createRegistry(): Promise<any> {
  const [{ EnhancedGHLClient }, { ToolRegistry }] = await Promise.all([
    import(pathToFileURL(join(repoRoot, 'dist', 'enhanced-ghl-client.js')).href),
    import(pathToFileURL(join(repoRoot, 'dist', 'tool-registry.js')).href),
  ]);
  const client = new EnhancedGHLClient({
    accessToken: process.env.GHL_API_KEY,
    locationId: process.env.GHL_LOCATION_ID,
    baseUrl: process.env.GHL_BASE_URL || 'https://services.leadconnectorhq.com',
    version: process.env.GHL_API_VERSION || '2021-07-28',
  });
  return new ToolRegistry(client);
}

async function readToolInventory(): Promise<ToolInventoryItem[]> {
  const raw = await readFile(join(repoRoot, 'docs', 'tool-inventory.json'), 'utf8');
  const parsed = JSON.parse(raw) as { tools?: ToolInventoryItem[] };
  return parsed.tools || [];
}

function credentialsReady(): boolean {
  return Boolean(process.env.GHL_API_KEY && process.env.GHL_LOCATION_ID);
}

function recordsFrom(value: unknown): Record<string, unknown>[] {
  if (Array.isArray(value)) return value.filter(isRecord);
  if (!isRecord(value)) return [];
  for (const key of ['contacts', 'opportunities', 'pipelines', 'users', 'calendars', 'conversations', 'messages', 'data', 'items', 'results']) {
    const nested = value[key];
    if (Array.isArray(nested)) return nested.filter(isRecord);
  }
  return [value];
}

function firstRecord(value: unknown): Record<string, unknown> | null {
  return recordsFrom(value)[0] || null;
}

function countRecords(value: unknown): number {
  return recordsFrom(value).length;
}

function stringArg(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

function compact(args: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(Object.entries(args).filter(([, value]) => value !== undefined && value !== ''));
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function daysAgo(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString().slice(0, 10);
}
