/**
 * MCP Apps Manager — Universal Renderer Architecture
 *
 * All views route through ONE universal renderer HTML file that takes a JSON UITree.
 * Pre-made templates provide deterministic views for the 11 standard tools.
 * The generate_ghl_view tool uses Claude to create novel views on the fly.
 */

import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { GHLApiClient } from '../clients/ghl-api-client.js';
import * as fs from 'fs';
import * as path from 'path';
import Anthropic from '@anthropic-ai/sdk';
import { UITree, validateUITree } from './types.js';
import {
  buildContactGridTree,
  buildPipelineBoardTree,
  buildQuickBookTree,
  buildOpportunityCardTree,
  buildCalendarViewTree,
  buildInvoicePreviewTree,
  buildCampaignStatsTree,
  buildAgentStatsTree,
  buildContactTimelineTree,
  buildWorkflowStatusTree,
  buildDashboardTree,
  buildConversationInboxTree,
  buildPhoneLogTree,
  buildCourseManagerTree,
  buildStoreFrontTree,
  buildPaymentDashboardTree,
  buildSocialMediaHubTree,
  buildReputationMonitorTree,
  buildFunnelBuilderTree,
  buildFormManagerTree,
  buildEmailCenterTree,
  buildBlogManagerTree,
  buildAffiliateDashboardTree,
  buildWorkflowBuilderTree,
  buildReportingHubTree,
  buildSmartListManagerTree,
  buildCustomFieldsManagerTree,
  buildMediaLibraryTree,
  buildLocationSettingsTree,
  buildUserManagerTree,
  buildVoiceAIConsoleTree,
  buildProposalBuilderTree,
  buildSaasAdminTree,
  buildLinkTriggerManagerTree,
} from './templates/index.js';

// ─── Catalog System Prompt (source of truth for components) ──

const CATALOG_SYSTEM_PROMPT = `You are a UI generator for GoHighLevel (GHL) CRM applications.
You generate JSON UI trees using the component catalog below. Your output MUST be valid JSON matching the UITree schema.

## RULES
1. Only use components defined in the catalog
2. Every element must have a unique "key", a "type" (matching a catalog component), and "props"
3. Parent elements list children by key in their "children" array
4. **USE THE PROVIDED GHL DATA** — if real data is included below, you MUST use it. Do NOT invent fake data when real data is available.
5. Keep layouts information-dense and professional
6. Respond with ONLY the JSON object. No markdown fences, no explanation.

## LAYOUT RULES (CRITICAL)
- Design for a **single viewport** — the view should fit on one screen without scrolling
- Maximum **15 elements** total in the tree. Fewer is better.
- Use **SplitLayout** for side-by-side content, not stacked cards that go off-screen
- Use **StatsGrid** with 3-4 MetricCards max for KPIs — don't list every metric
- For tables, limit to **10 rows max**. Show most relevant data, not everything.
- For KanbanBoard, limit to **5 columns** and **4 cards per column** max
- Prefer compact components: MetricCard, StatusBadge, KeyValueList over verbose layouts
- ONE PageHeader max. Don't nest sections inside sections.
- Think **dashboard widget**, not **full report page**

## UI TREE FORMAT
{
  "root": "<key of root element>",
  "elements": {
    "<key>": {
      "key": "<same key>",
      "type": "<ComponentName>",
      "props": { ... },
      "children": ["<child-key-1>", "<child-key-2>"]
    }
  }
}

## COMPONENT CATALOG

### PageHeader
Top-level page header with title, subtitle, status badge, and summary stats.
Props: title (string, required), subtitle (string?), status (string?), statusVariant ("active"|"complete"|"paused"|"draft"|"error"|"sent"|"paid"|"pending"?), gradient (boolean?), stats (array of {label, value}?)
Can contain children.

### Card
Container card with optional header and padding.
Props: title (string?), subtitle (string?), padding ("none"|"sm"|"md"|"lg"?), noBorder (boolean?)
Can contain children.

### StatsGrid
Grid of metric cards showing key numbers.
Props: columns (number?)
Can contain children (typically MetricCard elements).

### SplitLayout
Two-column layout for side-by-side content.
Props: ratio ("50/50"|"33/67"|"67/33"?), gap ("sm"|"md"|"lg"?)
Can contain children (exactly 2 children for left/right).

### Section
Titled content section.
Props: title (string?), description (string?)
Can contain children.

### DataTable
Sortable data table with column definitions and row actions.
Props: columns (array of {key, label, sortable?, align?, format?, width?}), rows (array of objects), selectable (boolean?), rowAction (string?), emptyMessage (string?), pageSize (number?)
Format options: "text"|"email"|"phone"|"date"|"currency"|"tags"|"avatar"|"status"

### KanbanBoard
Kanban-style board with columns and cards. Used for pipeline views.
Props: columns (array of {id, title, count?, totalValue?, color?, cards: [{id, title, subtitle?, value?, status?, statusVariant?, date?, avatarInitials?}]})

### MetricCard
Single metric display with big number, label, and optional trend.
Props: label (string), value (string), format ("number"|"currency"|"percent"?), trend ("up"|"down"|"flat"?), trendValue (string?), color ("default"|"green"|"blue"|"purple"|"yellow"|"red"?)

### StatusBadge
Colored badge showing entity status.
Props: label (string), variant ("active"|"complete"|"paused"|"draft"|"error"|"sent"|"paid"|"pending"|"open"|"won"|"lost")

### Timeline
Chronological event list for activity feeds.
Props: events (array of {id, title, description?, timestamp, icon?, variant?})
Icon options: "email"|"phone"|"note"|"meeting"|"task"|"system"

### ProgressBar
Percentage bar with label and value.
Props: label (string), value (number), max (number?), color ("green"|"blue"|"purple"|"yellow"|"red"?), showPercent (boolean?), benchmark (number?), benchmarkLabel (string?)

### DetailHeader
Header for detail/preview pages with entity name, ID, status.
Props: title (string), subtitle (string?), entityId (string?), status (string?), statusVariant?
Can contain children.

### KeyValueList
List of label-value pairs for totals, metadata.
Props: items (array of {label, value, bold?, variant?, isTotalRow?}), compact (boolean?)
Variant options: "default"|"highlight"|"muted"|"success"|"danger"

### LineItemsTable
Invoice-style table with quantities and prices.
Props: items (array of {name, description?, quantity, unitPrice, total}), currency (string?)

### InfoBlock
Labeled block of information (e.g. From/To on invoices).
Props: label (string), name (string), lines (string[])

### SearchBar
Search input with placeholder.
Props: placeholder (string?), valuePath (string?)

### FilterChips
Toggleable filter tags.
Props: chips (array of {label, value, active?}), dataPath (string?)

### TabGroup
Tab navigation for switching views.
Props: tabs (array of {label, value, count?}), activeTab (string?), dataPath (string?)

### ActionButton
Clickable button with variants.
Props: label (string), variant ("primary"|"secondary"|"danger"|"ghost"?), size ("sm"|"md"|"lg"?), icon (string?), disabled (boolean?)

### ActionBar
Row of action buttons.
Props: align ("left"|"center"|"right"?)
Can contain children (ActionButton elements).

### CurrencyDisplay
Formatted monetary value with currency symbol and locale-aware formatting.
Props: amount (number, required), currency (string? default "USD"), locale (string? default "en-US"), size ("sm"|"md"|"lg"?), positive (boolean?), negative (boolean?)

### TagList
Visual tag/chip display for arrays of tags rendered as inline colored pills.
Props: tags (array of {label, color?, variant?} or strings, required), maxVisible (number?), size ("sm"|"md"?)

### CardGrid
Grid of visual cards with image, title, description for browsable catalogs and listings.
Props: cards (array of {title, description?, imageUrl?, subtitle?, status?, statusVariant?, action?}, required), columns (number? default 3)

### AvatarGroup
Stacked circular avatars for displaying users, followers, or team members.
Props: avatars (array of {name, imageUrl?, initials?}, required), max (number? default 5), size ("sm"|"md"|"lg"?)

### StarRating
Visual star rating display (1-5).
Props: rating (number, required), count (number?), maxStars (number? default 5), distribution (array of {stars, count}?), showDistribution (boolean?)

### StockIndicator
Visual stock level indicator showing green/yellow/red status with quantity.
Props: quantity (number, required), lowThreshold (number?), criticalThreshold (number?), label (string?)

### ChatThread
Conversation message thread with chat bubbles.
Props: messages (array of {id, content, direction: "inbound"|"outbound", type?, timestamp, senderName?, avatar?}), title (string?)

### EmailPreview
Rendered HTML email with header info in a bordered container.
Props: from (string), to (string), subject (string), date (string), body (string), cc (string?), attachments (array of {name, size}?)

### ContentPreview
Rich text/HTML content preview (sanitized).
Props: content (string), format ("html"|"markdown"|"text"?), maxHeight (number?), title (string?)

### TranscriptView
Time-stamped conversation transcript with speaker labels.
Props: entries (array of {timestamp, speaker, text, speakerRole?}), title (string?), duration (string?)

### AudioPlayer
Visual audio player UI with play button and waveform visualization.
Props: src (string?), title (string?), duration (string?), type ("recording"|"voicemail"?)

### ChecklistView
Task/checklist with checkboxes, due dates, assignees, and priority indicators.
Props: items (array of {id, title, completed?, dueDate?, assignee?, priority?}), title (string?), showProgress (boolean?)

### CalendarView
Monthly calendar grid with color-coded event blocks.
Props: year (number?), month (number?), events (array of {date, title, time?, color?, type?}), highlightToday (boolean?), title (string?)

### FlowDiagram
Linear node→arrow→node flow for triggers, IVR menus, funnel pages.
Props: nodes (array of {id, label, type?, description?}), edges (array of {from, to, label?}), direction ("horizontal"|"vertical"?), title (string?)

### TreeView
Hierarchical expandable tree.
Props: nodes (array of {id, label, icon?, children?, expanded?, badge?}), title (string?), expandAll (boolean?)

### MediaGallery
Thumbnail grid for images/files.
Props: items (array of {url, thumbnailUrl?, title?, fileType?, fileSize?, date?}), columns (number?), title (string?)

### DuplicateCompare
Side-by-side record comparison with field-level diff highlighting.
Props: records (array of {label, fields: Record<string, string>} — exactly 2), highlightDiffs (boolean?), title (string?)

### BarChart
Vertical or horizontal bar chart.
Props: bars (array of {label, value, color?}), orientation ("vertical"|"horizontal"?), maxValue (number?), showValues (boolean?), title (string?)

### LineChart
Time-series line chart with optional area fill.
Props: points (array of {label, value}), color (string?), showPoints (boolean?), showArea (boolean?), title (string?), yAxisLabel (string?)

### PieChart
Pie or donut chart for proportional breakdowns.
Props: segments (array of {label, value, color?}), donut (boolean?), title (string?), showLegend (boolean?)

### FunnelChart
Horizontal funnel showing stage drop-off.
Props: stages (array of {label, value, color?}), showDropoff (boolean?), title (string?)

### SparklineChart
Tiny inline chart.
Props: values (number[]), color (string?), height (number?), width (number?)

### ContactPicker
Searchable contact dropdown.
Props: searchTool (string, required), placeholder (string?), value (any?)

### InvoiceBuilder
Multi-section invoice form.
Props: createTool (string?), contactSearchTool (string?), initialContact (any?), initialItems (array?)

### OpportunityEditor
Inline editor for deal/opportunity fields.
Props: saveTool (string, required), opportunity (object, required), stages (array of {id, name}?)

### AppointmentBooker
Calendar-based appointment booking form.
Props: calendarTool (string?), bookTool (string?), contactSearchTool (string?), calendarId (string?)

### EditableField
Click-to-edit wrapper for any text value.
Props: value (string, required), fieldName (string, required), saveTool (string?), saveArgs (object?)

### SelectDropdown
Dropdown select.
Props: loadTool (string?), loadArgs (object?), options (array of {label, value}?), value (string?), placeholder (string?)

### FormGroup
Group of form fields with labels and validation.
Props: fields (array of {key, label, type?, value?, required?, options?}, required), submitLabel (string?), submitTool (string?)

### AmountInput
Currency-formatted number input.
Props: value (number, required), currency (string?)

## DATA RULES (CRITICAL — READ CAREFULLY)
- If real GHL data is provided in the user message, use ONLY that data. Do NOT add, invent, or embellish any records.
- Pipeline stages MUST come from the provided data. Never invent stage names unless they literally exist in the data.
- Show exactly the records provided. If there are 2 opportunities, show 2. Don't add fake ones.
- If no data is provided, THEN you may use sample data, but keep it minimal (3-5 records max).
- When generating interactive views, use correct tool names for GHL:
  - SearchBar: searchTool="search_contacts" (for contact views) or omit for display-only
  - ContactPicker: searchTool="search_contacts"
  - InvoiceBuilder: createTool="create_invoice", contactSearchTool="search_contacts"
  - OpportunityEditor: saveTool="update_opportunity"
  - KanbanBoard: moveTool="update_opportunity"
  - FormGroup: submitTool="create_appointment" (for booking), "create_contact" (for contacts), etc.
  - ActionButton: toolName="update_opportunity", toolArgs={opportunityId: "...", status: "won"}
  - EditableField: saveTool="update_contact" (for contacts), "update_opportunity" (for deals)
  - AppointmentBooker: bookTool="create_appointment", contactSearchTool="search_contacts"
  - FilterChips: filterTool is optional — omit for client-side-only filtering`;

// ─── Types ──────────────────────────────────────────────────

export interface AppToolResult {
  content: Array<{ type: 'text'; text: string }>;
  structuredContent?: Record<string, unknown>;
  [key: string]: unknown;
}

export interface AppResourceHandler {
  uri: string;
  mimeType: string;
  getContent: () => string;
}

// ─── UI Build Path Resolver ─────────────────────────────────

function getUIBuildPath(): string {
  const fromDist = path.resolve(__dirname, '..', 'app-ui');
  if (fs.existsSync(fromDist)) return fromDist;
  const appUiPath = path.join(process.cwd(), 'dist', 'app-ui');
  if (fs.existsSync(appUiPath)) return appUiPath;
  return fromDist;
}

// ─── MCP Apps Manager ──────────────────────────────────────

export class MCPAppsManager {
  private ghlClient: GHLApiClient;
  private resourceHandlers: Map<string, AppResourceHandler> = new Map();
  private uiBuildPath: string;
  private pendingDynamicData: any = null;
  /** Cached universal renderer HTML */
  private rendererHTML: string | null = null;

  constructor(ghlClient: GHLApiClient) {
    this.ghlClient = ghlClient;
    this.uiBuildPath = getUIBuildPath();
    process.stderr.write(`[MCP Apps] UI build path: ${this.uiBuildPath}\n`);
    this.registerResourceHandlers();
  }

  // ─── Resource Registration ──────────────────────────────

  private registerResourceHandlers(): void {
    // Universal renderer is the ONLY real resource
    // All view_* tools inject their UITree into this same renderer
    const universalResource = {
      uri: 'ui://ghl/app',
      mimeType: 'text/html;profile=mcp-app',
      getContent: () => {
        const html = this.getRendererHTML();
        if (this.pendingDynamicData) {
          const data = this.pendingDynamicData;
          this.pendingDynamicData = null;
          process.stderr.write(`[MCP Apps] Injecting UITree into universal renderer\n`);
          return this.injectDataIntoHTML(html, data);
        }
        return html;
      },
    };

    this.resourceHandlers.set('ui://ghl/app', universalResource);

    // Keep dynamic-view as an alias for backward compatibility
    this.resourceHandlers.set('ui://ghl/dynamic-view', {
      ...universalResource,
      uri: 'ui://ghl/dynamic-view',
    });

    // Legacy resource URIs — all point to the universal renderer
    const legacyURIs = [
      'ui://ghl/mcp-app',
      'ui://ghl/pipeline-board',
      'ui://ghl/quick-book',
      'ui://ghl/opportunity-card',
      'ui://ghl/contact-grid',
      'ui://ghl/calendar-view',
      'ui://ghl/invoice-preview',
      'ui://ghl/campaign-stats',
      'ui://ghl/agent-stats',
      'ui://ghl/contact-timeline',
      'ui://ghl/workflow-status',
    ];

    for (const uri of legacyURIs) {
      this.resourceHandlers.set(uri, {
        uri,
        mimeType: 'text/html;profile=mcp-app',
        getContent: universalResource.getContent,
      });
    }
  }

  /**
   * Load and cache the universal renderer HTML
   */
  private getRendererHTML(): string {
    if (this.rendererHTML) return this.rendererHTML;

    // Try universal-renderer first, fall back to dynamic-view
    for (const filename of ['universal-renderer.html', 'dynamic-view.html']) {
      const filePath = path.join(this.uiBuildPath, filename);
      try {
        this.rendererHTML = fs.readFileSync(filePath, 'utf-8');
        process.stderr.write(`[MCP Apps] Loaded universal renderer from ${filename}\n`);
        return this.rendererHTML;
      } catch {
        // Try next
      }
    }

    process.stderr.write(`[MCP Apps] WARNING: Universal renderer HTML not found, using fallback\n`);
    this.rendererHTML = this.getFallbackHTML();
    return this.rendererHTML;
  }

  private getFallbackHTML(): string {
    return `<!DOCTYPE html>
<html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>GHL View</title>
<style>body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;padding:20px}
.fallback{text-align:center;color:#666}</style></head>
<body><div class="fallback"><p>UI renderer is loading...</p><p>Run <code>npm run build:dynamic-ui</code> to build.</p></div>
<script>
window.addEventListener('message',(e)=>{if(e.data?.type==='mcp-app-init'){console.log('MCP App data:',e.data.data)}});
const d=window.__MCP_APP_DATA__;if(d){document.querySelector('.fallback').innerHTML='<pre>'+JSON.stringify(d,null,2)+'</pre>'}
</script></body></html>`;
  }

  // ─── Tool Definitions ───────────────────────────────────

  getToolDefinitions(): Tool[] {
    // All tools point to the universal renderer resource
    const appUri = 'ui://ghl/app';

    return [
      {
        name: 'view_contact_grid',
        description: 'Display contact search results in a data grid. Accepts query (search string) or no args (shows recent contacts). Returns a visual UI component.',
        inputSchema: {
          type: 'object',
          properties: {
            query: { type: 'string', description: 'Search query string' },
            limit: { type: 'number', description: 'Maximum results (default: 25)' },
          },
        },
        _meta: { ui: { resourceUri: appUri } },
      },
      {
        name: 'view_pipeline_board',
        description: 'Display a pipeline as an interactive Kanban board. Accepts pipelineId (direct), pipelineName (fuzzy match), or nothing (shows first pipeline). Returns a visual UI component.',
        inputSchema: {
          type: 'object',
          properties: {
            pipelineId: { type: 'string', description: 'Pipeline ID to display' },
            pipelineName: { type: 'string', description: 'Pipeline name (fuzzy match)' },
          },
        },
        _meta: { ui: { resourceUri: appUri } },
      },
      {
        name: 'view_quick_book',
        description: 'Display a quick booking interface for scheduling appointments. Accepts calendarId (direct), calendarName (fuzzy match), or nothing (shows first calendar). Returns a visual UI component.',
        inputSchema: {
          type: 'object',
          properties: {
            calendarId: { type: 'string', description: 'Calendar ID for booking' },
            calendarName: { type: 'string', description: 'Calendar name (fuzzy match)' },
            contactId: { type: 'string', description: 'Optional contact ID to pre-fill' },
          },
        },
        _meta: { ui: { resourceUri: appUri } },
      },
      {
        name: 'view_opportunity_card',
        description: 'Display a single opportunity with details, value, and stage info. Accepts opportunityId (direct), opportunityName (fuzzy search), contactName (search by contact), or nothing (shows first opportunity). Returns a visual UI component.',
        inputSchema: {
          type: 'object',
          properties: {
            opportunityId: { type: 'string', description: 'Opportunity ID to display' },
            opportunityName: { type: 'string', description: 'Opportunity name (fuzzy search)' },
            contactName: { type: 'string', description: 'Contact name to find opportunities for' },
          },
        },
        _meta: { ui: { resourceUri: appUri } },
      },
      {
        name: 'view_calendar',
        description: 'Display a calendar with events and appointments. Accepts calendarId (direct), calendarName (fuzzy match), or nothing (shows first/default calendar). Returns a visual UI component.',
        inputSchema: {
          type: 'object',
          properties: {
            calendarId: { type: 'string', description: 'Calendar ID to display' },
            calendarName: { type: 'string', description: 'Calendar name (fuzzy match)' },
            startDate: { type: 'string', description: 'Start date (ISO format)' },
            endDate: { type: 'string', description: 'End date (ISO format)' },
          },
        },
        _meta: { ui: { resourceUri: appUri } },
      },
      {
        name: 'view_invoice',
        description: 'Display an invoice preview with line items and payment status. Accepts invoiceId (direct), invoiceNumber (search by number), or nothing (shows most recent invoice). Returns a visual UI component.',
        inputSchema: {
          type: 'object',
          properties: {
            invoiceId: { type: 'string', description: 'Invoice ID to display' },
            invoiceNumber: { type: 'string', description: 'Invoice number to search for' },
          },
        },
        _meta: { ui: { resourceUri: appUri } },
      },
      {
        name: 'view_campaign_stats',
        description: 'Display campaign statistics and performance metrics. Accepts campaignId (direct), campaignName (fuzzy match), or nothing (shows overview of all campaigns). Returns a visual UI component.',
        inputSchema: {
          type: 'object',
          properties: {
            campaignId: { type: 'string', description: 'Campaign ID to display stats for' },
            campaignName: { type: 'string', description: 'Campaign name (fuzzy match)' },
          },
        },
        _meta: { ui: { resourceUri: appUri } },
      },
      {
        name: 'view_agent_stats',
        description: 'Display agent/user performance statistics and metrics. Returns a visual UI component.',
        inputSchema: {
          type: 'object',
          properties: {
            userId: { type: 'string', description: 'User/Agent ID to display stats for' },
            dateRange: { type: 'string', description: 'Date range (e.g., "last7days", "last30days")' },
          },
        },
        _meta: { ui: { resourceUri: appUri } },
      },
      {
        name: 'view_contact_timeline',
        description: "Display a contact's activity timeline with all interactions. Accepts contactId (direct), contactName (fuzzy search), or nothing (shows first recent contact). Returns a visual UI component.",
        inputSchema: {
          type: 'object',
          properties: {
            contactId: { type: 'string', description: 'Contact ID to display timeline for' },
            contactName: { type: 'string', description: 'Contact name (fuzzy search)' },
          },
        },
        _meta: { ui: { resourceUri: appUri } },
      },
      {
        name: 'view_workflow_status',
        description: 'Display workflow execution status and history. Accepts workflowId (direct), workflowName (fuzzy match), or nothing (shows overview of all workflows). Returns a visual UI component.',
        inputSchema: {
          type: 'object',
          properties: {
            workflowId: { type: 'string', description: 'Workflow ID to display status for' },
            workflowName: { type: 'string', description: 'Workflow name (fuzzy match)' },
          },
        },
        _meta: { ui: { resourceUri: appUri } },
      },
      {
        name: 'view_dashboard',
        description: 'Display the main GHL dashboard overview. Returns a visual UI component.',
        inputSchema: {
          type: 'object',
          properties: {},
        },
        _meta: { ui: { resourceUri: appUri } },
      },
      {
        name: 'view_conversation_inbox',
        description: 'Display the conversation inbox with threaded messages and channel filters. Returns a visual UI component.',
        inputSchema: { type: 'object', properties: {} },
        _meta: { ui: { resourceUri: appUri } },
      },
      {
        name: 'view_phone_log',
        description: 'Display phone call history with recordings, duration, and direction stats. Returns a visual UI component.',
        inputSchema: { type: 'object', properties: {} },
        _meta: { ui: { resourceUri: appUri } },
      },
      {
        name: 'view_course_manager',
        description: 'Display courses with enrollment stats, lesson counts, and publish status. Returns a visual UI component.',
        inputSchema: { type: 'object', properties: {} },
        _meta: { ui: { resourceUri: appUri } },
      },
      {
        name: 'view_store_front',
        description: 'Display the store with product catalog, inventory, and recent orders. Returns a visual UI component.',
        inputSchema: { type: 'object', properties: {} },
        _meta: { ui: { resourceUri: appUri } },
      },
      {
        name: 'view_payment_dashboard',
        description: 'Display payment transactions, subscriptions, and revenue metrics. Returns a visual UI component.',
        inputSchema: { type: 'object', properties: {} },
        _meta: { ui: { resourceUri: appUri } },
      },
      {
        name: 'view_social_media_hub',
        description: 'Display social media posts, scheduling, and engagement analytics. Returns a visual UI component.',
        inputSchema: { type: 'object', properties: {} },
        _meta: { ui: { resourceUri: appUri } },
      },
      {
        name: 'view_reputation_monitor',
        description: 'Display reputation reviews, ratings, and response tracking. Returns a visual UI component.',
        inputSchema: { type: 'object', properties: {} },
        _meta: { ui: { resourceUri: appUri } },
      },
      {
        name: 'view_funnel_builder',
        description: 'Display funnels with page counts, conversion rates, and funnel flow. Returns a visual UI component.',
        inputSchema: { type: 'object', properties: {} },
        _meta: { ui: { resourceUri: appUri } },
      },
      {
        name: 'view_form_manager',
        description: 'Display forms and surveys with submission counts and field details. Returns a visual UI component.',
        inputSchema: { type: 'object', properties: {} },
        _meta: { ui: { resourceUri: appUri } },
      },
      {
        name: 'view_email_center',
        description: 'Display email history, templates, and delivery statistics. Returns a visual UI component.',
        inputSchema: { type: 'object', properties: {} },
        _meta: { ui: { resourceUri: appUri } },
      },
      {
        name: 'view_blog_manager',
        description: 'Display blog posts with categories, authors, and publish status. Returns a visual UI component.',
        inputSchema: { type: 'object', properties: {} },
        _meta: { ui: { resourceUri: appUri } },
      },
      {
        name: 'view_affiliate_dashboard',
        description: 'Display affiliates, referral stats, commissions, and campaigns. Returns a visual UI component.',
        inputSchema: { type: 'object', properties: {} },
        _meta: { ui: { resourceUri: appUri } },
      },
      {
        name: 'view_workflow_builder',
        description: 'Display workflows with trigger/action flow diagrams and execution stats. Returns a visual UI component.',
        inputSchema: { type: 'object', properties: {} },
        _meta: { ui: { resourceUri: appUri } },
      },
      {
        name: 'view_reporting_hub',
        description: 'Display reports, widgets, and analytics charts. Returns a visual UI component.',
        inputSchema: { type: 'object', properties: {} },
        _meta: { ui: { resourceUri: appUri } },
      },
      {
        name: 'view_smart_list_manager',
        description: 'Display smart lists with contact counts and filter conditions. Returns a visual UI component.',
        inputSchema: { type: 'object', properties: {} },
        _meta: { ui: { resourceUri: appUri } },
      },
      {
        name: 'view_custom_fields_manager',
        description: 'Display custom fields with types, keys, and field hierarchy. Returns a visual UI component.',
        inputSchema: { type: 'object', properties: {} },
        _meta: { ui: { resourceUri: appUri } },
      },
      {
        name: 'view_media_library',
        description: 'Display media files and folders with gallery view and file browser. Returns a visual UI component.',
        inputSchema: { type: 'object', properties: {} },
        _meta: { ui: { resourceUri: appUri } },
      },
      {
        name: 'view_location_settings',
        description: 'Display location details, business hours, tags, and custom values. Returns a visual UI component.',
        inputSchema: { type: 'object', properties: {} },
        _meta: { ui: { resourceUri: appUri } },
      },
      {
        name: 'view_user_manager',
        description: 'Display users with roles, permissions, and team overview. Returns a visual UI component.',
        inputSchema: { type: 'object', properties: {} },
        _meta: { ui: { resourceUri: appUri } },
      },
      {
        name: 'view_voice_ai_console',
        description: 'Display Voice AI agents, call transcripts, and performance stats. Returns a visual UI component.',
        inputSchema: { type: 'object', properties: {} },
        _meta: { ui: { resourceUri: appUri } },
      },
      {
        name: 'view_proposal_builder',
        description: 'Display proposals with status tracking, values, and conversion pipeline. Returns a visual UI component.',
        inputSchema: { type: 'object', properties: {} },
        _meta: { ui: { resourceUri: appUri } },
      },
      {
        name: 'view_saas_admin',
        description: 'Display SaaS admin with sub-accounts, plans, snapshots, and MRR. Returns a visual UI component.',
        inputSchema: { type: 'object', properties: {} },
        _meta: { ui: { resourceUri: appUri } },
      },
      {
        name: 'view_link_trigger_manager',
        description: 'Display trigger links, click stats, and trigger configurations. Returns a visual UI component.',
        inputSchema: { type: 'object', properties: {} },
        _meta: { ui: { resourceUri: appUri } },
      },
      {
        name: 'generate_ghl_view',
        description: 'Generate a rich, AI-powered UI view on the fly from a natural language prompt. Optionally fetches real GHL data to populate the view. Requires ANTHROPIC_API_KEY. Returns a visual UI component rendered in the MCP App.',
        inputSchema: {
          type: 'object',
          properties: {
            prompt: {
              type: 'string',
              description: 'Natural language description of the UI view to generate.',
            },
            dataSource: {
              type: 'string',
              enum: ['contacts', 'opportunities', 'pipelines', 'calendars', 'invoices'],
              description: 'Optional: fetch real GHL data to include in the generated view.',
            },
          },
          required: ['prompt'],
        },
        _meta: { ui: { resourceUri: appUri } },
      },
      {
        name: 'update_opportunity',
        description: 'Update an opportunity (move to stage, change value, status, etc.)',
        inputSchema: {
          type: 'object',
          properties: {
            opportunityId: { type: 'string', description: 'Opportunity ID to update' },
            pipelineStageId: { type: 'string', description: 'New stage ID (for moving)' },
            name: { type: 'string', description: 'Opportunity name' },
            monetaryValue: { type: 'number', description: 'Monetary value' },
            status: { type: 'string', enum: ['open', 'won', 'lost', 'abandoned'], description: 'Opportunity status' },
          },
          required: ['opportunityId'],
        },
      },
    ];
  }

  // ─── Tool Routing ───────────────────────────────────────

  getAppToolNames(): string[] {
    return [
      'view_contact_grid', 'view_pipeline_board', 'view_quick_book',
      'view_opportunity_card', 'view_calendar', 'view_invoice',
      'view_campaign_stats', 'view_agent_stats', 'view_contact_timeline',
      'view_workflow_status', 'view_dashboard',
      'view_conversation_inbox', 'view_phone_log', 'view_course_manager',
      'view_store_front', 'view_payment_dashboard', 'view_social_media_hub',
      'view_reputation_monitor', 'view_funnel_builder', 'view_form_manager',
      'view_email_center', 'view_blog_manager', 'view_affiliate_dashboard',
      'view_workflow_builder', 'view_reporting_hub', 'view_smart_list_manager',
      'view_custom_fields_manager', 'view_media_library', 'view_location_settings',
      'view_user_manager', 'view_voice_ai_console', 'view_proposal_builder',
      'view_saas_admin', 'view_link_trigger_manager',
      'generate_ghl_view', 'update_opportunity',
    ];
  }

  isAppTool(toolName: string): boolean {
    return this.getAppToolNames().includes(toolName);
  }

  async executeTool(toolName: string, args: Record<string, any>): Promise<AppToolResult> {
    process.stderr.write(`[MCP Apps] Executing: ${toolName}\n`);

    switch (toolName) {
      case 'view_contact_grid':
        return this.viewContactGrid(args);
      case 'view_pipeline_board':
        return this.viewPipelineBoard(args);
      case 'view_quick_book':
        return this.viewQuickBook(args);
      case 'view_opportunity_card':
        return this.viewOpportunityCard(args);
      case 'view_calendar':
        return this.viewCalendar(args);
      case 'view_invoice':
        return this.viewInvoice(args);
      case 'view_campaign_stats':
        return this.viewCampaignStats(args);
      case 'view_agent_stats':
        return this.viewAgentStats(args);
      case 'view_contact_timeline':
        return this.viewContactTimeline(args);
      case 'view_workflow_status':
        return this.viewWorkflowStatus(args);
      case 'view_dashboard':
        return this.viewDashboard();
      case 'view_conversation_inbox':
        return this.viewConversationInbox();
      case 'view_phone_log':
        return this.viewPhoneLog();
      case 'view_course_manager':
        return this.viewCourseManager();
      case 'view_store_front':
        return this.viewStoreFront();
      case 'view_payment_dashboard':
        return this.viewPaymentDashboard();
      case 'view_social_media_hub':
        return this.viewSocialMediaHub();
      case 'view_reputation_monitor':
        return this.viewReputationMonitor();
      case 'view_funnel_builder':
        return this.viewFunnelBuilder();
      case 'view_form_manager':
        return this.viewFormManager();
      case 'view_email_center':
        return this.viewEmailCenter();
      case 'view_blog_manager':
        return this.viewBlogManager();
      case 'view_affiliate_dashboard':
        return this.viewAffiliateDashboard();
      case 'view_workflow_builder':
        return this.viewWorkflowBuilder();
      case 'view_reporting_hub':
        return this.viewReportingHub();
      case 'view_smart_list_manager':
        return this.viewSmartListManager();
      case 'view_custom_fields_manager':
        return this.viewCustomFieldsManager();
      case 'view_media_library':
        return this.viewMediaLibrary();
      case 'view_location_settings':
        return this.viewLocationSettings();
      case 'view_user_manager':
        return this.viewUserManager();
      case 'view_voice_ai_console':
        return this.viewVoiceAIConsole();
      case 'view_proposal_builder':
        return this.viewProposalBuilder();
      case 'view_saas_admin':
        return this.viewSaasAdmin();
      case 'view_link_trigger_manager':
        return this.viewLinkTriggerManager();
      case 'generate_ghl_view':
        return this.generateDynamicView(args.prompt, args.dataSource);
      case 'update_opportunity':
        return this.updateOpportunity(args as {
          opportunityId: string;
          pipelineStageId?: string;
          name?: string;
          monetaryValue?: number;
          status?: 'open' | 'won' | 'lost' | 'abandoned';
        });
      default:
        throw new Error(`Unknown app tool: ${toolName}`);
    }
  }

  // ─── Helper: graceful error result ──────────────────────

  private errorResult(message: string, extra?: Record<string, unknown>): AppToolResult {
    return {
      content: [{ type: 'text', text: message }],
      structuredContent: { error: true, message, ...extra },
    };
  }

  // ─── Helper: resolve calendar ID from args ────────────

  private async resolveCalendarId(args: Record<string, any>): Promise<{ calendarId?: string; calendars?: any[] }> {
    let calendarId = args.calendarId;
    let calendars: any[] | undefined;

    if (!calendarId) {
      const calendarsResponse = await this.ghlClient.getCalendars();
      calendars = calendarsResponse.data?.calendars || [];
      if (args.calendarName && calendars.length > 0) {
        const match = calendars.find((c: any) =>
          c.name?.toLowerCase().includes(args.calendarName.toLowerCase())
        );
        calendarId = match?.id ?? calendars[0]?.id;
      } else if (calendars.length > 0) {
        calendarId = calendars[0]?.id;
      }
    }

    return { calendarId, calendars };
  }

  // ─── View Handlers (fetch data → template → universal renderer) ──

  private async viewContactGrid(args: Record<string, any>): Promise<AppToolResult> {
    try {
      const response = await this.ghlClient.searchContacts({
        locationId: this.ghlClient.getConfig().locationId,
        query: args.query, limit: args.limit || 25,
      });
      if (!response.success) throw new Error(response.error?.message || 'Failed to search contacts');

      const contacts = response.data?.contacts || [];
      if (contacts.length === 0) {
        return this.errorResult(
          args.query ? `No contacts found matching "${args.query}".` : 'No contacts found in this location.',
          { query: args.query, contacts: [] }
        );
      }

      const uiTree = buildContactGridTree({
        contacts,
        query: args.query,
      });

      return this.renderUITree(uiTree, `Found ${contacts.length} contacts`);
    } catch (error: any) {
      return this.errorResult(`Failed to load contact grid: ${error.message}`);
    }
  }

  private async viewPipelineBoard(args: Record<string, any>): Promise<AppToolResult> {
    try {
      let pipelineId = args.pipelineId;

      // Self-resolve: get pipelines list for fuzzy match or default
      const pipelinesResponse = await this.ghlClient.getPipelines();
      if (!pipelinesResponse.success) throw new Error(pipelinesResponse.error?.message || 'Failed to get pipelines');

      const pipelines = pipelinesResponse.data?.pipelines || [];

      if (!pipelineId && pipelines.length > 0) {
        if (args.pipelineName) {
          const match = pipelines.find((p: any) =>
            p.name?.toLowerCase().includes(args.pipelineName.toLowerCase())
          );
          pipelineId = match?.id ?? pipelines[0]?.id;
        } else {
          pipelineId = pipelines[0]?.id;
        }
      }

      if (!pipelineId) {
        return this.errorResult('No pipelines found in this location.', { pipelines: [] });
      }

      const opportunitiesResponse = await this.ghlClient.searchOpportunities({
        location_id: this.ghlClient.getConfig().locationId,
        pipeline_id: pipelineId,
      });

      const pipeline = pipelines.find((p: any) => p.id === pipelineId);
      const opportunities = (opportunitiesResponse.data?.opportunities || []).map((opp: any) => ({
        id: opp.id, name: opp.name || 'Untitled',
        pipelineStageId: opp.pipelineStageId, status: opp.status || 'open',
        monetaryValue: opp.monetaryValue || 0,
        contact: opp.contact ? { name: opp.contact.name || 'Unknown', email: opp.contact.email, phone: opp.contact.phone } : { name: 'Unknown' },
        updatedAt: opp.updatedAt || opp.createdAt, createdAt: opp.createdAt, source: opp.source,
      }));

      const uiTree = buildPipelineBoardTree({
        pipeline, opportunities, stages: pipeline?.stages || [],
      });

      return this.renderUITree(uiTree, `Pipeline: ${pipeline?.name || 'Unknown'} (${opportunities.length} opportunities)`);
    } catch (error: any) {
      return this.errorResult(`Failed to load pipeline board: ${error.message}`);
    }
  }

  private async viewQuickBook(args: Record<string, any>): Promise<AppToolResult> {
    try {
      const { calendarId, calendars } = await this.resolveCalendarId(args);

      if (!calendarId) {
        return this.errorResult('No calendars found in this location.', { calendars: [] });
      }

      const [calendarResponse, contactResponse] = await Promise.all([
        this.ghlClient.getCalendar(calendarId),
        args.contactId ? this.ghlClient.getContact(args.contactId) : Promise.resolve({ success: true, data: null }),
      ]);
      if (!calendarResponse.success) throw new Error(calendarResponse.error?.message || 'Failed to get calendar');

      const uiTree = buildQuickBookTree({
        calendar: calendarResponse.data,
        contact: contactResponse.data,
        locationId: this.ghlClient.getConfig().locationId,
      });

      return this.renderUITree(uiTree, `Quick booking for calendar: ${(calendarResponse.data as any)?.name || calendarId}`);
    } catch (error: any) {
      return this.errorResult(`Failed to load quick book: ${error.message}`);
    }
  }

  private async viewOpportunityCard(args: Record<string, any>): Promise<AppToolResult> {
    try {
      let opportunityId = args.opportunityId;

      // Self-resolve: search by name, contact, or default to first
      if (!opportunityId) {
        const searchParams: any = {
          location_id: this.ghlClient.getConfig().locationId,
        };
        if (args.opportunityName) {
          searchParams.q = args.opportunityName;
        }

        const searchResponse = await this.ghlClient.searchOpportunities(searchParams);
        const opportunities = searchResponse.data?.opportunities || [];

        if (args.contactName && opportunities.length > 0) {
          // Filter by contact name
          const match = opportunities.find((o: any) =>
            o.contact?.name?.toLowerCase().includes(args.contactName.toLowerCase()) ||
            o.contact?.firstName?.toLowerCase().includes(args.contactName.toLowerCase()) ||
            o.contact?.lastName?.toLowerCase().includes(args.contactName.toLowerCase())
          );
          opportunityId = match?.id ?? opportunities[0]?.id;
        } else if (opportunities.length > 0) {
          opportunityId = opportunities[0]?.id;
        }
      }

      if (!opportunityId) {
        return this.errorResult('No opportunities found.', { opportunities: [] });
      }

      const response = await this.ghlClient.getOpportunity(opportunityId);
      if (!response.success) throw new Error(response.error?.message || 'Failed to get opportunity');

      const uiTree = buildOpportunityCardTree(response.data);
      return this.renderUITree(uiTree, `Opportunity: ${(response.data as any)?.name || opportunityId}`);
    } catch (error: any) {
      return this.errorResult(`Failed to load opportunity card: ${error.message}`);
    }
  }

  private async viewCalendar(args: Record<string, any>): Promise<AppToolResult> {
    try {
      const { calendarId } = await this.resolveCalendarId(args);

      if (!calendarId) {
        return this.errorResult('No calendars found in this location.', { calendars: [] });
      }

      const now = new Date();
      const start = args.startDate || new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      const end = args.endDate || new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString();

      const [calendarResponse, eventsResponse] = await Promise.all([
        this.ghlClient.getCalendar(calendarId),
        this.ghlClient.getCalendarEvents({
          calendarId, startTime: start, endTime: end,
          locationId: this.ghlClient.getConfig().locationId,
        }),
      ]);
      if (!calendarResponse.success) throw new Error(calendarResponse.error?.message || 'Failed to get calendar');

      const calendar = calendarResponse.data as any;
      const events = eventsResponse.data?.events || [];

      const uiTree = buildCalendarViewTree({ calendar, events, startDate: start, endDate: end });
      return this.renderUITree(uiTree, `Calendar: ${calendar?.name || 'Unknown'} (${events.length} events)`);
    } catch (error: any) {
      return this.errorResult(`Failed to load calendar: ${error.message}`);
    }
  }

  private async viewInvoice(args: Record<string, any>): Promise<AppToolResult> {
    try {
      let invoiceId = args.invoiceId;

      // Self-resolve: search by invoice number or default to first
      if (!invoiceId) {
        const listResponse = await this.ghlClient.listInvoices?.({
          altId: this.ghlClient.getConfig().locationId,
          altType: 'location',
          limit: '20',
          offset: '0',
          ...(args.invoiceNumber ? { search: args.invoiceNumber } : {}),
        });
        const invoices = listResponse?.data?.invoices || [];

        if (args.invoiceNumber && invoices.length > 0) {
          // Try exact match on invoice number first, then fallback to first result
          const match = invoices.find((inv: any) =>
            inv.invoiceNumber?.toString() === args.invoiceNumber?.toString() ||
            (inv as any).number?.toString() === args.invoiceNumber?.toString()
          );
          invoiceId = match?._id ?? invoices[0]?._id;
        } else if (invoices.length > 0) {
          invoiceId = invoices[0]?._id;
        }

        if (!invoiceId) {
          return this.errorResult(
            args.invoiceNumber
              ? `No invoice found matching number "${args.invoiceNumber}".`
              : 'No invoices found in this location.',
            { invoices: [] }
          );
        }
      }

      const response = await this.ghlClient.getInvoice(invoiceId, {
        altId: this.ghlClient.getConfig().locationId,
        altType: 'location',
      });
      if (!response.success) throw new Error(response.error?.message || 'Failed to get invoice');

      const invoice = response.data;
      const uiTree = buildInvoicePreviewTree(invoice);
      return this.renderUITree(uiTree, `Invoice #${(invoice as any)?.invoiceNumber || invoiceId} - ${(invoice as any)?.status || 'Unknown status'}`);
    } catch (error: any) {
      return this.errorResult(`Failed to load invoice: ${error.message}`);
    }
  }

  private async viewCampaignStats(args: Record<string, any>): Promise<AppToolResult> {
    try {
      const response = await this.ghlClient.getEmailCampaigns({});
      const campaigns = response.data?.schedules || [];

      let campaignId = args.campaignId;

      // Self-resolve: search by name or default to first
      if (!campaignId && campaigns.length > 0) {
        if (args.campaignName) {
          const match = campaigns.find((c: any) =>
            c.name?.toLowerCase().includes(args.campaignName.toLowerCase())
          );
          campaignId = match?.id ?? campaigns[0]?.id;
        } else {
          // Default: show first campaign (or overview of all)
          campaignId = campaigns[0]?.id;
        }
      }

      if (!campaignId && campaigns.length === 0) {
        return this.errorResult('No campaigns found in this location.', { campaigns: [] });
      }

      const campaign = campaigns.find((c: any) => c.id === campaignId) || { id: campaignId };

      const uiTree = buildCampaignStatsTree({
        campaign, campaigns, campaignId: campaignId || '',
        locationId: this.ghlClient.getConfig().locationId,
      });

      return this.renderUITree(uiTree, `Campaign stats: ${(campaign as any)?.name || campaignId}`);
    } catch (error: any) {
      return this.errorResult(`Failed to load campaign stats: ${error.message}`);
    }
  }

  private async viewAgentStats(args: Record<string, any>): Promise<AppToolResult> {
    try {
      const locationResponse = await this.ghlClient.getLocationById(this.ghlClient.getConfig().locationId);

      const uiTree = buildAgentStatsTree({
        userId: args.userId, dateRange: args.dateRange || 'last30days',
        location: locationResponse.data,
        locationId: this.ghlClient.getConfig().locationId,
      });

      return this.renderUITree(uiTree, args.userId ? `Agent stats: ${args.userId}` : 'Agent overview');
    } catch (error: any) {
      return this.errorResult(`Failed to load agent stats: ${error.message}`);
    }
  }

  private async viewContactTimeline(args: Record<string, any>): Promise<AppToolResult> {
    try {
      let contactId = args.contactId;

      // Self-resolve: search by name or default to first recent contact
      if (!contactId) {
        const searchQuery = args.contactName || '';
        const searchResponse = await this.ghlClient.searchContacts({
          locationId: this.ghlClient.getConfig().locationId,
          query: searchQuery,
          limit: 10,
        });
        const contacts = searchResponse.data?.contacts || [];

        if (args.contactName && contacts.length > 0) {
          // Fuzzy match on name
          const match = contacts.find((c: any) => {
            const fullName = `${c.firstName || ''} ${c.lastName || ''}`.toLowerCase().trim();
            return fullName.includes(args.contactName.toLowerCase()) ||
              (c.firstName || '').toLowerCase().includes(args.contactName.toLowerCase()) ||
              (c.lastName || '').toLowerCase().includes(args.contactName.toLowerCase()) ||
              (c.name || '').toLowerCase().includes(args.contactName.toLowerCase()) ||
              (c.email || '').toLowerCase().includes(args.contactName.toLowerCase());
          });
          contactId = match?.id ?? contacts[0]?.id;
        } else if (contacts.length > 0) {
          contactId = contacts[0]?.id;
        }
      }

      if (!contactId) {
        return this.errorResult(
          args.contactName
            ? `No contact found matching "${args.contactName}".`
            : 'No contacts found in this location.',
          { contacts: [] }
        );
      }

      const [contactResponse, notesResponse, tasksResponse] = await Promise.all([
        this.ghlClient.getContact(contactId),
        this.ghlClient.getContactNotes(contactId),
        this.ghlClient.getContactTasks(contactId),
      ]);
      if (!contactResponse.success) throw new Error(contactResponse.error?.message || 'Failed to get contact');

      const contact = contactResponse.data as any;
      const uiTree = buildContactTimelineTree({
        contact: contactResponse.data,
        notes: notesResponse.data || [],
        tasks: tasksResponse.data || [],
      });

      return this.renderUITree(uiTree, `Timeline for ${contact?.firstName || ''} ${contact?.lastName || ''}`);
    } catch (error: any) {
      return this.errorResult(`Failed to load contact timeline: ${error.message}`);
    }
  }

  private async viewWorkflowStatus(args: Record<string, any>): Promise<AppToolResult> {
    try {
      const response = await this.ghlClient.getWorkflows({
        locationId: this.ghlClient.getConfig().locationId,
      });
      const workflows = response.data?.workflows || [];

      let workflowId = args.workflowId;

      // Self-resolve: search by name or default to first
      if (!workflowId && workflows.length > 0) {
        if (args.workflowName) {
          const match = workflows.find((w: any) =>
            w.name?.toLowerCase().includes(args.workflowName.toLowerCase())
          );
          workflowId = match?.id ?? workflows[0]?.id;
        } else {
          workflowId = workflows[0]?.id;
        }
      }

      if (!workflowId && workflows.length === 0) {
        return this.errorResult('No workflows found in this location.', { workflows: [] });
      }

      const workflow = workflows.find((w: any) => w.id === workflowId) || { id: workflowId };

      const uiTree = buildWorkflowStatusTree({
        workflow, workflows, workflowId: workflowId || '',
        locationId: this.ghlClient.getConfig().locationId,
      });

      return this.renderUITree(uiTree, `Workflow: ${(workflow as any)?.name || workflowId}`);
    } catch (error: any) {
      return this.errorResult(`Failed to load workflow status: ${error.message}`);
    }
  }

  private async viewDashboard(): Promise<AppToolResult> {
    try {
      const [contactsResponse, pipelinesResponse, calendarsResponse] = await Promise.all([
        this.ghlClient.searchContacts({ locationId: this.ghlClient.getConfig().locationId, limit: 10 }),
        this.ghlClient.getPipelines(),
        this.ghlClient.getCalendars(),
      ]);

      const uiTree = buildDashboardTree({
        recentContacts: contactsResponse.data?.contacts || [],
        pipelines: pipelinesResponse.data?.pipelines || [],
        calendars: calendarsResponse.data?.calendars || [],
        locationId: this.ghlClient.getConfig().locationId,
      });

      return this.renderUITree(uiTree, 'GHL Dashboard Overview');
    } catch (error: any) {
      return this.errorResult(`Failed to load dashboard: ${error.message}`);
    }
  }

  // ─── New View Handlers (23 views) ───────────────────────

  private async viewConversationInbox(): Promise<AppToolResult> {
    try {
      const resp = await this.ghlClient.searchConversations({ locationId: this.ghlClient.getConfig().locationId, limit: 20 });
      const conversations = resp.data?.conversations || [];
      let messages: any[] = [];
      if (conversations[0]?.id) {
        const msgResp = await this.ghlClient.getConversationMessages(conversations[0].id, { limit: 15 }).catch(() => ({ data: { messages: [] } }));
        messages = (msgResp as any).data?.messages || [];
      }
      const uiTree = buildConversationInboxTree({ conversations, messages });
      return this.renderUITree(uiTree, `Conversation Inbox (${conversations.length} conversations)`);
    } catch (error: any) {
      const uiTree = buildConversationInboxTree({ conversations: [], messages: [] });
      return this.renderUITree(uiTree, 'Conversation Inbox — Sample data (connect GHL credentials to see live data)');
    }
  }

  private async viewPhoneLog(): Promise<AppToolResult> {
    try {
      const locationId = this.ghlClient.getConfig().locationId;
      const callsResp = await this.ghlClient.makeRequest('GET', `/phone/calls?locationId=${locationId}&limit=50`).catch(() => ({ data: null }));
      const numbersResp = await this.ghlClient.makeRequest('GET', `/phone/numbers?locationId=${locationId}`).catch(() => ({ data: null }));
      const uiTree = buildPhoneLogTree({ calls: callsResp?.data?.calls || [], phoneNumbers: numbersResp?.data?.phoneNumbers || [] });
      return this.renderUITree(uiTree, 'Phone Log');
    } catch (error: any) {
      const uiTree = buildPhoneLogTree({ calls: [], phoneNumbers: [] });
      return this.renderUITree(uiTree, 'Phone Log — Sample data (connect GHL credentials to see live data)');
    }
  }

  private async viewCourseManager(): Promise<AppToolResult> {
    try {
      const resp = await this.ghlClient.makeRequest('GET', `/courses/?locationId=${this.ghlClient.getConfig().locationId}`);
      const uiTree = buildCourseManagerTree({ courses: resp?.data?.courses || [] });
      return this.renderUITree(uiTree, 'Course Manager');
    } catch (error: any) {
      const uiTree = buildCourseManagerTree({ courses: [] });
      return this.renderUITree(uiTree, 'Course Manager — Sample data (connect GHL credentials to see live data)');
    }
  }

  private async viewStoreFront(): Promise<AppToolResult> {
    try {
      const locationId = this.ghlClient.getConfig().locationId;
      const [productsResp, ordersResp] = await Promise.all([
        this.ghlClient.listProducts({ locationId, limit: 20, offset: 0 }).catch(() => ({ data: null })),
        this.ghlClient.listOrders({ altId: locationId, altType: 'location', limit: 20 }).catch(() => ({ data: null })),
      ]);
      const uiTree = buildStoreFrontTree({
        products: (productsResp as any)?.data?.products || [],
        orders: (ordersResp as any)?.data?.orders || (ordersResp as any)?.data?.data || [],
      });
      return this.renderUITree(uiTree, 'Store Front');
    } catch (error: any) {
      const uiTree = buildStoreFrontTree({ products: [], orders: [] });
      return this.renderUITree(uiTree, 'Store Front — Sample data (connect GHL credentials to see live data)');
    }
  }

  private async viewPaymentDashboard(): Promise<AppToolResult> {
    try {
      const locationId = this.ghlClient.getConfig().locationId;
      const [txResp, subResp] = await Promise.all([
        this.ghlClient.listTransactions({ altId: locationId, altType: 'location', limit: 20 }).catch(() => ({ data: null })),
        this.ghlClient.listSubscriptions({ altId: locationId, altType: 'location', limit: 20 }).catch(() => ({ data: null })),
      ]);
      const uiTree = buildPaymentDashboardTree({
        transactions: (txResp as any)?.data?.data || (txResp as any)?.data?.transactions || [],
        subscriptions: (subResp as any)?.data?.data || (subResp as any)?.data?.subscriptions || [],
      });
      return this.renderUITree(uiTree, 'Payment Dashboard');
    } catch (error: any) {
      const uiTree = buildPaymentDashboardTree({ transactions: [], subscriptions: [] });
      return this.renderUITree(uiTree, 'Payment Dashboard — Sample data (connect GHL credentials to see live data)');
    }
  }

  private async viewSocialMediaHub(): Promise<AppToolResult> {
    try {
      const [postsResp, accountsResp] = await Promise.all([
        this.ghlClient.searchSocialPosts({ fromDate: new Date(Date.now() - 30 * 86400000).toISOString(), toDate: new Date().toISOString(), includeUsers: 'false', limit: '20' }).catch(() => ({ data: null })),
        this.ghlClient.getSocialAccounts().catch(() => ({ data: null })),
      ]);
      const uiTree = buildSocialMediaHubTree({
        posts: (postsResp as any)?.data?.posts || [],
        accounts: (accountsResp as any)?.data?.accounts || [],
      });
      return this.renderUITree(uiTree, 'Social Media Hub');
    } catch (error: any) {
      const uiTree = buildSocialMediaHubTree({ posts: [], accounts: [] });
      return this.renderUITree(uiTree, 'Social Media Hub — Sample data (connect GHL credentials to see live data)');
    }
  }

  private async viewReputationMonitor(): Promise<AppToolResult> {
    try {
      const resp = await this.ghlClient.listProductReviews({ altId: this.ghlClient.getConfig().locationId, altType: 'location', limit: 30, offset: 0 }).catch(() => ({ data: null }));
      const reviews = (resp as any)?.data?.reviews || [];
      const avgRating = reviews.length > 0
        ? reviews.reduce((s: number, r: any) => s + (r.rating || 0), 0) / reviews.length
        : 0;
      const uiTree = buildReputationMonitorTree({ reviews, averageRating: avgRating });
      return this.renderUITree(uiTree, 'Reputation Monitor');
    } catch (error: any) {
      const uiTree = buildReputationMonitorTree({ reviews: [], averageRating: 0 });
      return this.renderUITree(uiTree, 'Reputation Monitor — Sample data (connect GHL credentials to see live data)');
    }
  }

  private async viewFunnelBuilder(): Promise<AppToolResult> {
    try {
      const resp = await this.ghlClient.makeRequest('GET', `/funnels/?locationId=${this.ghlClient.getConfig().locationId}`);
      const uiTree = buildFunnelBuilderTree({ funnels: resp?.data?.funnels || [] });
      return this.renderUITree(uiTree, 'Funnel Builder');
    } catch (error: any) {
      const uiTree = buildFunnelBuilderTree({ funnels: [] });
      return this.renderUITree(uiTree, 'Funnel Builder — Sample data (connect GHL credentials to see live data)');
    }
  }

  private async viewFormManager(): Promise<AppToolResult> {
    try {
      const locationId = this.ghlClient.getConfig().locationId;
      const [formsResp, surveysResp] = await Promise.all([
        this.ghlClient.makeRequest('GET', `/forms/?locationId=${locationId}`).catch(() => ({ data: null })),
        this.ghlClient.getSurveys({ locationId }).catch(() => ({ data: null })),
      ]);
      const uiTree = buildFormManagerTree({
        forms: formsResp?.data?.forms || [],
        surveys: (surveysResp as any)?.data?.surveys || [],
      });
      return this.renderUITree(uiTree, 'Form Manager');
    } catch (error: any) {
      const uiTree = buildFormManagerTree({ forms: [], surveys: [] });
      return this.renderUITree(uiTree, 'Form Manager — Sample data (connect GHL credentials to see live data)');
    }
  }

  private async viewEmailCenter(): Promise<AppToolResult> {
    try {
      const [campaignsResp, templatesResp] = await Promise.all([
        this.ghlClient.getEmailCampaigns({}).catch(() => ({ data: { schedules: [] } })),
        this.ghlClient.getEmailTemplates({ limit: 20 }).catch(() => ({ data: [] })),
      ]);
      const uiTree = buildEmailCenterTree({
        emails: (campaignsResp as any)?.data?.schedules || [],
        templates: (templatesResp as any)?.data || [],
      });
      return this.renderUITree(uiTree, 'Email Center');
    } catch (error: any) {
      const uiTree = buildEmailCenterTree({ emails: [], templates: [] });
      return this.renderUITree(uiTree, 'Email Center — Sample data (connect GHL credentials to see live data)');
    }
  }

  private async viewBlogManager(): Promise<AppToolResult> {
    try {
      const locationId = this.ghlClient.getConfig().locationId;
      const [postsResp, catsResp, authorsResp] = await Promise.all([
        this.ghlClient.makeRequest('GET', `/blogs/posts?locationId=${locationId}&limit=20&offset=0`).catch(() => ({ data: null })),
        this.ghlClient.makeRequest('GET', `/blogs/categories?locationId=${locationId}&limit=20&offset=0`).catch(() => ({ data: null })),
        this.ghlClient.makeRequest('GET', `/blogs/authors?locationId=${locationId}&limit=20&offset=0`).catch(() => ({ data: null })),
      ]);
      const uiTree = buildBlogManagerTree({
        posts: (postsResp as any)?.data?.posts || (postsResp as any)?.data?.data || [],
        categories: (catsResp as any)?.data?.categories || (catsResp as any)?.data?.data || [],
        authors: (authorsResp as any)?.data?.authors || (authorsResp as any)?.data?.data || [],
      });
      return this.renderUITree(uiTree, 'Blog Manager');
    } catch (error: any) {
      const uiTree = buildBlogManagerTree({ posts: [], categories: [], authors: [] });
      return this.renderUITree(uiTree, 'Blog Manager — Sample data (connect GHL credentials to see live data)');
    }
  }

  private async viewAffiliateDashboard(): Promise<AppToolResult> {
    try {
      const locationId = this.ghlClient.getConfig().locationId;
      const [affiliatesResp, campaignsResp] = await Promise.all([
        this.ghlClient.makeRequest('GET', `/affiliates/?locationId=${locationId}&limit=20`).catch(() => ({ data: null })),
        this.ghlClient.makeRequest('GET', `/affiliates/campaigns?locationId=${locationId}`).catch(() => ({ data: null })),
      ]);
      const uiTree = buildAffiliateDashboardTree({
        affiliates: affiliatesResp?.data?.affiliates || [],
        campaigns: campaignsResp?.data?.campaigns || [],
      });
      return this.renderUITree(uiTree, 'Affiliate Dashboard');
    } catch (error: any) {
      const uiTree = buildAffiliateDashboardTree({ affiliates: [], campaigns: [] });
      return this.renderUITree(uiTree, 'Affiliate Dashboard — Sample data (connect GHL credentials to see live data)');
    }
  }

  private async viewWorkflowBuilder(): Promise<AppToolResult> {
    try {
      const resp = await this.ghlClient.getWorkflows({ locationId: this.ghlClient.getConfig().locationId });
      const uiTree = buildWorkflowBuilderTree({ workflows: resp.data?.workflows || [] });
      return this.renderUITree(uiTree, 'Workflow Builder');
    } catch (error: any) {
      const uiTree = buildWorkflowBuilderTree({ workflows: [] });
      return this.renderUITree(uiTree, 'Workflow Builder — Sample data (connect GHL credentials to see live data)');
    }
  }

  private async viewReportingHub(): Promise<AppToolResult> {
    try {
      const resp = await this.ghlClient.makeRequest('GET', `/reporting/?locationId=${this.ghlClient.getConfig().locationId}`);
      const uiTree = buildReportingHubTree({ reports: resp?.data?.reports || [], widgets: resp?.data?.widgets || [] });
      return this.renderUITree(uiTree, 'Reporting Hub');
    } catch (error: any) {
      const uiTree = buildReportingHubTree({ reports: [], widgets: [] });
      return this.renderUITree(uiTree, 'Reporting Hub — Sample data (connect GHL credentials to see live data)');
    }
  }

  private async viewSmartListManager(): Promise<AppToolResult> {
    try {
      const resp = await this.ghlClient.makeRequest('GET', `/contacts/smartlists?locationId=${this.ghlClient.getConfig().locationId}`);
      const uiTree = buildSmartListManagerTree({ smartlists: resp?.data?.smartlists || resp?.data?.data || [] });
      return this.renderUITree(uiTree, 'Smart List Manager');
    } catch (error: any) {
      const uiTree = buildSmartListManagerTree({ smartlists: [] });
      return this.renderUITree(uiTree, 'Smart List Manager — Sample data (connect GHL credentials to see live data)');
    }
  }

  private async viewCustomFieldsManager(): Promise<AppToolResult> {
    try {
      const resp = await this.ghlClient.getLocationCustomFields(this.ghlClient.getConfig().locationId);
      const uiTree = buildCustomFieldsManagerTree({ customFields: resp?.data?.customFields || [] });
      return this.renderUITree(uiTree, 'Custom Fields Manager');
    } catch (error: any) {
      const uiTree = buildCustomFieldsManagerTree({ customFields: [] });
      return this.renderUITree(uiTree, 'Custom Fields Manager — Sample data (connect GHL credentials to see live data)');
    }
  }

  private async viewMediaLibrary(): Promise<AppToolResult> {
    try {
      const locationId = this.ghlClient.getConfig().locationId;
      const resp = await this.ghlClient.getMediaFiles({ altId: locationId, altType: 'location', limit: 30, offset: 0, sortBy: 'createdAt', sortOrder: 'desc' }).catch(() => ({ data: null }));
      const uiTree = buildMediaLibraryTree({
        files: (resp as any)?.data?.files || [],
        folders: [],
      });
      return this.renderUITree(uiTree, 'Media Library');
    } catch (error: any) {
      const uiTree = buildMediaLibraryTree({ files: [], folders: [] });
      return this.renderUITree(uiTree, 'Media Library — Sample data (connect GHL credentials to see live data)');
    }
  }

  private async viewLocationSettings(): Promise<AppToolResult> {
    try {
      const locationId = this.ghlClient.getConfig().locationId;
      const [locResp, tagsResp, cvResp] = await Promise.all([
        this.ghlClient.getLocationById(locationId),
        this.ghlClient.getLocationTags(locationId).catch(() => ({ data: null })),
        this.ghlClient.getLocationCustomValues(locationId).catch(() => ({ data: null })),
      ]);
      const uiTree = buildLocationSettingsTree({
        location: locResp.data || {},
        tags: (tagsResp as any)?.data?.tags || [],
        customValues: (cvResp as any)?.data?.customValues || [],
      });
      return this.renderUITree(uiTree, 'Location Settings');
    } catch (error: any) {
      const uiTree = buildLocationSettingsTree({ location: {}, tags: [], customValues: [] });
      return this.renderUITree(uiTree, 'Location Settings — Sample data (connect GHL credentials to see live data)');
    }
  }

  private async viewUserManager(): Promise<AppToolResult> {
    try {
      const resp = await this.ghlClient.makeRequest('GET', `/users/?locationId=${this.ghlClient.getConfig().locationId}`);
      const uiTree = buildUserManagerTree({ users: resp?.data?.users || resp?.data?.data || [] });
      return this.renderUITree(uiTree, 'User Manager');
    } catch (error: any) {
      const uiTree = buildUserManagerTree({ users: [] });
      return this.renderUITree(uiTree, 'User Manager — Sample data (connect GHL credentials to see live data)');
    }
  }

  private async viewVoiceAIConsole(): Promise<AppToolResult> {
    try {
      const locationId = this.ghlClient.getConfig().locationId;
      const [agentsResp, callsResp] = await Promise.all([
        this.ghlClient.makeRequest('GET', `/voice-ai/agents?locationId=${locationId}`).catch(() => ({ data: null })),
        this.ghlClient.makeRequest('GET', `/voice-ai/calls?locationId=${locationId}&limit=20`).catch(() => ({ data: null })),
      ]);
      const uiTree = buildVoiceAIConsoleTree({
        agents: agentsResp?.data?.agents || [],
        calls: callsResp?.data?.calls || [],
      });
      return this.renderUITree(uiTree, 'Voice AI Console');
    } catch (error: any) {
      const uiTree = buildVoiceAIConsoleTree({ agents: [], calls: [] });
      return this.renderUITree(uiTree, 'Voice AI Console — Sample data (connect GHL credentials to see live data)');
    }
  }

  private async viewProposalBuilder(): Promise<AppToolResult> {
    try {
      const resp = await this.ghlClient.makeRequest('GET', `/proposals/?locationId=${this.ghlClient.getConfig().locationId}&limit=20`);
      const uiTree = buildProposalBuilderTree({ proposals: resp?.data?.proposals || resp?.data?.data || [] });
      return this.renderUITree(uiTree, 'Proposal Builder');
    } catch (error: any) {
      const uiTree = buildProposalBuilderTree({ proposals: [] });
      return this.renderUITree(uiTree, 'Proposal Builder — Sample data (connect GHL credentials to see live data)');
    }
  }

  private async viewSaasAdmin(): Promise<AppToolResult> {
    try {
      const locationId = this.ghlClient.getConfig().locationId;
      const [accountsResp, snapshotsResp] = await Promise.all([
        this.ghlClient.makeRequest('GET', `/saas-api/public-api/locations?companyId=${locationId}`).catch(() => ({ data: null })),
        this.ghlClient.makeRequest('GET', `/snapshots/?companyId=${locationId}`).catch(() => ({ data: null })),
      ]);
      const uiTree = buildSaasAdminTree({
        subAccounts: accountsResp?.data?.locations || accountsResp?.data?.data || [],
        plans: [],
        snapshots: snapshotsResp?.data?.snapshots || snapshotsResp?.data?.data || [],
      });
      return this.renderUITree(uiTree, 'SaaS Admin');
    } catch (error: any) {
      const uiTree = buildSaasAdminTree({ subAccounts: [], plans: [], snapshots: [] });
      return this.renderUITree(uiTree, 'SaaS Admin — Sample data (connect GHL credentials to see live data)');
    }
  }

  private async viewLinkTriggerManager(): Promise<AppToolResult> {
    try {
      const locationId = this.ghlClient.getConfig().locationId;
      const [linksResp, triggersResp] = await Promise.all([
        this.ghlClient.makeRequest('GET', `/links/?locationId=${locationId}`).catch(() => ({ data: null })),
        this.ghlClient.makeRequest('GET', `/triggers/?locationId=${locationId}`).catch(() => ({ data: null })),
      ]);
      const uiTree = buildLinkTriggerManagerTree({
        links: linksResp?.data?.links || linksResp?.data?.data || [],
        triggers: triggersResp?.data?.triggers || triggersResp?.data?.data || [],
      });
      return this.renderUITree(uiTree, 'Link & Trigger Manager');
    } catch (error: any) {
      const uiTree = buildLinkTriggerManagerTree({ links: [], triggers: [] });
      return this.renderUITree(uiTree, 'Link & Trigger Manager — Sample data (connect GHL credentials to see live data)');
    }
  }

  // ─── Dynamic View (LLM-powered) ────────────────────────

  private detectDataSources(prompt: string): string[] {
    const lower = prompt.toLowerCase();
    const sources: string[] = [];
    if (lower.match(/pipeline|kanban|deal|opportunit|stage|funnel|sales/)) sources.push('pipelines');
    if (lower.match(/contact|lead|customer|people|person|client/)) sources.push('contacts');
    if (lower.match(/calendar|appointment|event|schedule|booking/)) sources.push('calendars');
    if (lower.match(/invoice|billing|payment|charge/)) sources.push('invoices');
    if (lower.match(/campaign|email.*market|newsletter|broadcast/)) sources.push('campaigns');
    if (sources.length === 0) sources.push('contacts', 'pipelines');
    return sources;
  }

  private async generateDynamicView(prompt: string, dataSource?: string): Promise<AppToolResult> {
    try {
    process.stderr.write(`[MCP Apps] Generating dynamic view: "${prompt}" (dataSource: ${dataSource || 'auto'})\n`);

    // Step 1: Fetch real GHL data
    let ghlData: any = {};
    const sources = dataSource ? [dataSource] : this.detectDataSources(prompt);

    for (const src of sources) {
      try {
        const data = await this.fetchGHLData(src);
        if (data) Object.assign(ghlData, data);
      } catch (err: any) {
        process.stderr.write(`[MCP Apps] Warning: Failed to fetch GHL data for ${src}: ${err.message}\n`);
      }
    }
    if (Object.keys(ghlData).length === 0) ghlData = null;

    // Step 2: Call Claude API
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) throw new Error('ANTHROPIC_API_KEY environment variable is required for generate_ghl_view');

    const anthropic = new Anthropic({ apiKey });

    let userMessage: string;
    if (ghlData) {
      const dataKeys = Object.keys(ghlData);
      const summary: string[] = [];
      if (ghlData.pipelines) summary.push(`${ghlData.pipelines.length} pipeline(s)`);
      if (ghlData.opportunities) summary.push(`${ghlData.opportunities.length} opportunity/deal(s)`);
      if (ghlData.contacts) summary.push(`${ghlData.contacts.length} contact(s)`);
      if (ghlData.calendars) summary.push(`${ghlData.calendars.length} calendar(s)`);
      if (ghlData.invoices) summary.push(`${ghlData.invoices.length} invoice(s)`);
      if (ghlData.campaigns) summary.push(`${ghlData.campaigns.length} campaign(s)`);

      userMessage = `${prompt}

⛔ STRICT DATA RULES:
- You have REAL CRM data below: ${summary.join(', ')}
- Use ONLY this data. Do NOT invent ANY additional records.
- If pipelines are provided, use ONLY the stage names from pipelines[].stages[].name.
- Show exactly the records provided.
- Do NOT add sections for data types not provided (${['tasks', 'workflows', 'notes', 'emails'].filter(k => !dataKeys.includes(k)).join(', ')} were NOT fetched).

REAL GHL DATA:
\`\`\`json
${JSON.stringify(ghlData, null, 2)}
\`\`\``;
    } else {
      userMessage = `${prompt}\n\n(No real data available — use minimal sample data, 3-5 records max.)`;
    }

    let message;
    try {
      message = await anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 8192,
        system: CATALOG_SYSTEM_PROMPT,
        messages: [{ role: 'user', content: userMessage }],
      });
    } catch (aiErr: any) {
      throw new Error(`AI generation failed: ${aiErr.message}`);
    }

    const text = message.content
      .filter((b): b is Anthropic.TextBlock => b.type === 'text')
      .map(b => b.text)
      .join('');

    const cleaned = text.replace(/^```(?:json)?\s*\n?/m, '').replace(/\n?```\s*$/m, '').trim();

    let uiTree: UITree;
    try {
      uiTree = JSON.parse(cleaned);
    } catch (parseErr: any) {
      throw new Error(`Failed to parse AI response as JSON: ${parseErr.message}`);
    }

    // Validate the tree
    const errors = validateUITree(uiTree);
    if (errors.length > 0) {
      process.stderr.write(`[MCP Apps] UITree validation warnings: ${JSON.stringify(errors)}\n`);
      // Don't throw — render what we got, the renderer handles unknown types gracefully
    }

    process.stderr.write(`[MCP Apps] Generated UI tree with ${Object.keys(uiTree.elements).length} elements\n`);

    return this.renderUITree(uiTree, `Generated dynamic view: ${prompt}`);
    } catch (error: any) {
      return this.errorResult(`Failed to generate dynamic view: ${error.message}`);
    }
  }

  // ─── Data Fetching ──────────────────────────────────────

  private async fetchGHLData(dataSource: string): Promise<any> {
    const locationId = this.ghlClient.getConfig().locationId;

    switch (dataSource) {
      case 'contacts': {
        const resp = await this.ghlClient.searchContacts({ locationId, limit: 20 });
        return { contacts: resp.data?.contacts || [] };
      }
      case 'opportunities': {
        const resp = await this.ghlClient.searchOpportunities({ location_id: locationId });
        return { opportunities: resp.data?.opportunities || [] };
      }
      case 'pipelines': {
        const [pResp, oResp] = await Promise.all([
          this.ghlClient.getPipelines(),
          this.ghlClient.searchOpportunities({ location_id: locationId }),
        ]);
        return {
          pipelines: pResp.data?.pipelines || [],
          opportunities: oResp.data?.opportunities || [],
        };
      }
      case 'calendars': {
        const resp = await this.ghlClient.getCalendars();
        return { calendars: resp.data?.calendars || [] };
      }
      case 'invoices': {
        const resp = await this.ghlClient.listInvoices?.({
          altId: locationId, altType: 'location', limit: '10', offset: '0',
        }) || { data: { invoices: [] } };
        return { invoices: resp.data?.invoices || [] };
      }
      case 'campaigns': {
        const resp = await this.ghlClient.getEmailCampaigns({});
        return { campaigns: resp.data?.schedules || [] };
      }
      default:
        return null;
    }
  }

  // ─── Action Tools ───────────────────────────────────────

  private async updateOpportunity(args: {
    opportunityId: string;
    pipelineStageId?: string;
    name?: string;
    monetaryValue?: number;
    status?: 'open' | 'won' | 'lost' | 'abandoned';
  }): Promise<AppToolResult> {
    const { opportunityId, ...updates } = args;
    const updatePayload: any = {};
    if (updates.pipelineStageId) updatePayload.pipelineStageId = updates.pipelineStageId;
    if (updates.name) updatePayload.name = updates.name;
    if (updates.monetaryValue !== undefined) updatePayload.monetaryValue = updates.monetaryValue;
    if (updates.status) updatePayload.status = updates.status;

    process.stderr.write(`[MCP Apps] Updating opportunity ${opportunityId}: ${JSON.stringify(updatePayload)}\n`);
    const response = await this.ghlClient.updateOpportunity(opportunityId, updatePayload);
    if (!response.success) throw new Error(response.error?.message || 'Failed to update opportunity');

    const opportunity = response.data;
    return {
      content: [{ type: 'text', text: `Updated opportunity: ${opportunity?.name || opportunityId}` }],
      structuredContent: {
        success: true,
        opportunity: {
          id: opportunity?.id, name: opportunity?.name,
          pipelineStageId: opportunity?.pipelineStageId,
          monetaryValue: opportunity?.monetaryValue, status: opportunity?.status,
        },
      },
    };
  }

  // ─── Universal Render Pipeline ──────────────────────────

  /**
   * Core render method: takes a UITree, injects it into the universal
   * renderer, and returns a structuredContent result.
   */
  private renderUITree(uiTree: UITree, textSummary: string): AppToolResult {
    // Store UITree for injection when resource is read
    this.pendingDynamicData = { uiTree };

    return {
      content: [{ type: 'text', text: textSummary }],
      structuredContent: { uiTree } as Record<string, unknown>,
    };
  }

  /**
   * Inject data into HTML as a script tag (for pre-injected __MCP_APP_DATA__)
   */
  private injectDataIntoHTML(html: string, data: any): string {
    const dataScript = `<script>window.__MCP_APP_DATA__ = ${JSON.stringify(data)};</script>`;
    if (html.includes('</head>')) {
      return html.replace('</head>', `${dataScript}</head>`);
    } else if (html.includes('<body>')) {
      return html.replace('<body>', `<body>${dataScript}`);
    }
    return dataScript + html;
  }

  // ─── Resource Access ────────────────────────────────────

  getResourceHandler(uri: string): AppResourceHandler | undefined {
    return this.resourceHandlers.get(uri);
  }

  getResourceURIs(): string[] {
    return Array.from(this.resourceHandlers.keys());
  }
}
