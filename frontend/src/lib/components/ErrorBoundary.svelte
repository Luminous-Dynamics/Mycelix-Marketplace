<script lang="ts">
  /**
   * Error Boundary Component
   *
   * Catches and displays errors gracefully with retry functionality
   */

  import { onMount } from 'svelte';
  import { handleError } from '$lib/utils';

  // Props
  export let showDetails: boolean = false;
  export let onRetry: (() => void) | undefined = undefined;

  // State
  let error: Error | null = null;
  let errorInfo: string = '';

  // Catch global errors
  onMount(() => {
    const handleGlobalError = (event: ErrorEvent) => {
      error = event.error;
      errorInfo = event.message;
      event.preventDefault();
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      error = new Error(event.reason);
      errorInfo = 'Unhandled promise rejection';
      event.preventDefault();
    };

    window.addEventListener('error', handleGlobalError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      window.removeEventListener('error', handleGlobalError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  });

  function retry() {
    error = null;
    errorInfo = '';
    if (onRetry) {
      onRetry();
    } else {
      // Default retry: reload the page
      window.location.reload();
    }
  }

  function goHome() {
    window.location.href = '/';
  }
</script>

{#if error}
  <div class="error-boundary">
    <div class="error-container">
      <div class="error-icon">⚠️</div>
      <h1>Something went wrong</h1>
      <p class="error-message">{handleError(error, 'ErrorBoundary')}</p>

      {#if showDetails && errorInfo}
        <details class="error-details">
          <summary>Technical Details</summary>
          <pre>{errorInfo}</pre>
          {#if error.stack}
            <pre>{error.stack}</pre>
          {/if}
        </details>
      {/if}

      <div class="error-actions">
        <button class="btn-primary" on:click={retry}>
          {onRetry ? 'Try Again' : 'Reload Page'}
        </button>
        <button class="btn-secondary" on:click={goHome}>Go to Home</button>
      </div>
    </div>
  </div>
{:else}
  <slot />
{/if}

<style>
  .error-boundary {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 100vh;
    padding: 2rem;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  }

  .error-container {
    background: white;
    border-radius: 1rem;
    padding: 3rem;
    max-width: 600px;
    width: 100%;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
    text-align: center;
  }

  .error-icon {
    font-size: 4rem;
    margin-bottom: 1rem;
  }

  h1 {
    color: #2d3748;
    font-size: 2rem;
    margin-bottom: 1rem;
  }

  .error-message {
    color: #4a5568;
    font-size: 1.1rem;
    margin-bottom: 2rem;
    line-height: 1.6;
  }

  .error-details {
    text-align: left;
    margin: 2rem 0;
    padding: 1rem;
    background: #f7fafc;
    border-radius: 0.5rem;
    border: 1px solid #e2e8f0;
  }

  .error-details summary {
    cursor: pointer;
    font-weight: 600;
    color: #4a5568;
    margin-bottom: 0.5rem;
  }

  .error-details pre {
    margin: 0.5rem 0 0;
    padding: 1rem;
    background: #2d3748;
    color: #f7fafc;
    border-radius: 0.25rem;
    overflow-x: auto;
    font-size: 0.875rem;
    line-height: 1.5;
  }

  .error-actions {
    display: flex;
    gap: 1rem;
    justify-content: center;
  }

  .btn-primary,
  .btn-secondary {
    padding: 0.75rem 1.5rem;
    border-radius: 0.5rem;
    font-size: 1rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
    border: none;
  }

  .btn-primary {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
  }

  .btn-primary:hover {
    transform: translateY(-2px);
    box-shadow: 0 10px 20px rgba(102, 126, 234, 0.4);
  }

  .btn-secondary {
    background: #e2e8f0;
    color: #4a5568;
  }

  .btn-secondary:hover {
    background: #cbd5e0;
  }
</style>
