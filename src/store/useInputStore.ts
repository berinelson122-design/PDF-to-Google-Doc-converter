import { create } from 'zustand';
import { DeviceControlConfig, DeviceType } from '../types/index.ts';

// ===== START NEW CODE: INPUT STORE CONFIGURATION =====
export interface InputStoreState {
  config: DeviceControlConfig;
  joystickVector: { x: number; y: number };
  isGamepadConnected: boolean;
  gamepadName: string;
  activeActionKey: string | null;
  lastCommand: string;

  // Actions
  setDevice: (device: DeviceType) => void;
  toggleSound: () => void;
  setSoundVolume: (volume: number) => void;
  toggleHaptic: () => void;
  setJoystickVector: (vector: { x: number; y: number }) => void;
  setGamepadConnected: (connected: boolean, name?: string) => void;
  setActiveActionKey: (key: string | null) => void;
  setVirtualJoystickOpacity: (opacity: number) => void;
  setGamepadSensitivity: (sensitivity: number) => void;
  setActiveScreenIndex: (index: number) => void;
}

export const useInputStore = create<InputStoreState>((set) => ({
  config: {
    device: 'pc',
    soundEnabled: true,
    soundVolume: 0.8,
    hapticFeedback: true,
    virtualJoystickEnabled: true,
    virtualJoystickOpacity: 0.7,
    gamepadDeadzone: 0.15,
    gamepadSensitivity: 1.0,
    activeScreenIndex: 0,
  },
  joystickVector: { x: 0, y: 0 },
  isGamepadConnected: false,
  gamepadName: '',
  activeActionKey: null,
  lastCommand: 'SYSTEM_READY',

  setDevice: (device: DeviceType) =>
    set((state) => ({
      config: { ...state.config, device },
      lastCommand: `DEVICE_CALIBRATED_${device.toUpperCase()}`,
    })),

  toggleSound: () =>
    set((state) => ({
      config: { ...state.config, soundEnabled: !state.config.soundEnabled },
    })),

  setSoundVolume: (volume: number) =>
    set((state) => ({
      config: { ...state.config, soundVolume: volume },
    })),

  toggleHaptic: () =>
    set((state) => ({
      config: { ...state.config, hapticFeedback: !state.config.hapticFeedback },
    })),

  setJoystickVector: (vector: { x: number; y: number }) =>
    set(() => ({
      joystickVector: vector,
    })),

  setGamepadConnected: (connected: boolean, name: string = '') =>
    set(() => ({
      isGamepadConnected: connected,
      gamepadName: name,
      lastCommand: connected ? `GAMEPAD_LINKED: ${name}` : 'GAMEPAD_DISCONNECTED',
    })),

  setActiveActionKey: (key: string | null) =>
    set(() => ({
      activeActionKey: key,
    })),

  setVirtualJoystickOpacity: (opacity: number) =>
    set((state) => ({
      config: { ...state.config, virtualJoystickOpacity: opacity },
    })),

  setGamepadSensitivity: (sensitivity: number) =>
    set((state) => ({
      config: { ...state.config, gamepadSensitivity: sensitivity },
    })),

  setActiveScreenIndex: (index: number) =>
    set((state) => ({
      config: { ...state.config, activeScreenIndex: index },
    })),
}));
// ===== END NEW CODE: INPUT STORE CONFIGURATION =====
