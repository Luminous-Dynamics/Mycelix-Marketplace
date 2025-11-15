/**
 * Modal Utilities
 *
 * Utilities for modal state management, focus trapping, and accessibility.
 * Provides Svelte actions and store creators for managing modal dialogs.
 *
 * @example
 * ```svelte
 * <script>
 *   import { createModalStore, focusTrap } from '$lib/utils/modal';
 *
 *   const modal = createModalStore();
 * </script>
 *
 * {#if $modal}
 *   <div class="modal" use:focusTrap>
 *     <h2>Modal Title</h2>
 *     <button on:click={modal.close}>Close</button>
 *   </div>
 * {/if}
 * ```
 */

import { writable } from 'svelte/store';

/**
 * Create a modal store
 */
export function createModalStore(initialState: boolean = false) {
  const { subscribe, set, update } = writable(initialState);

  function open() {
    set(true);
  }

  function close() {
    set(false);
  }

  function toggle() {
    update((state) => !state);
  }

  return {
    subscribe,
    open,
    close,
    toggle,
  };
}

/**
 * Get all focusable elements within a container
 */
function getFocusableElements(container: HTMLElement): HTMLElement[] {
  const focusableSelectors = [
    'a[href]',
    'area[href]',
    'input:not([disabled]):not([type="hidden"])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    'button:not([disabled])',
    '[tabindex]:not([tabindex="-1"])',
    'audio[controls]',
    'video[controls]',
    '[contenteditable]:not([contenteditable="false"])',
  ].join(',');

  return Array.from(container.querySelectorAll(focusableSelectors)).filter(
    (el) => {
      // Check if element is visible
      const element = el as HTMLElement;
      return (
        element.offsetWidth > 0 ||
        element.offsetHeight > 0 ||
        element.getClientRects().length > 0
      );
    }
  ) as HTMLElement[];
}

/**
 * Focus Trap Svelte Action
 *
 * Traps focus within a modal dialog for accessibility.
 * Handles Tab/Shift+Tab navigation and Escape key to close.
 *
 * @example
 * ```svelte
 * <div class="modal" use:focusTrap={{ onEscape: closeModal }}>
 *   <h2>Modal</h2>
 *   <button>Close</button>
 * </div>
 * ```
 */
export function focusTrap(
  node: HTMLElement,
  options?: {
    onEscape?: () => void;
    initialFocus?: 'first' | 'last' | HTMLElement;
    returnFocus?: boolean;
  }
) {
  const { onEscape, initialFocus = 'first', returnFocus = true } = options || {};

  // Store the element that had focus before the trap was activated
  const previouslyFocused = document.activeElement as HTMLElement;

  // Get all focusable elements
  let focusableElements = getFocusableElements(node);

  // Focus the initial element
  if (focusableElements.length > 0) {
    if (initialFocus === 'first') {
      focusableElements[0]?.focus();
    } else if (initialFocus === 'last') {
      focusableElements[focusableElements.length - 1]?.focus();
    } else if (initialFocus instanceof HTMLElement) {
      initialFocus.focus();
    }
  }

  /**
   * Handle keyboard events
   */
  function handleKeydown(e: KeyboardEvent) {
    // Update focusable elements in case DOM changed
    focusableElements = getFocusableElements(node);

    if (focusableElements.length === 0) return;

    const firstFocusable = focusableElements[0];
    const lastFocusable = focusableElements[focusableElements.length - 1];

    // Handle Escape key
    if (e.key === 'Escape' && onEscape) {
      e.preventDefault();
      onEscape();
      return;
    }

    // Handle Tab key
    if (e.key === 'Tab') {
      // Shift + Tab (backwards)
      if (e.shiftKey) {
        if (document.activeElement === firstFocusable) {
          e.preventDefault();
          lastFocusable.focus();
        }
      }
      // Tab (forwards)
      else {
        if (document.activeElement === lastFocusable) {
          e.preventDefault();
          firstFocusable.focus();
        }
      }
    }
  }

  // Add event listener
  node.addEventListener('keydown', handleKeydown);

  // Cleanup
  return {
    destroy() {
      node.removeEventListener('keydown', handleKeydown);

      // Return focus to previously focused element
      if (returnFocus && previouslyFocused) {
        previouslyFocused.focus();
      }
    },
  };
}

/**
 * Body Scroll Lock Svelte Action
 *
 * Prevents body scrolling when a modal is open.
 * Useful for preventing background scroll on mobile.
 *
 * @example
 * ```svelte
 * <div class="modal" use:bodyScrollLock>
 *   ...
 * </div>
 * ```
 */
export function bodyScrollLock(node: HTMLElement) {
  // Store original body overflow
  const originalOverflow = document.body.style.overflow;
  const originalPaddingRight = document.body.style.paddingRight;

  // Get scrollbar width
  const scrollbarWidth =
    window.innerWidth - document.documentElement.clientWidth;

  // Lock body scroll
  document.body.style.overflow = 'hidden';

  // Add padding to prevent layout shift from scrollbar removal
  if (scrollbarWidth > 0) {
    document.body.style.paddingRight = `${scrollbarWidth}px`;
  }

  return {
    destroy() {
      // Restore original styles
      document.body.style.overflow = originalOverflow;
      document.body.style.paddingRight = originalPaddingRight;
    },
  };
}

/**
 * Click Outside Svelte Action
 *
 * Detects clicks outside an element and calls a callback.
 * Useful for closing modals, dropdowns, etc.
 *
 * @example
 * ```svelte
 * <div class="modal" use:clickOutside={{ callback: closeModal }}>
 *   ...
 * </div>
 * ```
 */
export function clickOutside(
  node: HTMLElement,
  options: {
    callback: () => void;
    enabled?: boolean;
  }
) {
  const { callback, enabled = true } = options;

  function handleClick(event: MouseEvent) {
    if (!enabled) return;

    // Check if click was outside the node
    if (node && !node.contains(event.target as Node)) {
      callback();
    }
  }

  // Add event listener with a slight delay to avoid immediate trigger
  setTimeout(() => {
    document.addEventListener('click', handleClick, true);
  }, 0);

  return {
    update(newOptions: { callback: () => void; enabled?: boolean }) {
      callback = newOptions.callback;
      enabled = newOptions.enabled ?? true;
    },
    destroy() {
      document.removeEventListener('click', handleClick, true);
    },
  };
}

/**
 * Portal Svelte Action
 *
 * Renders content in a different part of the DOM (usually body).
 * Useful for modals to escape stacking context issues.
 *
 * @example
 * ```svelte
 * <div use:portal>
 *   <div class="modal">...</div>
 * </div>
 * ```
 */
export function portal(node: HTMLElement, target: HTMLElement | string = 'body') {
  let targetElement: HTMLElement | null = null;

  // Get target element
  if (typeof target === 'string') {
    targetElement = document.querySelector(target);
  } else {
    targetElement = target;
  }

  if (!targetElement) {
    console.error('Portal target not found:', target);
    return {};
  }

  // Move node to target
  targetElement.appendChild(node);

  return {
    destroy() {
      // Remove node from target when destroyed
      if (node.parentNode === targetElement) {
        targetElement!.removeChild(node);
      }
    },
  };
}

/**
 * Transition with focus management
 *
 * Returns the previously focused element when transitioning out.
 * Useful for restoring focus after modal close.
 */
export function saveFocus() {
  return document.activeElement as HTMLElement;
}

export function restoreFocus(element: HTMLElement | null) {
  if (element && element.focus) {
    element.focus();
  }
}

/**
 * ARIA modal attributes helper
 *
 * Returns proper ARIA attributes for modal dialogs.
 */
export function getModalAriaAttrs(options: {
  labelledBy?: string;
  describedBy?: string;
}) {
  return {
    role: 'dialog',
    'aria-modal': 'true',
    'aria-labelledby': options.labelledBy,
    'aria-describedby': options.describedBy,
  };
}
