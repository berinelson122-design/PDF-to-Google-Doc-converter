import React from 'react';
import { 
  Layers, 
  ChevronLeft, 
  ChevronRight, 
  FileText, 
  Table as TableIcon, 
  Check, 
  PanelLeftClose, 
  PanelLeft,
  Eye
} from 'lucide-react';
import { useGameStore } from '../../store/useGameStore.ts';
import { cyberAudio } from '../../utils/audioSynth.ts';

// ===== START NEW CODE: PDF PAGE THUMBNAIL SIDEBAR & QUICK NAVIGATOR =====

interface PageThumbnailSidebarProps {
  pages: string[];
  currentPage: number;
  onSelectPage: (pageNumber: number) => void;
  viewMode?: 'single' | 'stacked';
}

export const PageThumbnailSidebar: React.FC<PageThumbnailSidebarProps> = ({
  pages,
  currentPage,
  onSelectPage,
  viewMode = 'single',
}) => {
  const { isThumbnailSidebarOpen, toggleThumbnailSidebar } = useGameStore();

  if (pages.length === 0) return null;

  return (
    <>
      {/* Desktop & Tablet Collapsible Sidebar Container */}
      <aside
        id="pdf-page-thumbnail-sidebar"
        className={`bg-[#0A0A0D] border-r border-neutral-800 flex flex-col transition-all duration-300 select-none z-20 shrink-0 ${
          isThumbnailSidebarOpen ? 'w-56 md:w-64' : 'w-10'
        }`}
      >
        {/* Sidebar Header */}
        <div className="p-2.5 border-b border-neutral-800/90 flex items-center justify-between bg-neutral-950 font-mono text-xs">
          {isThumbnailSidebarOpen ? (
            <div className="flex items-center gap-1.5 text-neutral-300 font-bold overflow-hidden truncate">
              <Layers className="w-3.5 h-3.5 text-[#FF003C] shrink-0" />
              <span className="tracking-wider uppercase text-[11px] truncate">
                PAGES ({pages.length})
              </span>
            </div>
          ) : (
            <Layers className="w-4 h-4 text-[#FF003C] mx-auto" />
          )}

          <button
            onClick={() => {
              toggleThumbnailSidebar();
              cyberAudio.playCyberClick();
            }}
            className="p-1 rounded text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
            title={isThumbnailSidebarOpen ? 'Collapse Page Thumbnails' : 'Expand Page Thumbnails'}
          >
            {isThumbnailSidebarOpen ? (
              <PanelLeftClose className="w-3.5 h-3.5" />
            ) : (
              <PanelLeft className="w-3.5 h-3.5" />
            )}
          </button>
        </div>

        {/* Collapsed Strip Mode */}
        {!isThumbnailSidebarOpen && (
          <div className="flex-1 py-2 flex flex-col items-center gap-1.5 overflow-y-auto scrollbar-none">
            {pages.map((_, idx) => {
              const pageNum = idx + 1;
              const isActive = currentPage === pageNum;
              return (
                <button
                  key={pageNum}
                  onClick={() => {
                    cyberAudio.playCyberClick();
                    onSelectPage(pageNum);
                  }}
                  className={`w-7 h-9 rounded text-[10px] font-mono font-bold flex items-center justify-center transition-all ${
                    isActive
                      ? 'bg-[#FF003C] text-white shadow-[0_0_8px_rgba(255,0,60,0.5)]'
                      : 'bg-neutral-900 text-neutral-400 hover:bg-neutral-800 hover:text-white'
                  }`}
                  title={`Jump to Page ${pageNum}`}
                >
                  {pageNum}
                </button>
              );
            })}
          </div>
        )}

        {/* Expanded Thumbnail Cards List */}
        {isThumbnailSidebarOpen && (
          <div className="flex-1 p-3 overflow-y-auto space-y-3.5 custom-scrollbar">
            {pages.map((pageHtml, idx) => {
              const pageNum = idx + 1;
              const isActive = currentPage === pageNum;

              // Quick metric analysis for thumbnail badge
              const tempDiv = document.createElement('div');
              tempDiv.innerHTML = pageHtml;
              const textContent = tempDiv.textContent || '';
              const pageWords = textContent.split(/\s+/).filter(Boolean).length;
              const hasTable = pageHtml.includes('<table');
              const hasHeading = /<h[1-3]/i.test(pageHtml);

              return (
                <div
                  key={pageNum}
                  id={`thumbnail-card-page-${pageNum}`}
                  onClick={() => {
                    cyberAudio.playCyberClick();
                    onSelectPage(pageNum);
                  }}
                  className={`group cursor-pointer rounded-md p-2.5 transition-all border relative flex flex-col gap-2 ${
                    isActive
                      ? 'bg-[#14141A] border-[#FF003C] shadow-[0_0_12px_rgba(255,0,60,0.25)] ring-1 ring-[#FF003C]'
                      : 'bg-[#0E0E12] border-neutral-800 hover:border-neutral-700 hover:bg-[#121217]'
                  }`}
                >
                  {/* Thumbnail Card Header */}
                  <div className="flex items-center justify-between font-mono text-[11px]">
                    <span className={`font-bold flex items-center gap-1.5 ${isActive ? 'text-[#FF003C]' : 'text-neutral-300'}`}>
                      <span>PAGE {pageNum.toString().padStart(2, '0')}</span>
                    </span>

                    <div className="flex items-center gap-1">
                      {hasTable && (
                        <span className="p-0.5 bg-emerald-950/70 border border-emerald-800/80 rounded text-emerald-400 text-[9px]" title="Contains Data Table">
                          <TableIcon className="w-2.5 h-2.5" />
                        </span>
                      )}
                      {isActive && (
                        <span className="px-1.5 py-0.2 bg-[#FF003C] text-white text-[9px] font-bold rounded">
                          ACTIVE
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Miniature Visual Layout Simulation Thumbnail */}
                  <div className="w-full h-28 bg-white rounded-sm border border-neutral-300 p-2 overflow-hidden relative shadow-inner text-[6px] leading-[8px] text-neutral-800 select-none pointer-events-none group-hover:scale-[1.02] transition-transform">
                    {/* Simulated Document Typography */}
                    <div className="space-y-1 opacity-80">
                      {hasHeading && (
                        <div className="h-2 w-3/4 bg-neutral-900 rounded-xs mb-1" />
                      )}
                      <div className="h-1.5 w-full bg-neutral-400 rounded-xs" />
                      <div className="h-1.5 w-5/6 bg-neutral-400 rounded-xs" />
                      <div className="h-1.5 w-4/5 bg-neutral-400 rounded-xs" />

                      {hasTable ? (
                        <div className="mt-1.5 border border-neutral-400 rounded-xs p-0.5 bg-neutral-100">
                          <div className="h-1.5 w-full bg-neutral-300 mb-0.5" />
                          <div className="grid grid-cols-3 gap-0.5">
                            <div className="h-1 bg-neutral-400" />
                            <div className="h-1 bg-neutral-400" />
                            <div className="h-1 bg-neutral-400" />
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="h-1.5 w-11/12 bg-neutral-400 rounded-xs mt-1" />
                          <div className="h-1.5 w-2/3 bg-neutral-400 rounded-xs" />
                        </>
                      )}
                    </div>

                    {/* Miniature Page Bottom Number */}
                    <div className="absolute bottom-1 right-2 text-[7px] text-neutral-500 font-mono font-bold">
                      pg.{pageNum}
                    </div>
                  </div>

                  {/* Thumbnail Card Meta */}
                  <div className="flex items-center justify-between font-mono text-[10px] text-neutral-500">
                    <span>{pageWords} words</span>
                    <span className="text-[9px] text-neutral-400">US Letter</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </aside>

      {/* Mobile Horizontal Thumbnail Strip for Quick Touch Navigation */}
      <div className="md:hidden w-full bg-[#0A0A0D] border-b border-neutral-800 p-2 flex items-center gap-2 overflow-x-auto scrollbar-none font-mono text-xs select-none">
        <span className="text-[10px] text-neutral-400 uppercase font-bold shrink-0 flex items-center gap-1">
          <Layers className="w-3 h-3 text-[#FF003C]" />
          PAGE JUMP:
        </span>
        <div className="flex items-center gap-1.5">
          {pages.map((_, idx) => {
            const pageNum = idx + 1;
            const isActive = currentPage === pageNum;
            return (
              <button
                key={pageNum}
                onClick={() => {
                  cyberAudio.playCyberClick();
                  onSelectPage(pageNum);
                }}
                className={`px-2.5 py-1 rounded text-[11px] font-bold shrink-0 border transition-all ${
                  isActive
                    ? 'bg-[#FF003C] border-[#FF003C] text-white shadow-[0_0_8px_rgba(255,0,60,0.4)]'
                    : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-white hover:border-neutral-700'
                }`}
              >
                PG {pageNum}
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
};

// ===== END NEW CODE: PDF PAGE THUMBNAIL SIDEBAR & QUICK NAVIGATOR =====
