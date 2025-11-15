/**
 * Custom session wrapper - Extends generated wrapper.
 * 
 * This file is protected and will not be overwritten during regeneration.
 * Add your custom session logic here.
 */

// Import generated wrapper
import { SessionWrapper } from '../../generated/wrappers/session';
import type { PortalUrlResponse } from '../../generated/models';
// import type { Configuration } from '../../generated/configuration'; // Uncomment if needed

/**
 * Custom wrapper for session operations.
 * Extend or override generated functions as needed.
 */
export class CustomSessionWrapper extends SessionWrapper {
  /**
   * Override getPortalUrl to disable caching.
   * Portal tokens are single-use, so caching them causes "already used" errors.
   * Each call must generate a fresh token.
   */
  override async getPortalUrl(): Promise<PortalUrlResponse> {
    // Temporarily disable caching for this call
    const originalCacheEnabled = this.sdkConfig?.cacheEnabled;
    if (this.sdkConfig) {
      this.sdkConfig.cacheEnabled = false;
    }

    try {
      // Call parent method (which will now skip cache checks/sets)
      return await super.getPortalUrl();
    } finally {
      // Restore original cache setting
      if (this.sdkConfig && originalCacheEnabled !== undefined) {
        this.sdkConfig.cacheEnabled = originalCacheEnabled;
      }
    }
  }
}
