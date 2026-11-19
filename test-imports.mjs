import {
  FDXFutureInstrumentDetailsIdentityQualityEnum,
  FDXInstrumentDescriptorVersionEnum,
  FinaticServer,
  decodeGroupedSyncWebhook,
  FDXGroupedSyncEventType,
  FDXWebhookSubscriptionCreateEventTypesEnum,
  FDXWebhookSubscriptionUpdateEventTypesEnum,
} from './dist/index.mjs';

if (typeof FinaticServer !== 'function') {
  throw new Error(`Expected FinaticServer to be constructible, got ${typeof FinaticServer}`);
}

const esmClient = new FinaticServer('fntc_test_key');
if (typeof esmClient.v1.getSessionSyncStatus !== 'function') {
  throw new Error('Expected getSessionSyncStatus in the ESM package');
}

if (
  FDXFutureInstrumentDetailsIdentityQualityEnum.Exact !== 'EXACT' ||
  FDXInstrumentDescriptorVersionEnum._10 !== '1.0'
) {
  throw new Error('Expected exact instrument descriptor enums in the ESM package');
}

for (const eventType of Object.values(FDXGroupedSyncEventType)) {
  if (
    !Object.values(FDXWebhookSubscriptionCreateEventTypesEnum).includes(eventType) ||
    !Object.values(FDXWebhookSubscriptionUpdateEventTypesEnum).includes(eventType)
  ) {
    throw new Error('Expected grouped events in both subscription enums');
  }
  const event = decodeGroupedSyncWebhook({
    eventId: 'evt_import',
    eventType,
    createdAt: '2026-11-12T10:00:00Z',
    environment: 'sandbox',
    companyAccountId: 'company_123',
    resource: { resourceType: 'account', resourceId: 'acct_123' },
    data: {
      batchId: '123e4567-e89b-42d3-a456-426614174000',
      origin: 'poll',
      completedAt: '2026-11-12T10:00:00Z',
      changeCounts: { created: 1, updated: 0, deleted: 0, unchanged: 0, fillsCreated: 1 },
      result: { resourceUrl: '/api/v1/accounts/acct_123/orders', cursor: 'cursor' },
    },
  });
  if (event.data.contractVersion !== 'account.resource.sync-summary.v1') {
    throw new Error('Expected typed grouped summary decoder in the built package');
  }
}
