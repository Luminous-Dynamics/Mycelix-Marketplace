<script lang="ts">
  /**
   * Form Input Component
   *
   * A reusable form input with label, validation, and error display.
   *
   * @component
   * @example
   * ```svelte
   * <FormInput
   *   label="Email"
   *   type="email"
   *   bind:value={email}
   *   required
   *   error={emailError}
   *   placeholder="Enter your email"
   * />
   * ```
   */

  // Props
  /** Input label */
  export let label: string;

  /** Input ID (auto-generated if not provided) */
  export let id: string = `input-${Math.random().toString(36).substr(2, 9)}`;

  /** Input type */
  export let type: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url' | 'search' = 'text';

  /** Input value */
  export let value: string | number = '';

  /** Placeholder text */
  export let placeholder: string = '';

  /** Whether the field is required */
  export let required: boolean = false;

  /** Whether the field is disabled */
  export let disabled: boolean = false;

  /** Whether the field is readonly */
  export let readonly: boolean = false;

  /** Error message */
  export let error: string = '';

  /** Helper text shown below input */
  export let helperText: string = '';

  /** Minimum value (for number inputs) */
  export let min: number | undefined = undefined;

  /** Maximum value (for number inputs) */
  export let max: number | undefined = undefined;

  /** Step value (for number inputs) */
  export let step: number | undefined = undefined;

  /** Maximum length */
  export let maxlength: number | undefined = undefined;

  /** Autocomplete attribute */
  export let autocomplete: string | undefined = undefined;

  /** Input name attribute */
  export let name: string | undefined = undefined;

  /** Custom input class */
  let className: string = '';
  export { className as class };

  // State
  let focused = false;

  $: hasError = !!error;
  $: hasValue = value !== '' && value !== null && value !== undefined;
</script>

<div class="form-input-wrapper {className}">
  <label for={id} class="input-label" class:required>
    {label}
    {#if required}
      <span class="required-indicator" aria-label="required">*</span>
    {/if}
  </label>

  <input
    {id}
    {type}
    {name}
    {placeholder}
    {required}
    {disabled}
    {readonly}
    {min}
    {max}
    {step}
    {maxlength}
    {autocomplete}
    bind:value
    class="input-field"
    class:has-error={hasError}
    class:has-value={hasValue}
    class:focused
    on:focus={() => (focused = true)}
    on:blur={() => (focused = false)}
    on:input
    on:change
    on:keydown
    on:keyup
    on:keypress
    aria-invalid={hasError}
    aria-describedby={hasError ? `${id}-error` : helperText ? `${id}-helper` : undefined}
  />

  {#if hasError}
    <p id="{id}-error" class="error-message" role="alert">
      <span aria-hidden="true">⚠️</span>
      {error}
    </p>
  {:else if helperText}
    <p id="{id}-helper" class="helper-text">
      {helperText}
    </p>
  {/if}
</div>

<style>
  .form-input-wrapper {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    width: 100%;
  }

  .input-label {
    font-size: 0.875rem;
    font-weight: 600;
    color: #2d3748;
    display: flex;
    align-items: center;
    gap: 0.25rem;
  }

  .required-indicator {
    color: #f56565;
    font-weight: bold;
  }

  .input-field {
    padding: 0.75rem 1rem;
    border: 2px solid #e2e8f0;
    border-radius: 0.5rem;
    font-size: 1rem;
    font-family: inherit;
    color: #2d3748;
    background: white;
    transition: all 0.2s;
    width: 100%;
  }

  .input-field::placeholder {
    color: #a0aec0;
  }

  .input-field:focus {
    outline: none;
    border-color: #667eea;
    box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
  }

  .input-field:disabled {
    background: #f7fafc;
    color: #a0aec0;
    cursor: not-allowed;
  }

  .input-field:readonly {
    background: #f7fafc;
  }

  .input-field.has-error {
    border-color: #f56565;
  }

  .input-field.has-error:focus {
    border-color: #f56565;
    box-shadow: 0 0 0 3px rgba(245, 101, 101, 0.1);
  }

  .error-message {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin: 0;
    font-size: 0.875rem;
    color: #f56565;
    font-weight: 500;
  }

  .helper-text {
    margin: 0;
    font-size: 0.875rem;
    color: #718096;
  }

  /* Number input styling */
  input[type='number']::-webkit-inner-spin-button,
  input[type='number']::-webkit-outer-spin-button {
    opacity: 1;
  }
</style>
