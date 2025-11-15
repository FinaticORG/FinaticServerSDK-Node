"use strict";
/**
 * Main SDK entry point.
 *
 * This file is protected - customize exports as needed.
 *
 * Note: The OpenAPI generator creates its own index.ts that exports from api/models.
 * This file re-exports from our generated wrappers and custom code.
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FinaticServerClient = void 0;
// Re-export all generated wrappers and utilities
__exportStar(require("./generated/wrappers"), exports);
__exportStar(require("./generated/utils"), exports);
__exportStar(require("./generated/config"), exports);
// Re-export main client class explicitly (generated class)
var FinaticServerClient_1 = require("./generated/FinaticServerClient");
Object.defineProperty(exports, "FinaticServerClient", { enumerable: true, get: function () { return FinaticServerClient_1.FinaticServerClient; } });
// Re-export all other custom code (wrappers, utils, etc.)
__exportStar(require("./custom"), exports);
// Also export the raw API clients and models from OpenAPI generator
__exportStar(require("./generated/api"), exports);
// Re-export all models (ValidationError export is excluded from models/index.ts to avoid conflict)
__exportStar(require("./generated/models"), exports);
__exportStar(require("./generated/configuration"), exports);
//# sourceMappingURL=index.js.map