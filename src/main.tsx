// Defensive polyfill for environments where window.fetch has only a getter
try {
  let _origFetch = typeof window !== 'undefined' ? window.fetch : null;
  let _currentFetch = _origFetch ? _origFetch.bind(window) : null;
  if (typeof window !== 'undefined') {
    Object.defineProperty(window, 'fetch', {
      get() {
        return _currentFetch || (window.fetch ? window.fetch.bind(window) : undefined);
      },
      set(fn) {
        _currentFetch = fn;
      },
      configurable: true,
      enumerable: true
    });
  }
} catch {
  // Ignored
}

import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { verifyJamuranAudioFiles } from './utils/audioDiagnostics';

// Verify audio asset accessibility and log 404s in dev
if (typeof window !== 'undefined') {
  verifyJamuranAudioFiles().catch((err) => {
    console.warn('[AudioDiagnostics] Startup verification error:', err);
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
