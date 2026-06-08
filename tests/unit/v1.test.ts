import type { AxiosInstance, AxiosRequestConfig } from 'axios';

import { V1Wrapper } from '../../src/wrappers/v1';
import type { SdkConfig } from '../../src/config';

function createConfig(): SdkConfig {
  return {
    apiEnvironment: 'sandbox',
    baseUrl: 'https://api.test',
    timeout: 30000,
    headers: {},
    retryEnabled: true,
    retryCount: 3,
    retryDelay: 1000,
    retryMaxDelay: 10000,
    retryMultiplier: 2,
    retryOnStatus: [429, 500, 502, 503, 504],
    retryOnNetworkError: true,
    logLevel: 'error',
    structuredLogging: false,
    logRequestBody: false,
    logResponseBody: false,
    logRequestId: true,
    validationEnabled: true,
    validationStrict: false,
    cacheEnabled: false,
    cacheTtl: 300,
    cacheMaxSize: 1000,
    cacheKeyInclude: ['method', 'path', 'query', 'body'],
    rateLimitEnabled: true,
    rateLimitAutoRetry: true,
    requestInterceptorsEnabled: true,
    responseInterceptorsEnabled: true,
    sessionContextStorage: 'memory',
  };
}

function createClient(): { client: AxiosInstance; requests: AxiosRequestConfig[] } {
  const requests: AxiosRequestConfig[] = [];
  const client = {
    request: jest.fn(async (config: AxiosRequestConfig) => {
      requests.push(config);
      return {
        data: {
          traceId: 'trace-id',
          data: { ok: true },
          warnings: [],
          errors: [],
        },
      };
    }),
  } as unknown as AxiosInstance;

  return { client, requests };
}

const V1_OPENAPI_OPERATION_METHODS = {
  'GET /api/v1/account-grants': 'listAccountGrants',
  'GET /api/v1/account-grants/{grantId}': 'getAccountGrant',
  'PATCH /api/v1/account-grants/{grantId}': 'updateAccountGrant',
  'POST /api/v1/account-grants/{grantId}/revoke': 'revokeAccountGrant',
  'GET /api/v1/accounts': 'listAccounts',
  'GET /api/v1/accounts/{accountId}': 'getAccount',
  'GET /api/v1/accounts/{accountId}/balances': 'listAccountBalances',
  'GET /api/v1/accounts/{accountId}/orders': 'listAccountOrders',
  'POST /api/v1/accounts/{accountId}/orders': 'createAccountOrder',
  'DELETE /api/v1/accounts/{accountId}/orders/{orderId}': 'cancelAccountOrder',
  'GET /api/v1/accounts/{accountId}/orders/{orderId}': 'getAccountOrder',
  'PATCH /api/v1/accounts/{accountId}/orders/{orderId}': 'modifyAccountOrder',
  'GET /api/v1/accounts/{accountId}/orders/{orderId}/events': 'getAccountOrderEvents',
  'GET /api/v1/accounts/{accountId}/orders/{orderId}/fills': 'getAccountOrderFills',
  'GET /api/v1/accounts/{accountId}/position-lots': 'listAccountPositionLots',
  'GET /api/v1/accounts/{accountId}/position-lots/{lotId}/fills': 'getAccountPositionLotFills',
  'GET /api/v1/accounts/{accountId}/positions': 'listAccountPositions',
  'GET /api/v1/accounts/{accountId}/transactions': 'listAccountTransactions',
  'GET /api/v1/accounts/{accountId}/{resource}': 'listAccountResource',
  'GET /api/v1/brokers/data/accounts': 'listFdxAccounts',
  'GET /api/v1/brokers/data/balances': 'listFdxBalances',
  'GET /api/v1/company/{company_id}': 'getCompany',
  'GET /api/v1/consents': 'listConsents',
  'POST /api/v1/consents': 'createConsent',
  'GET /api/v1/consents/{consentId}': 'getConsent',
  'POST /api/v1/consents/{consentId}/revoke': 'revokeConsent',
  'GET /api/v1/portal/oauth/completion/{token}': 'getPortalOauthCompletion',
  'POST /api/v1/portal/{sessionId}/account-grants': 'createPortalAccountGrant',
  'POST /api/v1/portal/{sessionId}/auth-attempts': 'createPortalAuthAttempt',
  'GET /api/v1/portal/{sessionId}/auth-attempts/{authAttemptId}': 'getPortalAuthAttempt',
  'POST /api/v1/portal/{sessionId}/complete': 'completePortalSession',
  'GET /api/v1/portal/{sessionId}/discovered-accounts': 'listDiscoveredAccounts',
  'GET /api/v1/portal/{sessionId}/institutions': 'listPortalInstitutions',
  'POST /api/v1/portal/{sessionId}/user-link': 'linkPortalUser',
  'GET /api/v1/portal/{token}': 'getPortal',
  'POST /api/v1/session/init': 'initLegacySession',
  'POST /api/v1/session/link-user': 'linkSessionUser',
  'POST /api/v1/session/mcp/link-user': 'linkMcpSessionUser',
  'GET /api/v1/session/portal': 'getLegacyPortalUrl',
  'POST /api/v1/session/start': 'startLegacySession',
  'GET /api/v1/session/{session_id}/user': 'getLegacySessionUser',
  'POST /api/v1/sessions': 'createSession',
  'GET /api/v1/sessions/{sessionId}': 'getSession',
  'POST /api/v1/sessions/{sessionId}/portal-links': 'createPortalLink',
  'GET /api/v1/sessions/{sessionId}/sync-status': 'getSessionSyncStatus',
  'GET /api/v1/sessions/{sessionId}/user': 'getSessionUser',
  'GET /api/v1/webhooks/catalog': 'getWebhookCatalog',
  'GET /api/v1/webhooks/payload-schema': 'getWebhookPayloadSchema',
  'GET /api/v1/webhooks/subscriptions': 'listWebhookSubscriptions',
  'POST /api/v1/webhooks/subscriptions': 'createWebhookSubscription',
  'PATCH /api/v1/webhooks/subscriptions/{subscriptionId}': 'updateWebhookSubscription',
  'POST /api/v1/webhooks/subscriptions/{subscriptionId}/revoke': 'revokeWebhookSubscription',
} as const;

describe('V1 account-first wrapper', () => {
  it('pins public facade methods for SDK and portal OpenAPI operations', () => {
    const wrapper = new V1Wrapper('fntc_test_key', createConfig(), createClient().client);

    expect(Object.keys(V1_OPENAPI_OPERATION_METHODS)).toHaveLength(52);
    for (const methodName of Object.values(V1_OPENAPI_OPERATION_METHODS)) {
      expect(typeof wrapper[methodName]).toBe('function');
    }
  });

  it('sends X-Finatic-Environment, server API key, and session headers', async () => {
    const { client, requests } = createClient();
    const wrapper = new V1Wrapper('fntc_test_key', createConfig(), client);
    wrapper.setSessionContext('session_123', 'company_123', 'csrf_123');

    const result = await wrapper.listPositions({ accountId: 'acct_123', limit: 25 });

    expect(result.traceId).toBe('trace-id');
    expect(result.data).toEqual({ ok: true });
    expect(requests[0]).toEqual(
      expect.objectContaining({
        method: 'GET',
        url: '/api/v1/accounts/acct_123/positions',
        params: { limit: 25 },
        headers: expect.objectContaining({
          'x-api-key': 'fntc_test_key',
          'X-Finatic-Environment': 'sandbox',
          'x-session-id': 'session_123',
          'x-company-id': 'company_123',
          'x-csrf-token': 'csrf_123',
        }),
      })
    );
  });

  it('uses current account-first session and grant routes', async () => {
    const { client, requests } = createClient();
    const wrapper = new V1Wrapper('fntc_test_key', createConfig(), client);

    await wrapper.createPortalLink('session_123');
    await wrapper.createPortalAuthAttempt('session_123', { brokerId: 'alpaca' });
    await wrapper.getPortalAuthAttempt('session_123', 'auth_attempt_123');
    await wrapper.createPortalAccountGrant('session_123', {
      accountId: 'account_123',
      authAttemptId: 'auth_attempt_123',
      canRead: true,
      canTrade: false,
    });
    await wrapper.completePortalSession('session_123');
    await wrapper.getSessionSyncStatus('session_123');

    expect(requests[0]).toEqual(
      expect.objectContaining({
        method: 'POST',
        url: '/api/v1/sessions/session_123/portal-links',
      })
    );
    expect(requests[1]).toEqual(
      expect.objectContaining({
        method: 'POST',
        url: '/api/v1/portal/session_123/auth-attempts',
        data: { brokerId: 'alpaca' },
      })
    );
    expect(requests[2]).toEqual(
      expect.objectContaining({
        method: 'GET',
        url: '/api/v1/portal/session_123/auth-attempts/auth_attempt_123',
      })
    );
    expect(requests[3]).toEqual(
      expect.objectContaining({
        method: 'POST',
        url: '/api/v1/portal/session_123/account-grants',
        data: expect.objectContaining({
          accountId: 'account_123',
          authAttemptId: 'auth_attempt_123',
        }),
      })
    );
    expect(requests[4]).toEqual(
      expect.objectContaining({
        method: 'POST',
        url: '/api/v1/portal/session_123/complete',
      })
    );
    expect(requests[5]).toEqual(
      expect.objectContaining({
        method: 'GET',
        url: '/api/v1/sessions/session_123/sync-status',
      })
    );
  });

  it('covers portal read, user-link, institution, discovery, and company routes', async () => {
    const { client, requests } = createClient();
    const wrapper = new V1Wrapper('fntc_test_key', createConfig(), client);

    await wrapper.getPortal('portal_token_123');
    await wrapper.getPortalOauthCompletion('oauth_token_123');
    await wrapper.linkPortalUser('session_123', { userId: 'user_123' });
    await wrapper.listPortalInstitutions('session_123');
    await wrapper.listDiscoveredAccounts('session_123', { authAttemptId: 'auth_attempt_123' });
    await wrapper.getCompany('company_123');

    expect(requests[0]).toEqual(
      expect.objectContaining({
        method: 'GET',
        url: '/api/v1/portal/portal_token_123',
      })
    );
    expect(requests[1]).toEqual(
      expect.objectContaining({
        method: 'GET',
        url: '/api/v1/portal/oauth/completion/oauth_token_123',
      })
    );
    expect(requests[2]).toEqual(
      expect.objectContaining({
        method: 'POST',
        url: '/api/v1/portal/session_123/user-link',
        data: { userId: 'user_123' },
      })
    );
    expect(requests[3]).toEqual(
      expect.objectContaining({
        method: 'GET',
        url: '/api/v1/portal/session_123/institutions',
      })
    );
    expect(requests[4]).toEqual(
      expect.objectContaining({
        method: 'GET',
        url: '/api/v1/portal/session_123/discovered-accounts',
        params: { authAttemptId: 'auth_attempt_123' },
      })
    );
    expect(requests[5]).toEqual(
      expect.objectContaining({
        method: 'GET',
        url: '/api/v1/company/company_123',
      })
    );
  });

  it('covers legacy session compatibility and FDX alias routes', async () => {
    const { client, requests } = createClient();
    const wrapper = new V1Wrapper('fntc_test_key', createConfig(), client);

    await wrapper.initLegacySession();
    await wrapper.startLegacySession({ oneTimeToken: 'ott_123', userId: 'user_123' });
    await wrapper.linkSessionUser({
      sessionId: 'session_123',
      userId: 'user_123',
      email: 'user@example.com',
      linkContextId: 'link_context_123',
    });
    await wrapper.linkMcpSessionUser({
      userId: 'user_123',
      linkContextId: 'mcp_link_context_123',
    });
    await wrapper.getLegacyPortalUrl();
    await wrapper.getLegacySessionUser('session_123');
    await wrapper.listFdxBalances({ account_id: 'account_123', limit: 25, offset: 5 });
    await wrapper.listFdxAccounts({ broker_id: 'alpaca', include_metadata: true });
    await wrapper.listAccountResource('orders', { accountId: 'account_123', limit: 10 });

    expect(requests[0]).toEqual(
      expect.objectContaining({ method: 'POST', url: '/api/v1/session/init' })
    );
    expect(requests[1]).toEqual(
      expect.objectContaining({
        method: 'POST',
        url: '/api/v1/session/start',
        data: { user_id: 'user_123' },
        headers: expect.objectContaining({ 'One-Time-Token': 'ott_123' }),
      })
    );
    expect(requests[2]).toEqual(
      expect.objectContaining({
        method: 'POST',
        url: '/api/v1/session/link-user',
        params: { session_id: 'session_123' },
        data: {
          user_id: 'user_123',
          email: 'user@example.com',
          link_context_id: 'link_context_123',
        },
      })
    );
    expect(requests[3]).toEqual(
      expect.objectContaining({
        method: 'POST',
        url: '/api/v1/session/mcp/link-user',
        data: { user_id: 'user_123', link_context_id: 'mcp_link_context_123' },
      })
    );
    expect(requests[4]).toEqual(
      expect.objectContaining({ method: 'GET', url: '/api/v1/session/portal' })
    );
    expect(requests[5]).toEqual(
      expect.objectContaining({ method: 'GET', url: '/api/v1/session/session_123/user' })
    );
    expect(requests[6]).toEqual(
      expect.objectContaining({
        method: 'GET',
        url: '/api/v1/brokers/data/balances',
        params: { account_id: 'account_123', limit: 25, offset: 5 },
      })
    );
    expect(requests[7]).toEqual(
      expect.objectContaining({
        method: 'GET',
        url: '/api/v1/brokers/data/accounts',
        params: { broker_id: 'alpaca', include_metadata: true },
      })
    );
    expect(requests[8]).toEqual(
      expect.objectContaining({
        method: 'GET',
        url: '/api/v1/accounts/account_123/orders',
        params: { limit: 10 },
      })
    );
  });

  it('uses API v1 revoke routes for grants, consents, and webhook subscriptions', async () => {
    const { client, requests } = createClient();
    const wrapper = new V1Wrapper('fntc_test_key', createConfig(), client);

    await wrapper.revokeAccountGrant('grant_123');
    await wrapper.revokeConsent('consent_123');
    await wrapper.revokeWebhookSubscription('subscription_123');

    expect(requests[0]).toEqual(
      expect.objectContaining({
        method: 'POST',
        url: '/api/v1/account-grants/grant_123/revoke',
      })
    );
    expect(requests[1]).toEqual(
      expect.objectContaining({
        method: 'POST',
        url: '/api/v1/consents/consent_123/revoke',
      })
    );
    expect(requests[2]).toEqual(
      expect.objectContaining({
        method: 'POST',
        url: '/api/v1/webhooks/subscriptions/subscription_123/revoke',
      })
    );
  });

  it('covers webhook subscription update route', async () => {
    const { client, requests } = createClient();
    const wrapper = new V1Wrapper('fntc_test_key', createConfig(), client);

    await wrapper.updateWebhookSubscription('subscription_123', { active: false });

    expect(requests[0]).toEqual(
      expect.objectContaining({
        method: 'PATCH',
        url: '/api/v1/webhooks/subscriptions/subscription_123',
        data: { active: false },
      })
    );
  });

  it('covers account trading commands and idempotency headers', async () => {
    const { client, requests } = createClient();
    const wrapper = new V1Wrapper('fntc_test_key', createConfig(), client);

    await wrapper.createAccountOrder({
      accountId: 'acct_123',
      idempotencyKey: 'idem_123',
      body: { order: { symbol: 'AAPL' } },
    });
    await wrapper.modifyAccountOrder({
      accountId: 'acct_123',
      orderId: 'order_123',
      idempotencyKey: 'idem_456',
      body: { order: { quantity: 2 } },
    });
    await wrapper.cancelAccountOrder({
      accountId: 'acct_123',
      orderId: 'order_123',
      idempotencyKey: 'idem_789',
    });

    expect(requests[0]).toEqual(
      expect.objectContaining({
        method: 'POST',
        url: '/api/v1/accounts/acct_123/orders',
        headers: expect.objectContaining({ 'Idempotency-Key': 'idem_123' }),
      })
    );
    expect(requests[1]).toEqual(
      expect.objectContaining({
        method: 'PATCH',
        url: '/api/v1/accounts/acct_123/orders/order_123',
        headers: expect.objectContaining({ 'Idempotency-Key': 'idem_456' }),
      })
    );
    expect(requests[2]).toEqual(
      expect.objectContaining({
        method: 'DELETE',
        url: '/api/v1/accounts/acct_123/orders/order_123',
        headers: expect.objectContaining({ 'Idempotency-Key': 'idem_789' }),
      })
    );
    expect(requests[2]?.data).toBeUndefined();
  });

  it('requires idempotency keys for account order commands', async () => {
    const { client } = createClient();
    const wrapper = new V1Wrapper('fntc_test_key', createConfig(), client);

    expect(() =>
      wrapper.createAccountOrder({
        accountId: 'acct_123',
        idempotencyKey: '',
        body: { order: { symbol: 'AAPL' } },
      })
    ).toThrow('idempotencyKey is required for account order commands');
    expect(() =>
      wrapper.modifyAccountOrder({
        accountId: 'acct_123',
        orderId: 'order_123',
        idempotencyKey: '   ',
      })
    ).toThrow('idempotencyKey is required for account order commands');
    expect(() =>
      wrapper.cancelAccountOrder({
        accountId: 'acct_123',
        orderId: 'order_123',
        idempotencyKey: '',
      })
    ).toThrow('idempotencyKey is required for account order commands');
  });

  it('keeps provider connection ids out of public v1 account params', () => {
    const params = ['accountId', 'limit', 'offset'];

    expect(params).not.toContain('connectionId');
    expect(params).not.toContain('user_broker_connection_id');
  });

  it('normalizes legacy envelope fields into the public v1 response shape', async () => {
    const client = {
      request: jest.fn(async () => ({
        data: {
          _id: 'legacy-trace-id',
          success: { data: { accountId: 'acct_123' } },
          warning: [{ code: 'STALE_DATA', message: 'Account data is stale' }],
          error: {
            code: 'PROVIDER_ERROR',
            message: 'Provider is temporarily unavailable',
            details: { provider: 'alpaca' },
          },
        },
      })),
    } as unknown as AxiosInstance;
    const wrapper = new V1Wrapper('fntc_test_key', createConfig(), client);

    const result = await wrapper.getAccount('acct_123');

    expect(result).toEqual({
      traceId: 'legacy-trace-id',
      data: { accountId: 'acct_123' },
      warnings: [{ code: 'STALE_DATA', message: 'Account data is stale' }],
      errors: [
        {
          code: 'PROVIDER_ERROR',
          message: 'Provider is temporarily unavailable',
          details: { provider: 'alpaca' },
        },
      ],
    });
  });

  it('normalizes axios HTTP errors into the public v1 error envelope', async () => {
    const client = {
      request: jest.fn(async () => {
        throw {
          isAxiosError: true,
          response: {
            status: 422,
            headers: { 'x-request-id': 'request-123' },
            data: { message: 'missing accountId' },
          },
        };
      }),
    } as unknown as AxiosInstance;
    const wrapper = new V1Wrapper('fntc_test_key', createConfig(), client);

    const result = await wrapper.getAccount('acct_123');

    expect(result).toEqual({
      traceId: 'request-123',
      data: null,
      warnings: [],
      errors: [
        {
          category: 'VALIDATION',
          code: 'VALIDATION',
          message: 'missing accountId',
          status: 422,
        },
      ],
    });
  });
});
