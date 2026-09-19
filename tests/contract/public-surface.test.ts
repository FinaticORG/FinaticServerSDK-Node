/**
 * Contract tests for stable public exports.
 */
import { FinaticServer, V1Wrapper } from '../../src/index';
import {
  FDXFutureInstrumentDetailsIdentityQualityEnum,
  FDXInstrumentDescriptorVersionEnum,
} from '../../src/index';
import type {
  AccountOrderCommandRequest,
  FDXBrokerOrder,
  FDXBrokerOrderEvent,
  FDXBrokerOrderFill,
  FDXBrokerPosition,
  FDXBrokerPositionLot,
  FDXBrokerPositionLotFill,
  FDXInstrumentDescriptor,
} from '../../src/index';

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
    expect(typeof (finatic as unknown as Record<string, unknown>)['startSession']).toBe(
      'undefined'
    );
  });

  it('does not expose legacy broker connection methods on the root client', () => {
    const finatic = new FinaticServer('fntc_test_key') as unknown as Record<string, unknown>;
    expect(finatic['getBrokerConnections']).toBeUndefined();
    expect(finatic['getAllOrders']).toBeUndefined();
    expect(finatic['getSessionId']).toBeUndefined();
    expect(finatic['isAuthed']).toBeUndefined();
  });

  it('exports the stable exact-instrument contract without beta clients', () => {
    const descriptor: FDXInstrumentDescriptor = {
      assetType: 'FUTURE',
      displaySymbol: 'MGCZ6',
      finaticInstrumentId: 'finatic:future:MGCZ6',
      version: FDXInstrumentDescriptorVersionEnum._10,
      future: {
        contractCode: 'MGCZ6',
        identityQuality: FDXFutureInstrumentDetailsIdentityQualityEnum.Exact,
        productRoot: 'MGC',
      },
    };
    const typeSurface: [
      AccountOrderCommandRequest?,
      FDXBrokerOrder?,
      FDXBrokerOrderEvent?,
      FDXBrokerOrderFill?,
      FDXBrokerPosition?,
      FDXBrokerPositionLot?,
      FDXBrokerPositionLotFill?,
    ] = [];

    expect(descriptor.future?.contractCode).toBe('MGCZ6');
    expect(typeSurface).toEqual([]);
    expect((FinaticServer as unknown as Record<string, unknown>)['BrokersApi']).toBeUndefined();
  });
});
