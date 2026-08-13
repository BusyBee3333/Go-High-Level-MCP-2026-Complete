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
    expect(source).toContain('live-docs:ghl/emails/create-email-campaign-v-2');
    expect(source).toContain('live-docs:ghl/emails/create-email-template-v-2');
    expect(source).toContain('live-docs:ghl/emails/get-campaign-stats-under-campaigns-v-2');
  });

  it('reports the live-docs supplemental endpoints (Email V2 legacy + v3 live-docs additions)', () => {
    const coverage = JSON.parse(readFileSync(join(repoRoot, 'docs', 'ghl-api-coverage.json'), 'utf8'));
    const supplemental = coverage.official.endpoints.filter((endpoint: any) => endpoint.sourceFile?.startsWith('live-docs:'));

    // The Email Campaign V2 supplemental endpoints (deprecated in v3) are retained.
    const emailV2 = supplemental.filter((e: any) => e.path.startsWith('/emails/public/v2/'));
    expect(emailV2).toHaveLength(14);
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

    // Access levels are derived from security schemes.
    const accessLevels = new Set(endpoints.map((e: any) => e.accessLevel));
    expect(accessLevels.has('any')).toBe(true);
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
      stability: 'live-docs-supplemental',
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
    expect(report).toContain('## Live-Docs Supplemental Candidates');
    expect(report).toContain('## Legacy But Still Useful');
    expect(report).toContain('## Private/Internal And Unstable');
    expect(report).toContain('## Deprecated Or Compatibility Aliases');
    expect(report).toContain('## Needs Manual Review');
  });
});
