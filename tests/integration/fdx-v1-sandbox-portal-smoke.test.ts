/**
 * FDX v1 sandbox portal smoke — portal HTTP against local finaticAPI.
 *
 * Portal auth flows use direct HTTP (FinaticConnect surface). The server SDK is
 * used only for session creation.
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
  listPortalInstitutionsHttp,
} from './helpers/fdx-sandbox';

const describeIntegration = integrationEnabled() ? describe : describe.skip;

const EXPECTED_SANDBOX_PROVIDER_IDS = [
  'alpaca',
  'etoro',
  'interactive_brokers',
  'mt4',
  'mt5',
  'ninja_trader',
  'robinhood',
  'tasty_trade',
  'tradestation',
  'trading212',
  'webull',
];

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
      const portalContext = await createSandboxPortalSession(
        finatic.v1,
        bootstrap.sandboxApiKey,
        linkEmail
      );
      const institutionsResponse = await listPortalInstitutionsHttp(
        bootstrap.sandboxApiKey,
        portalContext.sessionId,
        portalContext.csrfToken
      );
      expect((institutionsResponse as { errors?: unknown[] }).errors ?? []).toHaveLength(0);
      const institutions = (institutionsResponse as { data?: unknown }).data;
      expect(Array.isArray(institutions)).toBe(true);
      const providerIds = (institutions as Array<{ brokerId: string }>)
        .map(({ brokerId }) => brokerId)
        .sort();
      expect(providerIds).toEqual(EXPECTED_SANDBOX_PROVIDER_IDS);
      expect(providerIds).not.toContain('fidelity');
    } finally {
      await bootstrap.cleanup();
    }
  }, 120_000);

  it('credential broker auth-attempt and account grant (robinhood)', async () => {
    await assertApiReachable();
    const bootstrap = await bootstrapSandboxApiKey();
    const finatic = new FinaticServer(bootstrap.sandboxApiKey, {
      ...defaultConfig,
      baseUrl: DEFAULT_API_BASE_URL,
      apiEnvironment: 'sandbox',
      headers: { ...defaultConfig.headers, ...DEVICE_HEADERS },
    });

    try {
      const portalContext = await createSandboxPortalSession(
        finatic.v1,
        bootstrap.sandboxApiKey,
        linkEmail
      );
      const authAttempt = await createSandboxPortalAuthAttempt(
        bootstrap.sandboxApiKey,
        portalContext.sessionId,
        portalContext.csrfToken,
        'robinhood'
      );
      expect(['discovered', 'accounts_discovered']).toContain(authAttempt['status']);

      const grant = await createSandboxPortalAccountGrant(
        bootstrap.sandboxApiKey,
        portalContext.sessionId,
        portalContext.csrfToken,
        authAttempt
      );
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
      const portalContext = await createSandboxPortalSession(
        finatic.v1,
        bootstrap.sandboxApiKey,
        linkEmail
      );
      const authAttempt = await createSandboxPortalAuthAttempt(
        bootstrap.sandboxApiKey,
        portalContext.sessionId,
        portalContext.csrfToken,
        'alpaca'
      );
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
