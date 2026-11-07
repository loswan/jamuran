import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { verifyJamuranAudioFiles } from './utils/audioDiagnostics';

// Verify audio asset accessibility and log 404s in dev
if (typeof window !== 'undefined') {
  // Allow initial mount and DOM settling before running diagnostic probes
  setTimeout(() => {
    verifyJamuranAudioFiles().catch((err) => {
      console.warn('[AudioDiagnostics] Startup verification error:', err);
    });
  }, 150);
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
