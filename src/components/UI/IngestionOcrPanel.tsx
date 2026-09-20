import React, { useState } from 'react';
import { 
  Languages, 
  Sparkles, 
  Sliders, 
  Check, 
  ChevronDown, 
  ChevronUp, 
  Zap, 
  Cpu, 
  Layers, 
  AlignRight, 
  AlignLeft, 
  Table, 
  Type, 
  BookOpen, 
  PenTool, 
  RotateCcw,
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';
import { 
  IngestionOcrSettings, 
  DetectedLanguage, 
  ScriptType, 
  SupportedLanguage 
} from '../../types/index.ts';
import { 
  SUPPORTED_LANGUAGES, 
  getAutoOcrSettingsForLanguage 
} from '../../utils/languageDetector.ts';
import { cyberAudio } from '../../utils/audioSynth.ts';

// ===== START NEW CODE: INGESTION OCR & AUTO-LANGUAGE TUNING PANEL =====

interface IngestionOcrPanelProps {
  detectedLanguage?: DetectedLanguage | null;
  ocrSettings: IngestionOcrSettings;
  onChange: (updated: IngestionOcrSettings) => void;
  compact?: boolean;
}

export const IngestionOcrPanel: React.FC<IngestionOcrPanelProps> = ({
  detectedLanguage,
  ocrSettings,
  onChange,
  compact = false,
}) => {
  const [isOpen, setIsOpen] = useState(!compact);
  const [isLangDropdownOpen, setIsLangDropdownOpen] = useState(false);

  const handleToggleAutoDetect = () => {
    cyberAudio.playCyberClick();
    const nextAuto = !ocrSettings.autoLanguageDetection;
    if (nextAuto && detectedLanguage) {
      const recalculated = getAutoOcrSettingsForLanguage(detectedLanguage);
      onChange({ ...recalculated, autoLanguageDetection: true });
    } else {
      onChange({ ...ocrSettings, autoLanguageDetection: nextAuto });
    }
  };

  const handleSelectLanguage = (lang: SupportedLanguage) => {
    cyberAudio.playCyberClick();
    const recalculated = getAutoOcrSettingsForLanguage({
      code: lang.code,
      name: lang.name,
      nativeName: lang.nativeName,
      confidence: 1.0,
      flag: lang.flag,
      isAutoDetected: false,
    });
    onChange({
      ...recalculated,
      autoLanguageDetection: false,
      detectedLanguageCode: lang.code,
      detectedLanguageName: lang.name,
    });
    setIsLangDropdownOpen(false);
  };

  const handleToggleSetting = <K extends keyof IngestionOcrSettings>(key: K) => {
    cyberAudio.playCyberClick();
    onChange({
      ...ocrSettings,
      [key]: !ocrSettings[key],
    });
  };

  const activeLanguage = SUPPORTED_LANGUAGES.find(
    (l) => l.code === ocrSettings.detectedLanguageCode
  ) || SUPPORTED_LANGUAGES[0];

  const scriptBadgeColors: Record<ScriptType, { bg: string; text: string; border: string }> = {
    latin: { bg: 'bg-blue-950/40', text: 'text-blue-400', border: 'border-blue-800' },
    cjk: { bg: 'bg-purple-950/40', text: 'text-[#E056FD]', border: 'border-purple-800' },
    rtl: { bg: 'bg-amber-950/40', text: 'text-amber-400', border: 'border-amber-800' },
    hebrew: { bg: 'bg-amber-950/40', text: 'text-amber-400', border: 'border-amber-800' },
    cyrillic: { bg: 'bg-emerald-950/40', text: 'text-emerald-400', border: 'border-emerald-800' },
    devanagari: { bg: 'bg-orange-950/40', text: 'text-orange-400', border: 'border-orange-800' },
    greek: { bg: 'bg-cyan-950/40', text: 'text-cyan-400', border: 'border-cyan-800' },
    universal: { bg: 'bg-neutral-900', text: 'text-neutral-300', border: 'border-neutral-700' },
  };

  const scriptBadge = scriptBadgeColors[ocrSettings.scriptType] || scriptBadgeColors.latin;

  return (
    <div className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-3.5 font-mono text-sm space-y-3 shadow-md">
      {/* Header bar */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-[#FF003C]/10 border border-[#FF003C]/30 flex items-center justify-center shrink-0">
            <Languages className="w-3.5 h-3.5 text-[#FF003C]" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-white font-bold text-xs uppercase tracking-wider">
                Language Auto-Detection &amp; OCR Engine
              </span>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-[#FF003C]/20 text-[#FF003C] font-semibold border border-[#FF003C]/30">
                AUTO-CONFIG
              </span>
            </div>
            <p className="text-[11px] text-neutral-400">
              Scans document script during ingestion to calibrate backend OCR matrices
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Auto-detect switch */}
          <button
            type="button"
            onClick={handleToggleAutoDetect}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-semibold border transition-all ${
              ocrSettings.autoLanguageDetection
                ? 'bg-emerald-950/50 border-emerald-600 text-emerald-300'
                : 'bg-neutral-900 border-neutral-700 text-neutral-400 hover:text-white'
            }`}
            title="Toggle automatic language detection and OCR matrix presets"
          >
            <Sparkles className="w-3 h-3 text-emerald-400" />
            <span>Auto: {ocrSettings.autoLanguageDetection ? 'ENABLED' : 'MANUAL'}</span>
          </button>

          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="p-1 rounded bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-400 hover:text-white transition-colors"
            title={isOpen ? 'Collapse OCR settings' : 'Expand OCR settings'}
          >
            {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Primary Detection Status Bar */}
      <div className="flex items-center justify-between gap-3 p-2.5 bg-black/60 border border-neutral-800/80 rounded-md flex-wrap">
        <div className="flex items-center gap-2.5">
          <span className="text-2xl select-none" role="img" aria-label={activeLanguage.name}>
            {activeLanguage.flag}
          </span>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-white text-sm">
                {activeLanguage.name} ({activeLanguage.nativeName})
              </span>
              <span className={`text-[10px] px-2 py-0.5 rounded border uppercase font-bold ${scriptBadge.bg} ${scriptBadge.text} ${scriptBadge.border}`}>
                {ocrSettings.scriptType} SCRIPT
              </span>
            </div>
            <div className="flex items-center gap-2 text-[11px] text-neutral-400">
              <span>Code: <strong className="text-neutral-200">{ocrSettings.detectedLanguageCode.toUpperCase()}</strong></span>
              <span>&bull;</span>
              <span>Confidence: <strong className="text-emerald-400">{Math.round((detectedLanguage?.confidence || 0.98) * 100)}%</strong></span>
            </div>
          </div>
        </div>

        {/* Manual Language Selector Dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setIsLangDropdownOpen(!isLangDropdownOpen)}
            className="flex items-center gap-2 px-3 py-1.5 rounded bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-xs text-neutral-200 transition-colors"
          >
            <span>Change Language</span>
            <ChevronDown className="w-3 h-3 text-neutral-400" />
          </button>

          {isLangDropdownOpen && (
            <div className="absolute right-0 top-full mt-1 w-56 max-h-60 overflow-y-auto bg-neutral-900 border border-neutral-700 rounded-lg shadow-xl z-50 p-1 divide-y divide-neutral-800">
              <div className="px-2 py-1 text-[10px] font-bold text-neutral-400 uppercase tracking-wider">
                Select Document Language
              </div>
              <div className="py-1">
                {SUPPORTED_LANGUAGES.map((lang) => (
                  <button
                    key={lang.code}
                    type="button"
                    onClick={() => handleSelectLanguage(lang)}
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded text-xs text-left transition-colors ${
                      ocrSettings.detectedLanguageCode === lang.code
                        ? 'bg-[#FF003C]/20 text-[#FF003C] font-bold'
                        : 'text-neutral-300 hover:bg-neutral-800 hover:text-white'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <span>{lang.flag}</span>
                      <span>{lang.name}</span>
                    </span>
                    {ocrSettings.detectedLanguageCode === lang.code && (
                      <Check className="w-3.5 h-3.5 text-[#FF003C]" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Collapsible Detailed OCR Settings Matrix */}
      {isOpen && (
        <div className="space-y-3 pt-1">
          <div className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider flex items-center gap-1.5">
            <Sliders className="w-3 h-3 text-[#FF003C]" />
            <span>Backend OCR Pipeline Switches</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
            {/* 1. BiDi Directionality */}
            <button
              type="button"
              onClick={() => handleToggleSetting('enableBidiTextEngine')}
              className={`flex items-start gap-2.5 p-2 rounded-md border text-left transition-all ${
                ocrSettings.enableBidiTextEngine
                  ? 'bg-amber-950/30 border-amber-600/60 text-amber-200'
                  : 'bg-neutral-900/50 border-neutral-800 text-neutral-400 hover:text-neutral-200 hover:border-neutral-700'
              }`}
            >
              <div className={`p-1 rounded mt-0.5 ${ocrSettings.enableBidiTextEngine ? 'bg-amber-500/20 text-amber-400' : 'bg-neutral-800 text-neutral-500'}`}>
                <AlignRight className="w-3.5 h-3.5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white">BiDi RTL Engine</span>
                  <span className={`text-[10px] font-bold ${ocrSettings.enableBidiTextEngine ? 'text-amber-400' : 'text-neutral-500'}`}>
                    {ocrSettings.enableBidiTextEngine ? 'ON' : 'OFF'}
                  </span>
                </div>
                <p className="text-[10px] text-neutral-400 leading-tight mt-0.5">
                  Right-to-left flow for Arabic &amp; Hebrew scripts
                </p>
              </div>
            </button>

            {/* 2. Vertical Text Flow */}
            <button
              type="button"
              onClick={() => handleToggleSetting('verticalTextOrientation')}
              className={`flex items-start gap-2.5 p-2 rounded-md border text-left transition-all ${
                ocrSettings.verticalTextOrientation
                  ? 'bg-purple-950/30 border-purple-600/60 text-purple-200'
                  : 'bg-neutral-900/50 border-neutral-800 text-neutral-400 hover:text-neutral-200 hover:border-neutral-700'
              }`}
            >
              <div className={`p-1 rounded mt-0.5 ${ocrSettings.verticalTextOrientation ? 'bg-purple-500/20 text-[#E056FD]' : 'bg-neutral-800 text-neutral-500'}`}>
                <Layers className="w-3.5 h-3.5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white">Vertical Flow Parser</span>
                  <span className={`text-[10px] font-bold ${ocrSettings.verticalTextOrientation ? 'text-[#E056FD]' : 'text-neutral-500'}`}>
                    {ocrSettings.verticalTextOrientation ? 'ON' : 'OFF'}
                  </span>
                </div>
                <p className="text-[10px] text-neutral-400 leading-tight mt-0.5">
                  Tate-chū-yoko / vertical CJK columns
                </p>
              </div>
            </button>

            {/* 3. Diacritics Preservation */}
            <button
              type="button"
              onClick={() => handleToggleSetting('diacriticsPreservation')}
              className={`flex items-start gap-2.5 p-2 rounded-md border text-left transition-all ${
                ocrSettings.diacriticsPreservation
                  ? 'bg-emerald-950/30 border-emerald-600/60 text-emerald-200'
                  : 'bg-neutral-900/50 border-neutral-800 text-neutral-400 hover:text-neutral-200 hover:border-neutral-700'
              }`}
            >
              <div className={`p-1 rounded mt-0.5 ${ocrSettings.diacriticsPreservation ? 'bg-emerald-500/20 text-emerald-400' : 'bg-neutral-800 text-neutral-500'}`}>
                <Type className="w-3.5 h-3.5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white">Diacritic Fidelity</span>
                  <span className={`text-[10px] font-bold ${ocrSettings.diacriticsPreservation ? 'text-emerald-400' : 'text-neutral-500'}`}>
                    {ocrSettings.diacriticsPreservation ? 'ON' : 'OFF'}
                  </span>
                </div>
                <p className="text-[10px] text-neutral-400 leading-tight mt-0.5">
                  Preserve accents, umlauts, cedillas &amp; tildes
                </p>
              </div>
            </button>

            {/* 4. Character Resolution */}
            <button
              type="button"
              onClick={() => handleToggleSetting('enhanceCharacterResolution')}
              className={`flex items-start gap-2.5 p-2 rounded-md border text-left transition-all ${
                ocrSettings.enhanceCharacterResolution
                  ? 'bg-blue-950/30 border-blue-600/60 text-blue-200'
                  : 'bg-neutral-900/50 border-neutral-800 text-neutral-400 hover:text-neutral-200 hover:border-neutral-700'
              }`}
            >
              <div className={`p-1 rounded mt-0.5 ${ocrSettings.enhanceCharacterResolution ? 'bg-blue-500/20 text-blue-400' : 'bg-neutral-800 text-neutral-500'}`}>
                <Cpu className="w-3.5 h-3.5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white">Glyph Disambiguation</span>
                  <span className={`text-[10px] font-bold ${ocrSettings.enhanceCharacterResolution ? 'text-blue-400' : 'text-neutral-500'}`}>
                    {ocrSettings.enhanceCharacterResolution ? 'ON' : 'OFF'}
                  </span>
                </div>
                <p className="text-[10px] text-neutral-400 leading-tight mt-0.5">
                  Subpixel contrast for 0/O, 1/l, rn/m glyphs
                </p>
              </div>
            </button>

            {/* 5. Ligature Resolution */}
            <button
              type="button"
              onClick={() => handleToggleSetting('preserveLigatures')}
              className={`flex items-start gap-2.5 p-2 rounded-md border text-left transition-all ${
                ocrSettings.preserveLigatures
                  ? 'bg-cyan-950/30 border-cyan-600/60 text-cyan-200'
                  : 'bg-neutral-900/50 border-neutral-800 text-neutral-400 hover:text-neutral-200 hover:border-neutral-700'
              }`}
            >
              <div className={`p-1 rounded mt-0.5 ${ocrSettings.preserveLigatures ? 'bg-cyan-500/20 text-cyan-400' : 'bg-neutral-800 text-neutral-500'}`}>
                <Zap className="w-3.5 h-3.5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white">Ligature Engine</span>
                  <span className={`text-[10px] font-bold ${ocrSettings.preserveLigatures ? 'text-cyan-400' : 'text-neutral-500'}`}>
                    {ocrSettings.preserveLigatures ? 'ON' : 'OFF'}
                  </span>
                </div>
                <p className="text-[10px] text-neutral-400 leading-tight mt-0.5">
                  Resolve typographic fi, fl, ffi, æ combinations
                </p>
              </div>
            </button>

            {/* 6. Dictionary Alignment */}
            <button
              type="button"
              onClick={() => handleToggleSetting('dictionaryAlignment')}
              className={`flex items-start gap-2.5 p-2 rounded-md border text-left transition-all ${
                ocrSettings.dictionaryAlignment
                  ? 'bg-rose-950/30 border-rose-600/60 text-rose-200'
                  : 'bg-neutral-900/50 border-neutral-800 text-neutral-400 hover:text-neutral-200 hover:border-neutral-700'
              }`}
            >
              <div className={`p-1 rounded mt-0.5 ${ocrSettings.dictionaryAlignment ? 'bg-rose-500/20 text-rose-400' : 'bg-neutral-800 text-neutral-500'}`}>
                <BookOpen className="w-3.5 h-3.5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white">Lexicon Alignment</span>
                  <span className={`text-[10px] font-bold ${ocrSettings.dictionaryAlignment ? 'text-rose-400' : 'text-neutral-500'}`}>
                    {ocrSettings.dictionaryAlignment ? 'ON' : 'OFF'}
                  </span>
                </div>
                <p className="text-[10px] text-neutral-400 leading-tight mt-0.5">
                  Align extracted tokens with target lexicon
                </p>
              </div>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
// ===== END NEW CODE: INGESTION OCR & AUTO-LANGUAGE TUNING PANEL =====
