/**
 * Main client class for Finatic Server SDK (Node.js).
 *
 * This file is regenerated on each run - do not edit directly.
 * For custom logic, extend this class or use custom wrappers.
 */

import { Configuration } from './openapi/configuration';
import { SdkConfig, defaultConfig } from './config';
import {
  appendThemeToURL,
  appendBrokerFilterToURL,
  appendKindToURL,
  appendAssetTypesToURL,
  appendStageToURL,
} from './utils/url-utils';
import { getLogger, type Logger } from './utils/logger';
import type { SessionStartRequest } from './openapi/models';
import type { GetCompanyParams } from './wrappers/company';
import type {
  CancelOrderParams,
  DisconnectCompanyFromBrokerParams,
  FinaticResponse,
  GetAccountsParams,
  GetBalancesParams,
  GetBrokerConnectionsParams,
  GetBrokersParams,
  GetOrderEventsParams,
  GetOrderFillsParams,
  GetOrderGroupsParams,
  GetOrdersParams,
  GetPositionLotFillsParams,
  GetPositionLotsParams,
  GetPositionsParams,
  GetTransactionsParams,
  ModifyOrderParams,
  PlaceOrderParams,
} from './wrappers/brokers';
import type {
  FDXBrokerOrder,
  FDXBrokerOrderEvent,
  FDXBrokerOrderFill,
  FDXBrokerOrderGroup,
  FDXBrokerPosition,
  FDXBrokerPositionLot,
  FDXBrokerPositionLotFill,
  FDXBrokerTransaction,
  LegacyBrokerAccount,
  LegacyBrokerBalance,
} from './openapi/models';
import { BrokersApi } from './openapi/api/brokers-api';
import { CompanyApi } from './openapi/api/company-api';
import { SessionApi } from './openapi/api/session-api';
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

  constructor(apiKey: string, sdkConfig?: Partial<SdkConfig>) {
    this.apiKey = apiKey;
    this.sdkConfig = { ...defaultConfig, ...sdkConfig };
    // Extract baseUrl from sdkConfig only
    const finalBaseUrl = this.sdkConfig.baseUrl || 'https://api.finatic.dev';
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
   * Static initialization method - creates instance and starts session.
   * This is the recommended way to initialize the Server SDK.
   *
   * @methodId init_server_sdk
   * @category session
   *
   * @example
   * ```typescript-server
   * const finatic = await FinaticServer.init('your-api-key', 'optional-user-id', {
   *   baseUrl: 'https://api.finatic.dev',
   *   logLevel: 'debug'
   * });
   * // Session is already started, ready to use
   * const orders = await finatic.getAllOrders();
   * ```
   *
   * @example
   * ```typescript-server
   * // Minimal example with just API key
   * const finatic = await FinaticServer.init('your-api-key');
   * ```
   *
   * @example
   * ```python
   * client = await FinaticServer.init(
   *     api_key="fntc_live_your_key",
   *     user_id="optional_user_id",
   *     sdk_config={'base_url': 'https://api.finatic.dev', 'log_level': 'debug'}
   * )
   * # Session is already started, ready to use
   * orders = await client.get_all_orders()
   * ```
   *
   * @param apiKey - Company API key (required)
   * @param userId - Optional user ID for direct authentication
   * @param sdkConfig - Optional SDK configuration overrides (includes baseUrl)
   * @returns FinaticServer instance with session already initialized
   */
  static async init(
    apiKey: string,
    userId?: string,
    sdkConfig?: Partial<SdkConfig>
  ): Promise<FinaticServer> {
    // Create instance (baseUrl is extracted from sdkConfig in constructor)
    const instance = new FinaticServer(apiKey, sdkConfig);

    // Start session automatically using the instance's startSession method
    // This will use the API key from constructor and get token internally
    // Pass userId to startSession if provided
    try {
      const sessionResult = await instance.startSession(userId ? { userId } : undefined);

      // Handle union return type: can be { success, session_id, company_id, error } or { session_id, company_id }
      if ('success' in sessionResult && !sessionResult.success) {
        throw new Error(
          sessionResult.error ||
            'Session initialization failed. Please check that the API endpoint returned a valid session response and ensure the API key is valid.'
        );
      }

      // Verify session was initialized correctly
      const sessionId = sessionResult.session_id || instance.getSessionId();
      if (!sessionId) {
        throw new Error(
          'Session initialization failed: startSession() did not return a session_id. ' +
            'Please check that the API endpoint returned a valid session response.'
        );
      }

      return instance;
    } catch (error) {
      // Re-throw with more context if it's a session initialization error
      if (error instanceof Error) {
        if (
          error.message.includes('Session not initialized') ||
          error.message.includes('session_id')
        ) {
          throw new Error(
            `Failed to initialize Finatic session: ${error.message}. ` +
              'This may indicate that startSession() was called but did not successfully create a session. ' +
              'Please check the API response and ensure the API key is valid.'
          );
        }
      }
      throw error;
    }
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
    if (response.error) {
      throw new Error(response.error['message'] || 'Failed to initialize session');
    }
    return (
      ((response.success?.data as Record<string, unknown>)?.['one_time_token'] as
        | string
        | undefined) || ''
    );
  }

  /**
   * Get a one-time token from an API key.
   *
   * This method only retrieves the token and returns it - it does NOT start a session
   * or set any session context. Useful for generating tokens to pass to clients.
   *
   * @methodId init_session_api_v1_session_init_post
   * @category session
   * @param apiKey - Company API key (uses instance API key if not provided)
   * @returns One-time token string
   * @example
   * ```typescript-server
   * const token = await finatic.getToken();
   * ```
   * @example
   * ```typescript-client
   * const token = await finatic.getToken();
   * ```
   * @example
   * ```python
   * token = await finatic.get_token()
   * ```
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
   * @methodId start_session_api_v1_session_start_post
   * @category session
   * @param params - Optional parameters object
   * @param params.oneTimeToken - Optional one-time token. If not provided, will get one using API key.
   * @param params.userId - Optional user ID for direct authentication
   * @returns Object with success, session_id, company_id, and error fields (if no token) or session_id/company_id (if token provided)
   * @example
   * ```typescript-server
   * const result = await finatic.startSession({ oneTimeToken, userId });
   * ```
   * @example
   * ```typescript-client
   * const result = await finatic.startSession({ oneTimeToken, userId });
   * ```
   * @example
   * ```python
   * result = await finatic.start_session(one_time_token=one_time_token, user_id=user_id)
   * ```
   */
  async startSession(params?: { oneTimeToken?: string; userId?: string }): Promise<
    | {
        success: boolean;
        session_id: string | null;
        company_id: string | null;
        error: string | null;
      }
    | { session_id: string; company_id: string }
  > {
    const { oneTimeToken, userId: paramUserId } = params || {};
    // If token provided, use it directly
    if (oneTimeToken) {
      const requestBody: SessionStartRequest =
        paramUserId !== undefined ? { user_id: paramUserId } : {};
      const response = await this.session.startSession({
        OneTimeToken: oneTimeToken,
        body: requestBody,
      });
      if (response.error) {
        throw new Error(response.error['message'] || 'Failed to start session');
      }
      const sessionData = response.success?.data as Record<string, unknown> | undefined;
      const sessionId = (sessionData?.['session_id'] as string | undefined) || '';
      const companyId = (sessionData?.['company_id'] as string | undefined) || '';
      const csrfToken = (sessionData?.['csrf_token'] as string | undefined) || '';
      const responseUserId = (sessionData?.['user_id'] as string | undefined) || '';

      if (sessionId && companyId) {
        this.setSessionContext(sessionId, companyId, csrfToken);
      }

      // Store userId if present in response (for getUserId() and isAuthed())
      // Use userId from response if available, otherwise use the parameter userId
      const finalUserId = responseUserId || paramUserId;
      if (finalUserId) {
        this.userId = finalUserId;
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
      const sessionResult = await this.startSession({
        oneTimeToken,
        ...(paramUserId !== undefined ? { userId: paramUserId } : {}),
      });

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
   *
   * @methodId get_portal_url_api_v1_session_portal_get
   * @category session
   * @param params - Optional parameters object
   * @param params.theme - Optional theme preset or custom theme object
   * @param params.brokers - Optional array of broker IDs to filter
   * @param params.kind - Optional filter by provider type ('broker' or 'exchange')
   * @param params.asset_types - Optional asset types/capabilities to filter (AND logic)
   * @param params.stage - Optional broker stage filter: array of 'production' | 'beta' | 'alpha' (OR; omit = show all)
   * @param params.email - Optional email address
   * @param params.mode - Optional mode ('light' or 'dark')
   * @returns Portal URL string
   * @example
   * ```typescript-server
   * const url = await finatic.getPortalUrl({ theme: 'default', brokers: ['broker-1'], kind: 'exchange', asset_types: ['crypto'], stage: ['production'], email: 'user@example.com', mode: 'dark' });
   * ```
   * @example
   * ```typescript-client
   * const url = await finatic.getPortalUrl({ theme: 'default', brokers: ['broker-1'], kind: 'exchange', asset_types: ['crypto'], stage: ['production'], email: 'user@example.com', mode: 'dark' });
   * ```
   * @example
   * ```python
   * url = await finatic.get_portal_url(theme='default', brokers=['broker-1'], kind='exchange', asset_types=['crypto'], stage=['production'], email='user@example.com', mode='dark')
   * ```
   */
  async getPortalUrl(params?: {
    theme?: string | { preset?: string; custom?: Record<string, unknown> };
    brokers?: string[];
    kind?: 'broker' | 'exchange';
    asset_types?: string[];
    stage?: ('production' | 'beta' | 'alpha')[];
    email?: string;
    mode?: 'light' | 'dark';
  }): Promise<string> {
    if (!this.sessionId) {
      throw new Error('Session not initialized. Call startSession() first.');
    }

    const { theme, brokers, kind, asset_types, stage, email, mode } = params || {};

    // Get raw portal URL from session wrapper
    const response = await this.session.getPortalUrl();
    if (response.error) {
      throw new Error(response.error['message'] || 'Failed to get portal URL');
    }

    // Validate response structure
    if (!response.success?.data) {
      throw new Error('Invalid portal URL response: missing data');
    }

    let portalUrl =
      ((response.success?.data as Record<string, unknown>)?.['portal_url'] as string | undefined) ||
      '';

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

    // Append kind (type) filter if provided
    if (kind) {
      portalUrl = appendKindToURL(portalUrl, kind);
    }

    // Append asset types (capabilities) filter if provided
    if (asset_types && asset_types.length > 0) {
      portalUrl = appendAssetTypesToURL(portalUrl, asset_types);
    }

    // Append stage filter if provided
    if (stage && stage.length > 0) {
      portalUrl = appendStageToURL(portalUrl, stage);
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

    // Note: session_id and company_id should NOT be added to the portal URL
    // The backend includes the token in the URL, and session context is handled via headers

    return portalUrl;
  }

  /**
   * Get session user information after portal authentication.
   *
   * @methodId get_session_user_api_v1_session__session_id__user_get
   * @category session
   * @returns Object with user_id and company_id
   * @example
   * ```typescript-server
   * const user = await finatic.getSessionUser();
   * ```
   * @example
   * ```typescript-client
   * const user = await finatic.getSessionUser();
   * ```
   * @example
   * ```python
   * user = await finatic.get_session_user()
   * ```
   */
  async getSessionUser(): Promise<{ user_id: string; company_id: string }> {
    if (!this.sessionId) {
      throw new Error('Session not initialized. Call startSession() first.');
    }

    const response = await this.session.getSessionUser({ sessionId: this.sessionId! });
    if (response.error) {
      throw new Error(response.error['message'] || 'Failed to get session user');
    }
    const userId =
      ((response.success?.data as Record<string, unknown>)?.['user_id'] as string | undefined) ||
      '';
    // The 'getSessionUser' endpoint currently returns 'SessionUserResponse' which contains 'user_id'.
    // Company context is tracked from 'startSession' and stored on the instance.
    const companyId = this.companyId || '';

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
   *
   * @methodId get_user_id_helper
   * @category session
   * @returns Current user ID or undefined if not authenticated
   * @example
   * ```typescript-server
   * const userId = finatic.getUserId();
   * ```
   * @example
   * ```typescript-client
   * const userId = finatic.getUserId();
   * ```
   * @example
   * ```python
   * user_id = finatic.get_user_id()
   * ```
   */
  getUserId(): string | undefined {
    return this.userId;
  }

  /**
   * Check if user is authenticated (has userId).
   *
   * @methodId is_authed_helper
   * @category session
   * @returns True if user is authenticated, false otherwise
   * @example
   * ```typescript-server
   * const isAuthenticated = finatic.isAuthed();
   * ```
   * @example
   * ```typescript-client
   * const isAuthenticated = finatic.isAuthed();
   * ```
   * @example
   * ```python
   * is_authenticated = finatic.is_authed()
   * ```
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
   * @param params.companyId {string} Company ID
   * @returns FinaticResponse with success, error, and warning fields
   * @methodId get_company_api_beta_company__company_id__get
   * @category company
   * @example
   * ```typescript-server
   * // Minimal example with required parameters only
   * const result = await finatic.getCompany({ companyId: 'example-id' });
   *
   * // Access the response data
   * if (result.success) {
   *   console.log('Data:', result.success.data);
   * } else if (result.error) {
   *   console.error('Error:', result.error.message);
   * }
   * ```
   * @example
   * ```typescript-client
   * // Minimal example with required parameters only
   * const result = await finatic.getCompany({ companyId: 'example-id' });
   *
   * // Access the response data
   * if (result.success) {
   *   console.log('Data:', result.success.data);
   * } else if (result.error) {
   *   console.error('Error:', result.error.message);
   * }
   * ```
   * @example
   * ```python
   * # Minimal example with required parameters only
   * result = await finatic.get_company(
   *            company_id='example'
   * )
   *
   * # Access the response data
   * if result.success:
   *     print('Data:', result.success['data'])
   * elif result.error:
   *     print('Error:', result.error['message'])
   * ```
   */
  async getCompany(
    params: GetCompanyParams
  ): Promise<Awaited<ReturnType<typeof this.company.getCompany>>> {
    return await this.company.getCompany(params);
  }

  /**
   * Get Balances
   * 
   * Get current unit-based balances for all authorized broker connections.
   * 
   * Returns array of current balances (one per unit_code per account).
   * This endpoint is accessible from the portal and uses session-only authentication.
   * Returns balances from connections the company has read access to.
   * 
   * Convenience method that delegates to brokers wrapper.
   * 
   * @param params.brokerId {string} (optional) Filter by broker ID
   * @param params.connectionId {string} (optional) Filter by connection ID
   * @param params.accountId {string} (optional) Filter by broker provided account ID or internal account UUID
   * @param params.unitCode {string} (optional) Filter by unit code (preferred, e.g., 'USD', 'BTC', 'ETH')
   * @param params.currency {string} (optional) Filter by currency (for FDX fiat filtering only, e.g., 'USD', 'EUR')
   * @param params.limit {number} (optional) Maximum number of balances to return
   * @param params.offset {number} (optional) Number of balances to skip for pagination
   * @param params.includeMetadata {boolean} (optional) Include balance metadata in response (excluded by default for FDX compliance)
   * @returns FinaticResponse with success, error, and warning fields
   * @methodId get_balances_api_beta_brokers_data_balances_get
   * @category brokers
   * @example
   * ```typescript-server
   * // Example with no parameters
   * const result = await finatic.getBalances();
   * 
   * // Access the response data
   * if (result.success) {
   *   console.log('Data:', result.success.data);
   * }
   * ```
   * @example
   * ```typescript-server
   * // Full example with optional parameters
   * const result = await finatic.getBalances({ brokerId: 'example-id', connectionId: 'example-id', accountId: 'example-id' });
   * 
   * // Handle response with warnings
   * if (result.success) {
   *   console.log('Data:', result.success.data);
   *   if (result.warning && result.warning.length > 0) {
   *     console.warn('Warnings:', result.warning);
   *   }
   * } else if (result.error) {
   *   console.error('Error:', result.error.message, result.error.code);
   * }
   * ```
   * @example
   * ```typescript-client
   * // Example with no parameters
   * const result = await finatic.getBalances();
   * 
   * // Access the response data
   * if (result.success) {
   *   console.log('Data:', result.success.data);
   * }
   * ```
   * @example
   * ```python
   * # Example with no parameters
   * result = await finatic.get_balances()
   * 
   * # Access the response data
   * if result.success:
   *     print('Data:', result.success['data'])
   * ```
   * @example
   * ```python
   * # Full example with optional parameters
   * result = await finatic.get_balances(
   *            broker_id='example',
            connection_id='example',
            account_id='example'
   * )
   * 
   * # Handle response with warnings
   * if result.success:
   *     print('Data:', result.success['data'])
   *     if result.warning:
   *         print('Warnings:', result.warning)
   * elif result.error:
   *     print('Error:', result.error['message'], result.error['code'])
   * ```
   */
  async getBalances(
    params?: GetBalancesParams
  ): Promise<Awaited<ReturnType<typeof this.brokers.getBalances>>> {
    return await this.brokers.getBalances(params);
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
   * @param params.brokerId {string} (optional) Filter by broker ID
   * @param params.connectionId {string} (optional) Filter by connection ID
   * @param params.accountType {BrokerDataAccountTypeEnum} (optional) Filter by account type (e.g., 'margin', 'cash', 'crypto_wallet', 'live', 'sim')
   * @param params.currency {string} (optional) Filter by currency (e.g., 'USD', 'EUR')
   * @param params.limit {number} (optional) Maximum number of accounts to return
   * @param params.offset {number} (optional) Number of accounts to skip for pagination
   * @param params.includeMetadata {boolean} (optional) Include connection metadata in response (excluded by default for FDX compliance)
   * @returns FinaticResponse with success, error, and warning fields
   * @methodId get_accounts_api_beta_brokers_data_accounts_get
   * @category brokers
   * @example
   * ```typescript-server
   * // Example with no parameters
   * const result = await finatic.getAccounts();
   * 
   * // Access the response data
   * if (result.success) {
   *   console.log('Data:', result.success.data);
   * }
   * ```
   * @example
   * ```typescript-server
   * // Full example with optional parameters
   * const result = await finatic.getAccounts({ brokerId: 'example-id', connectionId: 'example-id', accountType: 'margin' });
   * 
   * // Handle response with warnings
   * if (result.success) {
   *   console.log('Data:', result.success.data);
   *   if (result.warning && result.warning.length > 0) {
   *     console.warn('Warnings:', result.warning);
   *   }
   * } else if (result.error) {
   *   console.error('Error:', result.error.message, result.error.code);
   * }
   * ```
   * @example
   * ```typescript-client
   * // Example with no parameters
   * const result = await finatic.getAccounts();
   * 
   * // Access the response data
   * if (result.success) {
   *   console.log('Data:', result.success.data);
   * }
   * ```
   * @example
   * ```python
   * # Example with no parameters
   * result = await finatic.get_accounts()
   * 
   * # Access the response data
   * if result.success:
   *     print('Data:', result.success['data'])
   * ```
   * @example
   * ```python
   * # Full example with optional parameters
   * result = await finatic.get_accounts(
   *            broker_id='example',
            connection_id='example',
            account_type='margin'
   * )
   * 
   * # Handle response with warnings
   * if result.success:
   *     print('Data:', result.success['data'])
   *     if result.warning:
   *         print('Warnings:', result.warning)
   * elif result.error:
   *     print('Error:', result.error['message'], result.error['code'])
   * ```
   */
  async getAccounts(
    params?: GetAccountsParams
  ): Promise<Awaited<ReturnType<typeof this.brokers.getAccounts>>> {
    return await this.brokers.getAccounts(params);
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
   * @param params No parameters required for this method
   * @returns FinaticResponse with success, error, and warning fields
   * @methodId get_brokers_api_beta_brokers__get
   * @category brokers
   * @example
   * ```typescript-server
   * // Example with no parameters
   * const result = await finatic.getBrokers();
   *
   * // Access the response data
   * if (result.success) {
   *   console.log('Data:', result.success.data);
   * }
   * ```
   * @example
   * ```typescript-client
   * // Example with no parameters
   * const result = await finatic.getBrokers();
   *
   * // Access the response data
   * if (result.success) {
   *   console.log('Data:', result.success.data);
   * }
   * ```
   * @example
   * ```python
   * # Example with no parameters
   * result = await finatic.get_brokers()
   *
   * # Access the response data
   * if result.success:
   *     print('Data:', result.success['data'])
   * ```
   */
  async getBrokers(params?: {}): Promise<Awaited<ReturnType<typeof this.brokers.getBrokers>>> {
    return await this.brokers.getBrokers();
  }

  /**
   * List Broker Connections
   *
   * List all broker connections for the current user with permissions.
   *
   * This endpoint is accessible from the portal and uses session-only authentication.
   * Returns connections that the user has any permissions for, including the current
   * company's permissions (read/write) for each connection.
   *
   * Convenience method that delegates to brokers wrapper.
   *
   * @param params No parameters required for this method
   * @returns FinaticResponse with success, error, and warning fields
   * @methodId list_broker_connections_api_beta_brokers_connections_get
   * @category brokers
   * @example
   * ```typescript-server
   * // Example with no parameters
   * const result = await finatic.getBrokerConnections();
   *
   * // Access the response data
   * if (result.success) {
   *   console.log('Data:', result.success.data);
   * }
   * ```
   * @example
   * ```typescript-client
   * // Example with no parameters
   * const result = await finatic.getBrokerConnections();
   *
   * // Access the response data
   * if (result.success) {
   *   console.log('Data:', result.success.data);
   * }
   * ```
   * @example
   * ```python
   * # Example with no parameters
   * result = await finatic.get_broker_connections()
   *
   * # Access the response data
   * if result.success:
   *     print('Data:', result.success['data'])
   * ```
   */
  async getBrokerConnections(params?: {}): Promise<
    Awaited<ReturnType<typeof this.brokers.getBrokerConnections>>
  > {
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
   * @param params.connectionId {string} Connection ID
   * @returns FinaticResponse with success, error, and warning fields
   * @methodId disconnect_company_from_broker_api_beta_brokers_disconnect_company__connection_id__delete
   * @category brokers
   * @example
   * ```typescript-server
   * // Minimal example with required parameters only
   * const result = await finatic.disconnectCompanyFromBroker({ connectionId: 'example-id' });
   *
   * // Access the response data
   * if (result.success) {
   *   console.log('Data:', result.success.data);
   * } else if (result.error) {
   *   console.error('Error:', result.error.message);
   * }
   * ```
   * @example
   * ```typescript-client
   * // Minimal example with required parameters only
   * const result = await finatic.disconnectCompanyFromBroker({ connectionId: 'example-id' });
   *
   * // Access the response data
   * if (result.success) {
   *   console.log('Data:', result.success.data);
   * } else if (result.error) {
   *   console.error('Error:', result.error.message);
   * }
   * ```
   * @example
   * ```python
   * # Minimal example with required parameters only
   * result = await finatic.disconnect_company_from_broker(
   *            connection_id='example'
   * )
   *
   * # Access the response data
   * if result.success:
   *     print('Data:', result.success['data'])
   * elif result.error:
   *     print('Error:', result.error['message'])
   * ```
   */
  async disconnectCompanyFromBroker(
    params: DisconnectCompanyFromBrokerParams
  ): Promise<Awaited<ReturnType<typeof this.brokers.disconnectCompanyFromBroker>>> {
    return await this.brokers.disconnectCompanyFromBroker(params);
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
   * @param params.brokerId {string} (optional) Filter by broker ID
   * @param params.connectionId {string} (optional) Filter by connection ID
   * @param params.accountId {string} (optional) Filter by broker provided account ID or internal account UUID
   * @param params.symbol {string} (optional) Filter by symbol
   * @param params.orderStatus {string} (optional) Filter by order status (e.g., 'filled', 'pending_new', 'cancelled')
   * @param params.side {BrokerDataOrderSideEnum} (optional) Filter by order side (e.g., 'buy', 'sell')
   * @param params.assetType {BrokerDataAssetTypeEnum} (optional) Filter by asset type (e.g., 'stock', 'option', 'crypto', 'future')
   * @param params.limit {number} (optional) Maximum number of orders to return
   * @param params.offset {number} (optional) Number of orders to skip for pagination
   * @param params.createdAfter {string} (optional) Filter orders created after this timestamp
   * @param params.createdBefore {string} (optional) Filter orders created before this timestamp
   * @param params.includeMetadata {boolean} (optional) Include order metadata in response (excluded by default for FDX compliance)
   * @returns FinaticResponse with success, error, and warning fields
   * @methodId get_orders_api_beta_brokers_data_orders_get
   * @category brokers
   * @example
   * ```typescript-server
   * // Example with no parameters
   * const result = await finatic.getOrders();
   * 
   * // Access the response data
   * if (result.success) {
   *   console.log('Data:', result.success.data);
   * }
   * ```
   * @example
   * ```typescript-server
   * // Full example with optional parameters
   * const result = await finatic.getOrders({ brokerId: 'example-id', connectionId: 'example-id', accountId: 'example-id' });
   * 
   * // Handle response with warnings
   * if (result.success) {
   *   console.log('Data:', result.success.data);
   *   if (result.warning && result.warning.length > 0) {
   *     console.warn('Warnings:', result.warning);
   *   }
   * } else if (result.error) {
   *   console.error('Error:', result.error.message, result.error.code);
   * }
   * ```
   * @example
   * ```typescript-client
   * // Example with no parameters
   * const result = await finatic.getOrders();
   * 
   * // Access the response data
   * if (result.success) {
   *   console.log('Data:', result.success.data);
   * }
   * ```
   * @example
   * ```python
   * # Example with no parameters
   * result = await finatic.get_orders()
   * 
   * # Access the response data
   * if result.success:
   *     print('Data:', result.success['data'])
   * ```
   * @example
   * ```python
   * # Full example with optional parameters
   * result = await finatic.get_orders(
   *            broker_id='example',
            connection_id='example',
            account_id='example'
   * )
   * 
   * # Handle response with warnings
   * if result.success:
   *     print('Data:', result.success['data'])
   *     if result.warning:
   *         print('Warnings:', result.warning)
   * elif result.error:
   *     print('Error:', result.error['message'], result.error['code'])
   * ```
   */
  async getOrders(
    params?: GetOrdersParams
  ): Promise<Awaited<ReturnType<typeof this.brokers.getOrders>>> {
    return await this.brokers.getOrders(params);
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
   * @param params.brokerId {string} (optional) Filter by broker ID
   * @param params.connectionId {string} (optional) Filter by connection ID
   * @param params.accountId {string} (optional) Filter by broker provided account ID or internal account UUID
   * @param params.symbol {string} (optional) Filter by symbol
   * @param params.side {BrokerDataOrderSideEnum} (optional) Filter by position side (e.g., 'long', 'short')
   * @param params.assetType {BrokerDataAssetTypeEnum} (optional) Filter by asset type (e.g., 'stock', 'option', 'crypto', 'future')
   * @param params.positionStatus {BrokerDataPositionStatusEnum} (optional) Filter by position status: 'active' (open positions) or 'closed' (closed positions). Use 'all' or omit to get both.
   * @param params.limit {number} (optional) Maximum number of positions to return
   * @param params.offset {number} (optional) Number of positions to skip for pagination
   * @param params.updatedAfter {string} (optional) Filter positions updated after this timestamp
   * @param params.updatedBefore {string} (optional) Filter positions updated before this timestamp
   * @param params.includeMetadata {boolean} (optional) Include position metadata in response (excluded by default for FDX compliance)
   * @returns FinaticResponse with success, error, and warning fields
   * @methodId get_positions_api_beta_brokers_data_positions_get
   * @category brokers
   * @example
   * ```typescript-server
   * // Example with no parameters
   * const result = await finatic.getPositions();
   * 
   * // Access the response data
   * if (result.success) {
   *   console.log('Data:', result.success.data);
   * }
   * ```
   * @example
   * ```typescript-server
   * // Full example with optional parameters
   * const result = await finatic.getPositions({ brokerId: 'example-id', connectionId: 'example-id', accountId: 'example-id' });
   * 
   * // Handle response with warnings
   * if (result.success) {
   *   console.log('Data:', result.success.data);
   *   if (result.warning && result.warning.length > 0) {
   *     console.warn('Warnings:', result.warning);
   *   }
   * } else if (result.error) {
   *   console.error('Error:', result.error.message, result.error.code);
   * }
   * ```
   * @example
   * ```typescript-client
   * // Example with no parameters
   * const result = await finatic.getPositions();
   * 
   * // Access the response data
   * if (result.success) {
   *   console.log('Data:', result.success.data);
   * }
   * ```
   * @example
   * ```python
   * # Example with no parameters
   * result = await finatic.get_positions()
   * 
   * # Access the response data
   * if result.success:
   *     print('Data:', result.success['data'])
   * ```
   * @example
   * ```python
   * # Full example with optional parameters
   * result = await finatic.get_positions(
   *            broker_id='example',
            connection_id='example',
            account_id='example'
   * )
   * 
   * # Handle response with warnings
   * if result.success:
   *     print('Data:', result.success['data'])
   *     if result.warning:
   *         print('Warnings:', result.warning)
   * elif result.error:
   *     print('Error:', result.error['message'], result.error['code'])
   * ```
   */
  async getPositions(
    params?: GetPositionsParams
  ): Promise<Awaited<ReturnType<typeof this.brokers.getPositions>>> {
    return await this.brokers.getPositions(params);
  }

  /**
   * Get Transactions
   * 
   * Get transactions for all authorized broker connections.
   * 
   * Returns transactions from connections the company has read access to.
   * This endpoint is accessible from the portal and uses session-only authentication.
   * 
   * Convenience method that delegates to brokers wrapper.
   * 
   * @param params.brokerId {string} (optional) Filter by broker ID
   * @param params.connectionId {string} (optional) Filter by connection ID
   * @param params.accountId {string} (optional) Filter by broker provided account ID or internal account UUID
   * @param params.unitCode {string} (optional) Filter by unit code (preferred, e.g., 'USD', 'BTC', 'ETH')
   * @param params.currency {string} (optional) Filter by currency (for FDX fiat filtering only, e.g., 'USD', 'EUR')
   * @param params.transactionType {string} (optional) Filter by transaction type (e.g., 'DEPOSIT', 'WITHDRAWAL', 'DIVIDEND')
   * @param params.startDate {string} (optional) Filter transactions from this date (ISO 8601)
   * @param params.endDate {string} (optional) Filter transactions until this date (ISO 8601)
   * @param params.limit {number} (optional) Maximum number of transactions to return
   * @param params.offset {number} (optional) Number of transactions to skip for pagination
   * @returns FinaticResponse with success, error, and warning fields
   * @methodId get_transactions_api_beta_brokers_data_transactions_get
   * @category brokers
   * @example
   * ```typescript-server
   * // Example with no parameters
   * const result = await finatic.getTransactions();
   * 
   * // Access the response data
   * if (result.success) {
   *   console.log('Data:', result.success.data);
   * }
   * ```
   * @example
   * ```typescript-server
   * // Full example with optional parameters
   * const result = await finatic.getTransactions({ brokerId: 'example-id', connectionId: 'example-id', accountId: 'example-id' });
   * 
   * // Handle response with warnings
   * if (result.success) {
   *   console.log('Data:', result.success.data);
   *   if (result.warning && result.warning.length > 0) {
   *     console.warn('Warnings:', result.warning);
   *   }
   * } else if (result.error) {
   *   console.error('Error:', result.error.message, result.error.code);
   * }
   * ```
   * @example
   * ```typescript-client
   * // Example with no parameters
   * const result = await finatic.getTransactions();
   * 
   * // Access the response data
   * if (result.success) {
   *   console.log('Data:', result.success.data);
   * }
   * ```
   * @example
   * ```python
   * # Example with no parameters
   * result = await finatic.get_transactions()
   * 
   * # Access the response data
   * if result.success:
   *     print('Data:', result.success['data'])
   * ```
   * @example
   * ```python
   * # Full example with optional parameters
   * result = await finatic.get_transactions(
   *            broker_id='example',
            connection_id='example',
            account_id='example'
   * )
   * 
   * # Handle response with warnings
   * if result.success:
   *     print('Data:', result.success['data'])
   *     if result.warning:
   *         print('Warnings:', result.warning)
   * elif result.error:
   *     print('Error:', result.error['message'], result.error['code'])
   * ```
   */
  async getTransactions(
    params?: GetTransactionsParams
  ): Promise<Awaited<ReturnType<typeof this.brokers.getTransactions>>> {
    return await this.brokers.getTransactions(params);
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
   * @param params.orderId {string} Order ID
   * @param params.connectionId {string} (optional) Filter by connection ID
   * @param params.limit {number} (optional) Maximum number of fills to return
   * @param params.offset {number} (optional) Number of fills to skip for pagination
   * @param params.includeMetadata {boolean} (optional) Include fill metadata in response (excluded by default for FDX compliance)
   * @returns FinaticResponse with success, error, and warning fields
   * @methodId get_order_fills_api_beta_brokers_data_orders__order_id__fills_get
   * @category brokers
   * @example
   * ```typescript-server
   * // Minimal example with required parameters only
   * const result = await finatic.getOrderFills({ orderId: 'example-id' });
   * 
   * // Access the response data
   * if (result.success) {
   *   console.log('Data:', result.success.data);
   * } else if (result.error) {
   *   console.error('Error:', result.error.message);
   * }
   * ```
   * @example
   * ```typescript-server
   * // Full example with optional parameters
   * const result = await finatic.getOrderFills({ orderId: 'example-id', connectionId: 'example-id', limit: 0, offset: 0 });
   * 
   * // Handle response with warnings
   * if (result.success) {
   *   console.log('Data:', result.success.data);
   *   if (result.warning && result.warning.length > 0) {
   *     console.warn('Warnings:', result.warning);
   *   }
   * } else if (result.error) {
   *   console.error('Error:', result.error.message, result.error.code);
   * }
   * ```
   * @example
   * ```typescript-client
   * // Minimal example with required parameters only
   * const result = await finatic.getOrderFills({ orderId: 'example-id' });
   * 
   * // Access the response data
   * if (result.success) {
   *   console.log('Data:', result.success.data);
   * } else if (result.error) {
   *   console.error('Error:', result.error.message);
   * }
   * ```
   * @example
   * ```python
   * # Minimal example with required parameters only
   * result = await finatic.get_order_fills(
   *            order_id='example'
   * )
   * 
   * # Access the response data
   * if result.success:
   *     print('Data:', result.success['data'])
   * elif result.error:
   *     print('Error:', result.error['message'])
   * ```
   * @example
   * ```python
   * # Full example with optional parameters
   * result = await finatic.get_order_fills(
   *            order_id='example',
            connection_id='example',
            limit='example',
            offset='example'
   * )
   * 
   * # Handle response with warnings
   * if result.success:
   *     print('Data:', result.success['data'])
   *     if result.warning:
   *         print('Warnings:', result.warning)
   * elif result.error:
   *     print('Error:', result.error['message'], result.error['code'])
   * ```
   */
  async getOrderFills(
    params: GetOrderFillsParams
  ): Promise<Awaited<ReturnType<typeof this.brokers.getOrderFills>>> {
    return await this.brokers.getOrderFills(params);
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
   * @param params.orderId {string} Order ID
   * @param params.connectionId {string} (optional) Filter by connection ID
   * @param params.limit {number} (optional) Maximum number of events to return
   * @param params.offset {number} (optional) Number of events to skip for pagination
   * @param params.includeMetadata {boolean} (optional) Include event metadata in response (excluded by default for FDX compliance)
   * @returns FinaticResponse with success, error, and warning fields
   * @methodId get_order_events_api_beta_brokers_data_orders__order_id__events_get
   * @category brokers
   * @example
   * ```typescript-server
   * // Minimal example with required parameters only
   * const result = await finatic.getOrderEvents({ orderId: 'example-id' });
   * 
   * // Access the response data
   * if (result.success) {
   *   console.log('Data:', result.success.data);
   * } else if (result.error) {
   *   console.error('Error:', result.error.message);
   * }
   * ```
   * @example
   * ```typescript-server
   * // Full example with optional parameters
   * const result = await finatic.getOrderEvents({ orderId: 'example-id', connectionId: 'example-id', limit: 0, offset: 0 });
   * 
   * // Handle response with warnings
   * if (result.success) {
   *   console.log('Data:', result.success.data);
   *   if (result.warning && result.warning.length > 0) {
   *     console.warn('Warnings:', result.warning);
   *   }
   * } else if (result.error) {
   *   console.error('Error:', result.error.message, result.error.code);
   * }
   * ```
   * @example
   * ```typescript-client
   * // Minimal example with required parameters only
   * const result = await finatic.getOrderEvents({ orderId: 'example-id' });
   * 
   * // Access the response data
   * if (result.success) {
   *   console.log('Data:', result.success.data);
   * } else if (result.error) {
   *   console.error('Error:', result.error.message);
   * }
   * ```
   * @example
   * ```python
   * # Minimal example with required parameters only
   * result = await finatic.get_order_events(
   *            order_id='example'
   * )
   * 
   * # Access the response data
   * if result.success:
   *     print('Data:', result.success['data'])
   * elif result.error:
   *     print('Error:', result.error['message'])
   * ```
   * @example
   * ```python
   * # Full example with optional parameters
   * result = await finatic.get_order_events(
   *            order_id='example',
            connection_id='example',
            limit='example',
            offset='example'
   * )
   * 
   * # Handle response with warnings
   * if result.success:
   *     print('Data:', result.success['data'])
   *     if result.warning:
   *         print('Warnings:', result.warning)
   * elif result.error:
   *     print('Error:', result.error['message'], result.error['code'])
   * ```
   */
  async getOrderEvents(
    params: GetOrderEventsParams
  ): Promise<Awaited<ReturnType<typeof this.brokers.getOrderEvents>>> {
    return await this.brokers.getOrderEvents(params);
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
   * @param params.brokerId {string} (optional) Filter by broker ID
   * @param params.connectionId {string} (optional) Filter by connection ID
   * @param params.limit {number} (optional) Maximum number of order groups to return
   * @param params.offset {number} (optional) Number of order groups to skip for pagination
   * @param params.createdAfter {string} (optional) Filter order groups created after this timestamp
   * @param params.createdBefore {string} (optional) Filter order groups created before this timestamp
   * @param params.includeMetadata {boolean} (optional) Include group metadata in response (excluded by default for FDX compliance)
   * @returns FinaticResponse with success, error, and warning fields
   * @methodId get_order_groups_api_beta_brokers_data_orders_groups_get
   * @category brokers
   * @example
   * ```typescript-server
   * // Example with no parameters
   * const result = await finatic.getOrderGroups();
   * 
   * // Access the response data
   * if (result.success) {
   *   console.log('Data:', result.success.data);
   * }
   * ```
   * @example
   * ```typescript-server
   * // Full example with optional parameters
   * const result = await finatic.getOrderGroups({ brokerId: 'example-id', connectionId: 'example-id', limit: 0 });
   * 
   * // Handle response with warnings
   * if (result.success) {
   *   console.log('Data:', result.success.data);
   *   if (result.warning && result.warning.length > 0) {
   *     console.warn('Warnings:', result.warning);
   *   }
   * } else if (result.error) {
   *   console.error('Error:', result.error.message, result.error.code);
   * }
   * ```
   * @example
   * ```typescript-client
   * // Example with no parameters
   * const result = await finatic.getOrderGroups();
   * 
   * // Access the response data
   * if (result.success) {
   *   console.log('Data:', result.success.data);
   * }
   * ```
   * @example
   * ```python
   * # Example with no parameters
   * result = await finatic.get_order_groups()
   * 
   * # Access the response data
   * if result.success:
   *     print('Data:', result.success['data'])
   * ```
   * @example
   * ```python
   * # Full example with optional parameters
   * result = await finatic.get_order_groups(
   *            broker_id='example',
            connection_id='example',
            limit='example'
   * )
   * 
   * # Handle response with warnings
   * if result.success:
   *     print('Data:', result.success['data'])
   *     if result.warning:
   *         print('Warnings:', result.warning)
   * elif result.error:
   *     print('Error:', result.error['message'], result.error['code'])
   * ```
   */
  async getOrderGroups(
    params?: GetOrderGroupsParams
  ): Promise<Awaited<ReturnType<typeof this.brokers.getOrderGroups>>> {
    return await this.brokers.getOrderGroups(params);
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
   * @param params.brokerId {string} (optional) Filter by broker ID
   * @param params.connectionId {string} (optional) Filter by connection ID
   * @param params.accountId {string} (optional) Filter by broker provided account ID
   * @param params.symbol {string} (optional) Filter by symbol
   * @param params.positionId {string} (optional) Filter by position ID
   * @param params.limit {number} (optional) Maximum number of position lots to return
   * @param params.offset {number} (optional) Number of position lots to skip for pagination
   * @returns FinaticResponse with success, error, and warning fields
   * @methodId get_position_lots_api_beta_brokers_data_positions_lots_get
   * @category brokers
   * @example
   * ```typescript-server
   * // Example with no parameters
   * const result = await finatic.getPositionLots();
   * 
   * // Access the response data
   * if (result.success) {
   *   console.log('Data:', result.success.data);
   * }
   * ```
   * @example
   * ```typescript-server
   * // Full example with optional parameters
   * const result = await finatic.getPositionLots({ brokerId: 'example-id', connectionId: 'example-id', accountId: 'example-id' });
   * 
   * // Handle response with warnings
   * if (result.success) {
   *   console.log('Data:', result.success.data);
   *   if (result.warning && result.warning.length > 0) {
   *     console.warn('Warnings:', result.warning);
   *   }
   * } else if (result.error) {
   *   console.error('Error:', result.error.message, result.error.code);
   * }
   * ```
   * @example
   * ```typescript-client
   * // Example with no parameters
   * const result = await finatic.getPositionLots();
   * 
   * // Access the response data
   * if (result.success) {
   *   console.log('Data:', result.success.data);
   * }
   * ```
   * @example
   * ```python
   * # Example with no parameters
   * result = await finatic.get_position_lots()
   * 
   * # Access the response data
   * if result.success:
   *     print('Data:', result.success['data'])
   * ```
   * @example
   * ```python
   * # Full example with optional parameters
   * result = await finatic.get_position_lots(
   *            broker_id='example',
            connection_id='example',
            account_id='example'
   * )
   * 
   * # Handle response with warnings
   * if result.success:
   *     print('Data:', result.success['data'])
   *     if result.warning:
   *         print('Warnings:', result.warning)
   * elif result.error:
   *     print('Error:', result.error['message'], result.error['code'])
   * ```
   */
  async getPositionLots(
    params?: GetPositionLotsParams
  ): Promise<Awaited<ReturnType<typeof this.brokers.getPositionLots>>> {
    return await this.brokers.getPositionLots(params);
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
   * @param params.lotId {string} Position lot ID
   * @param params.connectionId {string} (optional) Filter by connection ID
   * @param params.limit {number} (optional) Maximum number of fills to return
   * @param params.offset {number} (optional) Number of fills to skip for pagination
   * @returns FinaticResponse with success, error, and warning fields
   * @methodId get_position_lot_fills_api_beta_brokers_data_positions_lots__lot_id__fills_get
   * @category brokers
   * @example
   * ```typescript-server
   * // Minimal example with required parameters only
   * const result = await finatic.getPositionLotFills({ lotId: 'example-id' });
   * 
   * // Access the response data
   * if (result.success) {
   *   console.log('Data:', result.success.data);
   * } else if (result.error) {
   *   console.error('Error:', result.error.message);
   * }
   * ```
   * @example
   * ```typescript-server
   * // Full example with optional parameters
   * const result = await finatic.getPositionLotFills({ lotId: 'example-id', connectionId: 'example-id', limit: 0, offset: 0 });
   * 
   * // Handle response with warnings
   * if (result.success) {
   *   console.log('Data:', result.success.data);
   *   if (result.warning && result.warning.length > 0) {
   *     console.warn('Warnings:', result.warning);
   *   }
   * } else if (result.error) {
   *   console.error('Error:', result.error.message, result.error.code);
   * }
   * ```
   * @example
   * ```typescript-client
   * // Minimal example with required parameters only
   * const result = await finatic.getPositionLotFills({ lotId: 'example-id' });
   * 
   * // Access the response data
   * if (result.success) {
   *   console.log('Data:', result.success.data);
   * } else if (result.error) {
   *   console.error('Error:', result.error.message);
   * }
   * ```
   * @example
   * ```python
   * # Minimal example with required parameters only
   * result = await finatic.get_position_lot_fills(
   *            lot_id='example'
   * )
   * 
   * # Access the response data
   * if result.success:
   *     print('Data:', result.success['data'])
   * elif result.error:
   *     print('Error:', result.error['message'])
   * ```
   * @example
   * ```python
   * # Full example with optional parameters
   * result = await finatic.get_position_lot_fills(
   *            lot_id='example',
            connection_id='example',
            limit='example',
            offset='example'
   * )
   * 
   * # Handle response with warnings
   * if result.success:
   *     print('Data:', result.success['data'])
   *     if result.warning:
   *         print('Warnings:', result.warning)
   * elif result.error:
   *     print('Error:', result.error['message'], result.error['code'])
   * ```
   */
  async getPositionLotFills(
    params: GetPositionLotFillsParams
  ): Promise<Awaited<ReturnType<typeof this.brokers.getPositionLotFills>>> {
    return await this.brokers.getPositionLotFills(params);
  }

  /**
   * Place Order
   *
   * Place a new order through the specified broker.
   *
   * Creates an order using the broker connection associated with your account.
   * Request uses top-level broker, account_number, and order. The order object
   * includes common fields (symbol, quantity, order type, etc.) shared across
   * brokers plus broker-specific fields—see the broker-specific tabs for details.
   *
   * Convenience method that delegates to brokers wrapper.
   *
   * @param params.broker {string} Broker identifier (robinhood, tasty_trade, ninja_trader)
   * @param params.accountNumber {number} Account number for the order
   * @param params.order.orderType {string} Type of order (market, limit, etc.)
   * @param params.order.assetType {string} Type of asset (equity, equity_option, crypto, forex)
   * @param params.order.action {string} Order action (buy, sell)
   * @param params.order.timeInForce {string} Time in force for the order
   * @param params.order.symbol {string} Trading symbol
   * @param params.order.orderQty {number} Order quantity
   * @param params.connectionId {string} (optional) Temporary bypass for testing: specify connection ID directly
   * @returns FinaticResponse with success, error, and warning fields
   * @methodId place_order_api_beta_brokers_orders_post
   * @category brokers
   * @example
   * ```typescript-server
   * // Example with no parameters
   * const result = await finatic.placeOrder();
   *
   * // Access the response data
   * if (result.success) {
   *   console.log('Data:', result.success.data);
   * }
   * ```
   * @example
   * ```typescript-server
   * // Full example with optional parameters
   * const result = await finatic.placeOrder({ connectionId: 'example-id' });
   *
   * // Handle response with warnings
   * if (result.success) {
   *   console.log('Data:', result.success.data);
   *   if (result.warning && result.warning.length > 0) {
   *     console.warn('Warnings:', result.warning);
   *   }
   * } else if (result.error) {
   *   console.error('Error:', result.error.message, result.error.code);
   * }
   * ```
   * @example
   * ```typescript-client
   * // Example with no parameters
   * const result = await finatic.placeOrder();
   *
   * // Access the response data
   * if (result.success) {
   *   console.log('Data:', result.success.data);
   * }
   * ```
   * @example
   * ```python
   * # Example with no parameters
   * result = await finatic.place_order()
   *
   * # Access the response data
   * if result.success:
   *     print('Data:', result.success['data'])
   * ```
   * @example
   * ```python
   * # Full example with optional parameters
   * result = await finatic.place_order(
   *            connection_id='example'
   * )
   *
   * # Handle response with warnings
   * if result.success:
   *     print('Data:', result.success['data'])
   *     if result.warning:
   *         print('Warnings:', result.warning)
   * elif result.error:
   *     print('Error:', result.error['message'], result.error['code'])
   * ```
   */
  async placeOrder(
    params: PlaceOrderParams
  ): Promise<Awaited<ReturnType<typeof this.brokers.placeOrder>>> {
    return await this.brokers.placeOrder(params);
  }

  /**
   * Cancel Order
   *
   * Cancel an existing order.
   *
   * Request must include broker and account_number in the body; order_id is in the path.
   * Connection is resolved by broker and account_number.
   *
   * Convenience method that delegates to brokers wrapper.
   *
   * @param params.orderId {string} Broker-provided order ID to cancel
   * @param params.broker {string} Broker identifier (robinhood, tasty_trade, ninja_trader)
   * @param params.accountNumber {number} Account number for the order
   * @returns FinaticResponse with success, error, and warning fields
   * @methodId cancel_order_api_beta_brokers_orders__order_id__delete
   * @category brokers
   * @example
   * ```typescript-server
   * // Minimal example with required parameters only
   * const result = await finatic.cancelOrder({ orderId: 'example-id' });
   *
   * // Access the response data
   * if (result.success) {
   *   console.log('Data:', result.success.data);
   * } else if (result.error) {
   *   console.error('Error:', result.error.message);
   * }
   * ```
   * @example
   * ```typescript-client
   * // Minimal example with required parameters only
   * const result = await finatic.cancelOrder({ orderId: 'example-id' });
   *
   * // Access the response data
   * if (result.success) {
   *   console.log('Data:', result.success.data);
   * } else if (result.error) {
   *   console.error('Error:', result.error.message);
   * }
   * ```
   * @example
   * ```python
   * # Minimal example with required parameters only
   * result = await finatic.cancel_order(
   *            order_id='example'
   * )
   *
   * # Access the response data
   * if result.success:
   *     print('Data:', result.success['data'])
   * elif result.error:
   *     print('Error:', result.error['message'])
   * ```
   */
  async cancelOrder(
    params: CancelOrderParams
  ): Promise<Awaited<ReturnType<typeof this.brokers.cancelOrder>>> {
    return await this.brokers.cancelOrder(params);
  }

  /**
   * Modify Order
   * 
   * Modify an existing order.
   * 
   * Request must include broker and account_number in the body; order_id is in the path.
   * Connection is resolved by broker and account_number. The order object is a partial update.
   * 
   * Convenience method that delegates to brokers wrapper.
   * 
   * @param params.orderId {string} Broker-provided order ID to modify
   * @param params.broker {string} Broker identifier (robinhood, tasty_trade, ninja_trader)
   * @param params.accountNumber {number} Account number for the order
   * @param params.order.orderQty {number} (optional) Order quantity (optional)
   * @param params.order.price {number} (optional) Limit price (optional)
   * @param params.order.stopPrice {number} (optional) Stop price (optional)
   * @param params.order.time_in_force {string} (optional) Time in force (optional)
   * @param params.order.orderType {string} (optional) Order type (optional)
   * @param params.order.assetType {string} (optional) Asset type (optional)
   * @param params.order.expireTime {string} (optional) Expire time ISO 8601 (optional)
   * @param params.connectionId {string} (optional) Temporary bypass for testing: specify connection ID directly
   * @returns FinaticResponse with success, error, and warning fields
   * @methodId modify_order_api_beta_brokers_orders__order_id__patch
   * @category brokers
   * @example
   * ```typescript-server
   * // Minimal example with required parameters only
   * const result = await finatic.modifyOrder({ orderId: 'example-id' });
   * 
   * // Access the response data
   * if (result.success) {
   *   console.log('Data:', result.success.data);
   * } else if (result.error) {
   *   console.error('Error:', result.error.message);
   * }
   * ```
   * @example
   * ```typescript-server
   * // Full example with optional parameters
   * const result = await finatic.modifyOrder({ orderId: 'example-id', connectionId: 'example-id' });
   * 
   * // Handle response with warnings
   * if (result.success) {
   *   console.log('Data:', result.success.data);
   *   if (result.warning && result.warning.length > 0) {
   *     console.warn('Warnings:', result.warning);
   *   }
   * } else if (result.error) {
   *   console.error('Error:', result.error.message, result.error.code);
   * }
   * ```
   * @example
   * ```typescript-client
   * // Minimal example with required parameters only
   * const result = await finatic.modifyOrder({ orderId: 'example-id' });
   * 
   * // Access the response data
   * if (result.success) {
   *   console.log('Data:', result.success.data);
   * } else if (result.error) {
   *   console.error('Error:', result.error.message);
   * }
   * ```
   * @example
   * ```python
   * # Minimal example with required parameters only
   * result = await finatic.modify_order(
   *            order_id='example'
   * )
   * 
   * # Access the response data
   * if result.success:
   *     print('Data:', result.success['data'])
   * elif result.error:
   *     print('Error:', result.error['message'])
   * ```
   * @example
   * ```python
   * # Full example with optional parameters
   * result = await finatic.modify_order(
   *            order_id='example',
            connection_id='example'
   * )
   * 
   * # Handle response with warnings
   * if result.success:
   *     print('Data:', result.success['data'])
   *     if result.warning:
   *         print('Warnings:', result.warning)
   * elif result.error:
   *     print('Error:', result.error['message'], result.error['code'])
   * ```
   */
  async modifyOrder(
    params: ModifyOrderParams
  ): Promise<Awaited<ReturnType<typeof this.brokers.modifyOrder>>> {
    return await this.brokers.modifyOrder(params);
  }

  /**
   * Get all Balances across all pages.
   * Auto-generated from paginated endpoint.
   * 
   * This method automatically paginates through all pages and returns all items in a single response.
   * It uses the underlying getBalances method with internal pagination handling.
   * 
   * @param params - Optional parameters object. Only include the fields you want to filter by.
   *                 Example: getAllBalances({ accountId: "123", symbol: "AAPL" })
   * @returns FinaticResponse with success, error, and warning fields containing array of all items
   * @methodId get_all_balances_api_beta_brokers_data_balances_get
   * @category brokers
   * @example
   * ```typescript-server
   * // Get all items with optional filters
   * const result = await finatic.getAllBalances({ brokerId: 'example-id', connectionId: 'example-id', accountId: 'example-id' });
   * 
   * // Access the response data
   * if (result.success) {
   *   console.log('Total items:', result.success.data.length);
   *   if (result.warning && result.warning.length > 0) {
   *     console.warn('Warnings:', result.warning);
   *   }
   * } else if (result.error) {
   *   console.error('Error:', result.error.message);
   * }
   * ```
   * @example
   * ```typescript-client
   * // Get all items with optional filters
   * const result = await finatic.getAllBalances({ brokerId: 'example-id', connectionId: 'example-id', accountId: 'example-id' });
   * 
   * // Access the response data
   * if (result.success) {
   *   console.log('Total items:', result.success.data.length);
   *   if (result.warning && result.warning.length > 0) {
   *     console.warn('Warnings:', result.warning);
   *   }
   * } else if (result.error) {
   *   console.error('Error:', result.error.message);
   * }
   * ```
   * @example
   * ```python
   * # Get all items with optional filters
   * result = await finatic.get_all_balances(
   *            broker_id='example',
            connection_id='example',
            account_id='example'
   * )
   * 
   * # Access the response data
   * if result.success:
   *     print('Total items:', len(result.success['data']))
   *     if result.warning:
   *         print('Warnings:', result.warning)
   * elif result.error:
   *     print('Error:', result.error['message'])
   * ```
   */
  async getAllBalances(
    params?: Partial<GetBalancesParams>
  ): Promise<FinaticResponse<LegacyBrokerBalance[]>> {
    // Use provided params or empty object (excluding limit and offset which are handled internally)
    const filterParams: GetBalancesParams = (params || {}) as GetBalancesParams;
    const allData: LegacyBrokerBalance[] = [];
    let offset = 0;
    const limit = 1000;
    let lastError: { [key: string]: any } | null = null;
    let warnings: Array<{ [key: string]: any }> = [];

    while (true) {
      const response = await this.brokers.getBalances({ ...filterParams, limit, offset });

      // Collect warnings from each page
      if (response.warning && Array.isArray(response.warning)) {
        warnings.push(...response.warning);
      }

      if (response.error) {
        lastError = response.error;
        break;
      }

      const result = response.success?.data || [];
      // Extract items from PaginatedData if it's a PaginatedData object, otherwise use as-is
      // PaginatedData has array-like behavior but we extract items for getAll* methods
      const items =
        result && typeof result === 'object' && 'items' in result && Array.isArray(result.items)
          ? result.items
          : Array.isArray(result)
            ? result
            : [result];

      if (!items || items.length === 0) break;
      allData.push(...items);
      // If we got fewer items than the limit, there are no more pages
      if (items.length < limit) break;
      offset += limit;
    }

    // Return FinaticResponse with accumulated data
    // When error occurs, return error response (success may be omitted or null)
    if (lastError) {
      return {
        success: {
          data: [] as LegacyBrokerBalance[],
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
   * This method automatically paginates through all pages and returns all items in a single response.
   * It uses the underlying getAccounts method with internal pagination handling.
   * 
   * @param params - Optional parameters object. Only include the fields you want to filter by.
   *                 Example: getAllAccounts({ accountId: "123", symbol: "AAPL" })
   * @returns FinaticResponse with success, error, and warning fields containing array of all items
   * @methodId get_all_accounts_api_beta_brokers_data_accounts_get
   * @category brokers
   * @example
   * ```typescript-server
   * // Get all items with optional filters
   * const result = await finatic.getAllAccounts({ brokerId: 'example-id', connectionId: 'example-id', accountType: 'margin' });
   * 
   * // Access the response data
   * if (result.success) {
   *   console.log('Total items:', result.success.data.length);
   *   if (result.warning && result.warning.length > 0) {
   *     console.warn('Warnings:', result.warning);
   *   }
   * } else if (result.error) {
   *   console.error('Error:', result.error.message);
   * }
   * ```
   * @example
   * ```typescript-client
   * // Get all items with optional filters
   * const result = await finatic.getAllAccounts({ brokerId: 'example-id', connectionId: 'example-id', accountType: 'margin' });
   * 
   * // Access the response data
   * if (result.success) {
   *   console.log('Total items:', result.success.data.length);
   *   if (result.warning && result.warning.length > 0) {
   *     console.warn('Warnings:', result.warning);
   *   }
   * } else if (result.error) {
   *   console.error('Error:', result.error.message);
   * }
   * ```
   * @example
   * ```python
   * # Get all items with optional filters
   * result = await finatic.get_all_accounts(
   *            broker_id='example',
            connection_id='example',
            account_type='margin'
   * )
   * 
   * # Access the response data
   * if result.success:
   *     print('Total items:', len(result.success['data']))
   *     if result.warning:
   *         print('Warnings:', result.warning)
   * elif result.error:
   *     print('Error:', result.error['message'])
   * ```
   */
  async getAllAccounts(
    params?: Partial<GetAccountsParams>
  ): Promise<FinaticResponse<LegacyBrokerAccount[]>> {
    // Use provided params or empty object (excluding limit and offset which are handled internally)
    const filterParams: GetAccountsParams = (params || {}) as GetAccountsParams;
    const allData: LegacyBrokerAccount[] = [];
    let offset = 0;
    const limit = 1000;
    let lastError: { [key: string]: any } | null = null;
    let warnings: Array<{ [key: string]: any }> = [];

    while (true) {
      const response = await this.brokers.getAccounts({ ...filterParams, limit, offset });

      // Collect warnings from each page
      if (response.warning && Array.isArray(response.warning)) {
        warnings.push(...response.warning);
      }

      if (response.error) {
        lastError = response.error;
        break;
      }

      const result = response.success?.data || [];
      // Extract items from PaginatedData if it's a PaginatedData object, otherwise use as-is
      // PaginatedData has array-like behavior but we extract items for getAll* methods
      const items =
        result && typeof result === 'object' && 'items' in result && Array.isArray(result.items)
          ? result.items
          : Array.isArray(result)
            ? result
            : [result];

      if (!items || items.length === 0) break;
      allData.push(...items);
      // If we got fewer items than the limit, there are no more pages
      if (items.length < limit) break;
      offset += limit;
    }

    // Return FinaticResponse with accumulated data
    // When error occurs, return error response (success may be omitted or null)
    if (lastError) {
      return {
        success: {
          data: [] as LegacyBrokerAccount[],
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
   * Get all Orders across all pages.
   * Auto-generated from paginated endpoint.
   * 
   * This method automatically paginates through all pages and returns all items in a single response.
   * It uses the underlying getOrders method with internal pagination handling.
   * 
   * @param params - Optional parameters object. Only include the fields you want to filter by.
   *                 Example: getAllOrders({ accountId: "123", symbol: "AAPL" })
   * @returns FinaticResponse with success, error, and warning fields containing array of all items
   * @methodId get_all_orders_api_beta_brokers_data_orders_get
   * @category brokers
   * @example
   * ```typescript-server
   * // Get all items with optional filters
   * const result = await finatic.getAllOrders({ brokerId: 'example-id', connectionId: 'example-id', accountId: 'example-id' });
   * 
   * // Access the response data
   * if (result.success) {
   *   console.log('Total items:', result.success.data.length);
   *   if (result.warning && result.warning.length > 0) {
   *     console.warn('Warnings:', result.warning);
   *   }
   * } else if (result.error) {
   *   console.error('Error:', result.error.message);
   * }
   * ```
   * @example
   * ```typescript-client
   * // Get all items with optional filters
   * const result = await finatic.getAllOrders({ brokerId: 'example-id', connectionId: 'example-id', accountId: 'example-id' });
   * 
   * // Access the response data
   * if (result.success) {
   *   console.log('Total items:', result.success.data.length);
   *   if (result.warning && result.warning.length > 0) {
   *     console.warn('Warnings:', result.warning);
   *   }
   * } else if (result.error) {
   *   console.error('Error:', result.error.message);
   * }
   * ```
   * @example
   * ```python
   * # Get all items with optional filters
   * result = await finatic.get_all_orders(
   *            broker_id='example',
            connection_id='example',
            account_id='example'
   * )
   * 
   * # Access the response data
   * if result.success:
   *     print('Total items:', len(result.success['data']))
   *     if result.warning:
   *         print('Warnings:', result.warning)
   * elif result.error:
   *     print('Error:', result.error['message'])
   * ```
   */
  async getAllOrders(
    params?: Partial<GetOrdersParams>
  ): Promise<FinaticResponse<FDXBrokerOrder[]>> {
    // Use provided params or empty object (excluding limit and offset which are handled internally)
    const filterParams: GetOrdersParams = (params || {}) as GetOrdersParams;
    const allData: FDXBrokerOrder[] = [];
    let offset = 0;
    const limit = 1000;
    let lastError: { [key: string]: any } | null = null;
    let warnings: Array<{ [key: string]: any }> = [];

    while (true) {
      const response = await this.brokers.getOrders({ ...filterParams, limit, offset });

      // Collect warnings from each page
      if (response.warning && Array.isArray(response.warning)) {
        warnings.push(...response.warning);
      }

      if (response.error) {
        lastError = response.error;
        break;
      }

      const result = response.success?.data || [];
      // Extract items from PaginatedData if it's a PaginatedData object, otherwise use as-is
      // PaginatedData has array-like behavior but we extract items for getAll* methods
      const items =
        result && typeof result === 'object' && 'items' in result && Array.isArray(result.items)
          ? result.items
          : Array.isArray(result)
            ? result
            : [result];

      if (!items || items.length === 0) break;
      allData.push(...items);
      // If we got fewer items than the limit, there are no more pages
      if (items.length < limit) break;
      offset += limit;
    }

    // Return FinaticResponse with accumulated data
    // When error occurs, return error response (success may be omitted or null)
    if (lastError) {
      return {
        success: {
          data: [] as FDXBrokerOrder[],
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
   * This method automatically paginates through all pages and returns all items in a single response.
   * It uses the underlying getPositions method with internal pagination handling.
   * 
   * @param params - Optional parameters object. Only include the fields you want to filter by.
   *                 Example: getAllPositions({ accountId: "123", symbol: "AAPL" })
   * @returns FinaticResponse with success, error, and warning fields containing array of all items
   * @methodId get_all_positions_api_beta_brokers_data_positions_get
   * @category brokers
   * @example
   * ```typescript-server
   * // Get all items with optional filters
   * const result = await finatic.getAllPositions({ brokerId: 'example-id', connectionId: 'example-id', accountId: 'example-id' });
   * 
   * // Access the response data
   * if (result.success) {
   *   console.log('Total items:', result.success.data.length);
   *   if (result.warning && result.warning.length > 0) {
   *     console.warn('Warnings:', result.warning);
   *   }
   * } else if (result.error) {
   *   console.error('Error:', result.error.message);
   * }
   * ```
   * @example
   * ```typescript-client
   * // Get all items with optional filters
   * const result = await finatic.getAllPositions({ brokerId: 'example-id', connectionId: 'example-id', accountId: 'example-id' });
   * 
   * // Access the response data
   * if (result.success) {
   *   console.log('Total items:', result.success.data.length);
   *   if (result.warning && result.warning.length > 0) {
   *     console.warn('Warnings:', result.warning);
   *   }
   * } else if (result.error) {
   *   console.error('Error:', result.error.message);
   * }
   * ```
   * @example
   * ```python
   * # Get all items with optional filters
   * result = await finatic.get_all_positions(
   *            broker_id='example',
            connection_id='example',
            account_id='example'
   * )
   * 
   * # Access the response data
   * if result.success:
   *     print('Total items:', len(result.success['data']))
   *     if result.warning:
   *         print('Warnings:', result.warning)
   * elif result.error:
   *     print('Error:', result.error['message'])
   * ```
   */
  async getAllPositions(
    params?: Partial<GetPositionsParams>
  ): Promise<FinaticResponse<FDXBrokerPosition[]>> {
    // Use provided params or empty object (excluding limit and offset which are handled internally)
    const filterParams: GetPositionsParams = (params || {}) as GetPositionsParams;
    const allData: FDXBrokerPosition[] = [];
    let offset = 0;
    const limit = 1000;
    let lastError: { [key: string]: any } | null = null;
    let warnings: Array<{ [key: string]: any }> = [];

    while (true) {
      const response = await this.brokers.getPositions({ ...filterParams, limit, offset });

      // Collect warnings from each page
      if (response.warning && Array.isArray(response.warning)) {
        warnings.push(...response.warning);
      }

      if (response.error) {
        lastError = response.error;
        break;
      }

      const result = response.success?.data || [];
      // Extract items from PaginatedData if it's a PaginatedData object, otherwise use as-is
      // PaginatedData has array-like behavior but we extract items for getAll* methods
      const items =
        result && typeof result === 'object' && 'items' in result && Array.isArray(result.items)
          ? result.items
          : Array.isArray(result)
            ? result
            : [result];

      if (!items || items.length === 0) break;
      allData.push(...items);
      // If we got fewer items than the limit, there are no more pages
      if (items.length < limit) break;
      offset += limit;
    }

    // Return FinaticResponse with accumulated data
    // When error occurs, return error response (success may be omitted or null)
    if (lastError) {
      return {
        success: {
          data: [] as FDXBrokerPosition[],
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
   * Get all Transactions across all pages.
   * Auto-generated from paginated endpoint.
   * 
   * This method automatically paginates through all pages and returns all items in a single response.
   * It uses the underlying getTransactions method with internal pagination handling.
   * 
   * @param params - Optional parameters object. Only include the fields you want to filter by.
   *                 Example: getAllTransactions({ accountId: "123", symbol: "AAPL" })
   * @returns FinaticResponse with success, error, and warning fields containing array of all items
   * @methodId get_all_transactions_api_beta_brokers_data_transactions_get
   * @category brokers
   * @example
   * ```typescript-server
   * // Get all items with optional filters
   * const result = await finatic.getAllTransactions({ brokerId: 'example-id', connectionId: 'example-id', accountId: 'example-id' });
   * 
   * // Access the response data
   * if (result.success) {
   *   console.log('Total items:', result.success.data.length);
   *   if (result.warning && result.warning.length > 0) {
   *     console.warn('Warnings:', result.warning);
   *   }
   * } else if (result.error) {
   *   console.error('Error:', result.error.message);
   * }
   * ```
   * @example
   * ```typescript-client
   * // Get all items with optional filters
   * const result = await finatic.getAllTransactions({ brokerId: 'example-id', connectionId: 'example-id', accountId: 'example-id' });
   * 
   * // Access the response data
   * if (result.success) {
   *   console.log('Total items:', result.success.data.length);
   *   if (result.warning && result.warning.length > 0) {
   *     console.warn('Warnings:', result.warning);
   *   }
   * } else if (result.error) {
   *   console.error('Error:', result.error.message);
   * }
   * ```
   * @example
   * ```python
   * # Get all items with optional filters
   * result = await finatic.get_all_transactions(
   *            broker_id='example',
            connection_id='example',
            account_id='example'
   * )
   * 
   * # Access the response data
   * if result.success:
   *     print('Total items:', len(result.success['data']))
   *     if result.warning:
   *         print('Warnings:', result.warning)
   * elif result.error:
   *     print('Error:', result.error['message'])
   * ```
   */
  async getAllTransactions(
    params?: Partial<GetTransactionsParams>
  ): Promise<FinaticResponse<FDXBrokerTransaction[]>> {
    // Use provided params or empty object (excluding limit and offset which are handled internally)
    const filterParams: GetTransactionsParams = (params || {}) as GetTransactionsParams;
    const allData: FDXBrokerTransaction[] = [];
    let offset = 0;
    const limit = 1000;
    let lastError: { [key: string]: any } | null = null;
    let warnings: Array<{ [key: string]: any }> = [];

    while (true) {
      const response = await this.brokers.getTransactions({ ...filterParams, limit, offset });

      // Collect warnings from each page
      if (response.warning && Array.isArray(response.warning)) {
        warnings.push(...response.warning);
      }

      if (response.error) {
        lastError = response.error;
        break;
      }

      const result = response.success?.data || [];
      // Extract items from PaginatedData if it's a PaginatedData object, otherwise use as-is
      // PaginatedData has array-like behavior but we extract items for getAll* methods
      const items =
        result && typeof result === 'object' && 'items' in result && Array.isArray(result.items)
          ? result.items
          : Array.isArray(result)
            ? result
            : [result];

      if (!items || items.length === 0) break;
      allData.push(...items);
      // If we got fewer items than the limit, there are no more pages
      if (items.length < limit) break;
      offset += limit;
    }

    // Return FinaticResponse with accumulated data
    // When error occurs, return error response (success may be omitted or null)
    if (lastError) {
      return {
        success: {
          data: [] as FDXBrokerTransaction[],
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
   * This method automatically paginates through all pages and returns all items in a single response.
   * It uses the underlying getOrderFills method with internal pagination handling.
   * 
   * @param params - Optional parameters object. Only include the fields you want to filter by.
   *                 Example: getAllOrderFills({ accountId: "123", symbol: "AAPL" })
   * @returns FinaticResponse with success, error, and warning fields containing array of all items
   * @methodId get_all_order_fills_api_beta_brokers_data_orders__order_id__fills_get
   * @category brokers
   * @example
   * ```typescript-server
   * // Get all items with optional filters
   * const result = await finatic.getAllOrderFills({ connectionId: 'example-id', includeMetadata: true });
   * 
   * // Access the response data
   * if (result.success) {
   *   console.log('Total items:', result.success.data.length);
   *   if (result.warning && result.warning.length > 0) {
   *     console.warn('Warnings:', result.warning);
   *   }
   * } else if (result.error) {
   *   console.error('Error:', result.error.message);
   * }
   * ```
   * @example
   * ```typescript-client
   * // Get all items with optional filters
   * const result = await finatic.getAllOrderFills({ connectionId: 'example-id', includeMetadata: true });
   * 
   * // Access the response data
   * if (result.success) {
   *   console.log('Total items:', result.success.data.length);
   *   if (result.warning && result.warning.length > 0) {
   *     console.warn('Warnings:', result.warning);
   *   }
   * } else if (result.error) {
   *   console.error('Error:', result.error.message);
   * }
   * ```
   * @example
   * ```python
   * # Get all items with optional filters
   * result = await finatic.get_all_order_fills(
   *            connection_id='example',
            include_metadata='example'
   * )
   * 
   * # Access the response data
   * if result.success:
   *     print('Total items:', len(result.success['data']))
   *     if result.warning:
   *         print('Warnings:', result.warning)
   * elif result.error:
   *     print('Error:', result.error['message'])
   * ```
   */
  async getAllOrderFills(
    params?: Partial<GetOrderFillsParams>
  ): Promise<FinaticResponse<FDXBrokerOrderFill[]>> {
    // Use provided params or empty object (excluding limit and offset which are handled internally)
    const filterParams: GetOrderFillsParams = (params || {}) as GetOrderFillsParams;
    const allData: FDXBrokerOrderFill[] = [];
    let offset = 0;
    const limit = 1000;
    let lastError: { [key: string]: any } | null = null;
    let warnings: Array<{ [key: string]: any }> = [];

    while (true) {
      const response = await this.brokers.getOrderFills({ ...filterParams, limit, offset });

      // Collect warnings from each page
      if (response.warning && Array.isArray(response.warning)) {
        warnings.push(...response.warning);
      }

      if (response.error) {
        lastError = response.error;
        break;
      }

      const result = response.success?.data || [];
      // Extract items from PaginatedData if it's a PaginatedData object, otherwise use as-is
      // PaginatedData has array-like behavior but we extract items for getAll* methods
      const items =
        result && typeof result === 'object' && 'items' in result && Array.isArray(result.items)
          ? result.items
          : Array.isArray(result)
            ? result
            : [result];

      if (!items || items.length === 0) break;
      allData.push(...items);
      // If we got fewer items than the limit, there are no more pages
      if (items.length < limit) break;
      offset += limit;
    }

    // Return FinaticResponse with accumulated data
    // When error occurs, return error response (success may be omitted or null)
    if (lastError) {
      return {
        success: {
          data: [] as FDXBrokerOrderFill[],
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
   * This method automatically paginates through all pages and returns all items in a single response.
   * It uses the underlying getOrderEvents method with internal pagination handling.
   * 
   * @param params - Optional parameters object. Only include the fields you want to filter by.
   *                 Example: getAllOrderEvents({ accountId: "123", symbol: "AAPL" })
   * @returns FinaticResponse with success, error, and warning fields containing array of all items
   * @methodId get_all_order_events_api_beta_brokers_data_orders__order_id__events_get
   * @category brokers
   * @example
   * ```typescript-server
   * // Get all items with optional filters
   * const result = await finatic.getAllOrderEvents({ connectionId: 'example-id', includeMetadata: true });
   * 
   * // Access the response data
   * if (result.success) {
   *   console.log('Total items:', result.success.data.length);
   *   if (result.warning && result.warning.length > 0) {
   *     console.warn('Warnings:', result.warning);
   *   }
   * } else if (result.error) {
   *   console.error('Error:', result.error.message);
   * }
   * ```
   * @example
   * ```typescript-client
   * // Get all items with optional filters
   * const result = await finatic.getAllOrderEvents({ connectionId: 'example-id', includeMetadata: true });
   * 
   * // Access the response data
   * if (result.success) {
   *   console.log('Total items:', result.success.data.length);
   *   if (result.warning && result.warning.length > 0) {
   *     console.warn('Warnings:', result.warning);
   *   }
   * } else if (result.error) {
   *   console.error('Error:', result.error.message);
   * }
   * ```
   * @example
   * ```python
   * # Get all items with optional filters
   * result = await finatic.get_all_order_events(
   *            connection_id='example',
            include_metadata='example'
   * )
   * 
   * # Access the response data
   * if result.success:
   *     print('Total items:', len(result.success['data']))
   *     if result.warning:
   *         print('Warnings:', result.warning)
   * elif result.error:
   *     print('Error:', result.error['message'])
   * ```
   */
  async getAllOrderEvents(
    params?: Partial<GetOrderEventsParams>
  ): Promise<FinaticResponse<FDXBrokerOrderEvent[]>> {
    // Use provided params or empty object (excluding limit and offset which are handled internally)
    const filterParams: GetOrderEventsParams = (params || {}) as GetOrderEventsParams;
    const allData: FDXBrokerOrderEvent[] = [];
    let offset = 0;
    const limit = 1000;
    let lastError: { [key: string]: any } | null = null;
    let warnings: Array<{ [key: string]: any }> = [];

    while (true) {
      const response = await this.brokers.getOrderEvents({ ...filterParams, limit, offset });

      // Collect warnings from each page
      if (response.warning && Array.isArray(response.warning)) {
        warnings.push(...response.warning);
      }

      if (response.error) {
        lastError = response.error;
        break;
      }

      const result = response.success?.data || [];
      // Extract items from PaginatedData if it's a PaginatedData object, otherwise use as-is
      // PaginatedData has array-like behavior but we extract items for getAll* methods
      const items =
        result && typeof result === 'object' && 'items' in result && Array.isArray(result.items)
          ? result.items
          : Array.isArray(result)
            ? result
            : [result];

      if (!items || items.length === 0) break;
      allData.push(...items);
      // If we got fewer items than the limit, there are no more pages
      if (items.length < limit) break;
      offset += limit;
    }

    // Return FinaticResponse with accumulated data
    // When error occurs, return error response (success may be omitted or null)
    if (lastError) {
      return {
        success: {
          data: [] as FDXBrokerOrderEvent[],
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
   * This method automatically paginates through all pages and returns all items in a single response.
   * It uses the underlying getOrderGroups method with internal pagination handling.
   * 
   * @param params - Optional parameters object. Only include the fields you want to filter by.
   *                 Example: getAllOrderGroups({ accountId: "123", symbol: "AAPL" })
   * @returns FinaticResponse with success, error, and warning fields containing array of all items
   * @methodId get_all_order_groups_api_beta_brokers_data_orders_groups_get
   * @category brokers
   * @example
   * ```typescript-server
   * // Get all items with optional filters
   * const result = await finatic.getAllOrderGroups({ brokerId: 'example-id', connectionId: 'example-id', createdAfter: 'example' });
   * 
   * // Access the response data
   * if (result.success) {
   *   console.log('Total items:', result.success.data.length);
   *   if (result.warning && result.warning.length > 0) {
   *     console.warn('Warnings:', result.warning);
   *   }
   * } else if (result.error) {
   *   console.error('Error:', result.error.message);
   * }
   * ```
   * @example
   * ```typescript-client
   * // Get all items with optional filters
   * const result = await finatic.getAllOrderGroups({ brokerId: 'example-id', connectionId: 'example-id', createdAfter: 'example' });
   * 
   * // Access the response data
   * if (result.success) {
   *   console.log('Total items:', result.success.data.length);
   *   if (result.warning && result.warning.length > 0) {
   *     console.warn('Warnings:', result.warning);
   *   }
   * } else if (result.error) {
   *   console.error('Error:', result.error.message);
   * }
   * ```
   * @example
   * ```python
   * # Get all items with optional filters
   * result = await finatic.get_all_order_groups(
   *            broker_id='example',
            connection_id='example',
            created_after='example'
   * )
   * 
   * # Access the response data
   * if result.success:
   *     print('Total items:', len(result.success['data']))
   *     if result.warning:
   *         print('Warnings:', result.warning)
   * elif result.error:
   *     print('Error:', result.error['message'])
   * ```
   */
  async getAllOrderGroups(
    params?: Partial<GetOrderGroupsParams>
  ): Promise<FinaticResponse<FDXBrokerOrderGroup[]>> {
    // Use provided params or empty object (excluding limit and offset which are handled internally)
    const filterParams: GetOrderGroupsParams = (params || {}) as GetOrderGroupsParams;
    const allData: FDXBrokerOrderGroup[] = [];
    let offset = 0;
    const limit = 1000;
    let lastError: { [key: string]: any } | null = null;
    let warnings: Array<{ [key: string]: any }> = [];

    while (true) {
      const response = await this.brokers.getOrderGroups({ ...filterParams, limit, offset });

      // Collect warnings from each page
      if (response.warning && Array.isArray(response.warning)) {
        warnings.push(...response.warning);
      }

      if (response.error) {
        lastError = response.error;
        break;
      }

      const result = response.success?.data || [];
      // Extract items from PaginatedData if it's a PaginatedData object, otherwise use as-is
      // PaginatedData has array-like behavior but we extract items for getAll* methods
      const items =
        result && typeof result === 'object' && 'items' in result && Array.isArray(result.items)
          ? result.items
          : Array.isArray(result)
            ? result
            : [result];

      if (!items || items.length === 0) break;
      allData.push(...items);
      // If we got fewer items than the limit, there are no more pages
      if (items.length < limit) break;
      offset += limit;
    }

    // Return FinaticResponse with accumulated data
    // When error occurs, return error response (success may be omitted or null)
    if (lastError) {
      return {
        success: {
          data: [] as FDXBrokerOrderGroup[],
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
   * This method automatically paginates through all pages and returns all items in a single response.
   * It uses the underlying getPositionLots method with internal pagination handling.
   * 
   * @param params - Optional parameters object. Only include the fields you want to filter by.
   *                 Example: getAllPositionLots({ accountId: "123", symbol: "AAPL" })
   * @returns FinaticResponse with success, error, and warning fields containing array of all items
   * @methodId get_all_position_lots_api_beta_brokers_data_positions_lots_get
   * @category brokers
   * @example
   * ```typescript-server
   * // Get all items with optional filters
   * const result = await finatic.getAllPositionLots({ brokerId: 'example-id', connectionId: 'example-id', accountId: 'example-id' });
   * 
   * // Access the response data
   * if (result.success) {
   *   console.log('Total items:', result.success.data.length);
   *   if (result.warning && result.warning.length > 0) {
   *     console.warn('Warnings:', result.warning);
   *   }
   * } else if (result.error) {
   *   console.error('Error:', result.error.message);
   * }
   * ```
   * @example
   * ```typescript-client
   * // Get all items with optional filters
   * const result = await finatic.getAllPositionLots({ brokerId: 'example-id', connectionId: 'example-id', accountId: 'example-id' });
   * 
   * // Access the response data
   * if (result.success) {
   *   console.log('Total items:', result.success.data.length);
   *   if (result.warning && result.warning.length > 0) {
   *     console.warn('Warnings:', result.warning);
   *   }
   * } else if (result.error) {
   *   console.error('Error:', result.error.message);
   * }
   * ```
   * @example
   * ```python
   * # Get all items with optional filters
   * result = await finatic.get_all_position_lots(
   *            broker_id='example',
            connection_id='example',
            account_id='example'
   * )
   * 
   * # Access the response data
   * if result.success:
   *     print('Total items:', len(result.success['data']))
   *     if result.warning:
   *         print('Warnings:', result.warning)
   * elif result.error:
   *     print('Error:', result.error['message'])
   * ```
   */
  async getAllPositionLots(
    params?: Partial<GetPositionLotsParams>
  ): Promise<FinaticResponse<FDXBrokerPositionLot[]>> {
    // Use provided params or empty object (excluding limit and offset which are handled internally)
    const filterParams: GetPositionLotsParams = (params || {}) as GetPositionLotsParams;
    const allData: FDXBrokerPositionLot[] = [];
    let offset = 0;
    const limit = 1000;
    let lastError: { [key: string]: any } | null = null;
    let warnings: Array<{ [key: string]: any }> = [];

    while (true) {
      const response = await this.brokers.getPositionLots({ ...filterParams, limit, offset });

      // Collect warnings from each page
      if (response.warning && Array.isArray(response.warning)) {
        warnings.push(...response.warning);
      }

      if (response.error) {
        lastError = response.error;
        break;
      }

      const result = response.success?.data || [];
      // Extract items from PaginatedData if it's a PaginatedData object, otherwise use as-is
      // PaginatedData has array-like behavior but we extract items for getAll* methods
      const items =
        result && typeof result === 'object' && 'items' in result && Array.isArray(result.items)
          ? result.items
          : Array.isArray(result)
            ? result
            : [result];

      if (!items || items.length === 0) break;
      allData.push(...items);
      // If we got fewer items than the limit, there are no more pages
      if (items.length < limit) break;
      offset += limit;
    }

    // Return FinaticResponse with accumulated data
    // When error occurs, return error response (success may be omitted or null)
    if (lastError) {
      return {
        success: {
          data: [] as FDXBrokerPositionLot[],
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
   * This method automatically paginates through all pages and returns all items in a single response.
   * It uses the underlying getPositionLotFills method with internal pagination handling.
   *
   * @param params - Optional parameters object. Only include the fields you want to filter by.
   *                 Example: getAllPositionLotFills({ accountId: "123", symbol: "AAPL" })
   * @returns FinaticResponse with success, error, and warning fields containing array of all items
   * @methodId get_all_position_lot_fills_api_beta_brokers_data_positions_lots__lot_id__fills_get
   * @category brokers
   * @example
   * ```typescript-server
   * // Get all items with optional filters
   * const result = await finatic.getAllPositionLotFills({ connectionId: 'example-id' });
   *
   * // Access the response data
   * if (result.success) {
   *   console.log('Total items:', result.success.data.length);
   *   if (result.warning && result.warning.length > 0) {
   *     console.warn('Warnings:', result.warning);
   *   }
   * } else if (result.error) {
   *   console.error('Error:', result.error.message);
   * }
   * ```
   * @example
   * ```typescript-client
   * // Get all items with optional filters
   * const result = await finatic.getAllPositionLotFills({ connectionId: 'example-id' });
   *
   * // Access the response data
   * if (result.success) {
   *   console.log('Total items:', result.success.data.length);
   *   if (result.warning && result.warning.length > 0) {
   *     console.warn('Warnings:', result.warning);
   *   }
   * } else if (result.error) {
   *   console.error('Error:', result.error.message);
   * }
   * ```
   * @example
   * ```python
   * # Get all items with optional filters
   * result = await finatic.get_all_position_lot_fills(
   *            connection_id='example'
   * )
   *
   * # Access the response data
   * if result.success:
   *     print('Total items:', len(result.success['data']))
   *     if result.warning:
   *         print('Warnings:', result.warning)
   * elif result.error:
   *     print('Error:', result.error['message'])
   * ```
   */
  async getAllPositionLotFills(
    params?: Partial<GetPositionLotFillsParams>
  ): Promise<FinaticResponse<FDXBrokerPositionLotFill[]>> {
    // Use provided params or empty object (excluding limit and offset which are handled internally)
    const filterParams: GetPositionLotFillsParams = (params || {}) as GetPositionLotFillsParams;
    const allData: FDXBrokerPositionLotFill[] = [];
    let offset = 0;
    const limit = 1000;
    let lastError: { [key: string]: any } | null = null;
    let warnings: Array<{ [key: string]: any }> = [];

    while (true) {
      const response = await this.brokers.getPositionLotFills({ ...filterParams, limit, offset });

      // Collect warnings from each page
      if (response.warning && Array.isArray(response.warning)) {
        warnings.push(...response.warning);
      }

      if (response.error) {
        lastError = response.error;
        break;
      }

      const result = response.success?.data || [];
      // Extract items from PaginatedData if it's a PaginatedData object, otherwise use as-is
      // PaginatedData has array-like behavior but we extract items for getAll* methods
      const items =
        result && typeof result === 'object' && 'items' in result && Array.isArray(result.items)
          ? result.items
          : Array.isArray(result)
            ? result
            : [result];

      if (!items || items.length === 0) break;
      allData.push(...items);
      // If we got fewer items than the limit, there are no more pages
      if (items.length < limit) break;
      offset += limit;
    }

    // Return FinaticResponse with accumulated data
    // When error occurs, return error response (success may be omitted or null)
    if (lastError) {
      return {
        success: {
          data: [] as FDXBrokerPositionLotFill[],
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
