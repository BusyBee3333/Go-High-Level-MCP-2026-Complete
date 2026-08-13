/**
 * Per-endpoint GHL Version header router.
 *
 * GHL's v3 release (2026-06-11) is NOT a single global version bump. Each
 * module/version-spec declares which Version header values it accepts, and
 * not every module was bumped to v3:
 *
 *   - Contacts, Opportunities, OAuth, Emails, Brand Boards, SaaS, Email-ISV
 *     use the named value `v3`.
 *   - Ad-publishing (94 of 95 endpoints) still requires `2021-07-28`.
 *   - Core Conversation/message endpoints use `v3` in the current generation
 *     and `2021-04-15` in legacy mode; remaining Conversation endpoints route
 *     from the exact versions declared by their specs.
 *
 * The router picks the right header from an endpoint's declared `versions[]`
 * based on the configured API generation, falling back to the client default.
 */

import type { GHLApiGeneration } from '../types/ghl-types.js';

/** The global fallback to use when an endpoint does not declare a version. */
export function defaultVersionForGeneration(generation: GHLApiGeneration | undefined): string {
  return generation === 'v2' ? '2023-02-21' : 'v3';
}

/**
 * Resolve the Version header value for a single request.
 *
 * @param endpointVersions  The values the endpoint's spec declares it accepts
 *                          (e.g. `['v3']`, `['2021-07-28']`, or `['2021-04-15', '2021-07-28']`).
 * @param generation        The client's API generation mode (`v3` default, `v2` legacy).
 * @param fallbackVersion   The client's default Version header (from GHLConfig.version).
 */
export function resolveVersion(
  endpointVersions: string[] | undefined,
  generation: GHLApiGeneration | undefined,
  fallbackVersion: string | undefined
): string {
  const versions = endpointVersions ?? [];
  const gen: GHLApiGeneration = generation ?? 'v3';
  const configuredFallback = fallbackVersion || defaultVersionForGeneration(gen);
  const fallback = gen === 'v2' && configuredFallback === 'v3'
    ? defaultVersionForGeneration('v2')
    : configuredFallback;

  if (versions.length === 0) return fallback;

  if (gen === 'v3') {
    // Prefer the named v3 value if the endpoint accepts it.
    if (versions.includes('v3')) return 'v3';
    // Otherwise use the newest date the endpoint explicitly allows, so
    // modules that haven't been bumped (ad-publishing) keep their real version.
    const newestDate = newestDateVersion(versions);
    if (newestDate) return newestDate;
    // Endpoint only declares v3 but we somehow didn't match above — send v3.
    if (versions.length === 1) return versions[0];
    return fallback;
  }

  // v2/legacy mode: never send `v3`; use the newest declared date.
  const legacyDates = versions.filter((v) => v !== 'v3');
  const newestDate = newestDateVersion(legacyDates);
  if (newestDate) return newestDate;
  if (legacyDates.length === 1) return legacyDates[0];
  // A v3-only declaration has no legal legacy value. The caller should hide
  // that endpoint in v2 mode; retain a dated fallback as a final fail-safe so
  // compatibility mode can never accidentally emit the named `v3` header.
  return fallback;
}

/**
 * Returns the newest YYYY-MM-DD style string from the list, or undefined.
 * Date strings sort lexically correctly because YYYY-MM-DD is fixed-width.
 */
function newestDateVersion(versions: string[]): string | undefined {
  const dates = versions.filter((v) => /^\d{4}-\d{2}-\d{2}$/.test(v));
  if (dates.length === 0) return undefined;
  return dates.sort().at(-1);
}

/**
 * Derive an access level from the security scheme names an endpoint requires.
 * Mirrors GHL v3's security components:
 *   - agency-family only (`Agency-Access[-Only]`)     → Agency/Company token
 *   - location-family only (`Location-Access[-Only]`) → Location token
 *   - both families (flattened OpenAPI alternatives)  → either token
 *   - `bearer` or no scoped scheme                     → either token
 */
export type GHLAccessLevel = 'agency-only' | 'location-only' | 'any';

export function deriveAccessLevel(securitySchemes: string[] | undefined): GHLAccessLevel {
  const schemes = securitySchemes ?? [];
  const hasAgency = schemes.includes('Agency-Access-Only') || schemes.includes('Agency-Access');
  const hasLocation = schemes.includes('Location-Access-Only') || schemes.includes('Location-Access');
  // Scanner metadata flattens OpenAPI security alternatives. Seeing both
  // families therefore means the endpoint accepts either token type.
  if (hasAgency && hasLocation) return 'any';
  if (hasAgency) return 'agency-only';
  if (hasLocation) return 'location-only';
  return 'any';
}

/**
 * Preflight check: does the configured token type satisfy the endpoint's
 * required access level? Throws a clear, agent-friendly error if not.
 *
 * Returns the access level when OK (useful for logging).
 */
export function assertAccess(
  accessLevel: GHLAccessLevel,
  userType: 'Location' | 'Company' | undefined,
  endpointLabel: string
): GHLAccessLevel {
  if (accessLevel === 'any' || !userType) return accessLevel;

  if (accessLevel === 'agency-only' && userType !== 'Company') {
    throw new Error(
      `Endpoint ${endpointLabel} requires an Agency/Company access token, ` +
        `but the configured token is Location-scoped (userType="${userType}"). ` +
        `Authenticate the app at the agency/company level to obtain a Company token, ` +
        `or set GHL_USER_TYPE correctly.`
    );
  }
  if (accessLevel === 'location-only' && userType !== 'Location') {
    throw new Error(
      `Endpoint ${endpointLabel} requires a Location access token, ` +
        `but the configured token is Agency/Company-scoped (userType="${userType}"). ` +
        `Mint a Location token via POST /oauth/location-token, or set GHL_USER_TYPE correctly.`
    );
  }
  return accessLevel;
}
