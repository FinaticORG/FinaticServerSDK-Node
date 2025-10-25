/**
 * Order-related type definitions.
 */

export type OrderSide = 'buy' | 'sell';
export type OrderType = 'market' | 'limit' | 'stop' | 'stop_limit';
export type TimeInForce = 'day' | 'gtc' | 'opg' | 'cls' | 'ioc' | 'fok';
export type OptionType = 'call' | 'put';
export type BrokerName = 'robinhood' | 'tasty_trade' | 'ninja_trader' | string;
export type AssetType = 'Stock' | 'Option' | 'Crypto' | 'Futures' | 'equity' | 'equity_option' | 'crypto' | 'future' | 'forex';
export type OrderAction = 'Buy' | 'Sell';
export type BrokerOrderType = 'Market' | 'Limit' | 'Stop' | 'StopLimit';
export type BrokerTimeInForce = 'day' | 'gtc' | 'gtd' | 'ioc' | 'fok';

export interface Order {
  /** Trading symbol */
  symbol: string;
  /** Order side */
  side: OrderSide;
  /** Order quantity */
  quantity: number;
  /** Order type */
  type: OrderType;
  /** Order price */
  price?: number;
  /** Stop price */
  stop_price?: number;
  /** Time in force */
  time_in_force: TimeInForce;
}

export interface OptionsOrder extends Order {
  /** Option type */
  option_type: OptionType;
  /** Strike price */
  strike_price: number;
  /** Expiration date */
  expiration_date: string;
}

export interface CryptoOrderOptions {
  /** Quantity */
  quantity?: number;
  /** Notional value */
  notional?: number;
}

export interface OptionsOrderOptions {
  /** Strike price */
  strike_price: number;
  /** Expiration date */
  expiration_date: string;
  /** Option type */
  option_type: OptionType;
  /** Contract size */
  contract_size?: number;
}

export interface OrderResponse {
  /** Order success status */
  success: boolean;
  /** Order response data */
  response_data: Record<string, any>;
  /** Response message */
  message: string;
  /** HTTP status code */
  status_code: number;
  /** Order ID */
  order_id?: string;
  /** Order status */
  status?: string;
  /** Trading symbol */
  symbol?: string;
  /** Order price */
  price?: number;
  /** Total value */
  total_value?: number;
}

export interface BrokerOrderParams {
  /** Broker name */
  broker: BrokerName;
  /** Optional order ID for modify operations */
  order_id?: string;
  /** Order type */
  order_type: BrokerOrderType;
  /** Asset type */
  asset_type: AssetType;
  /** Order action */
  action: OrderAction;
  /** Time in force */
  time_in_force: BrokerTimeInForce;
  /** Account number (string or int) */
  account_number: string | number;
  /** Trading symbol */
  symbol: string;
  /** Order quantity */
  order_qty: number;
  /** Order price */
  price?: number;
  /** Stop price */
  stop_price?: number;
}

export interface BrokerExtras {
  /** Robinhood-specific options */
  robinhood?: Record<string, any>;
  /** NinjaTrader-specific options */
  ninja_trader?: Record<string, any>;
  /** TastyTrade-specific options */
  tasty_trade?: Record<string, any>;
}
