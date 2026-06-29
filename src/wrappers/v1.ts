/**
 * Hand-written v1 client (session, accounts, trading, grants, webhooks).
 *
 * This is NOT the raw OpenAPI generator output under ``src/openapi/``.
 * All versioned public API surface lives here under ``finatic.v1``.
 */

import axios, { type AxiosInstance, type AxiosRequestConfig, type AxiosResponse } from 'axios';

import type { SdkConfig, FinaticApiEnvironment } from '../config';
import {
  appendAssetTypesToURL,
  appendBrokerFilterToURL,
  appendKindToURL,
  appendStageToURL,
  appendThemeToURL,
} from '../utils/url-utils';
import { generateRequestId } from '../utils/request-id';

export type FinaticV1ErrorCode =
  | 'AUTHENTICATION'
  | 'AUTHORIZATION'
  | 'VALIDATION'
  | 'RATE_LIMITED'
  | 'REAUTH_REQUIRED'
  | 'PROVIDER_ERROR'
  | 'CONFLICT'
  | 'NOT_FOUND'
  | 'INTERNAL';

export interface FinaticV1Error {
  category?: string;
  code: FinaticV1ErrorCode;
  message: string;
  status?: number;
  details?: Record<string, unknown> | null;
}

export interface FinaticV1Warning {
  code?: string;
  message?: string;
  details?: Record<string, unknown> | null;
}

export interface FinaticV1Response<T = unknown> {
  traceId: string | null;
  data: T | null;
  warnings: FinaticV1Warning[];
  errors: FinaticV1Error[];
}

export interface FinaticV1CallOptions {
  environment?: FinaticApiEnvironment;
}

export interface AccountScopedParams {
  accountId: string;
  limit?: number;
  offset?: number;
}

export interface AccountOrderParams {
  accountId: string;
  orderId: string;
}

export interface CreateAccountOrderCommandParams {
  accountId: string;
  body?: unknown;
  idempotencyKey: string;
}

export interface AccountOrderCommandParams extends AccountOrderParams {
  body?: unknown;
  idempotencyKey: string;
}

type QueryValue = string | number | boolean | undefined;
type HttpMethod = 'GET' | 'POST' | 'PATCH' | 'DELETE';

export type SessionStartResult =
  | {
      success: boolean;
      session_id: string | null;
      company_id: string | null;
      error: string | null;
    }
  | { session_id: string; company_id: string };

export interface PortalUrlParams {
  theme?: string | { preset?: string; custom?: Record<string, unknown> };
  brokers?: string[];
  kind?: 'broker' | 'exchange';
  asset_types?: string[];
  stage?: ('production' | 'beta' | 'alpha')[];
  email?: string;
  mode?: 'light' | 'dark';
}

function readSessionField(
  data: Record<string, unknown> | null | undefined,
  keys: string[]
): string {
  if (!data) {
    return '';
  }
  for (const key of keys) {
    const value = data[key];
    if (typeof value === 'string' && value) {
      return value;
    }
  }
  return '';
}

export class V1Wrapper {
  private readonly apiKey: string;
  private readonly sdkConfig: SdkConfig;
  private readonly client: AxiosInstance;
  private sessionId?: string;
  private companyId?: string;
  private csrfToken?: string;
  private userId?: string;

  constructor(apiKey: string, sdkConfig: SdkConfig, client?: AxiosInstance) {
    this.apiKey = apiKey;
    this.sdkConfig = sdkConfig;
    this.client =
      client ??
      axios.create({
        baseURL: sdkConfig.baseUrl,
        timeout: sdkConfig.timeout,
        headers: sdkConfig.headers,
      });
  }

  setSessionContext(sessionId: string, companyId: string, csrfToken: string): void {
    this.sessionId = sessionId;
    this.companyId = companyId;
    this.csrfToken = csrfToken;
  }

  getSessionId(): string | undefined {
    return this.sessionId;
  }

  getCompanyId(): string | undefined {
    return this.companyId;
  }

  getUserId(): string | undefined {
    return this.userId;
  }

  isAuthed(): boolean {
    return !!this.userId;
  }

  async initSession(apiKeyOverride?: string): Promise<FinaticV1Response<Record<string, unknown>>> {
    return this.request<Record<string, unknown>>(
      'POST',
      '/api/v1/session/init',
      {},
      undefined,
      apiKeyOverride
    );
  }

  async getToken(apiKeyOverride?: string): Promise<string> {
    const response = await this.initSession(apiKeyOverride);
    if (response.errors.length > 0) {
      throw new Error(response.errors[0]?.message || 'Failed to initialize session');
    }
    const token = readSessionField(response.data, ['one_time_token', 'oneTimeToken']);
    if (!token) {
      throw new Error('Failed to get one-time token from /api/v1/session/init');
    }
    return token;
  }

  async startSession(params?: {
    oneTimeToken?: string;
    userId?: string;
  }): Promise<SessionStartResult> {
    const oneTimeToken = params?.oneTimeToken;
    const paramUserId = params?.userId;

    if (!oneTimeToken) {
      if (!this.apiKey) {
        return {
          success: false,
          session_id: null,
          company_id: null,
          error: 'API key is required in the constructor.',
        };
      }

      try {
        const token = await this.getToken();
        const started = await this.startSessionWithToken(token, paramUserId);
        return {
          success: true,
          session_id: started.session_id,
          company_id: started.company_id,
          error: null,
        };
      } catch (error) {
        return {
          success: false,
          session_id: null,
          company_id: null,
          error: error instanceof Error ? error.message : String(error),
        };
      }
    }

    return this.startSessionWithToken(oneTimeToken, paramUserId);
  }

  private async startSessionWithToken(
    oneTimeToken: string,
    userId?: string
  ): Promise<{ session_id: string; company_id: string }> {
    const body = userId !== undefined ? { user_id: userId } : {};
    const response = await this.request<Record<string, unknown>>(
      'POST',
      '/api/v1/session/start',
      { data: body, headers: { 'One-Time-Token': oneTimeToken } }
    );
    if (response.errors.length > 0) {
      throw new Error(response.errors[0]?.message || 'Failed to start session');
    }

    const sessionData = response.data ?? {};
    const sessionId = readSessionField(sessionData, ['session_id', 'sessionId']);
    const companyId = readSessionField(sessionData, ['company_id', 'companyId']);
    const csrfToken = readSessionField(sessionData, ['csrf_token', 'csrfToken']);
    const responseUserId = readSessionField(sessionData, ['user_id', 'userId']);

    if (sessionId && companyId) {
      this.setSessionContext(sessionId, companyId, csrfToken);
    }

    const finalUserId = responseUserId || userId;
    if (finalUserId) {
      this.userId = finalUserId;
    }

    return { session_id: sessionId, company_id: companyId };
  }

  async getPortalUrl(params?: PortalUrlParams): Promise<string> {
    if (!this.sessionId) {
      throw new Error('Session not initialized. Call v1.startSession() first.');
    }

    const response = await this.request<Record<string, unknown>>('GET', '/api/v1/session/portal');
    if (response.errors.length > 0) {
      throw new Error(response.errors[0]?.message || 'Failed to get portal URL');
    }

    let portalUrl = readSessionField(response.data, ['portal_url', 'portalUrl']);
    if (!portalUrl) {
      throw new Error('Invalid portal URL response: missing portal_url');
    }

    try {
      new URL(portalUrl);
    } catch {
      throw new Error(`Invalid portal URL received from API: ${portalUrl}`);
    }

    const { theme, brokers, kind, asset_types, stage, email, mode } = params || {};
    if (theme) {
      portalUrl = appendThemeToURL(portalUrl, theme);
    }
    if (brokers) {
      portalUrl = appendBrokerFilterToURL(portalUrl, brokers);
    }
    if (kind) {
      portalUrl = appendKindToURL(portalUrl, kind);
    }
    if (asset_types && asset_types.length > 0) {
      portalUrl = appendAssetTypesToURL(portalUrl, asset_types);
    }
    if (stage && stage.length > 0) {
      portalUrl = appendStageToURL(portalUrl, stage);
    }
    if (email) {
      const url = new URL(portalUrl);
      url.searchParams.set('email', email);
      portalUrl = url.toString();
    }
    if (mode) {
      const url = new URL(portalUrl);
      url.searchParams.set('mode', mode);
      portalUrl = url.toString();
    }

    return portalUrl;
  }

  async getSessionUser(): Promise<{ user_id: string; company_id: string }> {
    if (!this.sessionId) {
      throw new Error('Session not initialized. Call v1.startSession() first.');
    }

    const response = await this.request<Record<string, unknown>>(
      'GET',
      `/api/v1/session/${encodeURIComponent(this.sessionId)}/user`
    );
    if (response.errors.length > 0) {
      throw new Error(response.errors[0]?.message || 'Failed to get session user');
    }

    const data = response.data ?? {};
    const resolvedUserId = readSessionField(data, ['user_id', 'userId']);
    if (resolvedUserId) {
      this.userId = resolvedUserId;
    }

    return {
      user_id: resolvedUserId,
      company_id: this.companyId || '',
    };
  }

  listAccounts<T = unknown>(
    params: { limit?: number; offset?: number; includeSyncStatus?: boolean } = {},
    options?: FinaticV1CallOptions
  ): Promise<FinaticV1Response<T>> {
    const query: Record<string, QueryValue> = {
      limit: params.limit,
      offset: params.offset,
      include_sync_status: params.includeSyncStatus,
    };
    return this.request<T>('GET', '/api/v1/accounts', { params: query }, options);
  }

  getAccount<T = unknown>(
    accountId: string,
    options?: FinaticV1CallOptions
  ): Promise<FinaticV1Response<T>> {
    return this.request<T>('GET', `/api/v1/accounts/${encodeURIComponent(accountId)}`, {}, options);
  }

  /** GET /api/v1/accounts/{accountId}/balances */
  listBalances<T = unknown>(
    params: AccountScopedParams,
    options?: FinaticV1CallOptions
  ): Promise<FinaticV1Response<T>> {
    return this.listAccountResource<T>('balances', params, options);
  }

  /** GET /api/v1/accounts/{accountId}/positions */
  listPositions<T = unknown>(
    params: AccountScopedParams,
    options?: FinaticV1CallOptions
  ): Promise<FinaticV1Response<T>> {
    return this.listAccountResource<T>('positions', params, options);
  }

  /** GET /api/v1/accounts/{accountId}/transactions */
  listTransactions<T = unknown>(
    params: AccountScopedParams,
    options?: FinaticV1CallOptions
  ): Promise<FinaticV1Response<T>> {
    return this.listAccountResource<T>('transactions', params, options);
  }

  /** GET /api/v1/accounts/{accountId}/orders */
  listOrders<T = unknown>(
    params: AccountScopedParams,
    options?: FinaticV1CallOptions
  ): Promise<FinaticV1Response<T>> {
    return this.listAccountResource<T>('orders', params, options);
  }

  listAccountResource<T = unknown>(
    resource: string,
    params: AccountScopedParams,
    options?: FinaticV1CallOptions
  ): Promise<FinaticV1Response<T>> {
    const query: Record<string, QueryValue> = { limit: params.limit, offset: params.offset };
    return this.request<T>(
      'GET',
      `/api/v1/accounts/${encodeURIComponent(params.accountId)}/${encodeURIComponent(resource)}`,
      { params: query },
      options
    );
  }

  getAccountOrder<T = unknown>(
    params: AccountOrderParams,
    options?: FinaticV1CallOptions
  ): Promise<FinaticV1Response<T>> {
    return this.accountOrderResource<T>(params, '', options);
  }

  getAccountOrderFills<T = unknown>(
    params: AccountOrderParams,
    options?: FinaticV1CallOptions
  ): Promise<FinaticV1Response<T>> {
    return this.accountOrderResource<T>(params, '/fills', options);
  }

  getAccountOrderEvents<T = unknown>(
    params: AccountOrderParams,
    options?: FinaticV1CallOptions
  ): Promise<FinaticV1Response<T>> {
    return this.accountOrderResource<T>(params, '/events', options);
  }

  createAccountOrder<T = unknown>(
    params: CreateAccountOrderCommandParams,
    options?: FinaticV1CallOptions
  ): Promise<FinaticV1Response<T>> {
    return this.request<T>(
      'POST',
      `/api/v1/accounts/${encodeURIComponent(params.accountId)}/orders`,
      {
        data: params.body ?? {},
        idempotencyKey: this.requireIdempotencyKey(params.idempotencyKey),
      },
      options
    );
  }

  modifyAccountOrder<T = unknown>(
    params: AccountOrderCommandParams,
    options?: FinaticV1CallOptions
  ): Promise<FinaticV1Response<T>> {
    return this.request<T>(
      'PATCH',
      `/api/v1/accounts/${encodeURIComponent(params.accountId)}/orders/${encodeURIComponent(
        params.orderId
      )}`,
      {
        data: params.body ?? {},
        idempotencyKey: this.requireIdempotencyKey(params.idempotencyKey),
      },
      options
    );
  }

  cancelAccountOrder<T = unknown>(
    params: AccountOrderCommandParams,
    options?: FinaticV1CallOptions
  ): Promise<FinaticV1Response<T>> {
    return this.request<T>(
      'DELETE',
      `/api/v1/accounts/${encodeURIComponent(params.accountId)}/orders/${encodeURIComponent(
        params.orderId
      )}`,
      { idempotencyKey: this.requireIdempotencyKey(params.idempotencyKey) },
      options
    );
  }

  listAccountGrants<T = unknown>(options?: FinaticV1CallOptions): Promise<FinaticV1Response<T>> {
    return this.request<T>('GET', '/api/v1/account-grants', {}, options);
  }

  getAccountGrant<T = unknown>(
    grantId: string,
    options?: FinaticV1CallOptions
  ): Promise<FinaticV1Response<T>> {
    return this.request<T>(
      'GET',
      `/api/v1/account-grants/${encodeURIComponent(grantId)}`,
      {},
      options
    );
  }

  updateAccountGrant<T = unknown>(
    grantId: string,
    body: unknown,
    options?: FinaticV1CallOptions
  ): Promise<FinaticV1Response<T>> {
    return this.request<T>(
      'PATCH',
      `/api/v1/account-grants/${encodeURIComponent(grantId)}`,
      { data: body },
      options
    );
  }

  revokeAccountGrant<T = unknown>(
    grantId: string,
    options?: FinaticV1CallOptions
  ): Promise<FinaticV1Response<T>> {
    return this.request<T>(
      'POST',
      `/api/v1/account-grants/${encodeURIComponent(grantId)}/revoke`,
      {},
      options
    );
  }

  getWebhookCatalog<T = unknown>(options?: FinaticV1CallOptions): Promise<FinaticV1Response<T>> {
    return this.request<T>('GET', '/api/v1/webhooks/catalog', {}, options);
  }

  getWebhookPayloadSchema<T = unknown>(
    options?: FinaticV1CallOptions
  ): Promise<FinaticV1Response<T>> {
    return this.request<T>('GET', '/api/v1/webhooks/payload-schema', {}, options);
  }

  listWebhookSubscriptions<T = unknown>(
    options?: FinaticV1CallOptions
  ): Promise<FinaticV1Response<T>> {
    return this.request<T>('GET', '/api/v1/webhooks/subscriptions', {}, options);
  }

  createWebhookSubscription<T = unknown>(
    body: unknown,
    options?: FinaticV1CallOptions
  ): Promise<FinaticV1Response<T>> {
    return this.request<T>('POST', '/api/v1/webhooks/subscriptions', { data: body }, options);
  }

  updateWebhookSubscription<T = unknown>(
    subscriptionId: string,
    body: unknown,
    options?: FinaticV1CallOptions
  ): Promise<FinaticV1Response<T>> {
    return this.request<T>(
      'PATCH',
      `/api/v1/webhooks/subscriptions/${encodeURIComponent(subscriptionId)}`,
      { data: body },
      options
    );
  }

  revokeWebhookSubscription<T = unknown>(
    subscriptionId: string,
    options?: FinaticV1CallOptions
  ): Promise<FinaticV1Response<T>> {
    return this.request<T>(
      'POST',
      `/api/v1/webhooks/subscriptions/${encodeURIComponent(subscriptionId)}/revoke`,
      {},
      options
    );
  }

  private accountOrderResource<T>(
    params: AccountOrderParams,
    suffix: string,
    options?: FinaticV1CallOptions
  ): Promise<FinaticV1Response<T>> {
    return this.request<T>(
      'GET',
      `/api/v1/accounts/${encodeURIComponent(params.accountId)}/orders/${encodeURIComponent(
        params.orderId
      )}${suffix}`,
      {},
      options
    );
  }

  private async request<T>(
    method: HttpMethod,
    url: string,
    request: {
      data?: unknown;
      params?: Record<string, QueryValue>;
      headers?: Record<string, string>;
      idempotencyKey?: string;
    } = {},
    options?: FinaticV1CallOptions,
    apiKeyOverride?: string
  ): Promise<FinaticV1Response<T>> {
    const headers: Record<string, string> = {
      'x-api-key': apiKeyOverride ?? this.apiKey,
      'x-request-id': generateRequestId(),
      'X-Finatic-Environment': options?.environment ?? this.sdkConfig.apiEnvironment,
      ...(this.sessionId ? { 'x-session-id': this.sessionId } : {}),
      ...(this.companyId ? { 'x-company-id': this.companyId } : {}),
      ...(this.csrfToken ? { 'x-csrf-token': this.csrfToken } : {}),
      ...(request.idempotencyKey ? { 'Idempotency-Key': request.idempotencyKey } : {}),
      ...(request.headers ?? {}),
    };
    const config: AxiosRequestConfig = {
      method,
      url,
      headers,
      params: this.cleanParams(request.params),
      data: request.data,
    };
    try {
      const response: AxiosResponse<unknown> = await this.client.request(config);
      return this.normalizeResponse<T>(response.data);
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        return this.normalizeErrorResponse<T>(
          error.response.data,
          error.response.status,
          error.response.headers
        );
      }
      throw error;
    }
  }

  private normalizeResponse<T>(payload: unknown): FinaticV1Response<T> {
    if (payload && typeof payload === 'object') {
      const record = payload as Record<string, unknown>;
      if ('traceId' in record || 'data' in record || 'warnings' in record || 'errors' in record) {
        return {
          traceId: typeof record['traceId'] === 'string' ? record['traceId'] : null,
          data: (record['data'] as T | undefined) ?? null,
          warnings: this.normalizeWarnings(record['warnings']),
          errors: this.normalizeErrors(record['errors']),
        };
      }

      const success = record['success'];
      const successData =
        success && typeof success === 'object'
          ? (success as Record<string, unknown>)['data']
          : undefined;
      return {
        traceId: typeof record['_id'] === 'string' ? record['_id'] : null,
        data: (successData as T | undefined) ?? null,
        warnings: this.normalizeWarnings(record['warnings'] ?? record['warning']),
        errors: this.normalizeErrors(record['errors'] ?? record['error']),
      };
    }

    return {
      traceId: null,
      data: (payload as T | undefined) ?? null,
      warnings: [],
      errors: [],
    };
  }

  private normalizeErrorResponse<T>(
    payload: unknown,
    status: number,
    headers: unknown
  ): FinaticV1Response<T> {
    if (payload && typeof payload === 'object') {
      const record = payload as Record<string, unknown>;
      const errorPayload = record['errors'] ?? record['error'];
      const message = record['message'] ?? record['detail'] ?? record['title'] ?? `HTTP ${status}`;
      return {
        traceId: this.traceId(record, headers),
        data: null,
        warnings: this.normalizeWarnings(record['warnings'] ?? record['warning']),
        errors:
          errorPayload === undefined
            ? [this.normalizeError({ message }, status)]
            : this.normalizeErrors(errorPayload, status),
      };
    }

    return {
      traceId: this.traceId(null, headers),
      data: null,
      warnings: [],
      errors: [this.normalizeError({ message: String(payload || `HTTP ${status}`) }, status)],
    };
  }

  private requireIdempotencyKey(value: string): string {
    if (!value || value.trim().length === 0) {
      throw new Error('idempotencyKey is required for account order commands');
    }
    return value;
  }

  private normalizeWarnings(value: unknown): FinaticV1Warning[] {
    if (!Array.isArray(value)) {
      return [];
    }
    return value
      .filter((warning): warning is Record<string, unknown> => {
        return Boolean(warning && typeof warning === 'object');
      })
      .map((warning) => ({
        ...(typeof warning['code'] === 'string' ? { code: warning['code'] } : {}),
        ...(typeof warning['message'] === 'string' ? { message: warning['message'] } : {}),
        ...(warning['details'] && typeof warning['details'] === 'object'
          ? { details: warning['details'] as Record<string, unknown> }
          : {}),
      }));
  }

  private normalizeErrors(value: unknown, status?: number): FinaticV1Error[] {
    const rawErrors = Array.isArray(value) ? value : value ? [value] : [];
    return rawErrors
      .filter((error): error is Record<string, unknown> => {
        return Boolean(error && typeof error === 'object');
      })
      .map((error) => this.normalizeError(error, status));
  }

  private normalizeError(error: Record<string, unknown>, status?: number): FinaticV1Error {
    const code = this.normalizeErrorCode(error['code'], status, error);
    return {
      ...(typeof error['category'] === 'string'
        ? { category: error['category'] }
        : status !== undefined
          ? { category: code }
          : {}),
      code,
      message: typeof error['message'] === 'string' ? error['message'] : code,
      ...(status !== undefined ? { status } : {}),
      ...(error['details'] && typeof error['details'] === 'object'
        ? { details: error['details'] as Record<string, unknown> }
        : {}),
    };
  }

  private normalizeErrorCode(
    value: unknown,
    status?: number,
    error?: Record<string, unknown>
  ): FinaticV1ErrorCode {
    const rawCode = typeof value === 'string' ? value : undefined;
    if (
      rawCode === 'AUTHENTICATION' ||
      rawCode === 'AUTHORIZATION' ||
      rawCode === 'VALIDATION' ||
      rawCode === 'RATE_LIMITED' ||
      rawCode === 'REAUTH_REQUIRED' ||
      rawCode === 'PROVIDER_ERROR' ||
      rawCode === 'CONFLICT' ||
      rawCode === 'NOT_FOUND' ||
      rawCode === 'INTERNAL'
    ) {
      return rawCode;
    }
    if (rawCode === 'AUTH_ERROR') {
      return 'AUTHENTICATION';
    }
    if (rawCode === 'ACCESS_DENIED') {
      return 'AUTHORIZATION';
    }
    if (rawCode === 'VALIDATION_ERROR') {
      return 'VALIDATION';
    }
    if (rawCode === 'SESSION_NOT_FOUND' || rawCode === 'ACCOUNT_NOT_FOUND') {
      return 'NOT_FOUND';
    }
    const message = typeof error?.['message'] === 'string' ? error['message'].toLowerCase() : '';
    if (message.includes('reauth') || message.includes('re-authoriz')) {
      return 'REAUTH_REQUIRED';
    }
    if (message.includes('provider') || message.includes('broker')) {
      return 'PROVIDER_ERROR';
    }
    if (status === 401) {
      return 'AUTHENTICATION';
    }
    if (status === 403) {
      return 'AUTHORIZATION';
    }
    if (status === 404) {
      return 'NOT_FOUND';
    }
    if (status === 409) {
      return 'CONFLICT';
    }
    if (status === 422) {
      return 'VALIDATION';
    }
    if (status === 429) {
      return 'RATE_LIMITED';
    }
    return 'INTERNAL';
  }

  private traceId(payload: Record<string, unknown> | null, headers: unknown): string | null {
    if (payload && typeof payload['traceId'] === 'string') {
      return payload['traceId'];
    }
    if (headers && typeof headers === 'object') {
      const headerRecord = headers as Record<string, unknown>;
      for (const name of ['x-trace-id', 'X-Trace-ID', 'x-request-id', 'X-Request-ID']) {
        const value = headerRecord[name];
        if (typeof value === 'string') {
          return value;
        }
      }
    }
    return null;
  }

  private cleanParams(params?: Record<string, QueryValue>): Record<string, QueryValue> | undefined {
    if (!params) {
      return undefined;
    }
    const cleaned: Record<string, QueryValue> = {};
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined) {
        cleaned[key] = value;
      }
    }
    return Object.keys(cleaned).length > 0 ? cleaned : undefined;
  }
}
