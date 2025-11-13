<script lang="ts">
  /**
   * Checkout Flow Page
   *
   * Complete checkout process with:
   * - Order summary from cart
   * - Shipping address form
   * - Payment method selection
   * - Order review and confirmation
   * - Holochain transaction creation
   * - Post-checkout redirect
   *
   * This demonstrates:
   * - Multi-step checkout process
   * - Form validation
   * - Payment integration placeholders
   * - Transaction creation for each cart item
   * - Cart clearing after success
   */

  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { get } from 'svelte/store';
  import { getIpfsUrl } from '$lib/ipfs/ipfsClient';
  import TrustBadge from '$lib/components/TrustBadge.svelte';
  import { cartItems as cart, subtotal, tax, shipping, total } from '$lib/stores';
  import { notifications } from '$lib/stores';
  import { initHolochainClient } from '$lib/holochain';
  import { createTransaction } from '$lib/holochain/transactions';
  import type { CartItem, PaymentMethod, CreateTransactionInput } from '$types';

  // Cart state (from store)
  let cartItemsList: CartItem[] = [];
  let loading = true;
  let error = '';

  // Checkout step (1: Shipping, 2: Payment, 3: Review)
  let currentStep = 1;

  // Shipping form
  let shippingAddress = {
    name: '',
    address_line_1: '',
    address_line_2: '',
    city: '',
    state: '',
    postal_code: '',
    country: 'USA',
    phone: '',
  };

  // Payment form
  let paymentMethod: PaymentMethod = 'crypto';
  let paymentDetails = {
    // Crypto
    cryptoCurrency: 'ETH',
    walletAddress: '',
    // Fiat
    cardNumber: '',
    cardName: '',
    cardExpiry: '',
    cardCVV: '',
  };

  // Checkout state
  let processingCheckout = false;
  let checkoutError = '';
  let checkoutSuccess = false;
  let transactionIds: string[] = [];

  /**
   * Load cart from store
   */
  onMount(() => {
    loading = true;

    try {
      // Get cart items from store
      const items = get(cart);
      cartItemsList = items;

      if (cartItemsList.length === 0) {
        error = 'Your cart is empty';
        notifications.warning('Cart empty', 'Add items before checking out');
      } else {
        notifications.info('Checkout', `${cartItemsList.length} items in cart`);
      }
    } catch (e: any) {
      error = e.message || 'Failed to load cart';
      notifications.error('Failed to load cart', error);
    } finally {
      loading = false;
    }
  });

  /**
   * Validate shipping address
   */
  function validateShipping(): boolean {
    if (!shippingAddress.name.trim()) {
      error = 'Full name is required';
      notifications.error('Validation error', 'Full name is required');
      return false;
    }
    if (!shippingAddress.address_line_1.trim()) {
      error = 'Address is required';
      notifications.error('Validation error', 'Address is required');
      return false;
    }
    if (!shippingAddress.city.trim()) {
      error = 'City is required';
      notifications.error('Validation error', 'City is required');
      return false;
    }
    if (!shippingAddress.state.trim()) {
      error = 'State is required';
      notifications.error('Validation error', 'State is required');
      return false;
    }
    if (!shippingAddress.postal_code.trim()) {
      error = 'ZIP code is required';
      notifications.error('Validation error', 'ZIP code is required');
      return false;
    }
    if (!shippingAddress.phone.trim()) {
      error = 'Phone number is required';
      notifications.error('Validation error', 'Phone number is required');
      return false;
    }
    return true;
  }

  /**
   * Validate payment details
   */
  function validatePayment(): boolean {
    if (paymentMethod === 'crypto') {
      if (!paymentDetails.walletAddress.trim()) {
        error = 'Wallet address is required';
        notifications.error('Validation error', 'Wallet address is required');
        return false;
      }
    } else if (paymentMethod === 'credit_card') {
      if (!paymentDetails.cardNumber.trim()) {
        error = 'Card number is required';
        notifications.error('Validation error', 'Card number is required');
        return false;
      }
      if (!paymentDetails.cardName.trim()) {
        error = 'Cardholder name is required';
        notifications.error('Validation error', 'Cardholder name is required');
        return false;
      }
      if (!paymentDetails.cardExpiry.trim()) {
        error = 'Expiry date is required';
        notifications.error('Validation error', 'Expiry date is required');
        return false;
      }
      if (!paymentDetails.cardCVV.trim()) {
        error = 'CVV is required';
        notifications.error('Validation error', 'CVV is required');
        return false;
      }
    }
    return true;
  }

  /**
   * Move to next step
   */
  function nextStep() {
    error = '';

    if (currentStep === 1) {
      if (!validateShipping()) return;
      currentStep = 2;
    } else if (currentStep === 2) {
      if (!validatePayment()) return;
      currentStep = 3;
    }
  }

  /**
   * Move to previous step
   */
  function previousStep() {
    error = '';
    if (currentStep > 1) {
      currentStep--;
    }
  }

  /**
   * Complete checkout
   */
  async function completeCheckout() {
    processingCheckout = true;
    checkoutError = '';
    error = '';

    try {
      // Initialize Holochain client
      const client = await initHolochainClient();

      notifications.info('Processing', `Creating ${cartItemsList.length} transactions...`);

      // Create transactions for each cart item
      const transactions = await Promise.all(
        cartItemsList.map(async (item) => {
          const transactionInput: CreateTransactionInput = {
            listing_hash: item.listing_hash,
            quantity: item.quantity,
            shipping_address: shippingAddress,
            payment_method: paymentMethod,
          };

          const transaction = await createTransaction(client, transactionInput);
          console.log('Transaction created:', transaction);
          return transaction;
        })
      );

      // Store transaction IDs
      transactionIds = transactions.map((t) => t.id);

      // Clear cart after successful checkout
      cart.clear();
      cartItemsList = [];

      // Success
      checkoutSuccess = true;
      notifications.success(
        'Order placed!',
        `${transactions.length} transactions created successfully`
      );

      // Redirect to transaction tracking after 3 seconds
      setTimeout(() => {
        goto('/transactions');
      }, 3000);
    } catch (e: any) {
      checkoutError = e.message || 'Failed to complete checkout';
      notifications.error('Checkout failed', checkoutError);
      console.error('Error completing checkout:', e);
    } finally {
      processingCheckout = false;
    }
  }
</script>

<div class="checkout-page">
  <div class="container">
    {#if loading}
      <!-- Loading State -->
      <div class="loading-state">
        <div class="spinner"></div>
        <p>Loading checkout...</p>
      </div>
    {:else if error && cartItemsList.length === 0}
      <!-- Empty Cart -->
      <div class="error-state">
        <span class="error-icon">🛒</span>
        <h2>Your cart is empty</h2>
        <p>Add some items before checking out</p>
        <a href="/browse" class="btn btn-primary">Browse Marketplace</a>
      </div>
    {:else if checkoutSuccess}
      <!-- Success State -->
      <div class="success-state">
        <span class="success-icon">✓</span>
        <h2>Order Placed Successfully!</h2>
        <p>Your transactions have been created on the Holochain DHT.</p>
        <div class="transaction-hashes">
          <h3>Transaction IDs:</h3>
          {#each transactionIds as id}
            <code class="transaction-hash">{id}</code>
          {/each}
        </div>
        <p class="redirect-message">Redirecting to transaction tracking...</p>
      </div>
    {:else}
      <!-- Checkout Process -->
      <div class="checkout-header">
        <h1>Checkout</h1>
        <div class="steps-indicator">
          <div class="step" class:active={currentStep >= 1} class:completed={currentStep > 1}>
            <div class="step-number">1</div>
            <div class="step-label">Shipping</div>
          </div>
          <div class="step-divider"></div>
          <div class="step" class:active={currentStep >= 2} class:completed={currentStep > 2}>
            <div class="step-number">2</div>
            <div class="step-label">Payment</div>
          </div>
          <div class="step-divider"></div>
          <div class="step" class:active={currentStep >= 3}>
            <div class="step-number">3</div>
            <div class="step-label">Review</div>
          </div>
        </div>
      </div>

      <div class="checkout-content">
        <!-- Checkout Form -->
        <div class="checkout-form">
          {#if currentStep === 1}
            <!-- Step 1: Shipping Address -->
            <div class="form-section">
              <h2>Shipping Address</h2>

              <div class="form-row">
                <div class="form-field">
                  <label for="name">Full Name *</label>
                  <input
                    id="name"
                    type="text"
                    bind:value={shippingAddress.name}
                    placeholder="John Doe"
                    required
                  />
                </div>

                <div class="form-field">
                  <label for="phone">Phone Number *</label>
                  <input
                    id="phone"
                    type="tel"
                    bind:value={shippingAddress.phone}
                    placeholder="(555) 123-4567"
                    required
                  />
                </div>
              </div>

              <div class="form-field">
                <label for="address_line_1">Address Line 1 *</label>
                <input
                  id="address_line_1"
                  type="text"
                  bind:value={shippingAddress.address_line_1}
                  placeholder="123 Main Street"
                  required
                />
              </div>

              <div class="form-field">
                <label for="address_line_2">Address Line 2</label>
                <input
                  id="address_line_2"
                  type="text"
                  bind:value={shippingAddress.address_line_2}
                  placeholder="Apt 4B"
                />
              </div>

              <div class="form-row">
                <div class="form-field">
                  <label for="city">City *</label>
                  <input
                    id="city"
                    type="text"
                    bind:value={shippingAddress.city}
                    placeholder="New York"
                    required
                  />
                </div>

                <div class="form-field">
                  <label for="state">State *</label>
                  <input
                    id="state"
                    type="text"
                    bind:value={shippingAddress.state}
                    placeholder="NY"
                    required
                  />
                </div>

                <div class="form-field">
                  <label for="postal_code">ZIP Code *</label>
                  <input
                    id="postal_code"
                    type="text"
                    bind:value={shippingAddress.postal_code}
                    placeholder="10001"
                    required
                  />
                </div>
              </div>

              <div class="form-field">
                <label for="country">Country *</label>
                <select id="country" bind:value={shippingAddress.country}>
                  <option value="United States">United States</option>
                  <option value="Canada">Canada</option>
                  <option value="United Kingdom">United Kingdom</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>
          {:else if currentStep === 2}
            <!-- Step 2: Payment Method -->
            <div class="form-section">
              <h2>Payment Method</h2>

              <div class="payment-methods">
                <button
                  class="payment-method-btn"
                  class:active={paymentMethod === 'crypto'}
                  on:click={() => (paymentMethod = 'crypto')}
                >
                  <span class="method-icon">₿</span>
                  <span class="method-name">Cryptocurrency</span>
                </button>
                <button
                  class="payment-method-btn"
                  class:active={paymentMethod === 'credit_card'}
                  on:click={() => (paymentMethod = 'credit_card')}
                >
                  <span class="method-icon">💳</span>
                  <span class="method-name">Credit/Debit Card</span>
                </button>
              </div>

              {#if paymentMethod === 'crypto'}
                <div class="payment-details">
                  <div class="form-field">
                    <label for="cryptoCurrency">Cryptocurrency</label>
                    <select id="cryptoCurrency" bind:value={paymentDetails.cryptoCurrency}>
                      <option value="ETH">Ethereum (ETH)</option>
                      <option value="BTC">Bitcoin (BTC)</option>
                      <option value="USDC">USD Coin (USDC)</option>
                      <option value="DAI">Dai (DAI)</option>
                    </select>
                  </div>

                  <div class="form-field">
                    <label for="walletAddress">Your Wallet Address *</label>
                    <input
                      id="walletAddress"
                      type="text"
                      bind:value={paymentDetails.walletAddress}
                      placeholder="0x..."
                      required
                    />
                    <p class="field-hint">
                      Payment will be escrowed until delivery confirmation
                    </p>
                  </div>
                </div>
              {:else}
                <div class="payment-details">
                  <div class="form-field">
                    <label for="cardNumber">Card Number *</label>
                    <input
                      id="cardNumber"
                      type="text"
                      bind:value={paymentDetails.cardNumber}
                      placeholder="1234 5678 9012 3456"
                      maxlength="19"
                      required
                    />
                  </div>

                  <div class="form-field">
                    <label for="cardName">Cardholder Name *</label>
                    <input
                      id="cardName"
                      type="text"
                      bind:value={paymentDetails.cardName}
                      placeholder="John Doe"
                      required
                    />
                  </div>

                  <div class="form-row">
                    <div class="form-field">
                      <label for="cardExpiry">Expiry Date *</label>
                      <input
                        id="cardExpiry"
                        type="text"
                        bind:value={paymentDetails.cardExpiry}
                        placeholder="MM/YY"
                        maxlength="5"
                        required
                      />
                    </div>

                    <div class="form-field">
                      <label for="cardCVV">CVV *</label>
                      <input
                        id="cardCVV"
                        type="text"
                        bind:value={paymentDetails.cardCVV}
                        placeholder="123"
                        maxlength="4"
                        required
                      />
                    </div>
                  </div>
                </div>
              {/if}
            </div>
          {:else if currentStep === 3}
            <!-- Step 3: Review Order -->
            <div class="form-section">
              <h2>Review Your Order</h2>

              <div class="review-section">
                <h3>Shipping Address</h3>
                <div class="review-address">
                  <p>{shippingAddress.name}</p>
                  <p>{shippingAddress.address_line_1}</p>
                  {#if shippingAddress.address_line_2}
                    <p>{shippingAddress.address_line_2}</p>
                  {/if}
                  <p>
                    {shippingAddress.city}, {shippingAddress.state} {shippingAddress.postal_code}
                  </p>
                  <p>{shippingAddress.country}</p>
                  <p>{shippingAddress.phone}</p>
                </div>
              </div>

              <div class="review-section">
                <h3>Payment Method</h3>
                <div class="review-payment">
                  {#if paymentMethod === 'crypto'}
                    <p>
                      <strong>Cryptocurrency:</strong> {paymentDetails.cryptoCurrency}
                    </p>
                    <p class="wallet-address">
                      Wallet: {paymentDetails.walletAddress.substring(0, 20)}...
                    </p>
                  {:else}
                    <p>
                      <strong>Card:</strong> •••• {paymentDetails.cardNumber.slice(-4)}
                    </p>
                    <p>{paymentDetails.cardName}</p>
                  {/if}
                </div>
              </div>

              <div class="review-section">
                <h3>Order Items</h3>
                <div class="review-items">
                  {#each cartItemsList as item}
                    <div class="review-item">
                      <div class="item-thumbnail">
                        {#if item.photo_cid}
                          <img src={getIpfsUrl(item.photo_cid)} alt={item.title} />
                        {:else}
                          <div class="no-image">📷</div>
                        {/if}
                      </div>
                      <div class="item-details">
                        <p class="item-title">{item.title}</p>
                        <p class="item-quantity">Quantity: {item.quantity}</p>
                      </div>
                      <div class="item-price">${(item.price * item.quantity).toFixed(2)}</div>
                    </div>
                  {/each}
                </div>
              </div>
            </div>
          {/if}

          {#if error}
            <div class="alert alert-error">
              <span class="alert-icon">⚠️</span>
              {error}
            </div>
          {/if}

          {#if checkoutError}
            <div class="alert alert-error">
              <span class="alert-icon">⚠️</span>
              {checkoutError}
            </div>
          {/if}

          <!-- Navigation Buttons -->
          <div class="form-actions">
            {#if currentStep > 1}
              <button class="btn btn-secondary" on:click={previousStep}>
                ← Back
              </button>
            {/if}

            {#if currentStep < 3}
              <button class="btn btn-primary" on:click={nextStep}>
                Continue →
              </button>
            {:else}
              <button
                class="btn btn-primary"
                on:click={completeCheckout}
                disabled={processingCheckout}
              >
                {#if processingCheckout}
                  Processing Order...
                {:else}
                  Place Order
                {/if}
              </button>
            {/if}
          </div>
        </div>

        <!-- Order Summary Sidebar -->
        <div class="order-summary">
          <h2>Order Summary</h2>

          <div class="summary-items">
            {#each cartItemsList as item}
              <div class="summary-item">
                <span class="item-name">{item.title} × {item.quantity}</span>
                <span class="item-price">${(item.price * item.quantity).toFixed(2)}</span>
              </div>
            {/each}
          </div>

          <div class="summary-divider"></div>

          <div class="summary-row">
            <span>Subtotal</span>
            <span>${$subtotal.toFixed(2)}</span>
          </div>

          <div class="summary-row">
            <span>Tax (8%)</span>
            <span>${$tax.toFixed(2)}</span>
          </div>

          <div class="summary-row">
            <span>Shipping</span>
            <span>${$shipping.toFixed(2)}</span>
          </div>

          <div class="summary-divider"></div>

          <div class="summary-total">
            <span>Total</span>
            <span>${$total.toFixed(2)}</span>
          </div>
        </div>
      </div>
    {/if}
  </div>
</div>

<style>
  .checkout-page {
    min-height: 100vh;
    padding: 2rem 1rem;
    background: #f7fafc;
  }

  .container {
    max-width: 1200px;
    margin: 0 auto;
  }

  /* Loading State */
  .loading-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 400px;
    gap: 1rem;
  }

  .spinner {
    width: 50px;
    height: 50px;
    border: 4px solid #e2e8f0;
    border-top-color: #4299e1;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }

  /* Error State */
  .error-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 400px;
    background: white;
    border-radius: 0.5rem;
    padding: 3rem;
    text-align: center;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  }

  .error-icon {
    font-size: 4rem;
    margin-bottom: 1rem;
  }

  .error-state h2 {
    font-size: 1.5rem;
    font-weight: 600;
    color: #2d3748;
    margin-bottom: 0.5rem;
  }

  .error-state p {
    color: #718096;
    margin-bottom: 2rem;
  }

  /* Success State */
  .success-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 400px;
    background: white;
    border-radius: 0.5rem;
    padding: 3rem;
    text-align: center;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  }

  .success-icon {
    font-size: 5rem;
    color: #38a169;
    margin-bottom: 1.5rem;
  }

  .success-state h2 {
    font-size: 2rem;
    font-weight: 700;
    color: #2d3748;
    margin-bottom: 1rem;
  }

  .success-state p {
    color: #718096;
    margin-bottom: 2rem;
  }

  .transaction-hashes {
    width: 100%;
    max-width: 600px;
    margin-bottom: 2rem;
  }

  .transaction-hashes h3 {
    font-size: 1.125rem;
    font-weight: 600;
    color: #2d3748;
    margin-bottom: 1rem;
  }

  .transaction-hash {
    display: block;
    padding: 0.75rem;
    background: #f7fafc;
    border-radius: 0.375rem;
    font-family: monospace;
    font-size: 0.875rem;
    color: #4a5568;
    margin-bottom: 0.5rem;
    word-break: break-all;
  }

  .redirect-message {
    color: #4299e1;
    font-weight: 500;
  }

  /* Checkout Header */
  .checkout-header {
    background: white;
    border-radius: 0.5rem;
    padding: 2rem;
    margin-bottom: 2rem;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  }

  .checkout-header h1 {
    font-size: 2rem;
    font-weight: 700;
    color: #2d3748;
    margin-bottom: 2rem;
    text-align: center;
  }

  /* Steps Indicator */
  .steps-indicator {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 1rem;
  }

  .step {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.5rem;
  }

  .step-number {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background: #e2e8f0;
    color: #718096;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 700;
    transition: all 0.3s;
  }

  .step.active .step-number {
    background: #4299e1;
    color: white;
  }

  .step.completed .step-number {
    background: #38a169;
    color: white;
  }

  .step-label {
    font-size: 0.875rem;
    color: #718096;
    font-weight: 500;
  }

  .step.active .step-label {
    color: #4299e1;
    font-weight: 600;
  }

  .step-divider {
    width: 60px;
    height: 2px;
    background: #e2e8f0;
  }

  /* Checkout Content */
  .checkout-content {
    display: grid;
    grid-template-columns: 2fr 1fr;
    gap: 2rem;
  }

  @media (max-width: 768px) {
    .checkout-content {
      grid-template-columns: 1fr;
    }
  }

  /* Checkout Form */
  .checkout-form {
    background: white;
    border-radius: 0.5rem;
    padding: 2rem;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  }

  .form-section {
    margin-bottom: 2rem;
  }

  .form-section h2 {
    font-size: 1.5rem;
    font-weight: 600;
    color: #2d3748;
    margin-bottom: 1.5rem;
  }

  .form-section h3 {
    font-size: 1.125rem;
    font-weight: 600;
    color: #2d3748;
    margin-bottom: 1rem;
  }

  .form-row {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 1rem;
    margin-bottom: 1rem;
  }

  .form-field {
    margin-bottom: 1rem;
  }

  .form-field label {
    display: block;
    font-size: 0.875rem;
    font-weight: 500;
    color: #4a5568;
    margin-bottom: 0.5rem;
  }

  .form-field input,
  .form-field select {
    width: 100%;
    padding: 0.75rem;
    border: 1px solid #cbd5e0;
    border-radius: 0.375rem;
    font-size: 1rem;
    transition: border-color 0.2s;
  }

  .form-field input:focus,
  .form-field select:focus {
    outline: none;
    border-color: #4299e1;
  }

  .field-hint {
    margin-top: 0.5rem;
    font-size: 0.75rem;
    color: #718096;
  }

  /* Payment Methods */
  .payment-methods {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1rem;
    margin-bottom: 2rem;
  }

  .payment-method-btn {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.5rem;
    padding: 1.5rem;
    border: 2px solid #e2e8f0;
    border-radius: 0.375rem;
    background: white;
    cursor: pointer;
    transition: all 0.2s;
  }

  .payment-method-btn:hover {
    border-color: #4299e1;
  }

  .payment-method-btn.active {
    border-color: #4299e1;
    background: #ebf8ff;
  }

  .method-icon {
    font-size: 2rem;
  }

  .method-name {
    font-weight: 600;
    color: #2d3748;
  }

  .payment-details {
    padding: 1.5rem;
    background: #f7fafc;
    border-radius: 0.375rem;
  }

  /* Review Sections */
  .review-section {
    padding: 1.5rem;
    background: #f7fafc;
    border-radius: 0.375rem;
    margin-bottom: 1.5rem;
  }

  .review-address p,
  .review-payment p {
    color: #4a5568;
    line-height: 1.6;
  }

  .wallet-address {
    font-family: monospace;
    font-size: 0.875rem;
  }

  .review-items {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .review-item {
    display: grid;
    grid-template-columns: 60px 1fr auto;
    gap: 1rem;
    align-items: center;
  }

  .item-thumbnail {
    width: 60px;
    height: 60px;
    border-radius: 0.375rem;
    overflow: hidden;
    background: white;
  }

  .item-thumbnail img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .no-image {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.5rem;
    color: #cbd5e0;
  }

  .item-details {
    flex: 1;
  }

  .item-title {
    font-weight: 600;
    color: #2d3748;
    margin-bottom: 0.25rem;
  }

  .item-quantity {
    font-size: 0.875rem;
    color: #718096;
  }

  .item-price {
    font-size: 1.125rem;
    font-weight: 700;
    color: #38a169;
  }

  /* Order Summary */
  .order-summary {
    background: white;
    border-radius: 0.5rem;
    padding: 1.5rem;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    height: fit-content;
    position: sticky;
    top: 2rem;
  }

  .order-summary h2 {
    font-size: 1.25rem;
    font-weight: 600;
    color: #2d3748;
    margin-bottom: 1.5rem;
  }

  .summary-items {
    margin-bottom: 1rem;
  }

  .summary-item {
    display: flex;
    justify-content: space-between;
    align-items: start;
    margin-bottom: 0.75rem;
    font-size: 0.875rem;
  }

  .item-name {
    flex: 1;
    color: #4a5568;
  }

  .summary-row {
    display: flex;
    justify-content: space-between;
    margin-bottom: 0.75rem;
    font-size: 0.875rem;
    color: #4a5568;
  }

  .summary-divider {
    height: 1px;
    background: #e2e8f0;
    margin: 1rem 0;
  }

  .summary-total {
    display: flex;
    justify-content: space-between;
    font-size: 1.25rem;
    font-weight: 700;
    color: #2d3748;
  }

  .summary-total span:last-child {
    color: #38a169;
  }

  /* Form Actions */
  .form-actions {
    display: flex;
    justify-content: space-between;
    gap: 1rem;
    margin-top: 2rem;
  }

  /* Buttons */
  .btn {
    padding: 0.75rem 2rem;
    border: none;
    border-radius: 0.375rem;
    font-size: 1rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
    text-decoration: none;
    display: inline-block;
  }

  .btn-primary {
    background: #4299e1;
    color: white;
    flex: 1;
  }

  .btn-primary:hover:not(:disabled) {
    background: #3182ce;
  }

  .btn-secondary {
    background: #e2e8f0;
    color: #2d3748;
  }

  .btn-secondary:hover {
    background: #cbd5e0;
  }

  .btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  /* Alerts */
  .alert {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 1rem;
    border-radius: 0.375rem;
    margin-bottom: 1rem;
  }

  .alert-icon {
    font-size: 1.25rem;
  }

  .alert-error {
    background: #fed7d7;
    border: 1px solid #fc8181;
    color: #742a2a;
  }
</style>
