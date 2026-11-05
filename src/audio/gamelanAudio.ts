/**
 * Gamelan Sound Effects Engine (Web Audio API)
 * Plays authentic traditional Javanese Slendro scale chimes, Kendang rhythm, Gong resonance,
 * and game sound effects (whistle, correct/wrong chimes, obstacle fanfare, step ticks)
 * with zero external dependency requirements.
 *
 * NOTE: All Jamuran vocal/song playback is handled by the local audio system
 * (/audio/1.mp3 through /audio/4.mp3 via jamuranAudioController and useJamuranAudio).
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

import { jamuranAudioController } from '../services/jamuranAudioController';

export class GamelanAudioEngine {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;

  constructor() {
    // Zero external audio dependencies in constructor
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
    jamuranAudioController.setMuted(muted);
  }

  public getIsMuted(): boolean {
    return this.isMuted;
  }

  public toggleMute(): boolean {
    this.setMuted(!this.isMuted);
    return this.isMuted;
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
   * Correct Answer: Traditional Javanese Slendro/Pelog Pentatonic Celebration Chime
   * Plays a crisp rising Saron & Bonang chime in Slendro scale with warm Kempul resonance.
   */
  public playCorrect() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    // Rising Slendro pentatonic cascade: Ro (308) -> Lu (348) -> Ma (412) -> Nem (465) -> Ji Tinggi (550) -> Ro Tinggi (616)
    const slendroNotes = [
      SLENDRO.RO,
      SLENDRO.LU,
      SLENDRO.MA,
      SLENDRO.NEM,
      SLENDRO.JI_HI,
      SLENDRO.RO_HI
    ];

    slendroNotes.forEach((freq, idx) => {
      window.setTimeout(() => {
        if (!this.ctx || this.isMuted) return;
        // Saron metallic ring
        this.playSaron(freq, 0.7, 0.22);
        // Subtle bonang shimmer
        this.playBonang(freq, 0.45, 0.12);
      }, idx * 75);
    });

    // Concluding Kempul / soft Gong chime after the arpeggio
    window.setTimeout(() => {
      if (!this.ctx || this.isMuted) return;
      this.playGong();
      this.playBonang(SLENDRO.LU_HI, 0.9, 0.2);
    }, slendroNotes.length * 75 + 50);
  }

  /**
   * Wrong Answer: Gentle Kendang thud with soft descending Slendro tone
   * Culturally authentic, encouraging, and clear without harsh electronic noise.
   */
  public playWrong() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const ctx = this.ctx;
    const now = ctx.currentTime;

    // Kendang thud
    this.playKendang('dhung', 0);

    // Soft muted descending tone (triangle wave through lowpass filter)
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(SLENDRO.LU, now);
    osc.frequency.exponentialRampToValueAtTime(SLENDRO.JI * 0.75, now + 0.38);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(450, now);

    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.2, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.42);

    // Delayed soft kendang rim tap
    window.setTimeout(() => {
      if (!this.ctx || this.isMuted) return;
      this.playKendang('tong', 0);
    }, 180);
  }

  /**
   * Obstacle Success Fanfare: Played when players successfully hold the Jamuran pose
   * until time runs out without moving or failing.
   * Lively imbal bonang flourishing notes + cheerful saron strike + celebratory gong!
   */
  public playObstacleSuccess() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    // Rapid celebratory imbal (interlocking) bonang run
    const fanfareNotes = [
      SLENDRO.JI,
      SLENDRO.LU,
      SLENDRO.MA,
      SLENDRO.NEM,
      SLENDRO.JI_HI,
      SLENDRO.LU_HI,
      SLENDRO.RO_HI,
      SLENDRO.JI_HI
    ];

    fanfareNotes.forEach((freq, idx) => {
      window.setTimeout(() => {
        if (!this.ctx || this.isMuted) return;
        this.playBonang(freq, 0.4, 0.18);
        if (idx % 2 === 0) {
          this.playSaron(freq, 0.5, 0.16);
        }
      }, idx * 60);
    });

    // Final triumphant Gong & high Bonang chime
    const finalDelay = fanfareNotes.length * 60 + 40;
    window.setTimeout(() => {
      if (!this.ctx || this.isMuted) return;
      this.playGong();
      this.playSaron(SLENDRO.JI_HI, 1.2, 0.28);
      this.playBonang(SLENDRO.LU_HI, 0.8, 0.22);
      this.playKendang('dhung');
    }, finalDelay);
  }

  /**
   * Pancer Transition: Played during rotation or appointment of new Pancer at the arena center.
   * Rhythmic kendang drum roll ('dhung-tak-dhung-tong') followed by a deep gong beat.
   */
  public playPancerTransition() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const drumPattern: { time: number; type: 'dhung' | 'tak' | 'tong' }[] = [
      { time: 0, type: 'dhung' },
      { time: 140, type: 'tak' },
      { time: 260, type: 'dhung' },
      { time: 380, type: 'tak' },
      { time: 480, type: 'tong' }
    ];

    drumPattern.forEach((beat) => {
      window.setTimeout(() => {
        if (!this.ctx || this.isMuted) return;
        this.playKendang(beat.type);
      }, beat.time);
    });

    // Concluding Gong and Saron tone to signal new round center Pancer
    window.setTimeout(() => {
      if (!this.ctx || this.isMuted) return;
      this.playGong();
      this.playSaron(SLENDRO.NEM, 1.0, 0.25);
    }, 580);
  }

  /**
   * Pose Countdown Tick: Subtle kendang tap during last 3 seconds of holding Jamuran pose.
   */
  public playPoseCountdownTick(secondsRemaining: number) {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    if (secondsRemaining <= 1) {
      this.playKendang('tak');
      this.playBonang(SLENDRO.JI_HI, 0.2, 0.14);
    } else if (secondsRemaining <= 2) {
      this.playKendang('tong');
      this.playBonang(SLENDRO.NEM, 0.2, 0.12);
    } else {
      this.playKendang('tak');
    }
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
