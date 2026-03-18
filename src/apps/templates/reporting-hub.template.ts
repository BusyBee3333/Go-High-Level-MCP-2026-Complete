import { UITree } from '../types.js';

export function buildReportingHubTree(data: {
  reports: any[];
  widgets: any[];
}): UITree {
  const reports = data.reports || [];
  const widgets = data.widgets || [];
  const fmtDate = (d: string) => d ? new Date(d).toLocaleDateString() : '—';

  const totalReports = reports.length;
  const scheduled = reports.filter((r: any) => r.scheduled || r.schedule).length;
  const totalWidgets = widgets.length;
  const activeReports = reports.filter((r: any) => r.status === 'active').length;

  const reportRows = reports.slice(0, 10).map((r: any) => ({
    id: r.id || '',
    name: r.name || r.title || 'Untitled Report',
    type: r.type || r.category || 'general',
    schedule: r.schedule || (r.scheduled ? 'Scheduled' : 'Manual'),
    lastRun: fmtDate(r.lastRunAt || r.updatedAt),
    status: r.status || 'active',
  }));

  // Chart data from widgets
  const chartPoints = (widgets[0]?.data || []).slice(0, 7).map((d: any, i: number) => ({
    label: d.label || d.date || `Day ${i + 1}`,
    value: d.value || d.count || 0,
  }));

  const pieSegments = (widgets[1]?.data || reports.slice(0, 4)).map((d: any, i: number) => ({
    label: d.label || d.name || d.type || 'Other',
    value: d.value || d.count || 1,
    color: ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b'][i % 4],
  }));

  // Report type distribution
  const typeCounts: Record<string, number> = {};
  reports.forEach((r: any) => {
    const t = r.type || r.category || 'general';
    typeCounts[t] = (typeCounts[t] || 0) + 1;
  });
  const typeBars = Object.entries(typeCounts).slice(0, 6).map(([label, value]) => ({
    label: label.charAt(0).toUpperCase() + label.slice(1),
    value,
    color: '#3b82f6',
  }));

  return {
    root: 'page',
    elements: {
      page: {
        key: 'page',
        type: 'PageHeader',
        props: {
          title: 'Reporting Hub',
          subtitle: `${totalReports} reports · ${totalWidgets} widgets`,
          gradient: true,
          stats: [
            { label: 'Reports', value: String(totalReports) },
            { label: 'Scheduled', value: String(scheduled) },
            { label: 'Widgets', value: String(totalWidgets) },
            { label: 'Active', value: String(activeReports) },
          ],
        },
        children: ['reportActions', 'metrics', 'layout'],
      },
      reportActions: {
        key: 'reportActions',
        type: 'ActionBar',
        props: { align: 'right' },
        children: ['reportDashboardBtn', 'reportAttributionBtn', 'reportCallBtn'],
      },
      reportDashboardBtn: {
        key: 'reportDashboardBtn',
        type: 'ActionButton',
        props: { label: 'Dashboard Stats', variant: 'primary', toolName: 'get_dashboard_stats', toolArgs: {} },
      },
      reportAttributionBtn: {
        key: 'reportAttributionBtn',
        type: 'ActionButton',
        props: { label: 'Attribution Report', variant: 'secondary', toolName: 'get_attribution_report', toolArgs: {} },
      },
      reportCallBtn: {
        key: 'reportCallBtn',
        type: 'ActionButton',
        props: { label: 'Call Reports', variant: 'secondary', toolName: 'get_call_reports', toolArgs: {} },
      },
      metrics: {
        key: 'metrics',
        type: 'StatsGrid',
        props: { columns: 4 },
        children: ['mReports', 'mScheduled', 'mWidgets', 'mActive'],
      },
      mReports: { key: 'mReports', type: 'MetricCard', props: { label: 'Reports', value: String(totalReports), color: 'blue' } },
      mScheduled: { key: 'mScheduled', type: 'MetricCard', props: { label: 'Scheduled', value: String(scheduled), color: 'green' } },
      mWidgets: { key: 'mWidgets', type: 'MetricCard', props: { label: 'Widgets', value: String(totalWidgets), color: 'purple' } },
      mActive: { key: 'mActive', type: 'MetricCard', props: { label: 'Active', value: String(activeReports), color: 'yellow' } },
      layout: {
        key: 'layout',
        type: 'SplitLayout',
        props: { ratio: '67/33', gap: 'md' },
        children: ['leftCol', 'sidePanel'],
      },
      leftCol: {
        key: 'leftCol',
        type: 'Card',
        props: { title: 'Reports & Trends', padding: 'sm' },
        children: ['lineChart', 'reportTable'],
      },
      lineChart: {
        key: 'lineChart',
        type: 'LineChart',
        props: {
          points: chartPoints.length > 0 ? chartPoints : [
            { label: 'Mon', value: 45 }, { label: 'Tue', value: 62 },
            { label: 'Wed', value: 38 }, { label: 'Thu', value: 71 },
            { label: 'Fri', value: 54 },
          ],
          title: 'Activity Trend',
          showPoints: true,
          showArea: true,
        },
      },
      reportTable: {
        key: 'reportTable',
        type: 'DataTable',
        props: {
          columns: [
            { key: 'name', label: 'Report', format: 'text', sortable: true },
            { key: 'type', label: 'Type', format: 'status' },
            { key: 'schedule', label: 'Schedule', format: 'text' },
            { key: 'lastRun', label: 'Last Run', format: 'date', sortable: true },
            { key: 'status', label: 'Status', format: 'status' },
          ],
          rows: reportRows,
          emptyMessage: 'No reports configured',
          pageSize: 10,
        },
      },
      sidePanel: {
        key: 'sidePanel',
        type: 'Card',
        props: { title: 'Report Analytics' },
        children: ['pieChart', 'typeChart', 'reportKV'],
      },
      pieChart: {
        key: 'pieChart',
        type: 'PieChart',
        props: {
          segments: pieSegments.length > 0 ? pieSegments : [
            { label: 'Contacts', value: 40, color: '#3b82f6' },
            { label: 'Deals', value: 30, color: '#8b5cf6' },
            { label: 'Tasks', value: 20, color: '#10b981' },
            { label: 'Other', value: 10, color: '#f59e0b' },
          ],
          donut: true,
          title: 'Data Distribution',
          showLegend: true,
        },
      },
      typeChart: {
        key: 'typeChart',
        type: 'BarChart',
        props: {
          bars: typeBars.length > 0 ? typeBars : [{ label: 'No types', value: 0 }],
          orientation: 'horizontal',
          showValues: true,
          title: 'Reports by Type',
        },
      },
      reportKV: {
        key: 'reportKV',
        type: 'KeyValueList',
        props: {
          items: [
            { label: 'Total Reports', value: String(totalReports), bold: true },
            { label: 'Scheduled', value: String(scheduled), variant: 'highlight' as const },
            { label: 'Active', value: String(activeReports), variant: 'success' as const },
            { label: 'Widgets', value: String(totalWidgets) },
            { label: 'Report Types', value: String(Object.keys(typeCounts).length) },
          ],
          compact: true,
        },
      },
    },
  };
}
