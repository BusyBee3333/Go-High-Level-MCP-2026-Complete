/**
 * GoHighLevel MCP Server — stdio transport.
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError
} from '@modelcontextprotocol/sdk/types.js';
import * as dotenv from 'dotenv';

import { GHLApiClient } from './clients/ghl-api-client.js';
import { ToolRegistry } from './tool-registry.js';
import { GHLConfig } from './types/ghl-types.js';
import { resolveVersion } from './clients/version-router.js';

dotenv.config();

class GHLMCPServer {
  private server: Server;
  private ghlClient: GHLApiClient;
  private registry: ToolRegistry;

  constructor() {
    this.server = new Server(
      { name: 'ghl-mcp-server', version: '3.0.0' },
      { capabilities: { tools: {} } }
    );
    this.ghlClient = this.initializeGHLClient();
    this.registry = new ToolRegistry(this.ghlClient);
    this.setupHandlers();
  }

  private initializeGHLClient(): GHLApiClient {
    const apiGeneration = (process.env.GHL_API_GENERATION === 'v2' ? 'v2' : 'v3') as 'v3' | 'v2';
    const config: GHLConfig = {
      accessToken: process.env.GHL_API_KEY || '',
      baseUrl: process.env.GHL_BASE_URL || 'https://services.leadconnectorhq.com',
      version: resolveVersion([], apiGeneration, process.env.GHL_API_VERSION),
      locationId: process.env.GHL_LOCATION_ID || '',
      apiGeneration,
      userType: process.env.GHL_USER_TYPE === 'Company' || process.env.GHL_USER_TYPE === 'Location'
        ? process.env.GHL_USER_TYPE
        : undefined,
    };

    if (!config.accessToken) throw new Error('GHL_API_KEY environment variable is required');
    if (!config.locationId) throw new Error('GHL_LOCATION_ID environment variable is required');

    process.stderr.write('[GHL MCP] Initializing GHL API client...\n');
    process.stderr.write(`[GHL MCP] Base URL: ${config.baseUrl}\n`);
    process.stderr.write(`[GHL MCP] Version: ${config.version} (generation: ${apiGeneration})\n`);
    process.stderr.write(`[GHL MCP] Location ID: ${config.locationId}\n`);
    return new GHLApiClient(config);
  }

  private setupHandlers(): void {
    const allTools = this.registry.getAllToolDefinitions();

    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      process.stderr.write(`[GHL MCP] Listing ${allTools.length} tools\n`);
      return { tools: allTools };
    });

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;
      process.stderr.write(`[GHL MCP] Executing tool: ${name}\n`);

      try {
        const result = await this.registry.callTool(name, args || {});
        if (result === undefined) {
          throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${name}`);
        }

        return {
          content: [{
            type: 'text',
            text: typeof result === 'string' ? result : JSON.stringify(result, null, 2)
          }]
        };
      } catch (error) {
        if (error instanceof McpError) throw error;
        const message = error instanceof Error ? error.message : String(error);
        const code = message.includes('404') ? ErrorCode.InvalidRequest : ErrorCode.InternalError;
        throw new McpError(code, `Tool execution failed: ${message}`);
      }
    });
  }

  private async testGHLConnection(): Promise<void> {
    process.stderr.write('[GHL MCP] Testing GHL API connection...\n');
    await this.ghlClient.testConnection();
    process.stderr.write('[GHL MCP] GHL API connection successful\n');
  }

  async start(): Promise<void> {
    await this.testGHLConnection();
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    process.stderr.write(`GoHighLevel MCP Server started with ${this.registry.getToolCount()} tools\n`);
  }
}

function setupGracefulShutdown(): void {
  const shutdown = (signal: string) => {
    process.stderr.write(`\n[GHL MCP] Received ${signal}, shutting down...\n`);
    process.exit(0);
  };
  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

async function main(): Promise<void> {
  setupGracefulShutdown();
  const server = new GHLMCPServer();
  await server.start();
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
