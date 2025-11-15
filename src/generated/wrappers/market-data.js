"use strict";
/**
 * Generated wrapper functions for market-data operations (Phase 2A).
 *
 * This file is regenerated on each run - do not edit directly.
 * For custom logic, edit src/custom/wrappers/market-data.ts instead.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.MarketDataWrapper = void 0;
const request_id_1 = require("../utils/request-id");
const retry_1 = require("../utils/retry");
const logger_1 = require("../utils/logger");
const error_handling_1 = require("../utils/error-handling");
const cache_1 = require("../utils/cache");
const interceptors_1 = require("../utils/interceptors");
/**
 * MarketData wrapper functions.
 * Provides simplified method names and response unwrapping.
 */
class MarketDataWrapper {
    constructor(api, config, sdkConfig) {
        this.api = api;
        if (config !== undefined) {
            this.config = config;
        }
        if (sdkConfig !== undefined) {
            this.sdkConfig = sdkConfig;
        }
        this.logger = (0, logger_1.getLogger)(sdkConfig);
    }
    // Session context setters (called by session management)
    setSessionContext(sessionId, companyId, csrfToken) {
        this.sessionId = sessionId;
        this.companyId = companyId;
        this.csrfToken = csrfToken;
    }
    // Utility methods (Phase 2A)
    _generateRequestId() {
        return (0, request_id_1.generateRequestId)();
    }
    async _retryApiCall(fn) {
        return (0, retry_1.retryApiCall)(fn);
    }
    _handleError(error, requestId) {
        return (0, error_handling_1.handleError)(error, requestId);
    }
    /**
     * Get Futures Historical
     *
     *    * Return full futures historical dataset for the requested symbol(s).
     *
     * Generated from: GET /api/v1/market-data/futures/historical
     */
    async getFuturesHistorical(symbol, startDate, endDate, expiration, provider) {
        // Generate request ID
        const requestId = this._generateRequestId();
        // Input validation (Phase 2B: zod)
        if (this.sdkConfig?.validationEnabled) {
            // TODO: Generate validation schema from endpoint parameters
            // const validationSchema = z.object({ ... });
            // validateParams(validationSchema, { symbol, startDate, endDate, expiration, provider }, this.sdkConfig);
        }
        // Check cache (Phase 2B: optional caching)
        const cache = (0, cache_1.getCache)(this.sdkConfig);
        if (cache && this.sdkConfig?.cacheEnabled) {
            const cacheKey = (0, cache_1.generateCacheKey)('GET', '/api/v1/market-data/futures/historical', { symbol, startDate, endDate, expiration, provider }, this.sdkConfig);
            const cached = cache.get(cacheKey);
            if (cached) {
                this.logger.debug('Cache hit', { request_id: requestId, cache_key: cacheKey });
                return cached;
            }
        }
        // Structured logging (Phase 2B: pino)
        this.logger.debug('Get Futures Historical', {
            request_id: requestId,
            method: 'GET',
            path: '/api/v1/market-data/futures/historical',
            symbol: symbol,
            startDate: startDate,
            endDate: endDate,
            expiration: expiration,
            provider: provider,
            action: 'getFuturesHistorical'
        });
        try {
            // Full retry logic (Phase 2B: p-retry)
            const response = await (0, retry_1.retryApiCall)(async () => {
                // Apply request interceptors (Phase 2B)
                // Public API methods already handle calling the function, so await directly
                const apiResponse = await this.api.getFuturesHistoricalApiV1MarketDataFuturesHistoricalGet({ symbol: symbol, ...(startDate !== undefined ? { startDate: startDate } : {}), ...(endDate !== undefined ? { endDate: endDate } : {}), ...(expiration !== undefined ? { expiration: expiration } : {}), ...(provider !== undefined ? { provider: provider } : {}) }, { headers: { 'x-request-id': requestId } });
                const result = apiResponse;
                // Apply response interceptors (Phase 2B)
                return await (0, interceptors_1.applyResponseInterceptors)(result, this.sdkConfig);
            }, {}, this.sdkConfig);
            // Unwrap FinaticResponse if present, otherwise use response directly
            // OpenAPI generator returns responses directly, but may be wrapped in FinaticResponse
            const result = (response && typeof response === 'object' && 'data' in response && response.data && typeof response.data === 'object' && 'data' in response.data)
                ? response.data.data // FinaticResponse wrapper: { data: { data: ... } }
                : (response && typeof response === 'object' && 'data' in response)
                    ? response.data // Axios-style wrapper: { data: ... }
                    : response; // Direct response
            // Store in cache (Phase 2B)
            if (cache && this.sdkConfig?.cacheEnabled) {
                const cacheKey = (0, cache_1.generateCacheKey)('GET', '/api/v1/market-data/futures/historical', { symbol, startDate, endDate, expiration, provider }, this.sdkConfig);
                cache.set(cacheKey, result, this.sdkConfig.cacheTtl || 300);
            }
            // Structured logging (Phase 2B)
            this.logger.debug('Get Futures Historical completed', {
                request_id: requestId,
                action: 'getFuturesHistorical'
            });
            return result;
        }
        catch (error) {
            // Error handling with interceptors (Phase 2B)
            try {
                await (0, interceptors_1.applyErrorInterceptors)(error, this.sdkConfig);
            }
            catch (interceptorError) {
                // If interceptor throws, use original error
            }
            this.logger.error('Get Futures Historical failed', error, {
                request_id: requestId,
                action: 'getFuturesHistorical'
            });
            throw this._handleError(error, requestId);
        }
        // TODO Phase 2C: Add complex validation schemas (unions, enums, nested)
        // TODO Phase 2C: Add orphaned method detection
        // TODO Phase 2C: Add advanced convenience methods
    }
}
exports.MarketDataWrapper = MarketDataWrapper;
//# sourceMappingURL=market-data.js.map