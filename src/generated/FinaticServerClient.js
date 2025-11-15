"use strict";
/**
 * Main client class for Finatic Server SDK (Node.js).
 *
 * This file is regenerated on each run - do not edit directly.
 * For custom logic, extend this class or use custom wrappers.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.FinaticServerClient = void 0;
const configuration_1 = require("./configuration");
const config_1 = require("./config");
const url_utils_1 = require("./utils/url-utils");
const brokers_api_1 = require("./api/brokers-api");
const market_data_api_1 = require("./api/market-data-api");
const session_api_1 = require("./api/session-api");
const brokers_1 = require("./wrappers/brokers");
const market_data_1 = require("./wrappers/market-data");
const session_1 = require("./wrappers/session");
class FinaticServerClient {
    constructor(apiKey, baseUrl, sdkConfig) {
        this.config = new configuration_1.Configuration({
            basePath: baseUrl || 'https://api.finatic.dev',
            apiKey: apiKey,
        });
        this.sdkConfig = { ...config_1.defaultConfig, ...sdkConfig };
        this.brokers = new brokers_1.BrokersWrapper(new brokers_api_1.BrokersApi(this.config), this.config, this.sdkConfig);
        this.marketData = new market_data_1.MarketDataWrapper(new market_data_api_1.MarketDataApi(this.config), this.config, this.sdkConfig);
        this.session = new session_1.SessionWrapper(new session_api_1.SessionApi(this.config), this.config, this.sdkConfig);
    }
    /**
     * Initialize the client (no-op for now, can be extended).
     */
    async initialize() {
        // Can be extended for initialization logic
    }
    /**
     * Close the client and cleanup resources.
     */
    async close() {
        // Can be extended for cleanup logic
    }
    /**
     * Initialize a session by getting a one-time token.
     */
    async initSession(xApiKey) {
        const response = await this.session.initSession(xApiKey);
        return response.one_time_token || '';
    }
    /**
     * Start a session with a one-time token.
     */
    async startSession(oneTimeToken, userId) {
        const requestBody = userId !== undefined ? { user_id: userId } : {};
        const response = await this.session.startSession(oneTimeToken, requestBody);
        const sessionId = response.session_id || '';
        const companyId = response.company_id || '';
        // csrf_token is not in SessionResponseData, get from response headers if available
        const csrfToken = response.csrf_token || '';
        if (sessionId && companyId) {
            this.setSessionContext(sessionId, companyId, csrfToken);
        }
        return { session_id: sessionId, company_id: companyId };
    }
    /**
     * Get portal URL with optional theme and broker filters.
     * This is where URL manipulation happens (not in session wrapper).
     * Returns the URL - app can use it as needed.
     */
    async getPortalUrl(options) {
        if (!this.sessionId) {
            throw new Error('Session not initialized. Call startSession() first.');
        }
        // Get raw portal URL from session wrapper
        const response = await this.session.getPortalUrl();
        let portalUrl = response.portal_url || '';
        // Append theme if provided
        if (options?.theme) {
            portalUrl = (0, url_utils_1.appendThemeToURL)(portalUrl, options.theme);
        }
        // Append broker filter if provided
        if (options?.brokers) {
            portalUrl = (0, url_utils_1.appendBrokerFilterToURL)(portalUrl, options.brokers);
        }
        // Append email if provided
        if (options?.email) {
            const url = new URL(portalUrl);
            url.searchParams.set('email', options.email);
            portalUrl = url.toString();
        }
        // Add session ID and company ID to URL
        const url = new URL(portalUrl);
        if (this.sessionId) {
            url.searchParams.set('session_id', this.sessionId);
        }
        if (this.companyId) {
            url.searchParams.set('company_id', this.companyId);
        }
        return url.toString();
    }
    /**
     * Get session user information after portal authentication.
     */
    async getSessionUser() {
        if (!this.sessionId) {
            throw new Error('Session not initialized. Call startSession() first.');
        }
        const response = await this.session.getSessionUser(this.sessionId);
        return {
            user_id: response.user_id || '',
            company_id: response.company_id || this.companyId || '',
            token_type: response.token_type || 'Bearer',
        };
    }
    /**
     * Set session context for all wrappers.
     */
    setSessionContext(sessionId, companyId, csrfToken) {
        this.sessionId = sessionId;
        this.companyId = companyId;
        this.csrfToken = csrfToken;
        // Update all wrappers with session context
        this.brokers.setSessionContext(sessionId, companyId, csrfToken);
        this.marketData.setSessionContext(sessionId, companyId, csrfToken);
        this.session.setSessionContext(sessionId, companyId, csrfToken);
    }
    /**
     * Get current session ID.
     */
    getSessionId() {
        return this.sessionId;
    }
    /**
     * Get current company ID.
     */
    getCompanyId() {
        return this.companyId;
    }
    /**
     * Get list of supported brokers.
     */
    async getBrokerList() {
        return await this.brokers.getBrokers();
    }
    /**
     * Get user's broker connections.
     */
    async getBrokerConnections() {
        return await this.brokers.listBrokerConnections();
    }
    /**
     * Get all accounts across all pages.
     */
    async getAllAccounts(filter) {
        const allData = [];
        let offset = 0;
        const limit = 100;
        while (true) {
            const result = await this.brokers.getAccounts(undefined, undefined, undefined, undefined, undefined, limit, offset);
            if (!result || result.length === 0)
                break;
            allData.push(...result);
            if (result.length < limit)
                break;
            offset += limit;
        }
        return allData;
    }
    /**
     * Get all orders across all pages.
     */
    async getAllOrders(filter) {
        const allData = [];
        let offset = 0;
        const limit = 100;
        while (true) {
            const result = await this.brokers.getOrders(undefined, undefined, undefined, filter?.symbol, filter?.orderStatus, filter?.side, filter?.assetType, limit, offset);
            if (!result || result.length === 0)
                break;
            allData.push(...result);
            if (result.length < limit)
                break;
            offset += limit;
        }
        return allData;
    }
    /**
     * Get all positions across all pages.
     */
    async getAllPositions(filter) {
        const allData = [];
        let offset = 0;
        const limit = 100;
        while (true) {
            const result = await this.brokers.getPositions(undefined, undefined, undefined, filter?.symbol, filter?.side, filter?.assetType, filter?.positionStatus, limit, offset);
            if (!result || result.length === 0)
                break;
            allData.push(...result);
            if (result.length < limit)
                break;
            offset += limit;
        }
        return allData;
    }
    /**
     * Get all balances across all pages.
     */
    async getAllBalances(filter) {
        const allData = [];
        let offset = 0;
        const limit = 100;
        while (true) {
            const result = await this.brokers.getBalances(undefined, undefined, undefined, filter?.isEndOfDaySnapshot, limit, offset);
            if (!result || result.length === 0)
                break;
            allData.push(...result);
            if (result.length < limit)
                break;
            offset += limit;
        }
        return allData;
    }
    /**
     * Get paginated accounts.
     */
    async getAccounts(page = 1, perPage = 100, filter) {
        const offset = (page - 1) * perPage;
        return await this.brokers.getAccounts(undefined, undefined, undefined, undefined, undefined, perPage, offset);
    }
    /**
     * Get paginated orders.
     */
    async getOrders(page = 1, perPage = 100, filter) {
        const offset = (page - 1) * perPage;
        return await this.brokers.getOrders(undefined, undefined, undefined, filter?.symbol, filter?.orderStatus, filter?.side, filter?.assetType, perPage, offset);
    }
    /**
     * Get paginated positions.
     */
    async getPositions(page = 1, perPage = 100, filter) {
        const offset = (page - 1) * perPage;
        return await this.brokers.getPositions(undefined, undefined, undefined, filter?.symbol, filter?.side, filter?.assetType, filter?.positionStatus, perPage, offset);
    }
    /**
     * Get paginated balances.
     */
    async getBalances(page = 1, perPage = 100, filter) {
        const offset = (page - 1) * perPage;
        return await this.brokers.getBalances(undefined, undefined, undefined, filter?.isEndOfDaySnapshot, perPage, offset);
    }
    /**
     * Get only open positions.
     */
    async getOpenPositions(filter) {
        return await this.getAllPositions({ ...filter, positionStatus: 'open' });
    }
    /**
     * Get only filled orders.
     */
    async getFilledOrders(filter) {
        return await this.getAllOrders({ ...filter, orderStatus: 'filled' });
    }
    /**
     * Get only pending orders.
     */
    async getPendingOrders(filter) {
        return await this.getAllOrders({ ...filter, orderStatus: 'pending' });
    }
    /**
     * Get only active accounts.
     */
    async getActiveAccounts(filter) {
        return await this.getAllAccounts({ ...filter, status: 'active' });
    }
    /**
     * Get orders filtered by symbol.
     */
    async getOrdersBySymbol(symbol, filter) {
        return await this.getAllOrders({ ...filter, symbol });
    }
    /**
     * Get positions filtered by symbol.
     */
    async getPositionsBySymbol(symbol, filter) {
        return await this.getAllPositions({ ...filter, symbol });
    }
    /**
     * Get orders filtered by broker.
     */
    async getOrdersByBroker(brokerId, filter) {
        return await this.getAllOrders({ ...filter, brokerId });
    }
    /**
     * Get positions filtered by broker.
     */
    async getPositionsByBroker(brokerId, filter) {
        return await this.getAllPositions({ ...filter, brokerId });
    }
    /**
     * Place a stock market order.
     */
    async placeStockMarketOrder(symbol, quantity, side, broker, accountNumber) {
        const orderParams = {
            broker: broker || 'robinhood',
            order_type: 'Market',
            asset_type: 'equity',
            action: side === 'buy' ? 'Buy' : 'Sell',
            time_in_force: 'day',
            account_number: accountNumber !== undefined ? accountNumber : '',
            symbol,
            order_qty: quantity,
        };
        return await this.brokers.placeOrder(orderParams);
    }
    /**
     * Place a stock limit order.
     */
    async placeStockLimitOrder(symbol, quantity, side, price, timeInForce = 'gtc', broker, accountNumber) {
        const orderParams = {
            broker: broker || 'robinhood',
            order_type: 'Limit',
            asset_type: 'equity',
            action: side === 'buy' ? 'Buy' : 'Sell',
            time_in_force: timeInForce,
            account_number: accountNumber !== undefined ? accountNumber : '',
            symbol,
            order_qty: quantity,
            price,
        };
        return await this.brokers.placeOrder(orderParams);
    }
    /**
     * Place a stock stop order.
     */
    async placeStockStopOrder(symbol, quantity, side, stopPrice, timeInForce = 'gtc', broker, accountNumber) {
        const orderParams = {
            broker: broker || 'robinhood',
            order_type: 'Stop',
            asset_type: 'equity',
            action: side === 'buy' ? 'Buy' : 'Sell',
            time_in_force: timeInForce,
            account_number: accountNumber !== undefined ? accountNumber : '',
            symbol,
            order_qty: quantity,
            stop_price: stopPrice,
        };
        return await this.brokers.placeOrder(orderParams);
    }
    /**
     * Place a crypto market order.
     */
    async placeCryptoMarketOrder(symbol, quantity, side, broker, accountNumber) {
        const orderParams = {
            broker: broker || 'robinhood',
            order_type: 'Market',
            asset_type: 'crypto',
            action: side === 'buy' ? 'Buy' : 'Sell',
            time_in_force: 'day',
            account_number: accountNumber !== undefined ? accountNumber : '',
            symbol,
            order_qty: quantity,
        };
        return await this.brokers.placeOrder(orderParams);
    }
    /**
     * Place a crypto limit order.
     */
    async placeCryptoLimitOrder(symbol, quantity, side, price, timeInForce = 'gtc', broker, accountNumber) {
        const orderParams = {
            broker: broker || 'robinhood',
            order_type: 'Limit',
            asset_type: 'crypto',
            action: side === 'buy' ? 'Buy' : 'Sell',
            time_in_force: timeInForce,
            account_number: accountNumber !== undefined ? accountNumber : '',
            symbol,
            order_qty: quantity,
            price,
        };
        return await this.brokers.placeOrder(orderParams);
    }
    /**
     * Place an options market order.
     */
    async placeOptionsMarketOrder(symbol, quantity, side, broker, accountNumber) {
        const orderParams = {
            broker: broker || 'robinhood',
            order_type: 'Market',
            asset_type: 'equity_option',
            action: side === 'buy' ? 'Buy' : 'Sell',
            time_in_force: 'day',
            account_number: accountNumber !== undefined ? accountNumber : '',
            symbol,
            order_qty: quantity,
        };
        return await this.brokers.placeOrder(orderParams);
    }
    /**
     * Place an options limit order.
     */
    async placeOptionsLimitOrder(symbol, quantity, side, price, timeInForce = 'gtc', broker, accountNumber) {
        const orderParams = {
            broker: broker || 'robinhood',
            order_type: 'Limit',
            asset_type: 'equity_option',
            action: side === 'buy' ? 'Buy' : 'Sell',
            time_in_force: timeInForce,
            account_number: accountNumber !== undefined ? accountNumber : '',
            symbol,
            order_qty: quantity,
            price,
        };
        return await this.brokers.placeOrder(orderParams);
    }
    /**
     * Place a futures market order.
     */
    async placeFuturesMarketOrder(symbol, quantity, side, broker, accountNumber) {
        const orderParams = {
            broker: broker || 'robinhood',
            order_type: 'Market',
            asset_type: 'future',
            action: side === 'buy' ? 'Buy' : 'Sell',
            time_in_force: 'day',
            account_number: accountNumber !== undefined ? accountNumber : '',
            symbol,
            order_qty: quantity,
        };
        return await this.brokers.placeOrder(orderParams);
    }
    /**
     * Place a futures limit order.
     */
    async placeFuturesLimitOrder(symbol, quantity, side, price, timeInForce = 'gtc', broker, accountNumber) {
        const orderParams = {
            broker: broker || 'robinhood',
            order_type: 'Limit',
            asset_type: 'future',
            action: side === 'buy' ? 'Buy' : 'Sell',
            time_in_force: timeInForce,
            account_number: accountNumber !== undefined ? accountNumber : '',
            symbol,
            order_qty: quantity,
            price,
        };
        return await this.brokers.placeOrder(orderParams);
    }
    /**
     * Place a generic order.
     */
    async placeOrder(orderParams, extras) {
        return await this.brokers.placeOrder(orderParams, extras);
    }
    /**
     * Modify an existing order.
     */
    async modifyOrder(orderId, orderParams, extras) {
        return await this.brokers.modifyOrder(orderId, orderParams, extras);
    }
    /**
     * Cancel an existing order.
     */
    async cancelOrder(orderId, accountNumber, connectionId) {
        return await this.brokers.cancelOrder(orderId, undefined, accountNumber, connectionId);
    }
}
exports.FinaticServerClient = FinaticServerClient;
//# sourceMappingURL=FinaticServerClient.js.map