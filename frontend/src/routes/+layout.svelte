<script lang="ts">
  import '../app.css';
  import { onMount } from 'svelte';
  import { initHolochainClient } from '$lib/holochain/client';

  // Initialize Holochain connection on app startup
  onMount(async () => {
    try {
      await initHolochainClient();
      console.log('Holochain client initialized');
    } catch (e) {
      console.error('Failed to connect to Holochain:', e);
    }
  });
</script>

<!-- Skip to main content link for keyboard navigation and screen readers -->
<a href="#main-content" class="skip-link">Skip to main content</a>

<!-- Main content area -->
<main id="main-content">
  <slot />
</main>

<style>
  /* Skip link for keyboard navigation - only visible when focused */
  .skip-link {
    position: absolute;
    top: -40px;
    left: 0;
    background: var(--primary-color, #2563eb);
    color: white;
    padding: 8px 16px;
    text-decoration: none;
    border-radius: 0 0 4px 0;
    font-weight: 500;
    z-index: 9999;
    transition: top 0.2s ease;
  }

  .skip-link:focus {
    top: 0;
    outline: 2px solid #fff;
    outline-offset: 2px;
  }

  /* Main content wrapper */
  main {
    min-height: 100vh;
  }
</style>

<style global>
  /* Any additional global styles */
</style>
