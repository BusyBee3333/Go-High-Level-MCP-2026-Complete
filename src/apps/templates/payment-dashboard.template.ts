import { UITree } from '../types.js';

export function buildPaymentDashboardTree(data: {
  transactions: any[];
  subscriptions: any[];
}): UITree {
  const transactions = data.transactions || [];
  const subscriptions = data.subscriptions || [];

  const totalTx = transactions.length;
  const totalAmount = transactions.reduce((s: number, t: any) => s + (t.amount || 0), 0);
  const successTx = transactions.filter((t: any) => t.status === 'succeeded' || t.status === 'paid').length;
  const failedTx = transactions.filter((t: any) => t.status === 'failed' || t.status === 'declined').length;
  const pendingTx = transactions.filter((t: any) => t.status === 'pending' || t.status === 'processing').length;
  const refundedTx = transactions.filter((t: any) => t.status === 'refunded').length;
  const activeSubs = subscriptions.filter((s: any) => s.status === 'active').length;
  const canceledSubs = subscriptions.filter((s: any) => s.status === 'canceled' || s.status === 'cancelled').length;
  const pastDueSubs = subscriptions.filter((s: any) => s.status === 'past_due' || s.status === 'unpaid').length;
  const mrr = subscriptions
    .filter((s: any) => s.status === 'active')
    .reduce((s: number, sub: any) => s + (sub.amount || sub.recurringAmount || 0), 0);
  const collectionRate = totalTx > 0 ? Math.round((successTx / totalTx) * 100) : 0;

  // Revenue line chart — transaction amounts over time
  const txByDate: Record<string, number> = {};
  transactions.forEach((t: any) => {
    const dateStr = t.createdAt || t.dateAdded;
    if (dateStr) {
      const d = new Date(dateStr);
      const key = `${d.getMonth() + 1}/${d.getDate()}`;
      txByDate[key] = (txByDate[key] || 0) + (t.amount || 0);
    }
  });
  const revenuePoints = Object.entries(txByDate)
    .slice(-14)
    .map(([label, value]) => ({ label, value: Math.round(value / 100) }));

  const revenueChartData = revenuePoints.length > 0 ? revenuePoints : [{ label: 'No data', value: 0 }];

  // Transaction status breakdown pie chart
  const txStatusSegments = [
    { label: 'Succeeded', value: successTx, color: '#10b981' },
    { label: 'Pending', value: pendingTx, color: '#f59e0b' },
    { label: 'Failed', value: failedTx, color: '#ef4444' },
    { label: 'Refunded', value: refundedTx, color: '#8b5cf6' },
  ].filter(s => s.value > 0);

  const fmtDate = (d: string) => d ? new Date(d).toLocaleDateString() : '—';

  // Transaction table rows — richer with status badges
  const txRows = transactions.slice(0, 10).map((t: any) => {
    const amt = (t.amount || 0) / 100;
    return {
      id: t.id || t._id || '',
      contact: t.contactName || t.contact?.name || t.customerName || 'Unknown',
      amount: fmtCurrency(t.amount || 0),
      status: t.status || 'pending',
      type: t.type || t.paymentType || 'payment',
      method: t.paymentMethod || t.source || '—',
      date: fmtDate(t.createdAt || t.dateAdded),
    };
  });

  // Subscription summary rows
  const subRows = subscriptions.slice(0, 6).map((s: any) => {
    const amt = (s.amount || s.recurringAmount || 0) / 100;
    return {
      id: s.id || s._id || '',
      name: s.name || s.planName || 'Subscription',
      status: s.status || 'active',
      amount: `$${amt.toFixed(2)}`,
      interval: s.interval || s.billingCycle || 'monthly',
      nextBilling: fmtDate(s.nextBillingDate || s.currentPeriodEnd),
    };
  });

  // Subscription status bar chart
  const subStatusBars = [
    { label: 'Active', value: activeSubs, color: '#10b981' },
    { label: 'Canceled', value: canceledSubs, color: '#ef4444' },
    { label: 'Past Due', value: pastDueSubs, color: '#f59e0b' },
  ].filter(b => b.value > 0);

  // Format currency amounts
  const fmtCurrency = (cents: number) => `$${(cents / 100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return {
    root: 'page',
    elements: {
      page: {
        key: 'page',
        type: 'PageHeader',
        props: {
          title: 'Payment Dashboard',
          subtitle: `${totalTx} transactions · ${subscriptions.length} subscriptions · ${fmtCurrency(totalAmount)} volume`,
          gradient: true,
          stats: [
            { label: 'Total Volume', value: fmtCurrency(totalAmount) },
            { label: 'Successful', value: String(successTx) },
            { label: 'Active Subs', value: String(activeSubs) },
            { label: 'MRR', value: fmtCurrency(mrr) },
          ],
        },
        children: ['payActions', 'paySearch', 'metrics', 'revenueChart', 'mainLayout'],
      },
      payActions: {
        key: 'payActions',
        type: 'ActionBar',
        props: { align: 'right' },
        children: ['payCreateInvoiceBtn', 'payCreateOrderBtn'],
      },
      payCreateInvoiceBtn: {
        key: 'payCreateInvoiceBtn',
        type: 'ActionButton',
        props: { label: 'Create Invoice', variant: 'primary', toolName: 'create_invoice', toolArgs: {} },
      },
      payCreateOrderBtn: {
        key: 'payCreateOrderBtn',
        type: 'ActionButton',
        props: { label: 'List Orders', variant: 'secondary', toolName: 'list_orders', toolArgs: {} },
      },
      paySearch: {
        key: 'paySearch',
        type: 'SearchBar',
        props: { placeholder: 'Search transactions, subscriptions...', searchTool: 'list_transactions' },
      },
      metrics: {
        key: 'metrics',
        type: 'StatsGrid',
        props: { columns: 4 },
        children: ['mVolume', 'mSuccess', 'mFailed', 'mMrr'],
      },
      mVolume: { key: 'mVolume', type: 'MetricCard', props: { label: 'Total Volume', value: fmtCurrency(totalAmount), color: 'blue' } },
      mSuccess: { key: 'mSuccess', type: 'MetricCard', props: { label: 'Successful', value: String(successTx), color: 'green', trend: successTx > 0 ? 'up' : 'flat' } },
      mFailed: { key: 'mFailed', type: 'MetricCard', props: { label: 'Failed', value: String(failedTx), color: 'red', trend: failedTx > 0 ? 'down' : 'flat' } },
      mMrr: { key: 'mMrr', type: 'MetricCard', props: { label: 'MRR', value: fmtCurrency(mrr), color: 'purple' } },
      revenueChart: {
        key: 'revenueChart',
        type: 'LineChart',
        props: {
          points: revenueChartData,
          color: '#10b981',
          showPoints: true,
          showArea: true,
          title: 'Revenue Over Time',
          yAxisLabel: 'USD',
        },
      },
      mainLayout: {
        key: 'mainLayout',
        type: 'SplitLayout',
        props: { ratio: '67/33', gap: 'md' },
        children: ['leftCol', 'rightCol'],
      },
      // LEFT: Transactions table
      leftCol: {
        key: 'leftCol',
        type: 'Card',
        props: { title: `Recent Transactions (${totalTx})`, padding: 'none' },
        children: ['collectionProgress', 'txTable'],
      },
      collectionProgress: {
        key: 'collectionProgress',
        type: 'ProgressBar',
        props: {
          label: 'Payment Collection Rate',
          value: collectionRate,
          max: 100,
          color: collectionRate >= 95 ? 'green' : collectionRate >= 80 ? 'yellow' : 'red',
          showPercent: true,
          benchmark: 95,
          benchmarkLabel: 'Target',
        },
      },
      txTable: {
        key: 'txTable',
        type: 'DataTable',
        props: {
          columns: [
            { key: 'contact', label: 'Customer', format: 'avatar', sortable: true },
            { key: 'amount', label: 'Amount', format: 'text' },
            { key: 'type', label: 'Type', format: 'text' },
            { key: 'method', label: 'Method', format: 'text' },
            { key: 'status', label: 'Status', format: 'status' },
            { key: 'date', label: 'Date', format: 'date', sortable: true },
          ],
          rows: txRows,
          emptyMessage: 'No transactions found',
          pageSize: 10,
        },
      },
      // RIGHT: Subscription summary
      rightCol: {
        key: 'rightCol',
        type: 'Card',
        props: { title: 'Subscriptions & Health' },
        children: ['subKV', 'subStatusChart', 'subTable'],
      },
      subKV: {
        key: 'subKV',
        type: 'KeyValueList',
        props: {
          items: [
            { label: 'Active Subscriptions', value: String(activeSubs), bold: true, variant: 'success' },
            { label: 'Canceled', value: String(canceledSubs), variant: canceledSubs > 0 ? 'danger' : 'muted' },
            { label: 'Past Due', value: String(pastDueSubs), variant: pastDueSubs > 0 ? 'danger' : 'muted' },
            { label: 'MRR', value: fmtCurrency(mrr), bold: true, variant: 'highlight' },
            { label: 'Collection Rate', value: `${collectionRate}%`, variant: collectionRate >= 90 ? 'success' : 'danger' },
          ],
          compact: true,
        },
      },
      subStatusChart: {
        key: 'subStatusChart',
        type: 'PieChart',
        props: {
          segments: txStatusSegments.length > 0 ? txStatusSegments : [{ label: 'No data', value: 1, color: '#94a3b8' }],
          donut: true,
          title: 'Transaction Status',
          showLegend: true,
        },
      },
      subTable: {
        key: 'subTable',
        type: 'DataTable',
        props: {
          columns: [
            { key: 'name', label: 'Plan', format: 'text', sortable: true },
            { key: 'amount', label: 'Amount', format: 'text' },
            { key: 'interval', label: 'Interval', format: 'text' },
            { key: 'status', label: 'Status', format: 'status' },
          ],
          rows: subRows,
          emptyMessage: 'No subscriptions',
          pageSize: 6,
        },
      },
    },
  };
}
