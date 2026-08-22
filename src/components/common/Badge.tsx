import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'brand';
  size?: 'sm' | 'md' | 'lg';
  dot?: boolean;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'neutral',
  size = 'md',
  dot = false,
}) => {
  const variantStyles = {
    success: 'bg-emerald-50 text-emerald-700 border-emerald-200 ring-emerald-600/20',
    warning: 'bg-amber-50 text-amber-700 border-amber-200 ring-amber-600/20',
    danger: 'bg-rose-50 text-rose-700 border-rose-200 ring-rose-600/20',
    info: 'bg-blue-50 text-blue-700 border-blue-200 ring-blue-600/20',
    brand: 'bg-teal-50 text-teal-800 border-teal-200 ring-teal-600/20',
    neutral: 'bg-slate-100 text-slate-700 border-slate-200 ring-slate-600/20',
  }[variant];

  const dotStyles = {
    success: 'bg-emerald-500',
    warning: 'bg-amber-500',
    danger: 'bg-rose-500',
    info: 'bg-blue-500',
    brand: 'bg-teal-600',
    neutral: 'bg-slate-500',
  }[variant];

  const sizeStyles = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-xs px-2.5 py-1 font-medium',
    lg: 'text-sm px-3 py-1 font-medium',
  }[size];

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border ${variantStyles} ${sizeStyles}`}>
      {dot && <span className={`w-1.5 h-1.5 rounded-full ${dotStyles}`} />}
      {children}
    </span>
  );
};
