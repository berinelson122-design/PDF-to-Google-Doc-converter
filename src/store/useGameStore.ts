import { create } from 'zustand';
import { 
  ConversionResult, 
  ConversionStatus, 
  PdfDocument, 
  ConversionHistoryItem, 
  UserSubscription,
  GoogleDocsExportConfig 
} from '../types/index.ts';

// ===== START NEW CODE: DOCUMENT & CONVERSION STORE =====
export interface GameStoreState {
  currentPdf: PdfDocument | null;
  status: ConversionStatus;
  progressPercent: number;
  statusMessage: string;
  errorMessage: string | null;
  result: ConversionResult | null;
  editedHtml: string;
  
  viewMode: 'split' | 'doc_only' | 'pdf_only' | 'code';
  history: ConversionHistoryItem[];
  subscription: UserSubscription;
  exportConfig: GoogleDocsExportConfig;
  googleAccessToken: string;
  isExportModalOpen: boolean;
  isSettingsOpen: boolean;
  isPricingModalOpen: boolean;
  
  // Actions
  setPdf: (pdf: PdfDocument | null) => void;
  setStatus: (status: ConversionStatus, message?: string, progress?: number) => void;
  setResult: (result: ConversionResult) => void;
  setEditedHtml: (html: string) => void;
  setViewMode: (mode: 'split' | 'doc_only' | 'pdf_only' | 'code') => void;
  addToHistory: (item: ConversionHistoryItem) => void;
  setGoogleAccessToken: (token: string) => void;
  setExportConfig: (config: Partial<GoogleDocsExportConfig>) => void;
  openExportModal: (open: boolean) => void;
  openSettings: (open: boolean) => void;
  openPricingModal: (open: boolean) => void;
  incrementConversionCount: () => boolean;
  upgradeToPro: () => void;
  resetConversion: () => void;
  loadHistoryItem: (item: ConversionHistoryItem) => void;
}

const DEFAULT_EXPORT_CONFIG: GoogleDocsExportConfig = {
  docTitle: 'Converted Google Document',
  includeStyles: true,
  includeTables: true,
  preservePageBreaks: true,
  targetFontFamily: 'Arial',
  fontSizeScale: 1.0,
};

export const useGameStore = create<GameStoreState>((set, get) => ({
  currentPdf: null,
  status: 'idle',
  progressPercent: 0,
  statusMessage: 'SYSTEM_STANDBY // WAITING_FOR_PDF_PAYLOAD',
  errorMessage: null,
  result: null,
  editedHtml: '',
  
  viewMode: 'split',
  history: [],
  subscription: {
    tier: 'free',
    conversionsToday: 0,
    dailyFreeLimit: 3,
    lastResetDate: new Date().toISOString().split('T')[0],
    hasProLicense: false,
  },
  exportConfig: DEFAULT_EXPORT_CONFIG,
  googleAccessToken: '',
  isExportModalOpen: false,
  isSettingsOpen: false,
  isPricingModalOpen: false,

  setPdf: (pdf) => set(() => ({
    currentPdf: pdf,
    status: pdf ? 'idle' : 'idle',
    statusMessage: pdf ? `PAYLOAD_MOUNTED: ${pdf.name}` : 'SYSTEM_STANDBY',
    errorMessage: null,
    exportConfig: pdf ? { ...get().exportConfig, docTitle: pdf.name.replace(/\.[^/.]+$/, '') } : get().exportConfig,
  })),

  setStatus: (status, message, progress) => set((state) => ({
    status,
    statusMessage: message || state.statusMessage,
    progressPercent: progress !== undefined ? progress : state.progressPercent,
    errorMessage: status === 'error' ? (message || 'CONVERSION_PIPELINE_FAULT') : null,
  })),

  setResult: (result) => set(() => ({
    result,
    editedHtml: result.htmlContent,
    status: 'completed',
    progressPercent: 100,
    statusMessage: 'CONVERSION_SUCCESSFUL // DOCUMENT_READY',
  })),

  setEditedHtml: (html) => set(() => ({
    editedHtml: html,
  })),

  setViewMode: (mode) => set(() => ({
    viewMode: mode,
  })),

  addToHistory: (item) => set((state) => ({
    history: [item, ...state.history.slice(0, 19)],
  })),

  setGoogleAccessToken: (token) => set(() => ({
    googleAccessToken: token,
  })),

  setExportConfig: (config) => set((state) => ({
    exportConfig: { ...state.exportConfig, ...config },
  })),

  openExportModal: (open) => set(() => ({
    isExportModalOpen: open,
  })),

  openSettings: (open) => set(() => ({
    isSettingsOpen: open,
  })),

  openPricingModal: (open) => set(() => ({
    isPricingModalOpen: open,
  })),

  incrementConversionCount: () => {
    const { subscription } = get();
    const today = new Date().toISOString().split('T')[0];
    let conversionsToday = subscription.conversionsToday;
    
    // Daily reset check
    if (subscription.lastResetDate !== today) {
      conversionsToday = 0;
    }

    if (subscription.tier === 'free' && conversionsToday >= subscription.dailyFreeLimit) {
      set(() => ({ isPricingModalOpen: true }));
      return false; // Limit exceeded
    }

    set(() => ({
      subscription: {
        ...subscription,
        conversionsToday: conversionsToday + 1,
        lastResetDate: today,
      },
    }));
    return true;
  },

  upgradeToPro: () => set((state) => ({
    subscription: {
      ...state.subscription,
      tier: 'pro',
      hasProLicense: true,
    },
    isPricingModalOpen: false,
    statusMessage: 'UPLINK_UPGRADED // PRO_TIER_ACTIVE',
  })),

  resetConversion: () => set(() => ({
    currentPdf: null,
    status: 'idle',
    progressPercent: 0,
    statusMessage: 'SYSTEM_STANDBY',
    errorMessage: null,
    result: null,
    editedHtml: '',
  })),

  loadHistoryItem: (item) => set(() => ({
    editedHtml: item.htmlContent,
    status: 'completed',
    statusMessage: `HISTORIC_RECORD_LOADED: ${item.title}`,
    exportConfig: {
      ...DEFAULT_EXPORT_CONFIG,
      docTitle: item.title,
    },
  })),
}));
// ===== END NEW CODE: DOCUMENT & CONVERSION STORE =====
