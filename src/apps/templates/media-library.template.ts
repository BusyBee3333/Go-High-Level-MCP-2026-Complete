import { UITree } from '../types.js';

export function buildMediaLibraryTree(data: {
  files: any[];
  folders: any[];
}): UITree {
  const files = data.files || [];
  const folders = data.folders || [];
  const fmtDate = (d: string) => d ? new Date(d).toLocaleDateString() : '—';

  const totalFiles = files.length;
  const totalFolders = folders.length;
  const images = files.filter((f: any) => (f.type || f.mimeType || '').startsWith('image')).length;
  const videos = files.filter((f: any) => (f.type || f.mimeType || '').startsWith('video')).length;
  const docs = files.filter((f: any) => {
    const t = f.type || f.mimeType || '';
    return t.includes('pdf') || t.includes('document') || t.includes('text');
  }).length;
  const totalSize = files.reduce((s: number, f: any) => s + (f.size || f.fileSize || 0), 0);
  const sizeStr = totalSize > 1024 * 1024
    ? `${(totalSize / (1024 * 1024)).toFixed(1)} MB`
    : totalSize > 1024
      ? `${(totalSize / 1024).toFixed(1)} KB`
      : `${totalSize} B`;

  // File type pie chart
  const typeSegments = [
    { label: 'Images', value: images, color: '#3b82f6' },
    { label: 'Videos', value: videos, color: '#8b5cf6' },
    { label: 'Documents', value: docs, color: '#10b981' },
    { label: 'Other', value: Math.max(0, totalFiles - images - videos - docs), color: '#94a3b8' },
  ].filter(s => s.value > 0);

  const galleryItems = files.slice(0, 12).map((f: any) => ({
    url: f.url || f.src || '',
    thumbnailUrl: f.thumbnailUrl || f.url || f.src || '',
    title: f.name || f.fileName || 'Untitled',
    fileType: f.type || f.mimeType || 'file',
    fileSize: f.size || f.fileSize ? `${Math.round((f.size || f.fileSize) / 1024)} KB` : undefined,
    date: fmtDate(f.createdAt || f.dateAdded),
  }));

  const folderNodes = folders.map((f: any) => ({
    id: f.id || f.name || '',
    label: f.name || 'Folder',
    icon: undefined,
    badge: f.fileCount ? String(f.fileCount) : undefined,
    children: (f.subFolders || []).map((sf: any) => ({
      id: sf.id || sf.name || '',
      label: sf.name || 'Subfolder',
    })),
  }));

  return {
    root: 'page',
    elements: {
      page: {
        key: 'page',
        type: 'PageHeader',
        props: {
          title: 'Media Library',
          subtitle: `${totalFiles} files · ${totalFolders} folders · ${sizeStr}`,
          gradient: true,
          stats: [
            { label: 'Files', value: String(totalFiles) },
            { label: 'Folders', value: String(totalFolders) },
            { label: 'Images', value: String(images) },
            { label: 'Total Size', value: sizeStr },
          ],
        },
        children: ['mediaActions', 'mediaSearch', 'metrics', 'layout'],
      },
      mediaActions: {
        key: 'mediaActions',
        type: 'ActionBar',
        props: { align: 'right' },
        children: ['mediaUploadBtn', 'mediaCreateFolderBtn', 'mediaBulkDeleteBtn'],
      },
      mediaUploadBtn: {
        key: 'mediaUploadBtn',
        type: 'ActionButton',
        props: { label: 'Upload File', variant: 'primary', toolName: 'upload_media_file', toolArgs: {} },
      },
      mediaCreateFolderBtn: {
        key: 'mediaCreateFolderBtn',
        type: 'ActionButton',
        props: { label: 'Create Folder', variant: 'secondary', toolName: 'create_media_folder', toolArgs: {} },
      },
      mediaBulkDeleteBtn: {
        key: 'mediaBulkDeleteBtn',
        type: 'ActionButton',
        props: { label: 'Bulk Delete', variant: 'secondary', toolName: 'bulk_delete_media_files', toolArgs: {} },
      },
      mediaSearch: {
        key: 'mediaSearch',
        type: 'SearchBar',
        props: { placeholder: 'Search media files...', searchTool: 'get_media_files' },
      },
      metrics: {
        key: 'metrics',
        type: 'StatsGrid',
        props: { columns: 4 },
        children: ['mFiles', 'mFolders', 'mImages', 'mSize'],
      },
      mFiles: { key: 'mFiles', type: 'MetricCard', props: { label: 'Total Files', value: String(totalFiles), color: 'blue' } },
      mFolders: { key: 'mFolders', type: 'MetricCard', props: { label: 'Folders', value: String(totalFolders), color: 'purple' } },
      mImages: { key: 'mImages', type: 'MetricCard', props: { label: 'Images', value: String(images), color: 'green' } },
      mSize: { key: 'mSize', type: 'MetricCard', props: { label: 'Total Size', value: sizeStr, color: 'yellow' } },
      layout: {
        key: 'layout',
        type: 'SplitLayout',
        props: { ratio: '67/33', gap: 'md' },
        children: ['galleryCard', 'sidePanel'],
      },
      galleryCard: {
        key: 'galleryCard',
        type: 'Card',
        props: { title: 'Media Files' },
        children: ['gallery'],
      },
      gallery: {
        key: 'gallery',
        type: 'MediaGallery',
        props: {
          items: galleryItems.length > 0 ? galleryItems : [{ url: '', title: 'No files uploaded', fileType: 'none' }],
          columns: 3,
          title: 'Media Files',
        },
      },
      sidePanel: {
        key: 'sidePanel',
        type: 'Card',
        props: { title: 'Library Overview' },
        children: ['typeChart', 'folderTree', 'mediaKV'],
      },
      typeChart: {
        key: 'typeChart',
        type: 'PieChart',
        props: {
          segments: typeSegments.length > 0 ? typeSegments : [{ label: 'No files', value: 1, color: '#94a3b8' }],
          donut: true,
          title: 'Files by Type',
          showLegend: true,
        },
      },
      folderTree: {
        key: 'folderTree',
        type: 'TreeView',
        props: {
          nodes: folderNodes.length > 0 ? folderNodes : [{ id: 'root', label: 'Root', children: [] }],
          title: 'Folders',
          expandAll: false,
        },
      },
      mediaKV: {
        key: 'mediaKV',
        type: 'KeyValueList',
        props: {
          items: [
            { label: 'Total Files', value: String(totalFiles), bold: true },
            { label: 'Images', value: String(images), variant: 'highlight' as const },
            { label: 'Videos', value: String(videos) },
            { label: 'Documents', value: String(docs) },
            { label: 'Folders', value: String(totalFolders) },
            { label: 'Total Size', value: sizeStr },
          ],
          compact: true,
        },
      },
    },
  };
}
