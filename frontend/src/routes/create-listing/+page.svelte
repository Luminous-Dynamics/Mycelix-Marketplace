<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { initHolochainClient } from '$lib/holochain/client';
  import { createListing } from '$lib/holochain/listings';
  import { notifications } from '$lib/stores';
  import { validateImageFiles, MAX_PHOTOS_PER_LISTING } from '$lib/utils';
  import { LISTING_CATEGORIES } from '$lib/config/constants';
  import { createFormStore } from '$lib/utils/forms';
  import { commonValidations, validators } from '$lib/utils/formValidation';
  import Button from '$lib/components/Button.svelte';
  import PhotoUploader from '$lib/components/PhotoUploader.svelte';
  import type { CreateListingInput, ListingCategory } from '$types';

  // Form store with validation
  const form = createFormStore(
    {
      title: '',
      description: '',
      price: 0,
      category: 'Other' as ListingCategory,
      quantityAvailable: 1,
      photoFiles: [] as File[],
    },
    {
      title: commonValidations.listingTitle,
      description: commonValidations.listingDescription,
      price: commonValidations.price,
      quantityAvailable: validators.compose(
        validators.required('Quantity is required'),
        validators.min(1, 'Quantity must be at least 1')
      ),
      photoFiles: validators.custom((files: File[]) => {
        if (!files || files.length === 0) {
          return { valid: false, error: 'At least one photo is required' };
        }
        if (files.length > MAX_PHOTOS_PER_LISTING) {
          return { valid: false, error: `Maximum ${MAX_PHOTOS_PER_LISTING} photos allowed` };
        }
        return { valid: true };
      }),
    }
  );

  // UI state
  let uploadingPhotos = false;

  // Categories for dropdown
  const categories = LISTING_CATEGORIES;

  /**
   * Handle photos change from PhotoUploader
   */
  function handlePhotosChange(event: CustomEvent<{ photos: File[] }>) {
    form.setValue('photoFiles', event.detail.photos);
  }

  /**
   * Handle photo upload error
   */
  function handlePhotoError(event: CustomEvent<{ message: string; file?: File }>) {
    notifications.error('Photo Upload Error', event.detail.message);
  }

  /**
   * Upload photos to IPFS
   * TODO: Implement real IPFS upload using ipfs-http-client or Pinata API
   * For now, generate mock IPFS CIDs
   */
  async function uploadPhotosToIPFS(): Promise<string[]> {
    uploadingPhotos = true;

    try {
      // Mock IPFS upload - generates fake CIDs
      // In production, this should upload to IPFS using:
      // - ipfs-http-client for local IPFS node
      // - Pinata API for cloud IPFS pinning
      // - Web3.storage for decentralized storage

      const mockCids = $form.values.photoFiles.map((file) => {
        // Generate mock IPFS CID (base58 hash)
        const hash = btoa(file.name + Date.now()).replace(/[^a-zA-Z0-9]/g, '');
        return `Qm${hash.substring(0, 44)}`;
      });

      // Simulate upload delay
      await new Promise((resolve) => setTimeout(resolve, 1000));

      return mockCids;
    } finally {
      uploadingPhotos = false;
    }
  }

  /**
   * Submit form
   */
  async function handleSubmit() {
    // Validate form using form store
    if (!form.validate()) {
      // Get first error message
      const errors = Object.values($form.errors);
      if (errors.length > 0) {
        notifications.error('Validation Error', errors[0] as string);
      }
      return;
    }

    await form.submit(async (values) => {
      // Upload photos to IPFS
      notifications.info('Uploading Photos', 'Uploading photos to IPFS...');
      const photoCids = await uploadPhotosToIPFS();

      // Connect to Holochain
      const client = await initHolochainClient();

      // Create listing input
      const listingInput: CreateListingInput = {
        title: values.title.trim(),
        description: values.description.trim(),
        price: values.price,
        category: values.category,
        photos_ipfs_cids: photoCids,
        quantity_available: values.quantityAvailable,
      };

      // Create listing
      notifications.info('Creating Listing', 'Creating listing on blockchain...');
      const createdListing = await createListing(client, listingInput);

      // Success!
      notifications.success('Listing Created', 'Your listing has been published!');

      // Redirect to listing detail page
      setTimeout(() => {
        goto(`/listing/${createdListing.listing_hash || createdListing.id}`);
      }, 1500);
    });
  }

  /**
   * Cancel and go back
   */
  function handleCancel() {
    goto('/dashboard');
  }

  onMount(() => {
    // Focus title input on mount
    const titleInput = document.getElementById('title-input') as HTMLInputElement;
    titleInput?.focus();
  });
</script>

<main class="create-listing">
  <div class="container">
    <!-- Header -->
    <header class="page-header">
      <h1>Create New Listing</h1>
      <p class="subtitle">List your item for sale on the marketplace</p>
    </header>

    <!-- Form -->
    <form on:submit|preventDefault={handleSubmit} class="listing-form">
      <!-- Title -->
      <div class="form-group">
        <label for="title-input">
          Title <span class="required">*</span>
        </label>
        <input
          id="title-input"
          type="text"
          bind:value={$form.values.title}
          placeholder="E.g., iPhone 13 Pro - Like New"
          maxlength="100"
          required
        />
        <small class="help-text">{$form.values.title.length}/100 characters</small>
      </div>

      <!-- Description -->
      <div class="form-group">
        <label for="description-input">
          Description <span class="required">*</span>
        </label>
        <textarea
          id="description-input"
          bind:value={$form.values.description}
          placeholder="Provide a detailed description of your item, including condition, features, and any defects..."
          rows="6"
          maxlength="2000"
          required
        />
        <small class="help-text">{$form.values.description.length}/2000 characters</small>
      </div>

      <!-- Price & Quantity Row -->
      <div class="form-row">
        <!-- Price -->
        <div class="form-group">
          <label for="price-input">
            Price <span class="required">*</span>
          </label>
          <div class="input-with-prefix">
            <span class="prefix">$</span>
            <input
              id="price-input"
              type="number"
              bind:value={$form.values.price}
              min="0.01"
              step="0.01"
              placeholder="0.00"
              required
            />
          </div>
        </div>

        <!-- Quantity -->
        <div class="form-group">
          <label for="quantity-input">Quantity Available</label>
          <input
            id="quantity-input"
            type="number"
            bind:value={$form.values.quantityAvailable}
            min="1"
            max="10000"
            required
          />
        </div>
      </div>

      <!-- Category -->
      <div class="form-group">
        <label for="category-input">
          Category <span class="required">*</span>
        </label>
        <select id="category-input" bind:value={$form.values.category} required>
          {#each categories as cat}
            <option value={cat}>{cat}</option>
          {/each}
        </select>
      </div>

      <!-- Photos -->
      <div class="form-group">
        <label>
          Photos <span class="required">*</span>
        </label>
        <PhotoUploader
          bind:photos={$form.values.photoFiles}
          maxPhotos={MAX_PHOTOS_PER_LISTING}
          uploading={uploadingPhotos}
          disabled={$form.submitting}
          on:photosChange={handlePhotosChange}
          on:error={handlePhotoError}
        />
      </div>

      <!-- Form Actions -->
      <div class="form-actions">
        <Button variant="secondary" type="button" on:click={handleCancel} disabled={$form.submitting}>
          Cancel
        </Button>
        <Button variant="primary" type="submit" loading={$form.submitting || uploadingPhotos} disabled={$form.submitting || uploadingPhotos}>
          {#if uploadingPhotos}
            Uploading Photos...
          {:else}
            Create Listing
          {/if}
        </Button>
      </div>
    </form>
  </div>
</main>

<style>
  .create-listing {
    min-height: 100vh;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    padding: 2rem 1rem;
  }

  .container {
    max-width: 800px;
    margin: 0 auto;
    background: white;
    border-radius: 12px;
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
    padding: 2rem;
  }

  .page-header {
    margin-bottom: 2rem;
    text-align: center;
  }

  .page-header h1 {
    font-size: 2rem;
    color: #2d3748;
    margin: 0 0 0.5rem 0;
  }

  .subtitle {
    color: #718096;
    font-size: 1rem;
    margin: 0;
  }

  .listing-form {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }

  .form-group {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .form-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1.5rem;
  }

  label {
    font-weight: 600;
    color: #2d3748;
    font-size: 0.95rem;
  }

  .required {
    color: #e53e3e;
  }

  input[type='text'],
  input[type='number'],
  textarea,
  select {
    padding: 0.75rem;
    border: 2px solid #e2e8f0;
    border-radius: 8px;
    font-size: 1rem;
    font-family: inherit;
    transition: border-color 0.2s;
  }

  input:focus,
  textarea:focus,
  select:focus {
    outline: none;
    border-color: #667eea;
  }

  textarea {
    resize: vertical;
    min-height: 120px;
  }

  .input-with-prefix {
    position: relative;
    display: flex;
    align-items: center;
  }

  .prefix {
    position: absolute;
    left: 0.75rem;
    font-weight: 600;
    color: #718096;
    pointer-events: none;
  }

  .input-with-prefix input {
    padding-left: 2rem;
    width: 100%;
  }

  .help-text {
    color: #718096;
    font-size: 0.875rem;
  }

  /* Form Actions */
  .form-actions {
    display: flex;
    gap: 1rem;
    justify-content: flex-end;
    padding-top: 1rem;
    border-top: 2px solid #e2e8f0;
  }

  /* Responsive */
  @media (max-width: 768px) {
    .container {
      padding: 1.5rem;
    }

    .form-row {
      grid-template-columns: 1fr;
      gap: 1rem;
    }

    .form-actions {
      flex-direction: column;
    }

    .btn {
      width: 100%;
    }
  }
</style>
