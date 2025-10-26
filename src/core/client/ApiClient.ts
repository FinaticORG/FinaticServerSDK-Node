/**
 * API client for making requests to the Finatic API.
 */

import {
  SessionResponse,
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
  PaginatedResult,
} from '../../types';

// Error classes
export class ApiError extends Error {
  constructor(message: string) {
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
  private baseUrl: string;
  private apiKey: string;

  constructor(baseUrl?: string) {
    this.baseUrl = baseUrl || 'http://localhost:8000';
    this.apiKey = '';
  }

  private async makeRequest(method: string, path: string, headers: Record<string, string> = {}, data?: any): Promise<any> {
    const url = `${this.baseUrl}${path}`;
    
    const requestOptions: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };

    if (data && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
      requestOptions.body = JSON.stringify(data);
    }

    try {
      const response = await fetch(url, requestOptions);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error(`API request failed: ${method} ${url}`, error);
      throw error;
    }
  }

  async startSession(apiKey: string, userId?: string): Promise<SessionResponse> {
    try {
      // First, initialize session with API key
      const initResponse = await this.makeRequest('POST', '/api/v1/session/init', {
        'X-API-Key': apiKey
      });
      
      // Then start session with one-time token
      const startData = userId ? { user_id: userId } : {};
      const startResponse = await this.makeRequest('POST', '/api/v1/session/start', {
        'One-Time-Token': initResponse.data.one_time_token,
        'X-API-Key': apiKey
      }, startData);
      
      return startResponse;
    } catch (error) {
      console.error('Failed to start session:', error);
      throw error;
    }
  }

  async requestOtp(_phoneNumber: string): Promise<any> {
    return {
      success: true,
      data: {
        message: 'OTP sent successfully'
      }
    };
  }

  async verifyOtp(_otpCode: string): Promise<any> {
    return {
      success: true,
      data: {
        message: 'OTP verified successfully'
      }
    };
  }

  async authenticateSession(_oneTimeToken: string): Promise<any> {
    return {
      success: true,
      data: {
        access_token: 'demo-access-token',
        refresh_token: 'demo-refresh-token',
        expires_in: 3600,
        user_id: 'demo-user-id',
        token_type: 'Bearer',
        scope: 'api:access'
      }
    };
  }

  async getPortalUrl(sessionId?: string, theme?: any, brokers?: string[], email?: string): Promise<any> {
    if (!sessionId) {
      throw new Error('Session ID is required to get portal URL');
    }
    
    try {
      // Build query parameters
      const params = new URLSearchParams();
      if (theme?.preset) params.append('theme_preset', theme.preset);
      if (brokers && brokers.length > 0) params.append('brokers', brokers.join(','));
      if (email) params.append('email', email);
      
      const queryString = params.toString();
      const url = `/api/v1/session/portal${queryString ? `?${queryString}` : ''}`;
      
      const response = await this.makeRequest('GET', url, {
        'Session-ID': sessionId,
        'X-API-Key': this.apiKey
      });
      return response;
    } catch (error) {
      console.error('Failed to get portal URL:', error);
      throw error;
    }
  }

  async getBrokers(): Promise<any[]> {
    try {
      const response = await this.makeRequest('GET', '/api/v1/brokers/', {
        'X-API-Key': this.apiKey
      });
      
      // Convert object with numeric keys to array
      const brokersData = response.response_data || response.data || {};
      if (typeof brokersData === 'object' && !Array.isArray(brokersData)) {
        return Object.values(brokersData);
      }
      
      return Array.isArray(brokersData) ? brokersData : [];
    } catch (error) {
      console.error('Failed to get brokers:', error);
      throw error;
    }
  }

  async getBrokerAccounts(filter?: BrokerDataOptions, sessionId?: string, companyId?: string): Promise<PaginatedResult<BrokerAccount[]>> {
    try {
      const params = new URLSearchParams();
      if (filter?.limit) params.append('limit', filter.limit.toString());
      if (filter?.offset) params.append('offset', filter.offset.toString());
      
      const headers: Record<string, string> = {};
      if (sessionId) headers['Session-ID'] = sessionId;
      if (companyId) headers['Company-ID'] = companyId;
      
      const response = await this.makeRequest('GET', `/api/v1/brokers/data/accounts?${params.toString()}`, headers);
      
      return {
        data: response.response_data || [],
        metadata: response.pagination || {
          current_page: 1,
          limit: 25,
          has_next: false,
          has_previous: false
        },
        has_next: response.pagination?.has_more || false,
        has_previous: false,
        current_page: response.pagination?.current_page || 1,
        next_page: async () => this.getBrokerAccounts(filter),
        previous_page: async () => this.getBrokerAccounts(filter)
      } as any;
    } catch (error) {
      console.error('Failed to get broker accounts:', error);
      throw error;
    }
  }

  async getBrokerOrders(filter?: OrdersFilter, sessionId?: string, companyId?: string): Promise<PaginatedResult<BrokerOrder[]>> {
    try {
      const params = new URLSearchParams();
      if (filter?.limit) params.append('limit', filter.limit.toString());
      if (filter?.offset) params.append('offset', filter.offset.toString());
      
      const headers: Record<string, string> = {};
      if (sessionId) headers['Session-ID'] = sessionId;
      if (companyId) headers['Company-ID'] = companyId;
      
      const response = await this.makeRequest('GET', `/api/v1/brokers/data/orders?${params.toString()}`, headers);
      
      return {
        data: response.response_data || [],
        metadata: response.pagination || {
          current_page: 1,
          limit: 25,
          has_next: false,
          has_previous: false
        },
        has_next: response.pagination?.has_more || false,
        has_previous: false,
        current_page: response.pagination?.current_page || 1,
        next_page: async () => this.getBrokerOrders(filter),
        previous_page: async () => this.getBrokerOrders(filter)
      } as any;
    } catch (error) {
      console.error('Failed to get broker orders:', error);
      throw error;
    }
  }

  async getBrokerPositions(filter?: PositionsFilter, sessionId?: string, companyId?: string): Promise<PaginatedResult<BrokerPosition[]>> {
    try {
      const params = new URLSearchParams();
      if (filter?.limit) params.append('limit', filter.limit.toString());
      if (filter?.offset) params.append('offset', filter.offset.toString());
      
      const headers: Record<string, string> = {};
      if (sessionId) headers['Session-ID'] = sessionId;
      if (companyId) headers['Company-ID'] = companyId;
      
      const response = await this.makeRequest('GET', `/api/v1/brokers/data/positions?${params.toString()}`, headers);
      
      return {
        data: response.response_data || [],
        metadata: response.pagination || {
          current_page: 1,
          limit: 25,
          has_next: false,
          has_previous: false
        },
        has_next: response.pagination?.has_more || false,
        has_previous: false,
        current_page: response.pagination?.current_page || 1,
        next_page: async () => this.getBrokerPositions(filter),
        previous_page: async () => this.getBrokerPositions(filter)
      } as any;
    } catch (error) {
      console.error('Failed to get broker positions:', error);
      throw error;
    }
  }

  async getBrokerBalancesPaginated(filter?: BrokerDataOptions, sessionId?: string, companyId?: string): Promise<PaginatedResult<Balance[]>> {
    try {
      const params = new URLSearchParams();
      if (filter?.limit) params.append('limit', filter.limit.toString());
      if (filter?.offset) params.append('offset', filter.offset.toString());
      
      const headers: Record<string, string> = {};
      if (sessionId) headers['Session-ID'] = sessionId;
      if (companyId) headers['Company-ID'] = companyId;
      
      const response = await this.makeRequest('GET', `/api/v1/brokers/data/balances?${params.toString()}`, headers);
      
      // The main API returns balance data in response_data field
      // We need to return this structure for paginated methods
      return {
        data: response.response_data || [],
        metadata: response.pagination || {
          current_page: 1,
          limit: 25,
          has_next: false,
          has_previous: false
        },
        has_next: response.pagination?.has_more || false,
        has_previous: false,
        current_page: response.pagination?.current_page || 1,
        next_page: async () => this.getBrokerBalancesPaginated(filter),
        previous_page: async () => this.getBrokerBalancesPaginated(filter)
      } as any;
    } catch (error) {
      console.error('Failed to get broker balances:', error);
      throw error;
    }
  }

  async getBrokerConnections(sessionId?: string, companyId?: string): Promise<BrokerConnection[]> {
    try {
      const headers: Record<string, string> = {};
      if (sessionId) headers['Session-ID'] = sessionId;
      if (companyId) headers['Company-ID'] = companyId;
      
      const response = await this.makeRequest('GET', '/api/v1/brokers/connections', headers);
      return response.response_data || [];
    } catch (error) {
      console.error('Failed to get broker connections:', error);
      throw error;
    }
  }

  async disconnectCompany(connectionId: string): Promise<any> {
    try {
      const response = await this.makeRequest('DELETE', `/api/v1/brokers/connections/${connectionId}`, {
        'X-API-Key': this.apiKey
      });
      return response;
    } catch (error) {
      console.error('Failed to disconnect company:', error);
      throw error;
    }
  }

  async placeOrder(orderParams: BrokerOrderParams, _extras?: any): Promise<OrderResponse> {
    try {
      const response = await this.makeRequest('POST', '/api/v1/brokers/orders', {
        'X-API-Key': this.apiKey
      }, orderParams);
      return response;
    } catch (error) {
      console.error('Failed to place order:', error);
      throw error;
    }
  }

  async modifyOrder(orderId: string, orderParams: BrokerOrderParams, _extras?: any): Promise<OrderResponse> {
    try {
      const response = await this.makeRequest('PATCH', `/api/v1/brokers/orders/${orderId}`, {
        'X-API-Key': this.apiKey
      }, orderParams);
      return response;
    } catch (error) {
      console.error('Failed to modify order:', error);
      throw error;
    }
  }

  async cancelOrder(orderId: string): Promise<OrderResponse> {
    try {
      const response = await this.makeRequest('DELETE', `/api/v1/brokers/orders/${orderId}`, {
        'X-API-Key': this.apiKey
      });
      return response;
    } catch (error) {
      console.error('Failed to cancel order:', error);
      throw error;
    }
  }
}