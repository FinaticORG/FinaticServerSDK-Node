import axios from 'axios';

import { V1Wrapper } from '../src/wrappers/v1';
import { defaultConfig } from '../src/config';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

const mockRequest = jest.fn();

function mockAxiosResponse() {
  mockRequest.mockResolvedValue({
    status: 200,
    data: {
      success: { data: { ok: true }, meta: null },
      error: null,
      warning: null,
    },
    headers: { 'x-trace-id': 'trace-smoke' },
  });
  mockedAxios.create.mockReturnValue({
    request: mockRequest,
  } as unknown as ReturnType<typeof axios.create>);
  mockedAxios.isAxiosError.mockReturnValue(false);
}

describe('V1Wrapper smoke coverage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAxiosResponse();
  });

  it('invokes account, grant, and webhook v1 data routes', async () => {
    const v1 = new V1Wrapper('test-api-key', defaultConfig);
    v1.setSessionContext('session-id', 'company-id', 'csrf-token');

    const accountParams = { accountId: 'account-id', limit: 10, offset: 0 };
    const orderParams = { accountId: 'account-id', orderId: 'order-id' };

    const calls: Array<Promise<unknown>> = [
      v1.getPortalUrl({ theme: 'dark' }),
      v1.getSessionUser(),
      v1.listAccounts({ limit: 10, offset: 0 }),
      v1.getAccount('account-id'),
      v1.listBalances(accountParams),
      v1.listPositions(accountParams),
      v1.listTransactions(accountParams),
      v1.listOrders(accountParams),
      v1.listAccountResource('orders', accountParams),
      v1.getAccountOrder(orderParams),
      v1.getAccountOrderFills(orderParams),
      v1.getAccountOrderEvents(orderParams),
      v1.createAccountOrder({
        accountId: 'account-id',
        idempotencyKey: 'idem-1',
        body: { symbol: 'AAPL', side: 'buy', quantity: 1 },
      }),
      v1.modifyAccountOrder({
        accountId: 'account-id',
        orderId: 'order-id',
        idempotencyKey: 'idem-2',
        body: { quantity: 2 },
      }),
      v1.cancelAccountOrder({
        accountId: 'account-id',
        orderId: 'order-id',
        idempotencyKey: 'idem-3',
      }),
      v1.listAccountGrants(),
      v1.getAccountGrant('grant-id'),
      v1.updateAccountGrant('grant-id', { canRead: true }),
      v1.revokeAccountGrant('grant-id'),
      v1.getWebhookCatalog(),
      v1.getWebhookPayloadSchema(),
      v1.listWebhookSubscriptions(),
      v1.createWebhookSubscription({ url: 'https://example.com/hook' }),
      v1.updateWebhookSubscription('subscription-id', { enabled: true }),
      v1.revokeWebhookSubscription('subscription-id'),
    ];

    await Promise.allSettled(calls);

    expect(mockRequest.mock.calls.length).toBeGreaterThan(15);
  });
});
