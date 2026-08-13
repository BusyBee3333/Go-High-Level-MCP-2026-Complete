import { describe, expect, it, jest } from '@jest/globals';
import { OAuthTools } from '../../src/tools/oauth-tools.js';

function makeClient(userType: 'Company' | 'Location' = 'Company') {
  return {
    getConfig: () => ({
      accessToken: 'token',
      baseUrl: 'https://services.leadconnectorhq.com',
      version: 'v3',
      locationId: 'location',
      apiGeneration: 'v3' as const,
      userType,
    }),
    makeRequest: jest.fn(async () => ({ success: true, data: {} })),
  };
}

describe('OAuthTools v3 wire contracts', () => {
  it('uses AIP pagination and every optional installed-location filter', async () => {
    const client = makeClient();
    const tools = new OAuthTools(client as any);

    await tools.handleToolCall('get_installed_locations', {
      appId: 'app',
      companyId: 'company',
      pageSize: 50,
      pageToken: 'next',
      query: 'Acme',
      isInstalled: false,
      restrictToUserLocations: true,
      versionId: 'version',
      onTrial: false,
      planId: 'plan',
      locationId: 'location',
    });

    const [method, path, body, options] = client.makeRequest.mock.calls[0];
    const url = new URL(String(path), 'https://services.leadconnectorhq.com');
    expect(method).toBe('GET');
    expect(Object.fromEntries(url.searchParams)).toEqual({
      appId: 'app', companyId: 'company', pageSize: '50', pageToken: 'next',
      query: 'Acme', isInstalled: 'false', restrictToUserLocations: 'true',
      versionId: 'version', onTrial: 'false', planId: 'plan', locationId: 'location',
    });
    expect(body).toBeUndefined();
    expect(options).toEqual({ version: 'v3' });
  });

  it('sends the location-token body as application/x-www-form-urlencoded', async () => {
    const client = makeClient();
    const tools = new OAuthTools(client as any);

    await tools.handleToolCall('get_location_access_token', {
      companyId: 'company id',
      locationId: 'location/id',
    });

    expect(client.makeRequest).toHaveBeenCalledWith(
      'POST',
      '/oauth/location-token',
      'companyId=company+id&locationId=location%2Fid',
      { version: 'v3', contentType: 'application/x-www-form-urlencoded' }
    );
  });

  it('rejects location tokens with correct agency-token remediation', async () => {
    const tools = new OAuthTools(makeClient('Location') as any);
    await expect(tools.handleToolCall('get_installed_locations', {
      appId: 'app', companyId: 'company',
    })).rejects.toThrow(/Authenticate the app at the agency\/company level/);
  });
});
