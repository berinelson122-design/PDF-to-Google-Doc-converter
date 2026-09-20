import React, { useState, useMemo } from 'react';
import { 
  ListTree, 
  Search, 
  ChevronRight, 
  ChevronDown, 
  BookOpen, 
  FileText, 
  PlusCircle, 
  Copy, 
  Check, 
  Sparkles, 
  Layers, 
  X, 
  ExternalLink,
  SlidersHorizontal,
  Bookmark,
  ArrowUpRight,
  Maximize2,
  Minimize2,
  AlertCircle
} from 'lucide-react';
import { TocEntry, TocMetadata } from '../../types/index.ts';
import { 
  analyzeDocumentStructure, 
  insertTocIntoDocumentHtml, 
  exportOutlineAsMarkdown 
} from '../../utils/tableOfContentsAnalyzer.ts';
import { useGameStore } from '../../store/useGameStore.ts';
import { cyberAudio } from '../../utils/audioSynth.ts';
import { CyberBadge } from '../common/CyberBadge.tsx';
import { CyberButton } from '../common/CyberButton.tsx';

// ===== START NEW CODE: INTERACTIVE TABLE OF CONTENTS COMPONENT =====

interface TableOfContentsProps {
  htmlContent: string;
  documentTitle?: string;
  onNavigateToPage?: (pageNumber: number, headingId?: string) => void;
  className?: string;
  isFloating?: boolean;
  onClose?: () => void;
}

export const TableOfContents: React.FC<TableOfContentsProps> = ({
  htmlContent,
  documentTitle = 'Document',
  onNavigateToPage,
  className = '',
  isFloating = false,
  onClose,
}) => {
  const { 
    setEditedHtml, 
    setCurrentActivePage,
    currentActivePage,
  } = useGameStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [levelFilter, setLevelFilter] = useState<'all' | '1' | '2' | '3'>('all');
  const [copiedOutline, setCopiedOutline] = useState(false);
  const [insertSuccess, setInsertSuccess] = useState(false);
  const [activeHeadingId, setActiveHeadingId] = useState<string | null>(null);
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Analyze document structure in real-time
  const tocMetadata: TocMetadata = useMemo(() => {
    return analyzeDocumentStructure(htmlContent, { minPagesForAutoToc: 5 });
  }, [htmlContent]);

  const { headings, totalPages, isEligibleForAutoToc, totalHeadings, maxDepth, estimatedReadMinutes } = tocMetadata;

  // Filter headings by search query and depth level
  const filteredHeadings = useMemo(() => {
    return headings.filter((h) => {
      const matchesSearch = !searchQuery.trim() || 
        h.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        h.previewSnippet.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesLevel = 
        levelFilter === 'all' ? true :
        levelFilter === '1' ? h.level === 1 :
        levelFilter === '2' ? h.level <= 2 :
        h.level <= 3;

      return matchesSearch && matchesLevel;
    });
  }, [headings, searchQuery, levelFilter]);

  // Handle clicking a heading to jump to its page and scroll to its position
  const handleHeadingClick = (heading: TocEntry) => {
    cyberAudio.playCyberClick();
    setActiveHeadingId(heading.id);

    // 1. Update active page in state
    setCurrentActivePage(heading.pageNumber);
    if (onNavigateToPage) {
      onNavigateToPage(heading.pageNumber, heading.id);
    }

    // 2. Scroll directly to heading element if visible in active DOM
    setTimeout(() => {
      const targetEl = document.getElementById(heading.id);
      if (targetEl) {
        targetEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
        targetEl.classList.add('ring-2', 'ring-[#FF003C]', 'bg-[#FF003C]/10', 'transition-all', 'duration-500');
        setTimeout(() => {
          targetEl.classList.remove('ring-2', 'ring-[#FF003C]', 'bg-[#FF003C]/10');
        }, 1800);
      }
    }, 120);
  };

  // Insert generated TOC HTML directly into document body
  const handleInsertIntoDocument = () => {
    try {
      cyberAudio.playButtonAction();
      const { updatedHtml, inserted } = insertTocIntoDocumentHtml(
        htmlContent,
        headings,
        documentTitle
      );
      if (inserted) {
        setEditedHtml(updatedHtml);
        cyberAudio.playSuccessChime();
        setInsertSuccess(true);
        setTimeout(() => setInsertSuccess(false), 2500);
      }
    } catch (err) {
      console.error('Failed to insert TOC into document:', err);
      cyberAudio.playAlertBuzz();
    }
  };

  // Copy structured Markdown outline to clipboard
  const handleCopyOutline = async () => {
    try {
      cyberAudio.playButtonAction();
      const markdownOutline = exportOutlineAsMarkdown(headings, documentTitle);
      await navigator.clipboard.writeText(markdownOutline);
      cyberAudio.playSuccessChime();
      setCopiedOutline(true);
      setTimeout(() => setCopiedOutline(false), 2200);
    } catch (err) {
      console.error('Failed to copy outline:', err);
      cyberAudio.playAlertBuzz();
    }
  };

  return (
    <div 
      id="interactive-table-of-contents-container"
      className={`bg-[#000000] border border-neutral-800 rounded flex flex-col font-mono select-none overflow-hidden shadow-2xl relative ${className}`}
    >
      {/* Top Header Bar */}
      <div className="p-3 border-b border-neutral-800 bg-[#08080A] flex items-center justify-between gap-2 shrink-0">
        <div className="flex items-center gap-2 overflow-hidden">
          <div className="p-1.5 rounded bg-red-950/40 border border-[#FF003C]/40 text-[#FF003C] shrink-0">
            <ListTree className="w-4 h-4" />
          </div>
          <div className="truncate">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-white tracking-wider uppercase truncate">
                TABLE OF CONTENTS
              </span>
              {isEligibleForAutoToc && (
                <span className="text-[9px] px-1.5 py-0.2 rounded border border-[#FF003C]/60 bg-[#FF003C]/20 text-[#FF003C] font-extrabold uppercase animate-pulse">
                  5+ PAGES AUTO-INDEXED
                </span>
              )}
            </div>
            <p className="text-[10px] text-neutral-400 truncate">
              {totalHeadings} HEADINGS &bull; {totalPages} PAGES &bull; ~{estimatedReadMinutes} MIN READ
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1 text-neutral-400 hover:text-white rounded hover:bg-neutral-800 transition-colors"
            title={isCollapsed ? 'Expand Table of Contents' : 'Collapse Body'}
          >
            {isCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4 rotate-90" />}
          </button>
          {onClose && (
            <button
              onClick={() => {
                cyberAudio.playCyberClick();
                onClose();
              }}
              className="p-1 text-neutral-400 hover:text-white rounded hover:bg-neutral-800 transition-colors"
              title="Close Table of Contents Panel"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {!isCollapsed && (
        <>
          {/* Quick Action Toolbar */}
          <div className="p-2 border-b border-neutral-800/80 bg-neutral-950 flex flex-wrap items-center justify-between gap-2 text-xs shrink-0">
            <div className="flex items-center gap-1.5 flex-1 min-w-[140px]">
              <div className="relative flex-1">
                <Search className="w-3.5 h-3.5 text-neutral-500 absolute left-2 top-2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Filter sections..."
                  className="w-full bg-black border border-neutral-800 focus:border-[#FF003C] rounded pl-7 pr-2 py-1 text-[11px] text-white outline-none placeholder:text-neutral-600 font-mono"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2 top-1.5 text-neutral-500 hover:text-white text-xs"
                  >
                    &times;
                  </button>
                )}
              </div>
            </div>

            {/* Depth Level Filter Buttons */}
            <div className="flex items-center gap-1 bg-black border border-neutral-800 p-0.5 rounded text-[10px]">
              <button
                onClick={() => {
                  setLevelFilter('all');
                  cyberAudio.playCyberClick();
                }}
                className={`px-1.5 py-0.5 rounded font-bold transition-colors ${
                  levelFilter === 'all'
                    ? 'bg-[#FF003C] text-white'
                    : 'text-neutral-400 hover:text-white'
                }`}
                title="Show all heading levels"
              >
                ALL
              </button>
              <button
                onClick={() => {
                  setLevelFilter('1');
                  cyberAudio.playCyberClick();
                }}
                className={`px-1.5 py-0.5 rounded font-bold transition-colors ${
                  levelFilter === '1'
                    ? 'bg-[#FF003C] text-white'
                    : 'text-neutral-400 hover:text-white'
                }`}
                title="Show H1 headings only"
              >
                H1
              </button>
              <button
                onClick={() => {
                  setLevelFilter('2');
                  cyberAudio.playCyberClick();
                }}
                className={`px-1.5 py-0.5 rounded font-bold transition-colors ${
                  levelFilter === '2'
                    ? 'bg-[#FF003C] text-white'
                    : 'text-neutral-400 hover:text-white'
                }`}
                title="Show H1 and H2 headings"
              >
                H1-H2
              </button>
            </div>
          </div>

          {/* Heading Outline List */}
          <div className="flex-1 overflow-y-auto p-2 space-y-1 max-h-[380px] min-h-[160px] scrollbar-thin scrollbar-thumb-neutral-800">
            {filteredHeadings.length === 0 ? (
              <div className="p-6 text-center text-neutral-500 text-xs">
                <Bookmark className="w-6 h-6 mx-auto mb-2 text-neutral-600 opacity-60" />
                <p className="font-bold">NO MATCHING SECTIONS</p>
                <p className="text-[10px] text-neutral-600 mt-1">
                  {searchQuery ? 'Try clearing the search filter.' : 'No heading tags (H1-H6) detected in this payload.'}
                </p>
              </div>
            ) : (
              filteredHeadings.map((heading, idx) => {
                const isSelected = activeHeadingId === heading.id || currentActivePage === heading.pageNumber;
                const indentPadding = heading.level === 1 ? 'pl-2' : heading.level === 2 ? 'pl-5' : 'pl-8';
                
                const levelTagColor = 
                  heading.level === 1 ? 'text-[#FF003C] border-[#FF003C]/40 bg-red-950/30' :
                  heading.level === 2 ? 'text-[#E056FD] border-[#E056FD]/40 bg-purple-950/30' :
                  'text-cyan-400 border-cyan-500/40 bg-cyan-950/30';

                return (
                  <button
                    key={`${heading.id}-${idx}`}
                    id={`btn-toc-${heading.id}`}
                    onClick={() => handleHeadingClick(heading)}
                    className={`w-full text-left p-2 rounded border transition-all flex items-start justify-between gap-2 group ${indentPadding} ${
                      isSelected
                        ? 'border-[#FF003C]/70 bg-red-950/20 text-white shadow-[0_0_8px_rgba(255,0,60,0.15)]'
                        : 'border-transparent hover:border-neutral-800 hover:bg-neutral-900/60 text-neutral-300'
                    }`}
                    title={`Jump to Page ${heading.pageNumber}: ${heading.title}`}
                  >
                    <div className="flex items-start gap-1.5 overflow-hidden flex-1">
                      <span className={`text-[8.5px] px-1 py-0.5 rounded border uppercase font-bold shrink-0 mt-0.5 ${levelTagColor}`}>
                        {heading.tag.toUpperCase()}
                      </span>
                      <div className="overflow-hidden">
                        <span className={`text-xs block truncate ${heading.level === 1 ? 'font-bold text-white' : 'font-normal'}`}>
                          {heading.title}
                        </span>
                        {heading.previewSnippet && (
                          <span className="text-[9.5px] text-neutral-500 block truncate group-hover:text-neutral-400">
                            {heading.previewSnippet}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded border font-bold ${
                        currentActivePage === heading.pageNumber
                          ? 'bg-[#FF003C] text-white border-[#FF003C]'
                          : 'bg-black text-neutral-400 border-neutral-800 group-hover:border-neutral-700'
                      }`}>
                        P.{heading.pageNumber}
                      </span>
                      <ArrowUpRight className="w-3 h-3 text-neutral-600 group-hover:text-[#FF003C] transition-colors" />
                    </div>
                  </button>
                );
              })
            )}
          </div>

          {/* Bottom Action Footer */}
          <div className="p-2.5 border-t border-neutral-800 bg-[#0A0A0C] flex flex-wrap items-center justify-between gap-2 shrink-0">
            <div className="flex items-center gap-2">
              <button
                id="btn-insert-toc-doc"
                onClick={handleInsertIntoDocument}
                className={`px-2.5 py-1 text-[11px] font-mono rounded border flex items-center gap-1.5 font-bold transition-all ${
                  insertSuccess
                    ? 'bg-emerald-600 text-white border-emerald-500'
                    : 'bg-[#FF003C] text-white border-[#FF003C] hover:bg-red-700 shadow-[0_0_8px_rgba(255,0,60,0.3)]'
                }`}
                title="Insert formatted Table of Contents block into document content"
              >
                {insertSuccess ? <Check className="w-3.5 h-3.5" /> : <PlusCircle className="w-3.5 h-3.5" />}
                <span>{insertSuccess ? 'TOC INSERTED!' : 'INSERT TOC IN DOC'}</span>
              </button>

              <button
                id="btn-copy-toc-outline"
                onClick={handleCopyOutline}
                className={`px-2 py-1 text-[11px] font-mono rounded border flex items-center gap-1.5 transition-all ${
                  copiedOutline
                    ? 'bg-emerald-950 border-emerald-500 text-emerald-300'
                    : 'bg-neutral-900 border-neutral-700 text-neutral-300 hover:text-white hover:border-[#E056FD]'
                }`}
                title="Copy Markdown outline hierarchy to clipboard"
              >
                {copiedOutline ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-[#E056FD]" />}
                <span>{copiedOutline ? 'COPIED' : 'COPY OUTLINE'}</span>
              </button>
            </div>

            {/* Bottom-right watermark mandate */}
            <span className="text-[8.5px] font-mono text-neutral-600 tracking-wider">
              ARCHITECT // VOID_WEAVER
            </span>
          </div>
        </>
      )}
    </div>
  );
};
// ===== END NEW CODE: INTERACTIVE TABLE OF CONTENTS COMPONENT =====
