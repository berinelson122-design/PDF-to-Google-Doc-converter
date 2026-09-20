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
  Maximize2,
  Minimize2,
  FileDown,
  RefreshCw,
  Scissors,
  Languages,
  Volume2,
  VolumeX,
  Globe
} from 'lucide-react';
import { useGameStore } from '../../store/useGameStore.ts';
import { CyberButton } from '../common/CyberButton.tsx';
import { CyberBadge } from '../common/CyberBadge.tsx';
import { GoogleDocsService } from '../../services/googleDocsService.ts';
import { exportToCleanPdf } from '../../utils/cleanPdfExport.ts';
import { cyberAudio } from '../../utils/audioSynth.ts';
import { AnnotationToolbar } from './AnnotationToolbar.tsx';
import { 
  splitDocumentIntoPages, 
  joinPagesIntoDocument, 
  PAGE_BREAK_MARKER_HTML,
} from '../../utils/documentPaginator.ts';
import { DocumentPageSlider } from './DocumentPageSlider.tsx';
import { DocumentSearchBar } from './DocumentSearchBar.tsx';
import { PageThumbnailSidebar } from './PageThumbnailSidebar.tsx';
import { LanguageTranslationBanner } from './LanguageTranslationBanner.tsx';
import { getSupportedLanguage } from '../../utils/languageDetector.ts';

// ===== START NEW CODE: MULTI-PAGE SPLIT, SEARCH, THUMBNAILS & FULLSCREEN PREVIEW =====

export const LiveDocPreview: React.FC = () => {
  const { 
    result, 
    editedHtml, 
    setEditedHtml, 
    exportConfig, 
    openExportModal,
    isAutoSaveEnabled,
    saveDraftToStorage,
    lastAutoSavedAt,
    lowConfidenceFlags,
    setActiveFlagIndex,
    isFullscreen,
    toggleFullscreen,
    currentActivePage,
    setCurrentActivePage,
    detectedLanguage,
    setIsTranslationModalOpen,
    toggleTTSPlayer,
    isTTSPlayerOpen,
    ttsState,
    isDocHighContrastEnabled
  } = useGameStore();

  const editorRef = useRef<HTMLDivElement | null>(null);
  const [copied, setCopied] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [currentFont, setCurrentFont] = useState('Arial');
  const [currentSize, setCurrentSize] = useState('11pt');

  // Multi-page slider & pagination state
  const [currentPage, setCurrentPage] = useState(currentActivePage || 1);
  const [viewMode, setViewMode] = useState<'single' | 'stacked'>('single');
  const [pages, setPages] = useState<string[]>(['']);
  const pagesRef = useRef<string[]>(['']);

  // Sync with store active page
  useEffect(() => {
    if (currentActivePage && currentActivePage !== currentPage && currentActivePage <= pages.length) {
      setCurrentPage(currentActivePage);
    }
  }, [currentActivePage, pages.length]);

  // Split content into discrete pages whenever editedHtml or result changes externally
  useEffect(() => {
    const rawContent = editedHtml || result?.htmlContent || '';
    if (!rawContent) return;

    // Do not re-split while user is actively typing in the editor
    if (document.activeElement !== editorRef.current) {
      const targetPages = result?.stats?.pages;
      const split = splitDocumentIntoPages(rawContent, {
        targetPageCount: targetPages,
      });
      const validSplit = split.length > 0 ? split : [rawContent];
      setPages(validSplit);
      pagesRef.current = validSplit;

      if (currentPage > validSplit.length) {
        setCurrentPage(Math.max(1, validSplit.length));
      }
    }
  }, [result, editedHtml]);

  // Synchronize active page content into editorRef when switching pages or view modes
  useEffect(() => {
    if (viewMode === 'single' && editorRef.current) {
      const pageIndex = Math.max(0, Math.min(currentPage - 1, pages.length - 1));
      const pageContent = pages[pageIndex] ?? '';
      if (editorRef.current.innerHTML !== pageContent && document.activeElement !== editorRef.current) {
        editorRef.current.innerHTML = pageContent;
      }
    }
  }, [currentPage, pages, viewMode]);

  // Draft auto-save to local storage (periodic 3-second tick)
  useEffect(() => {
    if (!isAutoSaveEnabled || !editedHtml) return;

    const intervalId = setInterval(() => {
      saveDraftToStorage();
    }, 3000);

    return () => clearInterval(intervalId);
  }, [isAutoSaveEnabled, editedHtml, saveDraftToStorage]);

  // Real-time document metrics across full document
  const fullDocumentText = (joinPagesIntoDocument(pages) || editedHtml || result?.htmlContent || '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  const wordCount = fullDocumentText ? fullDocumentText.split(/\s+/).filter(Boolean).length : 0;
  const characterCount = fullDocumentText.length;
  const characterNoSpaces = fullDocumentText.replace(/\s/g, '').length;

  const handleContentInput = () => {
    if (!editorRef.current) return;
    const currentHtml = editorRef.current.innerHTML;

    if (viewMode === 'single') {
      const updated = [...pagesRef.current];
      const pageIndex = Math.max(0, Math.min(currentPage - 1, updated.length - 1));
      updated[pageIndex] = currentHtml;
      pagesRef.current = updated;
      setPages(updated);
      setEditedHtml(joinPagesIntoDocument(updated));
    } else {
      setEditedHtml(currentHtml);
    }
  };

  const handleStackedPageInput = (pageIndex: number, newHtml: string) => {
    const updated = [...pagesRef.current];
    updated[pageIndex] = newHtml;
    pagesRef.current = updated;
    setPages(updated);
    setEditedHtml(joinPagesIntoDocument(updated));
  };

  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > pages.length) return;
    // Commit current active DOM changes before switching
    if (editorRef.current && viewMode === 'single') {
      const currentDom = editorRef.current.innerHTML;
      const updated = [...pagesRef.current];
      updated[currentPage - 1] = currentDom;
      pagesRef.current = updated;
      setPages(updated);
      setEditedHtml(joinPagesIntoDocument(updated));
    }
    setCurrentPage(newPage);

    // Scroll viewport to top smoothly on page transition
    const viewport = document.getElementById('google-doc-scroll-viewport');
    if (viewport) {
      viewport.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleInsertPageBreak = () => {
    if (editorRef.current) {
      document.execCommand('insertHTML', false, PAGE_BREAK_MARKER_HTML);
      const activeContent = editorRef.current.innerHTML;
      const split = splitDocumentIntoPages(activeContent);
      if (split.length > 1) {
        const updated = [...pagesRef.current];
        updated.splice(currentPage - 1, 1, ...split);
        pagesRef.current = updated;
        setPages(updated);
        setEditedHtml(joinPagesIntoDocument(updated));
        setCurrentPage(currentPage + 1);
        cyberAudio.playSuccessChime();
        return;
      }
    }
    handleAddNewPage();
  };

  const handleAddNewPage = () => {
    const updated = [...pagesRef.current, '<p style="margin: 0; font-size: 11pt;">&nbsp;</p>'];
    pagesRef.current = updated;
    setPages(updated);
    setEditedHtml(joinPagesIntoDocument(updated));
    setCurrentPage(updated.length);
    cyberAudio.playSuccessChime();
  };

  const handleEditorClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    const mark = target.closest('mark.ocr-low-confidence') as HTMLElement | null;
    if (mark) {
      const flagId = mark.getAttribute('data-flag-id') || mark.id;
      if (flagId) {
        const unverified = lowConfidenceFlags.filter((f) => !f.isVerified);
        const idx = unverified.findIndex((f) => f.id === flagId);
        if (idx !== -1) {
          setActiveFlagIndex(idx);
          cyberAudio.playCyberClick();
        }
      }
    }
  };

  const executeCommand = (command: string, value: string | undefined = undefined) => {
    document.execCommand(command, false, value);
    cyberAudio.playCyberClick();
    handleContentInput();
  };

  const handleCopyForGoogleDocs = async () => {
    cyberAudio.playButtonAction();
    const fullContent = joinPagesIntoDocument(pagesRef.current) || editedHtml;
    const success = await GoogleDocsService.copyForDocs(
      fullContent,
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
    handleCopyForGoogleDocs();
    GoogleDocsService.launchDocsNew();
  };

  const handleExportCleanPdf = async () => {
    cyberAudio.playButtonAction();
    setIsExportingPdf(true);
    try {
      const fullContent = joinPagesIntoDocument(pagesRef.current) || editedHtml || result?.htmlContent || '';
      await exportToCleanPdf(fullContent, {
        title: exportConfig.docTitle || result?.documentTitle || 'Reconstructed_Document',
      });
      cyberAudio.playSuccessChime();
    } catch (err) {
      console.error('Clean PDF export error:', err);
      cyberAudio.playAlertBuzz();
    } finally {
      setIsExportingPdf(false);
    }
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
      <div className="bg-[#141418] border-b border-neutral-800 p-2.5 flex items-center justify-between gap-2 shrink-0 overflow-x-auto scrollbar-none max-md:flex-nowrap">
        <div className="flex items-center gap-1.5 shrink-0 max-md:flex-nowrap">
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
        <div className="flex items-center gap-2 shrink-0">
          <CyberButton
            variant="outline"
            size="sm"
            onClick={handleExportCleanPdf}
            disabled={isExportingPdf}
            icon={isExportingPdf ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <FileDown className="w-3.5 h-3.5 text-[#FF003C]" />}
            className="border-[#FF003C]/70 hover:border-[#FF003C] hover:bg-[#FF003C]/10 text-white font-bold"
            title="Export edited document back into a clean, secure PDF format"
          >
            {isExportingPdf ? 'EXPORTING...' : 'EXPORT CLEAN PDF'}
          </CyberButton>

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

          {/* Language Translation Selector */}
          <button
            onClick={() => {
              setIsTranslationModalOpen(true);
              cyberAudio.playCyberClick();
            }}
            className="p-1.5 rounded border border-[#E056FD]/60 bg-[#E056FD]/10 text-[#E056FD] hover:bg-[#E056FD]/20 transition-all flex items-center gap-1.5 text-xs font-mono font-bold"
            title="Translate document into 25+ languages with AI layout preservation"
          >
            <Languages className="w-3.5 h-3.5" />
            <span className="hidden md:inline">
              {detectedLanguage ? detectedLanguage.flag : '🌐'} TRANSLATE
            </span>
          </button>

          {/* Web Speech API TTS Player Toggle */}
          <button
            onClick={() => {
              toggleTTSPlayer();
              cyberAudio.playCyberClick();
            }}
            className={`p-1.5 rounded border transition-all flex items-center gap-1.5 text-xs font-mono font-bold ${
              isTTSPlayerOpen || ttsState.status === 'playing'
                ? 'border-emerald-500 bg-emerald-950/50 text-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.3)]'
                : 'border-neutral-700 bg-neutral-900 text-neutral-300 hover:text-white hover:border-emerald-500'
            }`}
            title="Listen to document text (Browser Web Speech API Text-to-Speech)"
          >
            <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden md:inline">
              {ttsState.status === 'playing' ? 'SPEAKING...' : 'READ ALOUD'}
            </span>
          </button>

          {/* Fullscreen Distraction-Free Toggle */}
          <button
            id="btn-toggle-fullscreen-editor"
            onClick={() => {
              toggleFullscreen();
              cyberAudio.playCyberClick();
            }}
            className={`p-1.5 rounded border transition-all flex items-center gap-1 text-xs font-mono font-bold ${
              isFullscreen
                ? 'bg-[#FF003C] text-white border-[#FF003C] shadow-[0_0_10px_rgba(255,0,60,0.5)]'
                : 'bg-neutral-900 border-neutral-700 text-neutral-300 hover:text-white hover:border-[#FF003C]'
            }`}
            title={isFullscreen ? 'Exit Fullscreen (Esc / F11)' : 'Enter Distraction-Free Fullscreen Editor (F11)'}
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5 text-[#FF003C]" />}
            <span className="hidden sm:inline">{isFullscreen ? 'EXIT' : 'FULLSCREEN'}</span>
          </button>
        </div>
      </div>

      {/* Automatic Language Detection & Translation Offer Banner */}
      <LanguageTranslationBanner />

      {/* Basic Annotation Toolbar & Low-Confidence OCR Review Sub-Bar */}
      <div className="p-2 bg-[#0E0E12] border-b border-neutral-800 shrink-0">
        <AnnotationToolbar onContentChange={handleContentInput} />
      </div>

      {/* Interactive Keyword Search & Highlight Input Bar */}
      <DocumentSearchBar
        pages={pages}
        onNavigateToPage={handlePageChange}
      />

      {/* Interactive Page Slider / Pagination Bar (Matches IMG_1575) */}
      <DocumentPageSlider
        currentPage={currentPage}
        totalPages={pages.length}
        onPageChange={handlePageChange}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        onInsertPageBreak={handleInsertPageBreak}
        onAddNewPage={handleAddNewPage}
      />

      {/* Main Split Body: Page Thumbnail Sidebar + Document Viewport */}
      <div className="flex-1 flex flex-col md:flex-row min-h-0 overflow-hidden relative">
        {/* PDF Page Thumbnail Sidebar */}
        <PageThumbnailSidebar
          pages={pages}
          currentPage={currentPage}
          onSelectPage={handlePageChange}
          viewMode={viewMode}
        />

        {/* Document Viewport with Page Container */}
        <div 
          id="google-doc-scroll-viewport"
          className="flex-1 overflow-y-auto p-4 md:p-8 flex flex-col items-center bg-[#1E1E24]"
        >
          {viewMode === 'single' ? (
            /* Single Paginated US Letter Sheet (Controlled by Page Slider) */
            <div className={`w-full max-w-[820px] rounded-sm p-6 sm:p-10 md:p-14 min-h-[920px] relative select-text transition-all flex flex-col justify-between ${
              isDocHighContrastEnabled
                ? 'bg-black text-white border-4 border-yellow-400 shadow-[0_0_30px_rgba(250,204,21,0.6)]'
                : 'bg-white text-neutral-900 shadow-2xl border border-neutral-300'
            }`}>
              {/* Header on page sheet */}
              <div className={`flex justify-between items-center pb-3 mb-4 border-b font-mono text-[10px] select-none uppercase tracking-wider ${
                isDocHighContrastEnabled ? 'border-yellow-500/80 text-yellow-300' : 'border-neutral-200 text-neutral-400'
              }`}>
                <span className="font-bold">{isDocHighContrastEnabled ? 'HIGH CONTRAST ACCESSIBILITY MODE' : 'GOOGLE DOC COMPLIANT // RECONSTRUCTED PAGE'}</span>
                <span className={`font-bold px-2.5 py-0.5 rounded ${
                  isDocHighContrastEnabled ? 'bg-yellow-400 text-black border border-yellow-300 font-extrabold' : 'text-neutral-700 bg-neutral-100 border border-neutral-300'
                }`}>
                  PAGE {currentPage} OF {pages.length}
                </span>
              </div>

              {/* ContentEditable Live Document Canvas for Current Page */}
              <div
                id="active-doc-editor"
                ref={editorRef}
                contentEditable
                onInput={handleContentInput}
                onClick={handleEditorClick}
                className={`outline-none flex-1 max-w-none focus:ring-0 min-h-[750px] ${
                  isDocHighContrastEnabled
                    ? 'text-yellow-100 [&_h1]:text-amber-300 [&_h2]:text-amber-300 [&_h3]:text-amber-200 [&_p]:text-white [&_table]:border-2 [&_table]:border-yellow-400 [&_th]:bg-yellow-400 [&_th]:text-black [&_td]:border [&_td]:border-yellow-500/60 [&_td]:text-yellow-100 [&_a]:text-cyan-300 [&_a]:underline [&_img]:contrast-125 [&_img]:brightness-110'
                    : 'prose prose-slate'
                }`}
                style={{
                  fontFamily: currentFont,
                  lineHeight: 1.6,
                }}
              />

              {/* Footer on page sheet */}
              <div className={`pt-4 mt-6 border-t flex justify-between items-center font-mono text-[10px] select-none ${
                isDocHighContrastEnabled ? 'border-yellow-500/80 text-yellow-300' : 'border-neutral-200 text-neutral-400'
              }`}>
                <span className="truncate max-w-[240px]">TITLE: {exportConfig.docTitle}</span>
                <span className="font-bold">— Page {currentPage} of {pages.length} —</span>
                <span>US LETTER / A4</span>
              </div>
            </div>
          ) : (
            /* Stacked Sheets View: All Pages Visible Separated by Page Boundaries */
            <div className="w-full max-w-[820px] flex flex-col gap-8 pb-8">
              {pages.map((pageHtml, idx) => (
                <div 
                  key={idx}
                  id={`page-sheet-${idx + 1}`}
                  className={`w-full rounded-sm p-6 sm:p-10 md:p-14 min-h-[920px] border transition-all flex flex-col justify-between relative ${
                    isDocHighContrastEnabled
                      ? 'bg-black text-white border-4 border-yellow-400 shadow-[0_0_30px_rgba(250,204,21,0.5)]'
                      : idx + 1 === currentPage
                      ? 'bg-white text-neutral-900 shadow-2xl border-[#FF003C] ring-2 ring-[#FF003C]/30'
                      : 'bg-white text-neutral-900 shadow-2xl border-neutral-300'
                  }`}
                >
                  {/* Header */}
                  <div className={`flex justify-between items-center pb-3 mb-4 border-b font-mono text-[10px] select-none uppercase tracking-wider ${
                    isDocHighContrastEnabled ? 'border-yellow-500/80 text-yellow-300' : 'border-neutral-200 text-neutral-400'
                  }`}>
                    <span className="font-bold">{isDocHighContrastEnabled ? 'ACCESSIBILITY VIEW // PAGE ' + (idx + 1) : 'GOOGLE DOC COMPLIANT // PAGE ' + (idx + 1)}</span>
                    <span className={`font-bold px-2.5 py-0.5 rounded ${
                      isDocHighContrastEnabled ? 'bg-yellow-400 text-black border border-yellow-300 font-extrabold' : 'text-neutral-700 bg-neutral-100 border border-neutral-300'
                    }`}>
                      PAGE {idx + 1} OF {pages.length}
                    </span>
                  </div>

                  {/* Editable Page Canvas */}
                  <div
                    contentEditable
                    onInput={(e) => handleStackedPageInput(idx, e.currentTarget.innerHTML)}
                    dangerouslySetInnerHTML={{ __html: pageHtml }}
                    className={`outline-none flex-1 max-w-none focus:ring-0 min-h-[750px] ${
                      isDocHighContrastEnabled
                        ? 'text-yellow-100 [&_h1]:text-amber-300 [&_h2]:text-amber-300 [&_h3]:text-amber-200 [&_p]:text-white [&_table]:border-2 [&_table]:border-yellow-400 [&_th]:bg-yellow-400 [&_th]:text-black [&_td]:border [&_td]:border-yellow-500/60 [&_td]:text-yellow-100 [&_a]:text-cyan-300 [&_a]:underline [&_img]:contrast-125 [&_img]:brightness-110'
                        : 'prose prose-slate'
                    }`}
                    style={{
                      fontFamily: currentFont,
                      lineHeight: 1.6,
                    }}
                  />

                  {/* Footer */}
                  <div className="pt-4 mt-6 border-t border-neutral-200 flex justify-between items-center text-neutral-400 font-mono text-[10px] select-none">
                    <span className="truncate max-w-[240px]">TITLE: {exportConfig.docTitle}</span>
                    <span className="font-bold text-neutral-600">— Page {idx + 1} of {pages.length} —</span>
                    <span>US LETTER / A4</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Mobile Floating Bottom Page Navigator */}
          {viewMode === 'single' && pages.length > 1 && (
            <div className="w-full max-w-[820px] mt-4 mb-2 flex items-center justify-between px-3 py-2 bg-[#0E0E12]/95 border border-neutral-800 rounded text-xs font-mono select-none shadow-xl">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage <= 1}
                className="px-3 py-1.5 bg-neutral-900 border border-neutral-700 text-neutral-300 hover:text-[#FF003C] hover:border-[#FF003C] rounded font-bold disabled:opacity-20 transition-all flex items-center gap-1.5 active:scale-95"
              >
                &larr; PREV PAGE
              </button>
              <div className="flex items-center gap-2">
                <span className="text-neutral-400 font-bold">
                  PAGE <span className="text-white font-black">{currentPage}</span> OF <span className="text-[#E056FD] font-black">{pages.length}</span>
                </span>
              </div>
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage >= pages.length}
                className="px-3 py-1.5 bg-neutral-900 border border-neutral-700 text-neutral-300 hover:text-[#FF003C] hover:border-[#FF003C] rounded font-bold disabled:opacity-20 transition-all flex items-center gap-1.5 active:scale-95"
              >
                NEXT PAGE &rarr;
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Status Telemetry Bar */}
      {(result || editedHtml) && (
        <div className="bg-[#111114] border-t border-neutral-800 px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 text-[11px] font-mono text-neutral-400">
          <div className="flex items-center gap-3">
            <span className="text-white font-bold">{exportConfig.docTitle}</span>
            <span>&bull;</span>
            <span className="text-emerald-400">Tables: {result?.detectedElements.tablesCount ?? 0}</span>
            <span>&bull;</span>
            <span className="text-[#E056FD]">Headings: {result?.detectedElements.headingsCount ?? 0}</span>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Pages Telemetry Badge */}
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-black/90 border border-neutral-800 rounded text-neutral-300">
              <span className="text-[10px] text-neutral-500 font-bold uppercase">PAGES:</span>
              <span className="text-[#FF003C] font-black">{pages.length}</span>
            </div>

            {/* Word & Character Count Telemetry Badge */}
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
        </div>
      )}
    </div>
  );
};
// ===== END NEW CODE: MULTI-PAGE SPLIT & PAGE SLIDER PREVIEW =====
