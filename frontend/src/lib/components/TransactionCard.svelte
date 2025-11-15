<script lang="ts">
  /**
   * TransactionCard Component
   *
   * Specialized card for displaying transaction history items.
   * Eliminates duplicate transaction display logic across transactions and dashboard pages.
   *
   * @component
   * @example
   * ```svelte
   * <TransactionCard
   *   transaction={tx}
   *   variant="full"
   *   userRole="buyer"
   *   on:viewDetails={() => goto(`/transactions#${tx.id}`)}
   * />
   * ```
   */

  import { createEventDispatcher } from 'svelte';
  import { getIpfsUrl } from '$lib/ipfs/ipfsClient';
  import { formatPrice } from '$lib/utils/format';
  import { formatRelativeTime } from '$lib/utils/format';
  import StatusBadge from './StatusBadge.svelte';
  import Button from './Button.svelte';
  import type { Transaction } from '$types';

  const dispatch = createEventDispatcher<{
    click: MouseEvent;
    viewDetails: void;
    action: string; // 'mark-shipped', 'confirm-delivery', etc.
  }>();

  /**
   * The transaction data to display
   */
  export let transaction: Transaction;

  /**
   * Display variant
   * - full: Complete transaction card with all details
   * - compact: Smaller card for dashboard widgets
   */
  export let variant: 'full' | 'compact' = 'full';

  /**
   * User's role in this transaction
   * - buyer: Show buyer-specific actions and info
   * - seller: Show seller-specific actions and info
   */
  export let userRole: 'buyer' | 'seller' = 'buyer';

  /**
   * Whether to show action buttons based on transaction status
   */
  export let showActions: boolean = true;

  /**
   * Whether the card is clickable (navigates to transaction detail)
   */
  export let clickable: boolean = true;

  /**
   * Custom CSS classes
   */
  let className: string = '';
  export { className as class };

  // Computed values
  $: listingPhotoUrl = transaction.listing_photo
    ? getIpfsUrl(transaction.listing_photo)
    : '/placeholder-product.png';

  $: transactionDate = formatRelativeTime(transaction.timestamp);

  $: canMarkShipped = userRole === 'seller' && transaction.status === 'pending';
  $: canConfirmDelivery = userRole === 'buyer' && transaction.status === 'shipped';
  $: canFileDispute = userRole === 'buyer' &&
    ['pending', 'shipped'].includes(transaction.status);

  // Event handlers
  function handleClick(event: MouseEvent) {
    if (clickable) {
      dispatch('click', event);
    }
  }

  function handleAction(actionType: string) {
    return (event: MouseEvent) => {
      event.stopPropagation();
      dispatch('action', actionType);
    };
  }

  function handleViewDetails(event: MouseEvent) {
    event.stopPropagation();
    dispatch('viewDetails');
  }
</script>

<div
  class="transaction-card transaction-card-{variant} {className}"
  class:clickable
  on:click={handleClick}
  on:keypress={(e) => {
    if (clickable && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      handleClick(e as unknown as MouseEvent);
    }
  }}
  role={clickable ? 'button' : 'article'}
  tabindex={clickable ? 0 : undefined}
  aria-label={clickable ? `View transaction ${transaction.id}` : undefined}
>
  <!-- Thumbnail -->
  <div class="transaction-thumbnail">
    <img
      src={listingPhotoUrl}
      alt={transaction.listing_title}
      loading="lazy"
    />
  </div>

  <!-- Content -->
  <div class="transaction-content">
    <!-- Header -->
    <div class="transaction-header">
      <div class="transaction-info">
        <h4 class="transaction-title">{transaction.listing_title}</h4>
        {#if variant === 'full'}
          <p class="transaction-id">
            Transaction #{transaction.id.substring(0, 8)}...
          </p>
        {/if}
      </div>
      <StatusBadge
        status={transaction.status}
        type="transaction"
        size={variant === 'compact' ? 'sm' : 'md'}
      />
    </div>

    {#if variant === 'full'}
      <!-- Details Grid -->
      <div class="transaction-details">
        <div class="detail-item">
          <span class="detail-label">
            {userRole === 'buyer' ? 'Seller' : 'Buyer'}:
          </span>
          <span class="detail-value">
            {userRole === 'buyer' ? transaction.seller_name : transaction.buyer_name}
          </span>
        </div>

        <div class="detail-item">
          <span class="detail-label">Amount:</span>
          <span class="detail-value detail-amount">
            {formatPrice(transaction.total_amount, transaction.currency)}
          </span>
        </div>

        <div class="detail-item">
          <span class="detail-label">Quantity:</span>
          <span class="detail-value">{transaction.quantity}</span>
        </div>

        <div class="detail-item">
          <span class="detail-label">Date:</span>
          <span class="detail-value">{transactionDate}</span>
        </div>
      </div>

      <!-- Actions -->
      {#if showActions}
        <div class="transaction-actions">
          {#if canMarkShipped}
            <Button
              variant="primary"
              size="sm"
              on:click={handleAction('mark-shipped')}
            >
              Mark as Shipped
            </Button>
          {/if}

          {#if canConfirmDelivery}
            <Button
              variant="success"
              size="sm"
              on:click={handleAction('confirm-delivery')}
            >
              Confirm Delivery
            </Button>
          {/if}

          {#if canFileDispute}
            <Button
              variant="danger"
              size="sm"
              on:click={handleAction('file-dispute')}
            >
              File Dispute
            </Button>
          {/if}

          <Button
            variant="link"
            size="sm"
            on:click={handleViewDetails}
          >
            View Details →
          </Button>
        </div>
      {/if}
    {:else}
      <!-- Compact View -->
      <div class="transaction-compact-info">
        <span class="compact-amount">
          {formatPrice(transaction.total_amount, transaction.currency)}
        </span>
        <span class="compact-date">{transactionDate}</span>
      </div>
    {/if}
  </div>
</div>

<style>
  /* Base Card Styles */
  .transaction-card {
    background: white;
    border-radius: 12px;
    border: 1px solid #e2e8f0;
    padding: 1rem;
    display: flex;
    gap: 1rem;
    transition: all 0.2s ease;
  }

  .transaction-card-compact {
    padding: 0.75rem;
    gap: 0.75rem;
  }

  .transaction-card.clickable {
    cursor: pointer;
  }

  .transaction-card.clickable:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    border-color: #cbd5e0;
  }

  .transaction-card.clickable:focus-visible {
    outline: 2px solid #4299e1;
    outline-offset: 2px;
  }

  .transaction-card.clickable:active {
    transform: translateY(0);
  }

  /* Thumbnail */
  .transaction-thumbnail {
    flex-shrink: 0;
    width: 80px;
    height: 80px;
    border-radius: 8px;
    overflow: hidden;
    background: #f7fafc;
  }

  .transaction-card-compact .transaction-thumbnail {
    width: 60px;
    height: 60px;
  }

  .transaction-thumbnail img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  /* Content */
  .transaction-content {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    min-width: 0; /* Fix flex text overflow */
  }

  .transaction-card-compact .transaction-content {
    gap: 0.5rem;
  }

  /* Header */
  .transaction-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 1rem;
  }

  .transaction-info {
    flex: 1;
    min-width: 0;
  }

  .transaction-title {
    margin: 0;
    font-size: 1rem;
    font-weight: 600;
    color: #2d3748;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .transaction-card-compact .transaction-title {
    font-size: 0.9375rem;
  }

  .transaction-id {
    margin: 0.25rem 0 0 0;
    font-size: 0.75rem;
    color: #718096;
    font-family: monospace;
  }

  /* Details Grid */
  .transaction-details {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 0.75rem;
  }

  .detail-item {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .detail-label {
    font-size: 0.75rem;
    color: #718096;
    font-weight: 500;
  }

  .detail-value {
    font-size: 0.875rem;
    color: #2d3748;
    font-weight: 600;
  }

  .detail-amount {
    color: #4299e1;
    font-size: 1rem;
  }

  /* Actions */
  .transaction-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    padding-top: 0.75rem;
    border-top: 1px solid #e2e8f0;
  }

  /* Compact Info */
  .transaction-compact-info {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 1rem;
  }

  .compact-amount {
    font-size: 1rem;
    font-weight: 700;
    color: #4299e1;
  }

  .compact-date {
    font-size: 0.75rem;
    color: #718096;
  }

  /* Dark Mode */
  @media (prefers-color-scheme: dark) {
    .transaction-card {
      background: #2d3748;
      border-color: #4a5568;
    }

    .transaction-card.clickable:hover {
      border-color: #718096;
    }

    .transaction-title,
    .detail-value {
      color: #e2e8f0;
    }

    .transaction-id,
    .detail-label,
    .compact-date {
      color: #cbd5e0;
    }

    .detail-amount,
    .compact-amount {
      color: #63b3ed;
    }

    .transaction-actions {
      border-color: #4a5568;
    }

    .transaction-thumbnail {
      background: #1a202c;
    }
  }

  /* Responsive */
  @media (max-width: 768px) {
    .transaction-card {
      flex-direction: column;
    }

    .transaction-thumbnail {
      width: 100%;
      height: 120px;
    }

    .transaction-details {
      grid-template-columns: 1fr;
      gap: 0.5rem;
    }

    .transaction-actions {
      flex-direction: column;
    }

    .transaction-actions :global(.btn) {
      width: 100%;
    }
  }
</style>
