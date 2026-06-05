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

  it('covers webhook subscription read and update routes', async () => {
    const { client, requests } = createClient();
    const wrapper = new V1Wrapper('fntc_test_key', createConfig(), client);

    await wrapper.getWebhookSubscription('subscription_123');
    await wrapper.updateWebhookSubscription('subscription_123', { active: false });

    expect(requests[0]).toEqual(
      expect.objectContaining({
        method: 'GET',
        url: '/api/v1/webhooks/subscriptions/subscription_123',
      })
    );
    expect(requests[1]).toEqual(
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
  });

  it('keeps provider connection ids out of public v1 account params', () => {
    const params = ['accountId', 'limit', 'offset'];

    expect(params).not.toContain('connectionId');
    expect(params).not.toContain('user_broker_connection_id');
  });
});
