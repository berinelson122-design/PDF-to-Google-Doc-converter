import { useEffect, useState } from 'react';
import { useGameStore } from '../store/useGameStore.ts';
import { cyberAudio } from '../utils/audioSynth.ts';

// ===== START NEW CODE: GLOBAL KEYBOARD SHORTCUT HOOK (CTRL+S, CTRL+E, CTRL+U) =====

export interface ShortcutNotification {
  id: string;
  message: string;
  combo: string;
  timestamp: number;
}

export function useGlobalShortcuts() {
  const {
    saveDraftToStorage,
    openExportModal,
    resetConversion,
    result,
    editedHtml,
    addToHistory,
    currentPdf,
    toggleShortcutsModal,
    isShortcutsModalOpen,
    setIsShortcutsModalOpen,
    toggleDocHighContrast,
    toggleFullscreen,
    toggleAppTheme,
    setIsTranslationModalOpen,
    isTranslationModalOpen,
    toggleTTSPlayer,
    toggleCustomTableMapping,
    openExportModal: setExportModal,
    openSettings,
    openPricingModal,
  } = useGameStore();

  const [activeNotification, setActiveNotification] = useState<ShortcutNotification | null>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const isInput = target && (
        target.tagName === 'INPUT' || 
        target.tagName === 'TEXTAREA' || 
        target.isContentEditable
      );

      const isModifierPressed = e.ctrlKey || e.metaKey;
      const key = e.key.toLowerCase();

      // 1. HELP OVERLAY TRIGGER: '?' (Shift + /) or F1 or Ctrl+/ or Cmd+/ or Ctrl+Shift+K
      if ((e.key === '?' && !isInput) || e.key === 'F1' || (isModifierPressed && e.key === '/') || (isModifierPressed && e.shiftKey && key === 'k')) {
        e.preventDefault();
        toggleShortcutsModal();
        cyberAudio.playButtonAction();
        setActiveNotification({
          id: String(Date.now()),
          combo: 'HOTKEY HELP [?]',
          message: isShortcutsModalOpen ? 'KEYBOARD SHORTCUTS OVERLAY CLOSED' : 'KEYBOARD SHORTCUTS MATRIX ACTIVE',
          timestamp: Date.now(),
        });
        return;
      }

      // 2. ESCAPE KEY: Close active overlay or modal
      if (e.key === 'Escape') {
        if (isShortcutsModalOpen) {
          setIsShortcutsModalOpen(false);
          cyberAudio.playCyberClick();
        }
        return;
      }

      // MODIFIER SHORTCUTS (Ctrl / Cmd)
      if (isModifierPressed) {
        // Ctrl+S / Cmd+S -> Save current edit snapshot
        if (key === 's' && !e.shiftKey) {
          e.preventDefault();
          saveDraftToStorage();

          if (result && (editedHtml || result.htmlContent)) {
            addToHistory({
              id: 'snapshot_' + Date.now(),
              title: `${result.documentTitle || currentPdf?.name || 'Document'} (Manual Snapshot)`,
              originalFileName: currentPdf?.name || `${result.documentTitle}.pdf`,
              fileSize: currentPdf?.size || 1024,
              timestamp: Date.now(),
              pageCount: result.stats.pages || 1,
              tablesCount: result.detectedElements?.tablesCount || 0,
              headingsCount: result.detectedElements?.headingsCount || 0,
              htmlContent: editedHtml || result.htmlContent,
              markdownContent: result.markdownContent,
              fidelityScore: result.stats.fidelityScore || 98,
              status: 'success',
            });
          }

          cyberAudio.playSuccessChime();
          setActiveNotification({
            id: String(Date.now()),
            combo: 'CTRL + S',
            message: 'DRAFT & HISTORY SNAPSHOT COMMITTED',
            timestamp: Date.now(),
          });
        }

        // Ctrl+E / Cmd+E -> Open Export Modal
        else if (key === 'e' && !e.shiftKey) {
          e.preventDefault();
          openExportModal(true);
          cyberAudio.playButtonAction();
          setActiveNotification({
            id: String(Date.now()),
            combo: 'CTRL + E',
            message: 'LAUNCHING EXPORT MATRIX PROTOCOL',
            timestamp: Date.now(),
          });
        }

        // Ctrl+U / Cmd+U -> Trigger New PDF Ingestion
        else if (key === 'u' && !e.shiftKey) {
          e.preventDefault();
          resetConversion();
          cyberAudio.playCyberClick();

          setTimeout(() => {
            const fileInput = document.getElementById('single-pdf-input') as HTMLInputElement | null;
            if (fileInput) {
              fileInput.click();
            }
          }, 80);

          setActiveNotification({
            id: String(Date.now()),
            combo: 'CTRL + U',
            message: 'INITIALIZING NEW PDF INGESTION PIPELINE',
            timestamp: Date.now(),
          });
        }

        // Ctrl+Shift+H / Cmd+Shift+H -> Toggle High Contrast Mode
        else if (e.shiftKey && key === 'h') {
          e.preventDefault();
          toggleDocHighContrast();
          cyberAudio.playButtonAction();
          setActiveNotification({
            id: String(Date.now()),
            combo: 'CTRL + SHIFT + H',
            message: 'ACCESSIBILITY HIGH CONTRAST MODE TOGGLED',
            timestamp: Date.now(),
          });
        }

        // Ctrl+Shift+F / Cmd+Shift+F -> Toggle Fullscreen Distraction-Free Mode
        else if (e.shiftKey && key === 'f') {
          e.preventDefault();
          toggleFullscreen();
          cyberAudio.playButtonAction();
          setActiveNotification({
            id: String(Date.now()),
            combo: 'CTRL + SHIFT + F',
            message: 'FULLSCREEN DISTRACTION-FREE WORKSPACE TOGGLED',
            timestamp: Date.now(),
          });
        }

        // Ctrl+Shift+L / Cmd+Shift+L -> Toggle App Theme
        else if (e.shiftKey && key === 'l') {
          e.preventDefault();
          toggleAppTheme();
          cyberAudio.playButtonAction();
          setActiveNotification({
            id: String(Date.now()),
            combo: 'CTRL + SHIFT + L',
            message: 'APPLICATION THEME SWITCHED',
            timestamp: Date.now(),
          });
        }

        // Ctrl+Shift+T / Cmd+Shift+T -> Document Translation
        else if (e.shiftKey && key === 't') {
          e.preventDefault();
          setIsTranslationModalOpen(!isTranslationModalOpen);
          cyberAudio.playButtonAction();
          setActiveNotification({
            id: String(Date.now()),
            combo: 'CTRL + SHIFT + T',
            message: 'AI TRANSLATION MATRIX LAUNCHED',
            timestamp: Date.now(),
          });
        }

        // Ctrl+Shift+P / Cmd+Shift+P -> Text-To-Speech
        else if (e.shiftKey && key === 'p') {
          e.preventDefault();
          toggleTTSPlayer();
          cyberAudio.playButtonAction();
          setActiveNotification({
            id: String(Date.now()),
            combo: 'CTRL + SHIFT + P',
            message: 'TEXT-TO-SPEECH AUDIO READER TOGGLED',
            timestamp: Date.now(),
          });
        }

        // Ctrl+Shift+M / Cmd+Shift+M -> Table Column Mapper
        else if (e.shiftKey && key === 'm') {
          e.preventDefault();
          toggleCustomTableMapping();
          cyberAudio.playButtonAction();
          setActiveNotification({
            id: String(Date.now()),
            combo: 'CTRL + SHIFT + M',
            message: 'MULTI-PAGE TABLE COLUMN MAPPER TOGGLED',
            timestamp: Date.now(),
          });
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    saveDraftToStorage,
    openExportModal,
    resetConversion,
    result,
    editedHtml,
    addToHistory,
    currentPdf,
    toggleShortcutsModal,
    isShortcutsModalOpen,
    setIsShortcutsModalOpen,
    toggleDocHighContrast,
    toggleFullscreen,
    toggleAppTheme,
    setIsTranslationModalOpen,
    isTranslationModalOpen,
    toggleTTSPlayer,
    toggleCustomTableMapping,
    openSettings,
    openPricingModal,
  ]);

  // Auto-clear active notification after 2.5s
  useEffect(() => {
    if (!activeNotification) return;
    const timer = setTimeout(() => {
      setActiveNotification(null);
    }, 2500);
    return () => clearTimeout(timer);
  }, [activeNotification]);

  return {
    activeNotification,
    clearNotification: () => setActiveNotification(null),
  };
}
// ===== END NEW CODE: GLOBAL KEYBOARD SHORTCUT HOOK (CTRL+S, CTRL+E, CTRL+U) =====
