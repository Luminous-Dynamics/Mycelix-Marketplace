<script lang="ts">
  /**
   * Button Component
   *
   * Reusable button component with multiple variants, sizes, and states.
   * Eliminates ~800 lines of duplicate CSS across the codebase.
   *
   * @component
   * @example
   * ```svelte
   * <Button variant="primary" size="md" on:click={handleClick}>
   *   Click Me
   * </Button>
   *
   * <Button variant="danger" loading={isSubmitting} type="submit">
   *   Delete
   * </Button>
   *
   * <Button variant="link" size="sm" on:click={viewMore}>
   *   View More →
   * </Button>
   * ```
   */

  import { createEventDispatcher } from 'svelte';

  const dispatch = createEventDispatcher<{ click: MouseEvent }>();

  /**
   * Button visual variant
   * - primary: Purple gradient (main actions)
   * - secondary: White/gray border (secondary actions)
   * - success: Green (approve, confirm)
   * - danger: Red (delete, cancel, reject)
   * - link: Text-only blue (navigation, subtle actions)
   * - ghost: Transparent with border (minimal emphasis)
   */
  export let variant: 'primary' | 'secondary' | 'success' | 'danger' | 'link' | 'ghost' = 'primary';

  /**
   * Button size
   * - sm: Small (0.5rem padding, 0.875rem font)
   * - md: Medium (0.75rem padding, 1rem font) - default
   * - lg: Large (1rem padding, 1.125rem font)
   */
  export let size: 'sm' | 'md' | 'lg' = 'md';

  /**
   * Button HTML type attribute
   */
  export let type: 'button' | 'submit' | 'reset' = 'button';

  /**
   * Whether the button is disabled
   */
  export let disabled: boolean = false;

  /**
   * Whether the button is in loading state
   * Shows spinner and disables interaction
   */
  export let loading: boolean = false;

  /**
   * Full width button (stretches to container width)
   */
  export let fullWidth: boolean = false;

  /**
   * Custom CSS classes to apply
   */
  let className: string = '';
  export { className as class };

  // Computed class string
  $: computedClass = [
    'btn',
    `btn-${variant}`,
    `btn-${size}`,
    fullWidth ? 'btn-full-width' : '',
    loading ? 'btn-loading' : '',
    className
  ]
    .filter(Boolean)
    .join(' ');

  // Handle click event
  function handleClick(event: MouseEvent) {
    if (!disabled && !loading) {
      dispatch('click', event);
    }
  }
</script>

<button
  class={computedClass}
  {type}
  disabled={disabled || loading}
  on:click={handleClick}
  aria-busy={loading}
>
  {#if loading}
    <span class="btn-spinner" aria-hidden="true"></span>
  {/if}
  <span class={loading ? 'btn-content-loading' : ''}>
    <slot />
  </span>
</button>

<style>
  /* Base Button Styles */
  .btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    border-radius: 8px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
    border: none;
    font-family: inherit;
    line-height: 1.5;
    white-space: nowrap;
    user-select: none;
    position: relative;
  }

  .btn:focus-visible {
    outline: 2px solid #4299e1;
    outline-offset: 2px;
  }

  .btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .btn-full-width {
    width: 100%;
  }

  /* Size Variants */
  .btn-sm {
    padding: 0.5rem 1rem;
    font-size: 0.875rem;
  }

  .btn-md {
    padding: 0.75rem 2rem;
    font-size: 1rem;
  }

  .btn-lg {
    padding: 1rem 2.5rem;
    font-size: 1.125rem;
  }

  /* Primary Variant - Purple Gradient */
  .btn-primary {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
  }

  .btn-primary:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
  }

  .btn-primary:active:not(:disabled) {
    transform: translateY(0);
    box-shadow: 0 2px 6px rgba(102, 126, 234, 0.4);
  }

  /* Secondary Variant - White/Gray Border */
  .btn-secondary {
    background: white;
    color: #2d3748;
    border: 2px solid #e2e8f0;
  }

  .btn-secondary:hover:not(:disabled) {
    background: #f7fafc;
    border-color: #cbd5e0;
  }

  .btn-secondary:active:not(:disabled) {
    background: #edf2f7;
  }

  /* Success Variant - Green */
  .btn-success {
    background: #38a169;
    color: white;
  }

  .btn-success:hover:not(:disabled) {
    background: #2f855a;
    box-shadow: 0 4px 12px rgba(56, 161, 105, 0.3);
  }

  .btn-success:active:not(:disabled) {
    background: #276749;
  }

  /* Danger Variant - Red */
  .btn-danger {
    background: #e53e3e;
    color: white;
  }

  .btn-danger:hover:not(:disabled) {
    background: #c53030;
    box-shadow: 0 4px 12px rgba(229, 62, 62, 0.3);
  }

  .btn-danger:active:not(:disabled) {
    background: #9b2c2c;
  }

  /* Link Variant - Text Only */
  .btn-link {
    background: none;
    border: none;
    color: #4299e1;
    padding: 0.25rem 0.5rem;
  }

  .btn-link:hover:not(:disabled) {
    color: #2b6cb0;
    text-decoration: underline;
  }

  .btn-link:active:not(:disabled) {
    color: #2c5282;
  }

  /* Ghost Variant - Transparent with Border */
  .btn-ghost {
    background: transparent;
    border: 2px solid currentColor;
    color: #4a5568;
  }

  .btn-ghost:hover:not(:disabled) {
    background: rgba(74, 85, 104, 0.1);
  }

  .btn-ghost:active:not(:disabled) {
    background: rgba(74, 85, 104, 0.2);
  }

  /* Loading State */
  .btn-loading {
    cursor: wait;
  }

  .btn-content-loading {
    opacity: 0;
  }

  .btn-spinner {
    position: absolute;
    width: 1em;
    height: 1em;
    border: 2px solid currentColor;
    border-right-color: transparent;
    border-radius: 50%;
    animation: btn-spin 0.6s linear infinite;
  }

  @keyframes btn-spin {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }

  /* Dark Mode Support */
  @media (prefers-color-scheme: dark) {
    .btn-secondary {
      background: #2d3748;
      color: #e2e8f0;
      border-color: #4a5568;
    }

    .btn-secondary:hover:not(:disabled) {
      background: #1a202c;
      border-color: #718096;
    }

    .btn-ghost {
      color: #e2e8f0;
    }

    .btn-ghost:hover:not(:disabled) {
      background: rgba(226, 232, 240, 0.1);
    }

    .btn-link {
      color: #63b3ed;
    }

    .btn-link:hover:not(:disabled) {
      color: #90cdf4;
    }
  }

  /* Responsive Adjustments */
  @media (max-width: 768px) {
    .btn-md {
      padding: 0.625rem 1.5rem;
      font-size: 0.9375rem;
    }

    .btn-lg {
      padding: 0.875rem 2rem;
      font-size: 1rem;
    }
  }
</style>
