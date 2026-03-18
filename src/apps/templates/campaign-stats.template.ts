import { UITree } from '../types.js';

export function buildCampaignStatsTree(data: {
  campaign: any;
  campaigns: any[];
  campaignId: string;
  locationId: string;
}): UITree {
  const campaign = data.campaign || {};
  const campaigns = data.campaigns || [];
  const fmtDate = (d: string) => d ? new Date(d).toLocaleDateString() : '—';

  const stats = campaign.statistics || campaign.stats || {};
  const sent = stats.sent || stats.delivered || 0;
  const opened = stats.opened || stats.opens || 0;
  const clicked = stats.clicked || stats.clicks || 0;
  const bounced = stats.bounced || stats.bounces || 0;
  const unsubscribed = stats.unsubscribed || stats.unsubscribes || 0;
  const openRate = sent > 0 ? ((opened / sent) * 100).toFixed(1) : '0.0';
  const clickRate = sent > 0 ? ((clicked / sent) * 100).toFixed(1) : '0.0';
  const bounceRate = sent > 0 ? ((bounced / sent) * 100).toFixed(1) : '0.0';
  const delivered = Math.max(0, sent - bounced);

  // Bar chart of performance metrics
  const bars = [
    { label: 'Sent', value: sent, color: '#3b82f6' },
    { label: 'Opened', value: opened, color: '#059669' },
    { label: 'Clicked', value: clicked, color: '#7c3aed' },
    { label: 'Bounced', value: bounced, color: '#f59e0b' },
    { label: 'Unsubscribed', value: unsubscribed, color: '#dc2626' },
  ].filter(b => b.value > 0);

  // Delivery pie chart
  const deliverySegments = [
    { label: 'Opened', value: opened, color: '#10b981' },
    { label: 'Unopened', value: Math.max(0, delivered - opened), color: '#94a3b8' },
    { label: 'Bounced', value: bounced, color: '#ef4444' },
  ].filter(s => s.value > 0);

  // Other campaigns table
  const campaignRows = campaigns.slice(0, 8).map((c: any) => ({
    id: c.id || '',
    name: c.name || 'Untitled',
    status: c.status || 'draft',
    sent: c.statistics?.sent || 0,
    opens: c.statistics?.opened || 0,
    date: fmtDate(c.createdAt || c.sentAt),
  }));

  return {
    root: 'page',
    elements: {
      page: {
        key: 'page',
        type: 'PageHeader',
        props: {
          title: campaign.name || 'Campaign',
          subtitle: campaign.subject || 'Email Campaign',
          status: campaign.status || 'draft',
          statusVariant: campaign.status === 'completed' ? 'complete' : campaign.status === 'active' ? 'active' : 'draft',
          gradient: true,
          stats: [
            { label: 'Sent', value: sent.toLocaleString() },
            { label: 'Open Rate', value: `${openRate}%` },
            { label: 'Click Rate', value: `${clickRate}%` },
            { label: 'Bounced', value: bounced.toLocaleString() },
          ],
        },
        children: ['campActions', 'metrics', 'layout'],
      },
      campActions: {
        key: 'campActions',
        type: 'ActionBar',
        props: { align: 'right' },
        children: ['campCreateBtn', 'campPauseBtn', 'campResumeBtn'],
      },
      campCreateBtn: {
        key: 'campCreateBtn',
        type: 'ActionButton',
        props: { label: 'Create Campaign', variant: 'primary', toolName: 'create_campaign', toolArgs: {} },
      },
      campPauseBtn: {
        key: 'campPauseBtn',
        type: 'ActionButton',
        props: { label: 'Pause Campaign', variant: 'secondary', toolName: 'pause_campaign', toolArgs: { campaignId: data.campaignId || '' } },
      },
      campResumeBtn: {
        key: 'campResumeBtn',
        type: 'ActionButton',
        props: { label: 'Resume Campaign', variant: 'secondary', toolName: 'resume_campaign', toolArgs: { campaignId: data.campaignId || '' } },
      },
      metrics: {
        key: 'metrics',
        type: 'StatsGrid',
        props: { columns: 4 },
        children: ['mSent', 'mOpened', 'mClicked', 'mBounced'],
      },
      mSent: { key: 'mSent', type: 'MetricCard', props: { label: 'Sent', value: sent.toLocaleString(), color: 'blue' } },
      mOpened: { key: 'mOpened', type: 'MetricCard', props: { label: 'Opened', value: opened.toLocaleString(), color: 'green', trend: Number(openRate) >= 20 ? 'up' : 'down' } },
      mClicked: { key: 'mClicked', type: 'MetricCard', props: { label: 'Clicked', value: clicked.toLocaleString(), color: 'purple' } },
      mBounced: { key: 'mBounced', type: 'MetricCard', props: { label: 'Bounced', value: bounced.toLocaleString(), color: 'yellow' } },
      layout: {
        key: 'layout',
        type: 'SplitLayout',
        props: { ratio: '67/33', gap: 'md' },
        children: ['leftCol', 'sidePanel'],
      },
      leftCol: {
        key: 'leftCol',
        type: 'Card',
        props: { title: 'Campaign Performance', padding: 'sm' },
        children: ['chart', 'campaignTable'],
      },
      chart: {
        key: 'chart',
        type: 'BarChart',
        props: {
          bars: bars.length > 0 ? bars : [{ label: 'No data', value: 0 }],
          orientation: 'horizontal',
          showValues: true,
          title: 'Performance Breakdown',
        },
      },
      campaignTable: {
        key: 'campaignTable',
        type: 'DataTable',
        props: {
          columns: [
            { key: 'name', label: 'Campaign', format: 'text', sortable: true },
            { key: 'status', label: 'Status', format: 'status' },
            { key: 'sent', label: 'Sent', format: 'text', sortable: true },
            { key: 'opens', label: 'Opens', format: 'text' },
            { key: 'date', label: 'Date', format: 'date' },
          ],
          rows: campaignRows,
          emptyMessage: 'No other campaigns',
          pageSize: 8,
        },
      },
      sidePanel: {
        key: 'sidePanel',
        type: 'Card',
        props: { title: 'Campaign Analytics' },
        children: ['openProgress', 'clickProgress', 'deliveryChart', 'campKV'],
      },
      openProgress: {
        key: 'openProgress',
        type: 'ProgressBar',
        props: {
          label: 'Open Rate',
          value: Number(openRate),
          max: 100,
          color: Number(openRate) >= 25 ? 'green' : Number(openRate) >= 15 ? 'yellow' : 'red',
          showPercent: true,
          benchmark: 20,
          benchmarkLabel: 'Industry avg',
        },
      },
      clickProgress: {
        key: 'clickProgress',
        type: 'ProgressBar',
        props: {
          label: 'Click Rate',
          value: Number(clickRate),
          max: 100,
          color: Number(clickRate) >= 3 ? 'green' : Number(clickRate) >= 1 ? 'yellow' : 'red',
          showPercent: true,
        },
      },
      deliveryChart: {
        key: 'deliveryChart',
        type: 'PieChart',
        props: {
          segments: deliverySegments.length > 0 ? deliverySegments : [{ label: 'No data', value: 1, color: '#94a3b8' }],
          donut: true,
          title: 'Delivery Breakdown',
          showLegend: true,
        },
      },
      campKV: {
        key: 'campKV',
        type: 'KeyValueList',
        props: {
          items: [
            { label: 'Campaign', value: campaign.name || '—', bold: true },
            { label: 'Status', value: (campaign.status || 'draft').charAt(0).toUpperCase() + (campaign.status || 'draft').slice(1) },
            { label: 'Sent', value: sent.toLocaleString() },
            { label: 'Delivered', value: delivered.toLocaleString(), variant: 'success' as const },
            { label: 'Open Rate', value: `${openRate}%`, variant: 'highlight' as const },
            { label: 'Click Rate', value: `${clickRate}%` },
            { label: 'Bounce Rate', value: `${bounceRate}%`, variant: Number(bounceRate) > 5 ? 'danger' as const : 'muted' as const },
            { label: 'Unsubscribed', value: String(unsubscribed), variant: unsubscribed > 0 ? 'danger' as const : 'muted' as const },
          ],
          compact: true,
        },
      },
    },
  };
}
