import { audioManager } from './gamelanAudio';

let lastClickTime = 0;
const CLICK_THROTTLE_MS = 60; // 60ms debounce window prevents double-fire or sound stacking

/**
 * Triggers the centralized UI click sound effect with debounce and mute respect.
 * Safe to call from any click handler, button component, or event listener.
 */
export function playUIClick(): void {
  const now = Date.now();
  if (now - lastClickTime < CLICK_THROTTLE_MS) {
    return;
  }
  lastClickTime = now;

  // audioManager.playClick() internally checks isMuted and resumes suspended AudioContext
  audioManager.playClick();
}

/**
 * Global document event listener that captures user interactions on all buttons,
 * tabs, and interactive clickable controls across the entire JAMATH application.
 *
 * This provides 100% universal sound coverage even for dynamically rendered elements,
 * third-party icons, and custom cards, without double-firing thanks to the 60ms throttle.
 */
export function initGlobalClickSoundListener(): () => void {
  if (typeof window === 'undefined') return () => {};

  const handlePointerDown = (e: PointerEvent) => {
    const target = e.target as HTMLElement | null;
    if (!target) return;

    // Check if clicked element is inside a button, role="button", role="tab", or custom interactive target
    const interactive = target.closest(
      'button, [role="button"], [role="tab"], input[type="button"], input[type="submit"], [data-click-sound]'
    ) as HTMLElement | null;

    if (!interactive) return;

    // Guard: Do not play sound if disabled or aria-disabled
    if (
      (interactive as HTMLButtonElement).disabled ||
      interactive.getAttribute('aria-disabled') === 'true' ||
      interactive.classList.contains('pointer-events-none') ||
      interactive.classList.contains('disabled')
    ) {
      return;
    }

    playUIClick();
  };

  // We listen on capture phase of 'pointerdown' for instantaneous tactile feedback on both mobile touches and mouse clicks
  window.addEventListener('pointerdown', handlePointerDown, { capture: true, passive: true });

  return () => {
    window.removeEventListener('pointerdown', handlePointerDown, { capture: true });
  };
}
