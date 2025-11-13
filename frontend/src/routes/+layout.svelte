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

<slot />

<style global>
  /* Any additional global styles */
</style>
