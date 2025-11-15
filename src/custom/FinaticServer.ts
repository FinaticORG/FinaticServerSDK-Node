/**
 * Custom FinaticServer extension.
 *
 * This file is protected and will not be overwritten during regeneration.
 * Add custom logic to extend or override generated FinaticServer behavior.
 */

import { FinaticServer as GeneratedFinaticServer, type PortalOptions } from '../generated/FinaticServer';
import type { SdkConfig } from '../generated/config';

/**
 * Custom FinaticServer class that extends the generated class.
 * Use this to add custom initialization logic or override methods.
 * 
 * NOTE: Session headers, portal URL caching, and metadata transformation
 * are now handled by the generator. No wrapper replacements needed.
 */
export class FinaticServer extends GeneratedFinaticServer {
  // Marker to verify custom class is being used
  static readonly __CUSTOM_CLASS__ = true;

  // Generator now handles:
  // - Session headers for broker endpoints
  // - Portal URL no-cache handling
  // - Metadata transformation for withMetadata parameter
  // No custom wrapper replacements needed
}

