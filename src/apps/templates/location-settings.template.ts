import { UITree } from '../types.js';

export function buildLocationSettingsTree(data: {
  location: any;
  tags: any[];
  customValues: any[];
}): UITree {
  const location = data.location || {};
  const tags = data.tags || [];
  const customValues = data.customValues || [];

  const name = location.name || 'Location';
  const address = typeof location.address === 'object'
    ? [location.address?.street, location.address?.city, location.address?.state, location.address?.postalCode].filter(Boolean).join(', ') || '—'
    : [location.address, location.city, location.state, location.postalCode].filter(Boolean).join(', ') || '—';
  const phone = location.phone || '—';
  const email = location.email || '—';
  const website = location.website || '—';
  const timezone = location.timezone || '—';

  const businessHours = location.businessHours || location.business?.hours || {};
  const hoursItems = Object.entries(businessHours).slice(0, 7).map(([day, hours]: [string, any]) => ({
    label: day.charAt(0).toUpperCase() + day.slice(1),
    value: typeof hours === 'object' && hours !== null
      ? (hours?.open && hours?.close ? `${hours.open} – ${hours.close}` : 'Closed')
      : typeof hours === 'string' ? hours : 'Closed',
  }));

  const tagList = tags.slice(0, 15).map((t: any) => (typeof t === 'string' ? t : t.name || t.tag || String(t)));

  const settingsItems = [
    { label: 'Location Name', value: name, bold: true },
    { label: 'Address', value: address },
    { label: 'Phone', value: phone },
    { label: 'Email', value: email },
    { label: 'Website', value: website },
    { label: 'Timezone', value: timezone },
    { label: 'Location ID', value: location.id || '—', variant: 'muted' as const },
  ];

  const customValueRows = customValues.slice(0, 8).map((cv: any) => ({
    id: cv.id || '',
    name: cv.name || cv.fieldKey || 'Custom Value',
    value: typeof cv.value === 'object' ? JSON.stringify(cv.value) : String(cv.value || '—'),
    fieldKey: cv.fieldKey || cv.key || '—',
  }));

  // Configuration completeness
  const configFields = [location.name, location.email, location.phone, location.address, location.website, location.timezone];
  const filledFields = configFields.filter(Boolean).length;
  const completeness = Math.round((filledFields / configFields.length) * 100);

  // Tags distribution bar chart
  const tagBars = tags.slice(0, 8).map((t: any) => ({
    label: (typeof t === 'string' ? t : t.name || t.tag || 'Tag').slice(0, 12),
    value: 1,
    color: '#3b82f6',
  }));

  return {
    root: 'page',
    elements: {
      page: {
        key: 'page',
        type: 'PageHeader',
        props: {
          title: 'Location Settings',
          subtitle: `${name} · ${tags.length} tags · ${customValues.length} custom values`,
          gradient: true,
          stats: [
            { label: 'Tags', value: String(tags.length) },
            { label: 'Custom Values', value: String(customValues.length) },
            { label: 'Completeness', value: `${completeness}%` },
          ],
        },
        children: ['locActions', 'metrics', 'layout'],
      },
      locActions: {
        key: 'locActions',
        type: 'ActionBar',
        props: { align: 'right' },
        children: ['locUpdateBtn', 'locCreateTagBtn', 'locCreateCustomValueBtn'],
      },
      locUpdateBtn: {
        key: 'locUpdateBtn',
        type: 'ActionButton',
        props: { label: 'Update Location', variant: 'primary', toolName: 'update_location', toolArgs: { locationId: location.id || '' } },
      },
      locCreateTagBtn: {
        key: 'locCreateTagBtn',
        type: 'ActionButton',
        props: { label: 'Create Tag', variant: 'secondary', toolName: 'create_location_tag', toolArgs: {} },
      },
      locCreateCustomValueBtn: {
        key: 'locCreateCustomValueBtn',
        type: 'ActionButton',
        props: { label: 'Create Custom Value', variant: 'secondary', toolName: 'create_location_custom_value', toolArgs: {} },
      },
      metrics: {
        key: 'metrics',
        type: 'StatsGrid',
        props: { columns: 3 },
        children: ['mTags', 'mCV', 'mComplete'],
      },
      mTags: { key: 'mTags', type: 'MetricCard', props: { label: 'Tags', value: String(tags.length), color: 'blue' } },
      mCV: { key: 'mCV', type: 'MetricCard', props: { label: 'Custom Values', value: String(customValues.length), color: 'purple' } },
      mComplete: { key: 'mComplete', type: 'MetricCard', props: { label: 'Completeness', value: `${completeness}%`, color: completeness >= 80 ? 'green' : 'yellow' } },
      layout: {
        key: 'layout',
        type: 'SplitLayout',
        props: { ratio: '50/50', gap: 'md' },
        children: ['leftCol', 'rightCol'],
      },
      leftCol: {
        key: 'leftCol',
        type: 'Card',
        props: { title: 'Location Details' },
        children: ['completenessBar', 'details', 'tagSection'],
      },
      completenessBar: {
        key: 'completenessBar',
        type: 'ProgressBar',
        props: {
          label: 'Profile Completeness',
          value: completeness,
          max: 100,
          color: completeness >= 80 ? 'green' : completeness >= 50 ? 'yellow' : 'red',
          showPercent: true,
        },
      },
      details: {
        key: 'details',
        type: 'KeyValueList',
        props: { items: settingsItems },
      },
      tagSection: {
        key: 'tagSection',
        type: 'TagList',
        props: {
          tags: tagList.length > 0 ? tagList : ['No tags'],
          maxVisible: 10,
        },
      },
      rightCol: {
        key: 'rightCol',
        type: 'Card',
        props: { title: 'Business Hours & Custom Values' },
        children: ['hours', 'cvTable', 'tagChart'],
      },
      hours: {
        key: 'hours',
        type: 'KeyValueList',
        props: {
          items: hoursItems.length > 0 ? hoursItems : [
            { label: 'Monday', value: '9:00 AM – 5:00 PM' },
            { label: 'Tuesday', value: '9:00 AM – 5:00 PM' },
            { label: 'Wednesday', value: '9:00 AM – 5:00 PM' },
            { label: 'Thursday', value: '9:00 AM – 5:00 PM' },
            { label: 'Friday', value: '9:00 AM – 5:00 PM' },
            { label: 'Saturday', value: 'Closed' },
            { label: 'Sunday', value: 'Closed' },
          ],
          compact: true,
        },
      },
      cvTable: {
        key: 'cvTable',
        type: 'DataTable',
        props: {
          columns: [
            { key: 'name', label: 'Name', format: 'text', sortable: true },
            { key: 'value', label: 'Value', format: 'text' },
            { key: 'fieldKey', label: 'Key', format: 'text' },
          ],
          rows: customValueRows,
          emptyMessage: 'No custom values',
          pageSize: 8,
        },
      },
      tagChart: {
        key: 'tagChart',
        type: 'BarChart',
        props: {
          bars: tagBars.length > 0 ? tagBars : [{ label: 'No tags', value: 0 }],
          orientation: 'horizontal',
          showValues: true,
          title: 'Location Tags',
        },
      },
    },
  };
}
