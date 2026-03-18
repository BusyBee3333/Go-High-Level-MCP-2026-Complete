import { UITree } from '../types.js';

export function buildStoreFrontTree(data: {
  products: any[];
  orders: any[];
}): UITree {
  const products = data.products || [];
  const orders = data.orders || [];

  const totalProducts = products.length;
  const activeProducts = products.filter((p: any) => p.status === 'active' || p.available).length;
  const totalRevenue = orders.reduce((s: number, o: any) => s + (o.amount || o.total || 0), 0);
  const totalOrders = orders.length;
  const paidOrders = orders.filter((o: any) => o.status === 'paid' || o.status === 'completed' || o.fulfillmentStatus === 'fulfilled').length;
  const fulfillmentRate = totalOrders > 0 ? Math.round((paidOrders / totalOrders) * 100) : 0;

  // Detect product types for badges
  const productTypes: Record<string, number> = {};
  products.forEach((p: any) => {
    const t = p.productType || p.type || 'physical';
    productTypes[t] = (productTypes[t] || 0) + 1;
  });

  // Low stock detection
  const lowStockThreshold = 5;
  const criticalStockThreshold = 2;
  const lowStockProducts = products.filter((p: any) => {
    const qty = p.quantity ?? p.stock ?? p.inventory ?? null;
    return qty !== null && qty <= lowStockThreshold;
  });

  // Product cards with richer data
  const productCards = products.slice(0, 6).map((p: any) => {
    const price = p.price ? Number(p.price / 100).toFixed(2) : p.amount ? Number(p.amount).toFixed(2) : null;
    const qty = p.quantity ?? p.stock ?? p.inventory ?? null;
    const isLow = qty !== null && qty <= lowStockThreshold;
    const isCritical = qty !== null && qty <= criticalStockThreshold;
    const pType = p.productType || p.type || 'physical';
    const stockLabel = qty !== null ? (isCritical ? `⚠️ ${qty} left` : isLow ? `⚡ ${qty} left` : `✅ ${qty} in stock`) : '';

    return {
      title: p.name || p.title || 'Untitled Product',
      description: [
        price ? `💰 $${price}` : 'No price set',
        pType !== 'physical' ? `📦 ${pType}` : '',
        stockLabel,
      ].filter(Boolean).join(' · '),
      subtitle: price ? `$${price}` : 'No price',
      status: isLow ? (isCritical ? 'Low Stock' : 'Low') : (p.status || (p.available ? 'active' : 'draft')),
      statusVariant: isCritical ? 'error' : isLow ? 'pending' : (p.status === 'active' || p.available) ? 'active' : 'draft',
      imageUrl: p.imageUrl || p.image?.url || undefined,
      action: `View product: ${p.id || ''}`,
    };
  });

  // Revenue line chart — order values over time
  const ordersByDate: Record<string, number> = {};
  orders.forEach((o: any) => {
    const dateStr = o.createdAt || o.dateAdded;
    if (dateStr) {
      const d = new Date(dateStr);
      const key = `${d.getMonth() + 1}/${d.getDate()}`;
      ordersByDate[key] = (ordersByDate[key] || 0) + (o.amount || o.total || 0);
    }
  });
  const revenuePoints = Object.entries(ordersByDate)
    .slice(-12)
    .map(([label, value]) => ({ label, value: Math.round(value / 100) }));

  // Fallback revenue data
  const revenueChartPoints = revenuePoints.length > 0 ? revenuePoints : [
    { label: 'No data', value: 0 },
  ];

  // Order rows — richer
  const orderRows = orders.slice(0, 8).map((o: any) => {
    const amt = o.amount ? (o.amount / 100).toFixed(2) : o.total ? Number(o.total).toFixed(2) : '0.00';
    return {
      id: o.id || o._id || '',
      customer: o.contactName || o.contact?.name || 'Unknown',
      amount: `$${amt}`,
      status: o.status || o.fulfillmentStatus || 'pending',
      items: o.items?.length || o.lineItems?.length || '—',
      date: o.createdAt || o.dateAdded || '—',
    };
  });

  // Low stock warning rows
  const lowStockRows = lowStockProducts.slice(0, 5).map((p: any) => ({
    id: p.id || '',
    name: p.name || p.title || 'Unknown',
    stock: String(p.quantity ?? p.stock ?? p.inventory ?? 0),
    status: (p.quantity ?? p.stock ?? 0) <= criticalStockThreshold ? 'Critical' : 'Low',
  }));

  // Product type pie chart
  const typeSegments = Object.entries(productTypes).map(([label, value]) => ({
    label: label.charAt(0).toUpperCase() + label.slice(1),
    value,
    color: label === 'physical' ? '#3b82f6' : label === 'digital' ? '#8b5cf6' : label === 'service' ? '#10b981' : '#f59e0b',
  }));

  // Revenue display
  const revenueDisplay = totalRevenue > 0 ? `$${(totalRevenue / 100).toLocaleString()}` : '$0';

  return {
    root: 'page',
    elements: {
      page: {
        key: 'page',
        type: 'PageHeader',
        props: {
          title: 'Store Front',
          subtitle: `${totalProducts} products · ${totalOrders} orders · ${revenueDisplay} revenue`,
          gradient: true,
          stats: [
            { label: 'Products', value: String(totalProducts) },
            { label: 'Active', value: String(activeProducts) },
            { label: 'Orders', value: String(totalOrders) },
            { label: 'Revenue', value: revenueDisplay },
          ],
        },
        children: ['storeActions', 'storeSearch', 'metrics', 'mainLayout'],
      },
      storeActions: {
        key: 'storeActions',
        type: 'ActionBar',
        props: { align: 'right' },
        children: ['storeCreateProductBtn', 'storeCreateCouponBtn'],
      },
      storeCreateProductBtn: {
        key: 'storeCreateProductBtn',
        type: 'ActionButton',
        props: { label: 'Create Product', variant: 'primary', toolName: 'ghl_create_product', toolArgs: {} },
      },
      storeCreateCouponBtn: {
        key: 'storeCreateCouponBtn',
        type: 'ActionButton',
        props: { label: 'Create Coupon', variant: 'secondary', toolName: 'create_coupon', toolArgs: {} },
      },
      storeSearch: {
        key: 'storeSearch',
        type: 'SearchBar',
        props: { placeholder: 'Search products or orders...', searchTool: 'ghl_list_products' },
      },
      metrics: {
        key: 'metrics',
        type: 'StatsGrid',
        props: { columns: 4 },
        children: ['mProducts', 'mActive', 'mOrders', 'mRevenue'],
      },
      mProducts: { key: 'mProducts', type: 'MetricCard', props: { label: 'Total Products', value: String(totalProducts), color: 'blue' } },
      mActive: { key: 'mActive', type: 'MetricCard', props: { label: 'Active Products', value: String(activeProducts), color: 'green', trend: activeProducts > 0 ? 'up' : 'flat' } },
      mOrders: { key: 'mOrders', type: 'MetricCard', props: { label: 'Total Orders', value: String(totalOrders), color: 'purple' } },
      mRevenue: { key: 'mRevenue', type: 'MetricCard', props: { label: 'Revenue', value: revenueDisplay, format: 'currency', color: 'yellow' } },
      mainLayout: {
        key: 'mainLayout',
        type: 'SplitLayout',
        props: { ratio: '50/50', gap: 'md' },
        children: ['leftCol', 'rightCol'],
      },
      // LEFT: Products
      leftCol: {
        key: 'leftCol',
        type: 'Card',
        props: { title: `Product Catalog (${totalProducts})`, padding: 'sm' },
        children: ['productGrid', 'lowStockSection'],
      },
      productGrid: {
        key: 'productGrid',
        type: 'CardGrid',
        props: {
          cards: productCards.length > 0 ? productCards : [{ title: 'No products yet', description: 'Create your first product to get started' }],
          columns: 2,
        },
      },
      lowStockSection: {
        key: 'lowStockSection',
        type: 'DataTable',
        props: {
          columns: [
            { key: 'name', label: '⚠️ Low Stock Items', format: 'text', sortable: true },
            { key: 'stock', label: 'Qty', format: 'text', width: '50px' },
            { key: 'status', label: 'Status', format: 'status' },
          ],
          rows: lowStockRows,
          emptyMessage: '✅ All products are well-stocked',
          pageSize: 5,
        },
      },
      // RIGHT: Orders + Revenue
      rightCol: {
        key: 'rightCol',
        type: 'Card',
        props: { title: 'Orders & Revenue' },
        children: ['revenueChart', 'fulfillProgress', 'orderTable', 'storeKV'],
      },
      revenueChart: {
        key: 'revenueChart',
        type: 'LineChart',
        props: {
          points: revenueChartPoints,
          color: '#10b981',
          showPoints: true,
          showArea: true,
          title: 'Revenue Over Time',
          yAxisLabel: 'USD',
        },
      },
      fulfillProgress: {
        key: 'fulfillProgress',
        type: 'ProgressBar',
        props: {
          label: 'Order Fulfillment Rate',
          value: fulfillmentRate,
          max: 100,
          color: fulfillmentRate >= 80 ? 'green' : fulfillmentRate >= 50 ? 'yellow' : 'red',
          showPercent: true,
        },
      },
      orderTable: {
        key: 'orderTable',
        type: 'DataTable',
        props: {
          columns: [
            { key: 'customer', label: 'Customer', format: 'avatar', sortable: true },
            { key: 'amount', label: 'Amount', format: 'text' },
            { key: 'items', label: 'Items', format: 'text', width: '50px' },
            { key: 'status', label: 'Status', format: 'status' },
            { key: 'date', label: 'Date', format: 'date', sortable: true },
          ],
          rows: orderRows,
          emptyMessage: 'No orders yet',
          pageSize: 8,
        },
      },
      storeKV: {
        key: 'storeKV',
        type: 'KeyValueList',
        props: {
          items: [
            { label: 'Total Products', value: String(totalProducts), bold: true },
            { label: 'Active Products', value: String(activeProducts), variant: 'success' as const },
            { label: 'Total Orders', value: String(totalOrders) },
            { label: 'Revenue', value: revenueDisplay, variant: 'highlight' as const },
            { label: 'Fulfillment Rate', value: `${fulfillmentRate}%` },
            { label: 'Low Stock Items', value: String(lowStockProducts.length), variant: lowStockProducts.length > 0 ? 'danger' as const : 'muted' as const },
          ],
          compact: true,
        },
      },
    },
  };
}
