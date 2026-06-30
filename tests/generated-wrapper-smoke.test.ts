import { FinaticServer } from '../src/FinaticServerCore';
import { V1Wrapper } from '../src/wrappers/v1';

describe('v1 wrapper smoke coverage', () => {
  it('constructs FinaticServer and v1 without legacy broker methods', () => {
    const finatic = new FinaticServer('test-api-key', {} as any);
    expect(finatic.v1).toBeInstanceOf(V1Wrapper);
    expect(typeof finatic.v1.listAccounts).toBe('function');
    expect(typeof finatic.v1.listBalances).toBe('function');
    expect(typeof finatic.v1.listPositions).toBe('function');
    expect('getBrokerConnections' in finatic).toBe(false);
  });

  it('exposes session getters on v1 before start', () => {
    const sdk = new FinaticServer('test-api-key', {} as any);
    expect(typeof sdk.v1.getSessionId()).toBe('undefined');
    expect(typeof sdk.v1.getCompanyId()).toBe('undefined');
    expect(typeof sdk.v1.getUserId()).toBe('undefined');
    expect(sdk.v1.isAuthed()).toBe(false);
    expect(typeof sdk.v1.startSession).toBe('function');
  });
});
