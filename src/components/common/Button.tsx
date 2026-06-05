'use client';

// ============================================
// DeadlineGuard — Common Button Component
// ============================================

import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  icon?: React.ReactNode;
  id: string; // Critical SEO/Testing Requirement
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  className = '',
  disabled,
  id,
  ...props
}) => {
  return (
    <button
      id={id}
      disabled={disabled || loading}
      className={`btn btn-${variant} btn-${size} ${loading ? 'loading' : ''} ${className}`}
      {...props}
    >
      {loading ? (
        <span className="spinner" style={{ marginRight: children ? '8px' : '0' }}></span>
      ) : icon ? (
        <span className="btn-icon" style={{ marginRight: children ? '8px' : '0', display: 'inline-flex', alignItems: 'center' }}>
          {icon}
        </span>
      ) : null}
      {children}
    </button>
  );
};

export default Button;
