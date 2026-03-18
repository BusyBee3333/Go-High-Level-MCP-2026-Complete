import { UITree } from '../types.js';

export function buildAgentStatsTree(data: {
  userId?: string;
  dateRange: string;
  location: any;
  locationId: string;
}): UITree {
  const location = data.location || {};
  const locName = location.name || 'Location';
  const fmtDate = (d: string) => d ? new Date(d).toLocaleDateString() : '—';

  const dateRangeLabel =
    data.dateRange === 'last7days' ? 'Last 7 Days'
    : data.dateRange === 'last30days' ? 'Last 30 Days'
    : data.dateRange === 'last90days' ? 'Last 90 Days'
    : data.dateRange || 'Last 30 Days';

  // Activity type bar chart
  const activityBars = [
    { label: 'Calls', value: 0, color: '#3b82f6' },
    { label: 'Emails', value: 0, color: '#8b5cf6' },
    { label: 'SMS', value: 0, color: '#10b981' },
    { label: 'Tasks', value: 0, color: '#f59e0b' },
  ];

  return {
    root: 'page',
    elements: {
      page: {
        key: 'page',
        type: 'PageHeader',
        props: {
          title: data.userId ? `Agent: ${data.userId}` : 'Agent Overview',
          subtitle: `${locName} · ${dateRangeLabel}`,
          gradient: true,
          stats: [
            { label: 'Location', value: locName },
            { label: 'Period', value: dateRangeLabel },
            { label: 'Agent', value: data.userId || 'All' },
          ],
        },
        children: ['agentActions', 'metrics', 'layout'],
      },
      agentActions: {
        key: 'agentActions',
        type: 'ActionBar',
        props: { align: 'right' },
        children: ['agentReportBtn', 'agentEmailReportBtn'],
      },
      agentReportBtn: {
        key: 'agentReportBtn',
        type: 'ActionButton',
        props: { label: 'Agent Reports', variant: 'primary', toolName: 'get_agent_reports', toolArgs: {} },
      },
      agentEmailReportBtn: {
        key: 'agentEmailReportBtn',
        type: 'ActionButton',
        props: { label: 'Email Reports', variant: 'secondary', toolName: 'get_email_reports', toolArgs: {} },
      },
      metrics: {
        key: 'metrics',
        type: 'StatsGrid',
        props: { columns: 4 },
        children: ['mTotal', 'mActive', 'mRes', 'mAvg'],
      },
      mTotal: { key: 'mTotal', type: 'MetricCard', props: { label: 'Total Interactions', value: '—', color: 'blue' } },
      mActive: { key: 'mActive', type: 'MetricCard', props: { label: 'Active Contacts', value: '—', color: 'green' } },
      mRes: { key: 'mRes', type: 'MetricCard', props: { label: 'Response Rate', value: '—', color: 'purple' } },
      mAvg: { key: 'mAvg', type: 'MetricCard', props: { label: 'Avg Response Time', value: '—', color: 'yellow' } },
      layout: {
        key: 'layout',
        type: 'SplitLayout',
        props: { ratio: '67/33', gap: 'md' },
        children: ['leftCol', 'sidePanel'],
      },
      leftCol: {
        key: 'leftCol',
        type: 'Card',
        props: { title: 'Activity Overview', padding: 'sm' },
        children: ['chart', 'activityTable'],
      },
      chart: {
        key: 'chart',
        type: 'LineChart',
        props: {
          points: [
            { label: 'Mon', value: 0 },
            { label: 'Tue', value: 0 },
            { label: 'Wed', value: 0 },
            { label: 'Thu', value: 0 },
            { label: 'Fri', value: 0 },
          ],
          title: 'Activity Trend',
          showPoints: true,
          showArea: true,
          yAxisLabel: 'Interactions',
        },
      },
      activityTable: {
        key: 'activityTable',
        type: 'DataTable',
        props: {
          columns: [
            { key: 'type', label: 'Activity', format: 'text' },
            { key: 'count', label: 'Count', format: 'text', sortable: true },
            { key: 'trend', label: 'Trend', format: 'text' },
          ],
          rows: [
            { type: 'Calls', count: '—', trend: '—' },
            { type: 'Emails', count: '—', trend: '—' },
            { type: 'SMS', count: '—', trend: '—' },
            { type: 'Tasks', count: '—', trend: '—' },
          ],
          emptyMessage: 'No activity data available',
          pageSize: 10,
        },
      },
      sidePanel: {
        key: 'sidePanel',
        type: 'Card',
        props: { title: 'Agent Analytics' },
        children: ['activityBarChart', 'agentKV'],
      },
      activityBarChart: {
        key: 'activityBarChart',
        type: 'BarChart',
        props: {
          bars: activityBars,
          orientation: 'horizontal',
          showValues: true,
          title: 'Activity by Type',
        },
      },
      agentKV: {
        key: 'agentKV',
        type: 'KeyValueList',
        props: {
          items: [
            { label: 'Agent', value: data.userId || 'All Agents', bold: true },
            { label: 'Location', value: locName },
            { label: 'Period', value: dateRangeLabel },
            { label: 'Location ID', value: data.locationId || '—', variant: 'muted' as const },
            { label: 'Interactions', value: '—' },
            { label: 'Response Rate', value: '—' },
          ],
          compact: true,
        },
      },
    },
  };
}
