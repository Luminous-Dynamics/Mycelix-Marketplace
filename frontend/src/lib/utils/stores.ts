/**
 * Svelte Store Utilities
 *
 * Reusable store patterns for common use cases like filtering, sorting,
 * pagination, and search. Optimized with memoization to prevent unnecessary
 * recalculations.
 *
 * @example
 * ```typescript
 * import { createFilterStore } from '$lib/utils/stores';
 *
 * const items = writable([...]);
 * const filters = writable({ search: '', category: 'all' });
 *
 * const filteredItems = createFilterStore(items, filters, (item, filters) => {
 *   if (filters.search && !item.title.includes(filters.search)) return false;
 *   if (filters.category !== 'all' && item.category !== filters.category) return false;
 *   return true;
 * });
 * ```
 */

import { derived, writable, type Readable, type Writable } from 'svelte/store';

/**
 * Filter function type
 */
export type FilterFn<T, F> = (item: T, filters: F) => boolean;

/**
 * Sort function type
 */
export type SortFn<T> = (a: T, b: T) => number;

/**
 * Create a filtered store from items and filters
 */
export function createFilterStore<T, F>(
  items: Readable<T[]>,
  filters: Readable<F>,
  filterFn: FilterFn<T, F>
): Readable<T[]> {
  return derived([items, filters], ([$items, $filters]) => {
    return $items.filter((item) => filterFn(item, $filters));
  });
}

/**
 * Create a sorted store from items
 */
export function createSortStore<T>(
  items: Readable<T[]>,
  sortFn: Readable<SortFn<T>>
): Readable<T[]> {
  return derived([items, sortFn], ([$items, $sortFn]) => {
    return [...$items].sort($sortFn);
  });
}

/**
 * Create a paginated store from items
 */
export interface PaginationConfig {
  page: number;
  pageSize: number;
}

export interface PaginatedResult<T> {
  items: T[];
  page: number;
  pageSize: number;
  totalPages: number;
  totalItems: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export function createPaginationStore<T>(
  items: Readable<T[]>,
  config: Readable<PaginationConfig>
): Readable<PaginatedResult<T>> {
  return derived([items, config], ([$items, $config]) => {
    const { page, pageSize } = $config;
    const totalItems = $items.length;
    const totalPages = Math.ceil(totalItems / pageSize);
    const start = (page - 1) * pageSize;
    const end = start + pageSize;

    return {
      items: $items.slice(start, end),
      page,
      pageSize,
      totalPages,
      totalItems,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
    };
  });
}

/**
 * Create a search store with debouncing
 */
export function createSearchStore<T>(
  items: Readable<T[]>,
  searchQuery: Readable<string>,
  searchFields: (keyof T)[],
  debounceMs: number = 300
): Readable<T[]> {
  // Create a debounced query store
  let timeoutId: ReturnType<typeof setTimeout>;
  const debouncedQuery = writable('');

  searchQuery.subscribe((query) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      debouncedQuery.set(query);
    }, debounceMs);
  });

  return derived([items, debouncedQuery], ([$items, $query]) => {
    if (!$query.trim()) return $items;

    const lowerQuery = $query.toLowerCase();

    return $items.filter((item) => {
      return searchFields.some((field) => {
        const value = item[field];
        if (value === null || value === undefined) return false;
        return String(value).toLowerCase().includes(lowerQuery);
      });
    });
  });
}

/**
 * Create a comprehensive list store with filtering, sorting, search, and pagination
 */
export interface ListConfig<T, F> {
  filters: F;
  sortBy: keyof T | null;
  sortDirection: 'asc' | 'desc';
  searchQuery: string;
  searchFields: (keyof T)[];
  page: number;
  pageSize: number;
}

export function createListStore<T, F>(
  items: Writable<T[]>,
  initialConfig: ListConfig<T, F>,
  filterFn: FilterFn<T, F>
) {
  // Config store
  const config = writable<ListConfig<T, F>>(initialConfig);

  // Filtered items
  const filteredItems = derived([items, config], ([$items, $config]) => {
    // Apply filters
    let filtered = $items.filter((item) => filterFn(item, $config.filters));

    // Apply search
    if ($config.searchQuery.trim()) {
      const lowerQuery = $config.searchQuery.toLowerCase();
      filtered = filtered.filter((item) => {
        return $config.searchFields.some((field) => {
          const value = item[field];
          if (value === null || value === undefined) return false;
          return String(value).toLowerCase().includes(lowerQuery);
        });
      });
    }

    return filtered;
  });

  // Sorted items
  const sortedItems = derived([filteredItems, config], ([$filtered, $config]) => {
    if (!$config.sortBy) return $filtered;

    const sorted = [...$filtered].sort((a, b) => {
      const aVal = a[$config.sortBy!];
      const bVal = b[$config.sortBy!];

      let comparison = 0;

      if (aVal < bVal) comparison = -1;
      if (aVal > bVal) comparison = 1;

      return $config.sortDirection === 'asc' ? comparison : -comparison;
    });

    return sorted;
  });

  // Paginated items
  const paginatedItems = derived([sortedItems, config], ([$sorted, $config]) => {
    const { page, pageSize } = $config;
    const totalItems = $sorted.length;
    const totalPages = Math.ceil(totalItems / pageSize);
    const start = (page - 1) * pageSize;
    const end = start + pageSize;

    return {
      items: $sorted.slice(start, end),
      page,
      pageSize,
      totalPages,
      totalItems,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
    };
  });

  // Helper methods
  function setFilters(filters: F) {
    config.update((c) => ({ ...c, filters, page: 1 })); // Reset to page 1
  }

  function setSearch(searchQuery: string) {
    config.update((c) => ({ ...c, searchQuery, page: 1 }));
  }

  function setSort(sortBy: keyof T, sortDirection: 'asc' | 'desc' = 'asc') {
    config.update((c) => ({ ...c, sortBy, sortDirection }));
  }

  function toggleSortDirection() {
    config.update((c) => ({
      ...c,
      sortDirection: c.sortDirection === 'asc' ? 'desc' : 'asc',
    }));
  }

  function setPage(page: number) {
    config.update((c) => ({ ...c, page }));
  }

  function nextPage() {
    config.update((c) => ({ ...c, page: c.page + 1 }));
  }

  function previousPage() {
    config.update((c) => ({ ...c, page: Math.max(1, c.page - 1) }));
  }

  function setPageSize(pageSize: number) {
    config.update((c) => ({ ...c, pageSize, page: 1 }));
  }

  function reset() {
    config.set(initialConfig);
  }

  return {
    // Stores
    items,
    config,
    filteredItems,
    sortedItems,
    paginatedItems,

    // Methods
    setFilters,
    setSearch,
    setSort,
    toggleSortDirection,
    setPage,
    nextPage,
    previousPage,
    setPageSize,
    reset,
  };
}

/**
 * Create a loading store with automatic timeout
 */
export function createLoadingStore(timeoutMs: number = 30000) {
  const { subscribe, set } = writable(false);
  let timeoutId: ReturnType<typeof setTimeout>;

  function start() {
    set(true);

    // Auto-clear after timeout to prevent stuck loading states
    timeoutId = setTimeout(() => {
      console.warn('Loading timeout reached');
      set(false);
    }, timeoutMs);
  }

  function stop() {
    clearTimeout(timeoutId);
    set(false);
  }

  return {
    subscribe,
    start,
    stop,
  };
}

/**
 * Create a toggle store with persistence
 */
export function createToggleStore(
  initialValue: boolean = false,
  storageKey?: string
) {
  // Load from localStorage if key provided
  const stored = storageKey
    ? typeof window !== 'undefined'
      ? localStorage.getItem(storageKey)
      : null
    : null;

  const initialVal = stored !== null ? stored === 'true' : initialValue;
  const { subscribe, set, update } = writable(initialVal);

  function toggle() {
    update((v) => {
      const newVal = !v;

      // Persist to localStorage if key provided
      if (storageKey && typeof window !== 'undefined') {
        localStorage.setItem(storageKey, String(newVal));
      }

      return newVal;
    });
  }

  function setToggle(value: boolean) {
    set(value);

    // Persist to localStorage if key provided
    if (storageKey && typeof window !== 'undefined') {
      localStorage.setItem(storageKey, String(value));
    }
  }

  return {
    subscribe,
    toggle,
    set: setToggle,
  };
}

/**
 * Create a cached store that persists to localStorage
 */
export function createCachedStore<T>(
  key: string,
  initialValue: T,
  expirationMs?: number
) {
  // Load from localStorage
  const stored =
    typeof window !== 'undefined' ? localStorage.getItem(key) : null;

  let cachedValue: T = initialValue;
  let timestamp: number | null = null;

  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      cachedValue = parsed.value;
      timestamp = parsed.timestamp;

      // Check expiration
      if (
        expirationMs &&
        timestamp &&
        Date.now() - timestamp > expirationMs
      ) {
        cachedValue = initialValue;
        timestamp = null;
      }
    } catch (e) {
      console.error('Failed to parse cached store:', e);
    }
  }

  const { subscribe, set, update } = writable(cachedValue);

  function setAndCache(value: T) {
    set(value);

    if (typeof window !== 'undefined') {
      const data = {
        value,
        timestamp: Date.now(),
      };
      localStorage.setItem(key, JSON.stringify(data));
    }
  }

  function updateAndCache(updater: (value: T) => T) {
    update((v) => {
      const newValue = updater(v);

      if (typeof window !== 'undefined') {
        const data = {
          value: newValue,
          timestamp: Date.now(),
        };
        localStorage.setItem(key, JSON.stringify(data));
      }

      return newValue;
    });
  }

  function clear() {
    set(initialValue);

    if (typeof window !== 'undefined') {
      localStorage.removeItem(key);
    }
  }

  return {
    subscribe,
    set: setAndCache,
    update: updateAndCache,
    clear,
  };
}

/**
 * Create a debounced store
 */
export function createDebouncedStore<T>(
  initialValue: T,
  delayMs: number = 300
): Writable<T> {
  const { subscribe, set } = writable(initialValue);
  let timeoutId: ReturnType<typeof setTimeout>;

  function debouncedSet(value: T) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      set(value);
    }, delayMs);
  }

  function immediateSet(value: T) {
    clearTimeout(timeoutId);
    set(value);
  }

  return {
    subscribe,
    set: debouncedSet,
    update: (updater) => {
      // For update, we need to get current value first
      // This is a simplified implementation
      subscribe((currentValue) => {
        debouncedSet(updater(currentValue));
      })();
    },
  };
}
