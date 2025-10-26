/**
 * Unit tests for FinaticServerClient
 */

import { FinaticServerClient } from '../../src/core/client/FinaticServerClient';
import { ApiClient, AuthenticationError } from '../../src/core/client/ApiClient';
import { DeviceInfo } from '../../src/types';
import * as authFixtures from '../fixtures/auth-responses';
import * as portfolioFixtures from '../fixtures/portfolio-responses';

// Mock ApiClient
jest.mock('../../src/core/client/ApiClient');
const MockedApiClient = ApiClient as jest.MockedClass<typeof ApiClient>;

describe('FinaticServerClient', () => {
  let client: FinaticServerClient;
  let mockApiClient: jest.Mocked<ApiClient>;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Create mock ApiClient instance
    mockApiClient = {
      startSession: jest.fn(),
      requestOtp: jest.fn(),
      verifyOtp: jest.fn(),
      authenticateSession: jest.fn(),
      getPortalUrl: jest.fn(),
      getPortfolio: jest.fn(),
      getHoldings: jest.fn(),
      getBrokers: jest.fn(),
      getBrokerAccounts: jest.fn(),
      getBrokerOrders: jest.fn(),
      getBrokerPositions: jest.fn(),
      getBrokerConnections: jest.fn(),
      placeOrder: jest.fn(),
      modifyOrder: jest.fn(),
      cancelOrder: jest.fn(),
      getOrder: jest.fn(),
      getOrders: jest.fn(),
      placeStockMarketOrder: jest.fn(),
      placeStockLimitOrder: jest.fn(),
      placeStockStopOrder: jest.fn(),
      getHoldingsAuto: jest.fn(),
      getPortfolioAuto: jest.fn(),
      getBrokerListAuto: jest.fn(),
      getBrokerConnectionsAuto: jest.fn(),
      setBroker: jest.fn(),
      setAccount: jest.fn(),
      getValidAccessToken: jest.fn(),
      getTokenInfo: jest.fn(),
      setTokenInfo: jest.fn(),
      setSessionId: jest.fn(),
      request: jest.fn(),
    } as any;

    MockedApiClient.mockImplementation(() => mockApiClient);

    const deviceInfo: DeviceInfo = {
      device_id: 'test-device-123',
      device_type: 'server',
      os: 'linux',
      os_version: '5.4.0',
      app_version: '1.0.0',
    };

    client = new FinaticServerClient('https://api.finatic.com', 'test-api-key', deviceInfo);
  });

  describe('constructor', () => {
    it('should initialize with correct parameters', () => {
      expect(client).toBeDefined();
      expect(MockedApiClient).toHaveBeenCalledWith(
        'https://api.finatic.com',
        'test-api-key',
        expect.any(Object),
        expect.any(Object)
      );
    });
  });

  describe('authentication methods', () => {
    describe('startSession', () => {
      it('should start session successfully', async () => {
        mockApiClient.startSession.mockResolvedValue(authFixtures.mockSessionInitResponse);

        const result = await client.start_session('test-company-456');

        expect(result).toEqual(authFixtures.mockSessionInitResponse);
        expect(mockApiClient.startSession).toHaveBeenCalledWith('test-api-key');
        expect(client.get_session_id()).toBe('test-session-123');
        expect(client.get_company_id()).toBe('test-company-456');
      });
    });

    describe('requestOtp', () => {
      it('should request OTP successfully', async () => {
        mockApiClient.requestOtp.mockResolvedValue(authFixtures.mockOtpRequestResponse);

        const result = await client.request_otp('test@example.com');

        expect(result).toEqual(authFixtures.mockOtpRequestResponse);
        expect(mockApiClient.requestOtp).toHaveBeenCalledWith('test@example.com');
      });
    });

    describe('verifyOtp', () => {
      it('should verify OTP successfully', async () => {
        mockApiClient.verifyOtp.mockResolvedValue(authFixtures.mockOtpVerifyResponse);

        const result = await client.verify_otp('123456');

        expect(result).toEqual(authFixtures.mockOtpVerifyResponse);
        expect(mockApiClient.verifyOtp).toHaveBeenCalledWith('123456');
      });
    });

    describe('authenticateDirectly', () => {
      it('should authenticate directly successfully', async () => {
        mockApiClient.authenticateSession.mockResolvedValue(authFixtures.mockSessionAuthenticateResponse);

        const result = await client.authenticate_directly('test-company-456');

        expect(result).toEqual(authFixtures.mockSessionAuthenticateResponse);
        expect(mockApiClient.authenticateSession).toHaveBeenCalledWith('test-company-456');
        expect(client.get_user_token()).toEqual(authFixtures.mockUserToken);
        expect(client.get_session_id()).toBe('test-session-123');
        expect(client.get_company_id()).toBe('test-company-456');
      });
    });

    describe('getPortalUrl', () => {
      it('should get portal URL successfully', async () => {
        mockApiClient.getPortalUrl.mockResolvedValue(authFixtures.mockPortalUrlResponse);

        const result = await client.get_portal_url();

        expect(result).toEqual(authFixtures.mockPortalUrlResponse);
        expect(mockApiClient.getPortalUrl).toHaveBeenCalled();
      });
    });

  });

  describe('portfolio methods', () => {
    beforeEach(() => {
      // Set up authenticated state
      client['userToken'] = authFixtures.mockUserToken;
      client['sessionId'] = 'test-session-123';
      client['companyId'] = 'test-company-456';
    });

    describe('getPortfolio', () => {
      it('should get portfolio successfully', async () => {
        mockApiClient.getPortfolio.mockResolvedValue(portfolioFixtures.mockPortfolio);

        const result = await client.get_portfolio();

        expect(result).toEqual(portfolioFixtures.mockPortfolio);
        expect(mockApiClient.getPortfolio).toHaveBeenCalled();
      });
    });

    describe('getHoldings', () => {
      it('should get holdings successfully', async () => {
        mockApiClient.getHoldings.mockResolvedValue([portfolioFixtures.mockHolding]);

        const result = await client.get_holdings();

        expect(result).toEqual([portfolioFixtures.mockHolding]);
        expect(mockApiClient.getHoldings).toHaveBeenCalled();
      });
    });

    describe('getBrokerList', () => {
      it('should get broker list successfully', async () => {
        mockApiClient.getBrokers.mockResolvedValue([portfolioFixtures.mockBrokerInfo]);

        const result = await client.get_broker_list();

        expect(result).toEqual([portfolioFixtures.mockBrokerInfo]);
        expect(mockApiClient.getBrokers).toHaveBeenCalled();
      });
    });
  });

  describe('trading methods', () => {
    beforeEach(() => {
      client['userToken'] = authFixtures.mockUserToken;
      client['sessionId'] = 'test-session-123';
      client['companyId'] = 'test-company-456';
    });

    describe('place_order', () => {
      it('should place order successfully', async () => {
        mockApiClient.placeOrder.mockResolvedValue(portfolioFixtures.mockOrderResponse);

        const order = {
          symbol: 'AAPL',
          quantity: 10,
          side: 'buy',
          order_type: 'market',
          time_in_force: 'day',
        };

        const result = await client.place_order(order);

        expect(result).toEqual(portfolioFixtures.mockOrderResponse);
        expect(mockApiClient.placeOrder).toHaveBeenCalledWith(
          expect.objectContaining({
            symbol: 'AAPL',
            order_qty: 10,
            action: 'Buy',
            order_type: 'Market',
          }),
          undefined
        );
      });

      it('should throw AuthenticationError when not authenticated', async () => {
        (client as any)['userToken'] = undefined;
        (client as any)['sessionId'] = undefined;

        const order = {
          symbol: 'AAPL',
          quantity: 10,
          side: 'buy',
        };

        await expect(client.place_order(order)).rejects.toThrow(AuthenticationError);
      });
    });

    describe('place_stock_market_order', () => {
      it('should place stock market order successfully', async () => {
        mockApiClient.placeStockMarketOrder.mockResolvedValue(portfolioFixtures.mockOrderResponse);

        const result = await client.place_stock_market_order('AAPL', 10, 'buy');

        expect(result).toEqual(portfolioFixtures.mockOrderResponse);
        expect(mockApiClient.placeStockMarketOrder).toHaveBeenCalledWith('AAPL', 10, 'buy', undefined, undefined);
      });
    });

    describe('place_stock_limit_order', () => {
      it('should place stock limit order successfully', async () => {
        mockApiClient.placeStockLimitOrder.mockResolvedValue(portfolioFixtures.mockOrderResponse);

        const result = await client.place_stock_limit_order('AAPL', 10, 'buy', 150.00);

        expect(result).toEqual(portfolioFixtures.mockOrderResponse);
        expect(mockApiClient.placeStockLimitOrder).toHaveBeenCalledWith('AAPL', 10, 'buy', 150.00, 'gtc', undefined, undefined);
      });
    });

    describe('cancel_order', () => {
      it('should cancel order successfully', async () => {
        mockApiClient.cancelOrder.mockResolvedValue({ ...portfolioFixtures.mockOrderResponse, status: 'Cancelled' });

        const result = await client.cancel_order('order-123');

        expect(result.status).toBe('Cancelled');
        expect(mockApiClient.cancelOrder).toHaveBeenCalledWith('order-123');
      });
    });
  });


  describe('utility methods', () => {
    it('should get user ID', () => {
      client['userToken'] = authFixtures.mockUserToken;
      expect(client.get_user_id()).toBe('user-123');
    });

    it('should get session ID', () => {
      client['sessionId'] = 'test-session-123';
      expect(client.get_session_id()).toBe('test-session-123');
    });

    it('should get company ID', () => {
      client['companyId'] = 'test-company-456';
      expect(client.get_company_id()).toBe('test-company-456');
    });

    it('should check if authenticated', () => {
      expect(client.is_authenticated()).toBe(false);
      
      client['userToken'] = authFixtures.mockUserToken;
      client['sessionId'] = 'test-session-123';
      
      expect(client.is_authenticated()).toBe(true);
    });

    it('should check if authed with valid tokens', () => {
      mockApiClient.getTokenInfo.mockReturnValue({
        access_token: 'test-access-token',
        refresh_token: 'test-refresh-token',
        expires_at: '2024-12-31T23:59:59Z',
        user_id: 'user-123',
      });

      expect(client.is_authed()).toBe(true);
    });

    it('should check if authed with expired tokens', () => {
      const expiredTime = new Date(Date.now() - 1000).toISOString();
      mockApiClient.getTokenInfo.mockReturnValue({
        access_token: 'test-access-token',
        refresh_token: 'test-refresh-token',
        expires_at: expiredTime,
        user_id: 'user-123',
      });

      expect(client.is_authed()).toBe(false);
    });
  });

  describe('pagination methods', () => {
    beforeEach(() => {
      client['userToken'] = authFixtures.mockUserToken;
      client['sessionId'] = 'test-session-123';
      client['companyId'] = 'test-company-456';
    });

    describe('get_broker_accounts', () => {
      it('should get broker accounts with pagination', async () => {
        mockApiClient.getBrokerAccounts.mockResolvedValue([portfolioFixtures.mockBrokerAccount]);

        const result = await client.get_broker_accounts(1, 100);

        expect(result).toEqual([portfolioFixtures.mockBrokerAccount]);
        expect(mockApiClient.getBrokerAccounts).toHaveBeenCalled();
      });
    });

    describe('get_all_broker_accounts', () => {
      it('should get all broker accounts across pages', async () => {

        mockApiClient.getBrokerAccounts
          .mockResolvedValueOnce([portfolioFixtures.mockBrokerAccount])
          .mockResolvedValueOnce([portfolioFixtures.mockBrokerAccount2]);

        const result = await client.get_all_broker_accounts();

        expect(result).toHaveLength(2);
        expect(result[0]?.account_id).toBe('account-123');
        expect(result[1]?.account_id).toBe('account-456');
      });
    });
  });
});
