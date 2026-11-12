/** Curated from the pinned OpenAPI artifact; see docs/grouped-sync-openapi-provenance.json. */

/** Resource pointer included in outbound webhook payloads. */
export interface FDXWebhookPayloadResource {
  accountId?: string | null;
  grantId?: string | null;
  resourceId: string;
  resourceType: string;
}
