<script lang="ts">
  /**
   * User Dashboard
   *
   * Central hub showing:
   * - User profile with trust score
   * - Activity statistics
   * - Recent transactions
   * - Active listings
   * - Quick actions
   */

  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { initHolochainClient } from '$lib/holochain';
  import { getMyProfile } from '$lib/holochain/users';
  import { getMyListings } from '$lib/holochain/listings';
  import { getMyPurchases, getMySales } from '$lib/holochain/transactions';
  import { notifications } from '$lib/stores';
  import { handleError } from '$lib/utils/errors';
  import { formatRelativeTime } from '$lib/utils/format';
  import ErrorState from '$lib/components/ErrorState.svelte';
  import EmptyState from '$lib/components/EmptyState.svelte';
  import LoadingState from '$lib/components/LoadingState.svelte';
  import StatusBadge from '$lib/components/StatusBadge.svelte';
  import Button from '$lib/components/Button.svelte';
  import ListingCard from '$lib/components/ListingCard.svelte';
  import TransactionCard from '$lib/components/TransactionCard.svelte';
  import type { UserProfile, Listing, Transaction } from '$types';

  // State
  let loading = true;
  let error = '';
  let profile: UserProfile | null = null;
  let activeListings: Listing[] = [];
  let recentTransactions: Transaction[] = [];

  /**
   * Load dashboard data
   */
  onMount(async () => {
    loading = true;
    error = '';

    try {
      const client = await initHolochainClient();

      // Fetch all data in parallel
      const [userProfile, listings, purchases, sales] = await Promise.all([
        getMyProfile(client),
        getMyListings(client),
        getMyPurchases(client),
        getMySales(client),
      ]);

      profile = userProfile;
      activeListings = listings.filter((l) => l.status === 'active').slice(0, 5);

      // Combine and sort transactions
      const allTransactions = [...purchases, ...sales].sort(
        (a, b) => b.created_at - a.created_at
      );
      recentTransactions = allTransactions.slice(0, 5);

      notifications.success('Dashboard Loaded', `Welcome back, ${profile.username}!`);
    } catch (e: unknown) {
      error = handleError(e, 'Dashboard Load');
      notifications.error('Loading Failed', error);
    } finally {
      loading = false;
    }
  });

  /**
   * Format trust score
   */
  function formatTrustScore(score: number): string {
    // Handle both 0-1 and 0-100 formats
    const percentage = score > 1 ? score : score * 100;
    return `${percentage.toFixed(1)}%`;
  }
</script>

<div class="dashboard">
  <div class="container">
    {#if loading}
      <LoadingState message="Loading dashboard..." />
    {:else if error}
      <!-- Error State -->
      <ErrorState
        title="Failed to Load Dashboard"
        message={error}
        on:retry={() => window.location.reload()}
      />
    {:else if profile}
      <!-- Dashboard Content -->
      <div class="dashboard-header">
        <div class="profile-section">
          <div class="avatar">
            {#if profile.avatar_cid}
              <img
                src="https://ipfs.io/ipfs/{profile.avatar_cid}"
                alt="{profile.username} avatar"
              />
            {:else}
              <div class="avatar-placeholder">
                {profile.username.charAt(0).toUpperCase()}
              </div>
            {/if}
          </div>
          <div class="profile-info">
            <h1>{profile.username}</h1>
            <p class="member-since">Member since {formatRelativeTime(profile.member_since)}</p>
            <div class="trust-score">
              <span class="trust-label">Trust Score:</span>
              <span class="trust-value">{formatTrustScore(profile.trust_score)}</span>
              {#if profile.is_verified}
                <span class="verified-badge">✓ Verified</span>
              {/if}
            </div>
          </div>
        </div>

        <div class="quick-actions">
          <Button variant="primary" on:click={() => goto('/create-listing')}>
            + Create Listing
          </Button>
          <Button variant="secondary" on:click={() => goto('/browse')}>
            Browse Marketplace
          </Button>
        </div>
      </div>

      <!-- Stats Grid -->
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-icon">📦</div>
          <div class="stat-value">{profile.total_listings}</div>
          <div class="stat-label">Total Listings</div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">💰</div>
          <div class="stat-value">{profile.total_sales}</div>
          <div class="stat-label">Sales Completed</div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">🛒</div>
          <div class="stat-value">{profile.total_purchases}</div>
          <div class="stat-label">Purchases Made</div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">⭐</div>
          <div class="stat-value">{profile.average_rating.toFixed(1)}</div>
          <div class="stat-label">Avg Rating ({profile.total_reviews} reviews)</div>
        </div>
      </div>

      <!-- Main Content Grid -->
      <div class="content-grid">
        <!-- Recent Transactions -->
        <div class="card">
          <div class="card-header">
            <h2>Recent Transactions</h2>
            <Button variant="link" size="sm" on:click={() => goto('/transactions')}>
              View All →
            </Button>
          </div>
          {#if recentTransactions.length === 0}
            <EmptyState
              icon="📭"
              title="No transactions yet"
              message="Start shopping to see your purchase and sales history here"
              showAction={true}
              actionText="Start Shopping"
              actionVariant="secondary"
              compact={true}
              on:action={() => goto('/browse')}
            />
          {:else}
            <div class="transaction-list">
              {#each recentTransactions as tx}
                <TransactionCard
                  transaction={tx}
                  variant="compact"
                  showActions={false}
                  on:click={() => goto(`/transactions#${tx.id}`)}
                />
              {/each}
            </div>
          {/if}
        </div>

        <!-- Active Listings -->
        <div class="card">
          <div class="card-header">
            <h2>Active Listings</h2>
            <Button variant="link" size="sm" on:click={() => goto('/my-listings')}>
              Manage All →
            </Button>
          </div>
          {#if activeListings.length === 0}
            <EmptyState
              icon="📦"
              title="No active listings"
              message="Create your first listing to start selling"
              showAction={true}
              actionText="Create Listing"
              compact={true}
              on:action={() => goto('/create-listing')}
            />
          {:else}
            <div class="listing-list">
              {#each activeListings as listing}
                <ListingCard
                  {listing}
                  variant="compact"
                  showActions={false}
                  on:click={() => goto(`/listing/${listing.listing_hash}`)}
                />
              {/each}
            </div>
          {/if}
        </div>
      </div>
    {/if}
  </div>
</div>

<style>
  .dashboard {
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

  /* Dashboard Header */
  .dashboard-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    background: white;
    border-radius: 0.5rem;
    padding: 2rem;
    margin-bottom: 2rem;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    gap: 2rem;
    flex-wrap: wrap;
  }

  .profile-section {
    display: flex;
    gap: 1.5rem;
    align-items: center;
  }

  .avatar {
    width: 80px;
    height: 80px;
    border-radius: 50%;
    overflow: hidden;
  }

  .avatar img {
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
    font-size: 2rem;
    font-weight: 700;
  }

  .profile-info h1 {
    font-size: 2rem;
    font-weight: 700;
    color: #2d3748;
    margin-bottom: 0.25rem;
  }

  .member-since {
    color: #718096;
    font-size: 0.875rem;
    margin-bottom: 0.5rem;
  }

  .trust-score {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .trust-label {
    color: #4a5568;
    font-size: 0.875rem;
  }

  .trust-value {
    font-size: 1.25rem;
    font-weight: 700;
    color: #38a169;
  }

  .verified-badge {
    padding: 0.25rem 0.5rem;
    background: #c6f6d5;
    color: #22543d;
    border-radius: 0.25rem;
    font-size: 0.75rem;
    font-weight: 600;
  }

  .quick-actions {
    display: flex;
    gap: 1rem;
  }

  /* Stats Grid */
  .stats-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 1.5rem;
    margin-bottom: 2rem;
  }

  .stat-card {
    background: white;
    border-radius: 0.5rem;
    padding: 1.5rem;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    text-align: center;
  }

  .stat-icon {
    font-size: 2rem;
    margin-bottom: 0.5rem;
  }

  .stat-value {
    font-size: 2rem;
    font-weight: 700;
    color: #2d3748;
    margin-bottom: 0.25rem;
  }

  .stat-label {
    color: #718096;
    font-size: 0.875rem;
  }

  /* Content Grid */
  .content-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(500px, 1fr));
    gap: 2rem;
  }

  .card {
    background: white;
    border-radius: 0.5rem;
    padding: 1.5rem;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  }

  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1.5rem;
  }

  .card-header h2 {
    font-size: 1.25rem;
    font-weight: 600;
    color: #2d3748;
  }

  /* Empty State */
  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 3rem 1rem;
    text-align: center;
  }

  .empty-state span {
    font-size: 3rem;
    margin-bottom: 1rem;
  }

  .empty-state p {
    color: #718096;
    margin-bottom: 1.5rem;
  }

  /* Transaction List */
  .transaction-list {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  /* Listing List */
  .listing-list {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  /* Responsive */
  @media (max-width: 768px) {
    .content-grid {
      grid-template-columns: 1fr;
    }

    .dashboard-header {
      flex-direction: column;
      align-items: flex-start;
    }

    .quick-actions {
      width: 100%;
      flex-direction: column;
    }

    .quick-actions .btn {
      width: 100%;
    }
  }
</style>
