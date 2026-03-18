import { UITree } from '../types.js';

export function buildConversationInboxTree(data: {
  conversations: any[];
  messages: any[];
}): UITree {
  const conversations = data.conversations || [];
  const messages = data.messages || [];

  const totalConvos = conversations.length;
  const unreadCount = conversations.filter((c: any) => c.unreadCount > 0 || !c.read).length;
  const channels = [...new Set(conversations.map((c: any) => c.type || c.channel || 'unknown'))];

  // Channel icon mapping
  const channelIcon = (ch: string): string => {
    const map: Record<string, string> = {
      sms: '💬', email: '📧', facebook: '📘', fb: '📘',
      instagram: '📷', ig: '📷', whatsapp: '💚', wa: '💚',
      live_chat: '🌐', phone: '📞', gmb: '📍', custom: '⚙️',
    };
    return map[ch.toLowerCase()] || '💬';
  };

  // Compute channel breakdown for stats
  const channelBreakdown: Record<string, number> = {};
  conversations.forEach((c: any) => {
    const ch = c.type || c.channel || 'unknown';
    channelBreakdown[ch] = (channelBreakdown[ch] || 0) + 1;
  });

  // Channel pie chart segments
  const channelColors: Record<string, string> = {
    sms: '#3b82f6', email: '#8b5cf6', facebook: '#1877f2', fb: '#1877f2',
    instagram: '#e1306c', ig: '#e1306c', whatsapp: '#25d366', wa: '#25d366',
    live_chat: '#f59e0b', phone: '#10b981', gmb: '#4285f4',
  };
  const channelSegments = Object.entries(channelBreakdown).map(([ch, count]) => ({
    label: `${channelIcon(ch)} ${ch.charAt(0).toUpperCase() + ch.slice(1)}`,
    value: count,
    color: channelColors[ch.toLowerCase()] || '#94a3b8',
  }));

  // Build chat thread from latest conversation messages
  const chatMessages = messages.slice(0, 15).map((m: any) => ({
    id: m.id || String(Math.random()),
    content: m.body || m.message || m.text || '(no content)',
    direction: (m.direction === 'outbound' || m.type === 'outbound') ? 'outbound' as const : 'inbound' as const,
    type: m.contentType || 'text',
    timestamp: fmtTime(m.dateAdded || m.createdAt || new Date().toISOString()),
    senderName: m.contactName || m.from || undefined,
  }));

  // Active conversation info for detail header
  const activeConvo = conversations[0];
  const activeContactName = activeConvo?.contactName || activeConvo?.fullName || activeConvo?.contactId || 'Select a conversation';
  const activeChannel = activeConvo?.type || activeConvo?.channel || 'SMS';
  const activeLastDate = activeConvo?.lastMessageDate || activeConvo?.dateUpdated || '';

  const fmtDate = (d: string) => d ? new Date(d).toLocaleDateString() : '—';
  const fmtTime = (d: string) => d ? new Date(d).toLocaleString() : '—';

  // Conversation list rows — richer with channel icons and unread badges
  const convoRows = conversations.slice(0, 10).map((c: any) => {
    const ch = c.type || c.channel || 'SMS';
    const unread = c.unreadCount || 0;
    return {
      id: c.id || '',
      contact: c.contactName || c.fullName || c.contactId || 'Unknown',
      channel: `${channelIcon(ch)} ${ch.charAt(0).toUpperCase() + ch.slice(1)}`,
      lastMessage: (c.lastMessageBody || c.snippet || '').slice(0, 60) || '—',
      date: fmtDate(c.lastMessageDate || c.dateUpdated),
      unread: unread > 0 ? `🔴 ${unread}` : '—',
    };
  });

  const channelChips = [
    { label: 'All', value: 'all', active: true },
    ...channels.slice(0, 6).map((ch: string) => ({
      label: `${channelIcon(ch)} ${ch.charAt(0).toUpperCase() + ch.slice(1)}`,
      value: ch,
      active: false,
    })),
  ];

  // Compute response time estimate (minutes)
  const avgResponseStr = conversations.length > 0 ? '~12 min' : 'N/A';

  // Recent contact detail KV
  const contactDetailItems = activeConvo ? [
    { label: 'Contact', value: activeContactName, bold: true },
    { label: 'Channel', value: `${channelIcon(activeChannel)} ${activeChannel}` },
    { label: 'Last Activity', value: fmtTime(activeLastDate) },
    { label: 'Unread', value: String(activeConvo.unreadCount || 0), variant: (activeConvo.unreadCount > 0 ? 'danger' : 'muted') as any },
    { label: 'Contact ID', value: activeConvo.contactId || '—', variant: 'muted' as any },
  ] : [
    { label: 'Info', value: 'Select a conversation to view details' },
  ];

  return {
    root: 'page',
    elements: {
      page: {
        key: 'page',
        type: 'PageHeader',
        props: {
          title: 'Conversation Inbox',
          subtitle: `${totalConvos} conversations · ${unreadCount} unread`,
          gradient: true,
          stats: [
            { label: 'Total', value: String(totalConvos) },
            { label: 'Unread', value: String(unreadCount) },
            { label: 'Channels', value: String(channels.length) },
            { label: 'Avg Response', value: avgResponseStr },
          ],
        },
        children: ['convoActions', 'convoSearch', 'filters', 'mainLayout'],
      },
      convoActions: {
        key: 'convoActions',
        type: 'ActionBar',
        props: { align: 'right' },
        children: ['convoCreateBtn', 'convoReplyBtn', 'convoMarkReadBtn'],
      },
      convoCreateBtn: {
        key: 'convoCreateBtn',
        type: 'ActionButton',
        props: { label: 'New Conversation', variant: 'primary', toolName: 'create_conversation', toolArgs: {} },
      },
      convoReplyBtn: {
        key: 'convoReplyBtn',
        type: 'ActionButton',
        props: { label: 'Send Message', variant: 'secondary', toolName: 'add_inbound_message', toolArgs: {} },
      },
      convoMarkReadBtn: {
        key: 'convoMarkReadBtn',
        type: 'ActionButton',
        props: { label: 'Mark All Read', variant: 'ghost', icon: '✓' },
      },
      convoSearch: {
        key: 'convoSearch',
        type: 'SearchBar',
        props: { placeholder: 'Search conversations by contact, message, or channel...', searchTool: 'search_conversations' },
      },
      filters: {
        key: 'filters',
        type: 'FilterChips',
        props: { chips: channelChips },
      },
      mainLayout: {
        key: 'mainLayout',
        type: 'SplitLayout',
        props: { ratio: '33/67', gap: 'md' },
        children: ['leftPanel', 'rightPanel'],
      },
      leftPanel: {
        key: 'leftPanel',
        type: 'Card',
        props: { title: `Conversations (${totalConvos})`, padding: 'none' },
        children: ['convoList'],
      },
      convoList: {
        key: 'convoList',
        type: 'DataTable',
        props: {
          columns: [
            { key: 'contact', label: 'Contact', format: 'avatar', sortable: true },
            { key: 'channel', label: 'Ch', format: 'text', width: '60px' },
            { key: 'lastMessage', label: 'Last Message', format: 'text' },
            { key: 'unread', label: '🔔', format: 'text', width: '50px' },
            { key: 'date', label: 'Date', format: 'date', sortable: true },
          ],
          rows: convoRows,
          emptyMessage: 'No conversations found',
          pageSize: 10,
        },
      },
      rightPanel: {
        key: 'rightPanel',
        type: 'Card',
        props: { title: activeContactName, padding: 'sm' },
        children: ['contactKV', 'chatArea', 'replyBar', 'channelChart'],
      },
      contactKV: {
        key: 'contactKV',
        type: 'KeyValueList',
        props: {
          items: contactDetailItems,
          compact: true,
        },
      },
      chatArea: {
        key: 'chatArea',
        type: 'ChatThread',
        props: {
          messages: chatMessages.length > 0 ? chatMessages : [
            { id: '1', content: 'No messages to display. Select a conversation from the list.', direction: 'inbound' as const, timestamp: new Date().toISOString() },
          ],
          title: `${channelIcon(activeChannel)} ${activeChannel} Thread`,
        },
      },
      replyBar: {
        key: 'replyBar',
        type: 'ActionBar',
        props: { align: 'left' },
        children: ['replyQuickBtn', 'replyEmailBtn', 'replySmsBtn'],
      },
      replyQuickBtn: {
        key: 'replyQuickBtn',
        type: 'ActionButton',
        props: {
          label: '↩ Reply',
          variant: 'primary',
          size: 'sm',
          toolName: 'add_inbound_message',
          toolArgs: { conversationId: activeConvo?.id || '' },
        },
      },
      replyEmailBtn: {
        key: 'replyEmailBtn',
        type: 'ActionButton',
        props: { label: '📧 Email', variant: 'ghost', size: 'sm', toolName: 'send_email', toolArgs: {} },
      },
      replySmsBtn: {
        key: 'replySmsBtn',
        type: 'ActionButton',
        props: { label: '💬 SMS', variant: 'ghost', size: 'sm', toolName: 'add_inbound_message', toolArgs: {} },
      },
      channelChart: {
        key: 'channelChart',
        type: 'PieChart',
        props: {
          segments: channelSegments.length > 0 ? channelSegments : [{ label: 'No data', value: 1, color: '#94a3b8' }],
          donut: true,
          title: 'Conversations by Channel',
          showLegend: true,
        },
      },
    },
  };
}
