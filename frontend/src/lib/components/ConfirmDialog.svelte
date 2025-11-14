<script lang="ts">
  /**
   * Confirm Dialog Component
   *
   * A reusable confirmation dialog for destructive or important actions.
   *
   * @component
   * @example
   * ```svelte
   * <ConfirmDialog
   *   open={showDialog}
   *   title="Delete Item"
   *   message="Are you sure you want to delete this item? This action cannot be undone."
   *   confirmText="Delete"
   *   cancelText="Cancel"
   *   variant="danger"
   *   on:confirm={handleDelete}
   *   on:cancel={() => showDialog = false}
   * />
   * ```
   */

  import { createEventDispatcher } from 'svelte';

  // Props
  /** Whether the dialog is open */
  export let open: boolean = false;

  /** Dialog title */
  export let title: string = 'Confirm Action';

  /** Dialog message/description */
  export let message: string;

  /** Confirm button text */
  export let confirmText: string = 'Confirm';

  /** Cancel button text */
  export let cancelText: string = 'Cancel';

  /** Dialog variant affecting styling */
  export let variant: 'danger' | 'warning' | 'info' | 'success' = 'info';

  /** Whether to show loading state on confirm button */
  export let loading: boolean = false;

  /** Whether to disable the confirm button */
  export let disabled: boolean = false;

  const dispatch = createEventDispatcher<{
    confirm: void;
    cancel: void;
  }>();

  function handleConfirm() {
    if (!disabled && !loading) {
      dispatch('confirm');
    }
  }

  function handleCancel() {
    if (!loading) {
      dispatch('cancel');
      open = false;
    }
  }

  function handleBackdropClick(event: MouseEvent) {
    if (event.target === event.currentTarget) {
      handleCancel();
    }
  }

  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      handleCancel();
    }
  }
</script>

{#if open}
  <!-- svelte-ignore a11y-no-noninteractive-element-interactions -->
  <div
    class="dialog-backdrop"
    on:click={handleBackdropClick}
    on:keydown={handleKeydown}
    role="dialog"
    aria-modal="true"
    aria-labelledby="dialog-title"
  >
    <div class="dialog-container" class:loading>
      <div class="dialog-header">
        <h2 id="dialog-title" class="dialog-title">{title}</h2>
        {#if !loading}
          <button
            class="close-button"
            on:click={handleCancel}
            aria-label="Close dialog"
            type="button"
          >
            ×
          </button>
        {/if}
      </div>

      <div class="dialog-body">
        <p class="dialog-message">{message}</p>
      </div>

      <div class="dialog-footer">
        <button
          class="btn btn-cancel"
          on:click={handleCancel}
          disabled={loading}
          type="button"
        >
          {cancelText}
        </button>
        <button
          class="btn btn-confirm variant-{variant}"
          on:click={handleConfirm}
          disabled={disabled || loading}
          type="button"
        >
          {#if loading}
            <span class="spinner"></span>
            Processing...
          {:else}
            {confirmText}
          {/if}
        </button>
      </div>
    </div>
  </div>
{/if}

<style>
  .dialog-backdrop {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 9999;
    animation: fadeIn 0.2s ease-out;
  }

  @keyframes fadeIn {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }

  .dialog-container {
    background: white;
    border-radius: 0.75rem;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
    max-width: 500px;
    width: 90%;
    max-height: 90vh;
    overflow: auto;
    animation: slideUp 0.3s ease-out;
  }

  @keyframes slideUp {
    from {
      transform: translateY(20px);
      opacity: 0;
    }
    to {
      transform: translateY(0);
      opacity: 1;
    }
  }

  .dialog-container.loading {
    pointer-events: none;
    opacity: 0.7;
  }

  .dialog-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1.5rem;
    border-bottom: 1px solid #e2e8f0;
  }

  .dialog-title {
    margin: 0;
    font-size: 1.25rem;
    font-weight: 600;
    color: #2d3748;
  }

  .close-button {
    background: none;
    border: none;
    font-size: 2rem;
    line-height: 1;
    color: #a0aec0;
    cursor: pointer;
    padding: 0;
    width: 2rem;
    height: 2rem;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 0.25rem;
    transition: all 0.2s;
  }

  .close-button:hover {
    background: #f7fafc;
    color: #2d3748;
  }

  .dialog-body {
    padding: 1.5rem;
  }

  .dialog-message {
    margin: 0;
    color: #4a5568;
    line-height: 1.6;
  }

  .dialog-footer {
    display: flex;
    gap: 0.75rem;
    justify-content: flex-end;
    padding: 1.5rem;
    border-top: 1px solid #e2e8f0;
  }

  .btn {
    padding: 0.625rem 1.25rem;
    border-radius: 0.5rem;
    font-size: 0.9375rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
    border: none;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .btn-cancel {
    background: #e2e8f0;
    color: #4a5568;
  }

  .btn-cancel:hover:not(:disabled) {
    background: #cbd5e0;
  }

  .btn-confirm {
    color: white;
  }

  .btn-confirm.variant-danger {
    background: linear-gradient(135deg, #f56565 0%, #c53030 100%);
  }

  .btn-confirm.variant-danger:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 10px 20px rgba(245, 101, 101, 0.4);
  }

  .btn-confirm.variant-warning {
    background: linear-gradient(135deg, #ed8936 0%, #c05621 100%);
  }

  .btn-confirm.variant-warning:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 10px 20px rgba(237, 137, 54, 0.4);
  }

  .btn-confirm.variant-info {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  }

  .btn-confirm.variant-info:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 10px 20px rgba(102, 126, 234, 0.4);
  }

  .btn-confirm.variant-success {
    background: linear-gradient(135deg, #48bb78 0%, #2f855a 100%);
  }

  .btn-confirm.variant-success:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 10px 20px rgba(72, 187, 120, 0.4);
  }

  .spinner {
    width: 1rem;
    height: 1rem;
    border: 2px solid rgba(255, 255, 255, 0.3);
    border-top-color: white;
    border-radius: 50%;
    animation: spin 0.6s linear infinite;
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
</style>
