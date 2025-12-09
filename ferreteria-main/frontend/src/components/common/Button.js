import React from 'react';
import './Button.css';

/**
 * Reusable Button component with multiple variants and states
 * @param {Object} props - Component props
 * @returns {JSX.Element} - Button component
 */
const Button = ({
  children,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  fullWidth = false,
  startIcon = null,
  endIcon = null,
  onClick,
  type = 'button',
  className = '',
  ...props
}) => {
  const baseClassName = 'btn';
  const variantClassName = `btn--${variant}`;
  const sizeClassName = `btn--${size}`;
  const stateClassNames = [
    disabled && 'btn--disabled',
    loading && 'btn--loading',
    fullWidth && 'btn--full-width',
  ].filter(Boolean);

  const finalClassName = [
    baseClassName,
    variantClassName,
    sizeClassName,
    ...stateClassNames,
    className,
  ].join(' ');

  const handleClick = (e) => {
    if (disabled || loading) {
      e.preventDefault();
      return;
    }
    if (onClick) {
      onClick(e);
    }
  };

  return (
    <button
      type={type}
      className={finalClassName}
      disabled={disabled || loading}
      onClick={handleClick}
      {...props}
    >
      {loading && <span className="btn__spinner" />}
      {startIcon && !loading && <span className="btn__start-icon">{startIcon}</span>}
      <span className="btn__content">{children}</span>
      {endIcon && !loading && <span className="btn__end-icon">{endIcon}</span>}
    </button>
  );
};

export default Button;