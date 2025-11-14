/**
 * API Types
 *
 * Type definitions for API responses, errors, and request payloads.
 */

// ====================
// API ERROR TYPES
// ====================

/**
 * Standard API error response
 */
export interface ApiError {
  message: string;
  code?: string;
  details?: unknown;
  stack?: string;
}

/**
 * Holochain-specific error
 */
export interface HolochainApiError extends ApiError {
  zome?: string;
  function?: string;
  payload?: unknown;
}

/**
 * Validation error with field-level details
 */
export interface ValidationApiError extends ApiError {
  field?: string;
  value?: unknown;
  constraints?: Record<string, string>;
}

/**
 * Network error
 */
export interface NetworkApiError extends ApiError {
  url?: string;
  method?: string;
  statusCode?: number;
}

// ====================
// API RESPONSE WRAPPER
// ====================

/**
 * Generic API response wrapper
 */
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: ApiError;
  metadata?: {
    timestamp: number;
    requestId?: string;
    version?: string;
  };
}

/**
 * Paginated API response
 */
export interface PaginatedApiResponse<T> extends ApiResponse<T[]> {
  pagination?: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
    hasNext: boolean;
    hasPrevious: boolean;
  };
}

// ====================
// REQUEST PAYLOADS
// ====================

/**
 * Pagination parameters
 */
export interface PaginationParams {
  page?: number;
  pageSize?: number;
  offset?: number;
  limit?: number;
}

/**
 * Sort parameters
 */
export interface SortParams {
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

/**
 * Filter parameters
 */
export interface FilterParams {
  [key: string]: string | number | boolean | undefined;
}

/**
 * Search parameters
 */
export interface SearchParams extends PaginationParams, SortParams {
  query?: string;
  filters?: FilterParams;
}

// ====================
// HELPER TYPES
// ====================

/**
 * API call status
 */
export type ApiCallStatus = 'idle' | 'loading' | 'success' | 'error';

/**
 * API call state
 */
export interface ApiCallState<T> {
  status: ApiCallStatus;
  data?: T;
  error?: ApiError;
  loading: boolean;
}

/**
 * Create initial API call state
 */
export function createApiCallState<T>(): ApiCallState<T> {
  return {
    status: 'idle',
    loading: false,
  };
}

/**
 * Update API call state to loading
 */
export function apiCallLoading<T>(): ApiCallState<T> {
  return {
    status: 'loading',
    loading: true,
  };
}

/**
 * Update API call state to success
 */
export function apiCallSuccess<T>(data: T): ApiCallState<T> {
  return {
    status: 'success',
    data,
    loading: false,
  };
}

/**
 * Update API call state to error
 */
export function apiCallError<T>(error: ApiError): ApiCallState<T> {
  return {
    status: 'error',
    error,
    loading: false,
  };
}
