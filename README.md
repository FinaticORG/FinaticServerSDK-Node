# Finatic Server SDK (Node)

Node.js SDK for server-side Finatic integrations.

Use this package when your backend needs API-key authentication, session orchestration, portal URL generation, and unified broker-domain data access.

## Install

```bash
npm install @finatic/server-node
```

## Quick Start

```ts
import { FinaticServer } from '@finatic/server-node';

const finatic = await FinaticServer.init(process.env.FINATIC_API_KEY!);
const token = await finatic.getToken();
const orders = await finatic.getAllOrders();
```

## Common Commands

| Task | Command |
|---|---|
| Build | `npm run build` |
| Test | `npm test` |
| Lint | `npm run lint` |
| Type check | `npm run type:check` |
| Quality check | `npm run quality:check` |

## Core Capabilities

- API-key initialization and session lifecycle handling.
- Portal URL generation for end-user broker authentication.
- One-time token issuance for client SDK handoff.
- Typed data retrieval across orders, positions, accounts, and balances.
- Standardized response and error envelopes.

## Documentation

- Product docs: [https://finatic.dev/docs](https://finatic.dev/docs)
- API reference: [https://finatic.dev/docs/api-reference](https://finatic.dev/docs/api-reference)
- LLM context doc: [https://finatic.dev/llms.txt](https://finatic.dev/llms.txt)

## Using Finatic with AI

This SDK is well-suited for server-side AI orchestration:

- query and normalize brokerage data for downstream AI workflows
- drive broker actions through one SDK surface instead of raw per-broker APIs
- pair structured broker data with model prompts safely on your backend

MCP support is coming soon.
