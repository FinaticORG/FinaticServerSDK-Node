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
  BrokerInfo,
  BrokerAccount,
  BrokerOrder,
  BrokerPosition,
  BrokerConnection,
  Balance,
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
  ApiError,
  ValidationError,
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

  // Portal configuration
  private portalTheme?: any;
  private portalBrokers?: string[];
  private portalEmail?: string;
  

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
    // Always get a fresh token for each session start attempt (matching Python SDK behavior)
    // This ensures we don't reuse expired tokens
    this.oneTimeToken = undefined;

    console.log(`🔑 Initializing session with API key: ${this.apiKey.substring(0, 10)}...`);
    console.log(`🔗 Base URL: ${this.apiClient.getBaseUrl()}`);

    if (!this.apiKey || this.apiKey.trim().length === 0) {
      throw new AuthenticationError('API key is empty or not set');
    }

    // Call the session init endpoint with API key
    console.log(`🚀 About to make session init request...`);
    const response = await this.apiClient.request<SessionInitResponse>('POST', '/session/init', undefined, undefined, undefined, {
      'X-API-Key': this.apiKey,
    });
    console.log(`✅ Session init response received:`, response);

    this.oneTimeToken = response.data?.['one_time_token'] as string;
    console.log('Extracted oneTimeToken:', this.oneTimeToken);
    return this.oneTimeToken;
  }

  async start_session(userId?: string): Promise<SessionResponse> {
    /** Start a session with the one-time token. */
    // Clear any previous session state (matching Python SDK behavior)
    this.sessionId = undefined;
    this.companyId = undefined;
    this.userToken = undefined;
    this.oneTimeToken = undefined;

    // Also clear API client state (matching Python SDK behavior)
    this.apiClient.clearSessionState();

    console.log(`🚀 Starting new session for user_id: ${userId || 'None'}`);

    // Get one-time token if not already available
    const token = await this.initializeSession();
    console.log(`🔑 Got one-time token: ${token ? token.substring(0, 20) + '...' : 'None'}`);

    // Start session
    console.log(`📡 Making session start request to /session/start`);
    const response = await this.apiClient.request<SessionResponse>('POST', '/session/start', {
      user_id: userId,
    }, undefined, undefined, {
      'One-Time-Token': token,
    });
    console.log(`✅ Session start response received:`, response);

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

  async set_user_id(_userId: string): Promise<void> {
    /** Set the user ID for the current session. */
    if (!this.sessionId) {
      throw new AuthenticationError('Session not initialized. Please start a session first.');
    }

    // Note: userId is stored in userToken.user_id
    // Update the API client with the new user ID if needed
    // Note: setUserId method needs to be implemented in ApiClient if needed
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

  async get_portal_url(theme?: any, brokers?: string[], email?: string): Promise<string> {
    /** Get the portal URL for user authentication with optional theming and configuration. */
    if (!this.sessionId) {
      throw new AuthenticationError('Session not initialized. Call start_session() first.');
    }

    try {
      const response = await this.apiClient.request<{data: {portal_url: string}}>('GET', '/session/portal', undefined, undefined, undefined, {
        'Session-ID': this.sessionId,
      });
      
      let portal_url = response.data.portal_url;
      
      // Use stored configuration as defaults if not provided
      const finalTheme = theme || this.portalTheme;
      const finalBrokers = brokers || this.portalBrokers;
      const finalEmail = email || this.portalEmail;
      
      // Apply theming and configuration to the URL
      portal_url = this.applyPortalConfig(portal_url, finalTheme, finalBrokers, finalEmail);
      
      return portal_url;
    } catch (error) {
      throw new AuthenticationError(`Failed to get portal URL: ${error}`);
    }
  }

  private applyPortalConfig(baseUrl: string, theme?: any, brokers?: string[], email?: string): string {
    /** Apply theming and configuration to a portal URL. */
    try {
      const url = new URL(baseUrl);
      
      // Apply theme configuration
      if (theme) {
        if (theme.preset) {
          url.searchParams.set('theme', theme.preset);
        } else if (theme.custom) {
          // Encode custom theme as base64 JSON
          const themeJson = JSON.stringify(theme.custom);
          const themeB64 = Buffer.from(themeJson).toString('base64');
          url.searchParams.set('theme', 'custom');
          url.searchParams.set('themeObject', themeB64);
        }
      }
      
      // Apply broker filtering
      if (brokers && brokers.length > 0) {
        // Convert broker names to IDs and encode
        const supportedBrokers: Record<string, string> = {
          'alpaca': 'alpaca',
          'robinhood': 'robinhood',
          'tasty_trade': 'tasty_trade',
          'ninja_trader': 'ninja_trader',
          'tradovate': 'ninja_trader', // Alias
          'interactive_brokers': 'interactive_brokers',
        };
        
        const brokerIds: string[] = [];
        for (const broker of brokers) {
          const brokerId = supportedBrokers[broker.toLowerCase()];
          if (brokerId) {
            brokerIds.push(brokerId);
          }
        }
        
        if (brokerIds.length > 0) {
          const brokersJson = JSON.stringify(brokerIds);
          const brokersB64 = Buffer.from(brokersJson).toString('base64');
          url.searchParams.set('brokers', brokersB64);
        }
      }
      
      // Apply email parameter
      if (email) {
        url.searchParams.set('email', email);
      }
      
      return url.toString();
      
    } catch (error) {
      // If URL manipulation fails, return original URL
      console.warn(`Warning: Failed to apply portal configuration: ${error}`);
      return baseUrl;
    }
  }

  async get_session_user(): Promise<Record<string, any>> {
    /** Get the user and tokens for a completed session. */
    if (!this.sessionId) {
      throw new AuthenticationError('Session not initialized. Call start_session() first.');
    }

    if (!this.companyId) {
      throw new AuthenticationError('Company ID not available. Session may not be properly initialized.');
    }

    try {
      // Call the endpoint with session ID in the path and as Bearer token
      const response = await this.apiClient.getSessionUser(this.sessionId, this.companyId);

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

    // Also store tokens in ApiClient for API calls
    const expiresAt = response.get_expires_in() ? new Date(Date.now() + response.get_expires_in() * 1000).toISOString() : undefined;
    this.apiClient.setTokenInfo({
      access_token: response.get_access_token(),
      refresh_token: response.get_refresh_token(),
      expires_at: expiresAt,
      user_id: response.get_user_id(),
      token_type: response.get_token_type(),
      scope: response.get_scope(),
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
  ): Promise<PaginatedResult<BrokerAccount[]>> {
    /** Get broker accounts with pagination support (matching Python SDK). */
    const offset = (page - 1) * perPage;
    const limit = perPage;

    // Build query parameters (matching Python SDK)
    const params: Record<string, any> = {
      limit: limit.toString(),
      offset: offset.toString(),
      ...filters,
    };

    if (options) {
      if (options.broker_name) {
        params.broker_name = options.broker_name;
      }
      if (options.account_id) {
        params.account_id = options.account_id;
      }
    }

    const accessToken = await this.apiClient.getValidAccessToken();
    const response = await this.apiClient.request<{ 
      response_data: BrokerAccount[]; 
      pagination: ApiPaginationInfo 
    }>(
      'GET',
      '/brokers/data/accounts',
      undefined,
      params,
      accessToken
    );

    // Create navigation callback for pagination (matching Python SDK)
    const navigationCallback = async (newOffset: number, newLimit: number): Promise<PaginatedResult<BrokerAccount[]>> => {
      const newParams: Record<string, any> = {
        limit: newLimit.toString(),
        offset: newOffset.toString(),
        ...filters,
      };

      if (options) {
        if (options.broker_name) {
          newParams.broker_name = options.broker_name;
        }
        if (options.account_id) {
          newParams.account_id = options.account_id;
        }
      }

      const newResponse = await this.apiClient.request<{ 
        response_data: BrokerAccount[]; 
        pagination: ApiPaginationInfo 
      }>(
        'GET',
        '/brokers/data/accounts',
        undefined,
        newParams,
        accessToken
      );

      const paginationInfo: ApiPaginationInfo = {
        has_more: newResponse.pagination?.has_more ?? false,
        next_offset: newResponse.pagination?.next_offset ?? newOffset,
        current_offset: newResponse.pagination?.current_offset ?? newOffset,
        limit: newResponse.pagination?.limit ?? newLimit,
      };

      return new PaginatedResult(
        newResponse.response_data || [],
        paginationInfo,
        navigationCallback
      );
    };

    const paginationInfo: ApiPaginationInfo = {
      has_more: response.pagination?.has_more ?? false,
      next_offset: response.pagination?.next_offset ?? offset,
      current_offset: response.pagination?.current_offset ?? offset,
      limit: response.pagination?.limit ?? perPage,
    };

    return new PaginatedResult(
      response.response_data || [],
      paginationInfo,
      navigationCallback
    );
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
    _options?: BrokerDataOptions,
    filters?: any
  ): Promise<BrokerAccount[]> {
    /** Get all broker accounts across all pages. */
    const allAccounts: BrokerAccount[] = [];
    let currentResult: PaginatedResult<BrokerAccount[]> | null = null;
    let page = 1;
    const perPage = 100;

    // Get first page
    currentResult = await this.get_broker_accounts(page, perPage, _options, filters);

    while (currentResult) {
      if (!currentResult.data || currentResult.data.length === 0) {
        break;
      }
      allAccounts.push(...currentResult.data);

      // Check if there's a next page
      if (currentResult.has_next) {
        currentResult = await currentResult.next_page();
        page++;
      } else {
        break;
      }
    }

    return allAccounts;
  }

  async get_all_broker_orders(
    _options?: BrokerDataOptions,
    filters?: OrdersFilter
  ): Promise<BrokerOrder[]> {
    /** Get all broker orders across all pages. */
    const allOrders: BrokerOrder[] = [];
    let page = 1;
    const perPage = 100;

    while (true) {
      const result = await this.get_broker_orders(filters);
      if (!result || !result.data || result.data.length === 0) {
        break;
      }
      allOrders.push(...result.data);
      if (result.data.length < perPage) {
        break;
      }
      page++;
    }

    return allOrders;
  }

  async get_all_broker_positions(
    _options?: BrokerDataOptions,
    filters?: PositionsFilter
  ): Promise<BrokerPosition[]> {
    /** Get all broker positions across all pages. */
    const allPositions: BrokerPosition[] = [];
    let page = 1;
    const perPage = 100;

    while (true) {
      const result = await this.get_broker_positions(filters);
      if (!result || !result.data || result.data.length === 0) {
        break;
      }
      allPositions.push(...result.data);
      if (result.data.length < perPage) {
        break;
      }
      page++;
    }

    return allPositions;
  }

  // Trading methods
  async place_order(order: Record<string, any>, extras?: BrokerExtras): Promise<OrderResponse> {
    /** Place a new order using the broker order API. */
    if (!this.is_authenticated()) {
      throw new AuthenticationError('Not authenticated. Please complete authentication first.');
    }

    // Convert order format to match broker API - handle multiple parameter name formats
    const accountNumber = order['account_number'] || order['accountNumber'] || this.tradingContext.account_number;
    const orderQty = order['order_qty'] || order['quantity'] || order['orderQty'];
    const action = order['action'] || order['side'];
    const orderType = order['order_type'] || order['orderType'];
    
    if (!accountNumber) {
      throw new AuthenticationError('Account not set. Call setAccount() or pass account_number parameter.');
    }

    const brokerOrder: BrokerOrderParams = {
      broker: order['broker'] || this.tradingContext.broker || 'robinhood',
      account_number: accountNumber,
      symbol: order['symbol'],
      order_qty: orderQty,
      action: action?.toLowerCase() === 'buy' ? 'Buy' : 'Sell',
      order_type: orderType?.charAt(0).toUpperCase() + orderType?.slice(1) || 'Market',
      asset_type: order['asset_type'] || 'Stock',
      time_in_force: order['time_in_force'] || order['timeInForce'] || 'day',
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

  async place_crypto_market_order(
    symbol: string,
    quantity: number,
    side: 'buy' | 'sell',
    broker?: string,
    accountNumber?: string | number
  ): Promise<OrderResponse> {
    /** Place a crypto market order. */
    if (!this.is_authenticated()) {
      throw new AuthenticationError('Not authenticated. Please complete authentication first.');
    }

    return await this.apiClient.placeCryptoMarketOrder(symbol, quantity, side, broker, accountNumber);
  }

  async place_crypto_limit_order(
    symbol: string,
    quantity: number,
    side: 'buy' | 'sell',
    price: number,
    timeInForce: 'day' | 'gtc' = 'gtc',
    broker?: string,
    accountNumber?: string | number
  ): Promise<OrderResponse> {
    /** Place a crypto limit order. */
    if (!this.is_authenticated()) {
      throw new AuthenticationError('Not authenticated. Please complete authentication first.');
    }

    return await this.apiClient.placeCryptoLimitOrder(symbol, quantity, side, price, timeInForce, broker, accountNumber);
  }

  async place_options_market_order(
    symbol: string,
    quantity: number,
    side: 'buy' | 'sell',
    broker?: string,
    accountNumber?: string | number
  ): Promise<OrderResponse> {
    /** Place an options market order. */
    if (!this.is_authenticated()) {
      throw new AuthenticationError('Not authenticated. Please complete authentication first.');
    }

    return await this.apiClient.placeOptionsMarketOrder(symbol, quantity, side, broker, accountNumber);
  }

  async place_options_limit_order(
    symbol: string,
    quantity: number,
    side: 'buy' | 'sell',
    price: number,
    timeInForce: 'day' | 'gtc' = 'gtc',
    broker?: string,
    accountNumber?: string | number
  ): Promise<OrderResponse> {
    /** Place an options limit order. */
    if (!this.is_authenticated()) {
      throw new AuthenticationError('Not authenticated. Please complete authentication first.');
    }

    return await this.apiClient.placeOptionsLimitOrder(symbol, quantity, side, price, timeInForce, broker, accountNumber);
  }

  async place_futures_market_order(
    symbol: string,
    quantity: number,
    side: 'buy' | 'sell',
    broker?: string,
    accountNumber?: string | number
  ): Promise<OrderResponse> {
    /** Place a futures market order. */
    if (!this.is_authenticated()) {
      throw new AuthenticationError('Not authenticated. Please complete authentication first.');
    }

    return await this.apiClient.placeFuturesMarketOrder(symbol, quantity, side, broker, accountNumber);
  }

  async place_futures_limit_order(
    symbol: string,
    quantity: number,
    side: 'buy' | 'sell',
    price: number,
    timeInForce: 'day' | 'gtc' = 'gtc',
    broker?: string,
    accountNumber?: string | number
  ): Promise<OrderResponse> {
    /** Place a futures limit order. */
    if (!this.is_authenticated()) {
      throw new AuthenticationError('Not authenticated. Please complete authentication first.');
    }

    return await this.apiClient.placeFuturesLimitOrder(symbol, quantity, side, price, timeInForce, broker, accountNumber);
  }

  async get_positions(filter?: PositionsFilter): Promise<PaginatedResult<BrokerPosition[]>> {
    /** Get portfolio positions. */
    return await this.apiClient.getPositions(filter);
  }

  async get_balances(filter?: BrokerDataOptions): Promise<Balance[]> {
    /** Get account balances. */
    if (!this.is_authenticated()) {
      throw new AuthenticationError('Not authenticated. Please complete authentication first.');
    }

    return await this.apiClient.getBrokerBalances(filter);
  }

  async disconnect_company(connectionId: string): Promise<any> {
    /** Disconnect a company from a broker connection. */
    if (!this.is_authenticated()) {
      throw new AuthenticationError('Not authenticated. Please complete authentication first.');
    }

    return await this.apiClient.disconnectCompany(connectionId);
  }

  // Convenience filtering methods
  async getOpenPositions(filter?: PositionsFilter): Promise<BrokerPosition[]> {
    /** Get only open positions. */
    if (!this.is_authenticated()) {
      throw new AuthenticationError('Not authenticated. Please complete authentication first.');
    }

    const openFilter = { ...filter, position_status: 'open' };
    const result = await this.get_broker_positions(openFilter);
    return result.data || [];
  }

  async getFilledOrders(filter?: OrdersFilter): Promise<BrokerOrder[]> {
    /** Get only filled orders. */
    if (!this.is_authenticated()) {
      throw new AuthenticationError('Not authenticated. Please complete authentication first.');
    }

    const filledFilter = { ...filter, status: 'filled' };
    const result = await this.get_broker_orders(filledFilter);
    return result.data || [];
  }

  async getPendingOrders(filter?: OrdersFilter): Promise<BrokerOrder[]> {
    /** Get only pending orders. */
    if (!this.is_authenticated()) {
      throw new AuthenticationError('Not authenticated. Please complete authentication first.');
    }

    const pendingFilter = { ...filter, status: 'pending' };
    const result = await this.get_broker_orders(pendingFilter);
    return result.data || [];
  }

  async getActiveAccounts(filter?: any): Promise<BrokerAccount[]> {
    /** Get only active accounts. */
    if (!this.is_authenticated()) {
      throw new AuthenticationError('Not authenticated. Please complete authentication first.');
    }

    const activeFilter = { ...filter, status: 'active' };
    const result = await this.get_broker_accounts(1, 100, undefined, activeFilter);
    return result.data || [];
  }

  async getOrdersBySymbol(symbol: string, filter?: OrdersFilter): Promise<BrokerOrder[]> {
    /** Get orders filtered by symbol. */
    if (!this.is_authenticated()) {
      throw new AuthenticationError('Not authenticated. Please complete authentication first.');
    }

    const symbolFilter = { ...filter, symbol };
    const result = await this.get_broker_orders(symbolFilter);
    return result.data || [];
  }

  async getPositionsBySymbol(symbol: string, filter?: PositionsFilter): Promise<BrokerPosition[]> {
    /** Get positions filtered by symbol. */
    if (!this.is_authenticated()) {
      throw new AuthenticationError('Not authenticated. Please complete authentication first.');
    }

    const symbolFilter = { ...filter, symbol };
    const result = await this.get_broker_positions(symbolFilter);
    return result.data || [];
  }

  async getOrdersByBroker(brokerId: string, filter?: OrdersFilter): Promise<BrokerOrder[]> {
    /** Get orders filtered by broker. */
    if (!this.is_authenticated()) {
      throw new AuthenticationError('Not authenticated. Please complete authentication first.');
    }

    const brokerFilter = { ...filter, broker_id: brokerId };
    const result = await this.get_broker_orders(brokerFilter);
    return result.data || [];
  }

  async getPositionsByBroker(brokerId: string, filter?: PositionsFilter): Promise<BrokerPosition[]> {
    /** Get positions filtered by broker. */
    if (!this.is_authenticated()) {
      throw new AuthenticationError('Not authenticated. Please complete authentication first.');
    }

    const brokerFilter = { ...filter, broker_id: brokerId };
    const result = await this.get_broker_positions(brokerFilter);
    return result.data || [];
  }

  // Pagination helper methods
  async getOrdersPage(_page: number, _perPage: number, filter?: OrdersFilter): Promise<PaginatedResult<BrokerOrder[]>> {
    /** Get a specific page of orders. */
    if (!this.is_authenticated()) {
      throw new AuthenticationError('Not authenticated. Please complete authentication first.');
    }

    return await this.get_broker_orders(filter);
  }

  async getPositionsPage(_page: number, _perPage: number, filter?: PositionsFilter): Promise<PaginatedResult<BrokerPosition[]>> {
    /** Get a specific page of positions. */
    if (!this.is_authenticated()) {
      throw new AuthenticationError('Not authenticated. Please complete authentication first.');
    }

    return await this.get_broker_positions(filter);
  }

  async getAccountsPage(page: number, perPage: number, filter?: any): Promise<BrokerAccount[]> {
    /** Get a specific page of accounts. */
    if (!this.is_authenticated()) {
      throw new AuthenticationError('Not authenticated. Please complete authentication first.');
    }

    const result = await this.get_broker_accounts(page, perPage, undefined, filter);
    return result.data || [];
  }

  async getNextOrdersPage(currentResult: PaginatedResult<BrokerOrder[]>): Promise<PaginatedResult<BrokerOrder[]> | null> {
    /** Get the next page of orders. */
    if (!this.is_authenticated()) {
      throw new AuthenticationError('Not authenticated. Please complete authentication first.');
    }

    if (!currentResult.has_next) {
      return null;
    }

    // For now, return null as the API doesn't support cursor-based pagination
    // This would need to be implemented based on the actual API pagination structure
    return null;
  }

  async getNextPositionsPage(currentResult: PaginatedResult<BrokerPosition[]>): Promise<PaginatedResult<BrokerPosition[]> | null> {
    /** Get the next page of positions. */
    if (!this.is_authenticated()) {
      throw new AuthenticationError('Not authenticated. Please complete authentication first.');
    }

    if (!currentResult.has_next) {
      return null;
    }

    // For now, return null as the API doesn't support cursor-based pagination
    // This would need to be implemented based on the actual API pagination structure
    return null;
  }

  async getNextAccountsPage(currentPage: number, perPage: number, filter?: any): Promise<BrokerAccount[] | null> {
    /** Get the next page of accounts. */
    if (!this.is_authenticated()) {
      throw new AuthenticationError('Not authenticated. Please complete authentication first.');
    }

    const nextPage = currentPage + 1;
    const result = await this.get_broker_accounts(nextPage, perPage, undefined, filter);
    
    if (!result.data || result.data.length === 0) {
      return null;
    }

    return result.data;
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

  /**
   * Get all orders across all pages (convenience method)
   */
  async get_all_orders(options?: BrokerDataOptions, filters?: OrdersFilter): Promise<BrokerOrder[]> {
    if (!this.is_authenticated()) {
      throw new AuthenticationError('Not authenticated. Please complete authentication first.');
    }

    try {
      return await this.get_all_broker_orders(options, filters);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get all positions across all pages (convenience method)
   */
  async get_all_positions(options?: BrokerDataOptions, filters?: PositionsFilter): Promise<BrokerPosition[]> {
    if (!this.is_authenticated()) {
      throw new AuthenticationError('Not authenticated. Please complete authentication first.');
    }

    try {
      return await this.get_all_broker_positions(options, filters);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get all accounts across all pages (convenience method)
   */
  async get_all_accounts(options?: BrokerDataOptions, filters?: any): Promise<BrokerAccount[]> {
    if (!this.is_authenticated()) {
      throw new AuthenticationError('Not authenticated. Please complete authentication first.');
    }

    try {
      return await this.get_all_broker_accounts(options, filters);
    } catch (error) {
      throw error;
    }
  }

  // Portal configuration convenience methods
  setPortalTheme(theme: any): void {
    /** Set the default portal theme configuration. */
    this.portalTheme = theme;
  }

  setPortalBrokers(brokers: string[]): void {
    /** Set the default broker filter for the portal. */
    this.portalBrokers = brokers;
  }

  setPortalEmail(email: string): void {
    /** Set the default email for the portal. */
    this.portalEmail = email;
  }

  getPortalConfig(): { theme?: any; brokers?: string[]; email?: string } {
    /** Get the current portal configuration. */
    const config: { theme?: any; brokers?: string[]; email?: string } = {
      theme: this.portalTheme,
    };
    
    if (this.portalBrokers) {
      config.brokers = this.portalBrokers;
    }
    
    if (this.portalEmail) {
      config.email = this.portalEmail;
    }
    
    return config;
  }

  clearPortalConfig(): void {
    /** Clear all portal configuration settings. */
    this.portalTheme = undefined;
    this.portalBrokers = undefined as any;
    this.portalEmail = undefined as any;
  }

  /**
   * Send a test webhook for the specified event type.
   * 
   * @param eventType Event type to test (e.g., 'order:filled', 'connection:needs_reauth')
   * @param sampleData Optional custom sample data to include in the webhook
   * @returns Promise containing test webhook response with success status, endpoints that received the webhook, and the webhook payload
   * @throws {AuthenticationError} If not authenticated
   * @throws {ApiError} If the API request fails
   * @throws {ValidationError} If the event type is invalid or not subscribed to
   * 
   * @example
   * ```typescript
   * // Test an order filled event
   * const response = await client.testWebhook("order:filled");
   * console.log(`Sent to ${response.sent_to_endpoints.length} endpoints`);
   * 
   * // Test with custom sample data
   * const customData = {
   *   new: {
   *     id: "custom-order-123",
   *     symbol: "TSLA",
   *     quantity: 50,
   *     status: "filled",
   *     price: 200.50
   *   }
   * };
   * const response = await client.testWebhook("order:filled", customData);
   * ```
   */
  async testWebhook(
    eventType: string, 
    sampleData?: Record<string, any>
      ): Promise<{
        success: boolean;
        message: string;
        sent_to_endpoints: string[];
        failed_endpoints: string[];
        webhook_payload: Record<string, any>;
      }> {
    if (!this.sessionId) {
      throw new AuthenticationError("Not authenticated. Please call authenticateSession() first.");
    }

    try {
      const response = await this.apiClient.request('POST', '/auth/webhook/test', {
        event_type: eventType,
        sample_data: sampleData
      }, undefined, undefined, {
        'Session-ID': this.sessionId
      });

      return response;
    } catch (error: any) {
      if (error.message?.toLowerCase().includes('not authenticated')) {
        throw new AuthenticationError(`Authentication failed: ${error.message}`);
      } else if (error.message?.toLowerCase().includes('not subscribed') || error.message?.toLowerCase().includes('invalid')) {
        throw new ValidationError(`Invalid event type or subscription: ${error.message}`);
      } else {
        throw new ApiError(`Failed to send test webhook: ${error.message}`);
      }
    }
  }

}
