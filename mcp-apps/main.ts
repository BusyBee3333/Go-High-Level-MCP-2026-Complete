#!/usr/bin/env node

import { createMcpExpressApp } from '@modelcontextprotocol/sdk/server/express.js';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import cors from 'cors';
import type { Request, Response } from 'express';
import { readFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildPreviewPayload, createServer } from './server.js';

const appDir = dirname(fileURLToPath(import.meta.url));
const packageRoot = appDir.endsWith(`${process.platform === 'win32' ? '\\' : '/'}dist`) ? resolve(appDir, '..') : appDir;

async function startStdioServer(factory: () => McpServer): Promise<void> {
  await factory().connect(new StdioServerTransport());
}

async function startHttpServer(factory: () => McpServer): Promise<void> {
  const port = parseInt(process.env.GHL_MCP_APPS_PORT || process.env.PORT || '3001', 10);
  const app = createMcpExpressApp({ host: '0.0.0.0' });
  app.use(cors());

  app.get('/', (_req, res) => {
    res.redirect('/preview');
  });

  app.get('/preview', async (_req, res) => {
    res.type('html').send(await readFile(join(packageRoot, 'dist', 'mcp-app.html'), 'utf8'));
  });

  app.get('/preview-data', async (req, res) => {
    try {
      const appId = typeof req.query.app === 'string' ? req.query.app : 'tool-explorer';
      const args = Object.fromEntries(
        Object.entries(req.query).filter(([key]) => key !== 'app').map(([key, value]) => [key, Array.isArray(value) ? value[0] : value]),
      );
      res.json({ payload: await buildPreviewPayload(appId, args) });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      res.status(500).json({ error: message });
    }
  });

  app.all('/mcp', async (req: Request, res: Response) => {
    const server = factory();
    const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined });

    res.on('close', () => {
      transport.close().catch(() => {});
      server.close().catch(() => {});
    });

    try {
      await server.connect(transport);
      await transport.handleRequest(req, res, req.body);
    } catch (error) {
      console.error('[GHL MCP Apps] transport error:', error);
      if (!res.headersSent) {
        res.status(500).json({
          jsonrpc: '2.0',
          error: { code: -32603, message: 'Internal server error' },
          id: null,
        });
      }
    }
  });

  app.get('/health', (_req, res) => {
    res.json({
      status: 'healthy',
      server: 'ghl-mcp-apps',
      transport: 'streamable-http',
      endpoint: '/mcp',
      preview: '/preview',
    });
  });

  const httpServer = app.listen(port, '0.0.0.0', () => {
    console.log(`GoHighLevel MCP Apps listening at http://localhost:${port}/mcp`);
    console.log(`Browser preview: http://localhost:${port}/preview`);
  });

  const shutdown = () => {
    httpServer.close(() => process.exit(0));
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

async function main(): Promise<void> {
  if (process.argv.includes('--stdio')) {
    await startStdioServer(createServer);
    return;
  }
  await startHttpServer(createServer);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
