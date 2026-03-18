/**
 * Execute Route — CRESyncFlow MCP Bridge endpoints
 *
 * Exposes REST endpoints consumed by CRESyncFlow-v2's mcp-tools-bridge.ts:
 *   GET  /tools   — all tool definitions in Anthropic input_schema format
 *   POST /execute — execute a named tool by { name, arguments }
 *
 * These sit alongside (not replacing) the existing MCP protocol endpoints
 * (/mcp, /sse) and the /tools/call REST endpoint.
 */

import type { Application } from 'express';
import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import type { ToolRegistry } from './tool-registry.js';
import type { MCPAppsManager } from './apps/index.js';

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Convert an MCP SDK Tool (camelCase inputSchema) to Anthropic format
 * (snake_case input_schema) expected by CRESyncFlow-v2's mcp-tools-bridge.ts.
 */
function toAnthropicTool(tool: Tool) {
  // MCP SDK uses inputSchema; fall back gracefully if field name varies
  const schema: Record<string, unknown> =
    (tool as any).inputSchema ?? (tool as any).input_schema ?? {};

  return {
    name: tool.name,
    description: tool.description ?? '',
    input_schema: {
      type: 'object' as const,
      properties: (schema.properties as Record<string, unknown>) ?? {},
      ...(Array.isArray(schema.required) ? { required: schema.required as string[] } : {}),
    },
  };
}

// ── Route Registration ────────────────────────────────────────────────────────

/**
 * Register the CRESyncFlow bridge routes on the given Express app.
 *
 * Must be called:
 *   1. After `app.use(express.json())` is applied
 *   2. Before `app.listen()` is called
 *
 * Replaces the original `app.get('/tools', ...)` handler — call this INSTEAD
 * of registering a separate /tools GET handler in main.ts.
 */
export function registerExecuteRoutes(
  app: Application,
  registry: ToolRegistry,
  appsManager: MCPAppsManager,
  appTools: Tool[]
): void {
  // ── GET /tools — Anthropic-compatible tool catalogue ────────────────────
  // Returns { tools: AnthropicTool[], count: number }
  // The bridge caches this for 60 s so it is inexpensive in steady state.
  app.get('/tools', (_req, res) => {
    try {
      const allDefs = registry.getAllToolDefinitions(appTools);
      const anthropicTools = allDefs.map(toAnthropicTool);
      res.json({ tools: anthropicTools, count: anthropicTools.length });
    } catch (err: any) {
      console.error('[execute-route] GET /tools error:', err.message);
      res.status(500).json({ error: 'Failed to list tools' });
    }
  });

  // ── POST /execute — execute a named tool ─────────────────────────────────
  // Body: { name: string, arguments?: Record<string, unknown> }
  // Returns: { result } on success, { error } on failure (HTTP 4xx/5xx)
  app.post('/execute', async (req, res) => {
    const body = req.body ?? {};
    const toolName: string | undefined = body.name;
    const toolArgs: Record<string, unknown> = body.arguments ?? {};

    if (!toolName || typeof toolName !== 'string') {
      res.status(400).json({ error: 'Body must include a non-empty string "name"' });
      return;
    }

    try {
      // 1. Try GHL registry tools first
      const registryResult = await registry.callTool(toolName, toolArgs);
      if (registryResult !== undefined) {
        res.json({ result: registryResult });
        return;
      }

      // 2. Try MCP App tools
      if (appsManager.isAppTool(toolName)) {
        const appResult = await appsManager.executeTool(toolName, toolArgs);
        res.json({ result: appResult });
        return;
      }

      // 3. Unknown tool
      res.status(404).json({ error: `Unknown tool: ${toolName}` });
    } catch (err: any) {
      console.error(`[execute-route] POST /execute tool=${toolName} error:`, err.message);
      res.status(500).json({ error: `Tool execution failed: ${err.message}` });
    }
  });
}
