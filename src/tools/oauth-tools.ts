/**
 * GoHighLevel OAuth/Auth Tools
 *
 * Only exposes endpoints that actually exist in the official GHL OAuth specs
 * (apps/v3/oauth-v3.json). The v3 OAuth surface is intentionally small:
 *   - POST /oauth/token              (token exchange — handled by the OAuth flow, not a tool)
 *   - POST /oauth/location-token     (mint a Location token from an Agency token)
 *   - GET  /oauth/installed-locations (locations where an app is installed)
 *
 * Earlier versions of this file exposed additional tools (/oauth/apps,
 * /oauth/api-keys, /integrations/connected, GET /oauth/location-token) that
 * do NOT exist in any published GHL spec and return 404 against the live API.
 * They were removed after live verification on 2026-08-07.
 */

import { GHLApiClient } from '../clients/ghl-api-client.js';
import { assertAccess } from '../clients/version-router.js';

export class OAuthTools {
  constructor(private ghlClient: GHLApiClient) {}

  getToolDefinitions() {
    return [
      {
        name: 'get_installed_locations',
        description: 'Get all locations where an OAuth/Marketplace app is installed. Agency endpoint (requires a Company token).',
        inputSchema: {
          type: 'object',
          properties: {
            appId: { type: 'string', description: 'OAuth/Marketplace App ID' },
            companyId: { type: 'string', description: 'Company/Agency ID' },
            pageSize: { type: 'number', minimum: 1, maximum: 100, description: 'Maximum items per page (1-100)' },
            pageToken: { type: 'string', description: 'Opaque next-page token returned by the previous response' },
            query: { type: 'string', description: 'Search query' },
            isInstalled: { type: 'boolean', description: 'Filter by installation status' },
            restrictToUserLocations: { type: 'boolean', description: 'Restrict results to locations accessible by the current user' },
            versionId: { type: 'string', description: 'Marketplace app version ID' },
            onTrial: { type: 'boolean', description: 'Filter locations by trial status' },
            planId: { type: 'string', description: 'Filter by Marketplace plan ID' },
            locationId: { type: 'string', description: 'Filter by a specific location ID' }
          },
          required: ['appId', 'companyId']
        },
        _meta: {
          labels: { category: 'oauth', access: 'read', complexity: 'simple' },
          official: {
            method: 'GET',
            path: '/oauth/installed-locations',
            operationId: 'get-installed-location',
            specTier: 'v3',
            apiGenerations: ['v3'],
            versions: ['v3'],
            scopes: ['oauth.readonly'],
            securitySchemes: ['Agency-Access-Only']
          }
        }
      },
      {
        name: 'get_location_access_token',
        description: 'Mint a Location-scoped access token from an Agency token (POST /oauth/location-token). Agency endpoint.',
        inputSchema: {
          type: 'object',
          properties: {
            companyId: { type: 'string', description: 'Company/Agency ID' },
            locationId: { type: 'string', description: 'Target Location ID' }
          },
          required: ['companyId', 'locationId']
        },
        _meta: {
          labels: { category: 'oauth', access: 'write', complexity: 'simple' },
          official: {
            method: 'POST',
            path: '/oauth/location-token',
            operationId: 'get-location-access-token',
            specTier: 'v3',
            apiGenerations: ['v3'],
            versions: ['v3'],
            scopes: ['oauth.write'],
            securitySchemes: ['Agency-Access-Only']
          }
        }
      }
    ];
  }

  async handleToolCall(toolName: string, args: Record<string, unknown>): Promise<unknown> {
    const config = this.ghlClient.getConfig();

    switch (toolName) {
      case 'get_installed_locations': {
        // Agency endpoint: requires a Company/Agency token.
        assertAccess('agency-only', config.userType, 'GET /oauth/installed-locations');
        const params = new URLSearchParams();
        params.append('appId', String(args.appId));
        params.append('companyId', String(args.companyId));
        if (args.pageSize !== undefined) params.append('pageSize', String(args.pageSize));
        if (args.pageToken) params.append('pageToken', String(args.pageToken));
        if (args.query) params.append('query', String(args.query));
        if (args.isInstalled !== undefined) params.append('isInstalled', String(args.isInstalled));
        if (args.restrictToUserLocations !== undefined) params.append('restrictToUserLocations', String(args.restrictToUserLocations));
        if (args.versionId) params.append('versionId', String(args.versionId));
        if (args.onTrial !== undefined) params.append('onTrial', String(args.onTrial));
        if (args.planId) params.append('planId', String(args.planId));
        if (args.locationId) params.append('locationId', String(args.locationId));
        // v3 (2026-06-11): kebab-case path; old camelCase /oauth/installedLocations was removed.
        return this.ghlClient.makeRequest('GET', `/oauth/installed-locations?${params.toString()}`, undefined, { version: 'v3' });
      }
      case 'get_location_access_token': {
        // Agency endpoint: mints a Location token from an Agency token.
        assertAccess('agency-only', config.userType, 'POST /oauth/location-token');
        // v3 (2026-06-11): kebab-case path; old POST /oauth/locationToken was removed.
        const form = new URLSearchParams({
          companyId: String(args.companyId),
          locationId: String(args.locationId)
        });
        return this.ghlClient.makeRequest('POST', '/oauth/location-token', form.toString(), {
          version: 'v3',
          contentType: 'application/x-www-form-urlencoded'
        });
      }
      default:
        throw new Error(`Unknown tool: ${toolName}`);
    }
  }
}
