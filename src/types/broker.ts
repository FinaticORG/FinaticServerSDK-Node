/**
 * Broker-related type definitions.
 */

export interface BrokerDataOptions {
  /** Filter by broker name */
  broker_name?: string;
  /** Filter by account ID */
  account_id?: string;
  /** Filter by symbol */
  symbol?: string;
}

export interface BrokerInfo {
  /** Broker ID */
  id: string;
  /** Broker name */
  name: string;
  /** Display name */
  display_name: string;
  /** Broker description */
  description: string;
  /** Broker website */
  website: string;
  /** Available features */
  features: string[];
  /** Authentication type (oauth, api_key, username_password, etc.) */
  auth_type: string;
  /** Logo path */
  logo_path: string;
  /** Whether broker is active */
  is_active: boolean;
  /** Broker ID (alias for id) */
  broker_id?: string;
}

export interface BrokerAccount {
  /** Account ID */
  id: string;
  /** User broker connection ID */
  user_broker_connection_id: string;
  /** Broker provided account ID */
  broker_provided_account_id: string;
  /** Account name */
  account_name: string;
  /** Account type */
  account_type?: string;
  /** Account currency */
  currency?: string;
  /** Cash balance */
  cash_balance?: number;
  /** Buying power */
  buying_power?: number;
  /** Account status */
  status?: string;
  /** Creation timestamp */
  created_at: string;
  /** Last update timestamp */
  updated_at: string;
  /** Last sync timestamp */
  last_synced_at: string;
  /** Account ID (alias for id) */
  account_id?: string;
}

export interface BrokerOrder {
  /** Order ID */
  id: string;
  /** User broker connection ID */
  user_broker_connection_id: string;
  /** Broker provided account ID */
  broker_provided_account_id: string;
  /** Order ID */
  order_id?: string;
  /** Trading symbol */
  symbol: string;
  /** Order type */
  order_type: string;
  /** Order side (buy/sell) */
  side: string;
  /** Order quantity */
  quantity: number;
  /** Order price */
  price?: number;
  /** Order status */
  status: string;
  /** Creation timestamp */
  created_at: string;
  /** Last update timestamp */
  updated_at: string;
  /** Fill timestamp */
  filled_at?: string;
  /** Filled quantity */
  filled_quantity?: number;
  /** Filled average price */
  filled_avg_price?: number;
}

export interface BrokerPosition {
  /** Position ID */
  id: string;
  /** User broker connection ID */
  user_broker_connection_id: string;
  /** Broker provided account ID */
  broker_provided_account_id: string;
  /** Trading symbol */
  symbol: string;
  /** Asset type */
  asset_type: string;
  /** Position quantity */
  quantity: number;
  /** Average price */
  average_price?: number;
  /** Market value */
  market_value: number;
  /** Cost basis */
  cost_basis: number;
  /** Unrealized gain/loss */
  unrealized_gain_loss?: number;
  /** Unrealized gain/loss percentage */
  unrealized_gain_loss_percent?: number;
  /** Current price */
  current_price?: number;
  /** Last price */
  last_price?: number;
  /** Last price update timestamp */
  last_price_updated_at?: string;
  /** Creation timestamp */
  created_at: string;
  /** Last update timestamp */
  updated_at: string;
}

export interface BrokerConnection {
  /** Connection ID */
  id: string;
  /** Broker ID */
  broker_id: string;
  /** User ID */
  user_id: string;
  /** Company ID */
  company_id?: string;
  /** Connection status */
  status: string;
  /** Connection timestamp */
  connected_at?: string;
  /** Last sync timestamp */
  last_synced_at?: string;
  /** Connection permissions */
  permissions?: Record<string, boolean>;
  /** Connection metadata */
  metadata?: Record<string, any>;
  /** Whether re-authentication is needed */
  needs_reauth?: boolean;
}

// Filter types for pagination
export interface OrdersFilter {
  /** Filter by broker ID */
  broker_id?: string;
  /** Filter by connection ID */
  connection_id?: string;
  /** Filter by account ID */
  account_id?: string;
  /** Filter by symbol */
  symbol?: string;
  /** Filter by status */
  status?: string;
  /** Filter by side */
  side?: string;
  /** Filter by asset type */
  asset_type?: string;
  /** Result limit */
  limit?: number;
  /** Result offset */
  offset?: number;
  /** Filter by creation date after (ISO 8601) */
  created_after?: string;
  /** Filter by creation date before (ISO 8601) */
  created_before?: string;
  /** Include metadata */
  with_metadata?: boolean;
}

export interface PositionsFilter {
  /** Filter by broker ID */
  broker_id?: string;
  /** Filter by connection ID */
  connection_id?: string;
  /** Filter by account ID */
  account_id?: string;
  /** Filter by symbol */
  symbol?: string;
  /** Filter by side */
  side?: string;
  /** Filter by asset type */
  asset_type?: string;
  /** Filter by position status */
  position_status?: string;
  /** Result limit */
  limit?: number;
  /** Result offset */
  offset?: number;
  /** Filter by update date after (ISO 8601) */
  updated_after?: string;
  /** Filter by update date before (ISO 8601) */
  updated_before?: string;
  /** Include metadata */
  with_metadata?: boolean;
}

export interface AccountsFilter {
  /** Filter by broker ID */
  broker_id?: string;
  /** Filter by connection ID */
  connection_id?: string;
  /** Filter by account type */
  account_type?: string;
  /** Filter by status */
  status?: string;
  /** Filter by currency */
  currency?: string;
  /** Result limit */
  limit?: number;
  /** Result offset */
  offset?: number;
  /** Include metadata */
  with_metadata?: boolean;
}
