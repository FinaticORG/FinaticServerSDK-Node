/**
 * Finatic Server SDK — thin bootstrap over ``finatic.v1``.
 *
 * All versioned API methods live on {@link V1Wrapper} via ``finatic.v1``.
 */

import { SdkConfig, defaultConfig } from './config';
import { getLogger, type Logger } from './utils/logger';
import { V1Wrapper } from './wrappers/v1';

export class FinaticServer {
  private readonly logger: Logger;
  readonly v1: V1Wrapper;

  constructor(apiKey: string, sdkConfig?: Partial<SdkConfig>) {
    const mergedConfig: SdkConfig = { ...defaultConfig, ...sdkConfig };
    this.logger = getLogger(mergedConfig);
    this.v1 = new V1Wrapper(apiKey, mergedConfig);
  }

  static async init(
    apiKey: string,
    userId?: string,
    sdkConfig?: Partial<SdkConfig>
  ): Promise<FinaticServer> {
    const instance = new FinaticServer(apiKey, sdkConfig);
    const sessionResult = await instance.v1.startSession(
      userId !== undefined ? { userId } : undefined
    );

    if ('success' in sessionResult && !sessionResult.success) {
      throw new Error(
        sessionResult.error ||
          'Session initialization failed. Check the API key and /api/v1/session/init + /start responses.'
      );
    }

    if (!instance.v1.getSessionId()) {
      throw new Error('Session initialization failed: missing session_id.');
    }

    return instance;
  }

  async close(): Promise<void> {
    return;
  }
}
