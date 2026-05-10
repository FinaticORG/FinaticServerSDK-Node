/**
 * Main SDK entry point.
 *
 * Hand-authored exports compose ``src/openapi/`` (OpenAPI Generator output) with wrappers and utilities.
 *
 * Regenerate: ``make openapi-generate`` from the Finatic workspace root.
 */

// Re-export SDK wrappers and utilities
export * from './wrappers';
export * from './utils';
export * from './config';

// Re-export main client class (hand-authored wrapper over core)
export { FinaticServer } from './FinaticServer';

// Also export the raw API clients and models from OpenAPI generator
export * from './openapi/api';
// Export models - ValidationError interface is available as ApiValidationError
export type { ValidationError as ApiValidationError } from './openapi/models/validation-error';
// Re-export all models (ValidationError export is excluded from models/index.ts to avoid conflict)
export * as Models from './openapi/models';
export * from './openapi/configuration';
