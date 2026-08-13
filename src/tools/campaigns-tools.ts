/**
 * GoHighLevel Campaigns Tools
 * Tools for managing email and SMS campaigns
 */

import type { GHLToolClient } from './ghl-tool-client.js';
import { resolveRequestVersion } from '../clients/endpoint-version-resolver.js';

export class CampaignsTools {
  constructor(private ghlClient: GHLToolClient) {}

  getToolDefinitions() {
    return [
      // Campaign Management
      {
        name: 'get_campaigns',
        description: 'Get all legacy campaigns (email/SMS) for a location from the official generation-aware Campaigns endpoint.',
        inputSchema: {
          type: 'object',
          properties: {
            locationId: { type: 'string', description: 'Location ID' },
            status: { type: 'string', enum: ['draft', 'scheduled', 'running', 'completed', 'paused'], description: 'Filter by campaign status' },
          }
        },
        _meta: {
          labels: {
            category: "campaigns",
            access: "read",
            complexity: "simple"
          },
          official: {
            method: 'GET',
            path: '/campaigns/',
            versions: ['v3', '2021-07-28'],
            apiGenerations: ['v2', 'v3']
          },
        }
      },
      {
        name: 'get_campaign',
        description: 'Get a specific campaign by ID',
        inputSchema: {
          type: 'object',
          properties: {
            campaignId: { type: 'string', description: 'Campaign ID' },
            locationId: { type: 'string', description: 'Location ID' },
          },
          required: ['campaignId']
        },
        _meta: {
          labels: {
            category: "campaigns",
            access: "read",
            complexity: "simple"
          }
        }
      },
      {
        name: 'create_campaign',
        description: 'Create a new campaign',
        inputSchema: {
          type: 'object',
          properties: {
            locationId: { type: 'string', description: 'Location ID' },
            name: { type: 'string', description: 'Campaign name' },
            type: { type: 'string', enum: ['email', 'sms', 'voicemail'], description: 'Campaign type' },
            status: { type: 'string', enum: ['draft', 'scheduled'], description: 'Initial status' },
          },
          required: ['name', 'type']
        },
        _meta: {
          labels: {
            category: "campaigns",
            access: "write",
            complexity: "simple"
          }
        }
      },
      {
        name: 'update_campaign',
        description: 'Update a campaign',
        inputSchema: {
          type: 'object',
          properties: {
            campaignId: { type: 'string', description: 'Campaign ID' },
            locationId: { type: 'string', description: 'Location ID' },
            name: { type: 'string', description: 'Campaign name' },
            status: { type: 'string', enum: ['draft', 'scheduled', 'paused'], description: 'Campaign status' },
          },
          required: ['campaignId']
        },
        _meta: {
          labels: {
            category: "campaigns",
            access: "write",
            complexity: "simple"
          }
        }
      },
      {
        name: 'delete_campaign',
        description: 'Delete a campaign',
        inputSchema: {
          type: 'object',
          properties: {
            campaignId: { type: 'string', description: 'Campaign ID' },
            locationId: { type: 'string', description: 'Location ID' },
          },
          required: ['campaignId']
        },
        _meta: {
          labels: {
            category: "campaigns",
            access: "delete",
            complexity: "simple"
          }
        }
      },

      // Campaign Actions
      {
        name: 'start_campaign',
        description: 'Start/launch a campaign',
        inputSchema: {
          type: 'object',
          properties: {
            campaignId: { type: 'string', description: 'Campaign ID' },
            locationId: { type: 'string', description: 'Location ID' },
          },
          required: ['campaignId']
        },
        _meta: {
          labels: {
            category: "campaigns",
            access: "read",
            complexity: "simple"
          }
        }
      },
      {
        name: 'pause_campaign',
        description: 'Pause a running campaign',
        inputSchema: {
          type: 'object',
          properties: {
            campaignId: { type: 'string', description: 'Campaign ID' },
            locationId: { type: 'string', description: 'Location ID' },
          },
          required: ['campaignId']
        },
        _meta: {
          labels: {
            category: "campaigns",
            access: "read",
            complexity: "simple"
          }
        }
      },
      {
        name: 'resume_campaign',
        description: 'Resume a paused campaign',
        inputSchema: {
          type: 'object',
          properties: {
            campaignId: { type: 'string', description: 'Campaign ID' },
            locationId: { type: 'string', description: 'Location ID' },
          },
          required: ['campaignId']
        },
        _meta: {
          labels: {
            category: "campaigns",
            access: "read",
            complexity: "simple"
          }
        }
      },

      // Campaign Stats
      {
        name: 'get_campaign_stats',
        description: 'Get statistics for a campaign (opens, clicks, bounces, etc.)',
        inputSchema: {
          type: 'object',
          properties: {
            campaignId: { type: 'string', description: 'Campaign ID' },
            locationId: { type: 'string', description: 'Location ID' },
          },
          required: ['campaignId']
        },
        _meta: {
          labels: {
            category: "campaigns",
            access: "read",
            complexity: "simple"
          }
        }
      },
      {
        name: 'get_campaign_recipients',
        description: 'Get all recipients of a campaign',
        inputSchema: {
          type: 'object',
          properties: {
            campaignId: { type: 'string', description: 'Campaign ID' },
            locationId: { type: 'string', description: 'Location ID' },
            status: { type: 'string', enum: ['sent', 'delivered', 'opened', 'clicked', 'bounced', 'unsubscribed'], description: 'Filter by recipient status' },
            limit: { type: 'number', description: 'Max results' },
            offset: { type: 'number', description: 'Pagination offset' },
          },
          required: ['campaignId']
        },
        _meta: {
          labels: {
            category: "campaigns",
            access: "read",
            complexity: "simple"
          }
        }
      },

      // Scheduled Messages
      {
        name: 'get_scheduled_messages',
        description: 'Get all scheduled messages in campaigns',
        inputSchema: {
          type: 'object',
          properties: {
            locationId: { type: 'string', description: 'Location ID' },
            contactId: { type: 'string', description: 'Filter by contact ID' },
            campaignId: { type: 'string', description: 'Filter by campaign ID' }
          }
        },
        _meta: {
          labels: {
            category: "campaigns",
            access: "read",
            complexity: "simple"
          }
        }
      },
      {
        name: 'cancel_scheduled_campaign_message',
        description: 'Cancel a scheduled campaign message for a contact',
        inputSchema: {
          type: 'object',
          properties: {
            messageId: { type: 'string', description: 'Scheduled message ID' },
            locationId: { type: 'string', description: 'Location ID' },
          },
          required: ['messageId']
        },
        _meta: {
          labels: {
            category: "campaigns",
            access: "write",
            complexity: "simple"
          }
        }
      }
    ];
  }

  async handleToolCall(toolName: string, args: Record<string, unknown>): Promise<unknown> {
    const config = this.ghlClient.getConfig();
    const locationId = (args.locationId as string) || config.locationId;

    switch (toolName) {
      case 'get_campaigns': {
        const params = new URLSearchParams();
        params.append('locationId', locationId);
        if (args.status) params.append('status', String(args.status));
        return this.ghlClient.makeRequest(
          'GET',
          `/campaigns/?${params.toString()}`,
          undefined,
          this.requestOptions('GET', `/campaigns/?${params.toString()}`),
        );
      }
      case 'get_campaign': {
        return this.ghlClient.makeRequest('GET', `/campaigns/${args.campaignId}?locationId=${locationId}`);
      }
      case 'create_campaign': {
        return this.ghlClient.makeRequest('POST', `/campaigns/`, {
          locationId,
          name: args.name,
          type: args.type,
          status: args.status || 'draft'
        });
      }
      case 'update_campaign': {
        const body: Record<string, unknown> = { locationId };
        if (args.name) body.name = args.name;
        if (args.status) body.status = args.status;
        return this.ghlClient.makeRequest('PUT', `/campaigns/${args.campaignId}`, body);
      }
      case 'delete_campaign': {
        return this.ghlClient.makeRequest('DELETE', `/campaigns/${args.campaignId}?locationId=${locationId}`);
      }
      case 'start_campaign': {
        return this.ghlClient.makeRequest('POST', `/campaigns/${args.campaignId}/start`, { locationId });
      }
      case 'pause_campaign': {
        return this.ghlClient.makeRequest('POST', `/campaigns/${args.campaignId}/pause`, { locationId });
      }
      case 'resume_campaign': {
        return this.ghlClient.makeRequest('POST', `/campaigns/${args.campaignId}/resume`, { locationId });
      }
      case 'get_campaign_stats': {
        return this.ghlClient.makeRequest('GET', `/campaigns/${args.campaignId}/stats?locationId=${locationId}`);
      }
      case 'get_campaign_recipients': {
        const params = new URLSearchParams();
        params.append('locationId', locationId);
        if (args.status) params.append('status', String(args.status));
        if (args.limit) params.append('limit', String(args.limit));
        if (args.offset) params.append('offset', String(args.offset));
        return this.ghlClient.makeRequest('GET', `/campaigns/${args.campaignId}/recipients?${params.toString()}`);
      }
      case 'get_scheduled_messages': {
        const params = new URLSearchParams();
        params.append('locationId', locationId);
        if (args.contactId) params.append('contactId', String(args.contactId));
        if (args.campaignId) params.append('campaignId', String(args.campaignId));
        return this.ghlClient.makeRequest('GET', `/campaigns/scheduled-messages?${params.toString()}`);
      }
      case 'cancel_scheduled_campaign_message': {
        return this.ghlClient.makeRequest('DELETE', `/campaigns/scheduled-messages/${args.messageId}?locationId=${locationId}`);
      }

      default:
        throw new Error(`Unknown tool: ${toolName}`);
    }
  }

  private requestOptions(method: string, path: string): { version: string } {
    const config = this.ghlClient.getConfig();
    return {
      version: resolveRequestVersion(method, path, config.apiGeneration, config.version),
    };
  }
}
