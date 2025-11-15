/**
 * Request/Response interceptor utilities (Phase 2B).
 *
 * Generated - do not edit directly.
 */
import type { AxiosRequestConfig, AxiosResponse } from 'axios';
import type { SdkConfig } from '../config';
export type RequestInterceptor = (config: AxiosRequestConfig) => AxiosRequestConfig | Promise<AxiosRequestConfig>;
export type ResponseInterceptor = (response: AxiosResponse) => AxiosResponse | Promise<AxiosResponse>;
export type ErrorInterceptor = (error: any) => any;
export interface InterceptorChain {
    request: RequestInterceptor[];
    response: ResponseInterceptor[];
    error: ErrorInterceptor[];
}
/**
 * Add request interceptor.
 */
export declare function addRequestInterceptor(interceptor: RequestInterceptor): void;
/**
 * Add response interceptor.
 */
export declare function addResponseInterceptor(interceptor: ResponseInterceptor): void;
/**
 * Add error interceptor.
 */
export declare function addErrorInterceptor(interceptor: ErrorInterceptor): void;
/**
 * Apply request interceptors.
 */
export declare function applyRequestInterceptors(config: AxiosRequestConfig, sdkConfig?: SdkConfig): Promise<AxiosRequestConfig>;
/**
 * Apply response interceptors.
 */
export declare function applyResponseInterceptors(response: AxiosResponse, sdkConfig?: SdkConfig): Promise<AxiosResponse>;
/**
 * Apply error interceptors.
 */
export declare function applyErrorInterceptors(error: any, sdkConfig?: SdkConfig): Promise<any>;
//# sourceMappingURL=interceptors.d.ts.map