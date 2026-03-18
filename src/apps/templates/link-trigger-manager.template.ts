import { UITree } from '../types.js';

export function buildLinkTriggerManagerTree(data: {
  links: any[];
  triggers: any[];
}): UITree {
  const links = data.links || [];
  const triggers = data.triggers || [];
  const fmtDate = (d: string) => d ? new Date(d).toLocaleDateString() : '—';

  const totalLinks = links.length;
  const totalTriggers = triggers.length;
  const totalClicks = links.reduce((s: number, l: any) => s + (l.clicks || l.clickCount || 0), 0);
  const activeLinks = links.filter((l: any) => l.status === 'active' || !l.archived).length;
  const activeTriggers = triggers.filter((t: any) => t.status === 'active' || !t.archived).length;
  const totalFires = triggers.reduce((s: number, t: any) => s + (t.fireCount || t.executions || 0), 0);

  const linkRows = links.slice(0, 8).map((l: any) => ({
    id: l.id || '',
    name: l.name || l.title || 'Untitled Link',
    url: (l.url || l.redirectUrl || '—').slice(0, 40),
    clicks: l.clicks || l.clickCount || 0,
    status: l.status || 'active',
    created: fmtDate(l.createdAt),
  }));

  const triggerRows = triggers.slice(0, 8).map((t: any) => ({
    id: t.id || '',
    name: t.name || 'Untitled Trigger',
    type: t.type || t.triggerType || 'link_click',
    url: (t.url || '—').slice(0, 40),
    fires: t.fireCount || t.executions || 0,
    status: t.status || 'active',
  }));

  // Top links by clicks bar chart
  const clickBars = links.slice(0, 8).map((l: any) => ({
    label: (l.name || l.title || 'Link').slice(0, 12),
    value: l.clicks || l.clickCount || 0,
    color: '#3b82f6',
  })).filter((b: any) => b.value > 0);

  // Type distribution pie chart
  const typePie = [
    { label: 'Links', value: totalLinks, color: '#3b82f6' },
    { label: 'Triggers', value: totalTriggers, color: '#8b5cf6' },
  ].filter(s => s.value > 0);

  return {
    root: 'page',
    elements: {
      page: {
        key: 'page',
        type: 'PageHeader',
        props: {
          title: 'Link & Trigger Manager',
          subtitle: `${totalLinks} links · ${totalTriggers} triggers · ${totalClicks.toLocaleString()} clicks`,
          gradient: true,
          stats: [
            { label: 'Links', value: String(totalLinks) },
            { label: 'Triggers', value: String(totalTriggers) },
            { label: 'Total Clicks', value: totalClicks.toLocaleString() },
            { label: 'Active', value: String(activeLinks + activeTriggers) },
          ],
        },
        children: ['ltActions', 'ltSearch', 'metrics', 'layout'],
      },
      ltActions: {
        key: 'ltActions',
        type: 'ActionBar',
        props: { align: 'right' },
        children: ['ltCreateLinkBtn', 'ltCreateTriggerBtn'],
      },
      ltCreateLinkBtn: {
        key: 'ltCreateLinkBtn',
        type: 'ActionButton',
        props: { label: 'Create Link', variant: 'primary', toolName: 'create_link', toolArgs: {} },
      },
      ltCreateTriggerBtn: {
        key: 'ltCreateTriggerBtn',
        type: 'ActionButton',
        props: { label: 'Create Trigger', variant: 'secondary', toolName: 'create_trigger', toolArgs: {} },
      },
      ltSearch: {
        key: 'ltSearch',
        type: 'SearchBar',
        props: { placeholder: 'Search links & triggers...', searchTool: 'search_links' },
      },
      metrics: {
        key: 'metrics',
        type: 'StatsGrid',
        props: { columns: 4 },
        children: ['mLinks', 'mTriggers', 'mClicks', 'mFires'],
      },
      mLinks: { key: 'mLinks', type: 'MetricCard', props: { label: 'Links', value: String(totalLinks), color: 'blue' } },
      mTriggers: { key: 'mTriggers', type: 'MetricCard', props: { label: 'Triggers', value: String(totalTriggers), color: 'purple' } },
      mClicks: { key: 'mClicks', type: 'MetricCard', props: { label: 'Total Clicks', value: totalClicks.toLocaleString(), color: 'green' } },
      mFires: { key: 'mFires', type: 'MetricCard', props: { label: 'Trigger Fires', value: totalFires.toLocaleString(), color: 'yellow' } },
      layout: {
        key: 'layout',
        type: 'SplitLayout',
        props: { ratio: '67/33', gap: 'md' },
        children: ['leftCol', 'sidePanel'],
      },
      leftCol: {
        key: 'leftCol',
        type: 'Card',
        props: { title: 'Links & Triggers', padding: 'none' },
        children: ['linkTable', 'triggerTable'],
      },
      linkTable: {
        key: 'linkTable',
        type: 'DataTable',
        props: {
          columns: [
            { key: 'name', label: 'Link', format: 'text', sortable: true },
            { key: 'clicks', label: 'Clicks', format: 'text', sortable: true },
            { key: 'status', label: 'Status', format: 'status' },
            { key: 'created', label: 'Created', format: 'date' },
          ],
          rows: linkRows,
          emptyMessage: 'No trigger links found',
          pageSize: 8,
        },
      },
      triggerTable: {
        key: 'triggerTable',
        type: 'DataTable',
        props: {
          columns: [
            { key: 'name', label: 'Trigger', format: 'text', sortable: true },
            { key: 'type', label: 'Type', format: 'status' },
            { key: 'fires', label: 'Fires', format: 'text', sortable: true },
            { key: 'status', label: 'Status', format: 'status' },
          ],
          rows: triggerRows,
          emptyMessage: 'No triggers found',
          pageSize: 8,
        },
      },
      sidePanel: {
        key: 'sidePanel',
        type: 'Card',
        props: { title: 'Link Analytics' },
        children: ['typePieChart', 'clickChart', 'ltKV'],
      },
      typePieChart: {
        key: 'typePieChart',
        type: 'PieChart',
        props: {
          segments: typePie.length > 0 ? typePie : [{ label: 'No data', value: 1, color: '#94a3b8' }],
          donut: true,
          title: 'Links vs Triggers',
          showLegend: true,
        },
      },
      clickChart: {
        key: 'clickChart',
        type: 'BarChart',
        props: {
          bars: clickBars.length > 0 ? clickBars : [{ label: 'No clicks', value: 0 }],
          orientation: 'horizontal',
          showValues: true,
          title: 'Top Links by Clicks',
        },
      },
      ltKV: {
        key: 'ltKV',
        type: 'KeyValueList',
        props: {
          items: [
            { label: 'Total Links', value: String(totalLinks), bold: true },
            { label: 'Total Triggers', value: String(totalTriggers) },
            { label: 'Total Clicks', value: totalClicks.toLocaleString(), variant: 'highlight' as const },
            { label: 'Trigger Fires', value: totalFires.toLocaleString() },
            { label: 'Active Links', value: String(activeLinks), variant: 'success' as const },
            { label: 'Active Triggers', value: String(activeTriggers), variant: 'success' as const },
          ],
          compact: true,
        },
      },
    },
  };
}
