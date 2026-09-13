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
if (!authenticatedSession.session_id) {
  const message =
    'error' in authenticatedSession && authenticatedSession.error
      ? authenticatedSession.error
      : 'Authenticated session start failed';
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
