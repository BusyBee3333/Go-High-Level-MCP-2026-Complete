import { UITree } from '../types.js';

export function buildVoiceAIConsoleTree(data: {
  agents: any[];
  calls: any[];
}): UITree {
  const agents = data.agents || [];
  const calls = data.calls || [];
  const fmtDate = (d: string) => d ? new Date(d).toLocaleDateString() : '—';

  const totalAgents = agents.length;
  const activeAgents = agents.filter((a: any) => a.status === 'active' || a.enabled).length;
  const totalCalls = calls.length;
  const totalDuration = calls.reduce((s: number, c: any) => s + (c.duration || 0), 0);
  const avgDuration = totalCalls > 0 ? Math.round(totalDuration / totalCalls) : 0;
  const activeRate = totalAgents > 0 ? Math.round((activeAgents / totalAgents) * 100) : 0;

  const agentRows = agents.slice(0, 6).map((a: any) => ({
    id: a.id || '',
    name: a.name || 'AI Agent',
    status: a.status || (a.enabled ? 'active' : 'inactive'),
    calls: a.totalCalls || a.callCount || 0,
    avgDuration: a.avgDuration ? `${a.avgDuration}s` : '—',
    voice: a.voice || a.voiceModel || '—',
    created: fmtDate(a.createdAt),
  }));

  // Call volume by agent bar chart
  const agentBars = agents.slice(0, 6).map((a: any) => ({
    label: (a.name || 'Agent').slice(0, 12),
    value: a.totalCalls || a.callCount || 0,
    color: (a.status === 'active' || a.enabled) ? '#10b981' : '#94a3b8',
  })).filter((b: any) => b.value > 0);

  // Recent call transcripts
  const callEntries = calls.slice(0, 5).flatMap((c: any) => {
    const entries: any[] = [];
    if (c.transcript) {
      (c.transcript.entries || c.transcript || []).slice(0, 3).forEach((e: any) => {
        entries.push({
          timestamp: fmtDate(e.timestamp || e.time),
          speaker: e.speaker || e.role || 'Agent',
          text: (e.text || e.content || '').slice(0, 100) || '—',
          speakerRole: e.speakerRole || e.role,
        });
      });
    } else {
      entries.push({
        timestamp: fmtDate(c.createdAt),
        speaker: 'AI Agent',
        text: c.summary || `Call with ${c.contactName || 'contact'} (${c.duration || 0}s)`,
      });
    }
    return entries;
  });

  return {
    root: 'page',
    elements: {
      page: {
        key: 'page',
        type: 'PageHeader',
        props: {
          title: 'Voice AI Console',
          subtitle: `${totalAgents} agents · ${totalCalls} calls · ${avgDuration}s avg`,
          gradient: true,
          stats: [
            { label: 'Agents', value: String(totalAgents) },
            { label: 'Active', value: String(activeAgents) },
            { label: 'Total Calls', value: String(totalCalls) },
            { label: 'Avg Duration', value: `${avgDuration}s` },
          ],
        },
        children: ['voiceActions', 'voiceSearch', 'metrics', 'layout'],
      },
      voiceActions: {
        key: 'voiceActions',
        type: 'ActionBar',
        props: { align: 'right' },
        children: ['voiceCreateAgentBtn', 'voiceCreateActionBtn'],
      },
      voiceCreateAgentBtn: {
        key: 'voiceCreateAgentBtn',
        type: 'ActionButton',
        props: { label: 'Create AI Agent', variant: 'primary', toolName: 'create_voice_ai_agent', toolArgs: {} },
      },
      voiceCreateActionBtn: {
        key: 'voiceCreateActionBtn',
        type: 'ActionButton',
        props: { label: 'Create Action', variant: 'secondary', toolName: 'create_voice_ai_action', toolArgs: {} },
      },
      voiceSearch: {
        key: 'voiceSearch',
        type: 'SearchBar',
        props: { placeholder: 'Search call logs...', searchTool: 'list_voice_ai_call_logs' },
      },
      metrics: {
        key: 'metrics',
        type: 'StatsGrid',
        props: { columns: 4 },
        children: ['mAgents', 'mActive', 'mCalls', 'mDuration'],
      },
      mAgents: { key: 'mAgents', type: 'MetricCard', props: { label: 'AI Agents', value: String(totalAgents), color: 'blue' } },
      mActive: { key: 'mActive', type: 'MetricCard', props: { label: 'Active', value: String(activeAgents), color: 'green', trend: activeAgents > 0 ? 'up' : 'flat' } },
      mCalls: { key: 'mCalls', type: 'MetricCard', props: { label: 'Total Calls', value: String(totalCalls), color: 'purple' } },
      mDuration: { key: 'mDuration', type: 'MetricCard', props: { label: 'Avg Duration', value: `${avgDuration}s`, color: 'yellow' } },
      layout: {
        key: 'layout',
        type: 'SplitLayout',
        props: { ratio: '67/33', gap: 'md' },
        children: ['leftCol', 'sidePanel'],
      },
      leftCol: {
        key: 'leftCol',
        type: 'Card',
        props: { title: 'AI Agents & Transcripts', padding: 'sm' },
        children: ['agentTable', 'transcriptCard'],
      },
      agentTable: {
        key: 'agentTable',
        type: 'DataTable',
        props: {
          columns: [
            { key: 'name', label: 'Agent', format: 'text', sortable: true },
            { key: 'status', label: 'Status', format: 'status' },
            { key: 'calls', label: 'Calls', format: 'text', sortable: true },
            { key: 'voice', label: 'Voice', format: 'text' },
            { key: 'created', label: 'Created', format: 'date' },
          ],
          rows: agentRows,
          emptyMessage: 'No AI agents configured',
          pageSize: 6,
        },
      },
      transcriptCard: {
        key: 'transcriptCard',
        type: 'TranscriptView',
        props: {
          entries: callEntries.length > 0 ? callEntries : [
            { timestamp: '—', speaker: 'System', text: 'No call transcripts available' },
          ],
          title: 'Recent Transcripts',
        },
      },
      sidePanel: {
        key: 'sidePanel',
        type: 'Card',
        props: { title: 'Voice AI Analytics' },
        children: ['activeProgress', 'agentChart', 'voiceKV'],
      },
      activeProgress: {
        key: 'activeProgress',
        type: 'ProgressBar',
        props: {
          label: 'Agent Active Rate',
          value: activeRate,
          max: 100,
          color: activeRate >= 70 ? 'green' : activeRate >= 40 ? 'yellow' : 'red',
          showPercent: true,
        },
      },
      agentChart: {
        key: 'agentChart',
        type: 'BarChart',
        props: {
          bars: agentBars.length > 0 ? agentBars : [{ label: 'No calls', value: 0 }],
          orientation: 'horizontal',
          showValues: true,
          title: 'Calls by Agent',
        },
      },
      voiceKV: {
        key: 'voiceKV',
        type: 'KeyValueList',
        props: {
          items: [
            { label: 'Total Agents', value: String(totalAgents), bold: true },
            { label: 'Active', value: String(activeAgents), variant: 'success' as const },
            { label: 'Total Calls', value: String(totalCalls) },
            { label: 'Avg Duration', value: `${avgDuration}s` },
            { label: 'Total Duration', value: `${Math.floor(totalDuration / 60)}m ${totalDuration % 60}s` },
          ],
          compact: true,
        },
      },
    },
  };
}
