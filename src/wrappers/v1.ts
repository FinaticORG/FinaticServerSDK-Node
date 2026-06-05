import axios, { type AxiosInstance, type AxiosRequestConfig, type AxiosResponse } from 'axios';

import type { SdkConfig, FinaticApiEnvironment } from '../config';
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

export interface AccountPositionLotFillsParams {
  accountId: string;
  lotId: string;
}

export interface DiscoveredAccountsParams {
  authAttemptId?: string;
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

export class V1Wrapper {
  private readonly apiKey: string;
  private readonly sdkConfig: SdkConfig;
  private readonly client: AxiosInstance;
  private sessionId?: string;
  private companyId?: string;
  private csrfToken?: string;

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

  createSession<T = unknown>(
    body: unknown,
    options?: FinaticV1CallOptions
  ): Promise<FinaticV1Response<T>> {
    return this.request<T>('POST', '/api/v1/sessions', { data: body }, options);
  }

  getSession<T = unknown>(
    sessionId: string,
    options?: FinaticV1CallOptions
  ): Promise<FinaticV1Response<T>> {
    return this.request<T>('GET', `/api/v1/sessions/${encodeURIComponent(sessionId)}`, {}, options);
  }

  createPortalLink<T = unknown>(
    sessionId: string,
    body?: unknown,
    options?: FinaticV1CallOptions
  ): Promise<FinaticV1Response<T>> {
    return this.request<T>(
      'POST',
      `/api/v1/sessions/${encodeURIComponent(sessionId)}/portal-links`,
      { data: body ?? {} },
      options
    );
  }

  getPortal<T = unknown>(
    token: string,
    options?: FinaticV1CallOptions
  ): Promise<FinaticV1Response<T>> {
    return this.request<T>('GET', `/api/v1/portal/${encodeURIComponent(token)}`, {}, options);
  }

  getPortalOauthCompletion<T = unknown>(
    token: string,
    options?: FinaticV1CallOptions
  ): Promise<FinaticV1Response<T>> {
    return this.request<T>(
      'GET',
      `/api/v1/portal/oauth/completion/${encodeURIComponent(token)}`,
      {},
      options
    );
  }

  linkPortalUser<T = unknown>(
    sessionId: string,
    body: { userId: string },
    options?: FinaticV1CallOptions
  ): Promise<FinaticV1Response<T>> {
    return this.request<T>(
      'POST',
      `/api/v1/portal/${encodeURIComponent(sessionId)}/user-link`,
      { data: body },
      options
    );
  }

  listPortalInstitutions<T = unknown>(
    sessionId: string,
    options?: FinaticV1CallOptions
  ): Promise<FinaticV1Response<T>> {
    return this.request<T>(
      'GET',
      `/api/v1/portal/${encodeURIComponent(sessionId)}/institutions`,
      {},
      options
    );
  }

  createPortalAuthAttempt<T = unknown>(
    sessionId: string,
    body: { brokerId: string },
    options?: FinaticV1CallOptions
  ): Promise<FinaticV1Response<T>> {
    return this.request<T>(
      'POST',
      `/api/v1/portal/${encodeURIComponent(sessionId)}/auth-attempts`,
      { data: body },
      options
    );
  }

  getPortalAuthAttempt<T = unknown>(
    sessionId: string,
    authAttemptId: string,
    options?: FinaticV1CallOptions
  ): Promise<FinaticV1Response<T>> {
    return this.request<T>(
      'GET',
      `/api/v1/portal/${encodeURIComponent(sessionId)}/auth-attempts/${encodeURIComponent(
        authAttemptId
      )}`,
      {},
      options
    );
  }

  listDiscoveredAccounts<T = unknown>(
    sessionId: string,
    paramsOrOptions: DiscoveredAccountsParams | FinaticV1CallOptions = {},
    options?: FinaticV1CallOptions
  ): Promise<FinaticV1Response<T>> {
    let params: Record<string, QueryValue> = {};
    let callOptions: FinaticV1CallOptions | undefined = options;
    if ('authAttemptId' in paramsOrOptions) {
      params = { authAttemptId: paramsOrOptions.authAttemptId };
    } else {
      callOptions = paramsOrOptions as FinaticV1CallOptions;
    }
    return this.request<T>(
      'GET',
      `/api/v1/portal/${encodeURIComponent(sessionId)}/discovered-accounts`,
      { params },
      callOptions
    );
  }

  createPortalAccountGrant<T = unknown>(
    sessionId: string,
    body: {
      accountId: string;
      authAttemptId: string;
      canRead?: boolean;
      canTrade?: boolean;
      dataClusters?: string[];
      consentId?: string | null;
    },
    options?: FinaticV1CallOptions
  ): Promise<FinaticV1Response<T>> {
    return this.request<T>(
      'POST',
      `/api/v1/portal/${encodeURIComponent(sessionId)}/account-grants`,
      { data: body },
      options
    );
  }

  completePortalSession<T = unknown>(
    sessionId: string,
    options?: FinaticV1CallOptions
  ): Promise<FinaticV1Response<T>> {
    return this.request<T>(
      'POST',
      `/api/v1/portal/${encodeURIComponent(sessionId)}/complete`,
      {},
      options
    );
  }

  getSessionUser<T = unknown>(
    sessionId: string,
    options?: FinaticV1CallOptions
  ): Promise<FinaticV1Response<T>> {
    return this.request<T>(
      'GET',
      `/api/v1/sessions/${encodeURIComponent(sessionId)}/user`,
      {},
      options
    );
  }

  getSessionSyncStatus<T = unknown>(
    sessionId: string,
    options?: FinaticV1CallOptions
  ): Promise<FinaticV1Response<T>> {
    return this.request<T>(
      'GET',
      `/api/v1/sessions/${encodeURIComponent(sessionId)}/sync-status`,
      {},
      options
    );
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

  getAccountSyncStatus<T = unknown>(
    accountId: string,
    options?: FinaticV1CallOptions
  ): Promise<FinaticV1Response<T>> {
    return this.getAccount<T>(accountId, options);
  }

  getCompany<T = unknown>(
    companyId: string,
    options?: FinaticV1CallOptions
  ): Promise<FinaticV1Response<T>> {
    return this.request<T>('GET', `/api/v1/company/${encodeURIComponent(companyId)}`, {}, options);
  }

  listBalances<T = unknown>(
    params: AccountScopedParams,
    options?: FinaticV1CallOptions
  ): Promise<FinaticV1Response<T>> {
    return this.listAccountResource<T>('balances', params, options);
  }

  listPositions<T = unknown>(
    params: AccountScopedParams,
    options?: FinaticV1CallOptions
  ): Promise<FinaticV1Response<T>> {
    return this.listAccountResource<T>('positions', params, options);
  }

  listTransactions<T = unknown>(
    params: AccountScopedParams,
    options?: FinaticV1CallOptions
  ): Promise<FinaticV1Response<T>> {
    return this.listAccountResource<T>('transactions', params, options);
  }

  listOrders<T = unknown>(
    params: AccountScopedParams,
    options?: FinaticV1CallOptions
  ): Promise<FinaticV1Response<T>> {
    return this.listAccountResource<T>('orders', params, options);
  }

  listPositionLots<T = unknown>(
    params: AccountScopedParams,
    options?: FinaticV1CallOptions
  ): Promise<FinaticV1Response<T>> {
    return this.listAccountResource<T>('position-lots', params, options);
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

  getAccountPositionLotFills<T = unknown>(
    params: AccountPositionLotFillsParams,
    options?: FinaticV1CallOptions
  ): Promise<FinaticV1Response<T>> {
    return this.request<T>(
      'GET',
      `/api/v1/accounts/${encodeURIComponent(params.accountId)}/position-lots/${encodeURIComponent(
        params.lotId
      )}/fills`,
      {},
      options
    );
  }

  createAccountOrder<T = unknown>(
    params: CreateAccountOrderCommandParams,
    options?: FinaticV1CallOptions
  ): Promise<FinaticV1Response<T>> {
    return this.request<T>(
      'POST',
      `/api/v1/accounts/${encodeURIComponent(params.accountId)}/orders`,
      { data: params.body ?? {}, idempotencyKey: params.idempotencyKey },
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
      { data: params.body ?? {}, idempotencyKey: params.idempotencyKey },
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
      { data: params.body ?? {}, idempotencyKey: params.idempotencyKey },
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

  listConsents<T = unknown>(options?: FinaticV1CallOptions): Promise<FinaticV1Response<T>> {
    return this.request<T>('GET', '/api/v1/consents', {}, options);
  }

  createConsent<T = unknown>(
    body: unknown,
    options?: FinaticV1CallOptions
  ): Promise<FinaticV1Response<T>> {
    return this.request<T>('POST', '/api/v1/consents', { data: body }, options);
  }

  getConsent<T = unknown>(
    consentId: string,
    options?: FinaticV1CallOptions
  ): Promise<FinaticV1Response<T>> {
    return this.request<T>('GET', `/api/v1/consents/${encodeURIComponent(consentId)}`, {}, options);
  }

  revokeConsent<T = unknown>(
    consentId: string,
    options?: FinaticV1CallOptions
  ): Promise<FinaticV1Response<T>> {
    return this.request<T>(
      'POST',
      `/api/v1/consents/${encodeURIComponent(consentId)}/revoke`,
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

  private listAccountResource<T>(
    resource: string,
    params: AccountScopedParams,
    options?: FinaticV1CallOptions
  ): Promise<FinaticV1Response<T>> {
    const query: Record<string, QueryValue> = { limit: params.limit, offset: params.offset };
    return this.request<T>(
      'GET',
      `/api/v1/accounts/${encodeURIComponent(params.accountId)}/${resource}`,
      { params: query },
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
    request: { data?: unknown; params?: Record<string, QueryValue>; idempotencyKey?: string },
    options?: FinaticV1CallOptions
  ): Promise<FinaticV1Response<T>> {
    const headers: Record<string, string> = {
      'x-api-key': this.apiKey,
      'x-request-id': generateRequestId(),
      'X-Finatic-Environment': options?.environment ?? this.sdkConfig.apiEnvironment,
      ...(this.sessionId ? { 'x-session-id': this.sessionId } : {}),
      ...(this.companyId ? { 'x-company-id': this.companyId } : {}),
      ...(this.csrfToken ? { 'x-csrf-token': this.csrfToken } : {}),
      ...(request.idempotencyKey ? { 'Idempotency-Key': request.idempotencyKey } : {}),
    };
    const config: AxiosRequestConfig = {
      method,
      url,
      headers,
      params: this.cleanParams(request.params),
      data: request.data,
    };
    const response: AxiosResponse<unknown> = await this.client.request(config);
    return this.normalizeResponse<T>(response.data);
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

  private normalizeErrors(value: unknown): FinaticV1Error[] {
    const rawErrors = Array.isArray(value) ? value : value ? [value] : [];
    return rawErrors
      .filter((error): error is Record<string, unknown> => {
        return Boolean(error && typeof error === 'object');
      })
      .map((error) => {
        const code = this.normalizeErrorCode(error['code']);
        return {
          ...(typeof error['category'] === 'string' ? { category: error['category'] } : {}),
          code,
          message: typeof error['message'] === 'string' ? error['message'] : code,
          ...(error['details'] && typeof error['details'] === 'object'
            ? { details: error['details'] as Record<string, unknown> }
            : {}),
        };
      });
  }

  private normalizeErrorCode(value: unknown): FinaticV1ErrorCode {
    const rawCode = typeof value === 'string' ? value : 'INTERNAL';
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
    return 'INTERNAL';
  }

  private cleanParams(
    params: Record<string, QueryValue> | undefined
  ): Record<string, string | number | boolean> | undefined {
    if (!params) {
      return undefined;
    }
    const entries = Object.entries(params).filter(
      (entry): entry is [string, string | number | boolean] => {
        return entry[1] !== undefined;
      }
    );
    return entries.length > 0 ? Object.fromEntries(entries) : undefined;
  }
}
