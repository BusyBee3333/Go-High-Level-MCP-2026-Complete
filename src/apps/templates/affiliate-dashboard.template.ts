import { UITree } from '../types.js';

export function buildAffiliateDashboardTree(data: {
  affiliates: any[];
  campaigns: any[];
}): UITree {
  const affiliates = data.affiliates || [];
  const campaigns = data.campaigns || [];
  const fmt = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);
  const fmtDate = (d: string) => d ? new Date(d).toLocaleDateString() : '—';

  const totalAffiliates = affiliates.length;
  const activeAffiliates = affiliates.filter((a: any) => a.status === 'active').length;
  const totalCommissions = affiliates.reduce((s: number, a: any) =>
    s + (a.totalCommission || a.commissionEarned || 0), 0);
  const totalReferrals = affiliates.reduce((s: number, a: any) =>
    s + (a.referrals || a.referralCount || 0), 0);
  const activeRate = totalAffiliates > 0 ? Math.round((activeAffiliates / totalAffiliates) * 100) : 0;

  const affiliateRows = affiliates.slice(0, 10).map((a: any) => ({
    id: a.id || '',
    name: a.name || (a.firstName ? `${a.firstName || ''} ${a.lastName || ''}`.trim() : 'Unknown'),
    email: a.email || '—',
    status: a.status || 'active',
    referrals: a.referrals || a.referralCount || 0,
    commission: fmt(a.totalCommission || a.commissionEarned || 0),
    conversionRate: typeof a.conversionRate === 'number' ? `${a.conversionRate}%` : '—',
  }));

  const campaignRows = campaigns.slice(0, 5).map((c: any) => ({
    id: c.id || '',
    name: c.name || 'Untitled Campaign',
    affiliates: c.affiliateCount || 0,
    revenue: fmt(c.totalRevenue || 0),
    status: c.status || 'active',
  }));

  // Top affiliates bar chart
  const topBars = affiliates.slice(0, 6).map((a: any) => ({
    label: (a.name || a.firstName || 'Affiliate').slice(0, 12),
    value: a.referrals || a.referralCount || 0,
    color: '#3b82f6',
  })).filter((b: any) => b.value > 0);

  // Commission pie chart by campaign
  const campSegments = campaigns.slice(0, 5).map((c: any, i: number) => ({
    label: (c.name || 'Campaign').slice(0, 15),
    value: c.totalRevenue || 1,
    color: ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444'][i % 5],
  }));

  return {
    root: 'page',
    elements: {
      page: {
        key: 'page',
        type: 'PageHeader',
        props: {
          title: 'Affiliate Dashboard',
          subtitle: `${totalAffiliates} affiliates · ${campaigns.length} campaigns · ${fmt(totalCommissions)} earned`,
          gradient: true,
          stats: [
            { label: 'Affiliates', value: String(totalAffiliates) },
            { label: 'Active', value: String(activeAffiliates) },
            { label: 'Referrals', value: String(totalReferrals) },
            { label: 'Commissions', value: fmt(totalCommissions) },
          ],
        },
        children: ['affActions', 'affSearch', 'metrics', 'layout'],
      },
      affActions: {
        key: 'affActions',
        type: 'ActionBar',
        props: { align: 'right' },
        children: ['affCreateBtn', 'affCreateCampaignBtn', 'affPayoutBtn'],
      },
      affCreateBtn: {
        key: 'affCreateBtn',
        type: 'ActionButton',
        props: { label: 'Create Affiliate', variant: 'primary', toolName: 'create_affiliate', toolArgs: {} },
      },
      affCreateCampaignBtn: {
        key: 'affCreateCampaignBtn',
        type: 'ActionButton',
        props: { label: 'Create Campaign', variant: 'secondary', toolName: 'create_affiliate_campaign', toolArgs: {} },
      },
      affPayoutBtn: {
        key: 'affPayoutBtn',
        type: 'ActionButton',
        props: { label: 'Create Payout', variant: 'secondary', toolName: 'create_payout', toolArgs: {} },
      },
      affSearch: {
        key: 'affSearch',
        type: 'SearchBar',
        props: { placeholder: 'Search affiliates...', searchTool: 'get_affiliates' },
      },
      metrics: {
        key: 'metrics',
        type: 'StatsGrid',
        props: { columns: 4 },
        children: ['mTotal', 'mActive', 'mReferrals', 'mCommissions'],
      },
      mTotal: { key: 'mTotal', type: 'MetricCard', props: { label: 'Affiliates', value: String(totalAffiliates), color: 'blue' } },
      mActive: { key: 'mActive', type: 'MetricCard', props: { label: 'Active', value: String(activeAffiliates), color: 'green', trend: activeAffiliates > 0 ? 'up' : 'flat' } },
      mReferrals: { key: 'mReferrals', type: 'MetricCard', props: { label: 'Referrals', value: String(totalReferrals), color: 'purple' } },
      mCommissions: { key: 'mCommissions', type: 'MetricCard', props: { label: 'Commissions', value: fmt(totalCommissions), color: 'yellow' } },
      layout: {
        key: 'layout',
        type: 'SplitLayout',
        props: { ratio: '67/33', gap: 'md' },
        children: ['leftCol', 'sidePanel'],
      },
      leftCol: {
        key: 'leftCol',
        type: 'Card',
        props: { title: 'Affiliates', padding: 'none' },
        children: ['affiliateTable', 'campaignTable'],
      },
      affiliateTable: {
        key: 'affiliateTable',
        type: 'DataTable',
        props: {
          columns: [
            { key: 'name', label: 'Affiliate', format: 'avatar', sortable: true },
            { key: 'email', label: 'Email', format: 'email' },
            { key: 'referrals', label: 'Referrals', format: 'text', sortable: true },
            { key: 'commission', label: 'Commission', format: 'text' },
            { key: 'conversionRate', label: 'Conv %', format: 'text' },
            { key: 'status', label: 'Status', format: 'status' },
          ],
          rows: affiliateRows,
          emptyMessage: 'No affiliates found',
          pageSize: 10,
        },
      },
      campaignTable: {
        key: 'campaignTable',
        type: 'DataTable',
        props: {
          columns: [
            { key: 'name', label: 'Campaign', format: 'text' },
            { key: 'affiliates', label: 'Affiliates', format: 'text' },
            { key: 'revenue', label: 'Revenue', format: 'text' },
            { key: 'status', label: 'Status', format: 'status' },
          ],
          rows: campaignRows,
          emptyMessage: 'No campaigns',
          pageSize: 5,
        },
      },
      sidePanel: {
        key: 'sidePanel',
        type: 'Card',
        props: { title: 'Affiliate Analytics' },
        children: ['activeProgress', 'topChart', 'campChart', 'affKV'],
      },
      activeProgress: {
        key: 'activeProgress',
        type: 'ProgressBar',
        props: {
          label: 'Active Rate',
          value: activeRate,
          max: 100,
          color: activeRate >= 70 ? 'green' : activeRate >= 40 ? 'yellow' : 'red',
          showPercent: true,
        },
      },
      topChart: {
        key: 'topChart',
        type: 'BarChart',
        props: {
          bars: topBars.length > 0 ? topBars : [{ label: 'No data', value: 0 }],
          orientation: 'horizontal',
          showValues: true,
          title: 'Top Affiliates by Referrals',
        },
      },
      campChart: {
        key: 'campChart',
        type: 'PieChart',
        props: {
          segments: campSegments.length > 0 ? campSegments : [{ label: 'No campaigns', value: 1, color: '#94a3b8' }],
          donut: true,
          title: 'Revenue by Campaign',
          showLegend: true,
        },
      },
      affKV: {
        key: 'affKV',
        type: 'KeyValueList',
        props: {
          items: [
            { label: 'Total Affiliates', value: String(totalAffiliates), bold: true },
            { label: 'Active', value: String(activeAffiliates), variant: 'success' as const },
            { label: 'Total Referrals', value: String(totalReferrals) },
            { label: 'Total Commissions', value: fmt(totalCommissions), variant: 'highlight' as const },
            { label: 'Campaigns', value: String(campaigns.length) },
          ],
          compact: true,
        },
      },
    },
  };
}
