/** Curated from the pinned OpenAPI artifact; see docs/grouped-sync-openapi-provenance.json. */

/** Non-negative resource changes committed by one sync batch. */
export interface FDXSyncSummaryChangeCounts {
  created: number;
  deleted: number;
  unchanged: number;
  updated: number;
}
