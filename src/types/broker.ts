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
  /** Result limit */
  limit?: number;
  /** Result offset */
  offset?: number;
}

export interface Balance {
  /** Balance ID */
  id: string;
  /** Account ID */
  account_id: string;
  /** Available to withdraw */
  available_to_withdraw?: number;
  /** Balance created at */
  balance_created_at?: string;
  /** Balance updated at */
  balance_updated_at?: string;
  /** Initial margin */
  initial_margin?: number;
  /** Is end of day snapshot */
  is_end_of_day_snapshot?: boolean;
  /** Maintenance margin */
  maintenance_margin?: number;
  /** Net liquidation value */
  net_liquidation_value?: number;
  /** Total cash value */
  total_cash_value?: number;
  /** Total realized PnL */
  total_realized_pnl?: number;
  /** Created at */
  created_at?: string;
  /** Updated at */
  updated_at?: string;
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

export interface BalancesFilter {
  /** Filter by broker ID */
  broker_id?: string;
  /** Filter by connection ID */
  connection_id?: string;
  /** Filter by account ID */
  account_id?: string;
  /** Filter by currency */
  currency?: string;
  /** Result limit */
  limit?: number;
  /** Result offset */
  offset?: number;
  /** Include metadata */
  with_metadata?: boolean;
}

export interface OrderFill {
  /** Fill ID */
  id: string;
  /** Order ID */
  order_id: string;
  /** Order leg ID */
  leg_id?: string;
  /** Fill price */
  price: number;
  /** Fill quantity */
  quantity: number;
  /** Execution timestamp */
  executed_at: string;
  /** Execution ID */
  execution_id?: string;
  /** Trade ID */
  trade_id?: string;
  /** Execution venue */
  venue?: string;
  /** Commission fee */
  commission_fee?: number;
  /** Creation timestamp */
  created_at: string;
  /** Last update timestamp */
  updated_at: string;
}

export interface OrderEvent {
  /** Event ID */
  id: string;
  /** Order ID */
  order_id: string;
  /** Order group ID */
  order_group_id?: string;
  /** Event type */
  event_type?: string;
  /** Event timestamp */
  event_time: string;
  /** Event ID */
  event_id?: string;
  /** Order status */
  order_status?: string;
  /** Whether event was inferred */
  inferred: boolean;
  /** Confidence score */
  confidence?: number;
  /** Reason code */
  reason_code?: string;
  /** Recorded timestamp */
  recorded_at?: string;
}

export interface OrderGroup {
  /** Group ID */
  id: string;
  /** User broker connection ID */
  user_broker_connection_id?: string;
  /** Creation timestamp */
  created_at: string;
  /** Last update timestamp */
  updated_at: string;
  /** Orders in group */
  orders?: BrokerOrder[];
}

export interface PositionLot {
  /** Lot ID */
  id: string;
  /** Position ID */
  position_id?: string;
  /** User broker connection ID */
  user_broker_connection_id: string;
  /** Broker provided account ID */
  broker_provided_account_id: string;
  /** Instrument key */
  instrument_key: string;
  /** Asset type */
  asset_type?: string;
  /** Position side */
  side?: string;
  /** Open quantity */
  open_quantity: number;
  /** Closed quantity */
  closed_quantity: number;
  /** Remaining quantity */
  remaining_quantity: number;
  /** Open price */
  open_price: number;
  /** Average close price */
  close_price_avg?: number;
  /** Cost basis */
  cost_basis: number;
  /** Cost basis with commission */
  cost_basis_w_commission: number;
  /** Realized P&L */
  realized_pl: number;
  /** Realized P&L with commission */
  realized_pl_w_commission: number;
  /** Lot opened timestamp */
  lot_opened_at: string;
  /** Lot closed timestamp */
  lot_closed_at?: string;
  /** Position group ID */
  position_group_id?: string;
  /** Creation timestamp */
  created_at: string;
  /** Last update timestamp */
  updated_at: string;
  /** Lot fills */
  position_lot_fills?: PositionLotFill[];
}

export interface PositionLotFill {
  /** Fill ID */
  id: string;
  /** Lot ID */
  lot_id: string;
  /** Order fill ID */
  order_fill_id: string;
  /** Fill price */
  fill_price: number;
  /** Fill quantity */
  fill_quantity: number;
  /** Execution timestamp */
  executed_at: string;
  /** Commission share */
  commission_share?: number;
  /** Creation timestamp */
  created_at: string;
  /** Last update timestamp */
  updated_at: string;
}

// Filter types for detail endpoints
export interface OrderFillsFilter {
  /** Filter by connection ID */
  connection_id?: string;
  /** Result limit */
  limit?: number;
  /** Result offset */
  offset?: number;
}

export interface OrderEventsFilter {
  /** Filter by connection ID */
  connection_id?: string;
  /** Result limit */
  limit?: number;
  /** Result offset */
  offset?: number;
}

export interface OrderGroupsFilter {
  /** Filter by broker ID */
  broker_id?: string;
  /** Filter by connection ID */
  connection_id?: string;
  /** Result limit */
  limit?: number;
  /** Result offset */
  offset?: number;
  /** Filter by creation date after (ISO 8601) */
  created_after?: string;
  /** Filter by creation date before (ISO 8601) */
  created_before?: string;
}

export interface PositionLotsFilter {
  /** Filter by broker ID */
  broker_id?: string;
  /** Filter by connection ID */
  connection_id?: string;
  /** Filter by account ID */
  account_id?: string;
  /** Filter by symbol */
  symbol?: string;
  /** Filter by position ID */
  position_id?: string;
  /** Result limit */
  limit?: number;
  /** Result offset */
  offset?: number;
}

export interface PositionLotFillsFilter {
  /** Filter by connection ID */
  connection_id?: string;
  /** Result limit */
  limit?: number;
  /** Result offset */
  offset?: number;
}
