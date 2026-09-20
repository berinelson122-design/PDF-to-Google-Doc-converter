import { TTSState, TTSStatus, SupportedLanguage } from '../types/index.ts';

// ===== START NEW CODE: BROWSER NATIVE WEB SPEECH API TEXT-TO-SPEECH CONTROLLER =====

export interface SpeechSynthCallbacks {
  onStatusChange?: (status: TTSStatus) => void;
  onWordBoundary?: (word: string, charIndex: number, wordIndex: number, totalWords: number) => void;
  onEnd?: () => void;
  onError?: (err: any) => void;
}

class WebSpeechSynthController {
  private synth: SpeechSynthesis | null = null;
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private voices: SpeechSynthesisVoice[] = [];
  private isSupported: boolean = false;
  private keepAliveTimer: any = null;
  private callbacks: SpeechSynthCallbacks = {};
  
  // Track plain text tokens for word boundary indexing
  private wordsList: string[] = [];
  private fullText: string = '';
  private currentWordIndex: number = 0;

  // Playback settings
  private voiceURI: string = '';
  private rate: number = 1.0;
  private pitch: number = 1.0;
  private volume: number = 1.0;
  private currentStatus: TTSStatus = 'idle';

  constructor() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.synth = window.speechSynthesis;
      this.isSupported = true;
      this.loadVoices();

      // Voices may load asynchronously in Chrome / Safari / WebKit
      try {
        if (typeof window.speechSynthesis.addEventListener === 'function') {
          window.speechSynthesis.addEventListener('voiceschanged', () => {
            this.loadVoices();
          });
        } else if (this.synth.onvoiceschanged !== undefined) {
          this.synth.onvoiceschanged = () => {
            this.loadVoices();
          };
        }
      } catch (e) {
        console.warn('Could not bind voiceschanged listener:', e);
      }
    }
  }

  public getIsSupported(): boolean {
    return this.isSupported;
  }

  public getVoices(): SpeechSynthesisVoice[] {
    if (!this.synth) return [];
    if (!this.voices || this.voices.length === 0) {
      this.loadVoices();
    }
    return this.voices || [];
  }

  private loadVoices() {
    if (!this.synth) return;
    try {
      const rawVoices = this.synth.getVoices();
      if (Array.isArray(rawVoices)) {
        this.voices = rawVoices.filter((v): v is SpeechSynthesisVoice => 
          Boolean(v && typeof v === 'object' && typeof v.voiceURI === 'string')
        );
      }
    } catch (e) {
      console.warn('Failed to retrieve voices safely:', e);
      this.voices = [];
    }
  }

  public setCallbacks(cbs: SpeechSynthCallbacks) {
    this.callbacks = { ...this.callbacks, ...cbs };
  }

  public getBestVoiceForLanguage(langCode: string): SpeechSynthesisVoice | null {
    const voices = this.getVoices();
    if (!voices || voices.length === 0) return null;

    const normalized = (langCode || 'en').toLowerCase();
    
    // Exact match (e.g. 'es-ES' or 'en-US')
    let matched = voices.find((v) => 
      v && typeof v.lang === 'string' && (v.lang.toLowerCase().startsWith(normalized) || v.lang.toLowerCase() === normalized)
    );
    if (matched) return matched;

    // Prefix match (e.g. 'es' matching 'es-MX')
    const prefix = normalized.split('-')[0];
    matched = voices.find((v) => 
      v && typeof v.lang === 'string' && v.lang.toLowerCase().startsWith(prefix)
    );
    if (matched) return matched;

    // Fallback default or English voice
    return voices.find((v) => v && v.default) || (voices.length > 0 ? voices[0] : null);
  }

  /**
   * Cleans HTML markup into plain speech text and extracts words for boundary tracking
   */
  public prepareTextFromHtml(html: string): { plainText: string; words: string[] } {
    if (typeof document === 'undefined') {
      return { plainText: '', words: [] };
    }

    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;

    // Replace headers and table cells with pauses (period or commas)
    const elementsToPause = tempDiv.querySelectorAll('h1, h2, h3, h4, h5, h6, th, td, li, p');
    elementsToPause.forEach((el) => {
      el.textContent = (el.textContent || '').trim() + '. ';
    });

    const plainText = (tempDiv.textContent || '')
      .replace(/\s+/g, ' ')
      .trim();

    const words = plainText.split(/\s+/).filter(Boolean);

    return { plainText, words };
  }

  /**
   * Starts speaking the given HTML or plain text
   */
  public speak(
    content: string, 
    options: {
      langCode?: string;
      voiceURI?: string;
      rate?: number;
      pitch?: number;
      volume?: number;
      isHtml?: boolean;
    } = {}
  ) {
    if (!this.synth) {
      console.warn('SpeechSynthesis is not supported in this browser.');
      return;
    }

    // Stop any current utterance
    this.stop();

    const isHtml = options.isHtml !== false;
    let textToSpeak = content;

    if (isHtml) {
      const parsed = this.prepareTextFromHtml(content);
      textToSpeak = parsed.plainText;
      this.wordsList = parsed.words;
    } else {
      textToSpeak = content.trim();
      this.wordsList = textToSpeak.split(/\s+/).filter(Boolean);
    }

    this.fullText = textToSpeak;
    this.currentWordIndex = 0;

    if (!textToSpeak) {
      return;
    }

    const utterance = new SpeechSynthesisUtterance(textToSpeak);

    // Set voice safely preventing WebKit Object.getPrototypeOf(voice) TypeError
    try {
      let targetVoice: SpeechSynthesisVoice | null = null;
      if (options.voiceURI) {
        targetVoice = this.getVoices().find((v) => v && typeof v === 'object' && v.voiceURI === options.voiceURI) || null;
      }
      
      if (!targetVoice && options.langCode) {
        targetVoice = this.getBestVoiceForLanguage(options.langCode);
      }

      if (targetVoice && typeof targetVoice === 'object' && 'voiceURI' in targetVoice) {
        utterance.voice = targetVoice;
        this.voiceURI = targetVoice.voiceURI;
      }
    } catch (voiceErr) {
      console.warn('SpeechSynthesis voice assignment skipped due to platform restrictions:', voiceErr);
    }

    utterance.rate = options.rate ?? this.rate ?? 1.0;
    utterance.pitch = options.pitch ?? this.pitch ?? 1.0;
    utterance.volume = options.volume ?? this.volume ?? 1.0;

    this.rate = utterance.rate;
    this.pitch = utterance.pitch;
    this.volume = utterance.volume;
    if (utterance.voice) {
      this.voiceURI = utterance.voice.voiceURI;
    }

    // Set up events
    utterance.onstart = () => {
      this.currentStatus = 'playing';
      this.startKeepAlive();
      this.callbacks.onStatusChange?.('playing');
    };

    utterance.onpause = () => {
      this.currentStatus = 'paused';
      this.clearKeepAlive();
      this.callbacks.onStatusChange?.('paused');
    };

    utterance.onresume = () => {
      this.currentStatus = 'playing';
      this.startKeepAlive();
      this.callbacks.onStatusChange?.('playing');
    };

    utterance.onend = () => {
      this.currentStatus = 'idle';
      this.clearKeepAlive();
      this.callbacks.onStatusChange?.('idle');
      this.callbacks.onEnd?.();
    };

    utterance.onerror = (err) => {
      // Ignored interrupted errors on intentional stop/cancel
      if (err.error === 'interrupted' || err.error === 'canceled') {
        this.currentStatus = 'idle';
        this.callbacks.onStatusChange?.('idle');
        return;
      }
      console.warn('SpeechSynthesis error:', err);
      this.currentStatus = 'idle';
      this.clearKeepAlive();
      this.callbacks.onStatusChange?.('idle');
      this.callbacks.onError?.(err);
    };

    // Word boundary karaoke sync tracking
    utterance.onboundary = (event) => {
      if (event.name === 'word' || event.charIndex !== undefined) {
        const charIdx = event.charIndex;
        // Approximate current word from charIndex
        const textUpToChar = this.fullText.substring(0, charIdx);
        const wordIdx = textUpToChar.split(/\s+/).filter(Boolean).length;
        const currentWord = this.wordsList[wordIdx] || '';
        this.currentWordIndex = wordIdx;

        this.callbacks.onWordBoundary?.(
          currentWord, 
          charIdx, 
          wordIdx, 
          this.wordsList.length
        );
      }
    };

    this.currentUtterance = utterance;
    this.synth.speak(utterance);
  }

  public pause() {
    if (!this.synth) return;
    if (this.synth.speaking && !this.synth.paused) {
      this.synth.pause();
      this.currentStatus = 'paused';
      this.callbacks.onStatusChange?.('paused');
    }
  }

  public resume() {
    if (!this.synth) return;
    if (this.synth.paused) {
      this.synth.resume();
      this.currentStatus = 'playing';
      this.callbacks.onStatusChange?.('playing');
    }
  }

  public stop() {
    if (!this.synth) return;
    this.clearKeepAlive();
    this.synth.cancel();
    this.currentStatus = 'idle';
    this.currentWordIndex = 0;
    this.callbacks.onStatusChange?.('idle');
  }

  public setRate(newRate: number) {
    this.rate = Math.max(0.5, Math.min(2.0, newRate));
    // If currently speaking, restart with new rate from current position if possible
    if (this.currentStatus === 'playing' && this.currentUtterance) {
      const remainingWords = this.wordsList.slice(this.currentWordIndex).join(' ');
      if (remainingWords) {
        this.speak(remainingWords, {
          voiceURI: this.voiceURI,
          rate: this.rate,
          pitch: this.pitch,
          volume: this.volume,
          isHtml: false,
        });
      }
    }
  }

  public setPitch(newPitch: number) {
    this.pitch = Math.max(0.5, Math.min(1.5, newPitch));
  }

  public setVolume(newVolume: number) {
    this.volume = Math.max(0.0, Math.min(1.0, newVolume));
  }

  public setVoice(voiceURI: string) {
    this.voiceURI = voiceURI;
    if (this.currentStatus === 'playing' && this.currentUtterance) {
      const remainingWords = this.wordsList.slice(this.currentWordIndex).join(' ');
      if (remainingWords) {
        this.speak(remainingWords, {
          voiceURI: this.voiceURI,
          rate: this.rate,
          pitch: this.pitch,
          volume: this.volume,
          isHtml: false,
        });
      }
    }
  }

  public getStatus(): TTSStatus {
    return this.currentStatus;
  }

  /**
   * Chrome has a known bug where speech synthesis pauses unexpectedly after ~15s.
   * This keepalive timer prevents silent pausing.
   */
  private startKeepAlive() {
    this.clearKeepAlive();
    this.keepAliveTimer = setInterval(() => {
      if (this.synth && this.synth.speaking && !this.synth.paused) {
        this.synth.pause();
        this.synth.resume();
      }
    }, 10000);
  }

  private clearKeepAlive() {
    if (this.keepAliveTimer) {
      clearInterval(this.keepAliveTimer);
      this.keepAliveTimer = null;
    }
  }
}

export const speechSynth = new WebSpeechSynthController();

// ===== END NEW CODE: BROWSER NATIVE WEB SPEECH API TEXT-TO-SPEECH CONTROLLER =====
