/**
 * Main client class for Finatic Server SDK (Node.js).
 * 
 * This file is regenerated on each run - do not edit directly.
 * For custom logic, extend this class or use custom wrappers.
 */

import { Configuration } from './configuration';
import { SdkConfig, defaultConfig } from './config';
import { appendThemeToURL, appendBrokerFilterToURL } from './utils/url-utils';
import { BrokersApi } from './api/brokers-api';
import { SessionApi } from './api/session-api';
import { BrokersWrapper } from './wrappers/brokers';
import { SessionWrapper } from './wrappers/session';

export interface PortalOptions {
  theme?: string | { preset?: string; custom?: Record<string, unknown> };
  brokers?: string[];
  email?: string;
}

export class FinaticServer {
  private config: Configuration;
  private sdkConfig: SdkConfig;
  private sessionId?: string;
  private companyId?: string;
  private csrfToken?: string;

  public readonly brokers: BrokersWrapper;
  public readonly session: SessionWrapper;

  constructor(apiKey: string, baseUrl?: string, sdkConfig?: Partial<SdkConfig>) {
    this.config = new Configuration({
      basePath: baseUrl || 'https://api.finatic.dev',
      apiKey: apiKey,
    });
    this.sdkConfig = { ...defaultConfig, ...sdkConfig };

    this.brokers = new BrokersWrapper(new BrokersApi(this.config), this.config, this.sdkConfig);
    this.session = new SessionWrapper(new SessionApi(this.config), this.config, this.sdkConfig);
  }

  /**
   * Initialize the client (no-op for now, can be extended).
   */
  async initialize(): Promise<void> {
    // Can be extended for initialization logic
  }

  /**
   * Close the client and cleanup resources.
   */
  async close(): Promise<void> {
    // Can be extended for cleanup logic
  }

  /**
   * Initialize a session by getting a one-time token.
   */
  async initSession(xApiKey: string): Promise<string> {
    const response = await this.session.initSession(xApiKey);
    return response.one_time_token || '';
  }

  /**
   * Start a session with a one-time token.
   */
  async startSession(oneTimeToken: string, userId?: string): Promise<{ session_id: string; company_id: string }> {
    const requestBody = userId !== undefined ? { user_id: userId } : {};
    const response = await this.session.startSession(oneTimeToken, requestBody);
    const sessionId = response.session_id || '';
    const companyId = response.company_id || '';
    // csrf_token is not in SessionResponseData, get from response headers if available
    const csrfToken = (response as any).csrf_token || '';
    
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
  async getPortalUrl(options?: PortalOptions): Promise<string> {
    if (!this.sessionId) {
      throw new Error('Session not initialized. Call startSession() first.');
    }

    // Get raw portal URL from session wrapper
    const response = await this.session.getPortalUrl();
    
    // Validate response structure
    if (!response || typeof response !== 'object' || !('portal_url' in response)) {
      throw new Error('Invalid portal URL response: expected PortalUrlResponse with portal_url property, got ' + typeof response);
    }
    
    let portalUrl = response.portal_url || '';

    // Append theme if provided
    if (options?.theme) {
      portalUrl = appendThemeToURL(portalUrl, options.theme);
    }

    // Append broker filter if provided
    if (options?.brokers) {
      portalUrl = appendBrokerFilterToURL(portalUrl, options.brokers);
    }

    // Append email if provided
    if (options?.email) {
      const url = new URL(portalUrl);
      url.searchParams.set('email', options.email);
      portalUrl = url.toString();
    }

    // Add company ID to URL (token is already in URL from backend, session_id should not be exposed)
    const url = new URL(portalUrl);
    if (this.companyId) {
      url.searchParams.set('company_id', this.companyId);
    }

    return url.toString();
  }

  /**
   * Get session user information after portal authentication.
   */
  async getSessionUser(): Promise<{ user_id: string; company_id: string; token_type: string }> {
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
  setSessionContext(sessionId: string, companyId: string, csrfToken: string): void {
    this.sessionId = sessionId;
    this.companyId = companyId;
    this.csrfToken = csrfToken;
    
    // Update all wrappers with session context
    this.brokers.setSessionContext(sessionId, companyId, csrfToken);
    this.session.setSessionContext(sessionId, companyId, csrfToken);
  }

  /**
   * Get current session ID.
   */
  getSessionId(): string | undefined {
    return this.sessionId;
  }

  /**
   * Get current company ID.
   */
  getCompanyId(): string | undefined {
    return this.companyId;
  }


  /**
   * Get list of supported brokers.
   */
  async getBrokerList(): Promise<any[]> {
    return await this.brokers.getBrokers();
  }

  /**
   * Get user's broker connections.
   */
  async getBrokerConnections(): Promise<any[]> {
    return await this.brokers.listBrokerConnections();
  }

  /**
   * Get all accounts across all pages.
   */
  async getAllAccounts(filter?: any): Promise<any[]> {
    const allData: any[] = [];
    let offset = 0;
    const limit = 100;
    
    while (true) {
      const result = await this.brokers.getAccounts(undefined, undefined, undefined, undefined, undefined, limit, offset);
      if (!result || result.length === 0) break;
      allData.push(...result);
      if (result.length < limit) break;
      offset += limit;
    }
    
    return allData;
  }

  /**
   * Get all orders across all pages.
   */
  async getAllOrders(filter?: any): Promise<any[]> {
    const allData: any[] = [];
    let offset = 0;
    const limit = 100;
    
    while (true) {
      const result = await this.brokers.getOrders(undefined, undefined, undefined, filter?.symbol, filter?.orderStatus, filter?.side, filter?.assetType, limit, offset);
      if (!result || result.length === 0) break;
      allData.push(...result);
      if (result.length < limit) break;
      offset += limit;
    }
    
    return allData;
  }

  /**
   * Get all positions across all pages.
   */
  async getAllPositions(filter?: any): Promise<any[]> {
    const allData: any[] = [];
    let offset = 0;
    const limit = 100;
    
    while (true) {
      const result = await this.brokers.getPositions(undefined, undefined, undefined, filter?.symbol, filter?.side, filter?.assetType, filter?.positionStatus, limit, offset);
      if (!result || result.length === 0) break;
      allData.push(...result);
      if (result.length < limit) break;
      offset += limit;
    }
    
    return allData;
  }

  /**
   * Get all balances across all pages.
   */
  async getAllBalances(filter?: any): Promise<any[]> {
    const allData: any[] = [];
    let offset = 0;
    const limit = 100;
    
    while (true) {
      const result = await this.brokers.getBalances(undefined, undefined, undefined, filter?.isEndOfDaySnapshot, limit, offset);
      if (!result || result.length === 0) break;
      allData.push(...result);
      if (result.length < limit) break;
      offset += limit;
    }
    
    return allData;
  }

  /**
   * Get paginated accounts.
   */
  async getAccounts(page: number = 1, perPage: number = 100, filter?: any): Promise<any> {
    const offset = (page - 1) * perPage;
    return await this.brokers.getAccounts(undefined, undefined, undefined, undefined, undefined, perPage, offset);
  }

  /**
   * Get paginated orders.
   */
  async getOrders(page: number = 1, perPage: number = 100, filter?: any): Promise<any> {
    const offset = (page - 1) * perPage;
    return await this.brokers.getOrders(undefined, undefined, undefined, filter?.symbol, filter?.orderStatus, filter?.side, filter?.assetType, perPage, offset);
  }

  /**
   * Get paginated positions.
   */
  async getPositions(page: number = 1, perPage: number = 100, filter?: any): Promise<any> {
    const offset = (page - 1) * perPage;
    return await this.brokers.getPositions(undefined, undefined, undefined, filter?.symbol, filter?.side, filter?.assetType, filter?.positionStatus, perPage, offset);
  }

  /**
   * Get paginated balances.
   */
  async getBalances(page: number = 1, perPage: number = 100, filter?: any): Promise<any> {
    const offset = (page - 1) * perPage;
    return await this.brokers.getBalances(undefined, undefined, undefined, filter?.isEndOfDaySnapshot, perPage, offset);
  }

  /**
   * Get only open positions.
   */
  async getOpenPositions(filter?: any): Promise<any[]> {
    return await this.getAllPositions({ ...filter, positionStatus: 'active' });
  }

  /**
   * Get only filled orders.
   */
  async getFilledOrders(filter?: any): Promise<any[]> {
    return await this.getAllOrders({ ...filter, orderStatus: 'filled' });
  }

  /**
   * Get only pending orders.
   */
  async getPendingOrders(filter?: any): Promise<any[]> {
    return await this.getAllOrders({ ...filter, orderStatus: 'new' });
  }

  /**
   * Get only active accounts.
   */
  async getActiveAccounts(filter?: any): Promise<any[]> {
    return await this.getAllAccounts({ ...filter, status: 'active' });
  }

  /**
   * Get orders filtered by symbol.
   */
  async getOrdersBySymbol(symbol: string, filter?: any): Promise<any[]> {
    return await this.getAllOrders({ ...filter, symbol });
  }

  /**
   * Get positions filtered by symbol.
   */
  async getPositionsBySymbol(symbol: string, filter?: any): Promise<any[]> {
    return await this.getAllPositions({ ...filter, symbol });
  }

  /**
   * Get orders filtered by broker.
   */
  async getOrdersByBroker(brokerId: string, filter?: any): Promise<any[]> {
    return await this.getAllOrders({ ...filter, brokerId });
  }

  /**
   * Get positions filtered by broker.
   */
  async getPositionsByBroker(brokerId: string, filter?: any): Promise<any[]> {
    return await this.getAllPositions({ ...filter, brokerId });
  }



  /**
   * Place a stock market order.
   */
  async placeStockMarketOrder(
    symbol: string,
    quantity: number,
    side: 'buy' | 'sell',
    broker?: string,
    accountNumber?: string
  ): Promise<any> {
    const orderParams: any = {
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
  async placeStockLimitOrder(
    symbol: string,
    quantity: number,
    side: 'buy' | 'sell',
    price: number,
    timeInForce: 'day' | 'gtc' = 'gtc',
    broker?: string,
    accountNumber?: string
  ): Promise<any> {
    const orderParams: any = {
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
  async placeStockStopOrder(
    symbol: string,
    quantity: number,
    side: 'buy' | 'sell',
    stopPrice: number,
    timeInForce: 'day' | 'gtc' = 'gtc',
    broker?: string,
    accountNumber?: string
  ): Promise<any> {
    const orderParams: any = {
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
  async placeCryptoMarketOrder(
    symbol: string,
    quantity: number,
    side: 'buy' | 'sell',
    broker?: string,
    accountNumber?: string
  ): Promise<any> {
    const orderParams: any = {
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
  async placeCryptoLimitOrder(
    symbol: string,
    quantity: number,
    side: 'buy' | 'sell',
    price: number,
    timeInForce: 'day' | 'gtc' = 'gtc',
    broker?: string,
    accountNumber?: string
  ): Promise<any> {
    const orderParams: any = {
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
  async placeOptionsMarketOrder(
    symbol: string,
    quantity: number,
    side: 'buy' | 'sell',
    broker?: string,
    accountNumber?: string
  ): Promise<any> {
    const orderParams: any = {
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
  async placeOptionsLimitOrder(
    symbol: string,
    quantity: number,
    side: 'buy' | 'sell',
    price: number,
    timeInForce: 'day' | 'gtc' = 'gtc',
    broker?: string,
    accountNumber?: string
  ): Promise<any> {
    const orderParams: any = {
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
  async placeFuturesMarketOrder(
    symbol: string,
    quantity: number,
    side: 'buy' | 'sell',
    broker?: string,
    accountNumber?: string
  ): Promise<any> {
    const orderParams: any = {
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
  async placeFuturesLimitOrder(
    symbol: string,
    quantity: number,
    side: 'buy' | 'sell',
    price: number,
    timeInForce: 'day' | 'gtc' = 'gtc',
    broker?: string,
    accountNumber?: string
  ): Promise<any> {
    const orderParams: any = {
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
  async placeOrder(orderParams: any, extras?: any): Promise<any> {
    return await this.brokers.placeOrder(orderParams, extras);
  }

  /**
   * Modify an existing order.
   */
  async modifyOrder(orderId: string, orderParams: any, extras?: any): Promise<any> {
    return await this.brokers.modifyOrder(orderId, orderParams, extras);
  }

  /**
   * Cancel an existing order.
   */
  async cancelOrder(orderId: string, accountNumber?: string, connectionId?: string): Promise<any> {
    return await this.brokers.cancelOrder(orderId, undefined, accountNumber, connectionId);
  }

}
