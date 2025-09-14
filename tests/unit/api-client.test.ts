/**
 * Unit tests for ApiClient
 */

import { ApiClient, ApiError, AuthenticationError, ValidationError } from '../../src/core/client/ApiClient';
import { DeviceInfo } from '../../src/types';
import * as authFixtures from '../fixtures/auth-responses';
import * as portfolioFixtures from '../fixtures/portfolio-responses';

// Mock axios
jest.mock('axios');
const mockedAxios = require('axios');

describe('ApiClient', () => {
  let apiClient: ApiClient;
  let mockAxiosInstance: any;

  beforeEach(() => {
    // Reset mocks
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
    
    // Create ApiClient instance
    const deviceInfo: DeviceInfo = {
      ip_address: '192.168.1.1',
      user_agent: 'FinaticServerSDK-Node/1.0.0',
      fingerprint: 'test-device-123',
    };
    
    apiClient = new ApiClient('https://api.finatic.com', deviceInfo);
  });

  describe('constructor', () => {
    it('should initialize with correct parameters', () => {
      expect(apiClient).toBeDefined();
      expect(mockedAxios.create).toHaveBeenCalledWith({
        baseURL: 'https://api.finatic.com/api/v1',
        timeout: 30000,
        headers: {
          'Content-Type': 'application/json',
        },
      });
    });
  });

  describe('authentication methods', () => {
    describe('startSession', () => {
      it('should start a session successfully', async () => {
        const mockResponse = {
          data: authFixtures.mockSessionInitResponse,
        };
        mockAxiosInstance.request.mockResolvedValue(mockResponse);

        const result = await apiClient.startSession('test-api-key');

        expect(result).toEqual(authFixtures.mockSessionInitResponse);
        expect(mockAxiosInstance.request).toHaveBeenCalledWith({
          method: 'POST',
          url: '/auth/session/init',
          data: { api_key: 'test-api-key' },
        });
      });

      it('should handle session start errors', async () => {
        const mockError = {
          response: {
            status: 400,
            data: { message: 'Invalid API key' },
          },
        };
        mockAxiosInstance.request.mockRejectedValue(mockError);

        await expect(apiClient.startSession('invalid-key')).rejects.toThrow(ApiError);
      });
    });

    describe('requestOtp', () => {
      it('should request OTP successfully', async () => {
        const mockResponse = {
          data: authFixtures.mockOtpRequestResponse,
        };
        mockAxiosInstance.request.mockResolvedValue(mockResponse);

        const result = await apiClient.requestOtp('+1234567890');

        expect(result).toEqual(authFixtures.mockOtpRequestResponse);
        expect(mockAxiosInstance.request).toHaveBeenCalledWith({
          method: 'POST',
          url: '/auth/session/otp/request',
          data: { phone_number: '+1234567890' },
        });
      });
    });

    describe('verifyOtp', () => {
      it('should verify OTP successfully', async () => {
        const mockResponse = {
          data: authFixtures.mockOtpVerifyResponse,
        };
        mockAxiosInstance.request.mockResolvedValue(mockResponse);

        const result = await apiClient.verifyOtp('123456');

        expect(result).toEqual(authFixtures.mockOtpVerifyResponse);
        expect(mockAxiosInstance.request).toHaveBeenCalledWith({
          method: 'POST',
          url: '/auth/session/otp/verify',
          data: { otp_code: '123456' },
        });
      });
    });

    describe('authenticateSession', () => {
      it('should authenticate session successfully', async () => {
        const mockResponse = {
          data: authFixtures.mockSessionAuthenticateResponse,
        };
        mockAxiosInstance.request.mockResolvedValue(mockResponse);

        const result = await apiClient.authenticateSession('one-time-token');

        expect(result).toEqual(authFixtures.mockSessionAuthenticateResponse);
        expect(mockAxiosInstance.request).toHaveBeenCalledWith({
          method: 'POST',
          url: '/auth/session/authenticate',
          data: { one_time_token: 'one-time-token' },
        });
      });
    });
  });

  describe('portfolio methods', () => {
    beforeEach(() => {
      // Set up token info for authenticated requests
      apiClient.setTokenInfo({
        access_token: 'test-access-token',
        refresh_token: 'test-refresh-token',
        expires_at: '2024-12-31T23:59:59Z',
        user_id: 'user-123',
      });
    });

    describe('getPortfolio', () => {
      it('should get portfolio successfully', async () => {
        const mockResponse = {
          data: { data: portfolioFixtures.mockPortfolio },
        };
        mockAxiosInstance.request.mockResolvedValue(mockResponse);

        const result = await apiClient.getPortfolio();

        expect(result).toEqual(portfolioFixtures.mockPortfolio);
        expect(mockAxiosInstance.request).toHaveBeenCalledWith({
          method: 'GET',
          url: '/portfolio',
          headers: {
            'Authorization': 'Bearer test-access-token',
          },
        });
      });
    });

    describe('getHoldings', () => {
      it('should get holdings successfully', async () => {
        const mockResponse = {
          data: { data: [portfolioFixtures.mockHolding] },
        };
        mockAxiosInstance.request.mockResolvedValue(mockResponse);

        const result = await apiClient.getHoldings();

        expect(result).toEqual([portfolioFixtures.mockHolding]);
        expect(mockAxiosInstance.request).toHaveBeenCalledWith({
          method: 'GET',
          url: '/portfolio/holdings',
          headers: {
            'Authorization': 'Bearer test-access-token',
          },
        });
      });
    });
  });

  describe('trading methods', () => {
    beforeEach(() => {
      apiClient.setTokenInfo({
        access_token: 'test-access-token',
        refresh_token: 'test-refresh-token',
        expires_at: '2024-12-31T23:59:59Z',
        user_id: 'user-123',
      });
    });

    describe('placeOrder', () => {
      it('should place order successfully', async () => {
        const mockResponse = {
          data: portfolioFixtures.mockOrderResponse,
        };
        mockAxiosInstance.request.mockResolvedValue(mockResponse);

        const orderParams = {
          broker: 'robinhood' as const,
          account_number: '123456789',
          symbol: 'AAPL',
          order_qty: 10,
          action: 'Buy' as const,
          order_type: 'Market' as const,
          asset_type: 'Stock' as const,
          time_in_force: 'day' as const,
        };

        const result = await apiClient.placeOrder(orderParams);

        expect(result).toEqual(portfolioFixtures.mockOrderResponse);
        expect(mockAxiosInstance.request).toHaveBeenCalledWith({
          method: 'POST',
          url: '/brokers/orders',
          data: {
            broker: 'robinhood',
            order: {
              order_id: undefined,
              order_type: 'Market',
              asset_type: 'Stock',
              action: 'Buy',
              time_in_force: 'day',
              account_number: '123456789',
              symbol: 'AAPL',
              order_qty: 10,
              price: undefined,
              stop_price: undefined,
            },
          },
          headers: {
            'Authorization': 'Bearer test-access-token',
            'Session-ID': '',
            'X-Session-ID': '',
            'X-Device-Info': '{"device_id":"test-device-123","device_type":"server","os":"linux","os_version":"5.4.0","app_version":"1.0.0"}',
          },
        });
      });

      it('should throw ValidationError when broker is not set', async () => {
        const orderParams = {
          broker: '' as any,
          account_number: '123456789',
          symbol: 'AAPL',
          order_qty: 10,
          action: 'Buy' as const,
          order_type: 'Market' as const,
          asset_type: 'Stock' as const,
          time_in_force: 'day' as const,
        };

        await expect(apiClient.placeOrder(orderParams)).rejects.toThrow(ValidationError);
      });

      it('should throw ValidationError when account is not set', async () => {
        const orderParams = {
          broker: 'robinhood' as const,
          account_number: '',
          symbol: 'AAPL',
          order_qty: 10,
          action: 'Buy' as const,
          order_type: 'Market' as const,
          asset_type: 'Stock' as const,
          time_in_force: 'day' as const,
        };

        await expect(apiClient.placeOrder(orderParams)).rejects.toThrow(ValidationError);
      });
    });

    describe('cancelOrder', () => {
      it('should cancel order successfully', async () => {
        const mockResponse = {
          data: { ...portfolioFixtures.mockOrderResponse, success: true, message: 'Order cancelled' },
        };
        mockAxiosInstance.request.mockResolvedValue(mockResponse);

        const result = await apiClient.cancelOrder('order-123');

        expect(result.success).toBe(true);
        expect(result.message).toBe('Order cancelled');
        expect(mockAxiosInstance.request).toHaveBeenCalledWith({
          method: 'DELETE',
          url: '/brokers/orders/order-123',
          data: undefined,
          params: undefined,
          headers: {
            'Authorization': 'Bearer test-access-token',
            'Session-ID': '',
            'X-Session-ID': '',
          },
        });
      });
    });
  });

  describe('convenience trading methods', () => {
    beforeEach(() => {
      apiClient.setTokenInfo({
        access_token: 'test-access-token',
        refresh_token: 'test-refresh-token',
        expires_at: '2024-12-31T23:59:59Z',
        user_id: 'user-123',
      });
    });

    describe('placeStockMarketOrder', () => {
      it('should place stock market order successfully', async () => {
        const mockResponse = {
          data: portfolioFixtures.mockOrderResponse,
        };
        mockAxiosInstance.request.mockResolvedValue(mockResponse);

        const result = await apiClient.placeStockMarketOrder('AAPL', 10, 'buy');

        expect(result).toEqual(portfolioFixtures.mockOrderResponse);
        expect(mockAxiosInstance.request).toHaveBeenCalledWith({
          method: 'POST',
          url: '/brokers/orders',
          data: {
            broker: 'robinhood',
            order: {
              order_id: undefined,
              order_type: 'Market',
              asset_type: 'Stock',
              action: 'Buy',
              time_in_force: 'day',
              account_number: '123456789',
              symbol: 'AAPL',
              order_qty: 10,
              price: undefined,
              stop_price: undefined,
            },
          },
          headers: expect.any(Object),
        });
      });
    });

    describe('placeStockLimitOrder', () => {
      it('should place stock limit order successfully', async () => {
        const mockResponse = {
          data: portfolioFixtures.mockOrderResponse,
        };
        mockAxiosInstance.request.mockResolvedValue(mockResponse);

        const result = await apiClient.placeStockLimitOrder('AAPL', 10, 'buy', 150.00);

        expect(result).toEqual(portfolioFixtures.mockOrderResponse);
        expect(mockAxiosInstance.request).toHaveBeenCalledWith({
          method: 'POST',
          url: '/brokers/orders',
          data: {
            broker: 'robinhood',
            order: {
              order_id: undefined,
              order_type: 'Limit',
              asset_type: 'Stock',
              action: 'Buy',
              time_in_force: 'gtc',
              account_number: '123456789',
              symbol: 'AAPL',
              order_qty: 10,
              price: 150.00,
              stop_price: undefined,
            },
          },
          headers: expect.any(Object),
        });
      });
    });
  });

  describe('token management', () => {
    describe('getValidAccessToken', () => {
      it('should return valid access token', async () => {
        apiClient.setTokenInfo({
          access_token: 'test-access-token',
          refresh_token: 'test-refresh-token',
          expires_at: '2024-12-31T23:59:59Z',
          user_id: 'user-123',
        });

        const token = await apiClient.getValidAccessToken();
        expect(token).toBe('test-access-token');
      });

      it('should throw AuthenticationError when no token', async () => {
        await expect(apiClient.getValidAccessToken()).rejects.toThrow(AuthenticationError);
      });

      it('should refresh expired token', async () => {
        const expiredTime = new Date(Date.now() - 1000).toISOString();
        apiClient.setTokenInfo({
          access_token: 'expired-token',
          refresh_token: 'test-refresh-token',
          expires_at: expiredTime,
          user_id: 'user-123',
        });

        const mockRefreshResponse = {
          data: {
            access_token: 'new-access-token',
            refresh_token: 'new-refresh-token',
            expires_in: 3600,
          },
        };
        mockAxiosInstance.request.mockResolvedValue(mockRefreshResponse);

        const token = await apiClient.getValidAccessToken();
        expect(token).toBe('new-access-token');
      });
    });
  });

  describe('trading context methods', () => {
    it('should set broker', () => {
      apiClient.setBroker('etrade');
      expect(apiClient.getTradingContext().broker).toBe('etrade');
    });

    it('should set account', () => {
      apiClient.setAccount('987654321', 'account-456');
      expect(apiClient.getTradingContext().account_number).toBe('987654321');
      expect(apiClient.getTradingContext().account_id).toBe('account-456');
    });

    it('should clear trading context', () => {
      apiClient.setBroker('etrade');
      apiClient.setAccount('987654321');
      apiClient.clearTradingContext();
      
      const context = apiClient.getTradingContext();
      expect(context.broker).toBeUndefined();
      expect(context.account_number).toBeUndefined();
    });
  });
});
