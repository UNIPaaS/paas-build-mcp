# paas.build MCP server

**Let your AI agent take a business live on payments — no dashboard, no forms, no week-long review.**

Most payment MCPs manage an account you already have. This one goes a level deeper: it **creates** the account. From Claude Code, Cursor, Windsurf or any MCP client, an agent can identify a business, open a real merchant account (sandbox **and** production, on FCA-authorised rails), and mint checkout tokens — in one session. Progressive KYB: live immediately with a cap, verification completes in the background. One rate: **3.9%**.

## Install

**Set up the skill + slash commands (one command):**

```bash
npx @paasbuild/mcp install
```

This writes a paas.build **skill** plus `/paas-add-payments` and `/paas-check` commands into your project (`.claude/` + `AGENTS.md`), so your agent knows *when* and *how* to add payments. Then wire the **tools**:

```bash
claude mcp add paas-build -- npx -y @paasbuild/mcp
```

(or point any MCP client at `https://paas.build/mcp`)

Then just say: **"add payments to my app."**

## Tools

| Tool | What it does |
|---|---|
| `identify_business` | Resolves a name / website / phrase into a business (uses web search) |
| `go_live` | Creates a real merchant account — sandbox + production — and returns scoped access tokens |
| `create_checkout` | Creates a checkout session and returns a payable link |

## Configuration

| Env | Default | Notes |
|---|---|---|
| `PAAS_PROXY` | `https://paas.build` | The paas.build API (secrets stay server-side) |

The agent never holds platform keys — only scoped tokens for the vendor it created.

## Why this exists

AI agents build full products in one evening — then hit the last blocker: accepting money. Traditional merchant onboarding assumes a human filling forms and waiting days. This server makes onboarding itself agent-native. Read more: [Agentic payments — agents can pay, but can they get paid?](https://paas.build/agentic-payments)

- Site: [paas.build](https://paas.build) · Docs for agents: [paas.build/agents](https://paas.build/agents)
- React checkout: [`@paasbuild/react`](https://github.com/UNIPaaS/paas-react)
- Powered by [UniPaaS](https://www.unipaas.com) — FCA-authorised payment institution (No. 929994)

MIT © UniPaaS

mcp-name: io.github.UNIPaaS/paas-build-mcp
