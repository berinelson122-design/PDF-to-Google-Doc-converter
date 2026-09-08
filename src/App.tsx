import React from 'react';
import { Navbar } from './components/layout/Navbar.tsx';
import { Scanlines } from './components/layout/Scanlines.tsx';
import { Watermark } from './components/layout/Watermark.tsx';
import { PdfUploader } from './components/UI/PdfUploader.tsx';
import { ComparisonView } from './components/UI/ComparisonView.tsx';
import { ControlSettings } from './components/UI/ControlSettings.tsx';
import { DocxExportModal } from './components/UI/DocxExportModal.tsx';
import { PricingModal } from './components/UI/PricingModal.tsx';
import { VirtualJoystick } from './components/UI/VirtualJoystick.tsx';
import { ConversionHistory } from './components/UI/ConversionHistory.tsx';
import { useUniversalInput } from './hooks/useUniversalInput.ts';
import { useGameStore } from './store/useGameStore.ts';
import { FileText, ArrowRight, CheckCircle2, Zap } from 'lucide-react';
import { CyberButton } from './components/common/CyberButton.tsx';

// ===== START NEW CODE: MAIN APP BRAIN & CYBERPUNK ARCHITECTURE =====
export default function App() {
  useUniversalInput();
  const { result, currentPdf, resetConversion } = useGameStore();

  return (
    <div className="min-h-screen bg-black text-[#EDEDED] flex flex-col relative font-mono selection:bg-[#FF003C] selection:text-white pb-16">
      {/* Background Procedural Scanline & Beam Canvas */}
      <Scanlines />

      {/* Primary Navigation Bar */}
      <Navbar />

      {/* Main Tactical Workspace */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 flex flex-col space-y-6 relative z-10">
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
                  Unlike Google&apos;s native converter which flattens PDFs into plain unformatted text blobs with broken margins, our Gemini 3.8 Flash pipeline reads visual layout natively, extracts complex multi-column tables, heading weights, and provides 1-click rich clipboard transfer to <code className="text-[#E056FD]">docs.google.com</code>.
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

        {/* Telemetry Logs & Conversion History */}
        <ConversionHistory />
      </main>

      {/* Cross-Device Modals & System Interfaces */}
      <ControlSettings />
      <DocxExportModal />
      <PricingModal />
      <VirtualJoystick />

      {/* Bottom Right Required Cyber Watermark */}
      <Watermark />
    </div>
  );
}
// ===== END NEW CODE: MAIN APP BRAIN & CYBERPUNK ARCHITECTURE =====
