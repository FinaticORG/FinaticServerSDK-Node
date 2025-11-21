/**
 * Retry utility with p-retry package (Phase 2B).
 *
 * Generated - do not edit directly.
 */
import type { SdkConfig } from '../config';
export interface RetryOptions {
  maxRetries?: number;
  retryDelay?: number;
  retryMaxDelay?: number;
  retryMultiplier?: number;
  retryOnStatus?: number[];
  retryOnNetworkError?: boolean;
  onFailedAttempt?: (error: Error) => void;
}
/**
 * Retry an async function with exponential backoff using p-retry.
 */
export declare function retryApiCall<T>(
  fn: () => Promise<T>,
  options?: RetryOptions,
  config?: SdkConfig
): Promise<T>;
//# sourceMappingURL=retry.d.ts.map
