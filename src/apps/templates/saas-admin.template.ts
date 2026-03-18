import { UITree } from '../types.js';

export function buildSaasAdminTree(data: {
  subAccounts: any[];
  plans: any[];
  snapshots: any[];
}): UITree {
  const subAccounts = data.subAccounts || [];
  const plans = data.plans || [];
  const snapshots = data.snapshots || [];
  const fmt = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);
  const fmtDate = (d: string) => d ? new Date(d).toLocaleDateString() : '—';

  const totalAccounts = subAccounts.length;
  const activeAccounts = subAccounts.filter((a: any) => a.status === 'active').length;
  const totalPlans = plans.length;
  const totalSnapshots = snapshots.length;
  const totalMRR = subAccounts.reduce((s: number, a: any) =>
    s + (a.monthlyRevenue || a.mrr || a.planAmount || 0), 0);
  const activeRate = totalAccounts > 0 ? Math.round((activeAccounts / totalAccounts) * 100) : 0;

  const accountRows = subAccounts.slice(0, 10).map((a: any) => ({
    id: a.id || a.locationId || '',
    name: a.name || a.businessName || 'Sub-Account',
    email: a.email || '—',
    plan: a.planName || a.plan?.name || '—',
    status: a.status || 'active',
    mrr: fmt(a.monthlyRevenue || a.mrr || 0),
    created: fmtDate(a.createdAt || a.dateAdded),
  }));

  const planRows = plans.slice(0, 5).map((p: any) => ({
    id: p.id || '',
    name: p.name || 'Untitled Plan',
    price: fmt(p.price || p.amount || 0),
    interval: p.interval || p.billingCycle || 'monthly',
    subscribers: p.subscriberCount || p.activeCount || 0,
  }));

  const snapshotRows = snapshots.slice(0, 5).map((s: any) => ({
    id: s.id || '',
    name: s.name || 'Snapshot',
    type: s.type || 'full',
    created: fmtDate(s.createdAt),
  }));

  // Account status pie chart
  const statusSegments = [
    { label: 'Active', value: activeAccounts, color: '#10b981' },
    { label: 'Inactive', value: Math.max(0, totalAccounts - activeAccounts), color: '#94a3b8' },
  ].filter(s => s.value > 0);

  // Plan subscribers bar chart
  const planBars = plans.slice(0, 6).map((p: any) => ({
    label: (p.name || 'Plan').slice(0, 12),
    value: p.subscriberCount || p.activeCount || 0,
    color: '#3b82f6',
  })).filter((b: any) => b.value > 0);

  return {
    root: 'page',
    elements: {
      page: {
        key: 'page',
        type: 'PageHeader',
        props: {
          title: 'SaaS Admin',
          subtitle: `${totalAccounts} sub-accounts · ${totalPlans} plans · ${fmt(totalMRR)} MRR`,
          gradient: true,
          stats: [
            { label: 'Accounts', value: String(totalAccounts) },
            { label: 'Active', value: String(activeAccounts) },
            { label: 'MRR', value: fmt(totalMRR) },
            { label: 'Snapshots', value: String(totalSnapshots) },
          ],
        },
        children: ['saasActions', 'saasSearch', 'metrics', 'mainLayout'],
      },
      saasActions: {
        key: 'saasActions',
        type: 'ActionBar',
        props: { align: 'right' },
        children: ['saasCreateLocBtn', 'saasEnableBtn', 'saasCreateSnapshotBtn'],
      },
      saasCreateLocBtn: {
        key: 'saasCreateLocBtn',
        type: 'ActionButton',
        props: { label: 'Create Sub-Account', variant: 'primary', toolName: 'create_location', toolArgs: {} },
      },
      saasEnableBtn: {
        key: 'saasEnableBtn',
        type: 'ActionButton',
        props: { label: 'Enable Location', variant: 'secondary', toolName: 'enable_saas_location', toolArgs: {} },
      },
      saasCreateSnapshotBtn: {
        key: 'saasCreateSnapshotBtn',
        type: 'ActionButton',
        props: { label: 'Create Snapshot', variant: 'secondary', toolName: 'create_snapshot', toolArgs: {} },
      },
      saasSearch: {
        key: 'saasSearch',
        type: 'SearchBar',
        props: { placeholder: 'Search sub-accounts...', searchTool: 'get_saas_locations' },
      },
      metrics: {
        key: 'metrics',
        type: 'StatsGrid',
        props: { columns: 4 },
        children: ['mAccounts', 'mActive', 'mMrr', 'mSnapshots'],
      },
      mAccounts: { key: 'mAccounts', type: 'MetricCard', props: { label: 'Sub-Accounts', value: String(totalAccounts), color: 'blue' } },
      mActive: { key: 'mActive', type: 'MetricCard', props: { label: 'Active', value: String(activeAccounts), color: 'green', trend: activeAccounts > 0 ? 'up' : 'flat' } },
      mMrr: { key: 'mMrr', type: 'MetricCard', props: { label: 'MRR', value: fmt(totalMRR), color: 'purple' } },
      mSnapshots: { key: 'mSnapshots', type: 'MetricCard', props: { label: 'Snapshots', value: String(totalSnapshots), color: 'yellow' } },
      mainLayout: {
        key: 'mainLayout',
        type: 'SplitLayout',
        props: { ratio: '67/33', gap: 'md' },
        children: ['leftCol', 'sidePanel'],
      },
      leftCol: {
        key: 'leftCol',
        type: 'Card',
        props: { title: `Sub-Accounts (${totalAccounts})`, padding: 'none' },
        children: ['accountTable', 'bottom'],
      },
      accountTable: {
        key: 'accountTable',
        type: 'DataTable',
        props: {
          columns: [
            { key: 'name', label: 'Account', format: 'avatar', sortable: true },
            { key: 'email', label: 'Email', format: 'email' },
            { key: 'plan', label: 'Plan', format: 'text' },
            { key: 'mrr', label: 'MRR', format: 'text' },
            { key: 'status', label: 'Status', format: 'status' },
            { key: 'created', label: 'Created', format: 'date', sortable: true },
          ],
          rows: accountRows,
          emptyMessage: 'No sub-accounts found',
          pageSize: 10,
        },
      },
      bottom: {
        key: 'bottom',
        type: 'SplitLayout',
        props: { ratio: '50/50', gap: 'md' },
        children: ['planCard', 'snapshotCard'],
      },
      planCard: {
        key: 'planCard',
        type: 'Card',
        props: { title: 'Plans', padding: 'none' },
        children: ['planTable'],
      },
      planTable: {
        key: 'planTable',
        type: 'DataTable',
        props: {
          columns: [
            { key: 'name', label: 'Plan', format: 'text' },
            { key: 'price', label: 'Price', format: 'text' },
            { key: 'interval', label: 'Interval', format: 'text' },
            { key: 'subscribers', label: 'Subs', format: 'text' },
          ],
          rows: planRows,
          emptyMessage: 'No plans configured',
          pageSize: 5,
        },
      },
      snapshotCard: {
        key: 'snapshotCard',
        type: 'Card',
        props: { title: 'Snapshots', padding: 'none' },
        children: ['snapshotTable'],
      },
      snapshotTable: {
        key: 'snapshotTable',
        type: 'DataTable',
        props: {
          columns: [
            { key: 'name', label: 'Snapshot', format: 'text' },
            { key: 'type', label: 'Type', format: 'status' },
            { key: 'created', label: 'Created', format: 'date' },
          ],
          rows: snapshotRows,
          emptyMessage: 'No snapshots',
          pageSize: 5,
        },
      },
      sidePanel: {
        key: 'sidePanel',
        type: 'Card',
        props: { title: 'SaaS Analytics' },
        children: ['activeProgress', 'statusChart', 'planChart', 'saasKV'],
      },
      activeProgress: {
        key: 'activeProgress',
        type: 'ProgressBar',
        props: {
          label: 'Active Rate',
          value: activeRate,
          max: 100,
          color: activeRate >= 80 ? 'green' : activeRate >= 50 ? 'yellow' : 'red',
          showPercent: true,
        },
      },
      statusChart: {
        key: 'statusChart',
        type: 'PieChart',
        props: {
          segments: statusSegments.length > 0 ? statusSegments : [{ label: 'No data', value: 1, color: '#94a3b8' }],
          donut: true,
          title: 'Account Status',
          showLegend: true,
        },
      },
      planChart: {
        key: 'planChart',
        type: 'BarChart',
        props: {
          bars: planBars.length > 0 ? planBars : [{ label: 'No plans', value: 0 }],
          orientation: 'horizontal',
          showValues: true,
          title: 'Subscribers by Plan',
        },
      },
      saasKV: {
        key: 'saasKV',
        type: 'KeyValueList',
        props: {
          items: [
            { label: 'MRR', value: fmt(totalMRR), bold: true, variant: 'highlight' as const },
            { label: 'Sub-Accounts', value: String(totalAccounts) },
            { label: 'Active', value: String(activeAccounts), variant: 'success' as const },
            { label: 'Plans', value: String(totalPlans) },
            { label: 'Snapshots', value: String(totalSnapshots) },
          ],
          compact: true,
        },
      },
    },
  };
}
