# Phase 4.7 - Code Fixes Reference

## Quick Fix Reference with Code Snippets

---

## 1. Fix: lib/holochain/client.ts (Lines 20, 25, 30)

### BEFORE:
```typescript
const DEFAULT_WS_URL = 'ws://localhost:8888';
const MAX_RECONNECT_ATTEMPTS = 5;
const RECONNECT_DELAY = 1000;
```

### AFTER:
```typescript
import {
  DEFAULT_HOLOCHAIN_WS_URL as DEFAULT_WS_URL,
  HOLOCHAIN_MAX_RECONNECT_ATTEMPTS as MAX_RECONNECT_ATTEMPTS,
  HOLOCHAIN_RECONNECT_DELAY as RECONNECT_DELAY,
} from '$lib/config/constants';
```

---

## 2. Fix: lib/stores/cart.ts (Lines 14, 19)

### BEFORE:
```typescript
const TAX_RATE = 0.08;
const SHIPPING_COST = 5.99;
```

### AFTER:
```typescript
import { DEFAULT_TAX_RATE, DEFAULT_SHIPPING_COST } from '$lib/config/constants';

// Then replace usages:
export const tax = derived(subtotal, ($subtotal) => $subtotal * DEFAULT_TAX_RATE);
export const shipping = derived(cartItems, ($items) => ($items.length > 0 ? DEFAULT_SHIPPING_COST : 0));
```

---

## 3. Fix: lib/stores/holochain.ts (Line 47)

### BEFORE:
```typescript
const initialState: HolochainState = {
  client: null,
  status: 'disconnected',
  error: null,
  attempts: 0,
  lastAttempt: null,
  url: 'ws://localhost:8888',  // <-- HARDCODED
};
```

### AFTER:
```typescript
import { DEFAULT_HOLOCHAIN_WS_URL } from '$lib/config/constants';

const initialState: HolochainState = {
  client: null,
  status: 'disconnected',
  error: null,
  attempts: 0,
  lastAttempt: null,
  url: DEFAULT_HOLOCHAIN_WS_URL,  // <-- IMPORTED CONSTANT
};
```

---

## 4. Fix: lib/utils/validation.ts (Lines 8-24, 38)

### BEFORE:
```typescript
export const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/gif',
] as const;

export const MAX_FILE_SIZE = 5 * 1024 * 1024;
export const MAX_PHOTOS_PER_LISTING = 10;

// ... later in file:
export function isValidImageType(file: File): boolean {
  return ALLOWED_IMAGE_TYPES.includes(file.type as any);  // <-- BAD: as any
}
```

### AFTER:
```typescript
// Re-export from constants
export {
  ALLOWED_IMAGE_TYPES,
  MAX_FILE_SIZE,
  MAX_PHOTOS_PER_LISTING,
} from '$lib/config/constants';

// Fix type guard
export function isValidImageType(file: File): boolean {
  return (ALLOWED_IMAGE_TYPES as readonly string[]).includes(file.type);  // <-- GOOD: proper assertion
}
```

---

## 5. Fix: routes/checkout/+page.svelte (Line 88)

### BEFORE:
```typescript
    } catch (e: any) {
      error = e.message || 'Failed to load cart';
      notifications.error('Failed to load cart', error);
    }
```

### AFTER:
```typescript
import { handleError } from '$lib/utils/errors';

    } catch (e: unknown) {
      error = handleError(e, 'Checkout Load');
      notifications.error('Failed to load cart', error);
    }
```

---

## 6. Fix: routes/dashboard/+page.svelte (Line 57 + 68-78)

### BEFORE:
```typescript
    } catch (e: any) {
      error = e.message || 'Failed to load dashboard';
      notifications.error('Loading Failed', error);
    }
    
    // ... later:
    function formatDate(timestamp: number): string {
      const now = Date.now();
      const diff = now - timestamp;
      const days = Math.floor(diff / (24 * 60 * 60 * 1000));
      if (days === 0) return 'Today';
      if (days === 1) return 'Yesterday';
      if (days < 7) return `${days} days ago`;
      if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
      if (days < 365) return `${Math.floor(days / 30)} months ago`;
      return `${Math.floor(days / 365)} years ago`;
    }
```

### AFTER:
```typescript
import { handleError } from '$lib/utils/errors';
import { formatRelativeTime } from '$lib/utils/format';

    } catch (e: unknown) {
      error = handleError(e, 'Dashboard Load');
      notifications.error('Loading Failed', error);
    }
    
    // REMOVE the local formatDate function entirely
    // Use formatRelativeTime(timestamp) instead in the template
```

---

## 7. Fix: routes/transactions/+page.svelte (Line 99)

### BEFORE:
```typescript
    } catch (e: any) {
      error = e.message || 'Failed to load transactions';
```

### AFTER:
```typescript
import { handleError } from '$lib/utils/errors';

    } catch (e: unknown) {
      error = handleError(e, 'Transactions Load');
```

---

## 8. Fix: routes/listing/[listing_hash]/+page.svelte (Line 66)

### BEFORE:
```typescript
    } catch (e: any) {
      error = e.message || 'Failed to load listing';
      notifications.error('Loading Failed', error);
```

### AFTER:
```typescript
import { handleError } from '$lib/utils/errors';

    } catch (e: unknown) {
      error = handleError(e, 'Listing Load');
      notifications.error('Loading Failed', error);
```

---

## 9. Fix: routes/mrc-arbitration/+page.svelte (Line 93)

### BEFORE:
```typescript
    } catch (e: any) {
      error = e.message || 'Failed to load arbitration interface';
      notifications.error('Loading Failed', error);
```

### AFTER:
```typescript
import { handleError } from '$lib/utils/errors';

    } catch (e: unknown) {
      error = handleError(e, 'MRC Arbitration Load');
      notifications.error('Loading Failed', error);
```

---

## 10. Fix: routes/browse/+page.svelte (Line 37, 213, 225)

### BEFORE:
```typescript
  // UI state
  let viewMode: 'grid' | 'list' = 'grid';
  
  // State
  let loading = true;
  let error = '';
  let allListings: ListingWithTrust[] = [];
  let filteredListings: ListingWithTrust[] = [];

  // Filters
  let searchQuery = '';
  let selectedCategory: ListingCategory | 'All Categories' = 'All Categories';
  let minPrice = 0;
  let maxPrice = 10000;  // <-- HARDCODED
  let sortBy: 'newest' | 'price-low' | 'price-high' | 'trust' = 'newest';

  // ... later in HTML:
  <input type="range" min="0" max="10000" />  // <-- HARDCODED
```

### AFTER:
```typescript
import { MAX_LISTING_PRICE } from '$lib/config/constants';

  // Filters
  let searchQuery = '';
  let selectedCategory: ListingCategory | 'All Categories' = 'All Categories';
  let minPrice = 0;
  let maxPrice = MAX_LISTING_PRICE;  // <-- IMPORTED CONSTANT
  let sortBy: 'newest' | 'price-low' | 'price-high' | 'trust' = 'newest';

  // ... later in HTML:
  <input type="range" min="0" max={MAX_LISTING_PRICE} />  // <-- IMPORTED CONSTANT
```

---

## 11. Fix: routes/create-listing/+page.svelte (Line 141, 295)

### BEFORE:
```typescript
    if (price > 1000000) {  // <-- HARDCODED
      notifications.error('Validation Error', 'Price cannot exceed $1,000,000');
      return false;
    }
    
    // ... later in HTML:
    <input type="number" max="10000" />  // <-- HARDCODED
```

### AFTER:
```typescript
import { MAX_LISTING_PRICE } from '$lib/config/constants';

    if (price > MAX_LISTING_PRICE) {  // <-- IMPORTED CONSTANT
      notifications.error('Validation Error', `Price cannot exceed $${MAX_LISTING_PRICE}`);
      return false;
    }
    
    // ... later in HTML:
    <input type="number" max={MAX_LISTING_PRICE} />  // <-- IMPORTED CONSTANT
```

---

## 12. Fix: routes/cart/+page.svelte (Lines 60-62)

### BEFORE:
```typescript
  function formatCurrency(amount: number): string {
    return `$${amount.toFixed(2)}`;
  }
```

### AFTER:
```typescript
// REMOVE the local function and import instead:
import { formatPrice } from '$lib/utils/format';

// Then in the template, replace:
// {formatCurrency(amount)}
// with:
// {formatPrice(amount, 'USD')}
```

---

## Testing Checklist

After each fix:

- [ ] TypeScript compiler shows no errors: `tsc --noEmit`
- [ ] All imports are resolved correctly
- [ ] No unused imports
- [ ] Component renders without errors in browser
- [ ] Related tests pass: `npm test`

---

## Summary of Changes

| File | Changes | Priority |
|------|---------|----------|
| lib/holochain/client.ts | Import 3 constants, remove local defs | HIGH |
| lib/stores/cart.ts | Import 2 constants, update usages | HIGH |
| lib/stores/holochain.ts | Import 1 constant, replace hardcoded | HIGH |
| lib/utils/validation.ts | Import 3 constants, fix 1 type guard | HIGH |
| routes/checkout/+page.svelte | Fix catch type + import handleError | HIGH |
| routes/dashboard/+page.svelte | Fix catch type, remove formatDate | HIGH |
| routes/transactions/+page.svelte | Fix catch type + import handleError | HIGH |
| routes/listing/[listing_hash]/+page.svelte | Fix catch type + import handleError | HIGH |
| routes/mrc-arbitration/+page.svelte | Fix catch type + import handleError | HIGH |
| routes/browse/+page.svelte | Import constant, update 3 usages | MEDIUM |
| routes/create-listing/+page.svelte | Import constant, update 3 usages | MEDIUM |
| routes/cart/+page.svelte | Remove formatCurrency, use formatPrice | MEDIUM |

**Total Changes:** 12 files, ~50 individual code edits
**Estimated Time:** 2-3 hours (including testing)

