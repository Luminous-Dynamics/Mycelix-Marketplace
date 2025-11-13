<script lang="ts">
  /**
   * Listing Detail Page
   *
   * Shows complete product information:
   * - Product photos (IPFS gallery)
   * - Title, description, price, quantity
   * - Seller profile and trust score
   * - Product reviews
   * - Add to cart / Buy now actions
   */

  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import { initHolochainClient } from '$lib/holochain';
  import { getListing } from '$lib/holochain/listings';
  import { createTransaction } from '$lib/holochain/transactions';
  import { cartItems } from '$lib/stores/cart';
  import { notifications } from '$lib/stores';
  import type { ListingWithContext, Review, SellerInfo, CreateTransactionInput } from '$types';

  // Route parameter
  $: listing_hash = $page.params.listing_hash;

  // State
  let loading = true;
  let error = '';
  let listing: ListingWithContext['listing'] | null = null;
  let seller: SellerInfo | null = null;
  let reviews: Review[] = [];

  // Purchase state
  let quantity = 1;
  let purchasing = false;
  let selectedImageIndex = 0;

  /**
   * Load listing data
   */
  onMount(async () => {
    await loadListing();
  });

  async function loadListing() {
    loading = true;
    error = '';

    // Validate listing_hash parameter
    if (!listing_hash) {
      error = 'Invalid listing ID';
      notifications.error('Invalid Listing', 'Listing ID is missing');
      loading = false;
      return;
    }

    try {
      const client = await initHolochainClient();
      const listingData = await getListing(client, listing_hash);

      listing = listingData.listing;
      seller = listingData.seller;
      reviews = listingData.reviews || [];

      notifications.success('Listing Loaded', listing.title);
    } catch (e: any) {
      error = e.message || 'Failed to load listing';
      notifications.error('Loading Failed', error);
    } finally {
      loading = false;
    }
  }

  /**
   * Add to cart
   */
  function addToCart() {
    if (!listing || !seller || !listing_hash) return;

    cartItems.addItem({
      listing_hash,
      title: listing.title,
      price: listing.price,
      quantity,
      photo_cid: listing.photos_ipfs_cids[0],
      seller_agent_id: seller.agent_id,
      seller_name: seller.username,
    });

    notifications.success('Added to Cart', `${quantity}x ${listing.title}`);
  }

  /**
   * Buy now (direct purchase)
   */
  async function buyNow() {
    if (!listing || !seller || !listing_hash) return;

    purchasing = true;

    try {
      const client = await initHolochainClient();

      // Create transaction directly
      const transactionInput: CreateTransactionInput = {
        listing_hash,
        quantity,
        shipping_address: {
          name: '', // Will be filled in checkout
          address_line_1: '',
          city: '',
          state: '',
          postal_code: '',
          country: 'USA',
        },
        payment_method: 'crypto', // Default
      };

      await createTransaction(client, transactionInput);

      notifications.success('Purchase Initiated', 'Redirecting to checkout...');

      setTimeout(() => {
        goto('/checkout');
      }, 1500);
    } catch (e: any) {
      notifications.error('Purchase Failed', e.message || 'Failed to create transaction');
    } finally {
      purchasing = false;
    }
  }

  /**
   * Format date
   */
  function formatDate(timestamp: number): string {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  }

  /**
   * Format trust score
   */
  function formatTrustScore(score: number): string {
    const percentage = score > 1 ? score : score * 100;
    return `${percentage.toFixed(1)}%`;
  }
</script>

<div class="listing-detail">
  <div class="container">
    {#if loading}
      <!-- Loading State -->
      <div class="loading-state">
        <div class="spinner"></div>
        <p>Loading listing...</p>
      </div>
    {:else if error || !listing}
      <!-- Error State -->
      <div class="error-state">
        <span class="error-icon">⚠️</span>
        <h2>Listing Not Found</h2>
        <p>{error || 'This listing does not exist or has been removed'}</p>
        <button class="btn btn-primary" on:click={() => goto('/browse')}>
          Browse Marketplace
        </button>
      </div>
    {:else}
      <!-- Breadcrumb -->
      <div class="breadcrumb">
        <button on:click={() => goto('/browse')}>Browse</button>
        <span>›</span>
        <button on:click={() => goto(`/browse?category=${listing?.category}`)}>
          {listing?.category}
        </button>
        <span>›</span>
        <span>{listing?.title}</span>
      </div>

      <!-- Main Content -->
      <div class="listing-grid">
        <!-- Left: Photos -->
        <div class="photos-section">
          <div class="main-photo">
            {#if listing.photos_ipfs_cids && listing.photos_ipfs_cids[selectedImageIndex]}
              <img
                src="https://ipfs.io/ipfs/{listing.photos_ipfs_cids[selectedImageIndex]}"
                alt={listing.title}
              />
            {:else}
              <div class="photo-placeholder">📷</div>
            {/if}
          </div>

          {#if listing.photos_ipfs_cids && listing.photos_ipfs_cids.length > 1}
            <div class="photo-thumbnails">
              {#each listing.photos_ipfs_cids as cid, index}
                <button
                  class="thumbnail"
                  class:active={index === selectedImageIndex}
                  on:click={() => (selectedImageIndex = index)}
                >
                  <img src="https://ipfs.io/ipfs/{cid}" alt="Thumbnail {index + 1}" />
                </button>
              {/each}
            </div>
          {/if}
        </div>

        <!-- Right: Details -->
        <div class="details-section">
          <h1>{listing.title}</h1>

          <div class="price-section">
            <span class="price">${listing.price.toFixed(2)}</span>
            {#if listing.quantity_available}
              <span class="availability">
                {listing.quantity_available} available
              </span>
            {/if}
          </div>

          <div class="category-tag">{listing.category}</div>

          <!-- Seller Info -->
          {#if seller}
            <div class="seller-card">
              <div class="seller-avatar">
                {#if seller.avatar_cid}
                  <img src="https://ipfs.io/ipfs/{seller.avatar_cid}" alt={seller.username} />
                {:else}
                  <div class="avatar-placeholder">
                    {seller.username.charAt(0).toUpperCase()}
                  </div>
                {/if}
              </div>
              <div class="seller-info">
                <button class="seller-name" on:click={() => goto(`/seller/${seller?.agent_id}`)}>
                  {seller?.username}
                </button>
                <div class="seller-stats">
                  <span class="trust-score">{formatTrustScore(seller.trust_score)} Trust</span>
                  <span class="rating">
                    ⭐ {seller.average_rating?.toFixed(1) || 'N/A'} ({seller.total_sales} sales)
                  </span>
                </div>
                <p class="member-since">Member since {formatDate(seller.member_since)}</p>
              </div>
            </div>
          {/if}

          <!-- Purchase Actions -->
          <div class="purchase-section">
            <div class="quantity-selector">
              <label for="quantity-input">Quantity:</label>
              <div class="quantity-controls">
                <button
                  on:click={() => quantity = Math.max(1, quantity - 1)}
                  aria-label="Decrease quantity"
                >
                  −
                </button>
                <input
                  id="quantity-input"
                  type="number"
                  bind:value={quantity}
                  min="1"
                  max={listing.quantity_available || 99}
                  aria-label="Select quantity to purchase"
                />
                <button
                  on:click={() => quantity = Math.min(listing?.quantity_available || 99, quantity + 1)}
                  aria-label="Increase quantity"
                >
                  +
                </button>
              </div>
            </div>

            <div class="action-buttons">
              <button class="btn btn-secondary btn-large" on:click={addToCart}>
                🛒 Add to Cart
              </button>
              <button
                class="btn btn-primary btn-large"
                on:click={buyNow}
                disabled={purchasing}
              >
                {#if purchasing}
                  Processing...
                {:else}
                  ⚡ Buy Now
                {/if}
              </button>
            </div>
          </div>

          <!-- Description -->
          <div class="description-section">
            <h2>Description</h2>
            <p>{listing.description}</p>
          </div>

          <!-- Listing Meta -->
          <div class="meta-info">
            <p><strong>Listed:</strong> {formatDate(listing.created_at)}</p>
            {#if listing.views}
              <p><strong>Views:</strong> {listing.views}</p>
            {/if}
            <p><strong>Status:</strong> {listing.status}</p>
          </div>
        </div>
      </div>

      <!-- Reviews Section -->
      {#if reviews.length > 0}
        <div class="reviews-section">
          <h2>Reviews ({reviews.length})</h2>
          <div class="reviews-list">
            {#each reviews as review}
              <div class="review-card">
                <div class="review-header">
                  <div class="review-rating">
                    {'⭐'.repeat(review.rating)}
                  </div>
                  <span class="review-date">{formatDate(review.created_at)}</span>
                </div>
                <p class="review-comment">{review.comment}</p>
                <p class="review-author">— {review.reviewer_name}</p>
              </div>
            {/each}
          </div>
        </div>
      {/if}
    {/if}
  </div>
</div>

<style>
  .listing-detail {
    min-height: 100vh;
    padding: 2rem 1rem;
    background: #f7fafc;
  }

  .container {
    max-width: 1400px;
    margin: 0 auto;
  }

  /* Loading State */
  .loading-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 400px;
    gap: 1rem;
  }

  .spinner {
    width: 50px;
    height: 50px;
    border: 4px solid #e2e8f0;
    border-top-color: #4299e1;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }

  /* Error State */
  .error-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 400px;
    background: white;
    border-radius: 0.5rem;
    padding: 3rem;
    text-align: center;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  }

  .error-icon {
    font-size: 4rem;
    margin-bottom: 1rem;
  }

  .error-state h2 {
    font-size: 1.5rem;
    font-weight: 600;
    color: #2d3748;
    margin-bottom: 0.5rem;
  }

  .error-state p {
    color: #718096;
    margin-bottom: 2rem;
  }

  /* Breadcrumb */
  .breadcrumb {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-bottom: 2rem;
    font-size: 0.875rem;
    color: #718096;
  }

  .breadcrumb button {
    background: none;
    border: none;
    color: #4299e1;
    cursor: pointer;
    padding: 0;
  }

  .breadcrumb button:hover {
    text-decoration: underline;
  }

  /* Main Grid */
  .listing-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 3rem;
    margin-bottom: 3rem;
  }

  /* Photos Section */
  .photos-section {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .main-photo {
    width: 100%;
    height: 500px;
    background: white;
    border-radius: 0.5rem;
    overflow: hidden;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  }

  .main-photo img {
    width: 100%;
    height: 100%;
    object-fit: contain;
  }

  .photo-placeholder {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #f7fafc;
    font-size: 5rem;
  }

  .photo-thumbnails {
    display: flex;
    gap: 0.75rem;
    overflow-x: auto;
  }

  .thumbnail {
    width: 100px;
    height: 100px;
    border: 2px solid transparent;
    border-radius: 0.375rem;
    overflow: hidden;
    cursor: pointer;
    flex-shrink: 0;
    background: white;
    padding: 0;
  }

  .thumbnail:hover {
    border-color: #4299e1;
  }

  .thumbnail.active {
    border-color: #4299e1;
  }

  .thumbnail img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  /* Details Section */
  .details-section {
    background: white;
    border-radius: 0.5rem;
    padding: 2rem;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  }

  .details-section h1 {
    font-size: 2rem;
    font-weight: 700;
    color: #2d3748;
    margin-bottom: 1rem;
  }

  .price-section {
    display: flex;
    align-items: center;
    gap: 1rem;
    margin-bottom: 1rem;
  }

  .price {
    font-size: 2.5rem;
    font-weight: 700;
    color: #38a169;
  }

  .availability {
    color: #718096;
    font-size: 0.875rem;
  }

  .category-tag {
    display: inline-block;
    padding: 0.5rem 1rem;
    background: #edf2f7;
    color: #4a5568;
    border-radius: 0.375rem;
    font-size: 0.875rem;
    font-weight: 600;
    margin-bottom: 1.5rem;
  }

  /* Seller Card */
  .seller-card {
    display: flex;
    gap: 1rem;
    padding: 1.5rem;
    background: #f7fafc;
    border-radius: 0.5rem;
    margin-bottom: 2rem;
  }

  .seller-avatar {
    width: 60px;
    height: 60px;
    border-radius: 50%;
    overflow: hidden;
    flex-shrink: 0;
  }

  .seller-avatar img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .avatar-placeholder {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    font-size: 1.5rem;
    font-weight: 700;
  }

  .seller-info {
    flex: 1;
  }

  .seller-name {
    background: none;
    border: none;
    font-size: 1.125rem;
    font-weight: 600;
    color: #4299e1;
    cursor: pointer;
    padding: 0;
    margin-bottom: 0.25rem;
  }

  .seller-name:hover {
    text-decoration: underline;
  }

  .seller-stats {
    display: flex;
    gap: 1rem;
    margin-bottom: 0.25rem;
  }

  .trust-score {
    color: #38a169;
    font-weight: 600;
    font-size: 0.875rem;
  }

  .rating {
    color: #718096;
    font-size: 0.875rem;
  }

  .member-since {
    color: #a0aec0;
    font-size: 0.75rem;
  }

  /* Purchase Section */
  .purchase-section {
    padding: 1.5rem 0;
    border-top: 1px solid #e2e8f0;
    border-bottom: 1px solid #e2e8f0;
    margin-bottom: 2rem;
  }

  .quantity-selector {
    display: flex;
    align-items: center;
    gap: 1rem;
    margin-bottom: 1.5rem;
  }

  .quantity-selector label {
    font-weight: 600;
    color: #2d3748;
  }

  .quantity-controls {
    display: flex;
    align-items: center;
    border: 1px solid #e2e8f0;
    border-radius: 0.375rem;
    overflow: hidden;
  }

  .quantity-controls button {
    padding: 0.5rem 1rem;
    background: #f7fafc;
    border: none;
    cursor: pointer;
    font-size: 1.25rem;
    font-weight: 700;
  }

  .quantity-controls button:hover {
    background: #e2e8f0;
  }

  .quantity-controls input {
    width: 60px;
    padding: 0.5rem;
    border: none;
    text-align: center;
    font-size: 1rem;
  }

  .action-buttons {
    display: flex;
    gap: 1rem;
  }

  .btn {
    flex: 1;
    padding: 1rem 1.5rem;
    border: none;
    border-radius: 0.375rem;
    font-size: 1rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
  }

  .btn-primary {
    background: #4299e1;
    color: white;
  }

  .btn-primary:hover:not(:disabled) {
    background: #3182ce;
  }

  .btn-secondary {
    background: #e2e8f0;
    color: #2d3748;
  }

  .btn-secondary:hover {
    background: #cbd5e0;
  }

  .btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  /* Description */
  .description-section {
    margin-bottom: 2rem;
  }

  .description-section h2 {
    font-size: 1.25rem;
    font-weight: 600;
    color: #2d3748;
    margin-bottom: 0.75rem;
  }

  .description-section p {
    color: #4a5568;
    line-height: 1.7;
    white-space: pre-wrap;
  }

  /* Meta Info */
  .meta-info {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .meta-info p {
    font-size: 0.875rem;
    color: #718096;
  }

  .meta-info strong {
    color: #4a5568;
  }

  /* Reviews */
  .reviews-section {
    background: white;
    border-radius: 0.5rem;
    padding: 2rem;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  }

  .reviews-section h2 {
    font-size: 1.5rem;
    font-weight: 600;
    color: #2d3748;
    margin-bottom: 1.5rem;
  }

  .reviews-list {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }

  .review-card {
    padding: 1.5rem;
    background: #f7fafc;
    border-radius: 0.5rem;
  }

  .review-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.75rem;
  }

  .review-rating {
    color: #ecc94b;
    font-size: 1.125rem;
  }

  .review-date {
    font-size: 0.875rem;
    color: #a0aec0;
  }

  .review-comment {
    color: #4a5568;
    line-height: 1.6;
    margin-bottom: 0.5rem;
  }

  .review-author {
    font-size: 0.875rem;
    color: #718096;
    font-style: italic;
  }

  /* Responsive */
  @media (max-width: 968px) {
    .listing-grid {
      grid-template-columns: 1fr;
      gap: 2rem;
    }

    .action-buttons {
      flex-direction: column;
    }

    .details-section h1 {
      font-size: 1.5rem;
    }

    .price {
      font-size: 2rem;
    }
  }
</style>
