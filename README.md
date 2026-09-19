# Finatic Server SDK (Node)

Node.js SDK for embedding Finatic in **your backend**. Keep the company API key on the server. Mint a 90-second one-time token for `@finatic/client`, or start a session and redirect to Connect.

## Install

```bash
npm install @finatic/server-node
```

## Quick start

```ts
import { FinaticServer } from '@finatic/server-node';

const finatic = new FinaticServer(process.env['FINATIC_API_KEY']!, {
  apiEnvironment: 'sandbox',
});

// Client iframe: 90-second token. Never send the API key to the browser.
const oneTimeToken = await finatic.v1.getToken();

// Redirect flow: start a session first (getPortalUrl requires it).
const redirectSession = await finatic.v1.startSession();
if (!redirectSession.session_id) {
  const message =
    'error' in redirectSession && redirectSession.error
      ? redirectSession.error
      : 'Session start failed';
  throw new Error(message);
}
const portalUrl = await finatic.v1.getPortalUrl({ mode: 'dark' });

// After account.grant.created, start a session for that portal user, then read.
const portalUserId = 'user-from-connect-onSuccess';
const authenticatedSession = await finatic.v1.startSession({ userId: portalUserId });
if (!authenticatedSession.authenticated) {
  const message = authenticatedSession.error
    ? authenticatedSession.error
    : `Session is ${authenticatedSession.status ?? 'not active'}`;
  throw new Error(message);
}

interface AccountSummary {
  accountId: string;
}

const accounts = await finatic.v1.listAccounts<AccountSummary[]>({
  includeSyncStatus: true,
});
const accountId = accounts.data?.[0]?.accountId;
if (!accountId) {
  throw new Error(accounts.errors[0]?.message ?? 'No granted accounts yet');
}
const orders = await finatic.v1.listOrders({ accountId });
```

Server `v1` data methods return `{ traceId, data, warnings, errors }`. Check `errors` before using `data`.

`fntc_sandbox_` keys use Finatic synthetic data. Broker paper/sim accounts stay `live`.

`FinaticServer.init(apiKey, userId?)` is a shortcut that calls `startSession`. Use the constructor + `getToken()` when you only need to hand a token to the browser.

## Exact instrument descriptors

Order legs, fills, events, and positions use generated descriptor types by default. Exact futures
remain distinct from product-root-only identities, and the SDK does not infer missing contract,
expiry, venue, provenance, or identity-quality fields.

```ts
const orders = await finatic.v1.listOrders({ accountId: 'acct_123' });
const instrument = orders.data?.[0]?.legs?.[0]?.instrument;

if (instrument?.future?.identityQuality === 'EXACT') {
  console.log(instrument.future.contractCode); // e.g. MGCZ6
}

await finatic.v1.createAccountOrder({
  accountId: 'acct_123',
  idempotencyKey: crypto.randomUUID(),
  body: {
    order: {
      finaticInstrumentId: 'finatic:future:MGCZ6',
      instrumentId: 418, // provider-native identifiers remain additive
    },
  },
});
```

## Embed Connect

1. `v1.getToken()` → pass the token to `FinaticConnect.init(token)` in the browser (token TTL is 90 seconds).
2. Or `v1.startSession()` then `v1.getPortalUrl(...)` → redirect. Treat the full URL as secret.

Wait for webhook `account.grant.created` before treating access as durable.

`startSession().success` means the request completed. Check `authenticated` before account or
trading calls; `status`, `user_id`, `provided_user_id_rejected`, and
`portal_connection_management_pending` explain non-active session states.

## Common commands

| Task       | Command              |
| ---------- | -------------------- |
| Build      | `npm run build`      |
| Test       | `npm test`           |
| Lint       | `npm run lint`       |
| Type check | `npm run type:check` |

## Documentation

This README is the Node SDK contract. Fetch the rest before writing a full integration:

- Quick start: [https://finatic.dev/docs/quick-start/quick-start](https://finatic.dev/docs/quick-start/quick-start)
- Client SDK README: [https://github.com/FinaticORG/FinaticClientSDK/blob/develop/README.md](https://github.com/FinaticORG/FinaticClientSDK/blob/develop/README.md)
- Python SDK README: [https://github.com/FinaticORG/FinaticServerSDK-Python/blob/develop/README.md](https://github.com/FinaticORG/FinaticServerSDK-Python/blob/develop/README.md)
- Embed Connect: [https://github.com/FinaticORG/FinaticConnect/blob/develop/docs/embedding.md](https://github.com/FinaticORG/FinaticConnect/blob/develop/docs/embedding.md)
- Demo apps: [https://github.com/FinaticORG/FinaticDemoApps/blob/develop/README.md](https://github.com/FinaticORG/FinaticDemoApps/blob/develop/README.md)
- API reference: [https://finatic.dev/docs/api-reference](https://finatic.dev/docs/api-reference)
- OpenAPI: [https://finatic.dev/openapi.json](https://finatic.dev/openapi.json)
- Agent index: [https://finatic.dev/llms.txt](https://finatic.dev/llms.txt)
- Agent notes: [https://finatic.dev/AGENTS.md](https://finatic.dev/AGENTS.md)
