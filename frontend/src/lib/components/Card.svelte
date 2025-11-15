<script lang="ts">
  /**
   * Card Component
   *
   * Flexible container component with consistent styling across the app.
   * Eliminates duplicate card/container markup and CSS.
   *
   * @component
   * @example
   * ```svelte
   * <Card padding="md" shadow="md">
   *   <div slot="header">
   *     <h3>Card Title</h3>
   *     <Button slot="actions" variant="link" size="sm">View All</Button>
   *   </div>
   *
   *   <p>Card content goes here</p>
   *
   *   <div slot="footer">
   *     <Button variant="primary">Action</Button>
   *   </div>
   * </Card>
   * ```
   */

  import { createEventDispatcher } from 'svelte';

  const dispatch = createEventDispatcher<{ click: MouseEvent }>();

  /**
   * Padding size variant
   * - none: No padding
   * - sm: Small padding (0.75rem)
   * - md: Medium padding (1.5rem) - default
   * - lg: Large padding (2rem)
   */
  export let padding: 'none' | 'sm' | 'md' | 'lg' = 'md';

  /**
   * Border variant
   * - none: No border
   * - default: Standard border (1px)
   * - strong: Thicker border (2px)
   */
  export let border: 'none' | 'default' | 'strong' = 'default';

  /**
   * Shadow variant
   * - none: No shadow
   * - sm: Small shadow
   * - md: Medium shadow - default
   * - lg: Large shadow
   */
  export let shadow: 'none' | 'sm' | 'md' | 'lg' = 'sm';

  /**
   * Whether the card should have hover effects
   */
  export let hoverable: boolean = false;

  /**
   * Whether the card is clickable (cursor pointer, onClick event)
   */
  export let clickable: boolean = false;

  /**
   * Whether the card is in loading state
   */
  export let loading: boolean = false;

  /**
   * Custom CSS classes
   */
  let className: string = '';
  export { className as class };

  // Computed class string
  $: computedClass = [
    'card',
    `card-padding-${padding}`,
    `card-border-${border}`,
    `card-shadow-${shadow}`,
    hoverable ? 'card-hoverable' : '',
    clickable ? 'card-clickable' : '',
    loading ? 'card-loading' : '',
    className
  ]
    .filter(Boolean)
    .join(' ');

  // Handle click event
  function handleClick(event: MouseEvent) {
    if (clickable && !loading) {
      dispatch('click', event);
    }
  }
</script>

<div
  class={computedClass}
  on:click={handleClick}
  on:keypress={(e) => {
    if (clickable && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      handleClick(e as unknown as MouseEvent);
    }
  }}
  role={clickable ? 'button' : undefined}
  tabindex={clickable ? 0 : undefined}
>
  {#if loading}
    <div class="card-loading-overlay">
      <div class="card-spinner"></div>
    </div>
  {/if}

  {#if $$slots.header}
    <div class="card-header">
      <slot name="header" />
    </div>
  {/if}

  <div class="card-body">
    <slot />
  </div>

  {#if $$slots.footer}
    <div class="card-footer">
      <slot name="footer" />
    </div>
  {/if}
</div>

<style>
  /* Base Card Styles */
  .card {
    background: white;
    border-radius: 12px;
    position: relative;
    transition: all 0.2s ease;
    overflow: hidden;
  }

  /* Padding Variants */
  .card-padding-none {
    padding: 0;
  }

  .card-padding-sm .card-body {
    padding: 0.75rem;
  }

  .card-padding-md .card-body {
    padding: 1.5rem;
  }

  .card-padding-lg .card-body {
    padding: 2rem;
  }

  .card-padding-sm .card-header,
  .card-padding-sm .card-footer {
    padding: 0.75rem;
  }

  .card-padding-md .card-header,
  .card-padding-md .card-footer {
    padding: 1.5rem;
  }

  .card-padding-lg .card-header,
  .card-padding-lg .card-footer {
    padding: 2rem;
  }

  /* Border Variants */
  .card-border-none {
    border: none;
  }

  .card-border-default {
    border: 1px solid #e2e8f0;
  }

  .card-border-strong {
    border: 2px solid #cbd5e0;
  }

  /* Shadow Variants */
  .card-shadow-none {
    box-shadow: none;
  }

  .card-shadow-sm {
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  }

  .card-shadow-md {
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  }

  .card-shadow-lg {
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
  }

  /* Hoverable State */
  .card-hoverable:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
  }

  /* Clickable State */
  .card-clickable {
    cursor: pointer;
    user-select: none;
  }

  .card-clickable:focus-visible {
    outline: 2px solid #4299e1;
    outline-offset: 2px;
  }

  .card-clickable:active:not(.card-loading) {
    transform: scale(0.98);
  }

  /* Loading State */
  .card-loading {
    pointer-events: none;
  }

  .card-loading-overlay {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(255, 255, 255, 0.8);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 10;
  }

  .card-spinner {
    width: 2rem;
    height: 2rem;
    border: 3px solid #e2e8f0;
    border-top-color: #4299e1;
    border-radius: 50%;
    animation: card-spin 0.6s linear infinite;
  }

  @keyframes card-spin {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }

  /* Card Header */
  .card-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    border-bottom: 1px solid #e2e8f0;
    gap: 1rem;
  }

  .card-header :global(h1),
  .card-header :global(h2),
  .card-header :global(h3),
  .card-header :global(h4) {
    margin: 0;
    font-weight: 600;
    color: #2d3748;
  }

  /* Card Body */
  .card-body {
    position: relative;
  }

  /* Card Footer */
  .card-footer {
    border-top: 1px solid #e2e8f0;
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  /* Dark Mode Support */
  @media (prefers-color-scheme: dark) {
    .card {
      background: #2d3748;
      border-color: #4a5568;
    }

    .card-border-default {
      border-color: #4a5568;
    }

    .card-border-strong {
      border-color: #718096;
    }

    .card-header,
    .card-footer {
      border-color: #4a5568;
    }

    .card-header :global(h1),
    .card-header :global(h2),
    .card-header :global(h3),
    .card-header :global(h4) {
      color: #e2e8f0;
    }

    .card-loading-overlay {
      background: rgba(45, 55, 72, 0.8);
    }

    .card-spinner {
      border-color: #4a5568;
      border-top-color: #63b3ed;
    }
  }

  /* Responsive */
  @media (max-width: 768px) {
    .card-padding-md .card-body {
      padding: 1rem;
    }

    .card-padding-lg .card-body {
      padding: 1.5rem;
    }

    .card-padding-md .card-header,
    .card-padding-md .card-footer {
      padding: 1rem;
    }

    .card-padding-lg .card-header,
    .card-padding-lg .card-footer {
      padding: 1.5rem;
    }

    .card-header {
      flex-direction: column;
      align-items: flex-start;
    }
  }
</style>
