import { UITree } from '../types.js';

export function buildContactGridTree(data: { contacts: any[]; query?: string }): UITree {
  const contacts = data.contacts || [];
  const fmtDate = (d: string) => d ? new Date(d).toLocaleDateString() : '—';

  const taggedCount = contacts.filter((c: any) => c.tags && c.tags.length > 0).length;
  const withEmail = contacts.filter((c: any) => c.email).length;
  const withPhone = contacts.filter((c: any) => c.phone).length;

  // Source breakdown for pie chart
  const sourceCounts: Record<string, number> = {};
  contacts.forEach((c: any) => {
    const src = c.source || 'Unknown';
    sourceCounts[src] = (sourceCounts[src] || 0) + 1;
  });
  const sourceSegments = Object.entries(sourceCounts).slice(0, 6).map(([label, value], i) => ({
    label: label.charAt(0).toUpperCase() + label.slice(1),
    value,
    color: ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#ec4899'][i % 6],
  }));

  const rows = contacts.map((c: any) => ({
    id: c.id || '',
    name: `${c.firstName || ''} ${c.lastName || ''}`.trim() || 'Unknown',
    email: c.email || '—',
    phone: c.phone || '—',
    tags: c.tags || [],
    dateAdded: fmtDate(c.dateAdded),
    source: c.source || '—',
  }));

  return {
    root: 'page',
    elements: {
      page: {
        key: 'page',
        type: 'PageHeader',
        props: {
          title: 'Contacts',
          subtitle: data.query ? `Search: "${data.query}"` : `${contacts.length} contacts`,
          gradient: true,
          stats: [
            { label: 'Total', value: String(contacts.length) },
            { label: 'With Email', value: String(withEmail) },
            { label: 'With Phone', value: String(withPhone) },
            { label: 'Tagged', value: String(taggedCount) },
          ],
        },
        children: ['actions', 'search', 'metrics', 'layout'],
      },
      actions: {
        key: 'actions',
        type: 'ActionBar',
        props: { align: 'right' },
        children: ['createBtn', 'importBtn'],
      },
      createBtn: {
        key: 'createBtn',
        type: 'FormGroup',
        props: {
          submitTool: 'create_contact',
          submitLabel: '+ Create Contact',
          fields: [
            { key: 'firstName', label: 'First Name', type: 'text', placeholder: 'John' },
            { key: 'lastName', label: 'Last Name', type: 'text', placeholder: 'Doe' },
            { key: 'email', label: 'Email', type: 'email', placeholder: 'john@example.com', required: true },
            { key: 'phone', label: 'Phone', type: 'text', placeholder: '+1 555 000 0000' },
          ],
        },
      },
      importBtn: {
        key: 'importBtn',
        type: 'ActionButton',
        props: { label: 'Search Contacts', variant: 'secondary', toolName: 'search_contacts', toolArgs: {} },
      },
      search: {
        key: 'search',
        type: 'SearchBar',
        props: { placeholder: 'Search contacts...', valuePath: 'query', searchTool: 'search_contacts' },
      },
      metrics: {
        key: 'metrics',
        type: 'StatsGrid',
        props: { columns: 4 },
        children: ['mTotal', 'mEmail', 'mPhone', 'mTagged'],
      },
      mTotal: { key: 'mTotal', type: 'MetricCard', props: { label: 'Total Contacts', value: String(contacts.length), color: 'blue' } },
      mEmail: { key: 'mEmail', type: 'MetricCard', props: { label: 'With Email', value: String(withEmail), color: 'green' } },
      mPhone: { key: 'mPhone', type: 'MetricCard', props: { label: 'With Phone', value: String(withPhone), color: 'purple' } },
      mTagged: { key: 'mTagged', type: 'MetricCard', props: { label: 'Tagged', value: String(taggedCount), color: 'yellow' } },
      layout: {
        key: 'layout',
        type: 'SplitLayout',
        props: { ratio: '67/33', gap: 'md' },
        children: ['tableCard', 'sidebar'],
      },
      tableCard: {
        key: 'tableCard',
        type: 'Card',
        props: { title: `Contacts (${contacts.length})`, padding: 'none' },
        children: ['table'],
      },
      table: {
        key: 'table',
        type: 'DataTable',
        props: {
          columns: [
            { key: 'name', label: 'Name', format: 'avatar', sortable: true },
            { key: 'email', label: 'Email', format: 'email', sortable: true },
            { key: 'phone', label: 'Phone', format: 'phone' },
            { key: 'tags', label: 'Tags', format: 'tags' },
            { key: 'dateAdded', label: 'Added', format: 'date', sortable: true },
            { key: 'source', label: 'Source', format: 'text' },
          ],
          rows,
          selectable: true,
          emptyMessage: 'No contacts found',
          pageSize: 15,
        },
      },
      sidebar: {
        key: 'sidebar',
        type: 'Card',
        props: { title: 'Contact Insights' },
        children: ['sourceChart', 'completeness', 'summaryKV'],
      },
      sourceChart: {
        key: 'sourceChart',
        type: 'PieChart',
        props: {
          segments: sourceSegments.length > 0 ? sourceSegments : [{ label: 'No data', value: 1, color: '#94a3b8' }],
          donut: true,
          title: 'Contacts by Source',
          showLegend: true,
        },
      },
      completeness: {
        key: 'completeness',
        type: 'ProgressBar',
        props: {
          label: 'Email Completeness',
          value: contacts.length > 0 ? Math.round((withEmail / contacts.length) * 100) : 0,
          max: 100,
          color: contacts.length > 0 && (withEmail / contacts.length) >= 0.8 ? 'green' : 'yellow',
          showPercent: true,
        },
      },
      summaryKV: {
        key: 'summaryKV',
        type: 'KeyValueList',
        props: {
          items: [
            { label: 'Total Contacts', value: String(contacts.length), bold: true },
            { label: 'With Email', value: String(withEmail), variant: 'success' as const },
            { label: 'With Phone', value: String(withPhone), variant: 'success' as const },
            { label: 'Tagged', value: String(taggedCount) },
            { label: 'Sources', value: String(Object.keys(sourceCounts).length) },
          ],
          compact: true,
        },
      },
    },
  };
}
