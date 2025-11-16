/**
 * Custom FinaticServer extension.
 *
 * This file is protected and will not be overwritten during regeneration.
 * Add custom logic to extend or override generated FinaticServer behavior.
 */

import { FinaticServer as GeneratedFinaticServer, type PortalOptions } from '../generated/FinaticServer';
import type { SdkConfig } from '../generated/config';
import * as Models from '../generated/models';

function coerceEnumValue<T extends Record<string, string>>(
  input: unknown,
  EnumObj: T,
  enumName: string,
  aliases?: Record<string, keyof T>,
): T[keyof T] | undefined {
  if (input === undefined || input === null) return undefined;
  // If already an enum value, pass through
  const values = Object.values(EnumObj) as string[];
  if (typeof input === 'string') {
    const normalized = input.trim().toLowerCase();
    // alias match (e.g., 'open' -> Active)
    if (aliases && normalized in aliases) {
      const key = aliases[normalized];
      return EnumObj[key];
    }
    // direct match by value
    const valueMatch = values.find(v => v.toLowerCase() === normalized);
    if (valueMatch) return valueMatch as T[keyof T];
    // match by key name
    const keyMatch = (Object.keys(EnumObj) as Array<keyof T>).find(
      k => String(k).toLowerCase() === normalized,
    );
    if (keyMatch) return EnumObj[keyMatch];
  }
  // Not coercible
  const allowed = values.join(', ');
  throw new Error(`Invalid ${enumName}: ${String(input)}. Allowed values: ${allowed}`);
}

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

  async getOpenPositions(filter?: any): Promise<any[]> {
    const adjusted = { ...(filter || {}) };
    // Accept 'open' text and coerce to DB enum 'active'
    if (adjusted.positionStatus !== undefined) {
      adjusted.positionStatus = coerceEnumValue(
        adjusted.positionStatus,
        Models.PublicPositionStatusEnum,
        'positionStatus',
        { open: 'Active' as keyof typeof Models.PublicPositionStatusEnum },
      );
    }
    return await super.getAllPositions({ ...adjusted, positionStatus: adjusted.positionStatus ?? Models.PublicPositionStatusEnum.Active });
  }

  async getPendingOrders(filter?: any): Promise<any[]> {
    const adjusted = { ...(filter || {}) };
    if (adjusted.orderStatus !== undefined) {
      adjusted.orderStatus = coerceEnumValue(
        adjusted.orderStatus,
        Models.PublicOrderStatusEnum,
        'orderStatus',
        { pending: 'New' as keyof typeof Models.PublicOrderStatusEnum, pending_new: 'New' as keyof typeof Models.PublicOrderStatusEnum },
      );
    }
    return await super.getAllOrders({ ...adjusted, orderStatus: adjusted.orderStatus ?? Models.PublicOrderStatusEnum.New });
  }

  async getActiveAccounts(filter?: any): Promise<any[]> {
    const adjusted = { ...(filter || {}) };
    if (adjusted.status !== undefined) {
      adjusted.status = coerceEnumValue(
        adjusted.status,
        Models.AccountStatus,
        'status',
        { active: 'Active' as keyof typeof Models.AccountStatus },
      );
    }
    return await super.getAllAccounts({ ...adjusted, status: adjusted.status ?? Models.AccountStatus.Active });
  }
}

