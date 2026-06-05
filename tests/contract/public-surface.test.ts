/**
 * Contract tests for stable public exports (regen-safe).
 * See docs/sdk-public-api-inventory.md at repo root.
 */
import {
  BrokersWrapper,
  CompanyWrapper,
  FinaticServer,
  SessionWrapper,
  V1Wrapper,
} from '../../src/index';

describe('public surface @finatic/server-node', () => {
  it('exports FinaticServer', () => {
    expect(FinaticServer).toBeDefined();
    expect(typeof FinaticServer).toBe('function');
    expect(FinaticServer.init).toBeDefined();
    expect(typeof FinaticServer.init).toBe('function');
  });

  it('exports domain wrappers', () => {
    expect(BrokersWrapper).toBeDefined();
    expect(CompanyWrapper).toBeDefined();
    expect(SessionWrapper).toBeDefined();
    expect(V1Wrapper).toBeDefined();
  });

  it('exposes account-first v1 facade on the server client', () => {
    const finatic = new FinaticServer('fntc_test_key');

    expect(finatic.v1).toBeDefined();
    expect(typeof finatic.v1.listAccounts).toBe('function');
    expect(typeof finatic.v1.listPositions).toBe('function');
    expect(typeof finatic.v1.createPortalAccountGrant).toBe('function');
  });
});
