import React from 'react';
import { HelpCircle, Keyboard } from 'lucide-react';
import { useGameStore } from '../../store/useGameStore.ts';
import { cyberAudio } from '../../utils/audioSynth.ts';

// ===== START NEW CODE: PERSISTENT FLOATING SHORTCUTS '?' OVERLAY TRIGGER =====

export function FloatingHelpButton() {
  const { toggleShortcutsModal, isFullscreen, appTheme } = useGameStore();

  return (
    <div 
      id="persistent-floating-help-container"
      className="fixed bottom-4 right-4 z-40 select-none group"
    >
      <button
        id="btn-floating-shortcuts-help"
        type="button"
        onClick={() => {
          cyberAudio.playButtonAction();
          toggleShortcutsModal();
        }}
        title="Global Keyboard Shortcuts (Press '?' or F1)"
        className={`px-3 py-2 rounded-full border shadow-lg flex items-center gap-2 font-mono text-xs font-bold transition-all duration-200 active:scale-95 ${
          appTheme === 'light'
            ? 'bg-white text-neutral-900 border-neutral-300 hover:border-[#FF003C] hover:shadow-[0_0_15px_rgba(255,0,60,0.3)]'
            : 'bg-[#0A0A0E] text-white border-neutral-800 hover:border-[#FF003C] hover:bg-[#121218] shadow-[0_0_20px_rgba(0,0,0,0.8)]'
        }`}
      >
        <div className="w-5 h-5 rounded-full bg-[#FF003C]/20 text-[#FF003C] border border-[#FF003C]/40 flex items-center justify-center text-xs font-extrabold shrink-0 group-hover:scale-110 transition-transform">
          ?
        </div>
        
        <span className="hidden md:inline uppercase tracking-wider text-[11px] text-neutral-300 group-hover:text-white">
          SHORTCUTS
        </span>

        <kbd className="hidden lg:inline-block px-1.5 py-0.5 rounded text-[10px] bg-neutral-900 border border-neutral-700 text-amber-300">
          ?
        </kbd>
      </button>

      {/* Hover Tooltip Card */}
      <div className="absolute bottom-full right-0 mb-2 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-200 bg-black/90 border border-[#FF003C]/60 text-white p-2.5 rounded shadow-xl text-[11px] font-mono whitespace-nowrap z-50">
        <div className="font-bold text-[#FF003C] flex items-center gap-1.5 uppercase">
          <Keyboard className="w-3.5 h-3.5" />
          <span>KEYBOARD SHORTCUTS MATRIX</span>
        </div>
        <div className="text-neutral-300 mt-1">
          Press <span className="text-amber-300 font-bold">?</span> or <span className="text-amber-300 font-bold">F1</span> to view all global hotkeys
        </div>
      </div>
    </div>
  );
}
// ===== END NEW CODE: PERSISTENT FLOATING SHORTCUTS '?' OVERLAY TRIGGER =====
