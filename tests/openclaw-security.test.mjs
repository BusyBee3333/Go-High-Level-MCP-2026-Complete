/**
 * Tests for the downstream mirror's network-exposure hardening (PATCHES.md).
 *
 * Runs against the BUILT dist/, uses no GoHighLevel credential and reaches no
 * network: it mounts the exact middleware main.ts mounts, in the same order, on
 * a throwaway express app. The properties under test are the two the MCP
 * specification names for local HTTP servers -- Origin MUST be validated with a
 * 403, and the listener SHOULD be loopback -- plus the opt-in bearer gate.
 *
 *   node tests/openclaw-security.test.mjs
 */

import express from 'express';
import assert from 'node:assert';
import { once } from 'node:events';

const mod = await import('../dist/openclaw-security.js');
const { resolveBindHost, originGuard, authGuard, isOriginAllowed, describeBinding } = mod;

let passed = 0;
let failed = 0;
function check(name, fn) {
  try { fn(); console.log(`  PASS: ${name}`); passed++; }
  catch (e) { console.log(`  FAIL: ${name} -- ${e.message}`); failed++; }
}
async function checkAsync(name, fn) {
  try { await fn(); console.log(`  PASS: ${name}`); passed++; }
  catch (e) { console.log(`  FAIL: ${name} -- ${e.message}`); failed++; }
}

console.log('=== openclaw-security (mirror patch) ===\n');

// ── bind host ───────────────────────────────────────────────────────────────
check('default bind host is loopback, not 0.0.0.0', () => {
  delete process.env.GHL_MCP_BIND_HOST;
  assert.strictEqual(resolveBindHost(), '127.0.0.1');
});
check('GHL_MCP_BIND_HOST overrides the default', () => {
  process.env.GHL_MCP_BIND_HOST = '0.0.0.0';
  assert.strictEqual(resolveBindHost(), '0.0.0.0');
  delete process.env.GHL_MCP_BIND_HOST;
});
check('an empty GHL_MCP_BIND_HOST falls back to loopback rather than binding everything', () => {
  process.env.GHL_MCP_BIND_HOST = '   ';
  assert.strictEqual(resolveBindHost(), '127.0.0.1');
  delete process.env.GHL_MCP_BIND_HOST;
});
check('the banner names the exposure so an operator can see it', () => {
  assert.match(describeBinding('127.0.0.1', 8765), /loopback only/);
  assert.match(describeBinding('0.0.0.0', 8765), /REACHABLE ON 0\.0\.0\.0/);
});

// ── origin policy ───────────────────────────────────────────────────────────
check('a request with NO Origin is allowed (every non-browser MCP client)', () => {
  assert.strictEqual(isOriginAllowed(undefined), true);
});
check('loopback origins are allowed', () => {
  for (const o of ['http://localhost', 'http://localhost:3000', 'http://127.0.0.1:8765', 'https://[::1]']) {
    assert.strictEqual(isOriginAllowed(o), true, o);
  }
});
check("upstream's own remote allow-list still works (this patch breaks no working setup)", () => {
  assert.strictEqual(isOriginAllowed('https://chatgpt.com'), true);
  assert.strictEqual(isOriginAllowed('https://chat.openai.com'), true);
});
check('a hostile origin is NOT allowed', () => {
  assert.strictEqual(isOriginAllowed('https://evil.example.com'), false);
});
check('a lookalike origin is not allowed by prefix confusion', () => {
  assert.strictEqual(isOriginAllowed('https://chatgpt.com.evil.example'), false);
  assert.strictEqual(isOriginAllowed('http://localhost.evil.example'), false);
});
check('GHL_MCP_ALLOWED_ORIGINS replaces the remote defaults', () => {
  process.env.GHL_MCP_ALLOWED_ORIGINS = 'https://ops.example.internal';
  assert.strictEqual(isOriginAllowed('https://ops.example.internal'), true);
  assert.strictEqual(isOriginAllowed('https://chatgpt.com'), false, 'defaults must be replaced, not merged');
  assert.strictEqual(isOriginAllowed('http://localhost:1234'), true, 'loopback stays allowed');
  delete process.env.GHL_MCP_ALLOWED_ORIGINS;
});
check('GHL_MCP_ALLOWED_ORIGINS=none locks it to loopback only', () => {
  process.env.GHL_MCP_ALLOWED_ORIGINS = 'none';
  assert.strictEqual(isOriginAllowed('https://chatgpt.com'), false);
  assert.strictEqual(isOriginAllowed('http://127.0.0.1:8765'), true);
  delete process.env.GHL_MCP_ALLOWED_ORIGINS;
});

// ── live HTTP behaviour, in main.ts's middleware order ───────────────────────
function buildApp() {
  const app = express();
  app.use(originGuard());
  app.use(express.json());
  app.use(authGuard());
  app.get('/health', (_req, res) => res.json({ status: 'healthy' }));
  app.get('/tools', (_req, res) => res.json({ tools: [] }));
  return app;
}

const app = buildApp();
const server = app.listen(0, '127.0.0.1');
await once(server, 'listening');
const base = `http://127.0.0.1:${server.address().port}`;

await checkAsync('a hostile Origin gets 403, not 500 (the MCP spec MUST)', async () => {
  const r = await fetch(`${base}/tools`, { headers: { Origin: 'https://evil.example.com' } });
  assert.strictEqual(r.status, 403, `got ${r.status}`);
});
await checkAsync('no Origin still gets 200 — existing callers are not broken', async () => {
  const r = await fetch(`${base}/tools`);
  assert.strictEqual(r.status, 200, `got ${r.status}`);
});
await checkAsync('a loopback Origin gets 200', async () => {
  const r = await fetch(`${base}/tools`, { headers: { Origin: 'http://localhost:3000' } });
  assert.strictEqual(r.status, 200, `got ${r.status}`);
});
await checkAsync('with no token configured the bearer gate is inert', async () => {
  const r = await fetch(`${base}/tools`);
  assert.strictEqual(r.status, 200, `got ${r.status}`);
});

server.close();
await once(server, 'close');

// Auth-enabled instance.
process.env.GHL_MCP_AUTH_TOKEN = 'test-token-value';
const authApp = buildApp();
const authServer = authApp.listen(0, '127.0.0.1');
await once(authServer, 'listening');
const authBase = `http://127.0.0.1:${authServer.address().port}`;

await checkAsync('with a token configured, an unauthenticated call gets 401', async () => {
  const r = await fetch(`${authBase}/tools`);
  assert.strictEqual(r.status, 401, `got ${r.status}`);
});
await checkAsync('with a token configured, the right bearer gets 200', async () => {
  const r = await fetch(`${authBase}/tools`, { headers: { Authorization: 'Bearer test-token-value' } });
  assert.strictEqual(r.status, 200, `got ${r.status}`);
});
await checkAsync('a wrong bearer gets 401', async () => {
  const r = await fetch(`${authBase}/tools`, { headers: { Authorization: 'Bearer wrong' } });
  assert.strictEqual(r.status, 401, `got ${r.status}`);
});
await checkAsync('/health stays open so liveness probes keep working', async () => {
  const r = await fetch(`${authBase}/health`);
  assert.strictEqual(r.status, 200, `got ${r.status}`);
});

authServer.close();
await once(authServer, 'close');
delete process.env.GHL_MCP_AUTH_TOKEN;

console.log(`\n=== ${passed} passed, ${failed} failed ===`);
process.exit(failed === 0 ? 0 : 1);
