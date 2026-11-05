import React from 'react';
import { JamathGame } from './components/JamathGame';
import { ResponsiveLandscapeWrapper } from './components/layout/ResponsiveLandscapeWrapper';

/**
 * Main Application Root
 *
 * Implements a standard Flexbox-based shell that incorporates `box-sizing: border-box`.
 * Uses ResponsiveLandscapeWrapper to enforce landscape-first presentation, prevent viewport
 * overflow, and ensure consistent responsive boundaries across all devices and game stages.
 */
export default function App() {
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
