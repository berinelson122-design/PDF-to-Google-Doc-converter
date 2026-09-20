// ===== START NEW CODE: DOCUMENT LAYOUT THUMBNAIL PREVIEW COMPONENT =====
import React, { useState, useMemo } from 'react';
import { 
  FileText, 
  ChevronLeft, 
  ChevronRight, 
  Layers, 
  Table as TableIcon, 
  Type, 
  Sparkles,
  Eye,
  Maximize2
} from 'lucide-react';
import { splitDocumentIntoPages, calculateDocumentMetrics } from '../../utils/documentPaginator.ts';
import { cyberAudio } from '../../utils/audioSynth.ts';

interface ExportThumbnailPreviewProps {
  htmlContent: string;
  documentTitle: string;
  selectedFormat?: string;
  className?: string;
}

export const ExportThumbnailPreview: React.FC<ExportThumbnailPreviewProps> = ({
  htmlContent,
  documentTitle,
  selectedFormat = 'docx',
  className = '',
}) => {
  const [activePage, setActivePage] = useState<number>(1);
  const [zoomMode, setZoomMode] = useState<'fit' | 'fill'>('fit');

  // Compute metrics and split pages
  const metrics = useMemo(() => {
    return calculateDocumentMetrics(htmlContent);
  }, [htmlContent]);

  const pages = useMemo(() => {
    if (!htmlContent) return [''];
    const split = splitDocumentIntoPages(htmlContent, {
      targetPageCount: metrics.pages,
    });
    return split.length > 0 ? split : [htmlContent];
  }, [htmlContent, metrics.pages]);

  const totalPages = Math.max(1, pages.length);
  const safeCurrentPage = Math.min(Math.max(1, activePage), totalPages);
  const currentPageHtml = pages[safeCurrentPage - 1] || htmlContent || '';

  const handlePrevPage = () => {
    cyberAudio.playCyberClick();
    setActivePage((prev) => Math.max(1, prev - 1));
  };

  const handleNextPage = () => {
    cyberAudio.playCyberClick();
    setActivePage((prev) => Math.min(totalPages, prev + 1));
  };

  const handleSelectPage = (pageNum: number) => {
    cyberAudio.playCyberClick();
    setActivePage(pageNum);
  };

  return (
    <div 
      id="export-document-thumbnail-preview"
      className={`border border-neutral-800 bg-[#08080A] rounded p-3.5 flex flex-col space-y-3 font-mono ${className}`}
    >
      {/* Header Bar: Title, Page Navigator & Metrics */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-neutral-800 text-xs">
        <div className="flex items-center gap-2">
          <Eye className="w-3.5 h-3.5 text-[#FF003C]" />
          <span className="font-bold text-white uppercase text-[11px] tracking-wider flex items-center gap-1.5">
            LAYOUT PREVIEW // {selectedFormat.toUpperCase()}
          </span>
        </div>

        {/* Page Switcher Controls for PC & Mobile */}
        <div className="flex items-center gap-1.5">
          {totalPages > 1 && (
            <div className="flex items-center bg-black border border-neutral-800 rounded px-1 py-0.5">
              <button
                type="button"
                onClick={handlePrevPage}
                disabled={safeCurrentPage <= 1}
                className="p-1 text-neutral-400 hover:text-white disabled:opacity-30 disabled:hover:text-neutral-400 transition-colors"
                title="Previous Page (PC / Mobile)"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <span className="px-1.5 text-[10px] text-neutral-300 font-bold">
                PAGE {safeCurrentPage} / {totalPages}
              </span>
              <button
                type="button"
                onClick={handleNextPage}
                disabled={safeCurrentPage >= totalPages}
                className="p-1 text-neutral-400 hover:text-white disabled:opacity-30 disabled:hover:text-neutral-400 transition-colors"
                title="Next Page (PC / Mobile)"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          <span className="text-[10px] bg-neutral-900 border border-neutral-800 text-neutral-400 px-2 py-0.5 rounded">
            {metrics.wordCount} WORDS
          </span>
        </div>
      </div>

      {/* Main Preview Frame: Miniature Scaled Document Canvas */}
      <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 justify-center">
        {/* Left / Center: Scaled A4 Simulated Page */}
        <div className="relative w-full max-w-[240px] sm:max-w-[260px] aspect-[1/1.38] bg-white rounded shadow-2xl border border-neutral-700 overflow-hidden flex flex-col select-none group transition-all shrink-0">
          {/* Subtle Top Google Doc Header Strip */}
          <div className="bg-[#f8f9fa] border-b border-[#dadce0] px-2.5 py-1 flex items-center justify-between text-[7px] text-[#5f6368] font-sans">
            <div className="flex items-center gap-1 truncate font-medium max-w-[170px]">
              <span className="w-1.5 h-1.5 bg-[#4285f4] rounded-xs" />
              <span className="truncate">{documentTitle || 'Untitled Document'}</span>
            </div>
            <span className="font-mono text-[7px] font-bold text-[#1a73e8]">P.{safeCurrentPage}</span>
          </div>

          {/* Scaled HTML Content Viewport */}
          <div className="relative flex-1 w-full bg-white overflow-hidden p-2.5">
            {currentPageHtml ? (
              <div 
                className="origin-top-left pointer-events-none text-neutral-900 leading-normal"
                style={{
                  transform: 'scale(0.32)',
                  width: '310%',
                  fontFamily: 'Arial, Helvetica, sans-serif',
                }}
                dangerouslySetInnerHTML={{ __html: currentPageHtml }}
              />
            ) : (
              /* Fallback Skeleton View */
              <div className="space-y-2 opacity-50 p-2">
                <div className="h-3 w-3/4 bg-neutral-800 rounded" />
                <div className="h-2 w-full bg-neutral-400 rounded" />
                <div className="h-2 w-5/6 bg-neutral-400 rounded" />
                <div className="h-2 w-4/5 bg-neutral-400 rounded" />
                <div className="h-10 w-full border border-neutral-300 rounded bg-neutral-100 mt-3" />
              </div>
            )}
          </div>

          {/* Miniature Page Shadow & Border Overlay */}
          <div className="absolute inset-0 pointer-events-none border border-neutral-400/20 rounded shadow-inner" />
        </div>

        {/* Right / Bottom: Summary Cards & Structure Topology */}
        <div className="flex-1 min-w-0 w-full flex flex-col justify-between space-y-2.5 text-xs">
          <div className="space-y-2">
            <div className="text-[11px] text-neutral-400 flex items-center gap-1.5 font-bold uppercase">
              <Layers className="w-3 h-3 text-[#E056FD]" />
              <span>Topology & Verified Fidelity</span>
            </div>

            {/* Quick Metrics Badges */}
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-black border border-neutral-800/90 rounded p-2 text-center">
                <div className="text-[9px] text-neutral-500 uppercase font-semibold">PAGE ESTIMATE</div>
                <div className="text-sm font-bold text-white mt-0.5">
                  {totalPages} {totalPages === 1 ? 'PAGE' : 'PAGES'}
                </div>
              </div>

              <div className="bg-black border border-neutral-800/90 rounded p-2 text-center">
                <div className="text-[9px] text-neutral-500 uppercase font-semibold">TABLES</div>
                <div className="text-sm font-bold text-emerald-400 mt-0.5 flex items-center justify-center gap-1">
                  <TableIcon className="w-3 h-3" />
                  <span>{metrics.tablesCount}</span>
                </div>
              </div>
            </div>

            {/* Formatting Features Check list */}
            <div className="bg-black/50 border border-neutral-800/60 rounded p-2.5 space-y-1.5 text-[10px] text-neutral-400">
              <div className="flex items-center justify-between text-neutral-300 font-medium">
                <span>Headings & Hierarchy:</span>
                <span className="text-[#FF003C] font-bold">{metrics.headingsCount} Detected</span>
              </div>
              <div className="flex items-center justify-between text-neutral-300 font-medium">
                <span>Character Density:</span>
                <span className="text-neutral-400">{metrics.characterCount.toLocaleString()} bytes</span>
              </div>
              <div className="flex items-center justify-between text-neutral-300 font-medium">
                <span>Document Format Target:</span>
                <span className="text-emerald-400 uppercase font-bold">.{selectedFormat}</span>
              </div>
            </div>
          </div>

          {/* Quick Page Jump Chips for Multi-Page Docs */}
          {totalPages > 1 && (
            <div className="pt-1">
              <span className="text-[9px] text-neutral-500 uppercase font-bold block mb-1">
                PREVIEW OTHER PAGES:
              </span>
              <div className="flex flex-wrap items-center gap-1">
                {pages.map((_, idx) => {
                  const pageNumber = idx + 1;
                  const isCurrent = pageNumber === safeCurrentPage;
                  return (
                    <button
                      key={pageNumber}
                      type="button"
                      onClick={() => handleSelectPage(pageNumber)}
                      className={`px-2 py-0.5 text-[10px] font-mono rounded border transition-all ${
                        isCurrent
                          ? 'border-[#FF003C] bg-red-950/40 text-white font-bold'
                          : 'border-neutral-800 bg-neutral-900/60 text-neutral-400 hover:text-white hover:border-neutral-700'
                      }`}
                    >
                      P.{pageNumber}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Bottom Watermark */}
          <div className="text-right text-[9px] text-neutral-600 font-mono tracking-widest pt-1">
            ARCHITECT // VOID_WEAVER
          </div>
        </div>
      </div>
    </div>
  );
};
// ===== END NEW CODE: DOCUMENT LAYOUT THUMBNAIL PREVIEW COMPONENT =====
