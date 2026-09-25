/**
 * Gamelan & Jamuran Audio Synthesizer (Web Audio API)
 * Plays traditional Javanese Slendro scale melody, Kendang rhythm, Gong resonance,
 * and game sound effects with zero external dependency requirements.
 */

// Slendro Scale Frequencies (approximate traditional tuning around Pelog/Slendro Ji-Ro-Lu-Ma-Nem)
const SLENDRO = {
  JI: 275,      // 1 (Barang/Panunggul)
  RO: 308,      // 2 (Gulu)
  LU: 348,      // 3 (Dhadha)
  MA: 412,      // 5 (Lima)
  NEM: 465,     // 6 (Nem)
  JI_HI: 550,   // 1 tinggi
  RO_HI: 616,   // 2 tinggi
  LU_HI: 696    // 3 tinggi
};

export interface LyricBeat {
  time: number; // in seconds relative to song start
  text: string;
  isEndPhrase?: boolean;
}

export const JAMURAN_LYRICS: LyricBeat[] = [
  { time: 0.5, text: "Jamuran..." },
  { time: 2.2, text: "ya gē-gē thok..." },
  { time: 4.8, text: "Jamur apa..." },
  { time: 6.6, text: "ya gē-gē thok..." },
  { time: 9.2, text: "Jamur gajih mbregijih..." },
  { time: 11.8, text: "sa-ara-ara..." },
  { time: 14.2, text: "Semprat-semprit..." },
  { time: 16.0, text: "JAMUR APA?!", isEndPhrase: true }
];

export const JAMURAN_SONG_DURATION = 18.0; // seconds for one complete stanza

export class GamelanAudioEngine {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private isPlayingJamuran: boolean = false;
  private songStartTime: number = 0;
  private songScheduledTimeouts: number[] = [];
  private onLyricCallback?: (lyric: string) => void;
  private onSongEndCallback?: () => void;
  private externalAudio: HTMLAudioElement | null = null;
  private useExternalAudio: boolean = false;

  constructor() {
    // Try preloading external audio if user placed it in assets
    try {
      this.externalAudio = new Audio('assets/audio/jamuran.mp3');
      this.externalAudio.preload = 'metadata';
      this.externalAudio.addEventListener('canplaythrough', () => {
        this.useExternalAudio = true;
      });
      this.externalAudio.addEventListener('error', () => {
        this.useExternalAudio = false;
      });
    } catch {
      this.useExternalAudio = false;
    }
  }

  private initContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (this.externalAudio) {
      this.externalAudio.muted = muted;
    }
  }

  public getIsMuted(): boolean {
    return this.isMuted;
  }

  public toggleMute(): boolean {
    this.setMuted(!this.isMuted);
    return this.isMuted;
  }

  public setCallbacks(onLyric?: (lyric: string) => void, onSongEnd?: () => void) {
    this.onLyricCallback = onLyric;
    this.onSongEndCallback = onSongEnd;
  }

  /**
   * Play metallic Saron tone (fundamental + slight inharmonic chime + exponential decay)
   */
  public playSaron(freq: number, duration = 0.8, volume = 0.22, delay = 0) {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const ctx = this.ctx;
    const now = ctx.currentTime + delay;

    // Master gain for this note
    const noteGain = ctx.createGain();
    noteGain.gain.setValueAtTime(0, now);
    noteGain.gain.linearRampToValueAtTime(volume, now + 0.015);
    noteGain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    // Fundamental oscillator (sine with slight bell timbre)
    const osc1 = ctx.createOscillator();
    osc1.type = 'triangle';
    osc1.frequency.setValueAtTime(freq, now);

    // Metallic overtone (2.76x overtone typical in bronze gamelan bars)
    const osc2 = ctx.createOscillator();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(freq * 2.76, now);

    const overtoneGain = ctx.createGain();
    overtoneGain.gain.setValueAtTime(volume * 0.35, now);
    overtoneGain.gain.exponentialRampToValueAtTime(0.0001, now + duration * 0.45);

    // Lowpass filter to smooth the chime
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(Math.min(3200, freq * 5), now);

    osc1.connect(noteGain);
    osc2.connect(overtoneGain);
    overtoneGain.connect(filter);
    noteGain.connect(filter);
    filter.connect(ctx.destination);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + duration);
    osc2.stop(now + duration);
  }

  /**
   * Play Bonang / Kettle Gamelan note (pot chime with quick pitch bend)
   */
  public playBonang(freq: number, duration = 0.5, volume = 0.18, delay = 0) {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const ctx = this.ctx;
    const now = ctx.currentTime + delay;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(volume, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    const osc = ctx.createOscillator();
    osc.type = 'sine';
    // Small quick envelope dip
    osc.frequency.setValueAtTime(freq * 1.04, now);
    osc.frequency.exponentialRampToValueAtTime(freq, now + 0.04);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + duration);
  }

  /**
   * Play Kendang (Javanese double-headed drum)
   * type: 'dhung' (low deep resonant thud) | 'tak' (sharp crisp rim slap) | 'tong' (high ping)
   */
  public playKendang(type: 'dhung' | 'tak' | 'tong' = 'dhung', delay = 0) {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const ctx = this.ctx;
    const now = ctx.currentTime + delay;

    if (type === 'dhung') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(140, now);
      osc.frequency.exponentialRampToValueAtTime(58, now + 0.18);

      gain.gain.setValueAtTime(0.35, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.3);
    } else if (type === 'tak') {
      // Crisp noise pop
      const bufferSize = ctx.sampleRate * 0.06;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.2));
      }
      const noise = ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(1600, now);
      filter.Q.setValueAtTime(3, now);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.28, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.07);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      noise.start(now);
    } else {
      // 'tong'
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(320, now);
      osc.frequency.exponentialRampToValueAtTime(260, now + 0.12);

      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.15);
    }
  }

  /**
   * Play deep resonant Gong Ageng (low bronze plate with long harmonic shimmer)
   */
  public playGong(delay = 0) {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const ctx = this.ctx;
    const now = ctx.currentTime + delay;
    const duration = 3.5;

    const gongGain = ctx.createGain();
    gongGain.gain.setValueAtTime(0, now);
    gongGain.gain.linearRampToValueAtTime(0.4, now + 0.05);
    gongGain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    // Deep fundamental ~62 Hz
    const osc1 = ctx.createOscillator();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(62, now);

    // Sub-harmonic ~124 Hz
    const osc2 = ctx.createOscillator();
    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(125, now);

    // Lowpass filter
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(350, now);

    osc1.connect(gongGain);
    osc2.connect(gongGain);
    gongGain.connect(filter);
    filter.connect(ctx.destination);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + duration);
    osc2.stop(now + duration);
  }

  /**
   * Starts playing the Jamuran Song (Gamelan Arrangement with Lyrics Sync)
   */
  public playJamuranSong() {
    this.stopJamuranSong();
    this.isPlayingJamuran = true;
    this.songStartTime = performance.now();

    // If external audio loaded successfully, play it too
    if (this.externalAudio && this.useExternalAudio) {
      this.externalAudio.currentTime = 0;
      this.externalAudio.play().catch(() => {
        this.useExternalAudio = false;
      });
    }

    // Schedule Gamelan notes for the Jamuran melody:
    // "Jamuran ya ge-ge thok"
    // Phrase 1 (0s - 4.5s)
    const melody: { time: number; note: number; type: 'saron' | 'bonang' }[] = [
      // Bar 1: Ja - mu - ran (1 2 3)
      { time: 0.0, note: SLENDRO.JI, type: 'saron' },
      { time: 0.6, note: SLENDRO.RO, type: 'saron' },
      { time: 1.2, note: SLENDRO.LU, type: 'saron' },
      // ya ge - ge thok (2 1 2)
      { time: 2.0, note: SLENDRO.RO, type: 'saron' },
      { time: 2.6, note: SLENDRO.JI, type: 'saron' },
      { time: 3.2, note: SLENDRO.RO, type: 'saron' },

      // Bar 2: Ja - mur a - pa (3 5 3)
      { time: 4.4, note: SLENDRO.LU, type: 'saron' },
      { time: 5.0, note: SLENDRO.MA, type: 'saron' },
      { time: 5.6, note: SLENDRO.LU, type: 'saron' },
      // ya ge - ge thok (2 1 2)
      { time: 6.4, note: SLENDRO.RO, type: 'saron' },
      { time: 7.0, note: SLENDRO.JI, type: 'saron' },
      { time: 7.6, note: SLENDRO.RO, type: 'saron' },

      // Bar 3: Ja - mur ga - jih mbre - gi - jih (3 5 6 5 3)
      { time: 8.8, note: SLENDRO.LU, type: 'saron' },
      { time: 9.3, note: SLENDRO.MA, type: 'saron' },
      { time: 9.8, note: SLENDRO.NEM, type: 'saron' },
      { time: 10.4, note: SLENDRO.MA, type: 'saron' },
      { time: 11.0, note: SLENDRO.LU, type: 'saron' },
      // sa - a - ra - a - ra (2 1 2 1)
      { time: 11.6, note: SLENDRO.RO, type: 'saron' },
      { time: 12.2, note: SLENDRO.JI, type: 'saron' },
      { time: 12.8, note: SLENDRO.RO, type: 'saron' },
      { time: 13.4, note: SLENDRO.JI, type: 'saron' },

      // Bar 4: Sem - prat sem - prit ja - mur a - pa? (1 2 3 5 3 2 1)
      { time: 14.2, note: SLENDRO.JI, type: 'saron' },
      { time: 14.7, note: SLENDRO.RO, type: 'saron' },
      { time: 15.2, note: SLENDRO.LU, type: 'saron' },
      { time: 15.7, note: SLENDRO.MA, type: 'saron' },
      { time: 16.2, note: SLENDRO.LU, type: 'saron' },
      { time: 16.7, note: SLENDRO.RO, type: 'saron' },
      { time: 17.2, note: SLENDRO.JI, type: 'saron' }
    ];

    // Rhythm schedule (Kendang & Gong)
    melody.forEach((m) => {
      const tid = window.setTimeout(() => {
        if (!this.isPlayingJamuran) return;
        this.playSaron(m.note, 0.7, 0.24);
      }, m.time * 1000);
      this.songScheduledTimeouts.push(tid);
    });

    // Bonang interlocking ornament
    for (let t = 0; t < 17.5; t += 0.4) {
      const bonangNotes = [SLENDRO.JI_HI, SLENDRO.RO_HI, SLENDRO.LU_HI, SLENDRO.MA, SLENDRO.NEM];
      const randomNote = bonangNotes[Math.floor((t * 2.5) % bonangNotes.length)];
      const tid = window.setTimeout(() => {
        if (!this.isPlayingJamuran) return;
        this.playBonang(randomNote, 0.35, 0.12);
      }, t * 1000);
      this.songScheduledTimeouts.push(tid);
    }

    // Kendang beat every ~0.6 sec
    for (let t = 0; t < 17.5; t += 0.6) {
      const beatType = Math.floor(t / 0.6) % 3 === 0 ? 'dhung' : (Math.floor(t / 0.6) % 2 === 0 ? 'tong' : 'tak');
      const tid = window.setTimeout(() => {
        if (!this.isPlayingJamuran) return;
        this.playKendang(beatType);
      }, t * 1000);
      this.songScheduledTimeouts.push(tid);
    }

    // Gongs at phrase boundaries (at 4.0s, 8.4s, 14.0s, and 17.5s)
    [4.0, 8.4, 14.0, 17.4].forEach((gongTime) => {
      const tid = window.setTimeout(() => {
        if (!this.isPlayingJamuran) return;
        this.playGong();
      }, gongTime * 1000);
      this.songScheduledTimeouts.push(tid);
    });

    // Lyrics scheduling
    JAMURAN_LYRICS.forEach((lyric) => {
      const tid = window.setTimeout(() => {
        if (!this.isPlayingJamuran) return;
        if (this.onLyricCallback) {
          this.onLyricCallback(lyric.text);
        }
      }, lyric.time * 1000);
      this.songScheduledTimeouts.push(tid);
    });

    // Song end scheduling
    const endTid = window.setTimeout(() => {
      if (!this.isPlayingJamuran) return;
      this.isPlayingJamuran = false;
      if (this.onSongEndCallback) {
        this.onSongEndCallback();
      }
    }, JAMURAN_SONG_DURATION * 1000);
    this.songScheduledTimeouts.push(endTid);
  }

  public stopJamuranSong() {
    this.isPlayingJamuran = false;
    this.songScheduledTimeouts.forEach((tid) => clearTimeout(tid));
    this.songScheduledTimeouts = [];

    if (this.externalAudio) {
      try {
        this.externalAudio.pause();
        this.externalAudio.currentTime = 0;
      } catch {}
    }
  }

  public getSongProgress(): number {
    if (!this.isPlayingJamuran) return 0;
    const elapsed = (performance.now() - this.songStartTime) / 1000;
    return Math.min(1, Math.max(0, elapsed / JAMURAN_SONG_DURATION));
  }

  // SOUND EFFECTS:

  /**
   * Pancer referee whistle ("Priiiiit!")
   */
  public playWhistle() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const ctx = this.ctx;
    const now = ctx.currentTime;
    const duration = 0.65;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(2400, now);
    // rapid vibrato for whistle trill
    const vibrato = ctx.createOscillator();
    vibrato.frequency.setValueAtTime(28, now);
    const vibGain = ctx.createGain();
    vibGain.gain.setValueAtTime(80, now);
    vibrato.connect(vibGain);
    vibGain.connect(osc.frequency);
    vibrato.start(now);
    vibrato.stop(now + duration);

    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.28, now + 0.04);
    gain.gain.setValueAtTime(0.28, now + duration - 0.1);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + duration);
  }

  /**
   * Tick step sound when moving on number line
   */
  public playStep(isRight = true) {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const ctx = this.ctx;
    const now = ctx.currentTime;
    const freq = isRight ? 480 : 360;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, now);
    osc.frequency.exponentialRampToValueAtTime(freq * 1.3, now + 0.08);

    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.11);
  }

  /**
   * Correct Answer fanfare chime
   */
  public playCorrect() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const notes = [440, 554, 659, 880]; // A major cheerful chord
    notes.forEach((freq, idx) => {
      window.setTimeout(() => {
        if (!this.ctx) return;
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now);

        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.24, now + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.55);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + 0.6);
      }, idx * 100);
    });
  }

  /**
   * Wrong Answer gentle boing / try again
   */
  public playWrong() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const ctx = this.ctx;
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(220, now);
    osc.frequency.exponentialRampToValueAtTime(110, now + 0.35);

    gain.gain.setValueAtTime(0.18, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.38);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.4);
  }

  /**
   * UI Click chime
   */
  public playClick() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const ctx = this.ctx;
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(600, now);
    osc.frequency.exponentialRampToValueAtTime(800, now + 0.04);

    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.07);
  }
}

// Global singleton instance
export const audioManager = new GamelanAudioEngine();
