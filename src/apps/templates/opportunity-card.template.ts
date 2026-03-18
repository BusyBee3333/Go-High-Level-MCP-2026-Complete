import { UITree } from '../types.js';

export function buildOpportunityCardTree(data: any): UITree {
  const opp = data || {};
  const contact = opp.contact || {};
  const contactName = contact.name || `${contact.firstName || ''} ${contact.lastName || ''}`.trim() || 'Unknown';
  const monetaryValue = opp.monetaryValue || 0;
  const fmt = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);
  const fmtDate = (d: string) => d ? new Date(d).toLocaleDateString() : '—';

  const kvItems = [
    { label: 'Contact', value: contactName },
    { label: 'Email', value: contact.email || '—' },
    { label: 'Phone', value: contact.phone || '—' },
    { label: 'Value', value: fmt(monetaryValue), bold: true },
    { label: 'Status', value: (opp.status || 'open').charAt(0).toUpperCase() + (opp.status || 'open').slice(1) },
    { label: 'Source', value: opp.source || '—' },
    { label: 'Created', value: fmtDate(opp.createdAt) },
    { label: 'Updated', value: fmtDate(opp.updatedAt) },
  ];

  // Build timeline from available data
  const timelineEvents: any[] = [];
  if (opp.createdAt) {
    timelineEvents.push({
      id: 'created',
      title: 'Opportunity Created',
      description: `Created with value ${fmt(monetaryValue)}`,
      timestamp: new Date(opp.createdAt).toLocaleString(),
      icon: 'system',
      variant: 'default',
    });
  }
  if (opp.updatedAt && opp.updatedAt !== opp.createdAt) {
    timelineEvents.push({
      id: 'updated',
      title: 'Last Updated',
      description: `Status: ${opp.status || 'open'}`,
      timestamp: new Date(opp.updatedAt).toLocaleString(),
      icon: 'note',
      variant: 'success',
    });
  }
  if (opp.lastStatusChangeAt) {
    timelineEvents.push({
      id: 'status-change',
      title: 'Status Changed',
      description: `Changed to ${opp.status || 'open'}`,
      timestamp: new Date(opp.lastStatusChangeAt).toLocaleString(),
      icon: 'task',
      variant: opp.status === 'won' ? 'success' : opp.status === 'lost' ? 'error' : 'default',
    });
  }

  // Value comparison bar chart
  const valueBars = [
    { label: 'Deal Value', value: monetaryValue, color: '#3b82f6' },
  ];
  if (opp.expectedValue) valueBars.push({ label: 'Expected', value: opp.expectedValue, color: '#10b981' });

  const elements: UITree['elements'] = {
    page: {
      key: 'page',
      type: 'DetailHeader',
      props: {
        title: opp.name || 'Untitled Opportunity',
        subtitle: contactName,
        entityId: opp.id || '—',
        status: opp.status || 'open',
        statusVariant: opp.status || 'open',
      },
      children: ['actions', 'layout'],
    },
    actions: {
      key: 'actions',
      type: 'ActionBar',
      props: { align: 'right' },
      children: ['editBtn', 'statusBtn'],
    },
    editBtn: {
      key: 'editBtn',
      type: 'ActionButton',
      props: {
        label: 'Edit',
        variant: 'secondary',
        size: 'sm',
        toolName: 'update_opportunity',
        toolArgs: { opportunityId: opp.id || '' },
      },
    },
    statusBtn: {
      key: 'statusBtn',
      type: 'ActionButton',
      props: {
        label: opp.status === 'won' ? 'Reopen' : 'Mark Won',
        variant: 'primary',
        size: 'sm',
        toolName: 'update_opportunity',
        toolArgs: {
          opportunityId: opp.id || '',
          status: opp.status === 'won' ? 'open' : 'won',
        },
      },
    },
    layout: {
      key: 'layout',
      type: 'SplitLayout',
      props: { ratio: '50/50', gap: 'md' },
      children: ['leftCol', 'rightCol'],
    },
    leftCol: {
      key: 'leftCol',
      type: 'Card',
      props: { title: 'Opportunity Details' },
      children: ['details', 'valueChart'],
    },
    details: {
      key: 'details',
      type: 'KeyValueList',
      props: { items: kvItems, compact: true },
    },
    valueChart: {
      key: 'valueChart',
      type: 'BarChart',
      props: {
        bars: valueBars,
        orientation: 'horizontal',
        showValues: true,
        title: 'Deal Value',
      },
    },
    rightCol: {
      key: 'rightCol',
      type: 'Card',
      props: { title: 'Activity', padding: 'sm' },
      children: ['timeline'],
    },
    timeline: {
      key: 'timeline',
      type: 'Timeline',
      props: {
        events: timelineEvents.length > 0 ? timelineEvents : [
          {
            id: 'placeholder',
            title: 'No activity recorded',
            description: 'Activity will appear here as events are logged',
            timestamp: new Date().toLocaleString(),
            icon: 'system',
          },
        ],
      },
    },
  };

  return { root: 'page', elements };
}
