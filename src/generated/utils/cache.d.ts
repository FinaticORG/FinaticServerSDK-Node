/**
 * Response caching utility with node-cache (Phase 2B).
 *
 * Generated - do not edit directly.
 */
import NodeCache from 'node-cache';
import type { SdkConfig } from '../config';
/**
 * Get or create cache instance.
 */
export declare function getCache(config?: SdkConfig): NodeCache | null;
/**
 * Generate cache key from method and parameters.
 */
export declare function generateCacheKey(
  method: string,
  path: string,
  params: Record<string, any>,
  config?: SdkConfig
): string;
//# sourceMappingURL=cache.d.ts.map
