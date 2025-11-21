/**
 * Structured logger utility with pino package (Phase 2B).
 *
 * Generated - do not edit directly.
 */
import type { SdkConfig } from '../config';
export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'silent';
export interface Logger {
  debug(message: string, data?: Record<string, any>): void;
  info(message: string, data?: Record<string, any>): void;
  warn(message: string, data?: Record<string, any>): void;
  error(message: string, error?: Error | any, data?: Record<string, any>): void;
}
/**
 * Get or create a pino logger instance.
 */
export declare function getLogger(config?: SdkConfig): Logger;
//# sourceMappingURL=logger.d.ts.map
