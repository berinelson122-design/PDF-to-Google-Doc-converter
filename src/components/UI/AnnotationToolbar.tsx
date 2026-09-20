import React, { useState } from 'react';
import { 
  Highlighter, 
  Underline as UnderlineIcon, 
  Strikethrough as StrikeIcon, 
  Eraser, 
  AlertTriangle, 
  ChevronLeft, 
  ChevronRight, 
  CheckCheck, 
  Check, 
  Palette,
  ShieldCheck,
  Edit2
} from 'lucide-react';
import { useGameStore } from '../../store/useGameStore.ts';
import { 
  applyTextAnnotation, 
  removeAnnotationFromSelection, 
  HIGHLIGHT_COLOR_MAP 
} from '../../utils/ocrConfidenceScanner.ts';
import { HighlightColor } from '../../types/index.ts';
import { cyberAudio } from '../../utils/audioSynth.ts';

// ===== START NEW CODE: ANNOTATION TOOLBAR WITH OCR LOW-CONFIDENCE HIGHLIGHTER =====
interface AnnotationToolbarProps {
  onContentChange?: () => void;
}

export const AnnotationToolbar: React.FC<AnnotationToolbarProps> = ({ onContentChange }) => {
  const { 
    isLowConfidenceHighlightEnabled, 
    toggleLowConfidenceHighlight,
    lowConfidenceFlags,
    activeFlagIndex,
    setActiveFlagIndex,
    verifyFlag,
    verifyAllFlags,
    editedHtml,
    setEditedHtml
  } = useGameStore();

  const [activeColor, setActiveColor] = useState<HighlightColor>('yellow');
  const [isColorPickerOpen, setIsColorPickerOpen] = useState(false);
  const [editingFlagId, setEditingFlagId] = useState<string | null>(null);
  const [correctionInput, setCorrectionInput] = useState('');

  // Unverified flags
  const unverifiedFlags = lowConfidenceFlags.filter((f) => !f.isVerified);
  const currentFlag = unverifiedFlags[activeFlagIndex] || unverifiedFlags[0] || null;

  // Apply Annotation Handler
  const handleApply = (type: 'highlight' | 'underline' | 'strikethrough') => {
    cyberAudio.playCyberClick();
    const success = applyTextAnnotation(type, activeColor);
    if (success) {
      // Sync editor DOM with store
      const editor = document.getElementById('active-doc-editor');
      if (editor) {
        setEditedHtml(editor.innerHTML);
      }
      onContentChange?.();
    }
  };

  // Clear Annotation Handler
  const handleClearSelection = () => {
    cyberAudio.playCyberClick();
    const success = removeAnnotationFromSelection();
    if (success) {
      const editor = document.getElementById('active-doc-editor');
      if (editor) {
        setEditedHtml(editor.innerHTML);
      }
      onContentChange?.();
    }
  };

  // Scroll to active flag in editor
  const scrollToFlag = (targetIndex: number) => {
    cyberAudio.playCyberClick();
    if (unverifiedFlags.length === 0) return;
    const clampedIndex = (targetIndex + unverifiedFlags.length) % unverifiedFlags.length;
    setActiveFlagIndex(clampedIndex);
    const targetFlag = unverifiedFlags[clampedIndex];
    if (targetFlag) {
      const el = document.getElementById(targetFlag.id);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        // Flash a neon cyberpunk focus outline
        el.classList.add('ring-2', 'ring-[#FF003C]', 'ring-offset-2', 'animate-pulse');
        setTimeout(() => {
          el.classList.remove('ring-2', 'ring-[#FF003C]', 'ring-offset-2', 'animate-pulse');
        }, 1500);
      }
    }
  };

  const handleStartCorrection = () => {
    if (!currentFlag) return;
    setEditingFlagId(currentFlag.id);
    setCorrectionInput(currentFlag.originalWord);
    cyberAudio.playCyberClick();
  };

  const handleSaveCorrection = () => {
    if (!currentFlag) return;
    cyberAudio.playSuccessChime();
    verifyFlag(currentFlag.id, correctionInput);
    setEditingFlagId(null);
    onContentChange?.();
  };

  const handleAcceptCurrent = () => {
    if (!currentFlag) return;
    cyberAudio.playCyberClick();
    verifyFlag(currentFlag.id);
    onContentChange?.();
  };

  return (
    <div className="w-full bg-[#0E0E12] border border-neutral-800 rounded p-2 flex items-center justify-between gap-3 text-xs font-mono shadow-md overflow-x-auto scrollbar-none max-md:flex-nowrap">
      {/* Left: Text Formatting Annotations (Highlight, Underline, Strikethrough, Eraser) */}
      <div className="flex items-center gap-1.5 shrink-0 max-md:flex-nowrap">
        <span className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider flex items-center gap-1 px-1">
          <Highlighter className="w-3.5 h-3.5 text-[#FF003C]" />
          ANNOTATE:
        </span>

        {/* Highlight Action with Current Color Preview */}
        <div className="flex items-center rounded border border-neutral-800 bg-neutral-950 overflow-hidden">
          <button
            type="button"
            onClick={() => handleApply('highlight')}
            className="px-2.5 py-1 flex items-center gap-1.5 hover:bg-neutral-800 text-white transition-colors"
            title={`Highlight selected text in ${HIGHLIGHT_COLOR_MAP[activeColor].label}`}
          >
            <span
              className="w-2.5 h-2.5 rounded-full border border-black/40"
              style={{ backgroundColor: HIGHLIGHT_COLOR_MAP[activeColor].bg }}
            />
            <span className="font-bold">HIGHLIGHT</span>
          </button>

          {/* Color Selector Dropdown Trigger */}
          <div className="relative border-l border-neutral-800">
            <button
              type="button"
              onClick={() => setIsColorPickerOpen(!isColorPickerOpen)}
              className="px-1.5 py-1 text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
              title="Select Highlight Color"
            >
              <Palette className="w-3.5 h-3.5" />
            </button>

            {isColorPickerOpen && (
              <div 
                className="absolute top-full left-0 mt-1 z-30 bg-neutral-900 border border-neutral-700 rounded shadow-xl p-2 flex flex-col gap-1.5 min-w-[140px]"
                onMouseLeave={() => setIsColorPickerOpen(false)}
              >
                <div className="text-[9px] text-neutral-400 font-bold uppercase pb-1 border-b border-neutral-800">
                  Highlight Color
                </div>
                {(Object.keys(HIGHLIGHT_COLOR_MAP) as HighlightColor[]).map((col) => {
                  const cfg = HIGHLIGHT_COLOR_MAP[col];
                  return (
                    <button
                      key={col}
                      type="button"
                      onClick={() => {
                        setActiveColor(col);
                        setIsColorPickerOpen(false);
                        cyberAudio.playCyberClick();
                        handleApply('highlight');
                      }}
                      className={`flex items-center gap-2 px-2 py-1 rounded text-[11px] text-left hover:bg-neutral-800 ${
                        activeColor === col ? 'font-bold text-white bg-neutral-800/80' : 'text-neutral-300'
                      }`}
                    >
                      <span className="w-3 h-3 rounded-full shrink-0 border border-black/50" style={{ backgroundColor: cfg.bg }} />
                      <span>{cfg.label}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Underline Button */}
        <button
          type="button"
          onClick={() => handleApply('underline')}
          className="px-2 py-1 rounded bg-neutral-950 border border-neutral-800 hover:border-neutral-700 hover:text-white text-neutral-300 flex items-center gap-1 transition-colors"
          title="Underline selected text"
        >
          <UnderlineIcon className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">UNDERLINE</span>
        </button>

        {/* Strikethrough Button */}
        <button
          type="button"
          onClick={() => handleApply('strikethrough')}
          className="px-2 py-1 rounded bg-neutral-950 border border-neutral-800 hover:border-neutral-700 hover:text-white text-neutral-300 flex items-center gap-1 transition-colors"
          title="Strike-through selected text"
        >
          <StrikeIcon className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">STRIKE</span>
        </button>

        {/* Clear Annotations on Selection */}
        <button
          type="button"
          onClick={handleClearSelection}
          className="px-2 py-1 rounded bg-neutral-950 border border-neutral-800 hover:border-neutral-700 hover:text-neutral-200 text-neutral-400 flex items-center gap-1 transition-colors"
          title="Remove highlights or formatting from selection"
        >
          <Eraser className="w-3.5 h-3.5 text-neutral-400" />
          <span className="hidden sm:inline">CLEAR</span>
        </button>
      </div>

      {/* Right: Low-Confidence OCR Text Highlighter & Verification Navigator */}
      <div className="flex items-center gap-2 shrink-0 max-md:flex-nowrap">
        {/* Toggle Switch */}
        <button
          type="button"
          onClick={() => {
            cyberAudio.playCyberClick();
            toggleLowConfidenceHighlight();
          }}
          className={`px-2.5 py-1 rounded border flex items-center gap-1.5 transition-all ${
            isLowConfidenceHighlightEnabled
              ? 'bg-amber-500/20 border-amber-500 text-amber-300 shadow-[0_0_10px_rgba(245,158,11,0.25)] font-bold'
              : 'bg-neutral-950 border-neutral-800 text-neutral-500 hover:border-neutral-700'
          }`}
          title="Toggle low-certainty OCR word highlights in document"
        >
          <AlertTriangle className={`w-3.5 h-3.5 ${isLowConfidenceHighlightEnabled ? 'text-amber-400 animate-pulse' : 'text-neutral-500'}`} />
          <span>LOW-CONFIDENCE OCR:</span>
          <span className={isLowConfidenceHighlightEnabled ? 'text-white' : 'text-neutral-500'}>
            {isLowConfidenceHighlightEnabled ? 'ON' : 'OFF'}
          </span>
          {isLowConfidenceHighlightEnabled && (
            <span className="ml-1 px-1.5 py-0.2 rounded bg-amber-500/40 text-[10px] text-amber-200 font-mono">
              {unverifiedFlags.length}
            </span>
          )}
        </button>

        {/* Flag Inspector / Navigation (Only when enabled and flags exist) */}
        {isLowConfidenceHighlightEnabled && unverifiedFlags.length > 0 && (
          <div className="flex items-center gap-1 bg-black border border-amber-500/40 rounded p-0.5">
            <button
              type="button"
              onClick={() => scrollToFlag(activeFlagIndex - 1)}
              className="p-1 text-neutral-400 hover:text-white rounded hover:bg-neutral-800"
              title="Previous low-confidence flag"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={() => scrollToFlag(activeFlagIndex)}
              className="px-1.5 py-0.5 text-[11px] text-amber-300 font-bold hover:underline"
              title="Click to jump to active flag in document"
            >
              FLAG {activeFlagIndex + 1}/{unverifiedFlags.length}
            </button>

            <button
              type="button"
              onClick={() => scrollToFlag(activeFlagIndex + 1)}
              className="p-1 text-neutral-400 hover:text-white rounded hover:bg-neutral-800"
              title="Next low-confidence flag"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>

            {/* Quick Accept Current Button */}
            {currentFlag && (
              <button
                type="button"
                onClick={handleAcceptCurrent}
                className="px-2 py-0.5 rounded bg-emerald-950/80 border border-emerald-500/50 hover:bg-emerald-900 text-emerald-300 text-[10px] flex items-center gap-1 font-bold ml-1 transition-colors"
                title={`Verify "${currentFlag.originalWord}" as correct`}
              >
                <Check className="w-3 h-3" />
                <span>ACCEPT</span>
              </button>
            )}

            {/* Quick Edit Current Button */}
            {currentFlag && (
              <button
                type="button"
                onClick={handleStartCorrection}
                className="px-2 py-0.5 rounded bg-neutral-900 border border-neutral-700 hover:border-amber-400 text-neutral-300 hover:text-white text-[10px] flex items-center gap-1 ml-0.5 transition-colors"
                title={`Correct "${currentFlag.originalWord}"`}
              >
                <Edit2 className="w-3 h-3 text-amber-400" />
                <span className="hidden md:inline">FIX</span>
              </button>
            )}

            {/* Verify All Button */}
            <button
              type="button"
              onClick={() => {
                cyberAudio.playSuccessChime();
                verifyAllFlags();
                onContentChange?.();
              }}
              className="px-2 py-0.5 rounded bg-neutral-900 border border-neutral-800 hover:border-emerald-500 text-neutral-400 hover:text-emerald-400 text-[10px] flex items-center gap-1 ml-1"
              title="Mark all flagged OCR segments as verified"
            >
              <CheckCheck className="w-3 h-3" />
              <span className="hidden lg:inline">VERIFY ALL</span>
            </button>
          </div>
        )}

        {/* All Verified Pill */}
        {isLowConfidenceHighlightEnabled && unverifiedFlags.length === 0 && lowConfidenceFlags.length > 0 && (
          <div className="px-2.5 py-1 rounded bg-emerald-950/40 border border-emerald-500/50 text-emerald-400 text-[10px] flex items-center gap-1.5 font-bold">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>ALL OCR TOKENS VERIFIED</span>
          </div>
        )}
      </div>

      {/* Inline Fix Modal Popup for Ambiguous Character */}
      {editingFlagId && currentFlag && (
        <div className="w-full mt-2 pt-2 border-t border-neutral-800 flex flex-wrap items-center justify-between gap-2 bg-neutral-950/90 p-2.5 rounded text-xs animate-in fade-in">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
            <span className="text-neutral-400">
              Certainty: <strong className="text-amber-300">{currentFlag.certaintyScore}%</strong> &bull; Reason: {currentFlag.reason}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-neutral-400">Replace with:</span>
            <input
              type="text"
              value={correctionInput}
              onChange={(e) => setCorrectionInput(e.target.value)}
              className="bg-black border border-amber-500/70 text-white px-2 py-1 rounded text-xs font-mono outline-none focus:ring-1 focus:ring-amber-400 w-36"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSaveCorrection();
                if (e.key === 'Escape') setEditingFlagId(null);
              }}
            />
            <button
              type="button"
              onClick={handleSaveCorrection}
              className="px-2.5 py-1 bg-amber-500 hover:bg-amber-400 text-black font-bold rounded text-xs transition-colors"
            >
              APPLY FIX
            </button>
            <button
              type="button"
              onClick={() => setEditingFlagId(null)}
              className="px-2 py-1 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded text-xs transition-colors"
            >
              CANCEL
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
// ===== END NEW CODE: ANNOTATION TOOLBAR WITH OCR LOW-CONFIDENCE HIGHLIGHTER =====
