/**
 * FDX v1 sandbox portal smoke — session → institutions → auth-attempt → grant.
 *
 * Requires local finaticAPI + Supabase. Skipped unless FINATIC_INTEGRATION=1.
 */

import { FinaticServer } from '../../src/FinaticServer';
import { defaultConfig } from '../../src/config';
import {
  assertApiReachable,
  bootstrapSandboxApiKey,
  createSandboxPortalAccountGrant,
  createSandboxPortalAuthAttempt,
  createSandboxPortalSession,
  DEFAULT_API_BASE_URL,
  DEVICE_HEADERS,
  integrationEnabled,
} from './helpers/fdx-sandbox';

const describeIntegration = integrationEnabled() ? describe : describe.skip;

describeIntegration('FDX v1 sandbox portal (Node SDK)', () => {
  const linkEmail = 'fdx-node-sdk-smoke@finatic.test';

  it('lists institutions after sandbox session bootstrap', async () => {
    await assertApiReachable();
    const bootstrap = await bootstrapSandboxApiKey();
    const finatic = new FinaticServer(bootstrap.sandboxApiKey, {
      ...defaultConfig,
      baseUrl: DEFAULT_API_BASE_URL,
      apiEnvironment: 'sandbox',
      headers: { ...defaultConfig.headers, ...DEVICE_HEADERS },
    });

    try {
      const { sessionId } = await createSandboxPortalSession(
        finatic.v1,
        bootstrap.sandboxApiKey,
        linkEmail
      );
      const institutionsResponse = await finatic.v1.listPortalInstitutions(sessionId, {
        environment: 'sandbox',
      });
      expect(institutionsResponse.errors).toHaveLength(0);
      const institutions = institutionsResponse.data as unknown;
      expect(Array.isArray(institutions)).toBe(true);
      expect((institutions as unknown[]).length).toBeGreaterThanOrEqual(12);
    } finally {
      await bootstrap.cleanup();
    }
  }, 120_000);

  it('credential broker auth-attempt and account grant (fidelity)', async () => {
    await assertApiReachable();
    const bootstrap = await bootstrapSandboxApiKey();
    const finatic = new FinaticServer(bootstrap.sandboxApiKey, {
      ...defaultConfig,
      baseUrl: DEFAULT_API_BASE_URL,
      apiEnvironment: 'sandbox',
      headers: { ...defaultConfig.headers, ...DEVICE_HEADERS },
    });

    try {
      const { sessionId } = await createSandboxPortalSession(
        finatic.v1,
        bootstrap.sandboxApiKey,
        linkEmail
      );
      const authAttempt = await createSandboxPortalAuthAttempt(finatic.v1, sessionId, 'fidelity');
      expect(['discovered', 'accounts_discovered']).toContain(authAttempt['status']);

      const grant = await createSandboxPortalAccountGrant(finatic.v1, sessionId, authAttempt);
      expect(grant['status']).toBe('active');
      expect(grant['id'] ?? grant['grantId']).toBeTruthy();
    } finally {
      await bootstrap.cleanup();
    }
  }, 120_000);

  it('oauth broker auth-attempt returns redirect state (alpaca)', async () => {
    await assertApiReachable();
    const bootstrap = await bootstrapSandboxApiKey();
    const finatic = new FinaticServer(bootstrap.sandboxApiKey, {
      ...defaultConfig,
      baseUrl: DEFAULT_API_BASE_URL,
      apiEnvironment: 'sandbox',
      headers: { ...defaultConfig.headers, ...DEVICE_HEADERS },
    });

    try {
      const { sessionId } = await createSandboxPortalSession(
        finatic.v1,
        bootstrap.sandboxApiKey,
        linkEmail
      );
      const authAttempt = await createSandboxPortalAuthAttempt(finatic.v1, sessionId, 'alpaca');
      expect(['auth_required', 'redirect_required']).toContain(authAttempt['status']);
      expect(
        authAttempt['callbackState'] ??
          authAttempt['callback_state'] ??
          authAttempt['authorizationUrl'] ??
          authAttempt['authorization_url']
      ).toBeTruthy();
    } finally {
      await bootstrap.cleanup();
    }
  }, 120_000);
});
