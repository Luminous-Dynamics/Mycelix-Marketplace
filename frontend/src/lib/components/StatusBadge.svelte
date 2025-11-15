<script lang="ts">
  /**
   * Status Badge Component
   *
   * Displays status indicators with color-coded styling for transactions,
   * disputes, listings, and other stateful entities.
   *
   * @component
   * @example Transaction status
   * ```svelte
   * <StatusBadge status="completed" type="transaction" />
   * <StatusBadge status="shipped" type="transaction" />
   * ```
   *
   * @example Dispute status
   * ```svelte
   * <StatusBadge status="active" type="dispute" />
   * <StatusBadge status="resolved" type="dispute" />
   * ```
   *
   * @example Custom styling
   * ```svelte
   * <StatusBadge status="pending" type="transaction" size="sm" showIcon={true} />
   * ```
   */

  /**
   * Status value (e.g., "pending", "completed", "active", "resolved")
   * @required
   */
  export let status: string;

  /**
   * Type of status badge (determines color scheme and icon)
   * @default "transaction"
   */
  export let type: 'transaction' | 'dispute' | 'listing' | 'custom' = 'transaction';

  /**
   * Badge size
   * @default "md"
   */
  export let size: 'sm' | 'md' | 'lg' = 'md';

  /**
   * Show icon alongside status text
   * @default true
   */
  export let showIcon: boolean = true;

  /**
   * Custom color for "custom" type
   * @default null
   */
  export let customColor: string | null = null;

  /**
   * Additional CSS classes
   */
  let className: string = '';
  export { className as class };

  /**
   * Get display text for status
   */
  function getStatusText(status: string): string {
    // Capitalize first letter and replace underscores/dashes
    return status
      .replace(/[_-]/g, ' ')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  }

  /**
   * Get icon for status
   */
  function getStatusIcon(status: string, type: string): string {
    const normalized = status.toLowerCase();

    if (type === 'transaction') {
      const transactionIcons: Record<string, string> = {
        pending: '⏳',
        shipped: '📦',
        delivered: '✓',
        completed: '✓',
        cancelled: '✗',
        refunded: '↩️',
      };
      return transactionIcons[normalized] || '•';
    }

    if (type === 'dispute') {
      const disputeIcons: Record<string, string> = {
        pending: '⏳',
        active: '⚖️',
        resolved: '✓',
        rejected: '✗',
        withdrawn: '↩️',
      };
      return disputeIcons[normalized] || '•';
    }

    if (type === 'listing') {
      const listingIcons: Record<string, string> = {
        active: '✓',
        inactive: '✗',
        sold: '🎉',
        draft: '📝',
      };
      return listingIcons[normalized] || '•';
    }

    return '•';
  }

  /**
   * Get color variant for status
   */
  function getStatusVariant(status: string, type: string): string {
    const normalized = status.toLowerCase();

    // Transaction status colors
    if (type === 'transaction') {
      if (['completed', 'delivered'].includes(normalized)) return 'success';
      if (['shipped', 'processing'].includes(normalized)) return 'info';
      if (['pending', 'awaiting'].includes(normalized)) return 'warning';
      if (['cancelled', 'failed', 'refunded'].includes(normalized)) return 'error';
    }

    // Dispute status colors
    if (type === 'dispute') {
      if (['resolved'].includes(normalized)) return 'success';
      if (['active', 'under_review'].includes(normalized)) return 'info';
      if (['pending', 'awaiting_response'].includes(normalized)) return 'warning';
      if (['rejected', 'withdrawn'].includes(normalized)) return 'error';
    }

    // Listing status colors
    if (type === 'listing') {
      if (['active', 'published'].includes(normalized)) return 'success';
      if (['draft', 'pending'].includes(normalized)) return 'warning';
      if (['inactive', 'suspended'].includes(normalized)) return 'error';
      if (['sold', 'archived'].includes(normalized)) return 'neutral';
    }

    return 'neutral';
  }

  $: statusText = getStatusText(status);
  $: statusIcon = getStatusIcon(status, type);
  $: statusVariant = customColor ? 'custom' : getStatusVariant(status, type);
</script>

<span
  class="status-badge {statusVariant} {size} {className}"
  style={customColor ? `--custom-color: ${customColor}` : ''}
  role="status"
  aria-label="{type} status: {statusText}"
>
  {#if showIcon}
    <span class="status-icon" aria-hidden="true">{statusIcon}</span>
  {/if}
  <span class="status-text">{statusText}</span>
</span>

<style>
  .status-badge {
    display: inline-flex;
    align-items: center;
    gap: 0.25rem;
    padding: 0.25rem 0.75rem;
    border-radius: 9999px;
    font-weight: 500;
    font-size: 0.875rem;
    line-height: 1.25;
    white-space: nowrap;
    transition: all 0.2s ease;
  }

  /* Size variants */
  .status-badge.sm {
    padding: 0.125rem 0.5rem;
    font-size: 0.75rem;
    gap: 0.125rem;
  }

  .status-badge.md {
    padding: 0.25rem 0.75rem;
    font-size: 0.875rem;
    gap: 0.25rem;
  }

  .status-badge.lg {
    padding: 0.375rem 1rem;
    font-size: 1rem;
    gap: 0.375rem;
  }

  /* Icon styling */
  .status-icon {
    font-size: 1em;
    line-height: 1;
  }

  .status-badge.sm .status-icon {
    font-size: 0.875em;
  }

  .status-badge.lg .status-icon {
    font-size: 1.125em;
  }

  /* Color variants */
  .status-badge.success {
    background: var(--success-bg, #d1fae5);
    color: var(--success-text, #065f46);
    border: 1px solid var(--success-border, #6ee7b7);
  }

  .status-badge.info {
    background: var(--info-bg, #dbeafe);
    color: var(--info-text, #1e40af);
    border: 1px solid var(--info-border, #93c5fd);
  }

  .status-badge.warning {
    background: var(--warning-bg, #fef3c7);
    color: var(--warning-text, #92400e);
    border: 1px solid var(--warning-border, #fcd34d);
  }

  .status-badge.error {
    background: var(--error-bg, #fee2e2);
    color: var(--error-text, #991b1b);
    border: 1px solid var(--error-border, #fca5a5);
  }

  .status-badge.neutral {
    background: var(--neutral-bg, #f3f4f6);
    color: var(--neutral-text, #374151);
    border: 1px solid var(--neutral-border, #d1d5db);
  }

  .status-badge.custom {
    background: var(--custom-color, #e5e7eb);
    color: var(--custom-text, #1f2937);
    border: 1px solid var(--custom-color, #d1d5db);
    filter: brightness(0.95);
  }

  /* Dark mode support */
  @media (prefers-color-scheme: dark) {
    .status-badge.success {
      background: var(--success-bg-dark, #064e3b);
      color: var(--success-text-dark, #6ee7b7);
      border-color: var(--success-border-dark, #059669);
    }

    .status-badge.info {
      background: var(--info-bg-dark, #1e3a8a);
      color: var(--info-text-dark, #93c5fd);
      border-color: var(--info-border-dark, #3b82f6);
    }

    .status-badge.warning {
      background: var(--warning-bg-dark, #78350f);
      color: var(--warning-text-dark, #fcd34d);
      border-color: var(--warning-border-dark, #f59e0b);
    }

    .status-badge.error {
      background: var(--error-bg-dark, #7f1d1d);
      color: var(--error-text-dark, #fca5a5);
      border-color: var(--error-border-dark, #dc2626);
    }

    .status-badge.neutral {
      background: var(--neutral-bg-dark, #374151);
      color: var(--neutral-text-dark, #e5e7eb);
      border-color: var(--neutral-border-dark, #4b5563);
    }
  }

  /* Hover effect (optional, for clickable badges) */
  .status-badge:hover {
    filter: brightness(0.95);
  }
</style>
