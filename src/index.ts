/**
 * Main SDK entry point.
 *
 * This file is protected - customize exports as needed.
 *
 * Note: The OpenAPI generator creates its own index.ts that exports from api/models.
 * This file re-exports from our generated wrappers and custom code.
 *
 * Raw CLI-only OpenAPI output (parallel tree): `src/openapi/` — see `src/openapi/README.md`.
 */

// Re-export SDK wrappers and utilities
export * from "./wrappers";
export * from "./utils";
export * from "./config";

// Re-export main client class (hand-authored wrapper over core)
export { FinaticServer } from "./FinaticServer";

// Also export the raw API clients and models from OpenAPI generator
export * from "./openapi/api";
// Export models - ValidationError interface is available as ApiValidationError
export type { ValidationError as ApiValidationError } from "./openapi/models/validation-error";
// Re-export all models (ValidationError export is excluded from models/index.ts to avoid conflict)
export * as Models from "./openapi/models";
export * from "./openapi/configuration";
