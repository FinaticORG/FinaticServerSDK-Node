# Finatic Server SDK for Node.js

A comprehensive Node.js SDK for interacting with the Finatic API. This SDK provides authentication, portfolio management, and trading capabilities for server-side applications.

## Features

- **Authentication**: API key-based authentication with session management
- **Portfolio Management**: Access to holdings, positions, and portfolio data
- **Trading Operations**: Place, modify, and cancel orders across multiple brokers
- **Broker Integration**: Support for Robinhood, TastyTrade, Coinbase, and NinjaTrader
- **TypeScript Support**: Full TypeScript definitions included
- **Memory Storage**: All tokens and sessions stored in memory (no persistent storage)
- **Convenience Methods**: Helper methods for common data filtering
- **Asset-Specific Orders**: Simplified order placement for different asset types

## Installation

```bash
npm install @finatic/server-node
```

## Quick Start

```typescript
import { FinaticServerClient } from '@finatic/server-node';

// Initialize the client
const client = new FinaticServerClient('your-api-key');

// Start a session
await client.initialize();
const session = await client.start_session();

// Get portal URL for user authentication
const portalUrl = await client.get_portal_url();
console.log('Portal URL:', portalUrl);

// After user completes authentication, get user info
// User is now authenticated
console.log('User authenticated:', client.get_user_id());

// Get portfolio data
const brokers = await client.get_broker_list();
console.log('Available brokers:', brokers.length);

// Get all orders across all pages
const allOrders = await client.get_all_orders();
console.log('Total orders:', allOrders.length);

// Clean up
await client.close();
```

## Authentication Flow

The SDK supports multiple authentication methods:

### 1. Portal Authentication (Recommended)

```typescript
const client = new FinaticServerClient('your-api-key');
await client.initialize();

// Start session
const session = await client.start_session();

// Get portal URL for user to authenticate
const portalUrl = await client.get_portal_url();

// After user completes authentication in portal
// User is now authenticated
```

### Server: Get one-time token for Client SDK (additive helper)

```typescript
const client = new FinaticServerClient('your-api-key');
await client.initialize();

// Fetch a fresh one-time token without modifying the current server session
const oneTimeToken = await client.getToken();

// Pass this token to the Client SDK on the frontend to start its session
// e.g., window.FinaticClient.init({ token: oneTimeToken })
```

Notes:

- Requires `initialize()` first; otherwise an error is thrown.
- Does not call `/session/start` and does not change `session_id`/`company_id` state.
- Safe to call multiple times; each call returns a new short-lived token.

### 2. Direct Authentication

```typescript
const client = new FinaticServerClient('your-api-key');
await client.initialize();

// Start session with user ID (automatically authenticates)
const session = await client.start_session('user-id');

// Now you can make authenticated requests immediately
const brokers = await client.get_broker_list();
```

## Core Features

### Initialization

```typescript
const client = new FinaticServerClient('your-api-key', {
  baseUrl: 'https://api.finatic.dev', // Optional
  timeout: 30000, // Optional
  deviceInfo: {
    // Optional
    ipAddress: '192.168.1.100',
    userAgent: 'MyApp/1.0.0',
  },
});

await client.initialize();
```

### Authentication

```typescript
// Start session
await client.start_session();

// Start session with user ID (direct auth)
await client.start_session('user123');

// Check authentication status
const isAuthenticated = client.is_authenticated();

// Get user information
const userId = client.get_user_id();
const sessionId = client.get_session_id();
const companyId = client.get_company_id();
```

### Portal Management

```typescript
// Get basic portal URL
const portalUrl = await client.get_portal_url();

// Get portal URL with theming
const portalUrl = await client.get_portal_url({
  theme: { primaryColor: '#007bff', logoUrl: 'https://example.com/logo.png' },
  brokers: ['robinhood', 'tasty_trade'],
  email: 'user@example.com',
});
```

### Broker Data Access

```typescript
// Get broker information
const brokers = await client.get_broker_list();
const connections = await client.get_broker_connections();

// Get accounts with pagination
const accounts = await client.get_accounts(1, 100);
const allAccounts = await client.get_all_accounts();

// Get orders with pagination
const orders = await client.get_orders(1, 100);
const allOrders = await client.get_all_orders();

// Get positions with pagination
const positions = await client.get_positions(1, 100);
const allPositions = await client.get_all_positions();

// Get balances with pagination
const balances = await client.get_balances(1, 100);
const allBalances = await client.get_all_balances();
```

### Convenience Filter Methods

```typescript
// Get filtered data
const openPositions = await client.get_open_positions();
const filledOrders = await client.get_filled_orders();
const pendingOrders = await client.get_pending_orders();
const activeAccounts = await client.get_active_accounts();

// Get data by symbol
const aaplOrders = await client.get_orders_by_symbol('AAPL');
const aaplPositions = await client.get_positions_by_symbol('AAPL');

// Get data by broker
const robinhoodOrders = await client.get_orders_by_broker('robinhood');
const robinhoodPositions = await client.get_positions_by_broker('robinhood');
```

### Trading Operations

#### General Order Placement

```typescript
import { BrokerOrderParams } from '@finatic/server-node';

// Place a market order
const orderParams: BrokerOrderParams = {
  broker: 'robinhood',
  order_type: 'Market',
  asset_type: 'equity',
  action: 'Buy',
  time_in_force: 'day',
  account_number: '123456789',
  symbol: 'AAPL',
  order_qty: 10,
};

const response = await client.place_order(orderParams);
```

#### Asset-Specific Order Methods

##### Stock Orders

```typescript
// Stock market order
const response = await client.place_stock_market_order('AAPL', 10, 'buy', 'robinhood', '123456789');

// Stock limit order
const response = await client.place_stock_limit_order(
  'AAPL',
  10,
  'buy',
  150.0,
  'gtc',
  'robinhood',
  '123456789'
);

// Stock stop order
const response = await client.place_stock_stop_order(
  'AAPL',
  10,
  'sell',
  140.0,
  'gtc',
  'robinhood',
  '123456789'
);
```

##### Crypto Orders

```typescript
// Crypto market order
const response = await client.place_crypto_market_order(
  'BTC-USD',
  0.1,
  'buy',
  'coinbase',
  '123456789'
);

// Crypto limit order
const response = await client.place_crypto_limit_order(
  'BTC-USD',
  0.1,
  'buy',
  50000.0,
  'gtc',
  'coinbase',
  '123456789'
);
```

##### Options Orders

```typescript
// Options market order
const response = await client.place_options_market_order(
  'AAPL240315C00150000',
  1,
  'buy',
  'tasty_trade',
  '123456789'
);

// Options limit order
const response = await client.place_options_limit_order(
  'AAPL240315C00150000',
  1,
  'buy',
  5.0,
  'gtc',
  'tasty_trade',
  '123456789'
);
```

##### Futures Orders

```typescript
// Futures market order
const response = await client.place_futures_market_order(
  'ES',
  1,
  'buy',
  'ninja_trader',
  '123456789'
);

// Futures limit order
const response = await client.place_futures_limit_order(
  'ES',
  1,
  'buy',
  4500.0,
  'gtc',
  'ninja_trader',
  '123456789'
);
```

#### Order Management

```typescript
// Cancel an order
const response = await client.cancel_order('order-123');

// Modify an order
const response = await client.modify_order('order-123', { price: 155.0, quantity: 5 });
```

### Broker Management

```typescript
// Disconnect a company from broker
const response = await client.disconnect_company('connection-123');
```

### Error Handling

```typescript
import { AuthenticationError, ApiError, ValidationError } from '@finatic/server-node';

try {
  const orders = await client.get_orders();
} catch (error) {
  if (error instanceof AuthenticationError) {
    console.error('Authentication failed:', error.message);
  } else if (error instanceof ValidationError) {
    console.error('Invalid request:', error.message);
  } else if (error instanceof ApiError) {
    console.error('API error:', error.message);
  }
}
```

### Advanced Usage

#### Custom Filters

```typescript
import { BrokerDataOptions, OrdersFilter } from '@finatic/server-node';

// Get orders with custom filters
const orders = await client.get_orders(
  1,
  50,
  { broker_name: 'robinhood', account_id: '123456789' },
  { status: 'filled', symbol: 'AAPL' }
);
```

#### Pagination Navigation

```typescript
// Get paginated results with navigation
const ordersPage = await client.get_orders(1, 100);

// Navigate through pages
if (ordersPage.has_next) {
  const nextPage = await ordersPage.next_page();
}

if (ordersPage.has_previous) {
  const prevPage = await ordersPage.previous_page();
}
```

## Type Definitions

The SDK includes comprehensive TypeScript definitions for all data structures:

- `BrokerOrder`: Order information
- `BrokerPosition`: Position information
- `BrokerAccount`: Account information
- `BrokerBalance`: Balance information
- `BrokerInfo`: Broker information
- `BrokerConnection`: Connection information
- `OrderResponse`: Order operation responses
- `PaginatedResult`: Paginated data responses

## Error Types

- `AuthenticationError`: Authentication failures
- `ApiError`: API request failures
- `ValidationError`: Invalid request parameters
- `ConnectionError`: Network connectivity issues

## Requirements

- Node.js 16+
- TypeScript 4.5+ (optional but recommended)

## License

MIT License
