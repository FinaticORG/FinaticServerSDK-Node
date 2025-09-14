/**
 * Test fixtures for authentication responses
 */

import {
  SessionInitResponse,
  OtpRequestResponse,
  OtpVerifyResponse,
  SessionAuthenticateResponse,
  PortalUrlResponse,
  SessionUserResponse,
  UserToken,
} from '../../src/types';

export const mockSessionInitResponse: SessionInitResponse = {
  session_id: 'test-session-123',
  company_id: 'test-company-456',
  expires_at: '2024-12-31T23:59:59Z',
  status: 'active',
};

export const mockOtpRequestResponse: OtpRequestResponse = {
  message: 'OTP sent successfully',
  otp_id: 'otp-123',
  expires_in: 300,
  delivery_method: 'email',
  masked_destination: 'u***@example.com',
};

export const mockOtpVerifyResponse: OtpVerifyResponse = {
  message: 'OTP verified successfully',
  verified: true,
  session_id: 'test-session-123',
  expires_at: '2024-12-31T23:59:59Z',
};

export const mockSessionAuthenticateResponse: SessionAuthenticateResponse = {
  message: 'Session authenticated successfully',
  session_id: 'test-session-123',
  user_id: 'user-123',
  company_id: 'test-company-456',
  expires_at: '2024-12-31T23:59:59Z',
  access_token: 'access-token-123',
  refresh_token: 'refresh-token-123',
  token_type: 'Bearer',
  expires_in: 3600,
};

export const mockPortalUrlResponse: PortalUrlResponse = {
  portal_url: 'https://portal.finatic.com/session/test-session-123',
  session_id: 'test-session-123',
  expires_at: '2024-12-31T23:59:59Z',
  status: 'active',
};

export const mockSessionUserResponse: SessionUserResponse = {
  user: {
    user_id: 'user-123',
    email: 'test@example.com',
    first_name: 'Test',
    last_name: 'User',
    company_id: 'test-company-456',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
  tokens: {
    access_token: 'access-token-123',
    refresh_token: 'refresh-token-123',
    token_type: 'Bearer',
    expires_in: 3600,
    expires_at: '2024-12-31T23:59:59Z',
  },
  session: {
    session_id: 'test-session-123',
    company_id: 'test-company-456',
    expires_at: '2024-12-31T23:59:59Z',
    status: 'active',
  },
};

export const mockUserToken: UserToken = {
  user_id: 'user-123',
  access_token: 'access-token-123',
  refresh_token: 'refresh-token-123',
  expires_at: '2024-12-31T23:59:59Z',
  token_type: 'Bearer',
};
