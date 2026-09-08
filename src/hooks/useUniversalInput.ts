import { useEffect } from 'react';
import { useInputStore } from '../store/useInputStore.ts';
import { useGameStore } from '../store/useGameStore.ts';
import { cyberAudio } from '../utils/audioSynth.ts';

// ===== START NEW CODE: UNIVERSAL INPUT BRIDGE (PC / MOBILE / CONSOLE) =====
export function useUniversalInput() {
  const { 
    config, 
    setGamepadConnected, 
    setActiveActionKey, 
    setDevice 
  } = useInputStore();
  
  const { 
    viewMode, 
    setViewMode, 
    openExportModal, 
    openSettings, 
    status, 
    result 
  } = useGameStore();

  // 1. PC KEYBOARD LISTENER
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore when typing in text inputs
      if (
        document.activeElement?.tagName === 'INPUT' ||
        document.activeElement?.tagName === 'TEXTAREA' ||
        (document.activeElement as HTMLElement)?.isContentEditable
      ) {
        return;
      }

      setDevice('pc');
      setActiveActionKey(e.code);

      // Key 1, 2, 3, 4: Quick View Switching
      if (e.key === '1') {
        setViewMode('split');
        cyberAudio.playCyberClick();
      } else if (e.key === '2') {
        setViewMode('doc_only');
        cyberAudio.playCyberClick();
      } else if (e.key === '3') {
        setViewMode('pdf_only');
        cyberAudio.playCyberClick();
      } else if (e.key === '4') {
        setViewMode('code');
        cyberAudio.playCyberClick();
      }

      // Quick export modal toggle
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'e') {
        e.preventDefault();
        openExportModal(true);
        cyberAudio.playButtonAction();
      }

      // Quick settings toggle
      if (e.key === 'F2' || e.key === '`') {
        openSettings(true);
        cyberAudio.playCyberClick();
      }
    };

    const handleKeyUp = () => {
      setActiveActionKey(null);
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [openExportModal, openSettings, setActiveActionKey, setDevice, setViewMode]);

  // 2. CONSOLE GAMEPAD API LISTENER
  useEffect(() => {
    let animationFrameId: number;

    const handleGamepadConnected = (e: GamepadEvent) => {
      setGamepadConnected(true, e.gamepad.id);
      setDevice('console');
      cyberAudio.playSuccessChime();
    };

    const handleGamepadDisconnected = () => {
      setGamepadConnected(false, '');
    };

    window.addEventListener('gamepadconnected', handleGamepadConnected);
    window.addEventListener('gamepaddisconnected', handleGamepadDisconnected);

    // Gamepad polling loop
    const pollGamepad = () => {
      const gamepads = navigator.getGamepads ? navigator.getGamepads() : [];
      const gp = gamepads[0];

      if (gp) {
        // Button A (Index 0) -> Action/Export
        if (gp.buttons[0]?.pressed && result) {
          openExportModal(true);
          cyberAudio.playButtonAction();
        }
        // Button B (Index 1) -> Close modal / back
        if (gp.buttons[1]?.pressed) {
          openExportModal(false);
          openSettings(false);
        }
        // LB / RB (Buttons 4 and 5) -> Cycle view modes
        if (gp.buttons[4]?.pressed) {
          if (viewMode === 'doc_only') setViewMode('split');
          else if (viewMode === 'code') setViewMode('doc_only');
        }
        if (gp.buttons[5]?.pressed) {
          if (viewMode === 'split') setViewMode('doc_only');
          else if (viewMode === 'doc_only') setViewMode('code');
        }
      }

      animationFrameId = requestAnimationFrame(pollGamepad);
    };

    animationFrameId = requestAnimationFrame(pollGamepad);

    return () => {
      window.removeEventListener('gamepadconnected', handleGamepadConnected);
      window.removeEventListener('gamepaddisconnected', handleGamepadDisconnected);
      cancelAnimationFrame(animationFrameId);
    };
  }, [openExportModal, openSettings, result, setDevice, setGamepadConnected, setViewMode, viewMode]);

  // 3. Haptic feedback support
  const triggerHaptic = (ms: number = 20) => {
    if (config.hapticFeedback && typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(ms);
    }
  };

  return { triggerHaptic };
}
// ===== END NEW CODE: UNIVERSAL INPUT BRIDGE (PC / MOBILE / CONSOLE) =====
