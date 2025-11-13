<script lang="ts">
  /**
   * Transaction Tracking Page
   *
   * View and manage all transactions with:
   * - Transaction list (purchases and sales)
   * - Status tracking (pending, shipped, delivered, completed)
   * - Transaction timeline
   * - Actions (confirm delivery, leave review, file dispute)
   * - Shipping information
   * - Listing details with IPFS photos
   *
   * This demonstrates:
   * - Transaction lifecycle management
   * - Status updates and tracking
   * - Buyer and seller actions
   * - Integration with reviews and disputes
   */

  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { getIpfsUrl } from '$lib/ipfs/ipfsClient';
  import TrustBadge from '$lib/components/TrustBadge.svelte';
  import { initHolochainClient } from '$lib/holochain';
  import { getMyPurchases, getMySales, confirmDelivery as confirmDeliveryZome, markAsShipped as markAsShippedZome } from '$lib/holochain/transactions';
  import { notifications } from '$lib/stores';
  import { currentUser } from '$lib/stores/auth';
  import type { Transaction, TransactionStatus } from '$types';

  // Extended transaction type with UI-specific fields
  interface TransactionWithUI extends Transaction {
    type: 'purchase' | 'sale';
    other_party_name?: string;
    other_party_trust_score?: number;
    can_confirm_delivery?: boolean;
    can_leave_review?: boolean;
    can_file_dispute?: boolean;
    can_mark_shipped?: boolean;
    can_cancel?: boolean;
  }

  // Transactions state
  let transactions: TransactionWithUI[] = [];
  let loading = true;
  let error = '';

  // Filter state
  let filterType: 'all' | 'purchases' | 'sales' = 'all';
  let filterStatus: TransactionStatus | 'all' = 'all';

  // Selected transaction for detail view
  let selectedTransaction: TransactionWithUI | null = null;

  // Action state
  let actionInProgress = false;
  let actionError = '';
  let actionSuccess = '';

  /**
   * Load transactions from Holochain
   */
  onMount(async () => {
    loading = true;
    error = '';

    try {
      // Initialize Holochain client
      const client = await initHolochainClient();

      // Fetch purchases and sales in parallel
      const [purchases, sales] = await Promise.all([
        getMyPurchases(client),
        getMySales(client),
      ]);

      // TODO: Enhance with listing details and seller/buyer info
      // For now, we'll use basic transaction data
      const purchasesWithType: TransactionWithUI[] = purchases.map((t) => ({
        ...t,
        type: 'purchase' as const,
        can_confirm_delivery: t.status === 'shipped',
        can_leave_review: t.status === 'delivered' || t.status === 'completed',
        can_file_dispute: t.status === 'shipped' || t.status === 'delivered',
      }));

      const salesWithType: TransactionWithUI[] = sales.map((t) => ({
        ...t,
        type: 'sale' as const,
        can_mark_shipped: t.status === 'pending',
        can_cancel: t.status === 'pending',
      }));

      // Combine and sort by creation date (newest first)
      transactions = [...purchasesWithType, ...salesWithType].sort(
        (a, b) => b.created_at - a.created_at
      );

      notifications.success('Transactions loaded', `Found ${transactions.length} transactions`);
    } catch (e: any) {
      error = e.message || 'Failed to load transactions';
      notifications.error('Failed to load transactions', error);
      console.error('Error loading transactions:', e);
    } finally {
      loading = false;
    }
  });

  /**
   * Filter transactions
   */
  $: filteredTransactions = transactions.filter((t) => {
    if (filterType !== 'all' && t.type !== filterType.slice(0, -1)) return false;
    if (filterStatus !== 'all' && t.status !== filterStatus) return false;
    return true;
  });

  /**
   * Select transaction for detail view
   */
  function selectTransaction(transaction: TransactionWithUI) {
    selectedTransaction = transaction;
    actionError = '';
    actionSuccess = '';
  }

  /**
   * Confirm delivery (buyer action)
   */
  async function confirmDelivery() {
    if (!selectedTransaction) return;

    actionInProgress = true;
    actionError = '';
    actionSuccess = '';

    try {
      // Initialize Holochain client
      const client = await initHolochainClient();

      // Confirm delivery via zome call
      const updatedTransaction = await confirmDeliveryZome(client, selectedTransaction.id);

      // Update local state
      selectedTransaction = {
        ...selectedTransaction,
        ...updatedTransaction,
        can_confirm_delivery: false,
        can_leave_review: true,
      };

      // Update transactions list
      transactions = transactions.map((t) =>
        t.id === selectedTransaction?.id ? selectedTransaction : t
      );

      actionSuccess = 'Delivery confirmed successfully!';
      notifications.success('Delivery confirmed', 'You can now leave a review');
    } catch (e: any) {
      actionError = e.message || 'Failed to confirm delivery';
      notifications.error('Confirmation failed', actionError);
      console.error('Error confirming delivery:', e);
    } finally {
      actionInProgress = false;
    }
  }

  /**
   * Mark as shipped (seller action)
   */
  async function markAsShipped() {
    if (!selectedTransaction) return;

    const trackingNumber = prompt('Enter tracking number:');
    if (!trackingNumber || !trackingNumber.trim()) {
      notifications.warning('Cancelled', 'Tracking number is required');
      return;
    }

    actionInProgress = true;
    actionError = '';
    actionSuccess = '';

    try {
      // Initialize Holochain client
      const client = await initHolochainClient();

      // Mark as shipped via zome call
      const updatedTransaction = await markAsShippedZome(
        client,
        selectedTransaction.id,
        trackingNumber.trim()
      );

      // Update local state
      selectedTransaction = {
        ...selectedTransaction,
        ...updatedTransaction,
        can_mark_shipped: false,
      };

      // Update transactions list
      transactions = transactions.map((t) =>
        t.id === selectedTransaction?.id ? selectedTransaction : t
      );

      actionSuccess = 'Marked as shipped successfully!';
      notifications.success('Shipped', `Tracking: ${trackingNumber}`);
    } catch (e: any) {
      actionError = e.message || 'Failed to mark as shipped';
      notifications.error('Shipping update failed', actionError);
      console.error('Error marking as shipped:', e);
    } finally {
      actionInProgress = false;
    }
  }

  /**
   * Navigate to leave review
   */
  function leaveReview() {
    if (!selectedTransaction) return;
    goto(`/review/${selectedTransaction.id}`);
  }

  /**
   * Navigate to file dispute
   */
  function fileDispute() {
    if (!selectedTransaction) return;
    goto(`/dispute/${selectedTransaction.id}`);
  }

  /**
   * Format date
   */
  function formatDate(timestamp: number): string {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  }

  /**
   * Format date with time
   */
  function formatDateTime(timestamp: number): string {
    const date = new Date(timestamp);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  }

  /**
   * Get status badge class
   */
  function getStatusClass(status: string): string {
    const statusMap: Record<string, string> = {
      pending: 'status-warning',
      shipped: 'status-info',
      delivered: 'status-success',
      completed: 'status-success',
      cancelled: 'status-error',
      disputed: 'status-error',
    };
    return statusMap[status] || 'status-default';
  }

  /**
   * Get status display name
   */
  function getStatusName(status: string): string {
    return status.charAt(0).toUpperCase() + status.slice(1);
  }
</script>

<div class="transactions-page">
  <div class="container">
    {#if loading}
      <!-- Loading State -->
      <div class="loading-state">
        <div class="spinner"></div>
        <p>Loading transactions...</p>
      </div>
    {:else if error}
      <!-- Error State -->
      <div class="error-state">
        <span class="error-icon">⚠️</span>
        <p>{error}</p>
      </div>
    {:else}
      <!-- Page Header -->
      <div class="page-header">
        <h1>My Transactions</h1>
        <p>Track your purchases and sales</p>
      </div>

      <!-- Filters -->
      <div class="filters-bar">
        <div class="filter-group">
          <label for="filter-type">Type:</label>
          <select id="filter-type" bind:value={filterType}>
            <option value="all">All Transactions</option>
            <option value="purchases">Purchases</option>
            <option value="sales">Sales</option>
          </select>
        </div>

        <div class="filter-group">
          <label for="filter-status">Status:</label>
          <select id="filter-status" bind:value={filterStatus}>
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="shipped">Shipped</option>
            <option value="delivered">Delivered</option>
            <option value="completed">Completed</option>
          </select>
        </div>

        <div class="results-count">
          {filteredTransactions.length} transaction{filteredTransactions.length !== 1
            ? 's'
            : ''}
        </div>
      </div>

      <!-- Transactions List -->
      {#if filteredTransactions.length === 0}
        <div class="empty-state">
          <span>📦</span>
          <p>No transactions found</p>
          <a href="/browse" class="btn btn-primary">Browse Marketplace</a>
        </div>
      {:else}
        <div class="transactions-list">
          {#each filteredTransactions as transaction}
            <button
              class="transaction-card"
              class:selected={selectedTransaction?.transaction_hash ===
                transaction.transaction_hash}
              on:click={() => selectTransaction(transaction)}
              on:keydown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  selectTransaction(transaction);
                }
              }}
              aria-label="View transaction {transaction.id.slice(0, 8)}"
            >
              <!-- Transaction Header -->
              <div class="transaction-header">
                <div class="transaction-type">
                  {#if transaction.type === 'purchase'}
                    <span class="type-badge type-purchase">Purchase</span>
                  {:else}
                    <span class="type-badge type-sale">Sale</span>
                  {/if}
                </div>

                <span class={`status-badge ${getStatusClass(transaction.status)}`}>
                  {getStatusName(transaction.status)}
                </span>
              </div>

              <!-- Transaction Content -->
              <div class="transaction-content">
                <div class="transaction-thumbnail">
                  {#if transaction.listing_photo_cid}
                    <img
                      src={getIpfsUrl(transaction.listing_photo_cid)}
                      alt={transaction.listing_title}
                    />
                  {:else}
                    <div class="no-image">📷</div>
                  {/if}
                </div>

                <div class="transaction-info">
                  <h3>{transaction.listing_title}</h3>
                  <p class="transaction-date">{formatDate(transaction.created_at)}</p>

                  {#if transaction.type === 'purchase'}
                    <p class="transaction-party">
                      Seller: <strong>{transaction.seller_name}</strong>
                    </p>
                  {:else}
                    <p class="transaction-party">
                      Buyer: <strong>{transaction.buyer_name}</strong>
                    </p>
                  {/if}

                  <p class="transaction-price">${transaction.total_price.toFixed(2)}</p>
                </div>
              </div>
            </button>
          {/each}
        </div>
      {/if}
    {/if}

    <!-- Transaction Detail Modal -->
    {#if selectedTransaction}
      <div
        class="transaction-modal"
        on:click={() => (selectedTransaction = null)}
        on:keydown={(e) => {
          if (e.key === 'Escape') {
            selectedTransaction = null;
          }
        }}
        role="presentation"
      >
        <div
          class="modal-content"
          on:click|stopPropagation
          role="dialog"
          aria-modal="true"
          aria-labelledby="transaction-modal-title"
        >
          <button class="modal-close" on:click={() => (selectedTransaction = null)}>
            ✕
          </button>

          <h2 id="transaction-modal-title">Transaction Details</h2>

          <!-- Transaction Overview -->
          <div class="modal-section">
            <div class="section-header">
              <h3>{selectedTransaction.listing_title}</h3>
              <span class={`status-badge ${getStatusClass(selectedTransaction.status)}`}>
                {getStatusName(selectedTransaction.status)}
              </span>
            </div>

            {#if selectedTransaction.listing_photo_cid}
              <img
                src={getIpfsUrl(selectedTransaction.listing_photo_cid)}
                alt={selectedTransaction.listing_title}
                class="detail-image"
              />
            {/if}

            <div class="transaction-details">
              <div class="detail-row">
                <span class="detail-label">Transaction ID:</span>
                <code class="detail-value">
                  {selectedTransaction.id.substring(0, 30)}...
                </code>
              </div>

              <div class="detail-row">
                <span class="detail-label">Type:</span>
                <span class="detail-value">
                  {selectedTransaction.type === 'purchase' ? 'Purchase' : 'Sale'}
                </span>
              </div>

              <div class="detail-row">
                <span class="detail-label">Total Price:</span>
                <span class="detail-value">${selectedTransaction.total_price.toFixed(2)}</span>
              </div>

              <div class="detail-row">
                <span class="detail-label">Quantity:</span>
                <span class="detail-value">{selectedTransaction.quantity}</span>
              </div>

              {#if selectedTransaction.type === 'purchase'}
                <div class="detail-row">
                  <span class="detail-label">Seller:</span>
                  <div class="detail-value">
                    <span>{selectedTransaction.seller_name}</span>
                    <TrustBadge
                      trustScore={selectedTransaction.seller_trust_score}
                      size="small"
                      showLabel={false}
                    />
                  </div>
                </div>
              {:else}
                <div class="detail-row">
                  <span class="detail-label">Buyer:</span>
                  <div class="detail-value">
                    <span>{selectedTransaction.buyer_name}</span>
                    {#if selectedTransaction.buyer_trust_score}
                      <TrustBadge
                        trustScore={selectedTransaction.buyer_trust_score}
                        size="small"
                        showLabel={false}
                      />
                    {/if}
                  </div>
                </div>
              {/if}
            </div>
          </div>

          <!-- Timeline -->
          <div class="modal-section">
            <h3>Transaction Timeline</h3>

            <div class="timeline">
              <div class="timeline-item completed">
                <div class="timeline-icon">✓</div>
                <div class="timeline-content">
                  <p class="timeline-title">Order Placed</p>
                  <p class="timeline-date">{formatDateTime(selectedTransaction.created_at)}</p>
                </div>
              </div>

              {#if selectedTransaction.shipped_at}
                <div class="timeline-item completed">
                  <div class="timeline-icon">✓</div>
                  <div class="timeline-content">
                    <p class="timeline-title">Shipped</p>
                    <p class="timeline-date">
                      {formatDateTime(selectedTransaction.shipped_at)}
                    </p>
                    {#if selectedTransaction.tracking_number}
                      <p class="tracking-number">
                        Tracking: {selectedTransaction.tracking_number}
                      </p>
                    {/if}
                  </div>
                </div>
              {/if}

              {#if selectedTransaction.delivered_at}
                <div class="timeline-item completed">
                  <div class="timeline-icon">✓</div>
                  <div class="timeline-content">
                    <p class="timeline-title">Delivered</p>
                    <p class="timeline-date">
                      {formatDateTime(selectedTransaction.delivered_at)}
                    </p>
                  </div>
                </div>
              {/if}

              {#if selectedTransaction.completed_at}
                <div class="timeline-item completed">
                  <div class="timeline-icon">✓</div>
                  <div class="timeline-content">
                    <p class="timeline-title">Completed</p>
                    <p class="timeline-date">
                      {formatDateTime(selectedTransaction.completed_at)}
                    </p>
                  </div>
                </div>
              {/if}
            </div>
          </div>

          <!-- Actions -->
          <div class="modal-section">
            {#if actionError}
              <div class="alert alert-error">
                <span class="alert-icon">⚠️</span>
                {actionError}
              </div>
            {/if}

            {#if actionSuccess}
              <div class="alert alert-success">
                <span class="alert-icon">✓</span>
                {actionSuccess}
              </div>
            {/if}

            <div class="action-buttons">
              {#if selectedTransaction.can_confirm_delivery}
                <button
                  class="btn btn-success"
                  on:click={confirmDelivery}
                  disabled={actionInProgress}
                >
                  ✓ Confirm Delivery
                </button>
              {/if}

              {#if selectedTransaction.can_leave_review}
                <a href={`/review/${selectedTransaction.id}`} class="btn btn-primary">
                  ⭐ Leave Review
                </a>
              {/if}

              {#if selectedTransaction.can_file_dispute}
                <a
                  href={`/dispute/${selectedTransaction.id}`}
                  class="btn btn-danger"
                >
                  ⚠️ File Dispute
                </a>
              {/if}

              {#if selectedTransaction.can_mark_shipped}
                <button
                  class="btn btn-primary"
                  on:click={markAsShipped}
                  disabled={actionInProgress}
                >
                  📦 Mark as Shipped
                </button>
              {/if}

              {#if selectedTransaction.can_cancel}
                <button class="btn btn-secondary" disabled={actionInProgress}>
                  Cancel Order
                </button>
              {/if}
            </div>
          </div>
        </div>
      </div>
    {/if}
  </div>
</div>

<style>
  .transactions-page {
    min-height: 100vh;
    padding: 2rem 1rem;
    background: #f7fafc;
  }

  .container {
    max-width: 1200px;
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
    align-items: center;
    justify-content: center;
    gap: 1rem;
    padding: 3rem;
    background: white;
    border-radius: 0.5rem;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    color: #742a2a;
  }

  .error-icon {
    font-size: 3rem;
  }

  /* Page Header */
  .page-header {
    margin-bottom: 2rem;
  }

  .page-header h1 {
    font-size: 2.5rem;
    font-weight: 700;
    color: #2d3748;
    margin-bottom: 0.5rem;
  }

  .page-header p {
    font-size: 1.125rem;
    color: #718096;
  }

  /* Filters Bar */
  .filters-bar {
    display: flex;
    align-items: center;
    gap: 1.5rem;
    background: white;
    padding: 1.5rem;
    border-radius: 0.5rem;
    margin-bottom: 2rem;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  }

  .filter-group {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .filter-group label {
    font-size: 0.875rem;
    font-weight: 500;
    color: #4a5568;
  }

  .filter-group select {
    padding: 0.5rem 1rem;
    border: 1px solid #cbd5e0;
    border-radius: 0.375rem;
    font-size: 0.875rem;
  }

  .results-count {
    margin-left: auto;
    font-size: 0.875rem;
    color: #718096;
  }

  /* Empty State */
  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 300px;
    background: white;
    border-radius: 0.5rem;
    padding: 3rem;
    text-align: center;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  }

  .empty-state span {
    font-size: 4rem;
    margin-bottom: 1rem;
  }

  .empty-state p {
    color: #718096;
    font-size: 1.125rem;
    margin-bottom: 2rem;
  }

  /* Transactions List */
  .transactions-list {
    display: grid;
    gap: 1rem;
  }

  .transaction-card {
    background: white;
    border: 2px solid #e2e8f0;
    border-radius: 0.5rem;
    padding: 1.5rem;
    cursor: pointer;
    transition: all 0.2s;
  }

  .transaction-card:hover {
    border-color: #4299e1;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }

  .transaction-card.selected {
    border-color: #4299e1;
    background: #ebf8ff;
  }

  .transaction-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
  }

  .type-badge {
    padding: 0.25rem 0.75rem;
    border-radius: 0.25rem;
    font-size: 0.75rem;
    font-weight: 600;
    text-transform: uppercase;
  }

  .type-purchase {
    background: #e6f2ff;
    color: #2c5282;
  }

  .type-sale {
    background: #f0fff4;
    color: #276749;
  }

  .status-badge {
    padding: 0.25rem 0.75rem;
    border-radius: 0.25rem;
    font-size: 0.75rem;
    font-weight: 600;
    text-transform: uppercase;
  }

  .status-warning {
    background: #feebc8;
    color: #7c2d12;
  }

  .status-info {
    background: #bee3f8;
    color: #2c5282;
  }

  .status-success {
    background: #c6f6d5;
    color: #22543d;
  }

  .status-error {
    background: #fed7d7;
    color: #742a2a;
  }

  .transaction-content {
    display: grid;
    grid-template-columns: 80px 1fr;
    gap: 1rem;
  }

  .transaction-thumbnail {
    width: 80px;
    height: 80px;
    border-radius: 0.375rem;
    overflow: hidden;
    background: #f7fafc;
  }

  .transaction-thumbnail img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .no-image {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #cbd5e0;
    font-size: 2rem;
  }

  .transaction-info h3 {
    font-size: 1.125rem;
    font-weight: 600;
    color: #2d3748;
    margin-bottom: 0.5rem;
  }

  .transaction-date {
    font-size: 0.875rem;
    color: #a0aec0;
    margin-bottom: 0.5rem;
  }

  .transaction-party {
    font-size: 0.875rem;
    color: #4a5568;
    margin-bottom: 0.5rem;
  }

  .transaction-price {
    font-size: 1.25rem;
    font-weight: 700;
    color: #38a169;
  }

  /* Transaction Modal */
  .transaction-modal {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    padding: 1rem;
  }

  .modal-content {
    background: white;
    border-radius: 0.5rem;
    padding: 2rem;
    max-width: 700px;
    width: 100%;
    max-height: 90vh;
    overflow-y: auto;
    position: relative;
  }

  .modal-close {
    position: absolute;
    top: 1rem;
    right: 1rem;
    width: 40px;
    height: 40px;
    border: none;
    background: #e2e8f0;
    border-radius: 50%;
    font-size: 1.5rem;
    cursor: pointer;
    transition: all 0.2s;
  }

  .modal-close:hover {
    background: #cbd5e0;
  }

  .modal-content h2 {
    font-size: 1.5rem;
    font-weight: 700;
    color: #2d3748;
    margin-bottom: 1.5rem;
  }

  .modal-section {
    margin-bottom: 2rem;
  }

  .modal-section h3 {
    font-size: 1.125rem;
    font-weight: 600;
    color: #2d3748;
    margin-bottom: 1rem;
  }

  .section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
  }

  .detail-image {
    width: 100%;
    max-height: 300px;
    object-fit: cover;
    border-radius: 0.375rem;
    margin-bottom: 1.5rem;
  }

  .transaction-details {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .detail-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.75rem;
    background: #f7fafc;
    border-radius: 0.375rem;
  }

  .detail-label {
    font-size: 0.875rem;
    color: #718096;
  }

  .detail-value {
    font-size: 0.875rem;
    font-weight: 600;
    color: #2d3748;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  code.detail-value {
    font-family: monospace;
    font-size: 0.75rem;
  }

  /* Timeline */
  .timeline {
    position: relative;
    padding-left: 2.5rem;
  }

  .timeline::before {
    content: '';
    position: absolute;
    left: 0.75rem;
    top: 0;
    bottom: 0;
    width: 2px;
    background: #e2e8f0;
  }

  .timeline-item {
    position: relative;
    padding-bottom: 1.5rem;
  }

  .timeline-item:last-child {
    padding-bottom: 0;
  }

  .timeline-icon {
    position: absolute;
    left: -2rem;
    width: 32px;
    height: 32px;
    border-radius: 50%;
    background: #e2e8f0;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.875rem;
    color: #718096;
  }

  .timeline-item.completed .timeline-icon {
    background: #38a169;
    color: white;
  }

  .timeline-title {
    font-weight: 600;
    color: #2d3748;
    margin-bottom: 0.25rem;
  }

  .timeline-date {
    font-size: 0.875rem;
    color: #718096;
  }

  .tracking-number {
    font-size: 0.875rem;
    color: #4a5568;
    font-family: monospace;
    margin-top: 0.25rem;
  }

  /* Action Buttons */
  .action-buttons {
    display: flex;
    flex-wrap: wrap;
    gap: 0.75rem;
  }

  /* Buttons */
  .btn {
    padding: 0.75rem 1.5rem;
    border: none;
    border-radius: 0.375rem;
    font-size: 0.875rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
    text-decoration: none;
    display: inline-block;
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

  .btn-secondary:hover:not(:disabled) {
    background: #cbd5e0;
  }

  .btn-success {
    background: #38a169;
    color: white;
  }

  .btn-success:hover:not(:disabled) {
    background: #2f855a;
  }

  .btn-danger {
    background: #e53e3e;
    color: white;
  }

  .btn-danger:hover:not(:disabled) {
    background: #c53030;
  }

  .btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  /* Alerts */
  .alert {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 1rem;
    border-radius: 0.375rem;
    margin-bottom: 1rem;
  }

  .alert-icon {
    font-size: 1.25rem;
  }

  .alert-error {
    background: #fed7d7;
    border: 1px solid #fc8181;
    color: #742a2a;
  }

  .alert-success {
    background: #c6f6d5;
    border: 1px solid #68d391;
    color: #22543d;
  }
</style>
