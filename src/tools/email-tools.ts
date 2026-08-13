/**
 * MCP Email Tools for GoHighLevel Integration
 * Exposes email campaign and template management capabilities to the MCP server
 */

import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { GHLApiClient } from '../clients/ghl-api-client.js';
import {
  MCPGetEmailCampaignsParams,
  MCPCreateEmailTemplateParams,
  MCPGetEmailTemplatesParams,
  MCPUpdateEmailTemplateParams,
  MCPDeleteEmailTemplateParams,
  GHLEmailCampaign,
  GHLEmailTemplate
} from '../types/ghl-types.js';

/**
 * Email Tools Class
 * Implements MCP tools for email campaigns and templates
 */
export class EmailTools {
  constructor(private ghlClient: GHLApiClient) {}

  /**
   * Get all email tool definitions for MCP server
   *
   * The Email Campaign V2 tools (paths under /emails/public/v2/) are DEPRECATED
   * in v3 (superseded by the /emails/locations/{locationId}/... suite). They
   * are tagged `supersededBy: 'v3'` so the registry hides them in v3 mode;
   * they remain available when GHL_API_GENERATION=v2.
   */
  getToolDefinitions(): Tool[] {
    const tools: Tool[] = [
      {
        name: 'get_email_campaigns',
        description: 'Get a list of email campaigns from GoHighLevel.',
        inputSchema: {
          type: 'object',
          properties: {
            status: {
              type: 'string',
              description: 'Filter campaigns by status.',
              enum: ['active', 'pause', 'complete', 'cancelled', 'retry', 'draft', 'resend-scheduled'],
              default: 'active'
            },
            limit: {
              type: 'number',
              description: 'Maximum number of campaigns to return.',
              default: 10
            },
            offset: {
              type: 'number',
              description: 'Number of campaigns to skip for pagination.',
              default: 0
            }
          }
        },
        _meta: {
          labels: {
            category: "email",
            access: "read",
            complexity: "simple"
          }
        }
      },
      {
        name: 'create_email_template',
        description: 'Create a new email template in GoHighLevel.',
        inputSchema: {
          type: 'object',
          properties: {
            title: {
              type: 'string',
              description: 'Title of the new template.'
            },
            html: {
              type: 'string',
              description: 'HTML content of the template.'
            },
            isPlainText: {
              type: 'boolean',
              description: 'Whether the template is plain text.',
              default: false
            },
          },
          required: ['title', 'html']
        },
        _meta: {
          labels: {
            category: "email",
            access: "write",
            complexity: "simple"
          }
        }
      },
      {
        name: 'get_email_templates',
        description: 'Get a list of email templates from GoHighLevel.',
        inputSchema: {
          type: 'object',
          properties: {
            limit: {
              type: 'number',
              description: 'Maximum number of templates to return.',
              default: 10
            },
            offset: {
              type: 'number',
              description: 'Number of templates to skip for pagination.',
              default: 0
            }
          }
        },
        _meta: {
          labels: {
            category: "email",
            access: "read",
            complexity: "simple"
          }
        }
      },
      {
        name: 'update_email_template',
        description: 'Update an existing email template in GoHighLevel.',
        inputSchema: {
          type: 'object',
          properties: {
            templateId: {
              type: 'string',
              description: 'The ID of the template to update.'
            },
            html: {
              type: 'string',
              description: 'The updated HTML content of the template.'
            },
            previewText: {
              type: 'string',
              description: 'The updated preview text for the template.'
            },
          },
          required: ['templateId', 'html']
        },
        _meta: {
          labels: {
            category: "email",
            access: "write",
            complexity: "simple"
          }
        }
      },
      {
        name: 'delete_email_template',
        description: 'Delete an email template from GoHighLevel.',
        inputSchema: {
          type: 'object',
          properties: {
            templateId: {
              type: 'string',
              description: 'The ID of the template to delete.'
            },
          },
          required: ['templateId']
        },
        _meta: {
          labels: {
            category: "email",
            access: "delete",
            complexity: "simple"
          }
        }
      },
      {
        name: 'create_email_campaign_v2',
        description: 'Create an Email Campaign V2 draft using the public 2023-02-21 Email Campaigns V2 API.',
        inputSchema: {
          type: 'object',
          properties: {
            locationId: { type: 'string', description: 'Location ID (uses default if not provided).' },
            body: { type: 'object', description: 'Full request body for the campaign.', additionalProperties: true },
            payload: { type: 'object', description: 'Alias for body.', additionalProperties: true }
          }
        },
        _meta: {
          labels: {
            category: "email",
            access: "write",
            complexity: "simple",
            source: "live-ghl-docs"
          },
          official: {
            method: "POST",
            path: "/emails/public/v2/locations/{locationId}/campaigns/email-campaign"
          }
        }
      },
      {
        name: 'list_email_campaigns_v2',
        description: 'List Email Campaign V2 campaigns for a location.',
        inputSchema: {
          type: 'object',
          properties: {
            locationId: { type: 'string', description: 'Location ID (uses default if not provided).' },
            limit: { type: 'number', description: 'Maximum records to return.' },
            offset: { type: 'number', description: 'Records to skip for pagination.' },
            skip: { type: 'number', description: 'Records to skip for pagination.' },
            query: { type: 'string', description: 'Search query.' },
            status: { type: 'string', description: 'Campaign status filter.' }
          }
        },
        _meta: {
          labels: {
            category: "email",
            access: "read",
            complexity: "simple",
            source: "live-ghl-docs"
          },
          official: {
            method: "GET",
            path: "/emails/public/v2/locations/{locationId}/campaigns/emails"
          }
        }
      },
      {
        name: 'update_email_campaign_v2',
        description: 'Update an Email Campaign V2 draft.',
        inputSchema: {
          type: 'object',
          properties: {
            locationId: { type: 'string', description: 'Location ID (uses default if not provided).' },
            campaignId: { type: 'string', description: 'Email campaign ID.' },
            body: { type: 'object', description: 'Full request body for the update.', additionalProperties: true },
            payload: { type: 'object', description: 'Alias for body.', additionalProperties: true }
          },
          required: ['campaignId']
        },
        _meta: {
          labels: {
            category: "email",
            access: "write",
            complexity: "simple",
            source: "live-ghl-docs"
          },
          official: {
            method: "PATCH",
            path: "/emails/public/v2/locations/{locationId}/campaigns/{campaignId}"
          }
        }
      },
      {
        name: 'delete_email_campaign_v2',
        description: 'Delete an Email Campaign V2 campaign.',
        inputSchema: {
          type: 'object',
          properties: {
            locationId: { type: 'string', description: 'Location ID (uses default if not provided).' },
            campaignId: { type: 'string', description: 'Email campaign ID.' }
          },
          required: ['campaignId']
        },
        _meta: {
          labels: {
            category: "email",
            access: "delete",
            complexity: "simple",
            source: "live-ghl-docs"
          },
          official: {
            method: "DELETE",
            path: "/emails/public/v2/locations/{locationId}/campaigns/{campaignId}"
          }
        }
      },
      {
        name: 'list_workflow_campaigns_v2',
        description: 'List Email Campaigns V2 workflow campaigns for a location.',
        inputSchema: {
          type: 'object',
          properties: {
            locationId: { type: 'string', description: 'Location ID (uses default if not provided).' },
            limit: { type: 'number', description: 'Maximum records to return.' },
            offset: { type: 'number', description: 'Records to skip for pagination.' },
            skip: { type: 'number', description: 'Records to skip for pagination.' },
            query: { type: 'string', description: 'Search query.' },
            status: { type: 'string', description: 'Campaign status filter.' }
          }
        },
        _meta: {
          labels: {
            category: "email",
            access: "read",
            complexity: "simple",
            source: "live-ghl-docs"
          },
          official: {
            method: "GET",
            path: "/emails/public/v2/locations/{locationId}/campaigns/workflows"
          }
        }
      },
      {
        name: 'list_bulk_action_campaigns_v2',
        description: 'List Email Campaigns V2 bulk action campaigns for a location.',
        inputSchema: {
          type: 'object',
          properties: {
            locationId: { type: 'string', description: 'Location ID (uses default if not provided).' },
            limit: { type: 'number', description: 'Maximum records to return.' },
            offset: { type: 'number', description: 'Records to skip for pagination.' },
            skip: { type: 'number', description: 'Records to skip for pagination.' },
            query: { type: 'string', description: 'Search query.' },
            status: { type: 'string', description: 'Campaign status filter.' }
          }
        },
        _meta: {
          labels: {
            category: "email",
            access: "read",
            complexity: "simple",
            source: "live-ghl-docs"
          },
          official: {
            method: "GET",
            path: "/emails/public/v2/locations/{locationId}/campaigns/bulk-actions"
          }
        }
      },
      {
        name: 'schedule_email_campaign_v2',
        description: 'Schedule or start an Email Campaign V2 campaign. The campaign must be in draft, cancelled, or paused status.',
        inputSchema: {
          type: 'object',
          properties: {
            locationId: { type: 'string', description: 'Location ID (uses default if not provided).' },
            campaignId: { type: 'string', description: 'Email campaign ID.' },
            body: { type: 'object', description: 'Full scheduling request body.', additionalProperties: true },
            payload: { type: 'object', description: 'Alias for body.', additionalProperties: true }
          },
          required: ['campaignId']
        },
        _meta: {
          labels: {
            category: "email",
            access: "write",
            complexity: "simple",
            source: "live-ghl-docs"
          },
          official: {
            method: "POST",
            path: "/emails/public/v2/locations/{locationId}/campaigns/{campaignId}/schedule"
          }
        }
      }
    ];

    // Tag the deprecated v2 email campaign tools so the registry hides them
    // in v3 generation mode (GHL_API_GENERATION defaults to v3).
    for (const tool of tools) {
      const path = String((tool as any)._meta?.official?.path || '');
      if (path.startsWith('/emails/public/v2/')) {
        ((tool as any)._meta ??= {}).official ??= {};
        (tool as any)._meta.official.supersededBy = 'v3';
        (tool as any)._meta.official.specTier = 'live-docs';
      }
    }

    // These original email tools target the legacy /emails/schedule and
    // /emails/builder routes. They only exist in the locked v2 spec and must
    // not inherit the global named-v3 header or leak into the v3 surface.
    const legacyEmailRoutes: Record<string, { method: string; path: string }> = {
      get_email_campaigns: { method: 'GET', path: '/emails/schedule' },
      create_email_template: { method: 'POST', path: '/emails/builder' },
      get_email_templates: { method: 'GET', path: '/emails/builder' },
      update_email_template: { method: 'POST', path: '/emails/builder/data' },
      delete_email_template: { method: 'DELETE', path: '/emails/builder/{locationId}/{templateId}' },
    };
    for (const tool of tools) {
      const route = legacyEmailRoutes[tool.name];
      if (!route) continue;
      ((tool as any)._meta ??= {}).official = {
        ...route,
        specTier: 'v2',
        apiGenerations: ['v2'],
        versions: ['2021-07-28'],
        supersededBy: 'v3',
      };
    }
    return tools;
  }

  /**
   * Execute email tool based on tool name and arguments
   */
  async executeTool(name: string, args: any): Promise<any> {
    switch (name) {
      case 'get_email_campaigns':
        return this.getEmailCampaigns(args as MCPGetEmailCampaignsParams);
      case 'create_email_template':
        return this.createEmailTemplate(args as MCPCreateEmailTemplateParams);
      case 'get_email_templates':
        return this.getEmailTemplates(args as MCPGetEmailTemplatesParams);
      case 'update_email_template':
        return this.updateEmailTemplate(args as MCPUpdateEmailTemplateParams);
      case 'delete_email_template':
        return this.deleteEmailTemplate(args as MCPDeleteEmailTemplateParams);
      case 'create_email_campaign_v2':
        return this.createEmailCampaignV2(args);
      case 'list_email_campaigns_v2':
        return this.listEmailCampaignsV2(args);
      case 'update_email_campaign_v2':
        return this.updateEmailCampaignV2(args);
      case 'delete_email_campaign_v2':
        return this.deleteEmailCampaignV2(args);
      case 'list_workflow_campaigns_v2':
        return this.listWorkflowCampaignsV2(args);
      case 'list_bulk_action_campaigns_v2':
        return this.listBulkActionCampaignsV2(args);
      case 'schedule_email_campaign_v2':
        return this.scheduleEmailCampaignV2(args);
      default:
        throw new Error(`Unknown email tool: ${name}`);
    }
  }

  private async getEmailCampaigns(params: MCPGetEmailCampaignsParams): Promise<{ success: boolean; campaigns: GHLEmailCampaign[]; total: number; message: string }> {
    try {
      const response = await this.ghlClient.getEmailCampaigns(params);
      if (!response.success || !response.data) {
        throw new Error(response.error?.message || 'Failed to get email campaigns.');
      }
      return {
        success: true,
        campaigns: response.data.schedules,
        total: response.data.total,
        message: `Successfully retrieved ${response.data.schedules.length} email campaigns.`
      };
    } catch (error) {
      throw new Error(`Failed to get email campaigns: ${error}`);
    }
  }

  private async createEmailTemplate(params: MCPCreateEmailTemplateParams): Promise<{ success: boolean; template: any; message: string }> {
    try {
      const response = await this.ghlClient.createEmailTemplate(params);
      if (!response.success || !response.data) {
        throw new Error(response.error?.message || 'Failed to create email template.');
      }
      return {
        success: true,
        template: response.data,
        message: `Successfully created email template.`
      };
    } catch (error) {
      throw new Error(`Failed to create email template: ${error}`);
    }
  }

  private async getEmailTemplates(params: MCPGetEmailTemplatesParams): Promise<{ success: boolean; templates: GHLEmailTemplate[]; message: string }> {
    try {
      const response = await this.ghlClient.getEmailTemplates(params);
      if (!response.success || !response.data) {
        throw new Error(response.error?.message || 'Failed to get email templates.');
      }
      return {
        success: true,
        templates: response.data,
        message: `Successfully retrieved ${response.data.length} email templates.`
      };
    } catch (error) {
      throw new Error(`Failed to get email templates: ${error}`);
    }
  }

  private async updateEmailTemplate(params: MCPUpdateEmailTemplateParams): Promise<{ success: boolean; message: string }> {
    try {
      const response = await this.ghlClient.updateEmailTemplate(params);
      if (!response.success) {
        throw new Error(response.error?.message || 'Failed to update email template.');
      }
      return {
        success: true,
        message: 'Successfully updated email template.'
      };
    } catch (error) {
      throw new Error(`Failed to update email template: ${error}`);
    }
  }

  private async deleteEmailTemplate(params: MCPDeleteEmailTemplateParams): Promise<{ success: boolean; message: string }> {
    try {
      const response = await this.ghlClient.deleteEmailTemplate(params);
      if (!response.success) {
        throw new Error(response.error?.message || 'Failed to delete email template.');
      }
      return {
        success: true,
        message: 'Successfully deleted email template.'
      };
    } catch (error) {
      throw new Error(`Failed to delete email template: ${error}`);
    }
  }

  private async createEmailCampaignV2(args: Record<string, unknown>): Promise<any> {
    return this.ghlClient.makeRequest(
      'POST',
      `/emails/public/v2/locations/${this.locationId(args)}/campaigns/email-campaign`,
      this.body(args)
    );
  }

  private async listEmailCampaignsV2(args: Record<string, unknown>): Promise<any> {
    const query = this.query(args, ['locationId', 'body', 'payload']);
    const suffix = query ? `?${query}` : '';
    return this.ghlClient.makeRequest(
      'GET',
      `/emails/public/v2/locations/${this.locationId(args)}/campaigns/emails${suffix}`
    );
  }

  private async listWorkflowCampaignsV2(args: Record<string, unknown>): Promise<any> {
    const query = this.query(args, ['locationId', 'body', 'payload']);
    const suffix = query ? `?${query}` : '';
    return this.ghlClient.makeRequest(
      'GET',
      `/emails/public/v2/locations/${this.locationId(args)}/campaigns/workflows${suffix}`
    );
  }

  private async listBulkActionCampaignsV2(args: Record<string, unknown>): Promise<any> {
    const query = this.query(args, ['locationId', 'body', 'payload']);
    const suffix = query ? `?${query}` : '';
    return this.ghlClient.makeRequest(
      'GET',
      `/emails/public/v2/locations/${this.locationId(args)}/campaigns/bulk-actions${suffix}`
    );
  }

  private async updateEmailCampaignV2(args: Record<string, unknown>): Promise<any> {
    return this.ghlClient.makeRequest(
      'PATCH',
      `/emails/public/v2/locations/${this.locationId(args)}/campaigns/${this.campaignId(args)}`,
      this.body(args)
    );
  }

  private async deleteEmailCampaignV2(args: Record<string, unknown>): Promise<any> {
    return this.ghlClient.makeRequest(
      'DELETE',
      `/emails/public/v2/locations/${this.locationId(args)}/campaigns/${this.campaignId(args)}`
    );
  }

  private async scheduleEmailCampaignV2(args: Record<string, unknown>): Promise<any> {
    return this.ghlClient.makeRequest(
      'POST',
      `/emails/public/v2/locations/${this.locationId(args)}/campaigns/${this.campaignId(args)}/schedule`,
      this.body(args)
    );
  }

  private locationId(args: Record<string, unknown>): string {
    const value = args.locationId || this.ghlClient.getConfig().locationId;
    if (!value) throw new Error('locationId is required');
    return encodeURIComponent(String(value));
  }

  private campaignId(args: Record<string, unknown>): string {
    if (!args.campaignId) throw new Error('campaignId is required');
    return encodeURIComponent(String(args.campaignId));
  }

  private body(args: Record<string, unknown>): Record<string, unknown> | undefined {
    const explicit = args.body || args.payload;
    if (explicit && typeof explicit === 'object' && !Array.isArray(explicit)) return explicit as Record<string, unknown>;

    const excluded = new Set(['locationId', 'campaignId', 'body', 'payload']);
    const body: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(args)) {
      if (!excluded.has(key)) body[key] = value;
    }
    return Object.keys(body).length > 0 ? body : undefined;
  }

  private query(args: Record<string, unknown>, excludedKeys: string[]): string {
    const excluded = new Set(excludedKeys);
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(args)) {
      if (excluded.has(key) || value === undefined || value === null || value === '') continue;
      if (Array.isArray(value)) {
        for (const item of value) params.append(key, String(item));
      } else {
        params.append(key, String(value));
      }
    }
    return params.toString();
  }
} 
