export interface AudioToneConfig {
  freq: number;
  type?: OscillatorType;
  duration: number;
  gain?: number;
  decay?: number;
}

class CyberAudioSynthesizer {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private masterGain: GainNode | null = null;

  private init(): void {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.setValueAtTime(0.15, this.ctx.currentTime);
        this.masterGain.connect(this.ctx.destination);
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

// ===== START NEW CODE: HARDENED AUDIO SYNTHESIZER =====
  public setMuted(muted: boolean): void {
    try {
      this.isMuted = muted;
      if (this.masterGain && this.ctx) {
        const t = Number.isFinite(this.ctx.currentTime) ? this.ctx.currentTime : 0;
        this.masterGain.gain.setValueAtTime(muted ? 0 : 0.15, t);
      }
    } catch {
      // Graceful fallback
    }
  }

  public setVolume(volume: number): void {
    try {
      if (!Number.isFinite(volume)) return;
      if (this.masterGain && this.ctx && !this.isMuted) {
        const safeVol = Math.max(0, Math.min(1, volume * 0.2));
        const t = Number.isFinite(this.ctx.currentTime) ? this.ctx.currentTime : 0;
        this.masterGain.gain.setValueAtTime(safeVol, t);
      }
    } catch {
      // Graceful fallback
    }
  }

  public playTone(config: AudioToneConfig): void {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx || !this.masterGain) return;

    try {
      const now = Number.isFinite(this.ctx.currentTime) ? this.ctx.currentTime : 0;
      const freq = Number.isFinite(config.freq) && config.freq > 0 ? config.freq : 440;
      const duration = Number.isFinite(config.duration) && config.duration > 0 ? config.duration : 0.05;
      const rawGain = Number.isFinite(config.gain) ? (config.gain as number) : 0.3;
      const toneGain = Math.max(0.0001, Math.min(1.0, rawGain));

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      
      osc.type = config.type || 'sine';
      osc.frequency.setValueAtTime(freq, now);

      gain.gain.setValueAtTime(toneGain, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(now);
      osc.stop(now + duration);
    } catch {
      // AudioContext policy suppression fallback
    }
  }
// ===== END NEW CODE: HARDENED AUDIO SYNTHESIZER =====

  public playCyberClick(): void {
    this.playTone({ freq: 880, type: 'triangle', duration: 0.04, gain: 0.2 });
  }

  public playButtonAction(): void {
    this.playTone({ freq: 520, type: 'sawtooth', duration: 0.06, gain: 0.15 });
  }

  public playScanBeep(progressStep: number): void {
    const baseFreq = 440 + progressStep * 40;
    this.playTone({ freq: baseFreq, type: 'sine', duration: 0.08, gain: 0.18 });
  }

  public playSuccessChime(): void {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx || !this.masterGain) return;

    const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
    notes.forEach((freq, idx) => {
      setTimeout(() => {
        this.playTone({ freq, type: 'sine', duration: 0.2, gain: 0.25 });
      }, idx * 70);
    });
  }

  public playAlertBuzz(): void {
    this.playTone({ freq: 140, type: 'sawtooth', duration: 0.18, gain: 0.3 });
  }

  public playJoystickPulse(): void {
    this.playTone({ freq: 220, type: 'sine', duration: 0.02, gain: 0.08 });
  }
}

export const cyberAudio = new CyberAudioSynthesizer();
