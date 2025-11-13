<script lang="ts">
  /**
   * Browse Marketplace
   *
   * Marketplace browsing interface with:
   * - Grid/list view of all listings
   * - Category filtering
   * - Price range filtering
   * - Search functionality
   * - Sort options
   */

  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { initHolochainClient } from '$lib/holochain';
  import { getAllListings, searchListings, getListingsByCategory } from '$lib/holochain/listings';
  import { notifications } from '$lib/stores';
  import type { Listing, ListingCategory } from '$types';

  // Extended listing with trust score
  interface ListingWithTrust extends Listing {
    seller_trust_score?: number;
  }

  // State
  let loading = true;
  let error = '';
  let allListings: ListingWithTrust[] = [];
  let filteredListings: ListingWithTrust[] = [];

  // Filters
  let searchQuery = '';
  let selectedCategory: ListingCategory | 'All Categories' = 'All Categories';
  let minPrice = 0;
  let maxPrice = 10000;
  let sortBy: 'newest' | 'price-low' | 'price-high' | 'trust' = 'newest';

  // View mode
  let viewMode: 'grid' | 'list' = 'grid';

  // Categories
  const categories: (ListingCategory | 'All Categories')[] = [
    'All Categories',
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

  /**
   * Load all listings
   */
  onMount(async () => {
    await loadListings();
  });

  async function loadListings() {
    loading = true;
    error = '';

    try {
      const client = await initHolochainClient();
      const listings = await getAllListings(client);

      // Add placeholder trust scores (TODO: batch fetch seller profiles)
      allListings = listings.map((listing) => ({
        ...listing,
        seller_trust_score: 85, // Default value
      }));

      applyFilters();

      notifications.success('Listings Loaded', `Found ${allListings.length} listings`);
    } catch (e: any) {
      error = e.message || 'Failed to load listings';
      notifications.error('Loading Failed', error);
    } finally {
      loading = false;
    }
  }

  /**
   * Apply filters and sorting
   */
  function applyFilters() {
    let filtered = [...allListings];

    // Category filter
    if (selectedCategory !== 'All Categories') {
      filtered = filtered.filter((l) => l.category === selectedCategory);
    }

    // Price filter
    filtered = filtered.filter((l) => l.price >= minPrice && l.price <= maxPrice);

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (l) =>
          l.title.toLowerCase().includes(query) ||
          l.description.toLowerCase().includes(query) ||
          l.category.toLowerCase().includes(query)
      );
    }

    // Sort
    switch (sortBy) {
      case 'newest':
        filtered.sort((a, b) => b.created_at - a.created_at);
        break;
      case 'price-low':
        filtered.sort((a, b) => a.price - b.price);
        break;
      case 'price-high':
        filtered.sort((a, b) => b.price - a.price);
        break;
      case 'trust':
        filtered.sort((a, b) => (b.seller_trust_score || 0) - (a.seller_trust_score || 0));
        break;
    }

    filteredListings = filtered;
  }

  /**
   * Reactive filter application
   */
  $: if (allListings.length > 0) {
    applyFilters();
  }
  $: searchQuery, selectedCategory, minPrice, maxPrice, sortBy, applyFilters();

  /**
   * View listing details
   */
  function viewListing(listing_hash: string) {
    goto(`/listing/${listing_hash}`);
  }

  /**
   * Format date
   */
  function formatDate(timestamp: number): string {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }
</script>

<div class="browse">
  <div class="container">
    <div class="browse-header">
      <h1>Browse Marketplace</h1>
      <p class="subtitle">Discover unique items from trusted sellers</p>
    </div>

    {#if loading}
      <!-- Loading State -->
      <div class="loading-state">
        <div class="spinner"></div>
        <p>Loading listings...</p>
      </div>
    {:else if error}
      <!-- Error State -->
      <div class="error-state">
        <span class="error-icon">⚠️</span>
        <h2>Failed to Load Listings</h2>
        <p>{error}</p>
        <button class="btn btn-primary" on:click={loadListings}>Retry</button>
      </div>
    {:else}
      <!-- Filters and Controls -->
      <div class="controls-section">
        <div class="filters">
          <!-- Search -->
          <div class="filter-group">
            <input
              type="text"
              placeholder="Search listings..."
              bind:value={searchQuery}
              class="search-input"
            />
          </div>

          <!-- Category -->
          <div class="filter-group">
            <select bind:value={selectedCategory} class="filter-select">
              {#each categories as category}
                <option value={category}>{category}</option>
              {/each}
            </select>
          </div>

          <!-- Price Range -->
          <div class="filter-group price-filter">
            <label>
              <span>Min: ${minPrice}</span>
              <input
                type="range"
                min="0"
                max="10000"
                step="50"
                bind:value={minPrice}
                class="price-slider"
              />
            </label>
            <label>
              <span>Max: ${maxPrice}</span>
              <input
                type="range"
                min="0"
                max="10000"
                step="50"
                bind:value={maxPrice}
                class="price-slider"
              />
            </label>
          </div>

          <!-- Sort -->
          <div class="filter-group">
            <select bind:value={sortBy} class="filter-select">
              <option value="newest">Newest First</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
              <option value="trust">Highest Trust Score</option>
            </select>
          </div>
        </div>

        <!-- View Toggle -->
        <div class="view-toggle">
          <button
            class="view-btn"
            class:active={viewMode === 'grid'}
            on:click={() => (viewMode = 'grid')}
          >
            <span>⊞</span> Grid
          </button>
          <button
            class="view-btn"
            class:active={viewMode === 'list'}
            on:click={() => (viewMode = 'list')}
          >
            <span>☰</span> List
          </button>
        </div>
      </div>

      <!-- Results Count -->
      <div class="results-info">
        <p>{filteredListings.length} listings found</p>
      </div>

      <!-- Listings Grid/List -->
      {#if filteredListings.length === 0}
        <div class="empty-state">
          <span>🔍</span>
          <h2>No listings found</h2>
          <p>Try adjusting your filters or search query</p>
          <button class="btn btn-secondary" on:click={() => {
            searchQuery = '';
            selectedCategory = 'All Categories';
            minPrice = 0;
            maxPrice = 10000;
          }}>
            Clear Filters
          </button>
        </div>
      {:else}
        <div class={`listings-container ${viewMode}`}>
          {#each filteredListings as listing}
            <button
              class="listing-card"
              on:click={() => viewListing(listing.listing_hash || listing.id)}
              on:keydown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  viewListing(listing.listing_hash || listing.id);
                }
              }}
              aria-label="View listing for {listing.title}"
            >
              <div class="listing-image">
                {#if listing.photos_ipfs_cids && listing.photos_ipfs_cids[0]}
                  <img
                    src="https://ipfs.io/ipfs/{listing.photos_ipfs_cids[0]}"
                    alt={listing.title}
                  />
                {:else}
                  <div class="image-placeholder">📷</div>
                {/if}
                {#if listing.seller_trust_score}
                  <div class="trust-badge">{listing.seller_trust_score}% Trust</div>
                {/if}
              </div>

              <div class="listing-content">
                <h3 class="listing-title">{listing.title}</h3>
                <p class="listing-description">
                  {listing.description.slice(0, 100)}{listing.description.length > 100 ? '...' : ''}
                </p>

                <div class="listing-meta">
                  <span class="category-tag">{listing.category}</span>
                  <span class="date">{formatDate(listing.created_at)}</span>
                </div>

                <div class="listing-footer">
                  <span class="price">${listing.price.toFixed(2)}</span>
                  {#if listing.quantity_available}
                    <span class="quantity">{listing.quantity_available} available</span>
                  {/if}
                </div>
              </div>
            </button>
          {/each}
        </div>
      {/if}
    {/if}
  </div>
</div>

<style>
  .browse {
    min-height: 100vh;
    padding: 2rem 1rem;
    background: #f7fafc;
  }

  .container {
    max-width: 1400px;
    margin: 0 auto;
  }

  /* Header */
  .browse-header {
    margin-bottom: 2rem;
  }

  .browse-header h1 {
    font-size: 2.5rem;
    font-weight: 700;
    color: #2d3748;
    margin-bottom: 0.5rem;
  }

  .subtitle {
    font-size: 1.125rem;
    color: #718096;
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

  /* Controls Section */
  .controls-section {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 2rem;
    background: white;
    border-radius: 0.5rem;
    padding: 1.5rem;
    margin-bottom: 1.5rem;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    flex-wrap: wrap;
  }

  .filters {
    display: flex;
    gap: 1rem;
    flex: 1;
    flex-wrap: wrap;
  }

  .filter-group {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .search-input {
    padding: 0.75rem 1rem;
    border: 1px solid #e2e8f0;
    border-radius: 0.375rem;
    font-size: 1rem;
    min-width: 250px;
  }

  .search-input:focus {
    outline: none;
    border-color: #4299e1;
  }

  .filter-select {
    padding: 0.75rem 1rem;
    border: 1px solid #e2e8f0;
    border-radius: 0.375rem;
    font-size: 1rem;
    background: white;
    min-width: 180px;
  }

  .price-filter {
    min-width: 200px;
  }

  .price-filter label {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .price-filter span {
    font-size: 0.875rem;
    color: #4a5568;
  }

  .price-slider {
    width: 100%;
  }

  /* View Toggle */
  .view-toggle {
    display: flex;
    gap: 0.5rem;
  }

  .view-btn {
    padding: 0.75rem 1rem;
    border: 1px solid #e2e8f0;
    background: white;
    border-radius: 0.375rem;
    cursor: pointer;
    transition: all 0.2s;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .view-btn:hover {
    border-color: #4299e1;
  }

  .view-btn.active {
    background: #4299e1;
    border-color: #4299e1;
    color: white;
  }

  /* Results Info */
  .results-info {
    margin-bottom: 1.5rem;
  }

  .results-info p {
    color: #718096;
    font-size: 0.875rem;
  }

  /* Empty State */
  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 4rem 2rem;
    background: white;
    border-radius: 0.5rem;
    text-align: center;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  }

  .empty-state span {
    font-size: 4rem;
    margin-bottom: 1rem;
  }

  .empty-state h2 {
    font-size: 1.5rem;
    font-weight: 600;
    color: #2d3748;
    margin-bottom: 0.5rem;
  }

  .empty-state p {
    color: #718096;
    margin-bottom: 2rem;
  }

  /* Listings Container */
  .listings-container.grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 1.5rem;
  }

  .listings-container.list {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  /* Listing Card */
  .listing-card {
    background: white;
    border-radius: 0.5rem;
    overflow: hidden;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    cursor: pointer;
    transition: all 0.3s;
  }

  .listing-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }

  .listings-container.list .listing-card {
    display: flex;
    flex-direction: row;
  }

  .listing-image {
    position: relative;
    width: 100%;
    height: 200px;
    overflow: hidden;
  }

  .listings-container.list .listing-image {
    width: 250px;
    height: auto;
    flex-shrink: 0;
  }

  .listing-image img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .image-placeholder {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #f7fafc;
    font-size: 3rem;
  }

  .trust-badge {
    position: absolute;
    top: 0.75rem;
    right: 0.75rem;
    padding: 0.25rem 0.75rem;
    background: rgba(255, 255, 255, 0.95);
    border-radius: 0.25rem;
    font-size: 0.75rem;
    font-weight: 600;
    color: #38a169;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }

  /* Listing Content */
  .listing-content {
    padding: 1.25rem;
  }

  .listing-title {
    font-size: 1.125rem;
    font-weight: 600;
    color: #2d3748;
    margin-bottom: 0.5rem;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .listing-description {
    font-size: 0.875rem;
    color: #718096;
    margin-bottom: 1rem;
    line-height: 1.5;
  }

  .listing-meta {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
  }

  .category-tag {
    padding: 0.25rem 0.75rem;
    background: #edf2f7;
    color: #4a5568;
    border-radius: 0.25rem;
    font-size: 0.75rem;
    font-weight: 600;
  }

  .date {
    font-size: 0.75rem;
    color: #a0aec0;
  }

  .listing-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .price {
    font-size: 1.5rem;
    font-weight: 700;
    color: #38a169;
  }

  .quantity {
    font-size: 0.875rem;
    color: #718096;
  }

  /* Buttons */
  .btn {
    padding: 0.75rem 1.5rem;
    border: none;
    border-radius: 0.375rem;
    font-size: 1rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
  }

  .btn-primary {
    background: #4299e1;
    color: white;
  }

  .btn-primary:hover {
    background: #3182ce;
  }

  .btn-secondary {
    background: #e2e8f0;
    color: #2d3748;
  }

  .btn-secondary:hover {
    background: #cbd5e0;
  }

  /* Responsive */
  @media (max-width: 768px) {
    .controls-section {
      flex-direction: column;
    }

    .filters {
      flex-direction: column;
      width: 100%;
    }

    .filter-group,
    .search-input,
    .filter-select {
      width: 100%;
      min-width: 0;
    }

    .listings-container.list .listing-card {
      flex-direction: column;
    }

    .listings-container.list .listing-image {
      width: 100%;
      height: 200px;
    }
  }
</style>
