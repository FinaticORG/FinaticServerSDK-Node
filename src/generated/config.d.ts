/**
 * Finatic Server SDK Configuration
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * CENTRALIZED CONFIGURATION - Adjust all SDK settings here
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * This file contains all configurable options for the SDK.
 * Modify values here to customize SDK behavior.
 *
 * Generated - do not edit directly.
 * For custom configuration, extend this class in src/custom/config.ts
 */
export interface SdkConfig {
  /** Base URL for API requests */
  baseUrl: string;
  /** API key for authentication */
  apiKey?: string;
  /** Request timeout in milliseconds */
  timeout: number;
  /** Custom headers to include in all requests */
  headers: Record<string, string>;
  /** Enable retry logic */
  retryEnabled: boolean;
  /** Maximum number of retry attempts */
  retryCount: number;
  /** Initial retry delay in milliseconds */
  retryDelay: number;
  /** Maximum retry delay in milliseconds */
  retryMaxDelay: number;
  /** Exponential backoff multiplier */
  retryMultiplier: number;
  /** HTTP status codes that trigger retry */
  retryOnStatus: number[];
  /** Enable retry on network errors */
  retryOnNetworkError: boolean;
  /** Log level: 'debug' | 'info' | 'warn' | 'error' | 'silent' */
  logLevel: 'debug' | 'info' | 'warn' | 'error' | 'silent';
  /** Enable structured JSON logging */
  structuredLogging: boolean;
  /** Include request/response bodies in logs (debug only) */
  logRequestBody: boolean;
  logResponseBody: boolean;
  /** Log request IDs for tracing */
  logRequestId: boolean;
  /** Enable input validation */
  validationEnabled: boolean;
  /** Throw errors on validation failure (vs. log warnings) */
  validationStrict: boolean;
  /** Enable response caching */
  cacheEnabled: boolean;
  /** Default cache TTL in seconds */
  cacheTtl: number;
  /** Maximum cache size (number of entries) */
  cacheMaxSize: number;
  /** Cache keys to include in cache key generation */
  cacheKeyInclude: string[];
  /** Enable rate limit detection and handling */
  rateLimitEnabled: boolean;
  /** Automatically retry on 429 (rate limit) */
  rateLimitAutoRetry: boolean;
  /** Custom rate limit handler function */
  rateLimitHandler?: (retryAfter: number) => Promise<void>;
  /** Enable request interceptors */
  requestInterceptorsEnabled: boolean;
  /** Enable response interceptors */
  responseInterceptorsEnabled: boolean;
  /** Session context storage */
  sessionContextStorage: 'memory' | 'custom';
  /** Custom session context getter/setter */
  sessionContextGetter?: () => {
    sessionId?: string;
    companyId?: string;
    csrfToken?: string;
  };
  sessionContextSetter?: (context: {
    sessionId?: string;
    companyId?: string;
    csrfToken?: string;
  }) => void;
}
/**
 * Default configuration values.
 * Override via environment variables or custom config.
 */
export declare const defaultConfig: SdkConfig;
/**
 * Get configuration with environment variable overrides.
 */
export declare function getConfig(overrides?: Partial<SdkConfig>): SdkConfig;
//# sourceMappingURL=config.d.ts.map
