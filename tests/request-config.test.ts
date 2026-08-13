import { describe, expect, it } from '@jest/globals';
import { createPerRequestConfig } from '../src/request-config.js';

const base = {
  accessToken: 'server-token',
  baseUrl: 'https://services.leadconnectorhq.com',
  version: 'v3',
  locationId: 'server-location',
  apiGeneration: 'v3' as const,
  userType: 'Company' as const,
};

describe('createPerRequestConfig', () => {
  it('does not inherit the server token userType for an override token', () => {
    expect(createPerRequestConfig(base, 'request-token', 'request-location', undefined)).toEqual({
      ...base,
      accessToken: 'request-token',
      locationId: 'request-location',
      userType: undefined,
    });
  });

  it.each(['Location', 'Company'] as const)('accepts a declared %s token type', (userType) => {
    expect(createPerRequestConfig(base, 'request-token', 'request-location', userType).userType).toBe(userType);
  });

  it('ignores invalid user type headers', () => {
    expect(createPerRequestConfig(base, 'request-token', 'request-location', 'Agency').userType).toBeUndefined();
  });
});
