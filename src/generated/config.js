"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.defaultConfig = void 0;
exports.getConfig = getConfig;
/**
 * Default configuration values.
 * Override via environment variables or custom config.
 */
exports.defaultConfig = {
    // API Configuration
    baseUrl: process.env['FINATIC_API_URL'] || 'https://api.finatic.com',
    ...(process.env['FINATIC_API_KEY'] ? { apiKey: process.env['FINATIC_API_KEY'] } : {}),
    timeout: parseInt(process.env['FINATIC_TIMEOUT'] || '30000', 10),
    headers: {},
    // Retry Configuration
    retryEnabled: process.env['FINATIC_RETRY_ENABLED'] !== 'false',
    retryCount: parseInt(process.env['FINATIC_RETRY_COUNT'] || '3', 10),
    retryDelay: parseInt(process.env['FINATIC_RETRY_DELAY'] || '1000', 10),
    retryMaxDelay: parseInt(process.env['FINATIC_RETRY_MAX_DELAY'] || '10000', 10),
    retryMultiplier: parseFloat(process.env['FINATIC_RETRY_MULTIPLIER'] || '2'),
    retryOnStatus: [429, 500, 502, 503, 504],
    retryOnNetworkError: process.env['FINATIC_RETRY_ON_NETWORK_ERROR'] !== 'false',
    // Logging Configuration
    logLevel: (process.env['FINATIC_LOG_LEVEL'] || 'error'),
    structuredLogging: process.env['FINATIC_STRUCTURED_LOGGING'] === 'true',
    logRequestBody: process.env['FINATIC_LOG_REQUEST_BODY'] === 'true',
    logResponseBody: process.env['FINATIC_LOG_RESPONSE_BODY'] === 'true',
    logRequestId: process.env['FINATIC_LOG_REQUEST_ID'] !== 'false',
    // Validation Configuration
    validationEnabled: process.env['FINATIC_VALIDATION_ENABLED'] !== 'false',
    validationStrict: process.env['FINATIC_VALIDATION_STRICT'] === 'true',
    // Caching Configuration
    cacheEnabled: process.env['FINATIC_CACHE_ENABLED'] === 'true',
    cacheTtl: parseInt(process.env['FINATIC_CACHE_TTL'] || '300', 10),
    cacheMaxSize: parseInt(process.env['FINATIC_CACHE_MAX_SIZE'] || '1000', 10),
    cacheKeyInclude: ['method', 'path', 'query', 'body'],
    // Rate Limiting Configuration
    rateLimitEnabled: process.env['FINATIC_RATE_LIMIT_ENABLED'] !== 'false',
    rateLimitAutoRetry: process.env['FINATIC_RATE_LIMIT_AUTO_RETRY'] !== 'false',
    // Interceptor Configuration
    requestInterceptorsEnabled: process.env['FINATIC_REQUEST_INTERCEPTORS'] !== 'false',
    responseInterceptorsEnabled: process.env['FINATIC_RESPONSE_INTERCEPTORS'] !== 'false',
    // Server SDK Session Configuration
    sessionContextStorage: 'memory',
};
/**
 * Get configuration with environment variable overrides.
 */
function getConfig(overrides) {
    const config = {
        ...exports.defaultConfig,
    };
    if (overrides) {
        // Only assign defined values (not undefined)
        for (const [key, value] of Object.entries(overrides)) {
            if (value !== undefined) {
                config[key] = value;
            }
        }
    }
    return config;
}
//# sourceMappingURL=config.js.map