import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { GHLApiClient } from '../clients/ghl-api-client.js';
import { resolveRequestVersion } from '../clients/endpoint-version-resolver.js';

type JsonRecord = Record<string, unknown>;
type ApiGeneration = 'v3' | 'v2';
type WorkspaceReadTool = string | ((generation: ApiGeneration) => string);

type WorkflowAction = {
  label: string;
  tool: string;
  arguments: JsonRecord;
  risk: 'read' | 'write' | 'destructive';
  requiresConfirmation: boolean;
};

type WorkspaceToolSpec = {
  name: string;
  title: string;
  description: string;
  app: string;
  access: 'read' | 'write';
  inputProperties?: JsonRecord;
  required?: string[];
  buildActions?: (args: JsonRecord, locationId: string) => WorkflowAction[];
  readPlan?: Array<{
    label: string;
    tool: WorkspaceReadTool;
    method: 'GET' | 'POST';
    path: (args: JsonRecord, locationId: string, generation: ApiGeneration) => string | undefined;
    body?: (args: JsonRecord, locationId: string) => JsonRecord;
  }>;
};

const CONTACT_FIELDS = {
  contactId: { type: 'string', description: 'GHL contact ID.' },
  firstName: { type: 'string' },
  lastName: { type: 'string' },
  email: { type: 'string' },
  phone: { type: 'string' },
  tags: { type: 'array', items: { type: 'string' } },
  note: { type: 'string' },
};

const WORKSPACE_SPECS: WorkspaceToolSpec[] = [
  {
    name: 'crm_list_workspaces',
    title: 'List Curated CRM Workspaces',
    description: 'List the high-level CRM workspaces and the workflow tools agents should prefer before using raw API endpoints.',
    app: 'tool-explorer',
    access: 'read',
  },
  {
    name: 'crm_contact_workspace',
    title: 'Open Contact Workspace Data',
    description: 'Gather the read-side context for a single contact workspace: profile, activity, opportunities, and tasks.',
    app: 'contact-workspace',
    access: 'read',
    inputProperties: {
      contactId: CONTACT_FIELDS.contactId,
      query: { type: 'string', description: 'Name, email, or phone search.' },
      includeActivity: { type: 'boolean', default: true },
    },
    readPlan: [
      { label: 'Contact profile', tool: 'get_contact', method: 'GET', path: (args) => stringArg(args.contactId) ? `/contacts/${stringArg(args.contactId)}` : undefined },
      { label: 'Contact search', tool: 'search_contacts', method: 'GET', path: (args, locationId) => stringArg(args.query) ? `/contacts/search?locationId=${enc(locationId)}&query=${enc(stringArg(args.query))}` : undefined },
      { label: 'Contact tasks', tool: 'get_contact_tasks', method: 'GET', path: (args) => stringArg(args.contactId) ? `/contacts/${stringArg(args.contactId)}/tasks` : undefined },
      { label: 'Contact notes', tool: 'get_contact_notes', method: 'GET', path: (args) => stringArg(args.contactId) ? `/contacts/${stringArg(args.contactId)}/notes` : undefined },
    ],
  },
  {
    name: 'crm_location_overview',
    title: 'Location Overview',
    description: 'Gather one compact, read-only operating overview for a GHL location: location profile, contacts, pipelines, calendars, products, and email activity.',
    app: 'agency-admin',
    access: 'read',
    readPlan: [
      { label: 'Location profile', tool: 'get_location', method: 'GET', path: (_args, locationId) => `/locations/${enc(locationId)}` },
      { label: 'Recent contacts', tool: 'search_contacts', method: 'POST', path: () => '/contacts/search', body: (_args, locationId) => ({ locationId, pageLimit: 5 }) },
      { label: 'Pipelines', tool: 'get_pipelines', method: 'GET', path: (_args, locationId) => `/opportunities/pipelines?locationId=${enc(locationId)}` },
      { label: 'Calendars', tool: 'get_calendars', method: 'GET', path: (_args, locationId) => `/calendars/?locationId=${enc(locationId)}` },
      { label: 'Products', tool: 'list_products', method: 'GET', path: (_args, locationId) => `/products/?locationId=${enc(locationId)}&limit=5` },
      {
        label: 'Email campaigns',
        tool: (generation) => generation === 'v3' ? 'official_emails_list_email_campaigns' : 'official_emails_list_campaign_emails_v2',
        method: 'GET',
        path: (_args, locationId, generation) => generation === 'v3'
          ? `/emails/locations/${enc(locationId)}/campaigns/emails?limit=5`
          : `/emails/public/v2/locations/${enc(locationId)}/campaigns/emails?limit=5`,
      },
    ],
  },
  {
    name: 'crm_daily_briefing',
    title: 'Daily Briefing',
    description: 'Build a read-only daily operating briefing from recent contacts, opportunities, calendars, reviews, and email activity.',
    app: 'agency-admin',
    access: 'read',
    inputProperties: { focus: { type: 'string' }, limit: { type: 'number' } },
    readPlan: [
      { label: 'Recent contacts', tool: 'search_contacts', method: 'POST', path: () => '/contacts/search', body: (args, locationId) => ({ locationId, pageLimit: numberArg(args.limit) || 5 }) },
      { label: 'Open opportunities', tool: 'search_opportunities', method: 'GET', path: (_args, locationId, generation) => opportunitySearchPath(locationId, generation, { status: 'open' }) },
      { label: 'Calendars', tool: 'get_calendars', method: 'GET', path: (_args, locationId) => `/calendars/?locationId=${enc(locationId)}` },
      { label: 'Reviews', tool: 'get_reviews', method: 'GET', path: (_args, locationId) => `/reputation/reviews?locationId=${enc(locationId)}` },
    ],
  },
  {
    name: 'crm_search_everything',
    title: 'Search Everything',
    description: 'Search across contacts, conversations, opportunities, calendars, and products from one agent-friendly tool.',
    app: 'tool-explorer',
    access: 'read',
    inputProperties: { query: { type: 'string' }, limit: { type: 'number' } },
    readPlan: [
      { label: 'Contacts', tool: 'search_contacts', method: 'POST', path: () => '/contacts/search', body: (args, locationId) => ({ locationId, pageLimit: numberArg(args.limit) || 5, query: args.query }) },
      { label: 'Conversations', tool: 'search_conversations', method: 'GET', path: (args, locationId) => `/conversations/search?locationId=${enc(locationId)}${stringArg(args.query) ? `&query=${enc(stringArg(args.query))}` : ''}` },
      { label: 'Opportunities', tool: 'search_opportunities', method: 'GET', path: (_args, locationId, generation) => opportunitySearchPath(locationId, generation) },
      { label: 'Calendars', tool: 'get_calendars', method: 'GET', path: (_args, locationId) => `/calendars/?locationId=${enc(locationId)}` },
      { label: 'Products', tool: 'list_products', method: 'GET', path: (_args, locationId) => `/products/?locationId=${enc(locationId)}&limit=5` },
    ],
  },
  {
    name: 'crm_get_next_page',
    title: 'Get Next Page Helper',
    description: 'Prepare the next read call for paginated tools without requiring the agent to remember cursor or searchAfter details.',
    app: 'tool-explorer',
    access: 'read',
    inputProperties: { tool: { type: 'string' }, searchAfter: { type: 'array' }, page: { type: 'number' }, limit: { type: 'number' }, query: { type: 'string' } },
    buildActions: (args, locationId) => [
      action('Next contacts page', 'search_contacts', { locationId, pageLimit: numberArg(args.limit) || 25, searchAfter: args.searchAfter, query: args.query }, 'read', false),
      action('Next generic page', stringArg(args.tool) || 'search_contacts', { locationId, page: args.page, limit: args.limit, query: args.query }, 'read', false),
    ],
  },
  {
    name: 'crm_next_best_actions',
    title: 'Next Best Actions',
    description: 'Prepare a prioritized set of safe next actions from CRM context: follow-up task, note, message draft, and optional workflow enrollment.',
    app: 'lead-intake',
    access: 'write',
    inputProperties: { contactId: CONTACT_FIELDS.contactId, opportunityId: { type: 'string' }, reason: { type: 'string' }, message: { type: 'string' }, workflowId: { type: 'string' } },
    required: ['contactId'],
    buildActions: (args) => [
      action('Load contact context', 'get_contact', { contactId: args.contactId }, 'read', false),
      action('Add recommended note', 'create_contact_note', { contactId: args.contactId, body: args.reason || 'Next-best-action recommendation reviewed.' }, 'write', true),
      action('Create recommended task', 'create_contact_task', { contactId: args.contactId, title: args.reason || 'Follow up on recommended next action' }, 'write', true),
      action('Draft recommended message', 'send_sms', { contactId: args.contactId, message: args.message }, 'write', true),
      action('Enroll recommended workflow', 'add_contact_to_workflow', { contactId: args.contactId, workflowId: args.workflowId }, 'write', true),
    ],
  },
  {
    name: 'crm_prepare_contact_update',
    title: 'Prepare Contact Update',
    description: 'Prepare a confirmation-gated contact update with duplicate checks, notes, tags, and follow-up task options.',
    app: 'contact-workspace',
    access: 'write',
    inputProperties: {
      ...CONTACT_FIELDS,
      taskTitle: { type: 'string' },
      dueDate: { type: 'string' },
    },
    buildActions: (args, locationId) => [
      action('Duplicate guard', 'get_duplicate_contact', { locationId, email: args.email, phone: args.phone }, 'read', false),
      action('Save contact fields', stringArg(args.contactId) ? 'update_contact' : 'upsert_contact', pick(args, ['contactId', 'firstName', 'lastName', 'email', 'phone', 'tags']), 'write', true),
      action('Add contact note', 'create_contact_note', { contactId: args.contactId, body: args.note }, 'write', true),
      action('Create follow-up task', 'create_contact_task', { contactId: args.contactId, title: args.taskTitle, dueDate: args.dueDate }, 'write', true),
    ],
  },
  {
    name: 'crm_prepare_contact_followup',
    title: 'Prepare Contact Follow-Up',
    description: 'Prepare a contact follow-up bundle: context read, note, task, and optional SMS/email draft.',
    app: 'contact-workspace',
    access: 'write',
    inputProperties: { contactId: CONTACT_FIELDS.contactId, message: { type: 'string' }, channel: { type: 'string', enum: ['sms', 'email'] }, subject: { type: 'string' }, taskTitle: { type: 'string' }, dueDate: { type: 'string' }, note: { type: 'string' } },
    required: ['contactId'],
    buildActions: (args) => [
      action('Load contact context', 'get_contact', { contactId: args.contactId }, 'read', false),
      action('Add follow-up note', 'create_contact_note', { contactId: args.contactId, body: args.note || args.message }, 'write', true),
      action('Create follow-up task', 'create_contact_task', { contactId: args.contactId, title: args.taskTitle || 'Follow up', dueDate: args.dueDate }, 'write', true),
      action('Draft follow-up message', stringArg(args.channel) === 'email' ? 'send_email' : 'send_sms', pick(args, ['contactId', 'subject', 'message']), 'write', true),
    ],
  },
  {
    name: 'crm_prepare_contact_note',
    title: 'Prepare Contact Note',
    description: 'Prepare an internal contact note, staged for confirmation before writing to GHL.',
    app: 'contact-workspace',
    access: 'write',
    inputProperties: { contactId: CONTACT_FIELDS.contactId, body: { type: 'string' } },
    required: ['contactId', 'body'],
    buildActions: (args) => [action('Add contact note', 'create_contact_note', { contactId: args.contactId, body: args.body }, 'write', true)],
  },
  {
    name: 'crm_prepare_contact_task',
    title: 'Prepare Contact Task',
    description: 'Prepare a follow-up task for a contact with owner, due date, and notes.',
    app: 'contact-workspace',
    access: 'write',
    inputProperties: {
      contactId: CONTACT_FIELDS.contactId,
      title: { type: 'string' },
      dueDate: { type: 'string' },
      assignedTo: { type: 'string' },
      body: { type: 'string' },
    },
    required: ['contactId', 'title'],
    buildActions: (args) => [action('Create contact task', 'create_contact_task', pick(args, ['contactId', 'title', 'dueDate', 'assignedTo', 'body']), 'write', true)],
  },
  {
    name: 'crm_prepare_lead_intake',
    title: 'Prepare Lead Intake',
    description: 'Normalize a new lead, check for duplicates, prepare contact upsert, opportunity creation, assignment, and workflow enrollment.',
    app: 'lead-intake',
    access: 'write',
    inputProperties: {
      source: { type: 'string' },
      name: { type: 'string' },
      firstName: { type: 'string' },
      lastName: { type: 'string' },
      email: { type: 'string' },
      phone: { type: 'string' },
      intent: { type: 'string' },
      ownerId: { type: 'string' },
      pipelineId: { type: 'string' },
      stageId: { type: 'string' },
      workflowId: { type: 'string' },
    },
    buildActions: (args, locationId) => [
      action('Duplicate guard', 'get_duplicate_contact', { locationId, email: args.email, phone: args.phone }, 'read', false),
      action('Upsert lead contact', 'upsert_contact', contactPayload(args, locationId), 'write', true),
      action('Create lead opportunity', 'create_opportunity', pick(args, ['contactId', 'pipelineId', 'stageId', 'ownerId', 'intent', 'source']), 'write', true),
      action('Enroll lead workflow', 'add_contact_to_workflow', { contactId: args.contactId, workflowId: args.workflowId }, 'write', true),
    ],
  },
  {
    name: 'crm_find_unworked_leads',
    title: 'Find Unworked Leads',
    description: 'Find recent form leads and contact records that still need first-touch follow-up.',
    app: 'lead-intake',
    access: 'read',
    readPlan: [
      { label: 'Recent form submissions', tool: 'get_form_submissions', method: 'GET', path: (_args, locationId) => `/forms/submissions?locationId=${enc(locationId)}` },
      { label: 'Contact search', tool: 'search_contacts', method: 'GET', path: (_args, locationId) => `/contacts/search?locationId=${enc(locationId)}` },
    ],
  },
  {
    name: 'crm_prepare_lead_assignment',
    title: 'Prepare Lead Assignment',
    description: 'Prepare a lead owner assignment and optional first-touch task.',
    app: 'lead-intake',
    access: 'write',
    inputProperties: {
      contactId: CONTACT_FIELDS.contactId,
      ownerId: { type: 'string' },
      taskTitle: { type: 'string' },
      dueDate: { type: 'string' },
    },
    required: ['contactId', 'ownerId'],
    buildActions: (args) => [
      action('Update lead owner', 'update_contact', { contactId: args.contactId, assignedTo: args.ownerId }, 'write', true),
      action('Create first-touch task', 'create_contact_task', { contactId: args.contactId, title: args.taskTitle || 'First-touch follow-up', dueDate: args.dueDate, assignedTo: args.ownerId }, 'write', true),
    ],
  },
  {
    name: 'crm_prepare_lead_reactivation',
    title: 'Prepare Lead Reactivation',
    description: 'Prepare a dormant lead reactivation plan with tag, note, task, optional message, and optional workflow enrollment.',
    app: 'lead-intake',
    access: 'write',
    inputProperties: { contactId: CONTACT_FIELDS.contactId, message: { type: 'string' }, tag: { type: 'string' }, workflowId: { type: 'string' }, taskTitle: { type: 'string' }, note: { type: 'string' } },
    required: ['contactId'],
    buildActions: (args) => [
      action('Load lead context', 'get_contact', { contactId: args.contactId }, 'read', false),
      action('Tag reactivation lead', 'add_contact_tags', { contactId: args.contactId, tags: [args.tag || 'reactivation'] }, 'write', true),
      action('Add reactivation note', 'create_contact_note', { contactId: args.contactId, body: args.note || 'Prepared lead reactivation.' }, 'write', true),
      action('Create reactivation task', 'create_contact_task', { contactId: args.contactId, title: args.taskTitle || 'Reactivate lead' }, 'write', true),
      action('Draft reactivation SMS', 'send_sms', { contactId: args.contactId, message: args.message }, 'write', true),
      action('Enroll reactivation workflow', 'add_contact_to_workflow', { contactId: args.contactId, workflowId: args.workflowId }, 'write', true),
    ],
  },
  {
    name: 'crm_conversation_workspace',
    title: 'Open Conversation Workspace Data',
    description: 'Gather conversation threads, recent messages, and optional contact context for reply drafting.',
    app: 'conversation-inbox',
    access: 'read',
    inputProperties: {
      conversationId: { type: 'string' },
      contactId: CONTACT_FIELDS.contactId,
      query: { type: 'string' },
    },
    readPlan: [
      { label: 'Conversation', tool: 'get_conversation', method: 'GET', path: (args) => stringArg(args.conversationId) ? `/conversations/${stringArg(args.conversationId)}` : undefined },
      { label: 'Conversation search', tool: 'search_conversations', method: 'GET', path: (args, locationId) => `/conversations/search?locationId=${enc(locationId)}${stringArg(args.query) ? `&query=${enc(stringArg(args.query))}` : ''}` },
      { label: 'Contact profile', tool: 'get_contact', method: 'GET', path: (args) => stringArg(args.contactId) ? `/contacts/${stringArg(args.contactId)}` : undefined },
    ],
  },
  {
    name: 'crm_prepare_conversation_reply',
    title: 'Prepare Conversation Reply',
    description: 'Prepare an SMS or email reply with thread context and confirmation before any outbound message is sent.',
    app: 'conversation-inbox',
    access: 'write',
    inputProperties: {
      contactId: CONTACT_FIELDS.contactId,
      conversationId: { type: 'string' },
      channel: { type: 'string', enum: ['sms', 'email'] },
      subject: { type: 'string' },
      message: { type: 'string' },
      scheduleAt: { type: 'string' },
    },
    required: ['contactId', 'message'],
    buildActions: (args) => [
      action('Load thread context', stringArg(args.conversationId) ? 'get_conversation' : 'get_contact', stringArg(args.conversationId) ? { conversationId: args.conversationId } : { contactId: args.contactId }, 'read', false),
      action('Send reply', stringArg(args.channel) === 'email' ? 'send_email' : 'send_sms', pick(args, ['contactId', 'conversationId', 'subject', 'message', 'scheduleAt']), 'write', true),
    ],
  },
  {
    name: 'crm_prepare_conversation_status',
    title: 'Prepare Conversation Status Update',
    description: 'Prepare a conversation status update, such as marking a thread read, unread, open, or closed.',
    app: 'conversation-inbox',
    access: 'write',
    inputProperties: { conversationId: { type: 'string' }, status: { type: 'string' } },
    required: ['conversationId', 'status'],
    buildActions: (args) => [action('Update conversation status', 'update_conversation', pick(args, ['conversationId', 'status']), 'write', true)],
  },
  {
    name: 'crm_prepare_missed_call_response',
    title: 'Prepare Missed Call Response',
    description: 'Prepare a missed-call response with contact context, SMS draft, note, and follow-up task.',
    app: 'conversation-inbox',
    access: 'write',
    inputProperties: { contactId: CONTACT_FIELDS.contactId, message: { type: 'string' }, taskTitle: { type: 'string' }, dueDate: { type: 'string' } },
    required: ['contactId'],
    buildActions: (args) => [
      action('Load missed-call contact', 'get_contact', { contactId: args.contactId }, 'read', false),
      action('Draft missed-call SMS', 'send_sms', { contactId: args.contactId, message: args.message || 'Sorry we missed your call. How can we help?' }, 'write', true),
      action('Log missed-call note', 'create_contact_note', { contactId: args.contactId, body: 'Prepared missed-call response.' }, 'write', true),
      action('Create missed-call follow-up task', 'create_contact_task', { contactId: args.contactId, title: args.taskTitle || 'Follow up on missed call', dueDate: args.dueDate }, 'write', true),
    ],
  },
  {
    name: 'crm_pipeline_workspace',
    title: 'Open Pipeline Workspace Data',
    description: 'Gather pipeline, opportunity, and stale-deal context for a pipeline board.',
    app: 'pipeline-board',
    access: 'read',
    inputProperties: { pipelineId: { type: 'string' }, status: { type: 'string' } },
    readPlan: [
      { label: 'Pipelines', tool: 'get_pipelines', method: 'GET', path: (_args, locationId) => `/opportunities/pipelines?locationId=${enc(locationId)}` },
      { label: 'Opportunities', tool: 'search_opportunities', method: 'GET', path: (args, locationId, generation) => opportunitySearchPath(locationId, generation, { pipelineId: stringArg(args.pipelineId) }) },
    ],
  },
  {
    name: 'crm_prepare_opportunity_update',
    title: 'Prepare Opportunity Update',
    description: 'Prepare an opportunity create/update/status move with contact note and next task options.',
    app: 'pipeline-board',
    access: 'write',
    inputProperties: {
      opportunityId: { type: 'string' },
      contactId: CONTACT_FIELDS.contactId,
      pipelineId: { type: 'string' },
      stageId: { type: 'string' },
      status: { type: 'string' },
      monetaryValue: { type: 'number' },
      title: { type: 'string' },
      nextStep: { type: 'string' },
    },
    buildActions: (args) => [
      action('Save opportunity', stringArg(args.opportunityId) ? 'update_opportunity' : 'create_opportunity', pick(args, ['opportunityId', 'contactId', 'pipelineId', 'stageId', 'status', 'monetaryValue', 'title']), 'write', true),
      action('Create next-step task', 'create_contact_task', { contactId: args.contactId, title: args.nextStep }, 'write', true),
    ],
  },
  {
    name: 'crm_prepare_pipeline_follow_up',
    title: 'Prepare Pipeline Follow-Up',
    description: 'Prepare the next action for a stale or active opportunity: task, note, owner, stage, and optional message.',
    app: 'pipeline-board',
    access: 'write',
    inputProperties: {
      opportunityId: { type: 'string' },
      contactId: CONTACT_FIELDS.contactId,
      nextStep: { type: 'string' },
      note: { type: 'string' },
      stageId: { type: 'string' },
      ownerId: { type: 'string' },
      message: { type: 'string' },
    },
    buildActions: (args) => [
      action('Update opportunity', 'update_opportunity', pick(args, ['opportunityId', 'stageId', 'ownerId']), 'write', true),
      action('Add opportunity note', 'create_contact_note', { contactId: args.contactId, body: args.note || args.nextStep }, 'write', true),
      action('Create follow-up task', 'create_contact_task', { contactId: args.contactId, title: args.nextStep }, 'write', true),
      action('Draft follow-up SMS', 'send_sms', { contactId: args.contactId, message: args.message }, 'write', true),
    ],
  },
  {
    name: 'crm_prepare_pipeline_cleanup',
    title: 'Prepare Pipeline Cleanup',
    description: 'Prepare cleanup actions for stale pipeline opportunities: context read, stage/status update, notes, and follow-up tasks.',
    app: 'pipeline-board',
    access: 'write',
    inputProperties: { opportunityId: { type: 'string' }, contactId: CONTACT_FIELDS.contactId, stageId: { type: 'string' }, status: { type: 'string' }, note: { type: 'string' }, taskTitle: { type: 'string' } },
    required: ['opportunityId'],
    buildActions: (args) => [
      action('Load opportunity', 'get_opportunity', { opportunityId: args.opportunityId }, 'read', false),
      action('Update stale opportunity', 'update_opportunity', pick(args, ['opportunityId', 'stageId', 'status']), 'write', true),
      action('Log cleanup note', 'create_contact_note', { contactId: args.contactId, body: args.note || 'Pipeline cleanup reviewed.' }, 'write', true),
      action('Create cleanup task', 'create_contact_task', { contactId: args.contactId, title: args.taskTitle || 'Pipeline cleanup follow-up' }, 'write', true),
    ],
  },
  {
    name: 'crm_appointment_workspace',
    title: 'Open Appointment Workspace Data',
    description: 'Gather calendars, availability, and appointment context before booking or rescheduling.',
    app: 'appointment-desk',
    access: 'read',
    inputProperties: { calendarId: { type: 'string' }, startDate: { type: 'string' }, endDate: { type: 'string' } },
    readPlan: [
      { label: 'Calendars', tool: 'get_calendars', method: 'GET', path: (_args, locationId) => `/calendars/?locationId=${enc(locationId)}` },
      { label: 'Free slots', tool: 'get_free_slots', method: 'GET', path: (args) => stringArg(args.calendarId) ? `/calendars/${stringArg(args.calendarId)}/free-slots?startDate=${enc(stringArg(args.startDate) || today())}` : undefined },
    ],
  },
  {
    name: 'crm_prepare_appointment_booking',
    title: 'Prepare Appointment Booking',
    description: 'Prepare appointment booking or reschedule actions after availability has been checked.',
    app: 'appointment-desk',
    access: 'write',
    inputProperties: {
      appointmentId: { type: 'string' },
      contactId: CONTACT_FIELDS.contactId,
      calendarId: { type: 'string' },
      startTime: { type: 'string' },
      endTime: { type: 'string' },
      notes: { type: 'string' },
    },
    required: ['contactId', 'calendarId', 'startTime'],
    buildActions: (args) => [
      action('Check free slots', 'get_free_slots', { calendarId: args.calendarId, startDate: args.startTime }, 'read', false),
      action('Save appointment', stringArg(args.appointmentId) ? 'update_appointment' : 'create_appointment', pick(args, ['appointmentId', 'contactId', 'calendarId', 'startTime', 'endTime', 'notes']), 'write', true),
      action('Add appointment note', 'create_appointment_note', { appointmentId: args.appointmentId, body: args.notes }, 'write', true),
    ],
  },
  {
    name: 'crm_prepare_appointment_reschedule',
    title: 'Prepare Appointment Reschedule',
    description: 'Prepare a reschedule action with availability check and optional contact notification.',
    app: 'appointment-desk',
    access: 'write',
    inputProperties: { appointmentId: { type: 'string' }, calendarId: { type: 'string' }, startTime: { type: 'string' }, notifyContact: { type: 'boolean' }, message: { type: 'string' } },
    required: ['appointmentId', 'calendarId', 'startTime'],
    buildActions: (args) => [
      action('Check new slot', 'get_free_slots', { calendarId: args.calendarId, startDate: args.startTime }, 'read', false),
      action('Reschedule appointment', 'update_appointment', pick(args, ['appointmentId', 'startTime']), 'write', true),
      action('Notify contact', 'send_sms', { contactId: args.contactId, message: args.message }, 'write', true),
    ],
  },
  {
    name: 'crm_automation_workspace',
    title: 'Open Automation Workspace Data',
    description: 'Gather campaigns, workflows, scheduled messages, and enrollment context.',
    app: 'automation-launcher',
    access: 'read',
    readPlan: [
      { label: 'Campaigns', tool: 'get_campaigns', method: 'GET', path: (_args, locationId) => `/campaigns/?locationId=${enc(locationId)}` },
      { label: 'Workflows', tool: 'ghl_get_workflows', method: 'GET', path: (_args, locationId) => `/workflows/?locationId=${enc(locationId)}` },
    ],
  },
  {
    name: 'crm_prepare_automation_enrollment',
    title: 'Prepare Automation Enrollment',
    description: 'Prepare campaign or workflow enrollment with confirmation and contact context.',
    app: 'automation-launcher',
    access: 'write',
    inputProperties: { contactId: CONTACT_FIELDS.contactId, campaignId: { type: 'string' }, workflowId: { type: 'string' }, note: { type: 'string' } },
    required: ['contactId'],
    buildActions: (args) => [
      action('Load contact', 'get_contact', { contactId: args.contactId }, 'read', false),
      action('Add to campaign', 'add_contact_to_campaign', { contactId: args.contactId, campaignId: args.campaignId }, 'write', true),
      action('Add to workflow', 'add_contact_to_workflow', { contactId: args.contactId, workflowId: args.workflowId }, 'write', true),
      action('Log enrollment note', 'create_contact_note', { contactId: args.contactId, body: args.note }, 'write', true),
    ],
  },
  {
    name: 'crm_prepare_workflow_trigger',
    title: 'Prepare Workflow Trigger',
    description: 'Prepare a direct workflow trigger for a contact with a human-readable reason and confirmation.',
    app: 'automation-launcher',
    access: 'write',
    inputProperties: { contactId: CONTACT_FIELDS.contactId, workflowId: { type: 'string' }, reason: { type: 'string' } },
    required: ['contactId', 'workflowId'],
    buildActions: (args) => [
      action('Trigger workflow', 'ghl_trigger_workflow', pick(args, ['contactId', 'workflowId', 'reason']), 'write', true),
      action('Log trigger reason', 'create_contact_note', { contactId: args.contactId, body: args.reason }, 'write', true),
    ],
  },
  {
    name: 'crm_reputation_workspace',
    title: 'Open Reputation Workspace Data',
    description: 'Gather reviews, reputation stats, review requests, and connected platform context.',
    app: 'reputation-center',
    access: 'read',
    readPlan: [
      { label: 'Reviews', tool: 'get_reviews', method: 'GET', path: (_args, locationId) => `/reputation/reviews?locationId=${enc(locationId)}` },
      { label: 'Review stats', tool: 'get_review_stats', method: 'GET', path: (_args, locationId) => `/reputation/stats?locationId=${enc(locationId)}` },
    ],
  },
  {
    name: 'crm_prepare_review_reply',
    title: 'Prepare Review Reply',
    description: 'Prepare a public review reply with confirmation before posting.',
    app: 'reputation-center',
    access: 'write',
    inputProperties: { reviewId: { type: 'string' }, reply: { type: 'string' }, tone: { type: 'string' } },
    required: ['reviewId', 'reply'],
    buildActions: (args) => [action('Publish review reply', 'reply_to_review', pick(args, ['reviewId', 'reply']), 'write', true)],
  },
  {
    name: 'crm_prepare_review_request',
    title: 'Prepare Review Request',
    description: 'Prepare a review request message for a contact, staged before sending.',
    app: 'reputation-center',
    access: 'write',
    inputProperties: { contactId: CONTACT_FIELDS.contactId, message: { type: 'string' }, channel: { type: 'string' } },
    required: ['contactId'],
    buildActions: (args) => [action('Send review request', 'send_review_request', pick(args, ['contactId', 'message', 'channel']), 'write', true)],
  },
  {
    name: 'crm_prepare_review_request_batch',
    title: 'Prepare Review Request Batch',
    description: 'Prepare review requests for multiple contacts with one confirmation-gated batch plan.',
    app: 'reputation-center',
    access: 'write',
    inputProperties: { contactIds: { type: 'array', items: { type: 'string' } }, message: { type: 'string' }, channel: { type: 'string' } },
    required: ['contactIds'],
    buildActions: (args) => arrayArg(args.contactIds).map((contactId) => action(`Send review request to ${contactId}`, 'send_review_request', { contactId, message: args.message, channel: args.channel }, 'write', true)),
  },
  {
    name: 'crm_ads_workspace',
    title: 'Open Ads Workspace Data',
    description: 'Gather ads, attribution, funnel, conversion, and setup health reporting.',
    app: 'ads-dashboard',
    access: 'read',
    inputProperties: { startDate: { type: 'string' }, endDate: { type: 'string' }, channel: { type: 'string' } },
    buildActions: (args, locationId) => [
      action('Get ad reports', 'get_ad_reports', { locationId, startDate: args.startDate, endDate: args.endDate, channel: args.channel }, 'read', false),
      action('Get attribution report', 'get_attribution_report', { locationId, startDate: args.startDate, endDate: args.endDate }, 'read', false),
      action('Audit ads setup', 'audit_location_ads_setup', { locationId }, 'read', false),
    ],
  },
  {
    name: 'crm_prepare_ad_campaign_status',
    title: 'Prepare Ad Campaign Status Change',
    description: 'Prepare a paid campaign pause/resume/status change with explicit confirmation.',
    app: 'ads-dashboard',
    access: 'write',
    inputProperties: { platform: { type: 'string' }, campaignId: { type: 'string' }, status: { type: 'string' }, reason: { type: 'string' } },
    required: ['platform', 'campaignId', 'status'],
    buildActions: (args) => [action('Change campaign status', adStatusTool(args), pick(args, ['campaignId', 'status', 'reason']), 'write', true)],
  },
  {
    name: 'crm_billing_workspace',
    title: 'Open Billing Workspace Data',
    description: 'Gather invoices, estimates, orders, transactions, subscriptions, products, and coupons.',
    app: 'billing-commerce',
    access: 'read',
    readPlan: [
      { label: 'Invoices', tool: 'list_invoices', method: 'GET', path: (_args, locationId) => `/invoices/?locationId=${enc(locationId)}` },
      { label: 'Orders', tool: 'list_orders', method: 'GET', path: (_args, locationId) => `/payments/orders?locationId=${enc(locationId)}` },
    ],
  },
  {
    name: 'crm_prepare_invoice',
    title: 'Prepare Invoice',
    description: 'Prepare an invoice create/send flow with confirmation before creating or sending billing records.',
    app: 'billing-commerce',
    access: 'write',
    inputProperties: { contactId: CONTACT_FIELDS.contactId, invoiceId: { type: 'string' }, amount: { type: 'number' }, memo: { type: 'string' }, sendNow: { type: 'boolean' } },
    required: ['contactId'],
    buildActions: (args) => [
      action('Create invoice', 'create_invoice', pick(args, ['contactId', 'amount', 'memo']), 'write', true),
      action('Send invoice', 'send_invoice', { invoiceId: args.invoiceId }, 'write', true),
    ],
  },
  {
    name: 'crm_prepare_invoice_followup',
    title: 'Prepare Invoice Follow-Up',
    description: 'Prepare an invoice follow-up with invoice context, contact note, task, and optional SMS/email reminder.',
    app: 'billing-commerce',
    access: 'write',
    inputProperties: { invoiceId: { type: 'string' }, contactId: CONTACT_FIELDS.contactId, message: { type: 'string' }, channel: { type: 'string', enum: ['sms', 'email'] }, subject: { type: 'string' }, taskTitle: { type: 'string' } },
    required: ['invoiceId', 'contactId'],
    buildActions: (args) => [
      action('Load invoice', 'get_invoice', { invoiceId: args.invoiceId }, 'read', false),
      action('Add invoice follow-up note', 'create_contact_note', { contactId: args.contactId, body: args.message || 'Invoice follow-up prepared.' }, 'write', true),
      action('Create invoice follow-up task', 'create_contact_task', { contactId: args.contactId, title: args.taskTitle || 'Invoice follow-up' }, 'write', true),
      action('Draft invoice reminder', stringArg(args.channel) === 'email' ? 'send_email' : 'send_sms', pick(args, ['contactId', 'subject', 'message']), 'write', true),
    ],
  },
  {
    name: 'crm_prepare_payment_record',
    title: 'Prepare Payment Record',
    description: 'Prepare an order payment record or invoice payment action with confirmation.',
    app: 'billing-commerce',
    access: 'write',
    inputProperties: { orderId: { type: 'string' }, invoiceId: { type: 'string' }, amount: { type: 'number' }, note: { type: 'string' } },
    buildActions: (args) => [action('Record payment', 'record_order_payment', pick(args, ['orderId', 'invoiceId', 'amount', 'note']), 'write', true)],
  },
  {
    name: 'crm_agency_admin_workspace',
    title: 'Open Agency Admin Workspace Data',
    description: 'Gather locations, users, snapshots, phone numbers, media, and setup health context for an agency account.',
    app: 'agency-admin',
    access: 'read',
    readPlan: [
      { label: 'Locations', tool: 'search_locations', method: 'GET', path: () => '/locations/search' },
      { label: 'Users', tool: 'search_users', method: 'GET', path: (_args, locationId) => `/users/search?locationId=${enc(locationId)}` },
      { label: 'Snapshots', tool: 'get_snapshots', method: 'GET', path: () => '/snapshots/' },
    ],
  },
  {
    name: 'crm_location_health_check',
    title: 'Run Location Health Check',
    description: 'Prepare a read-only setup audit covering contacts, users, calendars, phone, custom fields, workflows, ads, and billing readiness.',
    app: 'agency-admin',
    access: 'read',
    buildActions: (_args, locationId) => [
      action('Get location', 'get_location', { locationId }, 'read', false),
      action('Search users', 'search_users', { locationId }, 'read', false),
      action('Get calendars', 'get_calendars', { locationId }, 'read', false),
      action('Get custom fields', 'get_location_custom_fields', { locationId }, 'read', false),
      action('Get phone numbers', 'get_phone_numbers', { locationId }, 'read', false),
      action('Audit ads setup', 'audit_location_ads_setup', { locationId }, 'read', false),
    ],
  },
  {
    name: 'crm_prepare_snapshot_rollout',
    title: 'Prepare Snapshot Rollout',
    description: 'Prepare a snapshot rollout to one or more subaccounts with status checks and explicit confirmation.',
    app: 'agency-admin',
    access: 'write',
    inputProperties: { snapshotId: { type: 'string' }, locationIds: { type: 'array', items: { type: 'string' } }, rolloutNote: { type: 'string' } },
    required: ['snapshotId', 'locationIds'],
    buildActions: (args) => [
      action('Check latest snapshot push', 'get_latest_snapshot_push', { snapshotId: args.snapshotId }, 'read', false),
      action('Push snapshot', 'push_snapshot_to_subaccounts', pick(args, ['snapshotId', 'locationIds', 'rolloutNote']), 'write', true),
    ],
  },
  {
    name: 'crm_prepare_user_invite',
    title: 'Prepare User Invite',
    description: 'Prepare a user invite or user update for a location with confirmation.',
    app: 'agency-admin',
    access: 'write',
    inputProperties: { locationId: { type: 'string' }, email: { type: 'string' }, firstName: { type: 'string' }, lastName: { type: 'string' }, role: { type: 'string' } },
    required: ['email'],
    buildActions: (args, locationId) => [action('Create user', 'create_user', { locationId: stringArg(args.locationId) || locationId, ...pick(args, ['email', 'firstName', 'lastName', 'role']) }, 'write', true)],
  },
];

export class AgentWorkspaceTools {
  constructor(private ghlClient: GHLApiClient) {}

  getToolDefinitions(): Tool[] {
    return WORKSPACE_SPECS.map((spec) => ({
      name: spec.name,
      description: spec.description,
      inputSchema: {
        type: 'object',
        properties: {
          locationId: { type: 'string', description: 'GHL location/subaccount ID. Defaults to configured GHL_LOCATION_ID.' },
          executeConfirmed: { type: 'boolean', description: 'Reserved for future direct execution. Current tools always return a staged confirmation queue.' },
          ...(spec.inputProperties || {}),
        },
        required: spec.required || [],
      },
      _meta: {
        labels: {
          category: 'agent-workspace',
          access: spec.access,
          complexity: 'workflow',
          source: 'curated-agent-workspace',
          app: spec.app,
        },
        workflow: {
          app: spec.app,
          confirmationRequired: spec.access === 'write',
          exposesRawActions: true,
        },
      },
    }));
  }

  async handleToolCall(name: string, args: JsonRecord = {}): Promise<unknown> {
    const spec = WORKSPACE_SPECS.find((item) => item.name === name);
    if (!spec) throw new Error(`Unknown agent workspace tool: ${name}`);
    if (name === 'crm_list_workspaces') return this.listWorkspaces();

    const config = this.ghlClient.getConfig();
    const generation: ApiGeneration = config.apiGeneration === 'v2' ? 'v2' : 'v3';
    const locationId = locationArg(args, config.locationId);
    const proposedActions = compactActions(spec.buildActions?.(args, locationId) || actionsFromReadPlan(spec, args, locationId, generation));
    const readResults = spec.readPlan ? await this.runReadPlan(spec, args, locationId, generation) : [];

    return {
      workflow: {
        name: spec.name,
        title: spec.title,
        app: spec.app,
        access: spec.access,
      },
      summary: summarize(spec, proposedActions),
      locationId,
      confirmationRequired: proposedActions.some((item) => item.requiresConfirmation),
      readResults,
      resultSummary: resultSummary(readResults, proposedActions),
      proposedActions,
      executeToolCalls: proposedActions
        .filter((item) => item.requiresConfirmation)
        .map(({ tool, arguments: toolArgs }) => ({ tool, arguments: toolArgs })),
      nextSteps: spec.access === 'write'
        ? ['Review the proposed actions.', 'Ask the user to confirm the specific writes.', 'Execute the listed raw tools only after confirmation.']
        : ['Use the returned context to decide whether a write-preparation workflow is needed.'],
    };
  }

  private listWorkspaces(): unknown {
    const grouped = new Map<string, WorkspaceToolSpec[]>();
    for (const spec of WORKSPACE_SPECS.filter((item) => item.name !== 'crm_list_workspaces')) {
      grouped.set(spec.app, [...(grouped.get(spec.app) || []), spec]);
    }

    return {
      summary: 'Curated GHL CRM tools for agents. Prefer these workflow tools for chat-driven CRM work; fall back to raw endpoint tools for advanced edge cases.',
      workspaces: [...grouped.entries()].map(([app, tools]) => ({
        app,
        readTools: tools.filter((tool) => tool.access === 'read').map((tool) => tool.name),
        writePreparationTools: tools.filter((tool) => tool.access === 'write').map((tool) => tool.name),
      })),
      profileHint: 'Set GHL_TOOL_PROFILE=curated to expose only these workflow tools to agents. Use full for all tools, or raw for endpoint-level tools without the curated layer.',
    };
  }

  private async runReadPlan(
    spec: WorkspaceToolSpec,
    args: JsonRecord,
    locationId: string,
    generation: ApiGeneration,
  ): Promise<unknown[]> {
    const plan = spec.readPlan || [];
    const results = await Promise.all(plan.map(async (item) => {
      const path = item.path(args, locationId, generation);
      if (!path) return undefined;
      try {
        const config = this.ghlClient.getConfig();
        const response = await this.ghlClient.makeRequest(
          item.method,
          path,
          item.body?.(args, locationId),
          { version: resolveRequestVersion(item.method, path, generation, config.version) },
        );
        return {
          label: item.label,
          tool: workspaceToolName(item.tool, generation),
          path,
          success: response.success,
          data: response.success ? summarizeData(response.data) : undefined,
          error: response.success ? undefined : response.error,
        };
      } catch (error) {
        return {
          label: item.label,
          tool: workspaceToolName(item.tool, generation),
          path,
          success: false,
          error: error instanceof Error ? error.message : String(error),
        };
      }
    }));
    return results.filter(Boolean);
  }
}

function action(label: string, tool: string, args: JsonRecord, risk: WorkflowAction['risk'], requiresConfirmation: boolean): WorkflowAction {
  return { label, tool, arguments: compact(args), risk, requiresConfirmation };
}

function actionsFromReadPlan(
  spec: WorkspaceToolSpec,
  args: JsonRecord,
  locationId: string,
  generation: ApiGeneration,
): WorkflowAction[] {
  return (spec.readPlan || []).map((item) => action(
    item.label,
    workspaceToolName(item.tool, generation),
    { path: item.path(args, locationId, generation) },
    'read',
    false,
  ));
}

function workspaceToolName(tool: WorkspaceReadTool, generation: ApiGeneration): string {
  return typeof tool === 'function' ? tool(generation) : tool;
}

function opportunitySearchPath(
  locationId: string,
  generation: ApiGeneration,
  filters: { pipelineId?: string; status?: string } = {},
): string {
  const params = new URLSearchParams();
  params.set(generation === 'v3' ? 'locationId' : 'location_id', locationId);
  if (filters.pipelineId) params.set(generation === 'v3' ? 'pipelineId' : 'pipeline_id', filters.pipelineId);
  if (filters.status) params.set('status', filters.status);
  return `/opportunities/search?${params.toString()}`;
}

function compactActions(actions: WorkflowAction[]): WorkflowAction[] {
  return actions.filter((item) => Object.keys(item.arguments).length > 0 || item.risk === 'read');
}

function summarize(spec: WorkspaceToolSpec, actions: WorkflowAction[]): string {
  const writeCount = actions.filter((item) => item.requiresConfirmation).length;
  if (spec.access === 'read') return `${spec.title} prepared ${actions.length} read action${actions.length === 1 ? '' : 's'}.`;
  return `${spec.title} staged ${writeCount} confirmation-gated write action${writeCount === 1 ? '' : 's'} plus ${actions.length - writeCount} context action${actions.length - writeCount === 1 ? '' : 's'}.`;
}

function resultSummary(readResults: unknown[], actions: WorkflowAction[]): JsonRecord {
  const resultRecords = readResults.filter(isRecord);
  return {
    readResults: readResults.length,
    successfulReads: resultRecords.filter((item) => item.success === true).length,
    failedReads: resultRecords.filter((item) => item.success === false).length,
    readActions: actions.filter((item) => item.risk === 'read').length,
    writeActions: actions.filter((item) => item.requiresConfirmation).length,
    destructiveActions: actions.filter((item) => item.risk === 'destructive').length,
  };
}

function summarizeData(data: unknown): unknown {
  if (Array.isArray(data)) return { count: data.length, items: data.slice(0, 5) };
  if (!isRecord(data)) return data;
  const summary: JsonRecord = {};
  for (const [key, value] of Object.entries(data)) {
    if (Array.isArray(value)) {
      summary[key] = { count: value.length, items: value.slice(0, 5) };
    } else if (isRecord(value)) {
      summary[key] = Object.fromEntries(Object.entries(value).slice(0, 12));
    } else {
      summary[key] = value;
    }
  }
  return summary;
}

function locationArg(args: JsonRecord, fallback: string): string {
  return stringArg(args.locationId) || fallback || '';
}

function stringArg(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

function numberArg(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim() && Number.isFinite(Number(value))) return Number(value);
  return undefined;
}

function arrayArg(value: unknown): string[] {
  if (Array.isArray(value)) return value.map(String).filter(Boolean);
  if (typeof value === 'string' && value.trim()) return value.split(',').map((item) => item.trim()).filter(Boolean);
  return [];
}

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function compact(args: JsonRecord): JsonRecord {
  return Object.fromEntries(Object.entries(args).filter(([, value]) => {
    if (value === undefined || value === null || value === '') return false;
    if (Array.isArray(value) && value.length === 0) return false;
    return true;
  }));
}

function pick(args: JsonRecord, keys: string[]): JsonRecord {
  return compact(Object.fromEntries(keys.map((key) => [key, args[key]])));
}

function contactPayload(args: JsonRecord, locationId: string): JsonRecord {
  const fallbackName = stringArg(args.name);
  const [firstName, ...rest] = fallbackName ? fallbackName.split(' ') : [];
  return compact({
    locationId,
    firstName: args.firstName || firstName,
    lastName: args.lastName || rest.join(' '),
    email: args.email,
    phone: args.phone,
    source: args.source,
    tags: args.tags || ['lead'],
  });
}

function adStatusTool(args: JsonRecord): string {
  const platform = stringArg(args.platform)?.toLowerCase();
  const status = stringArg(args.status)?.toLowerCase();
  if (platform === 'google') return 'official_ad_manager_google_upsert_campaign';
  if (platform === 'linkedin' || platform === 'li') return 'official_ad_manager_li_update_ad_status';
  return status === 'active' || status === 'resume' ? 'official_ad_manager_fb_resume_campaign' : 'official_ad_manager_fb_pause_campaign';
}

function enc(value: unknown): string {
  return encodeURIComponent(String(value || ''));
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}
