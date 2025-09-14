/**
 * Main client class for the Finatic Server SDK.
 */

import { ApiClient } from './ApiClient';
import {
  DeviceInfo,
  SessionInitResponse,
  SessionResponse,
  OtpRequestResponse,
  OtpVerifyResponse,
  SessionAuthenticateResponse,
  UserToken,
  Holding,
  Portfolio,
  BrokerInfo,
  BrokerAccount,
  BrokerOrder,
  BrokerPosition,
  BrokerConnection,
  BrokerDataOptions,
  OrdersFilter,
  PositionsFilter,
  OrderResponse,
  BrokerOrderParams,
  BrokerExtras,
  TradingContext,
  PaginatedResult,
  SessionUserResponse,
  ApiPaginationInfo,
} from '../../types';
import {
  AuthenticationError,
} from './ApiClient';

export class FinaticServerClient {
  private apiClient: ApiClient;
  private apiKey: string;

  // Session state
  private sessionId?: string | undefined;
  private companyId?: string | undefined;
  private userToken?: UserToken;
  private oneTimeToken?: string;

  // Trading context
  private tradingContext: TradingContext = {};

  constructor(
    apiKey: string,
    baseUrl: string = 'https://api.finatic.dev',
    deviceInfo?: DeviceInfo,
    timeout: number = 30000
  ) {
    this.apiKey = apiKey;

    // Initialize API client
    this.apiClient = new ApiClient(baseUrl, deviceInfo, timeout);
  }

  async initialize(): Promise<void> {
    // Initialize the API client if needed
    // This method can be used for any async initialization
  }

  async close(): Promise<void> {
    await this.apiClient.close();
  }

  private async initializeSession(): Promise<string> {
    /** Initialize a session by getting a one-time token. */
    if (this.oneTimeToken) {
      return this.oneTimeToken;
    }

    // Call the session init endpoint with API key
    const response = await this.apiClient.request<SessionInitResponse>('POST', '/auth/session/init', undefined, undefined, undefined, {
      'X-API-Key': this.apiKey,
    });

    console.log('Session init response:', JSON.stringify(response, null, 2));

    this.oneTimeToken = response.data?.['one_time_token'] as string;
    console.log('Extracted oneTimeToken:', this.oneTimeToken);
    return this.oneTimeToken;
  }

  async start_session(userId?: string): Promise<SessionResponse> {
    /** Start a session with the one-time token. */
    // Get one-time token if not already available
    const token = await this.initializeSession();

    // Start session
    const response = await this.apiClient.request<SessionResponse>('POST', '/auth/session/start', {
      user_id: userId,
    }, undefined, undefined, {
      'One-Time-Token': token,
    });

    // Debug: Log the response to see the structure
    console.log('Session response:', JSON.stringify(response, null, 2));

    // Extract session_id from the response - matches client SDK pattern
    this.sessionId = response.data?.session_id ?? undefined;
    this.companyId = response.data?.company_id ?? undefined;
    
    console.log('Extracted sessionId:', this.sessionId);
    console.log('Extracted companyId:', this.companyId);

    // Set session context in API client (only if we have session ID)
    if (this.sessionId) {
      this.apiClient.setSessionId(this.sessionId);
      if (this.companyId) {
        this.apiClient.setCompanyId(this.companyId);
      }
    }

    return response;
  }

  async request_otp(email: string): Promise<OtpRequestResponse> {
    /** Request OTP for session authentication. */
    if (!this.sessionId) {
      throw new AuthenticationError('Session not initialized. Call start_session() first.');
    }

    const response = await this.apiClient.request<OtpRequestResponse>('POST', '/auth/otp/request', {
      email: email,
    });

    return response;
  }

  async verify_otp(otp: string): Promise<OtpVerifyResponse> {
    /** Verify OTP for session authentication. */
    if (!this.sessionId) {
      throw new AuthenticationError('Session not initialized. Call start_session() first.');
    }

    const response = await this.apiClient.request<OtpVerifyResponse>('POST', '/auth/otp/verify', {
      otp: otp,
    });

    // Store tokens
    if (response.success && response.data) {
      this.userToken = {
        access_token: response.data['access_token'],
        refresh_token: response.data['refresh_token'],
        expires_in: response.data['expires_in'],
        user_id: response.data['user_id'],
        token_type: response.data['token_type'] || 'Bearer',
        scope: response.data['scope'] || '',
      };

      // Set tokens in API client
      const expiresAt = new Date(Date.now() + response.data['expires_in'] * 1000).toISOString();
      this.apiClient.setTokenInfo({
        access_token: response.data['access_token'],
        refresh_token: response.data['refresh_token'],
        expires_at: expiresAt,
        user_id: response.data['user_id'],
      });
    }

    return response;
  }

  async authenticate_directly(userId: string): Promise<SessionAuthenticateResponse> {
    /** Authenticate session directly with user ID. */
    if (!this.sessionId) {
      throw new AuthenticationError('Session not initialized. Call start_session() first.');
    }

    const response = await this.apiClient.request<SessionAuthenticateResponse>('POST', '/auth/session/authenticate', {
      session_id: this.sessionId,
      user_id: userId,
    });

    // Store tokens
    if (response.success && response.data) {
      this.userToken = {
        access_token: response.data['access_token'],
        refresh_token: response.data['refresh_token'],
        expires_in: 3600, // Default 1 hour
        user_id: userId,
        token_type: 'Bearer',
        scope: 'api:access',
      };

      // Set tokens in API client
      const expiresAt = new Date(Date.now() + 3600 * 1000).toISOString();
      this.apiClient.setTokenInfo({
        access_token: response.data['access_token'],
        refresh_token: response.data['refresh_token'],
        expires_at: expiresAt,
        user_id: userId,
      });
    }

    return response;
  }

  async get_portal_url(): Promise<string> {
    /** Get the portal URL for user authentication. */
    if (!this.sessionId) {
      throw new AuthenticationError('Session not initialized. Call start_session() first.');
    }

    try {
      const response = await this.apiClient.request<{data: {portal_url: string}}>('GET', '/auth/session/portal', undefined, undefined, undefined, {
        'Session-ID': this.sessionId,
      });
      return response.data.portal_url;
    } catch (error) {
      throw new AuthenticationError(`Failed to get portal URL: ${error}`);
    }
  }

  async get_session_user(): Promise<Record<string, any>> {
    /** Get the user and tokens for a completed session. */
    if (!this.sessionId) {
      throw new AuthenticationError('Session not initialized. Call start_session() first.');
    }

    try {
      // Call the endpoint with session ID in the path and as Bearer token
      const response = await this.apiClient.request<SessionUserResponse>('GET', `/auth/session/${this.sessionId}/user`, undefined, undefined, this.sessionId);

      // Store tokens internally for future API calls
      this.storeTokens(response);

      // Return user info using the getter methods
      return {
        user_id: response.get_user_id(),
        access_token: response.get_access_token(),
        refresh_token: response.get_refresh_token(),
        expires_in: response.get_expires_in(),
        token_type: response.get_token_type(),
        scope: response.get_scope(),
        company_id: response.get_company_id(),
      };
    } catch (error) {
      throw new AuthenticationError(`Failed to get session user: ${error}`);
    }
  }

  private storeTokens(response: SessionUserResponse): void {
    /** Store tokens from session user response. */
    this.userToken = {
      access_token: response.get_access_token(),
      refresh_token: response.get_refresh_token(),
      expires_in: response.get_expires_in(),
      user_id: response.get_user_id(),
      token_type: response.get_token_type(),
      scope: response.get_scope(),
    };

    // Set tokens in API client
    const expiresAt = new Date(Date.now() + response.get_expires_in() * 1000).toISOString();
    this.apiClient.setTokenInfo({
      access_token: response.get_access_token(),
      refresh_token: response.get_refresh_token(),
      expires_at: expiresAt,
      user_id: response.get_user_id(),
    });
  }

  // Broker methods
  async get_brokers(): Promise<BrokerInfo[]> {
    /** Get available brokers. */
    return await this.apiClient.getBrokers();
  }

  async get_broker_accounts(
    page: number = 1,
    perPage: number = 100,
    options?: BrokerDataOptions,
    filters?: any
  ): Promise<BrokerAccount[]> {
    /** Get broker accounts with pagination support. */
    const offset = (page - 1) * perPage;
    const limit = perPage;
    
    const response = await this.apiClient.request<{ data: BrokerAccount[]; pagination: ApiPaginationInfo }>(
      'GET',
      '/brokers/accounts',
      undefined,
      { ...options, ...filters, offset, limit }
    );
    
    return response.data;
  }

  async get_broker_orders(filter?: OrdersFilter): Promise<PaginatedResult<BrokerOrder[]>> {
    /** Get broker orders. */
    return await this.apiClient.getBrokerOrders(filter);
  }

  async get_broker_positions(filter?: PositionsFilter): Promise<PaginatedResult<BrokerPosition[]>> {
    /** Get broker positions. */
    return await this.apiClient.getBrokerPositions(filter);
  }

  async get_broker_connections(): Promise<BrokerConnection[]> {
    /** Get broker connections. */
    return await this.apiClient.getBrokerConnections();
  }

  async get_broker_list(): Promise<BrokerInfo[]> {
    /** Get broker list using stored access token. */
    return await this.apiClient.getBrokerListAuto();
  }

  async get_all_broker_accounts(
    options?: BrokerDataOptions,
    filters?: any
  ): Promise<BrokerAccount[]> {
    /** Get all broker accounts across all pages. */
    const allAccounts: BrokerAccount[] = [];
    let page = 1;
    const perPage = 100;

    while (true) {
      const result = await this.get_broker_accounts(page, perPage, options, filters);
      if (!result || result.length === 0) {
        break;
      }
      allAccounts.push(...result);
      if (result.length < perPage) {
        break;
      }
      page++;
    }

    return allAccounts;
  }

  // Trading methods
  async place_order(order: Record<string, any>, extras?: BrokerExtras): Promise<OrderResponse> {
    /** Place a new order using the broker order API. */
    if (!this.is_authenticated()) {
      throw new AuthenticationError('Not authenticated. Please complete authentication first.');
    }

    // Convert order format to match broker API
    const brokerOrder: BrokerOrderParams = {
      broker: order['broker'] || this.tradingContext.broker || 'robinhood',
      account_number: order['account_number'] || this.tradingContext.account_number || '',
      symbol: order['symbol'],
      order_qty: order['quantity'],
      action: order['side']?.toLowerCase() === 'buy' ? 'Buy' : 'Sell',
      order_type: order['order_type']?.charAt(0).toUpperCase() + order['order_type']?.slice(1) || 'Market',
      asset_type: order['asset_type'] || 'Stock',
      time_in_force: order['time_in_force'] || 'day',
      price: order['price'],
      stop_price: order['stop_price'],
      order_id: order['order_id'],
    };

    return await this.apiClient.placeOrder(brokerOrder, extras || order['extras']);
  }

  async modify_order(
    orderId: string,
    modifications: Record<string, any>,
    broker?: string
  ): Promise<OrderResponse> {
    /** Modify a broker order. */
    if (!this.is_authenticated()) {
      throw new AuthenticationError('Not authenticated. Please complete authentication first.');
    }

    // Convert modifications to broker format
    const brokerModifications: Record<string, any> = {};
    const fieldMapping: Record<string, string> = {
      symbol: 'symbol',
      quantity: 'order_qty',
      price: 'price',
      stop_price: 'stop_price',
      time_in_force: 'time_in_force',
      order_type: 'order_type',
      side: 'action',
      order_id: 'order_id',
      order_qty: 'order_qty',
      qty: 'order_qty',
      size: 'order_qty',
    };

    for (const [key, value] of Object.entries(modifications)) {
      if (key in fieldMapping && value !== null && value !== undefined) {
        brokerModifications[fieldMapping[key] as string] = value;
      }
    }

    const brokerOrder: BrokerOrderParams = {
      broker: broker || this.tradingContext.broker || 'robinhood',
      account_number: this.tradingContext.account_number || '',
      symbol: brokerModifications['symbol'] || '',
      order_qty: brokerModifications['order_qty'] || 0,
      action: brokerModifications['action'] || 'Buy',
      order_type: brokerModifications['order_type'] || 'Market',
      asset_type: 'Stock',
      time_in_force: brokerModifications['time_in_force'] || 'day',
      price: brokerModifications['price'],
      stop_price: brokerModifications['stop_price'],
      order_id: orderId,
    };

    return await this.apiClient.modifyOrder(orderId, brokerOrder);
  }

  async cancel_order(
    orderId: string
  ): Promise<OrderResponse> {
    /** Cancel a broker order. */
    if (!this.is_authenticated()) {
      throw new AuthenticationError('Not authenticated. Please complete authentication first.');
    }

    return await this.apiClient.cancelOrder(orderId);
  }

  async get_order(orderId: string): Promise<BrokerOrder> {
    /** Get order details. */
    if (!this.is_authenticated()) {
      throw new AuthenticationError('Not authenticated. Please complete authentication first.');
    }

    return await this.apiClient.getOrder(orderId);
  }

  async get_orders(filter?: OrdersFilter): Promise<PaginatedResult<BrokerOrder[]>> {
    /** Get orders. */
    if (!this.is_authenticated()) {
      throw new AuthenticationError('Not authenticated. Please complete authentication first.');
    }

    return await this.apiClient.getOrders(filter);
  }

  // Convenience methods - Stock
  async place_stock_market_order(
    symbol: string,
    quantity: number,
    side: string,
    broker?: string,
    accountNumber?: string | number
  ): Promise<OrderResponse> {
    /** Place a stock market order. */
    if (!this.is_authenticated()) {
      throw new AuthenticationError('Not authenticated. Please complete authentication first.');
    }

    return await this.apiClient.placeStockMarketOrder(symbol, quantity, side, broker, accountNumber);
  }

  async place_stock_limit_order(
    symbol: string,
    quantity: number,
    side: string,
    price: number,
    timeInForce: string = 'gtc',
    broker?: string,
    accountNumber?: string | number
  ): Promise<OrderResponse> {
    /** Place a stock limit order. */
    if (!this.is_authenticated()) {
      throw new AuthenticationError('Not authenticated. Please complete authentication first.');
    }

    return await this.apiClient.placeStockLimitOrder(symbol, quantity, side, price, timeInForce, broker, accountNumber);
  }

  async place_stock_stop_order(
    symbol: string,
    quantity: number,
    side: string,
    stopPrice: number,
    timeInForce: string = 'day',
    broker?: string,
    accountNumber?: string | number
  ): Promise<OrderResponse> {
    /** Place a stock stop order. */
    if (!this.is_authenticated()) {
      throw new AuthenticationError('Not authenticated. Please complete authentication first.');
    }

    return await this.apiClient.placeStockStopOrder(symbol, quantity, side, stopPrice, timeInForce, broker, accountNumber);
  }

  // Portfolio methods
  async get_portfolio(): Promise<Portfolio> {
    /** Get portfolio information. */
    return await this.apiClient.getPortfolio();
  }

  async get_holdings(): Promise<Holding[]> {
    /** Get portfolio holdings. */
    return await this.apiClient.getHoldings();
  }

  async get_positions(filter?: PositionsFilter): Promise<PaginatedResult<BrokerPosition[]>> {
    /** Get portfolio positions. */
    return await this.apiClient.getPositions(filter);
  }

  // Trading context methods
  set_broker(broker: string): void {
    /** Set the current broker. */
    this.tradingContext.broker = broker;
    this.apiClient.setBroker(broker);
  }

  set_account(accountNumber: string, accountId?: string): void {
    /** Set the current account. */
    this.tradingContext.account_number = accountNumber;
    this.tradingContext.account_id = accountId;
    this.apiClient.setAccount(accountNumber, accountId);
  }

  get_trading_context(): TradingContext {
    /** Get the current trading context. */
    return this.tradingContext;
  }

  set_trading_context(context: TradingContext): void {
    /** Set the trading context. */
    this.tradingContext = context;
    if (context.broker) {
      this.apiClient.setBroker(context.broker);
    }
    if (context.account_number) {
      this.apiClient.setAccount(context.account_number, context.account_id);
    }
  }

  clear_trading_context(): void {
    /** Clear the trading context. */
    this.tradingContext = {};
    this.apiClient.clearTradingContext();
  }

  // Utility methods
  get_user_id(): string | undefined {
    /** Get the current user ID. */
    return this.userToken?.user_id;
  }

  get_session_id(): string | undefined {
    /** Get the current session ID. */
    return this.sessionId;
  }

  get_company_id(): string | undefined {
    /** Get the current company ID. */
    return this.companyId;
  }

  get_user_token(): UserToken | undefined {
    /** Get the current user token. */
    return this.userToken;
  }

  is_authenticated(): boolean {
    /** Check if client is authenticated. */
    return !!(this.userToken && this.sessionId);
  }

  is_authed(): boolean {
    /** Return true if the client has a valid access and refresh token. */
    const tokenInfo = this.apiClient.getTokenInfo();
    if (!tokenInfo) {
      return false;
    }

    const { access_token, refresh_token, expires_at } = tokenInfo;
    if (!access_token || !refresh_token) {
      return false;
    }

    // Check if access token is expired
    if (expires_at) {
      try {
        const expiresAt = new Date(expires_at);
        if (expiresAt <= new Date()) {
          return false;
        }
      } catch {
        // If we can't parse the date, assume it's valid
      }
    }

    return true;
  }

}
