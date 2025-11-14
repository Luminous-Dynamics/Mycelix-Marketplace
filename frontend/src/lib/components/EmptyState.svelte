<script lang="ts">
  /**
   * Empty State Component
   *
   * Displays a friendly message when there's no content to show.
   * Used for empty lists, search results, carts, etc.
   *
   * @component
   * @example Basic usage with emoji
   * ```svelte
   * <EmptyState
   *   icon="📦"
   *   title="No Items Found"
   *   message="Try adjusting your filters"
   * />
   * ```
   *
   * @example With action button
   * ```svelte
   * <EmptyState
   *   icon="🛒"
   *   title="Your cart is empty"
   *   message="Add some items to get started!"
   *   actionText="Browse Marketplace"
   *   on:action={browseListing}
   * />
   * ```
   *
   * @example With custom SVG icon
   * ```svelte
   * <EmptyState title="No Transactions" message="You haven't made any purchases yet">
   *   <svg slot="icon" ...>...</svg>
   * </EmptyState>
   * ```
   */

  import { createEventDispatcher } from 'svelte';

  /**
   * Icon emoji or character (use slot="icon" for custom SVG)
   * @default "📭"
   */
  export let icon: string = '📭';

  /**
   * Main title text
   * @required
   */
  export let title: string;

  /**
   * Descriptive message (optional)
   */
  export let message: string = '';

  /**
   * Show action button
   * @default false
   */
  export let showAction: boolean = false;

  /**
   * Action button text
   */
  export let actionText: string = 'Take Action';

  /**
   * Action button variant
   * @default "primary"
   */
  export let actionVariant: 'primary' | 'secondary' = 'primary';

  /**
   * Compact mode (smaller sizing)
   * @default false
   */
  export let compact: boolean = false;

  /**
   * Additional CSS classes
   */
  let className: string = '';
  export { className as class };

  const dispatch = createEventDispatcher<{
    /**
     * Fired when action button is clicked
     */
    action: void;
  }>();

  function handleAction() {
    dispatch('action');
  }
</script>

<div
  class="empty-state {className}"
  class:compact
  role="status"
  aria-live="polite"
>
  <!-- Icon: Use slot if provided, otherwise use icon prop -->
  <div class="empty-icon" aria-hidden="true">
    <slot name="icon">
      {#if icon}
        <span class="icon-emoji">{icon}</span>
      {/if}
    </slot>
  </div>

  <h2 class="empty-title">{title}</h2>

  {#if message}
    <p class="empty-message">{message}</p>
  {/if}

  {#if showAction || $$slots.actions}
    <div class="empty-actions">
      {#if showAction}
        <button
          class="btn btn-{actionVariant}"
          on:click={handleAction}
          type="button"
        >
          {actionText}
        </button>
      {/if}

      <!-- Optional slot for custom actions -->
      <slot name="actions" />
    </div>
  {/if}

  <!-- Optional slot for additional content -->
  <slot />
</div>

<style>
  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 4rem 2rem;
    text-align: center;
    min-height: 300px;
  }

  .empty-state.compact {
    padding: 2rem 1rem;
    min-height: 200px;
  }

  .empty-icon {
    margin-bottom: 1.5rem;
    color: var(--empty-icon-color, #9ca3af);
  }

  .empty-state.compact .empty-icon {
    margin-bottom: 1rem;
  }

  .icon-emoji {
    font-size: 4rem;
    display: block;
  }

  .empty-state.compact .icon-emoji {
    font-size: 3rem;
  }

  /* Custom SVG icons from slot */
  .empty-icon :global(svg) {
    width: 120px;
    height: 120px;
    color: var(--empty-icon-color, #9ca3af);
  }

  .empty-state.compact .empty-icon :global(svg) {
    width: 80px;
    height: 80px;
  }

  .empty-title {
    font-size: 1.5rem;
    font-weight: 600;
    color: var(--empty-title-color, #111827);
    margin: 0 0 0.5rem 0;
  }

  .empty-state.compact .empty-title {
    font-size: 1.25rem;
  }

  .empty-message {
    font-size: 1rem;
    color: var(--empty-message-color, #6b7280);
    margin: 0 0 1.5rem 0;
    max-width: 500px;
    line-height: 1.5;
  }

  .empty-state.compact .empty-message {
    font-size: 0.875rem;
    margin-bottom: 1rem;
  }

  .empty-actions {
    display: flex;
    gap: 0.75rem;
    flex-wrap: wrap;
    justify-content: center;
  }

  .btn {
    padding: 0.75rem 1.5rem;
    font-size: 1rem;
    font-weight: 500;
    border-radius: 6px;
    border: none;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .empty-state.compact .btn {
    padding: 0.5rem 1rem;
    font-size: 0.875rem;
  }

  .btn-primary {
    background: var(--primary-color, #2563eb);
    color: white;
  }

  .btn-primary:hover {
    background: var(--primary-hover, #1d4ed8);
    transform: translateY(-1px);
  }

  .btn-primary:active {
    transform: translateY(0);
  }

  .btn-secondary {
    background: var(--secondary-color, #6b7280);
    color: white;
  }

  .btn-secondary:hover {
    background: var(--secondary-hover, #4b5563);
    transform: translateY(-1px);
  }

  .btn-secondary:active {
    transform: translateY(0);
  }

  .btn:focus-visible {
    outline: 2px solid var(--focus-color, #2563eb);
    outline-offset: 2px;
  }

  /* Dark mode support */
  @media (prefers-color-scheme: dark) {
    .empty-icon {
      color: var(--empty-icon-color-dark, #6b7280);
    }

    .empty-title {
      color: var(--empty-title-color-dark, #f9fafb);
    }

    .empty-message {
      color: var(--empty-message-color-dark, #9ca3af);
    }
  }
</style>
