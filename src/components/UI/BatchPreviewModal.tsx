// ===== START NEW CODE: BATCH PREVIEW MODAL FOR MULTI-FILE VERIFICATION =====
import React, { useState } from 'react';
import { 
  X, 
  FolderArchive, 
  FileText, 
  Table, 
  Clock, 
  Trash2, 
  ExternalLink, 
  Download, 
  Check, 
  Loader2, 
  Layers,
  Sparkles
} from 'lucide-react';
import { ConversionHistoryItem, DocumentCategory } from '../../types/index.ts';
import { formatBytes, formatTimestamp } from '../../utils/formatters.ts';
import { getCategoryBadgeStyle } from '../../utils/documentClassifier.ts';
import { CyberButton } from '../common/CyberButton.tsx';
import { cyberAudio } from '../../utils/audioSynth.ts';

export interface BatchPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedItems: ConversionHistoryItem[];
  onToggleSelectItem: (id: string) => void;
  onLoadItemToWorkspace: (item: ConversionHistoryItem) => void;
  onDownloadBatchZip: () => Promise<void>;
  isZipExporting: boolean;
}

export const BatchPreviewModal: React.FC<BatchPreviewModalProps> = ({
  isOpen,
  onClose,
  selectedItems,
  onToggleSelectItem,
  onLoadItemToWorkspace,
  onDownloadBatchZip,
  isZipExporting,
}) => {
  const [activeTabId, setActiveTabId] = useState<string | null>(null);

  if (!isOpen) return null;

  // Selected item to focus if in detailed inspection mode
  const currentFocusedItem = selectedItems.find((i) => i.id === activeTabId) || selectedItems[0];
  const totalCombinedSize = selectedItems.reduce((acc, curr) => acc + (curr.fileSize || 150000), 0);

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-5xl max-h-[90vh] bg-[#0A0A0D] border border-neutral-800 rounded-lg shadow-[0_0_35px_rgba(0,0,0,0.8)] flex flex-col overflow-hidden font-mono"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-800 bg-[#060608]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-[#E056FD]/10 border border-[#E056FD]/40 flex items-center justify-center text-[#E056FD]">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm uppercase font-bold text-white tracking-wider">
                  BATCH DOCUMENT PREVIEW &amp; VERIFICATION
                </h3>
                <span className="px-2 py-0.5 rounded bg-[#00FF66]/10 border border-[#00FF66]/40 text-[#00FF66] text-xs font-bold">
                  {selectedItems.length} READY FOR ZIP ARCHIVE
                </span>
              </div>
              <p className="text-[11px] text-neutral-400 mt-0.5">
                Inspect and verify multiple file layouts, tables, and auto-tags before packaging into zipped .docx
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-white rounded hover:bg-neutral-800 transition-colors"
            title="Close Preview Modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body: Dual-Pane Multi-Snippet Inspector */}
        <div className="flex-1 overflow-hidden flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x divide-neutral-800">
          {/* Left Column: List of Batch-Selected Cards */}
          <div className="w-full md:w-80 md:shrink-0 flex flex-col bg-[#050507] overflow-y-auto max-h-[35vh] md:max-h-[60vh] p-3 space-y-2.5">
            <div className="flex items-center justify-between text-[11px] text-neutral-400 px-1 pb-1">
              <span className="font-bold uppercase tracking-wider">SELECTED QUEUE</span>
              <span>{formatBytes(totalCombinedSize)} TOTAL</span>
            </div>

            {selectedItems.map((item) => {
              const isFocused = currentFocusedItem?.id === item.id;
              const badgeStyle = getCategoryBadgeStyle(item.category);
              const fileName = item.originalFileName || `${item.title}.pdf`;

              return (
                <div
                  key={item.id}
                  onClick={() => {
                    cyberAudio.playCyberClick();
                    setActiveTabId(item.id);
                  }}
                  className={`p-2.5 rounded border transition-all cursor-pointer relative group flex flex-col gap-1.5 ${
                    isFocused
                      ? 'border-[#00FF66] bg-[#00FF66]/[0.06] shadow-[0_0_12px_rgba(0,255,102,0.15)]'
                      : 'border-neutral-800 bg-[#0C0C10] hover:border-neutral-700'
                  }`}
                >
                  <div className="flex items-start justify-between gap-1.5">
                    <div className="flex items-center gap-1.5 min-w-0 flex-1">
                      <FileText className={`w-3.5 h-3.5 shrink-0 ${isFocused ? 'text-[#00FF66]' : 'text-[#FF003C]'}`} />
                      <span className="text-xs font-bold text-white truncate group-hover:text-[#00FF66] transition-colors">
                        {item.title}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        cyberAudio.playAlertBuzz();
                        onToggleSelectItem(item.id);
                      }}
                      className="text-neutral-500 hover:text-rose-400 p-1 rounded"
                      title="Exclude from batch zip"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="text-[10px] text-neutral-400 truncate">
                    {fileName}
                  </div>

                  <div className="flex items-center justify-between text-[10px] pt-1 border-t border-neutral-900">
                    <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold border flex items-center gap-1 ${badgeStyle.bg} ${badgeStyle.border} ${badgeStyle.text}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${badgeStyle.dotColor}`} />
                      {badgeStyle.label}
                    </span>

                    <span className="text-neutral-400">
                      {item.pageCount}P &bull; {item.tablesCount}T
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Right Column: Live Rendered Thumbnail / Snippet Preview Window */}
          <div className="flex-1 flex flex-col bg-black overflow-hidden">
            {currentFocusedItem ? (
              <div className="flex-1 flex flex-col overflow-hidden">
                {/* Document Header Bar */}
                <div className="p-4 border-b border-neutral-800 bg-[#08080C] flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-white truncate">
                        {currentFocusedItem.title}
                      </h4>
                      {(() => {
                        const badgeStyle = getCategoryBadgeStyle(currentFocusedItem.category);
                        return (
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold border flex items-center gap-1 ${badgeStyle.bg} ${badgeStyle.border} ${badgeStyle.text}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${badgeStyle.dotColor}`} />
                            {badgeStyle.label}
                          </span>
                        );
                      })()}
                    </div>
                    <p className="text-[11px] text-neutral-400 font-mono truncate">
                      FILENAME: {currentFocusedItem.originalFileName || `${currentFocusedItem.title}.pdf`} &bull; {formatBytes(currentFocusedItem.fileSize || 150000)} &bull; {formatTimestamp(currentFocusedItem.timestamp)}
                    </p>
                  </div>

                  {/* Quick Load into Editor Action */}
                  <CyberButton
                    variant="outline"
                    size="sm"
                    icon={<ExternalLink className="w-3.5 h-3.5" />}
                    onClick={() => {
                      onLoadItemToWorkspace(currentFocusedItem);
                      onClose();
                    }}
                    className="!text-[10px] !py-1 shrink-0"
                    title="Load this document directly into the live Google Docs workspace"
                  >
                    OPEN IN LIVE WORKSPACE
                  </CyberButton>
                </div>

                {/* Rendered Document Snippet Container */}
                <div className="flex-1 p-5 overflow-y-auto bg-[#070709] select-text">
                  <div className="max-w-3xl mx-auto bg-[#0D0D12] border border-neutral-800/80 rounded p-6 shadow-inner text-neutral-200 text-xs font-sans leading-relaxed">
                    <div 
                      className="prose prose-invert max-w-none text-neutral-300 [&_table]:border [&_table]:border-neutral-700 [&_th]:border [&_th]:border-neutral-700 [&_th]:bg-neutral-800 [&_th]:p-2 [&_td]:border [&_td]:border-neutral-800 [&_td]:p-2 [&_h1]:text-white [&_h1]:border-b [&_h1]:border-neutral-800 [&_h1]:pb-2 [&_h2]:text-[#00FF66] [&_h3]:text-[#E056FD]"
                      dangerouslySetInnerHTML={{ __html: currentFocusedItem.htmlContent }}
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center text-neutral-500 text-xs">
                Select a document from the left to view its preview snippet.
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer Controls */}
        <div className="px-5 py-3.5 border-t border-neutral-800 bg-[#060608] flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
          <div className="text-xs text-neutral-400 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#00FF66]" />
            <span>
              {selectedItems.length} DOCUMENT{selectedItems.length !== 1 ? 'S' : ''} SELECTED &bull; VERIFIED FOR EXPORT
            </span>
          </div>

          <div className="flex items-center justify-end gap-2.5">
            <CyberButton
              variant="outline"
              size="sm"
              onClick={onClose}
              className="!text-xs"
            >
              CLOSE PREVIEW
            </CyberButton>

            <CyberButton
              variant="primary"
              size="sm"
              icon={
                isZipExporting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <FolderArchive className="w-4 h-4" />
                )
              }
              disabled={isZipExporting || selectedItems.length === 0}
              onClick={async () => {
                await onDownloadBatchZip();
                onClose();
              }}
              className="!text-xs !py-2 !px-4 shadow-[0_0_15px_rgba(0,255,102,0.35)]"
            >
              {isZipExporting
                ? 'COMPRESSING ARCHIVE...'
                : `DOWNLOAD ALL ${selectedItems.length} IN ZIPPED ARCHIVE`}
            </CyberButton>
          </div>
        </div>
      </div>
    </div>
  );
};
// ===== END NEW CODE: BATCH PREVIEW MODAL FOR MULTI-FILE VERIFICATION =====
