import React, { useState } from 'react';
import { 
  Languages, 
  Search, 
  Check, 
  Sparkles, 
  RotateCcw, 
  X, 
  Globe, 
  ArrowRight,
  ShieldCheck,
  FileText
} from 'lucide-react';
import { useGameStore } from '../../store/useGameStore.ts';
import { SUPPORTED_LANGUAGES, getSupportedLanguage } from '../../utils/languageDetector.ts';
import { SupportedLanguage } from '../../types/index.ts';

// ===== START NEW CODE: DOCUMENT TRANSLATION MODAL WITH MULTI-LANGUAGE PRESETS & PC/MOBILE CONTROLS =====

export const DocumentTranslationModal: React.FC = () => {
  const {
    isTranslationModalOpen,
    setIsTranslationModalOpen,
    detectedLanguage,
    result,
    editedHtml,
    translateDocument,
    undoTranslation,
    isTranslating,
    originalBackupHtml,
    originalBackupTitle,
  } = useGameStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLangCode, setSelectedLangCode] = useState<string>('en');
  const [activeTab, setActiveTab] = useState<'translate' | 'revert'>('translate');

  if (!isTranslationModalOpen) return null;

  const currentSourceCode = (detectedLanguage?.code || 'en').toLowerCase();
  const sourceLang = getSupportedLanguage(currentSourceCode);
  const isAlreadyTranslated = result?.isTranslated && !!originalBackupHtml;

  const filteredLanguages = SUPPORTED_LANGUAGES.filter((lang) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      lang.name.toLowerCase().includes(q) ||
      lang.nativeName.toLowerCase().includes(q) ||
      lang.code.toLowerCase().includes(q)
    );
  });

  const handleExecuteTranslation = async () => {
    if (!selectedLangCode || isTranslating) return;
    await translateDocument(selectedLangCode);
  };

  const handleRevert = () => {
    undoTranslation();
    setIsTranslationModalOpen(false);
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-3 font-mono backdrop-blur-sm sm:p-6"
      onClick={() => !isTranslating && setIsTranslationModalOpen(false)}
    >
      <div 
        className="relative flex max-h-[90vh] w-full max-w-2xl flex-col border border-[#FF003C]/50 bg-black text-white shadow-[0_0_50px_rgba(255,0,60,0.25)]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 bg-[#0d0d0d] px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center border border-[#FF003C] bg-[#FF003C]/10 text-[#FF003C]">
              <Languages className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold tracking-wider text-white">
                DOCUMENT TRANSLATION // MULTI-LINGUAL MATRIX
              </h2>
              <div className="flex items-center gap-2 text-[11px] text-zinc-400">
                <span>DETECTED SOURCE:</span>
                <span className="font-semibold text-[#E056FD]">
                  {sourceLang.flag} {sourceLang.name} ({sourceLang.nativeName})
                </span>
                {detectedLanguage?.confidence && (
                  <span className="text-[10px] text-emerald-400">
                    [{Math.round(detectedLanguage.confidence * 100)}% Match]
                  </span>
                )}
              </div>
            </div>
          </div>

          <button
            onClick={() => !isTranslating && setIsTranslationModalOpen(false)}
            disabled={isTranslating}
            className="p-1 text-zinc-400 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Translation Status Notice */}
        {isAlreadyTranslated && (
          <div className="flex items-center justify-between border-b border-[#E056FD]/30 bg-[#E056FD]/10 px-4 py-2.5 text-xs text-[#E056FD]">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              <span>
                Document is currently translated into <strong>{result?.documentTitle}</strong>.
              </span>
            </div>
            <button
              onClick={handleRevert}
              className="flex items-center gap-1 border border-[#FF003C] bg-black px-2.5 py-1 text-[11px] text-[#FF003C] hover:bg-[#FF003C] hover:text-black"
            >
              <RotateCcw className="h-3 w-3" />
              <span>REVERT ORIGINAL</span>
            </button>
          </div>
        )}

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5">
          {/* Search bar */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
            <input
              type="text"
              placeholder="Search target language (e.g. English, French, Spanish, 日本語, Arabic)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full border border-zinc-800 bg-zinc-950 py-2.5 pl-9 pr-3 text-xs text-white placeholder-zinc-500 focus:border-[#FF003C] focus:outline-none"
            />
          </div>

          {/* Language Selection Grid */}
          <div className="mb-4">
            <label className="mb-2 block text-[11px] font-bold uppercase tracking-wider text-zinc-400">
              SELECT TARGET DESTINATION LANGUAGE ({filteredLanguages.length} AVAILABLE)
            </label>
            <div className="grid max-h-64 grid-cols-1 gap-2 overflow-y-auto pr-1 sm:grid-cols-2">
              {filteredLanguages.map((lang) => {
                const isSelected = selectedLangCode === lang.code;
                const isCurrentSource = lang.code === currentSourceCode;

                return (
                  <button
                    key={lang.code}
                    type="button"
                    onClick={() => setSelectedLangCode(lang.code)}
                    className={`flex items-center justify-between border p-2.5 text-left text-xs transition-all ${
                      isSelected
                        ? 'border-[#FF003C] bg-[#FF003C]/10 text-white shadow-[0_0_10px_rgba(255,0,60,0.2)]'
                        : 'border-zinc-800/80 bg-zinc-950/60 text-zinc-300 hover:border-zinc-700 hover:bg-zinc-900'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="text-base">{lang.flag}</span>
                      <div>
                        <div className="font-semibold text-white">
                          {lang.name}
                          {isCurrentSource && (
                            <span className="ml-1.5 text-[10px] text-zinc-500">(Source)</span>
                          )}
                        </div>
                        <div className="text-[10px] text-zinc-400">{lang.nativeName}</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] text-zinc-500 uppercase">{lang.code}</span>
                      {isSelected && (
                        <div className="flex h-4 w-4 items-center justify-center rounded-full bg-[#FF003C] text-black">
                          <Check className="h-2.5 w-2.5 stroke-[3]" />
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Guarantees Matrix */}
          <div className="border border-zinc-800 bg-zinc-950/80 p-3 text-[11px] text-zinc-400">
            <div className="mb-1.5 flex items-center gap-1.5 font-bold text-white">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
              <span>LAYOUT PRESERVATION ASSURANCE</span>
            </div>
            <p className="leading-relaxed">
              Gemini AI translates document text while strictly preserving all Google Doc paragraph styles, bold headings, table cell dimensions, border lines, text alignment, and pagination breaks.
            </p>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-zinc-800 bg-[#0d0d0d] px-4 py-3">
          <div className="text-[11px] text-zinc-500">
            TARGET: <strong className="text-[#E056FD]">{getSupportedLanguage(selectedLangCode).name}</strong>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsTranslationModalOpen(false)}
              disabled={isTranslating}
              className="border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-white"
            >
              CANCEL
            </button>

            <button
              onClick={handleExecuteTranslation}
              disabled={isTranslating}
              className="flex items-center gap-2 border border-[#FF003C] bg-[#FF003C] px-4 py-2 text-xs font-bold text-black transition-all hover:bg-[#ff2456] hover:shadow-[0_0_15px_rgba(255,0,60,0.5)] active:scale-95 disabled:opacity-50"
            >
              <Sparkles className="h-4 w-4" />
              <span>
                {isTranslating ? 'TRANSLATING WITH GEMINI...' : `TRANSLATE TO ${getSupportedLanguage(selectedLangCode).name.toUpperCase()}`}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ===== END NEW CODE: DOCUMENT TRANSLATION MODAL WITH MULTI-LANGUAGE PRESETS & PC/MOBILE CONTROLS =====
