# Finatic Server SDK (Node)

Node.js SDK for server-side Finatic integrations.

Use this package when your backend needs API-key authentication, session orchestration, portal URL generation, and unified broker-domain data access.

## Version lines (FDX v1)

| Version | API surface | Use when |
|---------|-------------|----------|
| **1.0.0+** | `/api/v1/*` via `finatic.v1` | New account-grant integrations |
| **0.9.x** | `/api/beta/*` via legacy wrappers | Existing apps pinned to the 0.9 line |

The 1.0 line exposes the account-first v1 facade under `finatic.v1`; v1 OpenAPI output is under `src/openapi/`.

## Install

```bash
npm install @finatic/server-node
```

## Quick Start

```ts
import { FinaticServer } from '@finatic/server-node';

const finatic = await FinaticServer.init(process.env.FINATIC_API_KEY!);
const token = await finatic.v1.getToken();
const accounts = await finatic.v1.listAccounts({ includeSyncStatus: true });
const orders = await finatic.v1.listOrders({ accountId: 'acct_123' });
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
- Account-first sessions, account grants, data, trading, and webhook helpers through `finatic.v1`.
- One-time token issuance for client SDK handoff.
- Typed account-scoped retrieval across orders, positions, transactions, accounts, and balances.
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
