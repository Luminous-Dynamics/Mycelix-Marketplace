<script lang="ts">
  /**
   * ListingCard Component
   *
   * Specialized card for displaying marketplace listings in grid or list views.
   * Eliminates duplicate listing display logic across browse, dashboard, my-listings pages.
   *
   * @component
   * @example
   * ```svelte
   * <ListingCard
   *   listing={listing}
   *   variant="full"
   *   on:click={() => goto(`/listing/${listing.hash}`)}
   *   on:addToCart={handleAddToCart}
   * />
   * ```
   */

  import { createEventDispatcher } from 'svelte';
  import { getIpfsUrl } from '$lib/ipfs/ipfsClient';
  import { formatPrice } from '$lib/utils/format';
  import TrustBadge from './TrustBadge.svelte';
  import Button from './Button.svelte';
  import type { Listing } from '$types';

  const dispatch = createEventDispatcher<{
    click: MouseEvent;
    addToCart: void;
    viewDetails: void;
  }>();

  /**
   * The listing data to display
   */
  export let listing: Listing;

  /**
   * Display variant
   * - full: Complete listing card with all details
   * - compact: Smaller card for dashboard/widgets
   */
  export let variant: 'full' | 'compact' = 'full';

  /**
   * Whether to show action buttons (Add to Cart, View Details)
   */
  export let showActions: boolean = true;

  /**
   * Whether the card is clickable (navigates to listing detail)
   */
  export let clickable: boolean = true;

  /**
   * Custom CSS classes
   */
  let className: string = '';
  export { className as class };

  // Computed values
  $: mainPhotoUrl = listing.photos && listing.photos.length > 0
    ? getIpfsUrl(listing.photos[0])
    : '/placeholder-product.png';

  $: isOutOfStock = listing.quantity_available === 0;

  // Event handlers
  function handleClick(event: MouseEvent) {
    if (clickable) {
      dispatch('click', event);
    }
  }

  function handleAddToCart(event: MouseEvent) {
    event.stopPropagation();
    dispatch('addToCart');
  }

  function handleViewDetails(event: MouseEvent) {
    event.stopPropagation();
    dispatch('viewDetails');
  }
</script>

<div
  class="listing-card listing-card-{variant} {className}"
  class:clickable
  class:out-of-stock={isOutOfStock}
  on:click={handleClick}
  on:keypress={(e) => {
    if (clickable && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      handleClick(e as unknown as MouseEvent);
    }
  }}
  role={clickable ? 'button' : 'article'}
  tabindex={clickable ? 0 : undefined}
  aria-label={clickable ? `View ${listing.title}` : undefined}
>
  <!-- Image -->
  <div class="listing-image">
    <img
      src={mainPhotoUrl}
      alt={listing.title}
      loading="lazy"
    />
    {#if isOutOfStock}
      <div class="out-of-stock-overlay">
        <span>Out of Stock</span>
      </div>
    {/if}
    {#if listing.photos && listing.photos.length > 1}
      <div class="photo-count">
        📷 {listing.photos.length}
      </div>
    {/if}
  </div>

  <!-- Content -->
  <div class="listing-content">
    <!-- Title -->
    <h3 class="listing-title">{listing.title}</h3>

    <!-- Price & Category -->
    <div class="listing-meta">
      <span class="listing-price">{formatPrice(listing.price, listing.currency)}</span>
      <span class="listing-category">{listing.category}</span>
    </div>

    {#if variant === 'full'}
      <!-- Description (truncated) -->
      {#if listing.description}
        <p class="listing-description">
          {listing.description.length > 100
            ? listing.description.substring(0, 100) + '...'
            : listing.description}
        </p>
      {/if}

      <!-- Seller Info -->
      <div class="listing-seller">
        <span class="seller-name">
          By {listing.seller_name || 'Anonymous Seller'}
        </span>
        {#if listing.seller_trust_score !== undefined}
          <TrustBadge score={listing.seller_trust_score} size="sm" />
        {/if}
      </div>

      <!-- Quantity -->
      <div class="listing-quantity">
        <span class="quantity-label">Available:</span>
        <span class="quantity-value">{listing.quantity_available}</span>
      </div>
    {/if}

    <!-- Actions -->
    {#if showActions && !isOutOfStock}
      <div class="listing-actions">
        {#if variant === 'full'}
          <Button
            variant="secondary"
            size="sm"
            on:click={handleAddToCart}
          >
            🛒 Add to Cart
          </Button>
          <Button
            variant="primary"
            size="sm"
            on:click={handleViewDetails}
          >
            View Details
          </Button>
        {:else}
          <Button
            variant="link"
            size="sm"
            on:click={handleViewDetails}
          >
            View →
          </Button>
        {/if}
      </div>
    {/if}
  </div>
</div>

<style>
  /* Base Card Styles */
  .listing-card {
    background: white;
    border-radius: 12px;
    border: 1px solid #e2e8f0;
    overflow: hidden;
    transition: all 0.2s ease;
    display: flex;
    flex-direction: column;
  }

  .listing-card.clickable {
    cursor: pointer;
  }

  .listing-card.clickable:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
    border-color: #cbd5e0;
  }

  .listing-card.clickable:focus-visible {
    outline: 2px solid #4299e1;
    outline-offset: 2px;
  }

  .listing-card.clickable:active {
    transform: translateY(-2px);
  }

  .listing-card.out-of-stock {
    opacity: 0.7;
  }

  /* Image Section */
  .listing-image {
    position: relative;
    width: 100%;
    padding-top: 75%; /* 4:3 aspect ratio */
    background: #f7fafc;
    overflow: hidden;
  }

  .listing-image img {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform 0.2s ease;
  }

  .listing-card.clickable:hover .listing-image img {
    transform: scale(1.05);
  }

  .out-of-stock-overlay {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.6);
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .out-of-stock-overlay span {
    background: white;
    color: #e53e3e;
    padding: 0.5rem 1rem;
    border-radius: 6px;
    font-weight: 600;
    font-size: 0.875rem;
  }

  .photo-count {
    position: absolute;
    bottom: 0.5rem;
    right: 0.5rem;
    background: rgba(0, 0, 0, 0.7);
    color: white;
    padding: 0.25rem 0.5rem;
    border-radius: 4px;
    font-size: 0.75rem;
    font-weight: 500;
  }

  /* Content Section */
  .listing-content {
    padding: 1rem;
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    flex: 1;
  }

  .listing-card-compact .listing-content {
    padding: 0.75rem;
    gap: 0.5rem;
  }

  .listing-title {
    margin: 0;
    font-size: 1.125rem;
    font-weight: 600;
    color: #2d3748;
    line-height: 1.4;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .listing-card-compact .listing-title {
    font-size: 1rem;
    -webkit-line-clamp: 1;
  }

  .listing-meta {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 0.5rem;
  }

  .listing-price {
    font-size: 1.25rem;
    font-weight: 700;
    color: #4299e1;
  }

  .listing-card-compact .listing-price {
    font-size: 1.125rem;
  }

  .listing-category {
    background: #e2e8f0;
    color: #4a5568;
    padding: 0.25rem 0.75rem;
    border-radius: 12px;
    font-size: 0.75rem;
    font-weight: 500;
  }

  .listing-description {
    color: #718096;
    font-size: 0.875rem;
    line-height: 1.6;
    margin: 0;
  }

  .listing-seller {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.875rem;
  }

  .seller-name {
    color: #4a5568;
  }

  .listing-quantity {
    display: flex;
    gap: 0.5rem;
    font-size: 0.875rem;
  }

  .quantity-label {
    color: #718096;
  }

  .quantity-value {
    color: #2d3748;
    font-weight: 600;
  }

  /* Actions */
  .listing-actions {
    display: flex;
    gap: 0.5rem;
    margin-top: auto;
    padding-top: 0.75rem;
    border-top: 1px solid #e2e8f0;
  }

  .listing-card-compact .listing-actions {
    padding-top: 0.5rem;
  }

  /* Dark Mode */
  @media (prefers-color-scheme: dark) {
    .listing-card {
      background: #2d3748;
      border-color: #4a5568;
    }

    .listing-card.clickable:hover {
      border-color: #718096;
    }

    .listing-title {
      color: #e2e8f0;
    }

    .listing-price {
      color: #63b3ed;
    }

    .listing-category {
      background: #4a5568;
      color: #e2e8f0;
    }

    .listing-description,
    .seller-name {
      color: #cbd5e0;
    }

    .quantity-value {
      color: #e2e8f0;
    }

    .listing-actions {
      border-color: #4a5568;
    }

    .listing-image {
      background: #1a202c;
    }
  }

  /* Responsive */
  @media (max-width: 768px) {
    .listing-title {
      font-size: 1rem;
    }

    .listing-price {
      font-size: 1.125rem;
    }
  }
</style>
