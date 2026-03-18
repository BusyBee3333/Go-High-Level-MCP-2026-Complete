import { UITree } from '../types.js';

export function buildProposalBuilderTree(data: {
  proposals: any[];
}): UITree {
  const proposals = data.proposals || [];
  const fmt = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);
  const fmtDate = (d: string) => d ? new Date(d).toLocaleDateString() : '—';

  const totalProposals = proposals.length;
  const sent = proposals.filter((p: any) => p.status === 'sent').length;
  const accepted = proposals.filter((p: any) => p.status === 'accepted' || p.status === 'won').length;
  const declined = proposals.filter((p: any) => p.status === 'declined' || p.status === 'lost').length;
  const draft = proposals.filter((p: any) => p.status === 'draft').length;
  const totalValue = proposals.reduce((s: number, p: any) => s + (p.value || p.amount || p.totalAmount || 0), 0);
  const acceptRate = (sent + accepted + declined) > 0 ? Math.round(accepted / (sent + accepted + declined) * 100) : 0;

  const proposalRows = proposals.slice(0, 10).map((p: any) => ({
    id: p.id || '',
    title: p.title || p.name || 'Untitled Proposal',
    contact: p.contactName || p.contact?.name || '—',
    value: fmt(p.value || p.amount || 0),
    status: p.status || 'draft',
    sentDate: fmtDate(p.sentAt || p.createdAt),
    expiresAt: fmtDate(p.expiresAt),
  }));

  // Status pie chart
  const statusSegments = [
    { label: 'Draft', value: draft, color: '#94a3b8' },
    { label: 'Sent', value: sent, color: '#3b82f6' },
    { label: 'Accepted', value: accepted, color: '#10b981' },
    { label: 'Declined', value: declined, color: '#ef4444' },
  ].filter(s => s.value > 0);

  const funnelStages = [
    { label: 'Draft', value: draft },
    { label: 'Sent', value: sent },
    { label: 'Accepted', value: accepted },
  ].filter(s => s.value > 0);

  return {
    root: 'page',
    elements: {
      page: {
        key: 'page',
        type: 'PageHeader',
        props: {
          title: 'Proposal Builder',
          subtitle: `${totalProposals} proposals · ${fmt(totalValue)} total · ${acceptRate}% acceptance`,
          gradient: true,
          stats: [
            { label: 'Proposals', value: String(totalProposals) },
            { label: 'Sent', value: String(sent) },
            { label: 'Accepted', value: String(accepted) },
            { label: 'Accept Rate', value: `${acceptRate}%` },
          ],
        },
        children: ['propActions', 'propSearch', 'metrics', 'layout'],
      },
      propActions: {
        key: 'propActions',
        type: 'ActionBar',
        props: { align: 'right' },
        children: ['propSendDocBtn', 'propSendTemplateBtn'],
      },
      propSendDocBtn: {
        key: 'propSendDocBtn',
        type: 'ActionButton',
        props: { label: 'Send Document', variant: 'primary', toolName: 'send_proposal_document', toolArgs: {} },
      },
      propSendTemplateBtn: {
        key: 'propSendTemplateBtn',
        type: 'ActionButton',
        props: { label: 'Send Template', variant: 'secondary', toolName: 'send_proposal_template', toolArgs: {} },
      },
      propSearch: {
        key: 'propSearch',
        type: 'SearchBar',
        props: { placeholder: 'Search proposals...', searchTool: 'list_proposals_documents' },
      },
      metrics: {
        key: 'metrics',
        type: 'StatsGrid',
        props: { columns: 4 },
        children: ['mTotal', 'mSent', 'mAccepted', 'mValue'],
      },
      mTotal: { key: 'mTotal', type: 'MetricCard', props: { label: 'Proposals', value: String(totalProposals), color: 'blue' } },
      mSent: { key: 'mSent', type: 'MetricCard', props: { label: 'Sent', value: String(sent), color: 'purple' } },
      mAccepted: { key: 'mAccepted', type: 'MetricCard', props: { label: 'Accepted', value: String(accepted), color: 'green', trend: accepted > 0 ? 'up' : 'flat' } },
      mValue: { key: 'mValue', type: 'MetricCard', props: { label: 'Total Value', value: fmt(totalValue), color: 'yellow' } },
      layout: {
        key: 'layout',
        type: 'SplitLayout',
        props: { ratio: '67/33', gap: 'md' },
        children: ['proposalTableCard', 'sidePanel'],
      },
      proposalTableCard: {
        key: 'proposalTableCard',
        type: 'Card',
        props: { title: `Proposals (${totalProposals})`, padding: 'none' },
        children: ['proposalTable'],
      },
      proposalTable: {
        key: 'proposalTable',
        type: 'DataTable',
        props: {
          columns: [
            { key: 'title', label: 'Proposal', format: 'text', sortable: true },
            { key: 'contact', label: 'Contact', format: 'avatar' },
            { key: 'value', label: 'Value', format: 'text' },
            { key: 'status', label: 'Status', format: 'status' },
            { key: 'sentDate', label: 'Sent', format: 'date', sortable: true },
            { key: 'expiresAt', label: 'Expires', format: 'date' },
          ],
          rows: proposalRows,
          emptyMessage: 'No proposals found',
          pageSize: 10,
        },
      },
      sidePanel: {
        key: 'sidePanel',
        type: 'Card',
        props: { title: 'Proposal Analytics' },
        children: ['acceptProgress', 'statusChart', 'funnel', 'propKV'],
      },
      acceptProgress: {
        key: 'acceptProgress',
        type: 'ProgressBar',
        props: {
          label: 'Accept Rate',
          value: acceptRate,
          max: 100,
          color: acceptRate >= 50 ? 'green' : acceptRate >= 25 ? 'yellow' : 'red',
          showPercent: true,
        },
      },
      statusChart: {
        key: 'statusChart',
        type: 'PieChart',
        props: {
          segments: statusSegments.length > 0 ? statusSegments : [{ label: 'No data', value: 1, color: '#94a3b8' }],
          donut: true,
          title: 'Status Distribution',
          showLegend: true,
        },
      },
      funnel: {
        key: 'funnel',
        type: 'FunnelChart',
        props: {
          stages: funnelStages.length > 0 ? funnelStages : [
            { label: 'Draft', value: 5 },
            { label: 'Sent', value: 3 },
            { label: 'Accepted', value: 1 },
          ],
          showDropoff: true,
          title: 'Proposal Pipeline',
        },
      },
      propKV: {
        key: 'propKV',
        type: 'KeyValueList',
        props: {
          items: [
            { label: 'Total Value', value: fmt(totalValue), bold: true, variant: 'highlight' as const },
            { label: 'Proposals', value: String(totalProposals) },
            { label: 'Accepted', value: String(accepted), variant: 'success' as const },
            { label: 'Declined', value: String(declined), variant: declined > 0 ? 'danger' as const : 'muted' as const },
            { label: 'Draft', value: String(draft), variant: 'muted' as const },
          ],
          compact: true,
        },
      },
    },
  };
}
