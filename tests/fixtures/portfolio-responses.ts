/**
 * Test fixtures for portfolio responses
 */

import {
  Holding,
  Portfolio,
  BrokerInfo,
  BrokerAccount,
  BrokerOrder,
  BrokerPosition,
  BrokerConnection,
  OrderResponse,
} from '../../src/types';

export const mockHolding: Holding = {
  symbol: 'AAPL',
  quantity: 100,
  average_price: 150.00,
  current_price: 155.00,
  market_value: 15500.00,
  cost_basis: 15000.00,
  unrealized_pnl: 500.00,
  realized_pnl: 0.00,
  percentage_change: 3.33,
  asset_type: 'Stock',
  broker: 'robinhood',
  account_number: '123456789',
  last_updated: '2024-01-01T12:00:00Z',
};

export const mockPortfolio: Portfolio = {
  total_value: 100000.00,
  cash_balance: 10000.00,
  buying_power: 20000.00,
  day_change: 500.00,
  day_change_percentage: 0.50,
  total_return: 5000.00,
  total_return_percentage: 5.26,
  holdings: [mockHolding],
  last_updated: '2024-01-01T12:00:00Z',
};

export const mockBrokerInfo: BrokerInfo = {
  broker_id: 'robinhood',
  name: 'Robinhood',
  display_name: 'Robinhood',
  logo_url: 'https://example.com/robinhood-logo.png',
  website_url: 'https://robinhood.com',
  supported_assets: ['Stock', 'Crypto', 'Options'],
  supported_orders: ['Market', 'Limit', 'Stop', 'StopLimit'],
  is_active: true,
  features: {
    fractional_shares: true,
    crypto_trading: true,
    options_trading: true,
    margin_trading: false,
  },
};

export const mockBrokerAccount: BrokerAccount = {
  account_id: 'account-123',
  account_number: '123456789',
  broker: 'robinhood',
  account_type: 'Individual',
  status: 'Active',
  buying_power: 20000.00,
  cash_balance: 10000.00,
  equity: 100000.00,
  day_trade_buying_power: 40000.00,
  is_margin_enabled: false,
  is_day_trade_enabled: true,
  created_at: '2024-01-01T00:00:00Z',
  last_updated: '2024-01-01T12:00:00Z',
};

export const mockBrokerAccount2: BrokerAccount = {
  account_id: 'account-456',
  account_number: '987654321',
  broker: 'tasty_trade',
  account_type: 'Individual',
  status: 'Active',
  buying_power: 15000.00,
  cash_balance: 7500.00,
  equity: 75000.00,
  day_trade_buying_power: 30000.00,
  is_margin_enabled: true,
  is_day_trade_enabled: false,
  created_at: '2024-01-02T00:00:00Z',
  last_updated: '2024-01-02T12:00:00Z',
};

export const mockBrokerOrder: BrokerOrder = {
  order_id: 'order-123',
  broker: 'robinhood',
  account_number: '123456789',
  symbol: 'AAPL',
  side: 'Buy',
  order_type: 'Market',
  quantity: 10,
  price: null,
  stop_price: null,
  time_in_force: 'day',
  status: 'Filled',
  filled_quantity: 10,
  remaining_quantity: 0,
  average_fill_price: 155.00,
  total_filled_value: 1550.00,
  commission: 0.00,
  created_at: '2024-01-01T10:00:00Z',
  updated_at: '2024-01-01T10:05:00Z',
  filled_at: '2024-01-01T10:05:00Z',
};

export const mockBrokerPosition: BrokerPosition = {
  position_id: 'position-123',
  broker: 'robinhood',
  account_number: '123456789',
  symbol: 'AAPL',
  quantity: 100,
  average_price: 150.00,
  current_price: 155.00,
  market_value: 15500.00,
  cost_basis: 15000.00,
  unrealized_pnl: 500.00,
  realized_pnl: 0.00,
  percentage_change: 3.33,
  asset_type: 'Stock',
  last_updated: '2024-01-01T12:00:00Z',
};

export const mockBrokerConnection: BrokerConnection = {
  connection_id: 'connection-123',
  broker: 'robinhood',
  account_number: '123456789',
  status: 'Connected',
  last_sync: '2024-01-01T12:00:00Z',
  sync_frequency: 'realtime',
  is_active: true,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T12:00:00Z',
};

export const mockOrderResponse: OrderResponse = {
  order_id: 'order-123',
  status: 'Filled',
  message: 'Order placed successfully',
  broker: 'robinhood',
  account_number: '123456789',
  symbol: 'AAPL',
  side: 'Buy',
  order_type: 'Market',
  quantity: 10,
  filled_quantity: 10,
  remaining_quantity: 0,
  average_fill_price: 155.00,
  total_filled_value: 1550.00,
  commission: 0.00,
  created_at: '2024-01-01T10:00:00Z',
  updated_at: '2024-01-01T10:05:00Z',
  filled_at: '2024-01-01T10:05:00Z',
};
