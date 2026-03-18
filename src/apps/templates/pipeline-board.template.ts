import { UITree } from '../types.js';

export function buildPipelineBoardTree(data: {
  pipeline: any;
  opportunities: any[];
  stages: any[];
}): UITree {
  const pipeline = data.pipeline || {};
  const opportunities = data.opportunities || [];
  const stages = data.stages || [];
  const fmt = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);
  const fmtDate = (d: string) => d ? new Date(d).toLocaleDateString() : '—';

  const totalValue = opportunities.reduce((s: number, o: any) => s + (o.monetaryValue || 0), 0);
  const openCount = opportunities.filter((o: any) => o.status === 'open').length;
  const wonCount = opportunities.filter((o: any) => o.status === 'won').length;
  const lostCount = opportunities.filter((o: any) => o.status === 'lost').length;
  const winRate = (openCount + wonCount + lostCount) > 0 ? Math.round((wonCount / (wonCount + lostCount || 1)) * 100) : 0;

  // Build kanban columns from real pipeline stages
  const columns = stages.map((stage: any) => {
    const stageOpps = opportunities.filter((o: any) => o.pipelineStageId === stage.id);
    const stageValue = stageOpps.reduce((s: number, o: any) => s + (o.monetaryValue || 0), 0);

    return {
      id: stage.id,
      title: stage.name || '—',
      count: stageOpps.length,
      totalValue: stageValue > 0 ? fmt(stageValue) : undefined,
      cards: stageOpps.slice(0, 8).map((opp: any) => ({
        id: opp.id,
        title: opp.name || 'Untitled',
        subtitle: opp.contact?.name || opp.contact?.email || '—',
        value: opp.monetaryValue ? fmt(opp.monetaryValue) : undefined,
        status: opp.status || 'open',
        statusVariant: opp.status || 'open',
        date: fmtDate(opp.updatedAt),
        avatarInitials: opp.contact?.name
          ? opp.contact.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()
          : undefined,
      })),
    };
  });

  // Stage value bar chart
  const stageBars = stages.map((stage: any) => {
    const stageOpps = opportunities.filter((o: any) => o.pipelineStageId === stage.id);
    return {
      label: (stage.name || 'Stage').slice(0, 15),
      value: stageOpps.length,
      color: '#3b82f6',
    };
  }).filter((b: any) => b.value > 0);

  return {
    root: 'page',
    elements: {
      page: {
        key: 'page',
        type: 'PageHeader',
        props: {
          title: pipeline.name || 'Pipeline',
          subtitle: `${opportunities.length} opportunities · ${fmt(totalValue)} total value`,
          gradient: true,
          stats: [
            { label: 'Total Value', value: fmt(totalValue) },
            { label: 'Open', value: String(openCount) },
            { label: 'Won', value: String(wonCount) },
            { label: 'Win Rate', value: `${winRate}%` },
          ],
        },
        children: ['pipeActions', 'metrics', 'mainLayout'],
      },
      pipeActions: {
        key: 'pipeActions',
        type: 'ActionBar',
        props: { align: 'right' },
        children: ['pipeCreateOppBtn', 'pipeSearchBtn'],
      },
      pipeCreateOppBtn: {
        key: 'pipeCreateOppBtn',
        type: 'FormGroup',
        props: {
          submitTool: 'create_opportunity',
          submitLabel: '+ Create Opportunity',
          fields: [
            { key: 'name', label: 'Deal Name', type: 'text', placeholder: 'New Deal', required: true },
            { key: 'pipelineId', label: 'Pipeline ID', type: 'text', placeholder: pipeline.id || '', required: true },
            { key: 'contactId', label: 'Contact ID', type: 'text', placeholder: 'Contact ID', required: true },
            { key: 'monetaryValue', label: 'Value ($)', type: 'number', placeholder: '0' },
          ],
        },
      },
      pipeSearchBtn: {
        key: 'pipeSearchBtn',
        type: 'ActionButton',
        props: { label: 'Search Opportunities', variant: 'secondary', toolName: 'search_opportunities', toolArgs: {} },
      },
      metrics: {
        key: 'metrics',
        type: 'StatsGrid',
        props: { columns: 4 },
        children: ['mValue', 'mOpen', 'mWon', 'mRate'],
      },
      mValue: { key: 'mValue', type: 'MetricCard', props: { label: 'Pipeline Value', value: fmt(totalValue), color: 'blue' } },
      mOpen: { key: 'mOpen', type: 'MetricCard', props: { label: 'Open Deals', value: String(openCount), color: 'purple' } },
      mWon: { key: 'mWon', type: 'MetricCard', props: { label: 'Won', value: String(wonCount), color: 'green', trend: wonCount > 0 ? 'up' : 'flat' } },
      mRate: { key: 'mRate', type: 'MetricCard', props: { label: 'Win Rate', value: `${winRate}%`, color: 'yellow' } },
      mainLayout: {
        key: 'mainLayout',
        type: 'SplitLayout',
        props: { ratio: '67/33', gap: 'md' },
        children: ['board', 'sidePanel'],
      },
      board: {
        key: 'board',
        type: 'KanbanBoard',
        props: { columns, moveTool: 'update_opportunity' },
      },
      sidePanel: {
        key: 'sidePanel',
        type: 'Card',
        props: { title: 'Pipeline Health' },
        children: ['winProgress', 'stageChart', 'pipeKV'],
      },
      winProgress: {
        key: 'winProgress',
        type: 'ProgressBar',
        props: {
          label: 'Win Rate',
          value: winRate,
          max: 100,
          color: winRate >= 50 ? 'green' : winRate >= 25 ? 'yellow' : 'red',
          showPercent: true,
        },
      },
      stageChart: {
        key: 'stageChart',
        type: 'BarChart',
        props: {
          bars: stageBars.length > 0 ? stageBars : [{ label: 'No stages', value: 0 }],
          orientation: 'horizontal',
          showValues: true,
          title: 'Deals per Stage',
        },
      },
      pipeKV: {
        key: 'pipeKV',
        type: 'KeyValueList',
        props: {
          items: [
            { label: 'Total Value', value: fmt(totalValue), bold: true, variant: 'highlight' as const },
            { label: 'Open Deals', value: String(openCount) },
            { label: 'Won', value: String(wonCount), variant: 'success' as const },
            { label: 'Lost', value: String(lostCount), variant: lostCount > 0 ? 'danger' as const : 'muted' as const },
            { label: 'Stages', value: String(stages.length) },
          ],
          compact: true,
        },
      },
    },
  };
}
