import { UITree } from '../types.js';

export function buildDashboardTree(data: {
  recentContacts: any[];
  pipelines: any[];
  calendars: any[];
  locationId: string;
}): UITree {
  const contacts = data.recentContacts || [];
  const pipelines = data.pipelines || [];
  const calendars = data.calendars || [];
  const fmtDate = (d: string) => d ? new Date(d).toLocaleDateString() : '—';

  const totalContacts = contacts.length;
  const totalPipelines = pipelines.length;
  const totalCalendars = calendars.length;
  const totalStages = pipelines.reduce((s: number, p: any) => s + (p.stages || []).length, 0);

  // Contact source breakdown for pie chart
  const sourceCounts: Record<string, number> = {};
  contacts.forEach((c: any) => {
    const src = c.source || 'Direct';
    sourceCounts[src] = (sourceCounts[src] || 0) + 1;
  });
  const sourceSegments = Object.entries(sourceCounts).slice(0, 5).map(([label, value], i) => ({
    label: label.charAt(0).toUpperCase() + label.slice(1),
    value,
    color: ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444'][i % 5],
  }));

  // Recent contacts table rows
  const contactRows = contacts.slice(0, 8).map((c: any) => ({
    id: c.id || '',
    name: `${c.firstName || ''} ${c.lastName || ''}`.trim() || 'Unknown',
    email: c.email || '—',
    phone: c.phone || '—',
    added: fmtDate(c.dateAdded),
    source: c.source || '—',
  }));

  // Pipeline summary rows
  const pipelineRows = pipelines.slice(0, 5).map((p: any) => ({
    id: p.id || '',
    name: p.name || 'Untitled',
    stages: (p.stages || []).length,
    status: 'active',
  }));

  // Pipeline stages bar chart
  const pipelineBars = pipelines.slice(0, 6).map((p: any) => ({
    label: (p.name || 'Pipeline').slice(0, 15),
    value: (p.stages || []).length,
    color: '#3b82f6',
  })).filter((b: any) => b.value > 0);

  return {
    root: 'page',
    elements: {
      page: {
        key: 'page',
        type: 'PageHeader',
        props: {
          title: 'GHL Dashboard',
          subtitle: 'CRM Overview',
          gradient: true,
          stats: [
            { label: 'Contacts', value: String(totalContacts) },
            { label: 'Pipelines', value: String(totalPipelines) },
            { label: 'Calendars', value: String(totalCalendars) },
            { label: 'Stages', value: String(totalStages) },
          ],
        },
        children: ['dashActions', 'dashSearch', 'metrics', 'layout'],
      },
      dashActions: {
        key: 'dashActions',
        type: 'ActionBar',
        props: { align: 'right' },
        children: ['dashCreateContactBtn', 'dashCreateOppBtn'],
      },
      dashCreateContactBtn: {
        key: 'dashCreateContactBtn',
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
      dashCreateOppBtn: {
        key: 'dashCreateOppBtn',
        type: 'FormGroup',
        props: {
          submitTool: 'create_opportunity',
          submitLabel: '+ Create Opportunity',
          fields: [
            { key: 'name', label: 'Opportunity Name', type: 'text', placeholder: 'New Deal', required: true },
            { key: 'pipelineId', label: 'Pipeline ID', type: 'text', placeholder: 'Pipeline ID', required: true },
            { key: 'contactId', label: 'Contact ID', type: 'text', placeholder: 'Contact ID', required: true },
            { key: 'monetaryValue', label: 'Value ($)', type: 'number', placeholder: '0' },
            { key: 'status', label: 'Status', type: 'select', options: [
              { label: 'Open', value: 'open' },
              { label: 'Won', value: 'won' },
              { label: 'Lost', value: 'lost' },
            ]},
          ],
        },
      },
      dashSearch: {
        key: 'dashSearch',
        type: 'SearchBar',
        props: { placeholder: 'Search contacts...', searchTool: 'search_contacts' },
      },
      metrics: {
        key: 'metrics',
        type: 'StatsGrid',
        props: { columns: 4 },
        children: ['mContacts', 'mPipelines', 'mCalendars', 'mStages'],
      },
      mContacts: { key: 'mContacts', type: 'MetricCard', props: { label: 'Contacts', value: String(totalContacts), color: 'blue', trend: totalContacts > 0 ? 'up' : 'flat' } },
      mPipelines: { key: 'mPipelines', type: 'MetricCard', props: { label: 'Pipelines', value: String(totalPipelines), color: 'purple' } },
      mCalendars: { key: 'mCalendars', type: 'MetricCard', props: { label: 'Calendars', value: String(totalCalendars), color: 'green' } },
      mStages: { key: 'mStages', type: 'MetricCard', props: { label: 'Total Stages', value: String(totalStages), color: 'yellow' } },
      layout: {
        key: 'layout',
        type: 'SplitLayout',
        props: { ratio: '67/33', gap: 'md' },
        children: ['leftCol', 'rightCol'],
      },
      leftCol: {
        key: 'leftCol',
        type: 'Card',
        props: { title: 'Recent Contacts', padding: 'none' },
        children: ['contactsTable', 'pipelinesTable'],
      },
      contactsTable: {
        key: 'contactsTable',
        type: 'DataTable',
        props: {
          columns: [
            { key: 'name', label: 'Name', format: 'avatar', sortable: true },
            { key: 'email', label: 'Email', format: 'email' },
            { key: 'phone', label: 'Phone', format: 'phone' },
            { key: 'source', label: 'Source', format: 'text' },
            { key: 'added', label: 'Added', format: 'date' },
          ],
          rows: contactRows,
          emptyMessage: 'No contacts yet',
          pageSize: 8,
        },
      },
      pipelinesTable: {
        key: 'pipelinesTable',
        type: 'DataTable',
        props: {
          columns: [
            { key: 'name', label: 'Pipeline', format: 'text' },
            { key: 'stages', label: 'Stages', format: 'text' },
            { key: 'status', label: 'Status', format: 'status' },
          ],
          rows: pipelineRows,
          emptyMessage: 'No pipelines',
          pageSize: 5,
        },
      },
      rightCol: {
        key: 'rightCol',
        type: 'Card',
        props: { title: 'Insights' },
        children: ['sourceChart', 'pipelineChart', 'summaryKV'],
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
      pipelineChart: {
        key: 'pipelineChart',
        type: 'BarChart',
        props: {
          bars: pipelineBars.length > 0 ? pipelineBars : [{ label: 'No pipelines', value: 0 }],
          orientation: 'horizontal',
          showValues: true,
          title: 'Stages per Pipeline',
        },
      },
      summaryKV: {
        key: 'summaryKV',
        type: 'KeyValueList',
        props: {
          items: [
            { label: 'Total Contacts', value: String(totalContacts), bold: true },
            { label: 'Pipelines', value: String(totalPipelines) },
            { label: 'Calendars', value: String(totalCalendars) },
            { label: 'Contact Sources', value: String(Object.keys(sourceCounts).length) },
            { label: 'Location ID', value: data.locationId || '—', variant: 'muted' as const },
          ],
          compact: true,
        },
      },
    },
  };
}
