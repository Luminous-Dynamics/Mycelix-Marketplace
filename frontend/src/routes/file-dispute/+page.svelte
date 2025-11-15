<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import { initHolochainClient } from '$lib/holochain/client';
  import { createDispute } from '$lib/holochain/disputes';
  import { notifications } from '$lib/stores';
  import Button from '$lib/components/Button.svelte';
  import PhotoUploader from '$lib/components/PhotoUploader.svelte';
  import type { CreateDisputeInput, DisputeReason } from '$types';

  // URL parameters
  let transactionHash = '';
  let listingTitle = '';
  let sellerName = '';

  // Form state
  let reason: DisputeReason = 'not_as_described';
  let description = '';
  let evidenceFiles: File[] = [];

  // UI state
  let submitting = false;
  let uploadingEvidence = false;

  // Dispute reasons for dropdown
  const reasons: { value: DisputeReason; label: string }[] = [
    { value: 'not_as_described', label: 'Item Not As Described' },
    { value: 'defective_product', label: 'Defective or Broken Product' },
    { value: 'wrong_item', label: 'Wrong Item Received' },
    { value: 'non_delivery', label: 'Item Not Delivered' },
    { value: 'damaged_in_shipping', label: 'Damaged During Shipping' },
    { value: 'seller_unresponsive', label: 'Seller Not Responding' },
    { value: 'other', label: 'Other Issue' },
  ];

  /**
   * Load URL parameters
   */
  onMount(() => {
    transactionHash = $page.url.searchParams.get('transaction') || '';
    listingTitle = $page.url.searchParams.get('title') || 'Product';
    sellerName = $page.url.searchParams.get('seller') || 'Seller';

    if (!transactionHash) {
      notifications.error('Invalid Request', 'Missing transaction information');
      setTimeout(() => {
        goto('/transactions');
      }, 2000);
    }
  });

  /**
   * Handle evidence change from PhotoUploader
   */
  function handleEvidenceChange(event: CustomEvent<{ photos: File[] }>) {
    evidenceFiles = event.detail.photos;
  }

  /**
   * Handle evidence upload error
   */
  function handleEvidenceError(event: CustomEvent<{ message: string; file?: File }>) {
    notifications.error('Evidence Upload Error', event.detail.message);
  }

  /**
   * Upload evidence to IPFS
   * TODO: Implement real IPFS upload using ipfs-http-client or Pinata API
   * For now, generate mock IPFS CIDs
   */
  async function uploadEvidenceToIPFS(): Promise<string[]> {
    uploadingEvidence = true;

    try {
      // Mock IPFS upload - generates fake CIDs
      // In production, this should upload to IPFS using:
      // - ipfs-http-client for local IPFS node
      // - Pinata API for cloud IPFS pinning
      // - Web3.storage for decentralized storage

      const mockCids = evidenceFiles.map((file) => {
        // Generate mock IPFS CID (base58 hash)
        const hash = btoa(file.name + Date.now()).replace(/[^a-zA-Z0-9]/g, '');
        return `Qm${hash.substring(0, 44)}`;
      });

      // Simulate upload delay
      await new Promise((resolve) => setTimeout(resolve, 1000));

      return mockCids;
    } finally {
      uploadingEvidence = false;
    }
  }

  /**
   * Validate form
   */
  function validateForm(): boolean {
    if (!description.trim()) {
      notifications.error('Description Required', 'Please describe the issue');
      return false;
    }

    if (description.trim().length < 20) {
      notifications.error('Description Too Short', 'Please write at least 20 characters');
      return false;
    }

    if (evidenceFiles.length === 0) {
      notifications.warning('No Evidence', 'Consider uploading photos or documents to support your claim');
      // Don't block submission, just warn
    }

    return true;
  }

  /**
   * Submit dispute
   */
  async function handleSubmit() {
    if (!validateForm()) return;

    submitting = true;

    try {
      // Upload evidence to IPFS
      let evidenceCids: string[] = [];
      if (evidenceFiles.length > 0) {
        notifications.info('Uploading Evidence', 'Uploading evidence to IPFS...');
        evidenceCids = await uploadEvidenceToIPFS();
      }

      // Connect to Holochain
      const client = await initHolochainClient();

      // Create dispute input
      const disputeInput: CreateDisputeInput = {
        transaction_hash: transactionHash,
        reason,
        description: description.trim(),
        evidence_ipfs_cids: evidenceCids,
      };

      // File dispute
      notifications.info('Filing Dispute', 'Submitting dispute to MRC...');
      await createDispute(client, disputeInput);

      notifications.success(
        'Dispute Filed',
        'Your dispute has been submitted to the Multi-Resonance Council for review'
      );

      // Redirect to transactions page
      setTimeout(() => {
        goto('/transactions');
      }, 2000);
    } catch (e: any) {
      console.error('Failed to file dispute:', e);
      notifications.error('Submission Failed', e.message || 'Failed to file dispute');
    } finally {
      submitting = false;
    }
  }

  /**
   * Cancel and go back
   */
  function handleCancel() {
    goto('/transactions');
  }
</script>

<main class="file-dispute">
  <div class="container">
    <!-- Header -->
    <header class="page-header">
      <h1>File a Dispute</h1>
      <p class="subtitle">Submit your issue to the Multi-Resonance Council (MRC)</p>
    </header>

    <!-- Form -->
    <form on:submit|preventDefault={handleSubmit} class="dispute-form">
      <!-- Transaction Context -->
      <div class="context-card">
        <div class="context-label">Disputing Transaction</div>
        <div class="context-title">{listingTitle}</div>
        <div class="context-seller">Sold by {sellerName}</div>
      </div>

      <!-- What is MRC? -->
      <div class="info-box">
        <h3>About the Multi-Resonance Council</h3>
        <p>
          The MRC is a decentralized panel of trusted arbitrators who review disputes and make fair
          decisions based on evidence. Your case will be reviewed by multiple arbitrators, weighted
          by their Proof of Generalized Quality (PoGQ) scores.
        </p>
      </div>

      <!-- Reason -->
      <div class="form-group">
        <label for="reason-input">
          Dispute Reason <span class="required">*</span>
        </label>
        <select id="reason-input" bind:value={reason} required>
          {#each reasons as reasonOption}
            <option value={reasonOption.value}>{reasonOption.label}</option>
          {/each}
        </select>
      </div>

      <!-- Description -->
      <div class="form-group">
        <label for="description-input">
          Detailed Description <span class="required">*</span>
        </label>
        <textarea
          id="description-input"
          bind:value={description}
          placeholder="Please provide a detailed explanation of the issue. Include what you expected, what you received, and any communication with the seller..."
          rows="8"
          maxlength="2000"
          required
        />
        <small class="help-text">{description.length}/2000 characters (minimum 20)</small>
      </div>

      <!-- Evidence Upload -->
      <div class="form-group">
        <label>Supporting Evidence (Optional)</label>
        <PhotoUploader
          bind:photos={evidenceFiles}
          maxPhotos={10}
          uploading={uploadingEvidence}
          disabled={submitting}
          on:photosChange={handleEvidenceChange}
          on:error={handleEvidenceError}
        />
        <small class="help-text">
          Upload photos showing the issue, screenshots of communication, or any other relevant
          documents to support your claim.
        </small>
      </div>

      <!-- Guidelines -->
      <div class="guidelines">
        <h3>Filing Guidelines</h3>
        <ul>
          <li>Only file disputes for legitimate issues with your transaction</li>
          <li>Provide clear evidence to support your claim</li>
          <li>Be honest and thorough in your description</li>
          <li>False or malicious disputes may affect your trust score</li>
          <li>The MRC decision is final and binding</li>
        </ul>
      </div>

      <!-- Form Actions -->
      <div class="form-actions">
        <Button variant="secondary" type="button" on:click={handleCancel} disabled={submitting}>
          Cancel
        </Button>
        <Button variant="primary" type="submit" loading={submitting || uploadingEvidence}>
          {#if uploadingEvidence}
            Uploading Evidence...
          {:else}
            Submit to MRC
          {/if}
        </Button>
      </div>
    </form>
  </div>
</main>

<style>
  .file-dispute {
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

  .dispute-form {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }

  /* Context Card */
  .context-card {
    background: linear-gradient(135deg, #e53e3e 0%, #c53030 100%);
    padding: 1.5rem;
    border-radius: 8px;
    color: white;
    text-align: center;
  }

  .context-label {
    font-size: 0.875rem;
    opacity: 0.9;
    margin-bottom: 0.5rem;
  }

  .context-title {
    font-size: 1.3rem;
    font-weight: 700;
    margin-bottom: 0.5rem;
  }

  .context-seller {
    font-size: 0.95rem;
    opacity: 0.9;
  }

  /* Info Box */
  .info-box {
    background: #ebf8ff;
    border-left: 4px solid #4299e1;
    padding: 1.5rem;
    border-radius: 8px;
  }

  .info-box h3 {
    font-size: 1rem;
    color: #2d3748;
    margin: 0 0 0.75rem 0;
  }

  .info-box p {
    color: #4a5568;
    margin: 0;
    line-height: 1.6;
  }

  /* Form Group */
  .form-group {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  label {
    font-weight: 600;
    color: #2d3748;
    font-size: 0.95rem;
  }

  .required {
    color: #e53e3e;
  }

  select,
  textarea {
    padding: 0.75rem;
    border: 2px solid #e2e8f0;
    border-radius: 8px;
    font-size: 1rem;
    font-family: inherit;
    transition: border-color 0.2s;
  }

  select:focus,
  textarea:focus {
    outline: none;
    border-color: #667eea;
  }

  textarea {
    resize: vertical;
    min-height: 150px;
  }

  .help-text {
    color: #718096;
    font-size: 0.875rem;
  }

  /* Guidelines */
  .guidelines {
    background: #fffaf0;
    border-left: 4px solid #ed8936;
    padding: 1.5rem;
    border-radius: 8px;
  }

  .guidelines h3 {
    font-size: 1rem;
    color: #2d3748;
    margin: 0 0 1rem 0;
  }

  .guidelines ul {
    margin: 0;
    padding-left: 1.5rem;
    color: #4a5568;
  }

  .guidelines li {
    margin-bottom: 0.5rem;
  }

  .guidelines li:last-child {
    margin-bottom: 0;
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

    .form-actions {
      flex-direction: column;
    }
  }
</style>
