import { create } from 'zustand';
import { 
  ConversionResult, 
  ConversionStatus, 
  PdfDocument, 
  ConversionHistoryItem, 
  UserSubscription,
  GoogleDocsExportConfig,
  QueueItem
} from '../types/index.ts';

// ===== START NEW CODE: DOCUMENT & CONVERSION STORE WITH BULK QUEUE & LOCAL PERSISTENCE =====
const HISTORY_STORAGE_KEY = 'cyber_pdf_conversion_history_v1';

function loadInitialHistory(): ConversionHistoryItem[] {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const raw = localStorage.getItem(HISTORY_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          return parsed;
        }
      }
    }
  } catch (e) {
    console.error('Failed to load history from localStorage:', e);
  }
  return [];
}

function saveHistoryToStorage(history: ConversionHistoryItem[]) {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(history));
    }
  } catch (e) {
    console.error('Failed to save history to localStorage:', e);
  }
}

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

  // Queue & Bulk Processing State
  queue: QueueItem[];
  isBulkProcessing: boolean;
  activeQueueId: string | null;
  
  // Actions
  setPdf: (pdf: PdfDocument | null) => void;
  setStatus: (status: ConversionStatus, message?: string, progress?: number) => void;
  setResult: (result: ConversionResult) => void;
  setEditedHtml: (html: string) => void;
  setViewMode: (mode: 'split' | 'doc_only' | 'pdf_only' | 'code') => void;
  addToHistory: (item: ConversionHistoryItem) => void;
  deleteHistoryItem: (id: string) => void;
  clearHistory: () => void;
  setGoogleAccessToken: (token: string) => void;
  setExportConfig: (config: Partial<GoogleDocsExportConfig>) => void;
  openExportModal: (open: boolean) => void;
  openSettings: (open: boolean) => void;
  openPricingModal: (open: boolean) => void;
  incrementConversionCount: () => boolean;
  upgradeToPro: () => void;
  resetConversion: () => void;
  loadHistoryItem: (item: ConversionHistoryItem) => void;

  // Queue Actions
  addToQueue: (items: QueueItem[]) => void;
  removeFromQueue: (id: string) => void;
  clearQueue: () => void;
  updateQueueItem: (id: string, updates: Partial<QueueItem>) => void;
  setBulkProcessing: (isProcessing: boolean) => void;
  setActiveQueueId: (id: string | null) => void;
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
  history: loadInitialHistory(),
  subscription: {
    tier: 'free',
    conversionsToday: 0,
    dailyFreeLimit: 10,
    lastResetDate: new Date().toISOString().split('T')[0],
    hasProLicense: false,
  },
  exportConfig: DEFAULT_EXPORT_CONFIG,
  googleAccessToken: '',
  isExportModalOpen: false,
  isSettingsOpen: false,
  isPricingModalOpen: false,

  // Queue State
  queue: [],
  isBulkProcessing: false,
  activeQueueId: null,

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

  addToHistory: (item) => {
    const current = get().history;
    const filtered = current.filter((h) => h.id !== item.id);
    const updated = [item, ...filtered].slice(0, 50);
    saveHistoryToStorage(updated);
    set(() => ({ history: updated }));
  },

  deleteHistoryItem: (id: string) => {
    const current = get().history;
    const updated = current.filter((h) => h.id !== id);
    saveHistoryToStorage(updated);
    set(() => ({ history: updated }));
  },

  clearHistory: () => {
    saveHistoryToStorage([]);
    set(() => ({ history: [] }));
  },

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

  // Queue actions
  addToQueue: (newItems) => set((state) => {
    // Avoid duplicate IDs
    const existingIds = new Set(state.queue.map((i) => i.id));
    const toAdd = newItems.filter((i) => !existingIds.has(i.id));
    return { queue: [...state.queue, ...toAdd] };
  }),

  removeFromQueue: (id) => set((state) => ({
    queue: state.queue.filter((item) => item.id !== id),
    activeQueueId: state.activeQueueId === id ? null : state.activeQueueId,
  })),

  clearQueue: () => set(() => ({
    queue: [],
    activeQueueId: null,
    isBulkProcessing: false,
  })),

  updateQueueItem: (id, updates) => set((state) => ({
    queue: state.queue.map((item) => (item.id === id ? { ...item, ...updates } : item)),
  })),

  setBulkProcessing: (isProcessing) => set(() => ({
    isBulkProcessing: isProcessing,
  })),

  setActiveQueueId: (id) => set(() => ({
    activeQueueId: id,
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
    result: {
      documentTitle: item.title,
      htmlContent: item.htmlContent,
      markdownContent: item.markdownContent || `# ${item.title}`,
      stats: {
        pages: item.pageCount,
        wordCount: item.htmlContent.replace(/<[^>]+>/g, ' ').split(/\s+/).filter(Boolean).length,
        characterCount: item.htmlContent.length,
        fidelityScore: item.fidelityScore || 98,
      },
      detectedElements: {
        headingsCount: item.headingsCount,
        tablesCount: item.tablesCount,
        bulletListsCount: 2,
        fontsDetected: ['Arial', 'JetBrains Mono', 'Roboto'],
        colorPalette: ['#111827', '#059669', '#1a73e8'],
      },
      conversionTimeMs: 450,
    },
    currentPdf: item.base64Data ? {
      id: item.id,
      name: item.originalFileName || item.title + '.pdf',
      size: item.fileSize || 150000,
      base64Data: item.base64Data,
      pageCount: item.pageCount,
      uploadedAt: item.timestamp,
    } : null,
    exportConfig: {
      ...DEFAULT_EXPORT_CONFIG,
      docTitle: item.title,
    },
  })),
}));
// ===== END NEW CODE: DOCUMENT & CONVERSION STORE WITH BULK QUEUE & LOCAL PERSISTENCE =====

