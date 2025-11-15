/**
 * Generated wrapper functions for market-data operations (Phase 2A).
 *
 * This file is regenerated on each run - do not edit directly.
 * For custom logic, edit src/custom/wrappers/market-data.ts instead.
 */
import { MarketDataApi } from '../api/market-data-api';
import type { Configuration } from '../configuration';
import type { SdkConfig } from '../config';
import { type Logger } from '../utils/logger';
/**
 * MarketData wrapper functions.
 * Provides simplified method names and response unwrapping.
 */
export declare class MarketDataWrapper {
    protected api: MarketDataApi;
    protected config?: Configuration;
    protected sdkConfig?: SdkConfig;
    protected logger: Logger;
    protected sessionId?: string;
    protected companyId?: string;
    protected csrfToken?: string;
    constructor(api: MarketDataApi, config?: Configuration, sdkConfig?: SdkConfig);
    setSessionContext(sessionId: string, companyId: string, csrfToken: string): void;
    protected _generateRequestId(): string;
    protected _retryApiCall<T>(fn: () => Promise<T>): Promise<T>;
    protected _handleError(error: any, requestId?: string): Error;
    /**
     * Get Futures Historical
     *
     *    * Return full futures historical dataset for the requested symbol(s).
     *
     * Generated from: GET /api/v1/market-data/futures/historical
     */
    getFuturesHistorical(symbol: string, startDate?: any, endDate?: any, expiration?: any, provider?: any): Promise<any[]>;
}
//# sourceMappingURL=market-data.d.ts.map