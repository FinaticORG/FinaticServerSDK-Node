/**
 * Integration tests for authentication flow
 */

import { FinaticServerClient } from '../../src/core/client/FinaticServerClient';
import { DeviceInfo } from '../../src/types';
import * as authFixtures from '../fixtures/auth-responses';

// Mock axios for integration tests
jest.mock('axios');
const mockedAxios = require('axios');

describe('Authentication Flow Integration Tests', () => {
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
  });

  describe('Portal Authentication Flow', () => {
    it('should complete full portal authentication flow', async () => {
      // Step 1: Start session
      mockAxiosInstance.request
        .mockResolvedValueOnce({
          data: authFixtures.mockSessionInitResponse,
        })
        // Step 2: Request OTP
        .mockResolvedValueOnce({
          data: authFixtures.mockOtpRequestResponse,
        })
        // Step 3: Verify OTP
        .mockResolvedValueOnce({
          data: authFixtures.mockOtpVerifyResponse,
        })
        // Step 4: Get portal URL
        .mockResolvedValueOnce({
          data: authFixtures.mockPortalUrlResponse,
        })
        // Step 5: Get session user
        .mockResolvedValueOnce({
          data: authFixtures.mockSessionUserResponse,
        });

      // Start session
      const sessionResponse = await client.start_session('test-company-456');
      expect(sessionResponse.session_id).toBe('test-session-123');

      // Request OTP
      const otpResponse = await client.request_otp('test@example.com');
      expect(otpResponse.otp_id).toBe('otp-123');

      // Verify OTP
      const verifyResponse = await client.verify_otp('123456');
      expect(verifyResponse.verified).toBe(true);

      // Get portal URL
      const portalResponse = await client.get_portal_url();
      expect(portalResponse).toContain('portal.finatic.com');

      // User is now authenticated
      expect(client.is_authenticated()).toBe(true);

      // Verify client state
      expect(client.is_authenticated()).toBe(true);
      expect(client.get_user_id()).toBe('user-123');
      expect(client.get_session_id()).toBe('test-session-123');
      expect(client.get_company_id()).toBe('test-company-456');
    });
  });

  describe('Direct Authentication Flow', () => {
    it('should complete direct authentication flow', async () => {
      mockAxiosInstance.request.mockResolvedValue({
        data: authFixtures.mockSessionAuthenticateResponse,
      });

      const authResponse = await client.authenticate_directly('test-company-456');

      expect(authResponse.user_id).toBe('user-123');
      expect(authResponse.access_token).toBe('access-token-123');
      expect(client.is_authenticated()).toBe(true);
      expect(client.get_user_id()).toBe('user-123');
    });
  });

  describe('Error Handling', () => {
    it('should handle authentication errors gracefully', async () => {
      mockAxiosInstance.request.mockRejectedValue({
        response: {
          status: 401,
          data: { message: 'Invalid credentials' },
        },
      });

      await expect(
        client.authenticate_directly('test-company-456')
      ).rejects.toThrow();
    });

    it('should handle network errors gracefully', async () => {
      mockAxiosInstance.request.mockRejectedValue(new Error('Network error'));

      await expect(
        client.start_session('test-company-456')
      ).rejects.toThrow();
    });
  });
});
