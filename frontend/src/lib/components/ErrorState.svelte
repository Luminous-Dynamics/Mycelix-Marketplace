<script lang="ts">
  /**
   * Error State Component
   *
   * Displays a user-friendly error message with optional retry action.
   * Used across the application for consistent error handling UX.
   *
   * @component
   * @example
   * ```svelte
   * <ErrorState
   *   title="Failed to Load"
   *   message={errorMessage}
   *   on:retry={handleRetry}
   * />
   * ```
   *
   * @example With custom icon and button text
   * ```svelte
   * <ErrorState
   *   icon="🔒"
   *   title="Access Denied"
   *   message="You don't have permission to view this content"
   *   actionText="Go Back"
   *   on:action={goBack}
   * />
   * ```
   */

  import { createEventDispatcher } from 'svelte';

  /**
   * Icon emoji or character
   * @default "⚠️"
   */
  export let icon: string = '⚠️';

  /**
   * Main error title
   * @default "Something Went Wrong"
   */
  export let title: string = 'Something Went Wrong';

  /**
   * Detailed error message
   * @required
   */
  export let message: string;

  /**
   * Show retry/action button
   * @default true
   */
  export let showAction: boolean = true;

  /**
   * Action button text
   * @default "Retry"
   */
  export let actionText: string = 'Retry';

  /**
   * Action button variant
   * @default "primary"
   */
  export let actionVariant: 'primary' | 'secondary' = 'primary';

  /**
   * Additional CSS classes
   */
  let className: string = '';
  export { className as class };

  const dispatch = createEventDispatcher<{
    /**
     * Fired when action button is clicked
     * Event name 'retry' for backward compatibility, but can be any action
     */
    retry: void;
    /**
     * Alias for retry event
     */
    action: void;
  }>();

  function handleAction() {
    dispatch('retry');
    dispatch('action');
  }
</script>

<div class="error-state {className}" role="alert" aria-live="assertive">
  <span class="error-icon" aria-hidden="true">{icon}</span>
  <h2 class="error-title">{title}</h2>
  <p class="error-message">{message}</p>

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

<style>
  .error-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 3rem 2rem;
    text-align: center;
    min-height: 300px;
    background: var(--error-bg, #fef2f2);
    border-radius: 8px;
    border: 1px solid var(--error-border, #fee2e2);
  }

  .error-icon {
    font-size: 3rem;
    margin-bottom: 1rem;
    opacity: 0.9;
  }

  .error-title {
    font-size: 1.5rem;
    font-weight: 600;
    color: var(--error-title-color, #991b1b);
    margin: 0 0 0.5rem 0;
  }

  .error-message {
    font-size: 1rem;
    color: var(--error-message-color, #7f1d1d);
    margin: 0 0 1.5rem 0;
    max-width: 500px;
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
    .error-state {
      background: var(--error-bg-dark, #7f1d1d);
      border-color: var(--error-border-dark, #991b1b);
    }

    .error-title {
      color: var(--error-title-color-dark, #fecaca);
    }

    .error-message {
      color: var(--error-message-color-dark, #fca5a5);
    }
  }
</style>
