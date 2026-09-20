import React, { useState } from 'react';
import { 
  ChevronsLeft, 
  ChevronLeft, 
  ChevronRight, 
  ChevronsRight, 
  FilePlus, 
  LayoutList, 
  FileText,
  Sparkles
} from 'lucide-react';
import { cyberAudio } from '../../utils/audioSynth.ts';

// ===== START NEW CODE: DOCUMENT PAGE SLIDER & PAGINATION BAR =====

export interface DocumentPageSliderProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (newPage: number) => void;
  viewMode?: 'single' | 'stacked';
  onViewModeChange?: (mode: 'single' | 'stacked') => void;
  onInsertPageBreak?: () => void;
  onAddNewPage?: () => void;
}

export const DocumentPageSlider: React.FC<DocumentPageSliderProps> = ({
  currentPage,
  totalPages,
  onPageChange,
  viewMode = 'single',
  onViewModeChange,
  onInsertPageBreak,
  onAddNewPage,
}) => {
  const [jumpInput, setJumpInput] = useState('');

  const handlePageSelect = (page: number) => {
    if (page < 1 || page > totalPages || page === currentPage) return;
    cyberAudio.playCyberClick();
    onPageChange(page);
  };

  const handleJumpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const target = parseInt(jumpInput.trim(), 10);
    if (!isNaN(target) && target >= 1 && target <= totalPages) {
      handlePageSelect(target);
      setJumpInput('');
    } else {
      cyberAudio.playAlertBuzz();
    }
  };

  // Generate page numbers array
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

  return (
    <div className="w-full bg-[#0E0E12] border-b border-neutral-800 px-2.5 py-1.5 flex items-center justify-between gap-2 text-xs font-mono select-none overflow-x-auto scrollbar-none">
      {/* Left: Telemetry & Active Status */}
      <div className="flex items-center gap-2 shrink-0">
        <div className="flex items-center gap-1.5 px-2 py-1 bg-black/80 border border-neutral-800 rounded text-[11px]">
          <FileText className="w-3.5 h-3.5 text-[#FF003C]" />
          <span className="text-neutral-400 font-bold uppercase tracking-wider hidden sm:inline">
            PAGE
          </span>
          <span className="text-white font-bold">{currentPage}</span>
          <span className="text-neutral-500">/</span>
          <span className="text-[#E056FD] font-bold">{totalPages}</span>
        </div>

        {/* View Mode Toggle: Single Page vs Stacked Sheets */}
        {onViewModeChange && (
          <div className="flex items-center bg-black/60 border border-neutral-800 rounded p-0.5">
            <button
              onClick={() => {
                cyberAudio.playCyberClick();
                onViewModeChange('single');
              }}
              className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all ${
                viewMode === 'single'
                  ? 'bg-[#FF003C] text-white shadow-[0_0_8px_rgba(255,0,60,0.5)]'
                  : 'text-neutral-400 hover:text-white'
              }`}
              title="Single Page View (Page Slider Controls)"
            >
              SINGLE
            </button>
            <button
              onClick={() => {
                cyberAudio.playCyberClick();
                onViewModeChange('stacked');
              }}
              className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all ${
                viewMode === 'stacked'
                  ? 'bg-[#E056FD] text-black shadow-[0_0_8px_rgba(224,86,253,0.5)]'
                  : 'text-neutral-400 hover:text-white'
              }`}
              title="Stacked Sheets View (All Pages Visible)"
            >
              STACKED
            </button>
          </div>
        )}
      </div>

      {/* Center: Interactive Page Slider (IMG_1575 Specification) */}
      <div className="flex items-center gap-1.5 shrink-0">
        {/* Backward Navigation */}
        <button
          onClick={() => handlePageSelect(1)}
          disabled={currentPage <= 1}
          className="px-2 py-1.5 rounded bg-neutral-900 border border-neutral-700 text-neutral-300 hover:text-[#FF003C] hover:border-[#FF003C] hover:bg-neutral-800 disabled:opacity-25 disabled:pointer-events-none transition-all flex items-center justify-center font-bold text-xs"
          title="First Page (1)"
        >
          <ChevronsLeft className="w-3.5 h-3.5" />
        </button>

        <button
          onClick={() => handlePageSelect(currentPage - 1)}
          disabled={currentPage <= 1}
          className="px-2 py-1.5 rounded bg-neutral-900 border border-neutral-700 text-neutral-300 hover:text-[#FF003C] hover:border-[#FF003C] hover:bg-neutral-800 disabled:opacity-25 disabled:pointer-events-none transition-all flex items-center justify-center font-bold text-xs"
          title="Previous Page"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
        </button>

        {/* Direct Page Number Buttons (IMG_1575 design: 1 [2] [3] [4] [5] [6] [7] [8] [9]) */}
        <div className="flex items-center gap-1">
          {pages.map((p) => {
            const isActive = p === currentPage;
            return (
              <button
                key={p}
                onClick={() => handlePageSelect(p)}
                className={`min-w-[28px] h-7 px-2 rounded font-mono text-xs font-bold transition-all select-none ${
                  isActive
                    ? 'bg-[#FF003C] text-white border border-[#FF003C] shadow-[0_0_10px_rgba(255,0,60,0.6)] scale-105 z-10'
                    : 'bg-neutral-900/90 text-neutral-300 border border-neutral-700 hover:border-[#FF003C] hover:text-white hover:bg-neutral-800 active:scale-95'
                }`}
                title={`Navigate to Page ${p}`}
              >
                {p}
              </button>
            );
          })}
        </div>

        {/* Forward Navigation */}
        <button
          onClick={() => handlePageSelect(currentPage + 1)}
          disabled={currentPage >= totalPages}
          className="px-2 py-1.5 rounded bg-neutral-900 border border-neutral-700 text-neutral-300 hover:text-[#FF003C] hover:border-[#FF003C] hover:bg-neutral-800 disabled:opacity-25 disabled:pointer-events-none transition-all flex items-center justify-center font-bold text-xs"
          title="Next Page"
        >
          <ChevronRight className="w-3.5 h-3.5" />
        </button>

        <button
          onClick={() => handlePageSelect(totalPages)}
          disabled={currentPage >= totalPages}
          className="px-2 py-1.5 rounded bg-neutral-900 border border-neutral-700 text-neutral-300 hover:text-[#FF003C] hover:border-[#FF003C] hover:bg-neutral-800 disabled:opacity-25 disabled:pointer-events-none transition-all flex items-center justify-center font-bold text-xs"
          title={`Last Page (${totalPages})`}
        >
          <ChevronsRight className="w-3.5 h-3.5" />
        </button>

        {/* Direct Page Jump Form (IMG_1575: [ page ] [ Go ]) */}
        <form onSubmit={handleJumpSubmit} className="flex items-center gap-1 ml-1 shrink-0">
          <input
            type="number"
            min="1"
            max={totalPages}
            placeholder="page"
            value={jumpInput}
            onChange={(e) => setJumpInput(e.target.value)}
            className="w-14 h-7 bg-black border border-neutral-700 rounded px-1.5 text-center text-xs font-mono text-white placeholder:text-neutral-600 focus:border-[#FF003C] focus:ring-0 outline-none"
            title={`Enter page 1-${totalPages}`}
          />
          <button
            type="submit"
            className="h-7 px-2.5 rounded bg-[#E056FD]/20 border border-[#E056FD] text-[#E056FD] hover:bg-[#E056FD] hover:text-black font-bold text-xs transition-all active:scale-95"
            title="Jump to specified page"
          >
            Go
          </button>
        </form>
      </div>

      {/* Right: Page Break & Add Page Actions */}
      <div className="flex items-center gap-1.5 shrink-0">
        {onInsertPageBreak && (
          <button
            onClick={() => {
              cyberAudio.playCyberClick();
              onInsertPageBreak();
            }}
            className="flex items-center gap-1 px-2.5 py-1 rounded bg-neutral-900 border border-neutral-700 hover:border-emerald-500 text-neutral-300 hover:text-emerald-400 text-[11px] font-bold transition-all shrink-0"
            title="Insert a page break at current cursor position"
          >
            <FilePlus className="w-3 h-3 text-emerald-400" />
            <span className="hidden sm:inline">INSERT BREAK</span>
          </button>
        )}

        {onAddNewPage && (
          <button
            onClick={() => {
              cyberAudio.playCyberClick();
              onAddNewPage();
            }}
            className="flex items-center gap-1 px-2 py-1 rounded bg-[#FF003C]/10 border border-[#FF003C]/60 hover:border-[#FF003C] text-white text-[11px] font-bold transition-all shrink-0"
            title="Append a new blank page to document"
          >
            <span>+ PAGE</span>
          </button>
        )}
      </div>
    </div>
  );
};
// ===== END NEW CODE: DOCUMENT PAGE SLIDER & PAGINATION BAR =====
