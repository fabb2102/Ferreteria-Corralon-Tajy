import React, { forwardRef } from 'react';
import './Input.css';

/**
 * Reusable Input component with validation and multiple variants
 */
const Input = forwardRef(({
  label,
  error,
  helperText,
  required = false,
  disabled = false,
  fullWidth = false,
  variant = 'outlined',
  size = 'medium',
  startIcon = null,
  endIcon = null,
  type = 'text',
  placeholder,
  className = '',
  containerClassName = '',
  ...props
}, ref) => {
  const baseClassName = 'input';
  const variantClassName = `input--${variant}`;
  const sizeClassName = `input--${size}`;
  const stateClassNames = [
    error && 'input--error',
    disabled && 'input--disabled',
    fullWidth && 'input--full-width',
  ].filter(Boolean);

  const inputClassName = [
    baseClassName,
    variantClassName,
    sizeClassName,
    ...stateClassNames,
    className,
  ].join(' ');

  const containerClass = [
    'input-container',
    fullWidth && 'input-container--full-width',
    containerClassName,
  ].filter(Boolean).join(' ');

  const inputId = props.id || props.name || `input-${Math.random().toString(36).substr(2, 9)}`;

  return (
    <div className={containerClass}>
      {label && (
        <label htmlFor={inputId} className="input-label">
          {label}
          {required && <span className="input-label__required">*</span>}
        </label>
      )}
      
      <div className="input-wrapper">
        {startIcon && <span className="input-icon input-icon--start">{startIcon}</span>}
        
        <input
          ref={ref}
          id={inputId}
          type={type}
          className={inputClassName}
          disabled={disabled}
          placeholder={placeholder}
          {...props}
        />
        
        {endIcon && <span className="input-icon input-icon--end">{endIcon}</span>}
      </div>
      
      {(error || helperText) && (
        <div className={`input-helper ${error ? 'input-helper--error' : ''}`}>
          {error || helperText}
        </div>
      )}
    </div>
  );
});

Input.displayName = 'Input';

export default Input;