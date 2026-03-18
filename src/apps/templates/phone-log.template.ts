import { UITree } from '../types.js';

export function buildPhoneLogTree(data: {
  calls: any[];
  phoneNumbers: any[];
}): UITree {
  const calls = data.calls || [];
  const phoneNumbers = data.phoneNumbers || [];
  const fmtDate = (d: string) => d ? new Date(d).toLocaleDateString() : '—';

  const totalCalls = calls.length;
  const inbound = calls.filter((c: any) => c.direction === 'inbound').length;
  const outbound = calls.filter((c: any) => c.direction === 'outbound').length;
  const answered = calls.filter((c: any) => c.status === 'completed' || c.status === 'answered').length;
  const missed = calls.filter((c: any) => c.status === 'missed' || c.status === 'no-answer').length;
  const totalDuration = calls.reduce((s: number, c: any) => s + (c.duration || 0), 0);
  const avgDuration = totalCalls > 0 ? Math.round(totalDuration / totalCalls) : 0;
  const answerRate = totalCalls > 0 ? Math.round((answered / totalCalls) * 100) : 0;

  const callRows = calls.slice(0, 10).map((c: any) => ({
    id: c.id || '',
    contact: c.contactName || c.from || c.to || 'Unknown',
    direction: c.direction || 'outbound',
    status: c.status || 'completed',
    duration: c.duration ? `${Math.floor(c.duration / 60)}m ${c.duration % 60}s` : '—',
    date: fmtDate(c.dateAdded || c.createdAt),
    phone: c.from || c.to || '—',
  }));

  const bars = [
    { label: 'Inbound', value: inbound, color: '#3b82f6' },
    { label: 'Outbound', value: outbound, color: '#7c3aed' },
    { label: 'Answered', value: answered, color: '#059669' },
    { label: 'Missed', value: missed, color: '#dc2626' },
  ].filter(b => b.value > 0);

  return {
    root: 'page',
    elements: {
      page: {
        key: 'page',
        type: 'PageHeader',
        props: {
          title: 'Phone Log',
          subtitle: `${totalCalls} calls · ${phoneNumbers.length} numbers`,
          gradient: true,
          stats: [
            { label: 'Total Calls', value: String(totalCalls) },
            { label: 'Inbound', value: String(inbound) },
            { label: 'Outbound', value: String(outbound) },
            { label: 'Avg Duration', value: `${avgDuration}s` },
          ],
        },
        children: ['phoneActions', 'phoneSearch', 'metrics', 'layout'],
      },
      phoneActions: {
        key: 'phoneActions',
        type: 'ActionBar',
        props: { align: 'right' },
        children: ['phoneCallBtn', 'phoneSearchNumBtn'],
      },
      phoneCallBtn: {
        key: 'phoneCallBtn',
        type: 'ActionButton',
        props: { label: 'New Outbound Call', variant: 'primary', toolName: 'add_outbound_call', toolArgs: {} },
      },
      phoneSearchNumBtn: {
        key: 'phoneSearchNumBtn',
        type: 'ActionButton',
        props: { label: 'Search Numbers', variant: 'secondary', toolName: 'search_available_numbers', toolArgs: {} },
      },
      phoneSearch: {
        key: 'phoneSearch',
        type: 'SearchBar',
        props: { placeholder: 'Search call logs...', searchTool: 'get_call_reports' },
      },
      metrics: {
        key: 'metrics',
        type: 'StatsGrid',
        props: { columns: 4 },
        children: ['mTotal', 'mAnswered', 'mMissed', 'mDuration'],
      },
      mTotal: { key: 'mTotal', type: 'MetricCard', props: { label: 'Total Calls', value: String(totalCalls), color: 'blue' } },
      mAnswered: { key: 'mAnswered', type: 'MetricCard', props: { label: 'Answered', value: String(answered), color: 'green' } },
      mMissed: { key: 'mMissed', type: 'MetricCard', props: { label: 'Missed', value: String(missed), color: 'red' } },
      mDuration: { key: 'mDuration', type: 'MetricCard', props: { label: 'Avg Duration', value: `${avgDuration}s`, color: 'purple' } },
      layout: {
        key: 'layout',
        type: 'SplitLayout',
        props: { ratio: '67/33', gap: 'md' },
        children: ['callTableCard', 'sidePanel'],
      },
      callTableCard: {
        key: 'callTableCard',
        type: 'Card',
        props: { title: `Call History (${totalCalls})`, padding: 'none' },
        children: ['callTable'],
      },
      callTable: {
        key: 'callTable',
        type: 'DataTable',
        props: {
          columns: [
            { key: 'contact', label: 'Contact', format: 'avatar', sortable: true },
            { key: 'direction', label: 'Direction', format: 'status' },
            { key: 'status', label: 'Status', format: 'status' },
            { key: 'duration', label: 'Duration', format: 'text' },
            { key: 'date', label: 'Date', format: 'date', sortable: true },
          ],
          rows: callRows,
          emptyMessage: 'No call history',
          pageSize: 10,
        },
      },
      sidePanel: {
        key: 'sidePanel',
        type: 'Card',
        props: { title: 'Call Analytics' },
        children: ['answerProgress', 'chart', 'callKV'],
      },
      answerProgress: {
        key: 'answerProgress',
        type: 'ProgressBar',
        props: {
          label: 'Answer Rate',
          value: answerRate,
          max: 100,
          color: answerRate >= 80 ? 'green' : answerRate >= 50 ? 'yellow' : 'red',
          showPercent: true,
        },
      },
      chart: {
        key: 'chart',
        type: 'BarChart',
        props: { bars: bars.length > 0 ? bars : [{ label: 'No data', value: 0 }], orientation: 'horizontal', showValues: true, title: 'Call Breakdown' },
      },
      callKV: {
        key: 'callKV',
        type: 'KeyValueList',
        props: {
          items: [
            { label: 'Total Calls', value: String(totalCalls), bold: true },
            { label: 'Inbound', value: String(inbound) },
            { label: 'Outbound', value: String(outbound) },
            { label: 'Answered', value: String(answered), variant: 'success' as const },
            { label: 'Missed', value: String(missed), variant: missed > 0 ? 'danger' as const : 'muted' as const },
            { label: 'Phone Numbers', value: String(phoneNumbers.length) },
            { label: 'Total Duration', value: `${Math.floor(totalDuration / 60)}m ${totalDuration % 60}s` },
          ],
          compact: true,
        },
      },
    },
  };
}
