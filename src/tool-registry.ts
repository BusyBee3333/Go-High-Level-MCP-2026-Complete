/**
 * Tool Registry — bridges existing tool classes to McpServer.registerTool()
 * 
 * Reads tool definitions from all existing tool classes, infers annotations
 * from tool names and metadata, and registers them with the McpServer API.
 * 
 * This avoids rewriting 38 tool files while getting all the benefits of
 * the new SDK: annotations, Zod validation, structured responses.
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { ToolAnnotations, Tool } from '@modelcontextprotocol/sdk/types.js';

import { GHLApiClient } from './clients/ghl-api-client.js';
import { ContactTools } from './tools/contact-tools.js';
import { ConversationTools } from './tools/conversation-tools.js';
import { BlogTools } from './tools/blog-tools.js';
import { OpportunityTools } from './tools/opportunity-tools.js';
import { CalendarTools } from './tools/calendar-tools.js';
import { EmailTools } from './tools/email-tools.js';
import { LocationTools } from './tools/location-tools.js';
import { EmailISVTools } from './tools/email-isv-tools.js';
import { SocialMediaTools } from './tools/social-media-tools.js';
import { MediaTools } from './tools/media-tools.js';
import { ObjectTools } from './tools/object-tools.js';
import { AssociationTools } from './tools/association-tools.js';
import { CustomFieldV2Tools } from './tools/custom-field-v2-tools.js';
import { WorkflowTools } from './tools/workflow-tools.js';
import { SurveyTools } from './tools/survey-tools.js';
import { StoreTools } from './tools/store-tools.js';
import { ProductsTools } from './tools/products-tools.js';
import { AffiliatesTools } from './tools/affiliates-tools.js';
import { BusinessesTools } from './tools/businesses-tools.js';
import { CampaignsTools } from './tools/campaigns-tools.js';
import { CompaniesTools } from './tools/companies-tools.js';
import { CoursesTools } from './tools/courses-tools.js';
import { FormsTools } from './tools/forms-tools.js';
import { FunnelsTools } from './tools/funnels-tools.js';
import { InvoicesTools } from './tools/invoices-tools.js';
import { LinksTools } from './tools/links-tools.js';
import { PaymentsTools } from './tools/payments-tools.js';
import { PhoneTools } from './tools/phone-tools.js';
import { ReportingTools } from './tools/reporting-tools.js';
import { ReputationTools } from './tools/reputation-tools.js';
import { SaasTools } from './tools/saas-tools.js';
import { SmartListsTools } from './tools/smartlists-tools.js';
import { SnapshotsTools } from './tools/snapshots-tools.js';
import { TemplatesTools } from './tools/templates-tools.js';
import { TriggersTools } from './tools/triggers-tools.js';
import { UsersTools } from './tools/users-tools.js';
import { WebhooksTools } from './tools/webhooks-tools.js';
import { WorkflowBuilderTools } from './tools/workflow-builder-tools.js';
import { PhoneSystemTools } from './tools/phone-system-tools.js';
import { VoiceAITools } from './tools/voice-ai-tools.js';
import { ProposalsTools } from './tools/proposals-tools.js';
import { CustomMenusTools } from './tools/custom-menus-tools.js';
import { MarketplaceTools } from './tools/marketplace-tools.js';
import { AgentStudioTools } from './tools/agent-studio-tools.js';
import { NotesTools } from './tools/notes-tools.js';
import { OAuthTools } from './tools/oauth-tools.js';
import { OfficialSpecTools } from './tools/official-spec-tools.js';
import { WorkflowInsightsTools } from './tools/workflow-insights-tools.js';
import { AgentWorkspaceTools } from './tools/agent-workspace-tools.js';

// ─── Types ──────────────────────────────────────────────────

interface ToolModule {
  name: string;
  instance: any;
  getTools: () => Tool[];
  executeTool: (name: string, args: Record<string, unknown>) => Promise<unknown>;
}

export interface ToolInventoryItem {
  name: string;
  module: string;
  description: string;
  category: string;
  access: string;
  destructive: boolean;
  readOnly: boolean;
  idempotent: boolean;
  required: string[];
  scopes: string[];
  source: string;
  stability: ToolStability;
  method?: string;
  path?: string;
  operationId?: string;
  deprecated?: boolean;
}

type ToolProfile = 'full' | 'curated' | 'raw' | 'official' | 'stable';
type ToolStability = 'official' | 'live-docs-supplemental' | 'legacy-compatible' | 'private-or-unstable' | 'deprecated';

// ─── Annotation Inference ───────────────────────────────────

/**
 * Infer MCP tool annotations from tool name and metadata.
 * This classifies every tool by its HTTP method semantics.
 */
function inferAnnotations(toolName: string, meta?: any): ToolAnnotations {
  const name = toolName.toLowerCase();
  const access = meta?.labels?.access;

  // Read-only operations
  const isRead = access === 'read' ||
    name.startsWith('get_') ||
    name.startsWith('search_') ||
    name.startsWith('list_') ||
    name.startsWith('check_') ||
    name.startsWith('validate_') ||
    name.startsWith('view_') ||
    name.startsWith('ghl_get_') ||
    name.startsWith('ghl_list_') ||
    name.startsWith('get_csv_') ||
    name.startsWith('get_platform_') ||
    name.startsWith('get_blocked_') ||
    name.startsWith('download_') ||
    name.startsWith('generate_invoice_number') ||
    name.startsWith('generate_estimate_number') ||
    name === 'get_timezones' ||
    name === 'verify_email' ||
    name === 'live_chat_typing';

  // Destructive operations (DELETE)
  const isDestructive = access === 'delete' ||
    name.startsWith('delete_') ||
    name.startsWith('remove_') ||
    name.startsWith('ghl_delete_') ||
    name.startsWith('bulk_delete_') ||
    name === 'void_invoice' ||
    name === 'cancel_scheduled_message' ||
    name === 'cancel_scheduled_email' ||
    name === 'cancel_invoice_schedule';

  // Idempotent operations (GET, PUT, DELETE — same result if repeated)
  const isIdempotent = isRead ||
    name.startsWith('update_') ||
    name.startsWith('upsert_') ||
    name.startsWith('ghl_update_') ||
    name.startsWith('set_') ||
    isDestructive;

  return {
    title: toolName.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
    readOnlyHint: isRead,
    destructiveHint: isDestructive,
    idempotentHint: isIdempotent,
    openWorldHint: true, // All tools interact with GHL API
  };
}

function inferToolInventoryItem(tool: Tool, moduleName: string): ToolInventoryItem {
  const meta = (tool as any)._meta || {};
  const labels = meta.labels || {};
  const official = meta.official || {};
  const stability = inferToolStability(tool);
  const annotations = inferAnnotations(tool.name, meta);
  const schema = (tool as any).inputSchema || {};
  const required = Array.isArray(schema.required) ? schema.required.map(String) : [];

  return {
    name: tool.name,
    module: moduleName,
    description: tool.description || '',
    category: labels.category || moduleName,
    access: annotations.destructiveHint ? 'delete' : annotations.readOnlyHint ? 'read' : labels.access || 'write',
    destructive: Boolean(annotations.destructiveHint),
    readOnly: Boolean(annotations.readOnlyHint),
    idempotent: Boolean(annotations.idempotentHint),
    required,
    scopes: Array.isArray(official.scopes) ? official.scopes : [],
    source: labels.source || (official.operationId ? 'official-ghl-openapi' : 'local-tool-module'),
    stability,
    method: official.method,
    path: official.path,
    operationId: official.operationId,
    deprecated: official.deprecated || stability === 'deprecated' || undefined,
  };
}

function inferToolStability(tool: Tool): ToolStability {
  const meta = (tool as any)._meta || {};
  const labels = meta.labels || {};
  const official = meta.official || {};
  const labeledStability = labels.stability;
  const source = String(labels.source || '');
  const category = String(labels.category || '');
  const description = `${tool.description || ''} ${official.operationId || ''}`.toLowerCase();
  const path = String(official.path || '');

  if (isKnownStability(labeledStability)) return labeledStability;
  if (category === 'agent-workspace' || source === 'curated-agent-workspace') return 'legacy-compatible';
  if (official.deprecated || description.includes('deprecated')) return 'deprecated';
  if (source === 'live-ghl-docs' || path.startsWith('/emails/public/v2/')) return 'live-docs-supplemental';
  if (official.operationId || source === 'official-ghl-openapi') return 'official';
  if (isDeprecatedOrCompatibilityPath(path, tool.name)) return 'deprecated';
  if (isPrivateOrInternalPath(path, category, tool.name, description)) return 'private-or-unstable';
  return 'legacy-compatible';
}

function isKnownStability(value: unknown): value is ToolStability {
  return value === 'official' ||
    value === 'live-docs-supplemental' ||
    value === 'legacy-compatible' ||
    value === 'private-or-unstable' ||
    value === 'deprecated';
}

function isDeprecatedOrCompatibilityPath(path: string, toolName: string): boolean {
  return /\/campaigns|\/emails\/schedule|\/emails\/builder|\/contacts\/[^/]+\/campaigns|scheduled-messages/i.test(path) ||
    /deprecated|legacy|scheduled_message|campaign/.test(toolName.toLowerCase());
}

function isPrivateOrInternalPath(path: string, category: string, toolName: string, description: string): boolean {
  const value = `${path} ${category} ${toolName} ${description}`;
  return /oauth|login|firebase|integrations|internal|marketplace|social-media-posting|saas|snapshots|phone|voice-ai|proposals|custom-menus|workflowbuilder/i.test(value);
}

// ─── Tool Registry ──────────────────────────────────────────

export class ToolRegistry {
  private modules: ToolModule[] = [];
  private toolToModule = new Map<string, ToolModule>();
  private allToolDefs: Tool[] = [];
  private profile: ToolProfile = readToolProfile();
  private generation: 'v3' | 'v2';

  constructor(ghlClient: GHLApiClient) {
    const configuredGeneration = ghlClient.getConfig?.().apiGeneration;
    this.generation = configuredGeneration === 'v2' || configuredGeneration === 'v3'
      ? configuredGeneration
      : process.env.GHL_API_GENERATION === 'v2' ? 'v2' : 'v3';
    this.initModules(ghlClient);
  }

  private initModules(ghl: GHLApiClient): void {
    // Legacy modules (use getToolDefinitions/getTools + executeTool)
    const contactTools = new ContactTools(ghl);
    const conversationTools = new ConversationTools(ghl);
    const blogTools = new BlogTools(ghl);
    const opportunityTools = new OpportunityTools(ghl);
    const calendarTools = new CalendarTools(ghl);
    const emailTools = new EmailTools(ghl);
    const locationTools = new LocationTools(ghl);
    const emailISVTools = new EmailISVTools(ghl);
    const socialMediaTools = new SocialMediaTools(ghl);
    const mediaTools = new MediaTools(ghl);
    const objectTools = new ObjectTools(ghl);

    // Modules with getTools/executeXxxTool pattern
    const associationTools = new AssociationTools(ghl);
    const customFieldV2Tools = new CustomFieldV2Tools(ghl);
    const workflowTools = new WorkflowTools(ghl);
    const surveyTools = new SurveyTools(ghl);
    const storeTools = new StoreTools(ghl);
    const productsTools = new ProductsTools(ghl);

    // Dynamic modules (use getToolDefinitions + handleToolCall)
    const affiliatesTools = new AffiliatesTools(ghl);
    const businessesTools = new BusinessesTools(ghl);
    const campaignsTools = new CampaignsTools(ghl);
    const companiesTools = new CompaniesTools(ghl);
    const coursesTools = new CoursesTools(ghl);
    const formsTools = new FormsTools(ghl);
    const funnelsTools = new FunnelsTools(ghl);
    const invoicesTools = new InvoicesTools(ghl);
    const linksTools = new LinksTools(ghl);
    const paymentsTools = new PaymentsTools(ghl);
    const phoneTools = new PhoneTools(ghl);
    const reportingTools = new ReportingTools(ghl);
    const reputationTools = new ReputationTools(ghl);
    const saasTools = new SaasTools(ghl);
    const smartListsTools = new SmartListsTools(ghl);
    const snapshotsTools = new SnapshotsTools(ghl);
    const templatesTools = new TemplatesTools(ghl);
    const triggersTools = new TriggersTools(ghl);
    const usersTools = new UsersTools(ghl);
    const webhooksTools = new WebhooksTools(ghl);
    const phoneSystemTools = new PhoneSystemTools(ghl);
    const voiceAITools = new VoiceAITools(ghl);
    const proposalsTools = new ProposalsTools(ghl);
    const customMenusTools = new CustomMenusTools(ghl);
    const marketplaceTools = new MarketplaceTools(ghl);
    const agentStudioTools = new AgentStudioTools(ghl);
    const notesTools = new NotesTools(ghl);
    const oauthTools = new OAuthTools(ghl);
    const officialSpecTools = new OfficialSpecTools(ghl);
    const workflowInsightsTools = new WorkflowInsightsTools(ghl);
    const agentWorkspaceTools = new AgentWorkspaceTools(ghl);

    // Register legacy modules (executeTool pattern)
    this.addModule('contact', contactTools, 'getToolDefinitions', 'executeTool');
    this.addModule('conversation', conversationTools, 'getToolDefinitions', 'executeTool');
    this.addModule('blog', blogTools, 'getToolDefinitions', 'executeTool');
    this.addModule('opportunity', opportunityTools, 'getToolDefinitions', 'executeTool');
    this.addModule('calendar', calendarTools, 'getToolDefinitions', 'executeTool');
    this.addModule('email', emailTools, 'getToolDefinitions', 'executeTool');
    this.addModule('location', locationTools, 'getToolDefinitions', 'executeTool');
    this.addModule('emailISV', emailISVTools, 'getToolDefinitions', 'executeTool');
    this.addModule('socialMedia', socialMediaTools, 'getTools', 'executeTool');
    this.addModule('media', mediaTools, 'getToolDefinitions', 'executeTool');
    this.addModule('objects', objectTools, 'getToolDefinitions', 'executeTool');

    // Modules with specialized execute methods
    this.addModule('associations', associationTools, 'getTools', 'executeAssociationTool');
    this.addModule('customFieldsV2', customFieldV2Tools, 'getTools', 'executeCustomFieldV2Tool');
    this.addModule('workflows', workflowTools, 'getTools', 'executeWorkflowTool');
    this.addModule('surveys', surveyTools, 'getTools', 'executeSurveyTool');
    this.addModule('store', storeTools, 'getTools', 'executeStoreTool');
    this.addModule('products', productsTools, 'getTools', 'executeProductsTool');

    // Dynamic modules (handleToolCall pattern)
    this.addModule('affiliates', affiliatesTools, 'getToolDefinitions', 'handleToolCall');
    this.addModule('businesses', businessesTools, 'getToolDefinitions', 'handleToolCall');
    this.addModule('campaigns', campaignsTools, 'getToolDefinitions', 'handleToolCall');
    this.addModule('companies', companiesTools, 'getToolDefinitions', 'handleToolCall');
    this.addModule('courses', coursesTools, 'getToolDefinitions', 'handleToolCall');
    this.addModule('forms', formsTools, 'getToolDefinitions', 'handleToolCall');
    this.addModule('funnels', funnelsTools, 'getToolDefinitions', 'handleToolCall');
    this.addModule('invoices', invoicesTools, 'getTools', 'handleToolCall');
    this.addModule('links', linksTools, 'getToolDefinitions', 'handleToolCall');
    this.addModule('payments', paymentsTools, 'getTools', 'handleToolCall');
    this.addModule('phone', phoneTools, 'getToolDefinitions', 'handleToolCall');
    this.addModule('reporting', reportingTools, 'getToolDefinitions', 'handleToolCall');
    this.addModule('reputation', reputationTools, 'getToolDefinitions', 'handleToolCall');
    this.addModule('saas', saasTools, 'getToolDefinitions', 'handleToolCall');
    this.addModule('smartLists', smartListsTools, 'getToolDefinitions', 'handleToolCall');
    this.addModule('snapshots', snapshotsTools, 'getToolDefinitions', 'handleToolCall');
    this.addModule('templates', templatesTools, 'getToolDefinitions', 'handleToolCall');
    this.addModule('triggers', triggersTools, 'getToolDefinitions', 'handleToolCall');
    this.addModule('users', usersTools, 'getToolDefinitions', 'handleToolCall');
    this.addModule('webhooks', webhooksTools, 'getToolDefinitions', 'handleToolCall');
    this.addModule('phoneSystem', phoneSystemTools, 'getToolDefinitions', 'handleToolCall');
    this.addModule('voiceAI', voiceAITools, 'getToolDefinitions', 'handleToolCall');
    this.addModule('proposals', proposalsTools, 'getToolDefinitions', 'handleToolCall');
    this.addModule('customMenus', customMenusTools, 'getToolDefinitions', 'handleToolCall');
    this.addModule('marketplace', marketplaceTools, 'getToolDefinitions', 'handleToolCall');
    this.addModule('agentStudio', agentStudioTools, 'getToolDefinitions', 'handleToolCall');
    this.addModule('notes', notesTools, 'getToolDefinitions', 'handleToolCall');
    this.addModule('oauth', oauthTools, 'getToolDefinitions', 'handleToolCall');
    this.addModule('officialSpec', officialSpecTools, 'getToolDefinitions', 'handleToolCall');
    this.addModule('workflowInsights', workflowInsightsTools, 'getToolDefinitions', 'handleToolCall');
    this.addModule('agentWorkspace', agentWorkspaceTools, 'getToolDefinitions', 'handleToolCall');

    // Workflow Builder — internal API with Firebase auth (no GHL API client dependency)
    const workflowBuilderTools = new WorkflowBuilderTools();
    this.addModule('workflowBuilder', workflowBuilderTools, 'getTools', 'executeWorkflowBuilderTool');
  }

  private addModule(
    name: string,
    instance: any,
    listMethod: string,
    executeMethod: string
  ): void {
    const getTools = () => instance[listMethod]() as Tool[];
    const executeTool = (toolName: string, args: Record<string, unknown>) =>
      instance[executeMethod](toolName, args);

    let tools: Tool[];
    try {
      tools = getTools();
    } catch (err: any) {
      process.stderr.write(`[Registry] Warning: Failed to load tools from ${name}: ${err.message}\n`);
      return;
    }

    const duplicate = tools.find((tool) => this.toolToModule.has(tool.name));
    if (duplicate) {
      const existingModule = this.toolToModule.get(duplicate.name)?.name || 'unknown';
      throw new Error(
        `[Registry] Duplicate tool name "${duplicate.name}" in modules ` +
        `"${existingModule}" and "${name}". Tool dispatch must be unambiguous.`
      );
    }

    const mod: ToolModule = { name, instance, getTools, executeTool };
    this.modules.push(mod);
    for (const tool of tools) {
      this.toolToModule.set(tool.name, mod);
      this.allToolDefs.push(tool);
    }
  }

  /**
   * Register all tools with a McpServer instance
   */
  registerAll(server: McpServer): number {
    let count = 0;

    for (const tool of this.visibleToolDefs()) {
      const mod = this.toolToModule.get(tool.name);
      if (!mod) continue;

      const meta = (tool as any)._meta;
      const annotations = inferAnnotations(tool.name, meta);

      try {
        server.registerTool(
          tool.name,
          {
            title: annotations.title,
            description: tool.description || '',
            annotations,
            _meta: meta,
          },
          async (args: any) => {
            try {
              const result = await mod.executeTool(tool.name, args || {});
              // Normalize result to MCP format
              const text = typeof result === 'string' ? result : JSON.stringify(result, null, 2);
              return {
                content: [{ type: 'text' as const, text }],
              };
            } catch (err: any) {
              return {
                content: [{ type: 'text' as const, text: `Error executing ${tool.name}: ${err.message}` }],
                isError: true,
              };
            }
          }
        );
        count++;
      } catch (err: any) {
        process.stderr.write(`[Registry] Failed to register tool ${tool.name}: ${err.message}\n`);
      }
    }

    return count;
  }

  /**
   * Call a tool directly (for REST endpoint)
   */
  async callTool(name: string, args: Record<string, unknown>): Promise<unknown> {
    const mod = this.toolToModule.get(name);
    if (!mod) return undefined;
    if (!this.isToolVisible(name)) return undefined;
    return mod.executeTool(name, args);
  }

  /**
   * Get tool counts by category (for REST /)
   */
  getToolCounts(): Record<string, number | Record<string, number>> {
    const counts: Record<string, number> = {};
    for (const mod of this.modules) {
      try {
        counts[mod.name] = mod.getTools().filter((tool) => this.isToolVisible(tool.name)).length;
      } catch {
        counts[mod.name] = 0;
      }
    }

    const total = Object.values(counts).reduce((a, b) => a + b, 0);
    return {
      ...counts,
      total,
      sections: Object.keys(counts).length,
    };
  }

  /**
   * Get all tool definitions (for REST /tools endpoint)
   */
  getAllToolDefinitions(): Tool[] {
    // Add annotations to existing tool defs for the REST endpoint
    return this.visibleToolDefs().map(tool => {
      const meta = (tool as any)._meta;
      const annotations = inferAnnotations(tool.name, meta);
      return {
        ...tool,
        annotations,
      };
    });
  }

  getToolInventory(): ToolInventoryItem[] {
    return this.visibleToolDefs().map((tool) => {
      const mod = this.toolToModule.get(tool.name);
      return inferToolInventoryItem(tool, mod?.name || 'unknown');
    });
  }

  /**
   * Get count of registered GHL tools (excluding apps)
   */
  getToolCount(): number {
    return this.visibleToolDefs().length;
  }

  /**
   * Get all registered tool names
   */
  getAllToolNames(): string[] {
    return this.visibleToolDefs().map(t => t.name);
  }

  getToolProfile(): ToolProfile {
    return this.profile;
  }

  private visibleToolDefs(): Tool[] {
    return this.allToolDefs.filter((tool) => this.isToolVisible(tool.name));
  }

  private isToolVisible(name: string): boolean {
    const tool = this.allToolDefs.find((item) => item.name === name);
    if (!tool) return false;
    const category = ((tool as any)._meta?.labels?.category || '').toString();
    const source = ((tool as any)._meta?.labels?.source || '').toString();
    const isCurated = category === 'agent-workspace' || source === 'curated-agent-workspace';
    const stability = inferToolStability(tool);

    // v3/v2 generation gating: hide endpoints that don't belong in the
    // active generation. In v3 mode, deprecated v2 endpoints superseded by a
    // v3 equivalent are hidden (they're still registered, just not exposed).
    // In v2 mode, v3-only endpoints are hidden. This implements the
    // "v3 default, v2 behind a flag" behavior.
    const official = (tool as any)._meta?.official || {};
    const specTier = official.specTier;
    const superseded = official.supersededBy === 'v3';
    const apiGenerations = Array.isArray(official.apiGenerations)
      ? official.apiGenerations.map(String)
      : undefined;
    const moduleName = this.toolToModule.get(name)?.name;
    if (apiGenerations && !apiGenerations.includes(this.generation)) return false;
    if (this.generation === 'v3' && superseded) return false;
    // A v3 definition must never be exposed in legacy mode, even when a v2
    // definition has the same route. Exposing both was the source of duplicate
    // route inventory and allowed the v3 copy to send a named v3 header.
    if (!apiGenerations && this.generation === 'v2' && specTier === 'v3') return false;
    // Top-level Notes was introduced as an unconditional named-v3 surface and
    // has no pre-v3 counterpart in the locked official specifications.
    if (this.generation === 'v2' && moduleName === 'notes') return false;

    if (this.profile === 'curated') return isCurated;
    if (this.profile === 'raw') return !isCurated;
    if (this.profile === 'official') return stability === 'official' || stability === 'live-docs-supplemental';
    if (this.profile === 'stable') return isCurated || stability === 'official' || stability === 'live-docs-supplemental' || stability === 'legacy-compatible';
    return true;
  }

}

// All tool registration is handled via the ToolRegistry class above.

function readToolProfile(): ToolProfile {
  const value = (process.env.GHL_TOOL_PROFILE || 'full').toLowerCase();
  if (value === 'curated' || value === 'raw' || value === 'full' || value === 'official' || value === 'stable') return value;
  process.stderr.write(`[Registry] Unknown GHL_TOOL_PROFILE=${value}; using full.\n`);
  return 'full';
}
