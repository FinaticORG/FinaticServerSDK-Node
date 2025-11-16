/**
 * Main SDK entry point.
 * 
 * This file is protected - customize exports as needed.
 * 
 * Note: The OpenAPI generator creates its own index.ts that exports from api/models.
 * This file re-exports from our generated wrappers and custom code.
 */

// Re-export all generated wrappers and utilities
export * from './generated/wrappers';
export * from './generated/utils';
export * from './generated/config';

// Re-export main client class explicitly (custom version that extends generated class)
// MUST come before export * from './custom' to ensure custom version is used
export { FinaticServer } from './custom/FinaticServer';
export type { PortalOptions } from './generated/FinaticServerClient';

// Re-export all other custom code (wrappers, utils, etc.)
// Note: This might export FinaticServerClient again, but the explicit export above takes precedence
export * from './custom';

// Also export the raw API clients and models from OpenAPI generator
export * from './generated/api';
// Export models - ValidationError interface is available as ApiValidationError
export type { ValidationError as ApiValidationError } from './generated/models/validation-error';
// Re-export all models (ValidationError export is excluded from models/index.ts to avoid conflict)
export * as Models from './generated/models';
export * from './generated/configuration';
