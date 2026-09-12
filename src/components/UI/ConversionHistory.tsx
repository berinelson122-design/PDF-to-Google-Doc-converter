import React, { useState, useMemo } from 'react';
import { 
  History, 
  FileText, 
  RotateCcw, 
  Trash2, 
  Search, 
  Copy, 
  Check, 
  Table, 
  Clock, 
  Sparkles,
  Database,
  X,
  SlidersHorizontal,
  Calendar,
  FileSpreadsheet,
  Download
} from 'lucide-react';
import { useGameStore } from '../../store/useGameStore.ts';
import { 
  formatTimestamp, 
  formatBytes, 
  wrapForGoogleDocsClipboard,
  exportHistoryToCsv 
} from '../../utils/formatters.ts';
import { CyberButton } from '../common/CyberButton.tsx';
import { cyberAudio } from '../../utils/audioSynth.ts';

// ===== START NEW CODE: PERSISTENT UPLOADED PDF HISTORY ARCHIVE WITH FILENAME SEARCH & CSV EXPORT =====
export const ConversionHistory: React.FC = () => {
  const { history, loadHistoryItem, deleteHistoryItem, clearHistory, addToHistory } = useGameStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'tables' | 'today'>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isCsvExporting, setIsCsvExporting] = useState(false);
  const [csvSuccessMsg, setCsvSuccessMsg] = useState<string | null>(null);

  // Filter history strictly by filename and optional filter tags
  const filteredHistory = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const startOfToday = new Date().setHours(0, 0, 0, 0);

    return history.filter((item) => {
      // Filename filter: checks originalFileName as primary, and title as fallback
      const fileNameMatch = !q || (
        (item.originalFileName && item.originalFileName.toLowerCase().includes(q)) ||
        item.title.toLowerCase().includes(q)
      );

      if (!fileNameMatch) return false;

      if (filterType === 'tables') {
        return item.tablesCount > 0;
      }
      if (filterType === 'today') {
        return item.timestamp >= startOfToday;
      }

      return true;
    });
  }, [history, searchQuery, filterType]);

  const totalSize = history.reduce((acc, curr) => acc + (curr.fileSize || 150000), 0);

  // ===== START NEW CODE: CSV EXPORT HANDLER =====
  const handleExportCsv = (scope: 'filtered' | 'all' = 'filtered') => {
    const itemsToExport = scope === 'all' ? history : filteredHistory;
    if (itemsToExport.length === 0) return;

    setIsCsvExporting(true);
    cyberAudio.playSuccessChime();

    const dateSlug = new Date().toISOString().slice(0, 10);
    const filterSlug = searchQuery.trim() ? `_${searchQuery.trim().replace(/[^a-zA-Z0-9_-]/g, '_')}` : '';
    const customFilename = `converted_documents_history${filterSlug}_${dateSlug}.csv`;

    exportHistoryToCsv(itemsToExport, customFilename);

    setCsvSuccessMsg(`EXPORTED ${itemsToExport.length} DOCUMENT FILENAME${itemsToExport.length !== 1 ? 'S' : ''} TO CSV`);
    setTimeout(() => {
      setIsCsvExporting(false);
      setCsvSuccessMsg(null);
    }, 2800);
  };
  // ===== END NEW CODE: CSV EXPORT HANDLER =====

  const handleCopyGoogleDocsHtml = async (id: string, title: string, html: string) => {
    try {
      const wrapped = wrapForGoogleDocsClipboard(html, title);
      const blobHtml = new Blob([wrapped], { type: 'text/html' });
      const blobText = new Blob([html.replace(/<[^>]+>/g, ' ')], { type: 'text/plain' });

      if (navigator.clipboard && window.ClipboardItem) {
        await navigator.clipboard.write([
          new ClipboardItem({
            'text/html': blobHtml,
            'text/plain': blobText,
          }),
        ]);
      } else {
        await navigator.clipboard.writeText(html);
      }

      setCopiedId(id);
      cyberAudio.playSuccessChime();
      setTimeout(() => setCopiedId(null), 2500);
    } catch (err) {
      console.error('Clipboard copy error:', err);
      cyberAudio.playAlertBuzz();
    }
  };

  const seedSampleHistory = () => {
    cyberAudio.playCyberClick();
    const timestamp = Date.now();
    addToHistory({
      id: 'sample_seed_' + timestamp,
      title: 'Enterprise Cloud Architecture Q3',
      originalFileName: 'Enterprise_Cloud_Architecture_Q3.pdf',
      fileSize: 420 * 1024,
      timestamp,
      pageCount: 2,
      tablesCount: 1,
      headingsCount: 3,
      htmlContent: `<h2>Enterprise Cloud Architecture</h2><p>Report on latency benchmarks across cloud proxy clusters.</p><table style="border: 1px solid #ccc; width: 100%;"><tr><th>Node</th><th>Latency</th><th>Status</th></tr><tr><td>Proxy Gateway</td><td>4.2ms</td><td style="color: green;">PASS</td></tr></table>`,
      fidelityScore: 99.4,
      status: 'success',
    });
  };

  return (
    <section className="w-full bg-[#08080A] border border-neutral-800 rounded p-4 md:p-5 space-y-4 font-mono shadow-[0_0_20px_rgba(0,0,0,0.5)]">
      {/* Header & Stats Telemetry Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-neutral-800">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded bg-neutral-900 border border-[#E056FD]/40 flex items-center justify-center text-[#E056FD]">
            <History className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xs uppercase font-bold text-white tracking-wider">
                UPLOADED PDF HISTORY &amp; CONVERTED ARCHIVE
              </h3>
              <span className="px-2 py-0.5 rounded bg-neutral-900 border border-neutral-700 text-xs text-neutral-300">
                {history.length} SAVED
              </span>
            </div>
            <p className="text-[10px] text-neutral-500">
              PERSISTENT LOCAL STORAGE &bull; {formatBytes(totalSize)} CACHED
            </p>
          </div>
        </div>

        {/* Global Archive Controls */}
        <div className="flex items-center gap-2">
          {history.length > 0 && (
            <>
              {/* ===== START NEW CODE: EXPORT CSV BUTTON CONTROLS ===== */}
              <CyberButton
                variant="secondary"
                size="sm"
                icon={
                  isCsvExporting ? (
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <FileSpreadsheet className="w-3.5 h-3.5 text-[#E056FD]" />
                  )
                }
                onClick={() => handleExportCsv(filteredHistory.length > 0 ? 'filtered' : 'all')}
                className="!text-[10px] !py-1 !px-2.5 text-white hover:text-[#E056FD] border border-[#E056FD]/40 shadow-[0_0_10px_rgba(224,86,253,0.15)]"
                title={`Export list of converted document filenames and metadata as a CSV file (${filteredHistory.length} items)`}
              >
                {isCsvExporting
                  ? 'CSV DOWNLOADED!'
                  : (searchQuery.trim() || filterType !== 'all')
                  ? `EXPORT CSV (${filteredHistory.length})`
                  : 'EXPORT CSV'}
              </CyberButton>
              {/* ===== END NEW CODE: EXPORT CSV BUTTON CONTROLS ===== */}

              <CyberButton
                variant="outline"
                size="sm"
                icon={<Trash2 className="w-3.5 h-3.5" />}
                onClick={() => {
                  if (confirm('Clear all uploaded PDF documents from local history?')) {
                    cyberAudio.playAlertBuzz();
                    clearHistory();
                  }
                }}
                className="!text-[10px] !py-1 !px-2.5 text-neutral-400 hover:text-rose-400"
              >
                CLEAR ARCHIVE
              </CyberButton>
            </>
          )}
        </div>
      </div>

      {/* CSV Export Success Banner Feedback */}
      {csvSuccessMsg && (
        <div className="p-2.5 bg-emerald-950/40 border border-emerald-500/50 rounded flex items-center justify-between gap-2 text-xs font-mono text-emerald-300">
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="font-bold">{csvSuccessMsg}</span>
          </div>
          <span className="text-[10px] text-emerald-400/80 uppercase font-mono tracking-wider">
            SAVED TO DOWNLOADS
          </span>
        </div>
      )}

      {/* DEDICATED SEARCH BAR & FILENAME FILTER BAR */}
      {history.length > 0 && (
        <div className="p-3 bg-black border border-neutral-800 rounded space-y-2.5">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
            {/* Search Input Filtered by Filename */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search uploads by filename (e.g. quarterly_report.pdf, spec, contract)..."
                className="w-full bg-[#0D0D10] border border-neutral-700 focus:border-[#FF003C] rounded pl-9 pr-9 py-1.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:ring-1 focus:ring-[#FF003C]/50 transition-all font-mono"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 text-neutral-400 hover:text-white rounded"
                  title="Clear filename filter"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Match Counter Badge & Quick CSV Export */}
            <div className="flex items-center justify-between sm:justify-end gap-2 shrink-0">
              <span className={`text-[11px] font-mono px-2 py-1 rounded border ${
                searchQuery.trim()
                  ? 'bg-[#FF003C]/10 border-[#FF003C]/40 text-[#FF003C]'
                  : 'bg-neutral-900 border-neutral-800 text-neutral-400'
              }`}>
                {filteredHistory.length} / {history.length} FILES
              </span>

              {filteredHistory.length > 0 && (
                <button
                  onClick={() => handleExportCsv('filtered')}
                  className="px-2 py-1 bg-neutral-900 hover:bg-[#E056FD]/20 border border-neutral-800 hover:border-[#E056FD]/50 text-neutral-300 hover:text-[#E056FD] rounded text-[10px] font-mono flex items-center gap-1.5 transition-colors"
                  title="Export filtered list of filenames to CSV"
                >
                  <Download className="w-3 h-3 text-[#E056FD]" />
                  <span>CSV</span>
                </button>
              )}
            </div>
          </div>

          {/* Quick Filter Tag Buttons */}
          <div className="flex flex-wrap items-center gap-1.5 pt-1 text-[11px]">
            <span className="text-neutral-500 text-[10px] flex items-center gap-1 mr-1">
              <SlidersHorizontal className="w-3 h-3" />
              QUICK FILTERS:
            </span>
            <button
              onClick={() => setFilterType('all')}
              className={`px-2 py-0.5 rounded text-[10px] border transition-colors ${
                filterType === 'all'
                  ? 'bg-neutral-200 text-black border-neutral-200 font-bold'
                  : 'bg-neutral-900 text-neutral-400 border-neutral-800 hover:border-neutral-700 hover:text-white'
              }`}
            >
              ALL ({history.length})
            </button>
            <button
              onClick={() => setFilterType('tables')}
              className={`px-2 py-0.5 rounded text-[10px] border transition-colors flex items-center gap-1 ${
                filterType === 'tables'
                  ? 'bg-emerald-500 text-black border-emerald-500 font-bold'
                  : 'bg-neutral-900 text-neutral-400 border-neutral-800 hover:border-emerald-700 hover:text-emerald-400'
              }`}
            >
              <Table className="w-3 h-3" />
              CONTAINS TABLES ({history.filter((i) => i.tablesCount > 0).length})
            </button>
            <button
              onClick={() => setFilterType('today')}
              className={`px-2 py-0.5 rounded text-[10px] border transition-colors flex items-center gap-1 ${
                filterType === 'today'
                  ? 'bg-[#E056FD] text-black border-[#E056FD] font-bold'
                  : 'bg-neutral-900 text-neutral-400 border-neutral-800 hover:border-[#E056FD]/60 hover:text-[#E056FD]'
              }`}
            >
              <Calendar className="w-3 h-3" />
              UPLOADED TODAY
            </button>
          </div>
        </div>
      )}

      {/* History Items Grid or Empty States */}
      {history.length === 0 ? (
        <div className="p-8 border border-dashed border-neutral-800 rounded bg-black/40 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-neutral-900 border border-neutral-800 mx-auto flex items-center justify-center text-neutral-500">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-bold text-neutral-300 uppercase tracking-wider">
              NO UPLOADED PDF DOCUMENTS STORED
            </div>
            <p className="text-[11px] text-neutral-500 max-w-md mx-auto mt-1 leading-relaxed">
              Every PDF you upload and convert is automatically archived here with metadata, original tables, and formatted Google Docs content.
            </p>
          </div>
          <CyberButton
            variant="secondary"
            size="sm"
            icon={<Sparkles className="w-3.5 h-3.5" />}
            onClick={seedSampleHistory}
          >
            SEED BENCHMARK ARCHIVE RECORD
          </CyberButton>
        </div>
      ) : filteredHistory.length === 0 ? (
        <div className="p-6 text-center space-y-2.5 bg-neutral-950 rounded border border-neutral-800">
          <div className="text-xs font-bold text-neutral-300">
            NO UPLOADS MATCHING FILENAME &ldquo;{searchQuery}&rdquo;
          </div>
          <p className="text-[11px] text-neutral-500">
            No processed documents matched your query. Try a different filename or reset the filter.
          </p>
          <button
            onClick={() => {
              setSearchQuery('');
              setFilterType('all');
            }}
            className="text-[11px] text-[#FF003C] hover:underline font-bold"
          >
            RESET FILENAME FILTER
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {filteredHistory.map((item) => {
            const isCopied = copiedId === item.id;
            const fileName = item.originalFileName || `${item.title}.pdf`;

            return (
              <div
                key={item.id}
                className="p-3.5 border border-neutral-800 hover:border-[#FF003C]/50 bg-black rounded transition-all flex flex-col justify-between group space-y-3 relative overflow-hidden"
              >
                {/* Tactical Accent Corner */}
                <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-[#FF003C]/60" />

                {/* Item Details */}
                <div className="space-y-1.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <FileText className="w-4 h-4 text-[#FF003C] shrink-0" />
                      <span className="text-xs font-bold text-white truncate group-hover:text-[#FF003C] transition-colors">
                        {item.title}
                      </span>
                    </div>

                    {item.fidelityScore && (
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-950/60 border border-emerald-500/40 text-emerald-400 shrink-0 font-bold">
                        {item.fidelityScore}%
                      </span>
                    )}
                  </div>

                  {/* Explicit Filename Display with Search Highlighting */}
                  <div className="text-[11px] text-neutral-300 font-mono bg-neutral-950 px-2 py-1 rounded border border-neutral-800/80 truncate flex items-center gap-1.5">
                    <span className="text-neutral-500 text-[9px] uppercase font-bold shrink-0">FILE:</span>
                    <span className="truncate text-white" title={fileName}>
                      {fileName}
                    </span>
                  </div>

                  {/* Telemetry metadata chips */}
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[10px] text-neutral-400">
                    <span className="flex items-center gap-1 text-neutral-500">
                      <Clock className="w-3 h-3" />
                      {formatTimestamp(item.timestamp)}
                    </span>
                    <span>&bull;</span>
                    {item.fileSize && (
                      <>
                        <span>{formatBytes(item.fileSize)}</span>
                        <span>&bull;</span>
                      </>
                    )}
                    <span className="text-emerald-400 flex items-center gap-0.5">
                      <Table className="w-3 h-3" /> {item.tablesCount} Table{item.tablesCount !== 1 ? 's' : ''}
                    </span>
                    <span>&bull;</span>
                    <span>{item.headingsCount} Headings</span>
                  </div>
                </div>

                {/* Action Toolbar */}
                <div className="flex items-center justify-between gap-2 pt-2 border-t border-neutral-900">
                  <CyberButton
                    variant="primary"
                    size="sm"
                    icon={<RotateCcw className="w-3 h-3" />}
                    onClick={() => {
                      cyberAudio.playCyberClick();
                      loadHistoryItem(item);
                    }}
                    className="!py-1 !px-2.5 !text-[10px] flex-1"
                  >
                    LOAD WORKSPACE
                  </CyberButton>

                  <button
                    onClick={() => handleCopyGoogleDocsHtml(item.id, item.title, item.htmlContent)}
                    className={`p-1.5 rounded border text-[10px] transition-colors flex items-center gap-1 ${
                      isCopied
                        ? 'border-emerald-500 bg-emerald-950/60 text-emerald-400'
                        : 'border-neutral-800 bg-neutral-900 text-neutral-300 hover:border-neutral-700 hover:text-white'
                    }`}
                    title="Copy Google Docs formatted HTML to clipboard"
                  >
                    {isCopied ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>COPIED</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>COPY</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => {
                      cyberAudio.playAlertBuzz();
                      deleteHistoryItem(item.id);
                    }}
                    className="p-1.5 rounded border border-neutral-800 bg-neutral-900 text-neutral-500 hover:text-rose-400 hover:border-rose-900 transition-colors"
                    title="Delete record from history"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
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
// ===== END NEW CODE: PERSISTENT UPLOADED PDF HISTORY ARCHIVE WITH FILENAME SEARCH =====
