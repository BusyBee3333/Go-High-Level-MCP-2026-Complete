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
            skip: { type: 'number', description: 'Records to skip for pagination' },
            limit: { type: 'number', description: 'Maximum results to return' },
            query: { type: 'string', description: 'Search query' },
            isInstalled: { type: 'boolean', description: 'Filter by installation status' }
          },
          required: ['appId', 'companyId']
        },
        _meta: {
          labels: { category: 'oauth', access: 'read', complexity: 'simple' },
          official: { method: 'GET', path: '/oauth/installed-locations', specTier: 'v3' }
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
          official: { method: 'POST', path: '/oauth/location-token', specTier: 'v3' }
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
        if (args.skip) params.append('skip', String(args.skip));
        if (args.limit) params.append('limit', String(args.limit));
        if (args.query) params.append('query', String(args.query));
        if (args.isInstalled !== undefined) params.append('isInstalled', String(args.isInstalled));
        // v3 (2026-06-11): kebab-case path; old camelCase /oauth/installedLocations was removed.
        return this.ghlClient.makeRequest('GET', `/oauth/installed-locations?${params.toString()}`, undefined, { version: 'v3' });
      }
      case 'get_location_access_token': {
        // Agency endpoint: mints a Location token from an Agency token.
        assertAccess('agency-only', config.userType, 'POST /oauth/location-token');
        // v3 (2026-06-11): kebab-case path; old POST /oauth/locationToken was removed.
        return this.ghlClient.makeRequest('POST', `/oauth/location-token`, {
          companyId: args.companyId,
          locationId: args.locationId
        }, { version: 'v3' });
      }
      default:
        throw new Error(`Unknown tool: ${toolName}`);
    }
  }
}
