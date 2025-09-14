/**
 * Finatic Server SDK for Node.js
 * 
 * A comprehensive SDK for interacting with the Finatic API from Node.js applications.
 * Provides authentication, portfolio management, and trading capabilities.
 */

// Main client
export { FinaticServerClient } from './core/client/FinaticServerClient';

// API client
export { ApiClient } from './core/client/ApiClient';

// Error classes
export {
  ApiError,
  AuthenticationError,
  ValidationError,
  RateLimitError,
  NetworkError,
  TimeoutError,
  AuthorizationError,
  OrderError,
  OrderValidationError,
  CompanyAccessError,
  TradingNotEnabledError,
} from './core/client/ApiClient';

// Types
export * from './types';

// Version
export const VERSION = '0.1.0';
