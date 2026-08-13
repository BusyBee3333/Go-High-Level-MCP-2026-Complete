import { describe, it, expect } from '@jest/globals';
import { resolveVersion, defaultVersionForGeneration, deriveAccessLevel, assertAccess } from '../../src/clients/version-router.js';

describe('resolveVersion', () => {
  it('prefers v3 in v3 generation mode', () => {
    expect(resolveVersion(['v3'], 'v3', 'v3')).toBe('v3');
    expect(resolveVersion(['v3'], undefined, 'v3')).toBe('v3'); // defaults to v3
  });

  it('keeps the legacy date for modules not bumped to v3 (ad-publishing)', () => {
    // Ad-publishing: 94 of 95 endpoints stay on 2021-07-28 even in v3 mode.
    expect(resolveVersion(['2021-07-28'], 'v3', 'v3')).toBe('2021-07-28');
  });

  it('picks the newest declared date when v3 is not accepted', () => {
    expect(resolveVersion(['2021-04-15', '2021-07-28'], 'v3', 'v3')).toBe('2021-07-28');
  });

  it('never sends v3 in v2/legacy mode', () => {
    expect(resolveVersion(['v3', '2021-07-28'], 'v2', '2023-02-21')).toBe('2021-07-28');
    expect(resolveVersion(['v3'], 'v2', '2023-02-21')).toBe('2023-02-21');
    expect(resolveVersion(['v3'], 'v2', 'v3')).toBe('2023-02-21');
  });

  it('falls back to the default when no versions are declared', () => {
    expect(resolveVersion([], 'v3', 'v3')).toBe('v3');
    expect(resolveVersion(undefined, 'v2', '2023-02-21')).toBe('2023-02-21');
  });

  it('handles undefined fallback gracefully', () => {
    expect(resolveVersion([], undefined, undefined)).toBe('v3');
  });
});

describe('defaultVersionForGeneration', () => {
  it('uses a dated fallback for v2 and the named version for v3', () => {
    expect(defaultVersionForGeneration('v2')).toBe('2023-02-21');
    expect(defaultVersionForGeneration('v3')).toBe('v3');
    expect(defaultVersionForGeneration(undefined)).toBe('v3');
  });
});

describe('deriveAccessLevel', () => {
  it('detects agency-only schemes', () => {
    expect(deriveAccessLevel(['Agency-Access-Only'])).toBe('agency-only');
    expect(deriveAccessLevel(['bearer', 'Agency-Access-Only'])).toBe('agency-only');
    expect(deriveAccessLevel(['Agency-Access'])).toBe('agency-only');
  });

  it('detects location-only schemes', () => {
    expect(deriveAccessLevel(['Location-Access-Only'])).toBe('location-only');
    expect(deriveAccessLevel(['Location-Access'])).toBe('location-only');
    expect(deriveAccessLevel(['Location-Access', 'Location-Access-Only'])).toBe('location-only');
  });

  it('treats everything else as any', () => {
    expect(deriveAccessLevel(['Location-Access-Only', 'Agency-Access'])).toBe('any');
    expect(deriveAccessLevel(['Agency-Access-Only', 'Location-Access'])).toBe('any');
    expect(deriveAccessLevel(['bearer'])).toBe('any');
    expect(deriveAccessLevel([])).toBe('any');
    expect(deriveAccessLevel(undefined)).toBe('any');
  });
});

describe('assertAccess', () => {
  it('passes for any-access endpoints', () => {
    expect(assertAccess('any', 'Location', 'GET /x')).toBe('any');
    expect(assertAccess('any', 'Company', 'GET /x')).toBe('any');
    expect(assertAccess('any', undefined, 'GET /x')).toBe('any');
  });

  it('passes when userType is unset (no preflight possible)', () => {
    expect(assertAccess('agency-only', undefined, 'GET /x')).toBe('agency-only');
    expect(assertAccess('location-only', undefined, 'GET /x')).toBe('location-only');
  });

  it('throws when an agency-only endpoint is called with a Location token', () => {
    expect(() => assertAccess('agency-only', 'Location', 'GET /oauth/installed-locations')).toThrow(/Authenticate the app at the agency/);
  });

  it('throws when a location-only endpoint is called with a Company token', () => {
    expect(() => assertAccess('location-only', 'Company', 'POST /contacts/')).toThrow(/Location/);
  });

  it('passes when the token type matches the requirement', () => {
    expect(assertAccess('agency-only', 'Company', 'GET /oauth/installed-locations')).toBe('agency-only');
    expect(assertAccess('location-only', 'Location', 'POST /contacts/')).toBe('location-only');
  });
});
