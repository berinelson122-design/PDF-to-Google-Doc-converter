import React from 'react';
import { Monitor, Smartphone, Gamepad2, Volume2, VolumeX, Vibrate, Sliders, Save } from 'lucide-react';
import { useInputStore } from '../../store/useInputStore.ts';
import { DeviceType } from '../../types/index.ts';
import { CyberButton } from '../common/CyberButton.tsx';
import { CyberModal } from '../common/CyberModal.tsx';
import { useGameStore } from '../../store/useGameStore.ts';

// ===== START NEW CODE: CROSS-DEVICE CONTROL SETTINGS (PC / MOBILE / CONSOLE) =====
export const ControlSettings: React.FC = () => {
  const { 
    isSettingsOpen, 
    openSettings, 
    isAutoSaveEnabled, 
    toggleAutoSaveDraft, 
    lastAutoSavedAt 
  } = useGameStore();
  const { 
    config, 
    setDevice, 
    toggleSound, 
    setSoundVolume, 
    toggleHaptic, 
    setVirtualJoystickOpacity, 
    setGamepadSensitivity,
    isGamepadConnected,
    gamepadName 
  } = useInputStore();

  return (
    <CyberModal
      isOpen={isSettingsOpen}
      onClose={() => openSettings(false)}
      title="SYSTEM_HARDWARE // CROSS-DEVICE CONTROL CALIBRATION"
      subtitle="OPTIMIZED FOR APPLE M2 SILICON & LOW-LATENCY INTERFACES"
      maxWidth="max-w-xl"
    >
      <div className="space-y-6">
        {/* Device Archetype Selector */}
        <div>
          <label className="block text-xs uppercase text-neutral-400 mb-2.5 font-bold tracking-wider">
            Active Hardware Mode
          </label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: 'pc' as DeviceType, label: 'PC / MAC', icon: <Monitor className="w-4 h-4" /> },
              { id: 'mobile' as DeviceType, label: 'MOBILE TOUCH', icon: <Smartphone className="w-4 h-4" /> },
              { id: 'console' as DeviceType, label: 'CONSOLE PAD', icon: <Gamepad2 className="w-4 h-4" /> },
            ].map((dev) => (
              <button
                key={dev.id}
                onClick={() => setDevice(dev.id)}
                className={`flex flex-col items-center justify-center p-3 rounded border text-xs font-mono transition-all ${
                  config.device === dev.id
                    ? 'border-[#FF003C] bg-[#FF003C]/10 text-white shadow-[0_0_12px_rgba(255,0,60,0.3)]'
                    : 'border-neutral-800 bg-neutral-900/60 text-neutral-400 hover:border-neutral-700'
                }`}
              >
                <div className={config.device === dev.id ? 'text-[#FF003C]' : 'text-neutral-500'}>
                  {dev.icon}
                </div>
                <span className="mt-2 font-bold">{dev.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Device Specific Settings */}
        {config.device === 'pc' && (
          <div className="p-4 border border-neutral-800 bg-neutral-950 rounded space-y-2.5">
            <div className="flex items-center gap-2 text-[#FF003C] text-xs font-bold uppercase">
              <Monitor className="w-4 h-4" /> PC Tactical Hotkeys
            </div>
            <div className="grid grid-cols-2 gap-2 text-[11px] text-neutral-400">
              <div className="flex justify-between py-1 border-b border-neutral-900">
                <span>Split Inspection</span> <kbd className="text-[#FF003C] font-bold">1</kbd>
              </div>
              <div className="flex justify-between py-1 border-b border-neutral-900">
                <span>Google Doc Only</span> <kbd className="text-[#FF003C] font-bold">2</kbd>
              </div>
              <div className="flex justify-between py-1 border-b border-neutral-900">
                <span>PDF Blueprint</span> <kbd className="text-[#FF003C] font-bold">3</kbd>
              </div>
              <div className="flex justify-between py-1 border-b border-neutral-900">
                <span>Direct Export Modal</span> <kbd className="text-[#FF003C] font-bold">Ctrl+E</kbd>
              </div>
            </div>
          </div>
        )}

        {/* ===== START NEW CODE: MOBILE TOUCHSCREEN CALIBRATION (NO JOYSTICK) ===== */}
        {config.device === 'mobile' && (
          <div className="p-4 border border-neutral-800 bg-neutral-950 rounded space-y-3.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-[#E056FD] text-xs font-bold uppercase">
                <Smartphone className="w-4 h-4" /> Direct Touchscreen Calibration
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded border border-emerald-500/60 text-emerald-400 bg-emerald-950/40 font-mono">
                TOUCHSCREEN ACTIVE
              </span>
            </div>

            <div className="text-xs text-neutral-400 leading-relaxed font-mono space-y-2">
              <div className="flex items-center justify-between py-1 border-b border-neutral-900">
                <span>Native Swipe &amp; Pan</span>
                <span className="text-emerald-400 font-bold">ENABLED (DIRECT)</span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-neutral-900">
                <span>Multi-Touch Zoom</span>
                <span className="text-emerald-400 font-bold">100% RESPONSIVE</span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-neutral-900">
                <span>Touch Target Sizes</span>
                <span className="text-[#E056FD] font-bold">44PX+ ACCESSIBLE</span>
              </div>
              <div className="flex items-center justify-between py-1">
                <span>Virtual Joystick Overlay</span>
                <span className="text-neutral-500 font-bold">DISABLED (NATIVE TOUCH ONLY)</span>
              </div>
            </div>
          </div>
        )}
        {/* ===== END NEW CODE: MOBILE TOUCHSCREEN CALIBRATION (NO JOYSTICK) ===== */}

        {config.device === 'console' && (
          <div className="p-4 border border-neutral-800 bg-neutral-950 rounded space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-[#FF003C] text-xs font-bold uppercase">
                <Gamepad2 className="w-4 h-4" /> Gamepad Uplink Status
              </div>
              <span className={`text-[10px] px-2 py-0.5 rounded border ${
                isGamepadConnected ? 'border-emerald-500 text-emerald-400 bg-emerald-950/40' : 'border-neutral-700 text-neutral-500'
              }`}>
                {isGamepadConnected ? `LINKED: ${gamepadName || 'CONTROLLER'}` : 'DISCONNECTED (STANDBY)'}
              </span>
            </div>
            <div>
              <div className="flex justify-between text-xs mb-1.5">
                <span className="text-neutral-400">Gamepad Stick Sensitivity</span>
                <span className="text-[#FF003C] font-mono">{config.gamepadSensitivity.toFixed(1)}x</span>
              </div>
              <input
                type="range"
                min="0.5"
                max="2.5"
                step="0.1"
                value={config.gamepadSensitivity}
                onChange={(e) => setGamepadSensitivity(parseFloat(e.target.value))}
                className="w-full accent-[#FF003C] bg-neutral-800"
              />
            </div>
          </div>
        )}

        {/* ===== START NEW CODE: DRAFT AUTO-SAVE TO LOCAL STORAGE TOGGLE ===== */}
        <div className="p-4 border border-neutral-800 bg-neutral-950 rounded space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold uppercase text-white">
              <Save className={`w-4 h-4 ${isAutoSaveEnabled ? 'text-emerald-400' : 'text-neutral-500'}`} />
              <span>Draft Auto-save (Local Storage)</span>
            </div>
            <button
              type="button"
              onClick={toggleAutoSaveDraft}
              className={`px-3 py-1.5 text-xs font-mono font-bold border rounded transition-all flex items-center gap-1.5 min-h-[44px] sm:min-h-0 ${
                isAutoSaveEnabled
                  ? 'border-emerald-500 text-emerald-400 bg-emerald-950/40 shadow-[0_0_10px_rgba(16,185,129,0.25)]'
                  : 'border-neutral-700 text-neutral-500 bg-neutral-900/60 hover:border-neutral-600'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${isAutoSaveEnabled ? 'bg-emerald-400 animate-pulse' : 'bg-neutral-600'}`} />
              {isAutoSaveEnabled ? 'ENABLED' : 'DISABLED'}
            </button>
          </div>

          <p className="text-[11px] text-neutral-400 leading-relaxed font-mono">
            Automatically caches active document edits, structural text changes, and table modifications to browser local storage periodically.
          </p>

          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-neutral-900 text-[10px] text-neutral-500 font-mono">
            <span className="flex items-center gap-1.5">
              <span className="text-neutral-400">INTERVAL:</span>
              <span className="text-[#E056FD] font-bold">3000ms PERIODIC TICK</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="text-neutral-400">TELEMETRY:</span>
              <span className={isAutoSaveEnabled ? 'text-emerald-400 font-bold' : 'text-neutral-600'}>
                {isAutoSaveEnabled
                  ? (lastAutoSavedAt ? `LAST SYNC: ${new Date(lastAutoSavedAt).toLocaleTimeString()}` : 'STANDBY // READY')
                  : 'AUTOSAVE PAUSED'}
              </span>
            </span>
          </div>
        </div>
        {/* ===== END NEW CODE: DRAFT AUTO-SAVE TO LOCAL STORAGE TOGGLE ===== */}

        {/* Global Feedback & Audio Bus */}
        <div className="space-y-3 pt-2 border-t border-neutral-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs text-neutral-300">
              {config.soundEnabled ? <Volume2 className="w-4 h-4 text-[#FF003C]" /> : <VolumeX className="w-4 h-4 text-neutral-500" />}
              <span>Web Audio Procedural Synthesis</span>
            </div>
            <button
              onClick={toggleSound}
              className={`px-3 py-1 text-xs font-mono border rounded ${
                config.soundEnabled ? 'border-[#FF003C] text-[#FF003C] bg-[#FF003C]/10' : 'border-neutral-800 text-neutral-600'
              }`}
            >
              {config.soundEnabled ? 'ACTIVE' : 'MUTED'}
            </button>
          </div>

          {config.soundEnabled && (
            <div>
              <div className="flex justify-between text-[11px] text-neutral-400 mb-1">
                <span>Synth Master Bus Gain</span>
                <span className="text-[#FF003C]">{Math.round(config.soundVolume * 100)}%</span>
              </div>
              <input
                type="range"
                min="0.1"
                max="1.0"
                step="0.05"
                value={config.soundVolume}
                onChange={(e) => setSoundVolume(parseFloat(e.target.value))}
                className="w-full accent-[#FF003C] bg-neutral-800"
              />
            </div>
          )}

          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center gap-2 text-xs text-neutral-300">
              <Vibrate className="w-4 h-4 text-[#E056FD]" />
              <span>Haptic Feedback Pulse</span>
            </div>
            <button
              onClick={toggleHaptic}
              className={`px-3 py-1 text-xs font-mono border rounded ${
                config.hapticFeedback ? 'border-[#E056FD] text-[#E056FD] bg-[#E056FD]/10' : 'border-neutral-800 text-neutral-600'
              }`}
            >
              {config.hapticFeedback ? 'ENABLED' : 'DISABLED'}
            </button>
          </div>
        </div>

        <div className="pt-2 flex justify-end">
          <CyberButton variant="primary" size="md" onClick={() => openSettings(false)}>
            SAVE CALIBRATION
          </CyberButton>
        </div>
      </div>
    </CyberModal>
  );
};
// ===== END NEW CODE: CROSS-DEVICE CONTROL SETTINGS (PC / MOBILE / CONSOLE) =====
