# Finatic Server SDK for Node.js

A comprehensive Node.js SDK for interacting with the Finatic API. This SDK provides authentication, portfolio management, and trading capabilities for server-side applications.

## Features

- **Authentication**: API key-based authentication with session management
- **Portfolio Management**: Access to holdings, positions, and portfolio data
- **Trading Operations**: Place, modify, and cancel orders across multiple brokers
- **Broker Integration**: Support for Robinhood, TastyTrade, and NinjaTrader
- **TypeScript Support**: Full TypeScript definitions included
- **Memory Storage**: All tokens and sessions stored in memory (no persistent storage)

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
const userInfo = await client.get_session_user();
console.log('User authenticated:', userInfo.user_id);

// Get portfolio data
const portfolio = await client.get_portfolio();
console.log('Portfolio value:', portfolio.equity);

// Place an order
const orderResponse = await client.place_order({
  broker: 'robinhood',
  order_type: 'Market',
  asset_type: 'Stock',
  action: 'Buy',
  time_in_force: 'day',
  account_number: '123456789',
  symbol: 'AAPL',
  order_qty: 10,
});

console.log('Order placed:', orderResponse);

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
const userInfo = await client.get_session_user();
```

### 2. Direct Authentication
```typescript
const client = new FinaticServerClient('your-api-key');
await client.initialize();

// Start session with user ID
const session = await client.start_session('user-id');

// Authenticate directly
const authResponse = await client.authenticate_directly('user-id');
```

### 3. OTP Authentication
```typescript
const client = new FinaticServerClient('your-api-key');
await client.initialize();

// Start session
const session = await client.start_session();

// Request OTP
await client.request_otp('user@example.com');

// Verify OTP
const otpResponse = await client.verify_otp('123456');
```

## Trading Operations

### Place Orders
```typescript
// Market order
const marketOrder = await client.place_order({
  broker: 'robinhood',
  order_type: 'Market',
  asset_type: 'Stock',
  action: 'Buy',
  time_in_force: 'day',
  account_number: '123456789',
  symbol: 'AAPL',
  order_qty: 10,
});

// Limit order
const limitOrder = await client.place_order({
  broker: 'robinhood',
  order_type: 'Limit',
  asset_type: 'Stock',
  action: 'Buy',
  time_in_force: 'day',
  account_number: '123456789',
  symbol: 'AAPL',
  order_qty: 10,
  price: 150.00,
});
```

### Modify Orders
```typescript
const modifiedOrder = await client.modify_order('order-id', {
  broker: 'robinhood',
  order_type: 'Limit',
  asset_type: 'Stock',
  action: 'Buy',
  time_in_force: 'day',
  account_number: '123456789',
  symbol: 'AAPL',
  order_qty: 15, // Changed quantity
  price: 155.00, // Changed price
});
```

### Cancel Orders
```typescript
const cancelResponse = await client.cancel_order('order-id');
```

## Portfolio Management

### Get Portfolio
```typescript
const portfolio = await client.get_portfolio();
console.log('Total equity:', portfolio.equity);
console.log('Cash available:', portfolio.cash);
console.log('Buying power:', portfolio.buying_power);
```

### Get Holdings
```typescript
const holdings = await client.get_holdings();
holdings.forEach(holding => {
  console.log(`${holding.symbol}: ${holding.quantity} shares @ $${holding.average_price}`);
});
```

### Get Positions
```typescript
const positions = await client.get_positions();
console.log('Total positions:', positions.data.length);
```

## Broker Management

### Get Available Brokers
```typescript
const brokers = await client.get_brokers();
brokers.forEach(broker => {
  console.log(`${broker.name}: ${broker.description}`);
});
```

### Get Broker Accounts
```typescript
const accounts = await client.get_broker_accounts();
accounts.forEach(account => {
  console.log(`${account.account_name}: $${account.cash_balance}`);
});
```

### Get Broker Orders
```typescript
const orders = await client.get_broker_orders({
  broker_id: 'robinhood',
  limit: 50,
  offset: 0,
});
```

## Error Handling

The SDK provides specific error types for different scenarios:

```typescript
import { 
  AuthenticationError, 
  ValidationError, 
  OrderError,
  ApiError 
} from '@finatic/server-node';

try {
  await client.place_order(orderParams);
} catch (error) {
  if (error instanceof AuthenticationError) {
    console.log('Authentication failed:', error.message);
  } else if (error instanceof ValidationError) {
    console.log('Invalid order parameters:', error.message);
  } else if (error instanceof OrderError) {
    console.log('Order failed:', error.message);
  } else {
    console.log('Unexpected error:', error.message);
  }
}
```

## TypeScript Support

The SDK is written in TypeScript and provides full type definitions:

```typescript
import { 
  FinaticServerClient, 
  BrokerOrderParams, 
  OrderResponse,
  Portfolio,
  Holding 
} from '@finatic/server-node';

const client: FinaticServerClient = new FinaticServerClient('api-key');
const orderParams: BrokerOrderParams = {
  broker: 'robinhood',
  order_type: 'Market',
  asset_type: 'Stock',
  action: 'Buy',
  time_in_force: 'day',
  account_number: '123456789',
  symbol: 'AAPL',
  order_qty: 10,
};
```

## Configuration

### Device Information
```typescript
import { DeviceInfo } from '@finatic/server-node';

const deviceInfo: DeviceInfo = {
  ip_address: '192.168.1.100',
  user_agent: 'MyApp/1.0.0',
  fingerprint: 'unique-device-fingerprint',
};

const client = new FinaticServerClient('api-key', 'https://api.finatic.dev', deviceInfo);
```

### Trading Context
```typescript
// Set default trading context
client.set_trading_context({
  broker: 'robinhood',
  account_number: '123456789',
  account_id: 'account-id',
});

// Get current context
const context = client.get_trading_context();
```

## Pagination

Many endpoints support pagination:

```typescript
const orders = await client.get_orders({ limit: 20, offset: 0 });

// Navigate pages
if (orders.has_next) {
  const nextPage = await orders.next_page();
}

if (orders.has_previous) {
  const prevPage = await orders.previous_page();
}

// Go to specific page
const page3 = await orders.go_to_page(3);
```

## License

MIT

## Support

For support and questions, please visit our [documentation](https://docs.finatic.dev) or contact support.
