import { UITree } from '../types.js';

export function buildCustomFieldsManagerTree(data: {
  customFields: any[];
}): UITree {
  const fields = data.customFields || [];

  const totalFields = fields.length;
  const fieldTypes = [...new Set(fields.map((f: any) => f.dataType || f.type || 'text'))];
  const required = fields.filter((f: any) => f.isRequired || f.required).length;
  const optional = totalFields - required;

  const fieldRows = fields.slice(0, 12).map((f: any) => ({
    id: f.id || '',
    name: f.name || f.fieldName || 'Untitled Field',
    fieldKey: f.fieldKey || f.key || '—',
    type: f.dataType || f.type || 'text',
    required: f.isRequired || f.required ? '✅ Yes' : 'No',
    model: f.model || f.objectType || 'contact',
    placeholder: f.placeholder || '—',
  }));

  // Type distribution pie chart
  const typeCount: Record<string, number> = {};
  fields.forEach((f: any) => {
    const t = f.dataType || f.type || 'text';
    typeCount[t] = (typeCount[t] || 0) + 1;
  });
  const typeSegments = Object.entries(typeCount).map(([label, value], i) => ({
    label: label.charAt(0).toUpperCase() + label.slice(1),
    value,
    color: ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#ec4899'][i % 6],
  }));

  // Model distribution bar chart
  const modelCount: Record<string, number> = {};
  fields.forEach((f: any) => {
    const m = f.model || f.objectType || 'contact';
    modelCount[m] = (modelCount[m] || 0) + 1;
  });
  const modelBars = Object.entries(modelCount).map(([label, value]) => ({
    label: label.charAt(0).toUpperCase() + label.slice(1),
    value,
    color: '#3b82f6',
  }));

  const treeNodes = fieldTypes.map((t) => ({
    id: t,
    label: `${t} (${typeCount[t] || 0})`,
    icon: undefined,
    children: fields
      .filter((f: any) => (f.dataType || f.type || 'text') === t)
      .slice(0, 5)
      .map((f: any) => ({ id: f.id || f.fieldKey || '', label: f.name || f.fieldName || 'Field' })),
  }));

  return {
    root: 'page',
    elements: {
      page: {
        key: 'page',
        type: 'PageHeader',
        props: {
          title: 'Custom Fields Manager',
          subtitle: `${totalFields} fields · ${fieldTypes.length} types · ${required} required`,
          gradient: true,
          stats: [
            { label: 'Fields', value: String(totalFields) },
            { label: 'Types', value: String(fieldTypes.length) },
            { label: 'Required', value: String(required) },
            { label: 'Optional', value: String(optional) },
          ],
        },
        children: ['cfActions', 'cfSearch', 'metrics', 'layout'],
      },
      cfActions: {
        key: 'cfActions',
        type: 'ActionBar',
        props: { align: 'right' },
        children: ['cfCreateFieldBtn', 'cfCreateFolderBtn', 'cfDeleteFieldBtn'],
      },
      cfCreateFieldBtn: {
        key: 'cfCreateFieldBtn',
        type: 'ActionButton',
        props: { label: 'Create Field', variant: 'primary', toolName: 'ghl_create_custom_field', toolArgs: {} },
      },
      cfCreateFolderBtn: {
        key: 'cfCreateFolderBtn',
        type: 'ActionButton',
        props: { label: 'Create Folder', variant: 'secondary', toolName: 'ghl_create_custom_field_folder', toolArgs: {} },
      },
      cfDeleteFieldBtn: {
        key: 'cfDeleteFieldBtn',
        type: 'ActionButton',
        props: { label: 'Delete Field', variant: 'secondary', toolName: 'ghl_delete_custom_field', toolArgs: {} },
      },
      cfSearch: {
        key: 'cfSearch',
        type: 'SearchBar',
        props: { placeholder: 'Search custom fields...', searchTool: 'ghl_get_custom_fields_by_object_key' },
      },
      metrics: {
        key: 'metrics',
        type: 'StatsGrid',
        props: { columns: 4 },
        children: ['mFields', 'mTypes', 'mReq', 'mOpt'],
      },
      mFields: { key: 'mFields', type: 'MetricCard', props: { label: 'Total Fields', value: String(totalFields), color: 'blue' } },
      mTypes: { key: 'mTypes', type: 'MetricCard', props: { label: 'Field Types', value: String(fieldTypes.length), color: 'purple' } },
      mReq: { key: 'mReq', type: 'MetricCard', props: { label: 'Required', value: String(required), color: 'red' } },
      mOpt: { key: 'mOpt', type: 'MetricCard', props: { label: 'Optional', value: String(optional), color: 'green' } },
      layout: {
        key: 'layout',
        type: 'SplitLayout',
        props: { ratio: '67/33', gap: 'md' },
        children: ['fieldTableCard', 'sidePanel'],
      },
      fieldTableCard: {
        key: 'fieldTableCard',
        type: 'Card',
        props: { title: `Custom Fields (${totalFields})`, padding: 'none' },
        children: ['fieldTable'],
      },
      fieldTable: {
        key: 'fieldTable',
        type: 'DataTable',
        props: {
          columns: [
            { key: 'name', label: 'Field Name', format: 'text', sortable: true },
            { key: 'fieldKey', label: 'Key', format: 'text' },
            { key: 'type', label: 'Type', format: 'status' },
            { key: 'required', label: 'Required', format: 'text' },
            { key: 'model', label: 'Object', format: 'status' },
          ],
          rows: fieldRows,
          emptyMessage: 'No custom fields found',
          pageSize: 12,
        },
      },
      sidePanel: {
        key: 'sidePanel',
        type: 'Card',
        props: { title: 'Field Analytics' },
        children: ['typeChart', 'modelChart', 'typeTree', 'cfKV'],
      },
      typeChart: {
        key: 'typeChart',
        type: 'PieChart',
        props: {
          segments: typeSegments.length > 0 ? typeSegments : [{ label: 'No fields', value: 1, color: '#94a3b8' }],
          donut: true,
          title: 'Fields by Type',
          showLegend: true,
        },
      },
      modelChart: {
        key: 'modelChart',
        type: 'BarChart',
        props: {
          bars: modelBars.length > 0 ? modelBars : [{ label: 'No data', value: 0 }],
          orientation: 'horizontal',
          showValues: true,
          title: 'Fields by Object',
        },
      },
      typeTree: {
        key: 'typeTree',
        type: 'TreeView',
        props: {
          nodes: treeNodes.length > 0 ? treeNodes : [{ id: 'none', label: 'No fields' }],
          title: 'Field Types',
          expandAll: true,
        },
      },
      cfKV: {
        key: 'cfKV',
        type: 'KeyValueList',
        props: {
          items: [
            { label: 'Total Fields', value: String(totalFields), bold: true },
            { label: 'Field Types', value: String(fieldTypes.length) },
            { label: 'Required', value: String(required), variant: 'danger' as const },
            { label: 'Optional', value: String(optional), variant: 'success' as const },
            { label: 'Object Types', value: String(Object.keys(modelCount).length) },
          ],
          compact: true,
        },
      },
    },
  };
}
