<script lang="ts">
  /**
   * Loading State Component
   *
   * Displays a loading spinner with optional message
   */

  export let message: string = 'Loading...';
  export let size: 'small' | 'medium' | 'large' = 'medium';
  export let fullScreen: boolean = false;
</script>

<div class="loading-container" class:fullscreen={fullScreen}>
  <div class="spinner" class:small={size === 'small'} class:large={size === 'large'}></div>
  {#if message}
    <p class="loading-message">{message}</p>
  {/if}
</div>

<style>
  .loading-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 2rem;
  }

  .loading-container.fullscreen {
    min-height: 100vh;
    width: 100vw;
    position: fixed;
    top: 0;
    left: 0;
    background: rgba(255, 255, 255, 0.95);
    z-index: 9999;
  }

  .spinner {
    width: 60px;
    height: 60px;
    border: 4px solid #e2e8f0;
    border-top-color: #667eea;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }

  .spinner.small {
    width: 30px;
    height: 30px;
    border-width: 3px;
  }

  .spinner.large {
    width: 80px;
    height: 80px;
    border-width: 5px;
  }

  .loading-message {
    margin-top: 1rem;
    color: #4a5568;
    font-size: 1rem;
    font-weight: 500;
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
</style>
