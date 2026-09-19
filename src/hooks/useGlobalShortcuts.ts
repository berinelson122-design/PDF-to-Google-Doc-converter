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
  } = useGameStore();

  const [activeNotification, setActiveNotification] = useState<ShortcutNotification | null>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isModifierPressed = e.ctrlKey || e.metaKey;
      if (!isModifierPressed) return;

      const key = e.key.toLowerCase();

      // 1. Fast Action: Ctrl+S / Cmd+S -> Save current edit to history & local storage
      if (key === 's') {
        e.preventDefault();
        saveDraftToStorage();

        // If there's an active converted document, capture a snapshot in history
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

      // 2. Fast Action: Ctrl+E / Cmd+E -> Open Export Modal
      else if (key === 'e') {
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

      // 3. Fast Action: Ctrl+U / Cmd+U -> Trigger New PDF Upload
      else if (key === 'u') {
        e.preventDefault();
        resetConversion();
        cyberAudio.playCyberClick();

        // Attempt to trigger single file input if available on DOM
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
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [saveDraftToStorage, openExportModal, resetConversion, result, editedHtml, addToHistory, currentPdf]);

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
