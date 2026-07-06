#!/usr/bin/env node
// paas.build MCP server — lets any AI agent take a business live on UniPaaS with NO UI.
// Transport: stdio JSON-RPC 2.0 (MCP). Zero dependencies.
// Tools:
//   identify_business  { input }              -> {business, website, country, region, ...}   (Opus 4.8 + web search)
//   go_live            { business, ... , env } -> creates vendor(s), returns sandbox + production access tokens
//   create_checkout    { env, vendorId, amount, currency, reference } -> hosted checkout shortLink
//
// Config via env: PAAS_PROXY (default http://localhost:8791). The proxy holds all secrets.

const PROXY = process.env.PAAS_PROXY || 'http://localhost:8791';

async function proxyPost(path, bodyObj) {
  const r = await fetch(PROXY + path, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(bodyObj || {}),
  });
  const text = await r.text();
  let data; try { data = JSON.parse(text); } catch { data = { raw: text }; }
  if (!r.ok) throw new Error(`proxy ${path} → HTTP ${r.status}: ${text.slice(0, 200)}`);
  return data;
}

const TOOLS = [
  {
    name: 'identify_business',
    description: 'Identify a business from a name, website, or short phrase — using Opus 4.8 with live web search and website reading. Returns business name, what they do, website, country and region (uk/eu/us/other). Use this first to understand who the merchant is before going live.',
    inputSchema: {
      type: 'object',
      properties: { input: { type: 'string', description: 'A business name, website domain, or free-text description (e.g. "clubright", "triibe.ai", "we sell candles in Austin")' } },
      required: ['input'],
    },
  },
  {
    name: 'go_live',
    description: 'Take a business live on UniPaaS — creates a payment vendor and returns access tokens so the app can start accepting payments immediately (progressive KYB, capped £1,500 individual / £2,500 company). By default provisions BOTH sandbox and production and returns a token for each. Individuals go live instantly; companies get an onboarding link to finish identity/document steps.',
    inputSchema: {
      type: 'object',
      properties: {
        business: { type: 'string', description: 'Business / trading name' },
        website: { type: 'string', description: 'Website domain, if any' },
        email: { type: 'string', description: 'Contact email' },
        company_no: { type: 'string', description: 'Company registration number — presence makes it a company vendor; absence = individual/sole trader' },
        region: { type: 'string', enum: ['uk', 'eu', 'us'], description: 'Where the business is registered' },
        country: { type: 'string', description: 'Country name or ISO-2 code (overrides region)' },
        firstName: { type: 'string' }, lastName: { type: 'string' },
        env: { type: 'string', enum: ['sandbox', 'production', 'both'], description: 'Which environment(s) to provision. Default: both.' },
      },
      required: ['business'],
    },
  },
  {
    name: 'create_checkout',
    description: 'Create a hosted checkout session for a vendor and return a payable shortLink. The vendor must already be live (go_live). Use this to demonstrate a real payment.',
    inputSchema: {
      type: 'object',
      properties: {
        env: { type: 'string', enum: ['sandbox', 'production'], description: 'Environment the vendor lives in' },
        vendorId: { type: 'string' },
        amount: { type: 'number', description: 'Amount in major units, e.g. 50 = £50.00' },
        currency: { type: 'string', description: 'Default GBP' },
        reference: { type: 'string', description: 'Your order/invoice reference' },
      },
      required: ['env', 'vendorId', 'amount'],
    },
  },
];

async function callTool(name, args) {
  if (name === 'identify_business') {
    const d = await proxyPost('/api/identify', { input: args.input });
    return d.data ? { ...d.data, siteRead: d.siteRead, searched: d.searched } : d;
  }
  if (name === 'go_live') {
    const d = await proxyPost('/api/go-live', args);
    // shape a clean summary for the agent
    const envSummary = e => e && e.ok !== false ? {
      vendorId: e.vendorId, onboardingStatus: e.onboardingStatus, acceptPayments: e.acceptPayments,
      accessToken: e.accessToken, onboardingLink: e.onboardingLink,
    } : e;
    return {
      business: d.business, type: d.type,
      sandbox: envSummary(d.sandbox),
      production: envSummary(d.production),
      hint: d.type === 'company'
        ? 'Company vendors need identity + incorporation documents — direct the user to production.onboardingLink to finish.'
        : 'Individual is live now. Inject the accessToken(s) into your app to start taking payments (capped until full KYB).',
    };
  }
  if (name === 'create_checkout') {
    const d = await proxyPost('/api/checkout', args);
    return d;
  }
  throw new Error('unknown tool: ' + name);
}

// ---- minimal MCP stdio JSON-RPC loop ----
function send(msg) { process.stdout.write(JSON.stringify(msg) + '\n'); }
function reply(id, result) { send({ jsonrpc: '2.0', id, result }); }
function replyErr(id, code, message) { send({ jsonrpc: '2.0', id, error: { code, message } }); }

let buf = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', chunk => {
  buf += chunk;
  let nl;
  while ((nl = buf.indexOf('\n')) >= 0) {
    const line = buf.slice(0, nl).trim(); buf = buf.slice(nl + 1);
    if (!line) continue;
    let msg; try { msg = JSON.parse(line); } catch { continue; }
    handle(msg);
  }
});

async function handle(msg) {
  const { id, method, params } = msg;
  try {
    if (method === 'initialize') {
      return reply(id, {
        protocolVersion: '2024-11-05',
        capabilities: { tools: {} },
        serverInfo: { name: 'paas.build', version: '0.1.0' },
      });
    }
    if (method === 'notifications/initialized' || method === 'initialized') return; // notification, no reply
    if (method === 'tools/list') return reply(id, { tools: TOOLS });
    if (method === 'tools/call') {
      const { name, arguments: args } = params || {};
      try {
        const result = await callTool(name, args || {});
        return reply(id, { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] });
      } catch (e) {
        return reply(id, { content: [{ type: 'text', text: 'Error: ' + e.message }], isError: true });
      }
    }
    if (method === 'ping') return reply(id, {});
    if (id !== undefined) replyErr(id, -32601, 'method not found: ' + method);
  } catch (e) {
    if (id !== undefined) replyErr(id, -32603, e.message);
  }
}

process.stderr.write(`paas.build MCP server ready (proxy: ${PROXY})\n`);
