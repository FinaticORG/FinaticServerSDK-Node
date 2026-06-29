/**
 * Finatic Server SDK Configuration
 */

export interface SdkConfig {
  /** Account-first v1 API environment sent as X-Finatic-Environment */
  apiEnvironment: FinaticApiEnvironment;

  /** Base URL for API requests */
  baseUrl: string;

  /** API key for authentication */
  apiKey?: string;

  /** Request timeout in milliseconds */
  timeout: number;

  /** Custom headers to include in all requests */
  headers: Record<string, string>;

  /** Log level */
  logLevel: 'debug' | 'info' | 'warn' | 'error' | 'silent';

  /** Enable structured JSON logging */
  structuredLogging: boolean;

  /** Include request/response bodies in logs (debug only) */
  logRequestBody: boolean;
  logResponseBody: boolean;

  /** Log request IDs for tracing */
  logRequestId: boolean;

  /** Enable request/response validation */
  validationEnabled: boolean;

  /** Strict validation mode */
  validationStrict: boolean;

  /** Session context storage */
  sessionContextStorage: 'memory' | 'custom';

  /** Custom session context getter/setter */
  sessionContextGetter?: () => {
    sessionId?: string;
    companyId?: string;
    csrfToken?: string;
  };
  sessionContextSetter?: (context: {
    sessionId?: string;
    companyId?: string;
    csrfToken?: string;
  }) => void;
}

export type FinaticApiEnvironment = 'live' | 'sandbox';

export const defaultConfig: SdkConfig = {
  apiEnvironment: process.env['FINATIC_API_ENVIRONMENT'] === 'sandbox' ? 'sandbox' : 'live',
  baseUrl: process.env['FINATIC_API_URL'] || 'https://api.finatic.dev',
  ...(process.env['FINATIC_API_KEY'] ? { apiKey: process.env['FINATIC_API_KEY'] } : {}),
  timeout: parseInt(process.env['FINATIC_TIMEOUT'] || '30000', 10),
  headers: {},
  logLevel: (process.env['FINATIC_LOG_LEVEL'] || 'error') as SdkConfig['logLevel'],
  structuredLogging: process.env['FINATIC_STRUCTURED_LOGGING'] === 'true',
  logRequestBody: process.env['FINATIC_LOG_REQUEST_BODY'] === 'true',
  logResponseBody: process.env['FINATIC_LOG_RESPONSE_BODY'] === 'true',
  logRequestId: process.env['FINATIC_LOG_REQUEST_ID'] !== 'false',
  validationEnabled: process.env['FINATIC_VALIDATION_ENABLED'] !== 'false',
  validationStrict: process.env['FINATIC_VALIDATION_STRICT'] === 'true',
  sessionContextStorage: 'memory',
};

export function getConfig(overrides?: Partial<SdkConfig>): SdkConfig {
  const config: SdkConfig = { ...defaultConfig };
  if (overrides) {
    for (const [key, value] of Object.entries(overrides)) {
      if (value !== undefined) {
        (config as any)[key] = value;
      }
    }
  }
  return config;
}
