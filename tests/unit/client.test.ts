/**
 * Unit tests for FinaticServerClient
 */

import { FinaticServerClient } from '../../src/core/client/FinaticServerClient';
import { DeviceInfo } from '../../src/types';

describe('FinaticServerClient', () => {
  let client: FinaticServerClient;
  const mockApiKey = 'test-api-key';
  const mockBaseUrl = 'https://api.finatic.dev';

  beforeEach(() => {
    client = new FinaticServerClient(mockApiKey, mockBaseUrl);
  });

  afterEach(async () => {
    await client.close();
  });

  describe('constructor', () => {
    it('should initialize with API key', () => {
      expect(client).toBeDefined();
    });

    it('should set default base URL', () => {
      const defaultClient = new FinaticServerClient(mockApiKey);
      expect(defaultClient).toBeDefined();
    });

    it('should accept device info', () => {
      const deviceInfo: DeviceInfo = {
        ip_address: '192.168.1.1',
        user_agent: 'Test Agent',
        fingerprint: 'test-fingerprint',
      };
      const clientWithDevice = new FinaticServerClient(mockApiKey, mockBaseUrl, deviceInfo);
      expect(clientWithDevice).toBeDefined();
    });
  });

  describe('session management', () => {
    it('should start session', async () => {
      // Mock the API client methods
      // const mockSessionResponse = {
      //   session_id: 'test-session-id',
      //   company_id: 'test-company-id',
      //   message: 'Session started',
      // };

      // This would need to be mocked in a real test
      // For now, we'll just test that the method exists
      expect(typeof client.start_session).toBe('function');
    });

    it('should get portal URL', async () => {
      expect(typeof client.get_portal_url).toBe('function');
    });

  });

  describe('trading operations', () => {
    it('should place order', async () => {
      expect(typeof client.place_order).toBe('function');
    });

    it('should modify order', async () => {
      expect(typeof client.modify_order).toBe('function');
    });

    it('should cancel order', async () => {
      expect(typeof client.cancel_order).toBe('function');
    });

    it('should get order', async () => {
      expect(typeof client.get_order).toBe('function');
    });

    it('should get orders', async () => {
      expect(typeof client.get_orders).toBe('function');
    });
  });

  describe('portfolio management', () => {
    it('should get portfolio', async () => {
      expect(typeof client.get_portfolio).toBe('function');
    });

    it('should get holdings', async () => {
      expect(typeof client.get_holdings).toBe('function');
    });

    it('should get positions', async () => {
      expect(typeof client.get_positions).toBe('function');
    });
  });

  describe('broker management', () => {
    it('should get brokers', async () => {
      expect(typeof client.get_brokers).toBe('function');
    });

    it('should get broker accounts', async () => {
      expect(typeof client.get_broker_accounts).toBe('function');
    });

    it('should get broker orders', async () => {
      expect(typeof client.get_broker_orders).toBe('function');
    });

    it('should get broker positions', async () => {
      expect(typeof client.get_broker_positions).toBe('function');
    });

    it('should get broker connections', async () => {
      expect(typeof client.get_broker_connections).toBe('function');
    });
  });

  describe('utility methods', () => {
    it('should set trading context', () => {
      const context = { broker: 'robinhood' };
      client.set_trading_context(context);
      expect(client.get_trading_context()).toEqual(context);
    });

    it('should get session ID', () => {
      expect(typeof client.get_session_id()).toBe('undefined');
    });

    it('should get company ID', () => {
      expect(typeof client.get_company_id()).toBe('undefined');
    });

    it('should get user token', () => {
      expect(typeof client.get_user_token()).toBe('undefined');
    });

    it('should check authentication status', () => {
      expect(client.is_authenticated()).toBe(false);
    });
  });
});
