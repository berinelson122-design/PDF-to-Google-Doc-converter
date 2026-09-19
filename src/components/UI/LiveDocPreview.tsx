import React, { useRef, useState, useEffect } from 'react';
import { 
  Copy, 
  Download, 
  ExternalLink, 
  Check, 
  Bold, 
  Italic, 
  Underline, 
  AlignLeft, 
  AlignCenter, 
  AlignRight, 
  List, 
  ListOrdered, 
  Table as TableIcon,
  Sparkles,
  Maximize2
} from 'lucide-react';
import { useGameStore } from '../../store/useGameStore.ts';
import { CyberButton } from '../common/CyberButton.tsx';
import { CyberBadge } from '../common/CyberBadge.tsx';
import { GoogleDocsService } from '../../services/googleDocsService.ts';
import { cyberAudio } from '../../utils/audioSynth.ts';

export const LiveDocPreview: React.FC = () => {
  const { 
    result, 
    editedHtml, 
    setEditedHtml, 
    exportConfig, 
    openExportModal,
    isAutoSaveEnabled,
    saveDraftToStorage,
    lastAutoSavedAt
  } = useGameStore();

  const editorRef = useRef<HTMLDivElement | null>(null);
  const [copied, setCopied] = useState(false);
  const [currentFont, setCurrentFont] = useState('Arial');
  const [currentSize, setCurrentSize] = useState('11pt');

  // Synchronize store HTML with contentEditable when result changes
  useEffect(() => {
    if (editorRef.current && editedHtml) {
      if (editorRef.current.innerHTML !== editedHtml) {
        editorRef.current.innerHTML = editedHtml;
      }
    }
  }, [result]);

  // ===== START NEW CODE: DRAFT AUTO-SAVE TO LOCAL STORAGE (PERIODIC 3-SECOND TICK) =====
  useEffect(() => {
    if (!isAutoSaveEnabled || !editedHtml) return;

    const intervalId = setInterval(() => {
      saveDraftToStorage();
    }, 3000);

    return () => clearInterval(intervalId);
  }, [isAutoSaveEnabled, editedHtml, saveDraftToStorage]);
  // ===== END NEW CODE: DRAFT AUTO-SAVE TO LOCAL STORAGE (PERIODIC 3-SECOND TICK) =====

  // ===== START NEW CODE: REAL-TIME DYNAMIC WORD & CHARACTER COUNT CALCULATOR =====
  const cleanDocumentText = (editedHtml || result?.htmlContent || '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  const wordCount = cleanDocumentText ? cleanDocumentText.split(/\s+/).filter(Boolean).length : 0;
  const characterCount = cleanDocumentText.length;
  const characterNoSpaces = cleanDocumentText.replace(/\s/g, '').length;
  // ===== END NEW CODE: REAL-TIME DYNAMIC WORD & CHARACTER COUNT CALCULATOR =====

  const handleContentInput = () => {
    if (editorRef.current) {
      setEditedHtml(editorRef.current.innerHTML);
    }
  };

  const executeCommand = (command: string, value: string | undefined = undefined) => {
    document.execCommand(command, false, value);
    cyberAudio.playCyberClick();
    if (editorRef.current) {
      setEditedHtml(editorRef.current.innerHTML);
    }
  };

  const handleCopyForGoogleDocs = async () => {
    cyberAudio.playButtonAction();
    const success = await GoogleDocsService.copyForDocs(
      editorRef.current?.innerHTML || editedHtml,
      exportConfig.docTitle
    );
    if (success) {
      setCopied(true);
      cyberAudio.playSuccessChime();
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleLaunchDocsNew = () => {
    cyberAudio.playButtonAction();
    // Copy first then open Google Docs
    handleCopyForGoogleDocs();
    GoogleDocsService.launchDocsNew();
  };

  if (!editedHtml && !result) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-8 border border-neutral-800 bg-[#0A0A0C] rounded text-center">
        <div className="w-12 h-12 rounded-full bg-neutral-900 border border-neutral-700 flex items-center justify-center text-neutral-500 mb-3">
          <TableIcon className="w-6 h-6" />
        </div>
        <p className="font-mono text-sm text-neutral-400 font-bold uppercase tracking-wider">
          AWAITING_RECONSTRUCTED_DOCUMENT
        </p>
        <p className="font-mono text-xs text-neutral-500 mt-1 max-w-sm">
          Load or upload a PDF payload to observe real-time Google Docs pagination, preserved typography, and tables.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-[#0E0E11] border border-neutral-800 rounded overflow-hidden shadow-2xl">
      {/* Top Google Docs Format Bar */}
      <div className="bg-[#141418] border-b border-neutral-800 p-2.5 flex flex-wrap items-center justify-between gap-2 shrink-0">
        <div className="flex items-center gap-1.5 flex-wrap">
          {/* Font Family Selector */}
          <select
            value={currentFont}
            onChange={(e) => {
              setCurrentFont(e.target.value);
              executeCommand('fontName', e.target.value);
            }}
            className="bg-neutral-900 border border-neutral-700 text-xs font-mono text-white rounded px-2 py-1 outline-none focus:border-[#FF003C]"
          >
            <option value="Arial">Arial (Standard)</option>
            <option value="Roboto">Roboto</option>
            <option value="Georgia">Georgia (Serif)</option>
            <option value="Times New Roman">Times New Roman</option>
            <option value="JetBrains Mono">JetBrains Mono</option>
          </select>

          {/* Font Size Selector */}
          <select
            value={currentSize}
            onChange={(e) => {
              setCurrentSize(e.target.value);
              executeCommand('fontSize', e.target.value === '11pt' ? '3' : '4');
            }}
            className="bg-neutral-900 border border-neutral-700 text-xs font-mono text-white rounded px-2 py-1 outline-none focus:border-[#FF003C]"
          >
            <option value="9pt">9 pt</option>
            <option value="10pt">10 pt</option>
            <option value="11pt">11 pt (Default)</option>
            <option value="14pt">14 pt</option>
            <option value="18pt">18 pt</option>
          </select>

          <div className="h-4 w-px bg-neutral-700 mx-1" />

          {/* Quick Style Controls */}
          <button
            onClick={() => executeCommand('bold')}
            title="Bold"
            className="p-1 rounded hover:bg-neutral-800 text-neutral-300 hover:text-white border border-transparent hover:border-neutral-700"
          >
            <Bold className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => executeCommand('italic')}
            title="Italic"
            className="p-1 rounded hover:bg-neutral-800 text-neutral-300 hover:text-white border border-transparent hover:border-neutral-700"
          >
            <Italic className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => executeCommand('underline')}
            title="Underline"
            className="p-1 rounded hover:bg-neutral-800 text-neutral-300 hover:text-white border border-transparent hover:border-neutral-700"
          >
            <Underline className="w-3.5 h-3.5" />
          </button>

          <div className="h-4 w-px bg-neutral-700 mx-1" />

          <button
            onClick={() => executeCommand('justifyLeft')}
            title="Align Left"
            className="p-1 rounded hover:bg-neutral-800 text-neutral-300 hover:text-white"
          >
            <AlignLeft className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => executeCommand('justifyCenter')}
            title="Align Center"
            className="p-1 rounded hover:bg-neutral-800 text-neutral-300 hover:text-white"
          >
            <AlignCenter className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => executeCommand('justifyRight')}
            title="Align Right"
            className="p-1 rounded hover:bg-neutral-800 text-neutral-300 hover:text-white"
          >
            <AlignRight className="w-3.5 h-3.5" />
          </button>

          <div className="h-4 w-px bg-neutral-700 mx-1" />

          <button
            onClick={() => executeCommand('insertUnorderedList')}
            title="Bullet List"
            className="p-1 rounded hover:bg-neutral-800 text-neutral-300 hover:text-white"
          >
            <List className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => executeCommand('insertOrderedList')}
            title="Numbered List"
            className="p-1 rounded hover:bg-neutral-800 text-neutral-300 hover:text-white"
          >
            <ListOrdered className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Tactical Actions */}
        <div className="flex items-center gap-2">
          <CyberButton
            variant={copied ? 'secondary' : 'primary'}
            size="sm"
            onClick={handleCopyForGoogleDocs}
            icon={copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          >
            {copied ? 'FORMAT COPIED!' : 'COPY FOR GOOGLE DOCS'}
          </CyberButton>

          <CyberButton
            variant="secondary"
            size="sm"
            onClick={handleLaunchDocsNew}
            icon={<ExternalLink className="w-3.5 h-3.5" />}
          >
            DOCS.NEW
          </CyberButton>

          <CyberButton
            variant="outline"
            size="sm"
            onClick={() => openExportModal(true)}
            icon={<Download className="w-3.5 h-3.5" />}
          >
            EXPORT
          </CyberButton>
        </div>
      </div>

      {/* Document Viewport with Page Ruler */}
      <div 
        id="google-doc-scroll-viewport"
        className="flex-1 overflow-y-auto p-4 md:p-8 flex justify-center bg-[#1E1E24]"
      >
        {/* Printable Page Container: standard US Letter / A4 representation */}
        <div className="w-full max-w-[820px] bg-white text-neutral-900 rounded-sm shadow-2xl p-10 md:p-14 min-h-[900px] border border-neutral-300 relative select-text transition-all">
          {/* Watermark Tag in view */}
          <div className="absolute top-3 right-4 font-mono text-[9px] text-neutral-400 select-none uppercase tracking-widest pointer-events-none">
            GOOGLE DOC COMPLIANT // HIGH-FIDELITY LAYOUT
          </div>

          {/* ContentEditable Live Document Canvas */}
          <div
            ref={editorRef}
            contentEditable
            onInput={handleContentInput}
            className="outline-none min-h-[780px] prose prose-slate max-w-none focus:ring-0"
            style={{
              fontFamily: currentFont,
              lineHeight: 1.6,
            }}
          />
        </div>
      </div>

      {/* Bottom Status Telemetry & Dynamic Word/Character Count Indicator */}
      {(result || editedHtml) && (
        <div className="bg-[#111114] border-t border-neutral-800 px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 text-[11px] font-mono text-neutral-400">
          <div className="flex items-center gap-3">
            <span className="text-white font-bold">{exportConfig.docTitle}</span>
            <span>&bull;</span>
            <span className="text-emerald-400">Tables: {result?.detectedElements.tablesCount ?? 0}</span>
            <span>&bull;</span>
            <span className="text-[#E056FD]">Headings: {result?.detectedElements.headingsCount ?? 0}</span>
          </div>

          {/* ===== START NEW CODE: REAL-TIME WORD & CHARACTER COUNT TELEMETRY BADGE ===== */}
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="flex items-center gap-2 px-3 py-1 bg-black/90 border border-neutral-800 rounded text-neutral-300">
              <span className="text-[10px] text-neutral-500 font-bold uppercase tracking-wider">
                DOCUMENT:
              </span>
              <span className="flex items-center gap-1 font-bold">
                <span className="text-[#FF003C]">{wordCount.toLocaleString()}</span>
                <span className="text-[10px] text-neutral-400 font-normal">WORDS</span>
              </span>
              <span className="text-neutral-700">|</span>
              <span className="flex items-center gap-1 font-bold">
                <span className="text-[#E056FD]">{characterCount.toLocaleString()}</span>
                <span className="text-[10px] text-neutral-400 font-normal">CHARS</span>
              </span>
              <span className="text-neutral-700 hidden sm:inline">|</span>
              <span className="text-[10px] text-neutral-400 hidden sm:inline">
                {characterNoSpaces.toLocaleString()} NO-SPACES
              </span>
            </div>

            {/* Auto-Save Status Telemetry */}
            <div
              className={`px-2.5 py-1 rounded border text-[10px] font-mono flex items-center gap-1.5 ${
                isAutoSaveEnabled
                  ? 'border-emerald-500/50 bg-emerald-950/30 text-emerald-400'
                  : 'border-neutral-800 bg-neutral-900/60 text-neutral-500'
              }`}
              title={
                isAutoSaveEnabled
                  ? `Periodic Auto-save: Active (last saved: ${lastAutoSavedAt ? new Date(lastAutoSavedAt).toLocaleTimeString() : 'syncing...'})`
                  : 'Auto-save disabled in Settings'
              }
            >
              <span className={`w-1.5 h-1.5 rounded-full ${isAutoSaveEnabled ? 'bg-emerald-400 animate-pulse' : 'bg-neutral-600'}`} />
              <span>{isAutoSaveEnabled ? 'AUTO-SAVE ON' : 'AUTO-SAVE OFF'}</span>
            </div>

            {result && (
              <>
                <CyberBadge label={`FIDELITY: ${result.stats.fidelityScore}%`} variant="green" />
                <CyberBadge label={`TIME: ${result.conversionTimeMs}ms`} variant="purple" />
              </>
            )}
          </div>
          {/* ===== END NEW CODE: REAL-TIME WORD & CHARACTER COUNT TELEMETRY BADGE ===== */}
        </div>
      )}
    </div>
  );
};
