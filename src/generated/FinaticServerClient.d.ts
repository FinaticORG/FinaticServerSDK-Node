/**
 * Main client class for Finatic Server SDK (Node.js).
 *
 * This file is regenerated on each run - do not edit directly.
 * For custom logic, extend this class or use custom wrappers.
 */
import { SdkConfig } from './config';
import { BrokersWrapper } from './wrappers/brokers';
import { MarketDataWrapper } from './wrappers/market-data';
import { SessionWrapper } from './wrappers/session';
export interface PortalOptions {
    theme?: string | {
        preset?: string;
        custom?: Record<string, unknown>;
    };
    brokers?: string[];
    email?: string;
}
export declare class FinaticServerClient {
    private config;
    private sdkConfig;
    private sessionId?;
    private companyId?;
    private csrfToken?;
    readonly brokers: BrokersWrapper;
    readonly marketData: MarketDataWrapper;
    readonly session: SessionWrapper;
    constructor(apiKey: string, baseUrl?: string, sdkConfig?: Partial<SdkConfig>);
    /**
     * Initialize the client (no-op for now, can be extended).
     */
    initialize(): Promise<void>;
    /**
     * Close the client and cleanup resources.
     */
    close(): Promise<void>;
    /**
     * Initialize a session by getting a one-time token.
     */
    initSession(xApiKey: string): Promise<string>;
    /**
     * Start a session with a one-time token.
     */
    startSession(oneTimeToken: string, userId?: string): Promise<{
        session_id: string;
        company_id: string;
    }>;
    /**
     * Get portal URL with optional theme and broker filters.
     * This is where URL manipulation happens (not in session wrapper).
     * Returns the URL - app can use it as needed.
     */
    getPortalUrl(options?: PortalOptions): Promise<string>;
    /**
     * Get session user information after portal authentication.
     */
    getSessionUser(): Promise<{
        user_id: string;
        company_id: string;
        token_type: string;
    }>;
    /**
     * Set session context for all wrappers.
     */
    setSessionContext(sessionId: string, companyId: string, csrfToken: string): void;
    /**
     * Get current session ID.
     */
    getSessionId(): string | undefined;
    /**
     * Get current company ID.
     */
    getCompanyId(): string | undefined;
    /**
     * Get list of supported brokers.
     */
    getBrokerList(): Promise<any[]>;
    /**
     * Get user's broker connections.
     */
    getBrokerConnections(): Promise<any[]>;
    /**
     * Get all accounts across all pages.
     */
    getAllAccounts(filter?: any): Promise<any[]>;
    /**
     * Get all orders across all pages.
     */
    getAllOrders(filter?: any): Promise<any[]>;
    /**
     * Get all positions across all pages.
     */
    getAllPositions(filter?: any): Promise<any[]>;
    /**
     * Get all balances across all pages.
     */
    getAllBalances(filter?: any): Promise<any[]>;
    /**
     * Get paginated accounts.
     */
    getAccounts(page?: number, perPage?: number, filter?: any): Promise<any>;
    /**
     * Get paginated orders.
     */
    getOrders(page?: number, perPage?: number, filter?: any): Promise<any>;
    /**
     * Get paginated positions.
     */
    getPositions(page?: number, perPage?: number, filter?: any): Promise<any>;
    /**
     * Get paginated balances.
     */
    getBalances(page?: number, perPage?: number, filter?: any): Promise<any>;
    /**
     * Get only open positions.
     */
    getOpenPositions(filter?: any): Promise<any[]>;
    /**
     * Get only filled orders.
     */
    getFilledOrders(filter?: any): Promise<any[]>;
    /**
     * Get only pending orders.
     */
    getPendingOrders(filter?: any): Promise<any[]>;
    /**
     * Get only active accounts.
     */
    getActiveAccounts(filter?: any): Promise<any[]>;
    /**
     * Get orders filtered by symbol.
     */
    getOrdersBySymbol(symbol: string, filter?: any): Promise<any[]>;
    /**
     * Get positions filtered by symbol.
     */
    getPositionsBySymbol(symbol: string, filter?: any): Promise<any[]>;
    /**
     * Get orders filtered by broker.
     */
    getOrdersByBroker(brokerId: string, filter?: any): Promise<any[]>;
    /**
     * Get positions filtered by broker.
     */
    getPositionsByBroker(brokerId: string, filter?: any): Promise<any[]>;
    /**
     * Place a stock market order.
     */
    placeStockMarketOrder(symbol: string, quantity: number, side: 'buy' | 'sell', broker?: string, accountNumber?: string): Promise<any>;
    /**
     * Place a stock limit order.
     */
    placeStockLimitOrder(symbol: string, quantity: number, side: 'buy' | 'sell', price: number, timeInForce?: 'day' | 'gtc', broker?: string, accountNumber?: string): Promise<any>;
    /**
     * Place a stock stop order.
     */
    placeStockStopOrder(symbol: string, quantity: number, side: 'buy' | 'sell', stopPrice: number, timeInForce?: 'day' | 'gtc', broker?: string, accountNumber?: string): Promise<any>;
    /**
     * Place a crypto market order.
     */
    placeCryptoMarketOrder(symbol: string, quantity: number, side: 'buy' | 'sell', broker?: string, accountNumber?: string): Promise<any>;
    /**
     * Place a crypto limit order.
     */
    placeCryptoLimitOrder(symbol: string, quantity: number, side: 'buy' | 'sell', price: number, timeInForce?: 'day' | 'gtc', broker?: string, accountNumber?: string): Promise<any>;
    /**
     * Place an options market order.
     */
    placeOptionsMarketOrder(symbol: string, quantity: number, side: 'buy' | 'sell', broker?: string, accountNumber?: string): Promise<any>;
    /**
     * Place an options limit order.
     */
    placeOptionsLimitOrder(symbol: string, quantity: number, side: 'buy' | 'sell', price: number, timeInForce?: 'day' | 'gtc', broker?: string, accountNumber?: string): Promise<any>;
    /**
     * Place a futures market order.
     */
    placeFuturesMarketOrder(symbol: string, quantity: number, side: 'buy' | 'sell', broker?: string, accountNumber?: string): Promise<any>;
    /**
     * Place a futures limit order.
     */
    placeFuturesLimitOrder(symbol: string, quantity: number, side: 'buy' | 'sell', price: number, timeInForce?: 'day' | 'gtc', broker?: string, accountNumber?: string): Promise<any>;
    /**
     * Place a generic order.
     */
    placeOrder(orderParams: any, extras?: any): Promise<any>;
    /**
     * Modify an existing order.
     */
    modifyOrder(orderId: string, orderParams: any, extras?: any): Promise<any>;
    /**
     * Cancel an existing order.
     */
    cancelOrder(orderId: string, accountNumber?: string, connectionId?: string): Promise<any>;
}
//# sourceMappingURL=FinaticServerClient.d.ts.map