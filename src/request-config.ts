import type { GHLConfig, GHLUserType } from './types/ghl-types.js';

/**
 * Builds configuration for an HTTP caller-provided token.
 *
 * A replacement token is independent from the server's configured token, so
 * its preflight scope must never be inherited. Callers may opt into preflight
 * by supplying x-ghl-user-type for that exact token.
 */
export function createPerRequestConfig(
  baseConfig: GHLConfig,
  accessToken: string,
  locationId: string,
  requestedUserType: unknown,
): GHLConfig {
  const userType: GHLUserType | undefined = requestedUserType === 'Company' || requestedUserType === 'Location'
    ? requestedUserType
    : undefined;

  return {
    ...baseConfig,
    accessToken,
    locationId,
    userType,
  };
}
