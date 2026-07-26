// src/utils/SoundAudioSystem.js
export class SoundAudioSystem {
  constructor() {
    this.audioContext = null;
    this.masterGain = null;
    this.duckingGain = null;
    this.masterVolume = 1.0;
    this.isMuted = false;
    this.initialized = false;
  }

  init() {
    if (this.initialized && this.audioContext) return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      this.audioContext = new AudioCtx();
      this.masterGain = this.audioContext.createGain();
      this.duckingGain = this.audioContext.createGain();

      this.masterGain.gain.value = this.masterVolume;
      this.duckingGain.gain.value = 1.0;

      this.duckingGain.connect(this.masterGain);
      this.masterGain.connect(this.audioContext.destination);

      this.initialized = true;
    } catch (e) {
      console.warn("SoundAudioSystem: Web Audio API not supported", e);
    }
  }

  ensureContext() {
    this.init();
    if (this.audioContext && this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }
  }

  setVolume(volume) {
    this.masterVolume = Math.max(0, Math.min(1, volume));
    if (this.masterGain && this.audioContext) {
      this.masterGain.gain.setTargetAtTime(this.masterVolume, this.audioContext.currentTime, 0.05);
    }
  }

  // --- UI Sound Effect Cues ---

  playTranslationStartSound() {
    this.ensureContext();
    if (!this.audioContext || this.isMuted) return;

    try {
      const now = this.audioContext.currentTime;
      const osc1 = this.audioContext.createOscillator();
      const osc2 = this.audioContext.createOscillator();
      const gain = this.audioContext.createGain();

      osc1.type = 'sine';
      osc2.type = 'triangle';

      osc1.frequency.setValueAtTime(523.25, now); // C5
      osc1.frequency.exponentialRampToValueAtTime(1046.50, now + 0.15); // C6

      osc2.frequency.setValueAtTime(659.25, now + 0.08); // E5
      osc2.frequency.exponentialRampToValueAtTime(1318.51, now + 0.25); // E6

      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.2, now + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(this.masterGain);

      osc1.start(now);
      osc2.start(now + 0.08);
      osc1.stop(now + 0.35);
      osc2.stop(now + 0.35);
    } catch (e) {
      console.warn("Error playing start sound:", e);
    }
  }

  playTranslationStopSound() {
    this.ensureContext();
    if (!this.audioContext || this.isMuted) return;

    try {
      const now = this.audioContext.currentTime;
      const osc = this.audioContext.createOscillator();
      const gain = this.audioContext.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(880.00, now); // A5
      osc.frequency.exponentialRampToValueAtTime(440.00, now + 0.2); // A4

      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(now);
      osc.stop(now + 0.25);
    } catch (e) {
      console.warn("Error playing stop sound:", e);
    }
  }

  playCaptionBeep() {
    this.ensureContext();
    if (!this.audioContext || this.isMuted) return;

    try {
      const now = this.audioContext.currentTime;
      const osc = this.audioContext.createOscillator();
      const gain = this.audioContext.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(1200, now);

      gain.gain.setValueAtTime(0.04, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(now);
      osc.stop(now + 0.08);
    } catch (e) {
      console.warn("Error playing caption beep:", e);
    }
  }

  playUserJoinSound() {
    this.ensureContext();
    if (!this.audioContext || this.isMuted) return;

    try {
      const now = this.audioContext.currentTime;
      const osc = this.audioContext.createOscillator();
      const gain = this.audioContext.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.setValueAtTime(880, now + 0.1);

      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.15, now + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(now);
      osc.stop(now + 0.25);
    } catch (e) {
      console.warn("Error playing join sound:", e);
    }
  }

  // --- Audio Ducking ---
  duckOriginal(duckVolume = 0.15, durationMs = 3000) {
    this.ensureContext();
    if (!this.audioContext || !this.duckingGain) return;

    const now = this.audioContext.currentTime;
    this.duckingGain.gain.setTargetAtTime(duckVolume, now, 0.1);

    setTimeout(() => {
      if (this.audioContext && this.duckingGain) {
        this.duckingGain.gain.setTargetAtTime(1.0, this.audioContext.currentTime, 0.3);
      }
    }, durationMs);
  }

  // --- Device Enumeration ---
  async getAudioDevices() {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      return {
        inputs: devices.filter(d => d.kind === 'audioinput'),
        outputs: devices.filter(d => d.kind === 'audiooutput'),
      };
    } catch (e) {
      return { inputs: [], outputs: [] };
    }
  }
}

export const soundAudioSystem = new SoundAudioSystem();
