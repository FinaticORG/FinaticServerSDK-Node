"use strict";
/**
 * Response caching utility with node-cache (Phase 2B).
 *
 * Generated - do not edit directly.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCache = getCache;
exports.generateCacheKey = generateCacheKey;
// @ts-ignore - node-cache types available via @types/node-cache
const node_cache_1 = __importDefault(require("node-cache"));
let _cacheInstance = null;
/**
 * Get or create cache instance.
 */
function getCache(config) {
    if (!config?.cacheEnabled) {
        return null;
    }
    if (_cacheInstance) {
        return _cacheInstance;
    }
    _cacheInstance = new node_cache_1.default({
        stdTTL: config.cacheTtl || 300,
        maxKeys: config.cacheMaxSize || 1000,
        useClones: false,
    });
    return _cacheInstance;
}
/**
 * Generate cache key from method and parameters.
 */
function generateCacheKey(method, path, params, config) {
    const include = config?.cacheKeyInclude || ['method', 'path', 'query', 'body'];
    const parts = [];
    if (include.includes('method'))
        parts.push(`method:${method}`);
    if (include.includes('path'))
        parts.push(`path:${path}`);
    if (include.includes('query')) {
        const query = params['query'] || params;
        const queryStr = Object.keys(query)
            .sort()
            .map(k => `${k}=${JSON.stringify(query[k])}`)
            .join('&');
        parts.push(`query:${queryStr}`);
    }
    if (include.includes('body')) {
        parts.push(`body:${JSON.stringify(params['body'] || {})}`);
    }
    return `finatic:${parts.join('|')}`;
}
//# sourceMappingURL=cache.js.map