/**
 * Jamuran Local Audio Controller
 * Manages playback of the 4 authentic local Jamuran audio files:
 * 1. /audio/1.mp3 (00:00.00 - 00:42.34, "Jamur apaaa?") -> Circling Round 1
 * 2. /audio/2.mp3 (00:42.81 - 00:54.39, "Jamur gagak, gaok-gaok") -> Command Action 1
 * 3. /audio/3.mp3 (00:54.70 - 01:35.93, "Jamur apaaa?") -> Circling Round 2
 * 4. /audio/4.mp3 (01:36.09 - 02:06.85, "Kethek menek") -> Command Action 2
 *
 * Sequence: 1.mp3 -> 2.mp3 -> 3.mp3 -> 4.mp3 -> 1.mp3 (repeats across rounds)
 * HTML Audio API singleton with zero audio overlap, buffering sync, and clean lifecycle.
 */

export interface TrackMetadata {
  id: number;
  url: string;
  name: string;
  phase: 'circling' | 'command';
  commandName: string;
  commandId: 'gagak' | 'kethek';
  durationEst: number;
  lyrics: { time: number; text: string }[];
}

/**
 * Resolves an audio file URL using Vite's BASE_URL.
 * This guarantees seamless loading on:
 * - Local development and AI Studio preview ('/')
 * - GitHub Pages subpath deployment ('/jamuran/')
 */
export function getAudioPath(relativePath: string): string {
  const base = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.BASE_URL) || '/';
  const cleanBase = base.endsWith('/') ? base : `${base}/`;
  const cleanRelative = relativePath.startsWith('/') ? relativePath.slice(1) : relativePath;
  return `${cleanBase}${cleanRelative}`;
}

export const JAMURAN_TRACKS: TrackMetadata[] = [
  {
    id: 1,
    url: getAudioPath('audio/1.mp3'),
    name: 'Bait 1: Jamuran ya ge-ge thok',
    phase: 'circling',
    commandName: 'JAMUR GAGAK',
    commandId: 'gagak',
    durationEst: 42.06,
    lyrics: [
      { time: 0.0, text: 'Gamelan Buka...' },
      { time: 4.5, text: 'Jamuran...' },
      { time: 9.5, text: 'ya gē-gē thok...' },
      { time: 14.0, text: 'Jamur apa...' },
      { time: 19.0, text: 'ya gē-gē thok...' },
      { time: 23.5, text: 'Jamur gajih mbregijih...' },
      { time: 29.5, text: 'sa-ara-ara...' },
      { time: 34.5, text: 'Semprat-semprit...' },
      { time: 38.5, text: 'JAMUR APA?!' }
    ]
  },
  {
    id: 2,
    url: getAudioPath('audio/2.mp3'),
    name: 'Perintah 1: Jamur Gagak, Gaok-gaok',
    phase: 'command',
    commandName: 'JAMUR GAGAK',
    commandId: 'gagak',
    durationEst: 11.62,
    lyrics: [
      { time: 0.0, text: 'Jamur gagak, gaok-gaok!' }
    ]
  },
  {
    id: 3,
    url: getAudioPath('audio/3.mp3'),
    name: 'Bait 2: Jamuran ya ge-ge thok',
    phase: 'circling',
    commandName: 'JAMUR KETHEK',
    commandId: 'kethek',
    durationEst: 41.27,
    lyrics: [
      { time: 0.0, text: 'Gamelan Buka...' },
      { time: 4.0, text: 'Jamuran...' },
      { time: 9.0, text: 'ya gē-gē thok...' },
      { time: 13.5, text: 'Jamur apa...' },
      { time: 18.5, text: 'ya gē-gē thok...' },
      { time: 23.0, text: 'Jamur gajih mbregijih...' },
      { time: 29.0, text: 'sa-ara-ara...' },
      { time: 34.0, text: 'Semprat-semprit...' },
      { time: 38.0, text: 'JAMUR APA?!' }
    ]
  },
  {
    id: 4,
    url: getAudioPath('audio/4.mp3'),
    name: 'Perintah 2: Kethek Menek',
    phase: 'command',
    commandName: 'JAMUR KETHEK',
    commandId: 'kethek',
    durationEst: 30.77,
    lyrics: [
      { time: 0.0, text: 'Kethek menek!' }
    ]
  }
];

export interface AudioControllerStatus {
  trackIndex: number;
  trackId: number;
  url: string;
  name: string;
  phase: 'circling' | 'command';
  commandName: string;
  isPlaying: boolean;
  isBuffering: boolean;
  currentTime: number;
  duration: number;
  currentLyric: string;
  isMuted: boolean;
}

type StatusListener = (status: AudioControllerStatus) => void;

class JamuranAudioController {
  private audio: HTMLAudioElement | null = null;
  private currentTrackIndex = 0; // 0 (1.mp3), 1 (2.mp3), 2 (3.mp3), 3 (4.mp3)
  private isMuted = false;
  private isBufferingState = false;
  private listeners: Set<StatusListener> = new Set();
  private onTrackEndedCallback?: (completedTrackIndex: number, nextTrackIndex: number) => void;
  private onLyricCallback?: (lyric: string) => void;

  constructor() {
    if (typeof window !== 'undefined') {
      this.initAudioElement();
    }
  }

  private initAudioElement(): void {
    if (this.audio) return;
    this.audio = new Audio();
    this.audio.preload = 'auto';
    this.audio.muted = this.isMuted;
    this.audio.src = JAMURAN_TRACKS[this.currentTrackIndex].url;

    this.audio.addEventListener('timeupdate', () => {
      this.updateLyric();
      this.notifyStatus();
    });

    this.audio.addEventListener('ended', () => {
      this.handleAudioEnded();
    });

    this.audio.addEventListener('waiting', () => {
      this.isBufferingState = true;
      this.notifyStatus();
    });

    this.audio.addEventListener('playing', () => {
      this.isBufferingState = false;
      this.notifyStatus();
    });

    this.audio.addEventListener('pause', () => {
      this.notifyStatus();
    });

    this.audio.addEventListener('error', (e) => {
      const err = this.audio?.error;
      const currentSrc = this.audio?.src || '';
      console.warn(`[JamuranAudio] Audio loading error (code ${err?.code || 'unknown'}): ${err?.message || ''} on URL: ${currentSrc}`, e);

      // Automatic fallback between /jamuran/audio/ and /audio/ in case of unexpected hosting routing
      if (this.audio && !currentSrc.includes('fallback=1')) {
        let fallbackUrl = '';
        if (currentSrc.includes('/jamuran/audio/')) {
          fallbackUrl = currentSrc.replace('/jamuran/audio/', '/audio/') + '?fallback=1';
        } else if (currentSrc.includes('/audio/')) {
          fallbackUrl = currentSrc.replace('/audio/', '/jamuran/audio/') + '?fallback=1';
        }

        if (fallbackUrl) {
          console.info(`[JamuranAudio] Retrying with alternative path: ${fallbackUrl}`);
          this.audio.src = fallbackUrl;
          this.audio.load();
          this.audio.play().catch(() => {});
          return;
        }
      }

      this.isBufferingState = false;
      this.notifyStatus();
    });
  }

  private isUserGestureListenerAttached = false;

  /**
   * Browser autoplay policy helper: if audio playback was prevented
   * because user hasn't interacted with page yet, unlocks audio upon first tap/click.
   */
  private unlockAutoplayOnUserInteraction(): void {
    if (this.isUserGestureListenerAttached || typeof window === 'undefined') return;
    this.isUserGestureListenerAttached = true;

    const resumeOnGesture = () => {
      if (this.audio && this.audio.paused) {
        this.audio.play().catch((err) => {
          console.warn('[JamuranAudio] Retry play after gesture failed:', err);
        });
      }
      window.removeEventListener('pointerdown', resumeOnGesture);
      window.removeEventListener('touchstart', resumeOnGesture);
      window.removeEventListener('keydown', resumeOnGesture);
      this.isUserGestureListenerAttached = false;
    };

    window.addEventListener('pointerdown', resumeOnGesture, { once: true });
    window.addEventListener('touchstart', resumeOnGesture, { once: true });
    window.addEventListener('keydown', resumeOnGesture, { once: true });
  }

  /**
   * Preloads all 4 MP3 audio files in the browser cache early
   */
  public preloadAll(): void {
    if (typeof window === 'undefined') return;
    JAMURAN_TRACKS.forEach((track) => {
      const a = new Audio();
      a.preload = 'auto';
      a.src = track.url;
    });
  }

  public setCallbacks(
    onLyric?: (lyric: string) => void,
    onTrackEnded?: (completedTrackIndex: number, nextTrackIndex: number) => void
  ): void {
    this.onLyricCallback = onLyric;
    this.onTrackEndedCallback = onTrackEnded;
  }

  /**
   * Starts or resumes playback of a specific track by index (0, 1, 2, or 3)
   */
  public playTrack(trackIndex: number): Promise<void> {
    this.initAudioElement();
    if (!this.audio) return Promise.resolve();

    const normalizedIndex = ((trackIndex % JAMURAN_TRACKS.length) + JAMURAN_TRACKS.length) % JAMURAN_TRACKS.length;
    const targetUrl = JAMURAN_TRACKS[normalizedIndex].url;
    const isNewTrack = this.currentTrackIndex !== normalizedIndex || !this.audio.src.includes(targetUrl);

    this.currentTrackIndex = normalizedIndex;

    if (isNewTrack) {
      this.audio.pause();
      this.audio.src = targetUrl;
      this.audio.currentTime = 0;
      this.audio.load();
    }

    this.audio.muted = this.isMuted;
    const playPromise = this.audio.play();
    if (playPromise !== undefined) {
      return playPromise.catch((err) => {
        console.warn(`[JamuranAudio] Playback prevented for Track ${normalizedIndex + 1} (${targetUrl}):`, err);
        this.unlockAutoplayOnUserInteraction();
      });
    }
    return Promise.resolve();
  }

  /**
   * Plays the appropriate circling track:
   * If on odd round (round 1, 3, 5, ...): track 1 (/audio/1.mp3)
   * If on even round (round 2, 4, 6, ...): track 3 (/audio/3.mp3)
   */
  public playCirclingForRound(roundNumber: number): Promise<void> {
    const isOdd = roundNumber % 2 !== 0;
    const targetTrackIndex = isOdd ? 0 : 2; // 0: 1.mp3, 2: 3.mp3
    return this.playTrack(targetTrackIndex);
  }

  /**
   * Plays the appropriate command action track:
   * Following 1.mp3 -> track 2 (/audio/2.mp3, "Jamur gagak")
   * Following 3.mp3 -> track 4 (/audio/4.mp3, "Kethek menek")
   */
  public playCommandForCirclingTrack(circlingTrackIndex: number): Promise<void> {
    const targetCommandIndex = circlingTrackIndex === 0 ? 1 : 3; // 1: 2.mp3, 3: 4.mp3
    return this.playTrack(targetCommandIndex);
  }

  /**
   * Handles the audio 'ended' event
   */
  private handleAudioEnded(): void {
    const completedIndex = this.currentTrackIndex;
    const nextIndex = (completedIndex + 1) % JAMURAN_TRACKS.length;

    if (this.onTrackEndedCallback) {
      this.onTrackEndedCallback(completedIndex, nextIndex);
    }
    this.notifyStatus();
  }

  /**
   * Pauses audio playback without losing track position
   */
  public pause(): void {
    if (!this.audio) return;
    this.audio.pause();
    this.notifyStatus();
  }

  /**
   * Resumes playback of currently active track
   */
  public resume(): Promise<void> {
    if (!this.audio) return Promise.resolve();
    this.audio.muted = this.isMuted;
    const p = this.audio.play();
    if (p !== undefined) {
      return p.catch(() => {});
    }
    return Promise.resolve();
  }

  /**
   * Stops playback and resets position to start of current track
   */
  public stop(): void {
    if (!this.audio) return;
    this.audio.pause();
    this.audio.currentTime = 0;
    this.notifyStatus();
  }

  /**
   * Fully resets audio controller back to Track 1 (0) for new game session
   */
  public resetToBeginning(): void {
    if (!this.audio) return;
    this.audio.pause();
    this.currentTrackIndex = 0;
    this.audio.src = JAMURAN_TRACKS[0].url;
    this.audio.currentTime = 0;
    this.notifyStatus();
  }

  /**
   * Advances track index pointer to the next circling track for the next round
   */
  public advanceToNextCirclingTrack(): void {
    if (this.currentTrackIndex === 1) {
      this.currentTrackIndex = 2; // Move from 2.mp3 to 3.mp3
    } else if (this.currentTrackIndex === 3) {
      this.currentTrackIndex = 0; // Move from 4.mp3 back to 1.mp3
    }
  }

  public setMuted(muted: boolean): void {
    this.isMuted = muted;
    if (this.audio) {
      this.audio.muted = muted;
    }
    this.notifyStatus();
  }

  public getIsMuted(): boolean {
    return this.isMuted;
  }

  public toggleMute(): boolean {
    this.setMuted(!this.isMuted);
    return this.isMuted;
  }

  public getCurrentTime(): number {
    return this.audio ? this.audio.currentTime : 0;
  }

  public getDuration(): number {
    if (!this.audio || isNaN(this.audio.duration)) {
      return JAMURAN_TRACKS[this.currentTrackIndex].durationEst;
    }
    return this.audio.duration;
  }

  public isPlaying(): boolean {
    if (!this.audio) return false;
    return !this.audio.paused && !this.audio.ended && this.audio.readyState > 2;
  }

  public isBuffering(): boolean {
    return this.isBufferingState;
  }

  public getCurrentTrack(): TrackMetadata {
    return JAMURAN_TRACKS[this.currentTrackIndex];
  }

  public getCurrentTrackIndex(): number {
    return this.currentTrackIndex;
  }

  private updateLyric(): void {
    const curTime = this.getCurrentTime();
    const track = this.getCurrentTrack();
    let currentLyricText = '';

    for (let i = track.lyrics.length - 1; i >= 0; i--) {
      if (curTime >= track.lyrics[i].time) {
        currentLyricText = track.lyrics[i].text;
        break;
      }
    }

    if (currentLyricText && this.onLyricCallback) {
      this.onLyricCallback(currentLyricText);
    }
  }

  public getStatus(): AudioControllerStatus {
    const track = this.getCurrentTrack();
    let currentLyric = '';
    const curTime = this.getCurrentTime();
    for (let i = track.lyrics.length - 1; i >= 0; i--) {
      if (curTime >= track.lyrics[i].time) {
        currentLyric = track.lyrics[i].text;
        break;
      }
    }

    return {
      trackIndex: this.currentTrackIndex,
      trackId: track.id,
      url: track.url,
      name: track.name,
      phase: track.phase,
      commandName: track.commandName,
      isPlaying: this.isPlaying(),
      isBuffering: this.isBufferingState,
      currentTime: curTime,
      duration: this.getDuration(),
      currentLyric,
      isMuted: this.isMuted
    };
  }

  public subscribe(listener: StatusListener): () => void {
    this.listeners.add(listener);
    listener(this.getStatus());
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notifyStatus(): void {
    const st = this.getStatus();
    this.listeners.forEach((listener) => {
      try {
        listener(st);
      } catch {}
    });
  }
}

export const jamuranAudioController = new JamuranAudioController();
