import React, { useEffect } from 'react';
import { Navbar } from './components/layout/Navbar.tsx';
import { Watermark } from './components/layout/Watermark.tsx';
import { PdfUploader } from './components/UI/PdfUploader.tsx';
import { ComparisonView } from './components/UI/ComparisonView.tsx';
import { ControlSettings } from './components/UI/ControlSettings.tsx';
import { DocxExportModal } from './components/UI/DocxExportModal.tsx';
import { PricingModal } from './components/UI/PricingModal.tsx';
import { ConversionHistory } from './components/UI/ConversionHistory.tsx';
import { RecentConversionsBar } from './components/UI/RecentConversionsBar.tsx';
import { DocumentTranslationModal } from './components/UI/DocumentTranslationModal.tsx';
import { TextToSpeechPlayer } from './components/UI/TextToSpeechPlayer.tsx';
import { KeyboardShortcutsModal } from './components/UI/KeyboardShortcutsModal.tsx';
import { FloatingHelpButton } from './components/UI/FloatingHelpButton.tsx';
import { useUniversalInput } from './hooks/useUniversalInput.ts';
import { useGlobalShortcuts } from './hooks/useGlobalShortcuts.ts';
import { useGameStore, initSystemThemeObserver } from './store/useGameStore.ts';
import { FileText, ArrowRight, CheckCircle2, Zap, RotateCcw, Command, Keyboard } from 'lucide-react';
import { CyberButton } from './components/common/CyberButton.tsx';

// ===== START NEW CODE: MAIN APP BRAIN & CYBERPUNK ARCHITECTURE =====
export default function App() {
  useUniversalInput();
  const { activeNotification } = useGlobalShortcuts();
  const { 
    result, 
    currentPdf, 
    resetConversion, 
    upgradeToPro, 
    savedConversions, 
    restoreLastConversion,
    appTheme,
    setAppTheme,
    isFullscreen 
  } = useGameStore();

  useEffect(() => {
    // Mount system OS dark/light theme observer
    const cleanupObserver = initSystemThemeObserver((newTheme) => {
      setAppTheme(newTheme);
    });
    return cleanupObserver;
  }, [setAppTheme]);

  useEffect(() => {
    // Check for Stripe success URL param
    const params = new URLSearchParams(window.location.search);
    if (params.get('success') === 'true') {
      upgradeToPro();
      
      // Clean up the URL to remove the query string without refreshing
      const newUrl = window.location.protocol + "//" + window.location.host + window.location.pathname;
      window.history.replaceState({ path: newUrl }, '', newUrl);
    }
  }, [upgradeToPro]);

  return (
    <div className={`min-h-screen flex flex-col relative font-mono selection:bg-[#FF003C] selection:text-white ${isFullscreen ? 'p-0 overflow-hidden' : 'pb-16'} transition-colors duration-200 ${
      appTheme === 'light'
        ? 'bg-[#F8F9FA] text-[#09090B] theme-light'
        : 'bg-black text-[#EDEDED] theme-cyberpunk'
    }`}>
      {/* Primary Navigation Bar (Hidden in Distraction-Free Fullscreen Mode) */}
      {!isFullscreen && <Navbar />}

      {/* Main Tactical Workspace */}
      <main className={`flex-1 ${isFullscreen ? 'w-full h-screen p-0 max-w-none' : 'max-w-7xl w-full mx-auto p-4 md:p-6 space-y-6'} flex flex-col relative z-10`}>
        {/* Quick Session Resume Banner if page was refreshed and previous conversions exist */}
        {!isFullscreen && !result && savedConversions.length > 0 && (
          <div 
            id="session-restore-banner"
            className="p-3.5 md:p-4 bg-emerald-950/30 border border-emerald-500/50 rounded-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-[0_0_15px_rgba(16,185,129,0.15)] relative overflow-hidden"
          >
            <div className="flex items-center gap-3 text-sm">
              <span className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse shrink-0 shadow-[0_0_10px_rgba(52,211,153,0.9)]" />
              <div>
                <div className="font-bold text-white uppercase tracking-wider flex items-center gap-2 text-sm">
                  <span>PREVIOUS SESSION DETECTED IN STORAGE</span>
                  <span className="text-xs px-2 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 rounded">
                    {savedConversions.length} SAVED
                  </span>
                </div>
                <div className="text-neutral-300 text-xs truncate max-w-lg mt-0.5">
                  Latest: <span className="text-[#E056FD] font-semibold">{savedConversions[0].title}</span> ({savedConversions[0].originalFileName})
                </div>
              </div>
            </div>

            <button
              id="btn-restore-last-conversion"
              onClick={restoreLastConversion}
              className="px-4 py-2 text-sm font-bold font-mono bg-emerald-500 text-black hover:bg-emerald-400 rounded transition-all shadow-[0_0_12px_rgba(16,185,129,0.4)] shrink-0 flex items-center gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              <span>RELOAD PREVIOUS DOCUMENT</span>
            </button>
          </div>
        )}

        {/* Clear Value Proposition Banner (When no result yet) */}
        {!isFullscreen && !result && (
          <div className="p-5 md:p-6 border border-[#FF003C]/50 bg-[#0A0A0E] rounded-md shadow-[0_0_25px_rgba(255,0,60,0.12)] relative">
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-5">
              <div className="space-y-2 max-w-3xl">
                <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded bg-[#FF003C]/20 border border-[#FF003C]/40 text-[#FF003C] text-xs font-bold uppercase tracking-wider">
                  <Zap className="w-3.5 h-3.5" />
                  HIGH-FIDELITY DOCUMENT CONVERTER
                </div>
                <h2 className="text-lg md:text-2xl font-bold text-white uppercase tracking-wider leading-snug">
                  CONVERT PDF TO GOOGLE DOCS WITH PRESERVED TABLES &amp; TYPOGRAPHY
                </h2>
                <p className="text-sm md:text-base text-neutral-300 leading-relaxed">
                  Reconstructs complex PDF layouts into editable documents with formatted tables, font weights, and headings. Transfer directly to Google Docs or export back to clean PDF, Word, or Markdown.
                </p>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <div className="px-4 py-3 bg-black border border-emerald-500/50 rounded-md text-center">
                  <div className="text-xs text-neutral-400 uppercase font-bold">TABLES &amp; FORMATS</div>
                  <div className="text-base text-emerald-400 font-bold mt-0.5">100% PRESERVED</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Action Header when result is active (Hidden in fullscreen) */}
        {!isFullscreen && result && (
          <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-[#0A0A0C] border border-neutral-800 rounded">
            <div className="flex items-center gap-2 text-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span className="font-bold text-white">ACTIVE DOCUMENT:</span>
              <span className="text-[#E056FD] truncate max-w-xs">{result.documentTitle}</span>
              <span className="text-neutral-500">&bull;</span>
              <span className="text-emerald-400">{result.stats.fidelityScore}% Layout Score</span>
            </div>

            <div className="flex items-center gap-2">
              <CyberButton
                variant="outline"
                size="sm"
                onClick={resetConversion}
                icon={<FileText className="w-3.5 h-3.5" />}
              >
                CONVERT ANOTHER PDF
              </CyberButton>
            </div>
          </div>
        )}

        {/* Document Ingestion Zone */}
        {!result ? (
          <PdfUploader />
        ) : (
          /* Live Comparison & Google Doc Formatted Editor */
          <ComparisonView />
        )}

        {/* Local Storage Persistence Layer for Last 5 Conversions (Hidden in fullscreen) */}
        {!isFullscreen && <RecentConversionsBar />}

        {/* Telemetry Logs & Conversion History (Hidden in fullscreen) */}
        {!isFullscreen && <ConversionHistory />}
      </main>

      {/* Cross-Device Modals & System Interfaces */}
      <ControlSettings />
      <DocxExportModal />
      <PricingModal />
      <DocumentTranslationModal />
      <TextToSpeechPlayer />
      <KeyboardShortcutsModal />

      {/* Persistent Floating '?' Shortcuts Help Trigger */}
      <FloatingHelpButton />

      {/* Global Keyboard Shortcut HUD Toast Notification */}
      {activeNotification && (
        <div 
          id="global-shortcut-hud-toast"
          className="fixed top-20 right-4 sm:right-6 z-50 bg-[#0A0A0E] border-2 border-[#FF003C] rounded px-4 py-2.5 shadow-[0_0_20px_rgba(255,0,60,0.4)] flex items-center gap-3 font-mono transition-all"
        >
          <div className="p-1.5 rounded bg-[#FF003C]/20 text-[#FF003C] border border-[#FF003C]/40">
            <Keyboard className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[10px] text-[#FF003C] font-bold tracking-wider">
              {activeNotification.combo} EXECUTED
            </div>
            <div className="text-xs text-white font-bold uppercase">
              {activeNotification.message}
            </div>
          </div>
        </div>
      )}

      {/* Bottom Right Required Cyber Watermark */}
      <Watermark />
    </div>
  );
}
// ===== END NEW CODE: MAIN APP BRAIN & CYBERPUNK ARCHITECTURE =====
