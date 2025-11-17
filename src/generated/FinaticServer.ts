/**
 * Main client class for Finatic Server SDK (Node.js).
 * 
 * This file is regenerated on each run - do not edit directly.
 * For custom logic, extend this class or use custom wrappers.
 */

import { Configuration } from './configuration';
import { SdkConfig, defaultConfig } from './config';
import { appendThemeToURL, appendBrokerFilterToURL } from './utils/url-utils';
import { getLogger, type Logger } from './utils/logger';
import type { SessionStartRequest } from './models';
import { BrokersApi } from './api/brokers-api';
import { SessionApi } from './api/session-api';
import { BrokersWrapper } from './wrappers/brokers';
import { SessionWrapper } from './wrappers/session';

export interface PortalOptions {
  theme?: string | { preset?: string; custom?: Record<string, unknown> };
  brokers?: string[];
  email?: string;
  mode?: 'light' | 'dark';
}

export class FinaticServer {
  private config: Configuration;
  private sdkConfig: SdkConfig;
  private sessionId?: string;
  private companyId?: string;
  private csrfToken?: string;
  private userId?: string;
  private logger: Logger;

  public readonly brokers: BrokersWrapper;
  public readonly session: SessionWrapper;

  private apiKey: string;

  constructor(apiKey: string, baseUrl?: string, sdkConfig?: Partial<SdkConfig>) {
    this.apiKey = apiKey;
    this.config = new Configuration({
      basePath: baseUrl || 'https://api.finatic.dev',
      apiKey: apiKey,
    });
    this.sdkConfig = { ...defaultConfig, ...sdkConfig };

    // Initialize logger
    this.logger = getLogger(this.sdkConfig);

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
   * Initialize a session by getting a one-time token (internal/private).
   */
  private async _initSession(xApiKey: string): Promise<string> {
    const response = await this.session.initSession({ xApiKey });
    if (response.Error) {
      throw new Error(response.Error.message || 'Failed to initialize session');
    }
    return response.success?.data?.one_time_token || '';
  }

  /**
   * Start a session with a one-time token.
   */
  async startSession(oneTimeToken: string, userId?: string): Promise<{ session_id: string; company_id: string }> {
    const requestBody: SessionStartRequest = userId !== undefined ? { user_id: userId } : {};
    const response = await this.session.startSession({ OneTimeToken: oneTimeToken, body: requestBody });
    if (response.Error) {
      throw new Error(response.Error.message || 'Failed to start session');
    }
    const sessionId = response.success?.data?.session_id || '';
    const companyId = response.success?.data?.company_id || '';
    // csrf_token is not in SessionResponseData, get from response headers if available
    const csrfToken = (response.success?.data as any)?.csrf_token || '';
    
    if (sessionId && companyId) {
      this.setSessionContext(sessionId, companyId, csrfToken);
    }
    
    return { session_id: sessionId, company_id: companyId };
  }

  /**
   * Convenience method that combines initSession and startSession (Phase 2C).
   * 
   * This method:
   * 1. Gets a one-time token using the API key
   * 2. Starts a session with that token
   * 3. Sets the session context automatically
   * 4. Returns success/error information
   * 
   * @param apiKey - Company API key (uses instance API key if not provided)
   * @param userId - Optional user ID for direct authentication
   * @returns Object with success, session_id, company_id, and error fields
   */
  async initSession(apiKey?: string, userId?: string): Promise<{ success: boolean; session_id: string | null; company_id: string | null; error: string | null }> {
    try {
      // Use provided API key or fall back to instance API key
      const keyToUse = apiKey || this.apiKey || '';
      if (!keyToUse) {
        return {
          success: false,
          session_id: null,
          company_id: null,
          error: 'API key is required',
        };
      }

      // Step 1: Get one-time token
      const oneTimeToken = await this._initSession(keyToUse);
      
      if (!oneTimeToken || typeof oneTimeToken !== 'string') {
        return {
          success: false,
          session_id: null,
          company_id: null,
          error: 'Failed to get one-time token',
        };
      }

      // Step 2: Start session with the token
      const sessionResult = await this.startSession(oneTimeToken, userId);
      
      const sessionId = sessionResult.session_id || null;
      const companyId = sessionResult.company_id || null;

      return {
        success: true,
        session_id: sessionId,
        company_id: companyId,
        error: null,
      };
    } catch (error: any) {
      return {
        success: false,
        session_id: null,
        company_id: null,
        error: error?.message || String(error),
      };
    }
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
    const response = await this.session.getPortalUrl({});
    if (response.Error) {
      throw new Error(response.Error.message || 'Failed to get portal URL');
    }
    
    // Validate response structure
    if (!response.success?.data) {
      throw new Error('Invalid portal URL response: missing data');
    }
    
    let portalUrl = response.success.data.portal_url || '';
    
    // Validate URL before manipulation
    try {
      new URL(portalUrl);
    } catch (error) {
      this.logger.error?.('Invalid portal URL from API', error, { portalUrl });
      throw new Error(`Invalid portal URL received from API: ${portalUrl}`);
    }

    // Append theme if provided
    if (options?.theme) {
      portalUrl = appendThemeToURL(portalUrl, options.theme);
    }

    // Append broker filter if provided
    if (options?.brokers) {
      portalUrl = appendBrokerFilterToURL(portalUrl, options.brokers);
    }

    // Append mode if provided (light or dark)
    if (options?.mode) {
      const url = new URL(portalUrl);
      url.searchParams.set('mode', options.mode);
      portalUrl = url.toString();
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
    
    const response = await this.session.getSessionUser({ sessionId: this.sessionId });
    if (response.Error) {
      throw new Error(response.Error.message || 'Failed to get session user');
    }
    const userId = response.success?.data?.user_id || '';
    const companyId = response.success?.data?.company_id || this.companyId || '';
    
    // Store userId for getUserId() method
    if (userId) {
      this.userId = userId;
    }
    
    return {
      user_id: userId,
      company_id: companyId,
      token_type: (response.success?.data as any)?.token_type || 'Bearer',
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
   * Get current user ID (set after portal authentication).
   */
  getUserId(): string | undefined {
    return this.userId;
  }


  /**
   * Get list of supported brokers.
   * Phase 2C: Handles standard response structure.
   */
  async getBrokerList(): Promise<any[]> {
    const response = await this.brokers.getBrokers({});
    if (response.Error) {
      throw new Error(response.Error.message || 'Failed to get broker list');
    }
    return response.success?.data || [];
  }

  /**
   * Get user's broker connections.
   * Phase 2C: Handles standard response structure.
   */
  async getBrokerConnections(): Promise<any[]> {
    const response = await this.brokers.listBrokerConnections({});
    if (response.Error) {
      throw new Error(response.Error.message || 'Failed to get broker connections');
    }
    return response.success?.data || [];
  }

  /**
   * Get all accounts across all pages.
   * Phase 2C: Uses typed input objects and handles standard response structure.
   */
  async getAllAccounts(filter?: any): Promise<any[]> {
    const allData: any[] = [];
    let offset = 0;
    const limit = 100;
    
    while (true) {
      // Phase 2C: Use typed input object
      const response = await this.brokers.getAccounts({
        limit,
        offset,
      });
      
      // Phase 2C: Check for errors first
      if (response.Error) {
        throw new Error(response.Error.message || 'Failed to get accounts');
      }
      
      // Phase 2C: Unwrap standard response structure
      const result = response.success?.data || [];
      if (!result || result.length === 0) break;
      allData.push(...result);
      if (result.length < limit) break;
      offset += limit;
    }
    
    return allData;
  }

  /**
   * Get all orders across all pages.
   * Phase 2C: Uses typed input objects and handles standard response structure.
   */
  async getAllOrders(filter?: any): Promise<any[]> {
    const allData: any[] = [];
    let offset = 0;
    const limit = 100;
    
    while (true) {
      // Phase 2C: Use typed input object
      const response = await this.brokers.getOrders({
        symbol: filter?.symbol,
        orderStatus: filter?.orderStatus, // Will be coerced to enum
        side: filter?.side, // Will be coerced to enum
        assetType: filter?.assetType, // Will be coerced to enum
        limit,
        offset,
      });
      
      // Phase 2C: Check for errors first
      if (response.Error) {
        throw new Error(response.Error.message || 'Failed to get orders');
      }
      
      // Phase 2C: Unwrap standard response structure
      const result = response.success?.data || [];
      if (!result || result.length === 0) break;
      allData.push(...result);
      if (result.length < limit) break;
      offset += limit;
    }
    
    return allData;
  }

  /**
   * Get all positions across all pages.
   * Phase 2C: Uses typed input objects and handles standard response structure.
   */
  async getAllPositions(filter?: any): Promise<any[]> {
    const allData: any[] = [];
    let offset = 0;
    const limit = 100;
    
    while (true) {
      // Phase 2C: Use typed input object
      const response = await this.brokers.getPositions({
        symbol: filter?.symbol,
        side: filter?.side, // Will be coerced to enum
        assetType: filter?.assetType, // Will be coerced to enum
        positionStatus: filter?.positionStatus, // Will be coerced to enum
        limit,
        offset,
      });
      
      // Phase 2C: Check for errors first
      if (response.Error) {
        throw new Error(response.Error.message || 'Failed to get positions');
      }
      
      // Phase 2C: Unwrap standard response structure
      const result = response.success?.data || [];
      if (!result || result.length === 0) break;
      allData.push(...result);
      if (result.length < limit) break;
      offset += limit;
    }
    
    return allData;
  }

  /**
   * Get all balances across all pages.
   * Phase 2C: Uses typed input objects and handles standard response structure.
   */
  async getAllBalances(filter?: any): Promise<any[]> {
    const allData: any[] = [];
    let offset = 0;
    const limit = 100;
    
    while (true) {
      // Phase 2C: Use typed input object
      const response = await this.brokers.getBalances({
        isEndOfDaySnapshot: filter?.isEndOfDaySnapshot,
        limit,
        offset,
      });
      
      // Phase 2C: Check for errors first
      if (response.Error) {
        throw new Error(response.Error.message || 'Failed to get balances');
      }
      
      // Phase 2C: Unwrap standard response structure
      const result = response.success?.data || [];
      if (!result || result.length === 0) break;
      allData.push(...result);
      if (result.length < limit) break;
      offset += limit;
    }
    
    return allData;
  }

  /**
   * Get paginated accounts.
   * Phase 2C: Uses typed input objects and handles standard response structure.
   */
  async getAccounts(page: number = 1, perPage: number = 100, filter?: any): Promise<any> {
    const offset = (page - 1) * perPage;
    const response = await this.brokers.getAccounts({
      limit: perPage,
      offset,
    });
    if (response.Error) {
      throw new Error(response.Error.message || 'Failed to get accounts');
    }
    return response.success?.data || [];
  }

  /**
   * Get paginated orders.
   * Phase 2C: Uses typed input objects and handles standard response structure.
   */
  async getOrders(page: number = 1, perPage: number = 100, filter?: any): Promise<any> {
    const offset = (page - 1) * perPage;
    const response = await this.brokers.getOrders({
      symbol: filter?.symbol,
      orderStatus: filter?.orderStatus, // Will be coerced to enum
      side: filter?.side, // Will be coerced to enum
      assetType: filter?.assetType, // Will be coerced to enum
      limit: perPage,
      offset,
    });
    if (response.Error) {
      throw new Error(response.Error.message || 'Failed to get orders');
    }
    return response.success?.data || [];
  }

  /**
   * Get paginated positions.
   * Phase 2C: Uses typed input objects and handles standard response structure.
   */
  async getPositions(page: number = 1, perPage: number = 100, filter?: any): Promise<any> {
    const offset = (page - 1) * perPage;
    const response = await this.brokers.getPositions({
      symbol: filter?.symbol,
      side: filter?.side, // Will be coerced to enum
      assetType: filter?.assetType, // Will be coerced to enum
      positionStatus: filter?.positionStatus, // Will be coerced to enum
      limit: perPage,
      offset,
    });
    if (response.Error) {
      throw new Error(response.Error.message || 'Failed to get positions');
    }
    return response.success?.data || [];
  }

  /**
   * Get paginated balances.
   * Phase 2C: Uses typed input objects and handles standard response structure.
   */
  async getBalances(page: number = 1, perPage: number = 100, filter?: any): Promise<any> {
    const offset = (page - 1) * perPage;
    const response = await this.brokers.getBalances({
      isEndOfDaySnapshot: filter?.isEndOfDaySnapshot,
      limit: perPage,
      offset,
    });
    if (response.Error) {
      throw new Error(response.Error.message || 'Failed to get balances');
    }
    return response.success?.data || [];
  }

  /**
   * Get only open positions.
   * Phase 2C: Uses enum coercion (case-insensitive string matching).
   */
  async getOpenPositions(filter?: any): Promise<any[]> {
    // Phase 2C: Enum coercion happens in getAllPositions via typed input object
    return await this.getAllPositions({ ...filter, positionStatus: 'active' });
  }

  /**
   * Get only filled orders.
   * Phase 2C: Uses enum coercion (case-insensitive string matching).
   */
  async getFilledOrders(filter?: any): Promise<any[]> {
    // Phase 2C: Enum coercion happens in getAllOrders via typed input object
    return await this.getAllOrders({ ...filter, orderStatus: 'filled' });
  }

  /**
   * Get only pending orders.
   * Phase 2C: Uses enum coercion (case-insensitive string matching).
   */
  async getPendingOrders(filter?: any): Promise<any[]> {
    // Phase 2C: Enum coercion happens in getAllOrders via typed input object
    return await this.getAllOrders({ ...filter, orderStatus: 'new' });
  }

  /**
   * Get only active accounts.
   * Phase 2C: Uses enum coercion (case-insensitive string matching).
   */
  async getActiveAccounts(filter?: any): Promise<any[]> {
    // Phase 2C: Enum coercion happens in getAllAccounts via typed input object
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
   * Get all order groups across all pages.
   * Phase 2C: Uses typed input objects and handles standard response structure.
   */
  async getAllOrderGroups(filter?: any): Promise<any[]> {
    const allData: any[] = [];
    let offset = 0;
    const limit = 100;
    
    while (true) {
      const response = await this.brokers.getOrderGroups({
        brokerId: filter?.brokerId,
        connectionId: filter?.connectionId,
        limit,
        offset,
        createdAfter: filter?.createdAfter,
        createdBefore: filter?.createdBefore,
      });
      
      // Phase 2C: Check for errors first
      if (response.Error) {
        throw new Error(response.Error.message || 'Failed to get order groups');
      }
      
      const result = response.success?.data || [];
      if (!result || result.length === 0) break;
      allData.push(...result);
      if (result.length < limit) break;
      offset += limit;
    }
    
    return allData;
  }

  /**
   * Get paginated order groups.
   * Phase 2C: Uses typed input objects and handles standard response structure.
   */
  async getOrderGroups(page: number = 1, perPage: number = 100, filter?: any): Promise<any> {
    const offset = (page - 1) * perPage;
    const response = await this.brokers.getOrderGroups({
      brokerId: filter?.brokerId,
      connectionId: filter?.connectionId,
      limit: perPage,
      offset,
      createdAfter: filter?.createdAfter,
      createdBefore: filter?.createdBefore,
    });
    return response.success?.data || [];
  }

  /**
   * Get all position lots across all pages.
   * Phase 2C: Uses typed input objects and handles standard response structure.
   */
  async getAllPositionLots(filter?: any): Promise<any[]> {
    const allData: any[] = [];
    let offset = 0;
    const limit = 100;
    
    while (true) {
      const response = await this.brokers.getPositionLots({
        brokerId: filter?.brokerId,
        connectionId: filter?.connectionId,
        accountId: filter?.accountId,
        symbol: filter?.symbol,
        positionId: filter?.positionId,
        limit,
        offset,
      });
      
      // Phase 2C: Check for errors first
      if (response.Error) {
        throw new Error(response.Error.message || 'Failed to get position lots');
      }
      
      const result = response.success?.data || [];
      if (!result || result.length === 0) break;
      allData.push(...result);
      if (result.length < limit) break;
      offset += limit;
    }
    
    return allData;
  }

  /**
   * Get paginated position lots.
   * Phase 2C: Uses typed input objects and handles standard response structure.
   */
  async getPositionLots(page: number = 1, perPage: number = 100, filter?: any): Promise<any> {
    const offset = (page - 1) * perPage;
    const response = await this.brokers.getPositionLots({
      brokerId: filter?.brokerId,
      connectionId: filter?.connectionId,
      accountId: filter?.accountId,
      symbol: filter?.symbol,
      positionId: filter?.positionId,
      limit: perPage,
      offset,
    });
    return response.success?.data || [];
  }

  /**
   * Disconnect company from broker.
   * Phase 2C: Uses typed input objects and handles standard response structure.
   */
  async disconnectCompany(connectionId: string): Promise<any> {
    if (!this.sessionId) {
      throw new Error('Session not initialized. Call startSession() first.');
    }
    const response = await this.brokers.disconnectCompanyFromBroker({ connectionId });
    return response.success?.data || null;
  }

  /**
   * Get order fills for a specific order.
   * Phase 2C: Uses typed input objects and handles standard response structure.
   */
  async getOrderFills(orderId: string, page: number = 1, perPage: number = 100, filter?: any): Promise<any> {
    if (!this.sessionId) {
      throw new Error('Session not initialized. Call startSession() first.');
    }
    const offset = (page - 1) * perPage;
    const response = await this.brokers.getOrderFills({
      orderId,
      connectionId: filter?.connectionId,
      limit: perPage,
      offset,
    });
    return response.success?.data || [];
  }

  /**
   * Get order events for a specific order.
   * Phase 2C: Uses typed input objects and handles standard response structure.
   */
  async getOrderEvents(orderId: string, page: number = 1, perPage: number = 100, filter?: any): Promise<any> {
    if (!this.sessionId) {
      throw new Error('Session not initialized. Call startSession() first.');
    }
    const offset = (page - 1) * perPage;
    const response = await this.brokers.getOrderEvents({
      orderId,
      connectionId: filter?.connectionId,
      limit: perPage,
      offset,
    });
    return response.success?.data || [];
  }

  /**
   * Get position lot fills for a specific lot.
   * Phase 2C: Uses typed input objects and handles standard response structure.
   */
  async getPositionLotFills(lotId: string, page: number = 1, perPage: number = 100, filter?: any): Promise<any> {
    if (!this.sessionId) {
      throw new Error('Session not initialized. Call startSession() first.');
    }
    const offset = (page - 1) * perPage;
    const response = await this.brokers.getPositionLotFills({
      lotId,
      connectionId: filter?.connectionId,
      limit: perPage,
      offset,
    });
    return response.success?.data || [];
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
    return await this.brokers.placeOrder({ body: orderParams });
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
    return await this.brokers.placeOrder({ body: orderParams });
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
    return await this.brokers.placeOrder({ body: orderParams });
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
    return await this.brokers.placeOrder({ body: orderParams });
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
    return await this.brokers.placeOrder({ body: orderParams });
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
    return await this.brokers.placeOrder({ body: orderParams });
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
    return await this.brokers.placeOrder({ body: orderParams });
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
    return await this.brokers.placeOrder({ body: orderParams });
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
    return await this.brokers.placeOrder({ body: orderParams });
  }

  /**
   * Place a generic order.
   */
  async placeOrder(orderParams: any): Promise<any> {
    return await this.brokers.placeOrder({ body: orderParams });
  }

  /**
   * Modify an existing order.
   */
  async modifyOrder(orderId: string, orderParams: any): Promise<any> {
    return await this.brokers.modifyOrder({ orderId, body: orderParams });
  }

  /**
   * Cancel an existing order.
   */
  async cancelOrder(orderId: string, accountNumber?: string, connectionId?: string): Promise<any> {
    return await this.brokers.cancelOrder({ orderId, ...(accountNumber ? { accountNumber } : {}), ...(connectionId ? { connectionId } : {}) });
  }

}
