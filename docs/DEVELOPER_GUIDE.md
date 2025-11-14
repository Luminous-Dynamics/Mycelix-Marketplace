# Mycelix Marketplace - Developer Guide

Complete guide for developers working on the Mycelix Marketplace project.

---

## Table of Contents

1. [Getting Started](#getting-started)
2. [Project Structure](#project-structure)
3. [Development Workflow](#development-workflow)
4. [Architecture](#architecture)
5. [Utilities & Helpers](#utilities--helpers)
6. [Components](#components)
7. [State Management](#state-management)
8. [Type System](#type-system)
9. [Best Practices](#best-practices)
10. [Troubleshooting](#troubleshooting)

---

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Holochain conductor running locally
- (Optional) Pinata account for IPFS uploads

### Installation

```bash
cd frontend
npm install
```

### Environment Setup

1. Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```

2. Configure your environment variables:
```env
VITE_HOLOCHAIN_WS_URL=ws://localhost:8888
VITE_PINATA_JWT=your_jwt_token
VITE_PINATA_GATEWAY=https://gateway.pinata.cloud
```

### Running the Development Server

```bash
npm run dev
```

The app will be available at `http://localhost:5173`

---

## Project Structure

```
frontend/
├── src/
│   ├── lib/
│   │   ├── components/        # Reusable UI components
│   │   │   ├── ErrorBoundary.svelte
│   │   │   ├── LoadingState.svelte
│   │   │   ├── ConfirmDialog.svelte
│   │   │   ├── FormInput.svelte
│   │   │   ├── PhotoGallery.svelte
│   │   │   └── TrustBadge.svelte
│   │   ├── config/            # Configuration constants
│   │   │   └── constants.ts
│   │   ├── holochain/         # Holochain integration
│   │   │   ├── client.ts
│   │   │   ├── listings.ts
│   │   │   ├── transactions.ts
│   │   │   ├── disputes.ts
│   │   │   ├── users.ts
│   │   │   └── index.ts
│   │   ├── ipfs/              # IPFS/Pinata integration
│   │   │   └── ipfsClient.ts
│   │   ├── stores/            # Svelte stores (state)
│   │   │   ├── auth.ts
│   │   │   ├── cart.ts
│   │   │   ├── holochain.ts
│   │   │   ├── notifications.ts
│   │   │   └── index.ts
│   │   ├── types/             # TypeScript types & guards
│   │   │   ├── api.ts
│   │   │   └── guards.ts
│   │   └── utils/             # Utility functions
│   │       ├── debounce.ts
│   │       ├── validation.ts
│   │       ├── errors.ts
│   │       ├── format.ts
│   │       ├── pageHelpers.ts
│   │       └── index.ts
│   ├── routes/                # SvelteKit pages
│   │   ├── +page.svelte
│   │   ├── browse/
│   │   ├── listing/[hash]/
│   │   ├── cart/
│   │   ├── checkout/
│   │   └── ...
│   └── types/                 # Type definitions
│       ├── index.ts
│       ├── listing.ts
│       ├── transaction.ts
│       ├── user.ts
│       ├── dispute.ts
│       └── cart.ts
├── static/                    # Static assets
├── package.json
├── svelte.config.js
├── tsconfig.json
└── vite.config.ts
```

---

## Development Workflow

### 1. Type-Safe Development

Always use proper TypeScript types:

```typescript
// Good ✓
import type { Listing } from '$types';

async function getListing(hash: string): Promise<Listing> {
  const client = await initHolochainClient();
  return await callZome<Listing>(client, 'listings', 'get', { hash });
}

// Bad ✗
async function getListing(hash: any): Promise<any> {
  // ...
}
```

### 2. Using Utilities

Import from centralized locations:

```typescript
// Good ✓
import { debounce, validateImageFile, formatPrice } from '$lib/utils';

// Bad ✗
import { debounce } from '$lib/utils/debounce';
import { validateImageFile } from '$lib/utils/validation';
```

### 3. Error Handling

Use custom error types:

```typescript
import { HolochainError, handleError } from '$lib/utils';

try {
  const result = await callZome(client, 'listings', 'get', { hash });
} catch (error) {
  const message = handleError(error, 'ListingPage');
  notifications.error('Failed to Load', message);
}
```

### 4. State Management

Use reactive stores:

```typescript
import { auth, isValidSession } from '$lib/stores';

// Reactive subscription
$: if (!$isValidSession) {
  goto('/login');
}
```

---

## Architecture

### Holochain Integration

**Connection Management**:
```typescript
import { initHolochainClient } from '$lib/holochain';

// Initialize once per page
const client = await initHolochainClient();
```

**Making Zome Calls**:
```typescript
import { callZome } from '$lib/holochain/client';
import type { Listing } from '$types';

// Type-safe zome call
const listings = await callZome<Listing[], {}>( client, 'listings', 'get_all', {}
);
```

### IPFS Integration

```typescript
import { uploadFile, getIpfsUrl } from '$lib/ipfs/ipfsClient';

// Upload file
const cid = await uploadFile(file);

// Get URL
const url = getIpfsUrl(cid);
```

---

## Utilities & Helpers

### Debouncing

```typescript
import { debounce } from '$lib/utils';

const debouncedSearch = debounce(performSearch, 300);

$: searchQuery, debouncedSearch();
```

### Validation

```typescript
import { validateImageFile, isValidEmail } from '$lib/utils';

// File validation
const result = validateImageFile(file);
if (!result.valid) {
  alert(result.error);
}

// Email validation
if (!isValidEmail(email)) {
  // Show error
}
```

### Formatting

```typescript
import { formatPrice, formatDate, formatRelativeTime } from '$lib/utils';

const price = formatPrice(99.99); // "$99.99"
const date = formatDate(new Date()); // "Jan 15, 2025"
const relative = formatRelativeTime(timestamp); // "2 hours ago"
```

### Page Helpers

```typescript
import {
  formatTimestamp,
  formatTrustScore,
  getTransactionStatusText,
  getCategoryEmoji
} from '$lib/utils';

const formattedDate = formatTimestamp(listing.created_at, 'relative');
const trustScore = formatTrustScore(85); // "85%"
const status = getTransactionStatusText('shipped'); // "Shipped"
const emoji = getCategoryEmoji('Electronics'); // "💻"
```

---

## Components

### ErrorBoundary

Wrap components that may throw errors:

```svelte
<script>
  import ErrorBoundary from '$lib/components/ErrorBoundary.svelte';

  async function loadData() {
    // Retry logic
  }
</script>

<ErrorBoundary showDetails={true} onRetry={loadData}>
  <MyComponent />
</ErrorBoundary>
```

### LoadingState

Display loading spinners:

```svelte
<script>
  import LoadingState from '$lib/components/LoadingState.svelte';
</script>

{#if loading}
  <LoadingState message="Loading listings..." size="medium" />
{:else}
  <!-- Content -->
{/if}
```

### ConfirmDialog

Confirm destructive actions:

```svelte
<script>
  import ConfirmDialog from '$lib/components/ConfirmDialog.svelte';

  let showDialog = false;

  function handleDelete() {
    // Perform deletion
    showDialog = false;
  }
</script>

<ConfirmDialog
  bind:open={showDialog}
  title="Delete Item"
  message="Are you sure?"
  variant="danger"
  on:confirm={handleDelete}
  on:cancel={() => showDialog = false}
/>
```

### FormInput

Reusable form input with validation:

```svelte
<script>
  import FormInput from '$lib/components/FormInput.svelte';

  let email = '';
  let emailError = '';

  function validateEmail() {
    if (!isValidEmail(email)) {
      emailError = 'Invalid email address';
    } else {
      emailError = '';
    }
  }
</script>

<FormInput
  label="Email"
  type="email"
  bind:value={email}
  error={emailError}
  required
  on:blur={validateEmail}
/>
```

---

## State Management

### Auth Store

```typescript
import { auth, isValidSession, isTokenExpired } from '$lib/stores';

// Login
auth.login(userProfile, token, 24); // 24 hour expiry

// Logout
auth.logout();

// Check session
$: if ($isValidSession) {
  // User is authenticated with valid token
}
```

### Cart Store

```typescript
import { cart } from '$lib/stores';

// Add item
cart.addItem(listing);

// Update quantity
cart.updateQuantity(itemId, 3);

// Remove item
cart.removeItem(itemId);

// Reactive values
$: totalItems = $cart.items.length;
$: subtotal = $cart.subtotal;
$: total = $cart.total;
```

### Notifications Store

```typescript
import { notifications } from '$lib/stores';

notifications.success('Success!', 'Item added to cart');
notifications.error('Error', 'Failed to load listing');
notifications.info('Info', 'Processing...');
notifications.warning('Warning', 'Low stock');
```

---

## Type System

### Type Guards

Use type guards for runtime validation:

```typescript
import { isListing, isTransaction, isValidIPFSCID } from '$types';

// Validate API response
const response = await fetch('/api/listings');
const data = await response.json();

if (isListing(data)) {
  // TypeScript knows data is Listing
  console.log(data.title);
}

// Validate IPFS CID
if (isValidIPFSCID(cid)) {
  const url = getIpfsUrl(cid);
}
```

### API Response Types

```typescript
import type { ApiResponse, ApiError } from '$types';

async function fetchData(): Promise<ApiResponse<Listing>> {
  try {
    const data = await callZome<Listing>(client, 'listings', 'get', { hash });
    return {
      success: true,
      data,
    };
  } catch (error) {
    return {
      success: false,
      error: {
        message: error.message,
      },
    };
  }
}
```

---

## Best Practices

### 1. **Always Use Type Guards for External Data**

```typescript
// API response
const response = await fetch('/api/listings');
const data = await response.json();

if (isListingArray(data)) {
  // Safe to use
  listings = data;
} else {
  throw new ValidationError('Invalid response format');
}
```

### 2. **Centralize Configuration**

```typescript
// Good ✓
import { MAX_FILE_SIZE, ALLOWED_IMAGE_TYPES } from '$lib/config/constants';

// Bad ✗
const MAX_FILE_SIZE = 5 * 1024 * 1024; // Duplicated everywhere
```

### 3. **Use Derived Stores for Computed Values**

```typescript
// Good ✓
export const total = derived(cart, ($cart) =>
  $cart.subtotal + $cart.tax + $cart.shipping
);

// Bad ✗
let total = 0;
cart.subscribe(($cart) => {
  total = $cart.subtotal + $cart.tax + $cart.shipping;
});
```

### 4. **Debounce Search Inputs**

```typescript
import { debounce } from '$lib/utils';

const debouncedSearch = debounce(search, 300);

$: searchQuery, debouncedSearch();
```

### 5. **Validate All User Inputs**

```typescript
import { validateImageFile, isValidEmail, sanitizeString } from '$lib/utils';

// File upload
const result = validateImageFile(file);
if (!result.valid) {
  notifications.error('Invalid File', result.error);
  return;
}

// Text input (prevent XSS)
const cleanedInput = sanitizeString(userInput);
```

### 6. **Handle Errors Gracefully**

```typescript
import { handleError } from '$lib/utils';

try {
  await performAction();
} catch (error) {
  const message = handleError(error, 'ComponentName');
  notifications.error('Action Failed', message);
}
```

---

## Troubleshooting

### Holochain Connection Issues

**Problem**: "Failed to connect to Holochain"

**Solutions**:
1. Check conductor is running: `holochain --version`
2. Verify WebSocket URL in `.env.local`
3. Check browser console for CORS errors

### IPFS Upload Failures

**Problem**: "IPFS upload failed"

**Solutions**:
1. Verify Pinata JWT in `.env.local`
2. Check file size < 5MB
3. Verify file type is allowed (JPEG, PNG, WebP, GIF)

### TypeScript Errors

**Problem**: "Type 'any' is not assignable to type 'X'"

**Solutions**:
1. Add explicit type to `callZome<T>()`
2. Use type guards for external data
3. Check imports from `$types`

### Build Errors

**Problem**: "Module not found"

**Solutions**:
1. Clear `.svelte-kit` folder: `rm -rf .svelte-kit`
2. Reinstall dependencies: `rm -rf node_modules && npm install`
3. Check import paths use `$lib` alias

---

## Additional Resources

- [SvelteKit Documentation](https://kit.svelte.dev/docs)
- [Holochain Documentation](https://developer.holochain.org)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Pinata Documentation](https://docs.pinata.cloud)

---

**Last Updated**: Phase 4.5 (2025-11-14)
