/**
 * Contract tests for stable public exports.
 */
import { FinaticServer, V1Wrapper } from '../../src/index';
import {
  FDXFutureInstrumentDetailsIdentityQualityEnum,
  FDXInstrumentDescriptorVersionEnum,
} from '../../src/index';
import type {
  AccountOrderCommandBody,
  AccountOrderCommandRequest,
  FDXOrderLeg,
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

  it('keeps legacy flat commands while rejecting invalid exact-instrument declarations', () => {
    const legacyBody: AccountOrderCommandBody = {
      symbol: 'AAPL',
      side: 'buy',
      quantity: 1,
    };
    const typedBody: AccountOrderCommandBody = {
      order: {
        finaticInstrumentId: 'finatic:future:MGCZ6',
        instrumentId: 418,
        positionIntent: 'BUY_TO_OPEN',
      },
    };
    const validPositionIntent: NonNullable<FDXOrderLeg['positionIntent']> = 'SELL_TO_CLOSE';

    const invalidInstrumentId: AccountOrderCommandBody = {
      order: {
        // @ts-expect-error provider-native instrument ids are strings or numbers
        instrumentId: true,
      },
    };
    // @ts-expect-error position intent is limited to the published lifecycle union
    const invalidPositionIntent: NonNullable<FDXOrderLeg['positionIntent']> = 'OPEN';

    expect(legacyBody).toMatchObject({ symbol: 'AAPL' });
    expect(typedBody).toMatchObject({ order: { instrumentId: 418 } });
    expect(validPositionIntent).toBe('SELL_TO_CLOSE');
    expect(invalidInstrumentId).toBeDefined();
    expect(invalidPositionIntent).toBe('OPEN');
  });
});
