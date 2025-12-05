# Finatic Node.js Server SDK

Node.js SDK for the Finatic Server API. Connect your Node.js applications to multiple brokerages through a unified, standardized interface.

**Finatic is a brokerage first aggregator. We simplify, standardize and enhance broker data.**

## Installation

```bash
npm install @finatic/server-node
```

Or using yarn:

```bash
yarn add @finatic/server-node
```

## Quick Start (5 Minutes)

### 1. Initialize the SDK

```typescript
import { FinaticServer } from '@finatic/server-node';

// Initialize with your API key
const finatic = await FinaticServer.init('your-api-key', undefined, {
  baseUrl: 'https://api.finatic.dev', // Optional, defaults to production
  logLevel: 'debug', // Optional: 'debug' | 'info' | 'warn' | 'error'
  structuredLogging: true, // Optional: Enable structured JSON logging
});
```

**Note:** The `init()` method automatically starts a session, so you're ready to use the SDK immediately.

### 2. Get Portal URL for Authentication

The portal allows users to connect their broker accounts. Get the URL and redirect users to it:

```typescript
// Get portal URL
const portalUrl = await finatic.getPortalUrl(
  'dark', // Theme: 'light' | 'dark' | theme object
  ['alpaca', 'tradier'], // Optional: Filter specific brokers
  'user@example.com', // Optional: Pre-fill email
  'dark' // Mode: 'light' | 'dark'
);

console.log('Portal URL:', portalUrl);
// Redirect user to this URL for authentication
```

### 3. Check Authentication Status

```typescript
// Check if user is authenticated
const isAuthenticated = finatic.isAuthed();

// Get current user ID
const userId = finatic.getUserId();

// Get session user details
const sessionUser = await finatic.getSessionUser();
```

### 4. Fetch Data

Once users have authenticated via the portal, you can fetch broker data:

```typescript
// Get all orders (automatically paginates through all pages)
const allOrders = await finatic.getAllOrders();

// Get orders with filters (single page)
const orders = await finatic.getOrders({
  brokerId: 'alpaca',
  accountId: '123456789',
  orderStatus: 'filled',
  limit: 100,
  offset: 0
});

// Get all positions
const allPositions = await finatic.getAllPositions();

// Get positions with filters
const positions = await finatic.getPositions({
  brokerId: 'alpaca',
  symbol: 'AAPL',
  limit: 50
});

// Get all accounts
const allAccounts = await finatic.getAllAccounts();

// Get balances
const balances = await finatic.getBalances({
  brokerId: 'alpaca',
  accountId: '123456789'
});
```

## Complete Example

```typescript
import { FinaticServer } from '@finatic/server-node';

async function main() {
  // 1. Initialize SDK
  const finatic = await FinaticServer.init(
    process.env.FINATIC_API_KEY!,
    undefined, // Optional user ID
    {
      baseUrl: process.env.FINATIC_API_URL || 'https://api.finatic.dev',
      logLevel: 'info',
    }
  );

  // 2. Get portal URL for user authentication
  const portalUrl = await finatic.getPortalUrl('dark');
  console.log('Please visit this URL to authenticate:');
  console.log(portalUrl);

  // Wait for user to authenticate (in a real app, you'd handle this via webhook or polling)
  // For demo purposes, we'll assume authentication is complete

  // 3. Fetch data
  const orders = await finatic.getAllOrders();
  const positions = await finatic.getAllPositions();
  const accounts = await finatic.getAllAccounts();

  console.log('Orders:', orders.success?.data);
  console.log('Positions:', positions.success?.data);
  console.log('Accounts:', accounts.success?.data);
}

main().catch(console.error);
```

## Generate One-Time Tokens for Client SDK

If you need to generate tokens for the Client SDK:

```typescript
// Get a one-time token (useful for passing to client-side applications)
const token = await finatic.getToken();

// Or with a custom API key
const token = await finatic.getToken('custom-api-key');
```

## Available Data Methods

### Orders
- `getOrders(params?)` - Get single page of orders
- `getAllOrders(params?)` - Get all orders (auto-paginated)
- `getOrderFills({ orderId, ... })` - Get fills for a specific order
- `getAllOrderFills({ orderId, ... })` - Get all fills (auto-paginated)
- `getOrderEvents({ orderId, ... })` - Get events for a specific order
- `getAllOrderEvents({ orderId, ... })` - Get all events (auto-paginated)
- `getOrderGroups(params?)` - Get order groups
- `getAllOrderGroups(params?)` - Get all order groups (auto-paginated)

### Positions
- `getPositions(params?)` - Get single page of positions
- `getAllPositions(params?)` - Get all positions (auto-paginated)
- `getPositionLots(params?)` - Get position lots
- `getAllPositionLots(params?)` - Get all position lots (auto-paginated)
- `getPositionLotFills({ lotId, ... })` - Get fills for a specific lot
- `getAllPositionLotFills({ lotId, ... })` - Get all fills (auto-paginated)

### Accounts & Balances
- `getAccounts(params?)` - Get single page of accounts
- `getAllAccounts(params?)` - Get all accounts (auto-paginated)
- `getBalances(params?)` - Get balances
- `getAllBalances(params?)` - Get all balances (auto-paginated)

### Broker Management
- `getBrokers()` - Get available brokers
- `getBrokerConnections()` - Get connected broker accounts
- `disconnectCompanyFromBroker({ connectionId })` - Disconnect a broker

### Company
- `getCompany({ companyId })` - Get company information

## Method Parameters

Most data methods accept optional parameters:

```typescript
{
  brokerId?: string;        // Filter by broker (e.g., 'alpaca', 'tradier')
  connectionId?: string;   // Filter by connection ID
  accountId?: string;       // Filter by account ID
  symbol?: string;          // Filter by symbol (e.g., 'AAPL')
  orderStatus?: string;     // Filter by order status
  side?: string;            // Filter by side ('buy' | 'sell')
  assetType?: string;       // Filter by asset type
  limit?: number;           // Page size (default: varies by endpoint)
  offset?: number;          // Pagination offset (default: 0)
  includeMetadata?: boolean; // Include metadata in response
  // ... other filters specific to each method
}
```

## Response Format

All data methods return a `FinaticResponse` object:

```typescript
{
  success: {
    data: T[], // Array of data items
    // ... other metadata
  },
  error?: {
    message: string;
    code?: string;
  },
  warning?: string[]
}
```

Access the data:
```typescript
const result = await finatic.getOrders();
if (result.success) {
  const orders = result.success.data;
  // Use orders...
} else {
  console.error('Error:', result.error?.message);
}
```

## Session Management

```typescript
// Start a new session (usually done automatically in init())
const sessionResult = await finatic.startSession();

// Get session user
const sessionUser = await finatic.getSessionUser();

// Get session ID
const sessionId = finatic.getSessionId();

// Get company ID
const companyId = finatic.getCompanyId();
```

## Configuration Options

```typescript
const finatic = await FinaticServer.init(apiKey, userId, {
  baseUrl: 'https://api.finatic.dev', // API base URL
  logLevel: 'info', // 'debug' | 'info' | 'warn' | 'error'
  structuredLogging: false, // Enable structured JSON logging
  // ... other options
});
```

## Development

```bash
# Install dependencies
npm install

# Build
npm run build

# Run tests
npm test

# Lint
npm run lint

# Format
npm run format
```

## Documentation

Full API documentation is available at [docs.finatic.com/server/node](https://docs.finatic.com/server/node).

## License

MIT

## Copyright

© Copyright 2025 Finatic. All Rights Reserved.

---

**Finatic** - Fast. Secure. Standardized.
