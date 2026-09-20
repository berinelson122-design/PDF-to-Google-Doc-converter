import React, { useEffect, useState } from 'react';
import { 
  Play, 
  Pause, 
  Square, 
  Volume2, 
  VolumeX, 
  Gauge, 
  Sliders, 
  X, 
  ChevronDown, 
  Sparkles, 
  FileText,
  RotateCcw,
  Headphones,
  Maximize2,
  Minimize2
} from 'lucide-react';
import { useGameStore } from '../../store/useGameStore.ts';
import { speechSynth } from '../../utils/speechSynth.ts';
import { getSupportedLanguage } from '../../utils/languageDetector.ts';

// ===== START NEW CODE: BROWSER NATIVE WEB SPEECH API TTS PLAYER WITH REAL-TIME CONTROLS =====

export const TextToSpeechPlayer: React.FC = () => {
  const {
    isTTSPlayerOpen,
    setIsTTSPlayerOpen,
    ttsState,
    startTTS,
    pauseTTS,
    resumeTTS,
    stopTTS,
    setTTSRate,
    setTTSPitch,
    setTTSVolume,
    setTTSVoice,
    toggleTTSHighlight,
    detectedLanguage,
    currentActivePage,
    editedHtml,
    result,
  } = useGameStore();

  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [isVoiceDropdownOpen, setIsVoiceDropdownOpen] = useState(false);
  const [isSettingsExpanded, setIsSettingsExpanded] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);

  // Load system voices
  useEffect(() => {
    let isMounted = true;
    const updateVoices = () => {
      if (!isMounted) return;
      try {
        const voices = speechSynth.getVoices();
        if (Array.isArray(voices)) {
          setAvailableVoices(voices.filter((v): v is SpeechSynthesisVoice => 
            Boolean(v && typeof v === 'object' && typeof v.voiceURI === 'string')
          ));
        }
      } catch (err) {
        console.warn('Error fetching voices:', err);
      }
    };

    updateVoices();
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        if (typeof window.speechSynthesis.addEventListener === 'function') {
          window.speechSynthesis.addEventListener('voiceschanged', updateVoices);
        } else if (window.speechSynthesis.onvoiceschanged !== undefined) {
          window.speechSynthesis.onvoiceschanged = updateVoices;
        }
      } catch (e) {
        console.warn('Could not register voiceschanged handler:', e);
      }
    }

    return () => {
      isMounted = false;
      if (typeof window !== 'undefined' && 'speechSynthesis' in window && typeof window.speechSynthesis.removeEventListener === 'function') {
        try {
          window.speechSynthesis.removeEventListener('voiceschanged', updateVoices);
        } catch (e) {
          // ignore
        }
      }
    };
  }, []);

  if (!isTTSPlayerOpen) return null;

  const currentLang = getSupportedLanguage(detectedLanguage?.code || 'en');
  const isPlaying = ttsState.status === 'playing';
  const isPaused = ttsState.status === 'paused';
  const isIdle = ttsState.status === 'idle';

  // Filter voices matching document language first
  const langPrefix = (currentLang?.code || 'en').toLowerCase().split('-')[0];
  const safeVoices = Array.isArray(availableVoices)
    ? availableVoices.filter((v): v is SpeechSynthesisVoice => Boolean(v && typeof v === 'object' && typeof v.voiceURI === 'string'))
    : [];

  const matchingVoices = safeVoices.filter((v) => 
    v && typeof v.lang === 'string' && (v.lang.toLowerCase().startsWith(langPrefix) || v.lang.toLowerCase() === (currentLang?.speechCode || '').toLowerCase())
  );
  const displayVoices = matchingVoices.length > 0 ? matchingVoices : safeVoices;

  const selectedVoice = safeVoices.find((v) => v && v.voiceURI === ttsState.currentVoiceURI) || (displayVoices.length > 0 ? displayVoices[0] : null);

  const handlePlayToggle = () => {
    if (isPlaying) {
      pauseTTS();
    } else if (isPaused) {
      resumeTTS();
    } else {
      startTTS('all');
    }
  };

  const handleReadCurrentPage = () => {
    // Extract text for current page if multi-page
    const html = editedHtml || result?.htmlContent || '';
    const pages = html.split(/<div class="page-break"[^>]*><\/div>/i);
    const targetPageContent = pages[currentActivePage - 1] || pages[0] || html;
    startTTS('page', targetPageContent, currentActivePage);
  };

  return (
    <div className={`fixed bottom-4 left-4 right-4 z-40 mx-auto font-mono transition-all duration-300 sm:left-auto sm:right-6 ${
      isMinimized ? 'w-auto max-w-xs' : 'w-full max-w-xl'
    }`}>
      {/* Outer Cyberpunk Frame */}
      <div className="overflow-hidden border border-[#FF003C] bg-black/95 text-white shadow-[0_0_30px_rgba(255,0,60,0.35)] backdrop-blur-md">
        {/* Top Header Bar */}
        <div className="flex items-center justify-between border-b border-zinc-800 bg-[#0d0d0d] px-3.5 py-2">
          <div className="flex items-center gap-2">
            <div className="flex h-5 w-5 items-center justify-center rounded-sm bg-[#FF003C] text-black">
              <Headphones className="h-3.5 w-3.5" />
            </div>
            <span className="text-xs font-bold tracking-wider text-white">
              AUDIO MATRIX // WEB SPEECH API
            </span>
            <span className="hidden items-center gap-1 border border-[#E056FD]/40 bg-[#E056FD]/10 px-1.5 py-0.5 text-[10px] text-[#E056FD] sm:inline-flex">
              <span>{currentLang.flag}</span>
              <span>{currentLang.speechCode}</span>
            </span>
          </div>

          <div className="flex items-center gap-1.5 text-zinc-400">
            <button
              onClick={() => setIsMinimized(!isMinimized)}
              className="p-1 hover:text-white"
              title={isMinimized ? 'Expand Audio Player' : 'Minimize Audio Player'}
            >
              {isMinimized ? <Maximize2 className="h-3.5 w-3.5" /> : <Minimize2 className="h-3.5 w-3.5" />}
            </button>
            <button
              onClick={() => {
                stopTTS();
                setIsTTSPlayerOpen(false);
              }}
              className="p-1 hover:text-[#FF003C]"
              title="Close Player"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Minimized View */}
        {isMinimized ? (
          <div className="flex items-center justify-between gap-3 p-2.5">
            <div className="flex items-center gap-2 text-xs">
              <button
                onClick={handlePlayToggle}
                className="flex h-8 w-8 items-center justify-center rounded bg-[#FF003C] text-black hover:bg-[#ff2456]"
              >
                {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="ml-0.5 h-4 w-4" />}
              </button>
              <span className="truncate text-[11px] text-zinc-300">
                {isPlaying ? (ttsState.activeSpokenWord || 'Speaking...') : 'Paused'}
              </span>
            </div>
            <span className="text-[11px] font-bold text-[#E056FD]">{ttsState.progressPercent}%</span>
          </div>
        ) : (
          /* Full Expanded Player */
          <div className="p-3.5">
            {/* Progress Bar & Word Readout */}
            <div className="mb-3">
              <div className="mb-1 flex items-center justify-between text-[11px] text-zinc-400">
                <div className="flex items-center gap-1.5 truncate">
                  <span className="text-zinc-500">READING:</span>
                  <span className="font-semibold text-white truncate max-w-[200px]">
                    {result?.documentTitle || 'Document'}
                  </span>
                  {ttsState.readTarget === 'page' && (
                    <span className="border border-emerald-500/40 bg-emerald-950/40 px-1 text-[10px] text-emerald-400">
                      PAGE {ttsState.activePageNumber}
                    </span>
                  )}
                </div>
                <span className="font-bold text-[#FF003C]">{ttsState.progressPercent}%</span>
              </div>

              {/* Progress track */}
              <div className="h-1.5 w-full bg-zinc-900">
                <div
                  className="h-full bg-gradient-to-r from-[#FF003C] to-[#E056FD] transition-all duration-200"
                  style={{ width: `${Math.max(2, ttsState.progressPercent)}%` }}
                />
              </div>

              {/* Active Spoken Word Display (Karaoke) */}
              {ttsState.isHighlightEnabled && (
                <div className="mt-2 min-h-[32px] border border-zinc-800 bg-zinc-950 p-2 text-center text-xs">
                  {isPlaying && ttsState.activeSpokenWord ? (
                    <div className="flex items-center justify-center gap-1.5">
                      <span className="text-zinc-500">Active Token:</span>
                      <span className="border border-[#FF003C] bg-[#FF003C]/20 px-2 py-0.5 font-bold tracking-wide text-white shadow-[0_0_8px_rgba(255,0,60,0.4)] animate-pulse">
                        "{ttsState.activeSpokenWord}"
                      </span>
                    </div>
                  ) : isPaused ? (
                    <span className="text-amber-400/80">Audio Playback Paused</span>
                  ) : (
                    <span className="text-zinc-600">Ready to speak document text</span>
                  )}
                </div>
              )}
            </div>

            {/* Primary Transport Controls */}
            <div className="flex flex-wrap items-center justify-between gap-2 border-y border-zinc-900 py-2.5">
              {/* Play / Pause / Stop Buttons */}
              <div className="flex items-center gap-2">
                <button
                  onClick={handlePlayToggle}
                  className="flex h-9 w-9 items-center justify-center border border-[#FF003C] bg-[#FF003C] font-bold text-black transition-all hover:bg-[#ff2456] hover:shadow-[0_0_12px_rgba(255,0,60,0.5)] active:scale-95"
                  title={isPlaying ? 'Pause' : isPaused ? 'Resume' : 'Play Document'}
                >
                  {isPlaying ? (
                    <Pause className="h-4 w-4 stroke-[2.5]" />
                  ) : (
                    <Play className="ml-0.5 h-4 w-4 stroke-[2.5]" />
                  )}
                </button>

                <button
                  onClick={stopTTS}
                  disabled={isIdle}
                  className="flex h-9 w-9 items-center justify-center border border-zinc-800 bg-zinc-900 text-zinc-400 transition-all hover:border-zinc-700 hover:text-white active:scale-95 disabled:opacity-40"
                  title="Stop"
                >
                  <Square className="h-3.5 w-3.5 fill-current" />
                </button>

                {/* Read Page Button */}
                <button
                  onClick={handleReadCurrentPage}
                  className="flex items-center gap-1.5 border border-zinc-800 bg-zinc-900 px-2.5 py-1.5 text-xs text-zinc-300 hover:border-[#E056FD] hover:text-white active:scale-95"
                  title="Speak currently viewed page only"
                >
                  <FileText className="h-3.5 w-3.5 text-[#E056FD]" />
                  <span className="text-[11px]">PAGE {currentActivePage}</span>
                </button>
              </div>

              {/* Speed Presets */}
              <div className="flex items-center gap-1">
                {[0.75, 1.0, 1.25, 1.5, 2.0].map((spd) => (
                  <button
                    key={spd}
                    onClick={() => setTTSRate(spd)}
                    className={`px-2 py-1 text-[10px] font-bold transition-all ${
                      ttsState.rate === spd
                        ? 'border border-[#FF003C] bg-[#FF003C]/20 text-[#FF003C]'
                        : 'border border-zinc-800 bg-zinc-950 text-zinc-400 hover:text-white'
                    }`}
                  >
                    {spd}x
                  </button>
                ))}
              </div>

              {/* Toggle Audio Settings */}
              <button
                onClick={() => setIsSettingsExpanded(!isSettingsExpanded)}
                className={`flex items-center gap-1 border px-2.5 py-1.5 text-xs transition-all ${
                  isSettingsExpanded
                    ? 'border-[#E056FD] bg-[#E056FD]/10 text-[#E056FD]'
                    : 'border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-white'
                }`}
              >
                <Sliders className="h-3.5 w-3.5" />
                <span className="text-[11px]">VOICE</span>
              </button>
            </div>

            {/* Expanded Voice & Synthesis Configuration Drawer */}
            {isSettingsExpanded && (
              <div className="mt-3 space-y-3 border border-zinc-800/80 bg-zinc-950 p-3 text-xs">
                {/* Voice Selection */}
                <div>
                  <label className="mb-1 block text-[10px] uppercase tracking-wider text-zinc-400">
                    VOICE ENGINE ({displayVoices.length} FOUND)
                  </label>
                  <select
                    value={ttsState.currentVoiceURI || selectedVoice?.voiceURI || ''}
                    onChange={(e) => setTTSVoice(e.target.value)}
                    className="w-full border border-zinc-800 bg-black p-2 text-xs text-white focus:border-[#FF003C] focus:outline-none"
                  >
                    {displayVoices.length === 0 && (
                      <option value="">Default System Voice</option>
                    )}
                    {displayVoices.map((v) => v && v.voiceURI ? (
                      <option key={v.voiceURI} value={v.voiceURI}>
                        {v.name || v.voiceURI} ({v.lang || 'standard'}) {v.default ? '★ Default' : ''}
                      </option>
                    ) : null)}
                  </select>
                </div>

                {/* Pitch & Volume Sliders */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <div className="mb-1 flex justify-between text-[10px] text-zinc-400">
                      <span>PITCH</span>
                      <span>{ttsState.pitch.toFixed(1)}x</span>
                    </div>
                    <input
                      type="range"
                      min="0.5"
                      max="1.5"
                      step="0.1"
                      value={ttsState.pitch}
                      onChange={(e) => setTTSPitch(parseFloat(e.target.value))}
                      className="w-full accent-[#FF003C]"
                    />
                  </div>

                  <div>
                    <div className="mb-1 flex justify-between text-[10px] text-zinc-400">
                      <span>VOLUME</span>
                      <span>{Math.round(ttsState.volume * 100)}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={ttsState.volume}
                      onChange={(e) => setTTSVolume(parseFloat(e.target.value))}
                      className="w-full accent-[#E056FD]"
                    />
                  </div>
                </div>

                {/* Highlight Toggle */}
                <div className="flex items-center justify-between pt-1 text-[11px] text-zinc-400">
                  <span>Karaoke Word Synchronizer</span>
                  <button
                    onClick={toggleTTSHighlight}
                    className={`border px-2 py-0.5 text-[10px] ${
                      ttsState.isHighlightEnabled
                        ? 'border-emerald-500 bg-emerald-950/40 text-emerald-400'
                        : 'border-zinc-800 text-zinc-500'
                    }`}
                  >
                    {ttsState.isHighlightEnabled ? 'ACTIVE' : 'OFF'}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// ===== END NEW CODE: BROWSER NATIVE WEB SPEECH API TTS PLAYER WITH REAL-TIME CONTROLS =====
