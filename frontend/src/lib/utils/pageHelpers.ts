/**
 * Page Helper Utilities
 *
 * Common helper functions used across multiple pages.
 * Extracted to eliminate code duplication.
 */

import { formatDate as formatDateUtil, formatRelativeTime } from './format';
import { TRUST_THRESHOLDS } from '$lib/config/constants';

// ====================
// DATE FORMATTING
// ====================

/**
 * Format timestamp for display
 * Unified function used across all pages
 *
 * @param timestamp - Unix timestamp in milliseconds
 * @param format - Display format ('short', 'long', 'relative')
 * @returns Formatted date string
 */
export function formatTimestamp(
  timestamp: number,
  format: 'short' | 'long' | 'relative' = 'short'
): string {
  const date = new Date(timestamp);

  switch (format) {
    case 'relative':
      return formatRelativeTime(date);

    case 'long':
      return formatDateUtil(date, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });

    case 'short':
    default:
      return formatDateUtil(date, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
  }
}

// ====================
// TRUST SCORE HELPERS
// ====================

/**
 * Format trust score for display
 *
 * @param score - Trust score (0-100)
 * @returns Formatted trust percentage string
 */
export function formatTrustScore(score: number): string {
  return `${Math.round(score)}%`;
}

/**
 * Get trust score level
 *
 * @param score - Trust score (0-100)
 * @returns Trust level ('excellent', 'good', 'fair', 'poor')
 */
export function getTrustLevel(score: number): 'excellent' | 'good' | 'fair' | 'poor' {
  if (score >= TRUST_THRESHOLDS.EXCELLENT) return 'excellent';
  if (score >= TRUST_THRESHOLDS.GOOD) return 'good';
  if (score >= TRUST_THRESHOLDS.FAIR) return 'fair';
  return 'poor';
}

/**
 * Get trust score color class
 *
 * @param score - Trust score (0-100)
 * @returns CSS class name for styling
 */
export function getTrustScoreClass(score: number): string {
  const level = getTrustLevel(score);

  switch (level) {
    case 'excellent':
      return 'trust-excellent';
    case 'good':
      return 'trust-good';
    case 'fair':
      return 'trust-fair';
    case 'poor':
      return 'trust-poor';
  }
}

/**
 * Get trust score emoji
 *
 * @param score - Trust score (0-100)
 * @returns Emoji representing trust level
 */
export function getTrustScoreEmoji(score: number): string {
  const level = getTrustLevel(score);

  switch (level) {
    case 'excellent':
      return '⭐';
    case 'good':
      return '✓';
    case 'fair':
      return '⚠️';
    case 'poor':
      return '⚠️';
  }
}

// ====================
// TRANSACTION STATUS HELPERS
// ====================

/**
 * Get transaction status display text
 *
 * @param status - Transaction status
 * @returns Human-readable status text
 */
export function getTransactionStatusText(
  status: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'disputed' | 'cancelled'
): string {
  const statusMap = {
    pending: 'Pending',
    confirmed: 'Confirmed',
    shipped: 'Shipped',
    delivered: 'Delivered',
    disputed: 'In Dispute',
    cancelled: 'Cancelled',
  };

  return statusMap[status] || status;
}

/**
 * Get transaction status color class
 *
 * @param status - Transaction status
 * @returns CSS class name for styling
 */
export function getTransactionStatusClass(
  status: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'disputed' | 'cancelled'
): string {
  const classMap = {
    pending: 'status-pending',
    confirmed: 'status-confirmed',
    shipped: 'status-shipped',
    delivered: 'status-delivered',
    disputed: 'status-disputed',
    cancelled: 'status-cancelled',
  };

  return classMap[status] || 'status-default';
}

/**
 * Get transaction status emoji
 *
 * @param status - Transaction status
 * @returns Emoji representing status
 */
export function getTransactionStatusEmoji(
  status: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'disputed' | 'cancelled'
): string {
  const emojiMap = {
    pending: '⏳',
    confirmed: '✓',
    shipped: '📦',
    delivered: '✅',
    disputed: '⚠️',
    cancelled: '❌',
  };

  return emojiMap[status] || '•';
}

// ====================
// DISPUTE STATUS HELPERS
// ====================

/**
 * Get dispute status display text
 *
 * @param status - Dispute status
 * @returns Human-readable status text
 */
export function getDisputeStatusText(
  status: 'open' | 'under_review' | 'resolved_buyer' | 'resolved_seller' | 'resolved_split'
): string {
  const statusMap = {
    open: 'Open',
    under_review: 'Under Review',
    resolved_buyer: 'Resolved (Buyer Favor)',
    resolved_seller: 'Resolved (Seller Favor)',
    resolved_split: 'Resolved (Split)',
  };

  return statusMap[status] || status;
}

/**
 * Get dispute status color class
 *
 * @param status - Dispute status
 * @returns CSS class name for styling
 */
export function getDisputeStatusClass(
  status: 'open' | 'under_review' | 'resolved_buyer' | 'resolved_seller' | 'resolved_split'
): string {
  const classMap = {
    open: 'dispute-open',
    under_review: 'dispute-review',
    resolved_buyer: 'dispute-resolved-buyer',
    resolved_seller: 'dispute-resolved-seller',
    resolved_split: 'dispute-resolved-split',
  };

  return classMap[status] || 'dispute-default';
}

// ====================
// CATEGORY HELPERS
// ====================

/**
 * Get category emoji
 *
 * @param category - Listing category
 * @returns Emoji representing category
 */
export function getCategoryEmoji(category: string): string {
  const emojiMap: Record<string, string> = {
    'Electronics': '💻',
    'Fashion': '👔',
    'Home & Garden': '🏡',
    'Sports & Outdoors': '⚽',
    'Books & Media': '📚',
    'Toys & Games': '🎮',
    'Health & Beauty': '💄',
    'Automotive': '🚗',
    'Art & Collectibles': '🎨',
    'Other': '📦',
  };

  return emojiMap[category] || '📦';
}

// ====================
// LISTING HELPERS
// ====================

/**
 * Check if listing is available
 *
 * @param listing - Listing object
 * @returns True if listing is available for purchase
 */
export function isListingAvailable(listing: { quantity_available: number; status?: string }): boolean {
  return listing.quantity_available > 0 && listing.status !== 'inactive';
}

/**
 * Get listing availability text
 *
 * @param listing - Listing object
 * @returns Availability status text
 */
export function getListingAvailabilityText(listing: { quantity_available: number }): string {
  if (listing.quantity_available === 0) {
    return 'Out of Stock';
  } else if (listing.quantity_available < 5) {
    return `Only ${listing.quantity_available} left!`;
  } else {
    return 'In Stock';
  }
}

// ====================
// VALIDATION HELPERS
// ====================

/**
 * Truncate hash for display
 *
 * @param hash - Full hash string
 * @param length - Characters to show (default: 8)
 * @returns Truncated hash with ellipsis
 */
export function truncateHash(hash: string, length: number = 8): string {
  if (hash.length <= length * 2) return hash;
  return `${hash.slice(0, length)}...${hash.slice(-length)}`;
}

/**
 * Copy text to clipboard
 *
 * @param text - Text to copy
 * @returns Promise that resolves when copy is complete
 */
export async function copyToClipboard(text: string): Promise<void> {
  if (navigator.clipboard) {
    await navigator.clipboard.writeText(text);
  } else {
    // Fallback for older browsers
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
  }
}

// ====================
// EXPORT ALL
// ====================

export const pageHelpers = {
  formatTimestamp,
  formatTrustScore,
  getTrustLevel,
  getTrustScoreClass,
  getTrustScoreEmoji,
  getTransactionStatusText,
  getTransactionStatusClass,
  getTransactionStatusEmoji,
  getDisputeStatusText,
  getDisputeStatusClass,
  getCategoryEmoji,
  isListingAvailable,
  getListingAvailabilityText,
  truncateHash,
  copyToClipboard,
};
