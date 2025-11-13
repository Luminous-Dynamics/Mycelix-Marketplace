/**
 * Barrel export for Holochain client functionality
 */

// Client initialization and management
export { initHolochainClient, disconnectHolochainClient } from './client';

// Listings management
export {
  createListing,
  getListing,
  getListingsByCategory,
  updateListing,
  searchListings
} from './listings';

// Transactions management
export {
  createTransaction,
  getTransaction,
  getMyTransactions,
  getMyPurchases,
  getMySales,
  updateTransactionStatus,
  confirmDelivery,
  markAsShipped,
  getTransactionsByListing
} from './transactions';

// User profile management and reviews
export {
  getUserProfile,
  getMyProfile,
  updateMyProfile,
  createReview,
  getReviewsForListing,
  getReviewsForSeller,
  getMyReviews,
  getReviewsIWrote
} from './users';

// Disputes and arbitration
export {
  createDispute,
  getDispute,
  getDisputesByStatus,
  getMyDisputes,
  getMyArbitrationCases,
  castArbitratorVote,
  getArbitratorProfile,
  isArbitrator,
  getAllDisputes
} from './disputes';

// Types
export type {
  CreateListingInput,
  Listing,
  CreateTransactionInput,
  Transaction,
  TransactionStatus,
  UserProfile,
  CreateDisputeInput,
  Dispute,
  DisputeStatus,
  Review
} from '$types';
