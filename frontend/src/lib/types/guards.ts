/**
 * Type Guards
 *
 * Runtime type checking functions for API responses and user data.
 * These ensure data integrity and provide better TypeScript inference.
 */

import type {
  Listing,
  Transaction,
  UserProfile,
  Dispute,
  Review,
  ListingCategory,
} from './index';

// ====================
// LISTING TYPE GUARDS
// ====================

/**
 * Check if value is a valid listing category
 */
export function isListingCategory(value: unknown): value is ListingCategory {
  const validCategories: ListingCategory[] = [
    'Electronics',
    'Fashion',
    'Home & Garden',
    'Sports & Outdoors',
    'Books & Media',
    'Toys & Games',
    'Health & Beauty',
    'Automotive',
    'Art & Collectibles',
    'Other',
  ];

  return typeof value === 'string' && validCategories.includes(value as ListingCategory);
}

/**
 * Check if value is a valid listing object
 */
export function isListing(value: unknown): value is Listing {
  if (!value || typeof value !== 'object') return false;

  const obj = value as Record<string, unknown>;

  return (
    typeof obj.id === 'string' &&
    typeof obj.listing_hash === 'string' &&
    typeof obj.title === 'string' &&
    typeof obj.description === 'string' &&
    typeof obj.price === 'number' &&
    obj.price > 0 &&
    isListingCategory(obj.category) &&
    Array.isArray(obj.photos_ipfs_cids) &&
    typeof obj.seller_id === 'string' &&
    typeof obj.created_at === 'number' &&
    typeof obj.quantity_available === 'number'
  );
}

/**
 * Check if array contains valid listings
 */
export function isListingArray(value: unknown): value is Listing[] {
  return Array.isArray(value) && value.every(isListing);
}

// ====================
// TRANSACTION TYPE GUARDS
// ====================

/**
 * Check if value is a valid transaction status
 */
export function isTransactionStatus(
  value: unknown
): value is 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'disputed' | 'cancelled' {
  return (
    typeof value === 'string' &&
    ['pending', 'confirmed', 'shipped', 'delivered', 'disputed', 'cancelled'].includes(value)
  );
}

/**
 * Check if value is a valid transaction object
 */
export function isTransaction(value: unknown): value is Transaction {
  if (!value || typeof value !== 'object') return false;

  const obj = value as Record<string, unknown>;

  return (
    typeof obj.id === 'string' &&
    typeof obj.transaction_hash === 'string' &&
    typeof obj.listing_id === 'string' &&
    typeof obj.buyer_id === 'string' &&
    typeof obj.seller_id === 'string' &&
    typeof obj.quantity === 'number' &&
    typeof obj.total_price === 'number' &&
    isTransactionStatus(obj.status) &&
    typeof obj.created_at === 'number'
  );
}

/**
 * Check if array contains valid transactions
 */
export function isTransactionArray(value: unknown): value is Transaction[] {
  return Array.isArray(value) && value.every(isTransaction);
}

// ====================
// USER PROFILE TYPE GUARDS
// ====================

/**
 * Check if value is a valid user role
 */
export function isUserRole(value: unknown): value is 'buyer' | 'seller' | 'arbitrator' | 'admin' {
  return (
    typeof value === 'string' && ['buyer', 'seller', 'arbitrator', 'admin'].includes(value)
  );
}

/**
 * Check if value is a valid user profile object
 */
export function isUserProfile(value: unknown): value is UserProfile {
  if (!value || typeof value !== 'object') return false;

  const obj = value as Record<string, unknown>;

  return (
    typeof obj.agent_id === 'string' &&
    typeof obj.username === 'string' &&
    typeof obj.display_name === 'string' &&
    typeof obj.created_at === 'number' &&
    Array.isArray(obj.roles) &&
    obj.roles.every(isUserRole)
  );
}

// ====================
// DISPUTE TYPE GUARDS
// ====================

/**
 * Check if value is a valid dispute status
 */
export function isDisputeStatus(
  value: unknown
): value is 'open' | 'under_review' | 'resolved_buyer' | 'resolved_seller' | 'resolved_split' {
  return (
    typeof value === 'string' &&
    ['open', 'under_review', 'resolved_buyer', 'resolved_seller', 'resolved_split'].includes(
      value
    )
  );
}

/**
 * Check if value is a valid dispute object
 */
export function isDispute(value: unknown): value is Dispute {
  if (!value || typeof value !== 'object') return false;

  const obj = value as Record<string, unknown>;

  return (
    typeof obj.id === 'string' &&
    typeof obj.dispute_hash === 'string' &&
    typeof obj.transaction_id === 'string' &&
    typeof obj.filed_by === 'string' &&
    typeof obj.reason === 'string' &&
    isDisputeStatus(obj.status) &&
    typeof obj.created_at === 'number'
  );
}

/**
 * Check if array contains valid disputes
 */
export function isDisputeArray(value: unknown): value is Dispute[] {
  return Array.isArray(value) && value.every(isDispute);
}

// ====================
// REVIEW TYPE GUARDS
// ====================

/**
 * Check if value is a valid review object
 */
export function isReview(value: unknown): value is Review {
  if (!value || typeof value !== 'object') return false;

  const obj = value as Record<string, unknown>;

  return (
    typeof obj.id === 'string' &&
    typeof obj.review_hash === 'string' &&
    typeof obj.transaction_id === 'string' &&
    typeof obj.reviewer_id === 'string' &&
    typeof obj.rating === 'number' &&
    obj.rating >= 1 &&
    obj.rating <= 5 &&
    typeof obj.comment === 'string' &&
    typeof obj.created_at === 'number'
  );
}

/**
 * Check if array contains valid reviews
 */
export function isReviewArray(value: unknown): value is Review[] {
  return Array.isArray(value) && value.every(isReview);
}

// ====================
// API RESPONSE TYPE GUARDS
// ====================

/**
 * API response wrapper type
 */
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    code?: string;
    details?: unknown;
  };
}

/**
 * Check if value is a valid API response
 */
export function isApiResponse<T>(
  value: unknown,
  dataGuard: (data: unknown) => data is T
): value is ApiResponse<T> {
  if (!value || typeof value !== 'object') return false;

  const obj = value as Record<string, unknown>;

  if (typeof obj.success !== 'boolean') return false;

  if (obj.success) {
    return obj.data !== undefined && dataGuard(obj.data);
  } else {
    return (
      obj.error !== undefined &&
      typeof obj.error === 'object' &&
      typeof (obj.error as Record<string, unknown>).message === 'string'
    );
  }
}

/**
 * Check if value is a successful API response
 */
export function isSuccessResponse<T>(
  value: unknown,
  dataGuard: (data: unknown) => data is T
): value is ApiResponse<T> & { success: true; data: T } {
  return (
    isApiResponse(value, dataGuard) &&
    (value as ApiResponse<T>).success === true &&
    (value as ApiResponse<T>).data !== undefined
  );
}

/**
 * Check if value is an error API response
 */
export function isErrorResponse(
  value: unknown
): value is ApiResponse<never> & { success: false; error: { message: string } } {
  if (!value || typeof value !== 'object') return false;

  const obj = value as Record<string, unknown>;

  return (
    obj.success === false &&
    obj.error !== undefined &&
    typeof obj.error === 'object' &&
    typeof (obj.error as Record<string, unknown>).message === 'string'
  );
}

// ====================
// UTILITY TYPE GUARDS
// ====================

/**
 * Check if value is a non-empty string
 */
export function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

/**
 * Check if value is a positive number
 */
export function isPositiveNumber(value: unknown): value is number {
  return typeof value === 'number' && value > 0 && Number.isFinite(value);
}

/**
 * Check if value is a valid timestamp
 */
export function isValidTimestamp(value: unknown): value is number {
  if (typeof value !== 'number') return false;
  const date = new Date(value);
  return date.getTime() > 0;
}

/**
 * Check if value is a valid IPFS CID
 */
export function isValidIPFSCID(value: unknown): value is string {
  if (typeof value !== 'string') return false;
  // Basic CID validation - starts with Qm and is 46 characters (CIDv0)
  // or starts with b and is longer (CIDv1)
  return /^Qm[1-9A-HJ-NP-Za-km-z]{44}$/.test(value) || /^b[a-z2-7]{58}/.test(value);
}

/**
 * Assert that value matches type guard, throw otherwise
 */
export function assertType<T>(
  value: unknown,
  guard: (value: unknown) => value is T,
  errorMessage: string
): asserts value is T {
  if (!guard(value)) {
    throw new TypeError(errorMessage);
  }
}
