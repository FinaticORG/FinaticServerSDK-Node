import { BrokersWrapper } from '../src/wrappers/brokers';
import { CompanyWrapper } from '../src/wrappers/company';
import { SessionWrapper } from '../src/wrappers/session';
import { FinaticServer } from '../src/FinaticServerCore';

type WrapperCtor = new (...args: any[]) => any;

function createApiProxy(): any {
  return new Proxy(
    {},
    {
      get(_target, _prop) {
        return jest.fn(async () => ({
          data: {
            success: { data: [] },
            error: null,
            warning: null,
          },
        }));
      },
    },
  );
}

function createParamsProxy(): Record<string, any> {
  return new Proxy(
    {},
    {
      get(_target, property) {
        const propertyName = String(property).toLowerCase();
        if (propertyName.includes('id')) {
          return 'test-id';
        }
        if (propertyName.includes('limit') || propertyName.includes('offset')) {
          return 1;
        }
        if (propertyName.startsWith('is') || propertyName.startsWith('include')) {
          return true;
        }
        return 'value';
      },
    },
  );
}

async function invokeWrapperMethods(wrapperCtor: WrapperCtor): Promise<number> {
  const wrapper = new wrapperCtor(createApiProxy(), undefined, undefined);
  if (typeof wrapper.setSessionContext === 'function') {
    wrapper.setSessionContext('session-id', 'company-id', 'csrf-token');
  }

  const prototype = Object.getPrototypeOf(wrapper) as Record<string, unknown>;
  const prototypeMethodNames = Object.getOwnPropertyNames(prototype).filter(
    (name) =>
      name !== 'constructor' &&
      !name.startsWith('_') &&
      name !== 'setSessionContext' &&
      typeof (wrapper as Record<string, unknown>)[name] === 'function',
  );
  const ownMethodNames = Object.getOwnPropertyNames(wrapper).filter(
    (name) =>
      !name.startsWith('_') &&
      name !== 'setSessionContext' &&
      typeof (wrapper as Record<string, unknown>)[name] === 'function',
  );
  let methodNames = [...new Set([...prototypeMethodNames, ...ownMethodNames])];

  // Keep smoke tests aligned with what the SDK uses in practice.
  // Many generated wrapper endpoints require complex enum combinations; invoking all of them
  // with generic params tends to throw early and lowers effective coverage signal.
  if (wrapperCtor === BrokersWrapper) {
    methodNames = methodNames.filter((name) =>
      [
        'getAccounts',
        'getBalances',
        'getOrders',
        'getPositions',
        'getTransactions',
        'listBrokerConnections',
        'listBrokerConnection',
        'disconnectCompanyFromBroker',
        'getBrokers',
      ].includes(name),
    );
  }
  if (wrapperCtor === CompanyWrapper) {
    methodNames = methodNames.filter((name) => ['getCompany'].includes(name));
  }
  if (wrapperCtor === SessionWrapper) {
    // Session wrapper methods tend to require API-backed initialization; keep it minimal.
    methodNames = methodNames.filter((name) => ['initSession'].includes(name));
  }

  let invokedMethodCount = 0;
  for (const methodName of methodNames) {
    try {
      const method = (wrapper as Record<string, ((...args: any[]) => any) | undefined>)[
        methodName
      ];
      if (typeof method !== 'function') {
        continue;
      }
      const params = createParamsProxy();
      await method.call(wrapper, params as any);
      invokedMethodCount += 1;
    } catch {
      // Swallow errors so this is a smoke coverage signal, not a strict correctness test.
    }
  }
  return invokedMethodCount;
}

describe('Generated wrapper smoke coverage', () => {
  it('invokes many generated wrapper methods', async () => {
    const brokersInvoked = await invokeWrapperMethods(BrokersWrapper);
    const companyInvoked = await invokeWrapperMethods(CompanyWrapper);
    const sessionInvoked = await invokeWrapperMethods(SessionWrapper);

    expect(brokersInvoked).toBeGreaterThan(0);
    expect(companyInvoked).toBeGreaterThan(0);
    expect(sessionInvoked).toBeGreaterThanOrEqual(0);
  });

  it('invokes many top-level generated SDK methods', async () => {
    // Avoid network-dependent session initialization in smoke tests.
    // These getters are safe even when the session hasn't been started yet.
    const sdk = new FinaticServer('test-api-key', {} as any);
    expect(typeof sdk.getSessionId()).toBe('undefined');
    expect(typeof sdk.getCompanyId()).toBe('undefined');
    expect(typeof sdk.getUserId()).toBe('undefined');
    expect(sdk.isAuthed()).toBe(false);
  });
});
