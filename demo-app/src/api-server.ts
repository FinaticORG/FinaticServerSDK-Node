#!/usr/bin/env node

/**
 * Express API Server for Node.js Server SDK Demo
 * Provides API endpoints that match the Client SDK interface
 */

import 'dotenv/config';
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { FinaticServerClient } from '@finatic/server-node';

// Types
interface ApiResponse {
  success: boolean;
  data?: any;
  error?: string;
}

interface SessionAuthenticateRequest {
  user_id: string;
}

interface OrderRequest {
  symbol: string;
  quantity?: number;
  orderQty?: number; // Frontend sends this
  side?: string; // Frontend sends 'action'
  action?: string; // Frontend sends this
  order_type?: string; // Frontend sends 'orderType'
  orderType?: string; // Frontend sends this
  assetType?: string; // Frontend sends this
  price?: number;
  stop_price?: number;
  time_in_force?: string; // Frontend sends 'timeInForce'
  timeInForce?: string; // Frontend sends this
  broker?: string;
  account?: string;
  accountNumber?: string; // Frontend sends this
}

interface OrderCancelRequest {
  order_id: string;
}

interface OrderModifyRequest {
  order_id: string;
  modifications: Record<string, any>;
}

interface TradingContextRequest {
  broker?: string;
  account?: string;
}

// Global SDK client instance
let sdkClient: FinaticServerClient | null = null;

// Global trading context storage (in production, use proper session management)
const tradingContext = { broker: null as string | null, account: null as string | null };

// Session state management (in production, use proper session storage)
interface SessionState {
  sessionId?: string;
  companyId?: string;
  isAuthenticated?: boolean;
  userId?: string;
}

let sessionState: SessionState = {};

// Initialize SDK client
async function initializeSDK(): Promise<void> {
  const apiKey = process.env.FINATIC_API_KEY;
  if (!apiKey) {
    throw new Error('FINATIC_API_KEY environment variable is required');
  }

  const apiUrl = process.env.FINATIC_API_URL || 'https://api.finatic.dev';

  console.log('🚀 Initializing Node.js Server SDK...');
  console.log(`   API URL: ${apiUrl}`);
  console.log(`   API Key: ${apiKey.substring(0, 10)}...`);

  sdkClient = new FinaticServerClient(apiKey, apiUrl);

  console.log('✅ Node.js Server SDK initialized successfully');
}

// Create Express app
const app = express();

// Middleware
app.use(express.json());
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3001'], // Client demo app
  credentials: true
}));

// Disable ALL caching and conditional requests for demo app
app.use((req: Request, res: Response, next: NextFunction) => {
  // Remove ALL conditional request headers that cause 304 responses
  delete req.headers['if-none-match'];
  delete req.headers['if-modified-since'];
  delete req.headers['if-unmodified-since'];
  delete req.headers['if-match'];
  delete req.headers['if-range'];
  
  // Express will handle freshness based on headers we set below
  
  // Set comprehensive anti-caching headers for demo app
  res.set({
    'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0, s-maxage=0',
    'Pragma': 'no-cache',
    'Expires': '-1', // Past date
    'Last-Modified': new Date().toUTCString(), // Always fresh timestamp
    'Surrogate-Control': 'no-store',
    'ETag': undefined, // Remove any existing ETag
    'Vary': '*', // Prevent any caching variations
    'Date': new Date().toUTCString(),
    'Age': '0' // No age on responses
  });
  
  next();
});

// Request logging middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  const timestamp = new Date().toISOString();
  const method = req.method;
  const url = req.url;
  const userAgent = req.get('User-Agent') || 'Unknown';
  
  console.log(`[${timestamp}] ${method} ${url} - ${userAgent}`);
  
  // Log response when it finishes
  const originalSend = res.send;
  res.send = function(body) {
    console.log(`[${timestamp}] ${method} ${url} -> ${res.statusCode}`);
    return originalSend.call(this, body);
  };
  
  next();
});

// Helper function to send API responses - DEMO APP: Never cache anything
function sendApiResponse(res: Response, success: boolean, data?: any, error?: string, statusCode: number = 200): void {
  // Force fresh response every time - no caching for demo
  res.status(statusCode);
  
  // Add timestamp to data to ensure it's always different
  const freshData = data ? { ...data, _timestamp: new Date().toISOString() } : data;
  
  // Set comprehensive anti-caching headers
  res.set({
    'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0, s-maxage=0, private',
    'Pragma': 'no-cache',
    'Expires': '-1', // Always expired
    'Last-Modified': new Date().toUTCString(),
    'ETag': `"demo-${Date.now()}"`, // Unique ETag every time
    'Vary': '*',
    'Date': new Date().toUTCString(),
    'Age': '0'
  });
  
  const response: ApiResponse = { success, data: freshData, error };
  res.json(response);
}

// Helper function to handle async route errors
function asyncHandler(fn: Function) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

// Health check endpoint
app.get('/api/health', (req: Request, res: Response) => {
  // Always return fresh health data with timestamp to prevent caching
  const healthData = { 
    status: 'healthy', 
    sdk: 'node', 
    port: 8003,
    timestamp: new Date().toISOString()
  };
  sendApiResponse(res, true, healthData, undefined, 200);
});

// Session endpoints
app.post('/api/session/start', asyncHandler(async (req: Request, res: Response) => {
  console.log('📝 Processing /api/session/start request');
  if (!sdkClient) {
    return sendApiResponse(res, false, null, 'SDK client not initialized', 500);
  }

  try {
    console.log('🔄 Starting session with Node SDK...');
    const sessionResponse = await sdkClient.start_session();
    
    // Update session state - handle both flat and nested response structures
    const sessionId = sessionResponse.session_id || sessionResponse.data?.session_id;
    const companyId = sessionResponse.company_id || sessionResponse.data?.company_id;
    
    sessionState = {
      sessionId,
      companyId,
      isAuthenticated: false, // Will be true after portal authentication
    };
    
    console.log(`✅ Session started successfully: ${sessionId}`);
    sendApiResponse(res, true, sessionResponse);
  } catch (error: any) {
    console.error('❌ Failed to start session:', error.message);
    sendApiResponse(res, false, null, error.message);
  }
}));

app.post('/api/session/authenticate', asyncHandler(async (req: Request, res: Response) => {
  const { user_id }: SessionAuthenticateRequest = req.body;

  if (!sdkClient) {
    return sendApiResponse(res, false, null, 'SDK client not initialized', 500);
  }

  try {
    // Update session state to mark as authenticated
    sessionState.userId = user_id;
    sessionState.isAuthenticated = true;
    
    sendApiResponse(res, true, { user_id, authenticated: true });
  } catch (error: any) {
    sendApiResponse(res, false, null, error.message);
  }
}));

app.get('/api/session/user', asyncHandler(async (req: Request, res: Response) => {
  console.log('📝 Processing /api/session/user request');
  if (!sdkClient) {
    return sendApiResponse(res, false, null, 'SDK client not initialized', 500);
  }

  // Check if we have a valid session
  if (!sessionState.sessionId || !sessionState.companyId) {
    console.log('❌ No active session found');
    return sendApiResponse(res, false, null, 'No active session. Please start a session first.');
  }

  console.log(`🔄 Getting session user for session: ${sessionState.sessionId}`);
  try {
    // Check if the session is properly authenticated
    // For demo purposes, if we have sessionId and companyId, try to get user info
    const userInfo = await sdkClient.get_session_user();
    console.log('✅ Successfully retrieved session user info');
    sendApiResponse(res, true, userInfo);
  } catch (error: any) {
    // If get_session_user fails, it might be because the user hasn't completed portal auth
    // Return a more informative error or provide mock data for demo
    console.error('❌ Failed to get session user:', error.message);
    
    // For demo purposes, return mock user data if the real call fails
    if (sessionState.isAuthenticated && sessionState.userId) {
      const mockUserInfo = {
        user_id: sessionState.userId,
        company_id: sessionState.companyId,
        access_token: 'demo_token_' + Date.now(),
        refresh_token: 'demo_refresh_' + Date.now(),
        expires_in: 3600,
        token_type: 'Bearer',
        scope: 'api:access'
      };
      return sendApiResponse(res, true, mockUserInfo);
    }
    
    sendApiResponse(res, false, null, `Failed to get session user: ${error.message}`);
  }
}));

app.get('/api/session/user-id', (req: Request, res: Response) => {
  // Return the user ID from session state
  sendApiResponse(res, true, sessionState.userId || null);
});

app.get('/api/session/is-authed', (req: Request, res: Response) => {
  // Check if we have a valid authenticated session
  sendApiResponse(res, true, sessionState.isAuthenticated && !!sessionState.sessionId);
});

app.get('/api/session/portal-url', asyncHandler(async (req: Request, res: Response) => {
  if (!sdkClient) {
    return sendApiResponse(res, false, null, 'SDK client not initialized', 500);
  }

  if (!sessionState.sessionId) {
    return sendApiResponse(res, false, null, 'No active session. Please start a session first.');
  }

  try {
    // Extract query parameters
    const { brokers, email, theme_preset } = req.query;
    
    // Parse brokers if provided (comma-separated list)
    let brokerList: string[] | undefined;
    if (brokers && typeof brokers === 'string') {
      brokerList = brokers.split(',').map(b => b.trim()).filter(b => b.length > 0);
    }
    
    // Build theme object if preset is provided
    let themeObj: any;
    if (theme_preset && typeof theme_preset === 'string') {
      themeObj = { preset: theme_preset };
    }
    
    const portalUrl = await sdkClient.get_portal_url(
      themeObj,
      brokerList,
      typeof email === 'string' ? email : undefined
    );
    sendApiResponse(res, true, { portal_url: portalUrl });
  } catch (error: any) {
    sendApiResponse(res, false, null, error.message);
  }
}));

app.post('/api/session/confirm-auth', asyncHandler(async (req: Request, res: Response) => {
  console.log('📝 Processing /api/session/confirm-auth request');
  if (!sdkClient) {
    return sendApiResponse(res, false, null, 'SDK client not initialized', 500);
  }

  if (!sessionState.sessionId) {
    return sendApiResponse(res, false, null, 'No active session. Please start a session first.', 400);
  }

  try {
    console.log(`🔄 Confirming authentication for session: ${sessionState.sessionId}`);
    const userInfo = await sdkClient.get_session_user();
    
    // Update session state since authentication is now complete
    sessionState.isAuthenticated = true;
    if (userInfo.user_id) {
      sessionState.userId = userInfo.user_id;
    }
    
    console.log('✅ Authentication confirmed successfully');
    sendApiResponse(res, true, userInfo);
  } catch (error: any) {
    console.error('❌ Failed to confirm authentication:', error.message);
    sendApiResponse(res, false, null, `Authentication not yet complete: ${error.message}`, 400);
  }
}));

// Broker endpoints
app.get('/api/broker/list', asyncHandler(async (req: Request, res: Response) => {
  if (!sdkClient) {
    return sendApiResponse(res, false, null, 'SDK client not initialized', 500);
  }

  try {
    const brokers = await sdkClient.get_broker_list();
    sendApiResponse(res, true, brokers);
  } catch (error: any) {
    sendApiResponse(res, false, null, error.message);
  }
}));

app.get('/api/broker/connections', asyncHandler(async (req: Request, res: Response) => {
  if (!sdkClient) {
    return sendApiResponse(res, false, null, 'SDK client not initialized', 500);
  }

  try {
    const connections = await sdkClient.get_broker_connections();
    sendApiResponse(res, true, connections);
  } catch (error: any) {
    sendApiResponse(res, false, null, error.message);
  }
}));

app.get('/api/broker/accounts', asyncHandler(async (req: Request, res: Response) => {
  if (!sdkClient) {
    return sendApiResponse(res, false, null, 'SDK client not initialized', 500);
  }

  try {
    const page = parseInt(req.query.page as string) || 1;
    const perPage = parseInt(req.query.per_page as string) || 100;

    const accounts = await sdkClient.get_all_broker_accounts();

    // Simple pagination
    const start = (page - 1) * perPage;
    const end = start + perPage;
    const paginatedAccounts = accounts.slice(start, end);

    const response = {
      data: paginatedAccounts,
      pagination: {
        page,
        per_page: perPage,
        total: accounts.length,
        total_pages: Math.ceil(accounts.length / perPage)
      }
    };

    sendApiResponse(res, true, response);
  } catch (error: any) {
    sendApiResponse(res, false, null, error.message);
  }
}));

app.get('/api/broker/accounts/all', asyncHandler(async (req: Request, res: Response) => {
  if (!sdkClient) {
    return sendApiResponse(res, false, null, 'SDK client not initialized', 500);
  }

  try {
    const accounts = await sdkClient.get_all_broker_accounts();
    sendApiResponse(res, true, accounts);
  } catch (error: any) {
    sendApiResponse(res, false, null, error.message);
  }
}));

app.post('/api/broker/disconnect', asyncHandler(async (req: Request, res: Response) => {
  if (!sdkClient) {
    return sendApiResponse(res, false, null, 'SDK client not initialized', 500);
  }

  const { connection_id } = req.body;

  if (!connection_id || !connection_id.trim()) {
    // In demo environment, don't fail if no connection_id provided
    console.log('🔍 disconnect_company called with empty connection_id - returning success for demo');
    return sendApiResponse(res, true, {
      message: 'No connection_id provided - demo mode',
      disconnected: false
    });
  }

  try {
    const result = await sdkClient.disconnect_company(connection_id);
    sendApiResponse(res, true, result);
  } catch (error: any) {
    // In demo environment, return success even if the connection doesn't exist
    const errorMsg = error.message || String(error);
    if (errorMsg.includes('not found') || errorMsg.includes('400') || errorMsg.includes('404')) {
      console.log('🔍 disconnect_company failed but returning success for demo:', errorMsg);
      return sendApiResponse(res, true, {
        message: `Connection not found or invalid: ${errorMsg}`,
        disconnected: false
      });
    }
    // Re-raise unexpected errors
    sendApiResponse(res, false, null, error.message);
  }
}));

// Trading endpoints
app.get('/api/trading/orders', asyncHandler(async (req: Request, res: Response) => {
  if (!sdkClient) {
    return sendApiResponse(res, false, null, 'SDK client not initialized', 500);
  }

  try {
    const page = parseInt(req.query.page as string) || 1;
    const perPage = parseInt(req.query.per_page as string) || 100;

    const orders = await sdkClient.get_orders();

    // Simple pagination
    const orderList = orders?.data || [];
    const start = (page - 1) * perPage;
    const end = start + perPage;
    const paginatedOrders = orderList.slice(start, end);

    const response = {
      data: paginatedOrders,
      pagination: {
        page,
        per_page: perPage,
        total: orderList.length,
        total_pages: Math.ceil(orderList.length / perPage)
      }
    };

    sendApiResponse(res, true, response);
  } catch (error: any) {
    sendApiResponse(res, false, null, error.message);
  }
}));

app.get('/api/trading/orders/all', asyncHandler(async (req: Request, res: Response) => {
  if (!sdkClient) {
    return sendApiResponse(res, false, null, 'SDK client not initialized', 500);
  }

  try {
    const orders = await sdkClient.get_orders();
    const orderList = orders?.data || [];
    sendApiResponse(res, true, orderList);
  } catch (error: any) {
    sendApiResponse(res, false, null, error.message);
  }
}));

app.get('/api/trading/positions', asyncHandler(async (req: Request, res: Response) => {
  if (!sdkClient) {
    return sendApiResponse(res, false, null, 'SDK client not initialized', 500);
  }

  try {
    const page = parseInt(req.query.page as string) || 1;
    const perPage = parseInt(req.query.per_page as string) || 100;

    const positions = await sdkClient.get_positions();

    // Simple pagination
    const positionList = positions?.data || [];
    const start = (page - 1) * perPage;
    const end = start + perPage;
    const paginatedPositions = positionList.slice(start, end);

    const response = {
      data: paginatedPositions,
      pagination: {
        page,
        per_page: perPage,
        total: positionList.length,
        total_pages: Math.ceil(positionList.length / perPage)
      }
    };

    sendApiResponse(res, true, response);
  } catch (error: any) {
    sendApiResponse(res, false, null, error.message);
  }
}));

app.get('/api/trading/positions/all', asyncHandler(async (req: Request, res: Response) => {
  if (!sdkClient) {
    return sendApiResponse(res, false, null, 'SDK client not initialized', 500);
  }

  try {
    const positions = await sdkClient.get_positions();
    const positionList = positions?.data || [];
    sendApiResponse(res, true, positionList);
  } catch (error: any) {
    sendApiResponse(res, false, null, error.message);
  }
}));

app.get('/api/trading/balances', asyncHandler(async (req: Request, res: Response) => {
  if (!sdkClient) {
    return sendApiResponse(res, false, null, 'SDK client not initialized', 500);
  }

  try {
    const page = parseInt(req.query.page as string) || 1;
    const perPage = parseInt(req.query.per_page as string) || 100;

    const balances = await sdkClient.get_balances();

    // Simple pagination
    const balanceList = balances || [];
    const start = (page - 1) * perPage;
    const end = start + perPage;
    const paginatedBalances = balanceList.slice(start, end);

    const response = {
      data: paginatedBalances,
      pagination: {
        page,
        per_page: perPage,
        total: balanceList.length,
        total_pages: Math.ceil(balanceList.length / perPage)
      }
    };

    sendApiResponse(res, true, response);
  } catch (error: any) {
    sendApiResponse(res, false, null, error.message);
  }
}));

app.get('/api/trading/balances/all', asyncHandler(async (req: Request, res: Response) => {
  if (!sdkClient) {
    return sendApiResponse(res, false, null, 'SDK client not initialized', 500);
  }

  try {
    const balances = await sdkClient.get_balances();
    sendApiResponse(res, true, balances);
  } catch (error: any) {
    sendApiResponse(res, false, null, error.message);
  }
}));

// Trading context endpoints
app.post('/api/trading/context/broker', (req: Request, res: Response) => {
  const { broker }: TradingContextRequest = req.body;
  tradingContext.broker = broker || null;
  sendApiResponse(res, true, tradingContext);
});

app.post('/api/trading/context/account', (req: Request, res: Response) => {
  const { account }: TradingContextRequest = req.body;
  tradingContext.account = account || null;
  sendApiResponse(res, true, tradingContext);
});

app.get('/api/trading/context', (req: Request, res: Response) => {
  sendApiResponse(res, true, tradingContext);
});

// Order management endpoints
app.post('/api/trading/order', asyncHandler(async (req: Request, res: Response) => {
  if (!sdkClient) {
    return sendApiResponse(res, false, null, 'SDK client not initialized', 500);
  }

  const orderData: OrderRequest = req.body;

  try {
    // Convert request to SDK format - handle both frontend and backend parameter names
    const orderParams: any = {
      symbol: orderData.symbol,
      order_qty: orderData.orderQty || orderData.quantity,
      action: orderData.action || orderData.side,
      order_type: orderData.orderType || orderData.order_type,
      asset_type: orderData.assetType || 'Stock', // Use frontend assetType or default to Stock
      time_in_force: orderData.timeInForce || orderData.time_in_force || 'day'
    };

    if (orderData.price) orderParams.price = orderData.price;
    if (orderData.stop_price) orderParams.stop_price = orderData.stop_price;
    if (orderData.broker) orderParams.broker = orderData.broker;
    
    // Handle account parameter - frontend sends accountNumber
    const accountValue = orderData.accountNumber || orderData.account;
    if (accountValue) {
      orderParams.account_number = accountValue;
      // Also set the account in the SDK's trading context for fallback
      sdkClient.set_account(accountValue);
    }

    // Set broker in trading context if provided
    if (orderData.broker) {
      sdkClient.set_broker(orderData.broker);
    }

    console.log('🔄 Placing order with params:', orderParams);
    const result = await sdkClient.place_order(orderParams);
    sendApiResponse(res, true, result);
  } catch (error: any) {
    console.error('❌ Failed to place order:', error.message);
    sendApiResponse(res, false, null, error.message);
  }
}));

app.post('/api/trading/order/cancel', asyncHandler(async (req: Request, res: Response) => {
  if (!sdkClient) {
    return sendApiResponse(res, false, null, 'SDK client not initialized', 500);
  }

  const { order_id }: OrderCancelRequest = req.body;

  try {
    const result = await sdkClient.cancel_order(order_id);
    sendApiResponse(res, true, result);
  } catch (error: any) {
    sendApiResponse(res, false, null, error.message);
  }
}));

app.post('/api/trading/order/modify', asyncHandler(async (req: Request, res: Response) => {
  if (!sdkClient) {
    return sendApiResponse(res, false, null, 'SDK client not initialized', 500);
  }

  const { order_id, modifications }: OrderModifyRequest = req.body;

  try {
    const result = await sdkClient.modify_order(order_id, modifications);
    sendApiResponse(res, true, result);
  } catch (error: any) {
    sendApiResponse(res, false, null, error.message);
  }
}));

// Error handling middleware
app.use((error: any, req: Request, res: Response, next: NextFunction) => {
  console.error('API Error:', error);
  sendApiResponse(res, false, null, error.message || 'Internal server error');
});

// Start server
async function startServer(): Promise<void> {
  try {
    // Initialize SDK
    await initializeSDK();

    // Start Express server
    const port = 8003;
    app.listen(port, () => {
      console.log('🚀 Node.js Server SDK API started');
      console.log(`   Port: ${port}`);
      console.log('   CORS enabled for: http://localhost:3000, http://localhost:3001');
      console.log('   Request logging enabled - you will see incoming requests below:');
      console.log('   Ready to accept requests!');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🔄 Shutting down Node.js Server SDK API...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🔄 Shutting down Node.js Server SDK API...');
  process.exit(0);
});

// Start the server
if (require.main === module) {
  startServer().catch((error) => {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  });
}

export default app;
