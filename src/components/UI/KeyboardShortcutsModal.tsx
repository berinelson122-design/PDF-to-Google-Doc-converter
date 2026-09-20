import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  Keyboard, 
  Search, 
  Zap, 
  FileText, 
  Eye, 
  Globe, 
  Volume2, 
  Table, 
  Sliders, 
  Maximize2, 
  Sun, 
  Moon, 
  Copy, 
  Check, 
  Play, 
  Sparkles,
  Cpu,
  Smartphone,
  Monitor
} from 'lucide-react';
import { useGameStore } from '../../store/useGameStore.ts';
import { cyberAudio } from '../../utils/audioSynth.ts';
import { CyberButton } from '../common/CyberButton.tsx';

// ===== START NEW CODE: GLOBAL KEYBOARD SHORTCUTS HELP OVERLAY =====

interface ShortcutDefinition {
  id: string;
  category: 'INGESTION & EXPORT' | 'VIEWPORT & ACCESSIBILITY' | 'INTELLIGENCE & TOOLS' | 'SYSTEM & HELP';
  keys: string[];
  title: string;
  description: string;
  actionKey: string;
}

export function KeyboardShortcutsModal() {
  const {
    isShortcutsModalOpen,
    setIsShortcutsModalOpen,
    saveDraftToStorage,
    openExportModal,
    resetConversion,
    toggleDocHighContrast,
    toggleFullscreen,
    toggleAppTheme,
    setIsTranslationModalOpen,
    toggleTTSPlayer,
    toggleCustomTableMapping,
    toggleOcrSettingsDrawer,
    appTheme,
  } = useGameStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [copiedSuccess, setCopiedSuccess] = useState(false);

  if (!isShortcutsModalOpen) return null;

  const SHORTCUTS: ShortcutDefinition[] = [
    {
      id: 'upload_pdf',
      category: 'INGESTION & EXPORT',
      keys: ['Ctrl', 'U'],
      title: 'Ingest New PDF',
      description: 'Reset current session and initialize single PDF upload pipeline',
      actionKey: 'upload',
    },
    {
      id: 'save_draft',
      category: 'INGESTION & EXPORT',
      keys: ['Ctrl', 'S'],
      title: 'Save Draft & Snapshot',
      description: 'Commit manual snapshot to conversion history & local storage',
      actionKey: 'save',
    },
    {
      id: 'export_doc',
      category: 'INGESTION & EXPORT',
      keys: ['Ctrl', 'E'],
      title: 'Launch Export Matrix',
      description: 'Open export modal for Google Docs, Word (.docx), or PDF output',
      actionKey: 'export',
    },
    {
      id: 'high_contrast',
      category: 'VIEWPORT & ACCESSIBILITY',
      keys: ['Ctrl', 'Shift', 'H'],
      title: 'Toggle High Contrast',
      description: 'Switch document preview into high-visibility accessibility mode',
      actionKey: 'contrast',
    },
    {
      id: 'fullscreen_mode',
      category: 'VIEWPORT & ACCESSIBILITY',
      keys: ['Ctrl', 'Shift', 'F'],
      title: 'Toggle Fullscreen Workspace',
      description: 'Enter or exit distraction-free document editor view',
      actionKey: 'fullscreen',
    },
    {
      id: 'toggle_theme',
      category: 'VIEWPORT & ACCESSIBILITY',
      keys: ['Ctrl', 'Shift', 'L'],
      title: 'Switch App Theme',
      description: 'Toggle between Cyberpunk Dark and Clean Light visual modes',
      actionKey: 'theme',
    },
    {
      id: 'translate_doc',
      category: 'INTELLIGENCE & TOOLS',
      keys: ['Ctrl', 'Shift', 'T'],
      title: 'AI Document Translator',
      description: 'Launch multi-language translation matrix for full documents',
      actionKey: 'translate',
    },
    {
      id: 'tts_audio',
      category: 'INTELLIGENCE & TOOLS',
      keys: ['Ctrl', 'Shift', 'P'],
      title: 'Text-To-Speech Reader',
      description: 'Start or toggle Web Speech API audio narration player',
      actionKey: 'tts',
    },
    {
      id: 'table_mapper',
      category: 'INTELLIGENCE & TOOLS',
      keys: ['Ctrl', 'Shift', 'M'],
      title: 'Table Column Mapper',
      description: 'Define custom column headers and alignment for multi-page tables',
      actionKey: 'table_map',
    },
    {
      id: 'ocr_settings',
      category: 'INTELLIGENCE & TOOLS',
      keys: ['Ctrl', 'Shift', 'O'],
      title: 'OCR & Language Engine',
      description: 'Configure OCR character resolution, script type, and Bidi text rules',
      actionKey: 'ocr',
    },
    {
      id: 'help_overlay',
      category: 'SYSTEM & HELP',
      keys: ['?'],
      title: 'Toggle Shortcuts Overlay',
      description: 'Display or hide this global keyboard shortcuts HUD modal',
      actionKey: 'help',
    },
    {
      id: 'escape_close',
      category: 'SYSTEM & HELP',
      keys: ['Esc'],
      title: 'Close Active Modal',
      description: 'Dismiss overlay, modal window, or active fullscreen prompt',
      actionKey: 'escape',
    },
  ];

  const handleExecuteShortcut = (shortcut: ShortcutDefinition) => {
    cyberAudio.playButtonAction();
    switch (shortcut.actionKey) {
      case 'upload':
        setIsShortcutsModalOpen(false);
        resetConversion();
        setTimeout(() => {
          const input = document.getElementById('single-pdf-input') as HTMLInputElement | null;
          if (input) input.click();
        }, 100);
        break;
      case 'save':
        saveDraftToStorage();
        setIsShortcutsModalOpen(false);
        break;
      case 'export':
        setIsShortcutsModalOpen(false);
        openExportModal(true);
        break;
      case 'contrast':
        toggleDocHighContrast();
        break;
      case 'fullscreen':
        toggleFullscreen();
        setIsShortcutsModalOpen(false);
        break;
      case 'theme':
        toggleAppTheme();
        break;
      case 'translate':
        setIsShortcutsModalOpen(false);
        setIsTranslationModalOpen(true);
        break;
      case 'tts':
        setIsShortcutsModalOpen(false);
        toggleTTSPlayer();
        break;
      case 'table_map':
        setIsShortcutsModalOpen(false);
        toggleCustomTableMapping();
        break;
      case 'ocr':
        setIsShortcutsModalOpen(false);
        toggleOcrSettingsDrawer();
        break;
      case 'escape':
        setIsShortcutsModalOpen(false);
        break;
      default:
        break;
    }
  };

  const handleCopyShortcuts = () => {
    cyberAudio.playSuccessChime();
    const summaryText = SHORTCUTS.map(s => `${s.keys.join(' + ')} : ${s.title} - ${s.description}`).join('\n');
    navigator.clipboard.writeText(summaryText);
    setCopiedSuccess(true);
    setTimeout(() => setCopiedSuccess(false), 2000);
  };

  const filteredShortcuts = SHORTCUTS.filter(s => 
    s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.keys.join(' ').toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const categories = ['INGESTION & EXPORT', 'VIEWPORT & ACCESSIBILITY', 'INTELLIGENCE & TOOLS', 'SYSTEM & HELP'] as const;

  return (
    <AnimatePresence>
      <div 
        id="shortcuts-overlay-backdrop"
        className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto font-mono"
        onClick={() => {
          cyberAudio.playCyberClick();
          setIsShortcutsModalOpen(false);
        }}
      >
        <motion.div
          id="shortcuts-overlay-modal"
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.2 }}
          onClick={(e) => e.stopPropagation()}
          className={`w-full max-w-4xl max-h-[90vh] rounded-lg border flex flex-col shadow-2xl overflow-hidden relative ${
            appTheme === 'light'
              ? 'bg-white text-neutral-900 border-neutral-300 shadow-[0_0_40px_rgba(0,0,0,0.2)]'
              : 'bg-[#0A0A0F] text-white border-[#FF003C]/60 shadow-[0_0_50px_rgba(255,0,60,0.3)]'
          }`}
        >
          {/* Header Bar */}
          <div className={`p-4 md:p-6 border-b flex items-center justify-between gap-4 ${
            appTheme === 'light' ? 'border-neutral-200 bg-neutral-50' : 'border-neutral-800 bg-[#0F0F16]'
          }`}>
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded bg-[#FF003C]/20 border border-[#FF003C]/50 text-[#FF003C]">
                <Keyboard className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base md:text-xl font-bold uppercase tracking-wider text-white">
                    GLOBAL KEYBOARD SHORTCUTS MATRIX
                  </h2>
                  <span className="text-[10px] px-2 py-0.5 rounded font-bold uppercase bg-[#FF003C] text-white">
                    SYSTEM OVERLAY
                  </span>
                </div>
                <p className="text-xs text-neutral-400 mt-0.5">
                  Press <kbd className="px-1.5 py-0.5 bg-neutral-800 border border-neutral-700 text-amber-300 rounded font-bold">?</kbd> or <kbd className="px-1.5 py-0.5 bg-neutral-800 border border-neutral-700 text-amber-300 rounded font-bold">F1</kbd> anywhere to toggle this menu.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCopyShortcuts}
                className={`px-3 py-1.5 rounded text-xs font-bold flex items-center gap-1.5 border transition-all ${
                  copiedSuccess 
                    ? 'bg-emerald-500 text-black border-emerald-400' 
                    : 'bg-neutral-900 text-neutral-300 border-neutral-700 hover:text-white hover:border-[#FF003C]'
                }`}
              >
                {copiedSuccess ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span className="hidden sm:inline">{copiedSuccess ? 'COPIED!' : 'COPY ALL'}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  cyberAudio.playCyberClick();
                  setIsShortcutsModalOpen(false);
                }}
                className="p-2 rounded-full hover:bg-neutral-800 text-neutral-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Search Bar & Device Modes Toggle */}
          <div className={`p-4 border-b flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 ${
            appTheme === 'light' ? 'border-neutral-200 bg-neutral-100' : 'border-neutral-800 bg-[#050508]'
          }`}>
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Filter shortcuts (e.g. Save, Export, High Contrast, Ctrl)..."
                className="w-full bg-black border border-neutral-700 focus:border-[#FF003C] text-white text-xs pl-9 pr-4 py-2 rounded outline-none font-mono"
              />
            </div>

            {/* Device Specific Controls Label */}
            <div className="flex items-center gap-3 text-[11px] text-neutral-400 shrink-0">
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-neutral-900 border border-neutral-800 text-neutral-300">
                <Monitor className="w-3.5 h-3.5 text-cyan-400" />
                <span>PC: Cmd / Ctrl + Key</span>
              </div>
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-neutral-900 border border-neutral-800 text-neutral-300">
                <Smartphone className="w-3.5 h-3.5 text-purple-400" />
                <span>Mobile: Tap Overlay Icons</span>
              </div>
            </div>
          </div>

          {/* Shortcuts Grid List */}
          <div className="p-4 md:p-6 flex-1 overflow-y-auto space-y-6">
            {categories.map((category) => {
              const categoryItems = filteredShortcuts.filter(s => s.category === category);
              if (categoryItems.length === 0) return null;

              return (
                <div key={category} className="space-y-3">
                  <div className="flex items-center gap-2 pb-1.5 border-b border-neutral-800 text-xs font-bold text-[#FF003C] tracking-wider uppercase">
                    <Zap className="w-3.5 h-3.5" />
                    <span>{category}</span>
                    <span className="text-[10px] text-neutral-500 font-normal">({categoryItems.length} shortcuts)</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {categoryItems.map((shortcut) => (
                      <div
                        key={shortcut.id}
                        className={`p-3.5 rounded-md border flex items-center justify-between gap-3 transition-all ${
                          appTheme === 'light'
                            ? 'bg-neutral-50 border-neutral-200 hover:border-neutral-400'
                            : 'bg-black/60 border-neutral-800 hover:border-[#FF003C]/50 hover:bg-[#101018]'
                        }`}
                      >
                        <div className="space-y-1 min-w-0 flex-1">
                          <div className="text-xs font-bold text-white flex items-center gap-2">
                            <span>{shortcut.title}</span>
                          </div>
                          <div className="text-[11px] text-neutral-400 line-clamp-1">
                            {shortcut.description}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          {/* Key Combination Pills */}
                          <div className="flex items-center gap-1">
                            {shortcut.keys.map((key, kIdx) => (
                              <React.Fragment key={kIdx}>
                                <kbd className="px-2 py-1 rounded text-xs font-mono font-bold bg-neutral-900 border border-neutral-700 text-amber-300 shadow-sm">
                                  {key}
                                </kbd>
                                {kIdx < shortcut.keys.length - 1 && (
                                  <span className="text-neutral-600 font-bold text-xs">+</span>
                                )}
                              </React.Fragment>
                            ))}
                          </div>

                          {/* Trigger Action Button */}
                          <button
                            type="button"
                            onClick={() => handleExecuteShortcut(shortcut)}
                            title={`Execute ${shortcut.title}`}
                            className="p-1.5 rounded bg-neutral-800 hover:bg-[#FF003C] text-neutral-300 hover:text-white border border-neutral-700 hover:border-[#FF003C] transition-all"
                          >
                            <Play className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}

            {filteredShortcuts.length === 0 && (
              <div className="p-12 text-center space-y-2 text-neutral-500">
                <Search className="w-8 h-8 mx-auto text-neutral-600" />
                <div className="text-sm font-bold text-neutral-300">NO MATCHING SHORTCUTS FOUND</div>
                <div className="text-xs">Try searching for "save", "export", "contrast", "translate", or "Ctrl"</div>
              </div>
            )}
          </div>

          {/* Footer Bar with Branding & Watermark */}
          <div className={`p-4 border-t flex flex-col sm:flex-row items-center justify-between gap-2 text-xs font-mono text-neutral-400 ${
            appTheme === 'light' ? 'border-neutral-200 bg-neutral-50' : 'border-neutral-800 bg-[#0A0A0E]'
          }`}>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>KEYBOARD SHORTCUTS MATRIX // LOW-LATENCY M2 OPTIMIZED</span>
            </div>

            <div className="text-[10px] text-[#E056FD] font-bold tracking-widest uppercase">
              ARCHITECT // VOID_WEAVER
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
// ===== END NEW CODE: GLOBAL KEYBOARD SHORTCUTS HELP OVERLAY =====
