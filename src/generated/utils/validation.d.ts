/**
 * Input validation utility with zod package (Phase 2B).
 *
 * Generated - do not edit directly.
 */
import * as z from 'zod';
import type { SdkConfig } from '../config';
/**
 * Validate parameters using zod schema.
 */
export declare function validateParams<T>(schema: z.ZodSchema<T>, params: unknown, config?: SdkConfig): T;
/**
 * Create a number schema with min/max constraints.
 */
export declare function numberSchema(min?: number, max?: number, defaultVal?: number): z.ZodNumber;
/**
 * Create a string schema with length constraints.
 */
export declare function stringSchema(min?: number, max?: number, defaultVal?: string): z.ZodString;
//# sourceMappingURL=validation.d.ts.map