/**
 * Audio Diagnostics Utility for JAMATH
 *
 * Verifies that all four authentic Jamuran audio files (1.mp3 to 4.mp3) are correctly
 * resolved and accessible using Vite's `import.meta.env.BASE_URL` in both development
 * and production environments (e.g. GitHub Pages `/jamuran/` subpath).
 *
 * Automatically logs 404 Not Found and SPA HTML fallback errors to the console
 * during development, and provides a programmatic API for health checks.
 */

export interface AudioDiagnosticItem {
  file: string;
  resolvedUrl: string;
  accessible: boolean;
  status?: number;
  statusText?: string;
  contentType?: string | null;
  contentLength?: number | null;
  isHtmlFallback?: boolean;
  error?: string;
  durationMs?: number;
}

export interface AudioDiagnosticReport {
  baseUrl: string;
  mode: string;
  isDev: boolean;
  timestamp: string;
  allAccessible: boolean;
  totalChecked: number;
  totalSuccess: number;
  totalFailed: number;
  results: AudioDiagnosticItem[];
}

export interface AudioDiagnosticOptions {
  /** Log diagnostic summary and errors to console (defaults to true in dev) */
  logToConsole?: boolean;
  /** Force check even if already performed */
  force?: boolean;
  /** Timeout per audio check in milliseconds (defaults to 5000ms) */
  timeoutMs?: number;
}

export const JAMURAN_AUDIO_ASSET_PATHS = [
  'audio/1.mp3',
  'audio/2.mp3',
  'audio/3.mp3',
  'audio/4.mp3'
] as const;

let cachedReport: AudioDiagnosticReport | null = null;
let isRunningDiagnostics = false;

/**
 * Resolves a public asset path against import.meta.env.BASE_URL.
 * Handles trailing and leading slashes safely.
 */
export function resolveAudioUrlWithBase(assetPath: string): string {
  const base = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.BASE_URL) || '/';
  const cleanBase = base.endsWith('/') ? base : `${base}/`;
  const cleanPath = assetPath.startsWith('/') ? assetPath.slice(1) : assetPath;
  return `${cleanBase}${cleanPath}`;
}

/**
 * Runs diagnostics on a single audio URL using fetch HEAD/GET and Audio element verification.
 */
async function testSingleAudioFile(
  assetPath: string,
  timeoutMs = 5000
): Promise<AudioDiagnosticItem> {
  const resolvedUrl = resolveAudioUrlWithBase(assetPath);
  const startTime = performance.now();

  const item: AudioDiagnosticItem = {
    file: assetPath,
    resolvedUrl,
    accessible: false
  };

  if (typeof window === 'undefined') {
    item.error = 'Window/DOM environment not available';
    return item;
  }

  // 1. HTTP Probe via Fetch API
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    // Try HEAD first; fallback to GET with byte range if server forbids HEAD
    let response: Response;
    try {
      response = await fetch(resolvedUrl, {
        method: 'HEAD',
        signal: controller.signal
      });
      // If HEAD is disallowed (405 Method Not Allowed), retry with small range GET
      if (response.status === 405) {
        response = await fetch(resolvedUrl, {
          method: 'GET',
          headers: { Range: 'bytes=0-10' },
          signal: controller.signal
        });
      }
    } catch {
      // Retry with GET on fetch network failure
      response = await fetch(resolvedUrl, {
        method: 'GET',
        headers: { Range: 'bytes=0-10' },
        signal: controller.signal
      });
    } finally {
      clearTimeout(timer);
    }

    item.status = response.status;
    item.statusText = response.statusText;
    item.contentType = response.headers.get('content-type');
    const cl = response.headers.get('content-length');
    item.contentLength = cl ? parseInt(cl, 10) : null;
    item.durationMs = Math.round(performance.now() - startTime);

    // Check for SPA HTML fallback (when a 404 returns index.html with 200 OK)
    const isHtml = item.contentType?.toLowerCase().includes('text/html');
    if (isHtml) {
      item.isHtmlFallback = true;
      item.accessible = false;
      item.error = `Server returned HTML content instead of audio (SPA 404 rewrite). Expected audio/mpeg, got ${item.contentType}`;
      return item;
    }

    if (response.status === 404) {
      item.accessible = false;
      item.error = `HTTP 404 Not Found: The file "${assetPath}" was not found at "${resolvedUrl}".`;
      return item;
    }

    if (!response.ok && response.status !== 206) {
      item.accessible = false;
      item.error = `HTTP Error ${response.status} (${response.statusText}) on "${resolvedUrl}".`;
      return item;
    }

    // 2. Audio decoding element check
    const canDecode = await new Promise<boolean>((resolve) => {
      const audio = new Audio();
      let settled = false;

      const cleanup = () => {
        audio.removeEventListener('loadedmetadata', onLoaded);
        audio.removeEventListener('canplay', onLoaded);
        audio.removeEventListener('error', onError);
      };

      const onLoaded = () => {
        if (!settled) {
          settled = true;
          cleanup();
          resolve(true);
        }
      };

      const onError = () => {
        if (!settled) {
          settled = true;
          cleanup();
          resolve(false);
        }
      };

      audio.addEventListener('loadedmetadata', onLoaded, { once: true });
      audio.addEventListener('canplay', onLoaded, { once: true });
      audio.addEventListener('error', onError, { once: true });

      // Fallback timeout for audio element check
      setTimeout(() => {
        if (!settled) {
          settled = true;
          cleanup();
          // If HTTP succeeded, assume valid even if metadata decode timed out
          resolve(true);
        }
      }, 2500);

      audio.preload = 'metadata';
      audio.src = resolvedUrl;
    });

    if (!canDecode) {
      item.accessible = false;
      item.error = `Audio element failed to load/decode file at "${resolvedUrl}".`;
      return item;
    }

    item.accessible = true;
    return item;
  } catch (err: unknown) {
    item.durationMs = Math.round(performance.now() - startTime);
    item.accessible = false;
    const msg = err instanceof Error ? err.message : String(err);
    item.error = `Fetch request failed: ${msg}`;
    return item;
  }
}

/**
 * Diagnostic utility function to verify that all four audio files (1.mp3 to 4.mp3)
 * are correctly resolved and accessible using import.meta.env.BASE_URL in the production
 * environment, and log any 404 errors to the console during development.
 */
export async function verifyJamuranAudioFiles(
  options: AudioDiagnosticOptions = {}
): Promise<AudioDiagnosticReport> {
  const isDev = Boolean(
    typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.DEV
  );
  const baseUrl = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.BASE_URL) || '/';
  const mode = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.MODE) || 'unknown';

  const logToConsole = options.logToConsole ?? true;

  if (cachedReport && !options.force) {
    return cachedReport;
  }

  if (isRunningDiagnostics) {
    // Wait briefly if already running
    await new Promise((r) => setTimeout(r, 300));
    if (cachedReport) return cachedReport;
  }

  isRunningDiagnostics = true;

  try {
    const results = await Promise.all(
      JAMURAN_AUDIO_ASSET_PATHS.map((path) =>
        testSingleAudioFile(path, options.timeoutMs ?? 5000)
      )
    );

    const totalSuccess = results.filter((r) => r.accessible).length;
    const totalFailed = results.length - totalSuccess;
    const allAccessible = totalFailed === 0;

    const report: AudioDiagnosticReport = {
      baseUrl,
      mode,
      isDev,
      timestamp: new Date().toISOString(),
      allAccessible,
      totalChecked: results.length,
      totalSuccess,
      totalFailed,
      results
    };

    cachedReport = report;

    // Console logging
    if (logToConsole) {
      const prefix = `[AudioDiagnostics BASE_URL="${baseUrl}"]`;

      if (allAccessible) {
        if (isDev) {
          console.info(
            `%c${prefix} ✅ All 4 Jamuran audio tracks are accessible and correctly resolved!`,
            'color: #10b981; font-weight: bold;',
            results.map((r) => ({ file: r.file, url: r.resolvedUrl, time: `${r.durationMs}ms` }))
          );
        }
      } else {
        // Always log failures in both dev and production, with detailed warnings in dev
        console.error(
          `%c${prefix} ❌ AUDIO RESOLUTION FAILURE: ${totalFailed}/${results.length} files inaccessible!`,
          'color: #ef4444; font-weight: bold;'
        );

        results.forEach((item) => {
          if (!item.accessible) {
            console.error(
              `[AudioDiagnostics] ❌ 404 / Loading Error on "${item.file}":\n` +
              `  • Resolved URL: ${item.resolvedUrl}\n` +
              `  • HTTP Status: ${item.status ?? 'N/A'} (${item.statusText ?? 'No Response'})\n` +
              `  • Error: ${item.error ?? 'Unknown error'}\n` +
              (isDev
                ? `  • Dev Tip: Verify that "public/${item.file}" exists in the repo and that vite.config.ts base is configured to match deployment path (e.g., base: '/jamuran/').`
                : '')
            );
          }
        });
      }
    }

    return report;
  } finally {
    isRunningDiagnostics = false;
  }
}

/**
 * Expose on window object for manual on-demand testing in browser DevTools
 * (e.g. typing window.__jamathAudioDiagnostics() in Chrome/Safari console on GitHub Pages)
 */
if (typeof window !== 'undefined') {
  (window as unknown as { __jamathAudioDiagnostics?: () => Promise<AudioDiagnosticReport> })
    .__jamathAudioDiagnostics = () => verifyJamuranAudioFiles({ force: true, logToConsole: true });
}
