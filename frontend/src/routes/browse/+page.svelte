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
  import { debounce, formatTimestamp } from '$lib/utils';
  import { LISTING_CATEGORIES } from '$lib/config/constants';
  import ErrorState from '$lib/components/ErrorState.svelte';
  import EmptyState from '$lib/components/EmptyState.svelte';
  import LoadingState from '$lib/components/LoadingState.svelte';
  import Button from '$lib/components/Button.svelte';
  import ListingCard from '$lib/components/ListingCard.svelte';
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
    ...LISTING_CATEGORIES,
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
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load listings';
      error = errorMessage;
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
   * Debounced filter application for search (300ms delay)
   */
  const debouncedApplyFilters = debounce(applyFilters, 300);

  /**
   * Reactive filter application
   * Search query is debounced to improve performance
   * Other filters apply immediately
   */
  $: if (allListings.length > 0) {
    applyFilters();
  }

  // Debounce search query changes
  $: if (searchQuery !== undefined) {
    debouncedApplyFilters();
  }

  // Apply filters immediately for non-search changes
  $: selectedCategory, minPrice, maxPrice, sortBy, applyFilters();

  /**
   * View listing details
   */
  function viewListing(listing_hash: string) {
    goto(`/listing/${listing_hash}`);
  }

</script>

<div class="browse">
  <div class="container">
    <div class="browse-header">
      <h1>Browse Marketplace</h1>
      <p class="subtitle">Discover unique items from trusted sellers</p>
    </div>

    {#if loading}
      <LoadingState message="Loading listings..." />
    {:else if error}
      <!-- Error State -->
      <ErrorState
        title="Failed to Load Listings"
        message={error}
        on:retry={loadListings}
      />
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
              aria-label="Search listings by title, description, or category"
            />
          </div>

          <!-- Category -->
          <div class="filter-group">
            <select
              bind:value={selectedCategory}
              class="filter-select"
              aria-label="Filter by category"
            >
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
                aria-label="Minimum price filter"
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
                aria-label="Maximum price filter"
              />
            </label>
          </div>

          <!-- Sort -->
          <div class="filter-group">
            <select
              bind:value={sortBy}
              class="filter-select"
              aria-label="Sort listings"
            >
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
            aria-label="Switch to grid view"
            aria-pressed={viewMode === 'grid'}
          >
            <span aria-hidden="true">⊞</span> Grid
          </button>
          <button
            class="view-btn"
            class:active={viewMode === 'list'}
            on:click={() => (viewMode = 'list')}
            aria-label="Switch to list view"
            aria-pressed={viewMode === 'list'}
          >
            <span aria-hidden="true">☰</span> List
          </button>
        </div>
      </div>

      <!-- Results Count -->
      <div class="results-info">
        <p>{filteredListings.length} listings found</p>
      </div>

      <!-- Listings Grid/List -->
      {#if filteredListings.length === 0}
        <EmptyState
          icon="🔍"
          title="No listings found"
          message="Try adjusting your filters or search query"
          showAction={true}
          actionText="Clear Filters"
          actionVariant="secondary"
          on:action={() => {
            searchQuery = '';
            selectedCategory = 'All Categories';
            minPrice = 0;
            maxPrice = 10000;
          }}
        />
      {:else}
        <div class={`listings-container ${viewMode}`}>
          {#each filteredListings as listing}
            <ListingCard
              {listing}
              variant="full"
              on:click={() => viewListing(listing.listing_hash || listing.id)}
              on:viewDetails={() => viewListing(listing.listing_hash || listing.id)}
            />
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
  }
</style>
