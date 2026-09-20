import React from 'react';
import { Languages, ArrowRight, RotateCcw, X, Sparkles, Volume2, Globe } from 'lucide-react';
import { useGameStore } from '../../store/useGameStore.ts';
import { SUPPORTED_LANGUAGES, getSupportedLanguage } from '../../utils/languageDetector.ts';

// ===== START NEW CODE: AUTOMATIC LANGUAGE DETECTION & TRANSLATION OFFER BANNER =====

export const LanguageTranslationBanner: React.FC = () => {
  const {
    detectedLanguage,
    result,
    isTranslating,
    isTranslationOfferDismissed,
    dismissTranslationOffer,
    setIsTranslationModalOpen,
    translateDocument,
    undoTranslation,
    originalBackupHtml,
    openExportModal,
    toggleTTSPlayer,
  } = useGameStore();

  if (!result || isTranslationOfferDismissed) {
    return null;
  }

  const isTranslated = result.isTranslated && !!originalBackupHtml;
  const currentLangCode = (detectedLanguage?.code || 'en').toLowerCase();
  const isNonEnglish = currentLangCode !== 'en' && currentLangCode !== 'en-us';
  const detectedLangInfo = getSupportedLanguage(currentLangCode);

  // If document is already in English and not translated, we still show a sleek language indicator chip or let user translate if desired
  const quickTarget = isNonEnglish ? getSupportedLanguage('en') : getSupportedLanguage('es');

  return (
    <div className="relative mb-3 overflow-hidden border border-[#FF003C]/30 bg-gradient-to-r from-black via-[#11050a] to-black p-3 font-mono text-xs shadow-lg transition-all duration-300">
      {/* Cyberpunk scanline accent */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-[#FF003C] to-transparent opacity-80" />
      
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Left Info Section */}
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center border border-[#FF003C]/40 bg-[#FF003C]/10 text-[#FF003C]">
            <Globe className="h-4 w-4 animate-pulse" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold tracking-wider text-white">
                {isTranslated ? 'DOCUMENT TRANSLATED' : 'PRIMARY LANGUAGE DETECTED:'}
              </span>
              <span className="inline-flex items-center gap-1.5 border border-[#E056FD]/40 bg-[#E056FD]/10 px-2 py-0.5 text-[11px] font-semibold text-[#E056FD]">
                <span>{detectedLangInfo.flag}</span>
                <span>{detectedLangInfo.name.toUpperCase()}</span>
                {detectedLangInfo.nativeName !== detectedLangInfo.name && (
                  <span className="opacity-70">({detectedLangInfo.nativeName})</span>
                )}
                {detectedLanguage?.confidence && !isTranslated && (
                  <span className="text-[10px] text-zinc-400">
                    {Math.round(detectedLanguage.confidence * 100)}% Match
                  </span>
                )}
              </span>
            </div>

            <p className="mt-0.5 text-[11px] text-zinc-400">
              {isTranslated ? (
                <>
                  Document layout, font hierarchies, and tables preserved in{' '}
                  <span className="text-emerald-400">{detectedLangInfo.name}</span>.
                </>
              ) : isNonEnglish ? (
                'Translate into English or 25+ target languages before finalizing your Google Doc export.'
              ) : (
                'Convert & translate this document into 25+ international languages with 100% layout fidelity.'
              )}
            </p>
          </div>
        </div>

        {/* Right Actions Section */}
        <div className="flex flex-wrap items-center gap-2">
          {isTranslated ? (
            <button
              onClick={undoTranslation}
              disabled={isTranslating}
              className="flex items-center gap-1.5 border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-zinc-300 transition-all hover:border-[#FF003C] hover:bg-black hover:text-white active:scale-95"
              title="Revert to original text before translation"
            >
              <RotateCcw className="h-3.5 w-3.5 text-[#FF003C]" />
              <span>REVERT ORIGINAL</span>
            </button>
          ) : (
            <button
              onClick={() => translateDocument(quickTarget.code)}
              disabled={isTranslating}
              className="flex items-center gap-1.5 border border-[#FF003C] bg-[#FF003C] px-3 py-1.5 font-bold text-black transition-all hover:bg-[#ff2456] hover:shadow-[0_0_12px_rgba(255,0,60,0.5)] active:scale-95 disabled:opacity-50"
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>
                {isTranslating
                  ? 'TRANSLATING...'
                  : isNonEnglish
                  ? `TRANSLATE TO ${quickTarget.name.toUpperCase()} ${quickTarget.flag}`
                  : `TRANSLATE TO ${quickTarget.name.toUpperCase()} ${quickTarget.flag}`}
              </span>
            </button>
          )}

          {/* Open full language selector modal */}
          <button
            onClick={() => setIsTranslationModalOpen(true)}
            disabled={isTranslating}
            className="flex items-center gap-1.5 border border-[#E056FD]/50 bg-black/60 px-3 py-1.5 text-[#E056FD] transition-all hover:border-[#E056FD] hover:bg-[#E056FD]/10 active:scale-95"
          >
            <Languages className="h-3.5 w-3.5" />
            <span>MORE LANGUAGES</span>
          </button>

          {/* Quick launch TTS */}
          <button
            onClick={toggleTTSPlayer}
            className="flex items-center gap-1 border border-zinc-800 bg-zinc-900 px-2.5 py-1.5 text-zinc-400 transition-all hover:border-emerald-500/50 hover:bg-emerald-950/20 hover:text-emerald-400"
            title="Listen to document audio (Text-to-Speech)"
          >
            <Volume2 className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">READ ALOUD</span>
          </button>

          {/* Dismiss button */}
          <button
            onClick={dismissTranslationOffer}
            className="p-1.5 text-zinc-500 transition-colors hover:text-zinc-300"
            title="Dismiss banner"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

// ===== END NEW CODE: AUTOMATIC LANGUAGE DETECTION & TRANSLATION OFFER BANNER =====
