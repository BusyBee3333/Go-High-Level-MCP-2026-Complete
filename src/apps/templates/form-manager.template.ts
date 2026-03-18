import { UITree } from '../types.js';

export function buildFormManagerTree(data: {
  forms: any[];
  surveys: any[];
}): UITree {
  const forms = data.forms || [];
  const surveys = data.surveys || [];
  const all = [...forms, ...surveys];
  const fmtDate = (d: string) => d ? new Date(d).toLocaleDateString() : '—';

  const totalForms = forms.length;
  const totalSurveys = surveys.length;
  const totalSubmissions = all.reduce((s: number, f: any) => s + (f.submissions || f.responseCount || 0), 0);
  const activeForms = forms.filter((f: any) => f.status === 'active' || !f.archived).length;

  const combinedRows = [
    ...forms.slice(0, 8).map((f: any) => ({
      id: f.id || '',
      name: f.name || 'Untitled Form',
      type: 'Form',
      submissions: f.submissions || f.responseCount || 0,
      status: f.status || 'active',
      fields: f.fields?.length || f.fieldCount || 0,
      updated: fmtDate(f.updatedAt || f.createdAt),
    })),
    ...surveys.slice(0, 5).map((s: any) => ({
      id: s.id || '',
      name: s.name || 'Untitled Survey',
      type: 'Survey',
      submissions: s.submissions || s.responseCount || 0,
      status: s.status || 'active',
      fields: s.questions?.length || s.fieldCount || 0,
      updated: fmtDate(s.updatedAt || s.createdAt),
    })),
  ].slice(0, 10);

  // Type distribution pie chart
  const typeSegments = [
    { label: 'Forms', value: totalForms, color: '#3b82f6' },
    { label: 'Surveys', value: totalSurveys, color: '#8b5cf6' },
  ].filter(s => s.value > 0);

  // Submissions per form bar chart
  const subBars = all.slice(0, 8).map((f: any) => ({
    label: (f.name || 'Form').slice(0, 15),
    value: f.submissions || f.responseCount || 0,
    color: '#10b981',
  })).filter((b: any) => b.value > 0);

  return {
    root: 'page',
    elements: {
      page: {
        key: 'page',
        type: 'PageHeader',
        props: {
          title: 'Form Manager',
          subtitle: `${totalForms} forms · ${totalSurveys} surveys · ${totalSubmissions.toLocaleString()} submissions`,
          gradient: true,
          stats: [
            { label: 'Forms', value: String(totalForms) },
            { label: 'Surveys', value: String(totalSurveys) },
            { label: 'Submissions', value: totalSubmissions.toLocaleString() },
            { label: 'Active', value: String(activeForms) },
          ],
        },
        children: ['formActions', 'formSearch', 'metrics', 'layout'],
      },
      formActions: {
        key: 'formActions',
        type: 'ActionBar',
        props: { align: 'right' },
        children: ['formGetSubmissionsBtn'],
      },
      formGetSubmissionsBtn: {
        key: 'formGetSubmissionsBtn',
        type: 'ActionButton',
        props: { label: 'View Submissions', variant: 'primary', toolName: 'get_form_submissions', toolArgs: {} },
      },
      formSearch: {
        key: 'formSearch',
        type: 'SearchBar',
        props: { placeholder: 'Search forms & surveys...', searchTool: 'get_forms' },
      },
      metrics: {
        key: 'metrics',
        type: 'StatsGrid',
        props: { columns: 4 },
        children: ['mForms', 'mSurveys', 'mSubs', 'mActive'],
      },
      mForms: { key: 'mForms', type: 'MetricCard', props: { label: 'Forms', value: String(totalForms), color: 'blue' } },
      mSurveys: { key: 'mSurveys', type: 'MetricCard', props: { label: 'Surveys', value: String(totalSurveys), color: 'purple' } },
      mSubs: { key: 'mSubs', type: 'MetricCard', props: { label: 'Submissions', value: totalSubmissions.toLocaleString(), color: 'green' } },
      mActive: { key: 'mActive', type: 'MetricCard', props: { label: 'Active Forms', value: String(activeForms), color: 'yellow' } },
      layout: {
        key: 'layout',
        type: 'SplitLayout',
        props: { ratio: '67/33', gap: 'md' },
        children: ['formTableCard', 'sidePanel'],
      },
      formTableCard: {
        key: 'formTableCard',
        type: 'Card',
        props: { title: `Forms & Surveys (${all.length})`, padding: 'none' },
        children: ['formTable'],
      },
      formTable: {
        key: 'formTable',
        type: 'DataTable',
        props: {
          columns: [
            { key: 'name', label: 'Name', format: 'text', sortable: true },
            { key: 'type', label: 'Type', format: 'status' },
            { key: 'submissions', label: 'Submissions', format: 'text', sortable: true },
            { key: 'fields', label: 'Fields', format: 'text' },
            { key: 'status', label: 'Status', format: 'status' },
            { key: 'updated', label: 'Updated', format: 'date' },
          ],
          rows: combinedRows,
          emptyMessage: 'No forms or surveys found',
          pageSize: 10,
        },
      },
      sidePanel: {
        key: 'sidePanel',
        type: 'Card',
        props: { title: 'Form Analytics' },
        children: ['typeChart', 'subChart', 'formKV'],
      },
      typeChart: {
        key: 'typeChart',
        type: 'PieChart',
        props: {
          segments: typeSegments.length > 0 ? typeSegments : [{ label: 'No data', value: 1, color: '#94a3b8' }],
          donut: true,
          title: 'Forms vs Surveys',
          showLegend: true,
        },
      },
      subChart: {
        key: 'subChart',
        type: 'BarChart',
        props: {
          bars: subBars.length > 0 ? subBars : [{ label: 'No submissions', value: 0 }],
          orientation: 'horizontal',
          showValues: true,
          title: 'Submissions by Form',
        },
      },
      formKV: {
        key: 'formKV',
        type: 'KeyValueList',
        props: {
          items: [
            { label: 'Total Forms', value: String(totalForms), bold: true },
            { label: 'Total Surveys', value: String(totalSurveys) },
            { label: 'Submissions', value: totalSubmissions.toLocaleString(), variant: 'highlight' as const },
            { label: 'Active', value: String(activeForms), variant: 'success' as const },
            { label: 'Avg Submissions', value: all.length > 0 ? String(Math.round(totalSubmissions / all.length)) : '0' },
          ],
          compact: true,
        },
      },
    },
  };
}
