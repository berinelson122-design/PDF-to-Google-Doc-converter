import React, { useEffect } from 'react';
import { Navbar } from './components/layout/Navbar.tsx';
import { Scanlines } from './components/layout/Scanlines.tsx';
import { Watermark } from './components/layout/Watermark.tsx';
import { PdfUploader } from './components/UI/PdfUploader.tsx';
import { ComparisonView } from './components/UI/ComparisonView.tsx';
import { ControlSettings } from './components/UI/ControlSettings.tsx';
import { DocxExportModal } from './components/UI/DocxExportModal.tsx';
import { PricingModal } from './components/UI/PricingModal.tsx';
import { ConversionHistory } from './components/UI/ConversionHistory.tsx';
import { RecentConversionsBar } from './components/UI/RecentConversionsBar.tsx';
import { useUniversalInput } from './hooks/useUniversalInput.ts';
import { useGlobalShortcuts } from './hooks/useGlobalShortcuts.ts';
import { useGameStore } from './store/useGameStore.ts';
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
    restoreLastConversion 
  } = useGameStore();

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
    <div className="min-h-screen bg-black text-[#EDEDED] flex flex-col relative font-mono selection:bg-[#FF003C] selection:text-white pb-16">
      {/* Background Procedural Scanline & Beam Canvas */}
      <Scanlines />

      {/* Primary Navigation Bar */}
      <Navbar />

      {/* Main Tactical Workspace */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 flex flex-col space-y-6 relative z-10">
        {/* Quick Session Resume Banner if page was refreshed and previous conversions exist */}
        {!result && savedConversions.length > 0 && (
          <div 
            id="session-restore-banner"
            className="p-3 md:p-3.5 bg-emerald-950/25 border border-emerald-500/40 rounded flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-[0_0_15px_rgba(16,185,129,0.1)] relative overflow-hidden"
          >
            <div className="flex items-center gap-2.5 text-xs">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shrink-0 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
              <div>
                <div className="font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                  <span>PREVIOUS SESSION DETECTED IN LOCAL STORAGE</span>
                  <span className="text-[10px] px-1.5 py-0.2 bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 rounded">
                    {savedConversions.length} SAVED
                  </span>
                </div>
                <div className="text-neutral-400 text-[11px] truncate max-w-lg mt-0.5">
                  Latest: <span className="text-[#E056FD] font-semibold">{savedConversions[0].title}</span> ({savedConversions[0].originalFileName})
                </div>
              </div>
            </div>

            <button
              id="btn-restore-last-conversion"
              onClick={restoreLastConversion}
              className="px-3.5 py-1.5 text-xs font-bold font-mono bg-emerald-500 text-black hover:bg-emerald-400 rounded transition-all shadow-[0_0_12px_rgba(16,185,129,0.4)] shrink-0 flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>RELOAD PREVIOUS DOCUMENT</span>
            </button>
          </div>
        )}

        {/* Value Proposition & Technical Blueprint Banner (When no result yet) */}
        {!result && (
          <div className="p-4 md:p-6 border border-[#FF003C]/40 bg-[#08080A] rounded shadow-[0_0_25px_rgba(255,0,60,0.1)] relative overflow-hidden">
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
              <div className="space-y-1.5 max-w-2xl">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#FF003C] animate-ping" />
                  <span className="text-xs font-bold uppercase tracking-widest text-[#FF003C]">
                    SUPERIOR GOOGLE DOCS RECONSTRUCTION PIPELINE
                  </span>
                </div>
                <h2 className="text-sm md:text-lg font-bold text-white uppercase tracking-wider">
                  Convert PDFs into Google Docs with Preserved Tables, Typography &amp; Layouts
                </h2>
                <p className="text-xs text-neutral-400 leading-relaxed">
                  Unlike Google&apos;s native converter which flattens PDFs into plain unformatted text blobs with broken margins, our Neural Document Reconstruction pipeline reads visual layout natively, extracts complex multi-column tables, heading weights, and provides 1-click rich clipboard transfer to <code className="text-[#E056FD]">docs.google.com</code>.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-2 shrink-0">
                <div className="p-2.5 bg-black border border-neutral-800 rounded text-center">
                  <div className="text-[10px] text-neutral-500 uppercase">Native Google Tool</div>
                  <div className="text-xs text-[#FF003C] font-bold mt-0.5">Broken Tables</div>
                </div>
                <div className="p-2.5 bg-black border border-emerald-500/50 rounded text-center">
                  <div className="text-[10px] text-neutral-400 uppercase">AI Layout Engine</div>
                  <div className="text-xs text-emerald-400 font-bold mt-0.5">100% Retained</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Action Header when result is active */}
        {result && (
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

        {/* Local Storage Persistence Layer for Last 5 Conversions */}
        <RecentConversionsBar />

        {/* Telemetry Logs & Conversion History */}
        <ConversionHistory />
      </main>

      {/* Cross-Device Modals & System Interfaces */}
      <ControlSettings />
      <DocxExportModal />
      <PricingModal />

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
