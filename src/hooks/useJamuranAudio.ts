import { useState, useEffect, useRef, useCallback } from 'react';
export { verifyJamuranAudioFiles } from '../utils/audioDiagnostics';
export type { AudioDiagnosticReport, AudioDiagnosticItem } from '../utils/audioDiagnostics';

/**
 * Constructs an audio file URL by prepending Vite's import.meta.env.BASE_URL
 * to the public asset path. This ensures seamless compatibility with the
 * GitHub Pages sub-directory (/jamuran/) as well as root-hosted development environments.
 */
export function getPublicAudioUrl(assetPath: string): string {
  const base = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.BASE_URL) || '/';
  const cleanBase = base.endsWith('/') ? base : `${base}/`;
  const cleanPath = assetPath.startsWith('/') ? assetPath.slice(1) : assetPath;
  return `${cleanBase}${cleanPath}`;
}

export const JAMURAN_AUDIO_FILES = [
  getPublicAudioUrl('audio/1.mp3'),
  getPublicAudioUrl('audio/2.mp3'),
  getPublicAudioUrl('audio/3.mp3'),
  getPublicAudioUrl('audio/4.mp3')
] as const;

export type JamuranAudioTrackUrl = string;

export interface TrackInfo {
  index: number;
  number: number; // 1-based (1, 2, 3, 4)
  url: string;
  name: string;
}

export const JAMURAN_TRACK_METADATA: TrackInfo[] = [
  { index: 0, number: 1, url: getPublicAudioUrl('audio/1.mp3'), name: 'Jamuran Putaran 1 (Jamur apaaa?)' },
  { index: 1, number: 2, url: getPublicAudioUrl('audio/2.mp3'), name: 'Perintah 1 (Jamur gagak, gaok-gaok)' },
  { index: 2, number: 3, url: getPublicAudioUrl('audio/3.mp3'), name: 'Jamuran Putaran 2 (Jamur apaaa?)' },
  { index: 3, number: 4, url: getPublicAudioUrl('audio/4.mp3'), name: 'Perintah 2 (Kethek menek)' }
];

export interface UseJamuranAudioOptions {
  /** Automatically proceed to next track in queue (1 -> 2 -> 3 -> 4 -> 1) when current finishes */
  autoAdvance?: boolean;
  /** Initial track index to start with (0 to 3, defaults to 0 for /audio/1.mp3) */
  initialTrackIndex?: number;
  /** Callback fired when a track finishes playing */
  onTrackEnded?: (completedTrackIndex: number, nextTrackIndex: number) => void;
  /** Callback fired whenever the active track changes */
  onTrackChange?: (newTrackIndex: number, trackInfo: TrackInfo) => void;
}

export interface UseJamuranAudioReturn {
  // Core methods requested
  play: (targetTrackIndex?: number) => Promise<void>;
  pause: () => void;
  stop: () => void;
  currentTime: () => number;

  // Queue navigation methods
  nextTrack: () => Promise<void>;
  previousTrack: () => Promise<void>;
  seek: (seconds: number) => void;
  preloadAll: () => void;
  setMuted: (muted: boolean) => void;
  toggleMute: () => boolean;

  // Reactive state
  time: number;
  duration: number;
  isPlaying: boolean;
  isBuffering: boolean;
  isMuted: boolean;
  currentTrackIndex: number;
  currentTrackNumber: number;
  currentTrackUrl: string;
  currentTrackInfo: TrackInfo;
  tracks: TrackInfo[];
}

/**
 * Shared singleton HTMLAudioElement instance to guarantee strictly
 * NO overlapping audio playback across any component instances.
 */
let sharedAudio: HTMLAudioElement | null = null;
const preloadedPool: HTMLAudioElement[] = [];

function getOrCreateSharedAudio(): HTMLAudioElement | null {
  if (typeof window === 'undefined') return null;
  if (!sharedAudio) {
    sharedAudio = new Audio();
    sharedAudio.preload = 'auto';
  }
  return sharedAudio;
}

/**
 * Preload all 4 authentic MP3 files early into the browser cache.
 */
export function preloadJamuranAudioFiles(): void {
  if (typeof window === 'undefined') return;
  if (preloadedPool.length === JAMURAN_AUDIO_FILES.length) return;

  JAMURAN_AUDIO_FILES.forEach((url) => {
    const audio = new Audio();
    audio.preload = 'auto';
    audio.src = url;
    preloadedPool.push(audio);
  });
}

/**
 * Custom React hook for controlling Jamuran authentic audio files.
 * Manages playback, preloading, and sequential queue (1 -> 2 -> 3 -> 4 -> 1)
 * with robust overlapping instance prevention.
 */
export function useJamuranAudio(options: UseJamuranAudioOptions = {}): UseJamuranAudioReturn {
  const {
    autoAdvance = true,
    initialTrackIndex = 0,
    onTrackEnded,
    onTrackChange
  } = options;

  const [currentTrackIndex, setCurrentTrackIndex] = useState<number>(() => {
    const normalized = Math.floor(initialTrackIndex) % JAMURAN_AUDIO_FILES.length;
    return normalized >= 0 ? normalized : 0;
  });

  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isBuffering, setIsBuffering] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [time, setTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);

  // References to keep callbacks current without resetting listeners
  const currentTrackIndexRef = useRef<number>(currentTrackIndex);
  currentTrackIndexRef.current = currentTrackIndex;

  const autoAdvanceRef = useRef<boolean>(autoAdvance);
  autoAdvanceRef.current = autoAdvance;

  const onTrackEndedRef = useRef(onTrackEnded);
  onTrackEndedRef.current = onTrackEnded;

  const onTrackChangeRef = useRef(onTrackChange);
  onTrackChangeRef.current = onTrackChange;

  // Preload files on hook initialization
  useEffect(() => {
    preloadJamuranAudioFiles();
  }, []);

  /**
   * Helper to ensure no overlapping audio instances exist by checking
   * existing player states and pausing any active playback before proceeding.
   */
  const ensureNoOverlappingPlayback = useCallback((): HTMLAudioElement | null => {
    const audio = getOrCreateSharedAudio();
    if (!audio) return null;

    // Check existing player state: If already playing or paused mid-track, pause first
    if (!audio.paused) {
      audio.pause();
    }
    return audio;
  }, []);

  /**
   * Expose currentTime as a callable method returning playback time in seconds
   */
  const currentTimeMethod = useCallback((): number => {
    const audio = getOrCreateSharedAudio();
    return audio ? audio.currentTime : 0;
  }, []);

  /**
   * Play method: Plays currently queued track or switches to a specific track index.
   * Checks existing player state to prevent overlapping audio instances.
   */
  const play = useCallback(
    async (targetTrackIndex?: number): Promise<void> => {
      const audio = getOrCreateSharedAudio();
      if (!audio) return;

      const destIndex =
        typeof targetTrackIndex === 'number'
          ? ((targetTrackIndex % JAMURAN_AUDIO_FILES.length) + JAMURAN_AUDIO_FILES.length) %
            JAMURAN_AUDIO_FILES.length
          : currentTrackIndexRef.current;

      const targetUrl = JAMURAN_AUDIO_FILES[destIndex];
      const isDifferentTrack = !audio.src.includes(targetUrl);

      // Check existing player state: stop overlapping instances if switching track
      if (isDifferentTrack) {
        if (!audio.paused) {
          audio.pause();
        }
        audio.src = targetUrl;
        audio.currentTime = 0;
        setCurrentTrackIndex(destIndex);
        currentTrackIndexRef.current = destIndex;

        if (onTrackChangeRef.current) {
          onTrackChangeRef.current(destIndex, JAMURAN_TRACK_METADATA[destIndex]);
        }
      }

      audio.muted = isMuted;

      try {
        const playPromise = audio.play();
        if (playPromise !== undefined) {
          await playPromise;
        }
        setIsPlaying(true);
      } catch (err) {
        // Autoplay restrictions or browser policy
        console.warn('Playback prevented or interrupted:', err);
        setIsPlaying(false);
      }
    },
    [isMuted]
  );

  /**
   * Pause method: Pauses current playback without losing track position
   */
  const pause = useCallback((): void => {
    const audio = getOrCreateSharedAudio();
    if (audio && !audio.paused) {
      audio.pause();
    }
    setIsPlaying(false);
  }, []);

  /**
   * Stop method: Pauses audio and rewinds playback to the start (0.00s)
   */
  const stop = useCallback((): void => {
    const audio = getOrCreateSharedAudio();
    if (audio) {
      if (!audio.paused) {
        audio.pause();
      }
      audio.currentTime = 0;
    }
    setIsPlaying(false);
    setTime(0);
  }, []);

  /**
   * Advance to the next sequential track in the queue (1 -> 2 -> 3 -> 4 -> 1)
   */
  const nextTrack = useCallback(async (): Promise<void> => {
    const nextIndex = (currentTrackIndexRef.current + 1) % JAMURAN_AUDIO_FILES.length;
    await play(nextIndex);
  }, [play]);

  /**
   * Return to the previous track in the queue (with wraparound)
   */
  const previousTrack = useCallback(async (): Promise<void> => {
    const prevIndex =
      (currentTrackIndexRef.current - 1 + JAMURAN_AUDIO_FILES.length) % JAMURAN_AUDIO_FILES.length;
    await play(prevIndex);
  }, [play]);

  /**
   * Seek to a specific timestamp within the current track
   */
  const seek = useCallback((seconds: number): void => {
    const audio = getOrCreateSharedAudio();
    if (!audio) return;
    const clamped = Math.max(0, Math.min(seconds, audio.duration || 0));
    audio.currentTime = clamped;
    setTime(clamped);
  }, []);

  /**
   * Mute control
   */
  const setMuted = useCallback((muted: boolean): void => {
    const audio = getOrCreateSharedAudio();
    if (audio) {
      audio.muted = muted;
    }
    setIsMuted(muted);
  }, []);

  const toggleMute = useCallback((): boolean => {
    const next = !isMuted;
    setMuted(next);
    return next;
  }, [isMuted, setMuted]);

  // Synchronize event listeners with shared audio instance
  useEffect(() => {
    const audio = getOrCreateSharedAudio();
    if (!audio) return;

    const handleTimeUpdate = () => {
      setTime(audio.currentTime);
      if (audio.duration && !isNaN(audio.duration)) {
        setDuration(audio.duration);
      }
    };

    const handleLoadedMetadata = () => {
      if (audio.duration && !isNaN(audio.duration)) {
        setDuration(audio.duration);
      }
    };

    const handlePlay = () => {
      setIsPlaying(true);
      setIsBuffering(false);
    };

    const handlePause = () => {
      setIsPlaying(false);
    };

    const handleWaiting = () => {
      setIsBuffering(true);
    };

    const handlePlaying = () => {
      setIsBuffering(false);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      const completed = currentTrackIndexRef.current;
      // Sequential queue: 1 -> 2 -> 3 -> 4 -> 1 (0 -> 1 -> 2 -> 3 -> 0)
      const nextIndex = (completed + 1) % JAMURAN_AUDIO_FILES.length;

      if (onTrackEndedRef.current) {
        onTrackEndedRef.current(completed, nextIndex);
      }

      if (autoAdvanceRef.current) {
        // Automatically play the next track in sequential queue
        play(nextIndex);
      }
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('waiting', handleWaiting);
    audio.addEventListener('playing', handlePlaying);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('waiting', handleWaiting);
      audio.removeEventListener('playing', handlePlaying);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [play]);

  return {
    play,
    pause,
    stop,
    currentTime: currentTimeMethod,
    nextTrack,
    previousTrack,
    seek,
    preloadAll: preloadJamuranAudioFiles,
    setMuted,
    toggleMute,
    time,
    duration,
    isPlaying,
    isBuffering,
    isMuted,
    currentTrackIndex,
    currentTrackNumber: currentTrackIndex + 1,
    currentTrackUrl: JAMURAN_AUDIO_FILES[currentTrackIndex],
    currentTrackInfo: JAMURAN_TRACK_METADATA[currentTrackIndex],
    tracks: JAMURAN_TRACK_METADATA
  };
}
