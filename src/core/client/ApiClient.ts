/**
 * Core API client for handling HTTP requests to the Finatic API.
 */

import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import {
  DeviceInfo,
  SessionResponse,
  OtpRequestResponse,
  OtpVerifyResponse,
  SessionAuthenticateResponse,
  PortalUrlResponse,
  SessionValidationResponse,
  SessionUserResponse,
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
  ApiPaginationInfo,
  PaginatedResult,
} from '../../types';

export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public response?: any
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export class AuthenticationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AuthenticationError';
  }
}

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class RateLimitError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'RateLimitError';
  }
}

export class NetworkError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NetworkError';
  }
}

export class TimeoutError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'TimeoutError';
  }
}

export class AuthorizationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AuthorizationError';
  }
}

export class OrderError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'OrderError';
  }
}

export class OrderValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'OrderValidationError';
  }
}

export class CompanyAccessError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CompanyAccessError';
  }
}

export class TradingNotEnabledError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'TradingNotEnabledError';
  }
}

export class ApiClient {
  private axiosInstance: AxiosInstance;
  private baseUrl: string;
  private deviceInfo?: DeviceInfo | undefined;
  private timeout: number;

  // Session state
  private currentSessionId?: string;
  // private currentSessionState?: string;
  private companyId?: string;
  private csrfToken?: string;

  // Token management
  private tokenInfo?: Record<string, any>;
  // private refreshPromise?: Promise<void>;
  // private refreshBufferMinutes = 5;

  // Trading context
  private tradingContext: TradingContext = {};

  constructor(
    baseUrl: string,
    deviceInfo?: DeviceInfo,
    timeout: number = 30000
  ) {
    this.baseUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
    if (!this.baseUrl.endsWith('/api/v1')) {
      this.baseUrl = `${this.baseUrl}/api/v1`;
    }

    this.deviceInfo = deviceInfo;
    this.timeout = timeout;

    this.axiosInstance = axios.create({
      baseURL: this.baseUrl,
      timeout: this.timeout,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add request interceptor for headers
    this.axiosInstance.interceptors.request.use((config) => {
      this.buildHeaders(config);
      return config;
    });

    // Add response interceptor for error handling
    this.axiosInstance.interceptors.response.use(
      (response) => response,
      (error) => this.handleError(error)
    );
  }

  private buildHeaders(config: AxiosRequestConfig): void {
    if (!config.headers) {
      config.headers = {};
    }

    // Add device info if available
    if (this.deviceInfo) {
      config.headers['X-Device-Info'] = JSON.stringify({
        ip_address: this.deviceInfo.ip_address,
        user_agent: this.deviceInfo.user_agent,
        fingerprint: this.deviceInfo.fingerprint,
      });
    }

    // Add session headers if available
    if (this.currentSessionId) {
      config.headers['X-Session-ID'] = this.currentSessionId;
      config.headers['Session-ID'] = this.currentSessionId;
    }

    if (this.companyId) {
      config.headers['X-Company-ID'] = this.companyId;
    }

    if (this.csrfToken) {
      config.headers['X-CSRF-Token'] = this.csrfToken;
    }
  }

  private handleError(error: any): Promise<never> {
    if (error.response) {
      const { status, data } = error.response;
      const message = data?.message || error.message || 'API request failed';

      switch (status) {
        case 400:
          throw new ValidationError(message);
        case 401:
          throw new AuthenticationError(message);
        case 403:
          throw new AuthorizationError(message);
        case 429:
          throw new RateLimitError(message);
        case 500:
        case 502:
        case 503:
        case 504:
          throw new ApiError(message, status, data);
        default:
          throw new ApiError(message, status, data);
      }
    } else if (error.code === 'ECONNABORTED') {
      throw new TimeoutError('Request timeout');
    } else if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
      throw new NetworkError('Network error');
    } else {
      throw new ApiError(error.message || 'Unknown error');
    }
  }

  async request<T = any>(
    method: string,
    path: string,
    data?: any,
    params?: Record<string, any>,
    accessToken?: string,
    additionalHeaders?: Record<string, string>
  ): Promise<T> {
    const config: AxiosRequestConfig = {
      method: method as any,
      url: path,
      data,
      params,
    };

    if (accessToken) {
      config.headers = {
        ...config.headers,
        Authorization: `Bearer ${accessToken}`,
      };
    }

    if (additionalHeaders) {
      config.headers = {
        ...config.headers,
        ...additionalHeaders,
      };
    }

    const response: AxiosResponse<T> = await this.axiosInstance.request(config);
    return response.data;
  }

  // Session management methods
  async startSession(apiKey: string): Promise<SessionResponse> {
    const response = await this.request<SessionResponse>('POST', '/session/start', {
      api_key: apiKey,
    });
    return response;
  }

  async requestOtp(phoneNumber: string): Promise<OtpRequestResponse> {
    const response = await this.request<OtpRequestResponse>('POST', '/session/otp/request', {
      phone_number: phoneNumber,
    });
    return response;
  }

  async verifyOtp(otpCode: string): Promise<OtpVerifyResponse> {
    const response = await this.request<OtpVerifyResponse>('POST', '/session/otp/verify', {
      otp_code: otpCode,
    });
    return response;
  }

  async authenticateSession(oneTimeToken: string): Promise<SessionAuthenticateResponse> {
    const response = await this.request<SessionAuthenticateResponse>('POST', '/session/authenticate', {
      one_time_token: oneTimeToken,
    });
    return response;
  }

  async getPortalUrl(): Promise<PortalUrlResponse> {
    const response = await this.request<PortalUrlResponse>('GET', '/auth/session/portal');
    return response;
  }

  async validateSession(): Promise<SessionValidationResponse> {
    const response = await this.request<SessionValidationResponse>('GET', '/session/validate');
    return response;
  }

  async getSessionUser(sessionId: string, companyId: string): Promise<SessionUserResponse> {
    const response = await this.request('GET', `/auth/session/${sessionId}/user`, undefined, undefined, sessionId, {
      'Company-Id': companyId,
    });
    return new SessionUserResponse(response.success, response.message, response.data);
  }

  // Broker methods
  async getBrokers(): Promise<BrokerInfo[]> {
    const accessToken = await this.getValidAccessToken();
    const response = await this.request<{ response_data: BrokerInfo[] }>('GET', '/brokers', undefined, undefined, accessToken);
    return response.response_data || [];
  }

  async getBrokerAccounts(filter?: BrokerDataOptions): Promise<BrokerAccount[]> {
    const accessToken = await this.getValidAccessToken();
    const response = await this.request<{ response_data: BrokerAccount[] }>('GET', '/brokers/data/accounts', undefined, filter, accessToken);
    return response.response_data || [];
  }

  async getBrokerOrders(filter?: OrdersFilter): Promise<PaginatedResult<BrokerOrder[]>> {
    const accessToken = await this.getValidAccessToken();
    const response = await this.request<{ response_data: BrokerOrder[]; pagination: ApiPaginationInfo }>('GET', '/brokers/data/orders', undefined, filter, accessToken);
    return new PaginatedResult(response.response_data || [], response.pagination || {});
  }

  async getBrokerPositions(filter?: PositionsFilter): Promise<PaginatedResult<BrokerPosition[]>> {
    const accessToken = await this.getValidAccessToken();
    const response = await this.request<{ response_data: BrokerPosition[]; pagination: ApiPaginationInfo }>('GET', '/brokers/data/positions', undefined, filter, accessToken);
    return new PaginatedResult(response.response_data || [], response.pagination || {});
  }

  async getBrokerConnections(): Promise<BrokerConnection[]> {
    const accessToken = await this.getValidAccessToken();
    const response = await this.request<{ response_data: BrokerConnection[] }>('GET', '/brokers/connections', undefined, undefined, accessToken);
    return response.response_data || [];
  }

  async getBrokerBalances(filter?: BrokerDataOptions): Promise<Balance[]> {
    const accessToken = await this.getValidAccessToken();
    const response = await this.request<{ response_data: Balance[] }>('GET', '/brokers/data/balances', undefined, filter, accessToken);
    return response.response_data || [];
  }

  async disconnectCompany(connectionId: string): Promise<any> {
    const accessToken = await this.getValidAccessToken();
    const response = await this.request('DELETE', `/brokers/connections/${connectionId}`, undefined, undefined, accessToken);
    return response;
  }

  // Trading methods
  async placeOrder(orderParams: BrokerOrderParams, extras?: BrokerExtras): Promise<OrderResponse> {
    const accessToken = await this.getValidAccessToken();
    
    const broker = orderParams.broker || this.tradingContext.broker;
    const accountNumber = orderParams.account_number || this.tradingContext.account_number;
    
    if (!broker) {
      throw new ValidationError('Broker not set. Call setBroker() or pass broker parameter.');
    }
    
    if (!accountNumber) {
      throw new ValidationError('Account not set. Call setAccount() or pass account_number parameter.');
    }

    const requestBody = this.buildOrderRequestBody(orderParams, extras);
    
    const response = await this.request<OrderResponse>('POST', '/brokers/orders', requestBody, undefined, accessToken, {
      'Authorization': `Bearer ${accessToken}`,
      'Session-ID': this.currentSessionId || '',
      'X-Session-ID': this.currentSessionId || '',
      'X-Device-Info': this.deviceInfo ? JSON.stringify(this.deviceInfo) : '',
    });

    return response;
  }

  async modifyOrder(orderId: string, orderParams: BrokerOrderParams, extras?: BrokerExtras): Promise<OrderResponse> {
    const accessToken = await this.getValidAccessToken();
    
    const requestBody = this.buildOrderRequestBody(orderParams, extras);
    
    const response = await this.request<OrderResponse>('PUT', `/brokers/orders/${orderId}`, requestBody, undefined, accessToken, {
      'Authorization': `Bearer ${accessToken}`,
      'Session-ID': this.currentSessionId || '',
      'X-Session-ID': this.currentSessionId || '',
    });

    return response;
  }

  async cancelOrder(orderId: string): Promise<OrderResponse> {
    const accessToken = await this.getValidAccessToken();
    
    const response = await this.request<OrderResponse>('DELETE', `/brokers/orders/${orderId}`, undefined, undefined, accessToken, {
      'Authorization': `Bearer ${accessToken}`,
      'Session-ID': this.currentSessionId || '',
      'X-Session-ID': this.currentSessionId || '',
    });

    return response;
  }


  async getOrders(filter?: OrdersFilter): Promise<PaginatedResult<BrokerOrder[]>> {
    const accessToken = await this.getValidAccessToken();
    
    const response = await this.request<{ response_data: BrokerOrder[]; pagination: ApiPaginationInfo }>('GET', '/brokers/data/orders', undefined, filter, accessToken);
    return new PaginatedResult(response.response_data || [], response.pagination || {});
  }

  // Convenience trading methods
  async placeStockMarketOrder(
    symbol: string,
    quantity: number,
    side: string,
    broker?: string,
    accountNumber?: string | number
  ): Promise<OrderResponse> {
    const orderParams: BrokerOrderParams = {
      broker: broker || this.tradingContext.broker || 'robinhood',
      order_type: 'Market',
      asset_type: 'Stock',
      action: side.toLowerCase() === 'buy' ? 'Buy' : 'Sell',
      time_in_force: 'day',
      account_number: accountNumber || this.tradingContext.account_number || '',
      symbol: symbol,
      order_qty: quantity,
    };

    return await this.placeOrder(orderParams);
  }

  async placeStockLimitOrder(
    symbol: string,
    quantity: number,
    side: string,
    price: number,
    timeInForce: string = 'gtc',
    broker?: string,
    accountNumber?: string | number
  ): Promise<OrderResponse> {
    const orderParams: BrokerOrderParams = {
      broker: broker || this.tradingContext.broker || 'robinhood',
      order_type: 'Limit',
      asset_type: 'Stock',
      action: side.toLowerCase() === 'buy' ? 'Buy' : 'Sell',
      time_in_force: timeInForce as any,
      account_number: accountNumber || this.tradingContext.account_number || '',
      symbol: symbol,
      order_qty: quantity,
      price: price,
    };

    return await this.placeOrder(orderParams);
  }

  async placeStockStopOrder(
    symbol: string,
    quantity: number,
    side: string,
    stopPrice: number,
    timeInForce: string = 'day',
    broker?: string,
    accountNumber?: string | number
  ): Promise<OrderResponse> {
    const orderParams: BrokerOrderParams = {
      broker: broker || this.tradingContext.broker || 'robinhood',
      order_type: 'Stop',
      asset_type: 'Stock',
      action: side.toLowerCase() === 'buy' ? 'Buy' : 'Sell',
      time_in_force: timeInForce as any,
      account_number: accountNumber || this.tradingContext.account_number || '',
      symbol: symbol,
      order_qty: quantity,
      stop_price: stopPrice,
    };

    return await this.placeOrder(orderParams);
  }

  async placeCryptoMarketOrder(
    symbol: string,
    quantity: number,
    side: string,
    broker?: string,
    accountNumber?: string | number
  ): Promise<OrderResponse> {
    const orderParams: BrokerOrderParams = {
      broker: broker || this.tradingContext.broker || 'robinhood',
      order_type: 'Market',
      asset_type: 'Crypto',
      action: side.toLowerCase() === 'buy' ? 'Buy' : 'Sell',
      time_in_force: 'day',
      account_number: accountNumber || this.tradingContext.account_number || '',
      symbol: symbol,
      order_qty: quantity,
    };

    return await this.placeOrder(orderParams);
  }

  async placeCryptoLimitOrder(
    symbol: string,
    quantity: number,
    side: string,
    price: number,
    timeInForce: string = 'day',
    broker?: string,
    accountNumber?: string | number
  ): Promise<OrderResponse> {
    const orderParams: BrokerOrderParams = {
      broker: broker || this.tradingContext.broker || 'robinhood',
      order_type: 'Limit',
      asset_type: 'Crypto',
      action: side.toLowerCase() === 'buy' ? 'Buy' : 'Sell',
      time_in_force: timeInForce as any,
      account_number: accountNumber || this.tradingContext.account_number || '',
      symbol: symbol,
      order_qty: quantity,
      price: price,
    };

    return await this.placeOrder(orderParams);
  }

  async placeOptionsMarketOrder(
    symbol: string,
    quantity: number,
    side: string,
    broker?: string,
    accountNumber?: string | number
  ): Promise<OrderResponse> {
    const orderParams: BrokerOrderParams = {
      broker: broker || this.tradingContext.broker || 'robinhood',
      order_type: 'Market',
      asset_type: 'Option',
      action: side.toLowerCase() === 'buy' ? 'Buy' : 'Sell',
      time_in_force: 'day',
      account_number: accountNumber || this.tradingContext.account_number || '',
      symbol: symbol,
      order_qty: quantity,
    };

    return await this.placeOrder(orderParams);
  }

  async placeOptionsLimitOrder(
    symbol: string,
    quantity: number,
    side: string,
    price: number,
    timeInForce: string = 'day',
    broker?: string,
    accountNumber?: string | number
  ): Promise<OrderResponse> {
    const orderParams: BrokerOrderParams = {
      broker: broker || this.tradingContext.broker || 'robinhood',
      order_type: 'Limit',
      asset_type: 'Option',
      action: side.toLowerCase() === 'buy' ? 'Buy' : 'Sell',
      time_in_force: timeInForce as any,
      account_number: accountNumber || this.tradingContext.account_number || '',
      symbol: symbol,
      order_qty: quantity,
      price: price,
    };

    return await this.placeOrder(orderParams);
  }

  async placeFuturesMarketOrder(
    symbol: string,
    quantity: number,
    side: string,
    broker?: string,
    accountNumber?: string | number
  ): Promise<OrderResponse> {
    const orderParams: BrokerOrderParams = {
      broker: broker || this.tradingContext.broker || 'robinhood',
      order_type: 'Market',
      asset_type: 'Futures',
      action: side.toLowerCase() === 'buy' ? 'Buy' : 'Sell',
      time_in_force: 'day',
      account_number: accountNumber || this.tradingContext.account_number || '',
      symbol: symbol,
      order_qty: quantity,
    };

    return await this.placeOrder(orderParams);
  }

  async placeFuturesLimitOrder(
    symbol: string,
    quantity: number,
    side: string,
    price: number,
    timeInForce: string = 'day',
    broker?: string,
    accountNumber?: string | number
  ): Promise<OrderResponse> {
    const orderParams: BrokerOrderParams = {
      broker: broker || this.tradingContext.broker || 'robinhood',
      order_type: 'Limit',
      asset_type: 'Futures',
      action: side.toLowerCase() === 'buy' ? 'Buy' : 'Sell',
      time_in_force: timeInForce as any,
      account_number: accountNumber || this.tradingContext.account_number || '',
      symbol: symbol,
      order_qty: quantity,
      price: price,
    };

    return await this.placeOrder(orderParams);
  }

  // Helper method to build order request body
  private buildOrderRequestBody(orderParams: BrokerOrderParams, extras?: BrokerExtras): Record<string, any> {
    const requestBody: Record<string, any> = {
      broker: orderParams.broker,
      order: {
        order_id: orderParams.order_id,
        order_type: orderParams.order_type,
        asset_type: orderParams.asset_type,
        action: orderParams.action,
        time_in_force: orderParams.time_in_force,
        account_number: orderParams.account_number,
        symbol: orderParams.symbol,
        order_qty: orderParams.order_qty,
        price: orderParams.price,
        stop_price: orderParams.stop_price,
      },
    };

    if (extras) {
      requestBody['extras'] = extras;
    }

    return requestBody;
  }


  async getPositions(filter?: PositionsFilter): Promise<PaginatedResult<BrokerPosition[]>> {
    const accessToken = await this.getValidAccessToken();
    const response = await this.request<{ response_data: BrokerPosition[]; pagination: ApiPaginationInfo }>('GET', '/brokers/data/positions', undefined, filter, accessToken);
    return new PaginatedResult(response.response_data || [], response.pagination || {});
  }

  // Auto methods using stored tokens

  async getBrokerListAuto(): Promise<BrokerInfo[]> {
    const tokenInfo = this.getTokenInfo();
    if (!tokenInfo?.['access_token']) {
      throw new AuthenticationError('No valid access token available');
    }
    return await this.getBrokers();
  }

  async getBrokerConnectionsAuto(): Promise<BrokerConnection[]> {
    const tokenInfo = this.getTokenInfo();
    if (!tokenInfo?.['access_token']) {
      throw new AuthenticationError('No valid access token available');
    }
    return await this.getBrokerConnections();
  }

  // Trading context methods
  setBroker(broker: string): void {
    this.tradingContext.broker = broker;
  }

  setAccount(accountNumber: string, accountId?: string): void {
    this.tradingContext.account_number = accountNumber;
    this.tradingContext.account_id = accountId;
  }

  clearTradingContext(): void {
    this.tradingContext = {};
  }

  // Token validation
  async getValidAccessToken(): Promise<string> {
    const tokenInfo = this.getTokenInfo();
    if (!tokenInfo?.['access_token']) {
      throw new AuthenticationError('No access token available');
    }

    // Check if token is expired
    if (tokenInfo['expires_at']) {
      const expiresAt = new Date(tokenInfo['expires_at']);
      const now = new Date();
      if (expiresAt <= now) {
        // Token is expired, try to refresh
        await this.refreshToken();
        const refreshedTokenInfo = this.getTokenInfo();
        if (!refreshedTokenInfo?.['access_token']) {
          throw new AuthenticationError('Failed to refresh expired token');
        }
        return refreshedTokenInfo['access_token'];
      }
    }

    return tokenInfo['access_token'];
  }

  // Token refresh
  private async refreshToken(): Promise<void> {
    const tokenInfo = this.getTokenInfo();
    if (!tokenInfo?.['refresh_token']) {
      throw new AuthenticationError('No refresh token available');
    }

    try {
      const response = await this.request<{
        access_token: string;
        refresh_token: string;
        expires_in: number;
      }>('POST', '/auth/refresh', {
        refresh_token: tokenInfo['refresh_token'],
      });

      const expiresAt = new Date(Date.now() + response.expires_in * 1000).toISOString();
      this.setTokenInfo({
        access_token: response.access_token,
        refresh_token: response.refresh_token,
        expires_at: expiresAt,
        user_id: tokenInfo['user_id'],
      });
    } catch (error) {
      throw new AuthenticationError(`Token refresh failed: ${error}`);
    }
  }

  // Utility methods
  setSessionId(sessionId: string): void {
    this.currentSessionId = sessionId;
  }

  setCompanyId(companyId: string): void {
    this.companyId = companyId;
  }

  setTokenInfo(tokenInfo: Record<string, any>): void {
    this.tokenInfo = tokenInfo;
  }

  getTokenInfo(): Record<string, any> | undefined {
    return this.tokenInfo;
  }

  setTradingContext(context: TradingContext): void {
    this.tradingContext = { ...this.tradingContext, ...context };
  }

  getTradingContext(): TradingContext {
    return this.tradingContext;
  }

  // Cleanup method
  async close(): Promise<void> {
    // Cleanup any resources if needed
  }
}
