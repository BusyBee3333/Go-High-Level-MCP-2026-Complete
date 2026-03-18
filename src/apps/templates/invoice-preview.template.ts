import { UITree } from '../types.js';

export function buildInvoicePreviewTree(data: any): UITree {
  const invoice = data || {};
  const contact = invoice.contact || invoice.contactDetails || {};
  const businessInfo = invoice.businessDetails || {};
  const items = invoice.items || invoice.lineItems || [];
  const currency = invoice.currency || 'USD';
  const fmtDate = (d: string) => d ? new Date(d).toLocaleDateString() : '—';

  const fmtCurrency = (n: number) => {
    try {
      return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(n);
    } catch {
      return `$${n.toFixed(2)}`;
    }
  };

  const contactName = contact.name || `${contact.firstName || ''} ${contact.lastName || ''}`.trim() || 'Unknown';
  const businessName = businessInfo.name || invoice.businessName || 'Business';

  // Build line items
  const lineItems = items.map((item: any) => ({
    name: item.name || item.description || 'Item',
    description: item.description !== item.name ? item.description : undefined,
    quantity: item.quantity || item.qty || 1,
    unitPrice: item.price || item.unitPrice || item.amount || 0,
    total: (item.quantity || 1) * (item.price || item.unitPrice || item.amount || 0),
  }));

  const subtotal = lineItems.reduce((s: number, i: any) => s + i.total, 0);
  const discount = invoice.discount || 0;
  const tax = invoice.taxAmount || invoice.tax || 0;
  const total = invoice.total || invoice.amount || subtotal - discount + tax;
  const amountDue = invoice.amountDue ?? total;
  const amountPaid = total - amountDue;
  const paidPercent = total > 0 ? Math.round((amountPaid / total) * 100) : 0;

  const totals: Array<{ label: string; value: string; bold?: boolean; variant?: string; isTotalRow?: boolean }> = [
    { label: 'Subtotal', value: fmtCurrency(subtotal) },
  ];
  if (discount > 0) {
    totals.push({ label: 'Discount', value: `-${fmtCurrency(discount)}`, variant: 'danger' });
  }
  if (tax > 0) {
    totals.push({ label: 'Tax', value: fmtCurrency(tax) });
  }
  totals.push({ label: 'Total', value: fmtCurrency(total), bold: true, isTotalRow: true });
  if (amountDue !== total) {
    totals.push({ label: 'Amount Due', value: fmtCurrency(amountDue), variant: 'highlight' });
  }

  // Line items bar chart
  const itemBars = lineItems.slice(0, 6).map((item: any) => ({
    label: (item.name || 'Item').slice(0, 12),
    value: item.total,
    color: '#3b82f6',
  })).filter((b: any) => b.value > 0);

  // Cost breakdown pie
  const costSegments = [
    { label: 'Subtotal', value: subtotal, color: '#3b82f6' },
  ];
  if (tax > 0) costSegments.push({ label: 'Tax', value: tax, color: '#f59e0b' });
  if (discount > 0) costSegments.push({ label: 'Discount', value: discount, color: '#ef4444' });

  const formatAddress = (addr: any): string => {
    if (!addr) return '';
    if (typeof addr === 'string') return addr;
    return [addr.street, addr.city, addr.state, addr.postalCode, addr.country].filter(Boolean).join(', ');
  };

  return {
    root: 'page',
    elements: {
      page: {
        key: 'page',
        type: 'DetailHeader',
        props: {
          title: `Invoice #${invoice.invoiceNumber || invoice.number || '—'}`,
          subtitle: invoice.title || `For ${contactName}`,
          entityId: invoice.id || '—',
          status: invoice.status || 'draft',
          statusVariant: invoice.status === 'paid' ? 'paid' : invoice.status === 'sent' ? 'sent' : 'draft',
        },
        children: ['invActions', 'mainLayout'],
      },
      invActions: {
        key: 'invActions',
        type: 'ActionBar',
        props: { align: 'right' },
        children: ['invSendBtn', 'invRecordPayBtn', 'invCreateEstimateBtn'],
      },
      invSendBtn: {
        key: 'invSendBtn',
        type: 'ActionButton',
        props: { label: 'Send Invoice', variant: 'primary', toolName: 'send_invoice', toolArgs: { invoiceId: invoice.id || '' } },
      },
      invRecordPayBtn: {
        key: 'invRecordPayBtn',
        type: 'ActionButton',
        props: { label: 'Record Payment', variant: 'secondary', toolName: 'record_order_payment', toolArgs: {} },
      },
      invCreateEstimateBtn: {
        key: 'invCreateEstimateBtn',
        type: 'ActionButton',
        props: { label: 'Create Estimate', variant: 'secondary', toolName: 'create_estimate', toolArgs: {} },
      },
      mainLayout: {
        key: 'mainLayout',
        type: 'SplitLayout',
        props: { ratio: '67/33', gap: 'md' },
        children: ['leftCol', 'sidePanel'],
      },
      leftCol: {
        key: 'leftCol',
        type: 'Card',
        props: { title: 'Invoice Details', padding: 'sm' },
        children: ['infoRow', 'lineItemsTable', 'totals'],
      },
      infoRow: {
        key: 'infoRow',
        type: 'SplitLayout',
        props: { ratio: '50/50', gap: 'md' },
        children: ['fromInfo', 'toInfo'],
      },
      fromInfo: {
        key: 'fromInfo',
        type: 'InfoBlock',
        props: {
          label: 'From',
          name: businessName,
          lines: [
            businessInfo.email || '',
            businessInfo.phone || '',
            formatAddress(businessInfo.address),
          ].filter(Boolean),
        },
      },
      toInfo: {
        key: 'toInfo',
        type: 'InfoBlock',
        props: {
          label: 'To',
          name: contactName,
          lines: [
            contact.email || '',
            contact.phone || '',
            formatAddress(contact.address),
          ].filter(Boolean),
        },
      },
      lineItemsTable: {
        key: 'lineItemsTable',
        type: 'LineItemsTable',
        props: {
          items: lineItems,
          currency,
        },
      },
      totals: {
        key: 'totals',
        type: 'KeyValueList',
        props: { items: totals },
      },
      sidePanel: {
        key: 'sidePanel',
        type: 'Card',
        props: { title: 'Invoice Summary' },
        children: ['paidProgress', 'itemChart', 'invKV'],
      },
      paidProgress: {
        key: 'paidProgress',
        type: 'ProgressBar',
        props: {
          label: 'Payment Progress',
          value: paidPercent,
          max: 100,
          color: paidPercent >= 100 ? 'green' : paidPercent > 0 ? 'yellow' : 'red',
          showPercent: true,
        },
      },
      itemChart: {
        key: 'itemChart',
        type: 'BarChart',
        props: {
          bars: itemBars.length > 0 ? itemBars : [{ label: 'No items', value: 0 }],
          orientation: 'horizontal',
          showValues: true,
          title: 'Line Item Values',
        },
      },
      invKV: {
        key: 'invKV',
        type: 'KeyValueList',
        props: {
          items: [
            { label: 'Invoice #', value: invoice.invoiceNumber || invoice.number || '—', bold: true },
            { label: 'Status', value: (invoice.status || 'draft').charAt(0).toUpperCase() + (invoice.status || 'draft').slice(1), variant: invoice.status === 'paid' ? 'success' as const : 'highlight' as const },
            { label: 'Customer', value: contactName },
            { label: 'Issue Date', value: fmtDate(invoice.issueDate || invoice.createdAt) },
            { label: 'Due Date', value: fmtDate(invoice.dueDate) },
            { label: 'Items', value: String(lineItems.length) },
            { label: 'Subtotal', value: fmtCurrency(subtotal) },
            { label: 'Total', value: fmtCurrency(total), bold: true, variant: 'highlight' as const },
            { label: 'Amount Due', value: fmtCurrency(amountDue), variant: amountDue > 0 ? 'danger' as const : 'success' as const },
          ],
          compact: true,
        },
      },
    },
  };
}
