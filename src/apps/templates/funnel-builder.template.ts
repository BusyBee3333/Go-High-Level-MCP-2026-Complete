import { UITree } from '../types.js';

export function buildFunnelBuilderTree(data: {
  funnels: any[];
}): UITree {
  const funnels = data.funnels || [];
  const fmtDate = (d: string) => d ? new Date(d).toLocaleDateString() : '—';

  const totalFunnels = funnels.length;
  const published = funnels.filter((f: any) => f.status === 'published' || f.published).length;
  const draft = totalFunnels - published;
  const totalPages = funnels.reduce((s: number, f: any) => s + (f.pages?.length || f.steps?.length || f.pageCount || 0), 0);
  const totalVisits = funnels.reduce((s: number, f: any) => s + (f.visits || f.totalVisits || 0), 0);
  const totalConversions = funnels.reduce((s: number, f: any) => s + (f.conversions || 0), 0);
  const conversionRate = totalVisits > 0 ? Math.round((totalConversions / totalVisits) * 100) : 0;
  const publishRate = totalFunnels > 0 ? Math.round((published / totalFunnels) * 100) : 0;

  const funnelRows = funnels.slice(0, 8).map((f: any) => ({
    id: f.id || '',
    name: f.name || 'Untitled Funnel',
    pages: f.pages?.length || f.steps?.length || f.pageCount || 0,
    status: f.status || (f.published ? 'published' : 'draft'),
    visits: f.visits || f.totalVisits || 0,
    conversions: f.conversions || 0,
    url: f.url || f.domain || '—',
    updated: fmtDate(f.updatedAt || f.createdAt),
  }));

  // Build funnel chart from first funnel's pages
  const firstFunnel = funnels[0];
  const funnelStages = (firstFunnel?.pages || firstFunnel?.steps || []).slice(0, 5).map((p: any, i: number) => ({
    label: p.name || p.title || `Step ${i + 1}`,
    value: p.visits || p.views || Math.max(100 - i * 20, 10),
    color: undefined,
  }));

  return {
    root: 'page',
    elements: {
      page: {
        key: 'page',
        type: 'PageHeader',
        props: {
          title: 'Funnel Builder',
          subtitle: `${totalFunnels} funnels · ${totalPages} pages · ${totalVisits.toLocaleString()} visits`,
          gradient: true,
          stats: [
            { label: 'Funnels', value: String(totalFunnels) },
            { label: 'Published', value: String(published) },
            { label: 'Total Pages', value: String(totalPages) },
            { label: 'Conversion', value: `${conversionRate}%` },
          ],
        },
        children: ['funnelActions', 'funnelSearch', 'metrics', 'layout'],
      },
      funnelActions: {
        key: 'funnelActions',
        type: 'ActionBar',
        props: { align: 'right' },
        children: ['funnelCreateRedirectBtn'],
      },
      funnelCreateRedirectBtn: {
        key: 'funnelCreateRedirectBtn',
        type: 'ActionButton',
        props: { label: 'Create Redirect', variant: 'primary', toolName: 'create_funnel_redirect', toolArgs: {} },
      },
      funnelSearch: {
        key: 'funnelSearch',
        type: 'SearchBar',
        props: { placeholder: 'Search funnels...', searchTool: 'get_funnels' },
      },
      metrics: {
        key: 'metrics',
        type: 'StatsGrid',
        props: { columns: 4 },
        children: ['mFunnels', 'mPublished', 'mPages', 'mConversion'],
      },
      mFunnels: { key: 'mFunnels', type: 'MetricCard', props: { label: 'Total Funnels', value: String(totalFunnels), color: 'blue' } },
      mPublished: { key: 'mPublished', type: 'MetricCard', props: { label: 'Published', value: String(published), color: 'green' } },
      mPages: { key: 'mPages', type: 'MetricCard', props: { label: 'Total Pages', value: String(totalPages), color: 'purple' } },
      mConversion: { key: 'mConversion', type: 'MetricCard', props: { label: 'Conversion Rate', value: `${conversionRate}%`, color: 'yellow' } },
      layout: {
        key: 'layout',
        type: 'SplitLayout',
        props: { ratio: '67/33', gap: 'md' },
        children: ['funnelTableCard', 'sidePanel'],
      },
      funnelTableCard: {
        key: 'funnelTableCard',
        type: 'Card',
        props: { title: `Funnels (${totalFunnels})`, padding: 'none' },
        children: ['funnelTable'],
      },
      funnelTable: {
        key: 'funnelTable',
        type: 'DataTable',
        props: {
          columns: [
            { key: 'name', label: 'Funnel', format: 'text', sortable: true },
            { key: 'pages', label: 'Pages', format: 'text' },
            { key: 'status', label: 'Status', format: 'status' },
            { key: 'visits', label: 'Visits', format: 'text', sortable: true },
            { key: 'conversions', label: 'Conversions', format: 'text' },
            { key: 'updated', label: 'Updated', format: 'date' },
          ],
          rows: funnelRows,
          emptyMessage: 'No funnels found',
          pageSize: 8,
        },
      },
      sidePanel: {
        key: 'sidePanel',
        type: 'Card',
        props: { title: 'Funnel Analytics' },
        children: ['publishProgress', 'funnelChart', 'funnelKV'],
      },
      publishProgress: {
        key: 'publishProgress',
        type: 'ProgressBar',
        props: {
          label: 'Publish Rate',
          value: publishRate,
          max: 100,
          color: publishRate >= 70 ? 'green' : publishRate >= 40 ? 'yellow' : 'red',
          showPercent: true,
        },
      },
      funnelChart: {
        key: 'funnelChart',
        type: 'FunnelChart',
        props: {
          stages: funnelStages.length > 0 ? funnelStages : [
            { label: 'Landing', value: 100 },
            { label: 'Opt-In', value: 65 },
            { label: 'Sales', value: 30 },
            { label: 'Checkout', value: 15 },
          ],
          showDropoff: true,
          title: firstFunnel?.name ? `${firstFunnel.name} Conversion` : 'Funnel Conversion',
        },
      },
      funnelKV: {
        key: 'funnelKV',
        type: 'KeyValueList',
        props: {
          items: [
            { label: 'Total Funnels', value: String(totalFunnels), bold: true },
            { label: 'Published', value: String(published), variant: 'success' as const },
            { label: 'Draft', value: String(draft), variant: 'muted' as const },
            { label: 'Total Pages', value: String(totalPages) },
            { label: 'Total Visits', value: totalVisits.toLocaleString() },
            { label: 'Conversions', value: totalConversions.toLocaleString(), variant: 'highlight' as const },
          ],
          compact: true,
        },
      },
    },
  };
}
