/** Account-first grouped webhook decoding; signature verification remains the caller's responsibility. */
import { z } from 'zod';
import type { FDXWebhookPayload } from './openapi/models/fdxwebhook-payload';
import type { FDXSyncSummaryData } from './openapi/models/fdxsync-summary-data';
import type { FDXOrdersSyncSummaryChangeCounts } from './openapi/models/fdxorders-sync-summary-change-counts';

export const FDXGroupedSyncEventType = {
  AccountOrdersUpdated: 'account.orders.updated',
  AccountTransactionsUpdated: 'account.transactions.updated',
} as const;

export type FDXGroupedSyncEventType =
  (typeof FDXGroupedSyncEventType)[keyof typeof FDXGroupedSyncEventType];

type SummaryEnvelope = Omit<FDXWebhookPayload, 'eventType' | 'data'>;
type SummaryData = FDXSyncSummaryData & {
  contractVersion: 'account.resource.sync-summary.v1';
};

/** Grouped order events include fills; narrowing eventType narrows the data contract. */
export type FDXGroupedSyncWebhookPayload =
  | (SummaryEnvelope & {
      eventType: 'account.orders.updated';
      data: SummaryData & { changeCounts: FDXOrdersSyncSummaryChangeCounts };
    })
  | (SummaryEnvelope & {
      eventType: 'account.transactions.updated';
      data: SummaryData;
    });

const count = z.number().int().nonnegative();
const changeCounts = z.strictObject({
  created: count,
  updated: count,
  deleted: count,
  unchanged: count,
});
const ordersChangeCounts = changeCounts.extend({ fillsCreated: count });
const summary = z.strictObject({
  contractVersion: z
    .literal('account.resource.sync-summary.v1')
    .default('account.resource.sync-summary.v1'),
  batchId: z.uuid(),
  origin: z.enum(['initialSync', 'poll']),
  completedAt: z.iso.datetime({ offset: true }),
  changeCounts: z.union([ordersChangeCounts, changeCounts]),
  result: z.strictObject({ resourceUrl: z.string().min(1), cursor: z.string().min(1) }),
});
const envelope = {
  schemaVersion: z.literal('v1').default('v1'),
  eventId: z.string(),
  createdAt: z.iso.datetime({ offset: true }),
  environment: z.enum(['live', 'sandbox']),
  companyAccountId: z.string(),
  accountId: z.string().nullable().default(null),
  grantId: z.string().nullable().default(null),
  resource: z.strictObject({
    resourceType: z.string(),
    resourceId: z.string(),
    accountId: z.string().nullable().default(null),
    grantId: z.string().nullable().default(null),
  }),
};
const groupedSummary = z.discriminatedUnion('eventType', [
  z.strictObject({
    ...envelope,
    eventType: z.literal(FDXGroupedSyncEventType.AccountOrdersUpdated),
    data: summary.extend({ changeCounts: ordersChangeCounts }),
  }),
  z.strictObject({
    ...envelope,
    eventType: z.literal(FDXGroupedSyncEventType.AccountTransactionsUpdated),
    data: summary,
  }),
]);

/**
 * Decode a JSON string or parsed unknown value. Throws for malformed or non-grouped payloads.
 * Applies the OpenAPI defaults; validates shape, not authenticity. Verify delivery signatures first.
 * Orders require fillsCreated; transactions retain the artifact's change-count union.
 */
export function decodeGroupedSyncWebhook(payload: unknown): FDXGroupedSyncWebhookPayload {
  return groupedSummary.parse(typeof payload === 'string' ? JSON.parse(payload) : payload);
}
