/** Curated from the pinned OpenAPI artifact; see docs/grouped-sync-openapi-provenance.json. */
import type { FDXOrdersSyncSummaryChangeCounts } from './fdxorders-sync-summary-change-counts';
import type { FDXSyncSummaryChangeCounts } from './fdxsync-summary-change-counts';
import type { FDXSyncSummaryResult } from './fdxsync-summary-result';

/** Typed data contract for account resource grouped-sync events. */
export interface FDXSyncSummaryData {
  batchId: string;
  changeCounts: FDXOrdersSyncSummaryChangeCounts | FDXSyncSummaryChangeCounts;
  completedAt: string;
  contractVersion?: 'account.resource.sync-summary.v1';
  origin: 'initialSync' | 'poll';
  result: FDXSyncSummaryResult;
}
