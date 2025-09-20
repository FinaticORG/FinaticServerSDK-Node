/**
 * Webhook-related type definitions.
 */

export interface TestWebhookRequest {
  /** Event type to test (e.g., 'order:filled', 'connection:needs_reauth') */
  event_type: string;
  /** Optional custom sample data to include in the webhook */
  sample_data?: Record<string, any>;
}

export interface TestWebhookResponse {
  /** Whether the test webhook was sent successfully */
  success: boolean;
  /** Status message */
  message: string;
  /** List of endpoint URLs that received the test webhook */
  sent_to_endpoints: string[];
  /** List of endpoint URLs that failed to receive the test webhook */
  failed_endpoints: string[];
  /** The actual webhook payload that was sent */
  webhook_payload: Record<string, any>;
}
