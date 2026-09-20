import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Layers, 
  X, 
  ArrowUp, 
  ArrowDown, 
  Check, 
  FileText, 
  Download, 
  Sparkles, 
  FolderArchive, 
  Maximize2, 
  Copy, 
  SlidersHorizontal,
  Table,
  CheckSquare,
  Square
} from 'lucide-react';
import { ConversionHistoryItem } from '../../types/index.ts';
import { useGameStore } from '../../store/useGameStore.ts';
import { cyberAudio } from '../../utils/audioSynth.ts';
import { CyberButton } from '../common/CyberButton.tsx';
import { downloadSingleDocx } from '../../utils/docxExport.ts';

// ===== START NEW CODE: MULTI-DOC MERGE ENGINE MODAL =====

interface MergeDocsModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedItems: ConversionHistoryItem[];
  onMergeComplete?: (mergedItem: ConversionHistoryItem) => void;
}

export const MergeDocsModal: React.FC<MergeDocsModalProps> = ({
  isOpen,
  onClose,
  selectedItems,
  onMergeComplete,
}) => {
  const { addToHistory, loadHistoryItem, appTheme } = useGameStore();

  const [orderedItems, setOrderedItems] = useState<ConversionHistoryItem[]>([]);
  const [mergedTitle, setMergedTitle] = useState('');
  const [includePageBreaks, setIncludePageBreaks] = useState(true);
  const [includeSourceHeaders, setIncludeSourceHeaders] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Synchronize ordered items when modal opens or selection changes
  useEffect(() => {
    if (selectedItems.length > 0) {
      setOrderedItems([...selectedItems]);
      const dateStr = new Date().toISOString().slice(0, 10);
      setMergedTitle(`Merged_Document_Archive_${selectedItems.length}_Files_${dateStr}`);
    }
  }, [selectedItems, isOpen]);

  if (!isOpen) return null;

  // Move item up in order
  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    cyberAudio.playCyberClick();
    const copy = [...orderedItems];
    const temp = copy[index - 1];
    copy[index - 1] = copy[index];
    copy[index] = temp;
    setOrderedItems(copy);
  };

  // Move item down in order
  const handleMoveDown = (index: number) => {
    if (index === orderedItems.length - 1) return;
    cyberAudio.playCyberClick();
    const copy = [...orderedItems];
    const temp = copy[index + 1];
    copy[index + 1] = copy[index];
    copy[index] = temp;
    setOrderedItems(copy);
  };

  // Calculate combined statistics
  const totalPages = orderedItems.reduce((acc, curr) => acc + (curr.pageCount || 1), 0);
  const totalTables = orderedItems.reduce((acc, curr) => acc + (curr.tablesCount || 0), 0);
  const totalHeadings = orderedItems.reduce((acc, curr) => acc + (curr.headingsCount || 0), 0);
  const totalSizeBytes = orderedItems.reduce((acc, curr) => acc + (curr.fileSize || 100000), 0);

  // Execute Merge Operation
  const handleExecuteMerge = async (autoDownloadDocx = false) => {
    if (orderedItems.length < 2) {
      cyberAudio.playAlertBuzz();
      return;
    }

    setIsProcessing(true);
    cyberAudio.playScanBeep(2);

    try {
      const pageBreakHtml = includePageBreaks 
        ? `\n<div class="page-break" style="page-break-after: always; height: 0; border: none; margin: 0; padding: 0;"></div>\n`
        : `\n<hr style="margin: 30px 0; border: none; border-top: 1px dashed #cccccc;" />\n`;

      const combinedHtmlSections = orderedItems.map((item, idx) => {
        const headerBanner = includeSourceHeaders ? `
          <div style="background-color: #f8fafc; border-left: 4px solid #1e3a8a; padding: 10px 16px; margin-bottom: 20px; font-family: Arial, sans-serif;">
            <p style="margin: 0; font-size: 11pt; font-weight: bold; color: #0f172a;">
              Document Section #${idx + 1}: ${item.title || item.originalFileName}
            </p>
            <p style="margin: 2px 0 0 0; font-size: 9pt; color: #64748b;">
              Source Archive: ${item.originalFileName || 'Converted Doc'} &bull; Pages: ${item.pageCount || 1}
            </p>
          </div>
        ` : '';

        return `<section class="merged-doc-section" data-source-id="${item.id}" data-section-index="${idx + 1}">
          ${headerBanner}
          ${item.htmlContent || ''}
        </section>`;
      });

      const mergedHtmlPayload = combinedHtmlSections.join(pageBreakHtml);

      const timestamp = Date.now();
      const newMergedItem: ConversionHistoryItem = {
        id: `merged_${timestamp}`,
        title: mergedTitle.trim() || `Merged_Document_${orderedItems.length}_Files`,
        originalFileName: `${mergedTitle.trim() || 'Merged_Doc'}.pdf`,
        fileSize: totalSizeBytes,
        timestamp,
        pageCount: totalPages,
        tablesCount: totalTables,
        headingsCount: totalHeadings,
        category: 'Reports',
        status: 'success',
        fidelityScore: 99.1,
        htmlContent: mergedHtmlPayload,
        markdownContent: `# ${mergedTitle}\n\nMerged document containing ${orderedItems.length} source Google Docs files.`,
      };

      // 1. Commit merged document to global conversion history
      addToHistory(newMergedItem);

      // 2. Load merged document as active session in workspace
      loadHistoryItem(newMergedItem);

      if (onMergeComplete) {
        onMergeComplete(newMergedItem);
      }

      // 3. Optional download as formatted .docx
      if (autoDownloadDocx) {
        await downloadSingleDocx(mergedHtmlPayload, newMergedItem.title);
      }

      cyberAudio.playSuccessChime();
      setSuccessMsg(`SUCCESSFULLY MERGED ${orderedItems.length} GOOGLE DOCS INTO "${newMergedItem.title}"`);

      setTimeout(() => {
        setIsProcessing(false);
        setSuccessMsg(null);
        onClose();
      }, 1500);

    } catch (err) {
      console.error('Document merge error:', err);
      cyberAudio.playAlertBuzz();
      setIsProcessing(false);
    }
  };

  return (
    <AnimatePresence>
      <div 
        id="merge-docs-modal-backdrop"
        className="fixed inset-0 z-[100] bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto font-mono"
        onClick={() => {
          cyberAudio.playCyberClick();
          onClose();
        }}
      >
        <motion.div
          id="merge-docs-modal-container"
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.2 }}
          onClick={(e) => e.stopPropagation()}
          className={`w-full max-w-3xl rounded-lg border flex flex-col shadow-2xl overflow-hidden relative ${
            appTheme === 'light'
              ? 'bg-white text-neutral-900 border-neutral-300 shadow-[0_0_40px_rgba(0,0,0,0.2)]'
              : 'bg-[#0A0A0F] text-white border-[#00FF66]/60 shadow-[0_0_50px_rgba(0,255,102,0.25)]'
          }`}
        >
          {/* Header */}
          <div className={`p-4 md:p-6 border-b flex items-center justify-between gap-4 ${
            appTheme === 'light' ? 'border-neutral-200 bg-neutral-50' : 'border-neutral-800 bg-[#0F0F16]'
          }`}>
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded bg-[#00FF66]/20 border border-[#00FF66]/50 text-[#00FF66]">
                <Layers className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base md:text-xl font-bold uppercase tracking-wider text-white">
                    MERGE MULTIPLE GOOGLE DOCS
                  </h2>
                  <span className="text-[10px] px-2 py-0.5 rounded font-bold uppercase bg-[#00FF66] text-black">
                    {orderedItems.length} FILES
                  </span>
                </div>
                <p className="text-xs text-neutral-400 mt-0.5">
                  Combine converted document payloads, tables, and page structures into a unified document file
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                cyberAudio.playCyberClick();
                onClose();
              }}
              className="p-2 rounded-full hover:bg-neutral-800 text-neutral-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Success Banner */}
          {successMsg && (
            <div className="p-3 bg-emerald-950 border-b border-emerald-500 text-emerald-300 text-xs font-mono font-bold flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Modal Content Body */}
          <div className="p-4 md:p-6 space-y-6 overflow-y-auto max-h-[70vh]">
            {/* Merged Title Input */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-neutral-300 uppercase tracking-wider flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-[#00FF66]" />
                UNIFIED MERGED DOCUMENT TITLE:
              </label>
              <input
                type="text"
                value={mergedTitle}
                onChange={(e) => setMergedTitle(e.target.value)}
                placeholder="Enter merged document title..."
                className="w-full bg-black border border-neutral-700 focus:border-[#00FF66] text-white text-xs px-3 py-2 rounded outline-none font-mono"
              />
            </div>

            {/* Document Sequence Reorder Panel */}
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs font-bold text-neutral-300 uppercase tracking-wider">
                <span>MERGE SEQUENCE ORDER ({orderedItems.length} DOCUMENTS):</span>
                <span className="text-[10px] text-neutral-500 font-normal">
                  Use ▲ / ▼ buttons to adjust merging order
                </span>
              </div>

              <div className="space-y-2">
                {orderedItems.map((item, index) => (
                  <div
                    key={item.id}
                    className={`p-3 rounded border flex items-center justify-between gap-3 transition-colors ${
                      appTheme === 'light'
                        ? 'bg-neutral-100 border-neutral-300'
                        : 'bg-black/60 border-neutral-800 hover:border-neutral-700'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <span className="w-6 h-6 rounded bg-neutral-900 border border-neutral-700 text-xs text-[#00FF66] font-bold flex items-center justify-center shrink-0">
                        #{index + 1}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-bold text-white truncate">
                          {item.title}
                        </div>
                        <div className="text-[10px] text-neutral-400 flex items-center gap-2">
                          <span>{item.originalFileName}</span>
                          <span>&bull;</span>
                          <span>{item.pageCount || 1} Pages</span>
                          <span>&bull;</span>
                          <span>{item.tablesCount || 0} Tables</span>
                        </div>
                      </div>
                    </div>

                    {/* Order Move Controls */}
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleMoveUp(index)}
                        disabled={index === 0}
                        title="Move Up in Sequence"
                        className="p-1.5 rounded bg-neutral-900 border border-neutral-800 text-neutral-300 hover:text-white hover:border-[#00FF66] disabled:opacity-30 disabled:pointer-events-none transition-colors"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleMoveDown(index)}
                        disabled={index === orderedItems.length - 1}
                        title="Move Down in Sequence"
                        className="p-1.5 rounded bg-neutral-900 border border-neutral-800 text-neutral-300 hover:text-white hover:border-[#00FF66] disabled:opacity-30 disabled:pointer-events-none transition-colors"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Merge Options & Checkboxes */}
            <div className="p-3 bg-black border border-neutral-800 rounded space-y-3">
              <div className="text-xs font-bold text-neutral-300 uppercase tracking-wider flex items-center gap-1.5">
                <SlidersHorizontal className="w-3.5 h-3.5 text-[#00FF66]" />
                MERGE CONFIGURATION OPTIONS:
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <label className="flex items-center gap-2 cursor-pointer text-neutral-300 hover:text-white">
                  <button
                    type="button"
                    onClick={() => {
                      cyberAudio.playCyberClick();
                      setIncludePageBreaks(!includePageBreaks);
                    }}
                    className="text-[#00FF66]"
                  >
                    {includePageBreaks ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4 text-neutral-600" />}
                  </button>
                  <span>Insert Page Breaks Between Docs</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-neutral-300 hover:text-white">
                  <button
                    type="button"
                    onClick={() => {
                      cyberAudio.playCyberClick();
                      setIncludeSourceHeaders(!includeSourceHeaders);
                    }}
                    className="text-[#00FF66]"
                  >
                    {includeSourceHeaders ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4 text-neutral-600" />}
                  </button>
                  <span>Include Section Banners</span>
                </label>
              </div>
            </div>

            {/* Summary Telemetry Stats */}
            <div className="p-3 bg-neutral-950 border border-neutral-800 rounded flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-3 text-neutral-400">
                <span>COMBINED STATS:</span>
                <span className="text-white font-bold">{totalPages} PAGES</span>
                <span>&bull;</span>
                <span className="text-[#00FF66] font-bold">{totalTables} TABLES</span>
                <span>&bull;</span>
                <span className="text-[#E056FD] font-bold">{totalHeadings} HEADINGS</span>
              </div>
            </div>
          </div>

          {/* Footer Bar Actions */}
          <div className={`p-4 border-t flex flex-col sm:flex-row items-center justify-between gap-3 ${
            appTheme === 'light' ? 'border-neutral-200 bg-neutral-50' : 'border-neutral-800 bg-[#0A0A0E]'
          }`}>
            <button
              type="button"
              onClick={() => {
                cyberAudio.playCyberClick();
                onClose();
              }}
              className="text-xs text-neutral-400 hover:text-white font-bold uppercase tracking-wider"
            >
              CANCEL
            </button>

            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
              <CyberButton
                variant="secondary"
                size="sm"
                icon={<Download className="w-3.5 h-3.5" />}
                onClick={() => handleExecuteMerge(true)}
                disabled={isProcessing}
                className="flex-1 sm:flex-initial"
              >
                MERGE &amp; DOWNLOAD .DOCX
              </CyberButton>

              <CyberButton
                variant="primary"
                size="sm"
                icon={<Sparkles className="w-3.5 h-3.5" />}
                onClick={() => handleExecuteMerge(false)}
                disabled={isProcessing}
                glow
                className="flex-1 sm:flex-initial"
              >
                {isProcessing ? 'MERGING DOCUMENTS...' : 'MERGE & LOAD INTO EDITOR'}
              </CyberButton>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
// ===== END NEW CODE: MULTI-DOC MERGE ENGINE MODAL =====
