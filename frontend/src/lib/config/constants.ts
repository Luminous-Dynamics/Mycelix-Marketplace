/**
 * Application Constants
 *
 * Centralized configuration values for the Mycelix Marketplace.
 * These values can be overridden by environment variables where applicable.
 */

// ====================
// HOLOCHAIN CONFIG
// ====================

/**
 * Default Holochain conductor WebSocket URL
 * Override with VITE_HOLOCHAIN_WS_URL environment variable
 */
export const DEFAULT_HOLOCHAIN_WS_URL = import.meta.env.VITE_HOLOCHAIN_WS_URL || 'ws://localhost:8888';

/**
 * Maximum reconnection attempts for Holochain client
 */
export const HOLOCHAIN_MAX_RECONNECT_ATTEMPTS = 5;

/**
 * Reconnection delay in milliseconds
 */
export const HOLOCHAIN_RECONNECT_DELAY = 1000;

// ====================
// IPFS / PINATA CONFIG
// ====================

/**
 * Pinata API JWT token
 */
export const PINATA_JWT = import.meta.env.VITE_PINATA_JWT || '';

/**
 * Pinata gateway URL
 */
export const PINATA_GATEWAY = import.meta.env.VITE_PINATA_GATEWAY || 'https://gateway.pinata.cloud';

/**
 * Default IPFS gateway (fallback)
 */
export const DEFAULT_IPFS_GATEWAY = 'https://ipfs.io/ipfs/';

/**
 * Alternative IPFS gateways for redundancy
 */
export const IPFS_GATEWAYS = [
  'https://gateway.pinata.cloud/ipfs/',
  'https://ipfs.io/ipfs/',
  'https://cloudflare-ipfs.com/ipfs/',
  'https://dweb.link/ipfs/',
] as const;

// ====================
// FILE UPLOAD LIMITS
// ====================

/**
 * Maximum file size for uploads (5MB)
 */
export const MAX_FILE_SIZE = 5 * 1024 * 1024;

/**
 * Maximum number of photos per listing
 */
export const MAX_PHOTOS_PER_LISTING = 10;

/**
 * Allowed image MIME types
 */
export const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/gif',
] as const;

// ====================
// COMMERCE CONFIG
// ====================

/**
 * Default tax rate (8%)
 * In production, this should be calculated based on location
 */
export const DEFAULT_TAX_RATE = 0.08;

/**
 * Default shipping cost in USD
 * In production, this should be calculated based on location and weight
 */
export const DEFAULT_SHIPPING_COST = 5.99;

/**
 * Currency code
 */
export const DEFAULT_CURRENCY = 'USD';

/**
 * Price limits
 */
export const MIN_LISTING_PRICE = 0.01;
export const MAX_LISTING_PRICE = 1000000;

// ====================
// CATEGORIES
// ====================

/**
 * Listing categories
 * Centralized to ensure consistency across the app
 */
export const LISTING_CATEGORIES = [
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
] as const;

export type ListingCategory = typeof LISTING_CATEGORIES[number];

// ====================
// VALIDATION RULES
// ====================

/**
 * Minimum title length
 */
export const MIN_TITLE_LENGTH = 5;

/**
 * Maximum title length
 */
export const MAX_TITLE_LENGTH = 100;

/**
 * Minimum description length
 */
export const MIN_DESCRIPTION_LENGTH = 20;

/**
 * Maximum description length
 */
export const MAX_DESCRIPTION_LENGTH = 5000;

/**
 * Minimum review length
 */
export const MIN_REVIEW_LENGTH = 10;

/**
 * Maximum review length
 */
export const MAX_REVIEW_LENGTH = 1000;

// ====================
// UI CONFIGURATION
// ====================

/**
 * Default debounce delay for search (milliseconds)
 */
export const SEARCH_DEBOUNCE_DELAY = 300;

/**
 * Notification auto-dismiss timeout (milliseconds)
 */
export const NOTIFICATION_TIMEOUT = 5000;

/**
 * Loading state minimum display time (milliseconds)
 * Prevents flashing for very fast operations
 */
export const MIN_LOADING_TIME = 300;

/**
 * Items per page for pagination
 */
export const ITEMS_PER_PAGE = 20;

/**
 * Maximum items to display before requiring pagination
 */
export const MAX_ITEMS_BEFORE_PAGINATION = 100;

// ====================
// TRUST & REPUTATION
// ====================

/**
 * Trust score thresholds
 */
export const TRUST_THRESHOLDS = {
  EXCELLENT: 90,
  GOOD: 75,
  FAIR: 50,
  POOR: 25,
} as const;

/**
 * Minimum transactions required for trust score
 */
export const MIN_TRANSACTIONS_FOR_TRUST = 5;

/**
 * Minimum arbitrators required for MRC dispute
 */
export const MIN_ARBITRATORS_FOR_DISPUTE = 3;

// ====================
// TIMEOUTS & RETRIES
// ====================

/**
 * API request timeout (milliseconds)
 */
export const API_TIMEOUT = 30000;

/**
 * Maximum retry attempts for failed requests
 */
export const MAX_RETRY_ATTEMPTS = 3;

/**
 * Initial retry delay (milliseconds)
 */
export const INITIAL_RETRY_DELAY = 1000;

/**
 * Maximum retry delay (milliseconds)
 */
export const MAX_RETRY_DELAY = 10000;

// ====================
// CACHE CONFIGURATION
// ====================

/**
 * Cache TTL for listing data (5 minutes)
 */
export const LISTING_CACHE_TTL = 5 * 60 * 1000;

/**
 * Cache TTL for user profiles (10 minutes)
 */
export const USER_CACHE_TTL = 10 * 60 * 1000;

/**
 * Cache TTL for transaction data (1 minute)
 */
export const TRANSACTION_CACHE_TTL = 1 * 60 * 1000;

// ====================
// FEATURE FLAGS
// ====================

/**
 * Feature flags for gradual rollout
 */
export const FEATURES = {
  ENABLE_MOCK_DATA: import.meta.env.DEV || false,
  ENABLE_DEBUG_LOGGING: import.meta.env.DEV || false,
  ENABLE_ANALYTICS: import.meta.env.PROD || false,
  ENABLE_ERROR_REPORTING: import.meta.env.PROD || false,
} as const;

// ====================
// ENVIRONMENT HELPERS
// ====================

/**
 * Check if running in development mode
 */
export const IS_DEV = import.meta.env.DEV;

/**
 * Check if running in production mode
 */
export const IS_PROD = import.meta.env.PROD;

/**
 * App version (from package.json)
 */
export const APP_VERSION = import.meta.env.VITE_APP_VERSION || '1.0.0';

// ====================
// VALIDATION HELPERS
// ====================

/**
 * Check if all required environment variables are set
 */
export function validateEnvironment(): { valid: boolean; missing: string[] } {
  const required = ['VITE_HOLOCHAIN_WS_URL'];
  const recommended = ['VITE_PINATA_JWT', 'VITE_PINATA_GATEWAY'];

  const missing: string[] = [];

  for (const key of required) {
    if (!import.meta.env[key]) {
      missing.push(key);
    }
  }

  if (missing.length > 0) {
    console.error('Missing required environment variables:', missing);
  }

  const missingRecommended = recommended.filter(key => !import.meta.env[key]);
  if (missingRecommended.length > 0) {
    console.warn('Missing recommended environment variables:', missingRecommended);
  }

  return {
    valid: missing.length === 0,
    missing,
  };
}
