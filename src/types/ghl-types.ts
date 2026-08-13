/**
 * TypeScript interfaces for GoHighLevel API integration
 * Based on official OpenAPI specifications: v3 (named) for most modules,
 * 2021-07-28 (ad-publishing) and 2021-04-15 (Conversations) legacy versions.
 */

/**
 * Which generation of the GHL API the client should target.
 * - `v3` (default): prefers the named `v3` Version header for modules that
 *   support it (contacts, opportunities, oauth, emails, brand-boards, saas,
 *   email-isv), while still using legacy dates for modules that have not been
 *   version-bumped (e.g. ad-publishing stays on 2021-07-28, Conversations on
 *   2021-04-15).
 * - `v2`: legacy behavior. Uses dated Version headers only and surfaces the
 *   pre-v3 endpoint set (used as an opt-in compatibility mode).
 */
export type GHLApiGeneration = 'v3' | 'v2';

/**
 * The token/user type, as reported by the OAuth flow. Used by the
 * access-level preflight (Agency-Access-Only / Location-Access-Only) to
 * reject mismatched tokens before the API does.
 */
export type GHLUserType = 'Location' | 'Company';

// Base GHL API Configuration
export interface GHLConfig {
  accessToken: string;
  baseUrl: string;
  /** Fallback Version header used when an endpoint does not specify its own. */
  version: string;
  locationId: string;
  /** API generation toggle. Defaults to `v3` when unset. */
  apiGeneration?: GHLApiGeneration;
  /** Token/user type learned at OAuth time, for access-level preflight. */
  userType?: GHLUserType;
}

// OAuth Token Response
// NOTE: GHL v3 (2026-06-11) migrated the OAuth token exchange to camelCase
// (accessToken, tokenType, expiresIn, refreshToken). The pre-v3 fields are
// kept as optional aliases so v2/compat mode can still read them.
export interface GHLTokenResponse {
  // v3 (camelCase) fields — canonical
  accessToken?: string;
  tokenType?: 'Bearer';
  expiresIn?: number;
  refreshToken?: string;
  scope: string;
  userType: 'Location' | 'Company';
  locationId?: string;
  companyId: string;
  userId: string;
  planId?: string;
  approvedLocations?: string[];
  isBulkInstallation?: boolean;
  installToFutureLocations?: boolean;
  approveAllLocations?: boolean;
  // v2 (snake_case) aliases — read when present, written only in v2 mode
  access_token?: string;
  token_type?: 'Bearer';
  expires_in?: number;
  refresh_token?: string;
}

/**
 * OAuth token exchange request body.
 * v3 requires camelCase (clientId, grantType, ...). v2 used snake_case.
 * Both shapes are accepted; the client sends the right one based on generation.
 */
export interface GHLTokenRequest {
  clientId?: string;
  clientSecret?: string;
  grantType?: string;
  refreshToken?: string;
  userType?: GHLUserType;
  redirectUri?: string;
  // v2 snake_case aliases
  client_id?: string;
  client_secret?: string;
  grant_type?: string;
  refresh_token?: string;
  user_type?: string;
  redirect_uri?: string;
}

/**
 * Normalizes a token response into canonical v3 camelCase fields regardless
 * of which casing the API returned. Useful for compatibility with v2 tokens.
 */
export function normalizeTokenResponse(raw: GHLTokenResponse): GHLTokenResponse {
  return {
    accessToken: raw.accessToken ?? raw.access_token,
    tokenType: raw.tokenType ?? raw.token_type,
    expiresIn: raw.expiresIn ?? raw.expires_in,
    refreshToken: raw.refreshToken ?? raw.refresh_token,
    scope: raw.scope,
    userType: raw.userType,
    locationId: raw.locationId,
    companyId: raw.companyId,
    userId: raw.userId,
    planId: raw.planId,
    approvedLocations: raw.approvedLocations,
    isBulkInstallation: raw.isBulkInstallation,
    installToFutureLocations: raw.installToFutureLocations,
    approveAllLocations: raw.approveAllLocations,
  };
}

// Contact Interfaces - Exact from OpenAPI
export interface GHLContact {
  id?: string;
  locationId: string;
  firstName?: string;
  lastName?: string;
  name?: string;
  email?: string;
  emailLowerCase?: string;
  phone?: string;
  address1?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  website?: string;
  timezone?: string;
  companyName?: string;
  source?: string;
  tags?: string[];
  customFields?: GHLCustomField[];
  dnd?: boolean;
  dndSettings?: GHLDndSettings;
  assignedTo?: string;
  followers?: string[];
  businessId?: string;
  dateAdded?: string;
  dateUpdated?: string;
  dateOfBirth?: string;
  type?: string;
  validEmail?: boolean;
}

// Custom Field Interface
export interface GHLCustomField {
  id: string;
  key?: string;
  field_value: string | string[] | object;
}

// DND Settings Interface
export interface GHLDndSettings {
  Call?: GHLDndSetting;
  Email?: GHLDndSetting;
  SMS?: GHLDndSetting;
  WhatsApp?: GHLDndSetting;
  GMB?: GHLDndSetting;
  FB?: GHLDndSetting;
}

export interface GHLDndSetting {
  status: 'active' | 'inactive' | 'permanent';
  message?: string;
  code?: string;
}

// Search Contacts Request Body
export interface GHLSearchContactsRequest {
  locationId: string;
  query?: string;
  startAfterId?: string;
  startAfter?: number;
  limit?: number;
  filters?: {
    email?: string;
    phone?: string;
    tags?: string[];
    dateAdded?: {
      gte?: string;
      lte?: string;
    };
  };
}

// Search Contacts Response
export interface GHLSearchContactsResponse {
  contacts: GHLContact[];
  total: number;
}

// Create Contact Request
export interface GHLCreateContactRequest {
  locationId: string;
  firstName?: string;
  lastName?: string;
  name?: string;
  email?: string;
  phone?: string;
  address1?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  website?: string;
  timezone?: string;
  companyName?: string;
  source?: string;
  tags?: string[];
  customFields?: GHLCustomField[];
  dnd?: boolean;
  dndSettings?: GHLDndSettings;
  assignedTo?: string;
}

// Contact Tags Operations
export interface GHLContactTagsRequest {
  tags: string[];
}

// Contact Tags Response
export interface GHLContactTagsResponse {
  tags: string[];
}

// CONVERSATION INTERFACES - Based on Conversations API v2021-04-15

// Message Types Enum
export type GHLMessageType = 
  | 'TYPE_CALL' | 'TYPE_SMS' | 'TYPE_EMAIL' | 'TYPE_SMS_REVIEW_REQUEST'
  | 'TYPE_WEBCHAT' | 'TYPE_SMS_NO_SHOW_REQUEST' | 'TYPE_CAMPAIGN_SMS'
  | 'TYPE_CAMPAIGN_CALL' | 'TYPE_CAMPAIGN_EMAIL' | 'TYPE_CAMPAIGN_VOICEMAIL'
  | 'TYPE_FACEBOOK' | 'TYPE_CAMPAIGN_FACEBOOK' | 'TYPE_CAMPAIGN_MANUAL_CALL'
  | 'TYPE_CAMPAIGN_MANUAL_SMS' | 'TYPE_GMB' | 'TYPE_CAMPAIGN_GMB'
  | 'TYPE_REVIEW' | 'TYPE_INSTAGRAM' | 'TYPE_WHATSAPP' | 'TYPE_CUSTOM_SMS'
  | 'TYPE_CUSTOM_EMAIL' | 'TYPE_CUSTOM_PROVIDER_SMS' | 'TYPE_CUSTOM_PROVIDER_EMAIL'
  | 'TYPE_IVR_CALL' | 'TYPE_ACTIVITY_CONTACT' | 'TYPE_ACTIVITY_INVOICE'
  | 'TYPE_ACTIVITY_PAYMENT' | 'TYPE_ACTIVITY_OPPORTUNITY' | 'TYPE_LIVE_CHAT'
  | 'TYPE_LIVE_CHAT_INFO_MESSAGE' | 'TYPE_ACTIVITY_APPOINTMENT'
  | 'TYPE_FACEBOOK_COMMENT' | 'TYPE_INSTAGRAM_COMMENT' | 'TYPE_CUSTOM_CALL'
  | 'TYPE_INTERNAL_COMMENT';

// Send Message Types
export type GHLSendMessageType = 'SMS' | 'Email' | 'WhatsApp' | 'IG' | 'FB' | 'Custom' | 'Live_Chat';

// Message Status
export type GHLMessageStatus = 
  | 'pending' | 'scheduled' | 'sent' | 'delivered' | 'read'
  | 'undelivered' | 'connected' | 'failed' | 'opened' | 'clicked' | 'opt_out';

// Message Direction
export type GHLMessageDirection = 'inbound' | 'outbound';

// Conversation Interface
export interface GHLConversation {
  id: string;
  contactId: string;
  locationId: string;
  lastMessageBody: string;
  lastMessageType: GHLMessageType;
  type: string;
  unreadCount: number;
  fullName: string;
  contactName: string;
  email: string;
  phone: string;
  assignedTo?: string;
  starred?: boolean;
  deleted?: boolean;
  inbox?: boolean;
  lastMessageDate?: string;
  dateAdded?: string;
  dateUpdated?: string;
}

// Message Interface
export interface GHLMessage {
  id: string;
  type: number;
  messageType: GHLMessageType;
  locationId: string;
  contactId: string;
  conversationId: string;
  dateAdded: string;
  body?: string;
  direction: GHLMessageDirection;
  status: GHLMessageStatus;
  contentType: string;
  attachments?: string[];
  meta?: GHLMessageMeta;
  source?: 'workflow' | 'bulk_actions' | 'campaign' | 'api' | 'app';
  userId?: string;
  conversationProviderId?: string;
}

// Message Meta Interface
export interface GHLMessageMeta {
  callDuration?: string;
  callStatus?: 'pending' | 'completed' | 'answered' | 'busy' | 'no-answer' | 'failed' | 'canceled' | 'voicemail';
  email?: {
    messageIds?: string[];
  };
}

// Send Message Request
export interface GHLSendMessageRequest {
  type: GHLSendMessageType;
  contactId: string;
  message?: string;
  html?: string;
  subject?: string;
  attachments?: string[];
  emailFrom?: string;
  emailTo?: string;
  emailCc?: string[];
  emailBcc?: string[];
  replyMessageId?: string;
  templateId?: string;
  threadId?: string;
  scheduledTimestamp?: number;
  conversationProviderId?: string;
  emailReplyMode?: 'reply' | 'reply_all';
  fromNumber?: string;
  toNumber?: string;
  appointmentId?: string;
}

// Send Message Response
export interface GHLSendMessageResponse {
  conversationId: string;
  messageId: string;
  emailMessageId?: string;
  messageIds?: string[];
  msg?: string;
}

// Search Conversations Request
export interface GHLSearchConversationsRequest {
  locationId: string;
  contactId?: string;
  assignedTo?: string;
  followers?: string;
  mentions?: string;
  query?: string;
  sort?: 'asc' | 'desc';
  startAfterDate?: number | number[];
  id?: string;
  limit?: number;
  lastMessageType?: GHLMessageType;
  lastMessageAction?: 'automated' | 'manual';
  lastMessageDirection?: GHLMessageDirection;
  status?: 'all' | 'read' | 'unread' | 'starred' | 'recents';
  sortBy?: 'last_manual_message_date' | 'last_message_date' | 'score_profile';
}

// Search Conversations Response
export interface GHLSearchConversationsResponse {
  conversations: GHLConversation[];
  total: number;
}

// Get Messages Response
export interface GHLGetMessagesResponse {
  lastMessageId: string;
  nextPage: boolean;
  messages: GHLMessage[];
}

// Create Conversation Request
export interface GHLCreateConversationRequest {
  locationId: string;
  contactId: string;
}

// Create Conversation Response
export interface GHLCreateConversationResponse {
  id: string;
  dateUpdated: string;
  dateAdded: string;
  deleted: boolean;
  contactId: string;
  locationId: string;
  lastMessageDate: string;
  assignedTo?: string;
}

// Update Conversation Request
export interface GHLUpdateConversationRequest {
  locationId: string;
  unreadCount?: number;
  starred?: boolean;
  feedback?: object;
}

// API Response Wrapper
export interface GHLApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    statusCode: number;
    details?: any;
  };
}

// Error Response from API
export interface GHLErrorResponse {
  statusCode: number;
  message: string | string[];
  error?: string;
}

// Task Interface
export interface GHLTask {
  id?: string;
  title: string;
  body?: string;
  assignedTo?: string;
  dueDate: string;
  completed: boolean;
  contactId: string;
}

// Note Interface  
export interface GHLNote {
  id?: string;
  body: string;
  userId?: string;
  contactId: string;
  dateAdded?: string;
}

// Campaign Interface
export interface GHLCampaign {
  id: string;
  name: string;
  status: string;
}

// Workflow Interface
export interface GHLWorkflow {
  id: string;
  name: string;
  status: string;
  eventStartTime?: string;
}

// Appointment Interface
export interface GHLAppointment {
  id: string;
  calendarId: string;
  status: string;
  title: string;
  appointmentStatus: string;
  assignedUserId: string;
  notes?: string;
  startTime: string;
  endTime: string;
  address?: string;
  locationId: string;
  contactId: string;
  groupId?: string;
  users?: string[];
  dateAdded: string;
  dateUpdated: string;
  assignedResources?: string[];
}

// Upsert Contact Response
export interface GHLUpsertContactResponse {
  contact: GHLContact;
  new: boolean;
  traceId?: string;
}

// Bulk Tags Update Response  
export interface GHLBulkTagsResponse {
  succeeded: boolean;
  errorCount: number;
  responses: Array<{
    contactId: string;
    message: string;
    type: 'success' | 'error';
    oldTags?: string[];
    tagsAdded?: string[];
    tagsRemoved?: string[];
  }>;
}

// Bulk Business Update Response
export interface GHLBulkBusinessResponse {
  success: boolean;
  ids: string[];
}

// Followers Response  
export interface GHLFollowersResponse {
  followers: string[];
  followersAdded?: string[];
  followersRemoved?: string[];
}

// MCP Tool Parameters - Contact Operations
export interface MCPCreateContactParams {
  firstName?: string;
  lastName?: string;
  email: string;
  phone?: string;
  tags?: string[];
  source?: string;
}

export interface MCPSearchContactsParams {
  query?: string;
  email?: string;
  phone?: string;
  limit?: number;
}

export interface MCPUpdateContactParams {
  contactId: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  tags?: string[];
}

export interface MCPAddContactTagsParams {
  contactId: string;
  tags: string[];
}

export interface MCPRemoveContactTagsParams {
  contactId: string;
  tags: string[];
}

// MCP Tool Parameters - Contact Task Management
export interface MCPGetContactTasksParams {
  contactId: string;
}

export interface MCPCreateContactTaskParams {
  contactId: string;
  title: string;
  body?: string;
  dueDate: string; // ISO date string
  completed?: boolean;
  assignedTo?: string;
}

export interface MCPGetContactTaskParams {
  contactId: string;
  taskId: string;
}

export interface MCPUpdateContactTaskParams {
  contactId: string;
  taskId: string;
  title?: string;
  body?: string;
  dueDate?: string;
  completed?: boolean;
  assignedTo?: string;
}

export interface MCPDeleteContactTaskParams {
  contactId: string;
  taskId: string;
}

export interface MCPUpdateTaskCompletionParams {
  contactId: string;
  taskId: string;
  completed: boolean;
}

// MCP Tool Parameters - Contact Note Management
export interface MCPGetContactNotesParams {
  contactId: string;
}

export interface MCPCreateContactNoteParams {
  contactId: string;
  body: string;
  userId?: string;
}

export interface MCPGetContactNoteParams {
  contactId: string;
  noteId: string;
}

export interface MCPUpdateContactNoteParams {
  contactId: string;
  noteId: string;
  body: string;
  userId?: string;
}

export interface MCPDeleteContactNoteParams {
  contactId: string;
  noteId: string;
}

// MCP Tool Parameters - Advanced Contact Operations  
export interface MCPUpsertContactParams {
  firstName?: string;
  lastName?: string;
  name?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  website?: string;
  timezone?: string;
  companyName?: string;
  tags?: string[];
  customFields?: GHLCustomField[];
  source?: string;
  assignedTo?: string;
}

export interface MCPGetDuplicateContactParams {
  email?: string;
  phone?: string;
}

export interface MCPGetContactsByBusinessParams {
  businessId: string;
  limit?: number;
  skip?: number;
  query?: string;
}

// MCP Tool Parameters - Contact Appointments
export interface MCPGetContactAppointmentsParams {
  contactId: string;
}

// MCP Tool Parameters - Bulk Operations
export interface MCPBulkUpdateContactTagsParams {
  contactIds: string[];
  tags: string[];
  operation: 'add' | 'remove';
  removeAllTags?: boolean;
}

export interface MCPBulkUpdateContactBusinessParams {
  contactIds: string[];
  businessId?: string; // null to remove from business
}

// MCP Tool Parameters - Followers Management
export interface MCPAddContactFollowersParams {
  contactId: string;
  followers: string[];
}

export interface MCPRemoveContactFollowersParams {
  contactId: string;
  followers: string[];
}

// MCP Tool Parameters - Campaign Management
export interface MCPAddContactToCampaignParams {
  contactId: string;
  campaignId: string;
}

export interface MCPRemoveContactFromCampaignParams {
  contactId: string;
  campaignId: string;
}

export interface MCPRemoveContactFromAllCampaignsParams {
  contactId: string;
}

// MCP Tool Parameters - Workflow Management
export interface MCPAddContactToWorkflowParams {
  contactId: string;
  workflowId: string;
  eventStartTime?: string;
}

export interface MCPRemoveContactFromWorkflowParams {
  contactId: string;
  workflowId: string;
  eventStartTime?: string;
}

// MCP Tool Parameters - Conversation Operations
export interface MCPSendSMSParams {
  contactId: string;
  message: string;
  fromNumber?: string;
}

export interface MCPSendEmailParams {
  contactId: string;
  subject: string;
  message?: string;
  html?: string;
  emailFrom?: string;
  attachments?: string[];
  emailCc?: string[];
  emailBcc?: string[];
}

export interface MCPSearchConversationsParams {
  contactId?: string;
  query?: string;
  status?: 'all' | 'read' | 'unread' | 'starred';
  limit?: number;
  assignedTo?: string;
}

export interface MCPGetConversationParams {
  conversationId: string;
  limit?: number;
  messageTypes?: string[];
}

export interface MCPCreateConversationParams {
  contactId: string;
}

export interface MCPUpdateConversationParams {
  conversationId: string;
  starred?: boolean;
  unreadCount?: number;
}

// BLOG INTERFACES - Based on Blogs API v2021-07-28

// Blog Post Status Enum
export type GHLBlogPostStatus = 'DRAFT' | 'PUBLISHED' | 'SCHEDULED' | 'ARCHIVED';

// Blog Post Response Interface
export interface GHLBlogPost {
  _id: string;
  title: string;
  description: string;
  imageUrl: string;
  imageAltText: string;
  urlSlug: string;
  canonicalLink?: string;
  author: string; // Author ID
  publishedAt: string;
  updatedAt: string;
  status: GHLBlogPostStatus;
  categories: string[]; // Array of category IDs
  tags?: string[];
  archived: boolean;
  rawHTML?: string; // Full HTML content
}

// Create Blog Post Parameters
export interface GHLCreateBlogPostRequest {
  title: string;
  locationId: string;
  blogId: string;
  imageUrl: string;
  description: string;
  rawHTML: string;
  status: GHLBlogPostStatus;
  imageAltText: string;
  categories: string[]; // Array of category IDs
  tags?: string[];
  author: string; // Author ID
  urlSlug: string;
  canonicalLink?: string;
  publishedAt: string; // ISO timestamp
}

// Update Blog Post Parameters
export interface GHLUpdateBlogPostRequest {
  title?: string;
  locationId: string;
  blogId: string;
  imageUrl?: string;
  description?: string;
  rawHTML?: string;
  status?: GHLBlogPostStatus;
  imageAltText?: string;
  categories?: string[];
  tags?: string[];
  author?: string;
  urlSlug?: string;
  canonicalLink?: string;
  publishedAt?: string;
}

// Blog Post Create Response
export interface GHLBlogPostCreateResponse {
  data: GHLBlogPost;
}

// Blog Post Update Response
export interface GHLBlogPostUpdateResponse {
  updatedBlogPost: GHLBlogPost;
}

// Blog Post List Response
export interface GHLBlogPostListResponse {
  blogs: GHLBlogPost[];
}

// Blog Author Interface
export interface GHLBlogAuthor {
  _id: string;
  name: string;
  locationId: string;
  updatedAt: string;
  canonicalLink: string;
}

// Authors List Response
export interface GHLBlogAuthorsResponse {
  authors: GHLBlogAuthor[];
}

// Blog Category Interface
export interface GHLBlogCategory {
  _id: string;
  label: string;
  locationId: string;
  updatedAt: string;
  canonicalLink: string;
  urlSlug: string;
}

// Categories List Response
export interface GHLBlogCategoriesResponse {
  categories: GHLBlogCategory[];
}

// Blog Site Interface
export interface GHLBlogSite {
  _id: string;
  name: string;
}

// Blog Sites List Response
export interface GHLBlogSitesResponse {
  data: GHLBlogSite[];
}

// URL Slug Check Response
export interface GHLUrlSlugCheckResponse {
  exists: boolean;
}

// Blog Post Search/List Parameters
export interface GHLGetBlogPostsRequest {
  locationId: string;
  blogId: string;
  limit: number;
  offset: number;
  searchTerm?: string;
  status?: GHLBlogPostStatus;
}

// Blog Authors Request Parameters
export interface GHLGetBlogAuthorsRequest {
  locationId: string;
  limit: number;
  offset: number;
}

// Blog Categories Request Parameters  
export interface GHLGetBlogCategoriesRequest {
  locationId: string;
  limit: number;
  offset: number;
}

// Blog Sites Request Parameters
export interface GHLGetBlogSitesRequest {
  locationId: string;
  skip: number;
  limit: number;
  searchTerm?: string;
}

// URL Slug Check Parameters
export interface GHLCheckUrlSlugRequest {
  locationId: string;
  urlSlug: string;
  postId?: string;
}

// MCP Tool Parameters - Blog Operations
export interface MCPCreateBlogPostParams {
  title: string;
  blogId: string;
  content: string; // Raw HTML content
  description: string;
  imageUrl: string;
  imageAltText: string;
  urlSlug: string;
  author: string; // Author ID
  categories: string[]; // Array of category IDs
  tags?: string[];
  status?: GHLBlogPostStatus;
  canonicalLink?: string;
  publishedAt?: string; // ISO timestamp, defaults to now if not provided
}

export interface MCPUpdateBlogPostParams {
  postId: string;
  blogId: string;
  title?: string;
  content?: string;
  description?: string;
  imageUrl?: string;
  imageAltText?: string;
  urlSlug?: string;
  author?: string;
  categories?: string[];
  tags?: string[];
  status?: GHLBlogPostStatus;
  canonicalLink?: string;
  publishedAt?: string;
}

export interface MCPGetBlogPostsParams {
  blogId: string;
  limit?: number;
  offset?: number;
  searchTerm?: string;
  status?: GHLBlogPostStatus;
}

export interface MCPGetBlogSitesParams {
  skip?: number;
  limit?: number;
  searchTerm?: string;
}

export interface MCPGetBlogAuthorsParams {
  limit?: number;
  offset?: number;
}

export interface MCPGetBlogCategoriesParams {
  limit?: number;
  offset?: number;
}

export interface MCPCheckUrlSlugParams {
  urlSlug: string;
  postId?: string;
}

// OPPORTUNITIES API INTERFACES - Based on Opportunities API v2021-07-28

// Opportunity Status Enum
export type GHLOpportunityStatus = 'open' | 'won' | 'lost' | 'abandoned' | 'all';

// Opportunity Contact Response Interface
export interface GHLOpportunityContact {
  id: string;
  name: string;
  companyName?: string;
  email?: string;
  phone?: string;
  tags?: string[];
}

// Custom Field Response Interface
export interface GHLCustomFieldResponse {
  id: string;
  fieldValue: string | object | string[] | object[];
}

// Opportunity Response Interface
export interface GHLOpportunity {
  id: string;
  name: string;
  monetaryValue?: number;
  pipelineId: string;
  pipelineStageId: string;
  assignedTo?: string;
  status: GHLOpportunityStatus;
  source?: string;
  lastStatusChangeAt?: string;
  lastStageChangeAt?: string;
  lastActionDate?: string;
  indexVersion?: number;
  createdAt: string;
  updatedAt: string;
  contactId: string;
  locationId: string;
  contact?: GHLOpportunityContact;
  notes?: string[];
  tasks?: string[];
  calendarEvents?: string[];
  customFields?: GHLCustomFieldResponse[];
  followers?: string[][];
}

// Search Meta Response Interface
export interface GHLOpportunitySearchMeta {
  total: number;
  nextPageUrl?: string;
  startAfterId?: string;
  startAfter?: number;
  currentPage?: number;
  nextPage?: number;
  prevPage?: number;
}

// Search Opportunities Response
export interface GHLSearchOpportunitiesResponse {
  opportunities: GHLOpportunity[];
  meta: GHLOpportunitySearchMeta;
  aggregations?: object;
}

// Pipeline Stage Interface
export interface GHLPipelineStage {
  id: string;
  name: string;
  position: number;
}

// Pipeline Interface
export interface GHLPipeline {
  id: string;
  name: string;
  stages: GHLPipelineStage[];
  showInFunnel: boolean;
  showInPieChart: boolean;
  locationId: string;
}

// Get Pipelines Response
export interface GHLGetPipelinesResponse {
  pipelines: GHLPipeline[];
}

// Search Opportunities Request
export interface GHLSearchOpportunitiesRequest {
  q?: string; // query string
  /** v3 (camelCase). v2 used location_id. Either is accepted; locationId is required in v3. */
  locationId?: string;
  /** v2 (snake_case) alias. */
  location_id?: string;
  /** v3 (camelCase). */
  pipelineId?: string;
  /** v2 (snake_case) alias. */
  pipeline_id?: string;
  /** v3 (camelCase). */
  pipelineStageId?: string;
  /** v2 (snake_case) alias. */
  pipeline_stage_id?: string;
  /** v3 (camelCase). */
  contactId?: string;
  /** v2 (snake_case) alias. */
  contact_id?: string;
  status?: GHLOpportunityStatus;
  /** v3 (camelCase). */
  assignedTo?: string;
  /** v2 (snake_case) alias. */
  assigned_to?: string;
  campaignId?: string;
  id?: string;
  order?: string;
  endDate?: string; // mm-dd-yyyy format
  startAfter?: string;
  startAfterId?: string;
  date?: string; // mm-dd-yyyy format
  country?: string;
  page?: number;
  limit?: number;
  getTasks?: boolean;
  getNotes?: boolean;
  getCalendarEvents?: boolean;
}

// Create Opportunity Request
export interface GHLCreateOpportunityRequest {
  pipelineId: string;
  locationId: string;
  name: string;
  pipelineStageId?: string;
  status: GHLOpportunityStatus;
  contactId: string;
  monetaryValue?: number;
  assignedTo?: string;
  customFields?: GHLCustomFieldInput[];
}

// Update Opportunity Request
export interface GHLUpdateOpportunityRequest {
  pipelineId?: string;
  name?: string;
  pipelineStageId?: string;
  status?: GHLOpportunityStatus;
  monetaryValue?: number;
  assignedTo?: string;
  customFields?: GHLCustomFieldInput[];
}

// Update Opportunity Status Request
export interface GHLUpdateOpportunityStatusRequest {
  status: GHLOpportunityStatus;
}

// Upsert Opportunity Request
export interface GHLUpsertOpportunityRequest {
  pipelineId: string;
  locationId: string;
  contactId: string;
  name?: string;
  status?: GHLOpportunityStatus;
  pipelineStageId?: string;
  monetaryValue?: number;
  assignedTo?: string;
}

// Upsert Opportunity Response
export interface GHLUpsertOpportunityResponse {
  opportunity: GHLOpportunity;
  new: boolean;
}

// Custom Field Input Interfaces (reuse existing ones)
export interface GHLCustomFieldInput {
  id?: string;
  key?: string;
  field_value: string | string[] | object;
}

// MCP Tool Parameters - Opportunity Operations
export interface MCPSearchOpportunitiesParams {
  query?: string;
  pipelineId?: string;
  pipelineStageId?: string;
  contactId?: string;
  status?: GHLOpportunityStatus;
  assignedTo?: string;
  campaignId?: string;
  country?: string;
  startDate?: string; // mm-dd-yyyy
  endDate?: string; // mm-dd-yyyy
  limit?: number;
  page?: number;
  includeTasks?: boolean;
  includeNotes?: boolean;
  includeCalendarEvents?: boolean;
}

export interface MCPCreateOpportunityParams {
  name: string;
  pipelineId: string;
  contactId: string;
  status?: GHLOpportunityStatus;
  pipelineStageId?: string;
  monetaryValue?: number;
  assignedTo?: string;
  customFields?: GHLCustomFieldInput[];
}

export interface MCPUpdateOpportunityParams {
  opportunityId: string;
  name?: string;
  pipelineId?: string;
  pipelineStageId?: string;
  status?: GHLOpportunityStatus;
  monetaryValue?: number;
  assignedTo?: string;
  customFields?: GHLCustomFieldInput[];
}

export interface MCPUpsertOpportunityParams {
  pipelineId: string;
  contactId: string;
  name?: string;
  status?: GHLOpportunityStatus;
  pipelineStageId?: string;
  monetaryValue?: number;
  assignedTo?: string;
}

export interface MCPAddOpportunityFollowersParams {
  opportunityId: string;
  followers: string[];
}

export interface MCPRemoveOpportunityFollowersParams {
  opportunityId: string;
  followers: string[];
}

// CALENDAR & APPOINTMENTS API INTERFACES - Based on Calendar API v2021-04-15

// Calendar Group Interfaces
export interface GHLCalendarGroup {
  id: string;
  locationId: string;
  name: string;
  description: string;
  slug: string;
  isActive: boolean;
}

export interface GHLGetCalendarGroupsResponse {
  groups: GHLCalendarGroup[];
}

export interface GHLCreateCalendarGroupRequest {
  locationId: string;
  name: string;
  description: string;
  slug: string;
  isActive?: boolean;
}

// Meeting Location Configuration
export interface GHLLocationConfiguration {
  kind: 'custom' | 'zoom_conference' | 'google_conference' | 'inbound_call' | 'outbound_call' | 'physical' | 'booker' | 'ms_teams_conference';
  location?: string;
  meetingId?: string;
}

// Team Member Configuration
export interface GHLTeamMember {
  userId: string;
  priority?: number; // 0, 0.5, 1
  isPrimary?: boolean;
  locationConfigurations?: GHLLocationConfiguration[];
}

// Calendar Hour Configuration
export interface GHLHour {
  openHour: number;
  openMinute: number;
  closeHour: number;
  closeMinute: number;
}

export interface GHLOpenHour {
  daysOfTheWeek: number[]; // 0-6
  hours: GHLHour[];
}

// Calendar Availability
export interface GHLAvailability {
  date: string; // YYYY-MM-DDTHH:mm:ss.sssZ format
  hours: GHLHour[];
  deleted?: boolean;
  id?: string;
}

// Calendar Interfaces
export interface GHLCalendar {
  id: string;
  locationId: string;
  groupId?: string;
  name: string;
  description?: string;
  slug?: string;
  widgetSlug?: string;
  calendarType: 'round_robin' | 'event' | 'class_booking' | 'collective' | 'service_booking' | 'personal';
  widgetType?: 'default' | 'classic';
  eventTitle?: string;
  eventColor?: string;
  isActive?: boolean;
  teamMembers?: GHLTeamMember[];
  locationConfigurations?: GHLLocationConfiguration[];
  slotDuration?: number;
  slotDurationUnit?: 'mins' | 'hours';
  slotInterval?: number;
  slotIntervalUnit?: 'mins' | 'hours';
  slotBuffer?: number;
  slotBufferUnit?: 'mins' | 'hours';
  preBuffer?: number;
  preBufferUnit?: 'mins' | 'hours';
  appoinmentPerSlot?: number;
  appoinmentPerDay?: number;
  allowBookingAfter?: number;
  allowBookingAfterUnit?: 'hours' | 'days' | 'weeks' | 'months';
  allowBookingFor?: number;
  allowBookingForUnit?: 'days' | 'weeks' | 'months';
  openHours?: GHLOpenHour[];
  availabilities?: GHLAvailability[];
  autoConfirm?: boolean;
  allowReschedule?: boolean;
  allowCancellation?: boolean;
  formId?: string;
  notes?: string;
}

export interface GHLGetCalendarsResponse {
  calendars: GHLCalendar[];
}

export interface GHLCreateCalendarRequest {
  locationId: string;
  groupId?: string;
  name: string;
  description?: string;
  slug?: string;
  calendarType: 'round_robin' | 'event' | 'class_booking' | 'collective' | 'service_booking' | 'personal';
  teamMembers?: GHLTeamMember[];
  locationConfigurations?: GHLLocationConfiguration[];
  slotDuration?: number;
  slotDurationUnit?: 'mins' | 'hours';
  autoConfirm?: boolean;
  allowReschedule?: boolean;
  allowCancellation?: boolean;
  openHours?: GHLOpenHour[];
  isActive?: boolean;
}

export interface GHLUpdateCalendarRequest {
  name?: string;
  description?: string;
  groupId?: string;
  teamMembers?: GHLTeamMember[];
  locationConfigurations?: GHLLocationConfiguration[];
  slotDuration?: number;
  slotDurationUnit?: 'mins' | 'hours';
  autoConfirm?: boolean;
  allowReschedule?: boolean;
  allowCancellation?: boolean;
  openHours?: GHLOpenHour[];
  availabilities?: GHLAvailability[];
  isActive?: boolean;
}

// Calendar Event/Appointment Interfaces
export interface GHLCalendarEvent {
  id: string;
  title: string;
  calendarId: string;
  locationId: string;
  contactId: string;
  groupId?: string;
  appointmentStatus: 'new' | 'confirmed' | 'cancelled' | 'showed' | 'noshow' | 'invalid';
  assignedUserId: string;
  users?: string[];
  address?: string;
  notes?: string;
  startTime: string;
  endTime: string;
  dateAdded: string;
  dateUpdated: string;
  isRecurring?: boolean;
  rrule?: string;
  masterEventId?: string;
  assignedResources?: string[];
}

export interface GHLGetCalendarEventsResponse {
  events: GHLCalendarEvent[];
}

export interface GHLGetCalendarEventsRequest {
  locationId: string;
  userId?: string;
  calendarId?: string;
  groupId?: string;
  startTime: string; // milliseconds
  endTime: string; // milliseconds
}

// Free Slots Interface
export interface GHLFreeSlot {
  slots: string[];
}

export interface GHLGetFreeSlotsResponse {
  [date: string]: GHLFreeSlot; // Date as key
}

export interface GHLGetFreeSlotsRequest {
  calendarId: string;
  startDate: number; // milliseconds
  endDate: number; // milliseconds
  timezone?: string;
  userId?: string;
  userIds?: string[];
  enableLookBusy?: boolean;
}

// Appointment Management
export interface GHLCreateAppointmentRequest {
  calendarId: string;
  locationId: string;
  contactId: string;
  startTime: string; // ISO format
  endTime?: string; // ISO format
  title?: string;
  appointmentStatus?: 'new' | 'confirmed' | 'cancelled' | 'showed' | 'noshow' | 'invalid';
  assignedUserId?: string;
  address?: string;
  meetingLocationType?: 'custom' | 'zoom' | 'gmeet' | 'phone' | 'address' | 'ms_teams' | 'google';
  meetingLocationId?: string;
  ignoreDateRange?: boolean;
  toNotify?: boolean;
  ignoreFreeSlotValidation?: boolean;
  rrule?: string; // Recurring rule
}

export interface GHLUpdateAppointmentRequest {
  title?: string;
  appointmentStatus?: 'new' | 'confirmed' | 'cancelled' | 'showed' | 'noshow' | 'invalid';
  assignedUserId?: string;
  address?: string;
  startTime?: string;
  endTime?: string;
  meetingLocationType?: 'custom' | 'zoom' | 'gmeet' | 'phone' | 'address' | 'ms_teams' | 'google';
  toNotify?: boolean;
  ignoreFreeSlotValidation?: boolean;
}

// Block Slot Management
export interface GHLCreateBlockSlotRequest {
  calendarId?: string;
  locationId: string;
  startTime: string;
  endTime: string;
  title?: string;
  assignedUserId?: string;
}

export interface GHLUpdateBlockSlotRequest {
  calendarId?: string;
  startTime?: string;
  endTime?: string;
  title?: string;
  assignedUserId?: string;
}

export interface GHLBlockSlotResponse {
  id: string;
  locationId: string;
  title: string;
  startTime: string;
  endTime: string;
  calendarId?: string;
  assignedUserId?: string;
}

// MCP Tool Parameters
export interface MCPGetCalendarsParams {
  groupId?: string;
  showDrafted?: boolean;
}

export interface MCPCreateCalendarParams {
  name: string;
  description?: string;
  calendarType: 'round_robin' | 'event' | 'class_booking' | 'collective' | 'service_booking' | 'personal';
  groupId?: string;
  teamMembers?: GHLTeamMember[];
  slotDuration?: number;
  slotDurationUnit?: 'mins' | 'hours';
  autoConfirm?: boolean;
  allowReschedule?: boolean;
  allowCancellation?: boolean;
  isActive?: boolean;
}

export interface MCPUpdateCalendarParams {
  calendarId: string;
  name?: string;
  description?: string;
  groupId?: string;
  teamMembers?: GHLTeamMember[];
  slotDuration?: number;
  autoConfirm?: boolean;
  allowReschedule?: boolean;
  allowCancellation?: boolean;
  isActive?: boolean;
}

export interface MCPGetCalendarEventsParams {
  userId?: string;
  calendarId?: string;
  groupId?: string;
  startTime: string; // milliseconds or ISO date
  endTime: string; // milliseconds or ISO date
}

export interface MCPGetFreeSlotsParams {
  calendarId: string;
  startDate: string; // YYYY-MM-DD or milliseconds
  endDate: string; // YYYY-MM-DD or milliseconds
  timezone?: string;
  userId?: string;
}

export interface MCPCreateAppointmentParams {
  calendarId: string;
  contactId: string;
  startTime: string; // ISO format
  endTime?: string; // ISO format
  title?: string;
  appointmentStatus?: 'new' | 'confirmed';
  assignedUserId?: string;
  address?: string;
  meetingLocationType?: 'custom' | 'zoom' | 'gmeet' | 'phone' | 'address';
  ignoreDateRange?: boolean;
  toNotify?: boolean;
}

export interface MCPUpdateAppointmentParams {
  appointmentId: string;
  title?: string;
  appointmentStatus?: 'new' | 'confirmed' | 'cancelled' | 'showed' | 'noshow';
  assignedUserId?: string;
  address?: string;
  startTime?: string;
  endTime?: string;
  toNotify?: boolean;
}

export interface MCPCreateBlockSlotParams {
  calendarId?: string;
  startTime: string;
  endTime: string;
  title?: string;
  assignedUserId?: string;
}

export interface MCPUpdateBlockSlotParams {
  blockSlotId: string;
  calendarId?: string;
  startTime?: string;
  endTime?: string;
  title?: string;
  assignedUserId?: string;
}

// EMAIL API INTERFACES

export interface GHLEmailCampaign {
  id: string;
  name: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface GHLEmailCampaignsResponse {
  schedules: GHLEmailCampaign[];
  total: number;
}

export interface GHLEmailTemplate {
  id: string;
  name: string;
  templateType: string;
  lastUpdated: string;
  dateAdded: string;
  previewUrl: string;
}

// MCP Tool Parameters - Email Operations
export interface MCPGetEmailCampaignsParams {
  status?: 'active' | 'pause' | 'complete' | 'cancelled' | 'retry' | 'draft' | 'resend-scheduled';
  limit?: number;
  offset?: number;
}

export interface MCPCreateEmailTemplateParams {
  title: string;
  html: string;
  isPlainText?: boolean;
}

export interface MCPGetEmailTemplatesParams {
  limit?: number;
  offset?: number;
}

export interface MCPUpdateEmailTemplateParams {
  templateId: string;
  html: string;
  previewText?: string;
}

export interface MCPDeleteEmailTemplateParams {
  templateId: string;
}

// LOCATION API INTERFACES - Based on Locations API v2021-07-28

// Location Settings Schema
export interface GHLLocationSettings {
  allowDuplicateContact?: boolean;
  allowDuplicateOpportunity?: boolean;
  allowFacebookNameMerge?: boolean;
  disableContactTimezone?: boolean;
}

// Location Social Schema
export interface GHLLocationSocial {
  facebookUrl?: string;
  googlePlus?: string;
  linkedIn?: string;
  foursquare?: string;
  twitter?: string;
  yelp?: string;
  instagram?: string;
  youtube?: string;
  pinterest?: string;
  blogRss?: string;
  googlePlacesId?: string;
}

// Location Business Schema
export interface GHLLocationBusiness {
  name?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  website?: string;
  timezone?: string;
  logoUrl?: string;
}

// Location Prospect Info
export interface GHLLocationProspectInfo {
  firstName: string;
  lastName: string;
  email: string;
}

// Twilio Configuration
export interface GHLLocationTwilio {
  sid: string;
  authToken: string;
}

// Mailgun Configuration
export interface GHLLocationMailgun {
  apiKey: string;
  domain: string;
}

// Snapshot Configuration
export interface GHLLocationSnapshot {
  id: string;
  override?: boolean;
}

// Basic Location Schema
export interface GHLLocation {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  website?: string;
  timezone?: string;
  settings?: GHLLocationSettings;
  social?: GHLLocationSocial;
}

// Detailed Location Schema
export interface GHLLocationDetailed {
  id: string;
  companyId: string;
  name: string;
  domain?: string;
  address?: string;
  city?: string;
  state?: string;
  logoUrl?: string;
  country?: string;
  postalCode?: string;
  website?: string;
  timezone?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  business?: GHLLocationBusiness;
  social?: GHLLocationSocial;
  settings?: GHLLocationSettings;
  reseller?: object;
}

// Location Search Response
export interface GHLLocationSearchResponse {
  locations: GHLLocation[];
}

// Location Details Response
export interface GHLLocationDetailsResponse {
  location: GHLLocationDetailed;
}

// Create Location Request
export interface GHLCreateLocationRequest {
  name: string;
  companyId: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  website?: string;
  timezone?: string;
  prospectInfo?: GHLLocationProspectInfo;
  settings?: GHLLocationSettings;
  social?: GHLLocationSocial;
  twilio?: GHLLocationTwilio;
  mailgun?: GHLLocationMailgun;
  snapshotId?: string;
}

// Update Location Request
export interface GHLUpdateLocationRequest {
  name?: string;
  companyId: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  website?: string;
  timezone?: string;
  prospectInfo?: GHLLocationProspectInfo;
  settings?: GHLLocationSettings;
  social?: GHLLocationSocial;
  twilio?: GHLLocationTwilio;
  mailgun?: GHLLocationMailgun;
  snapshot?: GHLLocationSnapshot;
}

// Location Delete Response
export interface GHLLocationDeleteResponse {
  success: boolean;
  message: string;
}

// LOCATION TAGS INTERFACES

// Location Tag Schema
export interface GHLLocationTag {
  id: string;
  name: string;
  locationId: string;
}

// Location Tags Response
export interface GHLLocationTagsResponse {
  tags: GHLLocationTag[];
}

// Location Tag Response
export interface GHLLocationTagResponse {
  tag: GHLLocationTag;
}

// Tag Create/Update Request
export interface GHLLocationTagRequest {
  name: string;
}

// Tag Delete Response
export interface GHLLocationTagDeleteResponse {
  succeded: boolean;
}

// LOCATION TASKS INTERFACES

// Task Search Parameters
export interface GHLLocationTaskSearchRequest {
  contactId?: string[];
  completed?: boolean;
  assignedTo?: string[];
  query?: string;
  limit?: number;
  skip?: number;
  businessId?: string;
}

// Task Search Response
export interface GHLLocationTaskSearchResponse {
  tasks: any[];
}

// CUSTOM FIELDS INTERFACES

// Text Box List Options
export interface GHLCustomFieldTextBoxOption {
  label: string;
  prefillValue?: string;
}

// Custom Field Schema
export interface GHLLocationCustomField {
  id: string;
  name: string;
  fieldKey: string;
  placeholder?: string;
  dataType: string;
  position: number;
  picklistOptions?: string[];
  picklistImageOptions?: string[];
  isAllowedCustomOption?: boolean;
  isMultiFileAllowed?: boolean;
  maxFileLimit?: number;
  locationId: string;
  model: 'contact' | 'opportunity';
}

// Custom Fields List Response
export interface GHLLocationCustomFieldsResponse {
  customFields: GHLLocationCustomField[];
}

// Custom Field Response
export interface GHLLocationCustomFieldResponse {
  customField: GHLLocationCustomField;
}

// Create Custom Field Request
export interface GHLCreateCustomFieldRequest {
  name: string;
  dataType: string;
  placeholder?: string;
  acceptedFormat?: string[];
  isMultipleFile?: boolean;
  maxNumberOfFiles?: number;
  textBoxListOptions?: GHLCustomFieldTextBoxOption[];
  position?: number;
  model?: 'contact' | 'opportunity';
}

// Update Custom Field Request
export interface GHLUpdateCustomFieldRequest {
  name: string;
  placeholder?: string;
  acceptedFormat?: string[];
  isMultipleFile?: boolean;
  maxNumberOfFiles?: number;
  textBoxListOptions?: GHLCustomFieldTextBoxOption[];
  position?: number;
  model?: 'contact' | 'opportunity';
}

// Custom Field Delete Response
export interface GHLCustomFieldDeleteResponse {
  succeded: boolean;
}

// File Upload Body
export interface GHLFileUploadRequest {
  id: string;
  maxFiles?: string;
}

// File Upload Response
export interface GHLFileUploadResponse {
  uploadedFiles: { [fileName: string]: string };
  meta: any[];
}

// CUSTOM VALUES INTERFACES

// Custom Value Schema
export interface GHLLocationCustomValue {
  id: string;
  name: string;
  fieldKey: string;
  value: string;
  locationId: string;
}

// Custom Values Response
export interface GHLLocationCustomValuesResponse {
  customValues: GHLLocationCustomValue[];
}

// Custom Value Response
export interface GHLLocationCustomValueResponse {
  customValue: GHLLocationCustomValue;
}

// Custom Value Request
export interface GHLCustomValueRequest {
  name: string;
  value: string;
}

// Custom Value Delete Response
export interface GHLCustomValueDeleteResponse {
  succeded: boolean;
}

// TEMPLATES INTERFACES

// SMS Template Schema
export interface GHLSmsTemplate {
  body: string;
  attachments: any[];
}

// Email Template Schema
export interface GHLEmailTemplateContent {
  subject: string;
  attachments: any[];
  html: string;
}

// Template Response Schema (SMS)
export interface GHLSmsTemplateResponse {
  id: string;
  name: string;
  type: 'sms';
  template: GHLSmsTemplate;
  dateAdded: string;
  locationId: string;
  urlAttachments: string[];
}

// Template Response Schema (Email)
export interface GHLEmailTemplateResponse {
  id: string;
  name: string;
  type: 'email';
  dateAdded: string;
  template: GHLEmailTemplateContent;
  locationId: string;
}

// Templates List Response
export interface GHLLocationTemplatesResponse {
  templates: (GHLSmsTemplateResponse | GHLEmailTemplateResponse)[];
  totalCount: number;
}

// MCP TOOL PARAMETERS - Location Operations

export interface MCPSearchLocationsParams {
  companyId?: string;
  skip?: number;
  limit?: number;
  order?: 'asc' | 'desc';
  email?: string;
}

export interface MCPGetLocationParams {
  locationId: string;
}

export interface MCPCreateLocationParams {
  name: string;
  companyId: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  website?: string;
  timezone?: string;
  prospectInfo?: GHLLocationProspectInfo;
  settings?: GHLLocationSettings;
  social?: GHLLocationSocial;
  twilio?: GHLLocationTwilio;
  mailgun?: GHLLocationMailgun;
  snapshotId?: string;
}

export interface MCPUpdateLocationParams {
  locationId: string;
  name?: string;
  companyId: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  website?: string;
  timezone?: string;
  prospectInfo?: GHLLocationProspectInfo;
  settings?: GHLLocationSettings;
  social?: GHLLocationSocial;
  twilio?: GHLLocationTwilio;
  mailgun?: GHLLocationMailgun;
  snapshot?: GHLLocationSnapshot;
}

export interface MCPDeleteLocationParams {
  locationId: string;
  deleteTwilioAccount: boolean;
}

// Location Tags MCP Parameters
export interface MCPGetLocationTagsParams {
  locationId: string;
}

export interface MCPCreateLocationTagParams {
  locationId: string;
  name: string;
}

export interface MCPGetLocationTagParams {
  locationId: string;
  tagId: string;
}

export interface MCPUpdateLocationTagParams {
  locationId: string;
  tagId: string;
  name: string;
}

export interface MCPDeleteLocationTagParams {
  locationId: string;
  tagId: string;
}

// Location Tasks MCP Parameters
export interface MCPSearchLocationTasksParams {
  locationId: string;
  contactId?: string[];
  completed?: boolean;
  assignedTo?: string[];
  query?: string;
  limit?: number;
  skip?: number;
  businessId?: string;
}

// Custom Fields MCP Parameters
export interface MCPGetCustomFieldsParams {
  locationId: string;
  model?: 'contact' | 'opportunity' | 'all';
}

export interface MCPCreateCustomFieldParams {
  locationId: string;
  name: string;
  dataType: string;
  placeholder?: string;
  acceptedFormat?: string[];
  isMultipleFile?: boolean;
  maxNumberOfFiles?: number;
  textBoxListOptions?: GHLCustomFieldTextBoxOption[];
  position?: number;
  model?: 'contact' | 'opportunity';
}

export interface MCPGetCustomFieldParams {
  locationId: string;
  customFieldId: string;
}

export interface MCPUpdateCustomFieldParams {
  locationId: string;
  customFieldId: string;
  name: string;
  placeholder?: string;
  acceptedFormat?: string[];
  isMultipleFile?: boolean;
  maxNumberOfFiles?: number;
  textBoxListOptions?: GHLCustomFieldTextBoxOption[];
  position?: number;
  model?: 'contact' | 'opportunity';
}

export interface MCPDeleteCustomFieldParams {
  locationId: string;
  customFieldId: string;
}

export interface MCPUploadCustomFieldFileParams {
  locationId: string;
  id: string;
  maxFiles?: string;
}

// Custom Values MCP Parameters
export interface MCPGetCustomValuesParams {
  locationId: string;
}

export interface MCPCreateCustomValueParams {
  locationId: string;
  name: string;
  value: string;
}

export interface MCPGetCustomValueParams {
  locationId: string;
  customValueId: string;
}

export interface MCPUpdateCustomValueParams {
  locationId: string;
  customValueId: string;
  name: string;
  value: string;
}

export interface MCPDeleteCustomValueParams {
  locationId: string;
  customValueId: string;
}

// Templates MCP Parameters
export interface MCPGetLocationTemplatesParams {
  locationId: string;
  originId: string;
  deleted?: boolean;
  skip?: number;
  limit?: number;
  type?: 'sms' | 'email' | 'whatsapp';
}

export interface MCPDeleteLocationTemplateParams {
  locationId: string;
  templateId: string;
}

// Timezones MCP Parameters
export interface MCPGetTimezonesParams {
  locationId?: string;
}

// EMAIL ISV (VERIFICATION) API INTERFACES - Based on Email ISV API

// Email Verification Request Body
export interface GHLEmailVerificationRequest {
  type: 'email' | 'contact';
  verify: string; // email address or contact ID
}

// Lead Connector Recommendation
export interface GHLLeadConnectorRecommendation {
  isEmailValid: boolean;
}

// Email Verification Success Response
export interface GHLEmailVerifiedResponse {
  reason?: string[];
  result: 'deliverable' | 'undeliverable' | 'do_not_send' | 'unknown' | 'catch_all';
  risk: 'high' | 'low' | 'medium' | 'unknown';
  address: string;
  leadconnectorRecomendation: GHLLeadConnectorRecommendation;
}

// Email Verification Failed Response
export interface GHLEmailNotVerifiedResponse {
  verified: false;
  message: string;
  address: string;
}

// Combined Email Verification Response
export type GHLEmailVerificationResponse = GHLEmailVerifiedResponse | GHLEmailNotVerifiedResponse;

// MCP Tool Parameters - Email ISV Operations
export interface MCPVerifyEmailParams {
  locationId: string;
  type: 'email' | 'contact';
  verify: string; // email address or contact ID
}

// ADDITIONAL CONVERSATIONS API INTERFACES - Comprehensive Coverage

// Email Message Interfaces
export interface GHLEmailMessage {
  id: string;
  altId?: string;
  threadId: string;
  locationId: string;
  contactId: string;
  conversationId: string;
  dateAdded: string;
  subject?: string;
  body: string;
  direction: GHLMessageDirection;
  status: GHLMessageStatus;
  contentType: string;
  attachments?: string[];
  provider?: string;
  from: string;
  to: string[];
  cc?: string[];
  bcc?: string[];
  replyToMessageId?: string;
  source?: 'workflow' | 'bulk_actions' | 'campaign' | 'api' | 'app';
  conversationProviderId?: string;
}

// File Upload Interfaces
export interface GHLUploadFilesRequest {
  conversationId: string;
  locationId: string;
  attachmentUrls: string[];
}

export interface GHLUploadFilesResponse {
  uploadedFiles: { [fileName: string]: string };
}

export interface GHLUploadFilesError {
  status: number;
  message: string;
}

// Message Status Update Interfaces
export interface GHLUpdateMessageStatusRequest {
  status: 'delivered' | 'failed' | 'pending' | 'read';
  error?: {
    code: string;
    type: string;
    message: string;
  };
  emailMessageId?: string;
  recipients?: string[];
}

// Inbound/Outbound Message Interfaces
export interface GHLProcessInboundMessageRequest {
  type: 'SMS' | 'Email' | 'WhatsApp' | 'GMB' | 'IG' | 'FB' | 'Custom' | 'WebChat' | 'Live_Chat' | 'Call';
  attachments?: string[];
  message?: string;
  conversationId: string;
  conversationProviderId: string;
  html?: string;
  subject?: string;
  emailFrom?: string;
  emailTo?: string;
  emailCc?: string[];
  emailBcc?: string[];
  emailMessageId?: string;
  altId?: string;
  direction?: 'outbound' | 'inbound';
  date?: string;
  call?: {
    to: string;
    from: string;
    status: 'pending' | 'completed' | 'answered' | 'busy' | 'no-answer' | 'failed' | 'canceled' | 'voicemail';
  };
}

export interface GHLProcessOutboundMessageRequest {
  type: 'Call';
  attachments?: string[];
  conversationId: string;
  conversationProviderId: string;
  altId?: string;
  date?: string;
  call: {
    to: string;
    from: string;
    status: 'pending' | 'completed' | 'answered' | 'busy' | 'no-answer' | 'failed' | 'canceled' | 'voicemail';
  };
}

export interface GHLProcessMessageResponse {
  success: boolean;
  conversationId: string;
  messageId: string;
  message: string;
  contactId?: string;
  dateAdded?: string;
  emailMessageId?: string;
}

// Call Recording & Transcription Interfaces
export interface GHLMessageRecordingResponse {
  // Binary audio data response - typically audio/x-wav
  audioData: ArrayBuffer | Buffer;
  contentType: string;
  contentDisposition: string;
}

export interface GHLMessageTranscription {
  mediaChannel: number;
  sentenceIndex: number;
  startTime: number;
  endTime: number;
  transcript: string;
  confidence: number;
}

export interface GHLMessageTranscriptionResponse {
  transcriptions: GHLMessageTranscription[];
}

// Live Chat Typing Interfaces
export interface GHLLiveChatTypingRequest {
  locationId: string;
  isTyping: boolean;
  visitorId: string;
  conversationId: string;
}

export interface GHLLiveChatTypingResponse {
  success: boolean;
}

// Scheduled Message Cancellation Interfaces
export interface GHLCancelScheduledResponse {
  status: number;
  message: string;
}

// MCP Tool Parameters for new conversation endpoints

export interface MCPGetEmailMessageParams {
  emailMessageId: string;
}

export interface MCPGetMessageParams {
  messageId: string;
}

export interface MCPUploadMessageAttachmentsParams {
  conversationId: string;
  attachmentUrls: string[];
}

export interface MCPUpdateMessageStatusParams {
  messageId: string;
  status: 'delivered' | 'failed' | 'pending' | 'read';
  error?: {
    code: string;
    type: string;
    message: string;
  };
  emailMessageId?: string;
  recipients?: string[];
}

export interface MCPAddInboundMessageParams {
  type: 'SMS' | 'Email' | 'WhatsApp' | 'GMB' | 'IG' | 'FB' | 'Custom' | 'WebChat' | 'Live_Chat' | 'Call';
  conversationId: string;
  conversationProviderId: string;
  message?: string;
  attachments?: string[];
  html?: string;
  subject?: string;
  emailFrom?: string;
  emailTo?: string;
  emailCc?: string[];
  emailBcc?: string[];
  emailMessageId?: string;
  altId?: string;
  date?: string;
  call?: {
    to: string;
    from: string;
    status: 'pending' | 'completed' | 'answered' | 'busy' | 'no-answer' | 'failed' | 'canceled' | 'voicemail';
  };
}

export interface MCPAddOutboundCallParams {
  conversationId: string;
  conversationProviderId: string;
  to: string;
  from: string;
  status: 'pending' | 'completed' | 'answered' | 'busy' | 'no-answer' | 'failed' | 'canceled' | 'voicemail';
  attachments?: string[];
  altId?: string;
  date?: string;
}

export interface MCPGetMessageRecordingParams {
  messageId: string;
}

export interface MCPGetMessageTranscriptionParams {
  messageId: string;
}

export interface MCPDownloadTranscriptionParams {
  messageId: string;
}

export interface MCPCancelScheduledMessageParams {
  messageId: string;
}

export interface MCPCancelScheduledEmailParams {
  emailMessageId: string;
}

export interface MCPLiveChatTypingParams {
  visitorId: string;
  conversationId: string;
  isTyping: boolean;
}

export interface MCPDeleteConversationParams {
  conversationId: string;
}

// SOCIAL MEDIA POSTING API INTERFACES - Based on Social Media Posting API

// Platform Types
export type GHLSocialPlatform = 'google' | 'facebook' | 'instagram' | 'linkedin' | 'twitter' | 'tiktok' | 'tiktok-business';
export type GHLPostStatus = 'in_progress' | 'draft' | 'failed' | 'published' | 'scheduled' | 'in_review' | 'notification_sent' | 'deleted';
export type GHLPostType = 'post' | 'story' | 'reel';
export type GHLPostSource = 'composer' | 'csv' | 'recurring' | 'review' | 'rss';
export type GHLCSVStatus = 'pending' | 'in_progress' | 'completed' | 'failed' | 'in_review' | 'importing' | 'deleted';
export type GHLAccountType = 'page' | 'group' | 'profile' | 'location' | 'business';
export type GHLGMBEventType = 'STANDARD' | 'EVENT' | 'OFFER';
export type GHLGMBActionType = 'none' | 'order' | 'book' | 'shop' | 'learn_more' | 'call' | 'sign_up';
export type GHLTikTokPrivacyLevel = 'PUBLIC_TO_EVERYONE' | 'MUTUAL_FOLLOW_FRIENDS' | 'SELF_ONLY';

// OAuth Start Response Interface
export interface GHLOAuthStartResponse {
  success: boolean;
  statusCode: number;
  message: string;
}

// Media Interfaces
export interface GHLPostMedia {
  url: string;
  caption?: string;
  type?: string; // MIME type
  thumbnail?: string;
  defaultThumb?: string;
  id?: string;
}

export interface GHLOgTags {
  metaImage?: string;
  metaLink?: string;
}

// User Interface for Posts
export interface GHLPostUser {
  id: string;
  title?: string;
  firstName?: string;
  lastName?: string;
  profilePhoto?: string;
  phone?: string;
  email?: string;
}

// Post Approval Interface
export interface GHLPostApproval {
  approver?: string;
  requesterNote?: string;
  approverNote?: string;
  approvalStatus?: 'pending' | 'approved' | 'rejected' | 'not_required';
  approverUser?: GHLPostUser;
}

// TikTok Post Details
export interface GHLTikTokPostDetails {
  privacyLevel?: GHLTikTokPrivacyLevel;
  promoteOtherBrand?: boolean;
  enableComment?: boolean;
  enableDuet?: boolean;
  enableStitch?: boolean;
  videoDisclosure?: boolean;
  promoteYourBrand?: boolean;
}

// GMB Post Details
export interface GHLGMBPostDetails {
  gmbEventType?: GHLGMBEventType;
  title?: string;
  offerTitle?: string;
  startDate?: {
    startDate?: { year: number; month: number; day: number };
    startTime?: { hours: number; minutes: number; seconds: number };
  };
  endDate?: {
    endDate?: { year: number; month: number; day: number };
    endTime?: { hours: number; minutes: number; seconds: number };
  };
  termsConditions?: string;
  url?: string;
  couponCode?: string;
  redeemOnlineUrl?: string;
  actionType?: GHLGMBActionType;
}

// Post Interface
export interface GHLSocialPost {
  _id: string;
  source: GHLPostSource;
  locationId: string;
  platform: GHLSocialPlatform;
  displayDate?: string;
  createdAt: string;
  updatedAt: string;
  accountId?: string;
  accountIds: string[];
  error?: string;
  postId?: string;
  publishedAt?: string;
  summary: string;
  media?: GHLPostMedia[];
  status: GHLPostStatus;
  createdBy?: string;
  type: GHLPostType;
  tags?: string[];
  ogTagsDetails?: GHLOgTags;
  postApprovalDetails?: GHLPostApproval;
  tiktokPostDetails?: GHLTikTokPostDetails;
  gmbPostDetails?: GHLGMBPostDetails;
  user?: GHLPostUser;
  followUpComment?: string;
}

// Account Interface
export interface GHLSocialAccount {
  id: string;
  oauthId?: string;
  profileId?: string;
  name: string;
  platform: GHLSocialPlatform;
  type: GHLAccountType;
  expire?: string;
  isExpired?: boolean;
  meta?: any;
  avatar?: string;
  originId?: string;
  locationId?: string;
  active?: boolean;
  deleted?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

// Group Interface
export interface GHLSocialGroup {
  id: string;
  name: string;
  accountIds: string[];
}

// Category Interface
export interface GHLSocialCategory {
  _id: string;
  name: string;
  primaryColor?: string;
  secondaryColor?: string;
  locationId: string;
  createdBy?: string;
  deleted: boolean;
  createdAt?: string;
  updatedAt?: string;
}

// Tag Interface
export interface GHLSocialTag {
  _id: string;
  tag: string;
  locationId: string;
  createdBy?: string;
  deleted?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

// CSV Import Interface
export interface GHLCSVImport {
  _id: string;
  locationId: string;
  fileName: string;
  accountIds: string[];
  file: string;
  status: GHLCSVStatus;
  count: number;
  createdBy?: string;
  traceId?: string;
  originId?: string;
  approver?: string;
  createdAt: string;
}

// Request Interfaces

// Search Posts Request
export interface GHLSearchPostsRequest {
  type?: 'recent' | 'all' | 'scheduled' | 'draft' | 'failed' | 'in_review' | 'published' | 'in_progress' | 'deleted';
  accounts?: string; // Comma-separated account IDs
  skip?: string;
  limit?: string;
  fromDate: string;
  toDate: string;
  includeUsers: string;
  postType?: GHLPostType;
}

// Create/Update Post Request
export interface GHLCreatePostRequest {
  accountIds: string[];
  summary: string;
  media?: GHLPostMedia[];
  status?: GHLPostStatus;
  scheduleDate?: string;
  createdBy?: string;
  followUpComment?: string;
  ogTagsDetails?: GHLOgTags;
  type: GHLPostType;
  postApprovalDetails?: GHLPostApproval;
  scheduleTimeUpdated?: boolean;
  tags?: string[];
  categoryId?: string;
  tiktokPostDetails?: GHLTikTokPostDetails;
  gmbPostDetails?: GHLGMBPostDetails;
  userId?: string;
}

export interface GHLUpdatePostRequest extends Partial<GHLCreatePostRequest> {}

// Bulk Delete Request
export interface GHLBulkDeletePostsRequest {
  postIds: string[];
}

// CSV Upload Request
export interface GHLUploadCSVRequest {
  file: any; // File upload
}

// Set Accounts Request
export interface GHLSetAccountsRequest {
  accountIds: string[];
  filePath: string;
  rowsCount: number;
  fileName: string;
  approver?: string;
  userId?: string;
}

// CSV Finalize Request
export interface GHLCSVFinalizeRequest {
  userId?: string;
}

// Tag Search Request
export interface GHLGetTagsByIdsRequest {
  tagIds: string[];
}

// OAuth Platform Account Interfaces
export interface GHLGoogleLocation {
  name: string;
  storeCode?: string;
  title: string;
  metadata?: any;
  storefrontAddress?: any;
  relationshipData?: any;
  maxLocation?: boolean;
  isVerified?: boolean;
  isConnected?: boolean;
}

export interface GHLGoogleAccount {
  name: string;
  accountName: string;
  type: string;
  verificationState?: string;
  vettedState?: string;
}

export interface GHLFacebookPage {
  id: string;
  name: string;
  avatar?: string;
  isOwned?: boolean;
  isConnected?: boolean;
}

export interface GHLInstagramAccount {
  id: string;
  name: string;
  avatar?: string;
  pageId?: string;
  isConnected?: boolean;
}

export interface GHLLinkedInPage {
  id: string;
  name: string;
  avatar?: string;
  urn?: string;
  isConnected?: boolean;
}

export interface GHLLinkedInProfile {
  id: string;
  name: string;
  avatar?: string;
  urn?: string;
  isConnected?: boolean;
}

export interface GHLTwitterProfile {
  id: string;
  name: string;
  username?: string;
  avatar?: string;
  protected?: boolean;
  verified?: boolean;
  isConnected?: boolean;
}

export interface GHLTikTokProfile {
  id: string;
  name: string;
  username?: string;
  avatar?: string;
  verified?: boolean;
  isConnected?: boolean;
  type?: 'business' | 'profile';
}

// OAuth Attach Requests
export interface GHLAttachGMBLocationRequest {
  location: any;
  account: any;
  companyId?: string;
}

export interface GHLAttachFBAccountRequest {
  type: 'page';
  originId: string;
  name: string;
  avatar?: string;
  companyId?: string;
}

export interface GHLAttachIGAccountRequest {
  originId: string;
  name: string;
  avatar?: string;
  pageId: string;
  companyId?: string;
}

export interface GHLAttachLinkedInAccountRequest {
  type: GHLAccountType;
  originId: string;
  name: string;
  avatar?: string;
  urn?: string;
  companyId?: string;
}

export interface GHLAttachTwitterAccountRequest {
  originId: string;
  name: string;
  username?: string;
  avatar?: string;
  protected?: boolean;
  verified?: boolean;
  companyId?: string;
}

export interface GHLAttachTikTokAccountRequest {
  type: GHLAccountType;
  originId: string;
  name: string;
  avatar?: string;
  verified?: boolean;
  username?: string;
  companyId?: string;
}

// Response Interfaces
export interface GHLSearchPostsResponse {
  posts: GHLSocialPost[];
  count: number;
}

export interface GHLGetPostResponse {
  post: GHLSocialPost;
}

export interface GHLCreatePostResponse {
  post: GHLSocialPost;
}

export interface GHLBulkDeleteResponse {
  message: string;
  deletedCount: number;
}

export interface GHLGetAccountsResponse {
  accounts: GHLSocialAccount[];
  groups: GHLSocialGroup[];
}

export interface GHLUploadCSVResponse {
  filePath: string;
  rowsCount: number;
  fileName: string;
}

export interface GHLGetUploadStatusResponse {
  csvs: GHLCSVImport[];
  count: number;
}

export interface GHLGetCategoriesResponse {
  categories: GHLSocialCategory[];
  count: number;
}

export interface GHLGetCategoryResponse {
  category: GHLSocialCategory;
}

export interface GHLGetTagsResponse {
  tags: GHLSocialTag[];
  count: number;
}

export interface GHLGetTagsByIdsResponse {
  tags: GHLSocialTag[];
  count: number;
}

// OAuth Response Interfaces
export interface GHLGetGoogleLocationsResponse {
  locations: {
    location: GHLGoogleLocation;
    account: GHLGoogleAccount;
  };
}

export interface GHLGetFacebookPagesResponse {
  pages: GHLFacebookPage[];
}

export interface GHLGetInstagramAccountsResponse {
  accounts: GHLInstagramAccount[];
}

export interface GHLGetLinkedInAccountsResponse {
  pages: GHLLinkedInPage[];
  profile: GHLLinkedInProfile[];
}

export interface GHLGetTwitterAccountsResponse {
  profile: GHLTwitterProfile[];
}

export interface GHLGetTikTokAccountsResponse {
  profile: GHLTikTokProfile[];
}

// MCP Tool Parameters - Social Media Operations

export interface MCPSearchPostsParams {
  type?: 'recent' | 'all' | 'scheduled' | 'draft' | 'failed' | 'in_review' | 'published' | 'in_progress' | 'deleted';
  accounts?: string;
  skip?: number;
  limit?: number;
  fromDate: string;
  toDate: string;
  includeUsers?: boolean;
  postType?: GHLPostType;
}

export interface MCPCreatePostParams {
  accountIds: string[];
  summary: string;
  media?: GHLPostMedia[];
  status?: GHLPostStatus;
  scheduleDate?: string;
  followUpComment?: string;
  type: GHLPostType;
  tags?: string[];
  categoryId?: string;
  tiktokPostDetails?: GHLTikTokPostDetails;
  gmbPostDetails?: GHLGMBPostDetails;
  userId?: string;
}

export interface MCPGetPostParams {
  postId: string;
}

export interface MCPUpdatePostParams {
  postId: string;
  accountIds?: string[];
  summary?: string;
  media?: GHLPostMedia[];
  status?: GHLPostStatus;
  scheduleDate?: string;
  followUpComment?: string;
  type?: GHLPostType;
  tags?: string[];
  categoryId?: string;
  tiktokPostDetails?: GHLTikTokPostDetails;
  gmbPostDetails?: GHLGMBPostDetails;
  userId?: string;
}

export interface MCPDeletePostParams {
  postId: string;
}

export interface MCPBulkDeletePostsParams {
  postIds: string[];
}

export interface MCPGetAccountsParams {
  // No additional params - uses location from config
}

export interface MCPDeleteAccountParams {
  accountId: string;
  companyId?: string;
  userId?: string;
}

export interface MCPUploadCSVParams {
  file: any;
}

export interface MCPGetUploadStatusParams {
  skip?: number;
  limit?: number;
  includeUsers?: boolean;
  userId?: string;
}

export interface MCPSetAccountsParams {
  accountIds: string[];
  filePath: string;
  rowsCount: number;
  fileName: string;
  approver?: string;
  userId?: string;
}

export interface MCPGetCSVPostParams {
  csvId: string;
  skip?: number;
  limit?: number;
}

export interface MCPFinalizeCSVParams {
  csvId: string;
  userId?: string;
}

export interface MCPDeleteCSVParams {
  csvId: string;
}

export interface MCPDeleteCSVPostParams {
  csvId: string;
  postId: string;
}

export interface MCPGetCategoriesParams {
  searchText?: string;
  limit?: number;
  skip?: number;
}

export interface MCPGetCategoryParams {
  categoryId: string;
}

export interface MCPGetTagsParams {
  searchText?: string;
  limit?: number;
  skip?: number;
}

export interface MCPGetTagsByIdsParams {
  tagIds: string[];
}

// OAuth MCP Parameters
export interface MCPStartOAuthParams {
  platform: GHLSocialPlatform;
  userId: string;
  page?: string;
  reconnect?: boolean;
}

export interface MCPGetOAuthAccountsParams {
  platform: GHLSocialPlatform;
  accountId: string;
}

export interface MCPAttachOAuthAccountParams {
  platform: GHLSocialPlatform;
  accountId: string;
  attachData: any; // Platform-specific attach data
}

// ==== MISSING CALENDAR API TYPES ====

// Calendar Groups Management Types
export interface GHLValidateGroupSlugRequest {
  locationId: string;
  slug: string;
}

export interface GHLValidateGroupSlugResponse {
  available: boolean;
}

export interface GHLUpdateCalendarGroupRequest {
  name: string;
  description: string;
  slug: string;
}

export interface GHLGroupStatusUpdateRequest {
  isActive: boolean;
}

export interface GHLGroupSuccessResponse {
  success: boolean;
}

// Appointment Notes Types
export interface GHLAppointmentNote {
  id: string;
  body: string;
  userId: string;
  dateAdded: string;
  contactId: string;
  createdBy: {
    id: string;
    name: string;
  };
}

export interface GHLGetAppointmentNotesResponse {
  notes: GHLAppointmentNote[];
  hasMore: boolean;
}

export interface GHLCreateAppointmentNoteRequest {
  userId?: string;
  body: string;
}

export interface GHLUpdateAppointmentNoteRequest {
  userId?: string;
  body: string;
}

export interface GHLAppointmentNoteResponse {
  note: GHLAppointmentNote;
}

export interface GHLDeleteAppointmentNoteResponse {
  success: boolean;
}

// Calendar Resources Types
export interface GHLCalendarResource {
  id: string;
  locationId: string;
  name: string;
  resourceType: 'equipments' | 'rooms';
  isActive: boolean;
  description?: string;
  quantity?: number;
  outOfService?: number;
  capacity?: number;
  calendarIds: string[];
}

export interface GHLCreateCalendarResourceRequest {
  locationId: string;
  name: string;
  description: string;
  quantity: number;
  outOfService: number;
  capacity: number;
  calendarIds: string[];
}

export interface GHLUpdateCalendarResourceRequest {
  locationId?: string;
  name?: string;
  description?: string;
  quantity?: number;
  outOfService?: number;
  capacity?: number;
  calendarIds?: string[];
  isActive?: boolean;
}

export interface GHLCalendarResourceResponse {
  locationId: string;
  name: string;
  resourceType: 'equipments' | 'rooms';
  isActive: boolean;
  description?: string;
  quantity?: number;
  outOfService?: number;
  capacity?: number;
}

export interface GHLCalendarResourceByIdResponse {
  locationId: string;
  name: string;
  resourceType: 'equipments' | 'rooms';
  isActive: boolean;
  description?: string;
  quantity?: number;
  outOfService?: number;
  capacity?: number;
  calendarIds: string[];
}

export interface GHLResourceDeleteResponse {
  success: boolean;
}

export interface GHLGetCalendarResourcesRequest {
  locationId: string;
  limit: number;
  skip: number;
}

// Calendar Notifications Types
export interface GHLScheduleDTO {
  timeOffset: number;
  unit: string;
}

export interface GHLCalendarNotification {
  _id: string;
  altType: 'calendar';
  calendarId: string;
  receiverType: 'contact' | 'guest' | 'assignedUser' | 'emails';
  additionalEmailIds?: string[];
  channel: 'email' | 'inApp';
  notificationType: 'booked' | 'confirmation' | 'cancellation' | 'reminder' | 'followup' | 'reschedule';
  isActive: boolean;
  templateId?: string;
  body?: string;
  subject?: string;
  afterTime?: GHLScheduleDTO[];
  beforeTime?: GHLScheduleDTO[];
  selectedUsers?: string[];
  deleted: boolean;
}

export interface GHLCreateCalendarNotificationRequest {
  receiverType: 'contact' | 'guest' | 'assignedUser' | 'emails';
  channel: 'email' | 'inApp';
  notificationType: 'booked' | 'confirmation' | 'cancellation' | 'reminder' | 'followup' | 'reschedule';
  isActive?: boolean;
  templateId?: string;
  body?: string;
  subject?: string;
  afterTime?: GHLScheduleDTO[];
  beforeTime?: GHLScheduleDTO[];
  additionalEmailIds?: string[];
  selectedUsers?: string[];
  fromAddress?: string;
  fromName?: string;
}

export interface GHLUpdateCalendarNotificationRequest {
  altType?: 'calendar';
  altId?: string;
  receiverType?: 'contact' | 'guest' | 'assignedUser' | 'emails';
  additionalEmailIds?: string[];
  channel?: 'email' | 'inApp';
  notificationType?: 'booked' | 'confirmation' | 'cancellation' | 'reminder' | 'followup' | 'reschedule';
  isActive?: boolean;
  deleted?: boolean;
  templateId?: string;
  body?: string;
  subject?: string;
  afterTime?: GHLScheduleDTO[];
  beforeTime?: GHLScheduleDTO[];
  fromAddress?: string;
  fromName?: string;
}

export interface GHLCalendarNotificationDeleteResponse {
  message: string;
}

export interface GHLGetCalendarNotificationsRequest {
  altType?: 'calendar';
  altId?: string;
  isActive?: boolean;
  deleted?: boolean;
  limit?: number;
  skip?: number;
}

// Blocked Slots Types
export interface GHLGetBlockedSlotsRequest {
  locationId: string;
  userId?: string;
  calendarId?: string;
  groupId?: string;
  startTime: string;
  endTime: string;
}

// MCP Parameters for Missing Calendar Endpoints

// Calendar Groups Management Parameters
export interface MCPCreateCalendarGroupParams {
  name: string;
  description: string;
  slug: string;
  isActive?: boolean;
}

export interface MCPValidateGroupSlugParams {
  slug: string;
  locationId?: string;
}

export interface MCPUpdateCalendarGroupParams {
  groupId: string;
  name: string;
  description: string;
  slug: string;
}

export interface MCPDeleteCalendarGroupParams {
  groupId: string;
}

export interface MCPDisableCalendarGroupParams {
  groupId: string;
  isActive: boolean;
}

// Appointment Notes Parameters
export interface MCPGetAppointmentNotesParams {
  appointmentId: string;
  limit: number;
  offset: number;
}

export interface MCPCreateAppointmentNoteParams {
  appointmentId: string;
  body: string;
  userId?: string;
}

export interface MCPUpdateAppointmentNoteParams {
  appointmentId: string;
  noteId: string;
  body: string;
  userId?: string;
}

export interface MCPDeleteAppointmentNoteParams {
  appointmentId: string;
  noteId: string;
}

// Calendar Resources Parameters
export interface MCPGetCalendarResourcesParams {
  resourceType: 'equipments' | 'rooms';
  limit: number;
  skip: number;
  locationId?: string;
}

export interface MCPCreateCalendarResourceParams {
  resourceType: 'equipments' | 'rooms';
  name: string;
  description: string;
  quantity: number;
  outOfService: number;
  capacity: number;
  calendarIds: string[];
  locationId?: string;
}

export interface MCPGetCalendarResourceParams {
  resourceType: 'equipments' | 'rooms';
  resourceId: string;
}

export interface MCPUpdateCalendarResourceParams {
  resourceType: 'equipments' | 'rooms';
  resourceId: string;
  name?: string;
  description?: string;
  quantity?: number;
  outOfService?: number;
  capacity?: number;
  calendarIds?: string[];
  isActive?: boolean;
}

export interface MCPDeleteCalendarResourceParams {
  resourceType: 'equipments' | 'rooms';
  resourceId: string;
}

// Calendar Notifications Parameters
export interface MCPGetCalendarNotificationsParams {
  calendarId: string;
  altType?: 'calendar';
  altId?: string;
  isActive?: boolean;
  deleted?: boolean;
  limit?: number;
  skip?: number;
}

export interface MCPCreateCalendarNotificationParams {
  calendarId: string;
  notifications: GHLCreateCalendarNotificationRequest[];
}

export interface MCPGetCalendarNotificationParams {
  calendarId: string;
  notificationId: string;
}

export interface MCPUpdateCalendarNotificationParams {
  calendarId: string;
  notificationId: string;
  receiverType?: 'contact' | 'guest' | 'assignedUser' | 'emails';
  additionalEmailIds?: string[];
  channel?: 'email' | 'inApp';
  notificationType?: 'booked' | 'confirmation' | 'cancellation' | 'reminder' | 'followup' | 'reschedule';
  isActive?: boolean;
  deleted?: boolean;
  templateId?: string;
  body?: string;
  subject?: string;
  afterTime?: GHLScheduleDTO[];
  beforeTime?: GHLScheduleDTO[];
  fromAddress?: string;
  fromName?: string;
}

export interface MCPDeleteCalendarNotificationParams {
  calendarId: string;
  notificationId: string;
}

// Blocked Slots Parameters
export interface MCPGetBlockedSlotsParams {
  userId?: string;
  calendarId?: string;
  groupId?: string;
  startTime: string;
  endTime: string;
}

// ==== MEDIA LIBRARY API TYPES ====

// Media File Types
export interface GHLMediaFile {
  id?: string;
  altId: string;
  altType: 'location' | 'agency';
  name: string;
  parentId?: string;
  url: string;
  path: string;
  type?: 'file' | 'folder';
  size?: number;
  mimeType?: string;
  createdAt?: string;
  updatedAt?: string;
}

// API Request/Response Types
export interface GHLGetMediaFilesRequest {
  offset?: number;
  limit?: number;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  type?: 'file' | 'folder';
  query?: string;
  altType: 'location' | 'agency';
  altId: string;
  parentId?: string;
}

export interface GHLGetMediaFilesResponse {
  files: GHLMediaFile[];
  total?: number;
  hasMore?: boolean;
}

export interface GHLUploadMediaFileRequest {
  file?: any; // Binary file data
  hosted?: boolean;
  fileUrl?: string;
  name?: string;
  parentId?: string;
  altType?: 'location' | 'agency';
  altId?: string;
}

export interface GHLUploadMediaFileResponse {
  fileId: string;
  url?: string;
  name?: string;
  size?: number;
  mimeType?: string;
}

export interface GHLDeleteMediaRequest {
  id: string;
  altType: 'location' | 'agency';
  altId: string;
}

export interface GHLDeleteMediaResponse {
  success: boolean;
  message?: string;
}

// MCP Parameters for Media Library Endpoints
export interface MCPGetMediaFilesParams {
  offset?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  type?: 'file' | 'folder';
  query?: string;
  altType?: 'location' | 'agency';
  altId?: string;
  parentId?: string;
}

export interface MCPUploadMediaFileParams {
  file?: any;
  hosted?: boolean;
  fileUrl?: string;
  name?: string;
  parentId?: string;
  altType?: 'location' | 'agency';
  altId?: string;
}

export interface MCPDeleteMediaParams {
  id: string;
  altType?: 'location' | 'agency';
  altId?: string;
}

// ===== CUSTOM OBJECTS API TYPES =====

// Object Schema Types
export interface GHLCustomObjectLabel {
  singular: string;
  plural: string;
}

export interface GHLCustomObjectDisplayProperty {
  key: string;
  name: string;
  dataType: string;
}

export interface GHLCustomFieldOption {
  key: string;
  label: string;
  url?: string;
}

export interface GHLCustomField {
  locationId: string;
  name: string;
  description?: string;
  placeholder?: string;
  showInForms: boolean;
  options?: GHLCustomFieldOption[];
  acceptedFormats?: '.pdf' | '.docx' | '.doc' | '.jpg' | '.jpeg' | '.png' | '.gif' | '.csv' | '.xlsx' | '.xls' | 'all';
  id: string;
  objectKey: string;
  dataType: 'TEXT' | 'LARGE_TEXT' | 'NUMERICAL' | 'PHONE' | 'MONETORY' | 'CHECKBOX' | 'SINGLE_OPTIONS' | 'MULTIPLE_OPTIONS' | 'DATE' | 'TEXTBOX_LIST' | 'FILE_UPLOAD' | 'RADIO';
  parentId: string;
  fieldKey: string;
  allowCustomOption?: boolean;
  maxFileLimit?: number;
  dateAdded: string;
  dateUpdated: string;
}

export interface GHLCustomObjectSchema {
  id: string;
  standard: boolean;
  key: string;
  labels: GHLCustomObjectLabel;
  description?: string;
  locationId: string;
  primaryDisplayProperty: string;
  dateAdded: string;
  dateUpdated: string;
  type?: any;
}

export interface GHLObjectRecord {
  id: string;
  owner: string[];
  followers: string[];
  properties: Record<string, any>;
  dateAdded: string;
  dateUpdated: string;
}

export interface GHLCreatedByMeta {
  channel: string;
  createdAt: string;
  source: string;
  sourceId: string;
}

export interface GHLDetailedObjectRecord {
  id: string;
  owner: string[];
  followers: string[];
  properties: Record<string, any>;
  createdAt: string;
  updatedAt: string;
  locationId: string;
  objectId: string;
  objectKey: string;
  createdBy: GHLCreatedByMeta;
  lastUpdatedBy: GHLCreatedByMeta;
  searchAfter: (string | number)[];
}

// Request Types
export interface GHLGetObjectSchemaRequest {
  key: string;
  locationId: string;
  fetchProperties?: boolean;
}

export interface GHLCreateObjectSchemaRequest {
  labels: GHLCustomObjectLabel;
  key: string;
  description?: string;
  locationId: string;
  primaryDisplayPropertyDetails: GHLCustomObjectDisplayProperty;
}

export interface GHLUpdateObjectSchemaRequest {
  labels?: Partial<GHLCustomObjectLabel>;
  description?: string;
  locationId: string;
  searchableProperties: string[];
}

export interface GHLCreateObjectRecordRequest {
  locationId: string;
  properties: Record<string, any>;
  owner?: string[];
  followers?: string[];
}

export interface GHLUpdateObjectRecordRequest {
  locationId: string;
  properties?: Record<string, any>;
  owner?: string[];
  followers?: string[];
}

export interface GHLSearchObjectRecordsRequest {
  locationId: string;
  page: number;
  pageLimit: number;
  query: string;
  searchAfter: string[];
}

// Response Types
export interface GHLGetObjectSchemaResponse {
  object: GHLCustomObjectSchema;
  cache: boolean;
  fields?: GHLCustomField[];
}

export interface GHLObjectListResponse {
  objects: GHLCustomObjectSchema[];
}

export interface GHLObjectSchemaResponse {
  object: GHLCustomObjectSchema;
}

export interface GHLObjectRecordResponse {
  record: GHLObjectRecord;
}

export interface GHLDetailedObjectRecordResponse {
  record: GHLDetailedObjectRecord;
}

export interface GHLObjectRecordDeleteResponse {
  id: string;
  success: boolean;
}

export interface GHLSearchObjectRecordsResponse {
  records: GHLDetailedObjectRecord[];
  total: number;
}

// MCP Parameter Interfaces
export interface MCPGetObjectSchemaParams {
  key: string;
  locationId?: string;
  fetchProperties?: boolean;
}

export interface MCPGetAllObjectsParams {
  locationId?: string;
}

export interface MCPCreateObjectSchemaParams {
  labels: GHLCustomObjectLabel;
  key: string;
  description?: string;
  locationId?: string;
  primaryDisplayPropertyDetails: GHLCustomObjectDisplayProperty;
}

export interface MCPUpdateObjectSchemaParams {
  key: string;
  labels?: Partial<GHLCustomObjectLabel>;
  description?: string;
  locationId?: string;
  searchableProperties: string[];
}

export interface MCPCreateObjectRecordParams {
  schemaKey: string;
  properties: Record<string, any>;
  locationId?: string;
  owner?: string[];
  followers?: string[];
}

export interface MCPGetObjectRecordParams {
  schemaKey: string;
  recordId: string;
}

export interface MCPUpdateObjectRecordParams {
  schemaKey: string;
  recordId: string;
  properties?: Record<string, any>;
  locationId?: string;
  owner?: string[];
  followers?: string[];
}

export interface MCPDeleteObjectRecordParams {
  schemaKey: string;
  recordId: string;
}

export interface MCPSearchObjectRecordsParams {
  schemaKey: string;
  locationId?: string;
  page?: number;
  pageLimit?: number;
  query: string;
  searchAfter?: string[];
}

// ===== ASSOCIATIONS API TYPES =====

// Association Types
export interface GHLAssociation {
  locationId: string;
  id: string;
  key: string;
  firstObjectLabel: any;
  firstObjectKey: any;
  secondObjectLabel: any;
  secondObjectKey: any;
  associationType: 'USER_DEFINED' | 'SYSTEM_DEFINED';
}

export interface GHLRelation {
  id: string;
  associationId: string;
  firstRecordId: string;
  secondRecordId: string;
  locationId: string;
}

// Request Types
export interface GHLCreateAssociationRequest {
  locationId: string;
  key: string;
  firstObjectLabel: any;
  firstObjectKey: any;
  secondObjectLabel: any;
  secondObjectKey: any;
}

export interface GHLUpdateAssociationRequest {
  firstObjectLabel: any;
  secondObjectLabel: any;
}

export interface GHLCreateRelationRequest {
  locationId: string;
  associationId: string;
  firstRecordId: string;
  secondRecordId: string;
}

export interface GHLGetAssociationsRequest {
  locationId: string;
  skip: number;
  limit: number;
}

export interface GHLGetRelationsByRecordRequest {
  recordId: string;
  locationId: string;
  skip: number;
  limit: number;
  associationIds?: string[];
}

export interface GHLGetAssociationByKeyRequest {
  keyName: string;
  locationId: string;
}

export interface GHLGetAssociationByObjectKeyRequest {
  objectKey: string;
  locationId?: string;
}

export interface GHLDeleteRelationRequest {
  relationId: string;
  locationId: string;
}

// Response Types
export interface GHLAssociationResponse {
  locationId: string;
  id: string;
  key: string;
  firstObjectLabel: any;
  firstObjectKey: any;
  secondObjectLabel: any;
  secondObjectKey: any;
  associationType: 'USER_DEFINED' | 'SYSTEM_DEFINED';
}

export interface GHLDeleteAssociationResponse {
  deleted: boolean;
  id: string;
  message: string;
}

export interface GHLGetAssociationsResponse {
  associations: GHLAssociation[];
  total?: number;
}

export interface GHLGetRelationsResponse {
  relations: GHLRelation[];
  total?: number;
}

// MCP Parameter Interfaces
export interface MCPCreateAssociationParams {
  locationId?: string;
  key: string;
  firstObjectLabel: any;
  firstObjectKey: any;
  secondObjectLabel: any;
  secondObjectKey: any;
}

export interface MCPUpdateAssociationParams {
  associationId: string;
  firstObjectLabel: any;
  secondObjectLabel: any;
}

export interface MCPGetAllAssociationsParams {
  locationId?: string;
  skip?: number;
  limit?: number;
}

export interface MCPGetAssociationByIdParams {
  associationId: string;
}

export interface MCPGetAssociationByKeyParams {
  keyName: string;
  locationId?: string;
}

export interface MCPGetAssociationByObjectKeyParams {
  objectKey: string;
  locationId?: string;
}

export interface MCPDeleteAssociationParams {
  associationId: string;
}

export interface MCPCreateRelationParams {
  locationId?: string;
  associationId: string;
  firstRecordId: string;
  secondRecordId: string;
}

export interface MCPGetRelationsByRecordParams {
  recordId: string;
  locationId?: string;
  skip?: number;
  limit?: number;
  associationIds?: string[];
}

export interface MCPDeleteRelationParams {
  relationId: string;
  locationId?: string;
}

// ===== CUSTOM FIELDS V2 API TYPES =====

// Custom Field V2 Option Types
export interface GHLV2CustomFieldOption {
  key: string;
  label: string;
  url?: string; // Optional, valid only for RADIO type
}

// Custom Field V2 Types
export interface GHLV2CustomField {
  locationId: string;
  name?: string;
  description?: string;
  placeholder?: string;
  showInForms: boolean;
  options?: GHLV2CustomFieldOption[];
  acceptedFormats?: '.pdf' | '.docx' | '.doc' | '.jpg' | '.jpeg' | '.png' | '.gif' | '.csv' | '.xlsx' | '.xls' | 'all';
  id: string;
  objectKey: string;
  dataType: 'TEXT' | 'LARGE_TEXT' | 'NUMERICAL' | 'PHONE' | 'MONETORY' | 'CHECKBOX' | 'SINGLE_OPTIONS' | 'MULTIPLE_OPTIONS' | 'DATE' | 'TEXTBOX_LIST' | 'FILE_UPLOAD' | 'RADIO' | 'EMAIL';
  parentId: string;
  fieldKey: string;
  allowCustomOption?: boolean;
  maxFileLimit?: number;
  dateAdded: string;
  dateUpdated: string;
}

export interface GHLV2CustomFieldFolder {
  id: string;
  objectKey: string;
  locationId: string;
  name: string;
}

// Request Types
export interface GHLV2CreateCustomFieldRequest {
  locationId: string;
  name?: string;
  description?: string;
  placeholder?: string;
  showInForms: boolean;
  options?: GHLV2CustomFieldOption[];
  acceptedFormats?: '.pdf' | '.docx' | '.doc' | '.jpg' | '.jpeg' | '.png' | '.gif' | '.csv' | '.xlsx' | '.xls' | 'all';
  dataType: 'TEXT' | 'LARGE_TEXT' | 'NUMERICAL' | 'PHONE' | 'MONETORY' | 'CHECKBOX' | 'SINGLE_OPTIONS' | 'MULTIPLE_OPTIONS' | 'DATE' | 'TEXTBOX_LIST' | 'FILE_UPLOAD' | 'RADIO' | 'EMAIL';
  fieldKey: string;
  objectKey: string;
  maxFileLimit?: number;
  allowCustomOption?: boolean;
  parentId: string;
}

export interface GHLV2UpdateCustomFieldRequest {
  locationId: string;
  name?: string;
  description?: string;
  placeholder?: string;
  showInForms: boolean;
  options?: GHLV2CustomFieldOption[];
  acceptedFormats?: '.pdf' | '.docx' | '.doc' | '.jpg' | '.jpeg' | '.png' | '.gif' | '.csv' | '.xlsx' | '.xls' | 'all';
  maxFileLimit?: number;
}

export interface GHLV2CreateCustomFieldFolderRequest {
  objectKey: string;
  name: string;
  locationId: string;
}

export interface GHLV2UpdateCustomFieldFolderRequest {
  name: string;
  locationId: string;
}

export interface GHLV2GetCustomFieldsByObjectKeyRequest {
  objectKey: string;
  locationId: string;
}

export interface GHLV2DeleteCustomFieldFolderRequest {
  id: string;
  locationId: string;
}

// Response Types
export interface GHLV2CustomFieldResponse {
  field: GHLV2CustomField;
}

export interface GHLV2CustomFieldsResponse {
  fields: GHLV2CustomField[];
  folders: GHLV2CustomFieldFolder[];
}

export interface GHLV2CustomFieldFolderResponse {
  id: string;
  objectKey: string;
  locationId: string;
  name: string;
}

export interface GHLV2DeleteCustomFieldResponse {
  succeded: boolean;
  id: string;
  key: string;
}

// MCP Parameter Interfaces
export interface MCPV2CreateCustomFieldParams {
  locationId?: string;
  name?: string;
  description?: string;
  placeholder?: string;
  showInForms?: boolean;
  options?: GHLV2CustomFieldOption[];
  acceptedFormats?: '.pdf' | '.docx' | '.doc' | '.jpg' | '.jpeg' | '.png' | '.gif' | '.csv' | '.xlsx' | '.xls' | 'all';
  dataType: 'TEXT' | 'LARGE_TEXT' | 'NUMERICAL' | 'PHONE' | 'MONETORY' | 'CHECKBOX' | 'SINGLE_OPTIONS' | 'MULTIPLE_OPTIONS' | 'DATE' | 'TEXTBOX_LIST' | 'FILE_UPLOAD' | 'RADIO' | 'EMAIL';
  fieldKey: string;
  objectKey: string;
  maxFileLimit?: number;
  allowCustomOption?: boolean;
  parentId: string;
}

export interface MCPV2UpdateCustomFieldParams {
  id: string;
  locationId?: string;
  name?: string;
  description?: string;
  placeholder?: string;
  showInForms?: boolean;
  options?: GHLV2CustomFieldOption[];
  acceptedFormats?: '.pdf' | '.docx' | '.doc' | '.jpg' | '.jpeg' | '.png' | '.gif' | '.csv' | '.xlsx' | '.xls' | 'all';
  maxFileLimit?: number;
}

export interface MCPV2GetCustomFieldByIdParams {
  id: string;
}

export interface MCPV2DeleteCustomFieldParams {
  id: string;
}

export interface MCPV2GetCustomFieldsByObjectKeyParams {
  objectKey: string;
  locationId?: string;
}

export interface MCPV2CreateCustomFieldFolderParams {
  objectKey: string;
  name: string;
  locationId?: string;
}

export interface MCPV2UpdateCustomFieldFolderParams {
  id: string;
  name: string;
  locationId?: string;
}

export interface MCPV2DeleteCustomFieldFolderParams {
  id: string;
  locationId?: string;
}

// ===== WORKFLOWS API TYPES =====

// Request Types  
export interface GHLGetWorkflowsRequest {
  locationId: string;
}

// Response Types
export interface GHLGetWorkflowsResponse {
  workflows: GHLWorkflow[];
}

// MCP Parameter Interfaces
export interface MCPGetWorkflowsParams {
  locationId?: string;
}

// ===== SURVEYS API TYPES =====

// Survey Types
export interface GHLSurvey {
  id: string;
  name: string;
  locationId: string;
}

// Survey Submission Types
export interface GHLSurveyPageDetails {
  url: string;
  title: string;
}

export interface GHLSurveyContactSessionIds {
  ids: string[] | null;
}

export interface GHLSurveyEventData {
  fbc?: string;
  fbp?: string;
  page?: GHLSurveyPageDetails;
  type?: string;
  domain?: string;
  medium?: string;
  source?: string;
  version?: string;
  adSource?: string;
  mediumId?: string;
  parentId?: string;
  referrer?: string;
  fbEventId?: string;
  timestamp?: number;
  parentName?: string;
  fingerprint?: string;
  pageVisitType?: string;
  contactSessionIds?: GHLSurveyContactSessionIds | null;
}

export interface GHLSurveySubmissionOthers {
  __submissions_other_field__?: string;
  __custom_field_id__?: string;
  eventData?: GHLSurveyEventData;
  fieldsOriSequance?: string[];
}

export interface GHLSurveySubmission {
  id: string;
  contactId: string;
  createdAt: string;
  surveyId: string;
  name: string;
  email: string;
  others?: GHLSurveySubmissionOthers;
}

export interface GHLSurveySubmissionMeta {
  total: number;
  currentPage: number;
  nextPage: number | null;
  prevPage: number | null;
}

// Request Types
export interface GHLGetSurveysRequest {
  locationId: string;
  skip?: number;
  limit?: number;
  type?: string;
}

export interface GHLGetSurveySubmissionsRequest {
  locationId: string;
  page?: number;
  limit?: number;
  surveyId?: string;
  q?: string;
  startAt?: string;
  endAt?: string;
}

// Response Types
export interface GHLGetSurveysResponse {
  surveys: GHLSurvey[];
  total: number;
}

export interface GHLGetSurveySubmissionsResponse {
  submissions: GHLSurveySubmission[];
  meta: GHLSurveySubmissionMeta;
}

// MCP Parameter Interfaces
export interface MCPGetSurveysParams {
  locationId?: string;
  skip?: number;
  limit?: number;
  type?: string;
}

export interface MCPGetSurveySubmissionsParams {
  locationId?: string;
  page?: number;
  limit?: number;
  surveyId?: string;
  q?: string;
  startAt?: string;
  endAt?: string;
}

// ===== STORE API TYPES =====

// Country and State Types
export type GHLCountryCode = 'US' | 'CA' | 'AF' | 'AX' | 'AL' | 'DZ' | 'AS' | 'AD' | 'AO' | 'AI' | 'AQ' | 'AG' | 'AR' | 'AM' | 'AW' | 'AU' | 'AT' | 'AZ' | 'BS' | 'BH' | 'BD' | 'BB' | 'BY' | 'BE' | 'BZ' | 'BJ' | 'BM' | 'BT' | 'BO' | 'BA' | 'BW' | 'BV' | 'BR' | 'IO' | 'BN' | 'BG' | 'BF' | 'BI' | 'KH' | 'CM' | 'CV' | 'KY' | 'CF' | 'TD' | 'CL' | 'CN' | 'CX' | 'CC' | 'CO' | 'KM' | 'CG' | 'CD' | 'CK' | 'CR' | 'CI' | 'HR' | 'CU' | 'CY' | 'CZ' | 'DK' | 'DJ' | 'DM' | 'DO' | 'EC' | 'EG' | 'SV' | 'GQ' | 'ER' | 'EE' | 'ET' | 'FK' | 'FO' | 'FJ' | 'FI' | 'FR' | 'GF' | 'PF' | 'TF' | 'GA' | 'GM' | 'GE' | 'DE' | 'GH' | 'GI' | 'GR' | 'GL' | 'GD' | 'GP' | 'GU' | 'GT' | 'GG' | 'GN' | 'GW' | 'GY' | 'HT' | 'HM' | 'VA' | 'HN' | 'HK' | 'HU' | 'IS' | 'IN' | 'ID' | 'IR' | 'IQ' | 'IE' | 'IM' | 'IL' | 'IT' | 'JM' | 'JP' | 'JE' | 'JO' | 'KZ' | 'KE' | 'KI' | 'KP' | 'XK' | 'KW' | 'KG' | 'LA' | 'LV' | 'LB' | 'LS' | 'LR' | 'LY' | 'LI' | 'LT' | 'LU' | 'MO' | 'MK' | 'MG' | 'MW' | 'MY' | 'MV' | 'ML' | 'MT' | 'MH' | 'MQ' | 'MR' | 'MU' | 'YT' | 'MX' | 'FM' | 'MD' | 'MC' | 'MN' | 'ME' | 'MS' | 'MA' | 'MZ' | 'MM' | 'NA' | 'NR' | 'NP' | 'NL' | 'AN' | 'NC' | 'NZ' | 'NI' | 'NE' | 'NG' | 'NU' | 'NF' | 'MP' | 'NO' | 'OM' | 'PK' | 'PW' | 'PS' | 'PA' | 'PG' | 'PY' | 'PE' | 'PH' | 'PN' | 'PL' | 'PT' | 'PR' | 'QA' | 'RE' | 'RO' | 'RU' | 'RW' | 'SH' | 'KN' | 'LC' | 'MF' | 'PM' | 'VC' | 'WS' | 'SM' | 'ST' | 'SA' | 'SN' | 'RS' | 'SC' | 'SL' | 'SG' | 'SX' | 'SK' | 'SI' | 'SB' | 'SO' | 'ZA' | 'GS' | 'KR' | 'ES' | 'LK' | 'SD' | 'SR' | 'SJ' | 'SZ' | 'SE' | 'CH' | 'SY' | 'TW' | 'TJ' | 'TZ' | 'TH' | 'TL' | 'TG' | 'TK' | 'TO' | 'TT' | 'TN' | 'TR' | 'TM' | 'TC' | 'TV' | 'UG' | 'UA' | 'AE' | 'GB' | 'UM' | 'UY' | 'UZ' | 'VU' | 'VE' | 'VN' | 'VG' | 'VI' | 'WF' | 'EH' | 'YE' | 'ZM' | 'ZW';

export type GHLStateCode = 'AL' | 'AK' | 'AS' | 'AZ' | 'AR' | 'AA' | 'AE' | 'AP' | 'CA' | 'CO' | 'CT' | 'DE' | 'DC' | 'FM' | 'FL' | 'GA' | 'GU' | 'HI' | 'ID' | 'IL' | 'IN' | 'IA' | 'KS' | 'KY' | 'LA' | 'ME' | 'MH' | 'MD' | 'MA' | 'MI' | 'MN' | 'MS' | 'MO' | 'MT' | 'NE' | 'NV' | 'NH' | 'NJ' | 'NM' | 'NY' | 'NC' | 'ND' | 'MP' | 'OH' | 'OK' | 'OR' | 'PW' | 'PA' | 'PR' | 'RI' | 'SC' | 'SD' | 'TN' | 'TX' | 'UT' | 'VT' | 'VI' | 'VA' | 'WA' | 'WV' | 'WI' | 'WY' | 'AB' | 'BC' | 'MB' | 'NB' | 'NL' | 'NT' | 'NS' | 'NU' | 'ON' | 'PE' | 'QC' | 'SK' | 'YT';

// Shipping Zone Types
export interface GHLShippingZoneCountryState {
  code: GHLStateCode;
}

export interface GHLShippingZoneCountry {
  code: GHLCountryCode;
  states?: GHLShippingZoneCountryState[];
}

export interface GHLCreateShippingZoneRequest {
  altId: string;
  altType: 'location';
  name: string;
  countries: GHLShippingZoneCountry[];
}

export interface GHLUpdateShippingZoneRequest {
  altId?: string;
  altType?: 'location';
  name?: string;
  countries?: GHLShippingZoneCountry[];
}

export interface GHLGetShippingZonesRequest {
  altId: string;
  altType: 'location';
  limit?: number;
  offset?: number;
  withShippingRate?: boolean;
}

export interface GHLDeleteShippingZoneRequest {
  altId: string;
  altType: 'location';
}

// Shipping Rate Types
export interface GHLShippingCarrierService {
  name: string;
  value: string;
}

export type GHLShippingConditionType = 'none' | 'price' | 'weight';

export interface GHLCreateShippingRateRequest {
  altId: string;
  altType: 'location';
  name: string;
  description?: string;
  currency: string;
  amount: number;
  conditionType: GHLShippingConditionType;
  minCondition?: number;
  maxCondition?: number;
  isCarrierRate?: boolean;
  shippingCarrierId: string;
  percentageOfRateFee?: number;
  shippingCarrierServices?: GHLShippingCarrierService[];
}

export interface GHLUpdateShippingRateRequest {
  altId?: string;
  altType?: 'location';
  name?: string;
  description?: string;
  currency?: string;
  amount?: number;
  conditionType?: GHLShippingConditionType;
  minCondition?: number;
  maxCondition?: number;
  isCarrierRate?: boolean;
  shippingCarrierId?: string;
  percentageOfRateFee?: number;
  shippingCarrierServices?: GHLShippingCarrierService[];
}

export interface GHLGetShippingRatesRequest {
  altId: string;
  altType: 'location';
  limit?: number;
  offset?: number;
}

export interface GHLDeleteShippingRateRequest {
  altId: string;
  altType: 'location';
}

// Shipping Carrier Types
export interface GHLCreateShippingCarrierRequest {
  altId: string;
  altType: 'location';
  name: string;
  callbackUrl: string;
  services?: GHLShippingCarrierService[];
  allowsMultipleServiceSelection?: boolean;
}

export interface GHLUpdateShippingCarrierRequest {
  altId?: string;
  altType?: 'location';
  name?: string;
  callbackUrl?: string;
  services?: GHLShippingCarrierService[];
  allowsMultipleServiceSelection?: boolean;
}

export interface GHLGetShippingCarriersRequest {
  altId: string;
  altType: 'location';
}

export interface GHLDeleteShippingCarrierRequest {
  altId: string;
  altType: 'location';
}

// Available Shipping Rates Types  
export interface GHLContactAddress {
  name?: string;
  companyName?: string;
  addressLine1?: string;
  country: GHLCountryCode;
  state?: GHLStateCode;
  city?: string;
  zip?: string;
  phone?: string;
  email?: string;
}

export interface GHLOrderSource {
  type: 'funnel' | 'website' | 'invoice' | 'calendar' | 'text2Pay' | 'document_contracts' | 'membership' | 'mobile_app' | 'communities' | 'point_of_sale' | 'manual' | 'form' | 'survey' | 'payment_link' | 'external';
  subType?: 'one_step_order_form' | 'two_step_order_form' | 'upsell' | 'tap_to_pay' | 'card_payment' | 'store' | 'contact_view' | 'email_campaign' | 'payments_dashboard' | 'shopify' | 'subscription_view' | 'store_upsell' | 'woocommerce' | 'service' | 'meeting' | 'imported_csv' | 'qr_code';
}

export interface GHLProductItem {
  id: string;
  qty: number;
}

export interface GHLGetAvailableShippingRatesRequest {
  altId: string;
  altType: 'location';
  country: GHLCountryCode;
  address?: GHLContactAddress;
  amountAvailable?: string;
  totalOrderAmount: number;
  weightAvailable?: boolean;
  totalOrderWeight: number;
  source: GHLOrderSource;
  products: GHLProductItem[];
  couponCode?: string;
}

// Response Types
export interface GHLShippingRate {
  altId: string;
  altType: 'location';
  name: string;
  description?: string;
  currency: string;
  amount: number;
  conditionType: GHLShippingConditionType;
  minCondition?: number;
  maxCondition?: number;
  isCarrierRate?: boolean;
  shippingCarrierId: string;
  percentageOfRateFee?: number;
  shippingCarrierServices?: GHLShippingCarrierService[];
  _id: string;
  shippingZoneId: string;
  createdAt: string;
  updatedAt: string;
}

export interface GHLShippingZone {
  altId: string;
  altType: 'location';
  name: string;
  countries: GHLShippingZoneCountry[];
  _id: string;
  shippingRates?: GHLShippingRate[];
  createdAt: string;
  updatedAt: string;
}

export interface GHLShippingCarrier {
  altId: string;
  altType: 'location';
  name: string;
  callbackUrl: string;
  services?: GHLShippingCarrierService[];
  allowsMultipleServiceSelection?: boolean;
  _id: string;
  marketplaceAppId: string;
  createdAt: string;
  updatedAt: string;
}

export interface GHLAvailableShippingRate {
  name: string;
  description?: string;
  currency: string;
  amount: number;
  isCarrierRate?: boolean;
  shippingCarrierId: string;
  percentageOfRateFee?: number;
  shippingCarrierServices?: GHLShippingCarrierService[];
  _id: string;
  shippingZoneId: string;
}

export interface GHLCreateShippingZoneResponse {
  status: boolean;
  message?: string;
  data: GHLShippingZone;
}

export interface GHLListShippingZonesResponse {
  total: number;
  data: GHLShippingZone[];
}

export interface GHLGetShippingZoneResponse {
  status: boolean;
  message?: string;
  data: GHLShippingZone;
}

export interface GHLUpdateShippingZoneResponse {
  status: boolean;
  message?: string;
  data: GHLShippingZone;
}

export interface GHLDeleteShippingZoneResponse {
  status: boolean;
  message?: string;
}

export interface GHLCreateShippingRateResponse {
  status: boolean;
  message?: string;
  data: GHLShippingRate;
}

export interface GHLListShippingRatesResponse {
  total: number;
  data: GHLShippingRate[];
}

export interface GHLGetShippingRateResponse {
  status: boolean;
  message?: string;
  data: GHLShippingRate;
}

export interface GHLUpdateShippingRateResponse {
  status: boolean;
  message?: string;
  data: GHLShippingRate;
}

export interface GHLDeleteShippingRateResponse {
  status: boolean;
  message?: string;
}

export interface GHLCreateShippingCarrierResponse {
  status: boolean;
  message?: string;
  data: GHLShippingCarrier;
}

export interface GHLListShippingCarriersResponse {
  status: boolean;
  message?: string;
  data: GHLShippingCarrier[];
}

export interface GHLGetShippingCarrierResponse {
  status: boolean;
  message?: string;
  data: GHLShippingCarrier;
}

export interface GHLUpdateShippingCarrierResponse {
  status: boolean;
  message?: string;
  data: GHLShippingCarrier;
}

export interface GHLDeleteShippingCarrierResponse {
  status: boolean;
  message?: string;
}

export interface GHLGetAvailableShippingRatesResponse {
  status: boolean;
  message?: string;
  data: GHLAvailableShippingRate[];
}

// Store Settings Types
export interface GHLStoreShippingOrigin {
  name: string;
  country: GHLCountryCode;
  state?: GHLStateCode;
  city: string;
  street1: string;
  street2?: string;
  zip: string;
  phone?: string;
  email?: string;
}

export interface GHLStoreOrderNotification {
  enabled: boolean;
  subject: string;
  emailTemplateId: string;
  defaultEmailTemplateId: string;
}

export interface GHLStoreOrderFulfillmentNotification {
  enabled: boolean;
  subject: string;
  emailTemplateId: string;
  defaultEmailTemplateId: string;
}

export interface GHLCreateStoreSettingRequest {
  altId: string;
  altType: 'location';
  shippingOrigin: GHLStoreShippingOrigin;
  storeOrderNotification?: GHLStoreOrderNotification;
  storeOrderFulfillmentNotification?: GHLStoreOrderFulfillmentNotification;
}

export interface GHLGetStoreSettingRequest {
  altId: string;
  altType: 'location';
}

export interface GHLStoreSetting {
  altId: string;
  altType: 'location';
  shippingOrigin: GHLStoreShippingOrigin;
  storeOrderNotification?: GHLStoreOrderNotification;
  storeOrderFulfillmentNotification?: GHLStoreOrderFulfillmentNotification;
  _id: string;
  createdAt: string;
  updatedAt: string;
}

export interface GHLCreateStoreSettingResponse {
  status: boolean;
  message?: string;
  data: GHLStoreSetting;
}

export interface GHLGetStoreSettingResponse {
  status: boolean;
  message?: string;
  data: GHLStoreSetting;
}

// MCP Tool Parameters - Store API

// Shipping Zone MCP Parameters
export interface MCPCreateShippingZoneParams {
  locationId?: string;
  name: string;
  countries: GHLShippingZoneCountry[];
}

export interface MCPListShippingZonesParams {
  locationId?: string;
  limit?: number;
  offset?: number;
  withShippingRate?: boolean;
}

export interface MCPGetShippingZoneParams {
  shippingZoneId: string;
  locationId?: string;
  withShippingRate?: boolean;
}

export interface MCPUpdateShippingZoneParams {
  shippingZoneId: string;
  locationId?: string;
  name?: string;
  countries?: GHLShippingZoneCountry[];
}

export interface MCPDeleteShippingZoneParams {
  shippingZoneId: string;
  locationId?: string;
}

// Shipping Rate MCP Parameters
export interface MCPCreateShippingRateParams {
  shippingZoneId: string;
  locationId?: string;
  name: string;
  description?: string;
  currency: string;
  amount: number;
  conditionType: GHLShippingConditionType;
  minCondition?: number;
  maxCondition?: number;
  isCarrierRate?: boolean;
  shippingCarrierId: string;
  percentageOfRateFee?: number;
  shippingCarrierServices?: GHLShippingCarrierService[];
}

export interface MCPListShippingRatesParams {
  shippingZoneId: string;
  locationId?: string;
  limit?: number;
  offset?: number;
}

export interface MCPGetShippingRateParams {
  shippingZoneId: string;
  shippingRateId: string;
  locationId?: string;
}

export interface MCPUpdateShippingRateParams {
  shippingZoneId: string;
  shippingRateId: string;
  locationId?: string;
  name?: string;
  description?: string;
  currency?: string;
  amount?: number;
  conditionType?: GHLShippingConditionType;
  minCondition?: number;
  maxCondition?: number;
  isCarrierRate?: boolean;
  shippingCarrierId?: string;
  percentageOfRateFee?: number;
  shippingCarrierServices?: GHLShippingCarrierService[];
}

export interface MCPDeleteShippingRateParams {
  shippingZoneId: string;
  shippingRateId: string;
  locationId?: string;
}

export interface MCPGetAvailableShippingRatesParams {
  locationId?: string;
  country: GHLCountryCode;
  address?: GHLContactAddress;
  totalOrderAmount: number;
  totalOrderWeight: number;
  source: GHLOrderSource;
  products: GHLProductItem[];
  couponCode?: string;
}

// Shipping Carrier MCP Parameters
export interface MCPCreateShippingCarrierParams {
  locationId?: string;
  name: string;
  callbackUrl: string;
  services?: GHLShippingCarrierService[];
  allowsMultipleServiceSelection?: boolean;
}

export interface MCPListShippingCarriersParams {
  locationId?: string;
}

export interface MCPGetShippingCarrierParams {
  shippingCarrierId: string;
  locationId?: string;
}

export interface MCPUpdateShippingCarrierParams {
  shippingCarrierId: string;
  locationId?: string;
  name?: string;
  callbackUrl?: string;
  services?: GHLShippingCarrierService[];
  allowsMultipleServiceSelection?: boolean;
}

export interface MCPDeleteShippingCarrierParams {
  shippingCarrierId: string;
  locationId?: string;
}

// Store Settings MCP Parameters
export interface MCPCreateStoreSettingParams {
  locationId?: string;
  shippingOrigin: GHLStoreShippingOrigin;
  storeOrderNotification?: GHLStoreOrderNotification;
  storeOrderFulfillmentNotification?: GHLStoreOrderFulfillmentNotification;
}

export interface MCPGetStoreSettingParams {
  locationId?: string;
}

// Products API Types

// Core Product Types
export type GHLProductType = 'DIGITAL' | 'PHYSICAL' | 'SERVICE' | 'PHYSICAL/DIGITAL';
export type GHLPriceType = 'one_time' | 'recurring';
export type GHLRecurringInterval = 'day' | 'month' | 'week' | 'year';
export type GHLWeightUnit = 'kg' | 'lb' | 'g' | 'oz';
export type GHLDimensionUnit = 'cm' | 'in' | 'm';
export type GHLMediaType = 'image' | 'video';
export type GHLSortOrder = 'asc' | 'desc';
export type GHLReviewSortField = 'createdAt' | 'rating';
export type GHLBulkUpdateType = 'bulk-update-price' | 'bulk-update-availability' | 'bulk-update-product-collection' | 'bulk-delete-products' | 'bulk-update-currency';
export type GHLPriceUpdateType = 'INCREASE_BY_AMOUNT' | 'REDUCE_BY_AMOUNT' | 'SET_NEW_PRICE' | 'INCREASE_BY_PERCENTAGE' | 'REDUCE_BY_PERCENTAGE';
export type GHLStoreAction = 'include' | 'exclude';
export type GHLAltType = 'location';

// Product Variant Types
export interface GHLProductVariantOption {
  id: string;
  name: string;
}

export interface GHLProductVariant {
  id: string;
  name: string;
  options: GHLProductVariantOption[];
}

// Product Media Types
export interface GHLProductMedia {
  id: string;
  title?: string;
  url: string;
  type: GHLMediaType;
  isFeatured?: boolean;
  priceIds?: string[];
}

// Product Label Types
export interface GHLProductLabel {
  title: string;
  startDate?: string;
  endDate?: string;
}

// Product SEO Types
export interface GHLProductSEO {
  title?: string;
  description?: string;
}

// Price Types
export interface GHLRecurring {
  interval: GHLRecurringInterval;
  intervalCount: number;
}

export interface GHLMembershipOffer {
  label: string;
  value: string;
  _id: string;
}

export interface GHLPriceMeta {
  source: 'stripe' | 'woocommerce' | 'shopify';
  sourceId?: string;
  stripePriceId: string;
  internalSource: 'agency_plan' | 'funnel' | 'membership' | 'communities' | 'gokollab';
}

export interface GHLWeightOptions {
  value: number;
  unit: GHLWeightUnit;
}

export interface GHLPriceDimensions {
  height: number;
  width: number;
  length: number;
  unit: GHLDimensionUnit;
}

export interface GHLShippingOptions {
  weight?: GHLWeightOptions;
  dimensions?: GHLPriceDimensions;
}

// Collection Types
export interface GHLCollectionSEO {
  title?: string;
  description?: string;
}

export interface GHLProductCollection {
  _id: string;
  altId: string;
  name: string;
  slug: string;
  image?: string;
  seo?: GHLCollectionSEO;
  createdAt: string;
}

// Review Types
export interface GHLUserDetails {
  name: string;
  email: string;
  phone?: string;
  isCustomer?: boolean;
}

export interface GHLProductReview {
  headline: string;
  comment: string;
  user: GHLUserDetails;
}

// Inventory Types
export interface GHLInventoryItem {
  _id: string;
  name: string;
  availableQuantity: number;
  sku?: string;
  allowOutOfStockPurchases: boolean;
  product: string;
  updatedAt: string;
  image?: string;
  productName?: string;
}

// Core Product Interface
export interface GHLProduct {
  _id: string;
  description?: string;
  variants?: GHLProductVariant[];
  medias?: GHLProductMedia[];
  locationId: string;
  name: string;
  productType: GHLProductType;
  availableInStore?: boolean;
  userId?: string;
  createdAt: string;
  updatedAt: string;
  statementDescriptor?: string;
  image?: string;
  collectionIds?: string[];
  isTaxesEnabled?: boolean;
  taxes?: string[];
  automaticTaxCategoryId?: string;
  isLabelEnabled?: boolean;
  label?: GHLProductLabel;
  slug?: string;
  seo?: GHLProductSEO;
}

// Price Interface
export interface GHLPrice {
  _id: string;
  membershipOffers?: GHLMembershipOffer[];
  variantOptionIds?: string[];
  locationId: string;
  product: string;
  userId?: string;
  name: string;
  type: GHLPriceType;
  currency: string;
  amount: number;
  recurring?: GHLRecurring;
  description?: string;
  trialPeriod?: number;
  totalCycles?: number;
  setupFee?: number;
  compareAtPrice?: number;
  createdAt: string;
  updatedAt: string;
  meta?: GHLPriceMeta;
  trackInventory?: boolean;
  availableQuantity?: number;
  allowOutOfStockPurchases?: boolean;
  sku?: string;
  shippingOptions?: GHLShippingOptions;
  isDigitalProduct?: boolean;
  digitalDelivery?: string[];
}

// Request Types

// Product Requests
export interface GHLCreateProductRequest {
  name: string;
  locationId: string;
  description?: string;
  productType: GHLProductType;
  image?: string;
  statementDescriptor?: string;
  availableInStore?: boolean;
  medias?: GHLProductMedia[];
  variants?: GHLProductVariant[];
  collectionIds?: string[];
  isTaxesEnabled?: boolean;
  taxes?: string[];
  automaticTaxCategoryId?: string;
  isLabelEnabled?: boolean;
  label?: GHLProductLabel;
  slug?: string;
  seo?: GHLProductSEO;
}

export interface GHLUpdateProductRequest {
  name?: string;
  locationId?: string;
  description?: string;
  productType?: GHLProductType;
  image?: string;
  statementDescriptor?: string;
  availableInStore?: boolean;
  medias?: GHLProductMedia[];
  variants?: GHLProductVariant[];
  collectionIds?: string[];
  isTaxesEnabled?: boolean;
  taxes?: string[];
  automaticTaxCategoryId?: string;
  isLabelEnabled?: boolean;
  label?: GHLProductLabel;
  slug?: string;
  seo?: GHLProductSEO;
}

export interface GHLListProductsRequest {
  locationId: string;
  limit?: number;
  offset?: number;
  search?: string;
  collectionIds?: string[];
  collectionSlug?: string;
  expand?: string[];
  productIds?: string[];
  storeId?: string;
  includedInStore?: boolean;
  availableInStore?: boolean;
  sortOrder?: GHLSortOrder;
}

export interface GHLGetProductRequest {
  productId: string;
  locationId: string;
}

export interface GHLDeleteProductRequest {
  productId: string;
  locationId: string;
}

// Price Requests
export interface GHLCreatePriceRequest {
  name: string;
  type: GHLPriceType;
  currency: string;
  amount: number;
  recurring?: GHLRecurring;
  description?: string;
  membershipOffers?: GHLMembershipOffer[];
  trialPeriod?: number;
  totalCycles?: number;
  setupFee?: number;
  variantOptionIds?: string[];
  compareAtPrice?: number;
  locationId: string;
  userId?: string;
  meta?: GHLPriceMeta;
  trackInventory?: boolean;
  availableQuantity?: number;
  allowOutOfStockPurchases?: boolean;
  sku?: string;
  shippingOptions?: GHLShippingOptions;
  isDigitalProduct?: boolean;
  digitalDelivery?: string[];
}

export interface GHLUpdatePriceRequest {
  name?: string;
  type?: GHLPriceType;
  currency?: string;
  amount?: number;
  recurring?: GHLRecurring;
  description?: string;
  membershipOffers?: GHLMembershipOffer[];
  trialPeriod?: number;
  totalCycles?: number;
  setupFee?: number;
  variantOptionIds?: string[];
  compareAtPrice?: number;
  locationId?: string;
  userId?: string;
  meta?: GHLPriceMeta;
  trackInventory?: boolean;
  availableQuantity?: number;
  allowOutOfStockPurchases?: boolean;
  sku?: string;
  shippingOptions?: GHLShippingOptions;
  isDigitalProduct?: boolean;
  digitalDelivery?: string[];
}

export interface GHLListPricesRequest {
  productId: string;
  locationId: string;
  limit?: number;
  offset?: number;
  ids?: string;
}

export interface GHLGetPriceRequest {
  productId: string;
  priceId: string;
  locationId: string;
}

export interface GHLDeletePriceRequest {
  productId: string;
  priceId: string;
  locationId: string;
}

// Bulk Update Requests
export interface GHLBulkUpdateFilters {
  collectionIds?: string[];
  productType?: string;
  availableInStore?: boolean;
  search?: string;
}

export interface GHLPriceUpdateField {
  type: GHLPriceUpdateType;
  value: number;
  roundToWhole?: boolean;
}

export interface GHLBulkUpdateRequest {
  altId: string;
  altType: GHLAltType;
  type: GHLBulkUpdateType;
  productIds: string[];
  filters?: GHLBulkUpdateFilters;
  price?: GHLPriceUpdateField;
  compareAtPrice?: GHLPriceUpdateField;
  availability?: boolean;
  collectionIds?: string[];
  currency?: string;
}

// Inventory Requests
export interface GHLListInventoryRequest {
  altId: string;
  altType: GHLAltType;
  limit?: number;
  offset?: number;
  search?: string;
}

export interface GHLUpdateInventoryItem {
  priceId: string;
  availableQuantity?: number;
  allowOutOfStockPurchases?: boolean;
}

export interface GHLUpdateInventoryRequest {
  altId: string;
  altType: GHLAltType;
  items: GHLUpdateInventoryItem[];
}

// Store Requests
export interface GHLGetProductStoreStatsRequest {
  storeId: string;
  altId: string;
  altType: GHLAltType;
  search?: string;
  collectionIds?: string;
}

export interface GHLUpdateProductStoreRequest {
  action: GHLStoreAction;
  productIds: string[];
}

// Collection Requests
export interface GHLCreateProductCollectionRequest {
  altId: string;
  altType: GHLAltType;
  collectionId?: string;
  name: string;
  slug: string;
  image?: string;
  seo?: GHLCollectionSEO;
}

export interface GHLUpdateProductCollectionRequest {
  altId: string;
  altType: GHLAltType;
  name?: string;
  slug?: string;
  image?: string;
  seo?: GHLCollectionSEO;
}

export interface GHLListProductCollectionsRequest {
  altId: string;
  altType: GHLAltType;
  limit?: number;
  offset?: number;
  collectionIds?: string;
  name?: string;
}

export interface GHLGetProductCollectionRequest {
  collectionId: string;
}

export interface GHLDeleteProductCollectionRequest {
  collectionId: string;
  altId: string;
  altType: GHLAltType;
}

// Review Requests
export interface GHLListProductReviewsRequest {
  altId: string;
  altType: GHLAltType;
  limit?: number;
  offset?: number;
  sortField?: GHLReviewSortField;
  sortOrder?: GHLSortOrder;
  rating?: number;
  startDate?: string;
  endDate?: string;
  productId?: string;
  storeId?: string;
}

export interface GHLGetReviewsCountRequest {
  altId: string;
  altType: GHLAltType;
  rating?: number;
  startDate?: string;
  endDate?: string;
  productId?: string;
  storeId?: string;
}

export interface GHLUpdateProductReviewRequest {
  altId: string;
  altType: GHLAltType;
  productId: string;
  status: string;
  reply?: GHLProductReview[];
  rating?: number;
  headline?: string;
  detail?: string;
}

export interface GHLDeleteProductReviewRequest {
  reviewId: string;
  altId: string;
  altType: GHLAltType;
  productId: string;
}

export interface GHLUpdateProductReviewObject {
  reviewId: string;
  productId: string;
  storeId: string;
}

export interface GHLBulkUpdateProductReviewsRequest {
  altId: string;
  altType: GHLAltType;
  reviews: GHLUpdateProductReviewObject[];
  status: any;
}

// Response Types

// Product Responses
export interface GHLCreateProductResponse {
  _id: string;
  description?: string;
  variants?: GHLProductVariant[];
  medias?: GHLProductMedia[];
  locationId: string;
  name: string;
  productType: GHLProductType;
  availableInStore?: boolean;
  userId?: string;
  createdAt: string;
  updatedAt: string;
  statementDescriptor?: string;
  image?: string;
  collectionIds?: string[];
  isTaxesEnabled?: boolean;
  taxes?: string[];
  automaticTaxCategoryId?: string;
  isLabelEnabled?: boolean;
  label?: GHLProductLabel;
  slug?: string;
  seo?: GHLProductSEO;
}

export interface GHLUpdateProductResponse extends GHLCreateProductResponse {}

export interface GHLGetProductResponse extends GHLCreateProductResponse {}

export interface GHLListProductsStats {
  total: number;
}

export interface GHLListProductsResponse {
  products: GHLProduct[];
  total: GHLListProductsStats[];
}

export interface GHLDeleteProductResponse {
  status: boolean;
}

// Price Responses
export interface GHLCreatePriceResponse extends GHLPrice {}
export interface GHLUpdatePriceResponse extends GHLPrice {}
export interface GHLGetPriceResponse extends GHLPrice {}

export interface GHLListPricesResponse {
  prices: GHLPrice[];
  total: number;
}

export interface GHLDeletePriceResponse {
  status: boolean;
}

// Bulk Update Response
export interface GHLBulkUpdateResponse {
  status: boolean;
  message?: string;
}

// Inventory Responses
export interface GHLListInventoryResponse {
  inventory: GHLInventoryItem[];
  total: { total: number };
}

export interface GHLUpdateInventoryResponse {
  status: boolean;
  message?: string;
}

// Store Responses
export interface GHLGetProductStoreStatsResponse {
  totalProducts: number;
  includedInStore: number;
  excludedFromStore: number;
}

export interface GHLUpdateProductStoreResponse {
  status: boolean;
  message?: string;
}

// Collection Responses
export interface GHLCreateCollectionResponse {
  data: GHLProductCollection;
}

export interface GHLUpdateProductCollectionResponse {
  status: boolean;
  message?: string;
}

export interface GHLListCollectionResponse {
  data: any[];
  total: number;
}

export interface GHLDefaultCollectionResponse {
  data: any;
  status: boolean;
}

export interface GHLDeleteProductCollectionResponse {
  status: boolean;
  message?: string;
}

// Review Responses
export interface GHLListProductReviewsResponse {
  data: any[];
  total: number;
}

export interface GHLCountReviewsByStatusResponse {
  data: any[];
}

export interface GHLUpdateProductReviewsResponse {
  status: boolean;
  message?: string;
}

export interface GHLDeleteProductReviewResponse {
  status: boolean;
  message?: string;
}

// MCP Tool Parameters - Products API

// Product MCP Parameters
export interface MCPCreateProductParams {
  locationId?: string;
  name: string;
  productType: GHLProductType;
  description?: string;
  image?: string;
  statementDescriptor?: string;
  availableInStore?: boolean;
  medias?: GHLProductMedia[];
  variants?: GHLProductVariant[];
  collectionIds?: string[];
  isTaxesEnabled?: boolean;
  taxes?: string[];
  automaticTaxCategoryId?: string;
  isLabelEnabled?: boolean;
  label?: GHLProductLabel;
  slug?: string;
  seo?: GHLProductSEO;
}

export interface MCPUpdateProductParams {
  productId: string;
  locationId?: string;
  name?: string;
  productType?: GHLProductType;
  description?: string;
  image?: string;
  statementDescriptor?: string;
  availableInStore?: boolean;
  medias?: GHLProductMedia[];
  variants?: GHLProductVariant[];
  collectionIds?: string[];
  isTaxesEnabled?: boolean;
  taxes?: string[];
  automaticTaxCategoryId?: string;
  isLabelEnabled?: boolean;
  label?: GHLProductLabel;
  slug?: string;
  seo?: GHLProductSEO;
}

export interface MCPListProductsParams {
  locationId?: string;
  limit?: number;
  offset?: number;
  search?: string;
  collectionIds?: string[];
  collectionSlug?: string;
  expand?: string[];
  productIds?: string[];
  storeId?: string;
  includedInStore?: boolean;
  availableInStore?: boolean;
  sortOrder?: GHLSortOrder;
}

export interface MCPGetProductParams {
  productId: string;
  locationId?: string;
}

export interface MCPDeleteProductParams {
  productId: string;
  locationId?: string;
}

// Price MCP Parameters
export interface MCPCreatePriceParams {
  productId: string;
  name: string;
  type: GHLPriceType;
  currency: string;
  amount: number;
  locationId?: string;
  recurring?: GHLRecurring;
  description?: string;
  membershipOffers?: GHLMembershipOffer[];
  trialPeriod?: number;
  totalCycles?: number;
  setupFee?: number;
  variantOptionIds?: string[];
  compareAtPrice?: number;
  userId?: string;
  meta?: GHLPriceMeta;
  trackInventory?: boolean;
  availableQuantity?: number;
  allowOutOfStockPurchases?: boolean;
  sku?: string;
  shippingOptions?: GHLShippingOptions;
  isDigitalProduct?: boolean;
  digitalDelivery?: string[];
}

export interface MCPUpdatePriceParams {
  productId: string;
  priceId: string;
  name?: string;
  type?: GHLPriceType;
  currency?: string;
  amount?: number;
  locationId?: string;
  recurring?: GHLRecurring;
  description?: string;
  membershipOffers?: GHLMembershipOffer[];
  trialPeriod?: number;
  totalCycles?: number;
  setupFee?: number;
  variantOptionIds?: string[];
  compareAtPrice?: number;
  userId?: string;
  meta?: GHLPriceMeta;
  trackInventory?: boolean;
  availableQuantity?: number;
  allowOutOfStockPurchases?: boolean;
  sku?: string;
  shippingOptions?: GHLShippingOptions;
  isDigitalProduct?: boolean;
  digitalDelivery?: string[];
}

export interface MCPListPricesParams {
  productId: string;
  locationId?: string;
  limit?: number;
  offset?: number;
  ids?: string;
}

export interface MCPGetPriceParams {
  productId: string;
  priceId: string;
  locationId?: string;
}

export interface MCPDeletePriceParams {
  productId: string;
  priceId: string;
  locationId?: string;
}

// Bulk Update MCP Parameters
export interface MCPBulkUpdateProductsParams {
  locationId?: string;
  type: GHLBulkUpdateType;
  productIds: string[];
  filters?: GHLBulkUpdateFilters;
  price?: GHLPriceUpdateField;
  compareAtPrice?: GHLPriceUpdateField;
  availability?: boolean;
  collectionIds?: string[];
  currency?: string;
}

// Inventory MCP Parameters
export interface MCPListInventoryParams {
  locationId?: string;
  limit?: number;
  offset?: number;
  search?: string;
}

export interface MCPUpdateInventoryParams {
  locationId?: string;
  items: GHLUpdateInventoryItem[];
}

// Store MCP Parameters
export interface MCPGetProductStoreStatsParams {
  storeId: string;
  locationId?: string;
  search?: string;
  collectionIds?: string;
}

export interface MCPUpdateProductStoreParams {
  storeId: string;
  action: GHLStoreAction;
  productIds: string[];
}

// Collection MCP Parameters
export interface MCPCreateProductCollectionParams {
  locationId?: string;
  collectionId?: string;
  name: string;
  slug: string;
  image?: string;
  seo?: GHLCollectionSEO;
}

export interface MCPUpdateProductCollectionParams {
  collectionId: string;
  locationId?: string;
  name?: string;
  slug?: string;
  image?: string;
  seo?: GHLCollectionSEO;
}

export interface MCPListProductCollectionsParams {
  locationId?: string;
  limit?: number;
  offset?: number;
  collectionIds?: string;
  name?: string;
}

export interface MCPGetProductCollectionParams {
  collectionId: string;
}

export interface MCPDeleteProductCollectionParams {
  collectionId: string;
  locationId?: string;
}

// Review MCP Parameters
export interface MCPListProductReviewsParams {
  locationId?: string;
  limit?: number;
  offset?: number;
  sortField?: GHLReviewSortField;
  sortOrder?: GHLSortOrder;
  rating?: number;
  startDate?: string;
  endDate?: string;
  productId?: string;
  storeId?: string;
}

export interface MCPGetReviewsCountParams {
  locationId?: string;
  rating?: number;
  startDate?: string;
  endDate?: string;
  productId?: string;
  storeId?: string;
}

export interface MCPUpdateProductReviewParams {
  reviewId: string;
  locationId?: string;
  productId: string;
  status: string;
  reply?: GHLProductReview[];
  rating?: number;
  headline?: string;
  detail?: string;
}

export interface MCPDeleteProductReviewParams {
  reviewId: string;
  locationId?: string;
  productId: string;
}

export interface MCPBulkUpdateProductReviewsParams {
  locationId?: string;
  reviews: GHLUpdateProductReviewObject[];
  status: any;
}

// =============================================================================
// PAYMENTS API TYPES
// =============================================================================

// Integration Provider Types
export interface CreateWhiteLabelIntegrationProviderDto {
  altId: string;
  altType: 'location';
  uniqueName: string;
  title: string;
  provider: 'authorize-net' | 'nmi';
  description: string;
  imageUrl: string;
}

export interface IntegrationProvider {
  _id: string;
  altId: string;
  altType: string;
  title: string;
  route: string;
  provider: string;
  description: string;
  imageUrl: string;
  createdAt: string;
  updatedAt: string;
}

export interface ListIntegrationProvidersResponse {
  providers: IntegrationProvider[];
}

// Order Types
export interface OrderSource {
  type: 'funnel' | 'website' | 'invoice' | 'calendar' | 'text2Pay' | 'document_contracts' | 'membership' | 'mobile_app' | 'communities' | 'point_of_sale' | 'manual' | 'form' | 'survey' | 'payment_link' | 'external';
  subType?: 'one_step_order_form' | 'two_step_order_form' | 'upsell' | 'tap_to_pay' | 'card_payment' | 'store' | 'contact_view' | 'email_campaign' | 'payments_dashboard' | 'shopify' | 'subscription_view' | 'store_upsell' | 'woocommerce' | 'service' | 'meeting' | 'imported_csv' | 'qr_code';
  id: string;
  name?: string;
  meta?: Record<string, any>;
}

export interface AmountSummary {
  subtotal: number;
  discount?: number;
}

export interface Order {
  _id: string;
  altId: string;
  altType: string;
  contactId?: string;
  contactName?: string;
  contactEmail?: string;
  currency?: string;
  amount?: number;
  subtotal?: number;
  discount?: number;
  status: string;
  liveMode?: boolean;
  totalProducts?: number;
  sourceType?: string;
  sourceName?: string;
  sourceId?: string;
  sourceMeta?: Record<string, any>;
  couponCode?: string;
  createdAt: string;
  updatedAt: string;
  sourceSubType?: string;
  fulfillmentStatus?: string;
  onetimeProducts?: number;
  recurringProducts?: number;
  contactSnapshot?: Record<string, any>;
  amountSummary?: AmountSummary;
  source?: OrderSource;
  items?: string[];
  coupon?: Record<string, any>;
  trackingId?: string;
  fingerprint?: string;
  meta?: Record<string, any>;
  markAsTest?: boolean;
  traceId?: string;
}

export interface ListOrdersResponse {
  data: Order[];
  totalCount: number;
}

// Fulfillment Types
export interface FulfillmentTracking {
  trackingNumber?: string;
  shippingCarrier?: string;
  trackingUrl?: string;
}

export interface FulfillmentItems {
  priceId: string;
  qty: number;
}

export interface CreateFulfillmentDto {
  altId: string;
  altType: 'location';
  trackings: FulfillmentTracking[];
  items: FulfillmentItems[];
  notifyCustomer: boolean;
}

export interface ProductVariantOption {
  id: string;
  name: string;
}

export interface ProductVariant {
  id: string;
  name: string;
  options: ProductVariantOption[];
}

export interface ProductMedia {
  id: string;
  title?: string;
  url: string;
  type: 'image' | 'video';
  isFeatured?: boolean;
  priceIds?: string[][];
}

export interface ProductLabel {
  title: string;
  startDate?: string;
  endDate?: string;
}

export interface ProductSEO {
  title?: string;
  description?: string;
}

export interface DefaultProduct {
  _id: string;
  description?: string;
  variants?: ProductVariant[];
  medias?: ProductMedia[];
  locationId: string;
  name: string;
  productType: string;
  availableInStore?: boolean;
  userId?: string;
  createdAt: string;
  updatedAt: string;
  statementDescriptor?: string;
  image?: string;
  collectionIds?: string[];
  isTaxesEnabled?: boolean;
  taxes?: string[];
  isLabelEnabled?: boolean;
  label?: ProductLabel;
  slug?: string;
  seo?: ProductSEO;
}

export interface MembershipOffer {
  label: string;
  value: string;
  _id: string;
}

export interface Recurring {
  interval: 'day' | 'month' | 'week' | 'year';
  intervalCount: number;
}

export interface DefaultPrice {
  _id: string;
  membershipOffers?: MembershipOffer[];
  variantOptionIds?: string[];
  locationId?: string;
  product?: string;
  userId?: string;
  name: string;
  type: 'one_time' | 'recurring';
  currency: string;
  amount: number;
  recurring?: Recurring;
  createdAt?: string;
  updatedAt?: string;
  compareAtPrice?: number;
  trackInventory?: boolean;
  availableQuantity?: number;
  allowOutOfStockPurchases?: boolean;
}

export interface FulfilledItem {
  _id: string;
  name: string;
  product: DefaultProduct;
  price: DefaultPrice;
  qty: number;
}

export interface Fulfillment {
  altId: string;
  altType: 'location';
  trackings: FulfillmentTracking[];
  _id: string;
  items: FulfilledItem[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateFulfillmentResponse {
  status: boolean;
  data: Fulfillment;
}

export interface ListFulfillmentResponse {
  status: boolean;
  data: Fulfillment[];
}

// Transaction Types
export interface Transaction {
  _id: string;
  altId: string;
  altType: string;
  contactId?: string;
  contactName?: string;
  contactEmail?: string;
  currency?: string;
  amount?: number;
  status: Record<string, any>;
  liveMode?: boolean;
  entityType?: string;
  entityId?: string;
  entitySourceType?: string;
  entitySourceSubType?: string;
  entitySourceName?: string;
  entitySourceId?: string;
  entitySourceMeta?: Record<string, any>;
  subscriptionId?: string;
  chargeId?: string;
  chargeSnapshot?: Record<string, any>;
  paymentProviderType?: string;
  paymentProviderConnectedAccount?: string;
  ipAddress?: string;
  createdAt: string;
  updatedAt: string;
  amountRefunded?: number;
  paymentMethod?: Record<string, any>;
  contactSnapshot?: Record<string, any>;
  entitySource?: OrderSource;
  invoiceId?: string;
  paymentProvider?: Record<string, any>;
  meta?: Record<string, any>;
  markAsTest?: boolean;
  isParent?: boolean;
  receiptId?: string;
  qboSynced?: boolean;
  qboResponse?: Record<string, any>;
  traceId?: string;
}

export interface ListTransactionsResponse {
  data: Transaction[];
  totalCount: number;
}

// Subscription Types
export interface CustomRRuleOptions {
  intervalType: 'yearly' | 'monthly' | 'weekly' | 'daily' | 'hourly' | 'minutely' | 'secondly';
  interval: number;
  startDate: string;
  startTime?: string;
  endDate?: string;
  endTime?: string;
  dayOfMonth?: number;
  dayOfWeek?: 'mo' | 'tu' | 'we' | 'th' | 'fr' | 'sa' | 'su';
  numOfWeek?: number;
  monthOfYear?: 'jan' | 'feb' | 'mar' | 'apr' | 'may' | 'jun' | 'jul' | 'aug' | 'sep' | 'oct' | 'nov' | 'dec';
  count?: number;
  daysBefore?: number;
}

export interface ScheduleOptions {
  executeAt?: string;
  rrule?: CustomRRuleOptions;
}

export interface Subscription {
  _id: string;
  altId: string;
  altType: 'location';
  contactId?: string;
  contactName?: string;
  contactEmail?: string;
  currency?: string;
  amount?: number;
  status: Record<string, any>;
  liveMode?: boolean;
  entityType?: string;
  entityId?: string;
  entitySourceType?: string;
  entitySourceName?: string;
  entitySourceId?: string;
  entitySourceMeta?: Record<string, any>;
  subscriptionId?: string;
  subscriptionSnapshot?: Record<string, any>;
  paymentProviderType?: string;
  paymentProviderConnectedAccount?: string;
  ipAddress?: string;
  createdAt: string;
  updatedAt: string;
  contactSnapshot?: Record<string, any>;
  coupon?: Record<string, any>;
  entitySource?: OrderSource;
  paymentProvider?: Record<string, any>;
  meta?: Record<string, any>;
  markAsTest?: boolean;
  schedule?: ScheduleOptions;
  autoPayment?: Record<string, any>;
  recurringProduct?: Record<string, any>;
  canceledAt?: string;
  canceledBy?: string;
  traceId?: string;
}

export interface ListSubscriptionsResponse {
  data: Subscription[];
  totalCount: number;
}

// Coupon Types
export interface ApplyToFuturePaymentsConfig {
  type: 'forever' | 'fixed';
  duration?: number;
  durationType?: 'months';
}

export interface Coupon {
  _id: string;
  usageCount: number;
  hasAffiliateCoupon?: boolean;
  deleted?: boolean;
  limitPerCustomer: number;
  altId: string;
  altType: string;
  name: string;
  code: string;
  discountType: 'percentage' | 'amount';
  discountValue: number;
  status: 'scheduled' | 'active' | 'expired';
  startDate: string;
  endDate?: string;
  applyToFuturePayments: boolean;
  applyToFuturePaymentsConfig: ApplyToFuturePaymentsConfig;
  userId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ListCouponsResponse {
  data: Coupon[];
  totalCount: number;
  traceId: string;
}

export interface CreateCouponParams {
  altId: string;
  altType: 'location';
  name: string;
  code: string;
  discountType: 'percentage' | 'amount';
  discountValue: number;
  startDate: string;
  endDate?: string;
  usageLimit?: number;
  productIds?: string[];
  applyToFuturePayments?: boolean;
  applyToFuturePaymentsConfig?: ApplyToFuturePaymentsConfig;
  limitPerCustomer?: boolean;
}

export interface UpdateCouponParams extends CreateCouponParams {
  id: string;
}

export interface DeleteCouponParams {
  altId: string;
  altType: 'location';
  id: string;
}

export interface CreateCouponResponse extends Coupon {
  traceId: string;
}

export interface DeleteCouponResponse {
  success: boolean;
  traceId: string;
}

// Custom Provider Types
export interface CreateCustomProviderDto {
  name: string;
  description: string;
  paymentsUrl: string;
  queryUrl: string;
  imageUrl: string;
}

export interface CustomProvider {
  name: string;
  description: string;
  paymentsUrl: string;
  queryUrl: string;
  imageUrl: string;
  _id: string;
  locationId: string;
  marketplaceAppId: string;
  paymentProvider: Record<string, any>;
  deleted: boolean;
  createdAt: string;
  updatedAt: string;
  traceId?: string;
}

export interface CustomProviderKeys {
  apiKey: string;
  publishableKey: string;
}

export interface ConnectCustomProviderConfigDto {
  live: CustomProviderKeys;
  test: CustomProviderKeys;
}

export interface DeleteCustomProviderConfigDto {
  liveMode: boolean;
}

export interface DeleteCustomProviderResponse {
  success: boolean;
}

export interface DisconnectCustomProviderResponse {
  success: boolean;
}

// =============================================================================
// INVOICES API TYPES
// =============================================================================

// Address and Business Details
export interface AddressDto {
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  countryCode?: string;
  postalCode?: string;
}

export interface BusinessDetailsDto {
  logoUrl?: string;
  name?: string;
  phoneNo?: string;
  address?: AddressDto;
  website?: string;
  customValues?: string[];
}

// Contact Details
export interface AdditionalEmailsDto {
  email: string;
}

export interface ContactDetailsDto {
  id: string;
  name: string;
  phoneNo?: string;
  email?: string;
  additionalEmails?: AdditionalEmailsDto[];
  companyName?: string;
  address?: AddressDto;
  customFields?: string[];
}

// Invoice Items and Taxes
export interface ItemTaxDto {
  _id: string;
  name: string;
  rate: number;
  calculation: 'exclusive';
  description?: string;
  taxId?: string;
}

export interface InvoiceItemDto {
  name: string;
  description?: string;
  productId?: string;
  priceId?: string;
  currency: string;
  amount: number;
  qty: number;
  taxes?: ItemTaxDto[];
  automaticTaxCategoryId?: string;
  isSetupFeeItem?: boolean;
  type?: 'one_time' | 'recurring';
  taxInclusive?: boolean;
}

// Discount
export interface DiscountDto {
  value?: number;
  type: 'percentage' | 'fixed';
  validOnProductIds?: string[];
}

// Tips Configuration
export interface TipsConfigurationDto {
  tipsPercentage: string[];
  tipsEnabled: boolean;
}

// Late Fees Configuration
export interface LateFeesFrequencyDto {
  intervalCount?: number;
  interval: 'minute' | 'hour' | 'day' | 'week' | 'month' | 'one_time';
}

export interface LateFeesGraceDto {
  intervalCount: number;
  interval: 'day';
}

export interface LateFeesMaxFeesDto {
  type: 'fixed';
  value: number;
}

export interface LateFeesConfigurationDto {
  enable: boolean;
  value: number;
  type: 'fixed' | 'percentage';
  frequency: LateFeesFrequencyDto;
  grace?: LateFeesGraceDto;
  maxLateFees?: LateFeesMaxFeesDto;
}

// Payment Methods
export interface StripePaymentMethodDto {
  enableBankDebitOnly: boolean;
}

export interface PaymentMethodDto {
  stripe: StripePaymentMethodDto;
}

// Invoice Template Types
export interface CreateInvoiceTemplateDto {
  altId: string;
  altType: 'location';
  internal?: boolean;
  name: string;
  businessDetails: BusinessDetailsDto;
  currency: string;
  items: InvoiceItemDto[];
  automaticTaxesEnabled?: boolean;
  discount?: DiscountDto;
  termsNotes?: string;
  title?: string;
  tipsConfiguration?: TipsConfigurationDto;
  lateFeesConfiguration?: LateFeesConfigurationDto;
  invoiceNumberPrefix?: string;
  paymentMethods?: PaymentMethodDto;
  attachments?: string[];
}

export interface UpdateInvoiceTemplateDto {
  altId: string;
  altType: 'location';
  internal?: boolean;
  name: string;
  businessDetails: BusinessDetailsDto;
  currency: string;
  items: InvoiceItemDto[];
  discount?: DiscountDto;
  termsNotes?: string;
  title?: string;
}

export interface InvoiceTemplate {
  _id: string;
  altId: string;
  altType: string;
  name: string;
  businessDetails: BusinessDetailsDto;
  currency: string;
  discount: DiscountDto;
  items: any[];
  invoiceNumberPrefix?: string;
  total: number;
  createdAt: string;
  updatedAt: string;
}

export interface ListTemplatesResponse {
  data: InvoiceTemplate[];
  totalCount: number;
}

export interface UpdateInvoiceLateFeesConfigurationDto {
  altId: string;
  altType: 'location';
  lateFeesConfiguration: LateFeesConfigurationDto;
}

export interface UpdatePaymentMethodsConfigurationDto {
  altId: string;
  altType: 'location';
  paymentMethods?: PaymentMethodDto;
}

// Schedule Types
export interface CustomRRuleOptionsDto {
  intervalType: 'yearly' | 'monthly' | 'weekly' | 'daily' | 'hourly' | 'minutely' | 'secondly';
  interval: number;
  startDate: string;
  startTime?: string;
  endDate?: string;
  endTime?: string;
  dayOfMonth?: number;
  dayOfWeek?: 'mo' | 'tu' | 'we' | 'th' | 'fr' | 'sa' | 'su';
  numOfWeek?: number;
  monthOfYear?: 'jan' | 'feb' | 'mar' | 'apr' | 'may' | 'jun' | 'jul' | 'aug' | 'sep' | 'oct' | 'nov' | 'dec';
  count?: number;
  daysBefore?: number;
  useStartAsPrimaryUserAccepted?: boolean;
  endType?: string;
}

export interface ScheduleOptionsDto {
  executeAt?: string;
  rrule?: CustomRRuleOptionsDto;
}

export interface AttachmentsDto {
  id: string;
  name: string;
  url: string;
  type: string;
  size: number;
}

export interface CreateInvoiceScheduleDto {
  altId: string;
  altType: 'location';
  name: string;
  contactDetails: ContactDetailsDto;
  schedule: ScheduleOptionsDto;
  liveMode: boolean;
  businessDetails: BusinessDetailsDto;
  currency: string;
  items: InvoiceItemDto[];
  automaticTaxesEnabled?: boolean;
  discount: DiscountDto;
  termsNotes?: string;
  title?: string;
  tipsConfiguration?: TipsConfigurationDto;
  lateFeesConfiguration?: LateFeesConfigurationDto;
  invoiceNumberPrefix?: string;
  paymentMethods?: PaymentMethodDto;
  attachments?: AttachmentsDto[];
}

export interface UpdateInvoiceScheduleDto {
  altId: string;
  altType: 'location';
  name: string;
  contactDetails: ContactDetailsDto;
  schedule: ScheduleOptionsDto;
  liveMode: boolean;
  businessDetails: BusinessDetailsDto;
  currency: string;
  items: InvoiceItemDto[];
  discount: DiscountDto;
  termsNotes?: string;
  title?: string;
  attachments?: AttachmentsDto[];
}

// Auto Payment Details
export interface CardDto {
  brand: string;
  last4: string;
}

export interface USBankAccountDto {
  bank_name: string;
  last4: string;
}

export interface SepaDirectDebitDto {
  bank_code: string;
  last4: string;
  branch_code: string;
}

export interface BacsDirectDebitDto {
  sort_code: string;
  last4: string;
}

export interface BecsDirectDebitDto {
  bsb_number: string;
  last4: string;
}

export interface AutoPaymentDetailsDto {
  enable: boolean;
  type?: string;
  paymentMethodId?: string;
  customerId?: string;
  card?: CardDto;
  usBankAccount?: USBankAccountDto;
  sepaDirectDebit?: SepaDirectDebitDto;
  bacsDirectDebit?: BacsDirectDebitDto;
  becsDirectDebit?: BecsDirectDebitDto;
  cardId?: string;
}

export interface ScheduleInvoiceScheduleDto {
  altId: string;
  altType: 'location';
  liveMode: boolean;
  autoPayment?: AutoPaymentDetailsDto;
}

export interface AutoPaymentScheduleDto {
  altId: string;
  altType: 'location';
  id: string;
  autoPayment: AutoPaymentDetailsDto;
}

export interface CancelInvoiceScheduleDto {
  altId: string;
  altType: 'location';
}

// Invoice Types
export interface DefaultInvoiceResponseDto {
  _id: string;
  status: 'draft' | 'sent' | 'payment_processing' | 'paid' | 'void' | 'partially_paid';
  liveMode: boolean;
  amountPaid: number;
  altId: string;
  altType: string;
  name: string;
  businessDetails: any;
  invoiceNumber: string;
  currency: string;
  contactDetails: any;
  issueDate: string;
  dueDate: string;
  discount: any;
  invoiceItems: any[];
  total: number;
  title: string;
  amountDue: number;
  createdAt: string;
  updatedAt: string;
  automaticTaxesEnabled?: boolean;
  automaticTaxesCalculated?: boolean;
  paymentSchedule?: any;
}

export interface InvoiceSchedule {
  _id: string;
  status: any;
  liveMode: boolean;
  altId: string;
  altType: string;
  name: string;
  schedule?: ScheduleOptionsDto;
  invoices: DefaultInvoiceResponseDto[];
  businessDetails: BusinessDetailsDto;
  currency: string;
  contactDetails: ContactDetailsDto;
  discount: DiscountDto;
  items: any[];
  total: number;
  title: string;
  termsNotes: string;
  compiledTermsNotes: string;
  createdAt: string;
  updatedAt: string;
}

export interface ListSchedulesResponse {
  schedules: InvoiceSchedule[];
  total: number;
}

// Text2Pay Types
export interface SentToDto {
  email: string[];
  emailCc?: string[];
  emailBcc?: string[];
  phoneNo?: string[];
}

export interface PaymentScheduleDto {
  type: 'fixed' | 'percentage';
  schedules: string[];
}

export interface Text2PayDto {
  altId: string;
  altType: 'location';
  name: string;
  currency: string;
  items: InvoiceItemDto[];
  termsNotes?: string;
  title?: string;
  contactDetails: ContactDetailsDto;
  invoiceNumber?: string;
  issueDate: string;
  dueDate?: string;
  sentTo: SentToDto;
  liveMode: boolean;
  automaticTaxesEnabled?: boolean;
  paymentSchedule?: PaymentScheduleDto;
  lateFeesConfiguration?: LateFeesConfigurationDto;
  tipsConfiguration?: TipsConfigurationDto;
  invoiceNumberPrefix?: string;
  paymentMethods?: PaymentMethodDto;
  attachments?: AttachmentsDto[];
  id?: string;
  includeTermsNote?: boolean;
  action: 'draft' | 'send';
  userId: string;
  discount?: DiscountDto;
  businessDetails?: BusinessDetailsDto;
}

export interface Text2PayInvoiceResponseDto {
  invoice: DefaultInvoiceResponseDto;
  invoiceUrl: string;
}

// Invoice Management Types
export interface GenerateInvoiceNumberResponse {
  invoiceNumber: number;
}

export interface CreateInvoiceDto {
  altId: string;
  altType: 'location';
  name: string;
  businessDetails: BusinessDetailsDto;
  currency: string;
  items: InvoiceItemDto[];
  discount: DiscountDto;
  termsNotes?: string;
  title?: string;
  contactDetails: ContactDetailsDto;
  invoiceNumber?: string;
  issueDate: string;
  dueDate?: string;
  sentTo: SentToDto;
  liveMode: boolean;
  automaticTaxesEnabled?: boolean;
  paymentSchedule?: PaymentScheduleDto;
  lateFeesConfiguration?: LateFeesConfigurationDto;
  tipsConfiguration?: TipsConfigurationDto;
  invoiceNumberPrefix?: string;
  paymentMethods?: PaymentMethodDto;
  attachments?: AttachmentsDto[];
}

export interface UpdateInvoiceDto {
  altId: string;
  altType: 'location';
  name: string;
  title?: string;
  currency: string;
  description?: string;
  businessDetails?: BusinessDetailsDto;
  invoiceNumber?: string;
  contactId?: string;
  contactDetails?: ContactDetailsDto;
  termsNotes?: string;
  discount?: DiscountDto;
  invoiceItems: InvoiceItemDto[];
  automaticTaxesEnabled?: boolean;
  liveMode?: boolean;
  issueDate: string;
  dueDate: string;
  paymentSchedule?: PaymentScheduleDto;
  tipsConfiguration?: TipsConfigurationDto;
  xeroDetails?: any;
  invoiceNumberPrefix?: string;
  paymentMethods?: PaymentMethodDto;
  attachments?: AttachmentsDto[];
}

export interface VoidInvoiceDto {
  altId: string;
  altType: 'location';
}

export interface InvoiceSettingsSenderConfigurationDto {
  fromName?: string;
  fromEmail?: string;
}

export interface SendInvoiceDto {
  altId: string;
  altType: 'location';
  userId: string;
  action: 'sms_and_email' | 'send_manually' | 'email' | 'sms';
  liveMode: boolean;
  sentFrom?: InvoiceSettingsSenderConfigurationDto;
  autoPayment?: AutoPaymentDetailsDto;
}

export interface SendInvoicesResponseDto {
  invoice: DefaultInvoiceResponseDto;
  smsData: any;
  emailData: any;
}

// Record Payment Types
export interface ChequeDto {
  number: string;
}

export interface RecordPaymentDto {
  altId: string;
  altType: 'location';
  mode: 'cash' | 'card' | 'cheque' | 'bank_transfer' | 'other';
  card: CardDto;
  cheque: ChequeDto;
  notes: string;
  amount?: number;
  meta?: any;
  paymentScheduleIds?: string[];
}

export interface RecordPaymentResponseDto {
  success: boolean;
  invoice: DefaultInvoiceResponseDto;
}

// Invoice Stats Types
export interface PatchInvoiceStatsLastViewedDto {
  invoiceId: string;
}

// Estimate Types
export interface SendEstimateDto {
  altId: string;
  altType: 'location';
  action: 'sms_and_email' | 'send_manually' | 'email' | 'sms';
  liveMode: boolean;
  userId: string;
  sentFrom?: InvoiceSettingsSenderConfigurationDto;
  estimateName?: string;
}

export interface FrequencySettingsDto {
  enabled: boolean;
  schedule?: ScheduleOptionsDto;
}

export interface AutoInvoicingDto {
  enabled: boolean;
  directPayments?: boolean;
}

export interface CreateEstimatesDto {
  altId: string;
  altType: 'location';
  name: string;
  businessDetails: BusinessDetailsDto;
  currency: string;
  items: InvoiceItemDto[];
  liveMode?: boolean;
  discount: DiscountDto;
  termsNotes?: string;
  title?: string;
  contactDetails: ContactDetailsDto;
  estimateNumber?: number;
  issueDate?: string;
  expiryDate?: string;
  sentTo?: SentToDto;
  automaticTaxesEnabled?: boolean;
  meta?: any;
  sendEstimateDetails?: SendEstimateDto;
  frequencySettings: FrequencySettingsDto;
  estimateNumberPrefix?: string;
  userId?: string;
  attachments?: AttachmentsDto[];
  autoInvoice?: AutoInvoicingDto;
}

export interface UpdateEstimateDto {
  altId: string;
  altType: 'location';
  name: string;
  businessDetails: BusinessDetailsDto;
  currency: string;
  items: InvoiceItemDto[];
  liveMode?: boolean;
  discount: DiscountDto;
  termsNotes?: string;
  title?: string;
  contactDetails: ContactDetailsDto;
  estimateNumber?: number;
  issueDate?: string;
  expiryDate?: string;
  sentTo?: SentToDto;
  automaticTaxesEnabled?: boolean;
  meta?: any;
  sendEstimateDetails?: SendEstimateDto;
  frequencySettings: FrequencySettingsDto;
  estimateNumberPrefix?: string;
  userId?: string;
  attachments?: AttachmentsDto[];
  autoInvoice?: AutoInvoicingDto;
  estimateStatus?: 'all' | 'draft' | 'sent' | 'accepted' | 'declined' | 'invoiced' | 'viewed';
}

export interface EstimateResponseDto {
  altId: string;
  altType: string;
  _id: string;
  liveMode: boolean;
  deleted: boolean;
  name: string;
  currency: string;
  businessDetails: any;
  items: any[];
  discount: DiscountDto;
  title: string;
  estimateNumberPrefix?: string;
  attachments?: AttachmentsDto[];
  updatedBy?: string;
  total: number;
  createdAt: string;
  updatedAt: string;
  __v: number;
  automaticTaxesEnabled: boolean;
  termsNotes?: string;
  companyId?: string;
  contactDetails?: any;
  issueDate?: string;
  expiryDate?: string;
  sentBy?: string;
  automaticTaxesCalculated?: boolean;
  meta?: any;
  estimateActionHistory?: string[];
  sentTo?: any;
  frequencySettings?: FrequencySettingsDto;
  lastVisitedAt?: string;
  totalamountInUSD?: number;
  autoInvoice?: any;
  traceId?: string;
}

export interface GenerateEstimateNumberResponse {
  estimateNumber: number;
  traceId: string;
}

export interface AltDto {
  altId: string;
  altType: 'location';
}

export interface CreateInvoiceFromEstimateDto {
  altId: string;
  altType: 'location';
  markAsInvoiced: boolean;
  version?: 'v1' | 'v2';
}

export interface CreateInvoiceFromEstimateResponseDto {
  estimate: EstimateResponseDto;
  invoice: DefaultInvoiceResponseDto;
}

export interface ListEstimatesResponseDto {
  estimates: string[];
  total: number;
  traceId: string;
}

export interface EstimateIdParam {
  estimateId: string;
}

// Estimate Template Types
export interface EstimateTemplatesDto {
  altId: string;
  altType: 'location';
  name: string;
  businessDetails: BusinessDetailsDto;
  currency: string;
  items: any[];
  liveMode?: boolean;
  discount: DiscountDto;
  termsNotes?: string;
  title?: string;
  automaticTaxesEnabled?: boolean;
  meta?: any;
  sendEstimateDetails?: SendEstimateDto;
  estimateNumberPrefix?: string;
  attachments?: AttachmentsDto[];
}

export interface EstimateTemplateResponseDto {
  altId: string;
  altType: string;
  _id: string;
  liveMode: boolean;
  deleted: boolean;
  name: string;
  currency: string;
  businessDetails: any;
  items: any[];
  discount: DiscountDto;
  title: string;
  estimateNumberPrefix?: string;
  attachments?: AttachmentsDto[];
  updatedBy?: string;
  total: number;
  createdAt: string;
  updatedAt: string;
  __v: number;
  automaticTaxesEnabled: boolean;
  termsNotes?: string;
}

export interface ListEstimateTemplateResponseDto {
  data: string[];
  totalCount: number;
  traceId: string;
}

// Invoice List Types
export interface TotalSummaryDto {
  subTotal: number;
  discount: number;
  tax: number;
}

export interface ReminderDto {
  enabled: boolean;
  emailTemplate: string;
  smsTemplate: string;
  emailSubject: string;
  reminderId: string;
  reminderName: string;
  reminderTime: 'before' | 'after';
  intervalType: 'yearly' | 'monthly' | 'weekly' | 'daily' | 'hourly' | 'minutely' | 'secondly';
  maxReminders: number;
  reminderInvoiceCondition: 'invoice_sent' | 'invoice_overdue';
  reminderNumber: number;
  startTime?: string;
  endTime?: string;
  timezone?: string;
}

export interface ReminderSettingsDto {
  defaultEmailTemplateId: string;
  reminders: ReminderDto[];
}

export interface RemindersConfigurationDto {
  reminderExecutionDetailsList: any;
  reminderSettings: ReminderSettingsDto;
}

export interface GetInvoiceResponseDto {
  _id: string;
  status: 'draft' | 'sent' | 'payment_processing' | 'paid' | 'void' | 'partially_paid';
  liveMode: boolean;
  amountPaid: number;
  altId: string;
  altType: string;
  name: string;
  businessDetails: any;
  invoiceNumber: string;
  currency: string;
  contactDetails: any;
  issueDate: string;
  dueDate: string;
  discount: any;
  invoiceItems: any[];
  total: number;
  title: string;
  amountDue: number;
  createdAt: string;
  updatedAt: string;
  automaticTaxesEnabled?: boolean;
  automaticTaxesCalculated?: boolean;
  paymentSchedule?: any;
  totalSummary: TotalSummaryDto;
  remindersConfiguration?: RemindersConfigurationDto;
}

export interface ListInvoicesResponseDto {
  invoices: GetInvoiceResponseDto[];
  total: number;
}

// Response Types that extend base types
export interface CreateInvoiceTemplateResponseDto extends InvoiceTemplate {}
export interface UpdateInvoiceTemplateResponseDto extends InvoiceTemplate {}
export interface DeleteInvoiceTemplateResponseDto {
  success: boolean;
}

export interface CreateInvoiceScheduleResponseDto extends InvoiceSchedule {}
export interface UpdateInvoiceScheduleResponseDto extends InvoiceSchedule {}
export interface GetScheduleResponseDto extends InvoiceSchedule {}
export interface UpdateAndScheduleInvoiceScheduleResponseDto extends InvoiceSchedule {}
export interface ScheduleInvoiceScheduleResponseDto extends InvoiceSchedule {}
export interface AutoPaymentInvoiceScheduleResponseDto extends InvoiceSchedule {}
export interface CancelInvoiceScheduleResponseDto extends InvoiceSchedule {}
export interface DeleteInvoiceScheduleResponseDto {
  success: boolean;
}

export interface CreateInvoiceResponseDto extends DefaultInvoiceResponseDto {}
export interface UpdateInvoiceResponseDto extends DefaultInvoiceResponseDto {}
export interface DeleteInvoiceResponseDto extends DefaultInvoiceResponseDto {}
export interface VoidInvoiceResponseDto extends DefaultInvoiceResponseDto {}
