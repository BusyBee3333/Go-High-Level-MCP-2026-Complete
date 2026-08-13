import { describe, expect, it } from '@jest/globals';
import { resolveRequestVersion } from '../../src/clients/endpoint-version-resolver.js';

describe('resolveRequestVersion', () => {
  it('routes the same Calendar path to its exact generation-specific version', () => {
    expect(resolveRequestVersion('GET', '/calendars/events?locationId=loc', 'v3', 'v3')).toBe('v3');
    expect(resolveRequestVersion('GET', '/calendars/events?locationId=loc', 'v2', 'v3')).toBe('2021-04-15');
  });

  it('matches concrete path parameters and prefers a static route over a dynamic sibling', () => {
    expect(resolveRequestVersion('GET', '/contacts/search/duplicate?locationId=loc', 'v2', 'v3'))
      .toBe('2021-07-28');
    expect(resolveRequestVersion('GET', '/contacts/contact-123', 'v3', 'v3')).toBe('v3');
  });

  it('keeps a locked dated version for a legacy route that has no named-v3 declaration', () => {
    expect(resolveRequestVersion('GET', '/emails/schedule?locationId=loc', 'v2', 'v3'))
      .toBe('2021-07-28');
  });

  it('uses the normalized generation fallback only for unmatched local routes', () => {
    expect(resolveRequestVersion('POST', '/private/local-only-route', 'v3', 'v3')).toBe('v3');
    expect(resolveRequestVersion('POST', '/private/local-only-route', 'v2', 'v3')).toBe('2023-02-21');
  });
});
