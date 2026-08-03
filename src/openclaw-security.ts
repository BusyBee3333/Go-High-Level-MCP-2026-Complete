/**
 * Local network-exposure hardening for the HTTP transports.
 *
 * ADDED BY A DOWNSTREAM MIRROR — see PATCHES.md at the repository root for why
 * this file exists and for the upstream pull request that would retire it.
 *
 * The Model Context Protocol specification is explicit about local servers that
 * speak an HTTP transport:
 *
 *   - they MUST validate the `Origin` header on all incoming connections and
 *     respond 403 Forbidden when it is not allowed, because otherwise a website
 *     the user merely visits can drive the server via DNS rebinding;
 *   - they SHOULD bind to 127.0.0.1 rather than 0.0.0.0;
 *   - they SHOULD require an authorization token.
 *
 * Before this patch the server bound 0.0.0.0 with no way to change it, and a
 * disallowed Origin produced HTTP 500 (an unhandled CORS callback error), not
 * 403. This server holds a CRM private-integration token, so the endpoint IS
 * the credential: anything that can reach the port can drive the CRM without
 * holding any secret of its own.
 *
 * Everything here is additive and defaults to the SAFE behaviour. Existing
 * loopback callers are unaffected: clients that send no `Origin` at all (every
 * non-browser MCP client) are allowed, and the bearer-token gate is inert until
 * a token is configured.
 *
 * Environment:
 *   GHL_MCP_BIND_HOST        interface to bind. Default 127.0.0.1.
 *                            Set 0.0.0.0 only with a deliberate reason.
 *   GHL_MCP_ALLOWED_ORIGINS  comma-separated extra allowed origins. Replaces
 *                            the built-in non-loopback defaults. The literal
 *                            value "none" allows loopback origins only.
 *                            Loopback origins are always allowed.
 *   GHL_MCP_AUTH_TOKEN       when set, every route except /health requires
 *                            `Authorization: Bearer <token>`.
 */

import type { Request, Response, NextFunction, RequestHandler } from 'express';
import { timingSafeEqual } from 'crypto';

/** Upstream's original non-loopback allow-list, preserved so this patch changes no working setup. */
const DEFAULT_REMOTE_ORIGINS = ['https://chatgpt.com', 'https://chat.openai.com'];

const LOOPBACK_ORIGIN = /^https?:\/\/(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$/;

/**
 * Interface to bind. Defaults to loopback: a server reachable from the LAN is a
 * decision, and a decision has to be made explicitly rather than inherited.
 */
export function resolveBindHost(): string {
  const host = (process.env.GHL_MCP_BIND_HOST || '').trim();
  return host.length > 0 ? host : '127.0.0.1';
}

function configuredRemoteOrigins(): string[] {
  const raw = (process.env.GHL_MCP_ALLOWED_ORIGINS || '').trim();
  if (raw.length === 0) return DEFAULT_REMOTE_ORIGINS;
  if (raw.toLowerCase() === 'none') return [];
  return raw.split(',').map((o) => o.trim()).filter((o) => o.length > 0);
}

/**
 * A missing Origin is allowed on purpose. Browsers always send one; MCP clients,
 * curl and the health probes do not. Refusing them would break every legitimate
 * caller while stopping nothing — the attack this defends against is a BROWSER
 * being pointed at the loopback port, and a browser cannot omit the header.
 */
export function isOriginAllowed(origin: string | undefined | null): boolean {
  if (!origin) return true;
  if (LOOPBACK_ORIGIN.test(origin)) return true;
  return configuredRemoteOrigins().includes(origin);
}

/**
 * MUST-level requirement: reject a disallowed Origin with 403.
 *
 * Register this BEFORE the cors() middleware. Upstream's cors callback signalled
 * refusal by calling back with an Error, which express's default handler turns
 * into a 500 — indistinguishable from a server fault, and not what the spec
 * requires a client to be told.
 */
export function originGuard(): RequestHandler {
  return (req: Request, res: Response, next: NextFunction) => {
    const origin = req.headers.origin as string | undefined;
    if (isOriginAllowed(origin)) return next();
    res.status(403).json({
      error: 'Forbidden',
      reason: 'Origin not allowed',
    });
  };
}

function safeEquals(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  return timingSafeEqual(ab, bb);
}

/**
 * Optional bearer-token gate. Inert unless GHL_MCP_AUTH_TOKEN is set, so this
 * cannot break an existing deployment by being merged.
 *
 * /health is exempt: supervisors and liveness probes call it, and it exposes no
 * CRM data.
 */
export function authGuard(): RequestHandler {
  return (req: Request, res: Response, next: NextFunction) => {
    const expected = (process.env.GHL_MCP_AUTH_TOKEN || '').trim();
    if (expected.length === 0) return next();
    if (req.path === '/health') return next();

    const header = (req.headers.authorization || '') as string;
    const prefix = 'Bearer ';
    if (!header.startsWith(prefix) || !safeEquals(header.slice(prefix.length), expected)) {
      res.status(401).json({
        error: 'Unauthorized',
        reason: 'A valid Authorization: Bearer token is required',
      });
      return;
    }
    return next();
  };
}

/** One line for the startup banner, so an operator can see what was actually bound. */
export function describeBinding(host: string, port: number): string {
  const exposure =
    host === '127.0.0.1' || host === 'localhost' || host === '::1'
      ? 'loopback only'
      : `REACHABLE ON ${host} — every interface this resolves to`;
  const auth = (process.env.GHL_MCP_AUTH_TOKEN || '').trim().length > 0
    ? 'bearer token required'
    : 'no bearer token configured';
  return `bind=${host}:${port} (${exposure}; ${auth})`;
}
