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
  // Only add timestamp to objects, not primitives
  const freshData = data && typeof data === 'object' && !Array.isArray(data) 
    ? { ...data, _timestamp: new Date().toISOString() } 
    : data;
  
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
    // Extract user_id from request body if provided
    const { user_id } = req.body;
    console.log(`🔄 Starting session with Node SDK... user_id: ${user_id || 'None'}`);
    
    const sessionResponse = await sdkClient.start_session(user_id);
    
    // Update session state - handle both flat and nested response structures
    const sessionId = sessionResponse.data?.session_id || 'demo-session-' + Date.now();
    const companyId = sessionResponse.data?.company_id || 'demo-company-' + Date.now();
    
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

app.get('/api/session/user-id', asyncHandler(async (req: Request, res: Response) => {
  if (!sessionState.sessionId) {
    return sendApiResponse(res, true, null);
  }

  try {
    // Call the main API to get user ID
    const response = await fetch(`http://localhost:8000/api/v1/session/${sessionState.sessionId}/user`, {
      method: 'GET',
      headers: {
        'Session-ID': sessionState.sessionId,
        'Company-ID': sessionState.companyId || '',
        'X-API-Key': process.env.FINATIC_API_KEY || ''
      }
    });
    
    if (!response.ok) {
      return sendApiResponse(res, true, null);
    }
    
    const data = await response.json() as any;
    const userId = data.data?.user_id || data.user_id;
    
    // Update session state
    if (userId) {
      sessionState.userId = userId;
      sessionState.isAuthenticated = true;
    }
    
    sendApiResponse(res, true, userId || null);
  } catch (error: any) {
    console.error('❌ Failed to get user ID:', error.message);
    sendApiResponse(res, true, null);
  }
}));

app.get('/api/session/is-authed', asyncHandler(async (req: Request, res: Response) => {
  if (!sessionState.sessionId) {
    return sendApiResponse(res, true, false);
  }

  try {
    // Call the main API to check if user is linked to session
    const response = await fetch(`http://localhost:8000/api/v1/session/${sessionState.sessionId}/user`, {
      method: 'GET',
      headers: {
        'Session-ID': sessionState.sessionId,
        'Company-ID': sessionState.companyId || '',
        'X-API-Key': process.env.FINATIC_API_KEY || ''
      }
    });
    
    if (!response.ok) {
      return sendApiResponse(res, true, false);
    }
    
    const data = await response.json() as any;
    const userId = data.data?.user_id || data.user_id;
    const isAuthenticated = !!userId;
    
    // Update session state
    sessionState.isAuthenticated = isAuthenticated;
    if (userId) {
      sessionState.userId = userId;
    }
    
    sendApiResponse(res, true, isAuthenticated);
  } catch (error: any) {
    console.error('❌ Failed to check authentication:', error.message);
    sendApiResponse(res, true, false);
  }
}));

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
    
    console.log('🔍 Portal URL parameters:', { themeObj, brokerList, email });
    console.log('🔍 Query parameters received:', req.query);
    
    // Since the SDK might not support parameters, let's call the main API directly
    try {
      const sessionId = sessionState.sessionId;
      if (!sessionId) {
        throw new Error('No active session');
      }
      
      // Build query parameters for the main API
      const params = new URLSearchParams();
      if (themeObj?.preset) params.append('theme_preset', themeObj.preset);
      if (brokerList && brokerList.length > 0) params.append('brokers', brokerList.join(','));
      if (email) params.append('email', email as string);
      
      const queryString = params.toString();
      const apiUrl = `http://localhost:8000/api/v1/session/portal${queryString ? `?${queryString}` : ''}`;
      
      console.log('🔍 Calling main API:', apiUrl);
      
      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Session-ID': sessionId,
          'X-API-Key': process.env.FINATIC_API_KEY || ''
        }
      });
      
      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
      }
      
      const data = await response.json() as any;
      let portalUrl = data.data?.portal_url || data.portal_url;
      
      // Append parameters to the portal URL
      const urlParams = new URLSearchParams();
      if (themeObj?.preset) urlParams.append('theme', themeObj.preset);
      if (brokerList && brokerList.length > 0) {
        // Encode brokers as base64 like the Python SDK does
        const brokersJson = JSON.stringify(brokerList);
        const brokersBase64 = Buffer.from(brokersJson).toString('base64');
        urlParams.append('brokers', brokersBase64);
      }
      if (email) urlParams.append('email', email as string);
      
      if (urlParams.toString()) {
        const separator = portalUrl.includes('?') ? '&' : '?';
        portalUrl = `${portalUrl}${separator}${urlParams.toString()}`;
      }
      
      console.log('🔍 Generated portal URL with parameters:', portalUrl);
      sendApiResponse(res, true, { portal_url: portalUrl });
    } catch (apiError) {
      console.error('❌ Direct API call failed, falling back to SDK:', apiError);
      // Fallback to SDK method
      let portalUrl = await sdkClient.get_portal_url(themeObj, brokerList, email as string);
      
      // Append parameters to the portal URL even in fallback
      const urlParams = new URLSearchParams();
      if (themeObj?.preset) urlParams.append('theme', themeObj.preset);
      if (brokerList && brokerList.length > 0) {
        // Encode brokers as base64 like the Python SDK does
        const brokersJson = JSON.stringify(brokerList);
        const brokersBase64 = Buffer.from(brokersJson).toString('base64');
        urlParams.append('brokers', brokersBase64);
      }
      if (email) urlParams.append('email', email as string);
      
      if (urlParams.toString()) {
        const separator = portalUrl.includes('?') ? '&' : '?';
        portalUrl = `${portalUrl}${separator}${urlParams.toString()}`;
      }
      
      console.log('🔍 Generated portal URL (fallback with parameters):', portalUrl);
      sendApiResponse(res, true, { portal_url: portalUrl });
    }
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
    console.log(`🔍 Company ID: ${sessionState.companyId}`);
    console.log(`🔍 API Key: ${process.env.FINATIC_API_KEY ? 'Set' : 'Not set'}`);
    
    // Call the main API to get user info
    const response = await fetch(`http://localhost:8000/api/v1/session/${sessionState.sessionId}/user`, {
      method: 'GET',
      headers: {
        'Session-ID': sessionState.sessionId,
        'Company-ID': sessionState.companyId || '',
        'X-API-Key': process.env.FINATIC_API_KEY || ''
      }
    });
    
    console.log(`🔍 Response status: ${response.status}`);
    console.log(`🔍 Response ok: ${response.ok}`);
    
    if (!response.ok) {
      console.log(`❌ API request failed with status: ${response.status}`);
      if (response.status === 422 || response.status === 400) {
        // User not linked to session yet
        console.log('❌ User not linked to session yet - returning success with no user');
        sendApiResponse(res, true, { 
          user_id: null,
          authenticated: false 
        });
        return;
      }
      console.log(`❌ Unexpected error status: ${response.status}`);
      throw new Error(`API request failed: ${response.status}`);
    }
    
    const data = await response.json() as any;
    const userId = data.data?.user_id || data.user_id;
    
    if (userId) {
      sessionState.isAuthenticated = true;
      sessionState.userId = userId;
      console.log('✅ Authentication confirmed successfully');
      sendApiResponse(res, true, { 
        user_id: userId,
        authenticated: true 
      });
    } else {
      console.log('❌ No user ID found in response');
      sendApiResponse(res, true, { 
        user_id: null,
        authenticated: false 
      });
    }
  } catch (error: any) {
    console.error('❌ Failed to confirm authentication:', error.message);
    // If it's a 422 or 400 error, return success with no user linked
    if (error.message.includes('422') || error.message.includes('400')) {
      sendApiResponse(res, true, { 
        user_id: null,
        authenticated: false 
      });
    } else {
      sendApiResponse(res, false, null, `Authentication not yet complete: ${error.message}`, 400);
    }
  }
}));

// Broker endpoints
app.get('/api/broker/list', asyncHandler(async (req: Request, res: Response) => {
  if (!sdkClient) {
    return sendApiResponse(res, false, null, 'SDK client not initialized', 500);
  }

  try {
    const brokers = await sdkClient.get_brokers();
    
    // Convert object with numeric keys to array if needed
    let brokerArray = brokers;
    if (typeof brokers === 'object' && !Array.isArray(brokers)) {
      brokerArray = Object.values(brokers);
    }
    
    sendApiResponse(res, true, brokerArray);
  } catch (error: any) {
    sendApiResponse(res, false, null, error.message);
  }
}));

app.get('/api/broker/connections', asyncHandler(async (req: Request, res: Response) => {
  if (!sdkClient) {
    return sendApiResponse(res, false, null, 'SDK client not initialized', 500);
  }

  try {
    const connections = await sdkClient.get_connections();
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

    // Use the new get_accounts method with built-in pagination
    const result = await sdkClient.get_accounts();

    const response = {
      data: result.data,
      pagination: {
        page: result.current_page,
        per_page: perPage,
        has_next: result.has_next,
        has_previous: result.has_previous
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
    const accounts = await sdkClient.get_all_accounts();
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

    // Return the paginated result directly
    const response = {
      data: orders.data,
      pagination: {
        page: orders.metadata.current_page || 1,
        per_page: orders.metadata.limit || 25,
        total: orders.data.length,
        total_pages: Math.ceil(orders.data.length / (orders.metadata.limit || 25)),
        has_next: orders.has_next,
        has_previous: orders.has_previous
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

    // Return the paginated result directly
    const response = {
      data: positions.data,
      pagination: {
        page: positions.metadata.current_page || 1,
        per_page: positions.metadata.limit || 25,
        total: positions.data.length,
        total_pages: Math.ceil(positions.data.length / (positions.metadata.limit || 25)),
        has_next: positions.has_next,
        has_previous: positions.has_previous
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

    // Return the paginated result directly
    const response = {
      data: balances.data,
      pagination: {
        page: balances.metadata.current_page || 1,
        per_page: balances.metadata.limit || 25,
        total: balances.data.length,
        total_pages: Math.ceil(balances.data.length / (balances.metadata.limit || 25)),
        has_next: balances.has_next,
        has_previous: balances.has_previous
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
    const balances = await sdkClient.get_all_balances();
    sendApiResponse(res, true, balances);
  } catch (error: any) {
    sendApiResponse(res, false, null, error.message);
  }
}));

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
    }

    console.log('🔄 Placing order with params:', orderParams);
    const result = await sdkClient.place_order(orderParams as any);
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
    const result = await sdkClient.modify_order(order_id, modifications as any);
    sendApiResponse(res, true, result);
  } catch (error: any) {
    sendApiResponse(res, false, null, error.message);
  }
}));

// Convenience filter endpoints
app.get('/api/trading/positions/open', asyncHandler(async (req: Request, res: Response) => {
  try {
    if (!sdkClient) {
      throw new Error('SDK client not initialized');
    }

    const positions = await sdkClient.get_open_positions();
    sendApiResponse(res, true, positions);
  } catch (error: any) {
    sendApiResponse(res, false, null, error.message);
  }
}));

app.get('/api/trading/orders/filled', asyncHandler(async (req: Request, res: Response) => {
  try {
    if (!sdkClient) {
      throw new Error('SDK client not initialized');
    }

    const orders = await sdkClient.get_filled_orders();
    sendApiResponse(res, true, orders);
  } catch (error: any) {
    sendApiResponse(res, false, null, error.message);
  }
}));

app.get('/api/trading/orders/pending', asyncHandler(async (req: Request, res: Response) => {
  try {
    if (!sdkClient) {
      throw new Error('SDK client not initialized');
    }

    const orders = await sdkClient.get_pending_orders();
    sendApiResponse(res, true, orders);
  } catch (error: any) {
    sendApiResponse(res, false, null, error.message);
  }
}));

app.get('/api/trading/accounts/active', asyncHandler(async (req: Request, res: Response) => {
  try {
    if (!sdkClient) {
      throw new Error('SDK client not initialized');
    }

    const accounts = await sdkClient.get_active_accounts();
    sendApiResponse(res, true, accounts);
  } catch (error: any) {
    sendApiResponse(res, false, null, error.message);
  }
}));

app.get('/api/trading/orders/by-symbol/:symbol', asyncHandler(async (req: Request, res: Response) => {
  try {
    if (!sdkClient) {
      throw new Error('SDK client not initialized');
    }

    const { symbol } = req.params;
    const orders = await sdkClient.get_orders_by_symbol(symbol);
    sendApiResponse(res, true, orders);
  } catch (error: any) {
    sendApiResponse(res, false, null, error.message);
  }
}));

app.get('/api/trading/positions/by-symbol/:symbol', asyncHandler(async (req: Request, res: Response) => {
  try {
    if (!sdkClient) {
      throw new Error('SDK client not initialized');
    }

    const { symbol } = req.params;
    const positions = await sdkClient.get_positions_by_symbol(symbol);
    sendApiResponse(res, true, positions);
  } catch (error: any) {
    sendApiResponse(res, false, null, error.message);
  }
}));

app.get('/api/trading/orders/by-broker/:broker', asyncHandler(async (req: Request, res: Response) => {
  try {
    if (!sdkClient) {
      throw new Error('SDK client not initialized');
    }

    const { broker } = req.params;
    const orders = await sdkClient.get_orders_by_broker(broker);
    sendApiResponse(res, true, orders);
  } catch (error: any) {
    sendApiResponse(res, false, null, error.message);
  }
}));

app.get('/api/trading/positions/by-broker/:broker', asyncHandler(async (req: Request, res: Response) => {
  try {
    if (!sdkClient) {
      throw new Error('SDK client not initialized');
    }

    const { broker } = req.params;
    const positions = await sdkClient.get_positions_by_broker(broker);
    sendApiResponse(res, true, positions);
  } catch (error: any) {
    sendApiResponse(res, false, null, error.message);
  }
}));

// Asset-specific order endpoints
app.post('/api/trading/order/stock/market', asyncHandler(async (req: Request, res: Response) => {
  try {
    if (!sdkClient) {
      throw new Error('SDK client not initialized');
    }

    const request = req.body as OrderRequest;
    const result = await sdkClient.place_stock_market_order(
      request.symbol,
      request.quantity || request.orderQty || 0,
      (request.side || request.action || 'buy') as 'buy' | 'sell',
      request.broker,
      request.account || request.accountNumber
    );
    sendApiResponse(res, true, result);
  } catch (error: any) {
    sendApiResponse(res, false, null, error.message);
  }
}));

app.post('/api/trading/order/stock/limit', asyncHandler(async (req: Request, res: Response) => {
  try {
    if (!sdkClient) {
      throw new Error('SDK client not initialized');
    }

    const request = req.body as OrderRequest;
    const result = await sdkClient.place_stock_limit_order(
      request.symbol,
      request.quantity || request.orderQty || 0,
      (request.side || request.action || 'buy') as 'buy' | 'sell',
      request.price || 0,
      (request.time_in_force || request.timeInForce || 'gtc') as 'day' | 'gtc',
      request.broker,
      request.account || request.accountNumber
    );
    sendApiResponse(res, true, result);
  } catch (error: any) {
    sendApiResponse(res, false, null, error.message);
  }
}));

app.post('/api/trading/order/stock/stop', asyncHandler(async (req: Request, res: Response) => {
  try {
    if (!sdkClient) {
      throw new Error('SDK client not initialized');
    }

    const request = req.body as OrderRequest;
    const result = await sdkClient.place_stock_stop_order(
      request.symbol,
      request.quantity || request.orderQty || 0,
      (request.side || request.action || 'buy') as 'buy' | 'sell',
      request.stop_price || 0,
      (request.time_in_force || request.timeInForce || 'gtc') as 'day' | 'gtc',
      request.broker,
      request.account || request.accountNumber
    );
    sendApiResponse(res, true, result);
  } catch (error: any) {
    sendApiResponse(res, false, null, error.message);
  }
}));

app.post('/api/trading/order/crypto/market', asyncHandler(async (req: Request, res: Response) => {
  try {
    if (!sdkClient) {
      throw new Error('SDK client not initialized');
    }

    const request = req.body as OrderRequest;
    const result = await sdkClient.place_crypto_market_order(
      request.symbol,
      request.quantity || request.orderQty || 0,
      (request.side || request.action || 'buy') as 'buy' | 'sell',
      request.broker,
      request.account || request.accountNumber
    );
    sendApiResponse(res, true, result);
  } catch (error: any) {
    sendApiResponse(res, false, null, error.message);
  }
}));

app.post('/api/trading/order/crypto/limit', asyncHandler(async (req: Request, res: Response) => {
  try {
    if (!sdkClient) {
      throw new Error('SDK client not initialized');
    }

    const request = req.body as OrderRequest;
    const result = await sdkClient.place_crypto_limit_order(
      request.symbol,
      request.quantity || request.orderQty || 0,
      (request.side || request.action || 'buy') as 'buy' | 'sell',
      request.price || 0,
      (request.time_in_force || request.timeInForce || 'gtc') as 'day' | 'gtc',
      request.broker,
      request.account || request.accountNumber
    );
    sendApiResponse(res, true, result);
  } catch (error: any) {
    sendApiResponse(res, false, null, error.message);
  }
}));

app.post('/api/trading/order/options/market', asyncHandler(async (req: Request, res: Response) => {
  try {
    if (!sdkClient) {
      throw new Error('SDK client not initialized');
    }

    const request = req.body as OrderRequest;
    const result = await sdkClient.place_options_market_order(
      request.symbol,
      request.quantity || request.orderQty || 0,
      (request.side || request.action || 'buy') as 'buy' | 'sell',
      request.broker,
      request.account || request.accountNumber
    );
    sendApiResponse(res, true, result);
  } catch (error: any) {
    sendApiResponse(res, false, null, error.message);
  }
}));

app.post('/api/trading/order/options/limit', asyncHandler(async (req: Request, res: Response) => {
  try {
    if (!sdkClient) {
      throw new Error('SDK client not initialized');
    }

    const request = req.body as OrderRequest;
    const result = await sdkClient.place_options_limit_order(
      request.symbol,
      request.quantity || request.orderQty || 0,
      (request.side || request.action || 'buy') as 'buy' | 'sell',
      request.price || 0,
      (request.time_in_force || request.timeInForce || 'gtc') as 'day' | 'gtc',
      request.broker,
      request.account || request.accountNumber
    );
    sendApiResponse(res, true, result);
  } catch (error: any) {
    sendApiResponse(res, false, null, error.message);
  }
}));

app.post('/api/trading/order/futures/market', asyncHandler(async (req: Request, res: Response) => {
  try {
    if (!sdkClient) {
      throw new Error('SDK client not initialized');
    }

    const request = req.body as OrderRequest;
    const result = await sdkClient.place_futures_market_order(
      request.symbol,
      request.quantity || request.orderQty || 0,
      (request.side || request.action || 'buy') as 'buy' | 'sell',
      request.broker,
      request.account || request.accountNumber
    );
    sendApiResponse(res, true, result);
  } catch (error: any) {
    sendApiResponse(res, false, null, error.message);
  }
}));

app.post('/api/trading/order/futures/limit', asyncHandler(async (req: Request, res: Response) => {
  try {
    if (!sdkClient) {
      throw new Error('SDK client not initialized');
    }

    const request = req.body as OrderRequest;
    const result = await sdkClient.place_futures_limit_order(
      request.symbol,
      request.quantity || request.orderQty || 0,
      (request.side || request.action || 'buy') as 'buy' | 'sell',
      request.price || 0,
      (request.time_in_force || request.timeInForce || 'gtc') as 'day' | 'gtc',
      request.broker,
      request.account || request.accountNumber
    );
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
