/**
 * API client for making requests to the Finatic API.
 */

// undici is built into Node.js 18+
// @ts-ignore - undici types may not be available, but it exists at runtime
import { Client } from 'undici';
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
  public apiKey: string;
  private deviceHeaders: Record<string, string>;
  private httpClient: Client | null = null;

  constructor(baseUrl?: string, apiKey?: string) {
    this.baseUrl = baseUrl || 'https://api.finatic.dev';
    this.apiKey = apiKey || '';
    
    // Create persistent HTTP client with connection pooling
    // This ensures requests maintain connections to the same backend,
    // preventing device fingerprint mismatches from load balancer routing
    const urlObj = new URL(this.baseUrl);
    this.httpClient = new Client(urlObj.origin);
    console.log(`🔧 Created undici Client for ${urlObj.origin}`);
    
    // Generate consistent device headers for all requests
    // These will help the server generate a consistent device fingerprint
    this.deviceHeaders = this._generateDeviceHeaders();
  }

  async close(): Promise<void> {
    /** Close the HTTP client and cleanup connections. */
    if (this.httpClient) {
      await this.httpClient.close();
      this.httpClient = null;
    }
  }

  private _generateDeviceHeaders(): Record<string, string> {
    // Generate consistent device headers that will produce the same fingerprint
    // across all requests from this client instance
    // Note: We don't set Accept-Encoding - let the underlying client handle it
    // to avoid fingerprint mismatches from proxies/load balancers modifying it
    const headers: Record<string, string> = {
      'User-Agent': 'Finatic-NodeSDK/1.0.0',
      'Accept-Language': 'en-US,en;q=0.9',
      'Sec-CH-UA': '"Chromium";v="122", "Not(A:Brand";v="24", "Google Chrome";v="122"',
    };
    
    // Try to get platform info if available
    if (typeof process !== 'undefined' && process.platform) {
      headers['Sec-CH-UA-Platform'] = `"${process.platform}"`;
    }
    
    return headers;
  }

  private async makeRequest(method: string, path: string, headers: Record<string, string> = {}, data?: any): Promise<any> {
    const url = `${this.baseUrl}${path}`;
    
    // Build headers with device headers first
    const finalHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      ...this.deviceHeaders,
      ...headers
    };

    // Build request body
    const body = data && (method === 'POST' || method === 'PUT' || method === 'PATCH') 
      ? JSON.stringify(data) 
      : undefined;

    // Debug logging for session requests
    if (path.includes('/session/')) {
      console.log(`🔄 Making ${path} request:`);
      console.log(`   URL: ${url}`);
      console.log(`   Method: ${method}`);
      console.log(`   Headers:`, JSON.stringify(finalHeaders, null, 2));
      if (data) {
        console.log(`   Body:`, data);
      }
    }

    try {
      if (!this.httpClient) {
        console.log('⚠️  Warning: httpClient not initialized, using fetch fallback');
        // Fallback to fetch if client not initialized
        const fetchOptions: RequestInit = {
          method,
          headers: finalHeaders,
        };
        if (body) {
          fetchOptions.body = body;
        }
        const response = await fetch(url, fetchOptions);
        
        if (!response.ok) {
          const errorMessage = await this._extractErrorMessage(response);
          throw new Error(errorMessage);
        }
        return await response.json();
      }

      // Use persistent client for connection pooling
      const requestOptions: any = {
        method,
        path,
        headers: finalHeaders,
      };
      if (body) {
        requestOptions.body = body;
      }
      const response = await this.httpClient.request(requestOptions);

      // Debug logging for session responses
      if (path.includes('/session/')) {
        console.log(`📥 ${path} response: ${response.statusCode}`);
      }

      if (response.statusCode !== 200) {
        const errorMessage = await this._extractErrorMessage(response);
        throw new Error(errorMessage);
      }

      // Handle gzipped responses
      const contentType = response.headers['content-type'] || '';
      if (contentType.includes('application/json')) {
        const bodyText = await response.body.text();
        try {
          return JSON.parse(bodyText);
        } catch {
          throw new Error(`Failed to parse JSON response: ${bodyText.substring(0, 100)}`);
        }
      }
      
      // For non-JSON responses, return as text
      const bodyText = await response.body.text();
      return bodyText;
    } catch (error) {
      console.error(`API request failed: ${method} ${url}`, error);
      throw error;
    }
  }

  private async _extractErrorMessage(response: any): Promise<string> {
    /** Extract error message from response. */
    const status = response.status || response.statusCode || 500;
    const statusText = response.statusText || '';
    let errorMessage = `HTTP ${status}: ${statusText}`;
    
    try {
      // Handle both fetch Response and undici response
      let errorBody: any;
      if (response.json) {
        errorBody = await response.json();
      } else if (response.body) {
        // For undici, read the body as text first
        const bodyText = await response.body.text();
        try {
          errorBody = JSON.parse(bodyText);
        } catch {
          // If not JSON, use the text as the error message
          if (bodyText && bodyText.trim()) {
            errorMessage = bodyText.trim();
            console.log(`   Error details: ${bodyText}`);
          }
        }
      }
      
      if (errorBody && typeof errorBody === 'object') {
        if (errorBody.message) {
          errorMessage = errorBody.message;
        } else if (errorBody.error) {
          errorMessage = errorBody.error;
        } else if (errorBody.detail) {
          errorMessage = typeof errorBody.detail === 'string' ? errorBody.detail : JSON.stringify(errorBody.detail);
        }
      }
    } catch (e) {
      // If JSON parsing fails, use the default message
      console.log(`   Error extracting message: ${e}`);
    }
    return errorMessage;
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

  async getToken(apiKey?: string): Promise<string> {
    try {
      const response = await this.makeRequest('POST', '/api/v1/session/init', {
        'X-API-Key': apiKey || this.apiKey
      });
      // Prefer nested data shape
      const token = response?.data?.one_time_token || response?.one_time_token;
      if (!token) {
        throw new Error('Missing one_time_token in response');
      }
      return token;
    } catch (error) {
      console.error('Failed to get one-time token:', error);
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

  async getSessionUser(sessionId: string, companyId?: string): Promise<any> {
    /** Get user information from the session after portal authentication. */
    try {
      const headers: Record<string, string> = {
        'Session-ID': sessionId,
        'X-API-Key': this.apiKey
      };
      if (companyId) {
        headers['Company-ID'] = companyId;
      }
      
      const response = await this.makeRequest('GET', `/api/v1/session/${sessionId}/user`, headers);
      return response;
    } catch (error) {
      console.error('Failed to get session user:', error);
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