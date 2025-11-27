/**
 * Error handling utility (Phase 2A).
 *
 * Generated - do not edit directly.
 */
export declare class FinaticError extends Error {
  statusCode?: number | undefined;
  requestId?: string | undefined;
  originalError?: any | undefined;
  constructor(
    message: string,
    statusCode?: number | undefined,
    requestId?: string | undefined,
    originalError?: any | undefined
  );
}
export declare class ApiError extends FinaticError {
  constructor(message: string, statusCode: number, requestId?: string, originalError?: any);
}
export declare class ValidationError extends FinaticError {
  constructor(message: string, requestId?: string, originalError?: any);
}
/**
 * Handle and transform errors from API calls.
 */
export declare function handleError(error: any, requestId?: string): Error;
//# sourceMappingURL=error-handling.d.ts.map
