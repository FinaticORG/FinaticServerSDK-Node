/**
 * Structured logger utility with pino package (Phase 2B).
 *
 * Generated - do not edit directly.
 */

import pino from 'pino';
import type { SdkConfig } from '../config';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'silent';

export interface Logger {
  debug(message: string, data?: Record<string, any>): void;
  info(message: string, data?: Record<string, any>): void;
  warn(message: string, data?: Record<string, any>): void;
  error(message: string, error?: Error | any, data?: Record<string, any>): void;
}

let _loggerInstance: pino.Logger | null = null;

/**
 * Get or create a pino logger instance.
 */
export function getLogger(config?: SdkConfig): Logger {
  if (_loggerInstance) {
    return _loggerInstance as unknown as Logger;
  }

  const logLevel = (config?.logLevel || process.env['FINATIC_LOG_LEVEL'] || 'error') as LogLevel;
  const isDevelopment =
    process.env['NODE_ENV'] !== 'production' && process.env['NODE_ENV'] !== 'prod';
  const usePrettyPrint = isDevelopment && config?.structuredLogging !== true;

  let pinoConfig: pino.LoggerOptions = {
    level: logLevel === 'silent' ? 'silent' : logLevel,
  };

  // Try to use pino-pretty in development for cleaner logs
  if (usePrettyPrint) {
    try {
      // Check if pino-pretty is available (it's a dev dependency, might not be installed)
      require.resolve('pino-pretty');
      pinoConfig = {
        ...pinoConfig,
        transport: {
          target: 'pino-pretty',
          options: {
            colorize: true,
            translateTime: 'HH:MM:ss.l',
            ignore: 'pid,hostname',
            singleLine: false,
            hideObject: false,
          },
        },
      };
    } catch {
      // pino-pretty not available, use structured logging with minimal output
      pinoConfig = {
        ...pinoConfig,
        formatters: {
          level: (label: string) => {
            return { level: label };
          },
        },
        timestamp: false, // Less verbose in dev
      };
    }
  } else if (config?.structuredLogging !== false) {
    // Production or structured logging enabled
    pinoConfig = {
      ...pinoConfig,
      formatters: {
        level: (label: string) => {
          return { level: label };
        },
      },
      timestamp: true,
    };
  }

  _loggerInstance = pino(pinoConfig);

  return _loggerInstance as unknown as Logger;
}
