import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Search, 
  ChevronUp, 
  ChevronDown, 
  X, 
  CaseSensitive, 
  Sparkles,
  FileSearch,
  Check
} from 'lucide-react';
import { useGameStore } from '../../store/useGameStore.ts';
import { cyberAudio } from '../../utils/audioSynth.ts';

// ===== START NEW CODE: KEYWORD SEARCH & HIGHLIGHT BAR FOR GOOGLE DOC EDITOR =====

interface DocumentSearchBarProps {
  onNavigateToPage?: (pageNumber: number) => void;
  pages: string[];
}

export const DocumentSearchBar: React.FC<DocumentSearchBarProps> = ({
  onNavigateToPage,
  pages,
}) => {
  const { 
    searchQuery, 
    setSearchQuery, 
    searchMatchCount, 
    setSearchMatchCount, 
    currentSearchMatchIndex, 
    setCurrentSearchMatchIndex,
    currentActivePage,
    setCurrentActivePage
  } = useGameStore();

  const [isCaseSensitive, setIsCaseSensitive] = useState(false);
  const [matchLocations, setMatchLocations] = useState<Array<{ pageNumber: number; matchIndexOnPage: number }>>([]);
  const [isOpen, setIsOpen] = useState(true);
  const inputRef = useRef<HTMLInputElement | null>(null);

  // Scan all pages for the search query and calculate matches
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchMatchCount(0);
      setCurrentSearchMatchIndex(0);
      setMatchLocations([]);
      clearDOMHighlights();
      return;
    }

    const query = isCaseSensitive ? searchQuery : searchQuery.toLowerCase();
    const locations: Array<{ pageNumber: number; matchIndexOnPage: number }> = [];

    pages.forEach((pageHtml, pIdx) => {
      // Strip html tags to search plain text
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = pageHtml;
      const text = tempDiv.textContent || '';
      const targetText = isCaseSensitive ? text : text.toLowerCase();

      let pos = 0;
      let countOnPage = 0;
      while ((pos = targetText.indexOf(query, pos)) !== -1) {
        locations.push({
          pageNumber: pIdx + 1,
          matchIndexOnPage: countOnPage,
        });
        countOnPage++;
        pos += query.length;
      }
    });

    setMatchLocations(locations);
    setSearchMatchCount(locations.length);
    if (locations.length > 0) {
      if (currentSearchMatchIndex >= locations.length || currentSearchMatchIndex < 0) {
        setCurrentSearchMatchIndex(0);
      }
      applyDOMHighlight(locations[currentSearchMatchIndex || 0]);
    } else {
      setCurrentSearchMatchIndex(0);
      clearDOMHighlights();
    }
  }, [searchQuery, isCaseSensitive, pages]);

  // Clean existing search highlight marks in DOM
  const clearDOMHighlights = useCallback(() => {
    const marks = document.querySelectorAll('mark.doc-search-highlight');
    marks.forEach((mark) => {
      const parent = mark.parentNode;
      if (parent) {
        parent.replaceChild(document.createTextNode(mark.textContent || ''), mark);
        parent.normalize();
      }
    });
  }, []);

  // Highlight the specific active match in the DOM
  const applyDOMHighlight = useCallback((loc?: { pageNumber: number; matchIndexOnPage: number }) => {
    if (!loc) return;
    
    // Switch to target page if different from current
    if (loc.pageNumber !== currentActivePage) {
      setCurrentActivePage(loc.pageNumber);
      if (onNavigateToPage) {
        onNavigateToPage(loc.pageNumber);
      }
    }

    // Scroll to active editor canvas and pulse visual indicator
    setTimeout(() => {
      const editorElement = document.getElementById('active-doc-editor') || document.getElementById(`page-sheet-${loc.pageNumber}`);
      if (!editorElement) return;

      // Find text match and highlight or scroll into view
      const walker = document.createTreeWalker(editorElement, NodeFilter.SHOW_TEXT);
      let node: Node | null;
      let currentMatch = 0;
      const query = isCaseSensitive ? searchQuery : searchQuery.toLowerCase();

      while ((node = walker.nextNode())) {
        const text = node.textContent || '';
        const matchText = isCaseSensitive ? text : text.toLowerCase();
        const idx = matchText.indexOf(query);
        if (idx !== -1) {
          if (currentMatch === loc.matchIndexOnPage) {
            const range = document.createRange();
            range.setStart(node, idx);
            range.setEnd(node, idx + query.length);
            
            const selection = window.getSelection();
            if (selection) {
              selection.removeAllRanges();
              selection.addRange(range);
            }

            const parentElement = node.parentElement;
            if (parentElement) {
              parentElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
            break;
          }
          currentMatch++;
        }
      }
    }, 100);
  }, [currentActivePage, isCaseSensitive, searchQuery, onNavigateToPage, setCurrentActivePage]);

  const handleNextMatch = () => {
    if (matchLocations.length === 0) return;
    cyberAudio.playCyberClick();
    const nextIdx = (currentSearchMatchIndex + 1) % matchLocations.length;
    setCurrentSearchMatchIndex(nextIdx);
    applyDOMHighlight(matchLocations[nextIdx]);
  };

  const handlePrevMatch = () => {
    if (matchLocations.length === 0) return;
    cyberAudio.playCyberClick();
    const prevIdx = (currentSearchMatchIndex - 1 + matchLocations.length) % matchLocations.length;
    setCurrentSearchMatchIndex(prevIdx);
    applyDOMHighlight(matchLocations[prevIdx]);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (e.shiftKey) {
        handlePrevMatch();
      } else {
        handleNextMatch();
      }
    } else if (e.key === 'Escape') {
      setSearchQuery('');
      inputRef.current?.blur();
      cyberAudio.playCyberClick();
    }
  };

  const handleClear = () => {
    setSearchQuery('');
    setSearchMatchCount(0);
    setCurrentSearchMatchIndex(0);
    clearDOMHighlights();
    inputRef.current?.focus();
    cyberAudio.playCyberClick();
  };

  return (
    <div className="w-full bg-[#111116] border-b border-neutral-800/90 px-3 py-2 flex flex-wrap items-center justify-between gap-2.5 font-mono text-xs select-none">
      {/* Search Input Bar Group */}
      <div className="flex items-center gap-2 flex-1 min-w-[280px]">
        <div className="relative flex-1 max-w-md flex items-center">
          <Search className="w-3.5 h-3.5 absolute left-2.5 text-neutral-400 pointer-events-none" />
          <input
            ref={inputRef}
            id="doc-keyword-search-input"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Find keyword in document... (Press Enter / Esc)"
            className="w-full pl-8 pr-16 py-1.5 bg-[#09090C] border border-neutral-700/80 hover:border-neutral-600 focus:border-[#FF003C] rounded text-xs text-white placeholder-neutral-500 outline-none transition-all shadow-inner"
          />

          {searchQuery && (
            <button
              onClick={handleClear}
              className="absolute right-2 p-1 text-neutral-400 hover:text-white rounded hover:bg-neutral-800 transition-colors"
              title="Clear search query (Esc)"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* Case Sensitivity Toggle */}
        <button
          onClick={() => {
            setIsCaseSensitive(!isCaseSensitive);
            cyberAudio.playCyberClick();
          }}
          className={`px-2 py-1.5 rounded border text-[11px] font-bold transition-all flex items-center gap-1 ${
            isCaseSensitive
              ? 'bg-[#E056FD]/20 border-[#E056FD] text-[#E056FD]'
              : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-white hover:border-neutral-700'
          }`}
          title="Toggle Case Sensitivity (Match exact uppercase/lowercase)"
        >
          <CaseSensitive className="w-3.5 h-3.5" />
          <span>MATCH CASE</span>
        </button>
      </div>

      {/* Matches & Navigation Controls */}
      <div className="flex items-center gap-2 shrink-0">
        {/* Match Count Indicator */}
        <div className="px-2.5 py-1 bg-black border border-neutral-800 rounded flex items-center gap-1.5 text-[11px]">
          {searchQuery.trim() ? (
            searchMatchCount > 0 ? (
              <>
                <span className="w-1.5 h-1.5 rounded-full bg-[#FF003C] animate-pulse" />
                <span className="text-[#FF003C] font-bold">
                  {currentSearchMatchIndex + 1}
                </span>
                <span className="text-neutral-500">/</span>
                <span className="text-white font-bold">{searchMatchCount}</span>
                <span className="text-neutral-400 text-[10px] uppercase">MATCHES</span>
                {matchLocations[currentSearchMatchIndex] && (
                  <span className="text-emerald-400 text-[10px] ml-1 bg-emerald-950/40 px-1.5 py-0.2 rounded border border-emerald-800/50">
                    PG {matchLocations[currentSearchMatchIndex].pageNumber}
                  </span>
                )}
              </>
            ) : (
              <span className="text-neutral-400 text-[10px] font-bold">0 MATCHES FOUND</span>
            )
          ) : (
            <span className="text-neutral-500 text-[10px]">READY FOR QUERY</span>
          )}
        </div>

        {/* Previous Match Button */}
        <button
          onClick={handlePrevMatch}
          disabled={searchMatchCount <= 1}
          className="p-1.5 bg-neutral-900 border border-neutral-700/80 text-neutral-300 hover:text-white hover:border-[#FF003C] rounded disabled:opacity-30 disabled:pointer-events-none transition-all"
          title="Previous Match (Shift + Enter)"
        >
          <ChevronUp className="w-3.5 h-3.5" />
        </button>

        {/* Next Match Button */}
        <button
          onClick={handleNextMatch}
          disabled={searchMatchCount <= 1}
          className="p-1.5 bg-neutral-900 border border-neutral-700/80 text-neutral-300 hover:text-white hover:border-[#FF003C] rounded disabled:opacity-30 disabled:pointer-events-none transition-all"
          title="Next Match (Enter)"
        >
          <ChevronDown className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};

// ===== END NEW CODE: KEYWORD SEARCH & HIGHLIGHT BAR FOR GOOGLE DOC EDITOR =====
