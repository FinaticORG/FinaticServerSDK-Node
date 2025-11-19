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
import type { GetCompanyParams } from './wrappers/company';
import type { DisconnectCompanyFromBrokerParams, FinaticResponse, GetAccountsParams, GetBalancesParams, GetBrokerConnectionsParams, GetBrokersParams, GetOrderEventsParams, GetOrderFillsParams, GetOrderGroupsParams, GetOrdersParams, GetPositionLotFillsParams, GetPositionLotsParams, GetPositionsParams } from './wrappers/brokers';
import type { Accounts, Balances, OrderEventResponse, OrderFillResponse, OrderGroupResponse, OrderResponse, PositionLotFillResponse, PositionLotResponse, PositionResponse } from './models';
import { BrokersApi } from './api/brokers-api';
import { CompanyApi } from './api/company-api';
import { SessionApi } from './api/session-api';
import { BrokersWrapper } from './wrappers/brokers';
import { CompanyWrapper } from './wrappers/company';
import { SessionWrapper } from './wrappers/session';

// PortalOptions removed - portal methods now use individual parameters

export class FinaticServer {
  private config: Configuration;
  private sdkConfig: SdkConfig;
  private sessionId?: string;
  private companyId?: string;
  private csrfToken?: string;
  private userId?: string;
  private logger: Logger;

  private readonly brokers: BrokersWrapper;
  private readonly company: CompanyWrapper;
  private readonly session: SessionWrapper;

  private apiKey: string;

  constructor(apiKey: string, baseUrl?: string, sdkConfig?: Partial<SdkConfig>) {
    this.apiKey = apiKey;
    this.sdkConfig = { ...defaultConfig, ...sdkConfig };
    // If baseUrl provided as parameter, use it; otherwise use sdkConfig.baseUrl
    const finalBaseUrl = baseUrl || this.sdkConfig.baseUrl || 'https://api.finatic.dev';
    this.config = new Configuration({
      basePath: finalBaseUrl,
      apiKey: apiKey,
    });

    // Initialize logger
    this.logger = getLogger(this.sdkConfig);

    this.brokers = new BrokersWrapper(new BrokersApi(this.config), this.config, this.sdkConfig);
    this.company = new CompanyWrapper(new CompanyApi(this.config), this.config, this.sdkConfig);
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
    const response = await this.session.initSession(xApiKey);
    if (response.error) {
      throw new Error(response.error.message || 'Failed to initialize session');
    }
    return response.success?.data?.one_time_token || '';
  }

  /**
   * Get a one-time token from an API key.
   * 
   * This method only retrieves the token and returns it - it does NOT start a session
   * or set any session context. Useful for generating tokens to pass to clients.
   * 
   * @param apiKey - Company API key (uses instance API key if not provided)
   * @returns One-time token string
   */
  async getToken(apiKey?: string): Promise<string> {
    const keyToUse = apiKey || this.apiKey;
    if (!keyToUse) {
      throw new Error('API key is required. Provide it as a parameter or in the constructor.');
    }
    return await this._initSession(keyToUse);
  }

  /**
   * Start a session.
   * 
   * If oneTimeToken is provided, uses it directly.
   * If not provided, gets a one-time token using the API key from constructor, then starts session.
   * 
   * @param oneTimeToken - Optional one-time token. If not provided, will get one using API key.
   * @param userId - Optional user ID for direct authentication
   * @returns Object with success, session_id, company_id, and error fields (if no token) or session_id/company_id (if token provided)
   */
  async startSession(oneTimeToken?: string, userId?: string): Promise<{ success: boolean; session_id: string | null; company_id: string | null; error: string | null } | { session_id: string; company_id: string }> {
    // If token provided, use it directly
    if (oneTimeToken) {
    const requestBody: SessionStartRequest = userId !== undefined ? { user_id: userId } : {};
    const response = await this.session.startSession(oneTimeToken, requestBody);
    if (response.error) {
      throw new Error(response.error.message || 'Failed to start session');
    }
    const sessionId = response.success?.data?.session_id || '';
    const companyId = response.success?.data?.company_id || '';
    const csrfToken = (response.success?.data as any)?.csrf_token || '';
    
    if (sessionId && companyId) {
      this.setSessionContext(sessionId, companyId, csrfToken);
    }
    
    return { session_id: sessionId, company_id: companyId };
  }

    // No token provided - get one using API key
    try {
      if (!this.apiKey) {
        return {
          success: false,
          session_id: null,
          company_id: null,
          error: 'API key is required. Provide it in the constructor.',
        };
      }

      // Step 1: Get one-time token
      const oneTimeToken = await this._initSession(this.apiKey);
      
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
  async getPortalUrl(
    theme?: string | { preset?: string; custom?: Record<string, unknown> },
    brokers?: string[],
    email?: string,
    mode?: 'light' | 'dark'
  ): Promise<string> {
    if (!this.sessionId) {
      throw new Error('Session not initialized. Call startSession() first.');
    }

    // Get raw portal URL from session wrapper
    const response = await this.session.getPortalUrl();
    if (response.error) {
      throw new Error(response.error.message || 'Failed to get portal URL');
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
    if (theme) {
      portalUrl = appendThemeToURL(portalUrl, theme);
    }

    // Append broker filter if provided
    if (brokers) {
      portalUrl = appendBrokerFilterToURL(portalUrl, brokers);
    }

    // Append email if provided
    if (email) {
      const url = new URL(portalUrl);
      url.searchParams.set('email', email);
      portalUrl = url.toString();
    }

    // Append mode if provided (light or dark)
    if (mode) {
      const url = new URL(portalUrl);
      url.searchParams.set('mode', mode);
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
  async getSessionUser(): Promise<{ user_id: string; company_id: string }> {
    if (!this.sessionId) {
      throw new Error('Session not initialized. Call startSession() first.');
    }
    
    const response = await this.session.getSessionUser(this.sessionId!);
    if (response.error) {
      throw new Error(response.error.message || 'Failed to get session user');
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
    this.company.setSessionContext(sessionId, companyId, csrfToken);
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
   * Check if user is authenticated (has userId).
   */
  isAuthed(): boolean {
    return !!this.userId;
  }


  /**
   * Get Company
   * 
   * Get public company details by ID (no user check, no sensitive data).
   * 
   * Convenience method that delegates to company wrapper.
   * 
   * @param params - Optional parameters object. Only include the fields you want to use.
   *                 Example: getOrders({ accountId: "123", symbol: "AAPL", limit: 10, offset: 0 })
   * @returns FinaticResponse with success, error, and warning fields
   */
  async getCompany(params?: Partial<GetCompanyParams>): Promise<Awaited<ReturnType<typeof this.company.getCompany>>> {
    return await this.company.getCompany((params?.companyId as any));
  }

  /**
   * Get Brokers
   * 
   * Get all available brokers.
   * 
   * This is a fast operation that returns a cached list of available brokers.
   * The list is loaded once at startup and never changes during runtime.
   * 
   * Returns
   * -------
   * FinaticResponse[list[BrokerInfo]]
   *     list of available brokers with their metadata.
   * 
   * Convenience method that delegates to brokers wrapper.
   * 
   * @param params - Optional parameters object. Only include the fields you want to use.
   *                 Example: getOrders({ accountId: "123", symbol: "AAPL", limit: 10, offset: 0 })
   * @returns FinaticResponse with success, error, and warning fields
   */
  async getBrokers(params?: {}): Promise<Awaited<ReturnType<typeof this.brokers.getBrokers>>> {
    return await this.brokers.getBrokers();
  }

  /**
   * List Broker Connections
   * 
   * List all broker connections for the current user.
   * 
   * This endpoint is accessible from the portal and uses session-only authentication.
   * Returns connections that the user has any permissions for.
   * 
   * Convenience method that delegates to brokers wrapper.
   * 
   * @param params - Optional parameters object. Only include the fields you want to use.
   *                 Example: getOrders({ accountId: "123", symbol: "AAPL", limit: 10, offset: 0 })
   * @returns FinaticResponse with success, error, and warning fields
   */
  async getBrokerConnections(params?: {}): Promise<Awaited<ReturnType<typeof this.brokers.getBrokerConnections>>> {
    return await this.brokers.getBrokerConnections();
  }

  /**
   * Disconnect Company From Broker
   * 
   * Remove a company's access to a broker connection.
   * 
   * If the company is the only one with access, the entire connection is deleted.
   * If other companies have access, only the company's access is removed.
   * 
   * Convenience method that delegates to brokers wrapper.
   * 
   * @param params - Optional parameters object. Only include the fields you want to use.
   *                 Example: getOrders({ accountId: "123", symbol: "AAPL", limit: 10, offset: 0 })
   * @returns FinaticResponse with success, error, and warning fields
   */
  async disconnectCompanyFromBroker(params?: Partial<DisconnectCompanyFromBrokerParams>): Promise<Awaited<ReturnType<typeof this.brokers.disconnectCompanyFromBroker>>> {
    return await this.brokers.disconnectCompanyFromBroker((params?.connectionId as any));
  }

  /**
   * Get Orders
   * 
   * Get orders for all authorized broker connections.
   * 
   * This endpoint is accessible from the portal and uses session-only authentication.
   * Returns orders from connections the company has read access to.
   * 
   * Convenience method that delegates to brokers wrapper.
   * 
   * @param params - Optional parameters object. Only include the fields you want to use.
   *                 Example: getOrders({ accountId: "123", symbol: "AAPL", limit: 10, offset: 0 })
   * @returns FinaticResponse with success, error, and warning fields
   */
  async getOrders(params?: Partial<GetOrdersParams>): Promise<Awaited<ReturnType<typeof this.brokers.getOrders>>> {
    return await this.brokers.getOrders(params?.brokerId, params?.connectionId, params?.accountId, params?.symbol, params?.orderStatus, params?.side, params?.assetType, params?.limit, params?.offset, params?.createdAfter, params?.createdBefore, params?.withMetadata);
  }

  /**
   * Get Positions
   * 
   * Get positions for all authorized broker connections.
   * 
   * This endpoint is accessible from the portal and uses session-only authentication.
   * Returns positions from connections the company has read access to.
   * 
   * Convenience method that delegates to brokers wrapper.
   * 
   * @param params - Optional parameters object. Only include the fields you want to use.
   *                 Example: getOrders({ accountId: "123", symbol: "AAPL", limit: 10, offset: 0 })
   * @returns FinaticResponse with success, error, and warning fields
   */
  async getPositions(params?: Partial<GetPositionsParams>): Promise<Awaited<ReturnType<typeof this.brokers.getPositions>>> {
    return await this.brokers.getPositions(params?.brokerId, params?.connectionId, params?.accountId, params?.symbol, params?.side, params?.assetType, params?.positionStatus, params?.limit, params?.offset, params?.updatedAfter, params?.updatedBefore, params?.withMetadata);
  }

  /**
   * Get Balances
   * 
   * Get balances for all authorized broker connections.
   * 
   * This endpoint is accessible from the portal and uses session-only authentication.
   * Returns balances from connections the company has read access to.
   * 
   * Convenience method that delegates to brokers wrapper.
   * 
   * @param params - Optional parameters object. Only include the fields you want to use.
   *                 Example: getOrders({ accountId: "123", symbol: "AAPL", limit: 10, offset: 0 })
   * @returns FinaticResponse with success, error, and warning fields
   */
  async getBalances(params?: Partial<GetBalancesParams>): Promise<Awaited<ReturnType<typeof this.brokers.getBalances>>> {
    return await this.brokers.getBalances(params?.brokerId, params?.connectionId, params?.accountId, params?.isEndOfDaySnapshot, params?.limit, params?.offset, params?.balanceCreatedAfter, params?.balanceCreatedBefore, params?.withMetadata);
  }

  /**
   * Get Accounts
   * 
   * Get accounts for all authorized broker connections.
   * 
   * This endpoint is accessible from the portal and uses session-only authentication.
   * Returns accounts from connections the company has read access to.
   * 
   * Convenience method that delegates to brokers wrapper.
   * 
   * @param params - Optional parameters object. Only include the fields you want to use.
   *                 Example: getOrders({ accountId: "123", symbol: "AAPL", limit: 10, offset: 0 })
   * @returns FinaticResponse with success, error, and warning fields
   */
  async getAccounts(params?: Partial<GetAccountsParams>): Promise<Awaited<ReturnType<typeof this.brokers.getAccounts>>> {
    return await this.brokers.getAccounts(params?.brokerId, params?.connectionId, params?.accountType, params?.status, params?.currency, params?.limit, params?.offset, params?.withMetadata);
  }

  /**
   * Get Order Fills
   * 
   * Get order fills for a specific order.
   * 
   * This endpoint returns all execution fills for the specified order.
   * 
   * Convenience method that delegates to brokers wrapper.
   * 
   * @param params - Optional parameters object. Only include the fields you want to use.
   *                 Example: getOrders({ accountId: "123", symbol: "AAPL", limit: 10, offset: 0 })
   * @returns FinaticResponse with success, error, and warning fields
   */
  async getOrderFills(params?: Partial<GetOrderFillsParams>): Promise<Awaited<ReturnType<typeof this.brokers.getOrderFills>>> {
    return await this.brokers.getOrderFills((params?.orderId as any), params?.connectionId, params?.limit, params?.offset);
  }

  /**
   * Get Order Events
   * 
   * Get order events for a specific order.
   * 
   * This endpoint returns all lifecycle events for the specified order.
   * 
   * Convenience method that delegates to brokers wrapper.
   * 
   * @param params - Optional parameters object. Only include the fields you want to use.
   *                 Example: getOrders({ accountId: "123", symbol: "AAPL", limit: 10, offset: 0 })
   * @returns FinaticResponse with success, error, and warning fields
   */
  async getOrderEvents(params?: Partial<GetOrderEventsParams>): Promise<Awaited<ReturnType<typeof this.brokers.getOrderEvents>>> {
    return await this.brokers.getOrderEvents((params?.orderId as any), params?.connectionId, params?.limit, params?.offset);
  }

  /**
   * Get Order Groups
   * 
   * Get order groups.
   * 
   * This endpoint returns order groups that contain multiple orders.
   * 
   * Convenience method that delegates to brokers wrapper.
   * 
   * @param params - Optional parameters object. Only include the fields you want to use.
   *                 Example: getOrders({ accountId: "123", symbol: "AAPL", limit: 10, offset: 0 })
   * @returns FinaticResponse with success, error, and warning fields
   */
  async getOrderGroups(params?: Partial<GetOrderGroupsParams>): Promise<Awaited<ReturnType<typeof this.brokers.getOrderGroups>>> {
    return await this.brokers.getOrderGroups(params?.brokerId, params?.connectionId, params?.limit, params?.offset, params?.createdAfter, params?.createdBefore);
  }

  /**
   * Get Position Lots
   * 
   * Get position lots (tax lots for positions).
   * 
   * This endpoint returns tax lots for positions, which are used for tax reporting.
   * Each lot tracks when a position was opened/closed and at what prices.
   * 
   * Convenience method that delegates to brokers wrapper.
   * 
   * @param params - Optional parameters object. Only include the fields you want to use.
   *                 Example: getOrders({ accountId: "123", symbol: "AAPL", limit: 10, offset: 0 })
   * @returns FinaticResponse with success, error, and warning fields
   */
  async getPositionLots(params?: Partial<GetPositionLotsParams>): Promise<Awaited<ReturnType<typeof this.brokers.getPositionLots>>> {
    return await this.brokers.getPositionLots(params?.brokerId, params?.connectionId, params?.accountId, params?.symbol, params?.positionId, params?.limit, params?.offset);
  }

  /**
   * Get Position Lot Fills
   * 
   * Get position lot fills for a specific lot.
   * 
   * This endpoint returns all fills associated with a specific position lot.
   * 
   * Convenience method that delegates to brokers wrapper.
   * 
   * @param params - Optional parameters object. Only include the fields you want to use.
   *                 Example: getOrders({ accountId: "123", symbol: "AAPL", limit: 10, offset: 0 })
   * @returns FinaticResponse with success, error, and warning fields
   */
  async getPositionLotFills(params?: Partial<GetPositionLotFillsParams>): Promise<Awaited<ReturnType<typeof this.brokers.getPositionLotFills>>> {
    return await this.brokers.getPositionLotFills((params?.lotId as any), params?.connectionId, params?.limit, params?.offset);
  }


  /**
   * Get all Orders across all pages.
   * Auto-generated from paginated endpoint.
   * 
   * @param params - Optional parameters object. Only include the fields you want to filter by.
   *                 Example: getAllOrders({ accountId: "123", symbol: "AAPL" })
   * @returns FinaticResponse with success, error, and warning fields containing array of all items
   */
  async getAllOrders(params?: Partial<GetOrdersParams>): Promise<FinaticResponse<OrderResponse[]>> {
    // Use provided params or empty object (excluding limit and offset which are handled internally)
    const filterParams: GetOrdersParams = (params || {}) as GetOrdersParams;
    const allData: OrderResponse[] = [];
    let offset = 0;
    const limit = 1000;
    let lastError: { [key: string]: any; } | null = null;
    let warnings: Array<{ [key: string]: any; }> = [];
    
    while (true) {
      const response = await this.brokers.getOrders(filterParams?.brokerId, filterParams?.connectionId, filterParams?.accountId, filterParams?.symbol, filterParams?.orderStatus, filterParams?.side, filterParams?.assetType, limit, offset, filterParams?.createdAfter, filterParams?.createdBefore, filterParams?.withMetadata);
      
      // Collect warnings from each page
      if (response.warning && Array.isArray(response.warning)) {
        warnings.push(...response.warning);
      }
      
      if (response.error) {
        lastError = response.error;
        break;
      }
      
      const result = response.success?.data || [];
      if (!result || result.length === 0) break;
      allData.push(...(Array.isArray(result) ? result : [result]));
      if (result.length < limit) break;
      offset += limit;
    }
    
    // Return FinaticResponse with accumulated data
    // When error occurs, return error response (success may be omitted or null)
    if (lastError) {
      return {
        success: {
          data: [] as OrderResponse[],
        },
        error: lastError,
        warning: warnings.length > 0 ? warnings : null,
      };
    }
    
    return {
      success: {
        data: allData,
      },
      error: null,
      warning: warnings.length > 0 ? warnings : null,
    };
  }

  /**
   * Get all Positions across all pages.
   * Auto-generated from paginated endpoint.
   * 
   * @param params - Optional parameters object. Only include the fields you want to filter by.
   *                 Example: getAllOrders({ accountId: "123", symbol: "AAPL" })
   * @returns FinaticResponse with success, error, and warning fields containing array of all items
   */
  async getAllPositions(params?: Partial<GetPositionsParams>): Promise<FinaticResponse<PositionResponse[]>> {
    // Use provided params or empty object (excluding limit and offset which are handled internally)
    const filterParams: GetPositionsParams = (params || {}) as GetPositionsParams;
    const allData: PositionResponse[] = [];
    let offset = 0;
    const limit = 1000;
    let lastError: { [key: string]: any; } | null = null;
    let warnings: Array<{ [key: string]: any; }> = [];
    
    while (true) {
      const response = await this.brokers.getPositions(filterParams?.brokerId, filterParams?.connectionId, filterParams?.accountId, filterParams?.symbol, filterParams?.side, filterParams?.assetType, filterParams?.positionStatus, limit, offset, filterParams?.updatedAfter, filterParams?.updatedBefore, filterParams?.withMetadata);
      
      // Collect warnings from each page
      if (response.warning && Array.isArray(response.warning)) {
        warnings.push(...response.warning);
      }
      
      if (response.error) {
        lastError = response.error;
        break;
      }
      
      const result = response.success?.data || [];
      if (!result || result.length === 0) break;
      allData.push(...(Array.isArray(result) ? result : [result]));
      if (result.length < limit) break;
      offset += limit;
    }
    
    // Return FinaticResponse with accumulated data
    // When error occurs, return error response (success may be omitted or null)
    if (lastError) {
      return {
        success: {
          data: [] as PositionResponse[],
        },
        error: lastError,
        warning: warnings.length > 0 ? warnings : null,
      };
    }
    
    return {
      success: {
        data: allData,
      },
      error: null,
      warning: warnings.length > 0 ? warnings : null,
    };
  }

  /**
   * Get all Balances across all pages.
   * Auto-generated from paginated endpoint.
   * 
   * @param params - Optional parameters object. Only include the fields you want to filter by.
   *                 Example: getAllOrders({ accountId: "123", symbol: "AAPL" })
   * @returns FinaticResponse with success, error, and warning fields containing array of all items
   */
  async getAllBalances(params?: Partial<GetBalancesParams>): Promise<FinaticResponse<Balances[]>> {
    // Use provided params or empty object (excluding limit and offset which are handled internally)
    const filterParams: GetBalancesParams = (params || {}) as GetBalancesParams;
    const allData: Balances[] = [];
    let offset = 0;
    const limit = 1000;
    let lastError: { [key: string]: any; } | null = null;
    let warnings: Array<{ [key: string]: any; }> = [];
    
    while (true) {
      const response = await this.brokers.getBalances(filterParams?.brokerId, filterParams?.connectionId, filterParams?.accountId, filterParams?.isEndOfDaySnapshot, limit, offset, filterParams?.balanceCreatedAfter, filterParams?.balanceCreatedBefore, filterParams?.withMetadata);
      
      // Collect warnings from each page
      if (response.warning && Array.isArray(response.warning)) {
        warnings.push(...response.warning);
      }
      
      if (response.error) {
        lastError = response.error;
        break;
      }
      
      const result = response.success?.data || [];
      if (!result || result.length === 0) break;
      allData.push(...(Array.isArray(result) ? result : [result]));
      if (result.length < limit) break;
      offset += limit;
    }
    
    // Return FinaticResponse with accumulated data
    // When error occurs, return error response (success may be omitted or null)
    if (lastError) {
      return {
        success: {
          data: [] as Balances[],
        },
        error: lastError,
        warning: warnings.length > 0 ? warnings : null,
      };
    }
    
    return {
      success: {
        data: allData,
      },
      error: null,
      warning: warnings.length > 0 ? warnings : null,
    };
  }

  /**
   * Get all Accounts across all pages.
   * Auto-generated from paginated endpoint.
   * 
   * @param params - Optional parameters object. Only include the fields you want to filter by.
   *                 Example: getAllOrders({ accountId: "123", symbol: "AAPL" })
   * @returns FinaticResponse with success, error, and warning fields containing array of all items
   */
  async getAllAccounts(params?: Partial<GetAccountsParams>): Promise<FinaticResponse<Accounts[]>> {
    // Use provided params or empty object (excluding limit and offset which are handled internally)
    const filterParams: GetAccountsParams = (params || {}) as GetAccountsParams;
    const allData: Accounts[] = [];
    let offset = 0;
    const limit = 1000;
    let lastError: { [key: string]: any; } | null = null;
    let warnings: Array<{ [key: string]: any; }> = [];
    
    while (true) {
      const response = await this.brokers.getAccounts(filterParams?.brokerId, filterParams?.connectionId, filterParams?.accountType, filterParams?.status, filterParams?.currency, limit, offset, filterParams?.withMetadata);
      
      // Collect warnings from each page
      if (response.warning && Array.isArray(response.warning)) {
        warnings.push(...response.warning);
      }
      
      if (response.error) {
        lastError = response.error;
        break;
      }
      
      const result = response.success?.data || [];
      if (!result || result.length === 0) break;
      allData.push(...(Array.isArray(result) ? result : [result]));
      if (result.length < limit) break;
      offset += limit;
    }
    
    // Return FinaticResponse with accumulated data
    // When error occurs, return error response (success may be omitted or null)
    if (lastError) {
      return {
        success: {
          data: [] as Accounts[],
        },
        error: lastError,
        warning: warnings.length > 0 ? warnings : null,
      };
    }
    
    return {
      success: {
        data: allData,
      },
      error: null,
      warning: warnings.length > 0 ? warnings : null,
    };
  }

  /**
   * Get all OrderFills across all pages.
   * Auto-generated from paginated endpoint.
   * 
   * @param params - Optional parameters object. Only include the fields you want to filter by.
   *                 Example: getAllOrders({ accountId: "123", symbol: "AAPL" })
   * @returns FinaticResponse with success, error, and warning fields containing array of all items
   */
  async getAllOrderFills(params?: Partial<GetOrderFillsParams>): Promise<FinaticResponse<OrderFillResponse[]>> {
    // Use provided params or empty object (excluding limit and offset which are handled internally)
    const filterParams: GetOrderFillsParams = (params || {}) as GetOrderFillsParams;
    const allData: OrderFillResponse[] = [];
    let offset = 0;
    const limit = 1000;
    let lastError: { [key: string]: any; } | null = null;
    let warnings: Array<{ [key: string]: any; }> = [];
    
    while (true) {
      const response = await this.brokers.getOrderFills(filterParams?.orderId, filterParams?.connectionId, limit, offset);
      
      // Collect warnings from each page
      if (response.warning && Array.isArray(response.warning)) {
        warnings.push(...response.warning);
      }
      
      if (response.error) {
        lastError = response.error;
        break;
      }
      
      const result = response.success?.data || [];
      if (!result || result.length === 0) break;
      allData.push(...(Array.isArray(result) ? result : [result]));
      if (result.length < limit) break;
      offset += limit;
    }
    
    // Return FinaticResponse with accumulated data
    // When error occurs, return error response (success may be omitted or null)
    if (lastError) {
      return {
        success: {
          data: [] as OrderFillResponse[],
        },
        error: lastError,
        warning: warnings.length > 0 ? warnings : null,
      };
    }
    
    return {
      success: {
        data: allData,
      },
      error: null,
      warning: warnings.length > 0 ? warnings : null,
    };
  }

  /**
   * Get all OrderEvents across all pages.
   * Auto-generated from paginated endpoint.
   * 
   * @param params - Optional parameters object. Only include the fields you want to filter by.
   *                 Example: getAllOrders({ accountId: "123", symbol: "AAPL" })
   * @returns FinaticResponse with success, error, and warning fields containing array of all items
   */
  async getAllOrderEvents(params?: Partial<GetOrderEventsParams>): Promise<FinaticResponse<OrderEventResponse[]>> {
    // Use provided params or empty object (excluding limit and offset which are handled internally)
    const filterParams: GetOrderEventsParams = (params || {}) as GetOrderEventsParams;
    const allData: OrderEventResponse[] = [];
    let offset = 0;
    const limit = 1000;
    let lastError: { [key: string]: any; } | null = null;
    let warnings: Array<{ [key: string]: any; }> = [];
    
    while (true) {
      const response = await this.brokers.getOrderEvents(filterParams?.orderId, filterParams?.connectionId, limit, offset);
      
      // Collect warnings from each page
      if (response.warning && Array.isArray(response.warning)) {
        warnings.push(...response.warning);
      }
      
      if (response.error) {
        lastError = response.error;
        break;
      }
      
      const result = response.success?.data || [];
      if (!result || result.length === 0) break;
      allData.push(...(Array.isArray(result) ? result : [result]));
      if (result.length < limit) break;
      offset += limit;
    }
    
    // Return FinaticResponse with accumulated data
    // When error occurs, return error response (success may be omitted or null)
    if (lastError) {
      return {
        success: {
          data: [] as OrderEventResponse[],
        },
        error: lastError,
        warning: warnings.length > 0 ? warnings : null,
      };
    }
    
    return {
      success: {
        data: allData,
      },
      error: null,
      warning: warnings.length > 0 ? warnings : null,
    };
  }

  /**
   * Get all OrderGroups across all pages.
   * Auto-generated from paginated endpoint.
   * 
   * @param params - Optional parameters object. Only include the fields you want to filter by.
   *                 Example: getAllOrders({ accountId: "123", symbol: "AAPL" })
   * @returns FinaticResponse with success, error, and warning fields containing array of all items
   */
  async getAllOrderGroups(params?: Partial<GetOrderGroupsParams>): Promise<FinaticResponse<OrderGroupResponse[]>> {
    // Use provided params or empty object (excluding limit and offset which are handled internally)
    const filterParams: GetOrderGroupsParams = (params || {}) as GetOrderGroupsParams;
    const allData: OrderGroupResponse[] = [];
    let offset = 0;
    const limit = 1000;
    let lastError: { [key: string]: any; } | null = null;
    let warnings: Array<{ [key: string]: any; }> = [];
    
    while (true) {
      const response = await this.brokers.getOrderGroups(filterParams?.brokerId, filterParams?.connectionId, limit, offset, filterParams?.createdAfter, filterParams?.createdBefore);
      
      // Collect warnings from each page
      if (response.warning && Array.isArray(response.warning)) {
        warnings.push(...response.warning);
      }
      
      if (response.error) {
        lastError = response.error;
        break;
      }
      
      const result = response.success?.data || [];
      if (!result || result.length === 0) break;
      allData.push(...(Array.isArray(result) ? result : [result]));
      if (result.length < limit) break;
      offset += limit;
    }
    
    // Return FinaticResponse with accumulated data
    // When error occurs, return error response (success may be omitted or null)
    if (lastError) {
      return {
        success: {
          data: [] as OrderGroupResponse[],
        },
        error: lastError,
        warning: warnings.length > 0 ? warnings : null,
      };
    }
    
    return {
      success: {
        data: allData,
      },
      error: null,
      warning: warnings.length > 0 ? warnings : null,
    };
  }

  /**
   * Get all PositionLots across all pages.
   * Auto-generated from paginated endpoint.
   * 
   * @param params - Optional parameters object. Only include the fields you want to filter by.
   *                 Example: getAllOrders({ accountId: "123", symbol: "AAPL" })
   * @returns FinaticResponse with success, error, and warning fields containing array of all items
   */
  async getAllPositionLots(params?: Partial<GetPositionLotsParams>): Promise<FinaticResponse<PositionLotResponse[]>> {
    // Use provided params or empty object (excluding limit and offset which are handled internally)
    const filterParams: GetPositionLotsParams = (params || {}) as GetPositionLotsParams;
    const allData: PositionLotResponse[] = [];
    let offset = 0;
    const limit = 1000;
    let lastError: { [key: string]: any; } | null = null;
    let warnings: Array<{ [key: string]: any; }> = [];
    
    while (true) {
      const response = await this.brokers.getPositionLots(filterParams?.brokerId, filterParams?.connectionId, filterParams?.accountId, filterParams?.symbol, filterParams?.positionId, limit, offset);
      
      // Collect warnings from each page
      if (response.warning && Array.isArray(response.warning)) {
        warnings.push(...response.warning);
      }
      
      if (response.error) {
        lastError = response.error;
        break;
      }
      
      const result = response.success?.data || [];
      if (!result || result.length === 0) break;
      allData.push(...(Array.isArray(result) ? result : [result]));
      if (result.length < limit) break;
      offset += limit;
    }
    
    // Return FinaticResponse with accumulated data
    // When error occurs, return error response (success may be omitted or null)
    if (lastError) {
      return {
        success: {
          data: [] as PositionLotResponse[],
        },
        error: lastError,
        warning: warnings.length > 0 ? warnings : null,
      };
    }
    
    return {
      success: {
        data: allData,
      },
      error: null,
      warning: warnings.length > 0 ? warnings : null,
    };
  }

  /**
   * Get all PositionLotFills across all pages.
   * Auto-generated from paginated endpoint.
   * 
   * @param params - Optional parameters object. Only include the fields you want to filter by.
   *                 Example: getAllOrders({ accountId: "123", symbol: "AAPL" })
   * @returns FinaticResponse with success, error, and warning fields containing array of all items
   */
  async getAllPositionLotFills(params?: Partial<GetPositionLotFillsParams>): Promise<FinaticResponse<PositionLotFillResponse[]>> {
    // Use provided params or empty object (excluding limit and offset which are handled internally)
    const filterParams: GetPositionLotFillsParams = (params || {}) as GetPositionLotFillsParams;
    const allData: PositionLotFillResponse[] = [];
    let offset = 0;
    const limit = 1000;
    let lastError: { [key: string]: any; } | null = null;
    let warnings: Array<{ [key: string]: any; }> = [];
    
    while (true) {
      const response = await this.brokers.getPositionLotFills(filterParams?.lotId, filterParams?.connectionId, limit, offset);
      
      // Collect warnings from each page
      if (response.warning && Array.isArray(response.warning)) {
        warnings.push(...response.warning);
      }
      
      if (response.error) {
        lastError = response.error;
        break;
      }
      
      const result = response.success?.data || [];
      if (!result || result.length === 0) break;
      allData.push(...(Array.isArray(result) ? result : [result]));
      if (result.length < limit) break;
      offset += limit;
    }
    
    // Return FinaticResponse with accumulated data
    // When error occurs, return error response (success may be omitted or null)
    if (lastError) {
      return {
        success: {
          data: [] as PositionLotFillResponse[],
        },
        error: lastError,
        warning: warnings.length > 0 ? warnings : null,
      };
    }
    
    return {
      success: {
        data: allData,
      },
      error: null,
      warning: warnings.length > 0 ? warnings : null,
    };
  }
}
