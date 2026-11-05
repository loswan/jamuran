import React from 'react';
import { X } from 'lucide-react';

export interface ModalProps {
  isOpen?: boolean;
  onClose?: () => void;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  icon?: React.ReactNode;
  badge?: React.ReactNode;
  footer?: React.ReactNode;
  children: React.ReactNode;
  maxWidthClass?: string;
  paddingClass?: string;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen = true,
  onClose,
  title,
  subtitle,
  icon,
  badge,
  footer,
  children,
  maxWidthClass = 'max-w-2xl',
  paddingClass = 'p-3.5 sm:p-5'
}) => {
  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-black/80 backdrop-blur-md animate-fadeIn"
      onClick={(e) => {
        if (e.target === e.currentTarget && onClose) {
          onClose();
        }
      }}
    >
      {/* Modal Card - Strictly 16px radius */}
      <div
        className={`relative w-full ${maxWidthClass} max-h-[92vh] flex flex-col bg-[#183d38] border-2 border-[#f4d7a1] rounded-[16px] shadow-2xl text-slate-100 overflow-hidden`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Bar - Fixed at top */}
        <div className="flex items-center justify-between px-3.5 sm:px-5 py-2.5 sm:py-3 border-b border-[#f4d7a1]/25 bg-[#14332e] shrink-0">
          <div className="flex items-center gap-2.5 min-w-0 pr-2">
            {icon && (
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-[10px] bg-[#24564b] border border-[#f4d7a1]/30 flex items-center justify-center text-[#ffd166] shrink-0 shadow-sm">
                {icon}
              </div>
            )}
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-sm sm:text-base font-black text-[#ffd166] tracking-wide font-serif truncate">
                  {title}
                </h2>
                {badge}
              </div>
              {subtitle && (
                <p className="text-[11px] text-[#b5d48c] truncate mt-0.5">
                  {subtitle}
                </p>
              )}
            </div>
          </div>

          {onClose && (
            <button
              onClick={onClose}
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-[10px] flex items-center justify-center text-slate-300 hover:text-white hover:bg-white/10 active:scale-90 transition-all shrink-0 ml-1 cursor-pointer"
              aria-label="Tutup"
              title="Tutup (Esc)"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Scrollable Body - Adapts within max-h-[92vh] on short landscape viewports */}
        <div className={`flex-1 overflow-y-auto min-h-0 ${paddingClass}`}>
          {children}
        </div>

        {/* Footer Bar - Fixed at bottom */}
        {footer && (
          <div className="px-3.5 sm:px-5 py-2.5 sm:py-3 border-t border-[#f4d7a1]/25 bg-[#14332e] shrink-0">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};
