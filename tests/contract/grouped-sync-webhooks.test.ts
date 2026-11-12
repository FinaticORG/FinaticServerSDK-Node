import axios from 'axios';
import {
  FinaticServer,
  decodeGroupedSyncWebhook,
  FDXGroupedSyncEventType,
  FDXWebhookSubscriptionCreateEventTypesEnum as CreateEvent,
  FDXWebhookSubscriptionUpdateEventTypesEnum as UpdateEvent,
} from '../../src';
import type {
  FDXGroupedSyncWebhookPayload,
  FDXSyncSummaryData,
  FDXWebhookPayload,
  FDXWebhookSubscriptionCreate,
  FDXWebhookSubscriptionUpdate,
} from '../../src';
import provenance from '../../docs/grouped-sync-openapi-provenance.json';

function fixture(eventType: FDXGroupedSyncEventType): FDXGroupedSyncWebhookPayload {
  const data: FDXSyncSummaryData & { contractVersion: 'account.resource.sync-summary.v1' } = {
    contractVersion: 'account.resource.sync-summary.v1',
    batchId: '123e4567-e89b-42d3-a456-426614174000',
    origin: 'poll',
    completedAt: '2026-11-12T10:00:00Z',
    changeCounts: { created: 2, updated: 1, deleted: 0, unchanged: 7 },
    result: { resourceUrl: '/api/v1/accounts/acct_123/transactions', cursor: 'immutable-cursor' },
  };
  const envelope = {
    schemaVersion: 'v1' as const,
    eventId: 'evt_123',
    createdAt: '2026-11-12T10:00:00Z',
    environment: 'sandbox' as const,
    companyAccountId: 'company_123',
    accountId: 'acct_123',
    grantId: null,
    resource: {
      resourceType: 'account',
      resourceId: 'acct_123',
      accountId: 'acct_123',
      grantId: null,
    },
  };
  if (eventType === 'account.orders.updated') {
    return {
      ...envelope,
      eventType,
      data: {
        ...data,
        changeCounts: { ...data.changeCounts, fillsCreated: 3 },
        result: { ...data.result, resourceUrl: '/api/v1/accounts/acct_123/orders' },
      },
    };
  }
  return { ...envelope, eventType, data };
}

describe('account-first grouped sync webhooks', () => {
  afterEach(() => jest.restoreAllMocks());

  it.each([
    [CreateEvent.AccountOrdersUpdated, UpdateEvent.AccountOrdersUpdated],
    [CreateEvent.AccountTransactionsUpdated, UpdateEvent.AccountTransactionsUpdated],
  ])(
    'subscribes and updates %s through the public v1 wrapper',
    async (createEvent, updateEvent) => {
      const request = jest.spyOn(axios.Axios.prototype, 'request').mockResolvedValue({
        data: { trace_id: 'trace_123', success: { data: { id: 'sub_123' } } },
      });
      const sdk = new FinaticServer('fntc_test_key', { apiEnvironment: 'sandbox' });
      const create: FDXWebhookSubscriptionCreate = {
        url: 'https://example.com/webhooks',
        eventTypes: [createEvent],
      };
      const update: FDXWebhookSubscriptionUpdate = { eventTypes: [updateEvent] };
      await sdk.v1.createWebhookSubscription(create);
      await sdk.v1.updateWebhookSubscription('sub_123', update);
      expect(request).toHaveBeenNthCalledWith(
        1,
        expect.objectContaining({
          method: 'POST',
          url: '/api/v1/webhooks/subscriptions',
          data: create,
        })
      );
      expect(request).toHaveBeenNthCalledWith(
        2,
        expect.objectContaining({
          method: 'PATCH',
          url: '/api/v1/webhooks/subscriptions/sub_123',
          data: update,
        })
      );
    }
  );

  it.each(Object.values(FDXGroupedSyncEventType))(
    'decodes %s from JSON and unknown without any casts',
    (eventType) => {
      const expected = fixture(eventType);
      const wirePayload: FDXWebhookPayload = expected;
      const parsed: unknown = JSON.parse(JSON.stringify(wirePayload));
      const decoded = decodeGroupedSyncWebhook(parsed);
      expect(decoded).toEqual(expected);
      expect(decodeGroupedSyncWebhook(JSON.stringify(expected))).toEqual(expected);
      const cursor: string = decoded.data.result.cursor;
      const version: 'account.resource.sync-summary.v1' = decoded.data.contractVersion;
      expect(cursor).toBe('immutable-cursor');
      expect(version).toBe('account.resource.sync-summary.v1');
      if (decoded.eventType === 'account.orders.updated') {
        const fills: number = decoded.data.changeCounts.fillsCreated;
        expect(fills).toBe(3);
      }
    }
  );

  it('applies optional artifact defaults and accepts initial sync and timestamp offsets', () => {
    const { schemaVersion, accountId, grantId, ...payload } = fixture(
      'account.transactions.updated'
    );
    const { contractVersion, ...data } = payload.data;
    const decoded = decodeGroupedSyncWebhook({
      ...payload,
      data: { ...data, origin: 'initialSync', completedAt: '2026-11-12T05:00:00-05:00' },
    });
    expect(decoded).toMatchObject({
      schemaVersion: 'v1',
      accountId: null,
      grantId: null,
      data: { contractVersion: 'account.resource.sync-summary.v1', origin: 'initialSync' },
    });
  });

  it.each([
    { contractVersion: 'account.resource.sync-summary.v2' },
    { batchId: 'not-a-uuid' },
    { origin: 'manual' },
    { completedAt: 'yesterday' },
    { changeCounts: { created: -1, updated: 0, deleted: 0, unchanged: 0 } },
    { changeCounts: { created: 0.5, updated: 0, deleted: 0, unchanged: 0 } },
    { changeCounts: { created: 0, updated: 0, deleted: 0 } },
    { result: { resourceUrl: '', cursor: 'cursor' } },
    { result: { resourceUrl: '/orders', cursor: '' } },
    { result: { resourceUrl: '/orders' } },
    { unexpected: true },
  ])('rejects malformed summary data: %j', (patch) => {
    const payload = fixture('account.transactions.updated');
    expect(() =>
      decodeGroupedSyncWebhook({ ...payload, data: { ...payload.data, ...patch } })
    ).toThrow();
  });

  it('rejects missing order fills, non-grouped events, absent data and malformed JSON', () => {
    const payload = fixture('account.transactions.updated');
    expect(() =>
      decodeGroupedSyncWebhook({ ...payload, eventType: 'account.orders.updated' })
    ).toThrow();
    expect(() => decodeGroupedSyncWebhook({ ...payload, eventType: 'order.updated' })).toThrow();
    const { data, ...withoutData } = payload;
    expect(() => decodeGroupedSyncWebhook(withoutData)).toThrow();
    expect(() => decodeGroupedSyncWebhook('{')).toThrow();
    expect(() => decodeGroupedSyncWebhook(null)).toThrow();
  });

  it('keeps the complete pinned subscription catalogs, including existing FDX events', () => {
    expect(Object.values(CreateEvent)).toEqual(
      provenance.schemas.FDXWebhookSubscriptionCreate.properties.eventTypes.items.enum
    );
    expect(Object.values(UpdateEvent)).toEqual(
      provenance.schemas.FDXWebhookSubscriptionUpdate.properties.eventTypes.anyOf[0]?.items?.enum
    );
    expect(provenance.artifactSha256).toBe(
      '3e214865c34bfdf7735561fe8a4d0989feeba664901f59b7525614e601d11470'
    );
  });

  it('keeps contract literals narrow at compile time', () => {
    // @ts-expect-error unknown grouped names are not part of the supported contract
    const wrongEvent: FDXGroupedSyncEventType = 'account.orders.created';
    // @ts-expect-error only the pinned summary contract version is supported
    const wrongVersion: FDXSyncSummaryData['contractVersion'] = 'v2';
    expect(wrongEvent).toBeDefined();
    expect(wrongVersion).toBeDefined();
  });
});
