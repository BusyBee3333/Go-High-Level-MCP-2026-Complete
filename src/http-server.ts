/**
 * GoHighLevel MCP HTTP Server — legacy SSE transport.
 */

import express from 'express';
import cors from 'cors';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
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

class GHLMCPHttpServer {
  private app: express.Application;
  private ghlClient: GHLApiClient;
  private registry: ToolRegistry;
  private port: number;

  constructor() {
    this.port = parseInt(process.env.PORT || process.env.MCP_SERVER_PORT || '8000', 10);
    this.app = express();
    this.setupExpress();
    this.ghlClient = this.initializeGHLClient();
    this.registry = new ToolRegistry(this.ghlClient);
    this.setupRoutes();
  }

  private setupExpress(): void {
    this.app.use(cors({
      origin: (origin, callback) => {
        if (!origin) return callback(null, true);
        if (/^https?:\/\/localhost(:\d+)?$/.test(origin) ||
            origin === 'https://chatgpt.com' ||
            origin === 'https://chat.openai.com') {
          return callback(null, true);
        }
        callback(new Error('CORS not allowed'));
      },
      methods: ['GET', 'POST', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
      credentials: true
    }));
    this.app.use(express.json());
  }

  private initializeGHLClient(): GHLApiClient {
    const apiGeneration = process.env.GHL_API_GENERATION === 'v2' ? 'v2' : 'v3';
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
    return new GHLApiClient(config);
  }

  private createSSEServer(): Server {
    const server = new Server(
      { name: 'ghl-mcp-server', version: '3.0.0' },
      { capabilities: { tools: {} } }
    );
    const allTools = this.registry.getAllToolDefinitions();

    server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools: allTools }));
    server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;
      try {
        const result = await this.registry.callTool(name, args || {});
        if (result === undefined) throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${name}`);
        return {
          content: [{
            type: 'text',
            text: typeof result === 'string' ? result : JSON.stringify(result, null, 2)
          }]
        };
      } catch (error) {
        if (error instanceof McpError) throw error;
        const msg = error instanceof Error ? error.message : String(error);
        throw new McpError(ErrorCode.InternalError, `Tool execution failed: ${msg}`);
      }
    });

    return server;
  }

  private setupRoutes(): void {
    this.app.get('/health', (_req, res) => {
      res.json({
        status: 'healthy',
        server: 'ghl-mcp-server',
        version: '3.0.0',
        transport: 'sse',
        timestamp: new Date().toISOString(),
        tools: this.registry.getToolCount()
      });
    });

    this.app.get('/capabilities', (_req, res) => {
      res.json({
        capabilities: { tools: {} },
        server: { name: 'ghl-mcp-server', version: '3.0.0' }
      });
    });

    this.app.get('/tools', (_req, res) => {
      res.json({ tools: this.registry.getAllToolDefinitions(), count: this.registry.getToolCount() });
    });

    this.app.post('/tools/call', async (req, res) => {
      const { name, arguments: args } = req.body;
      if (!name) {
        res.status(400).json({ error: 'Missing tool name' });
        return;
      }

      try {
        const result = await this.registry.callTool(name, args || {});
        if (result === undefined) {
          res.status(404).json({ error: `Unknown tool: ${name}` });
          return;
        }
        res.json({ result });
      } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : String(error);
        res.status(500).json({ error: `Tool execution failed: ${msg}` });
      }
    });

    const handleSSE = async (req: express.Request, res: express.Response) => {
      try {
        const server = this.createSSEServer();
        const transport = new SSEServerTransport('/sse', res);
        await server.connect(transport);
        req.on('close', () => {
          server.close().catch(() => {});
        });
      } catch {
        if (!res.headersSent) res.status(500).json({ error: 'Failed to establish SSE connection' });
        else res.end();
      }
    };

    this.app.get('/sse', handleSSE);
    this.app.post('/sse', handleSSE);

    this.app.get('/', (_req, res) => {
      res.json({
        name: 'GoHighLevel MCP Server (Legacy SSE)',
        version: '3.0.0',
        status: 'running',
        endpoints: {
          health: '/health',
          capabilities: '/capabilities',
          tools: '/tools',
          sse: '/sse'
        },
        tools: this.registry.getToolCount()
      });
    });
  }

  async start(): Promise<void> {
    await this.ghlClient.testConnection();
    this.app.listen(this.port, '0.0.0.0', () => {
      console.log(`GoHighLevel MCP legacy SSE server listening on ${this.port}`);
    });
  }
}

process.on('SIGINT', () => process.exit(0));
process.on('SIGTERM', () => process.exit(0));

async function main(): Promise<void> {
  const server = new GHLMCPHttpServer();
  await server.start();
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
