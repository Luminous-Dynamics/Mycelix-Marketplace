/**
 * Form State Management Utilities
 *
 * Svelte store-based form state management with validation, touched tracking,
 * and error handling. Works seamlessly with formValidation.ts validators.
 *
 * @example
 * ```typescript
 * import { createFormStore } from '$lib/utils/forms';
 * import { validators } from '$lib/utils/formValidation';
 *
 * const form = createFormStore({
 *   title: '',
 *   price: 0,
 * }, {
 *   title: validators.required(),
 *   price: validators.compose(validators.required(), validators.positive()),
 * });
 *
 * // In component
 * $: isValid = $form.valid;
 * form.setValue('title', 'New Title');
 * form.validate();
 * ```
 */

import { writable, derived, get, type Readable, type Writable } from 'svelte/store';
import type { ValidationRules, ValidationResult } from './formValidation';
import { validateField, validateObject } from './formValidation';

/**
 * Form store interface
 */
export interface FormStore<T extends Record<string, any>> {
  // Core stores
  values: Writable<T>;
  errors: Writable<Partial<Record<keyof T, string>>>;
  touched: Writable<Partial<Record<keyof T, boolean>>>;
  dirty: Readable<boolean>;
  valid: Readable<boolean>;
  submitting: Writable<boolean>;

  // Methods
  setValue: (field: keyof T, value: any) => void;
  setValues: (values: Partial<T>) => void;
  setError: (field: keyof T, error: string) => void;
  clearError: (field: keyof T) => void;
  clearErrors: () => void;
  setTouched: (field: keyof T, touched?: boolean) => void;
  setAllTouched: () => void;
  validate: () => boolean;
  validateField: (field: keyof T) => boolean;
  reset: () => void;
  submit: (onSubmit: (values: T) => Promise<void> | void) => Promise<void>;
}

/**
 * Create a form store with validation
 */
export function createFormStore<T extends Record<string, any>>(
  initialValues: T,
  validationRules?: ValidationRules<T>
): FormStore<T> {
  // Core stores
  const values = writable<T>(initialValues);
  const errors = writable<Partial<Record<keyof T, string>>>({});
  const touched = writable<Partial<Record<keyof T, boolean>>>({});
  const submitting = writable<boolean>(false);

  // Derived stores
  const dirty = derived(values, ($values) => {
    return Object.keys($values).some(
      (key) => $values[key] !== initialValues[key]
    );
  });

  const valid = derived([values, errors], ([$values, $errors]) => {
    // If there are any errors, form is invalid
    if (Object.keys($errors).length > 0) {
      return false;
    }

    // If no validation rules, form is valid
    if (!validationRules) {
      return true;
    }

    // Validate all fields
    const result = validateObject($values, validationRules);
    return result.valid;
  });

  /**
   * Set a single field value
   */
  function setValue(field: keyof T, value: any) {
    values.update((v) => ({ ...v, [field]: value }));

    // Mark as touched
    touched.update((t) => ({ ...t, [field]: true }));

    // Validate field if rules exist
    if (validationRules?.[field]) {
      validateFieldInternal(field);
    }
  }

  /**
   * Set multiple field values
   */
  function setValues(newValues: Partial<T>) {
    values.update((v) => ({ ...v, ...newValues }));

    // Mark all updated fields as touched
    Object.keys(newValues).forEach((key) => {
      touched.update((t) => ({ ...t, [key]: true }));
    });

    // Validate updated fields
    if (validationRules) {
      Object.keys(newValues).forEach((key) => {
        if (validationRules[key as keyof T]) {
          validateFieldInternal(key as keyof T);
        }
      });
    }
  }

  /**
   * Set a field error
   */
  function setError(field: keyof T, error: string) {
    errors.update((e) => ({ ...e, [field]: error }));
  }

  /**
   * Clear a field error
   */
  function clearError(field: keyof T) {
    errors.update((e) => {
      const newErrors = { ...e };
      delete newErrors[field];
      return newErrors;
    });
  }

  /**
   * Clear all errors
   */
  function clearErrors() {
    errors.set({});
  }

  /**
   * Mark a field as touched
   */
  function setTouched(field: keyof T, isTouched: boolean = true) {
    touched.update((t) => ({ ...t, [field]: isTouched }));
  }

  /**
   * Mark all fields as touched
   */
  function setAllTouched() {
    const $values = get(values);
    const touchedObj: Partial<Record<keyof T, boolean>> = {};

    Object.keys($values).forEach((key) => {
      touchedObj[key as keyof T] = true;
    });

    touched.set(touchedObj);
  }

  /**
   * Validate a single field
   */
  function validateFieldInternal(field: keyof T): boolean {
    if (!validationRules?.[field]) {
      return true;
    }

    const $values = get(values);
    const value = $values[field];
    const validator = validationRules[field];

    if (!validator) {
      return true;
    }

    const result = validateField(value, validator);

    if (result.valid) {
      clearError(field);
      return true;
    } else {
      setError(field, result.error!);
      return false;
    }
  }

  /**
   * Validate a single field (public method)
   */
  function validateFieldPublic(field: keyof T): boolean {
    setTouched(field);
    return validateFieldInternal(field);
  }

  /**
   * Validate all fields
   */
  function validate(): boolean {
    if (!validationRules) {
      return true;
    }

    const $values = get(values);
    const result = validateObject($values, validationRules);

    // Update errors
    errors.set(result.errors);

    // Mark all fields as touched
    setAllTouched();

    return result.valid;
  }

  /**
   * Reset form to initial values
   */
  function reset() {
    values.set(initialValues);
    errors.set({});
    touched.set({});
    submitting.set(false);
  }

  /**
   * Submit form with validation
   */
  async function submit(onSubmit: (values: T) => Promise<void> | void) {
    // Validate all fields
    const isValid = validate();

    if (!isValid) {
      // Don't submit if validation fails
      return;
    }

    // Set submitting state
    submitting.set(true);

    try {
      // Call submit handler with current values
      const $values = get(values);
      await onSubmit($values);

      // Reset form after successful submit (optional, can be customized)
      // reset();
    } catch (error) {
      // Re-throw error for caller to handle
      throw error;
    } finally {
      // Clear submitting state
      submitting.set(false);
    }
  }

  return {
    values,
    errors,
    touched,
    dirty,
    valid,
    submitting,
    setValue,
    setValues,
    setError,
    clearError,
    clearErrors,
    setTouched,
    setAllTouched,
    validate,
    validateField: validateFieldPublic,
    reset,
    submit,
  };
}

/**
 * Create a simple field store with validation
 * Useful for individual form fields that need validation
 */
export function createFieldStore<T>(
  initialValue: T,
  validator?: (value: T) => ValidationResult
) {
  const value = writable<T>(initialValue);
  const error = writable<string | undefined>(undefined);
  const touched = writable<boolean>(false);

  const valid = derived([value, error], ([$value, $error]) => {
    if ($error) return false;
    if (!validator) return true;

    const result = validator($value);
    return result.valid;
  });

  function setValue(newValue: T) {
    value.set(newValue);
    touched.set(true);

    if (validator) {
      const result = validator(newValue);
      if (result.valid) {
        error.set(undefined);
      } else {
        error.set(result.error);
      }
    }
  }

  function validate() {
    touched.set(true);

    if (!validator) return true;

    const $value = get(value);
    const result = validator($value);

    if (result.valid) {
      error.set(undefined);
      return true;
    } else {
      error.set(result.error);
      return false;
    }
  }

  function reset() {
    value.set(initialValue);
    error.set(undefined);
    touched.set(false);
  }

  return {
    value,
    error,
    touched,
    valid,
    setValue,
    validate,
    reset,
  };
}

/**
 * Form field helper - generates props for input binding
 */
export function fieldProps<T extends Record<string, any>>(
  form: FormStore<T>,
  field: keyof T
) {
  const $values = get(form.values);
  const $errors = get(form.errors);
  const $touched = get(form.touched);

  return {
    value: $values[field],
    error: $touched[field] ? $errors[field] : undefined,
    onInput: (e: Event) => {
      const target = e.target as HTMLInputElement;
      form.setValue(field, target.value);
    },
    onBlur: () => {
      form.setTouched(field);
      form.validateField(field);
    },
  };
}

/**
 * Get form field error if touched
 */
export function getFieldError<T extends Record<string, any>>(
  form: FormStore<T>,
  field: keyof T
): string | undefined {
  const $errors = get(form.errors);
  const $touched = get(form.touched);

  return $touched[field] ? $errors[field] : undefined;
}

/**
 * Check if form field has error
 */
export function hasFieldError<T extends Record<string, any>>(
  form: FormStore<T>,
  field: keyof T
): boolean {
  const $errors = get(form.errors);
  const $touched = get(form.touched);

  return Boolean($touched[field] && $errors[field]);
}
