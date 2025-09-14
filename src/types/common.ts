/**
 * Common type definitions used across the Finatic Server SDK.
 */

export interface DeviceInfo {
  /** Device IP address */
  ip_address: string;
  /** User agent string */
  user_agent: string;
  /** Device fingerprint */
  fingerprint: string;
  /** Device ID */
  device_id?: string;
  /** Device type */
  device_type?: string;
  /** Operating system */
  os?: string;
  /** Operating system version */
  os_version?: string;
}

export interface ApiResponse {
  /** Request success status */
  success: boolean;
  /** Response message */
  message: string;
  /** HTTP status code */
  status_code?: number;
}

export interface ApiPaginationInfo {
  /** Whether there are more pages */
  has_more: boolean;
  /** Next page offset */
  next_offset?: number;
  /** Current page offset */
  current_offset: number;
  /** Items per page */
  limit: number;
}

export interface PaginationMetadata {
  /** Whether there are more pages */
  has_more: boolean;
  /** Next page offset */
  next_offset?: number;
  /** Current page offset */
  current_offset?: number;
  /** Items per page */
  limit?: number;
  /** Current page number */
  current_page?: number;
  /** Whether there is a next page */
  has_next: boolean;
  /** Whether there is a previous page */
  has_previous: boolean;
}

export interface TradingContext {
  /** Selected broker */
  broker?: string;
  /** Account number */
  account_number?: string;
  /** Account ID */
  account_id?: string | undefined;
}

export interface RequestHeaders {
  /** API key header */
  'X-API-Key'?: string;
  /** One-time token header */
  'One-Time-Token'?: string;
  /** Device info header */
  'X-Device-Info'?: string;
  /** Session ID header */
  'X-Session-ID'?: string;
  /** Session ID header */
  'Session-ID'?: string;
  /** Company ID header */
  'X-Company-ID'?: string;
  /** Authorization header */
  Authorization?: string;
}

export type NavigationCallback<T> = (offset: number, limit: number) => Promise<PaginatedResult<T>>;

export class PaginatedResult<T> {
  public data: T;
  public metadata: PaginationMetadata;
  private navigationCallback?: NavigationCallback<T> | undefined;

  constructor(
    data: T,
    paginationInfo: ApiPaginationInfo,
    navigationCallback?: NavigationCallback<T> | undefined
  ) {
    this.data = data;
    this.navigationCallback = navigationCallback;
    
    // Default to 0 if any are None
    const nextOffset = paginationInfo.next_offset ?? 0;
    const currentOffset = paginationInfo.current_offset ?? 0;
    const limit = paginationInfo.limit ?? 0;
    const currentPage = limit ? Math.floor(currentOffset / limit) + 1 : 1;
    
    // has_next: only if next_offset is not None and not equal to current_offset
    const hasNext = paginationInfo.next_offset !== undefined && 
                   paginationInfo.next_offset !== paginationInfo.current_offset;
    
    // has_previous: only if current_offset is not None and > 0
    const hasPrevious = paginationInfo.current_offset !== undefined && 
                       paginationInfo.current_offset > 0;
    
    this.metadata = {
      has_more: paginationInfo.has_more,
      next_offset: nextOffset,
      current_offset: currentOffset,
      limit: limit,
      current_page: currentPage,
      has_next: hasNext,
      has_previous: hasPrevious,
    };
  }

  get has_next(): boolean {
    return this.metadata.has_next;
  }

  get has_previous(): boolean {
    return this.metadata.has_previous;
  }

  get current_page(): number {
    return this.metadata.current_page ?? 1;
  }

  async next_page(): Promise<PaginatedResult<T> | null> {
    if (!this.has_next || !this.navigationCallback) {
      return null;
    }
    try {
      return await this.navigationCallback(this.metadata.next_offset!, this.metadata.limit!);
    } catch (error) {
      // Error fetching next page - return null to indicate failure
      return null;
    }
  }

  async previous_page(): Promise<PaginatedResult<T> | null> {
    if (!this.has_previous || !this.navigationCallback) {
      return null;
    }
    const previousOffset = Math.max(0, (this.metadata.current_offset ?? 0) - (this.metadata.limit ?? 0));
    try {
      return await this.navigationCallback(previousOffset, this.metadata.limit!);
    } catch (error) {
      // Error fetching previous page - return null to indicate failure
      return null;
    }
  }

  async go_to_page(pageNumber: number): Promise<PaginatedResult<T> | null> {
    /** Go to a specific page. */
    if (!this.navigationCallback || pageNumber < 1) {
      return null;
    }
    
    const offset = (pageNumber - 1) * this.metadata.limit!;
    try {
      return await this.navigationCallback(offset, this.metadata.limit!);
    } catch (error) {
      // Error fetching page - return null to indicate failure
      return null;
    }
  }

  async first_page(): Promise<PaginatedResult<T> | null> {
    /** Get the first page. */
    if (!this.navigationCallback) {
      return null;
    }
    
    try {
      return await this.navigationCallback(0, this.metadata.limit!);
    } catch (error) {
      // Error fetching first page - return null to indicate failure
      return null;
    }
  }

  async last_page(): Promise<PaginatedResult<T> | null> {
    /** Get the last page by navigating through all pages. */
    if (!this.navigationCallback) {
      return null;
    }
    
    const findLast = async (page: PaginatedResult<T>): Promise<PaginatedResult<T>> => {
      if (!page.has_next) {
        return page;
      }
      const nextPage = await page.next_page();
      if (!nextPage) {
        return page;
      }
      return await findLast(nextPage);
    };
    
    try {
      return await findLast(this);
    } catch (error) {
      // Error fetching last page - return null to indicate failure
      return null;
    }
  }

  get_pagination_info(): string {
    /** Get pagination info as string. */
    return `Page ${this.current_page} (${(this.metadata.current_offset ?? 0) + 1}-${(this.metadata.current_offset ?? 0) + (this.metadata.limit ?? 0)})`;
  }
}
