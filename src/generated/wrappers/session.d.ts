/**
 * Generated wrapper functions for session operations (Phase 2A).
 *
 * This file is regenerated on each run - do not edit directly.
 * For custom logic, edit src/custom/wrappers/session.ts instead.
 */
import { SessionApi } from '../api/session-api';
import type { Configuration } from '../configuration';
import type { SdkConfig } from '../config';
import { type Logger } from '../utils/logger';
import type { DirectAuthRequest } from '../models';
import type { FinaticapiApiV1RoutersSessionSessionRouterTestWebhookRequest } from '../models';
import type { PortalUrlResponse } from '../models';
import type { SessionLinkRequest } from '../models';
import type { SessionResponseData } from '../models';
import type { SessionStartRequest } from '../models';
import type { SessionUserResponse } from '../models';
import type { TestWebhookResponse } from '../models';
import type { TokenData } from '../models';
import type { TokenResponseData } from '../models';
/**
 * Session wrapper functions.
 * Provides simplified method names and response unwrapping.
 */
export declare class SessionWrapper {
    protected api: SessionApi;
    protected config?: Configuration;
    protected sdkConfig?: SdkConfig;
    protected logger: Logger;
    protected sessionId?: string;
    protected companyId?: string;
    protected csrfToken?: string;
    constructor(api: SessionApi, config?: Configuration, sdkConfig?: SdkConfig);
    setSessionContext(sessionId: string, companyId: string, csrfToken: string): void;
    protected _generateRequestId(): string;
    protected _retryApiCall<T>(fn: () => Promise<T>): Promise<T>;
    protected _handleError(error: any, requestId?: string): Error;
    /**
     * Init Session
     *
     *    * Initialize a new session with company API key.
     *
     * Generated from: POST /api/v1/session/init
     */
    initSession(xApiKey: string): Promise<TokenResponseData>;
    /**
     * Start Session
     *
     *    * Start a session with a one-time token.
     *
     * Generated from: POST /api/v1/session/start
     */
    startSession(OneTimeToken: string, body: SessionStartRequest): Promise<SessionResponseData>;
    /**
     * Get Portal Url
     *
     *    * Get a portal URL with token for a session.
     *
     * The session must be in ACTIVE or AUTHENTICATING state and the request must come from the same device
     * that initiated the session. Device info is automatically validated from the request.
     *
     * Generated from: GET /api/v1/session/portal
     */
    getPortalUrl(): Promise<PortalUrlResponse>;
    /**
     * Get Session User
     *
     *    * Get user information and fresh tokens for a completed session.
     *
     * This endpoint is designed for server SDKs to retrieve user information
     * and authentication tokens after successful OTP verification.
     *
     *
     * Security:
     * - Requires valid session in ACTIVE state
     * - Validates device fingerprint binding
     * - Generates fresh tokens (not returning stored ones)
     * - Only accessible to authenticated sessions with user_id
     *
     * Generated from: GET /api/v1/session/{session_id}/user
     */
    getSessionUser(sessionId: string): Promise<SessionUserResponse>;
    /**
     * Authenticate Session
     *
     *
     *
     * Generated from: POST /api/v1/session/authenticate
     */
    authenticateSession(body: DirectAuthRequest): Promise<TokenData>;
    /**
     * Refresh Session
     *
     *    * Refresh an existing session by extending its expiration time.
     *
     * This endpoint allows users to extend their session before it expires.
     * The session will be extended by the default duration (24 hours).
     *
     * Generated from: POST /api/v1/session/refresh
     */
    refreshSession(): Promise<SessionResponseData>;
    /**
     * Test Webhook
     *
     *    * Send a test webhook for the specified event type to the company's configured endpoints.
     *
     * Generated from: POST /api/v1/session/webhook/test
     */
    testWebhook(body: FinaticapiApiV1RoutersSessionSessionRouterTestWebhookRequest): Promise<TestWebhookResponse>;
    /**
     * Link User To Session
     *
     *    * Link Supabase user to existing session.
     *
     * This endpoint is called after successful Supabase OTP authentication
     * to associate the authenticated user with the portal session.
     *
     * Generated from: POST /api/v1/session/link-user
     */
    linkUserToSession(body: SessionLinkRequest, sessionId: string): Promise<any>;
    /**
     * Session management convenience methods.
     * These methods wrap the underlying API calls and manage session state.
     */
    /**
     * Initialize a session by getting a one-time token.
     * Convenience method that wraps the underlying initSession wrapper.
     * @param apiKey - Company API key
     * @returns One-time token for session initialization
     */
    initializeSession(apiKey: string): Promise<string>;
    /**
     * Start a session with a one-time token.
     * Convenience method that wraps the underlying startSession wrapper and manages session state.
     * @param userId - Optional user ID for direct authentication
     * @param oneTimeToken - Optional one-time token (will initialize if not provided and apiKey in config)
     * @returns Session response with session_id and company_id
     */
    startSessionWithToken(userId?: string, oneTimeToken?: string): Promise<{
        session_id: string;
        company_id: string;
    }>;
    /**
     * Get portal URL for user authentication.
     * Convenience method that wraps the underlying getPortalUrl wrapper.
     * @param theme - Optional theme configuration
     * @param brokers - Optional list of broker IDs to filter
     * @param email - Optional email for pre-filling
     * @returns Portal URL
     */
    getPortalUrlForAuth(theme?: any, brokers?: string[], email?: string): Promise<string>;
    /**
     * Get session user information after portal authentication.
     * Convenience method that wraps the underlying getSessionUser wrapper.
     * @returns User information with user_id, company_id, and token_type
     */
    getAuthenticatedUser(): Promise<{
        user_id: string;
        company_id: string;
        token_type: string;
    }>;
}
//# sourceMappingURL=session.d.ts.map