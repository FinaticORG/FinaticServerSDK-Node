"use strict";
/**
 * Retry utility with p-retry package (Phase 2B).
 *
 * Generated - do not edit directly.
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
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.retryApiCall = retryApiCall;
// @ts-ignore - p-retry provides its own types but TypeScript may not resolve them
const p_retry_1 = __importStar(require("p-retry"));
/**
 * Retry an async function with exponential backoff using p-retry.
 */
async function retryApiCall(fn, options = {}, config) {
    const opts = {
        maxRetries: config?.retryCount ?? options.maxRetries ?? 3,
        retryDelay: config?.retryDelay ?? options.retryDelay ?? 1000,
        retryMaxDelay: config?.retryMaxDelay ?? options.retryMaxDelay ?? 10000,
        retryMultiplier: config?.retryMultiplier ?? options.retryMultiplier ?? 2,
        retryOnStatus: config?.retryOnStatus ?? options.retryOnStatus ?? [429, 500, 502, 503, 504],
        retryOnNetworkError: config?.retryOnNetworkError ?? options.retryOnNetworkError ?? true,
        onFailedAttempt: options.onFailedAttempt,
    };
    return await (0, p_retry_1.default)(async () => {
        try {
            return await fn();
        }
        catch (error) {
            // Check if we should retry based on status code
            const statusCode = error?.response?.status || error?.statusCode || error?.status;
            // Don't retry if status code doesn't match retry list
            if (statusCode && !opts.retryOnStatus.includes(statusCode)) {
                throw new p_retry_1.AbortError(error);
            }
            // Check for network errors
            if (!statusCode && !opts.retryOnNetworkError) {
                throw new p_retry_1.AbortError(error);
            }
            // Re-throw to trigger retry
            throw error;
        }
    }, {
        retries: opts.maxRetries,
        minTimeout: opts.retryDelay,
        maxTimeout: opts.retryMaxDelay,
        factor: opts.retryMultiplier,
        onFailedAttempt: opts.onFailedAttempt,
    });
}
//# sourceMappingURL=retry.js.map