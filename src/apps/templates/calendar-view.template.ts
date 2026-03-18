import { UITree } from '../types.js';

export function buildCalendarViewTree(data: {
  calendar: any;
  events: any[];
  startDate: string;
  endDate: string;
}): UITree {
  const calendar = data.calendar || {};
  const events = data.events || [];
  const fmtDate = (d: string) => d ? new Date(d).toLocaleDateString() : '—';

  // Map GHL events to CalendarView component events
  const calEvents = events.map((evt: any) => ({
    date: evt.startTime || evt.start || evt.date || '',
    title: evt.title || evt.name || 'Event',
    time: evt.startTime
      ? new Date(evt.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      : undefined,
    type: evt.appointmentStatus === 'confirmed' ? 'meeting' as const : 'event' as const,
    color: evt.appointmentStatus === 'cancelled' ? '#dc2626' : undefined,
  }));

  const start = new Date(data.startDate);
  const confirmedCount = events.filter((e: any) => e.appointmentStatus === 'confirmed').length;
  const cancelledCount = events.filter((e: any) => e.appointmentStatus === 'cancelled').length;
  const pendingCount = events.filter((e: any) => !e.appointmentStatus || e.appointmentStatus === 'pending' || e.appointmentStatus === 'new').length;
  const showRate = events.length > 0 ? Math.round((confirmedCount / events.length) * 100) : 0;

  // Status breakdown pie chart
  const statusSegments = [
    { label: 'Confirmed', value: confirmedCount, color: '#10b981' },
    { label: 'Pending', value: pendingCount, color: '#f59e0b' },
    { label: 'Cancelled', value: cancelledCount, color: '#ef4444' },
  ].filter(s => s.value > 0);

  // Events per day bar chart
  const dayBuckets: Record<string, number> = {};
  events.forEach((e: any) => {
    const d = e.startTime || e.start || e.date;
    if (d) {
      const day = new Date(d).toLocaleDateString(undefined, { weekday: 'short' });
      dayBuckets[day] = (dayBuckets[day] || 0) + 1;
    }
  });
  const dayBars = Object.entries(dayBuckets).slice(0, 7).map(([label, value]) => ({ label, value, color: '#3b82f6' }));

  return {
    root: 'page',
    elements: {
      page: {
        key: 'page',
        type: 'PageHeader',
        props: {
          title: calendar.name || 'Calendar',
          subtitle: `${events.length} events · ${confirmedCount} confirmed`,
          gradient: true,
          stats: [
            { label: 'Total Events', value: String(events.length) },
            { label: 'Confirmed', value: String(confirmedCount) },
            { label: 'Cancelled', value: String(cancelledCount) },
            { label: 'Show Rate', value: `${showRate}%` },
          ],
        },
        children: ['calActions', 'calSearch', 'metrics', 'mainLayout'],
      },
      calActions: {
        key: 'calActions',
        type: 'ActionBar',
        props: { align: 'right' },
        children: ['calCreateEventBtn', 'calCreateBlockBtn', 'calCreateCalBtn'],
      },
      calCreateEventBtn: {
        key: 'calCreateEventBtn',
        type: 'ActionButton',
        props: { label: 'Create Appointment', variant: 'primary', toolName: 'create_appointment', toolArgs: {} },
      },
      calCreateBlockBtn: {
        key: 'calCreateBlockBtn',
        type: 'ActionButton',
        props: { label: 'Block Slot', variant: 'secondary', toolName: 'create_block_slot', toolArgs: {} },
      },
      calCreateCalBtn: {
        key: 'calCreateCalBtn',
        type: 'ActionButton',
        props: { label: 'Create Calendar', variant: 'secondary', toolName: 'create_calendar', toolArgs: {} },
      },
      calSearch: {
        key: 'calSearch',
        type: 'SearchBar',
        props: { placeholder: 'Search events...', searchTool: 'get_calendar_events' },
      },
      metrics: {
        key: 'metrics',
        type: 'StatsGrid',
        props: { columns: 4 },
        children: ['mTotal', 'mConfirmed', 'mCancelled', 'mShowRate'],
      },
      mTotal: { key: 'mTotal', type: 'MetricCard', props: { label: 'Total Events', value: String(events.length), color: 'blue' } },
      mConfirmed: { key: 'mConfirmed', type: 'MetricCard', props: { label: 'Confirmed', value: String(confirmedCount), color: 'green' } },
      mCancelled: { key: 'mCancelled', type: 'MetricCard', props: { label: 'Cancelled', value: String(cancelledCount), color: 'red' } },
      mShowRate: { key: 'mShowRate', type: 'MetricCard', props: { label: 'Show Rate', value: `${showRate}%`, color: 'purple' } },
      mainLayout: {
        key: 'mainLayout',
        type: 'SplitLayout',
        props: { ratio: '67/33', gap: 'md' },
        children: ['calendarCard', 'sidePanel'],
      },
      calendarCard: {
        key: 'calendarCard',
        type: 'Card',
        props: { title: 'Calendar', padding: 'sm' },
        children: ['calendar'],
      },
      calendar: {
        key: 'calendar',
        type: 'CalendarView',
        props: {
          year: start.getFullYear(),
          month: start.getMonth() + 1,
          events: calEvents,
          highlightToday: true,
        },
      },
      sidePanel: {
        key: 'sidePanel',
        type: 'Card',
        props: { title: 'Event Insights' },
        children: ['showProgress', 'statusChart', 'calKV'],
      },
      showProgress: {
        key: 'showProgress',
        type: 'ProgressBar',
        props: {
          label: 'Show Rate',
          value: showRate,
          max: 100,
          color: showRate >= 80 ? 'green' : showRate >= 50 ? 'yellow' : 'red',
          showPercent: true,
        },
      },
      statusChart: {
        key: 'statusChart',
        type: 'PieChart',
        props: {
          segments: statusSegments.length > 0 ? statusSegments : [{ label: 'No events', value: 1, color: '#94a3b8' }],
          donut: true,
          title: 'Event Status',
          showLegend: true,
        },
      },
      calKV: {
        key: 'calKV',
        type: 'KeyValueList',
        props: {
          items: [
            { label: 'Calendar', value: calendar.name || '—', bold: true },
            { label: 'Total Events', value: String(events.length) },
            { label: 'Confirmed', value: String(confirmedCount), variant: 'success' as const },
            { label: 'Pending', value: String(pendingCount), variant: 'highlight' as const },
            { label: 'Cancelled', value: String(cancelledCount), variant: cancelledCount > 0 ? 'danger' as const : 'muted' as const },
            { label: 'Date Range', value: `${fmtDate(data.startDate)} – ${fmtDate(data.endDate)}` },
          ],
          compact: true,
        },
      },
    },
  };
}
