import { useState, useCallback, useMemo } from 'react';

/**
 * Custom hook for form state management with validation
 * @param {Object} initialValues - Initial form values
 * @param {Function} validationSchema - Validation function
 * @param {Object} options - Configuration options
 * @returns {Object} - Form state and methods
 */
export const useForm = (initialValues = {}, validationSchema = null, options = {}) => {
  const { onSubmit, validateOnChange = true, validateOnBlur = true } = options;

  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Validate a single field
  const validateField = useCallback((fieldName, value) => {
    if (!validationSchema) return null;

    const fieldErrors = validationSchema({ ...values, [fieldName]: value });
    return fieldErrors[fieldName] || null;
  }, [validationSchema, values]);

  // Validate all fields
  const validateForm = useCallback(() => {
    if (!validationSchema) return {};

    const formErrors = validationSchema(values);
    setErrors(formErrors);
    return formErrors;
  }, [validationSchema, values]);

  // Handle field value change
  const setValue = useCallback((fieldName, value) => {
    setValues(prev => ({
      ...prev,
      [fieldName]: value,
    }));

    if (validateOnChange && validationSchema) {
      const fieldError = validateField(fieldName, value);
      setErrors(prev => ({
        ...prev,
        [fieldName]: fieldError,
      }));
    }
  }, [validateOnChange, validateField, validationSchema]);

  // Handle field blur
  const setTouched = useCallback((fieldName) => {
    setTouched(prev => ({
      ...prev,
      [fieldName]: true,
    }));

    if (validateOnBlur && validationSchema) {
      const fieldError = validateField(fieldName, values[fieldName]);
      setErrors(prev => ({
        ...prev,
        [fieldName]: fieldError,
      }));
    }
  }, [validateOnBlur, validateField, validationSchema, values]);

  // Generic change handler for form inputs
  const handleChange = useCallback((e) => {
    const { name, value, type, checked } = e.target;
    const fieldValue = type === 'checkbox' ? checked : value;
    setValue(name, fieldValue);
  }, [setValue]);

  // Generic blur handler for form inputs
  const handleBlur = useCallback((e) => {
    const { name } = e.target;
    setTouched(name);
  }, [setTouched]);

  // Handle form submission
  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    
    setIsSubmitting(true);
    
    // Mark all fields as touched
    const allTouched = Object.keys(values).reduce((acc, key) => {
      acc[key] = true;
      return acc;
    }, {});
    setTouched(allTouched);

    // Validate form
    const formErrors = validateForm();
    const hasErrors = Object.keys(formErrors).length > 0;

    if (!hasErrors && onSubmit) {
      try {
        await onSubmit(values);
      } catch (error) {
        console.error('Form submission error:', error);
      }
    }

    setIsSubmitting(false);
  }, [values, validateForm, onSubmit]);

  // Reset form to initial state
  const reset = useCallback(() => {
    setValues(initialValues);
    setErrors({});
    setTouched({});
    setIsSubmitting(false);
  }, [initialValues]);

  // Set multiple values at once
  const setFormValues = useCallback((newValues) => {
    setValues(prev => ({
      ...prev,
      ...newValues,
    }));
  }, []);

  // Get field props for easy integration with input components
  const getFieldProps = useCallback((fieldName) => ({
    name: fieldName,
    value: values[fieldName] || '',
    onChange: handleChange,
    onBlur: handleBlur,
    error: touched[fieldName] ? errors[fieldName] : null,
  }), [values, handleChange, handleBlur, touched, errors]);

  // Check if form is valid
  const isValid = useMemo(() => {
    return Object.keys(errors).length === 0;
  }, [errors]);

  // Check if form has been modified
  const isDirty = useMemo(() => {
    return JSON.stringify(values) !== JSON.stringify(initialValues);
  }, [values, initialValues]);

  return {
    values,
    errors,
    touched,
    isSubmitting,
    isValid,
    isDirty,
    setValue,
    setTouched,
    setFormValues,
    handleChange,
    handleBlur,
    handleSubmit,
    getFieldProps,
    validateForm,
    reset,
  };
};

/**
 * Common validation functions
 */
export const validators = {
  required: (message = 'Este campo es obligatorio') => (value) => {
    if (!value || (typeof value === 'string' && !value.trim())) {
      return message;
    }
    return null;
  },

  email: (message = 'Email inválido') => (value) => {
    if (value && !/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(value)) {
      return message;
    }
    return null;
  },

  minLength: (min, message) => (value) => {
    if (value && value.length < min) {
      return message || `Debe tener al menos ${min} caracteres`;
    }
    return null;
  },

  maxLength: (max, message) => (value) => {
    if (value && value.length > max) {
      return message || `Debe tener máximo ${max} caracteres`;
    }
    return null;
  },

  min: (min, message) => (value) => {
    if (value && parseFloat(value) < min) {
      return message || `Debe ser mayor o igual a ${min}`;
    }
    return null;
  },

  max: (max, message) => (value) => {
    if (value && parseFloat(value) > max) {
      return message || `Debe ser menor o igual a ${max}`;
    }
    return null;
  },

  pattern: (regex, message = 'Formato inválido') => (value) => {
    if (value && !regex.test(value)) {
      return message;
    }
    return null;
  },
};

/**
 * Compose multiple validators
 * @param {...Function} validatorFuncs - Validator functions
 * @returns {Function} - Combined validator function
 */
export const composeValidators = (...validatorFuncs) => (value) => {
  for (const validator of validatorFuncs) {
    const error = validator(value);
    if (error) return error;
  }
  return null;
};