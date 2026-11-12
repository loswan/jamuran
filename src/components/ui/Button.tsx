import React from 'react';
import { playUIClick } from '../../audio/uiSound';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  icon,
  iconPosition = 'left',
  fullWidth = false,
  className = '',
  disabled,
  onClick,
  ...props
}) => {
  // Border radius strictly 10px per design system
  const baseClasses =
    'relative inline-flex items-center justify-center gap-2 font-bold rounded-[10px] transition-all cursor-pointer select-none active:scale-95 disabled:opacity-40 disabled:pointer-events-none disabled:active:scale-100 focus:outline-none focus:ring-2 focus:ring-[#ffd166] focus:ring-offset-2 focus:ring-offset-[#112925]';

  const sizeClasses = {
    sm: 'min-h-[38px] px-3.5 py-1.5 text-xs',
    md: 'min-h-[44px] px-4 sm:px-5 py-2 text-xs sm:text-sm',
    lg: 'min-h-[48px] px-6 py-2.5 text-sm sm:text-base font-extrabold'
  }[size];

  const variantClasses = {
    primary:
      'bg-[#d95d39] hover:bg-[#c04a28] active:bg-[#a83a1b] text-[#fff1c7] border-2 border-[#f4d7a1] shadow-md font-black',
    secondary:
      'bg-[#24564b] hover:bg-[#1b433b] active:bg-[#14332e] text-[#fff1c7] border border-[#79b85b]/50 shadow-sm',
    outline:
      'bg-transparent hover:bg-white/10 active:bg-white/15 text-[#fff1c7] border border-[#f4d7a1]/40',
    danger:
      'bg-rose-900/80 hover:bg-rose-800 text-rose-100 border border-rose-500/50 shadow-sm',
    ghost:
      'bg-transparent hover:bg-white/10 active:bg-white/15 text-slate-300 hover:text-white'
  }[variant];

  return (
    <button
      disabled={disabled}
      className={`${baseClasses} ${sizeClasses} ${variantClasses} ${fullWidth ? 'w-full' : ''} ${className}`}
      onClick={(e) => {
        if (!disabled) {
          playUIClick();
        }
        onClick?.(e);
      }}
      {...props}
    >
      {icon && iconPosition === 'left' && <span className="shrink-0">{icon}</span>}
      <span className="truncate">{children}</span>
      {icon && iconPosition === 'right' && <span className="shrink-0">{icon}</span>}
    </button>
  );
};
