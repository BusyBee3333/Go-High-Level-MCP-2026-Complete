import { UITree } from '../types.js';

export function buildQuickBookTree(data: {
  calendar: any;
  contact: any;
  locationId: string;
}): UITree {
  const calendar = data.calendar || {};
  const contact = data.contact || null;
  const contactName = contact
    ? `${contact.firstName || ''} ${contact.lastName || ''}`.trim() || 'Unknown'
    : undefined;
  const fmtDate = (d: string) => d ? new Date(d).toLocaleDateString() : '—';

  const now = new Date();

  return {
    root: 'page',
    elements: {
      page: {
        key: 'page',
        type: 'PageHeader',
        props: {
          title: 'Quick Book',
          subtitle: calendar.name || 'Appointment Booking',
          gradient: true,
          stats: [
            { label: 'Calendar', value: calendar.name || '—' },
            ...(contact ? [{ label: 'Contact', value: contactName || '—' }] : []),
            { label: 'Location', value: data.locationId || '—' },
          ],
        },
        children: ['bookActions', 'mainLayout'],
      },
      bookActions: {
        key: 'bookActions',
        type: 'ActionBar',
        props: { align: 'right' },
        children: ['bookCreateBtn', 'bookBlockBtn'],
      },
      bookCreateBtn: {
        key: 'bookCreateBtn',
        type: 'ActionButton',
        props: { label: 'Book Appointment', variant: 'primary', toolName: 'create_appointment', toolArgs: {} },
      },
      bookBlockBtn: {
        key: 'bookBlockBtn',
        type: 'ActionButton',
        props: { label: 'Block Slot', variant: 'secondary', toolName: 'create_block_slot', toolArgs: {} },
      },
      mainLayout: {
        key: 'mainLayout',
        type: 'SplitLayout',
        props: { ratio: '50/50', gap: 'md' },
        children: ['leftCol', 'rightCol'],
      },
      leftCol: {
        key: 'leftCol',
        type: 'Card',
        props: { title: 'Select a Date', padding: 'sm' },
        children: ['calendarView'],
      },
      calendarView: {
        key: 'calendarView',
        type: 'CalendarView',
        props: {
          year: now.getFullYear(),
          month: now.getMonth() + 1,
          events: [],
          highlightToday: true,
          title: 'Select a Date',
        },
      },
      rightCol: {
        key: 'rightCol',
        type: 'Card',
        props: { title: 'Booking Details' },
        children: ['contactKV', 'bookingForm', 'bookChart'],
      },
      contactKV: {
        key: 'contactKV',
        type: 'KeyValueList',
        props: {
          items: [
            { label: 'Calendar', value: calendar.name || '—', bold: true },
            { label: 'Calendar ID', value: calendar.id || '—', variant: 'muted' as const },
            { label: 'Contact', value: contactName || 'Not selected', bold: !!contact },
            { label: 'Email', value: contact?.email || '—' },
            { label: 'Phone', value: contact?.phone || '—' },
            { label: 'Added', value: fmtDate(contact?.dateAdded) },
          ],
          compact: true,
        },
      },
      bookingForm: {
        key: 'bookingForm',
        type: 'FormGroup',
        props: {
          fields: [
            {
              key: 'calendarId',
              label: 'Calendar',
              type: 'text',
              value: calendar.id || '',
              required: true,
            },
            {
              key: 'contactId',
              label: 'Contact ID',
              type: 'text',
              value: contact?.id || '',
              required: true,
            },
            {
              key: 'startTime',
              label: 'Start Time (ISO)',
              type: 'text',
              value: '',
              required: true,
            },
            {
              key: 'title',
              label: 'Title',
              type: 'text',
              value: '',
            },
          ],
          submitLabel: 'Book Appointment',
          submitTool: 'create_appointment',
        },
      },
      bookChart: {
        key: 'bookChart',
        type: 'PieChart',
        props: {
          segments: [
            { label: 'Available', value: 75, color: '#10b981' },
            { label: 'Booked', value: 25, color: '#94a3b8' },
          ],
          donut: true,
          title: 'Availability',
          showLegend: true,
        },
      },
    },
  };
}
