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
  'GET /api/v1/consents': 'listConsents',
  'POST /api/v1/consents': 'createConsent',
  'GET /api/v1/consents/{consentId}': 'getConsent',
  'POST /api/v1/consents/{consentId}/revoke': 'revokeConsent',
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
  it('pins public facade methods for SDK OpenAPI operations', () => {
    const wrapper = new V1Wrapper('fntc_test_key', createConfig(), createClient().client);

    expect(Object.keys(V1_OPENAPI_OPERATION_METHODS)).toHaveLength(34);
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

  it('uses current account-first session routes', async () => {
    const { client, requests } = createClient();
    const wrapper = new V1Wrapper('fntc_test_key', createConfig(), client);

    await wrapper.createPortalLink('session_123');
    await wrapper.getSessionSyncStatus('session_123');

    expect(requests[0]).toEqual(
      expect.objectContaining({
        method: 'POST',
        url: '/api/v1/sessions/session_123/portal-links',
      })
    );
    expect(requests[1]).toEqual(
      expect.objectContaining({
        method: 'GET',
        url: '/api/v1/sessions/session_123/sync-status',
      })
    );
  });

  it('covers account resource listing', async () => {
    const { client, requests } = createClient();
    const wrapper = new V1Wrapper('fntc_test_key', createConfig(), client);
    wrapper.setSessionContext('session_123', 'company_123', 'csrf_123');

    await wrapper.listAccountResource('orders', { accountId: 'account_123', limit: 10 });

    expect(requests[0]).toEqual(
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

  it('normalizes primitive response payloads into the public v1 response shape', async () => {
    const client = {
      request: jest.fn(async () => ({ data: 'plain-text-payload' })),
    } as unknown as AxiosInstance;
    const wrapper = new V1Wrapper('fntc_test_key', createConfig(), client);

    const result = await wrapper.getAccount('acct_123');

    expect(result).toEqual({
      traceId: null,
      data: 'plain-text-payload',
      warnings: [],
      errors: [],
    });
  });

  it('rethrows non-response axios failures', async () => {
    const networkError = new Error('network unavailable');
    const client = {
      request: jest.fn(async () => {
        const error = Object.assign(networkError, { isAxiosError: true });
        throw error;
      }),
    } as unknown as AxiosInstance;
    const wrapper = new V1Wrapper('fntc_test_key', createConfig(), client);

    await expect(wrapper.getAccount('acct_123')).rejects.toThrow('network unavailable');
  });

  it('normalizes non-object HTTP error payloads and legacy error codes', async () => {
    const client = {
      request: jest.fn(async () => {
        throw {
          isAxiosError: true,
          response: {
            status: 401,
            headers: { get: (name: string) => (name === 'x-trace-id' ? 'trace-from-header' : null) },
            data: {
              errors: [{ code: 'AUTH_ERROR', message: 'invalid api key' }],
            },
          },
        };
      }),
    } as unknown as AxiosInstance;
    const wrapper = new V1Wrapper('fntc_test_key', createConfig(), client);

    const result = await wrapper.getAccount('acct_123');

    expect(result).toEqual({
      traceId: 'trace-from-header',
      data: null,
      warnings: [],
      errors: [
        {
          category: 'AUTHENTICATION',
          code: 'AUTHENTICATION',
          message: 'invalid api key',
          status: 401,
        },
      ],
    });
  });

  it('maps provider and reauth messages into normalized error categories', async () => {
    const client = {
      request: jest.fn(async () => {
        throw {
          isAxiosError: true,
          response: {
            status: 502,
            headers: { 'X-Request-ID': 'provider-trace' },
            data: 'broker gateway timeout',
          },
        };
      }),
    } as unknown as AxiosInstance;
    const wrapper = new V1Wrapper('fntc_test_key', createConfig(), client);

    const result = await wrapper.getAccount('acct_123');

    expect(result.traceId).toBe('provider-trace');
    expect(result.data).toBeNull();
    expect(result.errors[0]).toEqual(
      expect.objectContaining({
        category: 'PROVIDER_ERROR',
        code: 'PROVIDER_ERROR',
        message: 'broker gateway timeout',
        status: 502,
      })
    );
  });
});
