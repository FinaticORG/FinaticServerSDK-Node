/**
 * Hand-authored FinaticServer extension.
 *
 * This class remains source-controlled and can be customized without relying
 * on the old src/custom folder structure.
 */

import { FinaticServer as GeneratedFinaticServer } from "./FinaticServerCore";

export class FinaticServer extends GeneratedFinaticServer {
  // Marker to verify hand-authored class is being used
  static readonly __CUSTOM_CLASS__ = true;
}
