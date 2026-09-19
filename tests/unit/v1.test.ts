import type { AxiosInstance, AxiosRequestConfig } from 'axios';

import {
  FDXFutureInstrumentDetailsIdentityQualityEnum,
  FDXInstrumentDescriptorVersionEnum,
} from '../../src';
import type { FDXInstrumentDescriptor } from '../../src';
import { V1Wrapper } from '../../src/wrappers/v1';
import type { SdkConfig } from '../../src/config';

function createConfig(): SdkConfig {
  return {
    apiEnvironment: 'sandbox',
    baseUrl: 'https://api.test',
    timeout: 30000,
    headers: {},
    logLevel: 'error',
    structuredLogging: false,
    logRequestBody: false,
    logResponseBody: false,
    logRequestId: true,
    validationEnabled: true,
    validationStrict: false,
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

function createResponseClient(responses: Record<string, unknown>[]): {
  client: AxiosInstance;
  requests: AxiosRequestConfig[];
} {
  const requests: AxiosRequestConfig[] = [];
  const client = {
    request: jest.fn(async (config: AxiosRequestConfig) => {
      requests.push(config);
      const response = responses.shift();
      if (!response) {
        throw new Error('Unexpected request');
      }
      return { data: response };
    }),
  } as unknown as AxiosInstance;

  return { client, requests };
}

function successEnvelope(data: unknown): Record<string, unknown> {
  return {
    traceId: 'trace-id',
    data,
    warnings: [],
    errors: [],
  };
}

const V1_DATA_METHODS = [
  'listAccounts',
  'getAccount',
  'listBalances',
  'listPositions',
  'listTransactions',
  'listOrders',
  'listAccountResource',
  'getAccountOrder',
  'getAccountOrderFills',
  'getAccountOrderEvents',
  'createAccountOrder',
  'modifyAccountOrder',
  'cancelAccountOrder',
  'listAccountGrants',
  'getAccountGrant',
  'updateAccountGrant',
  'revokeAccountGrant',
  'getWebhookCatalog',
  'getWebhookPayloadSchema',
  'listWebhookSubscriptions',
  'createWebhookSubscription',
  'updateWebhookSubscription',
  'revokeWebhookSubscription',
] as const;

describe('V1 account-first wrapper', () => {
  const exactInstrument: FDXInstrumentDescriptor = {
    assetType: 'FUTURE',
    displaySymbol: 'MGCZ6',
    finaticInstrumentId: 'finatic:future:MGCZ6',
    version: FDXInstrumentDescriptorVersionEnum._10,
    future: {
      contractCode: 'MGCZ6',
      contractMonth: '2026-12',
      identityQuality: FDXFutureInstrumentDetailsIdentityQualityEnum.Exact,
      productRoot: 'MGC',
    },
  };

  const rootOnlyInstrument: FDXInstrumentDescriptor = {
    assetType: 'FUTURE',
    displaySymbol: 'MGC',
    finaticInstrumentId: 'finatic:future-root:MGC',
    version: FDXInstrumentDescriptorVersionEnum._10,
    future: {
      identityQuality: FDXFutureInstrumentDetailsIdentityQualityEnum.RootOnly,
      productRoot: 'MGC',
    },
  };

  it('pins public data facade methods (session bootstrap is on FinaticServer only)', () => {
    const wrapper = new V1Wrapper('fntc_test_key', createConfig(), createClient().client);

    for (const methodName of V1_DATA_METHODS) {
      expect(typeof wrapper[methodName]).toBe('function');
    }
    expect(typeof (wrapper as unknown as Record<string, unknown>)['createPortalLink']).toBe(
      'undefined'
    );
    expect(typeof (wrapper as unknown as Record<string, unknown>)['createSession']).toBe(
      'undefined'
    );
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

  it('uses API v1 revoke routes for grants and webhook subscriptions', async () => {
    const { client, requests } = createClient();
    const wrapper = new V1Wrapper('fntc_test_key', createConfig(), client);

    await wrapper.revokeAccountGrant('grant_123');
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

  it('types exact and root-only descriptors on default order and position results', async () => {
    const { client } = createResponseClient([
      successEnvelope([
        {
          accountId: 'acct_123',
          orderId: 'order_123',
          status: 'OPEN',
          legs: [{ legIndex: 0, instrument: exactInstrument }],
        },
      ]),
      successEnvelope([
        {
          accountId: 'acct_123',
          connectionId: 'connection_123',
          assetType: 'FUTURE',
          quantity: 1,
          securityId: 'MGC',
          securityIdType: 'SYMBOL',
          instrument: rootOnlyInstrument,
        },
      ]),
    ]);
    const wrapper = new V1Wrapper('fntc_test_key', createConfig(), client);

    const orders = await wrapper.listOrders({ accountId: 'acct_123' });
    const positions = await wrapper.listPositions({ accountId: 'acct_123' });

    const orderDescriptor = orders.data?.[0]?.legs?.[0]?.instrument;
    const positionDescriptor = positions.data?.[0]?.instrument;
    expect(orderDescriptor?.finaticInstrumentId).toBe('finatic:future:MGCZ6');
    expect(orderDescriptor?.future?.identityQuality).toBe(
      FDXFutureInstrumentDetailsIdentityQualityEnum.Exact
    );
    expect(positionDescriptor?.finaticInstrumentId).toBe('finatic:future-root:MGC');
    expect(positionDescriptor?.future?.contractCode).toBeUndefined();
  });

  it('preserves ordered multi-leg event descriptors in both response envelope shapes', async () => {
    const event = {
      eventId: 'event_123',
      eventTime: '2026-09-19T12:00:00Z',
      eventType: 'FILL',
      orderId: 'order_123',
      affectedLegs: [0, 1],
      affectedInstruments: [exactInstrument, rootOnlyInstrument],
    };
    const { client } = createResponseClient([
      {
        traceId: 'modern-trace',
        data: [event],
        warnings: [],
        errors: [],
      },
      {
        _id: 'legacy-trace',
        success: { data: [event] },
        warning: null,
        error: null,
      },
    ]);
    const wrapper = new V1Wrapper('fntc_test_key', createConfig(), client);

    const modern = await wrapper.getAccountOrderEvents({
      accountId: 'acct_123',
      orderId: 'order_123',
    });
    const legacy = await wrapper.getAccountOrderEvents({
      accountId: 'acct_123',
      orderId: 'order_123',
    });

    expect(modern.data?.[0]?.affectedLegs).toEqual([0, 1]);
    expect(modern.data?.[0]?.affectedInstruments?.map((item) => item.displaySymbol)).toEqual([
      'MGCZ6',
      'MGC',
    ]);
    expect(legacy.data?.[0]?.affectedInstruments?.[0]).toEqual(exactInstrument);
  });

  it('serializes canonical and provider-native placement identifiers unchanged', async () => {
    const { client, requests } = createClient();
    const wrapper = new V1Wrapper('fntc_test_key', createConfig(), client);

    await wrapper.createAccountOrder({
      accountId: 'acct_123',
      idempotencyKey: 'idem_123',
      body: {
        broker: 'tradestation',
        order: {
          finaticInstrumentId: 'finatic:future:MGCZ6',
          instrumentId: 418,
          symbol: 'MGCZ6',
        },
      },
    });

    expect(requests[0]?.data).toEqual({
      broker: 'tradestation',
      order: {
        finaticInstrumentId: 'finatic:future:MGCZ6',
        instrumentId: 418,
        symbol: 'MGCZ6',
      },
    });
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
            headers: {
              get: (name: string) => (name === 'x-trace-id' ? 'trace-from-header' : null),
            },
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
      traceId: null,
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

describe('V1 session start results', () => {
  it('returns and stores the server-authoritative identity for an active session', async () => {
    const { client, requests } = createResponseClient([
      successEnvelope({
        session_id: 'session_123',
        company_id: 'company_123',
        csrf_token: 'csrf_123',
        status: 'active',
        user_id: 'server_user_123',
        provided_user_id_rejected: false,
        portal_connection_management_pending: false,
      }),
    ]);
    const wrapper = new V1Wrapper('fntc_test_key', createConfig(), client);

    const result = await wrapper.startSession({
      oneTimeToken: 'token_123',
      userId: 'caller_user_123',
    });

    expect(result).toEqual({
      success: true,
      session_id: 'session_123',
      company_id: 'company_123',
      error: null,
      status: 'active',
      user_id: 'server_user_123',
      provided_user_id_rejected: false,
      portal_connection_management_pending: false,
      authenticated: true,
    });
    expect(wrapper.getUserId()).toBe('server_user_123');
    expect(wrapper.isAuthed()).toBe(true);
    expect(requests[0]).toEqual(
      expect.objectContaining({
        url: '/api/v1/session/start',
        data: { user_id: 'caller_user_123' },
        headers: expect.objectContaining({ 'One-Time-Token': 'token_123' }),
      })
    );
  });

  it.each(['valid-looking-user-id', 'not-a-uuid'])(
    'fails closed when the server rejects caller identity %s',
    async (callerUserId) => {
      const { client, requests } = createResponseClient([
        successEnvelope({
          session_id: 'session_rejected',
          company_id: 'company_123',
          status: 'authenticating',
          user_id: null,
          provided_user_id_rejected: true,
          portal_connection_management_pending: false,
        }),
      ]);
      const wrapper = new V1Wrapper('fntc_test_key', createConfig(), client);

      const result = await wrapper.startSession({
        oneTimeToken: 'token_123',
        userId: callerUserId,
      });

      expect(result).toEqual(
        expect.objectContaining({
          success: true,
          status: 'authenticating',
          user_id: null,
          provided_user_id_rejected: true,
          authenticated: false,
        })
      );
      expect(wrapper.getUserId()).toBeUndefined();
      expect(wrapper.isAuthed()).toBe(false);
      expect(requests[0]?.data).toEqual({ user_id: callerUserId });
    }
  );

  it('normalizes automatic-token starts to the same result shape without inventing identity', async () => {
    const { client, requests } = createResponseClient([
      successEnvelope({ one_time_token: 'minted_token' }),
      successEnvelope({
        session_id: 'session_portal',
        company_id: 'company_123',
        status: 'authenticating',
        user_id: null,
        provided_user_id_rejected: false,
        portal_connection_management_pending: true,
      }),
    ]);
    const wrapper = new V1Wrapper('fntc_test_key', createConfig(), client);

    const result = await wrapper.startSession();

    expect(result).toEqual({
      success: true,
      session_id: 'session_portal',
      company_id: 'company_123',
      error: null,
      status: 'authenticating',
      user_id: null,
      provided_user_id_rejected: false,
      portal_connection_management_pending: true,
      authenticated: false,
    });
    expect(requests).toHaveLength(2);
    expect(requests[0]).toEqual(expect.objectContaining({ url: '/api/v1/session/init' }));
    expect(requests[1]).toEqual(
      expect.objectContaining({
        url: '/api/v1/session/start',
        data: {},
        headers: expect.objectContaining({ 'One-Time-Token': 'minted_token' }),
      })
    );
  });

  it('clears identity from an earlier authenticated session when a later start is userless', async () => {
    const { client } = createResponseClient([
      successEnvelope({
        session_id: 'session_active',
        company_id: 'company_123',
        status: 'active',
        user_id: 'server_user_123',
      }),
      successEnvelope({
        session_id: 'session_rejected',
        company_id: 'company_123',
        status: 'authenticating',
        user_id: null,
        provided_user_id_rejected: true,
      }),
    ]);
    const wrapper = new V1Wrapper('fntc_test_key', createConfig(), client);

    await wrapper.startSession({ oneTimeToken: 'token_1', userId: 'server_user_123' });
    expect(wrapper.getUserId()).toBe('server_user_123');

    const rejected = await wrapper.startSession({
      oneTimeToken: 'token_2',
      userId: 'rejected_user',
    });

    expect(rejected.authenticated).toBe(false);
    expect(wrapper.getUserId()).toBeUndefined();
    expect(wrapper.isAuthed()).toBe(false);
  });

  it('accepts only contract-valid status and boolean values', async () => {
    const { client } = createResponseClient([
      successEnvelope({
        session_id: 'session_unknown',
        company_id: 'company_123',
        status: 'ACTIVE',
        user_id: 'server_user_123',
        provided_user_id_rejected: 'true',
        portal_connection_management_pending: 1,
      }),
    ]);
    const wrapper = new V1Wrapper('fntc_test_key', createConfig(), client);

    const result = await wrapper.startSession({ oneTimeToken: 'token_123' });

    expect(result).toEqual(
      expect.objectContaining({
        status: null,
        provided_user_id_rejected: false,
        portal_connection_management_pending: false,
        authenticated: false,
      })
    );
    expect(wrapper.getUserId()).toBeUndefined();
    expect(wrapper.isAuthed()).toBe(false);
  });

  it.each(['pending', 'authenticating', 'completed', 'expired', 'unknown'])(
    'does not retain a server identity for unauthenticated status %s',
    async (status) => {
      const { client } = createResponseClient([
        successEnvelope({
          session_id: `session_${status}`,
          company_id: 'company_123',
          status,
          user_id: 'server_user_123',
        }),
      ]);
      const wrapper = new V1Wrapper('fntc_test_key', createConfig(), client);

      const result = await wrapper.startSession({ oneTimeToken: 'token_123' });

      expect(result.authenticated).toBe(false);
      expect(wrapper.getUserId()).toBeUndefined();
      expect(wrapper.isAuthed()).toBe(false);
    }
  );

  it('preserves supplied-token throws and returns safe fields for automatic-token failures', async () => {
    const errorEnvelope = {
      traceId: 'trace-id',
      data: null,
      warnings: [],
      errors: [{ code: 'AUTHENTICATION', message: 'token rejected' }],
    };
    const direct = createResponseClient([errorEnvelope]);
    const directWrapper = new V1Wrapper('fntc_test_key', createConfig(), direct.client);

    await expect(directWrapper.startSession({ oneTimeToken: 'bad_token' })).rejects.toThrow(
      'token rejected'
    );

    const automatic = createResponseClient([errorEnvelope]);
    const automaticWrapper = new V1Wrapper('fntc_test_key', createConfig(), automatic.client);
    await expect(automaticWrapper.startSession()).resolves.toEqual({
      success: false,
      session_id: null,
      company_id: null,
      error: 'token rejected',
      status: null,
      user_id: null,
      provided_user_id_rejected: false,
      portal_connection_management_pending: false,
      authenticated: false,
    });
  });
});
