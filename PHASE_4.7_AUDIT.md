# Phase 4.7 - Frontend Code Quality Audit Checklist

## Summary
Complete audit of `/frontend/src/routes/` and `/frontend/src/lib/` directories for remaining code quality issues.

---

## 1. ERROR HANDLERS WITH `: any` TYPE (5 ISSUES)

### Issue 1.1
**File:** `/home/user/Mycelix-Marketplace/frontend/src/routes/checkout/+page.svelte`
**Line:** 88
**Current Code:** `catch (e: any)`
**Fix:** Replace with `catch (e: unknown)` and use type guard in error handling
**Priority:** HIGH

### Issue 1.2
**File:** `/home/user/Mycelix-Marketplace/frontend/src/routes/dashboard/+page.svelte`
**Line:** 57
**Current Code:** `catch (e: any)`
**Fix:** Replace with `catch (e: unknown)` and use type guard
**Priority:** HIGH

### Issue 1.3
**File:** `/home/user/Mycelix-Marketplace/frontend/src/routes/transactions/+page.svelte`
**Line:** 99
**Current Code:** `catch (e: any)`
**Fix:** Replace with `catch (e: unknown)` and use type guard
**Priority:** HIGH

### Issue 1.4
**File:** `/home/user/Mycelix-Marketplace/frontend/src/routes/listing/[listing_hash]/+page.svelte`
**Line:** 66
**Current Code:** `catch (e: any)`
**Fix:** Replace with `catch (e: unknown)` and use type guard
**Priority:** HIGH

### Issue 1.5
**File:** `/home/user/Mycelix-Marketplace/frontend/src/routes/mrc-arbitration/+page.svelte`
**Line:** 93
**Current Code:** `catch (e: any)`
**Fix:** Replace with `catch (e: unknown)` and use type guard
**Priority:** HIGH

---

## 2. HARDCODED IPFS URLS

**Status:** ✅ NO ISSUES FOUND
- IPFS URLs are properly centralized in `/home/user/Mycelix-Marketplace/frontend/src/lib/config/constants.ts`
- Lines 45, 50-55: IPFS_GATEWAYS and DEFAULT_IPFS_GATEWAY are properly defined

---

## 3. DUPLICATE formatDate FUNCTIONS (1 ISSUE)

### Issue 3.1
**File:** `/home/user/Mycelix-Marketplace/frontend/src/routes/dashboard/+page.svelte`
**Lines:** 68-78
**Current Code:**
```typescript
function formatDate(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;
  const days = Math.floor(diff / (24 * 60 * 60 * 1000));
  // ... more logic
}
```
**Problem:** Duplicate of `formatRelativeTime` from `/lib/utils/format.ts`
**Fix:** Import and use `formatRelativeTime` from `$lib/utils`
**Priority:** MEDIUM

---

## 4. HARDCODED VALUES THAT SHOULD USE CONSTANTS (12 ISSUES)

### Issue 4.1 - Duplicate Holochain Constants
**File:** `/home/user/Mycelix-Marketplace/frontend/src/lib/holochain/client.ts`
**Lines:** 20, 25, 30
**Current Code:**
```typescript
const DEFAULT_WS_URL = 'ws://localhost:8888';
const MAX_RECONNECT_ATTEMPTS = 5;
const RECONNECT_DELAY = 1000;
```
**Problem:** These duplicate constants from `/lib/config/constants.ts` (lines 16, 21, 26)
**Fix:** Import from constants:
```typescript
import { 
  DEFAULT_HOLOCHAIN_WS_URL as DEFAULT_WS_URL,
  HOLOCHAIN_MAX_RECONNECT_ATTEMPTS as MAX_RECONNECT_ATTEMPTS,
  HOLOCHAIN_RECONNECT_DELAY as RECONNECT_DELAY
} from '$lib/config/constants';
```
**Priority:** HIGH

### Issue 4.2 - Duplicate Store Constants
**File:** `/home/user/Mycelix-Marketplace/frontend/src/lib/stores/cart.ts`
**Lines:** 14, 19
**Current Code:**
```typescript
const TAX_RATE = 0.08;
const SHIPPING_COST = 5.99;
```
**Problem:** These duplicate constants from `/lib/config/constants.ts` (lines 90, 96)
**Fix:** Import from constants:
```typescript
import { DEFAULT_TAX_RATE, DEFAULT_SHIPPING_COST } from '$lib/config/constants';
```
**Priority:** HIGH

### Issue 4.3 - Hardcoded WebSocket URL
**File:** `/home/user/Mycelix-Marketplace/frontend/src/lib/stores/holochain.ts`
**Line:** 47
**Current Code:**
```typescript
url: 'ws://localhost:8888',
```
**Problem:** Hardcoded URL should use constant
**Fix:** Import and use `DEFAULT_HOLOCHAIN_WS_URL`:
```typescript
import { DEFAULT_HOLOCHAIN_WS_URL } from '$lib/config/constants';
// ...
url: DEFAULT_HOLOCHAIN_WS_URL,
```
**Priority:** HIGH

### Issue 4.4 - Duplicate Validation Constants
**File:** `/home/user/Mycelix-Marketplace/frontend/src/lib/utils/validation.ts`
**Lines:** 8-24
**Current Code:**
```typescript
export const ALLOWED_IMAGE_TYPES = [
  'image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif',
] as const;
export const MAX_FILE_SIZE = 5 * 1024 * 1024;
export const MAX_PHOTOS_PER_LISTING = 10;
```
**Problem:** These duplicate constants from `/lib/config/constants.ts` (lines 74-80, 64, 69)
**Fix:** Import from constants and re-export for backward compatibility:
```typescript
export {
  ALLOWED_IMAGE_TYPES,
  MAX_FILE_SIZE,
  MAX_PHOTOS_PER_LISTING
} from '$lib/config/constants';
```
**Priority:** HIGH

### Issue 4.5 - Hardcoded Max Price in Browse
**File:** `/home/user/Mycelix-Marketplace/frontend/src/routes/browse/+page.svelte`
**Line:** 37
**Current Code:**
```typescript
let maxPrice = 10000;
```
**Problem:** Hardcoded value should use constant
**Fix:** Import and use constant:
```typescript
import { MAX_LISTING_PRICE } from '$lib/config/constants';
// ...
let maxPrice = MAX_LISTING_PRICE;
```
Also update HTML max attributes on lines 213, 225
**Priority:** MEDIUM

### Issue 4.6 - Hardcoded Price Validation
**File:** `/home/user/Mycelix-Marketplace/frontend/src/routes/create-listing/+page.svelte`
**Line:** 141
**Current Code:**
```typescript
if (price > 1000000) {
```
**Problem:** Hardcoded value should use constant
**Fix:** Import and use constant:
```typescript
import { MAX_LISTING_PRICE } from '$lib/config/constants';
// ...
if (price > MAX_LISTING_PRICE) {
```
Also update HTML max attribute on line 295
**Priority:** MEDIUM

### Issue 4.7 - Duplicate Currency Formatter
**File:** `/home/user/Mycelix-Marketplace/frontend/src/routes/cart/+page.svelte`
**Lines:** 60-62
**Current Code:**
```typescript
function formatCurrency(amount: number): string {
  return `$${amount.toFixed(2)}`;
}
```
**Problem:** Duplicate of `formatPrice` from `/lib/utils/format.ts`
**Fix:** Import and use `formatPrice`:
```typescript
import { formatPrice } from '$lib/utils';
// ... then use formatPrice(amount, 'USD')
```
**Priority:** MEDIUM

---

## 5. OTHER CODE QUALITY ISSUES

### Issue 5.1 - Missing Type Guard in Validation
**File:** `/home/user/Mycelix-Marketplace/frontend/src/lib/utils/validation.ts`
**Line:** 38
**Current Code:**
```typescript
export function isValidImageType(file: File): boolean {
  return ALLOWED_IMAGE_TYPES.includes(file.type as any);
}
```
**Problem:** Uses `as any` to work around type checking
**Fix:** Proper type assertion:
```typescript
return (ALLOWED_IMAGE_TYPES as readonly string[]).includes(file.type);
```
**Priority:** LOW

---

## Phase 4.7 Completion Checklist

- [ ] Fix all 5 error handler `catch (e: any)` statements → use `catch (e: unknown)`
- [ ] Remove duplicate Holochain constants in `/lib/holochain/client.ts`
- [ ] Remove duplicate cart constants in `/lib/stores/cart.ts`
- [ ] Fix hardcoded WebSocket URL in `/lib/stores/holochain.ts`
- [ ] Refactor validation constants - import from constants.ts
- [ ] Update browse page max price to use constant
- [ ] Update create-listing price validation to use constant
- [ ] Replace local formatCurrency with formatPrice
- [ ] Remove duplicate formatDate in dashboard
- [ ] Fix type guard in validation.ts isValidImageType
- [ ] Run TypeScript compiler to verify all fixes
- [ ] Run tests to ensure no regressions
- [ ] Update imports in affected components

---

## Summary Statistics

| Category | Count | Priority |
|----------|-------|----------|
| Any type errors | 5 | HIGH |
| Duplicate constants | 12 | HIGH/MEDIUM |
| Duplicate functions | 2 | MEDIUM |
| Type guard issues | 1 | LOW |
| **TOTAL ISSUES** | **20** | — |

---

## Files to Modify (Priority Order)

1. `/frontend/src/lib/holochain/client.ts` - Remove duplicate constants
2. `/frontend/src/lib/stores/cart.ts` - Remove duplicate constants
3. `/frontend/src/lib/stores/holochain.ts` - Fix hardcoded URL
4. `/frontend/src/lib/utils/validation.ts` - Import constants instead of duplicating
5. `/frontend/src/routes/checkout/+page.svelte` - Fix any type
6. `/frontend/src/routes/dashboard/+page.svelte` - Fix any type + remove formatDate
7. `/frontend/src/routes/transactions/+page.svelte` - Fix any type
8. `/frontend/src/routes/listing/[listing_hash]/+page.svelte` - Fix any type
9. `/frontend/src/routes/mrc-arbitration/+page.svelte` - Fix any type
10. `/frontend/src/routes/browse/+page.svelte` - Use MAX_LISTING_PRICE constant
11. `/frontend/src/routes/create-listing/+page.svelte` - Use MAX_LISTING_PRICE constant
12. `/frontend/src/routes/cart/+page.svelte` - Use formatPrice function

