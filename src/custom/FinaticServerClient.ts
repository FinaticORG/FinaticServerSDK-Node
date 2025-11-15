/**
 * Custom FinaticServerClient extension.
 *
 * This file is protected and will not be overwritten during regeneration.
 * Add custom logic to extend or override generated FinaticServerClient behavior.
 */

import { FinaticServerClient as GeneratedFinaticServerClient } from '../generated/FinaticServerClient';
import type { PortalOptions } from '../generated/FinaticServerClient';
import type { SdkConfig } from '../generated/config';
import { SessionApi } from '../generated/api/session-api';
import { BrokersApi } from '../generated/api/brokers-api';
import { CustomSessionWrapper } from './wrappers/session';
import { CustomBrokersWrapper } from './wrappers/brokers';

/**
 * Custom FinaticServerClient class that extends the generated class.
 * Use this to add custom initialization logic or override methods.
 */
export class FinaticServerClient extends GeneratedFinaticServerClient {
  // Marker to verify custom class is being used
  static readonly __CUSTOM_CLASS__ = true;

  /**
   * Override constructor to use custom wrappers:
   * - Custom session wrapper that disables caching for portal URLs
   * - Custom brokers wrapper that automatically adds session headers
   */
  constructor(apiKey: string, baseUrl?: string, sdkConfig?: Partial<SdkConfig>) {
    super(apiKey, baseUrl, sdkConfig);

    // Replace session wrapper with custom one that disables portal URL caching
    // This is needed because portal tokens are single-use
    const sessionApi = new SessionApi((this as any).config);
    (this as any).session = new CustomSessionWrapper(
      sessionApi,
      (this as any).config,
      (this as any).sdkConfig
    );

    // Replace brokers wrapper with custom one that automatically adds session headers
    // This ensures all broker endpoints include x-session-id, x-company-id, and x-csrf-token headers
    const brokersApi = new BrokersApi((this as any).config);
    (this as any).brokers = new CustomBrokersWrapper(
      brokersApi,
      (this as any).config,
      (this as any).sdkConfig
    );
  }
}

