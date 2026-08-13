import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { GHLApiGeneration } from '../types/ghl-types.js';
import { resolveVersion } from './version-router.js';

interface OfficialRouteVersion {
  method: string;
  path: string;
  versions: string[];
  apiGenerations: GHLApiGeneration[];
}

interface CompiledOfficialRoute extends OfficialRouteVersion {
  matcher: RegExp;
  specificity: number;
}

const OFFICIAL_ROUTES = readOfficialRoutes()
  .map((route): CompiledOfficialRoute => ({
    ...route,
    matcher: compileTemplate(route.path),
    specificity: route.path
      .split('/')
      .filter(Boolean)
      .reduce((score, segment) => score + (segment.startsWith('{') ? 1 : 10), 0),
  }));

const routeCache = new Map<string, string>();
const MAX_CACHE_ENTRIES = 2048;

/**
 * Resolve the exact locked Version header for a concrete HTTP request.
 *
 * This is the final safety net for hand-written and composed tools. Generated
 * tools still pass their declared version explicitly, but direct axios calls
 * and curated multi-request plans also pass through the same route table.
 */
export function resolveRequestVersion(
  method: string | undefined,
  requestUrl: string | undefined,
  generation: GHLApiGeneration | undefined,
  fallbackVersion: string | undefined,
): string {
  const normalizedMethod = String(method || 'GET').toUpperCase();
  const path = normalizeRequestPath(requestUrl || '/');
  const activeGeneration: GHLApiGeneration = generation === 'v2' ? 'v2' : 'v3';
  const fallback = resolveVersion([], activeGeneration, fallbackVersion);
  const cacheKey = `${activeGeneration} ${normalizedMethod} ${path} ${fallback}`;
  const cached = routeCache.get(cacheKey);
  if (cached) return cached;

  const matches = OFFICIAL_ROUTES.filter((route) =>
    route.method.toUpperCase() === normalizedMethod &&
    route.apiGenerations.includes(activeGeneration) &&
    route.matcher.test(path)
  );

  if (matches.length === 0) {
    cacheResolvedVersion(cacheKey, fallback);
    return fallback;
  }

  const highestSpecificity = Math.max(...matches.map((route) => route.specificity));
  const versions = [...new Set(matches
    .filter((route) => route.specificity === highestSpecificity)
    .flatMap((route) => route.versions))];
  const resolved = resolveVersion(versions, activeGeneration, fallback);
  cacheResolvedVersion(cacheKey, resolved);
  return resolved;
}

function cacheResolvedVersion(key: string, value: string): void {
  if (routeCache.size >= MAX_CACHE_ENTRIES) routeCache.clear();
  routeCache.set(key, value);
}

function readOfficialRoutes(): OfficialRouteVersion[] {
  const candidates = [
    join(__dirname, '..', 'tools', 'official-route-versions.json'),
    join(process.cwd(), 'src', 'tools', 'official-route-versions.json'),
    join(process.cwd(), 'dist', 'tools', 'official-route-versions.json'),
  ];

  for (const candidate of candidates) {
    try {
      return JSON.parse(readFileSync(candidate, 'utf8')) as OfficialRouteVersion[];
    } catch {
      // Try the next source/build/package location.
    }
  }

  throw new Error('Missing generated official route-version data; run npm run scan:ghl-api.');
}

function compileTemplate(template: string): RegExp {
  const path = normalizeRequestPath(template);
  const pattern = path
    .split('/')
    .map((segment) => segment.startsWith('{') && segment.endsWith('}')
      ? '[^/]+'
      : escapeRegExp(segment))
    .join('/');
  return new RegExp(`^${pattern}/?$`);
}

function normalizeRequestPath(value: string): string {
  let path = value;
  try {
    path = new URL(value, 'https://services.leadconnectorhq.com').pathname;
  } catch {
    path = value.split(/[?#]/, 1)[0];
  }
  path = path.replace(/\/+/g, '/');
  if (!path.startsWith('/')) path = `/${path}`;
  return path.length > 1 ? path.replace(/\/$/, '') : path;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
