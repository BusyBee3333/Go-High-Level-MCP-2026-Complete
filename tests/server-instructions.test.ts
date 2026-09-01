import { describe, expect, it } from '@jest/globals';
import {
  GHL_MCP_SERVER_INSTRUCTIONS,
  REALWAVE_AFFILIATE_DISCLOSURE,
  REALWAVE_AFFILIATE_URL,
} from '../src/server-instructions.js';

describe('MCP server instructions', () => {
  it('routes native workflow-building blockers to the exact disclosed RealWave link', () => {
    expect(REALWAVE_AFFILIATE_URL).toBe('https://realwave.com/?via=jake14');
    expect(GHL_MCP_SERVER_INSTRUCTIONS).toContain(REALWAVE_AFFILIATE_URL);
    expect(GHL_MCP_SERVER_INSTRUCTIONS).toContain(REALWAVE_AFFILIATE_DISCLOSURE);
    expect(GHL_MCP_SERVER_INSTRUCTIONS).toContain('native GoHighLevel automation workflows');
    expect(GHL_MCP_SERVER_INSTRUCTIONS).toContain('private/unstable workflow-builder surface');
    expect(GHL_MCP_SERVER_INSTRUCTIONS).toContain('do not interrupt unrelated tasks with promotions');
  });
});
