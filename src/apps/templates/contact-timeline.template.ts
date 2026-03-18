import { UITree } from '../types.js';

export function buildContactTimelineTree(data: {
  contact: any;
  notes: any;
  tasks: any;
}): UITree {
  const contact = data.contact || {};
  const notes = Array.isArray(data.notes) ? data.notes : data.notes?.notes || [];
  const tasks = Array.isArray(data.tasks) ? data.tasks : data.tasks?.tasks || [];
  const fmtDate = (d: string) => d ? new Date(d).toLocaleDateString() : '—';

  const contactName = `${contact.firstName || ''} ${contact.lastName || ''}`.trim() || 'Unknown Contact';
  const email = contact.email || '—';
  const phone = contact.phone || '—';

  const completedTasks = tasks.filter((t: any) => t.completed).length;
  const pendingTasks = tasks.length - completedTasks;
  const taskCompletionRate = tasks.length > 0 ? Math.round((completedTasks / tasks.length) * 100) : 0;

  // Build timeline events from notes + tasks, sorted by date
  const events: any[] = [];

  for (const note of notes) {
    events.push({
      id: note.id || `note-${events.length}`,
      title: 'Note Added',
      description: (note.body || note.content || note.text || 'Note').slice(0, 100),
      timestamp: (note.dateAdded || note.createdAt) ? new Date(note.dateAdded || note.createdAt).toLocaleString() : '—',
      icon: 'note',
      variant: 'default',
      _sort: new Date(note.dateAdded || note.createdAt || 0).getTime(),
    });
  }

  for (const task of tasks) {
    events.push({
      id: task.id || `task-${events.length}`,
      title: task.title || task.name || 'Task',
      description: (task.description || task.body || (task.completed ? 'Completed' : 'Pending')).slice(0, 100),
      timestamp: (task.dueDate || task.createdAt) ? new Date(task.dueDate || task.createdAt).toLocaleString() : '—',
      icon: 'task',
      variant: task.completed ? 'success' : 'default',
      _sort: new Date(task.dueDate || task.createdAt || 0).getTime(),
    });
  }

  if (contact.dateAdded || contact.createdAt) {
    events.push({
      id: 'contact-created',
      title: 'Contact Created',
      description: `${contactName} was added to the CRM`,
      timestamp: new Date(contact.dateAdded || contact.createdAt).toLocaleString(),
      icon: 'system',
      variant: 'default',
      _sort: new Date(contact.dateAdded || contact.createdAt).getTime(),
    });
  }

  events.sort((a, b) => (b._sort || 0) - (a._sort || 0));
  const cleanEvents = events.map(({ _sort, ...rest }) => rest);

  // Activity type breakdown
  const activityBars = [
    { label: 'Notes', value: notes.length, color: '#3b82f6' },
    { label: 'Tasks', value: tasks.length, color: '#8b5cf6' },
    { label: 'Completed', value: completedTasks, color: '#10b981' },
    { label: 'Pending', value: pendingTasks, color: '#f59e0b' },
  ].filter(b => b.value > 0);

  return {
    root: 'page',
    elements: {
      page: {
        key: 'page',
        type: 'DetailHeader',
        props: {
          title: contactName,
          subtitle: email !== '—' ? email : phone,
          entityId: contact.id || '—',
          status: contact.type || 'lead',
          statusVariant: 'active',
        },
        children: ['ctActions', 'tabs', 'metrics', 'layout'],
      },
      ctActions: {
        key: 'ctActions',
        type: 'ActionBar',
        props: { align: 'right' },
        children: ['ctAddNoteBtn', 'ctAddTaskBtn', 'ctSendSmsBtn', 'ctSendEmailBtn'],
      },
      ctAddNoteBtn: {
        key: 'ctAddNoteBtn',
        type: 'ActionButton',
        props: { label: 'Add Note', variant: 'primary', toolName: 'create_contact_note', toolArgs: { contactId: contact.id || '', body: 'New note' } },
      },
      ctAddTaskBtn: {
        key: 'ctAddTaskBtn',
        type: 'ActionButton',
        props: { label: 'Add Task', variant: 'secondary', toolName: 'create_contact_task', toolArgs: { contactId: contact.id || '' } },
      },
      ctSendSmsBtn: {
        key: 'ctSendSmsBtn',
        type: 'ActionButton',
        props: { label: 'Send SMS', variant: 'secondary', toolName: 'send_sms', toolArgs: { contactId: contact.id || '', message: 'Hello!' } },
      },
      ctSendEmailBtn: {
        key: 'ctSendEmailBtn',
        type: 'ActionButton',
        props: { label: 'Send Email', variant: 'secondary', toolName: 'send_email', toolArgs: { contactId: contact.id || '', subject: 'Hello', message: 'Hello!' } },
      },
      tabs: {
        key: 'tabs',
        type: 'TabGroup',
        props: {
          tabs: [
            { label: 'Timeline', value: 'timeline', count: cleanEvents.length },
            { label: 'Notes', value: 'notes', count: notes.length },
            { label: 'Tasks', value: 'tasks', count: tasks.length },
          ],
          activeTab: 'timeline',
        },
      },
      metrics: {
        key: 'metrics',
        type: 'StatsGrid',
        props: { columns: 4 },
        children: ['mEvents', 'mNotes', 'mTasks', 'mCompletion'],
      },
      mEvents: { key: 'mEvents', type: 'MetricCard', props: { label: 'Total Activity', value: String(cleanEvents.length), color: 'blue' } },
      mNotes: { key: 'mNotes', type: 'MetricCard', props: { label: 'Notes', value: String(notes.length), color: 'purple' } },
      mTasks: { key: 'mTasks', type: 'MetricCard', props: { label: 'Tasks', value: String(tasks.length), color: 'green' } },
      mCompletion: { key: 'mCompletion', type: 'MetricCard', props: { label: 'Task Completion', value: `${taskCompletionRate}%`, color: 'yellow' } },
      layout: {
        key: 'layout',
        type: 'SplitLayout',
        props: { ratio: '67/33', gap: 'md' },
        children: ['timelineCard', 'sidePanel'],
      },
      timelineCard: {
        key: 'timelineCard',
        type: 'Card',
        props: { title: 'Activity Timeline', padding: 'sm' },
        children: ['timeline'],
      },
      timeline: {
        key: 'timeline',
        type: 'Timeline',
        props: {
          events: cleanEvents.length > 0
            ? cleanEvents
            : [{
                id: 'placeholder',
                title: 'No activity yet',
                description: 'Notes, tasks, and activity will appear here',
                timestamp: new Date().toLocaleString(),
                icon: 'system',
              }],
        },
      },
      sidePanel: {
        key: 'sidePanel',
        type: 'Card',
        props: { title: 'Contact Info' },
        children: ['contactInfo', 'taskProgress', 'activityChart'],
      },
      contactInfo: {
        key: 'contactInfo',
        type: 'KeyValueList',
        props: {
          items: [
            { label: 'Name', value: contactName, bold: true },
            { label: 'Email', value: email },
            { label: 'Phone', value: phone },
            { label: 'Tags', value: (contact.tags || []).join(', ') || '—' },
            { label: 'Source', value: contact.source || '—' },
            { label: 'Added', value: fmtDate(contact.dateAdded || contact.createdAt) },
          ],
          compact: true,
        },
      },
      taskProgress: {
        key: 'taskProgress',
        type: 'ProgressBar',
        props: {
          label: 'Task Completion',
          value: taskCompletionRate,
          max: 100,
          color: taskCompletionRate >= 75 ? 'green' : taskCompletionRate >= 50 ? 'yellow' : 'red',
          showPercent: true,
        },
      },
      activityChart: {
        key: 'activityChart',
        type: 'BarChart',
        props: {
          bars: activityBars.length > 0 ? activityBars : [{ label: 'No activity', value: 0 }],
          orientation: 'horizontal',
          showValues: true,
          title: 'Activity Breakdown',
        },
      },
    },
  };
}
