import React, { useState, useEffect, useCallback } from 'react';
import { Smartphone, RotateCw, X, Play } from 'lucide-react';
import { GameState } from '../types/game';

export interface OrientationPromptProps {
  /** Current app screen (GAME or LOBBY) */
  appScreen?: 'GAME' | 'LOBBY';
  /** Current game state (MENU, MUSIC_PLAYING, MATH_CHALLENGE, etc.) */
  gameState?: GameState;
}

/**
 * OrientationPrompt
 *
 * Implements resilient orientation detection for JAMATH:
 * 1. Menu utama can ALWAYS be accessed in portrait and landscape (never blocked).
 * 2. Player identity form, character selection, room creation, and lobby remain fully usable in portrait.
 * 3. Orientation guidance ONLY triggers when entering active gameplay where landscape is needed.
 * 4. NEVER appears on desktop or laptop (accurate touch pointer & user-agent inspection).
 * 5. Uses matchMedia("(orientation: portrait)") and actual viewport dimensions.
 * 6. Non-blocking presentation: visual banner/card with dismiss button that never traps the player.
 */
export const OrientationPrompt: React.FC<OrientationPromptProps> = ({
  appScreen = 'GAME',
  gameState = 'MENU'
}) => {
  const [isMobileDevice, setIsMobileDevice] = useState<boolean>(false);
  const [isPortrait, setIsPortrait] = useState<boolean>(false);
  const [dismissed, setDismissed] = useState<boolean>(false);

  // Check device type and orientation
  const updateOrientation = useCallback(() => {
    if (typeof window === 'undefined' || typeof navigator === 'undefined') return;

    // 1. Precise device identification (desktop/laptop vs actual mobile touch phone)
    const isMobileUA = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile/i.test(
      navigator.userAgent
    );

    const hasCoarseTouch =
      window.matchMedia && window.matchMedia('(pointer: coarse)').matches;
    const hasFineMouse =
      window.matchMedia &&
      window.matchMedia('(pointer: fine)').matches &&
      !window.matchMedia('(pointer: coarse)').matches;

    // On desktop and laptop (including narrow windows & dev preview iframes), hasFineMouse is true or !isMobileUA
    // Mobile device is confirmed only when mobile UA + touch capabilities exist
    const isGenuineMobile = isMobileUA && (navigator.maxTouchPoints > 0 || hasCoarseTouch) && !hasFineMouse;
    setIsMobileDevice(isGenuineMobile);

    // 2. Accurate orientation detection via matchMedia & viewport geometry
    const mqlPortrait = window.matchMedia ? window.matchMedia('(orientation: portrait)').matches : false;
    const dimensionPortrait = window.innerHeight > window.innerWidth;
    const currentIsPortrait = mqlPortrait || dimensionPortrait;
    setIsPortrait(currentIsPortrait);

    // If user rotated to landscape, reset dismissed status so prompt can remind them if they flip back
    if (!currentIsPortrait) {
      setDismissed(false);
    }
  }, []);

  useEffect(() => {
    updateOrientation();

    // Listen to matchMedia orientation query
    let mql: MediaQueryList | null = null;
    if (typeof window !== 'undefined' && window.matchMedia) {
      mql = window.matchMedia('(orientation: portrait)');
      mql.addEventListener('change', updateOrientation);
    }

    window.addEventListener('resize', updateOrientation);
    window.addEventListener('orientationchange', updateOrientation);

    return () => {
      if (mql) {
        mql.removeEventListener('change', updateOrientation);
      }
      window.removeEventListener('resize', updateOrientation);
      window.removeEventListener('orientationchange', updateOrientation);
    };
  }, [updateOrientation]);

  // RULE 1 to 5: NEVER block Menu, Lobby, or Modals
  // Prompt ONLY activates when entering active gameplay that genuinely benefits from landscape
  const isGameplayActive = appScreen === 'GAME' && gameState !== 'MENU';

  // RULE 7: On desktop and laptop, prompt NEVER appears
  if (!isMobileDevice) return null;

  // RULE 6: Only in active gameplay
  if (!isGameplayActive) return null;

  // If in landscape or dismissed, do not render
  if (!isPortrait || dismissed) return null;

  // RULE 8: Non-blocking visual guidance with easy dismiss option
  return (
    <div
      className="fixed top-2 left-2 right-2 sm:top-4 sm:left-4 sm:right-4 z-50 flex items-center justify-center pointer-events-auto animate-fadeIn select-none box-border"
      style={{ boxSizing: 'border-box' }}
    >
      <div className="w-full max-w-md p-3 sm:p-4 bg-[#183d38]/95 backdrop-blur-md border-2 border-[#f4d7a1] rounded-[16px] shadow-2xl flex items-center justify-between gap-3 text-slate-100">
        {/* Animated Phone Rotate Icon */}
        <div className="relative w-11 h-11 rounded-[10px] bg-[#24564b] border border-[#ffd166] flex items-center justify-center text-[#ffd166] shrink-0 shadow-md">
          <Smartphone className="w-6 h-6 transform rotate-90 animate-bounce" />
          <div className="absolute -bottom-1 -right-1 p-0.5 rounded-full bg-[#d95d39] text-[#fff1c7] border border-[#f4d7a1]">
            <RotateCw className="w-3 h-3 animate-spin" />
          </div>
        </div>

        {/* Informational Text */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-black text-[#ffd166] tracking-wide font-serif">
              Disarankan Mode Lanskap
            </span>
          </div>
          <p className="text-[10px] text-[#b5d48c] leading-tight mt-0.5">
            Putar HP horizontal agar arena Jamuran & garis bilangan lebih leluasa.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={() => setDismissed(true)}
            className="min-h-[36px] px-3 py-1 bg-[#d95d39] hover:bg-[#c04a28] active:scale-95 text-[#fff1c7] font-bold rounded-[10px] border border-[#f4d7a1] shadow text-[11px] flex items-center gap-1 cursor-pointer transition-transform"
            title="Lanjutkan bermain dalam posisi tegak"
          >
            <Play className="w-3 h-3 fill-current" /> Lanjut
          </button>

          <button
            onClick={() => setDismissed(true)}
            className="w-8 h-8 rounded-[10px] bg-[#0f2824] hover:bg-[#24564b] border border-[#f4d7a1]/30 flex items-center justify-center text-slate-300 hover:text-white cursor-pointer active:scale-95"
            title="Tutup pemberitahuan"
            aria-label="Tutup"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
