/**
 * Integration tests for trading operations
 */

import { FinaticServerClient } from '../../src/core/client/FinaticServerClient';
import { DeviceInfo } from '../../src/types';
import * as authFixtures from '../fixtures/auth-responses';
import * as portfolioFixtures from '../fixtures/portfolio-responses';

// Mock axios for integration tests
jest.mock('axios');
const mockedAxios = require('axios');

describe('Trading Operations Integration Tests', () => {
  let client: FinaticServerClient;
  let mockAxiosInstance: any;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Create mock axios instance
    mockAxiosInstance = {
      request: jest.fn(),
      interceptors: {
        request: { use: jest.fn() },
        response: { use: jest.fn() },
      },
    };
    
    mockedAxios.create.mockReturnValue(mockAxiosInstance);
    
    const deviceInfo: DeviceInfo = {
      device_id: 'test-device-123',
      device_type: 'server',
      os: 'linux',
      os_version: '5.4.0',
      app_version: '1.0.0',
    };

    client = new FinaticServerClient('https://api.finatic.com', 'test-api-key', deviceInfo);
    
    // Set up authenticated state
    client['userToken'] = authFixtures.mockUserToken;
    client['sessionId'] = 'test-session-123';
    client['companyId'] = 'test-company-456';
  });

  describe('Order Placement', () => {
    it('should place a market order successfully', async () => {
      mockAxiosInstance.request.mockResolvedValue({
        data: portfolioFixtures.mockOrderResponse,
      });

      const order = {
        symbol: 'AAPL',
        quantity: 10,
        side: 'buy',
        order_type: 'market',
        time_in_force: 'day',
      };

      const result = await client.place_order(order);

      expect(result.order_id).toBe('order-123');
      expect(result.status).toBe('Filled');
      expect(result.symbol).toBe('AAPL');
    });

    it('should place a limit order successfully', async () => {
      mockAxiosInstance.request.mockResolvedValue({
        data: portfolioFixtures.mockOrderResponse,
      });

      const result = await client.place_stock_limit_order('AAPL', 10, 'buy', 150.00);

      expect(result.order_id).toBe('order-123');
      expect(result.symbol).toBe('AAPL');
    });

    it('should place a stop order successfully', async () => {
      mockAxiosInstance.request.mockResolvedValue({
        data: portfolioFixtures.mockOrderResponse,
      });

      const result = await client.place_stock_stop_order('AAPL', 10, 'sell', 140.00);

      expect(result.order_id).toBe('order-123');
      expect(result.symbol).toBe('AAPL');
    });
  });

  describe('Order Management', () => {
    it('should cancel an order successfully', async () => {
      const cancelledOrder = { ...portfolioFixtures.mockOrderResponse, status: 'Cancelled' };
      mockAxiosInstance.request.mockResolvedValue({
        data: cancelledOrder,
      });

      const result = await client.cancel_order('order-123');

      expect(result.status).toBe('Cancelled');
    });

    it('should modify an order successfully', async () => {
      const modifiedOrder = { ...portfolioFixtures.mockOrderResponse, price: 160.00 };
      mockAxiosInstance.request.mockResolvedValue({
        data: modifiedOrder,
      });

      const modifications = {
        price: 160.00,
        quantity: 15,
      };

      const result = await client.modify_order('order-123', modifications);

      expect(result.price).toBe(160.00);
    });

    it('should get order details successfully', async () => {
      mockAxiosInstance.request.mockResolvedValue({
        data: portfolioFixtures.mockBrokerOrder,
      });

      const result = await client.get_order('order-123');

      expect(result.order_id).toBe('order-123');
      expect(result.symbol).toBe('AAPL');
    });
  });

  describe('Portfolio Operations', () => {
    it('should get portfolio information successfully', async () => {
      mockAxiosInstance.request.mockResolvedValue({
        data: { data: portfolioFixtures.mockPortfolio },
      });

      const result = await client.get_portfolio();

      expect(result.total_value).toBe(100000.00);
      expect(result.holdings).toHaveLength(1);
    });

    it('should get holdings successfully', async () => {
      mockAxiosInstance.request.mockResolvedValue({
        data: { data: [portfolioFixtures.mockHolding] },
      });

      const result = await client.get_holdings();

      expect(result).toHaveLength(1);
      expect(result[0]?.symbol).toBe('AAPL');
    });

    it('should get broker list successfully', async () => {
      mockAxiosInstance.request.mockResolvedValue({
        data: [portfolioFixtures.mockBrokerInfo],
      });

      const result = await client.get_broker_list();

      expect(result).toHaveLength(1);
      expect(result[0]?.broker_id).toBe('robinhood');
    });
  });

  describe('Trading Context Management', () => {
    it('should set and manage trading context', () => {
      // Set broker and account
      client.set_broker('etrade');
      client.set_account('987654321', 'account-456');

      const context = client.get_trading_context();
      expect(context.broker).toBe('etrade');
      expect(context.account_number).toBe('987654321');
      expect(context.account_id).toBe('account-456');

      // Clear context
      client.clear_trading_context();
      const clearedContext = client.get_trading_context();
      expect(clearedContext.broker).toBeUndefined();
      expect(clearedContext.account_number).toBeUndefined();
    });
  });

  describe('Pagination Operations', () => {
    it('should handle paginated broker accounts', async () => {
      const mockResponse = {
        data: [portfolioFixtures.mockBrokerAccount],
        pagination: {
          current_offset: 0,
          limit: 100,
          total_count: 1,
          has_next: false,
          has_previous: false,
        },
      };

      mockAxiosInstance.request.mockResolvedValue({
        data: mockResponse,
      });

      const result = await client.get_broker_accounts(1, 100);

      expect(result).toHaveLength(1);
    });

    it('should get all broker accounts across pages', async () => {
      const mockResponse1 = {
        data: [portfolioFixtures.mockBrokerAccount],
        pagination: {
          current_offset: 0,
          limit: 100,
          total_count: 2,
          has_next: true,
          has_previous: false,
        },
      };

      const mockResponse2 = {
        data: [{ ...portfolioFixtures.mockBrokerAccount, account_id: 'account-456' }],
        pagination: {
          current_offset: 100,
          limit: 100,
          total_count: 2,
          has_next: false,
          has_previous: true,
        },
      };

      mockAxiosInstance.request
        .mockResolvedValueOnce({ data: mockResponse1 })
        .mockResolvedValueOnce({ data: mockResponse2 });

      const result = await client.get_all_broker_accounts();

      expect(result).toHaveLength(2);
      expect(result[0]?.account_id).toBe('account-123');
      expect(result[1]?.account_id).toBe('account-456');
    });
  });

  describe('Error Handling', () => {
    it('should handle order placement errors', async () => {
      mockAxiosInstance.request.mockRejectedValue({
        response: {
          status: 400,
          data: { message: 'Insufficient funds' },
        },
      });

      const order = {
        symbol: 'AAPL',
        quantity: 1000,
        side: 'buy',
        order_type: 'market',
      };

      await expect(client.place_order(order)).rejects.toThrow();
    });

    it('should handle authentication errors', async () => {
      // Clear authentication state
      (client as any)['userToken'] = undefined;
      (client as any)['sessionId'] = undefined;

      const order = {
        symbol: 'AAPL',
        quantity: 10,
        side: 'buy',
      };

      await expect(client.place_order(order)).rejects.toThrow('Not authenticated');
    });
  });
});
