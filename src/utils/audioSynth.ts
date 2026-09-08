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

  public setMuted(muted: boolean): void {
    this.isMuted = muted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(muted ? 0 : 0.15, this.ctx.currentTime);
    }
  }

  public setVolume(volume: number): void {
    if (this.masterGain && this.ctx && !this.isMuted) {
      this.masterGain.gain.setValueAtTime(Math.max(0, Math.min(1, volume * 0.2)), this.ctx.currentTime);
    }
  }

  public playTone(config: AudioToneConfig): void {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx || !this.masterGain) return;

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      
      osc.type = config.type || 'sine';
      osc.frequency.setValueAtTime(config.freq, this.ctx.currentTime);

      const toneGain = config.gain ?? 0.3;
      gain.gain.setValueAtTime(toneGain, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + config.duration);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start();
      osc.stop(this.ctx.currentTime + config.duration);
    } catch {
      // AudioContext policy suppression fallback
    }
  }

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
