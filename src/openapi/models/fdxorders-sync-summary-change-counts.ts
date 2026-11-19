/** Curated from the pinned OpenAPI artifact; see docs/grouped-sync-openapi-provenance.json. */

/** Order changes with fills folded into the grouped order event. */
export interface FDXOrdersSyncSummaryChangeCounts {
  created: number;
  deleted: number;
  fillsCreated: number;
  unchanged: number;
  updated: number;
}
