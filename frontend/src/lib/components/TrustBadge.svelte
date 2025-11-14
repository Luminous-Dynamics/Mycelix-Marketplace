<script lang="ts">
  /**
   * Trust Badge Component
   *
   * Displays PoGQ (Proof of Generalized Quality) trust scores with color-coded
   * visual indicators, hover tooltips, and optional detailed breakdowns.
   *
   * ## Features
   * - Color-coded trust tiers (Exceptional → Poor)
   * - Multiple size variants (small, medium, large)
   * - Hover tooltip with detailed breakdown
   * - Optional clickable for navigation to profiles
   * - Automatic score normalization (supports 0-1 or 0-100)
   * - Accessible (ARIA labels, keyboard navigation)
   *
   * ## Trust Score Tiers
   * - 90-100%: Exceptional (purple) 👑
   * - 75-89%: Excellent (green) ⭐
   * - 60-74%: Good (blue) ✓
   * - 40-59%: Fair (orange) ○
   * - 0-39%: Poor (red) ⚠
   *
   * @component
   * @example
   * ```svelte
   * <!-- Basic usage -->
   * <TrustBadge trustScore={85} />
   *
   * <!-- With size and detailed breakdown -->
   * <TrustBadge
   *   trustScore={92}
   *   size="large"
   *   breakdown={{
   *     transactionCount: 145,
   *     positiveReviews: 138,
   *     averageRating: 4.8,
   *     memberSince: Date.now() - 365 * 24 * 60 * 60 * 1000
   *   }}
   * />
   *
   * <!-- Clickable for navigation -->
   * <TrustBadge
   *   trustScore={78}
   *   clickable
   *   agentId={user.agent_id}
   *   on:click={({ detail }) => goto(`/profile/${detail.agentId}`)}
   * />
   * ```
   */

  import { createEventDispatcher } from 'svelte';
  import { formatRelativeTime } from '$lib/utils';

  /** Trust score value (0-100 or 0-1, auto-normalized) */
  export let trustScore: number;

  /** Badge size variant */
  export let size: 'small' | 'medium' | 'large' = 'medium';

  /** Whether to show the tier label (e.g., "Excellent") */
  export let showLabel: boolean = true;

  /** Whether to show the tier icon (e.g., ⭐) */
  export let showIcon: boolean = true;

  /** Whether the badge is clickable */
  export let clickable: boolean = false;

  /** Agent ID for click navigation */
  export let agentId: string = '';

  /** Optional detailed trust score breakdown */
  export let breakdown: {
    transactionCount?: number;
    positiveReviews?: number;
    averageRating?: number;
    memberSince?: number;
  } | null = null;

  // State
  let showTooltip = false;

  const dispatch = createEventDispatcher<{
    click: { agentId: string; trustScore: number };
  }>();

  /**
   * Normalize trust score to 0-100 range
   */
  $: normalizedScore = trustScore > 1 ? trustScore : trustScore * 100;

  /**
   * Get trust tier based on score
   */
  $: trustTier = getTrustTier(normalizedScore);

  /**
   * Get display label
   */
  $: displayLabel = getTrustLabel(normalizedScore);

  /**
   * Get icon based on tier
   */
  $: trustIcon = getTrustIcon(trustTier);

  /**
   * Determine trust tier
   */
  function getTrustTier(score: number): string {
    if (score >= 90) return 'exceptional';
    if (score >= 75) return 'excellent';
    if (score >= 60) return 'good';
    if (score >= 40) return 'fair';
    return 'poor';
  }

  /**
   * Get trust label
   */
  function getTrustLabel(score: number): string {
    const tier = getTrustTier(score);
    const labels: Record<string, string> = {
      exceptional: 'Exceptional',
      excellent: 'Excellent',
      good: 'Good',
      fair: 'Fair',
      poor: 'Poor',
    };
    return labels[tier];
  }

  /**
   * Get trust icon
   */
  function getTrustIcon(tier: string): string {
    const icons: Record<string, string> = {
      exceptional: '👑',
      excellent: '⭐',
      good: '✓',
      fair: '○',
      poor: '⚠',
    };
    return icons[tier];
  }

  /**
   * Handle badge click
   */
  function handleClick() {
    if (clickable) {
      dispatch('click', { agentId, trustScore: normalizedScore });
    }
  }

  /**
   * Format member since timestamp to relative time
   * @param timestamp - Unix timestamp in milliseconds
   * @returns Formatted relative time string
   */
  function formatMemberSince(timestamp: number): string {
    return formatRelativeTime(timestamp).replace(' ago', '');
  }
</script>

<div
  class="trust-badge"
  class:clickable
  class:size-small={size === 'small'}
  class:size-medium={size === 'medium'}
  class:size-large={size === 'large'}
  class:tier-exceptional={trustTier === 'exceptional'}
  class:tier-excellent={trustTier === 'excellent'}
  class:tier-good={trustTier === 'good'}
  class:tier-fair={trustTier === 'fair'}
  class:tier-poor={trustTier === 'poor'}
  on:click={handleClick}
  on:keydown={(e) => {
    if (clickable && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      handleClick();
    }
  }}
  on:mouseenter={() => (showTooltip = true)}
  on:mouseleave={() => (showTooltip = false)}
  role={clickable ? 'button' : undefined}
  tabindex={clickable ? 0 : undefined}
  aria-label={clickable ? `View trust profile for user with ${normalizedScore.toFixed(0)}% trust score` : undefined}
>
  <div class="badge-content">
    {#if showIcon}
      <span class="badge-icon">{trustIcon}</span>
    {/if}
    <span class="badge-score">{normalizedScore.toFixed(1)}%</span>
    {#if showLabel}
      <span class="badge-label">{displayLabel}</span>
    {/if}
  </div>

  {#if showTooltip && (breakdown || true)}
    <div class="badge-tooltip">
      <div class="tooltip-header">
        <span class="tooltip-icon">{trustIcon}</span>
        <span class="tooltip-title">PoGQ Trust Score</span>
      </div>

      <div class="tooltip-score">
        {normalizedScore.toFixed(1)}% · {displayLabel}
      </div>

      {#if breakdown}
        <div class="tooltip-breakdown">
          {#if breakdown.transactionCount !== undefined}
            <div class="breakdown-item">
              <span class="item-label">Transactions:</span>
              <span class="item-value">{breakdown.transactionCount}</span>
            </div>
          {/if}

          {#if breakdown.positiveReviews !== undefined}
            <div class="breakdown-item">
              <span class="item-label">Positive Reviews:</span>
              <span class="item-value">{breakdown.positiveReviews}</span>
            </div>
          {/if}

          {#if breakdown.averageRating !== undefined}
            <div class="breakdown-item">
              <span class="item-label">Average Rating:</span>
              <span class="item-value">{breakdown.averageRating.toFixed(1)}/5</span>
            </div>
          {/if}

          {#if breakdown.memberSince !== undefined}
            <div class="breakdown-item">
              <span class="item-label">Member Since:</span>
              <span class="item-value">{formatMemberSince(breakdown.memberSince)}</span>
            </div>
          {/if}
        </div>
      {:else}
        <div class="tooltip-info">
          Trust score based on transaction history, reviews, and community reputation.
        </div>
      {/if}

      {#if clickable}
        <div class="tooltip-action">Click to view full profile</div>
      {/if}
    </div>
  {/if}
</div>

<style>
  .trust-badge {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 1rem;
    border-radius: 0.375rem;
    font-weight: 600;
    transition: all 0.2s;
    position: relative;
    user-select: none;
  }

  /* Size Variants */
  .size-small {
    padding: 0.25rem 0.5rem;
    font-size: 0.75rem;
    gap: 0.25rem;
  }

  .size-medium {
    padding: 0.5rem 1rem;
    font-size: 0.875rem;
    gap: 0.5rem;
  }

  .size-large {
    padding: 0.75rem 1.5rem;
    font-size: 1rem;
    gap: 0.75rem;
  }

  /* Clickable */
  .clickable {
    cursor: pointer;
  }

  .clickable:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }

  /* Trust Tiers */
  .tier-exceptional {
    background: linear-gradient(135deg, #805ad5 0%, #6b46c1 100%);
    color: white;
    box-shadow: 0 2px 8px rgba(128, 90, 213, 0.3);
  }

  .tier-excellent {
    background: linear-gradient(135deg, #38a169 0%, #2f855a 100%);
    color: white;
    box-shadow: 0 2px 8px rgba(56, 161, 105, 0.3);
  }

  .tier-good {
    background: linear-gradient(135deg, #4299e1 0%, #3182ce 100%);
    color: white;
    box-shadow: 0 2px 8px rgba(66, 153, 225, 0.3);
  }

  .tier-fair {
    background: linear-gradient(135deg, #ed8936 0%, #dd6b20 100%);
    color: white;
    box-shadow: 0 2px 8px rgba(237, 137, 54, 0.3);
  }

  .tier-poor {
    background: linear-gradient(135deg, #e53e3e 0%, #c53030 100%);
    color: white;
    box-shadow: 0 2px 8px rgba(229, 62, 62, 0.3);
  }

  /* Badge Content */
  .badge-content {
    display: flex;
    align-items: center;
    gap: inherit;
  }

  .badge-icon {
    font-size: 1.25em;
  }

  .size-small .badge-icon {
    font-size: 1em;
  }

  .size-large .badge-icon {
    font-size: 1.5em;
  }

  .badge-score {
    font-weight: 700;
  }

  .badge-label {
    font-weight: 500;
    opacity: 0.9;
  }

  /* Tooltip */
  .badge-tooltip {
    position: absolute;
    bottom: calc(100% + 0.5rem);
    left: 50%;
    transform: translateX(-50%);
    background: white;
    border-radius: 0.5rem;
    padding: 1rem;
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
    min-width: 250px;
    z-index: 100;
    pointer-events: none;
  }

  .badge-tooltip::after {
    content: '';
    position: absolute;
    top: 100%;
    left: 50%;
    transform: translateX(-50%);
    border: 8px solid transparent;
    border-top-color: white;
  }

  .tooltip-header {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-bottom: 0.75rem;
    padding-bottom: 0.75rem;
    border-bottom: 1px solid #e2e8f0;
  }

  .tooltip-icon {
    font-size: 1.5rem;
  }

  .tooltip-title {
    font-weight: 600;
    color: #2d3748;
  }

  .tooltip-score {
    font-size: 1.25rem;
    font-weight: 700;
    color: #2d3748;
    margin-bottom: 1rem;
  }

  .tooltip-breakdown {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    margin-bottom: 0.75rem;
  }

  .breakdown-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 0.875rem;
  }

  .item-label {
    color: #718096;
  }

  .item-value {
    font-weight: 600;
    color: #2d3748;
  }

  .tooltip-info {
    font-size: 0.75rem;
    color: #718096;
    line-height: 1.4;
    margin-bottom: 0.75rem;
  }

  .tooltip-action {
    font-size: 0.75rem;
    color: #4299e1;
    text-align: center;
    padding-top: 0.5rem;
    border-top: 1px solid #e2e8f0;
  }
</style>
