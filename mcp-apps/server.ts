import { registerAppResource, registerAppTool, RESOURCE_MIME_TYPE } from '@modelcontextprotocol/ext-apps/server';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { CallToolResult, ReadResourceResult } from '@modelcontextprotocol/sdk/types.js';
import { readFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { z } from 'zod';

type ToolInventoryItem = {
  name: string;
  category: string;
  access: string;
  method?: string;
  path?: string;
  source?: string;
};

type FieldDef = {
  name: string;
  label: string;
  type: 'text' | 'email' | 'tel' | 'date' | 'select' | 'textarea';
  placeholder?: string;
  options?: string[];
};

type SectionDef = {
  id: string;
  title: string;
  kind: 'form' | 'records' | 'tool-group' | 'checklist' | 'kanban' | 'report';
  description?: string;
  fields?: FieldDef[];
  records?: Record<string, unknown>[];
  tools?: string[];
  items?: Array<{ label: string; detail?: string; status?: string }>;
};

type SuggestedToolCall = {
  label: string;
  tool: string;
  arguments?: Record<string, unknown>;
  requiresConfirmation?: boolean;
};

type AppPayload = {
  appId: string;
  title: string;
  summary: string;
  status: string;
  metrics?: Array<{ label: string; value: string | number }>;
  data?: Record<string, unknown>;
  suggestedToolCalls?: SuggestedToolCall[];
};

type AppDefinition = {
  appId: string;
  toolName: string;
  title: string;
  description: string;
  summary: string;
  statusLabel?: string;
  inputSchema?: Record<string, z.ZodTypeAny>;
  fields?: FieldDef[];
  readTools: string[];
  writeTools: string[];
  destructiveTools?: string[];
  sections: Array<Omit<SectionDef, 'records' | 'tools'> & { tools?: string[]; sampleRecords?: Record<string, unknown>[] }>;
  actions: SuggestedToolCall[];
  liveData?: (args: Record<string, unknown>) => Promise<Record<string, unknown>>;
  metrics?: (data: Record<string, unknown>) => Array<{ label: string; value: string | number }>;
};

const appDir = dirname(fileURLToPath(import.meta.url));
const packageRoot = appDir.endsWith(`${process.platform === 'win32' ? '\\' : '/'}dist`) ? resolve(appDir, '..') : appDir;
const repoRoot = resolve(packageRoot, '..');
const htmlPath = join(packageRoot, 'dist', 'mcp-app.html');
const appResourceUri = 'ui://ghl-mcp-apps/app.html';

const commonLocationInput = {
  locationId: z.string().optional(),
};

const APP_DEFINITIONS: AppDefinition[] = [
  {
    appId: 'contact-workspace',
    toolName: 'show_ghl_contact_workspace_app',
    title: 'Contact Workspace',
    description: 'Open a full CRM contact workspace with profile, tags, notes, tasks, conversations, appointments, and opportunities.',
    summary: 'Search, inspect, edit, and act on one contact from a rich CRM form inside chat.',
    inputSchema: {
      ...commonLocationInput,
      contactId: z.string().optional(),
      query: z.string().optional(),
    },
    fields: [
      { name: 'query', label: 'Find Contact', type: 'text', placeholder: 'Name, email, or phone' },
      { name: 'firstName', label: 'First Name', type: 'text' },
      { name: 'lastName', label: 'Last Name', type: 'text' },
      { name: 'email', label: 'Email', type: 'email' },
      { name: 'phone', label: 'Phone', type: 'tel' },
      { name: 'tags', label: 'Tags', type: 'text', placeholder: 'lead, booked, vip' },
      { name: 'note', label: 'Internal Note', type: 'textarea' },
    ],
    readTools: ['search_contacts', 'get_contact', 'get_duplicate_contact', 'get_contact_notes', 'get_contact_tasks', 'get_contact_appointments', 'search_conversations', 'search_opportunities'],
    writeTools: ['create_contact', 'update_contact', 'upsert_contact', 'add_contact_tags', 'remove_contact_tags', 'create_contact_note', 'create_contact_task', 'add_contact_to_workflow'],
    destructiveTools: ['delete_contact', 'delete_contact_note', 'delete_contact_task'],
    sections: [
      { id: 'profile', title: 'Profile Form', kind: 'form', description: 'Core CRM fields with duplicate checks before saving.' },
      { id: 'activity', title: 'Activity Timeline', kind: 'records', sampleRecords: sampleContactActivity() },
      { id: 'related', title: 'Related CRM Records', kind: 'records', sampleRecords: sampleOpportunities() },
      { id: 'tools', title: 'Tool Group', kind: 'tool-group', tools: ['search_contacts', 'get_contact', 'update_contact', 'create_contact_note', 'create_contact_task', 'send_sms', 'send_email'] },
    ],
    actions: [
      { label: 'Open contact workspace', tool: 'crm_contact_workspace', arguments: { contactId: '{{contactId}}', query: '{{query}}' } },
      { label: 'Prepare contact save', tool: 'crm_prepare_contact_update', arguments: { contactId: '{{contactId}}', email: '{{email}}', phone: '{{phone}}', note: '{{note}}' }, requiresConfirmation: true },
      { label: 'Prepare note', tool: 'crm_prepare_contact_note', arguments: { contactId: '{{contactId}}', body: '{{note}}' }, requiresConfirmation: true },
      { label: 'Prepare SMS reply', tool: 'crm_prepare_conversation_reply', arguments: { contactId: '{{contactId}}', channel: 'sms', message: '{{message}}' }, requiresConfirmation: true },
    ],
    liveData: loadContactWorkspaceData,
  },
  {
    appId: 'lead-intake',
    toolName: 'show_ghl_lead_intake_app',
    title: 'Lead Intake + Qualification',
    description: 'Open a lead triage workspace for form submissions, duplicates, qualification, assignment, and workflow enrollment.',
    summary: 'Turn new submissions and uncontacted leads into clean CRM records with confirmation-gated follow-up.',
    inputSchema: commonLocationInput,
    fields: [
      { name: 'leadSource', label: 'Lead Source', type: 'select', options: ['Form', 'Chat', 'Call', 'Manual', 'Ad'] },
      { name: 'name', label: 'Lead Name', type: 'text' },
      { name: 'email', label: 'Email', type: 'email' },
      { name: 'phone', label: 'Phone', type: 'tel' },
      { name: 'intent', label: 'Intent / Need', type: 'textarea' },
      { name: 'ownerId', label: 'Assign Owner', type: 'text' },
    ],
    readTools: ['get_forms', 'get_form_submissions', 'find_uncontacted_form_leads', 'search_contacts', 'get_duplicate_contact', 'search_users'],
    writeTools: ['create_contact', 'upsert_contact', 'add_contact_tags', 'create_contact_note', 'create_contact_task', 'create_opportunity', 'add_contact_to_workflow'],
    sections: [
      { id: 'leadForm', title: 'Qualification Form', kind: 'form', description: 'Normalize lead data before creating or updating a contact.' },
      { id: 'submissions', title: 'Recent Submissions', kind: 'records', sampleRecords: sampleLeads() },
      { id: 'dedupe', title: 'Duplicate Guard', kind: 'checklist', sampleRecords: [] },
      { id: 'tools', title: 'Tool Group', kind: 'tool-group', tools: ['get_form_submissions', 'find_uncontacted_form_leads', 'get_duplicate_contact', 'upsert_contact', 'create_opportunity'] },
    ],
    actions: [
      { label: 'Find unworked leads', tool: 'crm_find_unworked_leads' },
      { label: 'Prepare lead intake', tool: 'crm_prepare_lead_intake', arguments: { email: '{{email}}', phone: '{{phone}}', intent: '{{intent}}', ownerId: '{{ownerId}}' }, requiresConfirmation: true },
      { label: 'Prepare assignment', tool: 'crm_prepare_lead_assignment', arguments: { contactId: '{{contactId}}', ownerId: '{{ownerId}}' }, requiresConfirmation: true },
      { label: 'Prepare workflow enrollment', tool: 'crm_prepare_automation_enrollment', arguments: { contactId: '{{contactId}}', workflowId: '{{workflowId}}' }, requiresConfirmation: true },
    ],
    liveData: loadLeadIntakeData,
  },
  {
    appId: 'conversation-inbox',
    toolName: 'show_ghl_conversation_inbox_app',
    title: 'Conversation Inbox',
    description: 'Open an SMS/email conversation workspace with thread context and safe reply controls.',
    summary: 'Review recent conversations, inspect messages, and draft outbound SMS or email replies.',
    inputSchema: {
      ...commonLocationInput,
      conversationId: z.string().optional(),
      query: z.string().optional(),
    },
    fields: [
      { name: 'query', label: 'Search Threads', type: 'text' },
      { name: 'channel', label: 'Reply Channel', type: 'select', options: ['SMS', 'Email'] },
      { name: 'subject', label: 'Email Subject', type: 'text' },
      { name: 'message', label: 'Reply Draft', type: 'textarea' },
    ],
    readTools: ['search_conversations', 'get_conversation', 'get_recent_messages', 'get_message', 'get_email_message', 'get_message_recording', 'get_message_transcription'],
    writeTools: ['send_sms', 'send_email', 'create_conversation', 'update_conversation', 'upload_message_attachments', 'update_message_status'],
    destructiveTools: ['delete_conversation', 'cancel_scheduled_message', 'cancel_scheduled_email'],
    sections: [
      { id: 'reply', title: 'Reply Composer', kind: 'form', description: 'Draft replies inside chat before sending.' },
      { id: 'threads', title: 'Threads', kind: 'records', sampleRecords: sampleConversations() },
      { id: 'messages', title: 'Recent Messages', kind: 'records', sampleRecords: sampleMessages() },
      { id: 'tools', title: 'Tool Group', kind: 'tool-group', tools: ['search_conversations', 'get_conversation', 'send_sms', 'send_email', 'cancel_scheduled_message'] },
    ],
    actions: [
      { label: 'Open inbox context', tool: 'crm_conversation_workspace', arguments: { conversationId: '{{conversationId}}', query: '{{query}}' } },
      { label: 'Prepare SMS', tool: 'crm_prepare_conversation_reply', arguments: { contactId: '{{contactId}}', channel: 'sms', message: '{{message}}' }, requiresConfirmation: true },
      { label: 'Prepare email', tool: 'crm_prepare_conversation_reply', arguments: { contactId: '{{contactId}}', channel: 'email', subject: '{{subject}}', message: '{{message}}' }, requiresConfirmation: true },
    ],
    liveData: loadConversationData,
  },
  {
    appId: 'pipeline-board',
    toolName: 'show_ghl_pipeline_board_app',
    title: 'Pipeline Board',
    description: 'Open a sales pipeline board with opportunity cards, stale deal warnings, and next-action controls.',
    summary: 'Manage opportunities visually from chat with read-first stage review and confirmation-gated status changes.',
    inputSchema: {
      ...commonLocationInput,
      pipelineId: z.string().optional(),
      status: z.string().optional(),
    },
    fields: [
      { name: 'pipelineId', label: 'Pipeline', type: 'text' },
      { name: 'stageId', label: 'Stage', type: 'text' },
      { name: 'opportunityName', label: 'Opportunity Name', type: 'text' },
      { name: 'value', label: 'Value', type: 'text' },
      { name: 'nextStep', label: 'Next Step', type: 'textarea' },
    ],
    readTools: ['get_pipelines', 'search_opportunities', 'get_opportunity', 'get_pipeline_reports'],
    writeTools: ['create_opportunity', 'update_opportunity', 'update_opportunity_status', 'upsert_opportunity', 'add_opportunity_followers', 'create_contact_task', 'create_contact_note'],
    destructiveTools: ['delete_opportunity'],
    sections: [
      { id: 'opportunity', title: 'Opportunity Form', kind: 'form', description: 'Edit opportunity essentials before saving.' },
      { id: 'board', title: 'Pipeline Board', kind: 'kanban', sampleRecords: sampleOpportunities() },
      { id: 'stale', title: 'Stale Deal Queue', kind: 'records', sampleRecords: sampleStaleDeals() },
      { id: 'tools', title: 'Tool Group', kind: 'tool-group', tools: ['get_pipelines', 'search_opportunities', 'update_opportunity_status', 'create_contact_task'] },
    ],
    actions: [
      { label: 'Open pipeline board', tool: 'crm_pipeline_workspace', arguments: { pipelineId: '{{pipelineId}}', status: '{{status}}' } },
      { label: 'Prepare opportunity update', tool: 'crm_prepare_opportunity_update', arguments: { opportunityId: '{{opportunityId}}', contactId: '{{contactId}}', pipelineId: '{{pipelineId}}', stageId: '{{stageId}}', status: '{{status}}' }, requiresConfirmation: true },
      { label: 'Prepare follow-up', tool: 'crm_prepare_pipeline_follow_up', arguments: { opportunityId: '{{opportunityId}}', contactId: '{{contactId}}', nextStep: '{{nextStep}}' }, requiresConfirmation: true },
    ],
    liveData: loadPipelineData,
  },
  {
    appId: 'appointment-desk',
    toolName: 'show_ghl_appointment_desk_app',
    title: 'Appointment Desk',
    description: 'Open a booking workspace with free slots, calendars, resources, appointment notes, and reschedule controls.',
    summary: 'Find availability and book or update appointments from a guided form in chat.',
    inputSchema: commonLocationInput,
    fields: [
      { name: 'contactId', label: 'Contact ID', type: 'text' },
      { name: 'calendarId', label: 'Calendar', type: 'text' },
      { name: 'startDate', label: 'Start Date', type: 'date' },
      { name: 'slot', label: 'Selected Slot', type: 'text' },
      { name: 'notes', label: 'Appointment Notes', type: 'textarea' },
    ],
    readTools: ['get_calendar_groups', 'get_calendars', 'get_free_slots', 'get_calendar_events', 'get_appointment', 'get_appointment_notes', 'get_calendar_resources_rooms', 'get_calendar_resources_equipments'],
    writeTools: ['create_appointment', 'update_appointment', 'create_appointment_note', 'create_block_slot'],
    destructiveTools: ['delete_appointment', 'delete_appointment_note'],
    sections: [
      { id: 'booking', title: 'Booking Form', kind: 'form', description: 'Choose contact, calendar, slot, and notes before booking.' },
      { id: 'calendars', title: 'Calendars', kind: 'records', sampleRecords: sampleCalendars() },
      { id: 'slots', title: 'Available Slots', kind: 'records', sampleRecords: sampleSlots() },
      { id: 'tools', title: 'Tool Group', kind: 'tool-group', tools: ['get_free_slots', 'create_appointment', 'update_appointment', 'create_appointment_note'] },
    ],
    actions: [
      { label: 'Open appointment desk', tool: 'crm_appointment_workspace', arguments: { calendarId: '{{calendarId}}', startDate: '{{startDate}}' } },
      { label: 'Prepare booking', tool: 'crm_prepare_appointment_booking', arguments: { contactId: '{{contactId}}', calendarId: '{{calendarId}}', startTime: '{{slot}}', notes: '{{notes}}' }, requiresConfirmation: true },
      { label: 'Prepare reschedule', tool: 'crm_prepare_appointment_reschedule', arguments: { appointmentId: '{{appointmentId}}', calendarId: '{{calendarId}}', startTime: '{{slot}}' }, requiresConfirmation: true },
    ],
    liveData: loadAppointmentData,
  },
  {
    appId: 'automation-launcher',
    toolName: 'show_ghl_automation_launcher_app',
    title: 'Campaign + Workflow Launcher',
    description: 'Open a controlled automation launcher for campaigns, workflows, scheduled messages, and contact enrollment.',
    summary: 'Preview automations and enroll contacts only after explicit user confirmation.',
    inputSchema: commonLocationInput,
    fields: [
      { name: 'contactId', label: 'Contact ID', type: 'text' },
      { name: 'campaignId', label: 'Campaign', type: 'text' },
      { name: 'workflowId', label: 'Workflow', type: 'text' },
      { name: 'launchNote', label: 'Launch Note', type: 'textarea' },
    ],
    readTools: ['get_campaigns', 'get_campaign', 'get_campaign_stats', 'get_campaign_recipients', 'get_scheduled_messages', 'ghl_get_workflows', 'ghl_get_workflow', 'ghl_get_workflow_executions'],
    writeTools: ['start_campaign', 'pause_campaign', 'resume_campaign', 'add_contact_to_campaign', 'remove_contact_from_campaign', 'add_contact_to_workflow', 'remove_contact_from_workflow', 'ghl_trigger_workflow', 'ghl_update_workflow_status'],
    destructiveTools: ['delete_campaign', 'ghl_delete_workflow', 'cancel_scheduled_campaign_message'],
    sections: [
      { id: 'launch', title: 'Launch Form', kind: 'form', description: 'Pick contact, campaign, workflow, and confirm the launch intent.' },
      { id: 'campaigns', title: 'Campaigns', kind: 'records', sampleRecords: sampleCampaigns() },
      { id: 'workflows', title: 'Workflows', kind: 'records', sampleRecords: sampleWorkflows() },
      { id: 'tools', title: 'Tool Group', kind: 'tool-group', tools: ['get_campaigns', 'ghl_get_workflows', 'add_contact_to_campaign', 'add_contact_to_workflow'] },
    ],
    actions: [
      { label: 'Open automation context', tool: 'crm_automation_workspace' },
      { label: 'Prepare enrollment', tool: 'crm_prepare_automation_enrollment', arguments: { contactId: '{{contactId}}', campaignId: '{{campaignId}}', workflowId: '{{workflowId}}', note: '{{launchNote}}' }, requiresConfirmation: true },
      { label: 'Prepare workflow trigger', tool: 'crm_prepare_workflow_trigger', arguments: { contactId: '{{contactId}}', workflowId: '{{workflowId}}', reason: '{{launchNote}}' }, requiresConfirmation: true },
    ],
    liveData: loadAutomationData,
  },
  {
    appId: 'reputation-center',
    toolName: 'show_ghl_reputation_center_app',
    title: 'Reputation Center',
    description: 'Open a review management workspace with inbox, reply composer, request sender, and reputation stats.',
    summary: 'Manage reviews and send review requests from a confirmation-gated workspace.',
    inputSchema: commonLocationInput,
    fields: [
      { name: 'contactId', label: 'Contact ID', type: 'text' },
      { name: 'reviewId', label: 'Review ID', type: 'text' },
      { name: 'reply', label: 'Reply Draft', type: 'textarea' },
      { name: 'requestMessage', label: 'Review Request Message', type: 'textarea' },
    ],
    readTools: ['get_reviews', 'get_review', 'get_review_stats', 'get_review_requests', 'get_connected_review_platforms', 'get_review_links', 'get_review_widget_settings'],
    writeTools: ['reply_to_review', 'update_review_reply', 'send_review_request', 'update_review_links', 'update_review_widget_settings'],
    destructiveTools: ['delete_review_reply', 'disconnect_review_platform'],
    sections: [
      { id: 'reply', title: 'Review Reply Composer', kind: 'form', description: 'Draft a public review reply before publishing.' },
      { id: 'reviews', title: 'Review Inbox', kind: 'records', sampleRecords: sampleReviews() },
      { id: 'requests', title: 'Review Request Queue', kind: 'records', sampleRecords: sampleReviewRequests() },
      { id: 'tools', title: 'Tool Group', kind: 'tool-group', tools: ['get_reviews', 'reply_to_review', 'send_review_request', 'get_review_stats'] },
    ],
    actions: [
      { label: 'Open reputation context', tool: 'crm_reputation_workspace' },
      { label: 'Prepare review reply', tool: 'crm_prepare_review_reply', arguments: { reviewId: '{{reviewId}}', reply: '{{reply}}' }, requiresConfirmation: true },
      { label: 'Prepare review request', tool: 'crm_prepare_review_request', arguments: { contactId: '{{contactId}}', message: '{{requestMessage}}' }, requiresConfirmation: true },
    ],
    liveData: loadReputationData,
  },
  {
    appId: 'ads-dashboard',
    toolName: 'show_ghl_ads_dashboard_app',
    title: 'Ads + Attribution Dashboard',
    description: 'Open an ads, attribution, funnel, conversion, and revenue reporting workspace.',
    summary: 'Inspect paid performance, attribution, and client-ready reporting inside chat.',
    inputSchema: {
      ...commonLocationInput,
      startDate: z.string().optional(),
      endDate: z.string().optional(),
    },
    fields: [
      { name: 'startDate', label: 'Start Date', type: 'date' },
      { name: 'endDate', label: 'End Date', type: 'date' },
      { name: 'channel', label: 'Channel', type: 'select', options: ['All', 'Facebook', 'Google', 'LinkedIn'] },
      { name: 'clientSummary', label: 'Client Summary Notes', type: 'textarea' },
    ],
    readTools: ['get_ad_reports', 'get_attribution_report', 'get_funnel_reports', 'get_conversion_reports', 'get_revenue_reports', 'audit_location_ads_setup', 'o_ad_manager_fb_get_reporting', 'o_ad_manager_google_get_reporting', 'o_ad_manager_li_get_ad_analytics'],
    writeTools: ['o_ad_manager_fb_pause_campaign', 'o_ad_manager_fb_resume_campaign', 'o_ad_manager_google_upsert_campaign', 'o_ad_manager_li_update_ad_status'],
    destructiveTools: ['o_ad_manager_fb_delete_campaign', 'o_ad_manager_google_delete_ad_account'],
    sections: [
      { id: 'filters', title: 'Report Controls', kind: 'form', description: 'Set date range and channel filters.' },
      { id: 'performance', title: 'Performance Report', kind: 'report', sampleRecords: sampleAdReports() },
      { id: 'attribution', title: 'Attribution', kind: 'records', sampleRecords: sampleAttribution() },
      { id: 'tools', title: 'Tool Group', kind: 'tool-group', tools: ['get_ad_reports', 'get_attribution_report', 'get_funnel_reports', 'audit_location_ads_setup'] },
    ],
    actions: [
      { label: 'Open ads workspace', tool: 'crm_ads_workspace', arguments: { startDate: '{{startDate}}', endDate: '{{endDate}}', channel: '{{channel}}' } },
      { label: 'Prepare campaign status', tool: 'crm_prepare_ad_campaign_status', arguments: { platform: '{{channel}}', campaignId: '{{campaignId}}', status: '{{status}}' }, requiresConfirmation: true },
    ],
    liveData: loadAdsData,
  },
  {
    appId: 'billing-commerce',
    toolName: 'show_ghl_billing_commerce_app',
    title: 'Billing + Commerce Workspace',
    description: 'Open an invoices, estimates, orders, transactions, subscriptions, coupons, and product workspace.',
    summary: 'Create, inspect, and send billing records with confirmation before money-moving actions.',
    inputSchema: commonLocationInput,
    fields: [
      { name: 'contactId', label: 'Contact ID', type: 'text' },
      { name: 'invoiceId', label: 'Invoice ID', type: 'text' },
      { name: 'amount', label: 'Amount', type: 'text' },
      { name: 'memo', label: 'Memo', type: 'textarea' },
    ],
    readTools: ['list_invoices', 'get_invoice', 'list_estimates', 'list_orders', 'get_order_by_id', 'list_transactions', 'list_subscriptions', 'ghl_list_products', 'ghl_get_product', 'list_coupons'],
    writeTools: ['create_invoice', 'send_invoice', 'create_estimate', 'send_estimate', 'create_invoice_from_estimate', 'record_order_payment', 'create_coupon', 'ghl_create_product'],
    destructiveTools: ['delete_coupon', 'delete_invoice_template'],
    sections: [
      { id: 'invoice', title: 'Invoice / Estimate Form', kind: 'form', description: 'Prepare invoices or estimates before sending.' },
      { id: 'billing', title: 'Billing Records', kind: 'records', sampleRecords: sampleInvoices() },
      { id: 'commerce', title: 'Orders + Products', kind: 'records', sampleRecords: sampleOrders() },
      { id: 'tools', title: 'Tool Group', kind: 'tool-group', tools: ['list_invoices', 'create_invoice', 'send_invoice', 'list_orders', 'list_transactions'] },
    ],
    actions: [
      { label: 'Open billing workspace', tool: 'crm_billing_workspace' },
      { label: 'Prepare invoice', tool: 'crm_prepare_invoice', arguments: { contactId: '{{contactId}}', invoiceId: '{{invoiceId}}', amount: '{{amount}}', memo: '{{memo}}' }, requiresConfirmation: true },
      { label: 'Prepare payment record', tool: 'crm_prepare_payment_record', arguments: { orderId: '{{orderId}}', invoiceId: '{{invoiceId}}', amount: '{{amount}}' }, requiresConfirmation: true },
    ],
    liveData: loadBillingData,
  },
  {
    appId: 'agency-admin',
    toolName: 'show_ghl_agency_admin_app',
    title: 'Agency Admin Console',
    description: 'Open an agency operations console for locations, users, snapshots, phone, media, webhooks, and setup health.',
    summary: 'Audit and operate subaccounts from a central setup and rollout workspace.',
    inputSchema: commonLocationInput,
    fields: [
      { name: 'locationId', label: 'Location ID', type: 'text' },
      { name: 'userEmail', label: 'User Email', type: 'email' },
      { name: 'snapshotId', label: 'Snapshot ID', type: 'text' },
      { name: 'rolloutNote', label: 'Rollout Note', type: 'textarea' },
    ],
    readTools: ['search_locations', 'get_location', 'get_users', 'search_users', 'get_location_custom_fields', 'get_location_custom_values', 'get_snapshots', 'get_snapshot_push_status', 'get_latest_snapshot_push', 'get_media_files', 'get_phone_numbers', 'get_dashboard_stats'],
    writeTools: ['create_location', 'update_location', 'create_user', 'update_user', 'push_snapshot_to_subaccounts', 'create_snapshot_share_link', 'upload_media_file', 'purchase_phone_number'],
    destructiveTools: ['delete_location', 'delete_user', 'release_phone_number', 'delete_media_file'],
    sections: [
      { id: 'admin', title: 'Admin Control Form', kind: 'form', description: 'Pick location, user, and snapshot rollout target.' },
      { id: 'health', title: 'Setup Health Checklist', kind: 'checklist', sampleRecords: [] },
      { id: 'locations', title: 'Locations + Users', kind: 'records', sampleRecords: sampleLocations() },
      { id: 'tools', title: 'Tool Group', kind: 'tool-group', tools: ['search_locations', 'search_users', 'get_snapshots', 'push_snapshot_to_subaccounts', 'get_phone_numbers'] },
    ],
    actions: [
      { label: 'Open agency console', tool: 'crm_agency_admin_workspace' },
      { label: 'Run health check', tool: 'crm_location_health_check', arguments: { locationId: '{{locationId}}' } },
      { label: 'Prepare snapshot rollout', tool: 'crm_prepare_snapshot_rollout', arguments: { snapshotId: '{{snapshotId}}', locationIds: ['{{locationId}}'], rolloutNote: '{{rolloutNote}}' }, requiresConfirmation: true },
      { label: 'Prepare user invite', tool: 'crm_prepare_user_invite', arguments: { locationId: '{{locationId}}', email: '{{userEmail}}' }, requiresConfirmation: true },
    ],
    liveData: loadAgencyAdminData,
  },
];

export function createServer(): McpServer {
  const server = new McpServer({
    name: 'ghl-mcp-apps',
    version: '0.2.0',
  });

  registerAppResource(
    server,
    'GoHighLevel MCP Apps',
    appResourceUri,
    {
      mimeType: RESOURCE_MIME_TYPE,
      description: 'Interactive GoHighLevel CRM workspaces for MCP hosts.',
    },
    async (): Promise<ReadResourceResult> => ({
      contents: [
        {
          uri: appResourceUri,
          mimeType: RESOURCE_MIME_TYPE,
          text: await readFile(htmlPath, 'utf8'),
        },
      ],
    }),
  );

  registerToolExplorer(server);
  for (const definition of APP_DEFINITIONS) registerWorkspaceTool(server, definition);

  // Backward-compatible aliases from the first prototype.
  registerAliasTool(server, 'show_ghl_contact_360_app', 'contact-workspace');
  registerAliasTool(server, 'show_ghl_pipeline_command_app', 'pipeline-board');
  registerAliasTool(server, 'show_ghl_ads_reporting_app', 'ads-dashboard');
  registerAliasTool(server, 'show_ghl_agency_health_app', 'agency-admin');

  return server;
}

export async function buildPreviewPayload(appId: string, args: Record<string, unknown> = {}): Promise<AppPayload> {
  if (appId === 'contact-360') return buildWorkspacePayload(findDefinition('contact-workspace'), args);
  if (appId === 'pipeline-command') return buildWorkspacePayload(findDefinition('pipeline-board'), args);
  if (appId === 'ads-reporting') return buildWorkspacePayload(findDefinition('ads-dashboard'), args);
  if (appId === 'agency-health') return buildWorkspacePayload(findDefinition('agency-admin'), args);
  const definition = APP_DEFINITIONS.find((item) => item.appId === appId);
  return definition ? buildWorkspacePayload(definition, args) : buildToolExplorerPayload();
}

function registerToolExplorer(server: McpServer): void {
  registerAppTool(
    server,
    'show_ghl_tool_explorer_app',
    {
      title: 'Open GHL Tool Explorer',
      description: 'Open an interactive explorer for registered GoHighLevel MCP tools and CRM workflow apps.',
      inputSchema: {},
      outputSchema: z.object({ payload: z.any() }),
      _meta: { ui: { resourceUri: appResourceUri, visibility: ['model', 'app'] }, labels: appLabels() },
    },
    async (): Promise<CallToolResult> => resultFromPayload(await buildToolExplorerPayload()),
  );
}

function registerWorkspaceTool(server: McpServer, definition: AppDefinition): void {
  registerAppTool(
    server,
    definition.toolName,
    {
      title: `Open ${definition.title}`,
      description: definition.description,
      inputSchema: definition.inputSchema || {},
      outputSchema: z.object({ payload: z.any() }),
      _meta: { ui: { resourceUri: appResourceUri, visibility: ['model', 'app'] }, labels: appLabels() },
    },
    async (args): Promise<CallToolResult> => resultFromPayload(await buildWorkspacePayload(definition, args || {})),
  );
}

function registerAliasTool(server: McpServer, toolName: string, appId: string): void {
  const definition = findDefinition(appId);
  registerAppTool(
    server,
    toolName,
    {
      title: `Open ${definition.title}`,
      description: `Alias for ${definition.toolName}.`,
      inputSchema: definition.inputSchema || {},
      outputSchema: z.object({ payload: z.any() }),
      _meta: { ui: { resourceUri: appResourceUri, visibility: ['model', 'app'] }, labels: appLabels() },
    },
    async (args): Promise<CallToolResult> => resultFromPayload(await buildWorkspacePayload(definition, args || {})),
  );
}

function appLabels(): Record<string, string> {
  return {
    category: 'ghl-mcp-app',
    access: 'read',
    source: 'mcp-apps',
  };
}

function resultFromPayload(payload: AppPayload): CallToolResult {
  return {
    content: [{ type: 'text', text: `${payload.title}: ${payload.summary}` }],
    structuredContent: { payload },
  };
}

async function buildToolExplorerPayload(): Promise<AppPayload> {
  const tools = await readToolInventory();
  const categories = new Set(tools.map((tool) => tool.category));
  return {
    appId: 'tool-explorer',
    title: 'GHL Tool Explorer',
    summary: 'Browse the raw MCP tool surface or jump into a higher-level CRM workspace.',
    status: 'ready',
    metrics: [
      { label: 'Tools', value: tools.length },
      { label: 'CRM Apps', value: APP_DEFINITIONS.length },
      { label: 'Read Tools', value: tools.filter((tool) => tool.access === 'read').length },
      { label: 'Destructive', value: tools.filter((tool) => tool.access === 'delete').length },
    ],
    data: {
      tools,
      apps: APP_DEFINITIONS.map((app) => ({
        id: app.appId,
        title: app.title,
        summary: app.summary,
        preview: `/preview?app=${app.appId}`,
        toolName: app.toolName,
      })),
      categories: [...categories].sort(),
    },
  };
}

async function buildWorkspacePayload(definition: AppDefinition, args: Record<string, unknown>): Promise<AppPayload> {
  const live = credentialsReady() && definition.liveData ? await definition.liveData(args) : {};
  const sections = definition.sections.map((section) => ({
    ...section,
    fields: section.kind === 'form' ? definition.fields : section.fields,
    records: recordsFrom(live[section.id]).length ? recordsFrom(live[section.id]) : (section.sampleRecords || []),
    tools: section.tools || [],
  }));

  return {
    appId: definition.appId,
    title: definition.title,
    summary: definition.summary,
    status: credentialsReady() ? (definition.statusLabel || 'ready') : 'preview mode',
    metrics: definition.metrics ? definition.metrics(live) : defaultMetrics(definition, sections),
    data: {
      sections,
      fields: definition.fields || [],
      readTools: definition.readTools,
      writeTools: definition.writeTools,
      destructiveTools: definition.destructiveTools || [],
      liveDataLoaded: credentialsReady(),
    },
    suggestedToolCalls: definition.actions.map((action) => ({
      ...action,
      arguments: withLocation(action.arguments || {}, args),
    })),
  };
}

function defaultMetrics(definition: AppDefinition, sections: SectionDef[]): Array<{ label: string; value: string | number }> {
  return [
    { label: 'Read Tools', value: definition.readTools.length },
    { label: 'Write Tools', value: definition.writeTools.length },
    { label: 'Sections', value: sections.length },
    { label: 'Confirm Actions', value: definition.actions.filter((action) => action.requiresConfirmation).length },
  ];
}

function findDefinition(appId: string): AppDefinition {
  const definition = APP_DEFINITIONS.find((item) => item.appId === appId);
  if (!definition) throw new Error(`Unknown app definition: ${appId}`);
  return definition;
}

async function loadContactWorkspaceData(args: Record<string, unknown>): Promise<Record<string, unknown>> {
  const locationId = locationArg(args);
  const query = stringArg(args.query);
  const contactId = stringArg(args.contactId);
  const [contact, contacts, conversations, opportunities, notes, tasks, appointments] = await Promise.all([
    contactId ? callReadTool('get_contact', { contactId }) : Promise.resolve(null),
    query ? callReadTool('search_contacts', { locationId, query, pageLimit: 8 }) : Promise.resolve(null),
    callReadTool('search_conversations', { locationId, limit: 8 }),
    callReadTool('search_opportunities', { locationId, limit: 8 }),
    contactId ? callReadTool('get_contact_notes', { contactId }) : Promise.resolve(null),
    contactId ? callReadTool('get_contact_tasks', { contactId }) : Promise.resolve(null),
    contactId ? callReadTool('get_contact_appointments', { contactId }) : Promise.resolve(null),
  ]);
  return {
    profile: recordsFrom(contact || contacts),
    activity: [...recordsFrom(conversations), ...recordsFrom(notes), ...recordsFrom(tasks), ...recordsFrom(appointments)],
    related: recordsFrom(opportunities),
  };
}

async function loadLeadIntakeData(args: Record<string, unknown>): Promise<Record<string, unknown>> {
  const locationId = locationArg(args);
  const [submissions, uncontacted] = await Promise.all([
    callReadTool('get_form_submissions', { locationId, limit: 20 }),
    callReadTool('find_uncontacted_form_leads', { locationId }),
  ]);
  return { submissions: [...recordsFrom(submissions), ...recordsFrom(uncontacted)] };
}

async function loadConversationData(args: Record<string, unknown>): Promise<Record<string, unknown>> {
  const locationId = locationArg(args);
  const conversationId = stringArg(args.conversationId);
  const [threads, messages] = await Promise.all([
    callReadTool('search_conversations', { locationId, query: stringArg(args.query), limit: 20 }),
    conversationId ? callReadTool('get_conversation', { conversationId }) : callReadTool('get_recent_messages', { locationId, limit: 20 }),
  ]);
  return { threads: recordsFrom(threads), messages: recordsFrom(messages) };
}

async function loadPipelineData(args: Record<string, unknown>): Promise<Record<string, unknown>> {
  const locationId = locationArg(args);
  const [board, stale] = await Promise.all([
    callReadTool('search_opportunities', { locationId, pipelineId: stringArg(args.pipelineId), status: stringArg(args.status), limit: 50 }),
    callReadTool('search_opportunities', { locationId, limit: 10 }),
  ]);
  return { board: recordsFrom(board), stale: recordsFrom(stale) };
}

async function loadAppointmentData(args: Record<string, unknown>): Promise<Record<string, unknown>> {
  const locationId = locationArg(args);
  const [calendars, slots] = await Promise.all([
    callReadTool('get_calendars', { locationId }),
    callReadTool('get_free_slots', { calendarId: stringArg(args.calendarId), startDate: stringArg(args.startDate) || new Date().toISOString().slice(0, 10) }),
  ]);
  return { calendars: recordsFrom(calendars), slots: recordsFrom(slots) };
}

async function loadAutomationData(args: Record<string, unknown>): Promise<Record<string, unknown>> {
  const locationId = locationArg(args);
  const [campaigns, workflows] = await Promise.all([
    callReadTool('get_campaigns', { locationId }),
    callReadTool('ghl_get_workflows', { locationId }),
  ]);
  return { campaigns: recordsFrom(campaigns), workflows: recordsFrom(workflows) };
}

async function loadReputationData(args: Record<string, unknown>): Promise<Record<string, unknown>> {
  const locationId = locationArg(args);
  const [reviews, requests] = await Promise.all([
    callReadTool('get_reviews', { locationId }),
    callReadTool('get_review_requests', { locationId }),
  ]);
  return { reviews: recordsFrom(reviews), requests: recordsFrom(requests) };
}

async function loadAdsData(args: Record<string, unknown>): Promise<Record<string, unknown>> {
  const locationId = locationArg(args);
  const endDate = stringArg(args.endDate) || new Date().toISOString().slice(0, 10);
  const startDate = stringArg(args.startDate) || daysAgo(7);
  const [performance, attribution] = await Promise.all([
    callReadTool('get_ad_reports', { locationId, startDate, endDate }),
    callReadTool('get_attribution_report', { locationId, startDate, endDate }),
  ]);
  return { performance: recordsFrom(performance), attribution: recordsFrom(attribution) };
}

async function loadBillingData(args: Record<string, unknown>): Promise<Record<string, unknown>> {
  const locationId = locationArg(args);
  const [billing, commerce] = await Promise.all([
    callReadTool('list_invoices', { locationId, limit: 20 }),
    callReadTool('list_orders', { locationId, limit: 20 }),
  ]);
  return { billing: recordsFrom(billing), commerce: recordsFrom(commerce) };
}

async function loadAgencyAdminData(args: Record<string, unknown>): Promise<Record<string, unknown>> {
  const locationId = locationArg(args);
  const [locations, users] = await Promise.all([
    callReadTool('search_locations', { query: stringArg(args.query), limit: 20 }),
    callReadTool('search_users', { locationId, limit: 20 }),
  ]);
  return {
    health: setupChecklist(),
    locations: [...recordsFrom(locations), ...recordsFrom(users)],
  };
}

async function callReadTool(name: string, args: Record<string, unknown>): Promise<unknown> {
  if (!credentialsReady()) return { status: 'preview', reason: 'Set GHL_API_KEY and GHL_LOCATION_ID to load live data.' };
  try {
    const registry = await createRegistry();
    return await registry.callTool(name, compact(args));
  } catch (error) {
    return { status: 'error', message: error instanceof Error ? error.message : String(error) };
  }
}

async function createRegistry(): Promise<any> {
  const [{ EnhancedGHLClient }, { ToolRegistry }] = await Promise.all([
    import(pathToFileURL(join(repoRoot, 'dist', 'enhanced-ghl-client.js')).href),
    import(pathToFileURL(join(repoRoot, 'dist', 'tool-registry.js')).href),
  ]);
  const client = new EnhancedGHLClient({
    accessToken: process.env.GHL_API_KEY,
    locationId: process.env.GHL_LOCATION_ID,
    baseUrl: process.env.GHL_BASE_URL || 'https://services.leadconnectorhq.com',
    version: process.env.GHL_API_VERSION || '2021-07-28',
  });
  return new ToolRegistry(client);
}

async function readToolInventory(): Promise<ToolInventoryItem[]> {
  const raw = await readFile(join(repoRoot, 'docs', 'tool-inventory.json'), 'utf8');
  const parsed = JSON.parse(raw) as { tools?: ToolInventoryItem[] };
  return parsed.tools || [];
}

function credentialsReady(): boolean {
  return Boolean(process.env.GHL_API_KEY && process.env.GHL_LOCATION_ID);
}

function withLocation(args: Record<string, unknown>, input: Record<string, unknown>): Record<string, unknown> {
  const locationId = locationArg(input);
  return locationId ? { locationId, ...args } : args;
}

function locationArg(args: Record<string, unknown>): string {
  return stringArg(args.locationId) || process.env.GHL_LOCATION_ID || '';
}

function recordsFrom(value: unknown): Record<string, unknown>[] {
  if (Array.isArray(value)) return value.filter(isRecord);
  if (!isRecord(value)) return [];
  for (const key of ['contacts', 'opportunities', 'pipelines', 'users', 'calendars', 'conversations', 'messages', 'invoices', 'orders', 'reviews', 'submissions', 'campaigns', 'workflows', 'data', 'items', 'results']) {
    const nested = value[key];
    if (Array.isArray(nested)) return nested.filter(isRecord);
  }
  return [value];
}

function stringArg(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

function compact(args: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(Object.entries(args).filter(([, value]) => value !== undefined && value !== ''));
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function daysAgo(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString().slice(0, 10);
}

function sampleContactActivity(): Record<string, unknown>[] {
  return [
    { type: 'SMS', when: 'Today', summary: 'Lead asked for pricing and available appointment times.' },
    { type: 'Note', when: 'Yesterday', summary: 'Qualified as high intent. Prefers afternoon calls.' },
    { type: 'Task', when: 'Tomorrow', summary: 'Follow up with estimate and booking link.' },
  ];
}

function sampleOpportunities(): Record<string, unknown>[] {
  return [
    { name: 'New Website Lead', stage: 'Qualified', value: '$4,500', owner: 'Sales Team' },
    { name: 'Reactivation Deal', stage: 'Follow Up', value: '$1,200', owner: 'Account Manager' },
  ];
}

function sampleLeads(): Record<string, unknown>[] {
  return [
    { name: 'Jamie Rivera', source: 'Website Form', status: 'New', urgency: 'High' },
    { name: 'Morgan Lee', source: 'Facebook Lead Ad', status: 'Uncontacted', urgency: 'Medium' },
  ];
}

function sampleConversations(): Record<string, unknown>[] {
  return [
    { contact: 'Jamie Rivera', channel: 'SMS', status: 'Needs reply', preview: 'Can I come in this week?' },
    { contact: 'Morgan Lee', channel: 'Email', status: 'Waiting', preview: 'Please send details.' },
  ];
}

function sampleMessages(): Record<string, unknown>[] {
  return [
    { direction: 'Inbound', channel: 'SMS', body: 'Do you have openings tomorrow?' },
    { direction: 'Outbound', channel: 'Email', body: 'Here are the available times.' },
  ];
}

function sampleStaleDeals(): Record<string, unknown>[] {
  return [
    { name: 'ACME Follow Up', stage: 'Proposal Sent', age: '9 days', nextStep: 'Call decision maker' },
    { name: 'Northside Estimate', stage: 'Qualified', age: '6 days', nextStep: 'Send estimate' },
  ];
}

function sampleCalendars(): Record<string, unknown>[] {
  return [
    { name: 'Sales Consultation', type: 'Round robin', status: 'Active' },
    { name: 'Service Appointment', type: 'Team calendar', status: 'Active' },
  ];
}

function sampleSlots(): Record<string, unknown>[] {
  return [
    { date: 'Tomorrow', slot: '10:00 AM', calendar: 'Sales Consultation' },
    { date: 'Tomorrow', slot: '2:30 PM', calendar: 'Sales Consultation' },
  ];
}

function sampleCampaigns(): Record<string, unknown>[] {
  return [
    { name: 'New Lead Nurture', status: 'Active', recipients: 128 },
    { name: 'Missed Call Text Back', status: 'Paused', recipients: 42 },
  ];
}

function sampleWorkflows(): Record<string, unknown>[] {
  return [
    { name: 'Appointment Reminder', status: 'Published', trigger: 'Appointment booked' },
    { name: 'Lead Reactivation', status: 'Draft', trigger: 'Tag added' },
  ];
}

function sampleReviews(): Record<string, unknown>[] {
  return [
    { platform: 'Google', rating: 5, reviewer: 'Taylor', status: 'Needs reply' },
    { platform: 'Facebook', rating: 4, reviewer: 'Casey', status: 'Replied' },
  ];
}

function sampleReviewRequests(): Record<string, unknown>[] {
  return [
    { contact: 'Jamie Rivera', channel: 'SMS', status: 'Ready to send' },
    { contact: 'Morgan Lee', channel: 'Email', status: 'Scheduled' },
  ];
}

function sampleAdReports(): Record<string, unknown>[] {
  return [
    { channel: 'Facebook', spend: '$420', leads: 18, cpl: '$23.33' },
    { channel: 'Google', spend: '$610', leads: 21, cpl: '$29.05' },
  ];
}

function sampleAttribution(): Record<string, unknown>[] {
  return [
    { source: 'Facebook Lead Ads', contacts: 18, revenue: '$3,200' },
    { source: 'Google Search', contacts: 21, revenue: '$4,800' },
  ];
}

function sampleInvoices(): Record<string, unknown>[] {
  return [
    { invoice: 'INV-1042', contact: 'Jamie Rivera', amount: '$1,250', status: 'Draft' },
    { invoice: 'INV-1039', contact: 'Morgan Lee', amount: '$875', status: 'Sent' },
  ];
}

function sampleOrders(): Record<string, unknown>[] {
  return [
    { order: 'ORD-2044', status: 'Paid', total: '$199' },
    { product: 'Monthly Care Plan', inventory: 'Available', price: '$149/mo' },
  ];
}

function sampleLocations(): Record<string, unknown>[] {
  return [
    { name: 'Main Location', status: 'Healthy', users: 8, calendars: 4 },
    { name: 'Client Subaccount', status: 'Needs phone setup', users: 3, calendars: 1 },
  ];
}

function setupChecklist(): Record<string, unknown>[] {
  return [
    { label: 'Users invited', status: 'Check' },
    { label: 'Calendars active', status: 'Check' },
    { label: 'Phone numbers configured', status: 'Review' },
    { label: 'Snapshot rollout complete', status: 'Review' },
  ];
}
