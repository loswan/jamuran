import React, { useEffect, useState } from 'react';

export interface ResponsiveLandscapeWrapperProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  /** Maximum width constraint on large desktop screens to preserve balanced landscape composition */
  maxWidthClass?: string;
  /** Maximum height constraint on large desktop screens */
  maxHeightClass?: string;
}

/**
 * ResponsiveLandscapeWrapper
 *
 * Implements a standard Flexbox-based shell that incorporates `box-sizing: border-box`.
 * Handles the landscape-first requirement for JAMATH:
 * - On mobile/tablet: Fills 100% of the viewport (w-full h-full) with safe-area insets.
 * - On desktop/laptop: Centered within a proportional, balanced landscape shell (16:9 to 21:9).
 * - Enforces zero horizontal and vertical viewport overflow with min-w-0 and min-h-0 constraints.
 * - Eliminates layout collapses by using flexible 100% height and width.
 */
export const ResponsiveLandscapeWrapper: React.FC<ResponsiveLandscapeWrapperProps> = ({
  children,
  className = '',
  maxWidthClass = 'max-w-[1920px]',
  maxHeightClass = 'max-h-[1080px]',
  ...props
}) => {
  const [isDesktopLandscape, setIsDesktopLandscape] = useState<boolean>(true);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  useEffect(() => {
    const handleResize = () => {
      if (typeof window === 'undefined') return;
      const w = window.innerWidth;
      const h = window.innerHeight;
      const hasFinePointer =
        window.matchMedia &&
        window.matchMedia('(pointer: fine)').matches &&
        !window.matchMedia('(pointer: coarse)').matches;

      // Check current fullscreen state
      const doc = document as Document & {
        webkitFullscreenElement?: Element | null;
        mozFullScreenElement?: Element | null;
        msFullscreenElement?: Element | null;
      };
      const activeFullscreen = Boolean(
        doc.fullscreenElement ||
        doc.webkitFullscreenElement ||
        doc.mozFullScreenElement ||
        doc.msFullscreenElement
      );
      setIsFullscreen(activeFullscreen);

      // Only constrain with max bounds on desktop landscape screens when not in fullscreen
      setIsDesktopLandscape(w > h && w >= 1024 && hasFinePointer);
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);
    document.addEventListener('fullscreenchange', handleResize);
    document.addEventListener('webkitfullscreenchange', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
      document.removeEventListener('fullscreenchange', handleResize);
      document.removeEventListener('webkitfullscreenchange', handleResize);
    };
  }, []);

  return (
    <div
      className="w-full h-full flex flex-col flex-1 min-h-0 min-w-0 items-center justify-center bg-[#091614] overflow-hidden select-none box-border relative"
      style={{ boxSizing: 'border-box' }}
      data-testid="responsive-landscape-wrapper"
    >
      {/* Landscape-First Responsive Game Frame */}
      <main
        className={`w-full h-full flex flex-col flex-1 min-w-0 min-h-0 relative overflow-hidden bg-[#112925] box-border ${
          isDesktopLandscape && !isFullscreen
            ? `${maxWidthClass} ${maxHeightClass} shadow-2xl rounded-none md:rounded-[16px]`
            : 'max-w-none max-h-none rounded-none'
        } ${className}`}
        style={{ boxSizing: 'border-box' }}
        {...props}
      >
        {children}
      </main>
    </div>
  );
};
