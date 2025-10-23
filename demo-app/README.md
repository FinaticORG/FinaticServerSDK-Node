# Finatic Server SDK Node.js Demo

This demo showcases the Finatic Server SDK Node.js with both CLI and API server capabilities.

## Setup

1. **Create a `.env` file** in this directory with your configuration:

```bash
# For production API
FINATIC_API_URL=https://api.finatic.dev
FINATIC_API_KEY=your_api_key_here

# For localhost testing
FINATIC_API_URL=http://localhost:8000
FINATIC_API_KEY=your_api_key_here

# Optional demo configuration
DEMO_COMPANY_ID=demo_company_123
DEMO_EMAIL=demo@finatic.com
DEMO_PASSWORD=demo_password_123
```

2. **Install dependencies**:

```bash
npm install
```

3. **Run the CLI demo**:

```bash
npm run dev
```

## API Server

The API server runs on port **3002** and provides endpoints that match the Client SDK interface.

### Development Mode

```bash
npm run api:dev
```

### Production Mode

```bash
npm run api:build
npm run api:start
```

The server will be available at `http://localhost:3002` and includes:

- CORS support for `http://localhost:3000` (Client SDK demo app)
- Health check endpoint at `/api/health`
- All Client SDK method endpoints under `/api/`

## API Endpoints

### Session Management

- `POST /api/session/start` - Start new session
- `POST /api/session/authenticate` - Authenticate with user ID
- `GET /api/session/user` - Get session user info
- `GET /api/session/user-id` - Get current user ID
- `GET /api/session/is-authed` - Check authentication status

### Broker Data

- `GET /api/broker/list` - Get available brokers
- `GET /api/broker/connections` - Get broker connections
- `GET /api/broker/accounts` - Get accounts (paginated)
- `GET /api/broker/accounts/all` - Get all accounts
- `POST /api/broker/disconnect` - Disconnect company

### Trading Data

- `GET /api/trading/orders` - Get orders (paginated)
- `GET /api/trading/orders/all` - Get all orders
- `GET /api/trading/positions` - Get positions (paginated)
- `GET /api/trading/positions/all` - Get all positions
- `GET /api/trading/balances` - Get balances (paginated)
- `GET /api/trading/balances/all` - Get all balances

### Trading Context

- `POST /api/trading/context/broker` - Set trading broker
- `POST /api/trading/context/account` - Set trading account
- `GET /api/trading/context` - Get trading context

### Order Management

- `POST /api/trading/order` - Place new order
- `POST /api/trading/order/cancel` - Cancel order
- `POST /api/trading/order/modify` - Modify order

## Integration with Client SDK Demo

This API server is designed to work with the Client SDK demo app's SDK switcher. When you select "Node Server SDK" in the demo app settings, it will connect to this server on port 3002.

## Demo Flow

The demo follows the exact Python SDK authentication flow:

1. **Initialize SDK** - Creates client with API key
2. **Start Session** - Initializes a session with the API
3. **Get Portal URL** - Retrieves authentication URL
4. **User Authentication** - User visits portal URL to authenticate
5. **Get Session User** - Retrieves authenticated user info
6. **Test Data Methods** - Demonstrates all available SDK methods

## Available Methods

Once authenticated, you can use:

- `get_broker_list()` - Get available brokers
- `get_all_broker_accounts()` - Get broker accounts
- `get_orders()` - Get trading orders
- `get_positions()` - Get trading positions
- `get_portfolio()` - Get portfolio information
- `get_holdings()` - Get portfolio holdings
- `get_broker_connections()` - Get broker connections

## Environment Variables

| Variable          | Description     | Default                   |
| ----------------- | --------------- | ------------------------- |
| `FINATIC_API_URL` | API base URL    | `https://api.finatic.dev` |
| `FINATIC_API_KEY` | Your API key    | Required                  |
| `DEMO_COMPANY_ID` | Demo company ID | `demo_company_123`        |
| `DEMO_EMAIL`      | Demo email      | `demo@finatic.com`        |
| `DEMO_PASSWORD`   | Demo password   | `demo_password_123`       |

## Error Handling

The demo includes helpful error messages for common issues:

- **401 Unauthorized**: Invalid API key or endpoint not accessible
- **Missing API Key**: Environment variable not set
- **Network Issues**: Connection problems

## Localhost Testing

To test against a local API server:

1. Set `FINATIC_API_URL=http://localhost:8000` in your `.env` file
2. Ensure your local API server is running
3. Run the demo as usual

The SDK will automatically use the localhost URL for all API calls.
