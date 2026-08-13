/**
 * REST bridge endpoints:
 *   GET  /tools
 *   POST /execute
 */

import type { Application } from 'express';
import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import type { ToolRegistry } from './tool-registry.js';
import type { GHLConfig } from './types/ghl-types.js';
import { EnhancedGHLClient } from './enhanced-ghl-client.js';
import { ToolRegistry as ToolRegistryClass } from './tool-registry.js';
import { createPerRequestConfig } from './request-config.js';

function toRouteToolDescriptor(tool: Tool) {
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

export function registerExecuteRoutes(
  app: Application,
  defaultRegistry: ToolRegistry,
  baseConfig?: GHLConfig
): void {
  app.get('/tools', (_req, res) => {
    try {
      const toolDescriptors = defaultRegistry.getAllToolDefinitions().map(toRouteToolDescriptor);
      res.json({ tools: toolDescriptors, count: toolDescriptors.length });
    } catch (err: any) {
      console.error('[execute-route] GET /tools error:', err.message);
      res.status(500).json({ error: 'Failed to list tools' });
    }
  });

  app.post('/execute', async (req, res) => {
    const body = req.body ?? {};
    const toolName: string | undefined = body.name;
    const toolArgs: Record<string, unknown> = body.arguments ?? {};

    if (!toolName || typeof toolName !== 'string') {
      res.status(400).json({ error: 'Body must include a non-empty string "name"' });
      return;
    }

    const perReqToken = req.headers['x-ghl-access-token'] as string | undefined;
    const perReqLoc = req.headers['x-ghl-location-id'] as string | undefined;

    let registry = defaultRegistry;
    if (perReqToken && perReqLoc && baseConfig) {
      const perReqClient = new EnhancedGHLClient(createPerRequestConfig(
        baseConfig,
        perReqToken,
        perReqLoc,
        req.headers['x-ghl-user-type'],
      ));
      registry = new ToolRegistryClass(perReqClient) as unknown as ToolRegistry;
    }

    try {
      const result = await registry.callTool(toolName, toolArgs);
      if (result === undefined) {
        res.status(404).json({ error: `Unknown tool: ${toolName}` });
        return;
      }
      res.json({ result });
    } catch (err: any) {
      console.error(`[execute-route] POST /execute tool=${toolName} error:`, err.message);
      res.status(500).json({ error: `Tool execution failed: ${err.message}` });
    }
  });
}
