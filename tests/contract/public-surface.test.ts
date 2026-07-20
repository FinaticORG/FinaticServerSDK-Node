/**
 * Contract tests for stable public exports.
 */
import { FinaticServer, V1Wrapper } from '../../src/index';

describe('public surface @finatic/server-node', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('exports FinaticServer', () => {
    expect(FinaticServer).toBeDefined();
    expect(typeof FinaticServer).toBe('function');
    expect(FinaticServer.init).toBeDefined();
    expect(typeof FinaticServer.init).toBe('function');
  });

  it('exports V1Wrapper for account-first data access', () => {
    expect(V1Wrapper).toBeDefined();
  });

  it('exposes versioned v1 API including session and account data', () => {
    const finatic = new FinaticServer('fntc_test_key');

    expect(finatic.v1).toBeDefined();
    expect(typeof finatic.v1.startSession).toBe('function');
    expect(typeof finatic.v1.getPortalUrl).toBe('function');
    expect(typeof finatic.v1.listAccounts).toBe('function');
    expect(typeof finatic.v1.listBalances).toBe('function');
    expect(typeof finatic.v1.listPositions).toBe('function');
    expect(typeof finatic.v1.listAccountGrants).toBe('function');
    expect(typeof (finatic as unknown as Record<string, unknown>)['startSession']).toBe('undefined');
  });

  it('does not expose legacy broker connection methods on the root client', () => {
    const finatic = new FinaticServer('fntc_test_key') as unknown as Record<string, unknown>;
    expect(finatic['getBrokerConnections']).toBeUndefined();
    expect(finatic['getAllOrders']).toBeUndefined();
    expect(finatic['getSessionId']).toBeUndefined();
    expect(finatic['isAuthed']).toBeUndefined();
  });
});
