/**
 * Main SDK entry point.
 *
 * This file is protected - customize exports as needed.
 *
 * Note: The OpenAPI generator creates its own index.ts that exports from api/models.
 * This file re-exports from our generated wrappers and custom code.
 */
export * from './generated/wrappers';
export * from './generated/utils';
export * from './generated/config';
export { FinaticServerClient } from './generated/FinaticServerClient';
export type { PortalOptions } from './generated/FinaticServerClient';
export * from './custom';
export * from './generated/api';
export type { ValidationError as ApiValidationError } from './generated/models/validation-error';
export * from './generated/models';
export * from './generated/configuration';
//# sourceMappingURL=index.d.ts.map