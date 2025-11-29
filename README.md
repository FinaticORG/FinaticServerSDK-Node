# Finatic Node.js SDK

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

## Quick Start

```typescript
import { FinaticServer } from '@finatic/server-node';

// Initialize the client
const client = new FinaticServer({
  baseURL: 'https://api.finatic.dev',
  apiKey: 'your-api-key',
});

// Use the client to interact with the API
async function getOrders() {
  const orders = await client.getOrders();
  return orders;
}
```

## Documentation

Full documentation is available at [docs.finatic.com/node](https://docs.finatic.com/node).

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

## Quality Checks

Run all quality checks to ensure code quality:

```bash
# Run all quality checks (format, lint, type check, build)
npm run quality:check

# Fix all auto-fixable issues (format, lint) and build
npm run quality:fix
```

Individual quality checks:

```bash
# Format check (without modifying files)
npm run format:check
# Format fix (modifies files)
npm run format:fix

# Lint check
npm run lint
# Lint fix (modifies files)
npm run lint:fix

# Type check
npm run type:check

# Syntax check (strict linting)
npm run syntax:check
# Syntax fix (modifies files)
npm run syntax:fix

# Import check
npm run import:check

# Build check
npm run build
```

## License

MIT

## Copyright

© Copyright 2025 Finatic. All Rights Reserved.

---

**Finatic** - Fast. Secure. Standardized.
