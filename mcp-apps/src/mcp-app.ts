import {
  App,
  applyDocumentTheme,
  applyHostFonts,
  applyHostStyleVariables,
} from '@modelcontextprotocol/ext-apps';
import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import './global.css';
import './mcp-app.css';

type HostContext = NonNullable<ReturnType<App['getHostContext']>>;

type AppPayload = {
  appId: string;
  title: string;
  summary: string;
  status: string;
  metrics?: Array<{ label: string; value: string | number }>;
  data?: Record<string, unknown>;
  suggestedToolCalls?: Array<{ label: string; tool: string; arguments?: Record<string, unknown>; requiresConfirmation?: boolean }>;
};

let payload: AppPayload | null = null;

const root = document.querySelector('.shell') as HTMLElement;
const titleEl = document.getElementById('app-title')!;
const statusEl = document.getElementById('status-pill')!;
const summaryEl = document.getElementById('summary')!;
const metricsEl = document.getElementById('metrics')!;
const contentEl = document.getElementById('content')!;
const actionsEl = document.getElementById('actions')!;
const previewMode = new URLSearchParams(window.location.search).has('preview') || window.location.pathname === '/preview';

const app = new App({ name: 'GoHighLevel MCP Apps', version: '0.1.0' });

if (previewMode) {
  loadPreview().catch((error) => {
    payload = {
      appId: 'preview-error',
      title: 'Preview Error',
      summary: error instanceof Error ? error.message : String(error),
      status: 'error',
    };
    render();
  });
} else {
  app.onhostcontextchanged = applyHostContext;
  app.ontoolinput = () => renderLoading();
  app.ontoolresult = (result) => {
    payload = extractPayload(result);
    render();
  };
  app.onteardown = async () => ({});

  app.connect().then(() => {
    const ctx = app.getHostContext();
    if (ctx) applyHostContext(ctx);
  });
}

function applyHostContext(ctx: HostContext): void {
  if (ctx.theme) applyDocumentTheme(ctx.theme);
  if (ctx.styles?.variables) applyHostStyleVariables(ctx.styles.variables);
  if (ctx.styles?.css?.fonts) applyHostFonts(ctx.styles.css.fonts);
  if (ctx.safeAreaInsets) {
    root.style.paddingTop = `${ctx.safeAreaInsets.top + 24}px`;
    root.style.paddingRight = `${ctx.safeAreaInsets.right + 24}px`;
    root.style.paddingBottom = `${ctx.safeAreaInsets.bottom + 24}px`;
    root.style.paddingLeft = `${ctx.safeAreaInsets.left + 24}px`;
  }
}

function extractPayload(result: CallToolResult): AppPayload {
  const structured = result.structuredContent as { payload?: AppPayload } | undefined;
  if (structured?.payload) return structured.payload;
  return {
    appId: 'unknown',
    title: 'GoHighLevel MCP App',
    summary: result.content?.[0]?.type === 'text' ? result.content[0].text : 'No structured content returned.',
    status: result.isError ? 'error' : 'ready',
  };
}

function renderLoading(): void {
  titleEl.textContent = 'Loading GoHighLevel app';
  statusEl.textContent = 'loading';
  summaryEl.textContent = 'Waiting for tool result...';
  metricsEl.innerHTML = '';
  contentEl.innerHTML = '';
  actionsEl.innerHTML = '';
}

async function loadPreview(): Promise<void> {
  renderLoading();
  const params = new URLSearchParams(window.location.search);
  params.set('preview', '1');
  const appId = params.get('app') || 'tool-explorer';
  params.set('app', appId);
  const response = await fetch(`/preview-data?${params.toString()}`);
  if (!response.ok) throw new Error(`Preview failed: HTTP ${response.status}`);
  const data = await response.json() as { payload: AppPayload };
  payload = data.payload;
  render();
}

function render(): void {
  if (!payload) return renderLoading();
  titleEl.textContent = payload.title;
  statusEl.textContent = payload.status;
  summaryEl.textContent = payload.summary;
  metricsEl.innerHTML = (payload.metrics || []).map((metric) => `
    <div class="metric">
      <strong>${escapeHtml(metric.value)}</strong>
      <span>${escapeHtml(metric.label)}</span>
    </div>
  `).join('');
  contentEl.innerHTML = renderContent(payload);
  renderActions(payload);
  attachExplorerFilters();
}

function renderContent(value: AppPayload): string {
  if (value.appId === 'tool-explorer') return renderToolExplorer(value);
  if (value.appId === 'contact-360') return renderRecordPanels(value, ['contact', 'conversations', 'opportunities', 'notes']);
  if (value.appId === 'pipeline-command') return renderRecordPanels(value, ['pipelines', 'opportunities', 'staleOpportunities']);
  if (value.appId === 'ads-reporting') return renderRecordPanels(value, ['adReports', 'attribution']);
  if (value.appId === 'agency-health') return renderRecordPanels(value, ['location', 'users', 'calendars', 'pipelines']);
  return `<section class="panel"><h2>Data</h2><div class="panel-body"><pre>${escapeHtml(JSON.stringify(value.data || {}, null, 2))}</pre></div></section>`;
}

function renderToolExplorer(value: AppPayload): string {
  const tools = Array.isArray(value.data?.tools) ? value.data.tools as Record<string, unknown>[] : [];
  const categories = [...new Set(tools.map((tool) => String(tool.category || '')).filter(Boolean))].sort();
  return `
    <section class="panel">
      <h2>Tool Inventory</h2>
      <div class="panel-body">
        <div class="toolbar">
          <input id="tool-search" type="search" placeholder="Search tools">
          <select id="tool-category">
            <option value="">All categories</option>
            ${categories.map((category) => `<option>${escapeHtml(category)}</option>`).join('')}
          </select>
        </div>
        <table id="tool-table">
          <thead><tr><th>Tool</th><th>Category</th><th>Access</th><th>Endpoint</th></tr></thead>
          <tbody>
            ${tools.map((tool) => `
              <tr data-category="${escapeHtml(tool.category)}" data-search="${escapeHtml(JSON.stringify(tool).toLowerCase())}">
                <td><code>${escapeHtml(tool.name)}</code></td>
                <td>${escapeHtml(tool.category)}</td>
                <td>${escapeHtml(tool.access)}</td>
                <td><code>${escapeHtml([tool.method, tool.path].filter(Boolean).join(' ') || tool.source)}</code></td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </section>`;
}

function attachExplorerFilters(): void {
  const search = document.getElementById('tool-search') as HTMLInputElement | null;
  const category = document.getElementById('tool-category') as HTMLSelectElement | null;
  const rows = [...document.querySelectorAll<HTMLTableRowElement>('#tool-table tbody tr')];
  if (!search || !category || !rows.length) return;
  const update = () => {
    const q = search.value.trim().toLowerCase();
    const c = category.value;
    for (const row of rows) {
      const matchText = !q || row.dataset.search?.includes(q);
      const matchCategory = !c || row.dataset.category === c;
      row.hidden = !(matchText && matchCategory);
    }
  };
  search.addEventListener('input', update);
  category.addEventListener('change', update);
}

function renderRecordPanels(value: AppPayload, keys: string[]): string {
  return keys.map((key) => {
    const data = value.data?.[key];
    return `
      <section class="panel">
        <h2>${titleize(key)}</h2>
        <div class="panel-body">${renderData(data)}</div>
      </section>`;
  }).join('');
}

function renderData(data: unknown): string {
  if (Array.isArray(data)) {
    if (!data.length) return '<p class="muted">No records returned.</p>';
    return `<div class="item-list">${data.slice(0, 12).map(renderItem).join('')}</div>`;
  }
  if (data && typeof data === 'object') return renderItem(data as Record<string, unknown>);
  if (data === undefined || data === null || data === '') return '<p class="muted">No data returned.</p>';
  return `<p>${escapeHtml(data)}</p>`;
}

function renderItem(item: Record<string, unknown>): string {
  const title = item.name || item.fullName || item.title || item.id || item.contactId || 'Record';
  const lines = Object.entries(item)
    .filter(([key]) => !['name', 'fullName', 'title'].includes(key))
    .slice(0, 8)
    .map(([key, value]) => `<div><span class="muted">${escapeHtml(key)}:</span> ${escapeHtml(formatValue(value))}</div>`)
    .join('');
  return `<article class="item"><div class="item-title">${escapeHtml(title)}</div>${lines}</article>`;
}

function renderActions(value: AppPayload): void {
  actionsEl.innerHTML = (value.suggestedToolCalls || []).map((action, index) => `
    <button class="${action.requiresConfirmation ? '' : 'primary'}" data-action-index="${index}">
      ${escapeHtml(action.label)}
    </button>
  `).join('');

  actionsEl.querySelectorAll<HTMLButtonElement>('button').forEach((button) => {
    button.addEventListener('click', async () => {
      const index = Number(button.dataset.actionIndex);
      const action = value.suggestedToolCalls?.[index];
      if (!action) return;
      const message = `${action.requiresConfirmation ? 'Please confirm and run' : 'Please run'} the GoHighLevel MCP tool \`${action.tool}\` with these arguments:\n\n${JSON.stringify(action.arguments || {}, null, 2)}`;
      if (previewMode) {
        window.alert(message);
        return;
      }
      await app.sendMessage({ role: 'user', content: [{ type: 'text', text: message }] });
    });
  });
}

function titleize(value: string): string {
  return value.replace(/([A-Z])/g, ' $1').replace(/[-_]/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());
}

function formatValue(value: unknown): string {
  if (value === null || value === undefined) return '';
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}

function escapeHtml(value: unknown): string {
  return String(value ?? '').replace(/[&<>"']/g, (char) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  }[char] || char));
}
