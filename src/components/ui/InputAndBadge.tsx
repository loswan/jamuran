import React from 'react';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  children: React.ReactNode;
  variant?: 'gold' | 'emerald' | 'terracotta' | 'sage' | 'neutral';
  size?: 'sm' | 'md';
  icon?: React.ReactNode;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'gold',
  size = 'sm',
  icon,
  className = '',
  ...props
}) => {
  const variantStyles = {
    gold: 'bg-amber-400/15 text-[#ffd166] border-amber-400/40',
    emerald: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40',
    terracotta: 'bg-[#d95d39]/20 text-[#f4a261] border-[#d95d39]/50',
    sage: 'bg-[#79b85b]/15 text-[#b5d48c] border-[#79b85b]/40',
    neutral: 'bg-slate-700/30 text-slate-200 border-slate-600/40'
  }[variant];

  const sizeStyles = {
    sm: 'text-[10px] px-2 py-0.5',
    md: 'text-xs px-2.5 py-1'
  }[size];

  return (
    <span
      className={`inline-flex items-center gap-1 font-bold rounded-[6px] border tracking-wider uppercase select-none ${variantStyles} ${sizeStyles} ${className}`}
      {...props}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      <span className="truncate">{children}</span>
    </span>
  );
};

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  sublabel?: string;
  error?: string;
  icon?: React.ReactNode;
}

export const Input: React.FC<InputProps> = ({
  label,
  sublabel,
  error,
  icon,
  className = '',
  ...props
}) => {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-xs font-bold text-[#fff1c7] mb-1 flex items-center gap-1.5">
          {icon && <span className="text-[#ffd166]">{icon}</span>}
          <span>{label}</span>
        </label>
      )}
      <input
        className={`w-full min-h-[42px] px-3.5 py-2 bg-[#0f2824] border border-[#f4d7a1]/40 rounded-[10px] text-white font-semibold text-xs sm:text-sm focus:outline-none focus:border-[#ffd166] focus:ring-1 focus:ring-[#ffd166] transition-colors placeholder:text-slate-500 ${
          error ? 'border-rose-400' : ''
        } ${className}`}
        {...props}
      />
      {error ? (
        <p className="text-[11px] text-rose-400 mt-1 font-semibold">{error}</p>
      ) : sublabel ? (
        <p className="text-[10px] text-slate-400 mt-0.5">{sublabel}</p>
      ) : null}
    </div>
  );
};
