/**
 * Form Validation Utilities
 *
 * Reusable validation functions and composable validators for forms.
 * Provides type-safe, declarative validation rules with consistent error messages.
 *
 * @example
 * ```typescript
 * import { validators, validateField } from '$lib/utils/formValidation';
 *
 * const titleValidation = validators.compose(
 *   validators.required('Title is required'),
 *   validators.minLength(5, 'Title must be at least 5 characters')
 * );
 *
 * const error = validateField('Hello', titleValidation);
 * ```
 */

// Validation result type
export type ValidationResult = {
  valid: boolean;
  error?: string;
};

// Validator function type
export type Validator<T = any> = (value: T) => ValidationResult;

// Validation rules object type
export type ValidationRules<T> = {
  [K in keyof T]?: Validator | Validator[];
};

/**
 * Validate a single field with one or more validators
 */
export function validateField<T>(value: T, validator: Validator | Validator[]): ValidationResult {
  const validators = Array.isArray(validator) ? validator : [validator];

  for (const validate of validators) {
    const result = validate(value);
    if (!result.valid) {
      return result;
    }
  }

  return { valid: true };
}

/**
 * Validate an entire object against validation rules
 */
export function validateObject<T extends Record<string, any>>(
  values: T,
  rules: ValidationRules<T>
): {
  valid: boolean;
  errors: Partial<Record<keyof T, string>>;
} {
  const errors: Partial<Record<keyof T, string>> = {};
  let valid = true;

  for (const field in rules) {
    const validator = rules[field];
    if (validator) {
      const result = validateField(values[field], validator);
      if (!result.valid) {
        errors[field] = result.error;
        valid = false;
      }
    }
  }

  return { valid, errors };
}

/**
 * Pre-built validator functions
 */
export const validators = {
  /**
   * Required field validator
   */
  required: (message: string = 'This field is required'): Validator => {
    return (value: any): ValidationResult => {
      if (value === null || value === undefined) {
        return { valid: false, error: message };
      }

      if (typeof value === 'string' && value.trim() === '') {
        return { valid: false, error: message };
      }

      if (Array.isArray(value) && value.length === 0) {
        return { valid: false, error: message };
      }

      return { valid: true };
    };
  },

  /**
   * Minimum length validator (for strings and arrays)
   */
  minLength: (min: number, message?: string): Validator => {
    return (value: any): ValidationResult => {
      const defaultMessage = `Must be at least ${min} characters`;
      const length = value?.length ?? 0;

      if (length < min) {
        return { valid: false, error: message || defaultMessage };
      }

      return { valid: true };
    };
  },

  /**
   * Maximum length validator (for strings and arrays)
   */
  maxLength: (max: number, message?: string): Validator => {
    return (value: any): ValidationResult => {
      const defaultMessage = `Must be no more than ${max} characters`;
      const length = value?.length ?? 0;

      if (length > max) {
        return { valid: false, error: message || defaultMessage };
      }

      return { valid: true };
    };
  },

  /**
   * Minimum value validator (for numbers)
   */
  min: (min: number, message?: string): Validator => {
    return (value: any): ValidationResult => {
      const defaultMessage = `Must be at least ${min}`;
      const num = Number(value);

      if (isNaN(num) || num < min) {
        return { valid: false, error: message || defaultMessage };
      }

      return { valid: true };
    };
  },

  /**
   * Maximum value validator (for numbers)
   */
  max: (max: number, message?: string): Validator => {
    return (value: any): ValidationResult => {
      const defaultMessage = `Must be no more than ${max}`;
      const num = Number(value);

      if (isNaN(num) || num > max) {
        return { valid: false, error: message || defaultMessage };
      }

      return { valid: true };
    };
  },

  /**
   * Email validator
   */
  email: (message: string = 'Invalid email address'): Validator => {
    return (value: any): ValidationResult => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

      if (typeof value !== 'string' || !emailRegex.test(value)) {
        return { valid: false, error: message };
      }

      return { valid: true };
    };
  },

  /**
   * URL validator
   */
  url: (message: string = 'Invalid URL'): Validator => {
    return (value: any): ValidationResult => {
      try {
        new URL(value);
        return { valid: true };
      } catch {
        return { valid: false, error: message };
      }
    };
  },

  /**
   * Pattern/regex validator
   */
  pattern: (regex: RegExp, message: string = 'Invalid format'): Validator => {
    return (value: any): ValidationResult => {
      if (typeof value !== 'string' || !regex.test(value)) {
        return { valid: false, error: message };
      }

      return { valid: true };
    };
  },

  /**
   * Custom validator function
   */
  custom: (
    fn: (value: any) => boolean,
    message: string = 'Validation failed'
  ): Validator => {
    return (value: any): ValidationResult => {
      const isValid = fn(value);
      return isValid ? { valid: true } : { valid: false, error: message };
    };
  },

  /**
   * Compose multiple validators
   */
  compose: (...validators: Validator[]): Validator => {
    return (value: any): ValidationResult => {
      for (const validator of validators) {
        const result = validator(value);
        if (!result.valid) {
          return result;
        }
      }
      return { valid: true };
    };
  },

  /**
   * Match another field validator (for password confirmation)
   */
  match: (otherValue: any, message: string = 'Values do not match'): Validator => {
    return (value: any): ValidationResult => {
      if (value !== otherValue) {
        return { valid: false, error: message };
      }
      return { valid: true };
    };
  },

  /**
   * One of allowed values validator
   */
  oneOf: <T>(allowedValues: T[], message?: string): Validator<T> => {
    return (value: T): ValidationResult => {
      const defaultMessage = `Must be one of: ${allowedValues.join(', ')}`;

      if (!allowedValues.includes(value)) {
        return { valid: false, error: message || defaultMessage };
      }

      return { valid: true };
    };
  },

  /**
   * Number validator
   */
  number: (message: string = 'Must be a valid number'): Validator => {
    return (value: any): ValidationResult => {
      const num = Number(value);

      if (isNaN(num)) {
        return { valid: false, error: message };
      }

      return { valid: true };
    };
  },

  /**
   * Integer validator
   */
  integer: (message: string = 'Must be a whole number'): Validator => {
    return (value: any): ValidationResult => {
      const num = Number(value);

      if (isNaN(num) || !Number.isInteger(num)) {
        return { valid: false, error: message };
      }

      return { valid: true };
    };
  },

  /**
   * Positive number validator
   */
  positive: (message: string = 'Must be a positive number'): Validator => {
    return (value: any): ValidationResult => {
      const num = Number(value);

      if (isNaN(num) || num <= 0) {
        return { valid: false, error: message };
      }

      return { valid: true };
    };
  },

  /**
   * File validator
   */
  file: (options: {
    maxSize?: number; // bytes
    allowedTypes?: string[]; // MIME types
    message?: string;
  }): Validator<File> => {
    return (file: File): ValidationResult => {
      // Check file type
      if (options.allowedTypes && !options.allowedTypes.includes(file.type)) {
        return {
          valid: false,
          error: options.message || `Invalid file type. Allowed: ${options.allowedTypes.join(', ')}`,
        };
      }

      // Check file size
      if (options.maxSize && file.size > options.maxSize) {
        const maxSizeMB = (options.maxSize / (1024 * 1024)).toFixed(2);
        return {
          valid: false,
          error: options.message || `File too large. Maximum size: ${maxSizeMB}MB`,
        };
      }

      return { valid: true };
    };
  },

  /**
   * Array validator
   */
  array: (options: {
    minLength?: number;
    maxLength?: number;
    message?: string;
  }): Validator<any[]> => {
    return (value: any[]): ValidationResult => {
      if (!Array.isArray(value)) {
        return { valid: false, error: 'Must be an array' };
      }

      if (options.minLength !== undefined && value.length < options.minLength) {
        return {
          valid: false,
          error: options.message || `Must have at least ${options.minLength} items`,
        };
      }

      if (options.maxLength !== undefined && value.length > options.maxLength) {
        return {
          valid: false,
          error: options.message || `Must have no more than ${options.maxLength} items`,
        };
      }

      return { valid: true };
    };
  },
};

/**
 * Common validation rule presets
 */
export const commonValidations = {
  /**
   * Listing title validation
   */
  listingTitle: validators.compose(
    validators.required('Title is required'),
    validators.minLength(5, 'Title must be at least 5 characters'),
    validators.maxLength(100, 'Title must be no more than 100 characters')
  ),

  /**
   * Listing description validation
   */
  listingDescription: validators.compose(
    validators.required('Description is required'),
    validators.minLength(20, 'Description must be at least 20 characters'),
    validators.maxLength(2000, 'Description must be no more than 2000 characters')
  ),

  /**
   * Price validation
   */
  price: validators.compose(
    validators.required('Price is required'),
    validators.number('Price must be a number'),
    validators.positive('Price must be greater than 0'),
    validators.max(1000000, 'Price cannot exceed $1,000,000')
  ),

  /**
   * Quantity validation
   */
  quantity: validators.compose(
    validators.required('Quantity is required'),
    validators.integer('Quantity must be a whole number'),
    validators.min(1, 'Quantity must be at least 1')
  ),

  /**
   * Photo files validation
   */
  photos: (maxPhotos: number = 10) =>
    validators.compose(
      validators.required('At least one photo is required'),
      validators.array({
        minLength: 1,
        maxLength: maxPhotos,
        message: `Maximum ${maxPhotos} photos allowed`,
      })
    ),

  /**
   * Dispute description validation
   */
  disputeDescription: validators.compose(
    validators.required('Description is required'),
    validators.minLength(20, 'Please provide at least 20 characters to explain the issue')
  ),
};
