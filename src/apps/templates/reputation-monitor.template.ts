import { UITree } from '../types.js';

export function buildReputationMonitorTree(data: {
  reviews: any[];
  averageRating: number;
}): UITree {
  const reviews = data.reviews || [];
  const fmtDate = (d: string) => d ? new Date(d).toLocaleDateString() : '—';
  const avgRating = data.averageRating || (reviews.length > 0
    ? reviews.reduce((s: number, r: any) => s + (r.rating || 0), 0) / reviews.length
    : 0);

  const totalReviews = reviews.length;
  const fiveStar = reviews.filter((r: any) => r.rating === 5).length;
  const fourStar = reviews.filter((r: any) => r.rating === 4).length;
  const threeStar = reviews.filter((r: any) => r.rating === 3).length;
  const twoStar = reviews.filter((r: any) => r.rating === 2).length;
  const oneStar = reviews.filter((r: any) => r.rating === 1).length;
  const responded = reviews.filter((r: any) => r.reply || r.response).length;
  const responseRate = totalReviews > 0 ? Math.round((responded / totalReviews) * 100) : 0;
  const positive = fiveStar + fourStar;
  const negative = oneStar + twoStar;

  // Rating distribution bar chart
  const ratingBars = [
    { label: '5 Stars', value: fiveStar, color: '#10b981' },
    { label: '4 Stars', value: fourStar, color: '#34d399' },
    { label: '3 Stars', value: threeStar, color: '#f59e0b' },
    { label: '2 Stars', value: twoStar, color: '#f97316' },
    { label: '1 Star', value: oneStar, color: '#ef4444' },
  ].filter(b => b.value > 0);

  // Source distribution pie
  const sourceCounts: Record<string, number> = {};
  reviews.forEach((r: any) => {
    const src = r.source || r.platform || 'Google';
    sourceCounts[src] = (sourceCounts[src] || 0) + 1;
  });
  const sourceSegments = Object.entries(sourceCounts).map(([label, value], i) => ({
    label: label.charAt(0).toUpperCase() + label.slice(1),
    value,
    color: ['#4285f4', '#ff9900', '#00b67a', '#e1306c', '#1da1f2'][i % 5],
  }));

  const reviewRows = reviews.slice(0, 8).map((r: any) => ({
    id: r.id || '',
    reviewer: r.reviewerName || r.authorName || 'Anonymous',
    rating: r.rating ? `${'⭐'.repeat(Math.min(r.rating, 5))}` : '—',
    snippet: (r.body || r.text || r.content || '').slice(0, 60) || '—',
    source: r.source || r.platform || 'Google',
    responded: r.reply || r.response ? '✅ Yes' : '❌ No',
    date: fmtDate(r.createdAt || r.publishedAt),
  }));

  return {
    root: 'page',
    elements: {
      page: {
        key: 'page',
        type: 'PageHeader',
        props: {
          title: 'Reputation Monitor',
          subtitle: `${totalReviews} reviews · ${avgRating.toFixed(1)} avg rating`,
          gradient: true,
          stats: [
            { label: 'Avg Rating', value: avgRating.toFixed(1) },
            { label: 'Total Reviews', value: String(totalReviews) },
            { label: 'Response Rate', value: `${responseRate}%` },
            { label: 'Positive', value: String(positive) },
          ],
        },
        children: ['repActions', 'repSearch', 'metrics', 'layout'],
      },
      repActions: {
        key: 'repActions',
        type: 'ActionBar',
        props: { align: 'right' },
        children: ['repSendRequestBtn', 'repReplyBtn'],
      },
      repSendRequestBtn: {
        key: 'repSendRequestBtn',
        type: 'ActionButton',
        props: { label: 'Send Review Request', variant: 'primary', toolName: 'send_review_request', toolArgs: {} },
      },
      repReplyBtn: {
        key: 'repReplyBtn',
        type: 'ActionButton',
        props: { label: 'Reply to Review', variant: 'secondary', toolName: 'reply_to_review', toolArgs: {} },
      },
      repSearch: {
        key: 'repSearch',
        type: 'SearchBar',
        props: { placeholder: 'Search reviews...', searchTool: 'get_reviews' },
      },
      metrics: {
        key: 'metrics',
        type: 'StatsGrid',
        props: { columns: 4 },
        children: ['mRating', 'mTotal', 'mPositive', 'mResponse'],
      },
      mRating: { key: 'mRating', type: 'MetricCard', props: { label: 'Avg Rating', value: avgRating.toFixed(1), color: 'blue' } },
      mTotal: { key: 'mTotal', type: 'MetricCard', props: { label: 'Total Reviews', value: String(totalReviews), color: 'purple' } },
      mPositive: { key: 'mPositive', type: 'MetricCard', props: { label: 'Positive (4-5★)', value: String(positive), color: 'green', trend: positive > negative ? 'up' : 'down' } },
      mResponse: { key: 'mResponse', type: 'MetricCard', props: { label: 'Response Rate', value: `${responseRate}%`, color: 'yellow' } },
      layout: {
        key: 'layout',
        type: 'SplitLayout',
        props: { ratio: '67/33', gap: 'md' },
        children: ['reviewsCard', 'sidePanel'],
      },
      reviewsCard: {
        key: 'reviewsCard',
        type: 'Card',
        props: { title: `Recent Reviews (${totalReviews})`, padding: 'none' },
        children: ['reviewTable'],
      },
      reviewTable: {
        key: 'reviewTable',
        type: 'DataTable',
        props: {
          columns: [
            { key: 'reviewer', label: 'Reviewer', format: 'avatar', sortable: true },
            { key: 'rating', label: 'Rating', format: 'text' },
            { key: 'snippet', label: 'Review', format: 'text' },
            { key: 'source', label: 'Source', format: 'status' },
            { key: 'responded', label: 'Replied', format: 'text' },
            { key: 'date', label: 'Date', format: 'date', sortable: true },
          ],
          rows: reviewRows,
          emptyMessage: 'No reviews yet',
          pageSize: 8,
        },
      },
      sidePanel: {
        key: 'sidePanel',
        type: 'Card',
        props: { title: 'Rating Overview' },
        children: ['stars', 'responseProgress', 'ratingChart', 'sourceChart', 'repKV'],
      },
      stars: {
        key: 'stars',
        type: 'StarRating',
        props: {
          rating: Math.round(avgRating * 10) / 10,
          count: totalReviews,
          showDistribution: true,
          distribution: [
            { stars: 5, count: fiveStar },
            { stars: 4, count: fourStar },
            { stars: 3, count: threeStar },
            { stars: 2, count: twoStar },
            { stars: 1, count: oneStar },
          ],
        },
      },
      responseProgress: {
        key: 'responseProgress',
        type: 'ProgressBar',
        props: {
          label: 'Response Rate',
          value: responseRate,
          max: 100,
          color: responseRate >= 80 ? 'green' : responseRate >= 50 ? 'yellow' : 'red',
          showPercent: true,
          benchmark: 90,
          benchmarkLabel: 'Target',
        },
      },
      ratingChart: {
        key: 'ratingChart',
        type: 'BarChart',
        props: {
          bars: ratingBars.length > 0 ? ratingBars : [{ label: 'No reviews', value: 0 }],
          orientation: 'horizontal',
          showValues: true,
          title: 'Rating Distribution',
        },
      },
      sourceChart: {
        key: 'sourceChart',
        type: 'PieChart',
        props: {
          segments: sourceSegments.length > 0 ? sourceSegments : [{ label: 'No data', value: 1, color: '#94a3b8' }],
          donut: true,
          title: 'Reviews by Source',
          showLegend: true,
        },
      },
      repKV: {
        key: 'repKV',
        type: 'KeyValueList',
        props: {
          items: [
            { label: 'Average Rating', value: avgRating.toFixed(1), bold: true },
            { label: '5-Star', value: String(fiveStar), variant: 'success' as const },
            { label: '1-Star', value: String(oneStar), variant: oneStar > 0 ? 'danger' as const : 'muted' as const },
            { label: 'Responded', value: `${responded}/${totalReviews}` },
            { label: 'Positive', value: String(positive), variant: 'success' as const },
            { label: 'Negative', value: String(negative), variant: negative > 0 ? 'danger' as const : 'muted' as const },
          ],
          compact: true,
        },
      },
    },
  };
}
