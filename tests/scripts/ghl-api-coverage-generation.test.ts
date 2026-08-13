import { describe, it, expect } from '@jest/globals';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const repoRoot = join(__dirname, '..', '..');

describe('GHL API coverage generation', () => {
  it('hardens the official docs checkout and carries live-docs supplemental endpoints', () => {
    const source = readFileSync(join(repoRoot, 'scripts', 'scan-ghl-api-coverage.mjs'), 'utf8');

    expect(source).toContain('https://github.com/GoHighLevel/highlevel-api-docs.git');
    expect(source).toContain('isExpectedDocsRepo');
    expect(source).toContain('normalizeGitUrl');
    expect(source).toContain('rmSync');
    expect(source).toContain('legacyEmailV2SupplementalEndpoints');
    expect(source).toContain('create-email-campaign-v-2');
    expect(source).toContain('create-email-template-v-2');
    expect(source).toContain('get-campaign-stats-under-campaigns-v-2');
  });

  it('reports the live-docs supplemental endpoints (Email V2 legacy + v3 live-docs additions)', () => {
    const coverage = JSON.parse(readFileSync(join(repoRoot, 'docs', 'ghl-api-coverage.json'), 'utf8'));
    const supplemental = coverage.official.endpoints.filter((endpoint: any) => endpoint.sourceFile?.startsWith('live-docs:'));

    // The Email Campaign V2 supplemental endpoints are retained only for the
    // explicitly requested v2 compatibility surface.
    const emailV2 = supplemental.filter((e: any) => e.path.startsWith('/emails/public/v2/'));
    expect(emailV2).toHaveLength(14);
    expect(emailV2.every((endpoint: any) =>
      endpoint.specTier === 'v2'
      && endpoint.deprecated === true
      && endpoint.supersededByV3 === true
      && endpoint.versions?.length === 1
      && endpoint.versions[0] === '2023-02-21'
    )).toBe(true);
    expect(new Set(emailV2.map((endpoint: any) => `${endpoint.method} ${endpoint.path}`))).toEqual(new Set([
      'POST /emails/public/v2/locations/{locationId}/campaigns/email-campaign',
      'GET /emails/public/v2/locations/{locationId}/campaigns/emails',
      'PATCH /emails/public/v2/locations/{locationId}/campaigns/{campaignId}',
      'DELETE /emails/public/v2/locations/{locationId}/campaigns/{campaignId}',
      'GET /emails/public/v2/locations/{locationId}/campaigns/workflows',
      'GET /emails/public/v2/locations/{locationId}/campaigns/bulk-actions',
      'POST /emails/public/v2/locations/{locationId}/campaigns/{campaignId}/schedule',
      'POST /emails/public/v2/locations/{locationId}/templates',
      'GET /emails/public/v2/locations/{locationId}/templates',
      'POST /emails/public/v2/locations/{locationId}/templates/import',
      'POST /emails/public/v2/locations/{locationId}/templates/folders',
      'DELETE /emails/public/v2/locations/{locationId}/templates/{templateId}',
      'PATCH /emails/public/v2/locations/{locationId}/templates/{templateId}',
      'GET /emails/public/v2/locations/{locationId}/campaigns/stats/{source}/{sourceId}',
    ]));

    // v3 live-docs additions (not yet in the OpenAPI spec files): opportunities
    // pipelines CRUD (2026-06-26). /saas/allow-attach-rebilling is already in
    // apps/v3/saas-v3.json so it is not a live-docs supplemental entry.
    const v3LiveDocs = supplemental.filter((e: any) => e.versions?.includes('v3'));
    expect(v3LiveDocs.length).toBeGreaterThanOrEqual(4);
    const v3Paths = new Set(v3LiveDocs.map((e: any) => `${e.method} ${e.path}`));
    expect(v3Paths.has('POST /opportunities/pipelines/')).toBe(true);
    expect(v3Paths.has('DELETE /opportunities/pipelines/{pipelineId}')).toBe(true);
  });

  it('keeps the API source lock consistent with generated coverage', () => {
    const coverage = JSON.parse(readFileSync(join(repoRoot, 'docs', 'ghl-api-coverage.json'), 'utf8'));
    const lock = JSON.parse(readFileSync(join(repoRoot, 'docs', 'api-sources.lock.json'), 'utf8'));
    const supplemental = coverage.official.endpoints.filter((endpoint: any) => endpoint.sourceFile?.startsWith('live-docs:'));

    // v3-aware lock: schemaVersion 2, primary version is the named "v3".
    expect(lock.schemaVersion).toBe(2);
    expect(lock.primaryApiVersion).toBe('v3');
    expect(lock.apiGenerationDefault).toBe('v3');
    expect(lock.officialDocs.commit).toBe(coverage.official.commit);
    expect(lock.officialDocs.expectedEndpointReferences).toBe(coverage.official.endpoints.length);
    expect(lock.liveDocsSupplemental.expectedEndpointReferences).toBe(supplemental.length);
    expect(lock.verifiedDate).toBe('2026-08-12');
    expect(lock.coverageSurfaces).toEqual({
      currentV3: {
        expectedUniqueEndpoints: coverage.comparison.currentV3.officialUniqueCount,
        expectedCoveredEndpoints: coverage.comparison.currentV3.coveredCount,
      },
      legacyV2: {
        expectedUniqueEndpoints: coverage.comparison.v2Compatibility.officialUniqueCount,
        expectedCoveredEndpoints: coverage.comparison.v2Compatibility.coveredCount,
      },
      dualGenerationUnion: {
        expectedUniqueEndpoints: coverage.comparison.dualGeneration.officialUniqueCount,
        expectedCoveredEndpoints: coverage.comparison.dualGeneration.coveredCount,
      },
    });
    expect(lock.acceptance).toMatchObject({
      expectedMissingOfficialEndpoints: 0,
      expectedCoveragePercent: 100,
    });
  });

  it('captures v3 and v2 spec tiers alongside access levels from security schemes', () => {
    const endpoints = JSON.parse(readFileSync(join(repoRoot, 'src', 'tools', 'official-spec-endpoints.json'), 'utf8'));

    // v3 spec tier endpoints are present and carry the v3 version.
    const v3Endpoints = endpoints.filter((e: any) => e.specTier === 'v3');
    expect(v3Endpoints.length).toBeGreaterThan(0);

    // Ad-publishing endpoints keep their legacy 2021-07-28 version even in the v3 spec tier.
    const adReporting = endpoints.find((e: any) => e.name === 'official_ad_publishing_fb_get_reporting');
    expect(adReporting).toBeDefined();
    expect(adReporting.versions).toContain('2021-07-28');
    expect(adReporting.apiGenerations).toEqual(['v3']);

    // Access levels are derived from security schemes.
    const accessLevels = new Set(endpoints.map((e: any) => e.accessLevel));
    expect(accessLevels.has('any')).toBe(true);
  });

  it('generates a complete route-version table for handwritten and composed callers', () => {
    const coverage = JSON.parse(readFileSync(join(repoRoot, 'docs', 'ghl-api-coverage.json'), 'utf8'));
    const routes = JSON.parse(readFileSync(join(repoRoot, 'src', 'tools', 'official-route-versions.json'), 'utf8'));
    const calendarVersions = routes
      .filter((route: any) => route.method === 'GET' && route.path === '/calendars/events')
      .map((route: any) => ({ versions: route.versions, apiGenerations: route.apiGenerations }));

    expect(routes).toHaveLength(coverage.official.endpoints.length);
    expect(calendarVersions).toEqual(expect.arrayContaining([
      { versions: ['v3'], apiGenerations: ['v3'] },
      { versions: ['2021-04-15'], apiGenerations: ['v2'] },
    ]));
  });

  it('persists explicit generation visibility for current and superseded endpoints', () => {
    const endpoints = JSON.parse(readFileSync(join(repoRoot, 'src', 'tools', 'official-spec-endpoints.json'), 'utf8'));

    const currentV3 = endpoints.find((e: any) => e.name === 'official_ad_publishing_fb_get_reporting');
    const legacyOnly = endpoints.find((e: any) => e.name === 'official_emails_create_email_template_v2');
    const currentDatedV2 = endpoints.find((e: any) =>
      e.specTier === 'v2' && !e.supersededBy && e.apiGenerations?.includes('v3')
    );

    expect(currentV3.apiGenerations).toEqual(['v3']);
    expect(legacyOnly).toMatchObject({
      apiGenerations: ['v2'],
      deprecated: true,
      supersededBy: 'v3',
    });
    expect(currentDatedV2).toBeDefined();
    expect(currentDatedV2.apiGenerations).toEqual(['v2', 'v3']);
  });

  it('carries DELETE body schemas and OpenAPI array wire formats into generated data', () => {
    const endpoints = JSON.parse(readFileSync(join(repoRoot, 'src', 'tools', 'official-spec-endpoints.json'), 'utf8'));
    const deleteWithBodies = endpoints.filter((e: any) => e.method === 'DELETE' && e.requestBodySchema);
    const fields = endpoints
      .find((e: any) => e.name === 'official_ad_publishing_fb_get_reporting')
      ?.queryParams.find((param: any) => param.name === 'fields');

    expect(deleteWithBodies.length).toBeGreaterThanOrEqual(9);
    expect(fields).toMatchObject({ schema: { type: 'array' }, arrayFormat: 'comma' });
  });

  it('captures the preferred OpenAPI request content type for generated OAuth tools', () => {
    const endpoints = JSON.parse(readFileSync(join(repoRoot, 'src', 'tools', 'official-spec-endpoints.json'), 'utf8'));
    const oauthTokens = endpoints.filter((e: any) => e.path === '/oauth/token' && e.method === 'POST');
    const byTier = new Map(oauthTokens.map((endpoint: any) => [endpoint.specTier, endpoint]));

    expect(byTier.get('v3')).toMatchObject({ requestContentType: 'application/json' });
    expect(byTier.get('v2')).toMatchObject({ requestContentType: 'application/x-www-form-urlencoded' });
  });

  it('applies and records the locked SaaS query-schema correction', () => {
    const endpoints = JSON.parse(readFileSync(join(repoRoot, 'src', 'tools', 'official-spec-endpoints.json'), 'utf8'));
    const lock = JSON.parse(readFileSync(join(repoRoot, 'docs', 'api-sources.lock.json'), 'utf8'));
    const saasLocations = endpoints.find((e: any) => e.name === 'official_saas_locations');
    const required = Object.fromEntries(saasLocations.queryParams.map((param: any) => [param.name, param.required]));

    expect(required).toEqual({ customerId: false, subscriptionId: false, companyId: true });
    expect(lock.officialSpecCorrections).toEqual(expect.arrayContaining([
      expect.objectContaining({
        method: 'GET',
        path: '/saas/locations',
        evidence: 'apps/v3/saas-v3.json GET /saas-api/public-api/locations',
      }),
    ]));
  });

  it('counts only source files reachable from registered tool modules', () => {
    const coverage = JSON.parse(readFileSync(join(repoRoot, 'docs', 'ghl-api-coverage.json'), 'utf8'));
    const reachable = new Set(coverage.local.reachableSourceFiles);

    expect(coverage.local.registeredToolModules).toContain('src/tools/oauth-tools.ts');
    expect(reachable.has('src/tools/oauth-tools.ts')).toBe(true);
    expect(reachable.has('src/http-server.ts')).toBe(false);
    expect(coverage.local.endpoints.every((endpoint: any) =>
      endpoint.caller === 'official-spec-generated' || reachable.has(endpoint.sourceFile)
    )).toBe(true);
  });

  it('generates official-spec tools for supplemental Templates V2 and Statistics V2 pages', () => {
    const endpoints = JSON.parse(readFileSync(join(repoRoot, 'src', 'tools', 'official-spec-endpoints.json'), 'utf8'));
    const byName = new Map(endpoints.map((endpoint: any) => [endpoint.name, endpoint]));

    expect(byName.get('official_emails_create_email_template_v2')).toMatchObject({
      method: 'POST',
      path: '/emails/public/v2/locations/{locationId}/templates',
    });
    expect(byName.get('official_emails_list_email_templates_v2')).toMatchObject({
      method: 'GET',
      path: '/emails/public/v2/locations/{locationId}/templates',
    });
    expect(byName.get('official_emails_get_campaign_stats_v2')).toMatchObject({
      method: 'GET',
      path: '/emails/public/v2/locations/{locationId}/campaigns/stats/{source}/{sourceId}',
      source: 'live-ghl-docs',
      stability: 'deprecated',
      apiGenerations: ['v2'],
    });
  });

  it('keeps generated official-spec tool names within custom tool limits without renaming valid stable names', () => {
    const endpoints = JSON.parse(readFileSync(join(repoRoot, 'src', 'tools', 'official-spec-endpoints.json'), 'utf8'));
    const names = endpoints.map((endpoint: any) => endpoint.name);

    expect(names.every((name: string) => name.length <= 64)).toBe(true);
    // v3 spec uses the "ad-publishing" app name; the v2 "ad-manager" alias may also appear.
    expect(names.some((n: string) => n.startsWith('official_ad_publishing_fb_get_reporting'))).toBe(true);
    expect(names).not.toContain('official_payments_custom_provider_marketplace_app_update_capabilities');
    expect(names).toContain('official_payments_custom_provider_marketplace_app_update_9a8c6e');
  });

  it('keeps local-only endpoint classification aligned with the audit categories', () => {
    const report = readFileSync(join(repoRoot, 'docs', 'GHL-LOCAL-ENDPOINT-CLASSIFICATION.md'), 'utf8');

    expect(report).toContain('## Official But Scanner-Missed Candidates');
    expect(report).toContain('## Known Legacy V2 Live-Docs Supplements');
    expect(report).toContain('## Legacy But Still Useful');
    expect(report).toContain('## Private/Internal And Unstable');
    expect(report).toContain('## Deprecated Or Compatibility Aliases');
    expect(report).toContain('## Needs Manual Review');
    expect(report).toContain('relative to the current/default v3 surface');
    expect(report).toContain('does not mean the scanner missed them');
    expect(report).not.toContain('expected to disappear from local-only');
  });
});
