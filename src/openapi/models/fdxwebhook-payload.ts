/** Curated from the pinned OpenAPI artifact; see docs/grouped-sync-openapi-provenance.json. */
import type { FDXSyncSummaryData } from './fdxsync-summary-data';
import type { FDXWebhookPayloadResource } from './fdxwebhook-payload-resource';

/** Documented customer-facing webhook payload envelope. */
export interface FDXWebhookPayload {
  accountId?: string | null;
  companyAccountId: string;
  createdAt: string;
  data?: Record<string, unknown> | FDXSyncSummaryData;
  environment: 'live' | 'sandbox';
  eventId: string;
  eventType:
    | 'account.grant.created'
    | 'account.grant.updated'
    | 'account.grant.revoked'
    | 'account.sync.started'
    | 'account.sync.succeeded'
    | 'account.sync.failed'
    | 'account.balance.updated'
    | 'account.position.updated'
    | 'account.transaction.created'
    | 'account.orders.updated'
    | 'account.transactions.updated'
    | 'order.created'
    | 'order.updated'
    | 'order.filled'
    | 'order.cancelled'
    | 'order.rejected'
    | 'connection.reauth.required';
  grantId?: string | null;
  resource: FDXWebhookPayloadResource;
  schemaVersion?: 'v1';
}
