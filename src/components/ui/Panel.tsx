import React from 'react';

export interface PanelProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'> {
  children: React.ReactNode;
  variant?: 'card' | 'subtle' | 'accent' | 'outlined';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  icon?: React.ReactNode;
  headerAction?: React.ReactNode;
}

export const Panel: React.FC<PanelProps> = ({
  children,
  variant = 'card',
  padding = 'md',
  title,
  subtitle,
  icon,
  headerAction,
  className = '',
  ...props
}) => {
  // Border radius strictly 16px per design system requirement
  const baseClasses = 'relative rounded-[16px] text-slate-100 transition-all overflow-hidden';

  const variantClasses = {
    card: 'bg-[#183d38] border-2 border-[#f4d7a1] shadow-xl',
    subtle: 'bg-[#0f2824] border border-[#79b85b]/30 shadow-md',
    accent: 'bg-gradient-to-b from-[#1b433b] to-[#14342f] border-2 border-[#ffd166] shadow-xl',
    outlined: 'bg-[#183d38]/85 border border-[#f4d7a1]/30 backdrop-blur-md shadow-sm'
  }[variant];

  const paddingClasses = {
    none: 'p-0',
    sm: 'p-2.5 sm:p-3',
    md: 'p-3.5 sm:p-5',
    lg: 'p-5 sm:p-6'
  }[padding];

  return (
    <div className={`${baseClasses} ${variantClasses} ${paddingClasses} ${className}`} {...props}>
      {(title || subtitle || icon || headerAction) && (
        <div className="flex items-center justify-between pb-2.5 mb-3 border-b border-[#f4d7a1]/20">
          <div className="flex items-center gap-2.5 min-w-0">
            {icon && (
              <div className="w-8 h-8 rounded-[10px] bg-[#24564b] border border-[#f4d7a1]/30 flex items-center justify-center text-[#ffd166] shrink-0 shadow-sm">
                {icon}
              </div>
            )}
            <div className="min-w-0">
              {title && (
                <h3 className="text-xs sm:text-sm font-black text-[#ffd166] tracking-wide truncate font-serif">
                  {title}
                </h3>
              )}
              {subtitle && (
                <p className="text-[11px] text-[#b5d48c] truncate mt-0.5">{subtitle}</p>
              )}
            </div>
          </div>
          {headerAction && <div className="shrink-0 ml-2">{headerAction}</div>}
        </div>
      )}
      {children}
    </div>
  );
};
