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

  constructor(apiKey: string, sdkConfig?: Partial<SdkConfig>) {
    super(apiKey, sdkConfig);
    this.v1 = new V1Wrapper(apiKey, { ...defaultConfig, ...sdkConfig });
  }

  override setSessionContext(sessionId: string, companyId: string, csrfToken: string): void {
    super.setSessionContext(sessionId, companyId, csrfToken);
    this.v1.setSessionContext(sessionId, companyId, csrfToken);
  }
}
