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

export { FinaticServer } from './FinaticServer';
export type { FinaticV1Response, FinaticV1Error, FinaticV1ErrorCode } from './wrappers/v1';
