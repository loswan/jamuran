import { useState, useEffect, useCallback } from 'react';

/**
 * Checks whether Fullscreen API is available in the current browser/environment.
 */
export function isFullscreenSupported(): boolean {
  if (typeof document === 'undefined') return false;
  const doc = document as Document & {
    webkitFullscreenEnabled?: boolean;
    mozFullScreenEnabled?: boolean;
    msFullscreenEnabled?: boolean;
  };
  return Boolean(
    doc.fullscreenEnabled ||
    doc.webkitFullscreenEnabled ||
    doc.mozFullScreenEnabled ||
    doc.msFullscreenEnabled
  );
}

/**
 * Returns whether the document is currently in fullscreen mode.
 */
export function checkIsFullscreen(): boolean {
  if (typeof document === 'undefined') return false;
  const doc = document as Document & {
    webkitFullscreenElement?: Element | null;
    mozFullScreenElement?: Element | null;
    msFullscreenElement?: Element | null;
  };
  return Boolean(
    doc.fullscreenElement ||
    doc.webkitFullscreenElement ||
    doc.mozFullScreenElement ||
    doc.msFullscreenElement
  );
}

export interface UseFullscreenReturn {
  isFullscreen: boolean;
  isSupported: boolean;
  message: string | null;
  toggleFullscreen: () => Promise<void>;
  dismissMessage: () => void;
}

/**
 * useFullscreen Hook
 *
 * Provides a resilient, cross-browser Fullscreen API controller for JAMATH:
 * - Supports standard Fullscreen API and webkit/moz/ms vendor prefixes (Android Chrome, Safari, etc.)
 * - Triggers landscape orientation locking via Screen Orientation API when supported
 * - Handles fullscreenchange events and dispatches window resize events
 * - Provides informative feedback if fullscreen is blocked (e.g. iframe permission policy) without erroring
 */
export function useFullscreen(): UseFullscreenReturn {
  const [isFullscreen, setIsFullscreen] = useState<boolean>(() => checkIsFullscreen());
  const [isSupported, setIsSupported] = useState<boolean>(() => isFullscreenSupported());
  const [message, setMessage] = useState<string | null>(null);

  const dismissMessage = useCallback(() => {
    setMessage(null);
  }, []);

  const updateFullscreenStatus = useCallback(() => {
    const active = checkIsFullscreen();
    setIsFullscreen(active);

    // Notify canvas and layout observers to adapt to expanded/contracted viewport
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('resize'));
    }
  }, []);

  useEffect(() => {
    setIsSupported(isFullscreenSupported());
    updateFullscreenStatus();

    const events = [
      'fullscreenchange',
      'webkitfullscreenchange',
      'mozfullscreenchange',
      'MSFullscreenChange'
    ];

    events.forEach((evt) => {
      document.addEventListener(evt, updateFullscreenStatus);
    });

    return () => {
      events.forEach((evt) => {
        document.removeEventListener(evt, updateFullscreenStatus);
      });
    };
  }, [updateFullscreenStatus]);

  const toggleFullscreen = useCallback(async () => {
    if (typeof document === 'undefined') return;

    // 1. If currently in fullscreen, request exit
    if (checkIsFullscreen()) {
      try {
        const doc = document as Document & {
          webkitExitFullscreen?: () => Promise<void>;
          mozCancelFullScreen?: () => Promise<void>;
          msExitFullscreen?: () => Promise<void>;
        };

        if (doc.exitFullscreen) {
          await doc.exitFullscreen();
        } else if (doc.webkitExitFullscreen) {
          await doc.webkitExitFullscreen();
        } else if (doc.mozCancelFullScreen) {
          await doc.mozCancelFullScreen();
        } else if (doc.msExitFullscreen) {
          await doc.msExitFullscreen();
        }

        // Release orientation lock on exit if supported
        if (typeof screen !== 'undefined' && screen.orientation && typeof screen.orientation.unlock === 'function') {
          try {
            screen.orientation.unlock();
          } catch {
            // Ignored safely
          }
        }
      } catch (err) {
        console.warn('[JAMATH] Error exiting fullscreen:', err);
      }
      return;
    }

    // 2. Not in fullscreen: Request Fullscreen
    if (!isFullscreenSupported()) {
      setMessage('Mode Layar Penuh tidak didukung pada browser ini.');
      setTimeout(() => setMessage(null), 3500);
      return;
    }

    try {
      const el = document.documentElement as HTMLElement & {
        webkitRequestFullscreen?: () => Promise<void>;
        mozRequestFullScreen?: () => Promise<void>;
        msRequestFullscreen?: () => Promise<void>;
      };

      if (el.requestFullscreen) {
        await el.requestFullscreen({ navigationUI: 'hide' } as FullscreenOptions);
      } else if (el.webkitRequestFullscreen) {
        await el.webkitRequestFullscreen();
      } else if (el.mozRequestFullScreen) {
        await el.mozRequestFullScreen();
      } else if (el.msRequestFullscreen) {
        await el.msRequestFullscreen();
      } else {
        setMessage('Browser ini tidak mengizinkan mode Layar Penuh.');
        setTimeout(() => setMessage(null), 3500);
        return;
      }

      // Try locking screen to landscape for optimal mobile gameplay
      if (typeof screen !== 'undefined' && screen.orientation && typeof screen.orientation.lock === 'function') {
        try {
          await screen.orientation.lock('landscape');
        } catch {
          // Gracefully continue; user may have hardware/OS lock or be on desktop
        }
      }
    } catch (err: unknown) {
      console.warn('[JAMATH] Request fullscreen blocked or rejected:', err);
      setMessage('Mode Layar Penuh tidak dapat diaktifkan di browser ini (izin dibatasi).');
      setTimeout(() => setMessage(null), 4000);
    }
  }, []);

  return {
    isFullscreen,
    isSupported,
    message,
    toggleFullscreen,
    dismissMessage
  };
}
