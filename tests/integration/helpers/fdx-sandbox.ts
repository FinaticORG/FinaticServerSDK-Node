/**
 * FDX Phase 7 sandbox helpers for live-stack integration tests.
 *
 * Run with: FINATIC_INTEGRATION=1 npm test -- tests/integration
 */

import { createHash, randomUUID } from 'crypto';

import axios from 'axios';
import { Client } from 'pg';

import type { V1Wrapper } from '../../../src/wrappers/v1';

const SANDBOX_USER_ID_NAMESPACE = '2221c296-b144-5ebc-847b-08412e806b8c';

function uuidV5(name: string, namespaceUuid: string): string {
  const namespaceBytes = Buffer.from(namespaceUuid.replace(/-/g, ''), 'hex');
  const hash = createHash('sha1').update(namespaceBytes).update(name, 'utf8').digest();
  const bytes = Buffer.from(hash.subarray(0, 16));
  bytes[6] = (bytes[6]! & 0x0f) | 0x50;
  bytes[8] = (bytes[8]! & 0x3f) | 0x80;
  const hex = bytes.toString('hex');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

export const DEVICE_HEADERS: Record<string, string> = {
  'user-agent': 'finatic-sdk-integration',
  'accept-language': 'en-US',
  'sec-ch-ua': '"Chromium";v="124"',
  'sec-ch-ua-platform': '"Linux"',
};

export const DEFAULT_API_BASE_URL = process.env['FINATIC_API_BASE_URL'] ?? 'http://127.0.0.1:8000';
export const DEFAULT_DATABASE_URL =
  process.env['FINATIC_DATABASE_URL'] ?? 'postgresql://postgres:postgres@127.0.0.1:54322/postgres';

export function integrationEnabled(): boolean {
  return process.env['FINATIC_INTEGRATION'] === '1';
}

export function sandboxUserIdFromEmail(email: string): string {
  const normalizedEmail = email.trim().toLowerCase();
  if (!normalizedEmail) {
    throw new Error('Email cannot be empty');
  }
  return uuidV5(normalizedEmail, SANDBOX_USER_ID_NAMESPACE);
}

export interface SandboxBootstrapResult {
  sandboxApiKey: string;
  accountId: string;
  cleanup: () => Promise<void>;
}

export async function bootstrapSandboxApiKey(): Promise<SandboxBootstrapResult> {
  const existingApiKey = process.env['FINATIC_SANDBOX_API_KEY'];
  if (existingApiKey) {
    return {
      sandboxApiKey: existingApiKey,
      accountId: process.env['FINATIC_SANDBOX_ACCOUNT_ID'] ?? '',
      cleanup: async () => undefined,
    };
  }

  const sandboxApiKey = `fntc_sandbox_test_${randomUUID().replace(/-/g, '')}`;
  const sandboxApiKeyHash = createHash('sha256').update(sandboxApiKey).digest('hex');
  const accountId = randomUUID();
  const testEmail = `sandbox-${accountId.slice(0, 8)}@test.company`;

  const databaseClient = new Client({ connectionString: DEFAULT_DATABASE_URL });
  await databaseClient.connect();
  try {
    await databaseClient.query(
      `
        INSERT INTO auth.users (
          id, instance_id, aud, role, email, encrypted_password,
          email_confirmed_at, created_at, updated_at, confirmation_token,
          email_change_token_new, recovery_token
        ) VALUES (
          $1::uuid, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
          $2, '', NOW(), NOW(), NOW(), '', '', ''
        )
        ON CONFLICT (id) DO NOTHING
      `,
      [accountId, testEmail]
    );
    await databaseClient.query(
      `
        INSERT INTO accounts (
          id, name, email, is_personal_account, primary_owner_user_id,
          public_data, sandbox_api_key_hash, sandbox_key_created_at,
          sandbox_key_expires_at, trading_enabled
        ) VALUES (
          $1::uuid, $2, $3, true, $1::uuid,
          '{}'::jsonb, $4, NOW(), NULL, true
        )
        ON CONFLICT (id) DO UPDATE SET
          sandbox_api_key_hash = EXCLUDED.sandbox_api_key_hash,
          sandbox_key_created_at = EXCLUDED.sandbox_key_created_at,
          trading_enabled = EXCLUDED.trading_enabled
      `,
      [accountId, 'SDK Integration Sandbox Company', testEmail, sandboxApiKeyHash]
    );
  } finally {
    await databaseClient.end();
  }

  return {
    sandboxApiKey,
    accountId,
    cleanup: async () => {
      const cleanupClient = new Client({ connectionString: DEFAULT_DATABASE_URL });
      await cleanupClient.connect();
      try {
        await cleanupClient.query('DELETE FROM accounts WHERE id = $1::uuid', [accountId]);
        await cleanupClient.query('DELETE FROM auth.users WHERE id = $1::uuid', [accountId]);
      } finally {
        await cleanupClient.end();
      }
    },
  };
}

export async function assertApiReachable(baseUrl: string = DEFAULT_API_BASE_URL): Promise<void> {
  try {
    await axios.get(`${baseUrl}/api/v1/sessions`, {
      validateStatus: () => true,
      timeout: 5_000,
    });
  } catch (error) {
    throw new Error(
      `finaticAPI not reachable at ${baseUrl}. Start the local stack before FINATIC_INTEGRATION=1 tests.`
    );
  }
}

function sessionField(
  sessionData: Record<string, unknown>,
  ...keys: string[]
): string {
  for (const key of keys) {
    const value = sessionData[key];
    if (value !== undefined && value !== null) {
      return String(value);
    }
  }
  throw new Error(`Missing session field (${keys.join(', ')}) in ${JSON.stringify(sessionData)}`);
}

function normalizePortalEnvelope(payload: unknown): Record<string, unknown> {
  if (!payload || typeof payload !== 'object') {
    throw new TypeError(`Unexpected portal response payload: ${JSON.stringify(payload)}`);
  }
  const record = payload as Record<string, unknown>;
  const success = record['success'];
  if (success && typeof success === 'object' && 'data' in success) {
    return {
      ...record,
      data: (success as Record<string, unknown>)['data'],
    };
  }
  return record;
}

export async function primePortalCsrfToken(
  apiKey: string,
  sessionId: string,
  baseUrl: string = DEFAULT_API_BASE_URL
): Promise<string> {
  const response = await axios.get(`${baseUrl}/api/v1/portal/${sessionId}/institutions`, {
    headers: {
      'x-api-key': apiKey,
      'X-Finatic-Environment': 'sandbox',
      ...DEVICE_HEADERS,
    },
    validateStatus: () => true,
  });
  if (response.status !== 200) {
    throw new Error(`Failed to prime portal CSRF: ${response.status} ${JSON.stringify(response.data)}`);
  }
  const csrfToken = response.headers['x-csrf-token'];
  if (!csrfToken || typeof csrfToken !== 'string') {
    throw new Error('Expected x-csrf-token header from portal institutions GET');
  }
  return csrfToken;
}

export interface SandboxPortalSessionContext {
  sessionId: string;
  companyId: string;
  csrfToken: string;
  userId: string;
}

export async function linkPortalUserHttp(
  apiKey: string,
  sessionId: string,
  userId: string,
  csrfToken: string,
  baseUrl: string = DEFAULT_API_BASE_URL
): Promise<Record<string, unknown>> {
  const response = await axios.post(
    `${baseUrl}/api/v1/portal/${sessionId}/user-link`,
    { userId },
    {
      headers: {
        'x-api-key': apiKey,
        'X-Finatic-Environment': 'sandbox',
        'X-Session-ID': sessionId,
        'x-csrf-token': csrfToken,
        ...DEVICE_HEADERS,
      },
      validateStatus: () => true,
    }
  );
  if (response.status >= 400) {
    throw new Error(`Portal user-link failed: ${JSON.stringify(response.data)}`);
  }
  return normalizePortalEnvelope(response.data);
}

export async function listPortalInstitutionsHttp(
  apiKey: string,
  sessionId: string,
  csrfToken: string,
  baseUrl: string = DEFAULT_API_BASE_URL
): Promise<Record<string, unknown>> {
  const response = await axios.get(`${baseUrl}/api/v1/portal/${sessionId}/institutions`, {
    headers: {
      'x-api-key': apiKey,
      'X-Finatic-Environment': 'sandbox',
      'X-Session-ID': sessionId,
      'x-csrf-token': csrfToken,
      ...DEVICE_HEADERS,
    },
    validateStatus: () => true,
  });
  if (response.status !== 200) {
    throw new Error(`Failed to list portal institutions: ${JSON.stringify(response.data)}`);
  }
  return normalizePortalEnvelope(response.data);
}

async function portalJsonRequest(
  method: 'POST' | 'GET',
  apiKey: string,
  sessionId: string,
  pathSuffix: string,
  csrfToken: string,
  body?: Record<string, unknown>,
  baseUrl: string = DEFAULT_API_BASE_URL
): Promise<Record<string, unknown>> {
  const response = await axios.request({
    method,
    url: `${baseUrl}/api/v1/portal/${sessionId}/${pathSuffix}`,
    data: body,
    headers: {
      'x-api-key': apiKey,
      'X-Finatic-Environment': 'sandbox',
      'X-Session-ID': sessionId,
      'x-csrf-token': csrfToken,
      ...DEVICE_HEADERS,
    },
    validateStatus: () => true,
  });
  if (response.status >= 400) {
    throw new Error(`Portal ${method} ${pathSuffix} failed: ${JSON.stringify(response.data)}`);
  }
  return normalizePortalEnvelope(response.data);
}

export async function createSandboxPortalSession(
  v1: V1Wrapper,
  apiKey: string,
  linkEmail: string,
  baseUrl: string = DEFAULT_API_BASE_URL
): Promise<SandboxPortalSessionContext> {
  const sessionResponse = await v1.startSession();
  const sessionId = sessionResponse.session_id;
  const companyId = sessionResponse.company_id;
  if (!sessionId || !companyId) {
    const error = 'error' in sessionResponse ? sessionResponse.error : null;
    throw new Error(error ?? 'Failed to start sandbox session');
  }
  const csrfToken = await primePortalCsrfToken(apiKey, sessionId, baseUrl);
  v1.setSessionContext(sessionId, companyId, csrfToken);

  const userId = sandboxUserIdFromEmail(linkEmail);
  const linkResponse = await linkPortalUserHttp(apiKey, sessionId, userId, csrfToken, baseUrl);
  if ((linkResponse as { errors?: unknown[] }).errors?.length) {
    throw new Error(JSON.stringify((linkResponse as { errors?: unknown[] }).errors));
  }

  return { sessionId, companyId, csrfToken, userId };
}

function firstPresent(record: Record<string, unknown>, ...keys: string[]): unknown {
  for (const key of keys) {
    if (record[key] !== undefined && record[key] !== null) {
      return record[key];
    }
  }
  return undefined;
}

export async function createSandboxPortalAuthAttempt(
  apiKey: string,
  sessionId: string,
  csrfToken: string,
  providerId: string,
  baseUrl: string = DEFAULT_API_BASE_URL
): Promise<Record<string, unknown>> {
  const response = await portalJsonRequest(
    'POST',
    apiKey,
    sessionId,
    'auth-attempts',
    csrfToken,
    { brokerId: providerId },
    baseUrl
  );
  if ((response as { errors?: unknown[] }).errors?.length) {
    throw new Error(JSON.stringify((response as { errors?: unknown[] }).errors));
  }
  const data = (response as { data?: unknown }).data;
  if (!data || typeof data !== 'object') {
    throw new TypeError(`Unexpected auth attempt payload: ${JSON.stringify(response)}`);
  }
  return data as Record<string, unknown>;
}

export async function createSandboxPortalAccountGrant(
  apiKey: string,
  sessionId: string,
  csrfToken: string,
  authAttempt: Record<string, unknown>,
  baseUrl: string = DEFAULT_API_BASE_URL
): Promise<Record<string, unknown>> {
  const authAttemptId = String(firstPresent(authAttempt, 'id', 'authAttemptId') ?? '');
  const discoveredAccountIds =
    (firstPresent(authAttempt, 'discoveredAccountIds', 'discovered_account_ids') as
      | string[]
      | undefined) ?? [];
  if (!authAttemptId || discoveredAccountIds.length === 0) {
    throw new Error(`Auth attempt missing discovered accounts: ${JSON.stringify(authAttempt)}`);
  }

  const grantResponse = await portalJsonRequest(
    'POST',
    apiKey,
    sessionId,
    'account-grants',
    csrfToken,
    {
      accountId: String(discoveredAccountIds[0]),
      authAttemptId,
      canRead: true,
      canTrade: false,
    },
    baseUrl
  );
  if ((grantResponse as { errors?: unknown[] }).errors?.length) {
    throw new Error(JSON.stringify((grantResponse as { errors?: unknown[] }).errors));
  }
  const data = (grantResponse as { data?: unknown }).data;
  if (!data || typeof data !== 'object') {
    throw new TypeError(`Unexpected grant payload: ${JSON.stringify(grantResponse)}`);
  }
  return data as Record<string, unknown>;
}
