import { UITree } from '../types.js';

export function buildSocialMediaHubTree(data: {
  posts: any[];
  accounts: any[];
}): UITree {
  const posts = data.posts || [];
  const accounts = data.accounts || [];
  const fmtDate = (d: string) => d ? new Date(d).toLocaleDateString() : '—';

  const totalPosts = posts.length;
  const published = posts.filter((p: any) => p.status === 'published' || p.status === 'posted').length;
  const scheduled = posts.filter((p: any) => p.status === 'scheduled').length;
  const draft = posts.filter((p: any) => p.status === 'draft').length;
  const totalLikes = posts.reduce((s: number, p: any) => s + (p.likes || p.reactions || 0), 0);
  const totalComments = posts.reduce((s: number, p: any) => s + (p.comments || 0), 0);
  const totalShares = posts.reduce((s: number, p: any) => s + (p.shares || 0), 0);
  const totalEngagement = totalLikes + totalComments + totalShares;
  const engagementRate = totalPosts > 0 ? Math.round((totalEngagement / totalPosts)) : 0;

  const postRows = posts.slice(0, 10).map((p: any) => ({
    id: p.id || '',
    content: (p.content || p.text || p.caption || '').slice(0, 60) || '—',
    platform: p.platform || p.type || 'social',
    status: p.status || 'draft',
    likes: p.likes || p.reactions || 0,
    comments: p.comments || 0,
    date: fmtDate(p.publishedAt || p.scheduledAt || p.createdAt),
  }));

  // Platform distribution pie chart
  const platformCounts: Record<string, number> = {};
  posts.forEach((p: any) => {
    const platform = p.platform || 'other';
    platformCounts[platform] = (platformCounts[platform] || 0) + 1;
  });
  const platformSegments = Object.entries(platformCounts).map(([label, value], i) => ({
    label: label.charAt(0).toUpperCase() + label.slice(1),
    value,
    color: ['#1877f2', '#e1306c', '#1da1f2', '#0a66c2', '#ff0000', '#25d366'][i % 6],
  }));

  // Engagement bar chart
  const engagementBars = [
    { label: 'Likes', value: totalLikes, color: '#ef4444' },
    { label: 'Comments', value: totalComments, color: '#3b82f6' },
    { label: 'Shares', value: totalShares, color: '#10b981' },
  ].filter(b => b.value > 0);

  return {
    root: 'page',
    elements: {
      page: {
        key: 'page',
        type: 'PageHeader',
        props: {
          title: 'Social Media Hub',
          subtitle: `${totalPosts} posts · ${accounts.length} accounts · ${totalEngagement.toLocaleString()} engagement`,
          gradient: true,
          stats: [
            { label: 'Posts', value: String(totalPosts) },
            { label: 'Published', value: String(published) },
            { label: 'Scheduled', value: String(scheduled) },
            { label: 'Engagement', value: totalEngagement.toLocaleString() },
          ],
        },
        children: ['socialActions', 'socialSearch', 'metrics', 'layout'],
      },
      socialActions: {
        key: 'socialActions',
        type: 'ActionBar',
        props: { align: 'right' },
        children: ['socialCreatePostBtn', 'socialDeleteBulkBtn'],
      },
      socialCreatePostBtn: {
        key: 'socialCreatePostBtn',
        type: 'ActionButton',
        props: { label: 'Create Post', variant: 'primary', toolName: 'create_social_post', toolArgs: {} },
      },
      socialDeleteBulkBtn: {
        key: 'socialDeleteBulkBtn',
        type: 'ActionButton',
        props: { label: 'Bulk Delete', variant: 'secondary', toolName: 'bulk_delete_social_posts', toolArgs: {} },
      },
      socialSearch: {
        key: 'socialSearch',
        type: 'SearchBar',
        props: { placeholder: 'Search posts...', searchTool: 'search_social_posts' },
      },
      metrics: {
        key: 'metrics',
        type: 'StatsGrid',
        props: { columns: 4 },
        children: ['mPosts', 'mPublished', 'mScheduled', 'mEngagement'],
      },
      mPosts: { key: 'mPosts', type: 'MetricCard', props: { label: 'Total Posts', value: String(totalPosts), color: 'blue' } },
      mPublished: { key: 'mPublished', type: 'MetricCard', props: { label: 'Published', value: String(published), color: 'green', trend: published > 0 ? 'up' : 'flat' } },
      mScheduled: { key: 'mScheduled', type: 'MetricCard', props: { label: 'Scheduled', value: String(scheduled), color: 'purple' } },
      mEngagement: { key: 'mEngagement', type: 'MetricCard', props: { label: 'Avg Engagement', value: String(engagementRate), color: 'yellow' } },
      layout: {
        key: 'layout',
        type: 'SplitLayout',
        props: { ratio: '67/33', gap: 'md' },
        children: ['postTableCard', 'sidePanel'],
      },
      postTableCard: {
        key: 'postTableCard',
        type: 'Card',
        props: { title: `Posts (${totalPosts})`, padding: 'none' },
        children: ['postTable'],
      },
      postTable: {
        key: 'postTable',
        type: 'DataTable',
        props: {
          columns: [
            { key: 'content', label: 'Content', format: 'text', sortable: true },
            { key: 'platform', label: 'Platform', format: 'status' },
            { key: 'status', label: 'Status', format: 'status' },
            { key: 'likes', label: 'Likes', format: 'text', sortable: true },
            { key: 'comments', label: 'Comments', format: 'text' },
            { key: 'date', label: 'Date', format: 'date', sortable: true },
          ],
          rows: postRows,
          emptyMessage: 'No posts found',
          pageSize: 10,
        },
      },
      sidePanel: {
        key: 'sidePanel',
        type: 'Card',
        props: { title: 'Social Analytics' },
        children: ['platformChart', 'engagementChart', 'socialKV'],
      },
      platformChart: {
        key: 'platformChart',
        type: 'PieChart',
        props: {
          segments: platformSegments.length > 0 ? platformSegments : [{ label: 'No data', value: 1, color: '#94a3b8' }],
          donut: true,
          title: 'Posts by Platform',
          showLegend: true,
        },
      },
      engagementChart: {
        key: 'engagementChart',
        type: 'BarChart',
        props: {
          bars: engagementBars.length > 0 ? engagementBars : [{ label: 'No engagement', value: 0 }],
          orientation: 'horizontal',
          showValues: true,
          title: 'Engagement Breakdown',
        },
      },
      socialKV: {
        key: 'socialKV',
        type: 'KeyValueList',
        props: {
          items: [
            { label: 'Total Posts', value: String(totalPosts), bold: true },
            { label: 'Published', value: String(published), variant: 'success' as const },
            { label: 'Scheduled', value: String(scheduled), variant: 'highlight' as const },
            { label: 'Drafts', value: String(draft), variant: 'muted' as const },
            { label: 'Connected Accounts', value: String(accounts.length) },
            { label: 'Total Likes', value: totalLikes.toLocaleString() },
            { label: 'Total Comments', value: totalComments.toLocaleString() },
          ],
          compact: true,
        },
      },
    },
  };
}
