import { UITree } from '../types.js';

export function buildWorkflowBuilderTree(data: {
  workflows: any[];
}): UITree {
  const workflows = data.workflows || [];

  const totalWorkflows = workflows.length;
  const active = workflows.filter((w: any) => w.status === 'active' || w.status === 'published').length;
  const draft = workflows.filter((w: any) => w.status === 'draft').length;
  const totalActions = workflows.reduce((s: number, w: any) =>
    s + (w.actions?.length || w.steps?.length || w.actionCount || 0), 0);
  const totalTriggers = workflows.reduce((s: number, w: any) =>
    s + (w.triggers?.length || (w.trigger ? 1 : 0)), 0);

  // Find most recent run
  const runsWithDates = workflows
    .filter((w: any) => w.lastRunAt || w.updatedAt)
    .sort((a: any, b: any) => {
      const da = new Date(a.lastRunAt || a.updatedAt).getTime();
      const db = new Date(b.lastRunAt || b.updatedAt).getTime();
      return db - da;
    });
  const lastRunTimestamp = runsWithDates[0]?.lastRunAt || runsWithDates[0]?.updatedAt || null;
  const lastRunStr = lastRunTimestamp ? new Date(lastRunTimestamp).toLocaleString() : 'Never';

  // Split workflows for tabs: all vs recently run
  const recentlyRun = workflows
    .filter((w: any) => w.lastRunAt)
    .sort((a: any, b: any) => new Date(b.lastRunAt).getTime() - new Date(a.lastRunAt).getTime());

  // Workflow table rows — richer with descriptions
  const workflowRows = workflows.slice(0, 10).map((w: any) => ({
    id: w.id || '',
    name: w.name || 'Untitled Workflow',
    description: (w.description || '').slice(0, 50) || '—',
    status: w.status || 'draft',
    triggers: w.triggers?.length || (w.trigger ? 1 : 0),
    actions: w.actions?.length || w.steps?.length || w.actionCount || 0,
    lastRun: w.lastRunAt ? new Date(w.lastRunAt).toLocaleDateString() : w.updatedAt ? new Date(w.updatedAt).toLocaleDateString() : '—',
  }));

  const recentRows = recentlyRun.slice(0, 8).map((w: any) => ({
    id: w.id || '',
    name: w.name || 'Untitled Workflow',
    status: w.status || 'draft',
    actions: w.actions?.length || w.steps?.length || w.actionCount || 0,
    lastRun: w.lastRunAt ? new Date(w.lastRunAt).toLocaleString() : '—',
  }));

  // Build flow diagram from the first workflow with ACTUAL actions
  const firstWf = workflows[0];
  const flowNodes: any[] = [];
  const flowEdges: any[] = [];

  if (firstWf) {
    // Start with trigger
    const triggerLabel = firstWf.trigger?.type || firstWf.triggers?.[0]?.type || 'Trigger';
    flowNodes.push({ id: 'trigger', label: triggerLabel, type: 'start', description: firstWf.trigger?.name || 'Workflow trigger' });

    const actions = firstWf.actions || firstWf.steps || [];
    let prevId = 'trigger';
    for (let i = 0; i < Math.min(actions.length, 8); i++) {
      const a = actions[i];
      const nid = `a${i}`;
      const actionType = a.type || a.actionType || 'action';
      const isCondition = actionType === 'condition' || actionType === 'if_else' || actionType === 'branch';
      flowNodes.push({
        id: nid,
        label: a.name || a.type || `Step ${i + 1}`,
        type: isCondition ? 'condition' : 'action',
        description: a.description || actionType,
      });
      flowEdges.push({ from: prevId, to: nid, label: i === 0 ? 'start' : undefined });
      prevId = nid;
    }
    flowNodes.push({ id: 'end', label: 'End', type: 'end' });
    flowEdges.push({ from: prevId, to: 'end' });
  } else {
    flowNodes.push(
      { id: 'start', label: 'No workflows', type: 'start', description: 'Create a workflow to see its flow' },
      { id: 'end', label: 'End', type: 'end' },
    );
    flowEdges.push({ from: 'start', to: 'end' });
  }

  // Status distribution bar chart
  const statusCounts: Record<string, number> = {};
  workflows.forEach((w: any) => {
    const s = w.status || 'draft';
    statusCounts[s] = (statusCounts[s] || 0) + 1;
  });
  const statusBars = Object.entries(statusCounts).map(([label, value]) => ({
    label: label.charAt(0).toUpperCase() + label.slice(1),
    value,
    color: label === 'active' || label === 'published' ? '#10b981' : label === 'draft' ? '#94a3b8' : '#f59e0b',
  }));

  // Automation progress: active rate
  const activeRate = totalWorkflows > 0 ? Math.round((active / totalWorkflows) * 100) : 0;

  return {
    root: 'page',
    elements: {
      page: {
        key: 'page',
        type: 'PageHeader',
        props: {
          title: 'Workflow Builder',
          subtitle: `${totalWorkflows} workflows · ${totalActions} total actions · Last run: ${lastRunStr}`,
          gradient: true,
          stats: [
            { label: 'Workflows', value: String(totalWorkflows) },
            { label: 'Active', value: String(active) },
            { label: 'Draft', value: String(draft) },
            { label: 'Total Actions', value: String(totalActions) },
          ],
        },
        children: ['wfActions', 'wfSearch', 'statsRow', 'flow', 'tabs', 'mainLayout'],
      },
      wfActions: {
        key: 'wfActions',
        type: 'ActionBar',
        props: { align: 'right' },
        children: ['wfCreateBtn', 'wfPublishBtn'],
      },
      wfCreateBtn: {
        key: 'wfCreateBtn',
        type: 'ActionButton',
        props: { label: 'Create Workflow', variant: 'primary', toolName: 'ghl_create_workflow', toolArgs: {} },
      },
      wfPublishBtn: {
        key: 'wfPublishBtn',
        type: 'ActionButton',
        props: { label: 'Publish Workflow', variant: 'secondary', toolName: 'ghl_publish_workflow', toolArgs: {} },
      },
      wfSearch: {
        key: 'wfSearch',
        type: 'SearchBar',
        props: { placeholder: 'Search workflows...', searchTool: 'ghl_list_workflows_full' },
      },
      statsRow: {
        key: 'statsRow',
        type: 'StatsGrid',
        props: { columns: 4 },
        children: ['mActive', 'mDraft', 'mActions', 'mLastRun'],
      },
      mActive: {
        key: 'mActive',
        type: 'MetricCard',
        props: { label: 'Active Workflows', value: String(active), color: 'green', trend: active > 0 ? 'up' : 'flat' },
      },
      mDraft: {
        key: 'mDraft',
        type: 'MetricCard',
        props: { label: 'Draft Workflows', value: String(draft), color: 'yellow' },
      },
      mActions: {
        key: 'mActions',
        type: 'MetricCard',
        props: { label: 'Total Actions', value: String(totalActions), color: 'blue' },
      },
      mLastRun: {
        key: 'mLastRun',
        type: 'MetricCard',
        props: { label: 'Last Execution', value: lastRunStr, color: 'purple' },
      },
      flow: {
        key: 'flow',
        type: 'FlowDiagram',
        props: {
          nodes: flowNodes,
          edges: flowEdges,
          direction: 'horizontal',
          title: firstWf ? `Flow: ${firstWf.name || 'First Workflow'}` : 'Workflow Flow',
        },
      },
      tabs: {
        key: 'tabs',
        type: 'TabGroup',
        props: {
          tabs: [
            { label: 'All Workflows', value: 'all', count: totalWorkflows },
            { label: 'Recently Run', value: 'recent', count: recentlyRun.length },
          ],
          activeTab: 'all',
        },
      },
      mainLayout: {
        key: 'mainLayout',
        type: 'SplitLayout',
        props: { ratio: '67/33', gap: 'md' },
        children: ['wfTable', 'sidePanel'],
      },
      wfTable: {
        key: 'wfTable',
        type: 'DataTable',
        props: {
          columns: [
            { key: 'name', label: 'Workflow', format: 'text', sortable: true },
            { key: 'description', label: 'Description', format: 'text' },
            { key: 'status', label: 'Status', format: 'status' },
            { key: 'triggers', label: 'Triggers', format: 'text' },
            { key: 'actions', label: 'Actions', format: 'text', sortable: true },
            { key: 'lastRun', label: 'Last Run', format: 'date', sortable: true },
          ],
          rows: workflowRows,
          emptyMessage: 'No workflows found — create one to get started!',
          pageSize: 10,
        },
      },
      sidePanel: {
        key: 'sidePanel',
        type: 'Card',
        props: { title: 'Workflow Health' },
        children: ['activeProgress', 'statusChart', 'recentList'],
      },
      activeProgress: {
        key: 'activeProgress',
        type: 'ProgressBar',
        props: {
          label: 'Activation Rate',
          value: activeRate,
          max: 100,
          color: activeRate >= 70 ? 'green' : activeRate >= 40 ? 'yellow' : 'red',
          showPercent: true,
        },
      },
      statusChart: {
        key: 'statusChart',
        type: 'BarChart',
        props: {
          bars: statusBars.length > 0 ? statusBars : [{ label: 'No data', value: 0 }],
          orientation: 'horizontal',
          showValues: true,
          title: 'Status Distribution',
        },
      },
      recentList: {
        key: 'recentList',
        type: 'KeyValueList',
        props: {
          items: [
            { label: 'Total Workflows', value: String(totalWorkflows), bold: true },
            { label: 'Active', value: String(active), variant: 'success' },
            { label: 'Draft', value: String(draft), variant: 'muted' },
            { label: 'Total Actions', value: String(totalActions) },
            { label: 'Total Triggers', value: String(totalTriggers) },
            { label: 'Most Recent Run', value: lastRunStr, variant: 'highlight' },
          ],
        },
      },
    },
  };
}
