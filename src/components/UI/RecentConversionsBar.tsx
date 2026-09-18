import React, { useState } from 'react';
import { 
  Database, 
  RotateCcw, 
  FileText, 
  Check, 
  Copy, 
  Trash2, 
  ArrowUpRight, 
  Clock, 
  Table, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle,
  FolderOpen
} from 'lucide-react';
import { useGameStore } from '../../store/useGameStore.ts';
import { SavedConversionRecord } from '../../utils/recentConversionsStorage.ts';
import { formatBytes, formatTimestamp, wrapForGoogleDocsClipboard } from '../../utils/formatters.ts';
import { cyberAudio } from '../../utils/audioSynth.ts';

export const RecentConversionsBar: React.FC = () => {
  const { 
    savedConversions, 
    activeSavedConversionId, 
    loadSavedConversion, 
    deleteSavedConversion, 
    clearSavedConversions,
    result 
  } = useGameStore();

  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [confirmClear, setConfirmClear] = useState(false);

  const handleOpenDocument = (item: SavedConversionRecord) => {
    cyberAudio.playSuccessChime();
    loadSavedConversion(item);
  };

  const handleCopyGoogleDocs = async (item: SavedConversionRecord, e: React.MouseEvent) => {
    e.stopPropagation();
    cyberAudio.playScanBeep(3);
    const htmlToCopy = item.editedHtml || item.result.htmlContent;
    const clipboardPayload = wrapForGoogleDocsClipboard(htmlToCopy, item.title);

    try {
      if (navigator.clipboard && window.ClipboardItem) {
        const textBlob = new Blob([item.result.markdownContent || htmlToCopy], { type: 'text/plain' });
        const htmlBlob = new Blob([clipboardPayload], { type: 'text/html' });
        await navigator.clipboard.write([
          new ClipboardItem({
            'text/html': htmlBlob,
            'text/plain': textBlob,
          }),
        ]);
      } else {
        await navigator.clipboard.writeText(htmlToCopy);
      }
      setCopiedId(item.id);
      setTimeout(() => setCopiedId(null), 2500);
    } catch (err) {
      console.warn('Direct clipboard API write failed, falling back:', err);
      const ta = document.createElement('textarea');
      ta.value = htmlToCopy;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopiedId(item.id);
      setTimeout(() => setCopiedId(null), 2500);
    }
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    cyberAudio.playAlertBuzz();
    deleteSavedConversion(id);
  };

  const handleClearAll = () => {
    cyberAudio.playAlertBuzz();
    clearSavedConversions();
    setConfirmClear(false);
  };

  return (
    <section 
      id="recent-conversions-persistence"
      className="p-4 md:p-5 border border-neutral-800 bg-[#0A0A0C] rounded-lg relative overflow-hidden"
    >
      {/* Visual Accent Ambient Line */}
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-emerald-500 via-[#E056FD] to-[#FF003C]" />

      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-neutral-800/80">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
            <Database className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xs md:text-sm font-bold text-white uppercase tracking-wider">
                PERSISTENT LOCAL STORAGE // LAST 5 CONVERSIONS
              </h3>
              <span className="px-1.5 py-0.5 text-[10px] font-mono bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 rounded font-bold">
                {savedConversions.length}/5 SLOTS
              </span>
            </div>
            <p className="text-[11px] text-neutral-400 mt-0.5">
              Automatically saved to browser storage. Revisit previous documents anytime, even after page refresh.
            </p>
          </div>
        </div>

        {savedConversions.length > 0 && (
          <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
            {confirmClear ? (
              <div className="flex items-center gap-1.5 bg-neutral-900 border border-[#FF003C]/40 p-1 rounded">
                <span className="text-[10px] text-neutral-300 px-1">Clear all 5?</span>
                <button
                  id="btn-confirm-clear-recent"
                  onClick={handleClearAll}
                  className="px-2 py-0.5 text-[10px] font-bold bg-[#FF003C] text-white rounded hover:bg-[#FF003C]/80"
                >
                  YES
                </button>
                <button
                  id="btn-cancel-clear-recent"
                  onClick={() => setConfirmClear(false)}
                  className="px-2 py-0.5 text-[10px] bg-neutral-800 text-neutral-300 rounded hover:text-white"
                >
                  NO
                </button>
              </div>
            ) : (
              <button
                id="btn-clear-recent-conversions"
                onClick={() => setConfirmClear(true)}
                title="Clear local storage cache"
                className="text-[11px] text-neutral-500 hover:text-neutral-300 transition-colors flex items-center gap-1 px-2 py-1 rounded hover:bg-neutral-900"
              >
                <Trash2 className="w-3 h-3" />
                <span>CLEAR CACHE</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Conversion Cards / Empty State */}
      {savedConversions.length === 0 ? (
        <div className="py-6 px-4 text-center border border-dashed border-neutral-800 rounded mt-3 bg-neutral-950/40">
          <FolderOpen className="w-7 h-7 mx-auto text-neutral-600 mb-2" />
          <p className="text-xs font-bold text-neutral-300 uppercase tracking-wider">
            NO PERSISTENT CONVERSIONS CACHED YET
          </p>
          <p className="text-[11px] text-neutral-500 max-w-md mx-auto mt-1">
            Convert any PDF document above. The last 5 results (including tables, typography, and extracted content) will be automatically preserved here so you can revisit them across sessions.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mt-3">
          {savedConversions.map((item, index) => {
            const isActive = activeSavedConversionId === item.id || result?.documentTitle === item.title;
            const isCopied = copiedId === item.id;
            const tablesCount = item.result?.detectedElements?.tablesCount ?? 0;
            const fidelity = item.result?.stats?.fidelityScore ?? 98;
            const wordCount = item.result?.stats?.wordCount ?? 0;

            return (
              <div
                key={item.id}
                id={`saved-card-${item.id}`}
                onClick={() => handleOpenDocument(item)}
                className={`group relative p-3.5 rounded border transition-all cursor-pointer flex flex-col justify-between ${
                  isActive
                    ? 'border-emerald-500/70 bg-emerald-950/20 shadow-[0_0_15px_rgba(16,185,129,0.15)] ring-1 ring-emerald-500/40'
                    : 'border-neutral-800 bg-[#0E0E12] hover:border-neutral-700 hover:bg-[#121217]'
                }`}
              >
                <div>
                  {/* Top Meta Line */}
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-neutral-900 border border-neutral-700 text-neutral-400 font-bold">
                        SLOT #{index + 1}
                      </span>
                      {isActive ? (
                        <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.2 rounded border border-emerald-500/30">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                          ACTIVE
                        </span>
                      ) : (
                        <span className="text-[10px] text-neutral-500 flex items-center gap-1">
                          <Clock className="w-2.5 h-2.5" />
                          {formatTimestamp(item.timestamp)}
                        </span>
                      )}
                    </div>

                    <button
                      id={`btn-delete-saved-${item.id}`}
                      onClick={(e) => handleDelete(item.id, e)}
                      title="Remove from saved documents"
                      className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-neutral-500 hover:text-[#FF003C] hover:bg-neutral-900 rounded"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>

                  {/* Document Title */}
                  <h4 className="text-xs md:text-sm font-bold text-white group-hover:text-[#E056FD] transition-colors truncate">
                    {item.title}
                  </h4>
                  <div className="text-[11px] text-neutral-500 truncate mt-0.5 font-mono">
                    {item.originalFileName || `${item.title}.pdf`}
                    {item.fileSize ? ` • ${formatBytes(item.fileSize)}` : ''}
                  </div>

                  {/* Key Stats Chips */}
                  <div className="flex flex-wrap items-center gap-1.5 mt-2.5">
                    <span className="px-1.5 py-0.5 text-[10px] font-mono bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 rounded font-semibold flex items-center gap-1">
                      <Sparkles className="w-2.5 h-2.5" />
                      {fidelity}% Match
                    </span>

                    {tablesCount > 0 && (
                      <span className="px-1.5 py-0.5 text-[10px] font-mono bg-blue-500/10 border border-blue-500/30 text-blue-300 rounded font-semibold flex items-center gap-1">
                        <Table className="w-2.5 h-2.5" />
                        {tablesCount} {tablesCount === 1 ? 'Table' : 'Tables'}
                      </span>
                    )}

                    {wordCount > 0 && (
                      <span className="px-1.5 py-0.5 text-[10px] font-mono bg-neutral-800 text-neutral-400 rounded">
                        {wordCount} words
                      </span>
                    )}
                  </div>
                </div>

                {/* Card Actions */}
                <div className="flex items-center justify-between gap-2 mt-3 pt-2.5 border-t border-neutral-800/80">
                  <span className="text-[11px] font-bold text-emerald-400 flex items-center gap-1 group-hover:underline">
                    <RotateCcw className="w-3 h-3" />
                    {isActive ? 'CURRENTLY OPEN' : 'REVISIT DOCUMENT'}
                  </span>

                  <button
                    id={`btn-copy-saved-${item.id}`}
                    onClick={(e) => handleCopyGoogleDocs(item, e)}
                    title="Copy formatted content for Google Docs paste"
                    className={`px-2 py-1 text-[10px] font-mono rounded flex items-center gap-1 transition-all ${
                      isCopied
                        ? 'bg-emerald-500 text-black font-bold'
                        : 'bg-neutral-900 border border-neutral-700 text-neutral-300 hover:text-white hover:border-neutral-600'
                    }`}
                  >
                    {isCopied ? (
                      <>
                        <Check className="w-3 h-3" />
                        <span>COPIED!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span>COPY HTML</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
};
