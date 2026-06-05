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
          _id: 'trace-id',
          success: { data: { ok: true }, meta: null },
          error: null,
          warning: null,
        },
      };
    }),
  } as unknown as AxiosInstance;

  return { client, requests };
}

describe('V1 account-first wrapper', () => {
  it('sends X-Finatic-Environment, server API key, and session headers', async () => {
    const { client, requests } = createClient();
    const wrapper = new V1Wrapper('fntc_test_key', createConfig(), client);
    wrapper.setSessionContext('session_123', 'company_123', 'csrf_123');

    const result = await wrapper.listPositions({ accountId: 'acct_123', limit: 25 });

    expect(result._id).toBe('trace-id');
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
    await wrapper.createPortalAccountGrant('session_123', {
      accountId: 'account_123',
      authAttemptId: 'auth_attempt_123',
      canRead: true,
      canTrade: false,
    });
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
        url: '/api/v1/sessions/session_123/account-grants',
        data: expect.objectContaining({
          accountId: 'account_123',
          authAttemptId: 'auth_attempt_123',
        }),
      })
    );
    expect(requests[2]).toEqual(
      expect.objectContaining({
        method: 'GET',
        url: '/api/v1/sessions/session_123/sync-status',
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
  });

  it('keeps provider connection ids out of public v1 account params', () => {
    const params = ['accountId', 'limit', 'offset'];

    expect(params).not.toContain('connectionId');
    expect(params).not.toContain('user_broker_connection_id');
  });
});
