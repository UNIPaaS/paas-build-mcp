# paas.build MCP server

**Let your AI agent take a business live on payments — no dashboard, no forms, no week-long review.**

Most payment MCPs manage an account you already have. This one goes a level deeper: it **creates** the account. From Claude Code, Cursor, Windsurf or any MCP client, an agent can identify a business, open a real merchant account (sandbox **and** production, on FCA-authorised rails), and mint checkout tokens — in one session. Progressive KYB: live immediately with a cap, verification completes in the background. One rate: **3.9%**.

## Install

```bash
claude mcp add paas-build -- npx -y @paasbuild/mcp
```

(or clone: `git clone https://github.com/UNIPaaS/paas-build-mcp && claude mcp add paas-build -- node paas-build-mcp/paas-build-mcp.mjs`)

Then just say: **"take my business live."**

## Tools

| Tool | What it does |
|---|---|
| `identify_business` | Resolves a name / website / phrase into a business (uses web search) |
| `go_live` | Creates a real merchant account — sandbox + production — and returns scoped access tokens |
| `create_checkout` | Creates a checkout session and returns a payable link |

## Configuration

| Env | Default | Notes |
|---|---|---|
| `PAAS_PROXY` | `https://api.paas.build` | The paas.build API (secrets stay server-side) |

The agent never holds platform keys — only scoped tokens for the vendor it created.

## Why this exists

AI agents build full products in one evening — then hit the last blocker: accepting money. Traditional merchant onboarding assumes a human filling forms and waiting days. This server makes onboarding itself agent-native. Read more: [Agentic payments — agents can pay, but can they get paid?](https://paas.build/agentic-payments)

- Site: [paas.build](https://paas.build) · Docs for agents: [paas.build/agents](https://paas.build/agents)
- React checkout: [`@paasbuild/react`](https://github.com/UNIPaaS/paas-react)
- Powered by [UniPaaS](https://www.unipaas.com) — FCA-authorised payment institution (No. 929994)

MIT © UniPaaS

mcp-name: io.github.UNIPaaS/paas-build-mcp
