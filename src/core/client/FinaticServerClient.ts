/**
 * Main client class for the Finatic Server SDK.
 */

import { ApiClient } from './ApiClient';
import {
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
  AccountsFilter,
  BalancesFilter,
  OrderResponse,
  BrokerOrderParams,
  BrokerExtras,
  PaginatedResult,
} from '../../types';
import {
  AuthenticationError,
} from './ApiClient';

export class FinaticServerClient {
  private apiClient: ApiClient;
  private apiKey: string;
  private initialized: boolean = false;

  // Session state
  private sessionId?: string;
  private companyId?: string;
  private userToken?: UserToken;

  constructor(apiKey: string, baseUrl?: string) {
    this.apiKey = apiKey;
    this.apiClient = new ApiClient(baseUrl || 'https://api.finatic.dev', apiKey);
  }

  async initialize(): Promise<void> {
    // Initialize the API client if needed
    this.initialized = true;
  }

  async close(): Promise<void> {
    /** Close the API client and cleanup connections. */
    await this.apiClient.close();
  }

  async start_session(userId?: string): Promise<any> {
    /** Start a new session for user authentication. */
    try {
      const response = await this.apiClient.startSession(this.apiKey, userId);
      
      // Store session info - check both top-level and nested data
      const sessionId = response.session_id || response.data?.session_id;
      const companyId = response.company_id || response.data?.company_id;
      
      if (sessionId) {
        this.sessionId = sessionId;
      }
      if (companyId) {
        this.companyId = companyId;
      }

      return response;
    } catch (error) {
      throw new AuthenticationError(`Failed to start session: ${error}`);
    }
  }

  async getToken(apiKey?: string): Promise<string> {
    if (!this.initialized) {
      throw new AuthenticationError('Client not initialized. Call initialize() first.');
    }
    // This does not mutate current session/company state; it only returns a fresh one-time token
    return await this.apiClient.getToken(apiKey || this.apiKey);
  }




  async get_portal_url(theme?: any, brokers?: string[], email?: string): Promise<string> {
    /** Get portal URL for user authentication with optional theming and configuration. */
    try {
      if (!this.sessionId) {
        throw new AuthenticationError('Session not initialized. Call start_session() first.');
      }
      
      const response = await this.apiClient.getPortalUrl(this.sessionId, theme, brokers, email);
      return (response as any).data?.portal_url || (response as any).portal_url || 'https://demo-portal.finatic.com';
    } catch (error) {
      throw new AuthenticationError(`Failed to get portal URL: ${error}`);
    }
  }

  // Authentication status methods
  is_authenticated(): boolean {
    return !!(this.userToken && this.userToken.access_token);
  }


  get_user_id(): string | undefined {
    return this.userToken?.user_id;
  }

  get_session_id(): string | undefined {
    return this.sessionId;
  }

  get_company_id(): string | undefined {
    return this.companyId;
  }

  async get_session_user(): Promise<{ user_id: string; company_id: string; token_type: string }> {
    /** Get user information from the current session after portal authentication. */
    try {
      if (!this.sessionId) {
        throw new AuthenticationError('Session not initialized. Call start_session() first.');
      }
      
      const response = await this.apiClient.getSessionUser(this.sessionId, this.companyId);
      
      // Update internal state with token info if available
      if (response.data?.access_token) {
        this.userToken = {
          access_token: response.data.access_token,
          refresh_token: response.data.refresh_token || '',
          expires_in: response.data.expires_in || 3600,
          user_id: response.data.user_id || '',
          token_type: response.data.token_type || 'Bearer',
          scope: response.data.scope || 'api:access',
        };
      }
      
      if (response.data?.company_id) {
        this.companyId = response.data.company_id;
      }
      
      return {
        user_id: response.data?.user_id || this.userToken?.user_id || '',
        company_id: response.data?.company_id || this.companyId || '',
        token_type: response.data?.token_type || this.userToken?.token_type || 'Bearer',
      };
    } catch (error) {
      throw new AuthenticationError(`Failed to get session user: ${error}`);
    }
  }

  // Broker methods - make real API calls
  async get_brokers(): Promise<BrokerInfo[]> {
    /** Get available brokers. */
    return await this.apiClient.getBrokers();
  }

  async get_accounts(
    page: number = 1,
    perPage: number = 100,
    options?: BrokerDataOptions,
    filters?: AccountsFilter
  ): Promise<PaginatedResult<BrokerAccount[]>> {
    /** Get broker accounts with pagination support. */
    const combinedOptions = { ...options, ...filters, limit: perPage, offset: (page - 1) * perPage };
    return await this.apiClient.getBrokerAccounts(combinedOptions, this.sessionId, this.companyId);
  }

  async get_orders(
    page: number = 1,
    perPage: number = 100,
    options?: BrokerDataOptions,
    filters?: OrdersFilter
  ): Promise<PaginatedResult<BrokerOrder[]>> {
    /** Get orders with pagination support. */
    const combinedOptions = { ...options, ...filters, limit: perPage, offset: (page - 1) * perPage };
    return await this.apiClient.getBrokerOrders(combinedOptions, this.sessionId, this.companyId);
  }

  async get_positions(
    page: number = 1,
    perPage: number = 100,
    options?: BrokerDataOptions,
    filters?: PositionsFilter
  ): Promise<PaginatedResult<BrokerPosition[]>> {
    /** Get positions with pagination support. */
    const combinedOptions = { ...options, ...filters, limit: perPage, offset: (page - 1) * perPage };
    return await this.apiClient.getBrokerPositions(combinedOptions, this.sessionId, this.companyId);
  }

  async get_balances(
    page: number = 1,
    perPage: number = 100,
    options?: BrokerDataOptions,
    filters?: BalancesFilter
  ): Promise<PaginatedResult<Balance[]>> {
    /** Get balances with pagination support. */
    const combinedOptions = { ...options, ...filters, limit: perPage, offset: (page - 1) * perPage };
    return await this.apiClient.getBrokerBalancesPaginated(combinedOptions, this.sessionId, this.companyId);
  }


  async get_connections(): Promise<BrokerConnection[]> {
    /** Get broker connections. */
    return await this.apiClient.getBrokerConnections(this.sessionId, this.companyId);
  }

  async disconnect_company(connectionId: string): Promise<any> {
    /** Disconnect a company from a broker connection. */
    return await this.apiClient.disconnectCompany(connectionId);
  }

  // Trading methods
  async place_order(orderParams: BrokerOrderParams, extras?: BrokerExtras): Promise<OrderResponse> {
    /** Place a broker order. */
    return await this.apiClient.placeOrder(orderParams, extras);
  }

  async modify_order(orderId: string, orderParams: BrokerOrderParams, extras?: BrokerExtras): Promise<OrderResponse> {
    /** Modify an existing order. */
    return await this.apiClient.modifyOrder(orderId, orderParams, extras);
  }

  async cancel_order(orderId: string, _broker?: string, _connectionId?: string): Promise<OrderResponse> {
    /** Cancel an existing order. */
    return await this.apiClient.cancelOrder(orderId);
  }

  // Asset-specific order methods (convenience)
  async place_stock_market_order(
    symbol: string,
    quantity: number,
    side: 'buy' | 'sell',
    broker?: string,
    accountNumber?: string
  ): Promise<OrderResponse> {
    /** Place a stock market order. */
    const orderParams: BrokerOrderParams = {
      broker: broker || 'robinhood',
      order_type: 'Market',
      asset_type: 'equity',
      action: side === 'buy' ? 'Buy' : 'Sell',
      time_in_force: 'day',
      account_number: accountNumber || '',
      symbol,
      order_qty: quantity,
    };
    return await this.place_order(orderParams);
  }

  async place_stock_limit_order(
    symbol: string,
    quantity: number,
    side: 'buy' | 'sell',
    price: number,
    timeInForce: 'day' | 'gtc' = 'gtc',
    broker?: string,
    accountNumber?: string
  ): Promise<OrderResponse> {
    /** Place a stock limit order. */
    const orderParams: BrokerOrderParams = {
      broker: broker || 'robinhood',
      order_type: 'Limit',
      asset_type: 'equity',
      action: side === 'buy' ? 'Buy' : 'Sell',
      time_in_force: timeInForce,
      account_number: accountNumber || '',
      symbol,
      order_qty: quantity,
      price,
    };
    return await this.place_order(orderParams);
  }

  async place_stock_stop_order(
    symbol: string,
    quantity: number,
    side: 'buy' | 'sell',
    stopPrice: number,
    timeInForce: 'day' | 'gtc' = 'gtc',
    broker?: string,
    accountNumber?: string
  ): Promise<OrderResponse> {
    /** Place a stock stop order. */
    const orderParams: BrokerOrderParams = {
      broker: broker || 'robinhood',
      order_type: 'Stop',
      asset_type: 'equity',
      action: side === 'buy' ? 'Buy' : 'Sell',
      time_in_force: timeInForce,
      account_number: accountNumber || '',
      symbol,
      order_qty: quantity,
      stop_price: stopPrice,
    };
    return await this.place_order(orderParams);
  }

  async place_crypto_market_order(
    symbol: string,
    quantity: number,
    side: 'buy' | 'sell',
    broker?: string,
    accountNumber?: string
  ): Promise<OrderResponse> {
    /** Place a crypto market order. */
    const orderParams: BrokerOrderParams = {
      broker: broker || 'coinbase',
      order_type: 'Market',
      asset_type: 'crypto',
      action: side === 'buy' ? 'Buy' : 'Sell',
      time_in_force: 'day',
      account_number: accountNumber || '',
      symbol,
      order_qty: quantity,
    };
    return await this.place_order(orderParams);
  }

  async place_crypto_limit_order(
    symbol: string,
    quantity: number,
    side: 'buy' | 'sell',
    price: number,
    timeInForce: 'day' | 'gtc' = 'gtc',
    broker?: string,
    accountNumber?: string
  ): Promise<OrderResponse> {
    /** Place a crypto limit order. */
    const orderParams: BrokerOrderParams = {
      broker: broker || 'coinbase',
      order_type: 'Limit',
      asset_type: 'crypto',
      action: side === 'buy' ? 'Buy' : 'Sell',
      time_in_force: timeInForce,
      account_number: accountNumber || '',
      symbol,
      order_qty: quantity,
      price,
    };
    return await this.place_order(orderParams);
  }

  async place_options_market_order(
    symbol: string,
    quantity: number,
    side: 'buy' | 'sell',
    broker?: string,
    accountNumber?: string
  ): Promise<OrderResponse> {
    /** Place an options market order. */
    const orderParams: BrokerOrderParams = {
      broker: broker || 'tasty_trade',
      order_type: 'Market',
      asset_type: 'equity_option',
      action: side === 'buy' ? 'Buy' : 'Sell',
      time_in_force: 'day',
      account_number: accountNumber || '',
      symbol,
      order_qty: quantity,
    };
    return await this.place_order(orderParams);
  }

  async place_options_limit_order(
    symbol: string,
    quantity: number,
    side: 'buy' | 'sell',
    price: number,
    timeInForce: 'day' | 'gtc' = 'gtc',
    broker?: string,
    accountNumber?: string
  ): Promise<OrderResponse> {
    /** Place an options limit order. */
    const orderParams: BrokerOrderParams = {
      broker: broker || 'tasty_trade',
      order_type: 'Limit',
      asset_type: 'equity_option',
      action: side === 'buy' ? 'Buy' : 'Sell',
      time_in_force: timeInForce,
      account_number: accountNumber || '',
      symbol,
      order_qty: quantity,
      price,
    };
    return await this.place_order(orderParams);
  }

  async place_futures_market_order(
    symbol: string,
    quantity: number,
    side: 'buy' | 'sell',
    broker?: string,
    accountNumber?: string
  ): Promise<OrderResponse> {
    /** Place a futures market order. */
    const orderParams: BrokerOrderParams = {
      broker: broker || 'ninja_trader',
      order_type: 'Market',
      asset_type: 'future',
      action: side === 'buy' ? 'Buy' : 'Sell',
      time_in_force: 'day',
      account_number: accountNumber || '',
      symbol,
      order_qty: quantity,
    };
    return await this.place_order(orderParams);
  }

  async place_futures_limit_order(
    symbol: string,
    quantity: number,
    side: 'buy' | 'sell',
    price: number,
    timeInForce: 'day' | 'gtc' = 'gtc',
    broker?: string,
    accountNumber?: string
  ): Promise<OrderResponse> {
    /** Place a futures limit order. */
    const orderParams: BrokerOrderParams = {
      broker: broker || 'ninja_trader',
      order_type: 'Limit',
      asset_type: 'future',
      action: side === 'buy' ? 'Buy' : 'Sell',
      time_in_force: timeInForce,
      account_number: accountNumber || '',
      symbol,
      order_qty: quantity,
      price,
    };
    return await this.place_order(orderParams);
  }

  // Get all methods for convenience
  async get_all_accounts(options?: BrokerDataOptions, filters?: AccountsFilter): Promise<BrokerAccount[]> {
    /** Get all accounts across all pages. */
    const result = await this.get_accounts(1, 100, options, filters);
    return result.data;
  }

  async get_all_orders(options?: BrokerDataOptions, filters?: OrdersFilter): Promise<BrokerOrder[]> {
    /** Get all orders across all pages. */
    const result = await this.get_orders(1, 100, options, filters);
    return result.data;
  }

  async get_all_positions(options?: BrokerDataOptions, filters?: PositionsFilter): Promise<BrokerPosition[]> {
    /** Get all positions across all pages. */
    const result = await this.get_positions(1, 100, options, filters);
    return result.data;
  }

  async get_all_balances(options?: BrokerDataOptions, filters?: BalancesFilter): Promise<Balance[]> {
    /** Get all balances across all pages. */
    const result = await this.get_balances(1, 100, options, filters);
    return result.data;
  }

  // Convenience filter methods
  async get_open_positions(_options?: BrokerDataOptions, filters?: PositionsFilter): Promise<BrokerPosition[]> {
    /** Get only open positions. */
    const openFilters = { ...(filters || {}), position_status: 'open' };
    const result = await this.get_all_positions(openFilters);
    return result;
  }

  async get_filled_orders(_options?: BrokerDataOptions, filters?: OrdersFilter): Promise<BrokerOrder[]> {
    /** Get only filled orders. */
    const filledFilters = { ...(filters || {}), status: 'filled' };
    const result = await this.get_all_orders(filledFilters);
    return result;
  }

  async get_pending_orders(_options?: BrokerDataOptions, filters?: OrdersFilter): Promise<BrokerOrder[]> {
    /** Get only pending orders. */
    const pendingFilters = { ...(filters || {}), status: 'pending' };
    const result = await this.get_all_orders(pendingFilters);
    return result;
  }

  async get_active_accounts(_options?: BrokerDataOptions, filters?: AccountsFilter): Promise<BrokerAccount[]> {
    /** Get only active accounts. */
    const activeFilters = { ...(filters || {}), status: 'active' };
    const result = await this.get_all_accounts(activeFilters);
    return result;
  }

  async get_orders_by_symbol(symbol: string, _options?: BrokerDataOptions, filters?: OrdersFilter): Promise<BrokerOrder[]> {
    /** Get orders filtered by symbol. */
    const symbolFilters = { ...(filters || {}), symbol };
    const result = await this.get_all_orders(symbolFilters);
    return result;
  }

  async get_positions_by_symbol(symbol: string, _options?: BrokerDataOptions, filters?: PositionsFilter): Promise<BrokerPosition[]> {
    /** Get positions filtered by symbol. */
    const symbolFilters = { ...(filters || {}), symbol };
    const result = await this.get_all_positions(symbolFilters);
    return result;
  }

  async get_orders_by_broker(brokerId: string, _options?: BrokerDataOptions, filters?: OrdersFilter): Promise<BrokerOrder[]> {
    /** Get orders filtered by broker. */
    const brokerFilters = { ...(filters || {}), broker_id: brokerId };
    const result = await this.get_all_orders(brokerFilters);
    return result;
  }

  async get_positions_by_broker(brokerId: string, _options?: BrokerDataOptions, filters?: PositionsFilter): Promise<BrokerPosition[]> {
    /** Get positions filtered by broker. */
    const brokerFilters = { ...(filters || {}), broker_id: brokerId };
    const result = await this.get_all_positions(brokerFilters);
    return result;
  }
}