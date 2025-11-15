<script lang="ts">
  /**
   * PhotoUploader Component
   *
   * Comprehensive photo upload component with drag-and-drop, validation,
   * preview grid, and photo reordering capabilities.
   * Eliminates duplicate photo upload logic across create-listing and file-dispute pages.
   *
   * @component
   * @example
   * ```svelte
   * <PhotoUploader
   *   bind:photos={photoFiles}
   *   maxPhotos={10}
   *   {uploading}
   *   on:photosChange={handlePhotosChange}
   *   on:error={handleUploadError}
   * />
   * ```
   */

  import { createEventDispatcher, onMount } from 'svelte';

  const dispatch = createEventDispatcher<{
    photosChange: { photos: File[] };
    error: { message: string; file?: File };
    remove: { index: number };
    reorder: { oldIndex: number; newIndex: number };
  }>();

  /**
   * Array of photo files
   */
  export let photos: File[] = [];

  /**
   * Maximum number of photos allowed
   */
  export let maxPhotos: number = 10;

  /**
   * Maximum file size in bytes (default 5MB)
   */
  export let maxFileSize: number = 5 * 1024 * 1024;

  /**
   * Accepted image MIME types
   */
  export let acceptedTypes: string[] = ['image/jpeg', 'image/png', 'image/webp'];

  /**
   * Whether files are currently being uploaded
   */
  export let uploading: boolean = false;

  /**
   * Whether the uploader is disabled
   */
  export let disabled: boolean = false;

  /**
   * Whether to show preview grid
   */
  export let showPreview: boolean = true;

  /**
   * Custom CSS classes
   */
  let className: string = '';
  export { className as class };

  // Internal state
  let isDragging: boolean = false;
  let error: string = '';
  let fileInput: HTMLInputElement;
  let previewUrls: Map<File, string> = new Map();
  let draggedIndex: number | null = null;
  let dragOverIndex: number | null = null;

  // Generate preview URLs for new photos
  $: {
    // Create preview URLs for new photos
    photos.forEach((photo) => {
      if (!previewUrls.has(photo)) {
        previewUrls.set(photo, URL.createObjectURL(photo));
      }
    });

    // Clean up URLs for removed photos
    previewUrls.forEach((url, file) => {
      if (!photos.includes(file)) {
        URL.revokeObjectURL(url);
        previewUrls.delete(file);
      }
    });

    // Trigger reactive update
    previewUrls = previewUrls;
  }

  // Cleanup on component destroy
  onMount(() => {
    return () => {
      previewUrls.forEach((url) => URL.revokeObjectURL(url));
    };
  });

  /**
   * Format file size for display
   */
  function formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  }

  /**
   * Validate a single file
   */
  function validateFile(file: File): { valid: boolean; error?: string } {
    // Check file type
    if (!acceptedTypes.includes(file.type)) {
      return {
        valid: false,
        error: `Invalid file type. Accepted types: ${acceptedTypes.join(', ')}`,
      };
    }

    // Check file size
    if (file.size > maxFileSize) {
      return {
        valid: false,
        error: `File too large. Maximum size: ${formatFileSize(maxFileSize)}`,
      };
    }

    return { valid: true };
  }

  /**
   * Add files to the photos array
   */
  function addFiles(files: FileList | File[]) {
    if (disabled || uploading) return;

    const fileArray = Array.from(files);
    const newPhotos: File[] = [];
    error = '';

    // Check total count
    if (photos.length + fileArray.length > maxPhotos) {
      error = `Maximum ${maxPhotos} photos allowed. You can add ${maxPhotos - photos.length} more.`;
      dispatch('error', { message: error });
      return;
    }

    // Validate and add each file
    for (const file of fileArray) {
      // Check for duplicates
      const isDuplicate = photos.some(
        (p) => p.name === file.name && p.size === file.size && p.lastModified === file.lastModified
      );

      if (isDuplicate) {
        error = `Duplicate file: ${file.name}`;
        dispatch('error', { message: error, file });
        continue;
      }

      // Validate file
      const validation = validateFile(file);
      if (!validation.valid) {
        error = validation.error!;
        dispatch('error', { message: error, file });
        continue;
      }

      newPhotos.push(file);
    }

    // Add valid photos
    if (newPhotos.length > 0) {
      photos = [...photos, ...newPhotos];
      dispatch('photosChange', { photos });
    }
  }

  /**
   * Handle file input change
   */
  function handleFileSelect(event: Event) {
    const target = event.target as HTMLInputElement;
    if (target.files && target.files.length > 0) {
      addFiles(target.files);
      target.value = ''; // Reset input
    }
  }

  /**
   * Handle drop zone click
   */
  function handleDropZoneClick() {
    if (!disabled && !uploading) {
      fileInput.click();
    }
  }

  /**
   * Handle drag over
   */
  function handleDragOver(event: DragEvent) {
    if (disabled || uploading) return;
    event.preventDefault();
    isDragging = true;
  }

  /**
   * Handle drag leave
   */
  function handleDragLeave(event: DragEvent) {
    event.preventDefault();
    isDragging = false;
  }

  /**
   * Handle drop
   */
  function handleDrop(event: DragEvent) {
    event.preventDefault();
    isDragging = false;

    if (disabled || uploading) return;

    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      addFiles(files);
    }
  }

  /**
   * Remove photo at index
   */
  function removePhoto(index: number) {
    if (disabled || uploading) return;

    const removedPhoto = photos[index];
    photos = photos.filter((_, i) => i !== index);

    dispatch('remove', { index });
    dispatch('photosChange', { photos });
  }

  /**
   * Handle photo drag start (for reordering)
   */
  function handlePhotoDragStart(event: DragEvent, index: number) {
    if (disabled || uploading) return;
    draggedIndex = index;
    event.dataTransfer!.effectAllowed = 'move';
  }

  /**
   * Handle photo drag over (for reordering)
   */
  function handlePhotoDragOver(event: DragEvent, index: number) {
    if (disabled || uploading || draggedIndex === null) return;
    event.preventDefault();
    dragOverIndex = index;
  }

  /**
   * Handle photo drag end (for reordering)
   */
  function handlePhotoDragEnd() {
    draggedIndex = null;
    dragOverIndex = null;
  }

  /**
   * Handle photo drop (for reordering)
   */
  function handlePhotoDrop(event: DragEvent, dropIndex: number) {
    event.preventDefault();
    event.stopPropagation();

    if (disabled || uploading || draggedIndex === null || draggedIndex === dropIndex) {
      handlePhotoDragEnd();
      return;
    }

    // Reorder photos array
    const newPhotos = [...photos];
    const [draggedPhoto] = newPhotos.splice(draggedIndex, 1);
    newPhotos.splice(dropIndex, 0, draggedPhoto);

    photos = newPhotos;
    dispatch('reorder', { oldIndex: draggedIndex, newIndex: dropIndex });
    dispatch('photosChange', { photos });

    handlePhotoDragEnd();
  }
</script>

<div class="photo-uploader {className}" class:disabled class:uploading>
  <!-- Hidden File Input -->
  <input
    bind:this={fileInput}
    type="file"
    multiple
    accept={acceptedTypes.join(',')}
    on:change={handleFileSelect}
    disabled={disabled || uploading}
    style="display: none;"
    aria-label="Select photos to upload"
  />

  <!-- Drop Zone -->
  <div
    class="drop-zone"
    class:active={isDragging}
    class:disabled={disabled || uploading}
    on:click={handleDropZoneClick}
    on:dragover={handleDragOver}
    on:dragleave={handleDragLeave}
    on:drop={handleDrop}
    role="button"
    tabindex={disabled || uploading ? -1 : 0}
    on:keypress={(e) => {
      if ((e.key === 'Enter' || e.key === ' ') && !disabled && !uploading) {
        e.preventDefault();
        handleDropZoneClick();
      }
    }}
    aria-label="Drag and drop photos or click to browse"
  >
    <div class="drop-zone-content">
      <span class="upload-icon">📸</span>
      <p class="upload-text">
        {#if uploading}
          Uploading...
        {:else if disabled}
          Upload disabled
        {:else}
          Drag photos here or click to browse
        {/if}
      </p>
      <p class="upload-hint">
        Max {maxPhotos} photos, up to {formatFileSize(maxFileSize)} each
      </p>
      {#if photos.length > 0}
        <p class="photo-count-badge">
          {photos.length} / {maxPhotos} photos selected
        </p>
      {/if}
    </div>

    {#if uploading}
      <div class="uploading-overlay">
        <div class="spinner"></div>
      </div>
    {/if}
  </div>

  <!-- Error Message -->
  {#if error}
    <div class="error-message" role="alert">
      ⚠️ {error}
    </div>
  {/if}

  <!-- Preview Grid -->
  {#if showPreview && photos.length > 0}
    <div class="preview-grid">
      {#each photos as photo, index (photo)}
        <div
          class="preview-item"
          class:main={index === 0}
          class:dragging={draggedIndex === index}
          class:drag-over={dragOverIndex === index}
          draggable={!disabled && !uploading}
          on:dragstart={(e) => handlePhotoDragStart(e, index)}
          on:dragover={(e) => handlePhotoDragOver(e, index)}
          on:dragend={handlePhotoDragEnd}
          on:drop={(e) => handlePhotoDrop(e, index)}
          role="button"
          tabindex={0}
          aria-label={`Photo ${index + 1}${index === 0 ? ' (main)' : ''}`}
        >
          <img
            src={previewUrls.get(photo) || ''}
            alt={`Preview ${index + 1}`}
            loading="lazy"
          />

          {#if index === 0}
            <div class="main-badge">Main Photo</div>
          {/if}

          <button
            class="remove-btn"
            on:click|stopPropagation={() => removePhoto(index)}
            disabled={disabled || uploading}
            type="button"
            aria-label={`Remove photo ${index + 1}`}
          >
            ✕
          </button>

          <div class="photo-info">
            <span class="photo-name">{photo.name}</span>
            <span class="photo-size">{formatFileSize(photo.size)}</span>
          </div>
        </div>
      {/each}
    </div>

    <p class="reorder-hint">
      💡 Drag photos to reorder. The first photo will be the main image.
    </p>
  {/if}
</div>

<style>
  /* Container */
  .photo-uploader {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .photo-uploader.disabled {
    opacity: 0.6;
    pointer-events: none;
  }

  /* Drop Zone */
  .drop-zone {
    position: relative;
    border: 2px dashed #cbd5e0;
    border-radius: 12px;
    padding: 2rem;
    text-align: center;
    background: #f7fafc;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .drop-zone:hover:not(.disabled) {
    border-color: #4299e1;
    background: #ebf8ff;
  }

  .drop-zone.active {
    border-color: #4299e1;
    background: #ebf8ff;
    transform: scale(1.02);
  }

  .drop-zone.disabled {
    cursor: not-allowed;
    background: #edf2f7;
  }

  .drop-zone:focus-visible {
    outline: 2px solid #4299e1;
    outline-offset: 2px;
  }

  .drop-zone-content {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.5rem;
  }

  .upload-icon {
    font-size: 3rem;
    line-height: 1;
  }

  .upload-text {
    margin: 0;
    font-size: 1.125rem;
    font-weight: 600;
    color: #2d3748;
  }

  .upload-hint {
    margin: 0;
    font-size: 0.875rem;
    color: #718096;
  }

  .photo-count-badge {
    margin: 0.5rem 0 0 0;
    padding: 0.5rem 1rem;
    background: #4299e1;
    color: white;
    border-radius: 20px;
    font-size: 0.875rem;
    font-weight: 600;
  }

  /* Uploading Overlay */
  .uploading-overlay {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(255, 255, 255, 0.9);
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 12px;
  }

  .spinner {
    width: 40px;
    height: 40px;
    border: 4px solid #e2e8f0;
    border-top-color: #4299e1;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }

  /* Error Message */
  .error-message {
    padding: 0.75rem 1rem;
    background: #fff5f5;
    border: 1px solid #fc8181;
    border-radius: 8px;
    color: #c53030;
    font-size: 0.875rem;
    font-weight: 500;
  }

  /* Preview Grid */
  .preview-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
    gap: 1rem;
  }

  @media (min-width: 768px) {
    .preview-grid {
      grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
    }
  }

  .preview-item {
    position: relative;
    aspect-ratio: 1;
    border-radius: 8px;
    overflow: hidden;
    background: #f7fafc;
    border: 2px solid #e2e8f0;
    cursor: move;
    transition: all 0.2s ease;
  }

  .preview-item:hover {
    border-color: #cbd5e0;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }

  .preview-item.main {
    border-color: #4299e1;
    border-width: 3px;
  }

  .preview-item.dragging {
    opacity: 0.5;
    transform: scale(0.95);
  }

  .preview-item.drag-over {
    border-color: #48bb78;
    border-width: 3px;
    background: #f0fff4;
  }

  .preview-item img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  /* Main Badge */
  .main-badge {
    position: absolute;
    top: 0.5rem;
    left: 0.5rem;
    padding: 0.25rem 0.75rem;
    background: #4299e1;
    color: white;
    border-radius: 12px;
    font-size: 0.75rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.025em;
  }

  /* Remove Button */
  .remove-btn {
    position: absolute;
    top: 0.5rem;
    right: 0.5rem;
    width: 28px;
    height: 28px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(0, 0, 0, 0.7);
    color: white;
    border: none;
    border-radius: 50%;
    font-size: 1rem;
    font-weight: 700;
    cursor: pointer;
    opacity: 0;
    transition: all 0.2s ease;
  }

  .preview-item:hover .remove-btn {
    opacity: 1;
  }

  .remove-btn:hover {
    background: #e53e3e;
    transform: scale(1.1);
  }

  .remove-btn:active {
    transform: scale(0.95);
  }

  .remove-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  /* Photo Info */
  .photo-info {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    padding: 0.5rem;
    background: linear-gradient(to top, rgba(0, 0, 0, 0.8), transparent);
    display: flex;
    flex-direction: column;
    gap: 0.125rem;
    opacity: 0;
    transition: opacity 0.2s ease;
  }

  .preview-item:hover .photo-info {
    opacity: 1;
  }

  .photo-name {
    color: white;
    font-size: 0.75rem;
    font-weight: 500;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .photo-size {
    color: rgba(255, 255, 255, 0.8);
    font-size: 0.625rem;
  }

  /* Reorder Hint */
  .reorder-hint {
    margin: 0;
    padding: 0.75rem;
    background: #ebf8ff;
    border-radius: 8px;
    color: #2c5282;
    font-size: 0.875rem;
    text-align: center;
  }

  /* Dark Mode */
  @media (prefers-color-scheme: dark) {
    .drop-zone {
      background: #2d3748;
      border-color: #4a5568;
    }

    .drop-zone:hover:not(.disabled) {
      background: #1a365d;
      border-color: #63b3ed;
    }

    .drop-zone.active {
      background: #1a365d;
      border-color: #63b3ed;
    }

    .drop-zone.disabled {
      background: #1a202c;
    }

    .upload-text {
      color: #e2e8f0;
    }

    .upload-hint {
      color: #cbd5e0;
    }

    .uploading-overlay {
      background: rgba(45, 55, 72, 0.9);
    }

    .error-message {
      background: #742a2a;
      border-color: #fc8181;
      color: #feb2b2;
    }

    .preview-item {
      background: #1a202c;
      border-color: #4a5568;
    }

    .preview-item:hover {
      border-color: #718096;
    }

    .preview-item.main {
      border-color: #63b3ed;
    }

    .preview-item.drag-over {
      border-color: #68d391;
      background: #22543d;
    }

    .reorder-hint {
      background: #1a365d;
      color: #90cdf4;
    }
  }

  /* Responsive */
  @media (max-width: 768px) {
    .drop-zone {
      padding: 1.5rem 1rem;
    }

    .upload-icon {
      font-size: 2.5rem;
    }

    .upload-text {
      font-size: 1rem;
    }

    .preview-grid {
      grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
      gap: 0.75rem;
    }
  }
</style>
