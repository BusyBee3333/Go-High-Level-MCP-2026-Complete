import { UITree } from '../types.js';

export function buildWorkflowStatusTree(data: {
  workflow: any;
  workflows: any[];
  workflowId: string;
  locationId: string;
}): UITree {
  const workflow = data.workflow || {};
  const workflows = data.workflows || [];
  const wfName = workflow.name || 'Workflow';
  const fmtDate = (d: string) => d ? new Date(d).toLocaleDateString() : '—';

  // Build flow diagram from workflow structure
  const flowNodes: any[] = [];
  const flowEdges: any[] = [];

  flowNodes.push({
    id: 'trigger',
    label: workflow.trigger?.type || 'Trigger',
    type: 'start',
    description: workflow.trigger?.name || 'Workflow trigger',
  });

  const actions = workflow.actions || workflow.steps || [];
  let prevId = 'trigger';
  for (let i = 0; i < Math.min(actions.length, 8); i++) {
    const action = actions[i];
    const nodeId = `action-${i}`;
    const isCondition = action.type === 'condition' || action.type === 'if_else';
    flowNodes.push({
      id: nodeId,
      label: action.name || action.type || `Step ${i + 1}`,
      type: isCondition ? 'condition' : 'action',
      description: action.description || undefined,
    });
    flowEdges.push({ from: prevId, to: nodeId });
    prevId = nodeId;
  }

  flowNodes.push({ id: 'end', label: 'End', type: 'end' });
  flowEdges.push({ from: prevId, to: 'end' });

  if (actions.length === 0 && !workflow.trigger) {
    flowNodes.length = 0;
    flowEdges.length = 0;
    flowNodes.push(
      { id: 'start', label: 'Start', type: 'start' },
      { id: 'process', label: wfName, type: 'action', description: workflow.status || 'Active' },
      { id: 'end', label: 'End', type: 'end' },
    );
    flowEdges.push(
      { from: 'start', to: 'process' },
      { from: 'process', to: 'end' },
    );
  }

  const activeCount = workflows.filter((w: any) => w.status === 'active').length;
  const draftCount = workflows.filter((w: any) => w.status === 'draft').length;
  const activeRate = workflows.length > 0 ? Math.round((activeCount / workflows.length) * 100) : 0;

  // Status distribution pie chart
  const statusCounts: Record<string, number> = {};
  workflows.forEach((w: any) => {
    const s = w.status || 'draft';
    statusCounts[s] = (statusCounts[s] || 0) + 1;
  });
  const statusSegments = Object.entries(statusCounts).map(([label, value], i) => ({
    label: label.charAt(0).toUpperCase() + label.slice(1),
    value,
    color: label === 'active' || label === 'published' ? '#10b981' : label === 'draft' ? '#94a3b8' : ['#3b82f6', '#f59e0b'][i % 2],
  }));

  return {
    root: 'page',
    elements: {
      page: {
        key: 'page',
        type: 'PageHeader',
        props: {
          title: wfName,
          subtitle: `Workflow Status · ${actions.length} actions`,
          status: workflow.status || 'active',
          statusVariant: workflow.status === 'active' ? 'active' : 'draft',
          gradient: true,
          stats: [
            { label: 'Status', value: (workflow.status || 'active').charAt(0).toUpperCase() + (workflow.status || 'active').slice(1) },
            { label: 'Actions', value: String(actions.length) },
            { label: 'Active', value: String(activeCount) },
            { label: 'Draft', value: String(draftCount) },
          ],
        },
        children: ['wsActions', 'mainLayout'],
      },
      wsActions: {
        key: 'wsActions',
        type: 'ActionBar',
        props: { align: 'right' },
        children: ['wsPublishBtn', 'wsCloneBtn', 'wsDeleteBtn'],
      },
      wsPublishBtn: {
        key: 'wsPublishBtn',
        type: 'ActionButton',
        props: { label: 'Publish Workflow', variant: 'primary', toolName: 'ghl_publish_workflow', toolArgs: { workflowId: data.workflowId || '' } },
      },
      wsCloneBtn: {
        key: 'wsCloneBtn',
        type: 'ActionButton',
        props: { label: 'Clone Workflow', variant: 'secondary', toolName: 'ghl_clone_workflow', toolArgs: { workflowId: data.workflowId || '' } },
      },
      wsDeleteBtn: {
        key: 'wsDeleteBtn',
        type: 'ActionButton',
        props: { label: 'Delete Workflow', variant: 'secondary', toolName: 'ghl_delete_workflow', toolArgs: { workflowId: data.workflowId || '' } },
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
        props: { title: `${wfName} Flow`, padding: 'sm' },
        children: ['flow', 'statsGrid'],
      },
      flow: {
        key: 'flow',
        type: 'FlowDiagram',
        props: {
          nodes: flowNodes,
          edges: flowEdges,
          direction: 'horizontal',
          title: `${wfName} Flow`,
        },
      },
      statsGrid: {
        key: 'statsGrid',
        type: 'StatsGrid',
        props: { columns: 3 },
        children: ['sActive', 'sDraft', 'sTotal'],
      },
      sActive: { key: 'sActive', type: 'MetricCard', props: { label: 'Active Workflows', value: String(activeCount), color: 'green' } },
      sDraft: { key: 'sDraft', type: 'MetricCard', props: { label: 'Draft Workflows', value: String(draftCount), color: 'yellow' } },
      sTotal: { key: 'sTotal', type: 'MetricCard', props: { label: 'Total', value: String(workflows.length), color: 'blue' } },
      sidePanel: {
        key: 'sidePanel',
        type: 'Card',
        props: { title: 'Workflow Health' },
        children: ['activeProgress', 'statusChart', 'wsKV'],
      },
      activeProgress: {
        key: 'activeProgress',
        type: 'ProgressBar',
        props: {
          label: 'Active Rate',
          value: activeRate,
          max: 100,
          color: activeRate >= 70 ? 'green' : activeRate >= 40 ? 'yellow' : 'red',
          showPercent: true,
        },
      },
      statusChart: {
        key: 'statusChart',
        type: 'PieChart',
        props: {
          segments: statusSegments.length > 0 ? statusSegments : [{ label: 'No data', value: 1, color: '#94a3b8' }],
          donut: true,
          title: 'Workflow Status',
          showLegend: true,
        },
      },
      wsKV: {
        key: 'wsKV',
        type: 'KeyValueList',
        props: {
          items: [
            { label: 'Workflow', value: wfName, bold: true },
            { label: 'Status', value: (workflow.status || 'active').charAt(0).toUpperCase() + (workflow.status || 'active').slice(1), variant: workflow.status === 'active' ? 'success' as const : 'muted' as const },
            { label: 'Actions', value: String(actions.length) },
            { label: 'Total Workflows', value: String(workflows.length) },
            { label: 'Active', value: String(activeCount), variant: 'success' as const },
            { label: 'Draft', value: String(draftCount), variant: 'muted' as const },
            { label: 'Workflow ID', value: data.workflowId || '—', variant: 'muted' as const },
          ],
          compact: true,
        },
      },
    },
  };
}
