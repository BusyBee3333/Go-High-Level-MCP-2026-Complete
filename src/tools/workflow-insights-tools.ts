import { Tool } from '@modelcontextprotocol/sdk/types.js';
import type { GHLToolClient } from './ghl-tool-client.js';
import { resolveRequestVersion } from '../clients/endpoint-version-resolver.js';

type GHLResult<T = unknown> = {
  success?: boolean;
  data?: T;
  error?: { message?: string } | string;
};

type RequestOutcome<T = unknown> = {
  ok: boolean;
  endpoint: string;
  response?: GHLResult<T>;
  error?: string;
};

type CampaignSummary = {
  id?: string;
  name?: string;
  status?: string;
  sent: number;
  delivered: number;
  opened: number;
  clicked: number;
  bounced: number;
  unsubscribed: number;
  openRate: number | null;
  clickRate: number | null;
};

export class WorkflowInsightsTools {
  constructor(private ghlClient: GHLToolClient) {}

  getToolDefinitions(): Tool[] {
    return [
      {
        name: 'audit_location_ads_setup',
        description: 'Read-only audit of location setup relevant to paid-ad lead routing, forms, workflows, calendars, tags, and email follow-up.',
        inputSchema: {
          type: 'object',
          properties: {
            locationId: { type: 'string', description: 'Location ID. Uses configured default if omitted.' },
            includeRaw: { type: 'boolean', description: 'Include raw endpoint outcomes for deeper inspection.', default: false },
            limit: { type: 'number', description: 'Maximum records to sample from each collection (default: 25, max: 100).' }
          }
        },
        _meta: { labels: { category: 'workflow-insights', access: 'read', complexity: 'composed' } }
      },
      {
        name: 'summarize_email_campaign_performance',
        description: 'Summarize scheduled email campaign performance for a location, optionally sampling per-campaign stats endpoints.',
        inputSchema: {
          type: 'object',
          properties: {
            locationId: { type: 'string', description: 'Location ID. Uses configured default if omitted.' },
            status: { type: 'string', description: 'Optional schedule status filter.' },
            startAt: { type: 'string', description: 'Optional start date filter if supported by the account endpoint.' },
            endAt: { type: 'string', description: 'Optional end date filter if supported by the account endpoint.' },
            limit: { type: 'number', description: 'Maximum campaigns to summarize (default: 25, max: 100).' },
            includeRecipients: { type: 'boolean', description: 'Also sample recipient counts by status for each campaign.', default: false },
            includeRaw: { type: 'boolean', description: 'Include raw endpoint outcomes.', default: false }
          }
        },
        _meta: { labels: { category: 'workflow-insights', access: 'read', complexity: 'composed' } }
      },
      {
        name: 'find_uncontacted_form_leads',
        description: 'Find recent form submissions that do not appear to have conversation activity, using form submissions, contact search, and conversation search.',
        inputSchema: {
          type: 'object',
          properties: {
            locationId: { type: 'string', description: 'Location ID. Uses configured default if omitted.' },
            formId: { type: 'string', description: 'Optional single form ID. If omitted, samples forms for the location.' },
            startAt: { type: 'string', description: 'Submission start date filter.' },
            endAt: { type: 'string', description: 'Submission end date filter.' },
            limit: { type: 'number', description: 'Maximum submissions per form to inspect (default: 25, max: 100).' },
            formLimit: { type: 'number', description: 'Maximum forms to sample when formId is omitted (default: 10, max: 50).' },
            includeRaw: { type: 'boolean', description: 'Include raw endpoint outcomes.', default: false }
          }
        },
        _meta: { labels: { category: 'workflow-insights', access: 'read', complexity: 'composed' } }
      },
      {
        name: 'summarize_calendar_availability',
        description: 'Summarize available booking slots across one or more calendars for a date range.',
        inputSchema: {
          type: 'object',
          properties: {
            locationId: { type: 'string', description: 'Location ID. Uses configured default if omitted.' },
            calendarId: { type: 'string', description: 'Optional single calendar ID. If omitted, samples calendars for the location.' },
            groupId: { type: 'string', description: 'Optional calendar group ID filter.' },
            startDate: { type: 'string', description: 'Start date as YYYY-MM-DD or milliseconds. Defaults to today.' },
            endDate: { type: 'string', description: 'End date as YYYY-MM-DD or milliseconds. Defaults to 7 days after startDate.' },
            timezone: { type: 'string', description: 'Timezone for free slot lookups.' },
            userId: { type: 'string', description: 'Optional user ID filter.' },
            limit: { type: 'number', description: 'Maximum calendars to inspect when calendarId is omitted (default: 10, max: 50).' },
            includeRaw: { type: 'boolean', description: 'Include raw endpoint outcomes.', default: false }
          }
        },
        _meta: { labels: { category: 'workflow-insights', access: 'read', complexity: 'composed' } }
      }
    ];
  }

  async handleToolCall(toolName: string, args: Record<string, unknown>): Promise<unknown> {
    switch (toolName) {
      case 'audit_location_ads_setup':
        return this.auditLocationAdsSetup(args);
      case 'summarize_email_campaign_performance':
        return this.summarizeEmailCampaignPerformance(args);
      case 'find_uncontacted_form_leads':
        return this.findUncontactedFormLeads(args);
      case 'summarize_calendar_availability':
        return this.summarizeCalendarAvailability(args);
      default:
        throw new Error(`Unknown workflow insights tool: ${toolName}`);
    }
  }

  private async auditLocationAdsSetup(args: Record<string, unknown>): Promise<unknown> {
    const locationId = this.locationId(args);
    const limit = this.limit(args.limit, 25, 100);
    const includeRaw = args.includeRaw === true;
    const endpoints = {
      location: `/locations/${encodeURIComponent(locationId)}`,
      forms: `/forms/?locationId=${encodeURIComponent(locationId)}&limit=${limit}`,
      workflows: `/workflows/?locationId=${encodeURIComponent(locationId)}&limit=${limit}`,
      calendars: `/calendars/?locationId=${encodeURIComponent(locationId)}&showDrafted=true`,
      tags: `/locations/${encodeURIComponent(locationId)}/tags`,
      customFields: `/locations/${encodeURIComponent(locationId)}/customFields?model=contact`,
      campaigns: this.emailCampaignListEndpoint(locationId, limit)
    };

    const raw = await this.requestMap(endpoints);
    const forms = this.firstArray(raw.forms.response?.data, ['forms', 'data', 'items']);
    const workflows = this.firstArray(raw.workflows.response?.data, ['workflows', 'data', 'items']);
    const calendars = this.firstArray(raw.calendars.response?.data, ['calendars', 'data', 'items']);
    const tags = this.firstArray(raw.tags.response?.data, ['tags', 'data', 'items']);
    const customFields = this.firstArray(raw.customFields.response?.data, ['customFields', 'fields', 'data', 'items']);
    const campaigns = this.firstArray(raw.campaigns.response?.data, ['campaigns', 'emails', 'schedules', 'data', 'items']);

    const checks = [
      this.check('location_profile', raw.location.ok, 'Location profile is readable.'),
      this.check('lead_capture_forms', forms.length > 0, `${forms.length} forms found for ad lead capture.`),
      this.check('automation_workflows', workflows.length > 0, `${workflows.length} workflows found for follow-up routing.`),
      this.check('booking_calendars', calendars.length > 0, `${calendars.length} calendars found for appointment booking.`),
      this.check('lead_tags', tags.length > 0, `${tags.length} location tags found for segmentation.`),
      this.check('contact_custom_fields', customFields.length > 0, `${customFields.length} contact custom fields found for attribution/intake.`),
      this.check('email_followup_campaigns', campaigns.length > 0, `${campaigns.length} scheduled email campaigns found.`)
    ];

    return this.withRaw({
      success: true,
      locationId,
      summary: {
        passed: checks.filter(item => item.ok).length,
        failed: checks.filter(item => !item.ok).length,
        endpointFailures: Object.values(raw).filter(item => !item.ok).length
      },
      checks,
      samples: {
        forms: forms.slice(0, 5).map(item => this.pick(item, ['id', '_id', 'name', 'title', 'isActive', 'status'])),
        workflows: workflows.slice(0, 5).map(item => this.pick(item, ['id', '_id', 'name', 'status', 'isPublished'])),
        calendars: calendars.slice(0, 5).map(item => this.pick(item, ['id', '_id', 'name', 'calendarType', 'isActive'])),
        campaigns: campaigns.slice(0, 5).map(item => this.pick(item, ['id', '_id', 'name', 'status', 'emailStatus']))
      }
    }, raw, includeRaw);
  }

  private async summarizeEmailCampaignPerformance(args: Record<string, unknown>): Promise<unknown> {
    const locationId = this.locationId(args);
    const limit = this.limit(args.limit, 25, 100);
    const includeRaw = args.includeRaw === true;
    const campaignList = await this.safeGet(this.emailCampaignListEndpoint(locationId, limit, args));
    const campaigns = this.firstArray(campaignList.response?.data, ['campaigns', 'emails', 'schedules', 'data', 'items']).slice(0, limit);
    const stats = await Promise.all(campaigns.map(async campaign => {
      const id = this.idOf(campaign);
      const statOutcome = id ? await this.safeGet(this.emailCampaignStatsEndpoint(locationId, id)) : undefined;
      // The legacy recipients endpoint has no v3 equivalent in the locked
      // Email spec. Never leak it into the v3 workflow surface.
      const recipientOutcome = !this.isV3() && args.includeRecipients === true && id
        ? await this.safeGet(`/campaigns/${encodeURIComponent(id)}/recipients?locationId=${encodeURIComponent(locationId)}&limit=100`)
        : undefined;
      return this.campaignSummary(campaign, statOutcome?.response?.data, recipientOutcome?.response?.data);
    }));

    const totals = stats.reduce((acc, item) => {
      acc.sent += item.sent;
      acc.delivered += item.delivered;
      acc.opened += item.opened;
      acc.clicked += item.clicked;
      acc.bounced += item.bounced;
      acc.unsubscribed += item.unsubscribed;
      return acc;
    }, { sent: 0, delivered: 0, opened: 0, clicked: 0, bounced: 0, unsubscribed: 0 });

    return this.withRaw({
      success: true,
      locationId,
      campaignCount: campaigns.length,
      totals: {
        ...totals,
        openRate: this.rate(totals.opened, totals.delivered || totals.sent),
        clickRate: this.rate(totals.clicked, totals.delivered || totals.sent)
      },
      campaigns: stats
    }, { campaignList }, includeRaw);
  }

  private async findUncontactedFormLeads(args: Record<string, unknown>): Promise<unknown> {
    const locationId = this.locationId(args);
    const limit = this.limit(args.limit, 25, 100);
    const formLimit = this.limit(args.formLimit, 10, 50);
    const includeRaw = args.includeRaw === true;
    const formIds = args.formId ? [String(args.formId)] : await this.formIds(locationId, formLimit);
    const raw: Record<string, RequestOutcome> = {};
    const leads: unknown[] = [];

    for (const formId of formIds) {
      const params = new URLSearchParams({ formId, locationId, limit: String(limit) });
      this.appendOptional(params, args, ['startAt', 'endAt']);
      const submissions = await this.safeGet(`/forms/submissions?${params.toString()}`);
      raw[`submissions:${formId}`] = submissions;

      for (const submission of this.firstArray(submissions.response?.data, ['submissions', 'data', 'items']).slice(0, limit)) {
        const contact = this.contactFields(submission);
        const submissionId = this.idOf(submission) || `${formId}:${leads.length}`;
        const query = contact.email || contact.phone;
        const contactSearch = query
          ? await this.safePost('/contacts/search', { locationId, pageLimit: 1, query })
          : undefined;
        if (contactSearch) raw[`contactSearch:${submissionId}`] = contactSearch;
        const contactId = contact.contactId || this.idOf(this.firstArray(contactSearch?.response?.data, ['contacts', 'data', 'items'])[0]);
        const conversations = contactId
          ? await this.safeGet(`/conversations/search?locationId=${encodeURIComponent(locationId)}&contactId=${encodeURIComponent(contactId)}&limit=1`)
          : undefined;
        if (conversations) raw[`conversations:${submissionId}`] = conversations;

        if (!this.firstArray(conversations?.response?.data, ['conversations', 'data', 'items']).length) {
          leads.push({
            formId,
            contactId,
            email: contact.email,
            phone: contact.phone,
            name: contact.name,
            submittedAt: this.valueAt(submission, ['submittedAt', 'createdAt', 'dateAdded']),
            submissionId
          });
        }
      }
    }

    return this.withRaw({
      success: true,
      locationId,
      formsChecked: formIds.length,
      uncontactedCount: leads.length,
      leads
    }, raw, includeRaw);
  }

  private async summarizeCalendarAvailability(args: Record<string, unknown>): Promise<unknown> {
    const locationId = this.locationId(args);
    const limit = this.limit(args.limit, 10, 50);
    const includeRaw = args.includeRaw === true;
    const startDate = String(args.startDate || this.isoDate(new Date()));
    const endDate = String(args.endDate || this.isoDate(new Date(Date.parse(startDate) + 7 * 24 * 60 * 60 * 1000)));
    const calendars = args.calendarId
      ? [{ id: String(args.calendarId), name: String(args.calendarId) }]
      : await this.calendars(locationId, args.groupId as string | undefined, limit);
    const raw: Record<string, RequestOutcome> = {};
    const availability = [];

    for (const calendar of calendars) {
      const calendarId = this.idOf(calendar);
      if (!calendarId) continue;
      const params = new URLSearchParams({ startDate, endDate });
      this.appendOptional(params, args, ['timezone', 'userId']);
      const endpoint = `/calendars/${encodeURIComponent(calendarId)}/free-slots?${params.toString()}`;
      const slots = await this.safeGet(endpoint);
      raw[`freeSlots:${calendarId}`] = slots;
      const slotValues = this.slotValues(slots.response?.data);
      availability.push({
        calendarId,
        name: this.valueAt(calendar, ['name', 'title']),
        slotCount: slotValues.length,
        firstAvailable: slotValues[0] || null,
        lastAvailable: slotValues[slotValues.length - 1] || null
      });
    }

    return this.withRaw({
      success: true,
      locationId,
      startDate,
      endDate,
      calendarsChecked: availability.length,
      totalSlots: availability.reduce((sum, item) => sum + item.slotCount, 0),
      availability
    }, raw, includeRaw);
  }

  private locationId(args: Record<string, unknown>): string {
    const locationId = (args.locationId as string | undefined) || this.ghlClient.getConfig().locationId;
    if (!locationId) throw new Error('locationId is required when no default location is configured');
    return locationId;
  }

  private async requestMap(endpoints: Record<string, string>): Promise<Record<string, RequestOutcome>> {
    const entries = await Promise.all(Object.entries(endpoints).map(async ([key, endpoint]) => [key, await this.safeGet(endpoint)] as const));
    return Object.fromEntries(entries);
  }

  private async safeGet(endpoint: string): Promise<RequestOutcome> {
    try {
      const response = await this.ghlClient.makeRequest('GET', endpoint, undefined, this.requestOptions('GET', endpoint));
      return { ok: response.success !== false, endpoint, response };
    } catch (error) {
      return { ok: false, endpoint, error: error instanceof Error ? error.message : String(error) };
    }
  }

  private async safePost(endpoint: string, body: Record<string, unknown>): Promise<RequestOutcome> {
    try {
      const response = await this.ghlClient.makeRequest('POST', endpoint, body, this.requestOptions('POST', endpoint));
      return { ok: response.success !== false, endpoint, response };
    } catch (error) {
      return { ok: false, endpoint, error: error instanceof Error ? error.message : String(error) };
    }
  }

  private async formIds(locationId: string, limit: number): Promise<string[]> {
    const forms = await this.safeGet(`/forms/?locationId=${encodeURIComponent(locationId)}&limit=${limit}`);
    return this.firstArray(forms.response?.data, ['forms', 'data', 'items']).map(item => this.idOf(item)).filter((id): id is string => Boolean(id));
  }

  private async calendars(locationId: string, groupId: string | undefined, limit: number): Promise<Record<string, unknown>[]> {
    const params = new URLSearchParams({ locationId, showDrafted: 'true' });
    if (groupId) params.append('groupId', groupId);
    const calendars = await this.safeGet(`/calendars/?${params.toString()}`);
    return this.firstArray(calendars.response?.data, ['calendars', 'data', 'items']).slice(0, limit);
  }

  private isV3(): boolean {
    return this.ghlClient.getConfig().apiGeneration !== 'v2';
  }

  private emailCampaignListEndpoint(
    locationId: string,
    limit: number,
    args: Record<string, unknown> = {},
  ): string {
    if (this.isV3()) {
      const params = new URLSearchParams({ limit: String(Math.min(limit, 20)) });
      if (args.status) params.append('status', String(args.status));
      return `/emails/locations/${encodeURIComponent(locationId)}/campaigns/emails?${params.toString()}`;
    }

    const params = new URLSearchParams({
      locationId,
      campaignsOnly: 'true',
      showStats: 'true',
      limit: String(limit),
    });
    this.appendOptional(params, args, ['status', 'startAt', 'endAt']);
    return `/emails/schedule?${params.toString()}`;
  }

  private emailCampaignStatsEndpoint(locationId: string, campaignId: string): string {
    return this.isV3()
      ? `/emails/locations/${encodeURIComponent(locationId)}/campaigns/stats/email-campaigns/${encodeURIComponent(campaignId)}`
      : `/campaigns/${encodeURIComponent(campaignId)}/stats?locationId=${encodeURIComponent(locationId)}`;
  }

  private requestOptions(method: string, endpoint: string): { version: string } {
    const config = this.ghlClient.getConfig();
    return {
      version: resolveRequestVersion(method, endpoint, config.apiGeneration, config.version),
    };
  }

  private campaignSummary(campaign: unknown, statsData: unknown, recipientData: unknown): CampaignSummary {
    const source = { ...(this.asRecord(campaign)), ...(this.asRecord(statsData)) };
    const sent = this.numberAt(source, ['sent', 'sentCount', 'totalSent', 'stats.sent']);
    const delivered = this.numberAt(source, ['delivered', 'deliveredCount', 'totalDelivered', 'stats.delivered']) || sent;
    const opened = this.numberAt(source, ['opened', 'open', 'opens', 'openedCount', 'uniqueOpens', 'stats.opened', 'stats.opens']);
    const clicked = this.numberAt(source, ['clicked', 'click', 'clicks', 'clickedCount', 'uniqueClicks', 'stats.clicked', 'stats.clicks']);
    const bounced = this.numberAt(source, ['bounced', 'bounce', 'bounces', 'bouncedCount', 'stats.bounced']);
    const unsubscribed = this.numberAt(source, ['unsubscribed', 'unsubscribe', 'unsubscribes', 'stats.unsubscribed']);
    const recipients = this.firstArray(recipientData, ['recipients', 'data', 'items']);

    return {
      id: this.idOf(campaign),
      name: this.stringAt(campaign, ['name', 'title', 'subject']),
      status: this.stringAt(campaign, ['status', 'emailStatus']),
      sent: sent || recipients.length,
      delivered,
      opened,
      clicked,
      bounced,
      unsubscribed,
      openRate: this.rate(opened, delivered || sent),
      clickRate: this.rate(clicked, delivered || sent)
    };
  }

  private contactFields(submission: unknown): { contactId?: string; email?: string; phone?: string; name?: string } {
    return {
      contactId: this.stringAt(submission, ['contactId', 'contact.id']),
      email: this.stringAt(submission, ['email', 'contact.email', 'fields.email']),
      phone: this.stringAt(submission, ['phone', 'contact.phone', 'fields.phone']),
      name: this.stringAt(submission, ['name', 'fullName', 'contact.name'])
    };
  }

  private slotValues(data: unknown): unknown[] {
    const direct = this.firstArray(data, ['slots', 'freeSlots', 'data', 'items']);
    if (direct.length) return direct;
    const record = this.asRecord(this.unwrap(data));
    return Object.values(record).flatMap(value => Array.isArray(value) ? value : []);
  }

  private firstArray(source: unknown, keys: string[]): Record<string, unknown>[] {
    const unwrapped = this.unwrap(source);
    if (Array.isArray(unwrapped)) return unwrapped.filter(this.isRecord);
    for (const key of keys) {
      const value = this.valueAt(unwrapped, key.split('.'));
      if (Array.isArray(value)) return value.filter(this.isRecord);
    }
    return [];
  }

  private unwrap(source: unknown): unknown {
    const record = this.asRecord(source);
    return record.data ?? source;
  }

  private valueAt(source: unknown, keys: string[]): unknown {
    let current: unknown = source;
    for (const key of keys) {
      const record = this.asRecord(current);
      current = record[key];
      if (current === undefined || current === null) return current;
    }
    return current;
  }

  private numberAt(source: unknown, keys: string[]): number {
    for (const key of keys) {
      const value = this.valueAt(source, key.split('.'));
      const number = typeof value === 'number' ? value : Number(value);
      if (Number.isFinite(number)) return number;
    }
    return 0;
  }

  private stringAt(source: unknown, keys: string[]): string | undefined {
    for (const key of keys) {
      const value = this.valueAt(source, key.split('.'));
      if (typeof value === 'string' && value.trim()) return value;
    }
    return undefined;
  }

  private idOf(source: unknown): string | undefined {
    return this.stringAt(source, ['id', '_id', 'campaignId', 'calendarId', 'formId']);
  }

  private pick(source: unknown, keys: string[]): Record<string, unknown> {
    const record = this.asRecord(source);
    return Object.fromEntries(keys.filter(key => record[key] !== undefined).map(key => [key, record[key]]));
  }

  private asRecord(source: unknown): Record<string, unknown> {
    return source && typeof source === 'object' ? source as Record<string, unknown> : {};
  }

  private isRecord(value: unknown): value is Record<string, unknown> {
    return Boolean(value && typeof value === 'object' && !Array.isArray(value));
  }

  private rate(numerator: number, denominator: number): number | null {
    return denominator > 0 ? Number((numerator / denominator).toFixed(4)) : null;
  }

  private limit(value: unknown, fallback: number, max: number): number {
    const parsed = Number(value);
    if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
    return Math.min(Math.floor(parsed), max);
  }

  private appendOptional(params: URLSearchParams, args: Record<string, unknown>, keys: string[]): void {
    for (const key of keys) {
      if (args[key] !== undefined && args[key] !== null && args[key] !== '') params.append(key, String(args[key]));
    }
  }

  private check(name: string, ok: boolean, message: string): { name: string; ok: boolean; message: string } {
    return { name, ok, message };
  }

  private withRaw(payload: Record<string, unknown>, raw: unknown, includeRaw: boolean): Record<string, unknown> {
    return includeRaw ? { ...payload, raw } : payload;
  }

  private isoDate(date: Date): string {
    return date.toISOString().slice(0, 10);
  }
}
