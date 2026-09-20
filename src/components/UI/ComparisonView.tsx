import React, { useState, useEffect, useMemo } from 'react';
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
  BookOpen,
  Maximize2,
  Minimize2,
  Bot,
  Contrast,
  Table as TableIcon,
  Copy,
  Check,
  Wand2,
  ListTree
} from 'lucide-react';
import { useGameStore } from '../../store/useGameStore.ts';
import { LiveDocPreview } from './LiveDocPreview.tsx';
import { ReadabilityReport } from './ReadabilityReport.tsx';
import { CustomTableColumnMapperModal, DetectedTableSchema } from './CustomTableColumnMapperModal.tsx';
import { TableOfContents } from './TableOfContents.tsx';
import { CyberBadge } from '../common/CyberBadge.tsx';
import { CyberButton } from '../common/CyberButton.tsx';
import { cyberAudio } from '../../utils/audioSynth.ts';
import { GeminiModelPreference } from '../../types/index.ts';
import { quickCleanHeadersFooters } from '../../utils/documentCleaner.ts';
import { analyzeDocumentStructure } from '../../utils/tableOfContentsAnalyzer.ts';

// ===== START NEW CODE: COMPARISON VIEW WITH FULLSCREEN DISTRACTION-FREE & MODEL CASCADE =====

export const ComparisonView: React.FC = () => {
  const { 
    currentPdf, 
    result, 
    viewMode, 
    setViewMode, 
    editedHtml,
    setEditedHtml,
    savedConversions,
    activeSavedConversionId,
    loadSavedConversion,
    isAutoSaveEnabled,
    isFullscreen,
    toggleFullscreen,
    setIsFullscreen,
    geminiModelPreference,
    setGeminiModelPreference,
    activeModelUsed,
    isDocHighContrastEnabled,
    toggleDocHighContrast,
    isCustomTableMappingOpen,
    setIsCustomTableMappingOpen,
    detectedTables,
    applyCustomTableColumnMapping
  } = useGameStore();

  const [highlightTables, setHighlightTables] = useState(false);
  const [highlightTypography, setHighlightTypography] = useState(false);
  const [copyTextSuccess, setCopyTextSuccess] = useState(false);
  const [quickCleanStatus, setQuickCleanStatus] = useState<string | null>(null);

  const handleQuickClean = () => {
    try {
      cyberAudio.playButtonAction();
      const currentDocHtml = editedHtml || result?.htmlContent || '';
      if (!currentDocHtml) {
        cyberAudio.playAlertBuzz();
        return;
      }

      const { cleanedHtml, totalRemovedCount } = quickCleanHeadersFooters(currentDocHtml);
      setEditedHtml(cleanedHtml);
      cyberAudio.playSuccessChime();

      const statusMsg = totalRemovedCount > 0 
        ? `CLEANED ${totalRemovedCount} ITEM${totalRemovedCount > 1 ? 'S' : ''}!`
        : 'CLEANED (NO HEADERS)';
      
      setQuickCleanStatus(statusMsg);
      setTimeout(() => setQuickCleanStatus(null), 2500);
    } catch (err) {
      console.error('Quick clean error:', err);
      cyberAudio.playAlertBuzz();
    }
  };

  // Global Escape key handler to exit fullscreen
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullscreen) {
        setIsFullscreen(false);
        cyberAudio.playCyberClick();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreen, setIsFullscreen]);

  // ===== START NEW CODE: REAL-TIME DYNAMIC WORD & CHARACTER COUNT CALCULATOR =====
  const rawHtml = editedHtml || result?.htmlContent || '';
  const cleanDocumentText = rawHtml
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  const handleCopyPlainText = async () => {
    try {
      if (!cleanDocumentText) {
        cyberAudio.playAlertBuzz();
        return;
      }
      await navigator.clipboard.writeText(cleanDocumentText);
      cyberAudio.playSuccessChime();
      setCopyTextSuccess(true);
      setTimeout(() => setCopyTextSuccess(false), 2200);
    } catch (err) {
      console.error('Failed to copy plain text to clipboard:', err);
      cyberAudio.playAlertBuzz();
    }
  };

  const dynamicWordCount = cleanDocumentText ? cleanDocumentText.split(/\s+/).filter(Boolean).length : 0;
  const dynamicCharCount = cleanDocumentText.length;
  const dynamicCharNoSpaces = cleanDocumentText.replace(/\s/g, '').length;
  const estimatedReadTimeMinutes = Math.max(1, Math.ceil(dynamicWordCount / 200));
  // ===== END NEW CODE: REAL-TIME DYNAMIC WORD & CHARACTER COUNT CALCULATOR =====

  // ===== START NEW CODE: INTERACTIVE TABLE OF CONTENTS STATE & AUTO-ANALYSIS =====
  const currentDocHtml = editedHtml || result?.htmlContent || '';
  const tocMetadata = useMemo(() => {
    return analyzeDocumentStructure(currentDocHtml, { minPagesForAutoToc: 5 });
  }, [currentDocHtml]);

  const [isTocManuallyToggled, setIsTocManuallyToggled] = useState<boolean | null>(null);

  // Automatically show TOC if document exceeds 5 pages, unless user explicitly toggled it
  const isTocVisible = isTocManuallyToggled !== null ? isTocManuallyToggled : tocMetadata.isEligibleForAutoToc;
  // ===== END NEW CODE: INTERACTIVE TABLE OF CONTENTS STATE & AUTO-ANALYSIS =====

  const containerClasses = isFullscreen
    ? 'fixed inset-0 z-50 bg-[#000000] p-2 sm:p-4 flex flex-col h-screen w-screen overflow-hidden'
    : 'flex flex-col h-full space-y-3';

  return (
    <div id="comparison-view-container" className={containerClasses}>
      {/* Top Tactical Bar: Inspection Mode & Fullscreen Controls */}
      <div className="flex items-center justify-between gap-3 bg-[#0A0A0C] border border-neutral-800 p-2.5 rounded overflow-x-auto scrollbar-none max-md:flex-nowrap shrink-0">
        <div className="flex items-center gap-2 shrink-0">
          <span className="font-mono text-xs uppercase text-neutral-400 font-bold flex items-center gap-1.5 shrink-0">
            <Layers className="w-3.5 h-3.5 text-[#FF003C]" />
            INSPECTION MODE:
          </span>

          <div className="flex items-center border border-neutral-800 rounded bg-neutral-950 p-0.5 overflow-x-auto scrollbar-none whitespace-nowrap shrink-0">
            <button
              onClick={() => {
                setViewMode('doc_only');
                cyberAudio.playCyberClick();
              }}
              className={`px-2.5 py-1 text-xs font-mono rounded flex items-center gap-1.5 transition-all shrink-0 ${
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
              className={`px-2.5 py-1 text-xs font-mono rounded flex items-center gap-1.5 transition-all shrink-0 ${
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
              className={`px-2.5 py-1 text-xs font-mono rounded flex items-center gap-1.5 transition-all shrink-0 ${
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

        {/* Model Cascade Indicator & Fullscreen Button */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Gemini Auto-Cascade Model Selector */}
          <div className="flex items-center gap-1 bg-black border border-neutral-800 rounded px-2 py-1 text-[11px] font-mono">
            <Bot className="w-3.5 h-3.5 text-[#E056FD] shrink-0" />
            <select
              value={geminiModelPreference}
              onChange={(e) => {
                setGeminiModelPreference(e.target.value as GeminiModelPreference);
                cyberAudio.playCyberClick();
              }}
              className="bg-transparent text-neutral-300 outline-none text-[11px] cursor-pointer hover:text-white"
              title="Select specific model or rely on automatic multi-model failover cascade"
            >
              <option value="auto" className="bg-neutral-900 text-white">⚡ AUTO-CASCADE (FAILOVER ENABLED)</option>
              <option value="gemini-2.5-flash" className="bg-neutral-900 text-white">GEMINI 2.5 FLASH (RECOMMENDED)</option>
              <option value="gemini-2.5-flash-lite" className="bg-neutral-900 text-white">GEMINI 2.5 FLASH LITE</option>
              <option value="gemini-2.5-pro" className="bg-neutral-900 text-white">GEMINI 2.5 PRO</option>
              <option value="gemini-2.0-flash" className="bg-neutral-900 text-white">GEMINI 2.0 FLASH</option>
              <option value="gemini-flash-latest" className="bg-neutral-900 text-white">GEMINI FLASH LATEST</option>
              <option value="gemini-3.1-flash-lite" className="bg-neutral-900 text-white">GEMINI 3.1 FLASH LITE</option>
              <option value="gemini-3.8-flash" className="bg-neutral-900 text-white">GEMINI 3.8 FLASH</option>
            </select>
          </div>

          {/* Feature Highlights Toggles */}
          {result && (
            <div className="hidden lg:flex items-center gap-1.5">
              <button
                onClick={() => setHighlightTables(!highlightTables)}
                className={`px-2 py-1 text-[11px] font-mono border rounded transition-colors ${
                  highlightTables
                    ? 'border-emerald-500 bg-emerald-950/40 text-emerald-400'
                    : 'border-neutral-800 text-neutral-500 hover:border-neutral-700'
                }`}
              >
                TABLES
              </button>

              <button
                onClick={() => setHighlightTypography(!highlightTypography)}
                className={`px-2 py-1 text-[11px] font-mono border rounded transition-colors ${
                  highlightTypography
                    ? 'border-[#E056FD] bg-[#E056FD]/20 text-[#E056FD]'
                    : 'border-neutral-800 text-neutral-500 hover:border-neutral-700'
                }`}
              >
                FONTS
              </button>
            </div>
          )}

          {/* Quick Clean Button: Removes headers, footers & page numbers */}
          <button
            id="btn-quick-clean-doc"
            onClick={handleQuickClean}
            className={`px-2.5 py-1 text-xs font-mono rounded border flex items-center gap-1.5 font-bold transition-all shrink-0 ${
              quickCleanStatus
                ? 'bg-[#FF003C] text-white border-[#FF003C] shadow-[0_0_12px_rgba(255,0,60,0.6)] font-extrabold animate-pulse'
                : 'bg-neutral-900 border-neutral-700 text-neutral-300 hover:text-white hover:border-[#FF003C]'
            }`}
            title="Automatically strip document headers, footers, and page numbers before Google Doc export"
          >
            <Wand2 className="w-3.5 h-3.5 text-[#FF003C]" />
            <span>{quickCleanStatus ? quickCleanStatus : 'QUICK CLEAN'}</span>
          </button>

          {/* Copy Plain Text Content Button */}
          <button
            id="btn-copy-plain-text"
            onClick={handleCopyPlainText}
            className={`px-2.5 py-1 text-xs font-mono rounded border flex items-center gap-1.5 font-bold transition-all shrink-0 ${
              copyTextSuccess
                ? 'bg-emerald-500 text-black border-emerald-400 font-extrabold shadow-[0_0_12px_rgba(16,185,129,0.5)]'
                : 'bg-neutral-900 border-neutral-700 text-neutral-300 hover:text-white hover:border-[#FF003C]'
            }`}
            title="Copy plain text content of converted document to system clipboard"
          >
            {copyTextSuccess ? <Check className="w-3.5 h-3.5 text-black" /> : <Copy className="w-3.5 h-3.5 text-[#FF003C]" />}
            <span>{copyTextSuccess ? 'COPIED TEXT!' : 'COPY TEXT'}</span>
          </button>

          {/* Table Column Mapping Engine Button */}
          <button
            onClick={() => {
              cyberAudio.playCyberClick();
              setIsCustomTableMappingOpen(true);
            }}
            className="px-2.5 py-1 text-xs font-mono rounded border border-neutral-700 bg-neutral-900 text-neutral-300 hover:text-white hover:border-[#E056FD] flex items-center gap-1.5 font-bold transition-all shrink-0"
            title="Detect complex multi-page tables & define custom column mappings"
          >
            <TableIcon className="w-3.5 h-3.5 text-[#E056FD]" />
            <span className="hidden sm:inline">TABLE MAPPER</span>
          </button>

          {/* High-Contrast Accessibility Mode Toggle */}
          <button
            onClick={() => {
              toggleDocHighContrast();
              cyberAudio.playCyberClick();
            }}
            className={`px-2.5 py-1 text-xs font-mono rounded border flex items-center gap-1.5 font-bold transition-all shrink-0 ${
              isDocHighContrastEnabled
                ? 'bg-amber-400 text-black border-amber-300 shadow-[0_0_12px_rgba(251,191,36,0.6)] font-extrabold'
                : 'bg-neutral-900 border-neutral-700 text-neutral-300 hover:text-white hover:border-amber-400'
            }`}
            title="Toggle High-Contrast accessibility mode for document preview"
          >
            <Contrast className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">HIGH CONTRAST</span>
          </button>

          {/* Table of Contents Toggle Button */}
          <button
            id="btn-toc-toggle"
            onClick={() => {
              cyberAudio.playCyberClick();
              setIsTocManuallyToggled(!isTocVisible);
            }}
            className={`px-2.5 py-1 text-xs font-mono rounded border flex items-center gap-1.5 font-bold transition-all shrink-0 ${
              isTocVisible
                ? 'bg-[#FF003C] text-white border-[#FF003C] shadow-[0_0_10px_rgba(255,0,60,0.5)]'
                : tocMetadata.isEligibleForAutoToc
                ? 'bg-red-950/40 border-[#FF003C] text-[#FF003C] hover:bg-[#FF003C]/20 animate-pulse'
                : 'bg-neutral-900 border-neutral-700 text-neutral-300 hover:text-white hover:border-[#FF003C]'
            }`}
            title={
              tocMetadata.isEligibleForAutoToc
                ? `Long-Form Document (${tocMetadata.totalPages} pages, ${tocMetadata.totalHeadings} headings) - Auto TOC Active`
                : 'Toggle Interactive Table of Contents outline'
            }
          >
            <ListTree className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">TOC</span>
            {tocMetadata.totalHeadings > 0 && (
              <span className="text-[10px] px-1 py-0.2 rounded bg-black/50 border border-white/20">
                {tocMetadata.totalHeadings}
              </span>
            )}
            {tocMetadata.isEligibleForAutoToc && (
              <span className="hidden md:inline text-[8.5px] text-amber-300 font-extrabold uppercase">
                &gt;5 PGS
              </span>
            )}
          </button>

          {/* Fullscreen Toggle Button */}
          <button
            id="btn-fullscreen-toggle"
            onClick={() => {
              toggleFullscreen();
              cyberAudio.playCyberClick();
            }}
            className={`px-2.5 py-1 text-xs font-mono rounded border flex items-center gap-1.5 font-bold transition-all shrink-0 ${
              isFullscreen
                ? 'bg-[#FF003C] text-white border-[#FF003C] shadow-[0_0_10px_rgba(255,0,60,0.5)]'
                : 'bg-neutral-900 border-neutral-700 text-neutral-300 hover:text-white hover:border-[#FF003C]'
            }`}
            title={isFullscreen ? 'Exit Distraction-Free Fullscreen (Esc)' : 'Expand Document Editor to Fullscreen'}
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5 text-[#FF003C]" />}
            <span>{isFullscreen ? 'EXIT FULLSCREEN' : 'FULLSCREEN'}</span>
          </button>
        </div>
      </div>

      {/* Document Switcher Tab Bar if multiple saved documents exist in persistence layer */}
      {!isFullscreen && savedConversions.length > 1 && (
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
      <div className="flex-1 min-h-[500px] relative overflow-hidden flex flex-col md:flex-row gap-2">
        {/* Table of Contents Panel (Auto-generated for >5 pages or toggled) */}
        {isTocVisible && (viewMode === 'split' || viewMode === 'doc_only') && (
          <div className="w-full md:w-72 lg:w-80 h-auto md:h-full shrink-0 flex flex-col transition-all duration-300 z-10">
            <TableOfContents
              htmlContent={currentDocHtml}
              documentTitle={result?.documentTitle || currentPdf?.name}
              className="h-full"
              onClose={() => setIsTocManuallyToggled(false)}
            />
          </div>
        )}

        <div className="flex-1 min-w-0 h-full relative overflow-hidden flex flex-col">
          {viewMode === 'split' && (
            <div className="h-full">
              <LiveDocPreview />
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
                setViewMode(viewMode === 'readability' ? 'doc_only' : 'readability');
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

      {/* Complex Multi-Page Table Column Mapper Modal */}
      <CustomTableColumnMapperModal
        isOpen={isCustomTableMappingOpen}
        onClose={() => setIsCustomTableMappingOpen(false)}
        detectedTables={detectedTables}
        onApplyMapping={(updatedTables) => applyCustomTableColumnMapping(updatedTables)}
      />
    </div>
  );
};
