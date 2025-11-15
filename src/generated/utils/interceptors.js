"use strict";
/**
 * Request/Response interceptor utilities (Phase 2B).
 *
 * Generated - do not edit directly.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.addRequestInterceptor = addRequestInterceptor;
exports.addResponseInterceptor = addResponseInterceptor;
exports.addErrorInterceptor = addErrorInterceptor;
exports.applyRequestInterceptors = applyRequestInterceptors;
exports.applyResponseInterceptors = applyResponseInterceptors;
exports.applyErrorInterceptors = applyErrorInterceptors;
let _interceptors = {
    request: [],
    response: [],
    error: [],
};
/**
 * Add request interceptor.
 */
function addRequestInterceptor(interceptor) {
    _interceptors.request.push(interceptor);
}
/**
 * Add response interceptor.
 */
function addResponseInterceptor(interceptor) {
    _interceptors.response.push(interceptor);
}
/**
 * Add error interceptor.
 */
function addErrorInterceptor(interceptor) {
    _interceptors.error.push(interceptor);
}
/**
 * Apply request interceptors.
 */
async function applyRequestInterceptors(config, sdkConfig) {
    if (!sdkConfig?.requestInterceptorsEnabled) {
        return config;
    }
    let result = config;
    for (const interceptor of _interceptors.request) {
        result = await interceptor(result);
    }
    return result;
}
/**
 * Apply response interceptors.
 */
async function applyResponseInterceptors(response, sdkConfig) {
    if (!sdkConfig?.responseInterceptorsEnabled) {
        return response;
    }
    let result = response;
    for (const interceptor of _interceptors.response) {
        result = await interceptor(result);
    }
    return result;
}
/**
 * Apply error interceptors.
 */
async function applyErrorInterceptors(error, sdkConfig) {
    if (!sdkConfig?.responseInterceptorsEnabled) {
        throw error;
    }
    let result = error;
    for (const interceptor of _interceptors.error) {
        result = await interceptor(result);
    }
    return result;
}
//# sourceMappingURL=interceptors.js.map