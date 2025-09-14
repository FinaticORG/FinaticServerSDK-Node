# Finatic Server SDK Node.js Demo

This demo showcases the Finatic Server SDK Node.js following the exact same flow as the Python SDK.

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

3. **Run the demo**:
```bash
npm run dev
```

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

| Variable | Description | Default |
|----------|-------------|---------|
| `FINATIC_API_URL` | API base URL | `https://api.finatic.dev` |
| `FINATIC_API_KEY` | Your API key | Required |
| `DEMO_COMPANY_ID` | Demo company ID | `demo_company_123` |
| `DEMO_EMAIL` | Demo email | `demo@finatic.com` |
| `DEMO_PASSWORD` | Demo password | `demo_password_123` |

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