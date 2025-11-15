/**
 * Generated wrapper functions for brokers operations (Phase 2A).
 *
 * This file is regenerated on each run - do not edit directly.
 * For custom logic, edit src/custom/wrappers/brokers.ts instead.
 */
import { BrokersApi } from '../api/brokers-api';
import type { Configuration } from '../configuration';
import type { SdkConfig } from '../config';
import { type Logger } from '../utils/logger';
import type { BrokerConnectionRequest } from '../models';
import type { BrokerConnectionUpdateRequest } from '../models';
import type { UserBrokerConnections } from '../models';
/**
 * Brokers wrapper functions.
 * Provides simplified method names and response unwrapping.
 */
export declare class BrokersWrapper {
    protected api: BrokersApi;
    protected config?: Configuration;
    protected sdkConfig?: SdkConfig;
    protected logger: Logger;
    protected sessionId?: string;
    protected companyId?: string;
    protected csrfToken?: string;
    constructor(api: BrokersApi, config?: Configuration, sdkConfig?: SdkConfig);
    setSessionContext(sessionId: string, companyId: string, csrfToken: string): void;
    protected _generateRequestId(): string;
    protected _retryApiCall<T>(fn: () => Promise<T>): Promise<T>;
    protected _handleError(error: any, requestId?: string): Error;
    /**
     * Get Brokers
     *
     *    * Get all available brokers.
     *
     * This is a fast operation that returns a cached list of available brokers.
     * The list is loaded once at startup and never changes during runtime.
     *
     * Returns
     * -------
     * FinaticResponse[list[BrokerInfo]]
     *     list of available brokers with their metadata.
     *
     * Generated from: GET /api/v1/brokers/
     */
    getBrokers(): Promise<any[]>;
    /**
     * Connect Broker
     *
     *    * Connect to a broker or reconnect to an existing connection.
     *
     * This endpoint handles both new connections and reconnections:
     * - New connections: Provide broker_id, credentials, and permissions
     * - Reconnections: Provide connection_id, broker_id, credentials, and permissions
     *
     * For reconnections, the connection must be in "needs_reauth" status.
     *
     * Generated from: POST /api/v1/brokers/connect
     */
    connectBroker(body: BrokerConnectionRequest): Promise<any>;
    /**
     * List Broker Connections
     *
     *    * List all broker connections for the current user.
     *
     * This endpoint is accessible from the portal and uses session-only authentication.
     * Returns connections that the user has any permissions for.
     *
     * Generated from: GET /api/v1/brokers/connections
     */
    listBrokerConnections(): Promise<any[]>;
    /**
     * Update Connection
     *
     *    * Update a broker connection's permissions.
     *
     * Generated from: PUT /api/v1/brokers/connections/{connection_id}
     */
    updateConnection(connectionId: string, body: BrokerConnectionUpdateRequest): Promise<UserBrokerConnections>;
    /**
     * Delete Connection
     *
     *    * Delete a broker connection.
     *
     * Generated from: DELETE /api/v1/brokers/connections/{connection_id}
     */
    deleteConnection(connectionId: string): Promise<any>;
    /**
     * Disconnect Broker
     *
     *    * Disconnect a broker connection.
     *
     * Generated from: DELETE /api/v1/brokers/disconnect/{connection_id}
     */
    disconnectBroker(connectionId: string): Promise<any>;
    /**
     * Disconnect Company From Broker
     *
     *    * Remove a company's access to a broker connection.
     *
     * If the company is the only one with access, the entire connection is deleted.
     * If other companies have access, only the company's access is removed.
     *
     * Generated from: DELETE /api/v1/brokers/disconnect-company/{connection_id}
     */
    disconnectCompanyFromBroker(connectionId: string): Promise<any>;
    /**
     * Get Orders
     *
     *    * Get orders for all authorized broker connections.
     *
     * This endpoint is accessible from the portal and uses session-only authentication.
     * Returns orders from connections the company has read access to.
     *
     * Generated from: GET /api/v1/brokers/data/orders
     */
    getOrders(brokerId?: any, connectionId?: any, accountId?: any, symbol?: any, orderStatus?: any, side?: any, assetType?: any, limit?: number, offset?: number, createdAfter?: any, createdBefore?: any, withMetadata?: boolean): Promise<any[]>;
    /**
     * Get Positions
     *
     *    * Get positions for all authorized broker connections.
     *
     * This endpoint is accessible from the portal and uses session-only authentication.
     * Returns positions from connections the company has read access to.
     *
     * Generated from: GET /api/v1/brokers/data/positions
     */
    getPositions(brokerId?: any, connectionId?: any, accountId?: any, symbol?: any, side?: any, assetType?: any, positionStatus?: any, limit?: number, offset?: number, updatedAfter?: any, updatedBefore?: any, withMetadata?: boolean): Promise<any[]>;
    /**
     * Get Balances
     *
     *    * Get balances for all authorized broker connections.
     *
     * This endpoint is accessible from the portal and uses session-only authentication.
     * Returns balances from connections the company has read access to.
     *
     * Generated from: GET /api/v1/brokers/data/balances
     */
    getBalances(brokerId?: any, connectionId?: any, accountId?: any, isEndOfDaySnapshot?: any, limit?: number, offset?: number, balanceCreatedAfter?: any, balanceCreatedBefore?: any, withMetadata?: boolean): Promise<any[]>;
    /**
     * Get Accounts
     *
     *    * Get accounts for all authorized broker connections.
     *
     * This endpoint is accessible from the portal and uses session-only authentication.
     * Returns accounts from connections the company has read access to.
     *
     * Generated from: GET /api/v1/brokers/data/accounts
     */
    getAccounts(brokerId?: any, connectionId?: any, accountType?: any, status?: any, currency?: any, limit?: number, offset?: number, withMetadata?: any): Promise<any[]>;
    /**
     * Get Order Fills
     *
     *    * Get order fills for a specific order.
     *
     * This endpoint returns all execution fills for the specified order.
     *
     * Generated from: GET /api/v1/brokers/data/orders/{order_id}/fills
     */
    getOrderFills(orderId: string, connectionId?: any, limit?: number, offset?: number): Promise<any[]>;
    /**
     * Get Order Events
     *
     *    * Get order events for a specific order.
     *
     * This endpoint returns all lifecycle events for the specified order.
     *
     * Generated from: GET /api/v1/brokers/data/orders/{order_id}/events
     */
    getOrderEvents(orderId: string, connectionId?: any, limit?: number, offset?: number): Promise<any[]>;
    /**
     * Get Order Groups
     *
     *    * Get order groups.
     *
     * This endpoint returns order groups that contain multiple orders.
     *
     * Generated from: GET /api/v1/brokers/data/orders/groups
     */
    getOrderGroups(brokerId?: any, connectionId?: any, limit?: number, offset?: number, createdAfter?: any, createdBefore?: any): Promise<any[]>;
    /**
     * Get Position Lots
     *
     *    * Get position lots (tax lots for positions).
     *
     * This endpoint returns tax lots for positions, which are used for tax reporting.
     * Each lot tracks when a position was opened/closed and at what prices.
     *
     * Generated from: GET /api/v1/brokers/data/positions/lots
     */
    getPositionLots(brokerId?: any, connectionId?: any, accountId?: any, symbol?: any, positionId?: any, limit?: number, offset?: number): Promise<any[]>;
    /**
     * Get Position Lot Fills
     *
     *    * Get position lot fills for a specific lot.
     *
     * This endpoint returns all fills associated with a specific position lot.
     *
     * Generated from: GET /api/v1/brokers/data/positions/lots/{lot_id}/fills
     */
    getPositionLotFills(lotId: string, connectionId?: any, limit?: number, offset?: number): Promise<any[]>;
    /**
     * Sandbox Callback
     *
     *    * Handle sandbox authentication callback.
     *
     * This endpoint handles the completion of sandbox authentication flows.
     * It creates sandbox connections with mock data instead of real broker connections.
     *
     * Generated from: GET /api/v1/brokers/sandbox-callback/{broker_id}
     */
    sandboxCallback(brokerId: string): Promise<any>;
    /**
     * Oauth Callback Tastytrade
     *
     *    * Handle OAuth callback for TastyTrade sandbox authentication.
     *
     * This endpoint serves as the redirect URI for TastyTrade OAuth flows in sandbox mode.
     * It captures all query parameters from the callback URL and completes the authentication
     * process with TastyTrade. All authentication data is passed via URL query parameters
     * as per OAuth 2.0 specification.
     *
     * Parameters
     * ----------
     * request : Request
     *     FastAPI request object containing the callback URL with OAuth parameters
     *
     * Returns
     * -------
     * HTMLResponse
     *     Returns HTML that closes the popup and notifies the parent window
     *
     * Generated from: GET /api/v1/brokers/callback/tastytrade
     */
    oauthCallbackTastytrade(): Promise<any>;
    /**
     * Oauth Callback
     *
     *    * Handle OAuth callback for broker authentication.
     *
     * This endpoint serves as the redirect URI for OAuth flows. It captures
     * all query parameters from the callback URL and completes the authentication
     * process with the specified broker. All authentication data is passed via
     * URL query parameters as per OAuth 2.0 specification.
     *
     * Parameters
     * ----------
     * broker_id : str
     *     The ID of the broker handling the OAuth callback
     * request : Request
     *     FastAPI request object containing the callback URL with OAuth parameters
     *
     * Returns
     * -------
     * HTMLResponse
     *     Returns HTML that closes the popup and notifies the parent window
     *
     * Generated from: GET /api/v1/brokers/callback/{broker_id}
     */
    oauthCallback(brokerId: string): Promise<any>;
    /**
     * Place Order
     *
     *    * Create a new order via the specified broker connection.
     *
     * This endpoint is accessible from the portal and uses session-only authentication.
     * Requires trading permissions for the company.
     *
     * Standard parameters
     * -------------------
     * The following fields constitute the unified Finatic *common order schema* and
     * therefore appear individually as query parameters in the autogenerated
     * OpenAPI documentation:
     *
     * - ``broker``
     * - ``account_number``
     * - ``order_type``
     * - ``asset_type``
     * - ``action``
     * - ``time_in_force``
     * - ``symbol``
     * - ``order_qty``
     *
     * They are surfaced as *query* parameters **only to make the accepted fields
     * obvious in the interactive docs**. In production usage you should send these
     * fields inside the JSON body (see ``order_request``) so that the entire order
     * specification travels in one payload. (Nothing will break if you send both, but there is no need to do so.)
     *
     * Body payload & broker-specific extras
     * -------------------------------------
     *
     * Put the standard parameters plus any broker-specific extensions under the
     * ``order`` key of the body. Refer to the bundled OpenAPI examples below to
     * see complete payloads for common order types (market, limit, spreads, etc.)
     * across supported brokers.
     *
     * For a formal reference of broker-specific extensions inspect the
     * ``BrokerOrderPlaceExtras`` schema.
     *
     * The endpoint resolves the active ``user_broker_connection`` by calling the
     * ``get_user_broker_connection_ids_for_broker`` RPC in Supabase. If no active
     * connection exists it returns a list of *available* brokers so your client
     * can guide the user accordingly.
     *
     * Broker Notes
     * ------------
     * - The responses that you get back from the broker are not always the same.
     * The response models are validated for each broker, but we do not standardize the repsonses.
     *
     * - Tasty Trade: If you want to trade options for a particular stock, first fetch the full
     * option chain via the GET https://api.tastyworks.com/option-chains/{stock_symbol}/nested endpoint.
     * This endpoint returns all available expirations that tastytrade offers for that equity symbol.
     * Each expiration contains a list of strikes, where each strike has a call and put field representing
     * the call symbol and put symbol respectively.
     *
     * We are planning to add a new endpoint to fetch the option chain for a particular stock and
     * handle this logic for you, but for now you need to fetch the option chain manually.
     *
     * Generated from: POST /api/v1/brokers/orders
     */
    placeOrder(body?: any, connectionId?: any): Promise<any>;
    /**
     * Cancel Order
     *
     *    * Cancel an existing order.
     *
     * This endpoint is accessible from the portal and uses session-only authentication.
     * Requires trading permissions for the company.
     *
     * Generated from: DELETE /api/v1/brokers/orders/{order_id}
     */
    cancelOrder(orderId: string, body?: any, accountNumber?: any, connectionId?: any): Promise<any>;
    /**
     * Modify Order
     *
     *    * Modify an existing order.
     *
     * This endpoint is accessible from the portal and uses session-only authentication.
     * Requires trading permissions for the company.
     *
     * Generated from: PATCH /api/v1/brokers/orders/{order_id}
     */
    modifyOrder(orderId: string, body?: any, accountNumber?: any, connectionId?: any): Promise<any>;
}
//# sourceMappingURL=brokers.d.ts.map