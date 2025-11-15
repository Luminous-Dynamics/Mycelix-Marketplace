/**
 * Global Keyboard Shortcuts System
 *
 * Provides a centralized system for managing keyboard shortcuts
 * across the application. Shortcuts are registered globally and
 * automatically cleaned up.
 *
 * Usage:
 * ```typescript
 * import { registerShortcuts } from '$lib/utils/keyboardShortcuts';
 *
 * onMount(() => {
 *   const cleanup = registerShortcuts();
 *   return cleanup;
 * });
 * ```
 */

import { goto } from '$app/navigation';

export interface ShortcutConfig {
  key: string;
  ctrl?: boolean;
  meta?: boolean;
  shift?: boolean;
  alt?: boolean;
  handler: (event: KeyboardEvent) => void;
  description: string;
  /** Prevent default browser behavior */
  preventDefault?: boolean;
}

/**
 * Register a single keyboard shortcut
 */
export function registerShortcut(config: ShortcutConfig): () => void {
  const handleKeydown = (e: KeyboardEvent) => {
    // Ignore shortcuts when typing in inputs, textareas, or contenteditable elements
    const target = e.target as HTMLElement;
    if (
      target.tagName === 'INPUT' ||
      target.tagName === 'TEXTAREA' ||
      target.isContentEditable
    ) {
      // Exception: Allow Escape key even in inputs
      if (e.key !== 'Escape') {
        return;
      }
    }

    const ctrlOrMeta = e.ctrlKey || e.metaKey;

    // Check if the key combination matches
    const keyMatches = e.key.toLowerCase() === config.key.toLowerCase();
    const ctrlMatches = config.ctrl ? ctrlOrMeta : !e.ctrlKey && !e.metaKey;
    const shiftMatches = config.shift ? e.shiftKey : !e.shiftKey;
    const altMatches = config.alt ? e.altKey : !e.altKey;

    if (keyMatches && ctrlMatches && shiftMatches && altMatches) {
      if (config.preventDefault !== false) {
        e.preventDefault();
      }
      config.handler(e);
    }
  };

  window.addEventListener('keydown', handleKeydown);
  return () => window.removeEventListener('keydown', handleKeydown);
}

/**
 * Register multiple keyboard shortcuts
 */
export function registerShortcuts(shortcuts?: ShortcutConfig[]): () => void {
  const defaultShortcuts = shortcuts || getDefaultShortcuts();
  const cleanupFunctions = defaultShortcuts.map(registerShortcut);

  return () => {
    cleanupFunctions.forEach((cleanup) => cleanup());
  };
}

/**
 * Get default global shortcuts
 */
export function getDefaultShortcuts(): ShortcutConfig[] {
  return [
    {
      key: 'Escape',
      handler: () => {
        // Close top-most modal/dialog
        const modals = document.querySelectorAll('[role="dialog"]');
        if (modals.length > 0) {
          const topModal = modals[modals.length - 1];
          const closeButton = topModal.querySelector('.modal-close, [aria-label="Close"]') as HTMLButtonElement;
          if (closeButton) {
            closeButton.click();
          } else {
            // If no close button, try clicking the backdrop
            const backdrop = topModal.closest('[role="presentation"]') as HTMLElement;
            if (backdrop) {
              backdrop.click();
            }
          }
        }
      },
      description: 'Close modal or dialog',
      preventDefault: false, // Let focusTrap handle Escape in modals
    },
    {
      key: '/',
      handler: (e) => {
        // Focus search input
        const searchInput = document.querySelector(
          'input[type="search"], input[placeholder*="Search" i], input[placeholder*="search" i]'
        ) as HTMLInputElement;

        if (searchInput) {
          searchInput.focus();
          searchInput.select();
        } else {
          // If no search input on current page, go to browse page
          goto('/browse');
        }
      },
      description: 'Focus search',
    },
    {
      key: '?',
      shift: true,
      handler: () => {
        // Show keyboard shortcuts help
        const shortcuts = getDefaultShortcuts();
        const shortcutList = shortcuts
          .map((s) => {
            const keys = [];
            if (s.ctrl) keys.push('Ctrl/Cmd');
            if (s.shift) keys.push('Shift');
            if (s.alt) keys.push('Alt');
            keys.push(s.key.toUpperCase());
            return `${keys.join('+')} - ${s.description}`;
          })
          .join('\n');

        alert(
          `Keyboard Shortcuts:\n\n${shortcutList}\n\nTip: Press / to quickly focus search, or ? to see this help again.`
        );
      },
      description: 'Show keyboard shortcuts help',
    },
    {
      key: 'k',
      ctrl: true,
      handler: () => {
        // Quick search - go to browse page and focus search
        goto('/browse').then(() => {
          setTimeout(() => {
            const searchInput = document.querySelector(
              'input[type="search"], input[placeholder*="Search" i], input[placeholder*="search" i]'
            ) as HTMLInputElement;
            if (searchInput) {
              searchInput.focus();
              searchInput.select();
            }
          }, 100);
        });
      },
      description: 'Quick search (go to browse)',
    },
    {
      key: 'h',
      ctrl: true,
      handler: () => {
        // Go to home page
        goto('/');
      },
      description: 'Go to home page',
    },
    {
      key: 'd',
      ctrl: true,
      handler: () => {
        // Go to dashboard
        goto('/dashboard');
      },
      description: 'Go to dashboard',
    },
    {
      key: 'b',
      ctrl: true,
      handler: () => {
        // Go to browse
        goto('/browse');
      },
      description: 'Go to browse marketplace',
    },
    {
      key: 'c',
      ctrl: true,
      shift: true,
      handler: () => {
        // Go to cart
        goto('/cart');
      },
      description: 'Go to cart',
    },
    {
      key: 't',
      ctrl: true,
      handler: () => {
        // Go to transactions
        goto('/transactions');
      },
      description: 'Go to transactions',
    },
  ];
}

/**
 * Format shortcut for display
 */
export function formatShortcut(config: ShortcutConfig): string {
  const keys = [];
  if (config.ctrl) keys.push('Ctrl/Cmd');
  if (config.shift) keys.push('Shift');
  if (config.alt) keys.push('Alt');
  keys.push(config.key.toUpperCase());
  return keys.join('+');
}

/**
 * Get all shortcuts as a formatted list for display
 */
export function getShortcutsList(): Array<{ keys: string; description: string }> {
  return getDefaultShortcuts().map((s) => ({
    keys: formatShortcut(s),
    description: s.description,
  }));
}
