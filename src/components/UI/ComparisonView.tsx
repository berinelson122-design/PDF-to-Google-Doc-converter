import React, { useState } from 'react';
import { 
  Columns2, 
  FileText, 
  Code, 
  Eye, 
  Layers, 
  Sparkles, 
  CheckCircle2, 
  Cpu,
  Zap,
  FolderOpen,
  BookOpen
} from 'lucide-react';
import { useGameStore } from '../../store/useGameStore.ts';
import { LiveDocPreview } from './LiveDocPreview.tsx';
import { ReadabilityReport } from './ReadabilityReport.tsx';
import { CyberBadge } from '../common/CyberBadge.tsx';
import { CyberButton } from '../common/CyberButton.tsx';
import { cyberAudio } from '../../utils/audioSynth.ts';

export const ComparisonView: React.FC = () => {
  const { 
    currentPdf, 
    result, 
    viewMode, 
    setViewMode, 
    editedHtml,
    savedConversions,
    activeSavedConversionId,
    loadSavedConversion,
    isAutoSaveEnabled
  } = useGameStore();

  const [highlightTables, setHighlightTables] = useState(false);
  const [highlightTypography, setHighlightTypography] = useState(false);

  // ===== START NEW CODE: REAL-TIME DYNAMIC WORD & CHARACTER COUNT CALCULATOR =====
  const rawHtml = editedHtml || result?.htmlContent || '';
  const cleanDocumentText = rawHtml
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  const dynamicWordCount = cleanDocumentText ? cleanDocumentText.split(/\s+/).filter(Boolean).length : 0;
  const dynamicCharCount = cleanDocumentText.length;
  const dynamicCharNoSpaces = cleanDocumentText.replace(/\s/g, '').length;
  const estimatedReadTimeMinutes = Math.max(1, Math.ceil(dynamicWordCount / 200));
  // ===== END NEW CODE: REAL-TIME DYNAMIC WORD & CHARACTER COUNT CALCULATOR =====

  return (
    <div className="flex flex-col h-full space-y-3">
      {/* Top View Selector Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-[#0A0A0C] border border-neutral-800 p-2.5 rounded">
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs uppercase text-neutral-400 font-bold flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-[#FF003C]" />
            INSPECTION MODE:
          </span>

          <div className="flex items-center border border-neutral-800 rounded bg-neutral-950 p-0.5">
            <button
              onClick={() => {
                setViewMode('split');
                cyberAudio.playCyberClick();
              }}
              className={`px-2.5 py-1 text-xs font-mono rounded flex items-center gap-1.5 transition-all ${
                viewMode === 'split'
                  ? 'bg-[#FF003C] text-white font-bold shadow-[0_0_8px_rgba(255,0,60,0.4)]'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <Columns2 className="w-3.5 h-3.5" />
              <span>SPLIT DUAL-VIEW</span>
            </button>

            <button
              onClick={() => {
                setViewMode('doc_only');
                cyberAudio.playCyberClick();
              }}
              className={`px-2.5 py-1 text-xs font-mono rounded flex items-center gap-1.5 transition-all ${
                viewMode === 'doc_only'
                  ? 'bg-[#FF003C] text-white font-bold shadow-[0_0_8px_rgba(255,0,60,0.4)]'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>GOOGLE DOC ONLY</span>
            </button>

            <button
              onClick={() => {
                setViewMode('code');
                cyberAudio.playCyberClick();
              }}
              className={`px-2.5 py-1 text-xs font-mono rounded flex items-center gap-1.5 transition-all ${
                viewMode === 'code'
                  ? 'bg-[#FF003C] text-white font-bold shadow-[0_0_8px_rgba(255,0,60,0.4)]'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <Code className="w-3.5 h-3.5" />
              <span>SEMANTIC CODE</span>
            </button>

            <button
              onClick={() => {
                setViewMode('readability');
                cyberAudio.playCyberClick();
              }}
              className={`px-2.5 py-1 text-xs font-mono rounded flex items-center gap-1.5 transition-all ${
                viewMode === 'readability'
                  ? 'bg-[#FF003C] text-white font-bold shadow-[0_0_8px_rgba(255,0,60,0.4)]'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>READABILITY ANALYSIS</span>
            </button>
          </div>
        </div>

        {/* Feature Highlights Toggles */}
        {result && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setHighlightTables(!highlightTables)}
              className={`px-2 py-1 text-[11px] font-mono border rounded transition-colors ${
                highlightTables
                  ? 'border-emerald-500 bg-emerald-950/40 text-emerald-400'
                  : 'border-neutral-800 text-neutral-500 hover:border-neutral-700'
              }`}
            >
              HIGHLIGHT TABLES
            </button>

            <button
              onClick={() => setHighlightTypography(!highlightTypography)}
              className={`px-2 py-1 text-[11px] font-mono border rounded transition-colors ${
                highlightTypography
                  ? 'border-[#E056FD] bg-[#E056FD]/20 text-[#E056FD]'
                  : 'border-neutral-800 text-neutral-500 hover:border-neutral-700'
              }`}
            >
              HIGHLIGHT FONTS
            </button>
          </div>
        )}
      </div>

      {/* Document Switcher Tab Bar if multiple saved documents exist in persistence layer */}
      {savedConversions.length > 1 && (
        <div className="flex items-center gap-2 overflow-x-auto px-3 py-2 bg-[#0A0A0C] border border-neutral-800/80 rounded text-xs font-mono">
          <span className="text-[10px] text-neutral-400 uppercase tracking-wider shrink-0 flex items-center gap-1 font-bold">
            <FolderOpen className="w-3.5 h-3.5 text-emerald-400" />
            REVISIT SAVED ({savedConversions.length}):
          </span>
          <div className="flex items-center gap-1.5">
            {savedConversions.map((savedDoc, idx) => {
              const isSelected = (activeSavedConversionId === savedDoc.id) || (result?.documentTitle === savedDoc.title);
              return (
                <button
                  key={savedDoc.id}
                  id={`btn-quickswitch-${savedDoc.id}`}
                  onClick={() => {
                    cyberAudio.playCyberClick();
                    loadSavedConversion(savedDoc);
                  }}
                  className={`px-2.5 py-1 rounded text-[11px] truncate max-w-[220px] shrink-0 border transition-all ${
                    isSelected
                      ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 font-bold shadow-[0_0_8px_rgba(16,185,129,0.2)]'
                      : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-white hover:border-neutral-700'
                  }`}
                  title={`${savedDoc.title} (${savedDoc.originalFileName})`}
                >
                  #{idx + 1}: {savedDoc.title}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Main Viewport Container */}
      <div className="flex-1 min-h-[650px] relative">
        {viewMode === 'split' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 h-full">
            {/* Left: Original PDF Topology & Specs */}
            <div className="flex flex-col h-full bg-[#0A0A0C] border border-neutral-800 rounded overflow-hidden">
              <div className="px-4 py-2.5 bg-neutral-950 border-b border-neutral-800 flex items-center justify-between text-xs font-mono">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#FF003C]" />
                  <span className="font-bold text-white uppercase">ORIGINAL PDF SOURCE TOPOLOGY</span>
                </div>
                <CyberBadge label={currentPdf ? currentPdf.name : 'NO_PAYLOAD'} variant="neutral" />
              </div>

              <div className="flex-1 p-6 overflow-y-auto space-y-4">
                {result ? (
                  <div className="space-y-4">
                    {/* Fidelity Card */}
                    <div className="p-4 border border-[#FF003C]/30 bg-black/60 rounded">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-mono text-xs text-[#FF003C] font-bold flex items-center gap-1.5">
                          <Zap className="w-4 h-4" /> RECONSTRUCTION METRICS
                        </span>
                        <span className="font-mono text-sm text-emerald-400 font-bold">
                          {result.stats.fidelityScore}% MATCH
                        </span>
                      </div>
                      <p className="font-mono text-xs text-neutral-400">
                        Visual geometry parsed through deep neural multimodal reasoning. All tables, cells, and inline styles are formatted directly for Google Docs copy/paste compatibility.
                      </p>
                    </div>

                    {/* Detected Structural Elements */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 border border-neutral-800 bg-neutral-950 rounded">
                        <div className="font-mono text-[10px] text-neutral-500 uppercase">Tables Preserved</div>
                        <div className="font-mono text-xl text-white font-bold mt-1">
                          {result.detectedElements.tablesCount}
                        </div>
                        <span className="text-[10px] text-emerald-400 font-mono">Full border & cell padding</span>
                      </div>

                      <div className="p-3 border border-neutral-800 bg-neutral-950 rounded">
                        <div className="font-mono text-[10px] text-neutral-500 uppercase">Headings Retained</div>
                        <div className="font-mono text-xl text-white font-bold mt-1">
                          {result.detectedElements.headingsCount}
                        </div>
                        <span className="text-[10px] text-[#E056FD] font-mono">H1 / H2 / H3 hierarchies</span>
                      </div>
                    </div>

                    {/* Detected Typography & Color Bus */}
                    <div className="p-3.5 border border-neutral-800 bg-neutral-950 rounded space-y-2">
                      <span className="font-mono text-xs text-white font-bold uppercase block">
                        Preserved Font Families & Palette
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {result.detectedElements.fontsDetected.map((f, i) => (
                          <span key={i} className="px-2 py-0.5 bg-neutral-900 border border-neutral-700 text-xs font-mono text-neutral-300 rounded">
                            {f}
                          </span>
                        ))}
                      </div>
                      <div className="flex items-center gap-2 pt-2">
                        <span className="text-[10px] font-mono text-neutral-500">PALETTE:</span>
                        {result.detectedElements.colorPalette.map((c, i) => (
                          <div key={i} className="flex items-center gap-1 font-mono text-[10px] text-neutral-400">
                            <span className="w-3 h-3 rounded-full border border-neutral-600" style={{ backgroundColor: c }} />
                            <span>{c}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Blueprint Comparison Notes */}
                    <div className="p-3.5 border border-neutral-800 bg-black rounded text-xs font-mono space-y-2 text-neutral-400">
                      <div className="text-white font-bold flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        Why Google's Native Tool Fails:
                      </div>
                      <p className="text-[11px] leading-relaxed">
                        Google's built-in PDF importer flattens text into raw unstyled blobs, breaks table boundaries, and loses custom margins. This pipeline generates Google Docs compliant HTML blocks with inline CSS styles so tables and typographic scales paste natively.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="h-64 flex flex-col items-center justify-center text-center">
                    <Cpu className="w-8 h-8 text-neutral-600 mb-2 animate-pulse" />
                    <span className="font-mono text-xs text-neutral-500 uppercase">
                      NO_PDF_LOADED_YET
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Right: Live Google Doc Formatted Preview */}
            <div className="h-full">
              <LiveDocPreview />
            </div>
          </div>
        )}

        {viewMode === 'doc_only' && (
          <div className="h-full">
            <LiveDocPreview />
          </div>
        )}

        {viewMode === 'code' && (
          <div className="h-full bg-[#0A0A0C] border border-neutral-800 rounded p-4 font-mono text-xs text-neutral-300 overflow-y-auto">
            <div className="flex justify-between items-center mb-3 pb-2 border-b border-neutral-800">
              <span className="text-[#FF003C] font-bold">SEMANTIC GOOGLE DOCS HTML PAYLOAD</span>
              <span className="text-neutral-500 text-[10px]">READY FOR CLIPBOARD & API</span>
            </div>
            <pre className="p-4 bg-black rounded border border-neutral-800 text-emerald-400 overflow-x-auto whitespace-pre-wrap">
              {editedHtml || result?.htmlContent || '<!-- No document loaded -->'}
            </pre>
          </div>
        )}

        {viewMode === 'readability' && (
          <div className="h-full overflow-y-auto">
            <ReadabilityReport 
              content={editedHtml || result?.htmlContent || ''} 
              documentTitle={result?.documentTitle || currentPdf?.name} 
            />
          </div>
        )}
      </div>

      {/* ===== START NEW CODE: DYNAMIC WORD AND CHARACTER COUNT FOOTER INDICATOR ===== */}
      {(result || editedHtml) && (
        <footer className="w-full bg-[#08080A] border border-neutral-800 rounded px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs font-mono shadow-[0_4px_15px_rgba(0,0,0,0.5)]">
          <div className="flex flex-wrap items-center gap-3 text-neutral-400">
            <span className="flex items-center gap-1.5 text-white font-bold">
              <FileText className="w-3.5 h-3.5 text-[#FF003C]" />
              <span>{result?.documentTitle || currentPdf?.name || 'ACTIVE_WORKSPACE'}</span>
            </span>
            <span className="text-neutral-700 hidden sm:inline">&bull;</span>
            <span className="text-[11px] text-neutral-400">
              VIEW: <span className="text-white font-semibold uppercase">{viewMode.replace('_', ' ')}</span>
            </span>
            <span className="text-neutral-700 hidden sm:inline">&bull;</span>
            <span className="text-[11px] text-neutral-400">
              EST. READING: <span className="text-emerald-400 font-semibold">{dynamicWordCount > 0 ? `~${estimatedReadTimeMinutes} MIN` : '< 1 MIN'}</span>
            </span>
            <span className="text-neutral-700 hidden sm:inline">&bull;</span>
            <button
              onClick={() => {
                setViewMode(viewMode === 'readability' ? 'split' : 'readability');
                cyberAudio.playCyberClick();
              }}
              className="text-[11px] text-neutral-400 hover:text-white flex items-center gap-1 underline decoration-dotted"
            >
              <BookOpen className="w-3 h-3 text-[#FF003C]" />
              <span>{viewMode === 'readability' ? 'RETURN TO EDITOR' : 'FLESCH-KINCAID REPORT'}</span>
            </button>
          </div>

          {/* Dynamic Word and Character Count Indicator */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-2.5 px-3 py-1 bg-black border border-neutral-800 rounded text-neutral-300">
              <span className="text-[10px] text-neutral-500 uppercase tracking-wider font-bold">
                EDITOR STATS:
              </span>
              <span className="flex items-center gap-1 font-bold">
                <span className="text-[#FF003C]">{dynamicWordCount.toLocaleString()}</span>
                <span className="text-[10px] text-neutral-400 font-normal">WORDS</span>
              </span>
              <span className="text-neutral-700">|</span>
              <span className="flex items-center gap-1 font-bold">
                <span className="text-[#E056FD]">{dynamicCharCount.toLocaleString()}</span>
                <span className="text-[10px] text-neutral-400 font-normal">CHARS</span>
              </span>
              <span className="text-neutral-700 hidden md:inline">|</span>
              <span className="text-[10px] text-neutral-400 hidden md:inline">
                {dynamicCharNoSpaces.toLocaleString()} NO-SPACES
              </span>
            </div>

            {/* Auto-Save Telemetry Status */}
            <div
              className={`px-2.5 py-1 rounded border text-[10px] font-mono flex items-center gap-1.5 ${
                isAutoSaveEnabled
                  ? 'border-emerald-500/60 bg-emerald-950/30 text-emerald-300'
                  : 'border-neutral-800 bg-neutral-900/60 text-neutral-500'
              }`}
              title={isAutoSaveEnabled ? 'Periodic Auto-save is Active (3s cycle)' : 'Auto-save is Disabled in Settings'}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${isAutoSaveEnabled ? 'bg-emerald-400 animate-pulse' : 'bg-neutral-600'}`} />
              <span>{isAutoSaveEnabled ? 'AUTO-SAVE ACTIVE' : 'AUTO-SAVE OFF'}</span>
            </div>
          </div>
        </footer>
      )}
      {/* ===== END NEW CODE: DYNAMIC WORD AND CHARACTER COUNT FOOTER INDICATOR ===== */}
    </div>
  );
};
