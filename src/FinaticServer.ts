/**
 * Hand-authored FinaticServer extension.
 *
 * This class remains source-controlled and can be customized without relying
 * on the old src/custom folder structure.
 */

import { FinaticServer as GeneratedFinaticServer } from './FinaticServerCore';
import { defaultConfig, type SdkConfig } from './config';
import { V1Wrapper } from './wrappers/v1';

export class FinaticServer extends GeneratedFinaticServer {
  // Marker to verify hand-authored class is being used
  static readonly __CUSTOM_CLASS__ = true;

  readonly v1: V1Wrapper;

  static override async init(
    apiKey: string,
    userId?: string,
    sdkConfig?: Partial<SdkConfig>
  ): Promise<FinaticServer> {
    const instance = new FinaticServer(apiKey, sdkConfig);

    try {
      const sessionResult = await instance.startSession(userId ? { userId } : undefined);

      if ('success' in sessionResult && !sessionResult.success) {
        throw new Error(
          sessionResult.error ||
            'Session initialization failed. Please check that the API endpoint returned a valid session response and ensure the API key is valid.'
        );
      }

      const sessionId = sessionResult.session_id || instance.getSessionId();
      if (!sessionId) {
        throw new Error(
          'Session initialization failed: startSession() did not return a session_id. ' +
            'Please check that the API endpoint returned a valid session response.'
        );
      }

      return instance;
    } catch (error) {
      if (error instanceof Error) {
        if (
          error.message.includes('Session not initialized') ||
          error.message.includes('session_id')
        ) {
          throw new Error(
            `Failed to initialize Finatic session: ${error.message}. ` +
              'This may indicate that startSession() was called but did not successfully create a session. ' +
              'Please check the API response and ensure the API key is valid.'
          );
        }
      }
      throw error;
    }
  }

  constructor(apiKey: string, sdkConfig?: Partial<SdkConfig>) {
    super(apiKey, sdkConfig);
    this.v1 = new V1Wrapper(apiKey, { ...defaultConfig, ...sdkConfig });
  }

  override setSessionContext(sessionId: string, companyId: string, csrfToken: string): void {
    super.setSessionContext(sessionId, companyId, csrfToken);
    this.v1.setSessionContext(sessionId, companyId, csrfToken);
  }
}
