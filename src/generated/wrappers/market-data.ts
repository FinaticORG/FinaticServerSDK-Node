/**
 * Generated wrapper functions for market-data operations (Phase 2A).
 * 
 * This file is regenerated on each run - do not edit directly.
 * For custom logic, edit src/custom/wrappers/market-data.ts instead.
 */

import { MarketDataApi } from '../api/market-data-api';
import type { Configuration } from '../configuration';
import type { SdkConfig } from '../config';
import { generateRequestId } from '../utils/request-id';
import { retryApiCall } from '../utils/retry';
import { getLogger, type Logger } from '../utils/logger';
import { handleError } from '../utils/error-handling';
import { getCache, generateCacheKey } from '../utils/cache';
import { applyRequestInterceptors, applyResponseInterceptors, applyErrorInterceptors } from '../utils/interceptors';


/**
 * MarketData wrapper functions.
 * Provides simplified method names and response unwrapping.
 */
export class MarketDataWrapper {
  protected api: MarketDataApi;
  protected config?: Configuration;
  protected sdkConfig?: SdkConfig;
  protected logger: Logger;
  protected sessionId?: string;
  protected companyId?: string;
  protected csrfToken?: string;

  constructor(api: MarketDataApi, config?: Configuration, sdkConfig?: SdkConfig) {
    this.api = api;
    if (config !== undefined) {
      this.config = config;
    }
    if (sdkConfig !== undefined) {
      this.sdkConfig = sdkConfig;
    }
    this.logger = getLogger(sdkConfig);
  }

  // Session context setters (called by session management)
  setSessionContext(sessionId: string, companyId: string, csrfToken: string) {
    this.sessionId = sessionId;
    this.companyId = companyId;
    this.csrfToken = csrfToken;
  }

  // Utility methods (Phase 2A)
  protected _generateRequestId(): string {
    return generateRequestId();
  }

  protected async _retryApiCall<T>(fn: () => Promise<T>): Promise<T> {
    return retryApiCall(fn);
  }

  protected _handleError(error: any, requestId?: string): Error {
    return handleError(error, requestId);
  }

  /**
   * Get Futures Historical
   * 
   *    * Return full futures historical dataset for the requested symbol(s).
   * 
   * Generated from: GET /api/v1/market-data/futures/historical
   */
  async getFuturesHistorical(symbol: string, startDate?: any, endDate?: any, expiration?: any, provider?: any): Promise<any[]> {
    // Generate request ID
    const requestId = this._generateRequestId();

    // Input validation (Phase 2B: zod)
    if (this.sdkConfig?.validationEnabled) {
      // TODO: Generate validation schema from endpoint parameters
      // const validationSchema = z.object({ ... });
      // validateParams(validationSchema, { symbol, startDate, endDate, expiration, provider }, this.sdkConfig);
    }

    // Check cache (Phase 2B: optional caching)
    // Portal URLs are single-use tokens - must NOT be cached
    const shouldCache = !false;
    const cache = getCache(this.sdkConfig);
    if (cache && this.sdkConfig?.cacheEnabled && shouldCache) {
      const cacheKey = generateCacheKey('GET', '/api/v1/market-data/futures/historical', { symbol, startDate, endDate, expiration, provider }, this.sdkConfig);
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
      const response = await retryApiCall(
        async () => {
          // Apply request interceptors (Phase 2B)
          // Public API methods already handle calling the function, so await directly
          const apiResponse = await this.api.getFuturesHistoricalApiV1MarketDataFuturesHistoricalGet({ symbol: symbol, ...(startDate !== undefined ? { startDate: startDate } : {}), ...(endDate !== undefined ? { endDate: endDate } : {}), ...(expiration !== undefined ? { expiration: expiration } : {}), ...(provider !== undefined ? { provider: provider } : {}) }, { headers: { 'x-request-id': requestId } });
          const result = apiResponse;
          // Apply response interceptors (Phase 2B)
          return await applyResponseInterceptors(result, this.sdkConfig);
        },
        {},
        this.sdkConfig
      );
      
      // Unwrap FinaticResponse if present, otherwise use response directly
      // OpenAPI generator returns responses directly, but may be wrapped in FinaticResponse
      // Unwrap FinaticResponse wrapper if present
      // The API returns an AxiosResponse, so the actual response is in response.data
      // response.data might be FinaticResponse[Model] (with .data property) or FinaticResponseList[...] (with .response_data property)
      let result;
      // First unwrap Axios response wrapper (response.data)
      const responseData = (response && typeof response === 'object' && 'data' in response) ? response.data : response;
      // Now unwrap FinaticResponse wrapper
      if (responseData && typeof responseData === 'object' && 'response_data' in responseData) {
        // Unwrap FinaticResponseList wrapper (e.g., FinaticResponseListUserBrokerConnections -> Array<UserBrokerConnections>)
        // Handle null/undefined response_data as empty array for array-returning methods
        if (responseData.response_data !== null && responseData.response_data !== undefined) {
          result = responseData.response_data;
        } else {
          // response_data is null or undefined - return empty array for array-returning methods
          result = [];
        }
      } else if (responseData && typeof responseData === 'object' && 'data' in responseData && responseData.data && typeof responseData.data === 'object' && 'data' in responseData.data) {
        // FinaticResponse wrapper: { data: { data: ... } }
        result = responseData.data.data;
      } else if (responseData && typeof responseData === 'object' && 'data' in responseData) {
        // FinaticResponse with single data property: { data: ... }
        result = responseData.data;
      } else {
        // Direct response (already unwrapped)
        result = responseData;
      }
      

      const finalResult = result;
      

      // Store in cache (Phase 2B)
      // Portal URLs are single-use tokens - must NOT be cached
      if (cache && this.sdkConfig?.cacheEnabled && shouldCache) {
        const cacheKey = generateCacheKey('GET', '/api/v1/market-data/futures/historical', { symbol, startDate, endDate, expiration, provider }, this.sdkConfig);
        cache.set(cacheKey, finalResult, this.sdkConfig.cacheTtl || 300);
      }
      
      // Structured logging (Phase 2B)
      this.logger.debug('Get Futures Historical completed', {
        request_id: requestId,
        action: 'getFuturesHistorical'
      });
      
      return finalResult;
      
    } catch (error) {
      // Error handling with interceptors (Phase 2B)
      try {
        await applyErrorInterceptors(error, this.sdkConfig);
      } catch (interceptorError) {
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
