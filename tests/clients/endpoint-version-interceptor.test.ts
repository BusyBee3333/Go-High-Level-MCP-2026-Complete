import { describe, expect, it, jest } from '@jest/globals';

jest.mock('axios', () => {
  const instance = {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    patch: jest.fn(),
    delete: jest.fn(),
    defaults: { headers: {} },
    interceptors: {
      request: { use: jest.fn() },
      response: { use: jest.fn() },
    },
  };
  return {
    __esModule: true,
    default: { create: jest.fn(() => instance) },
  };
});

import axios from 'axios';
import { GHLApiClient } from '../../src/clients/ghl-api-client.js';

describe('GHLApiClient locked endpoint-version interceptor', () => {
  it.each([
    ['v3', 'v3'],
    ['v2', '2021-04-15'],
  ] as const)('captures Calendar requests as %s with %s', (apiGeneration, expectedVersion) => {
    const client = new GHLApiClient({
      accessToken: 'token',
      baseUrl: 'https://services.leadconnectorhq.com',
      version: 'v3',
      locationId: 'location',
      apiGeneration,
    });
    expect(client).toBeDefined();

    const instance = (axios.create as jest.Mock).mock.results.at(-1)?.value;
    const interceptor = instance.interceptors.request.use.mock.calls.at(-1)[0];
    const set = jest.fn();
    interceptor({ method: 'get', url: '/calendars/events?locationId=location', headers: { set } });

    expect(set).toHaveBeenCalledWith('Version', expectedVersion);
  });
});
