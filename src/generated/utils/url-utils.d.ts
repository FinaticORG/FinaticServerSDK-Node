/**
 * URL utility functions for portal URL manipulation.
 *
 * Generated - do not edit directly.
 */
/**
 * Append theme parameters to a portal URL.
 * @param baseUrl The base portal URL (may already have query parameters)
 * @param theme The theme configuration (preset string or custom object)
 * @returns The portal URL with theme parameters appended
 */
export declare function appendThemeToURL(baseUrl: string, theme?: string | {
    preset?: string;
    custom?: Record<string, unknown>;
}): string;
/**
 * Append broker filter parameters to a portal URL.
 * @param baseUrl The base portal URL (may already have query parameters)
 * @param brokerNames Array of broker names/IDs to filter by
 * @returns The portal URL with broker filter parameters appended
 */
export declare function appendBrokerFilterToURL(baseUrl: string, brokerNames?: string[]): string;
//# sourceMappingURL=url-utils.d.ts.map