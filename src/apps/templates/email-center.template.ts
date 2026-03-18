import { UITree } from '../types.js';

export function buildEmailCenterTree(data: {
  emails: any[];
  templates: any[];
}): UITree {
  const emails = data.emails || [];
  const templates = data.templates || [];

  const totalEmails = emails.length;
  const sent = emails.filter((e: any) => e.status === 'sent' || e.status === 'delivered').length;
  const opened = emails.filter((e: any) => e.opened || e.status === 'opened').length;
  const bounced = emails.filter((e: any) => e.status === 'bounced' || e.status === 'failed').length;
  const complained = emails.filter((e: any) => e.status === 'complained' || e.status === 'spam').length;
  const delivered = Math.max(0, sent - bounced);
  const totalTemplates = templates.length;

  const openRate = sent > 0 ? Math.round((opened / sent) * 100) : 0;
  const bounceRate = sent > 0 ? Math.round((bounced / sent) * 100) : 0;
  const deliveryRate = sent > 0 ? Math.round((delivered / sent) * 100) : 0;

  // Email campaign rows — richer with open rates per campaign
  const emailRows = emails.slice(0, 8).map((e: any) => {
    const eSent = e.sentCount || e.recipientCount || 1;
    const eOpened = e.openedCount || (e.opened ? 1 : 0);
    const eRate = eSent > 0 ? Math.round((eOpened / eSent) * 100) : 0;
    return {
      id: e.id || '',
      subject: e.subject || e.name || 'No Subject',
      to: e.to || e.recipient || e.contactEmail || e.recipientCount ? `${e.recipientCount} recipients` : '—',
      status: e.status || 'sent',
      openRate: `${eRate}%`,
      sent: e.sentCount || e.recipientCount || '—',
      date: (e.sentAt || e.createdAt || e.dateAdded) ? new Date(e.sentAt || e.createdAt || e.dateAdded).toLocaleDateString() : '—',
    };
  });

  // Template cards — with preview text and status
  const templateCards = templates.slice(0, 6).map((t: any) => {
    const previewText = (t.body || t.html || t.content || '').replace(/<[^>]*>/g, '').slice(0, 80);
    return {
      title: t.name || t.title || 'Untitled Template',
      description: previewText || t.subject || t.description?.slice(0, 80) || 'Email template',
      subtitle: t.subject || 'No subject line',
      status: t.status || 'active',
      statusVariant: t.status === 'draft' ? 'draft' : 'active',
    };
  });

  // Delivery breakdown pie chart
  const deliverySegments = [
    { label: 'Delivered', value: delivered, color: '#10b981' },
    { label: 'Opened', value: opened, color: '#3b82f6' },
    { label: 'Bounced', value: bounced, color: '#ef4444' },
    { label: 'Complained', value: complained, color: '#f59e0b' },
    { label: 'Unopened', value: Math.max(0, delivered - opened), color: '#94a3b8' },
  ].filter(s => s.value > 0);

  // Campaign performance bars — showing open rates as progress
  const campaignBars = emails.slice(0, 5).map((e: any) => {
    const eSent = e.sentCount || e.recipientCount || 1;
    const eOpened = e.openedCount || (e.opened ? 1 : 0);
    const rate = eSent > 0 ? Math.round((eOpened / eSent) * 100) : 0;
    return {
      name: (e.name || e.subject || 'Campaign').slice(0, 25),
      rate,
    };
  });

  return {
    root: 'page',
    elements: {
      page: {
        key: 'page',
        type: 'PageHeader',
        props: {
          title: 'Email Center',
          subtitle: `${totalEmails} campaigns · ${totalTemplates} templates · ${openRate}% avg open rate`,
          gradient: true,
          stats: [
            { label: 'Campaigns', value: String(totalEmails) },
            { label: 'Sent', value: String(sent) },
            { label: 'Open Rate', value: `${openRate}%` },
            { label: 'Templates', value: String(totalTemplates) },
          ],
        },
        children: ['emailActions', 'emailSearch', 'metrics', 'mainLayout'],
      },
      emailActions: {
        key: 'emailActions',
        type: 'ActionBar',
        props: { align: 'right' },
        children: ['emailCreateTemplateBtn', 'emailSendBtn'],
      },
      emailCreateTemplateBtn: {
        key: 'emailCreateTemplateBtn',
        type: 'ActionButton',
        props: { label: 'Create Template', variant: 'primary', toolName: 'create_email_template', toolArgs: {} },
      },
      emailSendBtn: {
        key: 'emailSendBtn',
        type: 'ActionButton',
        props: { label: 'Send Email', variant: 'secondary', toolName: 'send_email', toolArgs: {} },
      },
      emailSearch: {
        key: 'emailSearch',
        type: 'SearchBar',
        props: { placeholder: 'Search emails and templates...', searchTool: 'get_email_campaigns' },
      },
      metrics: {
        key: 'metrics',
        type: 'StatsGrid',
        props: { columns: 4 },
        children: ['mTotal', 'mSent', 'mOpenRate', 'mTemplates'],
      },
      mTotal: { key: 'mTotal', type: 'MetricCard', props: { label: 'Total Campaigns', value: String(totalEmails), color: 'blue' } },
      mSent: { key: 'mSent', type: 'MetricCard', props: { label: 'Emails Sent', value: String(sent), color: 'green', trend: sent > 0 ? 'up' : 'flat' } },
      mOpenRate: { key: 'mOpenRate', type: 'MetricCard', props: { label: 'Open Rate', value: `${openRate}%`, color: 'purple', trend: openRate >= 20 ? 'up' : openRate > 0 ? 'down' : 'flat' } },
      mTemplates: { key: 'mTemplates', type: 'MetricCard', props: { label: 'Templates', value: String(totalTemplates), color: 'yellow' } },
      mainLayout: {
        key: 'mainLayout',
        type: 'SplitLayout',
        props: { ratio: '67/33', gap: 'md' },
        children: ['leftCol', 'rightCol'],
      },
      // LEFT: Campaigns table + templates grid
      leftCol: {
        key: 'leftCol',
        type: 'Card',
        props: { title: 'Email Campaigns', padding: 'none' },
        children: ['emailTable', 'templateSection'],
      },
      emailTable: {
        key: 'emailTable',
        type: 'DataTable',
        props: {
          columns: [
            { key: 'subject', label: 'Campaign / Subject', format: 'text', sortable: true },
            { key: 'to', label: 'Recipients', format: 'text' },
            { key: 'status', label: 'Status', format: 'status' },
            { key: 'openRate', label: 'Open %', format: 'text' },
            { key: 'date', label: 'Date', format: 'date', sortable: true },
          ],
          rows: emailRows,
          emptyMessage: 'No email campaigns found',
          pageSize: 8,
        },
      },
      templateSection: {
        key: 'templateSection',
        type: 'CardGrid',
        props: {
          cards: templateCards.length > 0 ? templateCards : [{ title: 'No templates', description: 'Create your first email template' }],
          columns: 3,
        },
      },
      // RIGHT: Charts + performance
      rightCol: {
        key: 'rightCol',
        type: 'Card',
        props: { title: 'Delivery Analytics' },
        children: ['deliveryChart', 'deliveryProgress', 'bounceProgress', ...(campaignBars.length > 0 ? ['campaignPerf0', 'campaignPerf1', 'campaignPerf2'] : []), 'emailKV'],
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
      deliveryProgress: {
        key: 'deliveryProgress',
        type: 'ProgressBar',
        props: {
          label: 'Delivery Rate',
          value: deliveryRate,
          max: 100,
          color: deliveryRate >= 95 ? 'green' : deliveryRate >= 80 ? 'yellow' : 'red',
          showPercent: true,
        },
      },
      bounceProgress: {
        key: 'bounceProgress',
        type: 'ProgressBar',
        props: {
          label: 'Bounce Rate',
          value: bounceRate,
          max: 100,
          color: bounceRate <= 2 ? 'green' : bounceRate <= 5 ? 'yellow' : 'red',
          showPercent: true,
        },
      },
      // Campaign open rate progress bars (top 3)
      campaignPerf0: {
        key: 'campaignPerf0',
        type: 'ProgressBar',
        props: {
          label: campaignBars[0]?.name || 'Campaign 1',
          value: campaignBars[0]?.rate || 0,
          max: 100,
          color: (campaignBars[0]?.rate || 0) >= 25 ? 'green' : 'yellow',
          showPercent: true,
          benchmark: 20,
          benchmarkLabel: 'Industry avg',
        },
      },
      campaignPerf1: {
        key: 'campaignPerf1',
        type: 'ProgressBar',
        props: {
          label: campaignBars[1]?.name || 'Campaign 2',
          value: campaignBars[1]?.rate || 0,
          max: 100,
          color: (campaignBars[1]?.rate || 0) >= 25 ? 'green' : 'yellow',
          showPercent: true,
        },
      },
      campaignPerf2: {
        key: 'campaignPerf2',
        type: 'ProgressBar',
        props: {
          label: campaignBars[2]?.name || 'Campaign 3',
          value: campaignBars[2]?.rate || 0,
          max: 100,
          color: (campaignBars[2]?.rate || 0) >= 25 ? 'green' : 'yellow',
          showPercent: true,
        },
      },
      emailKV: {
        key: 'emailKV',
        type: 'KeyValueList',
        props: {
          items: [
            { label: 'Total Sent', value: String(sent), bold: true },
            { label: 'Delivered', value: String(delivered), variant: 'success' },
            { label: 'Opened', value: String(opened), variant: 'highlight' },
            { label: 'Bounced', value: String(bounced), variant: bounced > 0 ? 'danger' : 'muted' },
            { label: 'Complained', value: String(complained), variant: complained > 0 ? 'danger' : 'muted' },
            { label: 'Templates', value: String(totalTemplates) },
          ],
          compact: true,
        },
      },
    },
  };
}
