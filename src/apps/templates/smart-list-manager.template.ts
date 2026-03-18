import { UITree } from '../types.js';

export function buildSmartListManagerTree(data: {
  smartlists: any[];
}): UITree {
  const smartlists = data.smartlists || [];
  const fmtDate = (d: string) => d ? new Date(d).toLocaleDateString() : '—';

  const totalLists = smartlists.length;
  const totalContacts = smartlists.reduce((s: number, l: any) => s + (l.contactCount || l.count || 0), 0);
  const withFilters = smartlists.filter((l: any) => l.filters?.length > 0 || l.conditions?.length > 0).length;
  const activeLists = smartlists.filter((l: any) => l.status === 'active' || !l.archived).length;

  const listRows = smartlists.slice(0, 10).map((l: any) => ({
    id: l.id || '',
    name: l.name || 'Untitled List',
    contacts: l.contactCount || l.count || 0,
    filters: l.filters?.length || l.conditions?.length || 0,
    status: l.status || 'active',
    lastUpdated: fmtDate(l.updatedAt || l.dateUpdated),
  }));

  const bars = smartlists.slice(0, 8).map((l: any) => ({
    label: (l.name || 'List').slice(0, 15),
    value: l.contactCount || l.count || 0,
    color: '#3b82f6',
  })).filter((b: any) => b.value > 0);

  // Filter usage pie chart
  const filterSegments = [
    { label: 'With Filters', value: withFilters, color: '#10b981' },
    { label: 'No Filters', value: Math.max(0, totalLists - withFilters), color: '#94a3b8' },
  ].filter(s => s.value > 0);

  return {
    root: 'page',
    elements: {
      page: {
        key: 'page',
        type: 'PageHeader',
        props: {
          title: 'Smart List Manager',
          subtitle: `${totalLists} lists · ${totalContacts.toLocaleString()} total contacts`,
          gradient: true,
          stats: [
            { label: 'Smart Lists', value: String(totalLists) },
            { label: 'Total Contacts', value: totalContacts.toLocaleString() },
            { label: 'Filtered', value: String(withFilters) },
            { label: 'Active', value: String(activeLists) },
          ],
        },
        children: ['slActions', 'slSearch', 'metrics', 'layout'],
      },
      slActions: {
        key: 'slActions',
        type: 'ActionBar',
        props: { align: 'right' },
        children: ['slCreateBtn', 'slDuplicateBtn'],
      },
      slCreateBtn: {
        key: 'slCreateBtn',
        type: 'ActionButton',
        props: { label: 'Create Smart List', variant: 'primary', toolName: 'create_smart_list', toolArgs: {} },
      },
      slDuplicateBtn: {
        key: 'slDuplicateBtn',
        type: 'ActionButton',
        props: { label: 'Duplicate List', variant: 'secondary', toolName: 'duplicate_smart_list', toolArgs: {} },
      },
      slSearch: {
        key: 'slSearch',
        type: 'SearchBar',
        props: { placeholder: 'Search smart lists...', searchTool: 'get_smart_lists' },
      },
      metrics: {
        key: 'metrics',
        type: 'StatsGrid',
        props: { columns: 4 },
        children: ['mLists', 'mContacts', 'mFiltered', 'mActive'],
      },
      mLists: { key: 'mLists', type: 'MetricCard', props: { label: 'Smart Lists', value: String(totalLists), color: 'blue' } },
      mContacts: { key: 'mContacts', type: 'MetricCard', props: { label: 'Total Contacts', value: totalContacts.toLocaleString(), color: 'green' } },
      mFiltered: { key: 'mFiltered', type: 'MetricCard', props: { label: 'With Filters', value: String(withFilters), color: 'purple' } },
      mActive: { key: 'mActive', type: 'MetricCard', props: { label: 'Active', value: String(activeLists), color: 'yellow' } },
      layout: {
        key: 'layout',
        type: 'SplitLayout',
        props: { ratio: '67/33', gap: 'md' },
        children: ['listTableCard', 'sidePanel'],
      },
      listTableCard: {
        key: 'listTableCard',
        type: 'Card',
        props: { title: `Smart Lists (${totalLists})`, padding: 'none' },
        children: ['listTable'],
      },
      listTable: {
        key: 'listTable',
        type: 'DataTable',
        props: {
          columns: [
            { key: 'name', label: 'List Name', format: 'text', sortable: true },
            { key: 'contacts', label: 'Contacts', format: 'text', sortable: true },
            { key: 'filters', label: 'Filters', format: 'text' },
            { key: 'status', label: 'Status', format: 'status' },
            { key: 'lastUpdated', label: 'Updated', format: 'date', sortable: true },
          ],
          rows: listRows,
          emptyMessage: 'No smart lists found',
          pageSize: 10,
        },
      },
      sidePanel: {
        key: 'sidePanel',
        type: 'Card',
        props: { title: 'List Analytics' },
        children: ['chart', 'filterChart', 'slKV'],
      },
      chart: {
        key: 'chart',
        type: 'BarChart',
        props: {
          bars: bars.length > 0 ? bars : [{ label: 'No lists', value: 0 }],
          orientation: 'horizontal',
          showValues: true,
          title: 'Contacts per List',
        },
      },
      filterChart: {
        key: 'filterChart',
        type: 'PieChart',
        props: {
          segments: filterSegments.length > 0 ? filterSegments : [{ label: 'No data', value: 1, color: '#94a3b8' }],
          donut: true,
          title: 'Filter Usage',
          showLegend: true,
        },
      },
      slKV: {
        key: 'slKV',
        type: 'KeyValueList',
        props: {
          items: [
            { label: 'Total Lists', value: String(totalLists), bold: true },
            { label: 'Total Contacts', value: totalContacts.toLocaleString(), variant: 'highlight' as const },
            { label: 'With Filters', value: String(withFilters), variant: 'success' as const },
            { label: 'Active', value: String(activeLists), variant: 'success' as const },
            { label: 'Avg Contacts/List', value: totalLists > 0 ? String(Math.round(totalContacts / totalLists)) : '0' },
          ],
          compact: true,
        },
      },
    },
  };
}
