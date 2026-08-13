/**
 * GoHighLevel API Client
 * Implements hand-written GHL endpoints with request-time version routing from
 * the locked v2/v3 OpenAPI source set.
 */

import axios, { AxiosInstance, AxiosResponse, AxiosError, AxiosRequestConfig } from 'axios';
import {
  GHLConfig,
  GHLContact,
  GHLCreateContactRequest,
  GHLSearchContactsRequest,
  GHLSearchContactsResponse,
  GHLContactTagsRequest,
  GHLContactTagsResponse,
  GHLApiResponse,
  GHLErrorResponse,
  GHLTask,
  GHLNote,
  // Conversation types
  GHLConversation,
  GHLMessage,
  GHLSendMessageRequest,
  GHLSendMessageResponse,
  GHLSearchConversationsRequest,
  GHLSearchConversationsResponse,
  GHLGetMessagesResponse,
  GHLCreateConversationRequest,
  GHLCreateConversationResponse,
  GHLUpdateConversationRequest,
  // Blog types
  GHLBlogPost,
  GHLCreateBlogPostRequest,
  GHLUpdateBlogPostRequest,
  GHLBlogPostCreateResponse,
  GHLBlogPostUpdateResponse,
  GHLBlogPostListResponse,
  GHLBlogAuthor,
  GHLBlogAuthorsResponse,
  GHLBlogCategory,
  GHLBlogCategoriesResponse,
  GHLBlogSite,
  GHLBlogSitesResponse,
  GHLUrlSlugCheckResponse,
  GHLGetBlogPostsRequest,
  GHLGetBlogAuthorsRequest,
  GHLGetBlogCategoriesRequest,
  GHLGetBlogSitesRequest,
  GHLCheckUrlSlugRequest,
  GHLSearchOpportunitiesRequest,
  GHLSearchOpportunitiesResponse,
  GHLGetPipelinesResponse,
  GHLOpportunity,
  GHLCreateOpportunityRequest,
  GHLUpdateOpportunityRequest,
  GHLOpportunityStatus,
  GHLUpdateOpportunityStatusRequest,
  GHLUpsertOpportunityRequest,
  GHLUpsertOpportunityResponse,
  GHLGetCalendarGroupsResponse,
  GHLCreateCalendarGroupRequest,
  GHLCalendarGroup,
  GHLGetCalendarsResponse,
  GHLCreateCalendarRequest,
  GHLCalendar,
  GHLUpdateCalendarRequest,
  GHLGetCalendarEventsRequest,
  GHLGetCalendarEventsResponse,
  GHLGetFreeSlotsRequest,
  GHLGetFreeSlotsResponse,
  GHLCreateAppointmentRequest,
  GHLCalendarEvent,
  GHLUpdateAppointmentRequest,
  GHLCreateBlockSlotRequest,
  GHLBlockSlotResponse,
  GHLUpdateBlockSlotRequest,
  GHLEmailCampaignsResponse,
  MCPGetEmailCampaignsParams,
  MCPCreateEmailTemplateParams,
  MCPGetEmailTemplatesParams,
  MCPUpdateEmailTemplateParams,
  MCPDeleteEmailTemplateParams,
  GHLEmailTemplate,
  // Location types
  GHLLocationSearchResponse,
  GHLLocationDetailsResponse,
  GHLLocationDetailed,
  GHLCreateLocationRequest,
  GHLUpdateLocationRequest,
  GHLLocationDeleteResponse,
  GHLLocationTagsResponse,
  GHLLocationTagResponse,
  GHLLocationTagRequest,
  GHLLocationTagDeleteResponse,
  GHLLocationTaskSearchRequest,
  GHLLocationTaskSearchResponse,
  GHLLocationCustomFieldsResponse,
  GHLLocationCustomFieldResponse,
  GHLCreateCustomFieldRequest,
  GHLUpdateCustomFieldRequest,
  GHLCustomFieldDeleteResponse,
  GHLFileUploadRequest,
  GHLFileUploadResponse,
  GHLLocationCustomValuesResponse,
  GHLLocationCustomValueResponse,
  GHLCustomValueRequest,
  GHLCustomValueDeleteResponse,
  GHLLocationTemplatesResponse,
  // Email ISV types
  GHLEmailVerificationRequest,
  GHLEmailVerificationResponse,
  // Additional Contact types
  GHLAppointment,
  GHLUpsertContactResponse,
  GHLBulkTagsResponse,
  GHLBulkBusinessResponse,
  GHLFollowersResponse,
  GHLCampaign,
  GHLWorkflow,
  // Additional Conversation/Message types
  GHLEmailMessage,
  GHLProcessInboundMessageRequest,
  GHLProcessOutboundMessageRequest,
  GHLProcessMessageResponse,
  GHLCancelScheduledResponse,
  GHLMessageRecordingResponse,
  GHLMessageTranscription,
  GHLMessageTranscriptionResponse,
  GHLLiveChatTypingRequest,
  GHLLiveChatTypingResponse,
  GHLUploadFilesRequest,
  GHLUploadFilesResponse,
  GHLUpdateMessageStatusRequest,
  // Social Media Posting API types
  GHLSocialPlatform,
  GHLSearchPostsRequest,
  GHLSearchPostsResponse,
  GHLCreatePostRequest,
  GHLCreatePostResponse,
  GHLUpdatePostRequest,
  GHLGetPostResponse,
  GHLBulkDeletePostsRequest,
  GHLBulkDeleteResponse,
  GHLGetAccountsResponse,
  GHLUploadCSVRequest,
  GHLUploadCSVResponse,
  GHLGetUploadStatusResponse,
  GHLSetAccountsRequest,
  GHLCSVFinalizeRequest,
  GHLGetCategoriesResponse,
  GHLGetCategoryResponse,
  GHLGetTagsResponse,
  GHLGetTagsByIdsRequest,
  GHLGetTagsByIdsResponse,
  GHLOAuthStartResponse,
  GHLGetGoogleLocationsResponse,
  GHLAttachGMBLocationRequest,
  GHLGetFacebookPagesResponse,
  GHLAttachFBAccountRequest,
  GHLGetInstagramAccountsResponse,
  GHLAttachIGAccountRequest,
  GHLGetLinkedInAccountsResponse,
  GHLAttachLinkedInAccountRequest,
  GHLGetTwitterAccountsResponse,
  GHLAttachTwitterAccountRequest,
  GHLGetTikTokAccountsResponse,
  GHLAttachTikTokAccountRequest,
  GHLCSVImport,
  GHLSocialPost,
  GHLSocialAccount,
  GHLValidateGroupSlugResponse,
  GHLGroupSuccessResponse,
  GHLGroupStatusUpdateRequest,
  GHLUpdateCalendarGroupRequest,
  GHLGetAppointmentNotesResponse,
  GHLCreateAppointmentNoteRequest,
  GHLAppointmentNoteResponse,
  GHLUpdateAppointmentNoteRequest,
  GHLDeleteAppointmentNoteResponse,
  GHLCalendarResource,
  GHLCreateCalendarResourceRequest,
  GHLCalendarResourceResponse,
  GHLCalendarResourceByIdResponse,
  GHLUpdateCalendarResourceRequest,
  GHLResourceDeleteResponse,
  GHLCalendarNotification,
  GHLCreateCalendarNotificationRequest,
  GHLUpdateCalendarNotificationRequest,
  GHLCalendarNotificationDeleteResponse,
  GHLGetCalendarNotificationsRequest,
  GHLGetBlockedSlotsRequest,
  GHLGetMediaFilesRequest,
  GHLGetMediaFilesResponse,
  GHLUploadMediaFileRequest,
  GHLUploadMediaFileResponse,
  GHLDeleteMediaRequest,
  GHLDeleteMediaResponse,
  // Custom Objects API types
  GHLGetObjectSchemaRequest,
  GHLGetObjectSchemaResponse,
  GHLObjectListResponse,
  GHLCreateObjectSchemaRequest,
  GHLObjectSchemaResponse,
  GHLUpdateObjectSchemaRequest,
  GHLCreateObjectRecordRequest,
  GHLObjectRecordResponse,
  GHLDetailedObjectRecordResponse,
  GHLUpdateObjectRecordRequest,
  GHLObjectRecordDeleteResponse,
  GHLSearchObjectRecordsRequest,
  GHLSearchObjectRecordsResponse,
  // Associations API types
  GHLAssociation,
  GHLRelation,
  GHLCreateAssociationRequest,
  GHLUpdateAssociationRequest,
  GHLCreateRelationRequest,
  GHLGetAssociationsRequest,
  GHLGetRelationsByRecordRequest,
  GHLGetAssociationByKeyRequest,
  GHLGetAssociationByObjectKeyRequest,
  GHLDeleteRelationRequest,
  GHLAssociationResponse,
  GHLDeleteAssociationResponse,
  GHLGetAssociationsResponse,
  GHLGetRelationsResponse,
  // Custom Fields V2 API types
  GHLV2CustomField,
  GHLV2CustomFieldFolder,
  GHLV2CreateCustomFieldRequest,
  GHLV2UpdateCustomFieldRequest,
  GHLV2CreateCustomFieldFolderRequest,
  GHLV2UpdateCustomFieldFolderRequest,
  GHLV2GetCustomFieldsByObjectKeyRequest,
  GHLV2DeleteCustomFieldFolderRequest,
  GHLV2CustomFieldResponse,
  GHLV2CustomFieldsResponse,
  GHLV2CustomFieldFolderResponse,
  GHLV2DeleteCustomFieldResponse,
  // Workflows API types
  GHLGetWorkflowsRequest,
  GHLGetWorkflowsResponse,
  // Surveys API types
  GHLGetSurveysRequest,
  GHLGetSurveysResponse,
  GHLGetSurveySubmissionsRequest,
  GHLGetSurveySubmissionsResponse,
  // Store API types
  GHLCreateShippingZoneRequest,
  GHLCreateShippingZoneResponse,
  GHLListShippingZonesResponse,
  GHLGetShippingZonesRequest,
  GHLGetShippingZoneResponse,
  GHLUpdateShippingZoneRequest,
  GHLUpdateShippingZoneResponse,
  GHLDeleteShippingZoneRequest,
  GHLDeleteShippingZoneResponse,
  GHLGetAvailableShippingRatesRequest,
  GHLGetAvailableShippingRatesResponse,
  GHLCreateShippingRateRequest,
  GHLCreateShippingRateResponse,
  GHLListShippingRatesResponse,
  GHLGetShippingRatesRequest,
  GHLGetShippingRateResponse,
  GHLUpdateShippingRateRequest,
  GHLUpdateShippingRateResponse,
  GHLDeleteShippingRateRequest,
  GHLDeleteShippingRateResponse,
  GHLCreateShippingCarrierRequest,
  GHLCreateShippingCarrierResponse,
  GHLListShippingCarriersResponse,
  GHLGetShippingCarriersRequest,
  GHLGetShippingCarrierResponse,
  GHLUpdateShippingCarrierRequest,
  GHLUpdateShippingCarrierResponse,
  GHLDeleteShippingCarrierRequest,
  GHLDeleteShippingCarrierResponse,
  GHLCreateStoreSettingRequest,
  GHLCreateStoreSettingResponse,
  GHLGetStoreSettingRequest,
  GHLGetStoreSettingResponse,
  GHLCreateProductRequest,
  GHLCreateProductResponse,
  GHLUpdateProductRequest,
  GHLUpdateProductResponse,
  GHLGetProductRequest,
  GHLGetProductResponse,
  GHLListProductsRequest,
  GHLListProductsResponse,
  GHLDeleteProductRequest,
  GHLDeleteProductResponse,
  GHLBulkUpdateRequest,
  GHLBulkUpdateResponse,
  GHLCreatePriceRequest,
  GHLCreatePriceResponse,
  GHLUpdatePriceRequest,
  GHLUpdatePriceResponse,
  GHLGetPriceRequest,
  GHLGetPriceResponse,
  GHLListPricesRequest,
  GHLListPricesResponse,
  GHLDeletePriceRequest,
  GHLDeletePriceResponse,
  GHLListInventoryRequest,
  GHLListInventoryResponse,
  GHLUpdateInventoryRequest,
  GHLUpdateInventoryResponse,
  GHLGetProductStoreStatsRequest,
  GHLGetProductStoreStatsResponse,
  GHLUpdateProductStoreRequest,
  GHLUpdateProductStoreResponse,
  GHLCreateProductCollectionRequest,
  GHLCreateCollectionResponse,
  GHLUpdateProductCollectionRequest,
  GHLUpdateProductCollectionResponse,
  GHLGetProductCollectionRequest,
  GHLDefaultCollectionResponse,
  GHLListProductCollectionsRequest,
  GHLListCollectionResponse,
  GHLDeleteProductCollectionRequest,
  GHLDeleteProductCollectionResponse,
  GHLListProductReviewsRequest,
  GHLListProductReviewsResponse,
  GHLGetReviewsCountRequest,
  GHLCountReviewsByStatusResponse,
  GHLUpdateProductReviewRequest,
  GHLUpdateProductReviewsResponse,
  GHLDeleteProductReviewRequest,
  GHLDeleteProductReviewResponse,
  GHLBulkUpdateProductReviewsRequest,
  // Invoice API types
  CreateInvoiceTemplateDto,
  CreateInvoiceTemplateResponseDto,
  UpdateInvoiceTemplateDto,
  UpdateInvoiceTemplateResponseDto,
  DeleteInvoiceTemplateResponseDto,
  ListTemplatesResponse,
  InvoiceTemplate,
  UpdateInvoiceLateFeesConfigurationDto,
  UpdatePaymentMethodsConfigurationDto,
  CreateInvoiceScheduleDto,
  CreateInvoiceScheduleResponseDto,
  UpdateInvoiceScheduleDto,
  UpdateInvoiceScheduleResponseDto,
  DeleteInvoiceScheduleResponseDto,
  ListSchedulesResponse,
  GetScheduleResponseDto,
  ScheduleInvoiceScheduleDto,
  ScheduleInvoiceScheduleResponseDto,
  AutoPaymentScheduleDto,
  AutoPaymentInvoiceScheduleResponseDto,
  CancelInvoiceScheduleDto,
  CancelInvoiceScheduleResponseDto,
  UpdateAndScheduleInvoiceScheduleResponseDto,
  Text2PayDto,
  Text2PayInvoiceResponseDto,
  GenerateInvoiceNumberResponse,
  GetInvoiceResponseDto,
  UpdateInvoiceDto,
  UpdateInvoiceResponseDto,
  DeleteInvoiceResponseDto,
  VoidInvoiceDto,
  VoidInvoiceResponseDto,
  SendInvoiceDto,
  SendInvoicesResponseDto,
  RecordPaymentDto,
  RecordPaymentResponseDto,
  PatchInvoiceStatsLastViewedDto,
  CreateEstimatesDto,
  EstimateResponseDto,
  UpdateEstimateDto,
  GenerateEstimateNumberResponse,
  SendEstimateDto,
  CreateInvoiceFromEstimateDto,
  CreateInvoiceFromEstimateResponseDto,
  ListEstimatesResponseDto,
  EstimateIdParam,
  ListEstimateTemplateResponseDto,
  EstimateTemplatesDto,
  EstimateTemplateResponseDto,
  CreateInvoiceDto,
  CreateInvoiceResponseDto,
  ListInvoicesResponseDto,
  AltDto
} from '../types/ghl-types.js';
import { resolveVersion } from './version-router.js';
import { resolveRequestVersion } from './endpoint-version-resolver.js';

/**
 * GoHighLevel API Client
 * Handles all API communication with GHL services
 */
export class GHLApiClient {
  private axiosInstance: AxiosInstance;
  private config: GHLConfig;

  constructor(config: GHLConfig) {
    this.config = {
      ...config,
      // Normalize inconsistent combinations (notably an existing
      // GHL_API_VERSION=v3 alongside GHL_API_GENERATION=v2) at the client
      // boundary so no request can inherit a named-v3 fallback in legacy mode.
      version: resolveVersion([], config.apiGeneration, config.version),
    };
    
    // Create axios instance with base configuration
    this.axiosInstance = axios.create({
      baseURL: this.config.baseUrl,
      headers: {
        'Authorization': `Bearer ${this.config.accessToken}`,
        'Version': this.config.version,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      timeout: 30000 // 30 second timeout
    });

    // Add request interceptor for logging
    this.axiosInstance.interceptors.request.use(
      (config) => {
        const requestFallback = typeof config.headers?.get === 'function'
          ? config.headers.get('Version')
          : config.headers?.Version;
        const version = resolveRequestVersion(
          config.method,
          config.url,
          this.config.apiGeneration,
          typeof requestFallback === 'string' ? requestFallback : this.config.version,
        );
        if (typeof config.headers?.set === 'function') {
          config.headers.set('Version', version);
        } else if (config.headers) {
          config.headers.Version = version;
        }
        process.stderr.write(`[GHL API] ${config.method?.toUpperCase()} ${config.url}\n`);
        return config;
      },
      (error) => {
        console.error('[GHL API] Request error:', error);
        return Promise.reject(error);
      }
    );

    // Add response interceptor for error handling
    this.axiosInstance.interceptors.response.use(
      (response) => {
        process.stderr.write(`[GHL API] Response ${response.status}: ${response.config.url}\n`);
        return response;
      },
      (error: AxiosError<GHLErrorResponse>) => {
        console.error('[GHL API] Response error:', {
          status: error.response?.status,
          message: error.response?.data?.message,
          url: error.config?.url
        });
        return Promise.reject(this.handleApiError(error));
      }
    );
  }

  /**
   * Handle API errors and convert to standardized format
   */
  private handleApiError(error: AxiosError<GHLErrorResponse>): Error {
    const status = error.response?.status || 500;
    const message = error.response?.data?.message || error.message || 'Unknown error';
    const errorMessage = Array.isArray(message) ? message.join(', ') : message;
    
    return new Error(`GHL API Error (${status}): ${errorMessage}`);
  }

  /**
   * Wrap API responses in standardized format
   */
  private wrapResponse<T>(data: T): GHLApiResponse<T> {
    return {
      success: true,
      data
    };
  }

  /**
   * Create custom headers for different API versions
   */
  private getConversationHeaders() {
    return {
      'Authorization': `Bearer ${this.config.accessToken}`,
      'Version': resolveVersion(
        ['v3', '2021-04-15'],
        this.config.apiGeneration,
        this.config.version
      ),
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    };
  }

  /**
   * Returns an axios request config that sends the named `v3` Version header
   * when the client is in v3 generation mode and the legacy `2021-07-28`
   * header in v2 mode. Returning an explicit header keeps compatibility mode
   * safe even when a caller supplied an inconsistent global fallback.
   *
   * Used by hand-written methods for modules that migrated to v3
   * (contacts, opportunities, oauth, emails, brand-boards, saas, email-isv).
   */
  private v3Config(): { headers: { Version: string } } {
    return {
      headers: {
        Version: resolveVersion(
          ['v3', '2021-07-28'],
          this.config.apiGeneration,
          this.config.version
        )
      }
    };
  }

  /**
   * CONTACTS API METHODS
   */

  /**
   * Create a new contact
   * POST /contacts/  (v3 uses the named `v3` Version header)
   */
  async createContact(contactData: GHLCreateContactRequest): Promise<GHLApiResponse<GHLContact>> {
    try {
      // Ensure locationId is set
      const payload = {
        ...contactData,
        locationId: contactData.locationId || this.config.locationId
      };

      const response: AxiosResponse<{ contact: GHLContact }> = await this.axiosInstance.post(
        '/contacts/',
        payload,
        this.v3Config()
      );

      return this.wrapResponse(response.data.contact);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get contact by ID
   * GET /contacts/{contactId}  (v3)
   */
  async getContact(contactId: string): Promise<GHLApiResponse<GHLContact>> {
    try {
      const response: AxiosResponse<{ contact: GHLContact }> = await this.axiosInstance.get(
        `/contacts/${contactId}`,
        this.v3Config()
      );

      return this.wrapResponse(response.data.contact);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Update existing contact
   * PUT /contacts/{contactId}  (v3)
   */
  async updateContact(contactId: string, updates: Partial<GHLCreateContactRequest>): Promise<GHLApiResponse<GHLContact>> {
    try {
      const response: AxiosResponse<{ contact: GHLContact; succeded: boolean }> = await this.axiosInstance.put(
        `/contacts/${contactId}`,
        updates,
        this.v3Config()
      );

      return this.wrapResponse(response.data.contact);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Delete contact
   * DELETE /contacts/{contactId}  (v3)
   */
  async deleteContact(contactId: string): Promise<GHLApiResponse<{ succeded: boolean }>> {
    try {
      const response: AxiosResponse<{ succeded: boolean }> = await this.axiosInstance.delete(
        `/contacts/${contactId}`,
        this.v3Config()
      );

      return this.wrapResponse(response.data);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Search contacts with advanced filters
   * POST /contacts/search
   */
  async searchContacts(searchParams: GHLSearchContactsRequest): Promise<GHLApiResponse<GHLSearchContactsResponse>> {
    try {
      // Build minimal request body with only required/supported parameters
      // Start with just locationId and pageLimit as per API requirements
      const payload: any = {
        locationId: searchParams.locationId || this.config.locationId,
        pageLimit: searchParams.limit || 25
      };

      // Only add optional parameters if they have valid values
      if (searchParams.query && searchParams.query.trim()) {
        payload.query = searchParams.query.trim();
      }

      if (searchParams.startAfterId && searchParams.startAfterId.trim()) {
        payload.startAfterId = searchParams.startAfterId.trim();
      }

      if (searchParams.startAfter && typeof searchParams.startAfter === 'number') {
        payload.startAfter = searchParams.startAfter;
      }

      // Only add filters if we have valid filter values
      if (searchParams.filters) {
        const filters: any = {};
        let hasFilters = false;

        if (searchParams.filters.email && typeof searchParams.filters.email === 'string' && searchParams.filters.email.trim()) {
          filters.email = searchParams.filters.email.trim();
          hasFilters = true;
        }
        
        if (searchParams.filters.phone && typeof searchParams.filters.phone === 'string' && searchParams.filters.phone.trim()) {
          filters.phone = searchParams.filters.phone.trim();
          hasFilters = true;
        }

        if (searchParams.filters.tags && Array.isArray(searchParams.filters.tags) && searchParams.filters.tags.length > 0) {
          filters.tags = searchParams.filters.tags;
          hasFilters = true;
        }

        if (searchParams.filters.dateAdded && typeof searchParams.filters.dateAdded === 'object') {
          filters.dateAdded = searchParams.filters.dateAdded;
          hasFilters = true;
        }

        // Only add filters object if we have actual filters
        if (hasFilters) {
          payload.filters = filters;
        }
      }

      process.stderr.write(`[GHL API] Search contacts payload: ${JSON.stringify(payload, null, 2)}\n`);

      const response: AxiosResponse<GHLSearchContactsResponse> = await this.axiosInstance.post(
        '/contacts/search',
        payload
      );

      return this.wrapResponse(response.data);
    } catch (error) {
      const axiosError = error as AxiosError<GHLErrorResponse>;
      process.stderr.write(`[GHL API] Search contacts error: ${JSON.stringify({
        status: axiosError.response?.status,
        statusText: axiosError.response?.statusText,
        data: axiosError.response?.data,
        message: axiosError.message
      }, null, 2)}\n`);
      
      const handledError = this.handleApiError(axiosError);
      return {
        success: false,
        error: {
          message: handledError.message,
          statusCode: axiosError.response?.status || 500,
          details: axiosError.response?.data
        }
      };
    }
  }

  /**
   * Get duplicate contact by email or phone
   * GET /contacts/search/duplicate
   */
  async getDuplicateContact(email?: string, phone?: string): Promise<GHLApiResponse<GHLContact | null>> {
    try {
      const params: any = {
        locationId: this.config.locationId
      };

      if (email) params.email = encodeURIComponent(email);
      if (phone) params.number = encodeURIComponent(phone);

      const response: AxiosResponse<{ contact?: GHLContact }> = await this.axiosInstance.get(
        '/contacts/search/duplicate',
        { params }
      );

      return this.wrapResponse(response.data.contact || null);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Add tags to contact
   * POST /contacts/{contactId}/tags
   */
  async addContactTags(contactId: string, tags: string[]): Promise<GHLApiResponse<GHLContactTagsResponse>> {
    try {
      const payload: GHLContactTagsRequest = { tags };
      
      const response: AxiosResponse<GHLContactTagsResponse> = await this.axiosInstance.post(
        `/contacts/${contactId}/tags`,
        payload
      );

      return this.wrapResponse(response.data);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Remove tags from contact
   * DELETE /contacts/{contactId}/tags
   */
  async removeContactTags(contactId: string, tags: string[]): Promise<GHLApiResponse<GHLContactTagsResponse>> {
    try {
      const payload: GHLContactTagsRequest = { tags };
      
      const response: AxiosResponse<GHLContactTagsResponse> = await this.axiosInstance.delete(
        `/contacts/${contactId}/tags`,
        { data: payload }
      );

      return this.wrapResponse(response.data);
    } catch (error) {
      throw error;
    }
  }

  /**
   * CONVERSATIONS API METHODS
   */

  /**
   * Search conversations with filters
   * GET /conversations/search
   */
  async searchConversations(searchParams: GHLSearchConversationsRequest): Promise<GHLApiResponse<GHLSearchConversationsResponse>> {
    try {
      // Ensure locationId is set
      const params = {
        ...searchParams,
        locationId: searchParams.locationId || this.config.locationId
      };

      const response: AxiosResponse<GHLSearchConversationsResponse> = await this.axiosInstance.get(
        '/conversations/search',
        { 
          params,
          headers: this.getConversationHeaders()
        }
      );

      return this.wrapResponse(response.data);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get conversation by ID
   * GET /conversations/{conversationId}
   */
  async getConversation(conversationId: string): Promise<GHLApiResponse<GHLConversation>> {
    try {
      const response: AxiosResponse<GHLConversation> = await this.axiosInstance.get(
        `/conversations/${conversationId}`,
        { headers: this.getConversationHeaders() }
      );

      return this.wrapResponse(response.data);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Create a new conversation
   * POST /conversations/
   */
  async createConversation(conversationData: GHLCreateConversationRequest): Promise<GHLApiResponse<GHLCreateConversationResponse>> {
    try {
      // Ensure locationId is set
      const payload = {
        ...conversationData,
        locationId: conversationData.locationId || this.config.locationId
      };

      const response: AxiosResponse<{ success: boolean; conversation: GHLCreateConversationResponse }> = await this.axiosInstance.post(
        '/conversations/',
        payload,
        { headers: this.getConversationHeaders() }
      );

      return this.wrapResponse(response.data.conversation);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Update conversation
   * PUT /conversations/{conversationId}
   */
  async updateConversation(conversationId: string, updates: GHLUpdateConversationRequest): Promise<GHLApiResponse<GHLConversation>> {
    try {
      // Ensure locationId is set
      const payload = {
        ...updates,
        locationId: updates.locationId || this.config.locationId
      };

      const response: AxiosResponse<{ success: boolean; conversation: GHLConversation }> = await this.axiosInstance.put(
        `/conversations/${conversationId}`,
        payload,
        { headers: this.getConversationHeaders() }
      );

      return this.wrapResponse(response.data.conversation);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Delete conversation
   * DELETE /conversations/{conversationId}
   */
  async deleteConversation(conversationId: string): Promise<GHLApiResponse<{ success: boolean }>> {
    try {
      const response: AxiosResponse<{ success: boolean }> = await this.axiosInstance.delete(
        `/conversations/${conversationId}`,
        { headers: this.getConversationHeaders() }
      );

      return this.wrapResponse(response.data);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get messages from a conversation
   * GET /conversations/{conversationId}/messages
   */
  async getConversationMessages(
    conversationId: string, 
    options?: { 
      lastMessageId?: string; 
      limit?: number; 
      type?: string; 
    }
  ): Promise<GHLApiResponse<GHLGetMessagesResponse>> {
    try {
      const params: any = {};
      if (options?.lastMessageId) params.lastMessageId = options.lastMessageId;
      if (options?.limit) params.limit = options.limit;
      if (options?.type) params.type = options.type;

      const response: AxiosResponse<GHLGetMessagesResponse> = await this.axiosInstance.get(
        `/conversations/${conversationId}/messages`,
        { 
          params,
          headers: this.getConversationHeaders()
        }
      );

      return this.wrapResponse(response.data);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get message by ID
   * GET /conversations/messages/{id}
   */
  async getMessage(messageId: string): Promise<GHLApiResponse<GHLMessage>> {
    try {
      const response: AxiosResponse<GHLMessage> = await this.axiosInstance.get(
        `/conversations/messages/${messageId}`,
        { headers: this.getConversationHeaders() }
      );

      return this.wrapResponse(response.data);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Send a new message (SMS, Email, etc.)
   * POST /conversations/messages
   */
  async sendMessage(messageData: GHLSendMessageRequest): Promise<GHLApiResponse<GHLSendMessageResponse>> {
    try {
      const response: AxiosResponse<GHLSendMessageResponse> = await this.axiosInstance.post(
        '/conversations/messages',
        messageData,
        { headers: this.getConversationHeaders() }
      );

      return this.wrapResponse(response.data);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Send SMS message to a contact
   * Convenience method for sending SMS
   */
  async sendSMS(contactId: string, message: string, fromNumber?: string): Promise<GHLApiResponse<GHLSendMessageResponse>> {
    try {
      const messageData: GHLSendMessageRequest = {
        type: 'SMS',
        contactId,
        message,
        fromNumber
      };

      return await this.sendMessage(messageData);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Send Email message to a contact
   * Convenience method for sending Email
   */
  async sendEmail(
    contactId: string, 
    subject: string, 
    message?: string, 
    html?: string,
    options?: {
      emailFrom?: string;
      emailTo?: string;
      emailCc?: string[];
      emailBcc?: string[];
      attachments?: string[];
    }
  ): Promise<GHLApiResponse<GHLSendMessageResponse>> {
    try {
      const messageData: GHLSendMessageRequest = {
        type: 'Email',
        contactId,
        subject,
        message,
        html,
        ...options
      };

      return await this.sendMessage(messageData);
    } catch (error) {
      throw error;
    }
  }

  /**
   * BLOG API METHODS
   */

  /**
   * Get all blog sites for a location
   * GET /blogs/site/all
   */
  async getBlogSites(params: GHLGetBlogSitesRequest): Promise<GHLApiResponse<GHLBlogSitesResponse>> {
    try {
      // Ensure locationId is set
      const queryParams = {
        locationId: params.locationId || this.config.locationId,
        skip: params.skip,
        limit: params.limit,
        ...(params.searchTerm && { searchTerm: params.searchTerm })
      };

      const response: AxiosResponse<GHLBlogSitesResponse> = await this.axiosInstance.get(
        '/blogs/site/all',
        { params: queryParams }
      );

      return this.wrapResponse(response.data);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get blog posts for a specific blog
   * GET /blogs/posts/all
   */
  async getBlogPosts(params: GHLGetBlogPostsRequest): Promise<GHLApiResponse<GHLBlogPostListResponse>> {
    try {
      // Ensure locationId is set
      const queryParams = {
        locationId: params.locationId || this.config.locationId,
        blogId: params.blogId,
        limit: params.limit,
        offset: params.offset,
        ...(params.searchTerm && { searchTerm: params.searchTerm }),
        ...(params.status && { status: params.status })
      };

      const response: AxiosResponse<GHLBlogPostListResponse> = await this.axiosInstance.get(
        '/blogs/posts/all',
        { params: queryParams }
      );

      return this.wrapResponse(response.data);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Create a new blog post
   * POST /blogs/posts
   */
  async createBlogPost(postData: GHLCreateBlogPostRequest): Promise<GHLApiResponse<GHLBlogPostCreateResponse>> {
    try {
      // Ensure locationId is set
      const payload = {
        ...postData,
        locationId: postData.locationId || this.config.locationId
      };

      const response: AxiosResponse<GHLBlogPostCreateResponse> = await this.axiosInstance.post(
        '/blogs/posts',
        payload
      );

      return this.wrapResponse(response.data);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Update an existing blog post
   * PUT /blogs/posts/{postId}
   */
  async updateBlogPost(postId: string, postData: GHLUpdateBlogPostRequest): Promise<GHLApiResponse<GHLBlogPostUpdateResponse>> {
    try {
      // Ensure locationId is set
      const payload = {
        ...postData,
        locationId: postData.locationId || this.config.locationId
      };

      const response: AxiosResponse<GHLBlogPostUpdateResponse> = await this.axiosInstance.put(
        `/blogs/posts/${postId}`,
        payload
      );

      return this.wrapResponse(response.data);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get all blog authors for a location
   * GET /blogs/authors
   */
  async getBlogAuthors(params: GHLGetBlogAuthorsRequest): Promise<GHLApiResponse<GHLBlogAuthorsResponse>> {
    try {
      // Ensure locationId is set
      const queryParams = {
        locationId: params.locationId || this.config.locationId,
        limit: params.limit,
        offset: params.offset
      };

      const response: AxiosResponse<GHLBlogAuthorsResponse> = await this.axiosInstance.get(
        '/blogs/authors',
        { params: queryParams }
      );

      return this.wrapResponse(response.data);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get all blog categories for a location
   * GET /blogs/categories
   */
  async getBlogCategories(params: GHLGetBlogCategoriesRequest): Promise<GHLApiResponse<GHLBlogCategoriesResponse>> {
    try {
      // Ensure locationId is set
      const queryParams = {
        locationId: params.locationId || this.config.locationId,
        limit: params.limit,
        offset: params.offset
      };

      const response: AxiosResponse<GHLBlogCategoriesResponse> = await this.axiosInstance.get(
        '/blogs/categories',
        { params: queryParams }
      );

      return this.wrapResponse(response.data);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Check if a URL slug exists (for validation before creating/updating posts)
   * GET /blogs/posts/url-slug-exists
   */
  async checkUrlSlugExists(params: GHLCheckUrlSlugRequest): Promise<GHLApiResponse<GHLUrlSlugCheckResponse>> {
    try {
      // Ensure locationId is set
      const queryParams = {
        locationId: params.locationId || this.config.locationId,
        urlSlug: params.urlSlug,
        ...(params.postId && { postId: params.postId })
      };

      const response: AxiosResponse<GHLUrlSlugCheckResponse> = await this.axiosInstance.get(
        '/blogs/posts/url-slug-exists',
        { params: queryParams }
      );

      return this.wrapResponse(response.data);
    } catch (error) {
      throw error;
    }
  }

  /**
   * TASKS API METHODS
   */

  /**
   * Get all tasks for a contact
   * GET /contacts/{contactId}/tasks
   */
  async getContactTasks(contactId: string): Promise<GHLApiResponse<GHLTask[]>> {
    try {
      const response: AxiosResponse<{ tasks: GHLTask[] }> = await this.axiosInstance.get(
        `/contacts/${contactId}/tasks`
      );

      return this.wrapResponse(response.data.tasks);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Create task for contact
   * POST /contacts/{contactId}/tasks
   */
  async createContactTask(contactId: string, taskData: Omit<GHLTask, 'id' | 'contactId'>): Promise<GHLApiResponse<GHLTask>> {
    try {
      const response: AxiosResponse<{ task: GHLTask }> = await this.axiosInstance.post(
        `/contacts/${contactId}/tasks`,
        taskData
      );

      return this.wrapResponse(response.data.task);
    } catch (error) {
      throw error;
    }
  }

  /**
   * NOTES API METHODS
   */

  /**
   * Get all notes for a contact
   * GET /contacts/{contactId}/notes
   */
  async getContactNotes(contactId: string): Promise<GHLApiResponse<GHLNote[]>> {
    try {
      const response: AxiosResponse<{ notes: GHLNote[] }> = await this.axiosInstance.get(
        `/contacts/${contactId}/notes`
      );

      return this.wrapResponse(response.data.notes);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Create note for contact
   * POST /contacts/{contactId}/notes
   */
  async createContactNote(contactId: string, noteData: Omit<GHLNote, 'id' | 'contactId' | 'dateAdded'>): Promise<GHLApiResponse<GHLNote>> {
    try {
      const response: AxiosResponse<{ note: GHLNote }> = await this.axiosInstance.post(
        `/contacts/${contactId}/notes`,
        noteData
      );

      return this.wrapResponse(response.data.note);
    } catch (error) {
      throw error;
    }
  }

  /**
   * ADDITIONAL CONTACT API METHODS
   */

  /**
   * Get a specific task for a contact
   * GET /contacts/{contactId}/tasks/{taskId}
   */
  async getContactTask(contactId: string, taskId: string): Promise<GHLApiResponse<GHLTask>> {
    try {
      const response: AxiosResponse<{ task: GHLTask }> = await this.axiosInstance.get(
        `/contacts/${contactId}/tasks/${taskId}`
      );

      return this.wrapResponse(response.data.task);
    } catch (error) {
      throw this.handleApiError(error as AxiosError<GHLErrorResponse>);
    }
  }

  /**
   * Update a task for a contact
   * PUT /contacts/{contactId}/tasks/{taskId}
   */
  async updateContactTask(contactId: string, taskId: string, updates: Partial<GHLTask>): Promise<GHLApiResponse<GHLTask>> {
    try {
      const response: AxiosResponse<{ task: GHLTask }> = await this.axiosInstance.put(
        `/contacts/${contactId}/tasks/${taskId}`,
        updates
      );

      return this.wrapResponse(response.data.task);
    } catch (error) {
      throw this.handleApiError(error as AxiosError<GHLErrorResponse>);
    }
  }

  /**
   * Delete a task for a contact
   * DELETE /contacts/{contactId}/tasks/{taskId}
   */
  async deleteContactTask(contactId: string, taskId: string): Promise<GHLApiResponse<{ succeded: boolean }>> {
    try {
      const response: AxiosResponse<{ succeded: boolean }> = await this.axiosInstance.delete(
        `/contacts/${contactId}/tasks/${taskId}`
      );

      return this.wrapResponse(response.data);
    } catch (error) {
      throw this.handleApiError(error as AxiosError<GHLErrorResponse>);
    }
  }

  /**
   * Update task completion status
   * PUT /contacts/{contactId}/tasks/{taskId}/completed
   */
  async updateTaskCompletion(contactId: string, taskId: string, completed: boolean): Promise<GHLApiResponse<GHLTask>> {
    try {
      const response: AxiosResponse<{ task: GHLTask }> = await this.axiosInstance.put(
        `/contacts/${contactId}/tasks/${taskId}/completed`,
        { completed }
      );

      return this.wrapResponse(response.data.task);
    } catch (error) {
      throw this.handleApiError(error as AxiosError<GHLErrorResponse>);
    }
  }

  /**
   * Get a specific note for a contact
   * GET /contacts/{contactId}/notes/{noteId}
   */
  async getContactNote(contactId: string, noteId: string): Promise<GHLApiResponse<GHLNote>> {
    try {
      const response: AxiosResponse<{ note: GHLNote }> = await this.axiosInstance.get(
        `/contacts/${contactId}/notes/${noteId}`
      );

      return this.wrapResponse(response.data.note);
    } catch (error) {
      throw this.handleApiError(error as AxiosError<GHLErrorResponse>);
    }
  }

  /**
   * Update a note for a contact
   * PUT /contacts/{contactId}/notes/{noteId}
   */
  async updateContactNote(contactId: string, noteId: string, updates: Partial<GHLNote>): Promise<GHLApiResponse<GHLNote>> {
    try {
      const response: AxiosResponse<{ note: GHLNote }> = await this.axiosInstance.put(
        `/contacts/${contactId}/notes/${noteId}`,
        updates
      );

      return this.wrapResponse(response.data.note);
    } catch (error) {
      throw this.handleApiError(error as AxiosError<GHLErrorResponse>);
    }
  }

  /**
   * Delete a note for a contact
   * DELETE /contacts/{contactId}/notes/{noteId}
   */
  async deleteContactNote(contactId: string, noteId: string): Promise<GHLApiResponse<{ succeded: boolean }>> {
    try {
      const response: AxiosResponse<{ succeded: boolean }> = await this.axiosInstance.delete(
        `/contacts/${contactId}/notes/${noteId}`
      );

      return this.wrapResponse(response.data);
    } catch (error) {
      throw this.handleApiError(error as AxiosError<GHLErrorResponse>);
    }
  }

  /**
   * Upsert contact (create or update based on email/phone)
   * POST /contacts/upsert
   */
  async upsertContact(contactData: Partial<GHLCreateContactRequest>): Promise<GHLApiResponse<GHLUpsertContactResponse>> {
    try {
      const payload = {
        ...contactData,
        locationId: contactData.locationId || this.config.locationId
      };

      const response: AxiosResponse<GHLUpsertContactResponse> = await this.axiosInstance.post(
        '/contacts/upsert',
        payload
      );

      return this.wrapResponse(response.data);
    } catch (error) {
      throw this.handleApiError(error as AxiosError<GHLErrorResponse>);
    }
  }

  /**
   * Get contacts by business ID
   * GET /contacts/business/{businessId}
   */
  async getContactsByBusiness(businessId: string, params: { limit?: number; skip?: number; query?: string } = {}): Promise<GHLApiResponse<GHLSearchContactsResponse>> {
    try {
      const queryParams = {
        limit: params.limit || 25,
        skip: params.skip || 0,
        ...(params.query && { query: params.query })
      };

      const response: AxiosResponse<GHLSearchContactsResponse> = await this.axiosInstance.get(
        `/contacts/business/${businessId}`,
        { params: queryParams }
      );

      return this.wrapResponse(response.data);
    } catch (error) {
      throw this.handleApiError(error as AxiosError<GHLErrorResponse>);
    }
  }

  /**
   * Get contact appointments
   * GET /contacts/{contactId}/appointments
   */
  async getContactAppointments(contactId: string): Promise<GHLApiResponse<GHLAppointment[]>> {
    try {
      const response: AxiosResponse<{ events: GHLAppointment[] }> = await this.axiosInstance.get(
        `/contacts/${contactId}/appointments`
      );

      return this.wrapResponse(response.data.events);
    } catch (error) {
      throw this.handleApiError(error as AxiosError<GHLErrorResponse>);
    }
  }

  /**
   * Bulk update contact tags
   * POST /contacts/tags/bulk
   */
  async bulkUpdateContactTags(contactIds: string[], tags: string[], operation: 'add' | 'remove', removeAllTags?: boolean): Promise<GHLApiResponse<GHLBulkTagsResponse>> {
    try {
      const payload = {
        ids: contactIds,
        tags,
        operation,
        ...(removeAllTags !== undefined && { removeAllTags })
      };

      const response: AxiosResponse<GHLBulkTagsResponse> = await this.axiosInstance.post(
        '/contacts/tags/bulk',
        payload
      );

      return this.wrapResponse(response.data);
    } catch (error) {
      throw this.handleApiError(error as AxiosError<GHLErrorResponse>);
    }
  }

  /**
   * Bulk update contact business
   * POST /contacts/business/bulk
   */
  async bulkUpdateContactBusiness(contactIds: string[], businessId?: string): Promise<GHLApiResponse<GHLBulkBusinessResponse>> {
    try {
      const payload = {
        ids: contactIds,
        businessId: businessId || null
      };

      const response: AxiosResponse<GHLBulkBusinessResponse> = await this.axiosInstance.post(
        '/contacts/business/bulk',
        payload
      );

      return this.wrapResponse(response.data);
    } catch (error) {
      throw this.handleApiError(error as AxiosError<GHLErrorResponse>);
    }
  }

  /**
   * Add contact followers
   * POST /contacts/{contactId}/followers
   */
  async addContactFollowers(contactId: string, followers: string[]): Promise<GHLApiResponse<GHLFollowersResponse>> {
    try {
      const payload = { followers };

      const response: AxiosResponse<GHLFollowersResponse> = await this.axiosInstance.post(
        `/contacts/${contactId}/followers`,
        payload
      );

      return this.wrapResponse(response.data);
    } catch (error) {
      throw this.handleApiError(error as AxiosError<GHLErrorResponse>);
    }
  }

  /**
   * Remove contact followers
   * DELETE /contacts/{contactId}/followers
   */
  async removeContactFollowers(contactId: string, followers: string[]): Promise<GHLApiResponse<GHLFollowersResponse>> {
    try {
      const payload = { followers };

      const response: AxiosResponse<GHLFollowersResponse> = await this.axiosInstance.delete(
        `/contacts/${contactId}/followers`,
        { data: payload }
      );

      return this.wrapResponse(response.data);
    } catch (error) {
      throw this.handleApiError(error as AxiosError<GHLErrorResponse>);
    }
  }

  /**
   * Add contact to campaign
   * POST /contacts/{contactId}/campaigns/{campaignId}
   */
  async addContactToCampaign(contactId: string, campaignId: string): Promise<GHLApiResponse<{ succeded: boolean }>> {
    try {
      const response: AxiosResponse<{ succeded: boolean }> = await this.axiosInstance.post(
        `/contacts/${contactId}/campaigns/${campaignId}`
      );

      return this.wrapResponse(response.data);
    } catch (error) {
      throw this.handleApiError(error as AxiosError<GHLErrorResponse>);
    }
  }

  /**
   * Remove contact from campaign
   * DELETE /contacts/{contactId}/campaigns/{campaignId}
   */
  async removeContactFromCampaign(contactId: string, campaignId: string): Promise<GHLApiResponse<{ succeded: boolean }>> {
    try {
      const response: AxiosResponse<{ succeded: boolean }> = await this.axiosInstance.delete(
        `/contacts/${contactId}/campaigns/${campaignId}`
      );

      return this.wrapResponse(response.data);
    } catch (error) {
      throw this.handleApiError(error as AxiosError<GHLErrorResponse>);
    }
  }

  /**
   * Remove contact from all campaigns
   * DELETE /contacts/{contactId}/campaigns
   */
  async removeContactFromAllCampaigns(contactId: string): Promise<GHLApiResponse<{ succeded: boolean }>> {
    try {
      const response: AxiosResponse<{ succeded: boolean }> = await this.axiosInstance.delete(
        `/contacts/${contactId}/campaigns`
      );

      return this.wrapResponse(response.data);
    } catch (error) {
      throw this.handleApiError(error as AxiosError<GHLErrorResponse>);
    }
  }

  /**
   * Add contact to workflow
   * POST /contacts/{contactId}/workflow/{workflowId}
   */
  async addContactToWorkflow(contactId: string, workflowId: string, eventStartTime?: string): Promise<GHLApiResponse<{ succeded: boolean }>> {
    try {
      const payload = eventStartTime ? { eventStartTime } : {};

      const response: AxiosResponse<{ succeded: boolean }> = await this.axiosInstance.post(
        `/contacts/${contactId}/workflow/${workflowId}`,
        payload
      );

      return this.wrapResponse(response.data);
    } catch (error) {
      throw this.handleApiError(error as AxiosError<GHLErrorResponse>);
    }
  }

  /**
   * Remove contact from workflow
   * DELETE /contacts/{contactId}/workflow/{workflowId}
   */
  async removeContactFromWorkflow(contactId: string, workflowId: string, eventStartTime?: string): Promise<GHLApiResponse<{ succeded: boolean }>> {
    try {
      const payload = eventStartTime ? { eventStartTime } : {};

      const response: AxiosResponse<{ succeded: boolean }> = await this.axiosInstance.delete(
        `/contacts/${contactId}/workflow/${workflowId}`,
        { data: payload }
      );

      return this.wrapResponse(response.data);
    } catch (error) {
      throw this.handleApiError(error as AxiosError<GHLErrorResponse>);
    }
  }

  /**
   * UTILITY METHODS
   */

  /**
   * Test API connection and authentication
   */
  async testConnection(): Promise<GHLApiResponse<{ status: string; locationId: string }>> {
    try {
      // Test with a simple GET request to check API connectivity
      const response: AxiosResponse<any> = await this.axiosInstance.get('/locations/' + this.config.locationId);

      return this.wrapResponse({
        status: 'connected',
        locationId: this.config.locationId
      });
    } catch (error) {
      throw new Error(`GHL API connection test failed: ${error}`);
    }
  }

  /**
   * Update access token
   */
  updateAccessToken(newToken: string): void {
    this.config.accessToken = newToken;
    this.axiosInstance.defaults.headers['Authorization'] = `Bearer ${newToken}`;
            process.stderr.write('[GHL API] Access token updated\n');
  }

  /**
   * Get current configuration
   */
  getConfig(): Readonly<GHLConfig> {
    return { ...this.config };
  }

  /**
   * Generic request method for new endpoints
   * Used by new tool modules that don't have specific client methods yet
   */
  async makeRequest<T = any>(
    method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
    path: string,
    body?: Record<string, unknown> | string,
    options?: {
      version?: string;
      app?: string;
      contentType?: 'application/json' | 'application/x-www-form-urlencoded';
    }
  ): Promise<GHLApiResponse<T>> {
    try {
      const headers: Record<string, string> = {};
      if (options?.version) headers.Version = options.version;
      if (options?.contentType) headers['Content-Type'] = options.contentType;
      const requestConfig: AxiosRequestConfig = Object.keys(headers).length ? { headers } : {};
      let response;
      switch (method) {
        case 'GET':
          response = await this.axiosInstance.get(path, requestConfig);
          break;
        case 'POST':
          response = await this.axiosInstance.post(path, body, requestConfig);
          break;
        case 'PUT':
          response = await this.axiosInstance.put(path, body, requestConfig);
          break;
        case 'PATCH':
          response = await this.axiosInstance.patch(path, body, requestConfig);
          break;
        case 'DELETE':
          response = await this.axiosInstance.delete(path, { ...requestConfig, data: body });
          break;
      }
      return this.wrapResponse(response.data);
    } catch (error) {
      throw error;
    }
  }

  /**
   * OPPORTUNITIES API METHODS
   */

  /**
   * Search opportunities with advanced filters
   * GET /opportunities/search
   *
   * v3 (2026-06-11): locationId is REQUIRED and params are camelCase
   * (pipelineId, pipelineStageId, contactId, assignedTo). v2 used snake_case.
   */
  async searchOpportunities(searchParams: GHLSearchOpportunitiesRequest): Promise<GHLApiResponse<GHLSearchOpportunitiesResponse>> {
    try {
      const gen = this.config.apiGeneration ?? 'v3';
      const isV3 = gen === 'v3';

      // v3 requires locationId; v2 falls back to config.locationId.
      const locationId = isV3
        ? (searchParams.locationId || searchParams.location_id || this.config.locationId)
        : (searchParams.location_id || this.config.locationId);

      const params: any = isV3
        ? { locationId }
        : { location_id: locationId };

      // Add optional search parameters only if they have values.
      // Accept both v3 (camelCase) and v2 (snake_case) inputs for graceful migration.
      const q = searchParams.q;
      if (q && String(q).trim()) params.q = String(q).trim();

      const pipelineId = searchParams.pipelineId ?? searchParams.pipeline_id;
      if (pipelineId) params[isV3 ? 'pipelineId' : 'pipeline_id'] = pipelineId;

      const pipelineStageId = searchParams.pipelineStageId ?? searchParams.pipeline_stage_id;
      if (pipelineStageId) params[isV3 ? 'pipelineStageId' : 'pipeline_stage_id'] = pipelineStageId;

      const contactId = searchParams.contactId ?? searchParams.contact_id;
      if (contactId) params[isV3 ? 'contactId' : 'contact_id'] = contactId;

      const assignedTo = searchParams.assignedTo ?? searchParams.assigned_to;
      if (assignedTo) params[isV3 ? 'assignedTo' : 'assigned_to'] = assignedTo;

      if (searchParams.status) params.status = searchParams.status;
      if (searchParams.campaignId) params.campaignId = searchParams.campaignId;
      if (searchParams.id) params.id = searchParams.id;
      if (searchParams.order) params.order = searchParams.order;
      if (searchParams.endDate) params.endDate = searchParams.endDate;
      if (searchParams.startAfter) params.startAfter = searchParams.startAfter;
      if (searchParams.startAfterId) params.startAfterId = searchParams.startAfterId;
      if (searchParams.date) params.date = searchParams.date;
      if (searchParams.country) params.country = searchParams.country;
      if (searchParams.page) params.page = searchParams.page;
      if (searchParams.limit) params.limit = searchParams.limit;
      if (searchParams.getTasks !== undefined) params.getTasks = searchParams.getTasks;
      if (searchParams.getNotes !== undefined) params.getNotes = searchParams.getNotes;
      if (searchParams.getCalendarEvents !== undefined) params.getCalendarEvents = searchParams.getCalendarEvents;

      process.stderr.write(`[GHL API] Search opportunities params (${gen}): ${JSON.stringify(params, null, 2)}\n`);

      // v3 sends the named version header; v2 uses the client default.
      const requestConfig = {
        headers: { Version: isV3 ? 'v3' : '2021-07-28' },
        params,
      };
      const response: AxiosResponse<GHLSearchOpportunitiesResponse> = await this.axiosInstance.get(
        '/opportunities/search',
        requestConfig
      );

      return this.wrapResponse(response.data);
    } catch (error) {
      const axiosError = error as AxiosError<GHLErrorResponse>;
      process.stderr.write(`[GHL API] Search opportunities error: ${JSON.stringify({
        status: axiosError.response?.status,
        statusText: axiosError.response?.statusText,
        data: axiosError.response?.data,
        message: axiosError.message
      }, null, 2)}\n`);

      throw this.handleApiError(axiosError);
    }
  }

  /**
   * Get all pipelines for a location
   * GET /opportunities/pipelines
   */
  async getPipelines(locationId?: string): Promise<GHLApiResponse<GHLGetPipelinesResponse>> {
    try {
      const params = {
        locationId: locationId || this.config.locationId
      };

      const response: AxiosResponse<GHLGetPipelinesResponse> = await this.axiosInstance.get(
        '/opportunities/pipelines',
        { params }
      );

      return this.wrapResponse(response.data);
    } catch (error) {
      throw this.handleApiError(error as AxiosError<GHLErrorResponse>);
    }
  }

  /**
   * Get opportunity by ID
   * GET /opportunities/{id}
   */
  async getOpportunity(opportunityId: string): Promise<GHLApiResponse<GHLOpportunity>> {
    try {
      const response: AxiosResponse<{ opportunity: GHLOpportunity }> = await this.axiosInstance.get(
        `/opportunities/${opportunityId}`
      );

      return this.wrapResponse(response.data.opportunity);
    } catch (error) {
      throw this.handleApiError(error as AxiosError<GHLErrorResponse>);
    }
  }

  /**
   * Create a new opportunity
   * POST /opportunities/
   */
  async createOpportunity(opportunityData: GHLCreateOpportunityRequest): Promise<GHLApiResponse<GHLOpportunity>> {
    try {
      // Ensure locationId is set
      const payload = {
        ...opportunityData,
        locationId: opportunityData.locationId || this.config.locationId
      };

      const response: AxiosResponse<{ opportunity: GHLOpportunity }> = await this.axiosInstance.post(
        '/opportunities/',
        payload
      );

      return this.wrapResponse(response.data.opportunity);
    } catch (error) {
      throw this.handleApiError(error as AxiosError<GHLErrorResponse>);
    }
  }

  /**
   * Update existing opportunity
   * PUT /opportunities/{id}
   */
  async updateOpportunity(opportunityId: string, updates: GHLUpdateOpportunityRequest): Promise<GHLApiResponse<GHLOpportunity>> {
    try {
      const response: AxiosResponse<{ opportunity: GHLOpportunity }> = await this.axiosInstance.put(
        `/opportunities/${opportunityId}`,
        updates
      );

      return this.wrapResponse(response.data.opportunity);
    } catch (error) {
      throw this.handleApiError(error as AxiosError<GHLErrorResponse>);
    }
  }

  /**
   * Update opportunity status
   * PUT /opportunities/{id}/status
   */
  async updateOpportunityStatus(opportunityId: string, status: GHLOpportunityStatus): Promise<GHLApiResponse<{ succeded: boolean }>> {
    try {
      const payload: GHLUpdateOpportunityStatusRequest = { status };

      const response: AxiosResponse<{ succeded: boolean }> = await this.axiosInstance.put(
        `/opportunities/${opportunityId}/status`,
        payload
      );

      return this.wrapResponse(response.data);
    } catch (error) {
      throw this.handleApiError(error as AxiosError<GHLErrorResponse>);
    }
  }

  /**
   * Upsert opportunity (create or update)
   * POST /opportunities/upsert
   */
  async upsertOpportunity(opportunityData: GHLUpsertOpportunityRequest): Promise<GHLApiResponse<GHLUpsertOpportunityResponse>> {
    try {
      // Ensure locationId is set
      const payload = {
        ...opportunityData,
        locationId: opportunityData.locationId || this.config.locationId
      };

      const response: AxiosResponse<GHLUpsertOpportunityResponse> = await this.axiosInstance.post(
        '/opportunities/upsert',
        payload
      );

      return this.wrapResponse(response.data);
    } catch (error) {
      throw this.handleApiError(error as AxiosError<GHLErrorResponse>);
    }
  }

  /**
   * Delete opportunity
   * DELETE /opportunities/{id}
   */
  async deleteOpportunity(opportunityId: string): Promise<GHLApiResponse<{ succeded: boolean }>> {
    try {
      const response: AxiosResponse<{ succeded: boolean }> = await this.axiosInstance.delete(
        `/opportunities/${opportunityId}`
      );

      return this.wrapResponse(response.data);
    } catch (error) {
      throw this.handleApiError(error as AxiosError<GHLErrorResponse>);
    }
  }

  /**
   * Add followers to opportunity
   * POST /opportunities/{id}/followers
   */
  async addOpportunityFollowers(opportunityId: string, followers: string[]): Promise<GHLApiResponse<any>> {
    try {
      const payload = { followers };

      const response: AxiosResponse<any> = await this.axiosInstance.post(
        `/opportunities/${opportunityId}/followers`,
        payload
      );

      return this.wrapResponse(response.data);
    } catch (error) {
      throw this.handleApiError(error as AxiosError<GHLErrorResponse>);
    }
  }

  /**
   * Remove followers from opportunity
   * DELETE /opportunities/{id}/followers
   */
  async removeOpportunityFollowers(opportunityId: string, followers: string[]): Promise<GHLApiResponse<any>> {
    try {
      const payload = { followers };

      const response: AxiosResponse<any> = await this.axiosInstance.delete(
        `/opportunities/${opportunityId}/followers`,
        { data: payload }
      );

      return this.wrapResponse(response.data);
    } catch (error) {
      throw this.handleApiError(error as AxiosError<GHLErrorResponse>);
    }
  }

  /**
   * CALENDAR & APPOINTMENTS API METHODS
   */

  /**
   * Get all calendar groups in a location
   * GET /calendars/groups
   */
  async getCalendarGroups(locationId?: string): Promise<GHLApiResponse<GHLGetCalendarGroupsResponse>> {
    try {
      const params = {
        locationId: locationId || this.config.locationId
      };

      const response: AxiosResponse<GHLGetCalendarGroupsResponse> = await this.axiosInstance.get(
        '/calendars/groups',
        { params }
      );

      return this.wrapResponse(response.data);
    } catch (error) {
      throw this.handleApiError(error as AxiosError<GHLErrorResponse>);
    }
  }

  /**
   * Create a new calendar group
   * POST /calendars/groups
   */
  async createCalendarGroup(groupData: GHLCreateCalendarGroupRequest): Promise<GHLApiResponse<{ group: GHLCalendarGroup }>> {
    try {
      const payload = {
        ...groupData,
        locationId: groupData.locationId || this.config.locationId
      };

      const response: AxiosResponse<{ group: GHLCalendarGroup }> = await this.axiosInstance.post(
        '/calendars/groups',
        payload
      );

      return this.wrapResponse(response.data);
    } catch (error) {
      throw this.handleApiError(error as AxiosError<GHLErrorResponse>);
    }
  }

  /**
   * Get all calendars in a location
   * GET /calendars/
   */
  async getCalendars(params?: { locationId?: string; groupId?: string; showDrafted?: boolean }): Promise<GHLApiResponse<GHLGetCalendarsResponse>> {
    try {
      const queryParams = {
        locationId: params?.locationId || this.config.locationId,
        ...(params?.groupId && { groupId: params.groupId }),
        ...(params?.showDrafted !== undefined && { showDrafted: params.showDrafted })
      };

      const response: AxiosResponse<GHLGetCalendarsResponse> = await this.axiosInstance.get(
        '/calendars/',
        { params: queryParams }
      );

      return this.wrapResponse(response.data);
    } catch (error) {
      throw this.handleApiError(error as AxiosError<GHLErrorResponse>);
    }
  }

  /**
   * Create a new calendar
   * POST /calendars/
   */
  async createCalendar(calendarData: GHLCreateCalendarRequest): Promise<GHLApiResponse<{ calendar: GHLCalendar }>> {
    try {
      const payload = {
        ...calendarData,
        locationId: calendarData.locationId || this.config.locationId
      };

      const response: AxiosResponse<{ calendar: GHLCalendar }> = await this.axiosInstance.post(
        '/calendars/',
        payload
      );

      return this.wrapResponse(response.data);
    } catch (error) {
      throw this.handleApiError(error as AxiosError<GHLErrorResponse>);
    }
  }

  /**
   * Get calendar by ID
   * GET /calendars/{calendarId}
   */
  async getCalendar(calendarId: string): Promise<GHLApiResponse<{ calendar: GHLCalendar }>> {
    try {
      const response: AxiosResponse<{ calendar: GHLCalendar }> = await this.axiosInstance.get(
        `/calendars/${calendarId}`
      );

      return this.wrapResponse(response.data);
    } catch (error) {
      throw this.handleApiError(error as AxiosError<GHLErrorResponse>);
    }
  }

  /**
   * Update calendar by ID
   * PUT /calendars/{calendarId}
   */
  async updateCalendar(calendarId: string, updates: GHLUpdateCalendarRequest): Promise<GHLApiResponse<{ calendar: GHLCalendar }>> {
    try {
      const response: AxiosResponse<{ calendar: GHLCalendar }> = await this.axiosInstance.put(
        `/calendars/${calendarId}`,
        updates
      );

      return this.wrapResponse(response.data);
    } catch (error) {
      throw this.handleApiError(error as AxiosError<GHLErrorResponse>);
    }
  }

  /**
   * Delete calendar by ID
   * DELETE /calendars/{calendarId}
   */
  async deleteCalendar(calendarId: string): Promise<GHLApiResponse<{ success: boolean }>> {
    try {
      const response: AxiosResponse<{ success: boolean }> = await this.axiosInstance.delete(
        `/calendars/${calendarId}`
      );

      return this.wrapResponse(response.data);
    } catch (error) {
      throw this.handleApiError(error as AxiosError<GHLErrorResponse>);
    }
  }

  /**
   * Get calendar events/appointments
   * GET /calendars/events
   */
  async getCalendarEvents(eventParams: GHLGetCalendarEventsRequest): Promise<GHLApiResponse<GHLGetCalendarEventsResponse>> {
    try {
      const params = {
        locationId: eventParams.locationId || this.config.locationId,
        startTime: eventParams.startTime,
        endTime: eventParams.endTime,
        ...(eventParams.userId && { userId: eventParams.userId }),
        ...(eventParams.calendarId && { calendarId: eventParams.calendarId }),
        ...(eventParams.groupId && { groupId: eventParams.groupId })
      };

      const response: AxiosResponse<GHLGetCalendarEventsResponse> = await this.axiosInstance.get(
        '/calendars/events',
        { params }
      );

      return this.wrapResponse(response.data);
    } catch (error) {
      throw this.handleApiError(error as AxiosError<GHLErrorResponse>);
    }
  }

  /**
   * Get blocked slots
   * GET /calendars/blocked-slots
   */
  async getBlockedSlots(eventParams: GHLGetCalendarEventsRequest): Promise<GHLApiResponse<GHLGetCalendarEventsResponse>> {
    try {
      const params = {
        locationId: eventParams.locationId || this.config.locationId,
        startTime: eventParams.startTime,
        endTime: eventParams.endTime,
        ...(eventParams.userId && { userId: eventParams.userId }),
        ...(eventParams.calendarId && { calendarId: eventParams.calendarId }),
        ...(eventParams.groupId && { groupId: eventParams.groupId })
      };

      const response: AxiosResponse<GHLGetCalendarEventsResponse> = await this.axiosInstance.get(
        '/calendars/blocked-slots',
        { params }
      );

      return this.wrapResponse(response.data);
    } catch (error) {
      throw this.handleApiError(error as AxiosError<GHLErrorResponse>);
    }
  }

  /**
   * Get free slots for a calendar
   * GET /calendars/{calendarId}/free-slots
   */
  async getFreeSlots(slotParams: GHLGetFreeSlotsRequest): Promise<GHLApiResponse<GHLGetFreeSlotsResponse>> {
    try {
      const params = {
        startDate: slotParams.startDate,
        endDate: slotParams.endDate,
        ...(slotParams.timezone && { timezone: slotParams.timezone }),
        ...(slotParams.userId && { userId: slotParams.userId }),
        ...(slotParams.userIds && { userIds: slotParams.userIds }),
        ...(slotParams.enableLookBusy !== undefined && { enableLookBusy: slotParams.enableLookBusy })
      };

      const response: AxiosResponse<GHLGetFreeSlotsResponse> = await this.axiosInstance.get(
        `/calendars/${slotParams.calendarId}/free-slots`,
        { params }
      );

      return this.wrapResponse(response.data);
    } catch (error) {
      throw this.handleApiError(error as AxiosError<GHLErrorResponse>);
    }
  }

  /**
   * Create a new appointment
   * POST /calendars/events/appointments
   */
  async createAppointment(appointmentData: GHLCreateAppointmentRequest): Promise<GHLApiResponse<GHLCalendarEvent>> {
    try {
      const payload = {
        ...appointmentData,
        locationId: appointmentData.locationId || this.config.locationId
      };

      const response: AxiosResponse<GHLCalendarEvent> = await this.axiosInstance.post(
        '/calendars/events/appointments',
        payload
      );

      return this.wrapResponse(response.data);
    } catch (error) {
      throw this.handleApiError(error as AxiosError<GHLErrorResponse>);
    }
  }

  /**
   * Get appointment by ID
   * GET /calendars/events/appointments/{eventId}
   */
  async getAppointment(appointmentId: string): Promise<GHLApiResponse<{ event: GHLCalendarEvent }>> {
    try {
      const response: AxiosResponse<{ event: GHLCalendarEvent }> = await this.axiosInstance.get(
        `/calendars/events/appointments/${appointmentId}`
      );

      return this.wrapResponse(response.data);
    } catch (error) {
      throw this.handleApiError(error as AxiosError<GHLErrorResponse>);
    }
  }

  /**
   * Update appointment by ID
   * PUT /calendars/events/appointments/{eventId}
   */
  async updateAppointment(appointmentId: string, updates: GHLUpdateAppointmentRequest): Promise<GHLApiResponse<GHLCalendarEvent>> {
    try {
      const response: AxiosResponse<GHLCalendarEvent> = await this.axiosInstance.put(
        `/calendars/events/appointments/${appointmentId}`,
        updates
      );

      return this.wrapResponse(response.data);
    } catch (error) {
      throw this.handleApiError(error as AxiosError<GHLErrorResponse>);
    }
  }

  /**
   * Delete appointment by ID  
   * DELETE /calendars/events/appointments/{eventId}
   */
  async deleteAppointment(appointmentId: string): Promise<GHLApiResponse<{ succeeded: boolean }>> {
    try {
      const response: AxiosResponse<{ succeeded: boolean }> = await this.axiosInstance.delete(
        `/calendars/events/appointments/${appointmentId}`
      );

      return this.wrapResponse(response.data);
    } catch (error) {
      throw this.handleApiError(error as AxiosError<GHLErrorResponse>);
    }
  }



  /**
   * Update block slot by ID
   * PUT /calendars/events/block-slots/{eventId}
   */
  async updateBlockSlot(blockSlotId: string, updates: GHLUpdateBlockSlotRequest): Promise<GHLApiResponse<GHLBlockSlotResponse>> {
    try {
      const response: AxiosResponse<GHLBlockSlotResponse> = await this.axiosInstance.put(
        `/calendars/events/block-slots/${blockSlotId}`,
        updates
      );

      return this.wrapResponse(response.data);
    } catch (error) {
      throw this.handleApiError(error as AxiosError<GHLErrorResponse>);
    }
  }

  /**
   * EMAIL API METHODS
   */

  async getEmailCampaigns(params: MCPGetEmailCampaignsParams): Promise<GHLApiResponse<GHLEmailCampaignsResponse>> {
    try {
      const response: AxiosResponse<GHLEmailCampaignsResponse> = await this.axiosInstance.get('/emails/schedule', {
        headers: { Version: '2021-07-28' },
        params: {
          locationId: this.config.locationId,
          ...params
        }
      });
      return this.wrapResponse(response.data);
    } catch (error) {
      throw this.handleApiError(error as AxiosError<GHLErrorResponse>);
    }
  }

  async createEmailTemplate(params: MCPCreateEmailTemplateParams): Promise<GHLApiResponse<any>> {
    try {
      const response: AxiosResponse<any> = await this.axiosInstance.post('/emails/builder', {
        locationId: this.config.locationId,
        type: 'html',
        ...params
      }, { headers: { Version: '2021-07-28' } });
      return this.wrapResponse(response.data);
    } catch (error) {
      throw this.handleApiError(error as AxiosError<GHLErrorResponse>);
    }
  }

  async getEmailTemplates(params: MCPGetEmailTemplatesParams): Promise<GHLApiResponse<GHLEmailTemplate[]>> {
    try {
      const response: AxiosResponse<GHLEmailTemplate[]> = await this.axiosInstance.get('/emails/builder', {
        headers: { Version: '2021-07-28' },
        params: {
          locationId: this.config.locationId,
          ...params
        }
      });
      return this.wrapResponse(response.data);
    } catch (error) {
      throw this.handleApiError(error as AxiosError<GHLErrorResponse>);
    }
  }

  async updateEmailTemplate(params: MCPUpdateEmailTemplateParams): Promise<GHLApiResponse<any>> {
    try {
      const { templateId, ...data } = params;
      const response: AxiosResponse<any> = await this.axiosInstance.post('/emails/builder/data', {
        locationId: this.config.locationId,
        templateId,
        ...data,
        editorType: 'html'
      }, { headers: { Version: '2021-07-28' } });
      return this.wrapResponse(response.data);
    } catch (error) {
      throw this.handleApiError(error as AxiosError<GHLErrorResponse>);
    }
  }

  async deleteEmailTemplate(params: MCPDeleteEmailTemplateParams): Promise<GHLApiResponse<any>> {
    try {
      const { templateId } = params;
      const response: AxiosResponse<any> = await this.axiosInstance.delete(
        `/emails/builder/${this.config.locationId}/${templateId}`,
        { headers: { Version: '2021-07-28' } }
      );
      return this.wrapResponse(response.data);
    } catch (error) {
      throw this.handleApiError(error as AxiosError<GHLErrorResponse>);
    }
  }

  /**
   * LOCATION API METHODS
   */

  /**
   * Search locations/sub-accounts
   * GET /locations/search
   */
  async searchLocations(params: {
    companyId?: string;
    skip?: number;
    limit?: number;
    order?: 'asc' | 'desc';
    email?: string;
  } = {}): Promise<GHLApiResponse<GHLLocationSearchResponse>> {
    try {
      const queryParams = {
        skip: params.skip || 0,
        limit: params.limit || 10,
        order: params.order || 'asc',
        ...(params.companyId && { companyId: params.companyId }),
        ...(params.email && { email: params.email })
      };

      const response: AxiosResponse<GHLLocationSearchResponse> = await this.axiosInstance.get(
        '/locations/search',
        { params: queryParams }
      );

      return this.wrapResponse(response.data);
    } catch (error) {
      throw this.handleApiError(error as AxiosError<GHLErrorResponse>);
    }
  }

  /**
   * Get location by ID
   * GET /locations/{locationId}
   */
  async getLocationById(locationId: string): Promise<GHLApiResponse<GHLLocationDetailsResponse>> {
    try {
      const response: AxiosResponse<GHLLocationDetailsResponse> = await this.axiosInstance.get(
        `/locations/${locationId}`
      );

      return this.wrapResponse(response.data);
    } catch (error) {
      throw this.handleApiError(error as AxiosError<GHLErrorResponse>);
    }
  }

  /**
   * Create a new location/sub-account
   * POST /locations/
   */
  async createLocation(locationData: GHLCreateLocationRequest): Promise<GHLApiResponse<GHLLocationDetailed>> {
    try {
      const response: AxiosResponse<GHLLocationDetailed> = await this.axiosInstance.post(
        '/locations/',
        locationData
      );

      return this.wrapResponse(response.data);
    } catch (error) {
      throw this.handleApiError(error as AxiosError<GHLErrorResponse>);
    }
  }

  /**
   * Update location/sub-account
   * PUT /locations/{locationId}
   */
  async updateLocation(locationId: string, updates: GHLUpdateLocationRequest): Promise<GHLApiResponse<GHLLocationDetailed>> {
    try {
      const response: AxiosResponse<GHLLocationDetailed> = await this.axiosInstance.put(
        `/locations/${locationId}`,
        updates
      );

      return this.wrapResponse(response.data);
    } catch (error) {
      throw this.handleApiError(error as AxiosError<GHLErrorResponse>);
    }
  }

  /**
   * Delete location/sub-account
   * DELETE /locations/{locationId}
   */
  async deleteLocation(locationId: string, deleteTwilioAccount: boolean): Promise<GHLApiResponse<GHLLocationDeleteResponse>> {
    try {
      const response: AxiosResponse<GHLLocationDeleteResponse> = await this.axiosInstance.delete(
        `/locations/${locationId}`,
        {
          params: { deleteTwilioAccount }
        }
      );

      return this.wrapResponse(response.data);
    } catch (error) {
      throw this.handleApiError(error as AxiosError<GHLErrorResponse>);
    }
  }

  /**
   * LOCATION TAGS API METHODS
   */

  /**
   * Get location tags
   * GET /locations/{locationId}/tags
   */
  async getLocationTags(locationId: string): Promise<GHLApiResponse<GHLLocationTagsResponse>> {
    try {
      const response: AxiosResponse<GHLLocationTagsResponse> = await this.axiosInstance.get(
        `/locations/${locationId}/tags`
      );

      return this.wrapResponse(response.data);
    } catch (error) {
      throw this.handleApiError(error as AxiosError<GHLErrorResponse>);
    }
  }

  /**
   * Create location tag
   * POST /locations/{locationId}/tags
   */
  async createLocationTag(locationId: string, tagData: GHLLocationTagRequest): Promise<GHLApiResponse<GHLLocationTagResponse>> {
    try {
      const response: AxiosResponse<GHLLocationTagResponse> = await this.axiosInstance.post(
        `/locations/${locationId}/tags`,
        tagData
      );

      return this.wrapResponse(response.data);
    } catch (error) {
      throw this.handleApiError(error as AxiosError<GHLErrorResponse>);
    }
  }

  /**
   * Get location tag by ID
   * GET /locations/{locationId}/tags/{tagId}
   */
  async getLocationTag(locationId: string, tagId: string): Promise<GHLApiResponse<GHLLocationTagResponse>> {
    try {
      const response: AxiosResponse<GHLLocationTagResponse> = await this.axiosInstance.get(
        `/locations/${locationId}/tags/${tagId}`
      );

      return this.wrapResponse(response.data);
    } catch (error) {
      throw this.handleApiError(error as AxiosError<GHLErrorResponse>);
    }
  }

  /**
   * Update location tag
   * PUT /locations/{locationId}/tags/{tagId}
   */
  async updateLocationTag(locationId: string, tagId: string, tagData: GHLLocationTagRequest): Promise<GHLApiResponse<GHLLocationTagResponse>> {
    try {
      const response: AxiosResponse<GHLLocationTagResponse> = await this.axiosInstance.put(
        `/locations/${locationId}/tags/${tagId}`,
        tagData
      );

      return this.wrapResponse(response.data);
    } catch (error) {
      throw this.handleApiError(error as AxiosError<GHLErrorResponse>);
    }
  }

  /**
   * Delete location tag
   * DELETE /locations/{locationId}/tags/{tagId}
   */
  async deleteLocationTag(locationId: string, tagId: string): Promise<GHLApiResponse<GHLLocationTagDeleteResponse>> {
    try {
      const response: AxiosResponse<GHLLocationTagDeleteResponse> = await this.axiosInstance.delete(
        `/locations/${locationId}/tags/${tagId}`
      );

      return this.wrapResponse(response.data);
    } catch (error) {
      throw this.handleApiError(error as AxiosError<GHLErrorResponse>);
    }
  }

  /**
   * LOCATION TASKS API METHODS
   */

  /**
   * Search location tasks
   * POST /locations/{locationId}/tasks/search
   */
  async searchLocationTasks(locationId: string, searchParams: GHLLocationTaskSearchRequest): Promise<GHLApiResponse<GHLLocationTaskSearchResponse>> {
    try {
      const response: AxiosResponse<GHLLocationTaskSearchResponse> = await this.axiosInstance.post(
        `/locations/${locationId}/tasks/search`,
        searchParams
      );

      return this.wrapResponse(response.data);
    } catch (error) {
      throw this.handleApiError(error as AxiosError<GHLErrorResponse>);
    }
  }

  /**
   * CUSTOM FIELDS API METHODS
   */

  /**
   * Get custom fields for location
   * GET /locations/{locationId}/customFields
   */
  async getLocationCustomFields(locationId: string, model?: 'contact' | 'opportunity' | 'all'): Promise<GHLApiResponse<GHLLocationCustomFieldsResponse>> {
    try {
      const params: any = {};
      if (model) params.model = model;

      const response: AxiosResponse<GHLLocationCustomFieldsResponse> = await this.axiosInstance.get(
        `/locations/${locationId}/customFields`,
        { params }
      );

      return this.wrapResponse(response.data);
    } catch (error) {
      throw this.handleApiError(error as AxiosError<GHLErrorResponse>);
    }
  }

  /**
   * Create custom field for location
   * POST /locations/{locationId}/customFields
   */
  async createLocationCustomField(locationId: string, fieldData: GHLCreateCustomFieldRequest): Promise<GHLApiResponse<GHLLocationCustomFieldResponse>> {
    try {
      const response: AxiosResponse<GHLLocationCustomFieldResponse> = await this.axiosInstance.post(
        `/locations/${locationId}/customFields`,
        fieldData
      );

      return this.wrapResponse(response.data);
    } catch (error) {
      throw this.handleApiError(error as AxiosError<GHLErrorResponse>);
    }
  }

  /**
   * Get custom field by ID
   * GET /locations/{locationId}/customFields/{id}
   */
  async getLocationCustomField(locationId: string, customFieldId: string): Promise<GHLApiResponse<GHLLocationCustomFieldResponse>> {
    try {
      const response: AxiosResponse<GHLLocationCustomFieldResponse> = await this.axiosInstance.get(
        `/locations/${locationId}/customFields/${customFieldId}`
      );

      return this.wrapResponse(response.data);
    } catch (error) {
      throw this.handleApiError(error as AxiosError<GHLErrorResponse>);
    }
  }

  /**
   * Update custom field
   * PUT /locations/{locationId}/customFields/{id}
   */
  async updateLocationCustomField(locationId: string, customFieldId: string, fieldData: GHLUpdateCustomFieldRequest): Promise<GHLApiResponse<GHLLocationCustomFieldResponse>> {
    try {
      const response: AxiosResponse<GHLLocationCustomFieldResponse> = await this.axiosInstance.put(
        `/locations/${locationId}/customFields/${customFieldId}`,
        fieldData
      );

      return this.wrapResponse(response.data);
    } catch (error) {
      throw this.handleApiError(error as AxiosError<GHLErrorResponse>);
    }
  }

  /**
   * Delete custom field
   * DELETE /locations/{locationId}/customFields/{id}
   */
  async deleteLocationCustomField(locationId: string, customFieldId: string): Promise<GHLApiResponse<GHLCustomFieldDeleteResponse>> {
    try {
      const response: AxiosResponse<GHLCustomFieldDeleteResponse> = await this.axiosInstance.delete(
        `/locations/${locationId}/customFields/${customFieldId}`
      );

      return this.wrapResponse(response.data);
    } catch (error) {
      throw this.handleApiError(error as AxiosError<GHLErrorResponse>);
    }
  }

  /**
   * Upload file to custom fields
   * POST /locations/{locationId}/customFields/upload
   */
  async uploadLocationCustomFieldFile(locationId: string, uploadData: GHLFileUploadRequest): Promise<GHLApiResponse<GHLFileUploadResponse>> {
    try {
      // Note: This endpoint expects multipart/form-data but we'll handle it as JSON for now
      // In a real implementation, you'd use FormData for file uploads
      const response: AxiosResponse<GHLFileUploadResponse> = await this.axiosInstance.post(
        `/locations/${locationId}/customFields/upload`,
        uploadData,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );

      return this.wrapResponse(response.data);
    } catch (error) {
      throw this.handleApiError(error as AxiosError<GHLErrorResponse>);
    }
  }

  /**
   * CUSTOM VALUES API METHODS
   */

  /**
   * Get custom values for location
   * GET /locations/{locationId}/customValues
   */
  async getLocationCustomValues(locationId: string): Promise<GHLApiResponse<GHLLocationCustomValuesResponse>> {
    try {
      const response: AxiosResponse<GHLLocationCustomValuesResponse> = await this.axiosInstance.get(
        `/locations/${locationId}/customValues`
      );

      return this.wrapResponse(response.data);
    } catch (error) {
      throw this.handleApiError(error as AxiosError<GHLErrorResponse>);
    }
  }

  /**
   * Create custom value for location
   * POST /locations/{locationId}/customValues
   */
  async createLocationCustomValue(locationId: string, valueData: GHLCustomValueRequest): Promise<GHLApiResponse<GHLLocationCustomValueResponse>> {
    try {
      const response: AxiosResponse<GHLLocationCustomValueResponse> = await this.axiosInstance.post(
        `/locations/${locationId}/customValues`,
        valueData
      );

      return this.wrapResponse(response.data);
    } catch (error) {
      throw this.handleApiError(error as AxiosError<GHLErrorResponse>);
    }
  }

  /**
   * Get custom value by ID
   * GET /locations/{locationId}/customValues/{id}
   */
  async getLocationCustomValue(locationId: string, customValueId: string): Promise<GHLApiResponse<GHLLocationCustomValueResponse>> {
    try {
      const response: AxiosResponse<GHLLocationCustomValueResponse> = await this.axiosInstance.get(
        `/locations/${locationId}/customValues/${customValueId}`
      );

      return this.wrapResponse(response.data);
    } catch (error) {
      throw this.handleApiError(error as AxiosError<GHLErrorResponse>);
    }
  }

  /**
   * Update custom value
   * PUT /locations/{locationId}/customValues/{id}
   */
  async updateLocationCustomValue(locationId: string, customValueId: string, valueData: GHLCustomValueRequest): Promise<GHLApiResponse<GHLLocationCustomValueResponse>> {
    try {
      const response: AxiosResponse<GHLLocationCustomValueResponse> = await this.axiosInstance.put(
        `/locations/${locationId}/customValues/${customValueId}`,
        valueData
      );

      return this.wrapResponse(response.data);
    } catch (error) {
      throw this.handleApiError(error as AxiosError<GHLErrorResponse>);
    }
  }

  /**
   * Delete custom value
   * DELETE /locations/{locationId}/customValues/{id}
   */
  async deleteLocationCustomValue(locationId: string, customValueId: string): Promise<GHLApiResponse<GHLCustomValueDeleteResponse>> {
    try {
      const response: AxiosResponse<GHLCustomValueDeleteResponse> = await this.axiosInstance.delete(
        `/locations/${locationId}/customValues/${customValueId}`
      );

      return this.wrapResponse(response.data);
    } catch (error) {
      throw this.handleApiError(error as AxiosError<GHLErrorResponse>);
    }
  }

  /**
   * TEMPLATES API METHODS
   */

  /**
   * Get location templates (SMS/Email)
   * GET /locations/{locationId}/templates
   */
  async getLocationTemplates(locationId: string, params: {
    originId: string;
    deleted?: boolean;
    skip?: number;
    limit?: number;
    type?: 'sms' | 'email' | 'whatsapp';
  }): Promise<GHLApiResponse<GHLLocationTemplatesResponse>> {
    try {
      const queryParams = {
        originId: params.originId,
        deleted: params.deleted || false,
        skip: params.skip || 0,
        limit: params.limit || 25,
        ...(params.type && { type: params.type })
      };

      const response: AxiosResponse<GHLLocationTemplatesResponse> = await this.axiosInstance.get(
        `/locations/${locationId}/templates`,
        { params: queryParams }
      );

      return this.wrapResponse(response.data);
    } catch (error) {
      throw this.handleApiError(error as AxiosError<GHLErrorResponse>);
    }
  }

  /**
   * Delete location template
   * DELETE /locations/{locationId}/templates/{id}
   */
  async deleteLocationTemplate(locationId: string, templateId: string): Promise<GHLApiResponse<any>> {
    try {
      const response: AxiosResponse<any> = await this.axiosInstance.delete(
        `/locations/${locationId}/templates/${templateId}`
      );

      return this.wrapResponse(response.data);
    } catch (error) {
      throw this.handleApiError(error as AxiosError<GHLErrorResponse>);
    }
  }

  /**
   * TIMEZONES API METHODS
   */

  /**
   * Get available timezones
   * GET /locations/{locationId}/timezones
   */
  async getTimezones(locationId?: string): Promise<GHLApiResponse<string[]>> {
    try {
      const endpoint = locationId ? `/locations/${locationId}/timezones` : '/locations/timezones';
      const response: AxiosResponse<string[]> = await this.axiosInstance.get(endpoint);

      return this.wrapResponse(response.data);
    } catch (error) {
      throw this.handleApiError(error as AxiosError<GHLErrorResponse>);
    }
  }

  /**
   * EMAIL ISV (VERIFICATION) API METHODS
   */

  /**
   * Verify email address or contact
   * POST /email/verify
   */
  async verifyEmail(locationId: string, verificationData: GHLEmailVerificationRequest): Promise<GHLApiResponse<GHLEmailVerificationResponse>> {
    try {
      const params = {
        locationId: locationId
      };

      const response: AxiosResponse<GHLEmailVerificationResponse> = await this.axiosInstance.post(
        '/email/verify',
        verificationData,
        { params }
      );

      return this.wrapResponse(response.data);
    } catch (error) {
      throw this.handleApiError(error as AxiosError<GHLErrorResponse>);
    }
  }

  /**
   * ADDITIONAL CONVERSATION/MESSAGE API METHODS
   */

  /**
   * Get email message by ID
   * GET /conversations/messages/email/{id}
   */
  async getEmailMessage(emailMessageId: string): Promise<GHLApiResponse<GHLEmailMessage>> {
    try {
      const response: AxiosResponse<GHLEmailMessage> = await this.axiosInstance.get(
        `/conversations/messages/email/${emailMessageId}`
      );

      return this.wrapResponse(response.data);
    } catch (error) {
      throw this.handleApiError(error as AxiosError<GHLErrorResponse>);
    }
  }

  /**
   * Cancel scheduled email message
   * DELETE /conversations/messages/email/{emailMessageId}/schedule
   */
  async cancelScheduledEmail(emailMessageId: string): Promise<GHLApiResponse<GHLCancelScheduledResponse>> {
    try {
      const response: AxiosResponse<GHLCancelScheduledResponse> = await this.axiosInstance.delete(
        `/conversations/messages/email/${emailMessageId}/schedule`
      );

      return this.wrapResponse(response.data);
    } catch (error) {
      throw this.handleApiError(error as AxiosError<GHLErrorResponse>);
    }
  }

  /**
   * Add inbound message manually
   * POST /conversations/messages/inbound
   */
  async addInboundMessage(messageData: GHLProcessInboundMessageRequest): Promise<GHLApiResponse<GHLProcessMessageResponse>> {
    try {
      const response: AxiosResponse<GHLProcessMessageResponse> = await this.axiosInstance.post(
        '/conversations/messages/inbound',
        messageData,
        { headers: this.getConversationHeaders() }
      );

      return this.wrapResponse(response.data);
    } catch (error) {
      throw this.handleApiError(error as AxiosError<GHLErrorResponse>);
    }
  }

  /**
   * Add outbound call manually
   * POST /conversations/messages/outbound
   */
  async addOutboundCall(messageData: GHLProcessOutboundMessageRequest): Promise<GHLApiResponse<GHLProcessMessageResponse>> {
    try {
      const response: AxiosResponse<GHLProcessMessageResponse> = await this.axiosInstance.post(
        '/conversations/messages/outbound',
        messageData,
        { headers: this.getConversationHeaders() }
      );

      return this.wrapResponse(response.data);
    } catch (error) {
      throw this.handleApiError(error as AxiosError<GHLErrorResponse>);
    }
  }

  /**
   * Cancel scheduled message
   * DELETE /conversations/messages/{messageId}/schedule
   */
  async cancelScheduledMessage(messageId: string): Promise<GHLApiResponse<GHLCancelScheduledResponse>> {
    try {
      const response: AxiosResponse<GHLCancelScheduledResponse> = await this.axiosInstance.delete(
        `/conversations/messages/${messageId}/schedule`,
        { headers: this.getConversationHeaders() }
      );

      return this.wrapResponse(response.data);
    } catch (error) {
      throw this.handleApiError(error as AxiosError<GHLErrorResponse>);
    }
  }

  /**
   * Upload file attachments for messages
   * POST /conversations/messages/upload
   */
  async uploadMessageAttachments(uploadData: GHLUploadFilesRequest): Promise<GHLApiResponse<GHLUploadFilesResponse>> {
    try {
      const response: AxiosResponse<GHLUploadFilesResponse> = await this.axiosInstance.post(
        '/conversations/messages/upload',
        uploadData,
        { 
          headers: {
            ...this.getConversationHeaders(),
            'Content-Type': 'multipart/form-data'
          }
        }
      );

      return this.wrapResponse(response.data);
    } catch (error) {
      throw this.handleApiError(error as AxiosError<GHLErrorResponse>);
    }
  }

  /**
   * Update message status
   * PUT /conversations/messages/{messageId}/status
   */
  async updateMessageStatus(messageId: string, statusData: GHLUpdateMessageStatusRequest): Promise<GHLApiResponse<GHLSendMessageResponse>> {
    try {
      const response: AxiosResponse<GHLSendMessageResponse> = await this.axiosInstance.put(
        `/conversations/messages/${messageId}/status`,
        statusData,
        { headers: this.getConversationHeaders() }
      );

      return this.wrapResponse(response.data);
    } catch (error) {
      throw this.handleApiError(error as AxiosError<GHLErrorResponse>);
    }
  }

  /**
   * Get message recording
   * GET /conversations/messages/{messageId}/locations/{locationId}/recording
   */
  async getMessageRecording(messageId: string, locationId?: string): Promise<GHLApiResponse<GHLMessageRecordingResponse>> {
    try {
      const locId = locationId || this.config.locationId;
      const response: AxiosResponse<ArrayBuffer> = await this.axiosInstance.get(
        `/conversations/messages/${messageId}/locations/${locId}/recording`,
        { 
          headers: this.getConversationHeaders(),
          responseType: 'arraybuffer'
        }
      );

      const recordingResponse: GHLMessageRecordingResponse = {
        audioData: response.data,
        contentType: String(response.headers['content-type'] || 'audio/x-wav'),
        contentDisposition: String(response.headers['content-disposition'] || 'attachment; filename=audio.wav')
      };

      return this.wrapResponse(recordingResponse);
    } catch (error) {
      throw this.handleApiError(error as AxiosError<GHLErrorResponse>);
    }
  }

  /**
   * Get message transcription
   * GET /conversations/locations/{locationId}/messages/{messageId}/transcription
   */
  async getMessageTranscription(messageId: string, locationId?: string): Promise<GHLApiResponse<GHLMessageTranscriptionResponse>> {
    try {
      const locId = locationId || this.config.locationId;
      const response: AxiosResponse<GHLMessageTranscription[]> = await this.axiosInstance.get(
        `/conversations/locations/${locId}/messages/${messageId}/transcription`,
        { headers: this.getConversationHeaders() }
      );

      return this.wrapResponse({ transcriptions: response.data });
    } catch (error) {
      throw this.handleApiError(error as AxiosError<GHLErrorResponse>);
    }
  }

  /**
   * Download message transcription
   * GET /conversations/locations/{locationId}/messages/{messageId}/transcription/download
   */
  async downloadMessageTranscription(messageId: string, locationId?: string): Promise<GHLApiResponse<string>> {
    try {
      const locId = locationId || this.config.locationId;
      const response: AxiosResponse<string> = await this.axiosInstance.get(
        `/conversations/locations/${locId}/messages/${messageId}/transcription/download`,
        { 
          headers: this.getConversationHeaders(),
          responseType: 'text'
        }
      );

      return this.wrapResponse(response.data);
    } catch (error) {
      throw this.handleApiError(error as AxiosError<GHLErrorResponse>);
    }
  }

  /**
   * Live chat typing indicator
   * POST /conversations/providers/live-chat/typing
   */
  async liveChatTyping(typingData: GHLLiveChatTypingRequest): Promise<GHLApiResponse<GHLLiveChatTypingResponse>> {
    try {
      const response: AxiosResponse<GHLLiveChatTypingResponse> = await this.axiosInstance.post(
        '/conversations/providers/live-chat/typing',
        typingData,
        { headers: this.getConversationHeaders() }
      );

      return this.wrapResponse(response.data);
    } catch (error) {
      throw this.handleApiError(error as AxiosError<GHLErrorResponse>);
    }
  }

  // ============================================================================
  // SOCIAL MEDIA POSTING API METHODS
  // ============================================================================

  // ===== POST MANAGEMENT =====

  /**
   * Search/List Social Media Posts
   */
  async searchSocialPosts(searchData: GHLSearchPostsRequest): Promise<GHLApiResponse<GHLSearchPostsResponse>> {
    try {
      const locationId = this.config.locationId;
      const response: AxiosResponse<GHLSearchPostsResponse> = await this.axiosInstance.post(
        `/social-media-posting/${locationId}/posts/list`,
        searchData
      );
      return this.wrapResponse(response.data);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Create Social Media Post
   */
  async createSocialPost(postData: GHLCreatePostRequest): Promise<GHLApiResponse<GHLCreatePostResponse>> {
    try {
      const locationId = this.config.locationId;
      const response: AxiosResponse<GHLCreatePostResponse> = await this.axiosInstance.post(
        `/social-media-posting/${locationId}/posts`,
        postData
      );
      return this.wrapResponse(response.data);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get Social Media Post by ID
   */
  async getSocialPost(postId: string): Promise<GHLApiResponse<GHLGetPostResponse>> {
    try {
      const locationId = this.config.locationId;
      const response: AxiosResponse<GHLGetPostResponse> = await this.axiosInstance.get(
        `/social-media-posting/${locationId}/posts/${postId}`
      );
      return this.wrapResponse(response.data);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Update Social Media Post
   */
  async updateSocialPost(postId: string, updateData: GHLUpdatePostRequest): Promise<GHLApiResponse<any>> {
    try {
      const locationId = this.config.locationId;
      const response: AxiosResponse<any> = await this.axiosInstance.put(
        `/social-media-posting/${locationId}/posts/${postId}`,
        updateData
      );
      return this.wrapResponse(response.data);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Delete Social Media Post
   */
  async deleteSocialPost(postId: string): Promise<GHLApiResponse<any>> {
    try {
      const locationId = this.config.locationId;
      const response: AxiosResponse<any> = await this.axiosInstance.delete(
        `/social-media-posting/${locationId}/posts/${postId}`
      );
      return this.wrapResponse(response.data);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Bulk Delete Social Media Posts
   */
  async bulkDeleteSocialPosts(deleteData: GHLBulkDeletePostsRequest): Promise<GHLApiResponse<GHLBulkDeleteResponse>> {
    try {
      const locationId = this.config.locationId;
      const response: AxiosResponse<GHLBulkDeleteResponse> = await this.axiosInstance.post(
        `/social-media-posting/${locationId}/posts/bulk-delete`,
        deleteData
      );
      return this.wrapResponse(response.data);
    } catch (error) {
      throw error;
    }
  }

  // ===== ACCOUNT MANAGEMENT =====

  /**
   * Get Social Media Accounts and Groups
   */
  async getSocialAccounts(): Promise<GHLApiResponse<GHLGetAccountsResponse>> {
    try {
      const locationId = this.config.locationId;
      const response: AxiosResponse<GHLGetAccountsResponse> = await this.axiosInstance.get(
        `/social-media-posting/${locationId}/accounts`
      );
      return this.wrapResponse(response.data);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Delete Social Media Account
   */
  async deleteSocialAccount(accountId: string, companyId?: string, userId?: string): Promise<GHLApiResponse<any>> {
    try {
      const locationId = this.config.locationId;
      const params: any = {};
      if (companyId) params.companyId = companyId;
      if (userId) params.userId = userId;
      
      const response: AxiosResponse<any> = await this.axiosInstance.delete(
        `/social-media-posting/${locationId}/accounts/${accountId}`,
        { params }
      );
      return this.wrapResponse(response.data);
    } catch (error) {
      throw error;
    }
  }

  // ===== CSV OPERATIONS =====

  /**
   * Upload CSV for Social Media Posts
   */
  async uploadSocialCSV(csvData: GHLUploadCSVRequest): Promise<GHLApiResponse<GHLUploadCSVResponse>> {
    try {
      const locationId = this.config.locationId;
      // Note: This would typically use FormData for file upload
      const response: AxiosResponse<GHLUploadCSVResponse> = await this.axiosInstance.post(
        `/social-media-posting/${locationId}/csv`,
        csvData
      );
      return this.wrapResponse(response.data);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get CSV Upload Status
   */
  async getSocialCSVUploadStatus(skip?: number, limit?: number, includeUsers?: boolean, userId?: string): Promise<GHLApiResponse<GHLGetUploadStatusResponse>> {
    try {
      const locationId = this.config.locationId;
      const params: any = {};
      if (skip !== undefined) params.skip = skip.toString();
      if (limit !== undefined) params.limit = limit.toString();
      if (includeUsers !== undefined) params.includeUsers = includeUsers.toString();
      if (userId) params.userId = userId;
      
      const response: AxiosResponse<GHLGetUploadStatusResponse> = await this.axiosInstance.get(
        `/social-media-posting/${locationId}/csv`,
        { params }
      );
      return this.wrapResponse(response.data);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Set Accounts for CSV Import
   */
  async setSocialCSVAccounts(accountsData: GHLSetAccountsRequest): Promise<GHLApiResponse<any>> {
    try {
      const locationId = this.config.locationId;
      const response: AxiosResponse<any> = await this.axiosInstance.post(
        `/social-media-posting/${locationId}/set-accounts`,
        accountsData
      );
      return this.wrapResponse(response.data);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get CSV Posts
   */
  async getSocialCSVPosts(csvId: string, skip?: number, limit?: number): Promise<GHLApiResponse<any>> {
    try {
      const locationId = this.config.locationId;
      const params: any = {};
      if (skip !== undefined) params.skip = skip.toString();
      if (limit !== undefined) params.limit = limit.toString();
      
      const response: AxiosResponse<any> = await this.axiosInstance.get(
        `/social-media-posting/${locationId}/csv/${csvId}`,
        { params }
      );
      return this.wrapResponse(response.data);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Start CSV Finalization
   */
  async finalizeSocialCSV(csvId: string, finalizeData: GHLCSVFinalizeRequest): Promise<GHLApiResponse<any>> {
    try {
      const locationId = this.config.locationId;
      const response: AxiosResponse<any> = await this.axiosInstance.patch(
        `/social-media-posting/${locationId}/csv/${csvId}`,
        finalizeData
      );
      return this.wrapResponse(response.data);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Delete CSV Import
   */
  async deleteSocialCSV(csvId: string): Promise<GHLApiResponse<any>> {
    try {
      const locationId = this.config.locationId;
      const response: AxiosResponse<any> = await this.axiosInstance.delete(
        `/social-media-posting/${locationId}/csv/${csvId}`
      );
      return this.wrapResponse(response.data);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Delete CSV Post
   */
  async deleteSocialCSVPost(csvId: string, postId: string): Promise<GHLApiResponse<any>> {
    try {
      const locationId = this.config.locationId;
      const response: AxiosResponse<any> = await this.axiosInstance.delete(
        `/social-media-posting/${locationId}/csv/${csvId}/post/${postId}`
      );
      return this.wrapResponse(response.data);
    } catch (error) {
      throw error;
    }
  }

  // ===== CATEGORIES & TAGS =====

  /**
   * Get Social Media Categories
   */
  async getSocialCategories(searchText?: string, limit?: number, skip?: number): Promise<GHLApiResponse<GHLGetCategoriesResponse>> {
    // TODO: Implement this method properly
    throw new Error('Method not yet implemented');
  }

  // TODO: Implement remaining social media API methods
  async getSocialCategory(categoryId: string): Promise<GHLApiResponse<GHLGetCategoryResponse>> {
    throw new Error('Method not yet implemented');
  }

  async getSocialTags(searchText?: string, limit?: number, skip?: number): Promise<GHLApiResponse<GHLGetTagsResponse>> {
    throw new Error('Method not yet implemented');
  }

  async getSocialTagsByIds(tagData: GHLGetTagsByIdsRequest): Promise<GHLApiResponse<GHLGetTagsByIdsResponse>> {
    throw new Error('Method not yet implemented');
  }

  async startSocialOAuth(platform: GHLSocialPlatform, userId: string, page?: string, reconnect?: boolean): Promise<GHLApiResponse<GHLOAuthStartResponse>> {
    throw new Error('Method not yet implemented');
  }

  async getGoogleBusinessLocations(accountId: string): Promise<GHLApiResponse<GHLGetGoogleLocationsResponse>> {
    throw new Error('Method not yet implemented');
  }

  async setGoogleBusinessLocations(accountId: string, locationData: GHLAttachGMBLocationRequest): Promise<GHLApiResponse<GHLSocialAccount>> {
    throw new Error('Method not yet implemented');
  }

  async getFacebookPages(accountId: string): Promise<GHLApiResponse<GHLGetFacebookPagesResponse>> {
    throw new Error('Method not yet implemented');
  }

  async attachFacebookPages(accountId: string, pageData: GHLAttachFBAccountRequest): Promise<GHLApiResponse<GHLSocialAccount>> {
    throw new Error('Method not yet implemented');
  }

  async getInstagramAccounts(accountId: string): Promise<GHLApiResponse<GHLGetInstagramAccountsResponse>> {
    throw new Error('Method not yet implemented');
  }

  async attachInstagramAccounts(accountId: string, accountData: GHLAttachIGAccountRequest): Promise<GHLApiResponse<GHLSocialAccount>> {
    throw new Error('Method not yet implemented');
  }

  async getLinkedInAccounts(accountId: string): Promise<GHLApiResponse<GHLGetLinkedInAccountsResponse>> {
    throw new Error('Method not yet implemented');
  }

  async attachLinkedInAccounts(accountId: string, accountData: GHLAttachLinkedInAccountRequest): Promise<GHLApiResponse<GHLSocialAccount>> {
    throw new Error('Method not yet implemented');
  }

  async getTwitterProfile(accountId: string): Promise<GHLApiResponse<GHLGetTwitterAccountsResponse>> {
    throw new Error('Method not yet implemented');
  }

  async attachTwitterProfile(accountId: string, profileData: GHLAttachTwitterAccountRequest): Promise<GHLApiResponse<GHLSocialAccount>> {
    throw new Error('Method not yet implemented');
  }

  async getTikTokProfile(accountId: string): Promise<GHLApiResponse<GHLGetTikTokAccountsResponse>> {
    throw new Error('Method not yet implemented');
  }

  async attachTikTokProfile(accountId: string, profileData: GHLAttachTikTokAccountRequest): Promise<GHLApiResponse<GHLSocialAccount>> {
    throw new Error('Method not yet implemented');
  }

  async getTikTokBusinessProfile(accountId: string): Promise<GHLApiResponse<GHLGetTikTokAccountsResponse>> {
    throw new Error('Method not yet implemented');
  }

  // ===== MISSING CALENDAR GROUPS MANAGEMENT METHODS =====

  /**
   * Validate calendar group slug
   * GET /calendars/groups/slug/validate
   */
  async validateCalendarGroupSlug(slug: string, locationId?: string): Promise<GHLApiResponse<GHLValidateGroupSlugResponse>> {
    try {
      const params = {
        locationId: locationId || this.config.locationId,
        slug
      };

      const response: AxiosResponse<GHLValidateGroupSlugResponse> = await this.axiosInstance.get(
        '/calendars/groups/slug/validate',
        { params }
      );

      return this.wrapResponse(response.data);
    } catch (error) {
      throw this.handleApiError(error as AxiosError<GHLErrorResponse>);
    }
  }

  /**
   * Update calendar group by ID
   * PUT /calendars/groups/{groupId}
   */
  async updateCalendarGroup(groupId: string, updateData: GHLUpdateCalendarGroupRequest): Promise<GHLApiResponse<GHLGroupSuccessResponse>> {
    try {
      const response: AxiosResponse<GHLGroupSuccessResponse> = await this.axiosInstance.put(
        `/calendars/groups/${groupId}`,
        updateData
      );

      return this.wrapResponse(response.data);
    } catch (error) {
      throw this.handleApiError(error as AxiosError<GHLErrorResponse>);
    }
  }

  /**
   * Delete calendar group by ID
   * DELETE /calendars/groups/{groupId}
   */
  async deleteCalendarGroup(groupId: string): Promise<GHLApiResponse<GHLGroupSuccessResponse>> {
    try {
      const response: AxiosResponse<GHLGroupSuccessResponse> = await this.axiosInstance.delete(
        `/calendars/groups/${groupId}`
      );

      return this.wrapResponse(response.data);
    } catch (error) {
      throw this.handleApiError(error as AxiosError<GHLErrorResponse>);
    }
  }

  /**
   * Disable calendar group
   * POST /calendars/groups/{groupId}/status
   */
  async disableCalendarGroup(groupId: string, isActive: boolean): Promise<GHLApiResponse<GHLGroupSuccessResponse>> {
    try {
      const payload: GHLGroupStatusUpdateRequest = { isActive };

      const response: AxiosResponse<GHLGroupSuccessResponse> = await this.axiosInstance.post(
        `/calendars/groups/${groupId}/status`,
        payload
      );

      return this.wrapResponse(response.data);
    } catch (error) {
      throw this.handleApiError(error as AxiosError<GHLErrorResponse>);
    }
  }

  // ===== APPOINTMENT NOTES METHODS =====

  /**
   * Get appointment notes
   * GET /calendars/events/appointments/{appointmentId}/notes
   */
  async getAppointmentNotes(appointmentId: string, limit = 10, offset = 0): Promise<GHLApiResponse<GHLGetAppointmentNotesResponse>> {
    try {
      const params = { limit, offset };

      const response: AxiosResponse<GHLGetAppointmentNotesResponse> = await this.axiosInstance.get(
        `/calendars/events/appointments/${appointmentId}/notes`,
        { params }
      );

      return this.wrapResponse(response.data);
    } catch (error) {
      throw this.handleApiError(error as AxiosError<GHLErrorResponse>);
    }
  }

  /**
   * Create appointment note
   * POST /calendars/events/appointments/{appointmentId}/notes
   */
  async createAppointmentNote(appointmentId: string, noteData: GHLCreateAppointmentNoteRequest): Promise<GHLApiResponse<GHLAppointmentNoteResponse>> {
    try {
      const response: AxiosResponse<GHLAppointmentNoteResponse> = await this.axiosInstance.post(
        `/calendars/events/appointments/${appointmentId}/notes`,
        noteData
      );

      return this.wrapResponse(response.data);
    } catch (error) {
      throw this.handleApiError(error as AxiosError<GHLErrorResponse>);
    }
  }

  /**
   * Update appointment note
   * PUT /calendars/events/appointments/{appointmentId}/notes/{noteId}
   */
  async updateAppointmentNote(appointmentId: string, noteId: string, updateData: GHLUpdateAppointmentNoteRequest): Promise<GHLApiResponse<GHLAppointmentNoteResponse>> {
    try {
      const response: AxiosResponse<GHLAppointmentNoteResponse> = await this.axiosInstance.put(
        `/calendars/events/appointments/${appointmentId}/notes/${noteId}`,
        updateData
      );

      return this.wrapResponse(response.data);
    } catch (error) {
      throw this.handleApiError(error as AxiosError<GHLErrorResponse>);
    }
  }

  /**
   * Delete appointment note
   * DELETE /calendars/events/appointments/{appointmentId}/notes/{noteId}
   */
  async deleteAppointmentNote(appointmentId: string, noteId: string): Promise<GHLApiResponse<GHLDeleteAppointmentNoteResponse>> {
    try {
      const response: AxiosResponse<GHLDeleteAppointmentNoteResponse> = await this.axiosInstance.delete(
        `/calendars/events/appointments/${appointmentId}/notes/${noteId}`
      );

      return this.wrapResponse(response.data);
    } catch (error) {
      throw this.handleApiError(error as AxiosError<GHLErrorResponse>);
    }
  }

  // ===== CALENDAR RESOURCES METHODS =====

  /**
   * Get calendar resources
   * GET /calendars/resources/{resourceType}
   */
  async getCalendarResources(resourceType: 'equipments' | 'rooms', limit = 20, skip = 0, locationId?: string): Promise<GHLApiResponse<GHLCalendarResource[]>> {
    try {
      const params = {
        locationId: locationId || this.config.locationId,
        limit,
        skip
      };

      const response: AxiosResponse<GHLCalendarResource[]> = await this.axiosInstance.get(
        `/calendars/resources/${resourceType}`,
        { params }
      );

      return this.wrapResponse(response.data);
    } catch (error) {
      throw this.handleApiError(error as AxiosError<GHLErrorResponse>);
    }
  }

  /**
   * Create calendar resource
   * POST /calendars/resources/{resourceType}
   */
  async createCalendarResource(resourceType: 'equipments' | 'rooms', resourceData: GHLCreateCalendarResourceRequest): Promise<GHLApiResponse<GHLCalendarResourceResponse>> {
    try {
      const payload = {
        ...resourceData,
        locationId: resourceData.locationId || this.config.locationId
      };

      const response: AxiosResponse<GHLCalendarResourceResponse> = await this.axiosInstance.post(
        `/calendars/resources/${resourceType}`,
        payload
      );

      return this.wrapResponse(response.data);
    } catch (error) {
      throw this.handleApiError(error as AxiosError<GHLErrorResponse>);
    }
  }

  /**
   * Get calendar resource by ID
   * GET /calendars/resources/{resourceType}/{resourceId}
   */
  async getCalendarResource(resourceType: 'equipments' | 'rooms', resourceId: string): Promise<GHLApiResponse<GHLCalendarResourceByIdResponse>> {
    try {
      const response: AxiosResponse<GHLCalendarResourceByIdResponse> = await this.axiosInstance.get(
        `/calendars/resources/${resourceType}/${resourceId}`
      );

      return this.wrapResponse(response.data);
    } catch (error) {
      throw this.handleApiError(error as AxiosError<GHLErrorResponse>);
    }
  }

  /**
   * Update calendar resource
   * PUT /calendars/resources/{resourceType}/{resourceId}
   */
  async updateCalendarResource(resourceType: 'equipments' | 'rooms', resourceId: string, updateData: GHLUpdateCalendarResourceRequest): Promise<GHLApiResponse<GHLCalendarResourceResponse>> {
    try {
      const response: AxiosResponse<GHLCalendarResourceResponse> = await this.axiosInstance.put(
        `/calendars/resources/${resourceType}/${resourceId}`,
        updateData
      );

      return this.wrapResponse(response.data);
    } catch (error) {
      throw this.handleApiError(error as AxiosError<GHLErrorResponse>);
    }
  }

  /**
   * Delete calendar resource
   * DELETE /calendars/resources/{resourceType}/{resourceId}
   */
  async deleteCalendarResource(resourceType: 'equipments' | 'rooms', resourceId: string): Promise<GHLApiResponse<GHLResourceDeleteResponse>> {
    try {
      const response: AxiosResponse<GHLResourceDeleteResponse> = await this.axiosInstance.delete(
        `/calendars/resources/${resourceType}/${resourceId}`
      );

      return this.wrapResponse(response.data);
    } catch (error) {
      throw this.handleApiError(error as AxiosError<GHLErrorResponse>);
    }
  }

  // ===== CALENDAR NOTIFICATIONS METHODS =====

  /**
   * Get calendar notifications
   * GET /calendars/{calendarId}/notifications
   */
  async getCalendarNotifications(calendarId: string, queryParams?: GHLGetCalendarNotificationsRequest): Promise<GHLApiResponse<GHLCalendarNotification[]>> {
    try {
      const params = {
        ...queryParams
      };

      const response: AxiosResponse<GHLCalendarNotification[]> = await this.axiosInstance.get(
        `/calendars/${calendarId}/notifications`,
        { params }
      );

      return this.wrapResponse(response.data);
    } catch (error) {
      throw this.handleApiError(error as AxiosError<GHLErrorResponse>);
    }
  }

  /**
   * Create calendar notifications
   * POST /calendars/{calendarId}/notifications
   */
  async createCalendarNotifications(calendarId: string, notifications: GHLCreateCalendarNotificationRequest[]): Promise<GHLApiResponse<GHLCalendarNotification[]>> {
    try {
      const payload = { notifications };

      const response: AxiosResponse<GHLCalendarNotification[]> = await this.axiosInstance.post(
        `/calendars/${calendarId}/notifications`,
        payload
      );

      return this.wrapResponse(response.data);
    } catch (error) {
      throw this.handleApiError(error as AxiosError<GHLErrorResponse>);
    }
  }

  /**
   * Get calendar notification by ID
   * GET /calendars/{calendarId}/notifications/{notificationId}
   */
  async getCalendarNotification(calendarId: string, notificationId: string): Promise<GHLApiResponse<GHLCalendarNotification>> {
    try {
      const response: AxiosResponse<GHLCalendarNotification> = await this.axiosInstance.get(
        `/calendars/${calendarId}/notifications/${notificationId}`
      );

      return this.wrapResponse(response.data);
    } catch (error) {
      throw this.handleApiError(error as AxiosError<GHLErrorResponse>);
    }
  }

  /**
   * Update calendar notification
   * PUT /calendars/{calendarId}/notifications/{notificationId}
   */
  async updateCalendarNotification(calendarId: string, notificationId: string, updateData: GHLUpdateCalendarNotificationRequest): Promise<GHLApiResponse<GHLCalendarNotification>> {
    try {
      const response: AxiosResponse<GHLCalendarNotification> = await this.axiosInstance.put(
        `/calendars/${calendarId}/notifications/${notificationId}`,
        updateData
      );

      return this.wrapResponse(response.data);
    } catch (error) {
      throw this.handleApiError(error as AxiosError<GHLErrorResponse>);
    }
  }

  /**
   * Delete calendar notification
   * DELETE /calendars/{calendarId}/notifications/{notificationId}
   */
  async deleteCalendarNotification(calendarId: string, notificationId: string): Promise<GHLApiResponse<GHLCalendarNotificationDeleteResponse>> {
    try {
      const response: AxiosResponse<GHLCalendarNotificationDeleteResponse> = await this.axiosInstance.delete(
        `/calendars/${calendarId}/notifications/${notificationId}`
      );

      return this.wrapResponse(response.data);
    } catch (error) {
      throw this.handleApiError(error as AxiosError<GHLErrorResponse>);
    }
  }

  /**
   * Get blocked slots by location
   * GET /calendars/blocked-slots
   */
  async getBlockedSlotsByLocation(slotParams: GHLGetBlockedSlotsRequest): Promise<GHLApiResponse<GHLGetCalendarEventsResponse>> {
    try {
      const params = new URLSearchParams({
        locationId: slotParams.locationId,
        startTime: slotParams.startTime,
        endTime: slotParams.endTime,
        ...(slotParams.userId && { userId: slotParams.userId }),
        ...(slotParams.calendarId && { calendarId: slotParams.calendarId }),
        ...(slotParams.groupId && { groupId: slotParams.groupId })
      });

      const response: AxiosResponse<GHLGetCalendarEventsResponse> = await this.axiosInstance.get(
        `/calendars/blocked-slots?${params}`
      );

      return this.wrapResponse(response.data);
    } catch (error) {
      throw this.handleApiError(error as AxiosError<GHLErrorResponse>);
    }
  }

  /**
   * Create a new block slot
   * POST /calendars/blocked-slots
   */
  async createBlockSlot(blockSlotData: GHLCreateBlockSlotRequest): Promise<GHLApiResponse<GHLBlockSlotResponse>> {
    try {
      const payload = {
        ...blockSlotData,
        locationId: blockSlotData.locationId || this.config.locationId
      };

      const response: AxiosResponse<GHLBlockSlotResponse> = await this.axiosInstance.post(
        '/calendars/blocked-slots',
        payload
      );

      return this.wrapResponse(response.data);
    } catch (error) {
      throw this.handleApiError(error as AxiosError<GHLErrorResponse>);
    }
  }

  // ===== MEDIA LIBRARY API METHODS =====

  /**
   * Get list of files and folders from media library
   * GET /medias/files
   */
  async getMediaFiles(params: GHLGetMediaFilesRequest): Promise<GHLApiResponse<GHLGetMediaFilesResponse>> {
    try {
      const queryParams = new URLSearchParams({
        sortBy: params.sortBy,
        sortOrder: params.sortOrder,
        altType: params.altType,
        altId: params.altId,
        ...(params.offset !== undefined && { offset: params.offset.toString() }),
        ...(params.limit !== undefined && { limit: params.limit.toString() }),
        ...(params.type && { type: params.type }),
        ...(params.query && { query: params.query }),
        ...(params.parentId && { parentId: params.parentId })
      });

      const response: AxiosResponse<GHLGetMediaFilesResponse> = await this.axiosInstance.get(
        `/medias/files?${queryParams}`
      );

      return this.wrapResponse(response.data);
    } catch (error) {
      throw this.handleApiError(error as AxiosError<GHLErrorResponse>);
    }
  }

  /**
   * Upload file to media library
   * POST /medias/upload-file
   */
  async uploadMediaFile(uploadData: GHLUploadMediaFileRequest): Promise<GHLApiResponse<GHLUploadMediaFileResponse>> {
    try {
      const formData = new FormData();

      // Handle file upload (either direct file or hosted file URL)
      if (uploadData.hosted && uploadData.fileUrl) {
        formData.append('hosted', 'true');
        formData.append('fileUrl', uploadData.fileUrl);
      } else if (uploadData.file) {
        formData.append('hosted', 'false');
        formData.append('file', uploadData.file);
      } else {
        throw new Error('Either file or fileUrl (with hosted=true) must be provided');
      }

      // Add optional fields
      if (uploadData.name) {
        formData.append('name', uploadData.name);
      }
      if (uploadData.parentId) {
        formData.append('parentId', uploadData.parentId);
      }

      const response: AxiosResponse<GHLUploadMediaFileResponse> = await this.axiosInstance.post(
        '/medias/upload-file',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          }
        }
      );

      return this.wrapResponse(response.data);
    } catch (error) {
      throw this.handleApiError(error as AxiosError<GHLErrorResponse>);
    }
  }

  /**
   * Delete file or folder from media library
   * DELETE /medias/{id}
   */
  async deleteMediaFile(deleteParams: GHLDeleteMediaRequest): Promise<GHLApiResponse<GHLDeleteMediaResponse>> {
    try {
      const queryParams = new URLSearchParams({
        altType: deleteParams.altType,
        altId: deleteParams.altId
      });

      const response: AxiosResponse<GHLDeleteMediaResponse> = await this.axiosInstance.delete(
        `/medias/${deleteParams.id}?${queryParams}`
      );

      return this.wrapResponse({ success: true, message: 'Media file deleted successfully' });
    } catch (error) {
      throw this.handleApiError(error as AxiosError<GHLErrorResponse>);
    }
  }

  // ===== CUSTOM OBJECTS API METHODS =====

  /**
   * Get all objects for a location
   * GET /objects/
   */
  async getObjectsByLocation(locationId?: string): Promise<GHLApiResponse<GHLObjectListResponse>> {
    try {
      const params = {
        locationId: locationId || this.config.locationId
      };

      const response: AxiosResponse<GHLObjectListResponse> = await this.axiosInstance.get(
        '/objects/',
        { params }
      );

      return this.wrapResponse(response.data);
    } catch (error) {
      throw this.handleApiError(error as AxiosError<GHLErrorResponse>);
    }
  }

  /**
   * Create custom object schema
   * POST /objects/
   */
  async createObjectSchema(schemaData: GHLCreateObjectSchemaRequest): Promise<GHLApiResponse<GHLObjectSchemaResponse>> {
    try {
      const payload = {
        ...schemaData,
        locationId: schemaData.locationId || this.config.locationId
      };

      const response: AxiosResponse<GHLObjectSchemaResponse> = await this.axiosInstance.post(
        '/objects/',
        payload
      );

      return this.wrapResponse(response.data);
    } catch (error) {
      throw this.handleApiError(error as AxiosError<GHLErrorResponse>);
    }
  }

  /**
   * Get object schema by key/id
   * GET /objects/{key}
   */
  async getObjectSchema(params: GHLGetObjectSchemaRequest): Promise<GHLApiResponse<GHLGetObjectSchemaResponse>> {
    try {
      const queryParams = {
        locationId: params.locationId || this.config.locationId,
        ...(params.fetchProperties !== undefined && { fetchProperties: params.fetchProperties.toString() })
      };

      const response: AxiosResponse<GHLGetObjectSchemaResponse> = await this.axiosInstance.get(
        `/objects/${params.key}`,
        { params: queryParams }
      );

      return this.wrapResponse(response.data);
    } catch (error) {
      throw this.handleApiError(error as AxiosError<GHLErrorResponse>);
    }
  }

  /**
   * Update object schema by key/id
   * PUT /objects/{key}
   */
  async updateObjectSchema(key: string, updateData: GHLUpdateObjectSchemaRequest): Promise<GHLApiResponse<GHLObjectSchemaResponse>> {
    try {
      const payload = {
        ...updateData,
        locationId: updateData.locationId || this.config.locationId
      };

      const response: AxiosResponse<GHLObjectSchemaResponse> = await this.axiosInstance.put(
        `/objects/${key}`,
        payload
      );

      return this.wrapResponse(response.data);
    } catch (error) {
      throw this.handleApiError(error as AxiosError<GHLErrorResponse>);
    }
  }

  /**
   * Create object record
   * POST /objects/{schemaKey}/records
   */
  async createObjectRecord(schemaKey: string, recordData: GHLCreateObjectRecordRequest): Promise<GHLApiResponse<GHLDetailedObjectRecordResponse>> {
    try {
      const payload = {
        ...recordData,
        locationId: recordData.locationId || this.config.locationId
      };

      const response: AxiosResponse<GHLDetailedObjectRecordResponse> = await this.axiosInstance.post(
        `/objects/${schemaKey}/records`,
        payload
      );

      return this.wrapResponse(response.data);
    } catch (error) {
      throw this.handleApiError(error as AxiosError<GHLErrorResponse>);
    }
  }

  /**
   * Get object record by id
   * GET /objects/{schemaKey}/records/{id}
   */
  async getObjectRecord(schemaKey: string, recordId: string): Promise<GHLApiResponse<GHLObjectRecordResponse>> {
    try {
      const response: AxiosResponse<GHLObjectRecordResponse> = await this.axiosInstance.get(
        `/objects/${schemaKey}/records/${recordId}`
      );

      return this.wrapResponse(response.data);
    } catch (error) {
      throw this.handleApiError(error as AxiosError<GHLErrorResponse>);
    }
  }

  /**
   * Update object record
   * PUT /objects/{schemaKey}/records/{id}
   */
  async updateObjectRecord(schemaKey: string, recordId: string, updateData: GHLUpdateObjectRecordRequest): Promise<GHLApiResponse<GHLObjectRecordResponse>> {
    try {
      const queryParams = {
        locationId: updateData.locationId || this.config.locationId
      };

      const response: AxiosResponse<GHLObjectRecordResponse> = await this.axiosInstance.put(
        `/objects/${schemaKey}/records/${recordId}`,
        updateData,
        { params: queryParams }
      );

      return this.wrapResponse(response.data);
    } catch (error) {
      throw this.handleApiError(error as AxiosError<GHLErrorResponse>);
    }
  }

  /**
   * Delete object record
   * DELETE /objects/{schemaKey}/records/{id}
   */
  async deleteObjectRecord(schemaKey: string, recordId: string): Promise<GHLApiResponse<GHLObjectRecordDeleteResponse>> {
    try {
      const response: AxiosResponse<GHLObjectRecordDeleteResponse> = await this.axiosInstance.delete(
        `/objects/${schemaKey}/records/${recordId}`
      );

      return this.wrapResponse(response.data);
    } catch (error) {
      throw this.handleApiError(error as AxiosError<GHLErrorResponse>);
    }
  }

  /**
   * Search object records
   * POST /objects/{schemaKey}/records/search
   */
  async searchObjectRecords(schemaKey: string, searchData: GHLSearchObjectRecordsRequest): Promise<GHLApiResponse<GHLSearchObjectRecordsResponse>> {
    try {
      const payload = {
        ...searchData,
        locationId: searchData.locationId || this.config.locationId
      };

      const response: AxiosResponse<GHLSearchObjectRecordsResponse> = await this.axiosInstance.post(
        `/objects/${schemaKey}/records/search`,
        payload
      );

      return this.wrapResponse(response.data);
    } catch (error) {
      throw this.handleApiError(error as AxiosError<GHLErrorResponse>);
    }
  }

  // ===== ASSOCIATIONS API METHODS =====

  /**
   * Get all associations for a location
   * GET /associations/
   */
  async getAssociations(params: GHLGetAssociationsRequest): Promise<GHLApiResponse<GHLGetAssociationsResponse>> {
    try {
      const queryParams = {
        locationId: params.locationId || this.config.locationId,
        skip: params.skip.toString(),
        limit: params.limit.toString()
      };

      const response: AxiosResponse<GHLGetAssociationsResponse> = await this.axiosInstance.get(
        '/associations/',
        { params: queryParams }
      );

      return this.wrapResponse(response.data);
    } catch (error) {
      throw this.handleApiError(error as AxiosError<GHLErrorResponse>);
    }
  }

  /**
   * Create association
   * POST /associations/
   */
  async createAssociation(associationData: GHLCreateAssociationRequest): Promise<GHLApiResponse<GHLAssociationResponse>> {
    try {
      const payload = {
        ...associationData,
        locationId: associationData.locationId || this.config.locationId
      };

      const response: AxiosResponse<GHLAssociationResponse> = await this.axiosInstance.post(
        '/associations/',
        payload
      );

      return this.wrapResponse(response.data);
    } catch (error) {
      throw this.handleApiError(error as AxiosError<GHLErrorResponse>);
    }
  }

  /**
   * Get association by ID
   * GET /associations/{associationId}
   */
  async getAssociationById(associationId: string): Promise<GHLApiResponse<GHLAssociationResponse>> {
    try {
      const response: AxiosResponse<GHLAssociationResponse> = await this.axiosInstance.get(
        `/associations/${associationId}`
      );

      return this.wrapResponse(response.data);
    } catch (error) {
      throw this.handleApiError(error as AxiosError<GHLErrorResponse>);
    }
  }

  /**
   * Update association
   * PUT /associations/{associationId}
   */
  async updateAssociation(associationId: string, updateData: GHLUpdateAssociationRequest): Promise<GHLApiResponse<GHLAssociationResponse>> {
    try {
      const response: AxiosResponse<GHLAssociationResponse> = await this.axiosInstance.put(
        `/associations/${associationId}`,
        updateData
      );

      return this.wrapResponse(response.data);
    } catch (error) {
      throw this.handleApiError(error as AxiosError<GHLErrorResponse>);
    }
  }

  /**
   * Delete association
   * DELETE /associations/{associationId}
   */
  async deleteAssociation(associationId: string): Promise<GHLApiResponse<GHLDeleteAssociationResponse>> {
    try {
      const response: AxiosResponse<GHLDeleteAssociationResponse> = await this.axiosInstance.delete(
        `/associations/${associationId}`
      );

      return this.wrapResponse(response.data);
    } catch (error) {
      throw this.handleApiError(error as AxiosError<GHLErrorResponse>);
    }
  }

  /**
   * Get association by key name
   * GET /associations/key/{key_name}
   */
  async getAssociationByKey(params: GHLGetAssociationByKeyRequest): Promise<GHLApiResponse<GHLAssociationResponse>> {
    try {
      const queryParams = {
        locationId: params.locationId || this.config.locationId
      };

      const response: AxiosResponse<GHLAssociationResponse> = await this.axiosInstance.get(
        `/associations/key/${params.keyName}`,
        { params: queryParams }
      );

      return this.wrapResponse(response.data);
    } catch (error) {
      throw this.handleApiError(error as AxiosError<GHLErrorResponse>);
    }
  }

  /**
   * Get association by object key
   * GET /associations/objectKey/{objectKey}
   */
  async getAssociationByObjectKey(params: GHLGetAssociationByObjectKeyRequest): Promise<GHLApiResponse<GHLAssociationResponse>> {
    try {
      const queryParams = params.locationId ? {
        locationId: params.locationId
      } : {};

      const response: AxiosResponse<GHLAssociationResponse> = await this.axiosInstance.get(
        `/associations/objectKey/${params.objectKey}`,
        { params: queryParams }
      );

      return this.wrapResponse(response.data);
    } catch (error) {
      throw this.handleApiError(error as AxiosError<GHLErrorResponse>);
    }
  }

  /**
   * Create relation between entities
   * POST /associations/relations
   */
  async createRelation(relationData: GHLCreateRelationRequest): Promise<GHLApiResponse<GHLAssociationResponse>> {
    try {
      const payload = {
        ...relationData,
        locationId: relationData.locationId || this.config.locationId
      };

      const response: AxiosResponse<GHLAssociationResponse> = await this.axiosInstance.post(
        '/associations/relations',
        payload
      );

      return this.wrapResponse(response.data);
    } catch (error) {
      throw this.handleApiError(error as AxiosError<GHLErrorResponse>);
    }
  }

  /**
   * Get relations by record ID
   * GET /associations/relations/{recordId}
   */
  async getRelationsByRecord(params: GHLGetRelationsByRecordRequest): Promise<GHLApiResponse<GHLGetRelationsResponse>> {
    try {
      const queryParams = {
        locationId: params.locationId || this.config.locationId,
        skip: params.skip.toString(),
        limit: params.limit.toString(),
        ...(params.associationIds && { associationIds: params.associationIds })
      };

      const response: AxiosResponse<GHLGetRelationsResponse> = await this.axiosInstance.get(
        `/associations/relations/${params.recordId}`,
        { params: queryParams }
      );

      return this.wrapResponse(response.data);
    } catch (error) {
      throw this.handleApiError(error as AxiosError<GHLErrorResponse>);
    }
  }

  /**
   * Delete relation
   * DELETE /associations/relations/{relationId}
   */
  async deleteRelation(params: GHLDeleteRelationRequest): Promise<GHLApiResponse<GHLAssociationResponse>> {
    try {
      const queryParams = {
        locationId: params.locationId || this.config.locationId
      };

      const response: AxiosResponse<GHLAssociationResponse> = await this.axiosInstance.delete(
        `/associations/relations/${params.relationId}`,
        { params: queryParams }
      );

      return this.wrapResponse(response.data);
    } catch (error) {
      throw this.handleApiError(error as AxiosError<GHLErrorResponse>);
    }
  }

  // ===== CUSTOM FIELDS V2 API METHODS =====

  /**
   * Get custom field or folder by ID
   * GET /custom-fields/{id}
   */
  async getCustomFieldV2ById(id: string): Promise<GHLApiResponse<GHLV2CustomFieldResponse>> {
    try {
      const response: AxiosResponse<GHLV2CustomFieldResponse> = await this.axiosInstance.get(
        `/custom-fields/${id}`
      );

      return this.wrapResponse(response.data);
    } catch (error) {
      throw this.handleApiError(error as AxiosError<GHLErrorResponse>);
    }
  }

  /**
   * Create custom field
   * POST /custom-fields/
   */
  async createCustomFieldV2(fieldData: GHLV2CreateCustomFieldRequest): Promise<GHLApiResponse<GHLV2CustomFieldResponse>> {
    try {
      const payload = {
        ...fieldData,
        locationId: fieldData.locationId || this.config.locationId
      };

      const response: AxiosResponse<GHLV2CustomFieldResponse> = await this.axiosInstance.post(
        '/custom-fields/',
        payload
      );

      return this.wrapResponse(response.data);
    } catch (error) {
      throw this.handleApiError(error as AxiosError<GHLErrorResponse>);
    }
  }

  /**
   * Update custom field by ID
   * PUT /custom-fields/{id}
   */
  async updateCustomFieldV2(id: string, fieldData: GHLV2UpdateCustomFieldRequest): Promise<GHLApiResponse<GHLV2CustomFieldResponse>> {
    try {
      const payload = {
        ...fieldData,
        locationId: fieldData.locationId || this.config.locationId
      };

      const response: AxiosResponse<GHLV2CustomFieldResponse> = await this.axiosInstance.put(
        `/custom-fields/${id}`,
        payload
      );

      return this.wrapResponse(response.data);
    } catch (error) {
      throw this.handleApiError(error as AxiosError<GHLErrorResponse>);
    }
  }

  /**
   * Delete custom field by ID
   * DELETE /custom-fields/{id}
   */
  async deleteCustomFieldV2(id: string): Promise<GHLApiResponse<GHLV2DeleteCustomFieldResponse>> {
    try {
      const response: AxiosResponse<GHLV2DeleteCustomFieldResponse> = await this.axiosInstance.delete(
        `/custom-fields/${id}`
      );

      return this.wrapResponse(response.data);
    } catch (error) {
      throw this.handleApiError(error as AxiosError<GHLErrorResponse>);
    }
  }

  /**
   * Get custom fields by object key
   * GET /custom-fields/object-key/{objectKey}
   */
  async getCustomFieldsV2ByObjectKey(params: GHLV2GetCustomFieldsByObjectKeyRequest): Promise<GHLApiResponse<GHLV2CustomFieldsResponse>> {
    try {
      const queryParams = {
        locationId: params.locationId || this.config.locationId
      };

      const response: AxiosResponse<GHLV2CustomFieldsResponse> = await this.axiosInstance.get(
        `/custom-fields/object-key/${params.objectKey}`,
        { params: queryParams }
      );

      return this.wrapResponse(response.data);
    } catch (error) {
      throw this.handleApiError(error as AxiosError<GHLErrorResponse>);
    }
  }

  /**
   * Create custom field folder
   * POST /custom-fields/folder
   */
  async createCustomFieldV2Folder(folderData: GHLV2CreateCustomFieldFolderRequest): Promise<GHLApiResponse<GHLV2CustomFieldFolderResponse>> {
    try {
      const payload = {
        ...folderData,
        locationId: folderData.locationId || this.config.locationId
      };

      const response: AxiosResponse<GHLV2CustomFieldFolderResponse> = await this.axiosInstance.post(
        '/custom-fields/folder',
        payload
      );

      return this.wrapResponse(response.data);
    } catch (error) {
      throw this.handleApiError(error as AxiosError<GHLErrorResponse>);
    }
  }

  /**
   * Update custom field folder name
   * PUT /custom-fields/folder/{id}
   */
  async updateCustomFieldV2Folder(id: string, folderData: GHLV2UpdateCustomFieldFolderRequest): Promise<GHLApiResponse<GHLV2CustomFieldFolderResponse>> {
    try {
      const payload = {
        ...folderData,
        locationId: folderData.locationId || this.config.locationId
      };

      const response: AxiosResponse<GHLV2CustomFieldFolderResponse> = await this.axiosInstance.put(
        `/custom-fields/folder/${id}`,
        payload
      );

      return this.wrapResponse(response.data);
    } catch (error) {
      throw this.handleApiError(error as AxiosError<GHLErrorResponse>);
    }
  }

  /**
   * Delete custom field folder
   * DELETE /custom-fields/folder/{id}
   */
  async deleteCustomFieldV2Folder(params: GHLV2DeleteCustomFieldFolderRequest): Promise<GHLApiResponse<GHLV2DeleteCustomFieldResponse>> {
    try {
      const queryParams = {
        locationId: params.locationId || this.config.locationId
      };

      const response: AxiosResponse<GHLV2DeleteCustomFieldResponse> = await this.axiosInstance.delete(
        `/custom-fields/folder/${params.id}`,
        { params: queryParams }
      );

      return this.wrapResponse(response.data);
    } catch (error) {
      throw this.handleApiError(error as AxiosError<GHLErrorResponse>);
    }
  }

  // ===== WORKFLOWS API METHODS =====

  /**
   * Get all workflows for a location
   * GET /workflows/
   */
  async getWorkflows(request: GHLGetWorkflowsRequest): Promise<GHLApiResponse<GHLGetWorkflowsResponse>> {
    try {
      const queryParams = {
        locationId: request.locationId || this.config.locationId
      };

      const response: AxiosResponse<GHLGetWorkflowsResponse> = await this.axiosInstance.get(
        '/workflows/',
        { params: queryParams }
      );

      return this.wrapResponse(response.data);
    } catch (error) {
      throw this.handleApiError(error as AxiosError<GHLErrorResponse>);
    }
  }

  // ===== SURVEYS API METHODS =====

  /**
   * Get all surveys for a location
   * GET /surveys/
   */
  async getSurveys(request: GHLGetSurveysRequest): Promise<GHLApiResponse<GHLGetSurveysResponse>> {
    try {
      const queryParams: Record<string, string> = {
        locationId: request.locationId || this.config.locationId
      };

      if (request.skip !== undefined) {
        queryParams.skip = request.skip.toString();
      }
      if (request.limit !== undefined) {
        queryParams.limit = request.limit.toString();
      }
      if (request.type) {
        queryParams.type = request.type;
      }

      const response: AxiosResponse<GHLGetSurveysResponse> = await this.axiosInstance.get(
        '/surveys/',
        { params: queryParams }
      );

      return this.wrapResponse(response.data);
    } catch (error) {
      throw this.handleApiError(error as AxiosError<GHLErrorResponse>);
    }
  }

  /**
   * Get survey submissions with filtering and pagination
   * GET /surveys/submissions
   */
  async getSurveySubmissions(request: GHLGetSurveySubmissionsRequest): Promise<GHLApiResponse<GHLGetSurveySubmissionsResponse>> {
    try {
      const locationId = request.locationId || this.config.locationId;
      
      const params = new URLSearchParams();
      if (request.page) params.append('page', request.page.toString());
      if (request.limit) params.append('limit', request.limit.toString());
      if (request.surveyId) params.append('surveyId', request.surveyId);
      if (request.q) params.append('q', request.q);
      if (request.startAt) params.append('startAt', request.startAt);
      if (request.endAt) params.append('endAt', request.endAt);

      const response: AxiosResponse<GHLGetSurveySubmissionsResponse> = await this.axiosInstance.get(
        `/locations/${locationId}/surveys/submissions?${params.toString()}`
      );

      return this.wrapResponse(response.data);
    } catch (error) {
      throw error;
    }
  }

  // ===== STORE API METHODS =====

  /**
   * SHIPPING ZONES API METHODS
   */

  /**
   * Create a new shipping zone
   * POST /store/shipping-zone
   */
  async createShippingZone(zoneData: GHLCreateShippingZoneRequest): Promise<GHLApiResponse<GHLCreateShippingZoneResponse>> {
    try {
      const payload = {
        ...zoneData,
        altId: zoneData.altId || this.config.locationId,
        altType: 'location' as const
      };

      const response: AxiosResponse<GHLCreateShippingZoneResponse> = await this.axiosInstance.post(
        '/store/shipping-zone',
        payload
      );

      return this.wrapResponse(response.data);
    } catch (error) {
      throw error;
    }
  }

  /**
   * List all shipping zones
   * GET /store/shipping-zone
   */
  async listShippingZones(params: GHLGetShippingZonesRequest): Promise<GHLApiResponse<GHLListShippingZonesResponse>> {
    try {
      const altId = params.altId || this.config.locationId;
      const queryParams = new URLSearchParams({
        altId,
        altType: 'location'
      });
      
      if (params.limit) queryParams.append('limit', params.limit.toString());
      if (params.offset) queryParams.append('offset', params.offset.toString());
      if (params.withShippingRate !== undefined) queryParams.append('withShippingRate', params.withShippingRate.toString());

      const response: AxiosResponse<GHLListShippingZonesResponse> = await this.axiosInstance.get(
        `/store/shipping-zone?${queryParams.toString()}`
      );

      return this.wrapResponse(response.data);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get a specific shipping zone by ID
   * GET /store/shipping-zone/{shippingZoneId}
   */
  async getShippingZone(shippingZoneId: string, params: Omit<GHLGetShippingZonesRequest, 'limit' | 'offset'>): Promise<GHLApiResponse<GHLGetShippingZoneResponse>> {
    try {
      const altId = params.altId || this.config.locationId;
      const queryParams = new URLSearchParams({
        altId,
        altType: 'location'
      });
      
      if (params.withShippingRate !== undefined) queryParams.append('withShippingRate', params.withShippingRate.toString());

      const response: AxiosResponse<GHLGetShippingZoneResponse> = await this.axiosInstance.get(
        `/store/shipping-zone/${shippingZoneId}?${queryParams.toString()}`
      );

      return this.wrapResponse(response.data);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Update a shipping zone
   * PUT /store/shipping-zone/{shippingZoneId}
   */
  async updateShippingZone(shippingZoneId: string, updateData: GHLUpdateShippingZoneRequest): Promise<GHLApiResponse<GHLUpdateShippingZoneResponse>> {
    try {
      const payload = {
        ...updateData,
        altId: updateData.altId || this.config.locationId,
        altType: 'location' as const
      };

      const response: AxiosResponse<GHLUpdateShippingZoneResponse> = await this.axiosInstance.put(
        `/store/shipping-zone/${shippingZoneId}`,
        payload
      );

      return this.wrapResponse(response.data);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Delete a shipping zone
   * DELETE /store/shipping-zone/{shippingZoneId}
   */
  async deleteShippingZone(shippingZoneId: string, params: GHLDeleteShippingZoneRequest): Promise<GHLApiResponse<GHLDeleteShippingZoneResponse>> {
    try {
      const altId = params.altId || this.config.locationId;
      const queryParams = new URLSearchParams({
        altId,
        altType: 'location'
      });

      const response: AxiosResponse<GHLDeleteShippingZoneResponse> = await this.axiosInstance.delete(
        `/store/shipping-zone/${shippingZoneId}?${queryParams.toString()}`
      );

      return this.wrapResponse(response.data);
    } catch (error) {
      throw error;
    }
  }

  /**
   * SHIPPING RATES API METHODS
   */

  /**
   * Get available shipping rates for an order
   * POST /store/shipping-zone/shipping-rates
   */
  async getAvailableShippingRates(rateData: GHLGetAvailableShippingRatesRequest): Promise<GHLApiResponse<GHLGetAvailableShippingRatesResponse>> {
    try {
      const payload = {
        ...rateData,
        altId: rateData.altId || this.config.locationId,
        altType: 'location' as const
      };

      const response: AxiosResponse<GHLGetAvailableShippingRatesResponse> = await this.axiosInstance.post(
        '/store/shipping-zone/shipping-rates',
        payload
      );

      return this.wrapResponse(response.data);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Create a new shipping rate for a zone
   * POST /store/shipping-zone/{shippingZoneId}/shipping-rate
   */
  async createShippingRate(shippingZoneId: string, rateData: GHLCreateShippingRateRequest): Promise<GHLApiResponse<GHLCreateShippingRateResponse>> {
    try {
      const payload = {
        ...rateData,
        altId: rateData.altId || this.config.locationId,
        altType: 'location' as const
      };

      const response: AxiosResponse<GHLCreateShippingRateResponse> = await this.axiosInstance.post(
        `/store/shipping-zone/${shippingZoneId}/shipping-rate`,
        payload
      );

      return this.wrapResponse(response.data);
    } catch (error) {
      throw error;
    }
  }

  /**
   * List shipping rates for a zone
   * GET /store/shipping-zone/{shippingZoneId}/shipping-rate
   */
  async listShippingRates(shippingZoneId: string, params: GHLGetShippingRatesRequest): Promise<GHLApiResponse<GHLListShippingRatesResponse>> {
    try {
      const altId = params.altId || this.config.locationId;
      const queryParams = new URLSearchParams({
        altId,
        altType: 'location'
      });
      
      if (params.limit) queryParams.append('limit', params.limit.toString());
      if (params.offset) queryParams.append('offset', params.offset.toString());

      const response: AxiosResponse<GHLListShippingRatesResponse> = await this.axiosInstance.get(
        `/store/shipping-zone/${shippingZoneId}/shipping-rate?${queryParams.toString()}`
      );

      return this.wrapResponse(response.data);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get a specific shipping rate
   * GET /store/shipping-zone/{shippingZoneId}/shipping-rate/{shippingRateId}
   */
  async getShippingRate(shippingZoneId: string, shippingRateId: string, params: Omit<GHLGetShippingRatesRequest, 'limit' | 'offset'>): Promise<GHLApiResponse<GHLGetShippingRateResponse>> {
    try {
      const altId = params.altId || this.config.locationId;
      const queryParams = new URLSearchParams({
        altId,
        altType: 'location'
      });

      const response: AxiosResponse<GHLGetShippingRateResponse> = await this.axiosInstance.get(
        `/store/shipping-zone/${shippingZoneId}/shipping-rate/${shippingRateId}?${queryParams.toString()}`
      );

      return this.wrapResponse(response.data);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Update a shipping rate
   * PUT /store/shipping-zone/{shippingZoneId}/shipping-rate/{shippingRateId}
   */
  async updateShippingRate(shippingZoneId: string, shippingRateId: string, updateData: GHLUpdateShippingRateRequest): Promise<GHLApiResponse<GHLUpdateShippingRateResponse>> {
    try {
      const payload = {
        ...updateData,
        altId: updateData.altId || this.config.locationId,
        altType: 'location' as const
      };

      const response: AxiosResponse<GHLUpdateShippingRateResponse> = await this.axiosInstance.put(
        `/store/shipping-zone/${shippingZoneId}/shipping-rate/${shippingRateId}`,
        payload
      );

      return this.wrapResponse(response.data);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Delete a shipping rate
   * DELETE /store/shipping-zone/{shippingZoneId}/shipping-rate/{shippingRateId}
   */
  async deleteShippingRate(shippingZoneId: string, shippingRateId: string, params: GHLDeleteShippingRateRequest): Promise<GHLApiResponse<GHLDeleteShippingRateResponse>> {
    try {
      const altId = params.altId || this.config.locationId;
      const queryParams = new URLSearchParams({
        altId,
        altType: 'location'
      });

      const response: AxiosResponse<GHLDeleteShippingRateResponse> = await this.axiosInstance.delete(
        `/store/shipping-zone/${shippingZoneId}/shipping-rate/${shippingRateId}?${queryParams.toString()}`
      );

      return this.wrapResponse(response.data);
    } catch (error) {
      throw error;
    }
  }

  /**
   * SHIPPING CARRIERS API METHODS
   */

  /**
   * Create a new shipping carrier
   * POST /store/shipping-carrier
   */
  async createShippingCarrier(carrierData: GHLCreateShippingCarrierRequest): Promise<GHLApiResponse<GHLCreateShippingCarrierResponse>> {
    try {
      const payload = {
        ...carrierData,
        altId: carrierData.altId || this.config.locationId,
        altType: 'location' as const
      };

      const response: AxiosResponse<GHLCreateShippingCarrierResponse> = await this.axiosInstance.post(
        '/store/shipping-carrier',
        payload
      );

      return this.wrapResponse(response.data);
    } catch (error) {
      throw error;
    }
  }

  /**
   * List all shipping carriers
   * GET /store/shipping-carrier
   */
  async listShippingCarriers(params: GHLGetShippingCarriersRequest): Promise<GHLApiResponse<GHLListShippingCarriersResponse>> {
    try {
      const altId = params.altId || this.config.locationId;
      const queryParams = new URLSearchParams({
        altId,
        altType: 'location'
      });

      const response: AxiosResponse<GHLListShippingCarriersResponse> = await this.axiosInstance.get(
        `/store/shipping-carrier?${queryParams.toString()}`
      );

      return this.wrapResponse(response.data);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get a specific shipping carrier by ID
   * GET /store/shipping-carrier/{shippingCarrierId}
   */
  async getShippingCarrier(shippingCarrierId: string, params: GHLGetShippingCarriersRequest): Promise<GHLApiResponse<GHLGetShippingCarrierResponse>> {
    try {
      const altId = params.altId || this.config.locationId;
      const queryParams = new URLSearchParams({
        altId,
        altType: 'location'
      });

      const response: AxiosResponse<GHLGetShippingCarrierResponse> = await this.axiosInstance.get(
        `/store/shipping-carrier/${shippingCarrierId}?${queryParams.toString()}`
      );

      return this.wrapResponse(response.data);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Update a shipping carrier
   * PUT /store/shipping-carrier/{shippingCarrierId}
   */
  async updateShippingCarrier(shippingCarrierId: string, updateData: GHLUpdateShippingCarrierRequest): Promise<GHLApiResponse<GHLUpdateShippingCarrierResponse>> {
    try {
      const payload = {
        ...updateData,
        altId: updateData.altId || this.config.locationId,
        altType: 'location' as const
      };

      const response: AxiosResponse<GHLUpdateShippingCarrierResponse> = await this.axiosInstance.put(
        `/store/shipping-carrier/${shippingCarrierId}`,
        payload
      );

      return this.wrapResponse(response.data);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Delete a shipping carrier
   * DELETE /store/shipping-carrier/{shippingCarrierId}
   */
  async deleteShippingCarrier(shippingCarrierId: string, params: GHLDeleteShippingCarrierRequest): Promise<GHLApiResponse<GHLDeleteShippingCarrierResponse>> {
    try {
      const altId = params.altId || this.config.locationId;
      const queryParams = new URLSearchParams({
        altId,
        altType: 'location'
      });

      const response: AxiosResponse<GHLDeleteShippingCarrierResponse> = await this.axiosInstance.delete(
        `/store/shipping-carrier/${shippingCarrierId}?${queryParams.toString()}`
      );

      return this.wrapResponse(response.data);
    } catch (error) {
      throw error;
    }
  }

  /**
   * STORE SETTINGS API METHODS
   */

  /**
   * Create or update store settings
   * POST /store/store-setting
   */
  async createStoreSetting(settingData: GHLCreateStoreSettingRequest): Promise<GHLApiResponse<GHLCreateStoreSettingResponse>> {
    try {
      const payload = {
        ...settingData,
        altId: settingData.altId || this.config.locationId,
        altType: 'location' as const
      };

      const response: AxiosResponse<GHLCreateStoreSettingResponse> = await this.axiosInstance.post(
        '/store/store-setting',
        payload
      );

      return this.wrapResponse(response.data);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get store settings
   * GET /store/store-setting
   */
  async getStoreSetting(params: GHLGetStoreSettingRequest): Promise<GHLApiResponse<GHLGetStoreSettingResponse>> {
    try {
      const altId = params.altId || this.config.locationId;
      const queryParams = new URLSearchParams({
        altId,
        altType: 'location'
      });

      const response: AxiosResponse<GHLGetStoreSettingResponse> = await this.axiosInstance.get(
        `/store/store-setting?${queryParams.toString()}`
      );

      return this.wrapResponse(response.data);
    } catch (error) {
      throw error;
    }
  }

  /**
   * PRODUCTS API METHODS
   */

  /**
   * Create a new product
   * POST /products/
   */
  async createProduct(productData: GHLCreateProductRequest): Promise<GHLApiResponse<GHLCreateProductResponse>> {
    try {
      const response: AxiosResponse<GHLCreateProductResponse> = await this.axiosInstance.post(
        '/products/',
        productData
      );

      return this.wrapResponse(response.data);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Update a product by ID
   * PUT /products/{productId}
   */
  async updateProduct(productId: string, updateData: GHLUpdateProductRequest): Promise<GHLApiResponse<GHLUpdateProductResponse>> {
    try {
      const response: AxiosResponse<GHLUpdateProductResponse> = await this.axiosInstance.put(
        `/products/${productId}`,
        updateData
      );

      return this.wrapResponse(response.data);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get a product by ID
   * GET /products/{productId}
   */
  async getProduct(productId: string, locationId?: string): Promise<GHLApiResponse<GHLGetProductResponse>> {
    try {
      const queryParams = new URLSearchParams({
        locationId: locationId || this.config.locationId
      });

      const response: AxiosResponse<GHLGetProductResponse> = await this.axiosInstance.get(
        `/products/${productId}?${queryParams.toString()}`
      );

      return this.wrapResponse(response.data);
    } catch (error) {
      throw error;
    }
  }

  /**
   * List products
   * GET /products/
   */
  async listProducts(params: GHLListProductsRequest): Promise<GHLApiResponse<GHLListProductsResponse>> {
    try {
      const queryParams = new URLSearchParams({
        locationId: params.locationId || this.config.locationId
      });

      if (params.limit) queryParams.append('limit', params.limit.toString());
      if (params.offset) queryParams.append('offset', params.offset.toString());
      if (params.search) queryParams.append('search', params.search);
      if (params.collectionIds?.length) queryParams.append('collectionIds', params.collectionIds.join(','));
      if (params.collectionSlug) queryParams.append('collectionSlug', params.collectionSlug);
      if (params.expand?.length) params.expand.forEach(item => queryParams.append('expand', item));
      if (params.productIds?.length) params.productIds.forEach(id => queryParams.append('productIds', id));
      if (params.storeId) queryParams.append('storeId', params.storeId);
      if (params.includedInStore !== undefined) queryParams.append('includedInStore', params.includedInStore.toString());
      if (params.availableInStore !== undefined) queryParams.append('availableInStore', params.availableInStore.toString());
      if (params.sortOrder) queryParams.append('sortOrder', params.sortOrder);

      const response: AxiosResponse<GHLListProductsResponse> = await this.axiosInstance.get(
        `/products/?${queryParams.toString()}`
      );

      return this.wrapResponse(response.data);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Delete a product by ID
   * DELETE /products/{productId}
   */
  async deleteProduct(productId: string, locationId?: string): Promise<GHLApiResponse<GHLDeleteProductResponse>> {
    try {
      const queryParams = new URLSearchParams({
        locationId: locationId || this.config.locationId
      });

      const response: AxiosResponse<GHLDeleteProductResponse> = await this.axiosInstance.delete(
        `/products/${productId}?${queryParams.toString()}`
      );

      return this.wrapResponse(response.data);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Bulk update products
   * POST /products/bulk-update
   */
  async bulkUpdateProducts(updateData: GHLBulkUpdateRequest): Promise<GHLApiResponse<GHLBulkUpdateResponse>> {
    try {
      const payload = {
        ...updateData,
        altId: updateData.altId || this.config.locationId,
        altType: 'location' as const
      };

      const response: AxiosResponse<GHLBulkUpdateResponse> = await this.axiosInstance.post(
        '/products/bulk-update',
        payload
      );

      return this.wrapResponse(response.data);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Create a price for a product
   * POST /products/{productId}/price
   */
  async createPrice(productId: string, priceData: GHLCreatePriceRequest): Promise<GHLApiResponse<GHLCreatePriceResponse>> {
    try {
      const payload = {
        ...priceData,
        locationId: priceData.locationId || this.config.locationId
      };

      const response: AxiosResponse<GHLCreatePriceResponse> = await this.axiosInstance.post(
        `/products/${productId}/price`,
        payload
      );

      return this.wrapResponse(response.data);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Update a price by ID
   * PUT /products/{productId}/price/{priceId}
   */
  async updatePrice(productId: string, priceId: string, updateData: GHLUpdatePriceRequest): Promise<GHLApiResponse<GHLUpdatePriceResponse>> {
    try {
      const payload = {
        ...updateData,
        locationId: updateData.locationId || this.config.locationId
      };

      const response: AxiosResponse<GHLUpdatePriceResponse> = await this.axiosInstance.put(
        `/products/${productId}/price/${priceId}`,
        payload
      );

      return this.wrapResponse(response.data);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get a price by ID
   * GET /products/{productId}/price/{priceId}
   */
  async getPrice(productId: string, priceId: string, locationId?: string): Promise<GHLApiResponse<GHLGetPriceResponse>> {
    try {
      const queryParams = new URLSearchParams({
        locationId: locationId || this.config.locationId
      });

      const response: AxiosResponse<GHLGetPriceResponse> = await this.axiosInstance.get(
        `/products/${productId}/price/${priceId}?${queryParams.toString()}`
      );

      return this.wrapResponse(response.data);
    } catch (error) {
      throw error;
    }
  }

  /**
   * List prices for a product
   * GET /products/{productId}/price
   */
  async listPrices(productId: string, params: GHLListPricesRequest): Promise<GHLApiResponse<GHLListPricesResponse>> {
    try {
      const queryParams = new URLSearchParams({
        locationId: params.locationId || this.config.locationId
      });

      if (params.limit) queryParams.append('limit', params.limit.toString());
      if (params.offset) queryParams.append('offset', params.offset.toString());
      if (params.ids) queryParams.append('ids', params.ids);

      const response: AxiosResponse<GHLListPricesResponse> = await this.axiosInstance.get(
        `/products/${productId}/price?${queryParams.toString()}`
      );

      return this.wrapResponse(response.data);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Delete a price by ID
   * DELETE /products/{productId}/price/{priceId}
   */
  async deletePrice(productId: string, priceId: string, locationId?: string): Promise<GHLApiResponse<GHLDeletePriceResponse>> {
    try {
      const queryParams = new URLSearchParams({
        locationId: locationId || this.config.locationId
      });

      const response: AxiosResponse<GHLDeletePriceResponse> = await this.axiosInstance.delete(
        `/products/${productId}/price/${priceId}?${queryParams.toString()}`
      );

      return this.wrapResponse(response.data);
    } catch (error) {
      throw error;
    }
  }

  /**
   * List inventory
   * GET /products/inventory
   */
  async listInventory(params: GHLListInventoryRequest): Promise<GHLApiResponse<GHLListInventoryResponse>> {
    try {
      const queryParams = new URLSearchParams({
        altId: params.altId || this.config.locationId,
        altType: 'location'
      });

      if (params.limit) queryParams.append('limit', params.limit.toString());
      if (params.offset) queryParams.append('offset', params.offset.toString());
      if (params.search) queryParams.append('search', params.search);

      const response: AxiosResponse<GHLListInventoryResponse> = await this.axiosInstance.get(
        `/products/inventory?${queryParams.toString()}`
      );

      return this.wrapResponse(response.data);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Update inventory
   * POST /products/inventory
   */
  async updateInventory(updateData: GHLUpdateInventoryRequest): Promise<GHLApiResponse<GHLUpdateInventoryResponse>> {
    try {
      const payload = {
        ...updateData,
        altId: updateData.altId || this.config.locationId,
        altType: 'location' as const
      };

      const response: AxiosResponse<GHLUpdateInventoryResponse> = await this.axiosInstance.post(
        '/products/inventory',
        payload
      );

      return this.wrapResponse(response.data);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get product store stats
   * GET /products/store/{storeId}/stats
   */
  async getProductStoreStats(storeId: string, params: GHLGetProductStoreStatsRequest): Promise<GHLApiResponse<GHLGetProductStoreStatsResponse>> {
    try {
      const queryParams = new URLSearchParams({
        altId: params.altId || this.config.locationId,
        altType: 'location'
      });

      if (params.search) queryParams.append('search', params.search);
      if (params.collectionIds) queryParams.append('collectionIds', params.collectionIds);

      const response: AxiosResponse<GHLGetProductStoreStatsResponse> = await this.axiosInstance.get(
        `/products/store/${storeId}/stats?${queryParams.toString()}`
      );

      return this.wrapResponse(response.data);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Update product store status
   * POST /products/store/{storeId}
   */
  async updateProductStore(storeId: string, updateData: GHLUpdateProductStoreRequest): Promise<GHLApiResponse<GHLUpdateProductStoreResponse>> {
    try {
      const response: AxiosResponse<GHLUpdateProductStoreResponse> = await this.axiosInstance.post(
        `/products/store/${storeId}`,
        updateData
      );

      return this.wrapResponse(response.data);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Create a product collection
   * POST /products/collections
   */
  async createProductCollection(collectionData: GHLCreateProductCollectionRequest): Promise<GHLApiResponse<GHLCreateCollectionResponse>> {
    try {
      const payload = {
        ...collectionData,
        altId: collectionData.altId || this.config.locationId,
        altType: 'location' as const
      };

      const response: AxiosResponse<GHLCreateCollectionResponse> = await this.axiosInstance.post(
        '/products/collections',
        payload
      );

      return this.wrapResponse(response.data);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Update a product collection
   * PUT /products/collections/{collectionId}
   */
  async updateProductCollection(collectionId: string, updateData: GHLUpdateProductCollectionRequest): Promise<GHLApiResponse<GHLUpdateProductCollectionResponse>> {
    try {
      const payload = {
        ...updateData,
        altId: updateData.altId || this.config.locationId,
        altType: 'location' as const
      };

      const response: AxiosResponse<GHLUpdateProductCollectionResponse> = await this.axiosInstance.put(
        `/products/collections/${collectionId}`,
        payload
      );

      return this.wrapResponse(response.data);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get a product collection by ID
   * GET /products/collections/{collectionId}
   */
  async getProductCollection(collectionId: string): Promise<GHLApiResponse<GHLDefaultCollectionResponse>> {
    try {
      const response: AxiosResponse<GHLDefaultCollectionResponse> = await this.axiosInstance.get(
        `/products/collections/${collectionId}`
      );

      return this.wrapResponse(response.data);
    } catch (error) {
      throw error;
    }
  }

  /**
   * List product collections
   * GET /products/collections
   */
  async listProductCollections(params: GHLListProductCollectionsRequest): Promise<GHLApiResponse<GHLListCollectionResponse>> {
    try {
      const queryParams = new URLSearchParams({
        altId: params.altId || this.config.locationId,
        altType: 'location'
      });

      if (params.limit) queryParams.append('limit', params.limit.toString());
      if (params.offset) queryParams.append('offset', params.offset.toString());
      if (params.collectionIds) queryParams.append('collectionIds', params.collectionIds);
      if (params.name) queryParams.append('name', params.name);

      const response: AxiosResponse<GHLListCollectionResponse> = await this.axiosInstance.get(
        `/products/collections?${queryParams.toString()}`
      );

      return this.wrapResponse(response.data);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Delete a product collection
   * DELETE /products/collections/{collectionId}
   */
  async deleteProductCollection(collectionId: string, params: GHLDeleteProductCollectionRequest): Promise<GHLApiResponse<GHLDeleteProductCollectionResponse>> {
    try {
      const queryParams = new URLSearchParams({
        altId: params.altId || this.config.locationId,
        altType: 'location'
      });

      const response: AxiosResponse<GHLDeleteProductCollectionResponse> = await this.axiosInstance.delete(
        `/products/collections/${collectionId}?${queryParams.toString()}`
      );

      return this.wrapResponse(response.data);
    } catch (error) {
      throw error;
    }
  }

  /**
   * List product reviews
   * GET /products/reviews
   */
  async listProductReviews(params: GHLListProductReviewsRequest): Promise<GHLApiResponse<GHLListProductReviewsResponse>> {
    try {
      const queryParams = new URLSearchParams({
        altId: params.altId || this.config.locationId,
        altType: 'location'
      });

      if (params.limit) queryParams.append('limit', params.limit.toString());
      if (params.offset) queryParams.append('offset', params.offset.toString());
      if (params.sortField) queryParams.append('sortField', params.sortField);
      if (params.sortOrder) queryParams.append('sortOrder', params.sortOrder);
      if (params.rating) queryParams.append('rating', params.rating.toString());
      if (params.startDate) queryParams.append('startDate', params.startDate);
      if (params.endDate) queryParams.append('endDate', params.endDate);
      if (params.productId) queryParams.append('productId', params.productId);
      if (params.storeId) queryParams.append('storeId', params.storeId);

      const response: AxiosResponse<GHLListProductReviewsResponse> = await this.axiosInstance.get(
        `/products/reviews?${queryParams.toString()}`
      );

      return this.wrapResponse(response.data);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get reviews count
   * GET /products/reviews/count
   */
  async getReviewsCount(params: GHLGetReviewsCountRequest): Promise<GHLApiResponse<GHLCountReviewsByStatusResponse>> {
    try {
      const queryParams = new URLSearchParams({
        altId: params.altId || this.config.locationId,
        altType: 'location'
      });

      if (params.rating) queryParams.append('rating', params.rating.toString());
      if (params.startDate) queryParams.append('startDate', params.startDate);
      if (params.endDate) queryParams.append('endDate', params.endDate);
      if (params.productId) queryParams.append('productId', params.productId);
      if (params.storeId) queryParams.append('storeId', params.storeId);

      const response: AxiosResponse<GHLCountReviewsByStatusResponse> = await this.axiosInstance.get(
        `/products/reviews/count?${queryParams.toString()}`
      );

      return this.wrapResponse(response.data);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Update a product review
   * PUT /products/reviews/{reviewId}
   */
  async updateProductReview(reviewId: string, updateData: GHLUpdateProductReviewRequest): Promise<GHLApiResponse<GHLUpdateProductReviewsResponse>> {
    try {
      const payload = {
        ...updateData,
        altId: updateData.altId || this.config.locationId,
        altType: 'location' as const
      };

      const response: AxiosResponse<GHLUpdateProductReviewsResponse> = await this.axiosInstance.put(
        `/products/reviews/${reviewId}`,
        payload
      );

      return this.wrapResponse(response.data);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Delete a product review
   * DELETE /products/reviews/{reviewId}
   */
  async deleteProductReview(reviewId: string, params: GHLDeleteProductReviewRequest): Promise<GHLApiResponse<GHLDeleteProductReviewResponse>> {
    try {
      const queryParams = new URLSearchParams({
        altId: params.altId || this.config.locationId,
        altType: 'location',
        productId: params.productId
      });

      const response: AxiosResponse<GHLDeleteProductReviewResponse> = await this.axiosInstance.delete(
        `/products/reviews/${reviewId}?${queryParams.toString()}`
      );

      return this.wrapResponse(response.data);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Bulk update product reviews
   * POST /products/reviews/bulk-update
   */
  async bulkUpdateProductReviews(updateData: GHLBulkUpdateProductReviewsRequest): Promise<GHLApiResponse<GHLUpdateProductReviewsResponse>> {
    try {
      const payload = {
        ...updateData,
        altId: updateData.altId || this.config.locationId,
        altType: 'location' as const
      };

      const response: AxiosResponse<GHLUpdateProductReviewsResponse> = await this.axiosInstance.post(
        '/products/reviews/bulk-update',
        payload
      );

      return this.wrapResponse(response.data);
    } catch (error) {
      throw error;
    }
  }

  /**
   * PAYMENTS API METHODS
   */

  /**
   * Create white-label integration provider
   * POST /payments/integrations/provider/whitelabel
   */
  async createWhiteLabelIntegrationProvider(data: any): Promise<GHLApiResponse<any>> {
    try {
      const response: AxiosResponse<any> = await this.axiosInstance.post(
        '/payments/integrations/provider/whitelabel',
        data
      );

      return this.wrapResponse(response.data);
    } catch (error) {
      throw error;
    }
  }

  /**
   * List white-label integration providers
   * GET /payments/integrations/provider/whitelabel
   */
  async listWhiteLabelIntegrationProviders(params: Record<string, any>): Promise<GHLApiResponse<any>> {
    try {
      const queryParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, value.toString());
        }
      });

      const response: AxiosResponse<any> = await this.axiosInstance.get(
        `/payments/integrations/provider/whitelabel?${queryParams.toString()}`
      );

      return this.wrapResponse(response.data);
    } catch (error) {
      throw error;
    }
  }

  /**
   * List orders
   * GET /payments/orders
   */
  async listOrders(params: Record<string, any>): Promise<GHLApiResponse<any>> {
    try {
      const queryParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, value.toString());
        }
      });

      const response: AxiosResponse<any> = await this.axiosInstance.get(
        `/payments/orders?${queryParams.toString()}`
      );

      return this.wrapResponse(response.data);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get order by ID
   * GET /payments/orders/{orderId}
   */
  async getOrderById(orderId: string, params: Record<string, any>): Promise<GHLApiResponse<any>> {
    try {
      const queryParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && key !== 'orderId') {
          queryParams.append(key, value.toString());
        }
      });

      const response: AxiosResponse<any> = await this.axiosInstance.get(
        `/payments/orders/${orderId}?${queryParams.toString()}`
      );

      return this.wrapResponse(response.data);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Create order fulfillment
   * POST /payments/orders/{orderId}/fulfillments
   */
  async createOrderFulfillment(orderId: string, data: any): Promise<GHLApiResponse<any>> {
    try {
      const response: AxiosResponse<any> = await this.axiosInstance.post(
        `/payments/orders/${orderId}/fulfillments`,
        data
      );

      return this.wrapResponse(response.data);
    } catch (error) {
      throw error;
    }
  }

  /**
   * List order fulfillments
   * GET /payments/orders/{orderId}/fulfillments
   */
  async listOrderFulfillments(orderId: string, params: Record<string, any>): Promise<GHLApiResponse<any>> {
    try {
      const queryParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && key !== 'orderId') {
          queryParams.append(key, value.toString());
        }
      });

      const response: AxiosResponse<any> = await this.axiosInstance.get(
        `/payments/orders/${orderId}/fulfillments?${queryParams.toString()}`
      );

      return this.wrapResponse(response.data);
    } catch (error) {
      throw error;
    }
  }

  /**
   * List transactions
   * GET /payments/transactions
   */
  async listTransactions(params: Record<string, any>): Promise<GHLApiResponse<any>> {
    try {
      const queryParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, value.toString());
        }
      });

      const response: AxiosResponse<any> = await this.axiosInstance.get(
        `/payments/transactions?${queryParams.toString()}`
      );

      return this.wrapResponse(response.data);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get transaction by ID
   * GET /payments/transactions/{transactionId}
   */
  async getTransactionById(transactionId: string, params: Record<string, any>): Promise<GHLApiResponse<any>> {
    try {
      const queryParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && key !== 'transactionId') {
          queryParams.append(key, value.toString());
        }
      });

      const response: AxiosResponse<any> = await this.axiosInstance.get(
        `/payments/transactions/${transactionId}?${queryParams.toString()}`
      );

      return this.wrapResponse(response.data);
    } catch (error) {
      throw error;
    }
  }

  /**
   * List subscriptions
   * GET /payments/subscriptions
   */
  async listSubscriptions(params: Record<string, any>): Promise<GHLApiResponse<any>> {
    try {
      const queryParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, value.toString());
        }
      });

      const response: AxiosResponse<any> = await this.axiosInstance.get(
        `/payments/subscriptions?${queryParams.toString()}`
      );

      return this.wrapResponse(response.data);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get subscription by ID
   * GET /payments/subscriptions/{subscriptionId}
   */
  async getSubscriptionById(subscriptionId: string, params: Record<string, any>): Promise<GHLApiResponse<any>> {
    try {
      const queryParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && key !== 'subscriptionId') {
          queryParams.append(key, value.toString());
        }
      });

      const response: AxiosResponse<any> = await this.axiosInstance.get(
        `/payments/subscriptions/${subscriptionId}?${queryParams.toString()}`
      );

      return this.wrapResponse(response.data);
    } catch (error) {
      throw error;
    }
  }

  /**
   * List coupons
   * GET /payments/coupon/list
   */
  async listCoupons(params: Record<string, any>): Promise<GHLApiResponse<any>> {
    try {
      const queryParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, value.toString());
        }
      });

      const response: AxiosResponse<any> = await this.axiosInstance.get(
        `/payments/coupon/list?${queryParams.toString()}`
      );

      return this.wrapResponse(response.data);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Create coupon
   * POST /payments/coupon
   */
  async createCoupon(data: any): Promise<GHLApiResponse<any>> {
    try {
      const response: AxiosResponse<any> = await this.axiosInstance.post(
        '/payments/coupon',
        data
      );

      return this.wrapResponse(response.data);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Update coupon
   * PUT /payments/coupon
   */
  async updateCoupon(data: any): Promise<GHLApiResponse<any>> {
    try {
      const response: AxiosResponse<any> = await this.axiosInstance.put(
        '/payments/coupon',
        data
      );

      return this.wrapResponse(response.data);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Delete coupon
   * DELETE /payments/coupon
   */
  async deleteCoupon(data: any): Promise<GHLApiResponse<any>> {
    try {
      const response: AxiosResponse<any> = await this.axiosInstance.delete(
        '/payments/coupon',
        { data }
      );

      return this.wrapResponse(response.data);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get coupon
   * GET /payments/coupon
   */
  async getCoupon(params: Record<string, any>): Promise<GHLApiResponse<any>> {
    try {
      const queryParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, value.toString());
        }
      });

      const response: AxiosResponse<any> = await this.axiosInstance.get(
        `/payments/coupon?${queryParams.toString()}`
      );

      return this.wrapResponse(response.data);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Create custom provider integration
   * POST /payments/custom-provider/provider
   */
  async createCustomProviderIntegration(locationId: string, data: any): Promise<GHLApiResponse<any>> {
    try {
      const queryParams = new URLSearchParams({ locationId });

      const response: AxiosResponse<any> = await this.axiosInstance.post(
        `/payments/custom-provider/provider?${queryParams.toString()}`,
        data
      );

      return this.wrapResponse(response.data);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Delete custom provider integration
   * DELETE /payments/custom-provider/provider
   */
  async deleteCustomProviderIntegration(locationId: string): Promise<GHLApiResponse<any>> {
    try {
      const queryParams = new URLSearchParams({ locationId });

      const response: AxiosResponse<any> = await this.axiosInstance.delete(
        `/payments/custom-provider/provider?${queryParams.toString()}`
      );

      return this.wrapResponse(response.data);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get custom provider config
   * GET /payments/custom-provider/connect
   */
  async getCustomProviderConfig(locationId: string): Promise<GHLApiResponse<any>> {
    try {
      const queryParams = new URLSearchParams({ locationId });

      const response: AxiosResponse<any> = await this.axiosInstance.get(
        `/payments/custom-provider/connect?${queryParams.toString()}`
      );

      return this.wrapResponse(response.data);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Create custom provider config
   * POST /payments/custom-provider/connect
   */
  async createCustomProviderConfig(locationId: string, data: any): Promise<GHLApiResponse<any>> {
    try {
      const queryParams = new URLSearchParams({ locationId });

      const response: AxiosResponse<any> = await this.axiosInstance.post(
        `/payments/custom-provider/connect?${queryParams.toString()}`,
        data
      );

      return this.wrapResponse(response.data);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Disconnect custom provider config
   * POST /payments/custom-provider/disconnect
   */
  async disconnectCustomProviderConfig(locationId: string, data: any): Promise<GHLApiResponse<any>> {
    try {
      const queryParams = new URLSearchParams({ locationId });

      const response: AxiosResponse<any> = await this.axiosInstance.post(
        `/payments/custom-provider/disconnect?${queryParams.toString()}`,
        data
      );

      return this.wrapResponse(response.data);
    } catch (error) {
      throw error;
    }
  }

  // =============================================================================
  // INVOICES API METHODS
  // =============================================================================

  /**
   * Create invoice template
   * POST /invoices/template
   */
  async createInvoiceTemplate(templateData: CreateInvoiceTemplateDto): Promise<GHLApiResponse<CreateInvoiceTemplateResponseDto>> {
    try {
      const payload = {
        ...templateData,
        altId: templateData.altId || this.config.locationId,
        altType: 'location' as const
      };

      const response: AxiosResponse<CreateInvoiceTemplateResponseDto> = await this.axiosInstance.post(
        '/invoices/template',
        payload
      );

      return this.wrapResponse(response.data);
    } catch (error) {
      throw error;
    }
  }

  /**
   * List invoice templates
   * GET /invoices/template
   */
  async listInvoiceTemplates(params?: {
    altId?: string;
    altType?: 'location';
    status?: string;
    startAt?: string;
    endAt?: string;
    search?: string;
    paymentMode?: 'default' | 'live' | 'test';
    limit: string;
    offset: string;
  }): Promise<GHLApiResponse<ListTemplatesResponse>> {
    try {
      const queryParams = {
        altId: params?.altId || this.config.locationId,
        altType: 'location' as const,
        limit: params?.limit || '10',
        offset: params?.offset || '0',
        ...(params?.status && { status: params.status }),
        ...(params?.startAt && { startAt: params.startAt }),
        ...(params?.endAt && { endAt: params.endAt }),
        ...(params?.search && { search: params.search }),
        ...(params?.paymentMode && { paymentMode: params.paymentMode })
      };

      const response: AxiosResponse<ListTemplatesResponse> = await this.axiosInstance.get(
        '/invoices/template',
        { params: queryParams }
      );

      return this.wrapResponse(response.data);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get invoice template by ID
   * GET /invoices/template/{templateId}
   */
  async getInvoiceTemplate(templateId: string, params?: {
    altId?: string;
    altType?: 'location';
  }): Promise<GHLApiResponse<InvoiceTemplate>> {
    try {
      const queryParams = {
        altId: params?.altId || this.config.locationId,
        altType: 'location' as const
      };

      const response: AxiosResponse<InvoiceTemplate> = await this.axiosInstance.get(
        `/invoices/template/${templateId}`,
        { params: queryParams }
      );

      return this.wrapResponse(response.data);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Update invoice template
   * PUT /invoices/template/{templateId}
   */
  async updateInvoiceTemplate(templateId: string, templateData: UpdateInvoiceTemplateDto): Promise<GHLApiResponse<UpdateInvoiceTemplateResponseDto>> {
    try {
      const payload = {
        ...templateData,
        altId: templateData.altId || this.config.locationId,
        altType: 'location' as const
      };

      const response: AxiosResponse<UpdateInvoiceTemplateResponseDto> = await this.axiosInstance.put(
        `/invoices/template/${templateId}`,
        payload
      );

      return this.wrapResponse(response.data);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Delete invoice template
   * DELETE /invoices/template/{templateId}
   */
  async deleteInvoiceTemplate(templateId: string, params?: {
    altId?: string;
    altType?: 'location';
  }): Promise<GHLApiResponse<DeleteInvoiceTemplateResponseDto>> {
    try {
      const queryParams = {
        altId: params?.altId || this.config.locationId,
        altType: 'location' as const
      };

      const response: AxiosResponse<DeleteInvoiceTemplateResponseDto> = await this.axiosInstance.delete(
        `/invoices/template/${templateId}`,
        { params: queryParams }
      );

      return this.wrapResponse(response.data);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Update invoice template late fees configuration
   * PATCH /invoices/template/{templateId}/late-fees-configuration
   */
  async updateInvoiceTemplateLateFeesConfiguration(templateId: string, configData: UpdateInvoiceLateFeesConfigurationDto): Promise<GHLApiResponse<UpdateInvoiceTemplateResponseDto>> {
    try {
      const payload = {
        ...configData,
        altId: configData.altId || this.config.locationId,
        altType: 'location' as const
      };

      const response: AxiosResponse<UpdateInvoiceTemplateResponseDto> = await this.axiosInstance.patch(
        `/invoices/template/${templateId}/late-fees-configuration`,
        payload
      );

      return this.wrapResponse(response.data);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Update invoice template payment methods configuration
   * PATCH /invoices/template/{templateId}/payment-methods-configuration
   */
  async updateInvoiceTemplatePaymentMethodsConfiguration(templateId: string, configData: UpdatePaymentMethodsConfigurationDto): Promise<GHLApiResponse<UpdateInvoiceTemplateResponseDto>> {
    try {
      const payload = {
        ...configData,
        altId: configData.altId || this.config.locationId,
        altType: 'location' as const
      };

      const response: AxiosResponse<UpdateInvoiceTemplateResponseDto> = await this.axiosInstance.patch(
        `/invoices/template/${templateId}/payment-methods-configuration`,
        payload
      );

      return this.wrapResponse(response.data);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Create invoice schedule
   * POST /invoices/schedule
   */
  async createInvoiceSchedule(scheduleData: CreateInvoiceScheduleDto): Promise<GHLApiResponse<CreateInvoiceScheduleResponseDto>> {
    try {
      const payload = {
        ...scheduleData,
        altId: scheduleData.altId || this.config.locationId,
        altType: 'location' as const
      };

      const response: AxiosResponse<CreateInvoiceScheduleResponseDto> = await this.axiosInstance.post(
        '/invoices/schedule',
        payload
      );

      return this.wrapResponse(response.data);
    } catch (error) {
      throw error;
    }
  }

  /**
   * List invoice schedules
   * GET /invoices/schedule
   */
  async listInvoiceSchedules(params?: {
    altId?: string;
    altType?: 'location';
    status?: string;
    startAt?: string;
    endAt?: string;
    search?: string;
    paymentMode?: 'default' | 'live' | 'test';
    limit: string;
    offset: string;
  }): Promise<GHLApiResponse<ListSchedulesResponse>> {
    try {
      const queryParams = {
        altId: params?.altId || this.config.locationId,
        altType: 'location' as const,
        limit: params?.limit || '10',
        offset: params?.offset || '0',
        ...(params?.status && { status: params.status }),
        ...(params?.startAt && { startAt: params.startAt }),
        ...(params?.endAt && { endAt: params.endAt }),
        ...(params?.search && { search: params.search }),
        ...(params?.paymentMode && { paymentMode: params.paymentMode })
      };

      const response: AxiosResponse<ListSchedulesResponse> = await this.axiosInstance.get(
        '/invoices/schedule',
        { params: queryParams }
      );

      return this.wrapResponse(response.data);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get invoice schedule by ID
   * GET /invoices/schedule/{scheduleId}
   */
  async getInvoiceSchedule(scheduleId: string, params?: {
    altId?: string;
    altType?: 'location';
  }): Promise<GHLApiResponse<GetScheduleResponseDto>> {
    try {
      const queryParams = {
        altId: params?.altId || this.config.locationId,
        altType: 'location' as const
      };

      const response: AxiosResponse<GetScheduleResponseDto> = await this.axiosInstance.get(
        `/invoices/schedule/${scheduleId}`,
        { params: queryParams }
      );

      return this.wrapResponse(response.data);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Update invoice schedule
   * PUT /invoices/schedule/{scheduleId}
   */
  async updateInvoiceSchedule(scheduleId: string, scheduleData: UpdateInvoiceScheduleDto): Promise<GHLApiResponse<UpdateInvoiceScheduleResponseDto>> {
    try {
      const payload = {
        ...scheduleData,
        altId: scheduleData.altId || this.config.locationId,
        altType: 'location' as const
      };

      const response: AxiosResponse<UpdateInvoiceScheduleResponseDto> = await this.axiosInstance.put(
        `/invoices/schedule/${scheduleId}`,
        payload
      );

      return this.wrapResponse(response.data);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Delete invoice schedule
   * DELETE /invoices/schedule/{scheduleId}
   */
  async deleteInvoiceSchedule(scheduleId: string, params?: {
    altId?: string;
    altType?: 'location';
  }): Promise<GHLApiResponse<DeleteInvoiceScheduleResponseDto>> {
    try {
      const queryParams = {
        altId: params?.altId || this.config.locationId,
        altType: 'location' as const
      };

      const response: AxiosResponse<DeleteInvoiceScheduleResponseDto> = await this.axiosInstance.delete(
        `/invoices/schedule/${scheduleId}`,
        { params: queryParams }
      );

      return this.wrapResponse(response.data);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Update and schedule recurring invoice
   * POST /invoices/schedule/{scheduleId}/updateAndSchedule
   */
  async updateAndScheduleInvoiceSchedule(scheduleId: string): Promise<GHLApiResponse<UpdateAndScheduleInvoiceScheduleResponseDto>> {
    try {
      const response: AxiosResponse<UpdateAndScheduleInvoiceScheduleResponseDto> = await this.axiosInstance.post(
        `/invoices/schedule/${scheduleId}/updateAndSchedule`
      );

      return this.wrapResponse(response.data);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Schedule an invoice schedule
   * POST /invoices/schedule/{scheduleId}/schedule
   */
  async scheduleInvoiceSchedule(scheduleId: string, scheduleData: ScheduleInvoiceScheduleDto): Promise<GHLApiResponse<ScheduleInvoiceScheduleResponseDto>> {
    try {
      const payload = {
        ...scheduleData,
        altId: scheduleData.altId || this.config.locationId,
        altType: 'location' as const
      };

      const response: AxiosResponse<ScheduleInvoiceScheduleResponseDto> = await this.axiosInstance.post(
        `/invoices/schedule/${scheduleId}/schedule`,
        payload
      );

      return this.wrapResponse(response.data);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Manage auto payment for schedule invoice
   * POST /invoices/schedule/{scheduleId}/auto-payment
   */
  async autoPaymentInvoiceSchedule(scheduleId: string, paymentData: AutoPaymentScheduleDto): Promise<GHLApiResponse<AutoPaymentInvoiceScheduleResponseDto>> {
    try {
      const payload = {
        ...paymentData,
        altId: paymentData.altId || this.config.locationId,
        altType: 'location' as const
      };

      const response: AxiosResponse<AutoPaymentInvoiceScheduleResponseDto> = await this.axiosInstance.post(
        `/invoices/schedule/${scheduleId}/auto-payment`,
        payload
      );

      return this.wrapResponse(response.data);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Cancel scheduled invoice
   * POST /invoices/schedule/{scheduleId}/cancel
   */
  async cancelInvoiceSchedule(scheduleId: string, cancelData: CancelInvoiceScheduleDto): Promise<GHLApiResponse<CancelInvoiceScheduleResponseDto>> {
    try {
      const payload = {
        ...cancelData,
        altId: cancelData.altId || this.config.locationId,
        altType: 'location' as const
      };

      const response: AxiosResponse<CancelInvoiceScheduleResponseDto> = await this.axiosInstance.post(
        `/invoices/schedule/${scheduleId}/cancel`,
        payload
      );

      return this.wrapResponse(response.data);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Create or update text2pay invoice
   * POST /invoices/text2pay
   */
  async text2PayInvoice(invoiceData: Text2PayDto): Promise<GHLApiResponse<Text2PayInvoiceResponseDto>> {
    try {
      const payload = {
        ...invoiceData,
        altId: invoiceData.altId || this.config.locationId,
        altType: 'location' as const
      };

      const response: AxiosResponse<Text2PayInvoiceResponseDto> = await this.axiosInstance.post(
        '/invoices/text2pay',
        payload
      );

      return this.wrapResponse(response.data);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Generate invoice number
   * GET /invoices/generate-invoice-number
   */
  async generateInvoiceNumber(params?: {
    altId?: string;
    altType?: 'location';
  }): Promise<GHLApiResponse<GenerateInvoiceNumberResponse>> {
    try {
      const queryParams = {
        altId: params?.altId || this.config.locationId,
        altType: 'location' as const
      };

      const response: AxiosResponse<GenerateInvoiceNumberResponse> = await this.axiosInstance.get(
        '/invoices/generate-invoice-number',
        { params: queryParams }
      );

      return this.wrapResponse(response.data);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get invoice by ID
   * GET /invoices/{invoiceId}
   */
  async getInvoice(invoiceId: string, params?: {
    altId?: string;
    altType?: 'location';
  }): Promise<GHLApiResponse<GetInvoiceResponseDto>> {
    try {
      const queryParams = {
        altId: params?.altId || this.config.locationId,
        altType: 'location' as const
      };

      const response: AxiosResponse<GetInvoiceResponseDto> = await this.axiosInstance.get(
        `/invoices/${invoiceId}`,
        { params: queryParams }
      );

      return this.wrapResponse(response.data);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Update invoice
   * PUT /invoices/{invoiceId}
   */
  async updateInvoice(invoiceId: string, invoiceData: UpdateInvoiceDto): Promise<GHLApiResponse<UpdateInvoiceResponseDto>> {
    try {
      const payload = {
        ...invoiceData,
        altId: invoiceData.altId || this.config.locationId,
        altType: 'location' as const
      };

      const response: AxiosResponse<UpdateInvoiceResponseDto> = await this.axiosInstance.put(
        `/invoices/${invoiceId}`,
        payload
      );

      return this.wrapResponse(response.data);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Delete invoice
   * DELETE /invoices/{invoiceId}
   */
  async deleteInvoice(invoiceId: string, params?: {
    altId?: string;
    altType?: 'location';
  }): Promise<GHLApiResponse<DeleteInvoiceResponseDto>> {
    try {
      const queryParams = {
        altId: params?.altId || this.config.locationId,
        altType: 'location' as const
      };

      const response: AxiosResponse<DeleteInvoiceResponseDto> = await this.axiosInstance.delete(
        `/invoices/${invoiceId}`,
        { params: queryParams }
      );

      return this.wrapResponse(response.data);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Update invoice late fees configuration
   * PATCH /invoices/{invoiceId}/late-fees-configuration
   */
  async updateInvoiceLateFeesConfiguration(invoiceId: string, configData: UpdateInvoiceLateFeesConfigurationDto): Promise<GHLApiResponse<UpdateInvoiceResponseDto>> {
    try {
      const payload = {
        ...configData,
        altId: configData.altId || this.config.locationId,
        altType: 'location' as const
      };

      const response: AxiosResponse<UpdateInvoiceResponseDto> = await this.axiosInstance.patch(
        `/invoices/${invoiceId}/late-fees-configuration`,
        payload
      );

      return this.wrapResponse(response.data);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Void invoice
   * POST /invoices/{invoiceId}/void
   */
  async voidInvoice(invoiceId: string, voidData: VoidInvoiceDto): Promise<GHLApiResponse<VoidInvoiceResponseDto>> {
    try {
      const payload = {
        ...voidData,
        altId: voidData.altId || this.config.locationId,
        altType: 'location' as const
      };

      const response: AxiosResponse<VoidInvoiceResponseDto> = await this.axiosInstance.post(
        `/invoices/${invoiceId}/void`,
        payload
      );

      return this.wrapResponse(response.data);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Send invoice
   * POST /invoices/{invoiceId}/send
   */
  async sendInvoice(invoiceId: string, sendData: SendInvoiceDto): Promise<GHLApiResponse<SendInvoicesResponseDto>> {
    try {
      const payload = {
        ...sendData,
        altId: sendData.altId || this.config.locationId,
        altType: 'location' as const
      };

      const response: AxiosResponse<SendInvoicesResponseDto> = await this.axiosInstance.post(
        `/invoices/${invoiceId}/send`,
        payload
      );

      return this.wrapResponse(response.data);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Record manual payment for invoice
   * POST /invoices/{invoiceId}/record-payment
   */
  async recordInvoicePayment(invoiceId: string, paymentData: RecordPaymentDto): Promise<GHLApiResponse<RecordPaymentResponseDto>> {
    try {
      const payload = {
        ...paymentData,
        altId: paymentData.altId || this.config.locationId,
        altType: 'location' as const
      };

      const response: AxiosResponse<RecordPaymentResponseDto> = await this.axiosInstance.post(
        `/invoices/${invoiceId}/record-payment`,
        payload
      );

      return this.wrapResponse(response.data);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Update invoice last visited at
   * PATCH /invoices/stats/last-visited-at
   */
  async updateInvoiceLastVisitedAt(statsData: PatchInvoiceStatsLastViewedDto): Promise<GHLApiResponse<void>> {
    try {
      const response: AxiosResponse<void> = await this.axiosInstance.patch(
        '/invoices/stats/last-visited-at',
        statsData
      );

      return this.wrapResponse(response.data);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Create new estimate
   * POST /invoices/estimate
   */
  async createEstimate(estimateData: CreateEstimatesDto): Promise<GHLApiResponse<EstimateResponseDto>> {
    try {
      const payload = {
        ...estimateData,
        altId: estimateData.altId || this.config.locationId,
        altType: 'location' as const
      };

      const response: AxiosResponse<EstimateResponseDto> = await this.axiosInstance.post(
        '/invoices/estimate',
        payload
      );

      return this.wrapResponse(response.data);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Update estimate
   * PUT /invoices/estimate/{estimateId}
   */
  async updateEstimate(estimateId: string, estimateData: UpdateEstimateDto): Promise<GHLApiResponse<EstimateResponseDto>> {
    try {
      const payload = {
        ...estimateData,
        altId: estimateData.altId || this.config.locationId,
        altType: 'location' as const
      };

      const response: AxiosResponse<EstimateResponseDto> = await this.axiosInstance.put(
        `/invoices/estimate/${estimateId}`,
        payload
      );

      return this.wrapResponse(response.data);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Delete estimate
   * DELETE /invoices/estimate/{estimateId}
   */
  async deleteEstimate(estimateId: string, deleteData: AltDto): Promise<GHLApiResponse<EstimateResponseDto>> {
    try {
      const payload = {
        ...deleteData,
        altId: deleteData.altId || this.config.locationId,
        altType: 'location' as const
      };

      const response: AxiosResponse<EstimateResponseDto> = await this.axiosInstance.delete(
        `/invoices/estimate/${estimateId}`,
        { data: payload }
      );

      return this.wrapResponse(response.data);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Generate estimate number
   * GET /invoices/estimate/number/generate
   */
  async generateEstimateNumber(params?: {
    altId?: string;
    altType?: 'location';
  }): Promise<GHLApiResponse<GenerateEstimateNumberResponse>> {
    try {
      const queryParams = {
        altId: params?.altId || this.config.locationId,
        altType: 'location' as const
      };

      const response: AxiosResponse<GenerateEstimateNumberResponse> = await this.axiosInstance.get(
        '/invoices/estimate/number/generate',
        { params: queryParams }
      );

      return this.wrapResponse(response.data);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Send estimate
   * POST /invoices/estimate/{estimateId}/send
   */
  async sendEstimate(estimateId: string, sendData: SendEstimateDto): Promise<GHLApiResponse<EstimateResponseDto>> {
    try {
      const payload = {
        ...sendData,
        altId: sendData.altId || this.config.locationId,
        altType: 'location' as const
      };

      const response: AxiosResponse<EstimateResponseDto> = await this.axiosInstance.post(
        `/invoices/estimate/${estimateId}/send`,
        payload
      );

      return this.wrapResponse(response.data);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Create invoice from estimate
   * POST /invoices/estimate/{estimateId}/invoice
   */
  async createInvoiceFromEstimate(estimateId: string, invoiceData: CreateInvoiceFromEstimateDto): Promise<GHLApiResponse<CreateInvoiceFromEstimateResponseDto>> {
    try {
      const payload = {
        ...invoiceData,
        altId: invoiceData.altId || this.config.locationId,
        altType: 'location' as const
      };

      const response: AxiosResponse<CreateInvoiceFromEstimateResponseDto> = await this.axiosInstance.post(
        `/invoices/estimate/${estimateId}/invoice`,
        payload
      );

      return this.wrapResponse(response.data);
    } catch (error) {
      throw error;
    }
  }

  /**
   * List estimates
   * GET /invoices/estimate/list
   */
  async listEstimates(params?: {
    altId?: string;
    altType?: 'location';
    startAt?: string;
    endAt?: string;
    search?: string;
    status?: 'all' | 'draft' | 'sent' | 'accepted' | 'declined' | 'invoiced' | 'viewed';
    contactId?: string;
    limit: string;
    offset: string;
  }): Promise<GHLApiResponse<ListEstimatesResponseDto>> {
    try {
      const queryParams = {
        altId: params?.altId || this.config.locationId,
        altType: 'location' as const,
        limit: params?.limit || '10',
        offset: params?.offset || '0',
        ...(params?.startAt && { startAt: params.startAt }),
        ...(params?.endAt && { endAt: params.endAt }),
        ...(params?.search && { search: params.search }),
        ...(params?.status && { status: params.status }),
        ...(params?.contactId && { contactId: params.contactId })
      };

      const response: AxiosResponse<ListEstimatesResponseDto> = await this.axiosInstance.get(
        '/invoices/estimate/list',
        { params: queryParams }
      );

      return this.wrapResponse(response.data);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Update estimate last visited at
   * PATCH /invoices/estimate/stats/last-visited-at
   */
  async updateEstimateLastVisitedAt(statsData: EstimateIdParam): Promise<GHLApiResponse<void>> {
    try {
      const response: AxiosResponse<void> = await this.axiosInstance.patch(
        '/invoices/estimate/stats/last-visited-at',
        statsData
      );

      return this.wrapResponse(response.data);
    } catch (error) {
      throw error;
    }
  }

  /**
   * List estimate templates
   * GET /invoices/estimate/template
   */
  async listEstimateTemplates(params?: {
    altId?: string;
    altType?: 'location';
    search?: string;
    limit: string;
    offset: string;
  }): Promise<GHLApiResponse<ListEstimateTemplateResponseDto>> {
    try {
      const queryParams = {
        altId: params?.altId || this.config.locationId,
        altType: 'location' as const,
        limit: params?.limit || '10',
        offset: params?.offset || '0',
        ...(params?.search && { search: params.search })
      };

      const response: AxiosResponse<ListEstimateTemplateResponseDto> = await this.axiosInstance.get(
        '/invoices/estimate/template',
        { params: queryParams }
      );

      return this.wrapResponse(response.data);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Create estimate template
   * POST /invoices/estimate/template
   */
  async createEstimateTemplate(templateData: EstimateTemplatesDto): Promise<GHLApiResponse<EstimateTemplateResponseDto>> {
    try {
      const payload = {
        ...templateData,
        altId: templateData.altId || this.config.locationId,
        altType: 'location' as const
      };

      const response: AxiosResponse<EstimateTemplateResponseDto> = await this.axiosInstance.post(
        '/invoices/estimate/template',
        payload
      );

      return this.wrapResponse(response.data);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Update estimate template
   * PUT /invoices/estimate/template/{templateId}
   */
  async updateEstimateTemplate(templateId: string, templateData: EstimateTemplatesDto): Promise<GHLApiResponse<EstimateTemplateResponseDto>> {
    try {
      const payload = {
        ...templateData,
        altId: templateData.altId || this.config.locationId,
        altType: 'location' as const
      };

      const response: AxiosResponse<EstimateTemplateResponseDto> = await this.axiosInstance.put(
        `/invoices/estimate/template/${templateId}`,
        payload
      );

      return this.wrapResponse(response.data);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Delete estimate template
   * DELETE /invoices/estimate/template/{templateId}
   */
  async deleteEstimateTemplate(templateId: string, deleteData: AltDto): Promise<GHLApiResponse<EstimateTemplateResponseDto>> {
    try {
      const payload = {
        ...deleteData,
        altId: deleteData.altId || this.config.locationId,
        altType: 'location' as const
      };

      const response: AxiosResponse<EstimateTemplateResponseDto> = await this.axiosInstance.delete(
        `/invoices/estimate/template/${templateId}`,
        { data: payload }
      );

      return this.wrapResponse(response.data);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Preview estimate template
   * GET /invoices/estimate/template/preview
   */
  async previewEstimateTemplate(params?: {
    altId?: string;
    altType?: 'location';
    templateId: string;
  }): Promise<GHLApiResponse<EstimateTemplateResponseDto>> {
    try {
      const queryParams = {
        altId: params?.altId || this.config.locationId,
        altType: 'location' as const,
        templateId: params?.templateId || ''
      };

      const response: AxiosResponse<EstimateTemplateResponseDto> = await this.axiosInstance.get(
        '/invoices/estimate/template/preview',
        { params: queryParams }
      );

      return this.wrapResponse(response.data);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Create invoice
   * POST /invoices/
   */
  async createInvoice(invoiceData: CreateInvoiceDto): Promise<GHLApiResponse<CreateInvoiceResponseDto>> {
    try {
      const payload = {
        ...invoiceData,
        altId: invoiceData.altId || this.config.locationId,
        altType: 'location' as const
      };

      const response: AxiosResponse<CreateInvoiceResponseDto> = await this.axiosInstance.post(
        '/invoices/',
        payload
      );

      return this.wrapResponse(response.data);
    } catch (error) {
      throw error;
    }
  }

  /**
   * List invoices
   * GET /invoices/
   */
  async listInvoices(params?: {
    altId?: string;
    altType?: 'location';
    status?: string;
    startAt?: string;
    endAt?: string;
    search?: string;
    paymentMode?: 'default' | 'live' | 'test';
    contactId?: string;
    limit: string;
    offset: string;
    sortField?: 'issueDate';
    sortOrder?: 'ascend' | 'descend';
  }): Promise<GHLApiResponse<ListInvoicesResponseDto>> {
    try {
      const queryParams = {
        altId: params?.altId || this.config.locationId,
        altType: 'location' as const,
        limit: params?.limit || '10',
        offset: params?.offset || '0',
        ...(params?.status && { status: params.status }),
        ...(params?.startAt && { startAt: params.startAt }),
        ...(params?.endAt && { endAt: params.endAt }),
        ...(params?.search && { search: params.search }),
        ...(params?.paymentMode && { paymentMode: params.paymentMode }),
        ...(params?.contactId && { contactId: params.contactId }),
        ...(params?.sortField && { sortField: params.sortField }),
        ...(params?.sortOrder && { sortOrder: params.sortOrder })
      };

      const response: AxiosResponse<ListInvoicesResponseDto> = await this.axiosInstance.get(
        '/invoices/',
        { params: queryParams }
      );

      return this.wrapResponse(response.data);
    } catch (error) {
      throw error;
    }
  }
}
