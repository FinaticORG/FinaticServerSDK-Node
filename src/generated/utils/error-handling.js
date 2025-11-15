"use strict";
/**
 * Error handling utility (Phase 2A).
 *
 * Generated - do not edit directly.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ValidationError = exports.ApiError = exports.FinaticError = void 0;
exports.handleError = handleError;
class FinaticError extends Error {
    constructor(message, statusCode, requestId, originalError) {
        super(message);
        this.statusCode = statusCode;
        this.requestId = requestId;
        this.originalError = originalError;
        this.name = 'FinaticError';
    }
}
exports.FinaticError = FinaticError;
class ApiError extends FinaticError {
    constructor(message, statusCode, requestId, originalError) {
        super(message, statusCode, requestId, originalError);
        this.name = 'ApiError';
    }
}
exports.ApiError = ApiError;
class ValidationError extends FinaticError {
    constructor(message, requestId, originalError) {
        super(message, 422, requestId, originalError);
        this.name = 'ValidationError';
    }
}
exports.ValidationError = ValidationError;
/**
 * Handle and transform errors from API calls.
 */
function handleError(error, requestId) {
    // Extract status code
    const statusCode = error?.response?.status || error?.statusCode || error?.status;
    // Extract error message
    let message = error?.message || error?.toString() || 'Unknown error';
    // Try to extract message from response
    if (error?.response?.data) {
        const data = error.response.data;
        if (data.detail) {
            message = typeof data.detail === 'string' ? data.detail : JSON.stringify(data.detail);
        }
        else if (data.message) {
            message = data.message;
        }
    }
    // Create appropriate error type
    if (statusCode === 422) {
        return new ValidationError(message, requestId, error);
    }
    else if (statusCode && statusCode >= 400) {
        return new ApiError(message, statusCode, requestId, error);
    }
    return new FinaticError(message, statusCode, requestId, error);
}
//# sourceMappingURL=error-handling.js.map