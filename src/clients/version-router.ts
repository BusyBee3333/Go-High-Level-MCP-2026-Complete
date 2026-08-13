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
 *   - Conversations is pinned to `2021-04-15` (unchanged in v3).
 *
 * The router picks the right header from an endpoint's declared `versions[]`
 * based on the configured API generation, falling back to the client default.
 */

import type { GHLApiGeneration } from '../types/ghl-types.js';

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
  const fallback = fallbackVersion || 'v3';

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
 *   - `Agency-Access-Only`   → requires an Agency/Company token
 *   - `Location-Access-Only` → requires a Location token
 *   - `Agency-Access` / `Location-Access` / `bearer` → accepts either
 */
export type GHLAccessLevel = 'agency-only' | 'location-only' | 'any';

export function deriveAccessLevel(securitySchemes: string[] | undefined): GHLAccessLevel {
  const schemes = securitySchemes ?? [];
  const hasAgencyOnly = schemes.includes('Agency-Access-Only');
  const hasLocationOnly = schemes.includes('Location-Access-Only');
  // If an endpoint accepts BOTH -Only schemes, it accepts either token type.
  if (hasAgencyOnly && hasLocationOnly) return 'any';
  if (hasAgencyOnly) return 'agency-only';
  if (hasLocationOnly) return 'location-only';
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
        `Use POST /oauth/location-token to mint an Agency token, or set GHL_USER_TYPE correctly.`
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
