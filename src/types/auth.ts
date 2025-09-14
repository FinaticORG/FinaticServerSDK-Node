/**
 * Authentication-related type definitions.
 */

export interface UserToken {
  /** Access token */
  access_token: string;
  /** Refresh token */
  refresh_token: string;
  /** Token expiration time in seconds */
  expires_in: number;
  /** User ID */
  user_id: string;
  /** Token type */
  token_type?: string;
  /** Token scope */
  scope?: string;
}

export interface SessionResponseData {
  /** Unique session identifier */
  session_id: string;
  /** Session state (PENDING, ACTIVE, etc.) */
  state?: string;
  /** Device information */
  device_info?: Record<string, string>;
  /** Company ID */
  company_id?: string;
  /** Session status */
  status?: string;
  /** Session expiration time */
  expires_at?: string;
  /** User ID */
  user_id?: string;
  /** Auto login flag */
  auto_login?: boolean;
  /** Access token */
  access_token?: string;
  /** Refresh token */
  refresh_token?: string;
  /** Token expiration time in seconds */
  expires_in?: number;
  /** Token type */
  token_type?: string;
  /** Token scope */
  scope?: string;
}

export interface SessionResponse {
  /** Session data (nested) */
  data?: SessionResponseData;
  /** Response message */
  message?: string;
  /** Session ID (flat structure) */
  session_id?: string;
  /** Auto login flag (flat structure) */
  auto_login?: boolean;
  /** Company ID (flat structure) */
  company_id?: string;
  /** Session state (flat structure) */
  state?: string;
}

export interface SessionInitResponse {
  /** Request success status */
  success: boolean;
  /** Response message */
  message: string;
  /** Response data containing one_time_token */
  data: Record<string, any>;
}

export interface OtpRequestResponse {
  /** Request success status */
  success: boolean;
  /** Response message */
  message: string;
  /** Response data */
  data?: Record<string, any>;
  /** OTP ID */
  otp_id?: string;
}

export interface OtpVerifyResponse {
  /** Request success status */
  success: boolean;
  /** Response message */
  message: string;
  /** Response data with tokens */
  data?: Record<string, any>;
  /** Verification status */
  verified?: boolean;
}

export interface SessionAuthenticateResponse {
  /** Request success status */
  success: boolean;
  /** Response message */
  message: string;
  /** Response data with tokens */
  data?: Record<string, any>;
  /** User ID */
  user_id?: string;
  /** Access token */
  access_token?: string;
}

export interface PortalUrlResponse {
  /** Request success status */
  success: boolean;
  /** Response message */
  message: string;
  /** Response data containing portal_url */
  data: Record<string, string>;
}

export interface SessionValidationResponse {
  /** Whether the session is valid */
  valid: boolean;
  /** Company ID */
  company_id: string;
  /** Session status */
  status: string;
}

export class SessionUserResponse {
  /** Request success status */
  success: boolean;
  /** Response message */
  message: string;
  /** Response data containing user info and tokens */
  data: Record<string, any>;

  constructor(success: boolean, message: string, data: Record<string, any>) {
    this.success = success;
    this.message = message;
    this.data = data;
  }

  get_user_id(): string {
    /** Get user ID from the data object. */
    return this.data['user_id'];
  }

  get_access_token(): string {
    /** Get access token from the data object. */
    return this.data['access_token'];
  }

  get_refresh_token(): string {
    /** Get refresh token from the data object. */
    return this.data['refresh_token'];
  }

  get_expires_in(): number {
    /** Get expires_in from the data object. */
    return this.data['expires_in'];
  }

  get_token_type(): string {
    /** Get token type from the data object. */
    return this.data['token_type'];
  }

  get_scope(): string {
    /** Get scope from the data object. */
    return this.data['scope'];
  }

  get_company_id(): string {
    /** Get company ID from the data object. */
    return this.data['company_id'];
  }
}
