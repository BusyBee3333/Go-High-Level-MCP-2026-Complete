import { UITree } from '../types.js';

export function buildBlogManagerTree(data: {
  posts: any[];
  categories: any[];
  authors: any[];
}): UITree {
  const posts = data.posts || [];
  const categories = data.categories || [];
  const authors = data.authors || [];
  const fmtDate = (d: string) => d ? new Date(d).toLocaleDateString() : '—';

  const totalPosts = posts.length;
  const published = posts.filter((p: any) => p.status === 'published').length;
  const draft = posts.filter((p: any) => p.status === 'draft').length;
  const totalCategories = categories.length;
  const publishRate = totalPosts > 0 ? Math.round((published / totalPosts) * 100) : 0;

  const postRows = posts.slice(0, 10).map((p: any) => ({
    id: p.id || '',
    title: p.title || 'Untitled Post',
    status: p.status || 'draft',
    author: p.author?.name || p.authorName || '—',
    category: p.category?.name || p.categoryName || '—',
    date: fmtDate(p.publishedAt || p.createdAt),
  }));

  // Status distribution pie chart
  const statusSegments = [
    { label: 'Published', value: published, color: '#10b981' },
    { label: 'Draft', value: draft, color: '#94a3b8' },
  ].filter(s => s.value > 0);

  // Category distribution bar chart
  const catCounts: Record<string, number> = {};
  posts.forEach((p: any) => {
    const cat = p.category?.name || p.categoryName || 'Uncategorized';
    catCounts[cat] = (catCounts[cat] || 0) + 1;
  });
  const catBars = Object.entries(catCounts).slice(0, 6).map(([label, value]) => ({
    label: label.slice(0, 15),
    value,
    color: '#3b82f6',
  }));

  const categoryChips = categories.slice(0, 8).map((c: any) => ({
    label: c.name || c.title || 'Uncategorized',
    value: c.id || c.name || '',
    active: false,
  }));

  return {
    root: 'page',
    elements: {
      page: {
        key: 'page',
        type: 'PageHeader',
        props: {
          title: 'Blog Manager',
          subtitle: `${totalPosts} posts · ${totalCategories} categories · ${authors.length} authors`,
          gradient: true,
          stats: [
            { label: 'Posts', value: String(totalPosts) },
            { label: 'Published', value: String(published) },
            { label: 'Drafts', value: String(draft) },
            { label: 'Categories', value: String(totalCategories) },
          ],
        },
        children: ['blogActions', 'blogSearch', 'metrics', 'categoryFilters', 'layout'],
      },
      blogActions: {
        key: 'blogActions',
        type: 'ActionBar',
        props: { align: 'right' },
        children: ['blogCreatePostBtn', 'blogUpdatePostBtn'],
      },
      blogCreatePostBtn: {
        key: 'blogCreatePostBtn',
        type: 'ActionButton',
        props: { label: 'Create Post', variant: 'primary', toolName: 'create_blog_post', toolArgs: {} },
      },
      blogUpdatePostBtn: {
        key: 'blogUpdatePostBtn',
        type: 'ActionButton',
        props: { label: 'Update Post', variant: 'secondary', toolName: 'update_blog_post', toolArgs: {} },
      },
      blogSearch: {
        key: 'blogSearch',
        type: 'SearchBar',
        props: { placeholder: 'Search blog posts...', searchTool: 'get_blog_posts' },
      },
      metrics: {
        key: 'metrics',
        type: 'StatsGrid',
        props: { columns: 4 },
        children: ['mPosts', 'mPublished', 'mDraft', 'mAuthors'],
      },
      mPosts: { key: 'mPosts', type: 'MetricCard', props: { label: 'Total Posts', value: String(totalPosts), color: 'blue' } },
      mPublished: { key: 'mPublished', type: 'MetricCard', props: { label: 'Published', value: String(published), color: 'green', trend: published > 0 ? 'up' : 'flat' } },
      mDraft: { key: 'mDraft', type: 'MetricCard', props: { label: 'Drafts', value: String(draft), color: 'yellow' } },
      mAuthors: { key: 'mAuthors', type: 'MetricCard', props: { label: 'Authors', value: String(authors.length), color: 'purple' } },
      categoryFilters: {
        key: 'categoryFilters',
        type: 'FilterChips',
        props: {
          chips: categoryChips.length > 0 ? categoryChips : [{ label: 'All Posts', value: 'all', active: true }],
        },
      },
      layout: {
        key: 'layout',
        type: 'SplitLayout',
        props: { ratio: '67/33', gap: 'md' },
        children: ['postTableCard', 'sidePanel'],
      },
      postTableCard: {
        key: 'postTableCard',
        type: 'Card',
        props: { title: `Blog Posts (${totalPosts})`, padding: 'none' },
        children: ['postTable'],
      },
      postTable: {
        key: 'postTable',
        type: 'DataTable',
        props: {
          columns: [
            { key: 'title', label: 'Title', format: 'text', sortable: true },
            { key: 'status', label: 'Status', format: 'status' },
            { key: 'author', label: 'Author', format: 'text' },
            { key: 'category', label: 'Category', format: 'text' },
            { key: 'date', label: 'Date', format: 'date', sortable: true },
          ],
          rows: postRows,
          emptyMessage: 'No blog posts found',
          pageSize: 10,
        },
      },
      sidePanel: {
        key: 'sidePanel',
        type: 'Card',
        props: { title: 'Blog Analytics' },
        children: ['publishProgress', 'statusChart', 'catChart', 'blogKV'],
      },
      publishProgress: {
        key: 'publishProgress',
        type: 'ProgressBar',
        props: {
          label: 'Publish Rate',
          value: publishRate,
          max: 100,
          color: publishRate >= 70 ? 'green' : publishRate >= 40 ? 'yellow' : 'red',
          showPercent: true,
        },
      },
      statusChart: {
        key: 'statusChart',
        type: 'PieChart',
        props: {
          segments: statusSegments.length > 0 ? statusSegments : [{ label: 'No posts', value: 1, color: '#94a3b8' }],
          donut: true,
          title: 'Post Status',
          showLegend: true,
        },
      },
      catChart: {
        key: 'catChart',
        type: 'BarChart',
        props: {
          bars: catBars.length > 0 ? catBars : [{ label: 'No categories', value: 0 }],
          orientation: 'horizontal',
          showValues: true,
          title: 'Posts by Category',
        },
      },
      blogKV: {
        key: 'blogKV',
        type: 'KeyValueList',
        props: {
          items: [
            { label: 'Total Posts', value: String(totalPosts), bold: true },
            { label: 'Published', value: String(published), variant: 'success' as const },
            { label: 'Drafts', value: String(draft), variant: 'muted' as const },
            { label: 'Categories', value: String(totalCategories) },
            { label: 'Authors', value: String(authors.length) },
          ],
          compact: true,
        },
      },
    },
  };
}
