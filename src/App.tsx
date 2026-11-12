import React, { useEffect } from 'react';
import { JamathGame } from './components/JamathGame';
import { ResponsiveLandscapeWrapper } from './components/layout/ResponsiveLandscapeWrapper';
import { initGlobalClickSoundListener } from './audio/uiSound';

/**
 * Main Application Root
 *
 * Implements a standard Flexbox-based shell that incorporates `box-sizing: border-box`.
 * Uses ResponsiveLandscapeWrapper to enforce landscape-first presentation, prevent viewport
 * overflow, and ensure consistent responsive boundaries across all devices and game stages.
 * Initializes the universal UI click sound listener for 100% interactive coverage.
 */
export default function App() {
  useEffect(() => {
    const cleanup = initGlobalClickSoundListener();
    return cleanup;
  }, []);

  return (
    <div
      className="w-full h-full flex flex-col flex-1 min-h-0 min-w-0 bg-[#091614] overflow-hidden select-none box-border"
      style={{ boxSizing: 'border-box' }}
    >
      <ResponsiveLandscapeWrapper>
        <JamathGame />
      </ResponsiveLandscapeWrapper>
    </div>
  );
}
