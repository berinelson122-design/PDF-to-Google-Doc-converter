import { create } from 'zustand';
import { 
  ConversionResult, 
  ConversionStatus, 
  PdfDocument, 
  ConversionHistoryItem, 
  UserSubscription,
  GoogleDocsExportConfig,
  QueueItem,
  SavedConversionRecord
} from '../types/index.ts';
import {
  loadSavedConversions,
  saveRecentConversion,
  updateRecentConversionHtml,
  removeSavedConversion,
  clearAllSavedConversions,
  getLastActiveConversionId,
  setLastActiveConversionId,
} from '../utils/recentConversionsStorage.ts';

// ===== START NEW CODE: DOCUMENT & CONVERSION STORE WITH BULK QUEUE & LOCAL PERSISTENCE =====
const HISTORY_STORAGE_KEY = 'cyber_pdf_conversion_history_v1';
const SUBSCRIPTION_STORAGE_KEY = 'cyber_pdf_subscription_v1';

function getInitialSavedConversions(): SavedConversionRecord[] {
  const existing = loadSavedConversions();
  if (existing.length > 0) {
    return existing;
  }
  // Backfill from existing history if present
  const history = loadInitialHistory();
  if (history.length > 0) {
    const seeded: SavedConversionRecord[] = history.slice(0, 5).map((item) => ({
      id: item.id,
      title: item.title,
      originalFileName: item.originalFileName || `${item.title}.pdf`,
      timestamp: item.timestamp,
      editedHtml: item.htmlContent,
      fileSize: item.fileSize,
      pageCount: item.pageCount,
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
          fontsDetected: ['Arial', 'Roboto'],
          colorPalette: ['#111827', '#059669'],
        },
        conversionTimeMs: 400,
      },
    }));
    seeded.forEach((r) => saveRecentConversion(r));
    return loadSavedConversions();
  }
  return [];
}

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

function loadInitialSubscription(): UserSubscription {
  const defaultSub: UserSubscription = {
    tier: 'free',
    conversionsToday: 0,
    dailyFreeLimit: 10,
    lastResetDate: new Date().toISOString().split('T')[0],
    hasProLicense: false,
  };
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const raw = localStorage.getItem(SUBSCRIPTION_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed) {
          return { ...defaultSub, ...parsed };
        }
      }
    }
  } catch (e) {
    console.error('Failed to load subscription from localStorage:', e);
  }
  return defaultSub;
}

function saveSubscriptionToStorage(sub: UserSubscription) {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem(SUBSCRIPTION_STORAGE_KEY, JSON.stringify(sub));
    }
  } catch (e) {
    console.error('Failed to save subscription to localStorage:', e);
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

  // Local Storage Persistence Layer for Last 5 Conversions
  savedConversions: SavedConversionRecord[];
  activeSavedConversionId: string | null;

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

  // Last 5 Conversions Persistence Actions
  loadSavedConversion: (item: SavedConversionRecord) => void;
  deleteSavedConversion: (id: string) => void;
  clearSavedConversions: () => void;
  restoreLastConversion: () => void;

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
  subscription: loadInitialSubscription(),
  exportConfig: DEFAULT_EXPORT_CONFIG,
  googleAccessToken: '',
  isExportModalOpen: false,
  isSettingsOpen: false,
  isPricingModalOpen: false,

  // Local Storage Persistence Layer for Last 5 Conversions
  savedConversions: getInitialSavedConversions(),
  activeSavedConversionId: getLastActiveConversionId(),

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

  setResult: (result) => {
    const activePdf = get().currentPdf;
    const docId = activePdf?.id || 'doc_' + Date.now();
    const fileName = activePdf?.name || `${result.documentTitle}.pdf`;

    // Automatically persist to the last 5 conversion results layer
    const savedRecord: SavedConversionRecord = {
      id: docId,
      title: result.documentTitle,
      originalFileName: fileName,
      timestamp: Date.now(),
      result,
      editedHtml: result.htmlContent,
      fileSize: activePdf?.size || 150000,
      pageCount: result.stats.pages || 1,
      pdfMetadata: activePdf ? {
        id: activePdf.id,
        name: activePdf.name,
        size: activePdf.size,
        pageCount: activePdf.pageCount,
        uploadedAt: activePdf.uploadedAt,
        base64Data: activePdf.base64Data,
      } : undefined,
    };

    const updatedSaved = saveRecentConversion(savedRecord);

    set(() => ({
      result,
      editedHtml: result.htmlContent,
      status: 'completed',
      progressPercent: 100,
      statusMessage: 'CONVERSION_SUCCESSFUL // DOCUMENT_READY',
      savedConversions: updatedSaved,
      activeSavedConversionId: docId,
      exportConfig: {
        ...get().exportConfig,
        docTitle: result.documentTitle,
      },
    }));
  },

  setEditedHtml: (html) => {
    const activeId = get().activeSavedConversionId;
    if (activeId) {
      const updatedSaved = updateRecentConversionHtml(activeId, html);
      set(() => ({
        editedHtml: html,
        savedConversions: updatedSaved,
      }));
    } else {
      set(() => ({ editedHtml: html }));
    }
  },

  setViewMode: (mode) => set(() => ({
    viewMode: mode,
  })),

  addToHistory: (item) => {
    const current = get().history;
    const filtered = current.filter((h) => h.id !== item.id);
    const updated = [item, ...filtered].slice(0, 50);
    saveHistoryToStorage(updated);

    // Automatically persist to the last 5 conversion results layer
    const savedRecord: SavedConversionRecord = {
      id: item.id,
      title: item.title,
      originalFileName: item.originalFileName || `${item.title}.pdf`,
      timestamp: item.timestamp,
      editedHtml: item.htmlContent,
      fileSize: item.fileSize,
      pageCount: item.pageCount,
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
        conversionTimeMs: 400,
      },
      pdfMetadata: item.base64Data ? {
        id: item.id,
        name: item.originalFileName || `${item.title}.pdf`,
        size: item.fileSize || 150000,
        pageCount: item.pageCount,
        uploadedAt: item.timestamp,
        base64Data: item.base64Data,
      } : undefined,
    };
    const updatedSaved = saveRecentConversion(savedRecord);

    set(() => ({
      history: updated,
      savedConversions: updatedSaved,
      activeSavedConversionId: item.id,
    }));
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

    const newSub: UserSubscription = {
      ...subscription,
      conversionsToday: conversionsToday + 1,
      lastResetDate: today,
    };
    saveSubscriptionToStorage(newSub);
    set(() => ({ subscription: newSub }));
    return true;
  },

  upgradeToPro: () => {
    const newSub: UserSubscription = {
      ...get().subscription,
      tier: 'pro',
      hasProLicense: true,
    };
    saveSubscriptionToStorage(newSub);
    set(() => ({
      subscription: newSub,
      isPricingModalOpen: false,
      statusMessage: 'UPLINK_UPGRADED // PRO_TIER_ACTIVE',
    }));
  },

  resetConversion: () => {
    setLastActiveConversionId(null);
    set(() => ({
      currentPdf: null,
      status: 'idle',
      progressPercent: 0,
      statusMessage: 'SYSTEM_STANDBY',
      errorMessage: null,
      result: null,
      editedHtml: '',
      activeSavedConversionId: null,
    }));
  },

  loadSavedConversion: (item) => {
    setLastActiveConversionId(item.id);
    set(() => ({
      activeSavedConversionId: item.id,
      editedHtml: item.editedHtml || item.result.htmlContent,
      status: 'completed',
      progressPercent: 100,
      statusMessage: `PERSISTENT_CONVERSION_RESTORED: ${item.title}`,
      result: item.result,
      currentPdf: item.pdfMetadata ? {
        id: item.pdfMetadata.id,
        name: item.pdfMetadata.name,
        size: item.pdfMetadata.size,
        base64Data: item.pdfMetadata.base64Data || '',
        pageCount: item.pdfMetadata.pageCount || item.pageCount || 1,
        uploadedAt: item.pdfMetadata.uploadedAt || item.timestamp,
      } : (item.originalFileName ? {
        id: item.id,
        name: item.originalFileName,
        size: item.fileSize || 150000,
        base64Data: '',
        pageCount: item.pageCount || 1,
        uploadedAt: item.timestamp,
      } : null),
      exportConfig: {
        ...DEFAULT_EXPORT_CONFIG,
        docTitle: item.title,
      },
    }));
  },

  deleteSavedConversion: (id) => {
    const updated = removeSavedConversion(id);
    set((state) => ({
      savedConversions: updated,
      activeSavedConversionId: state.activeSavedConversionId === id ? null : state.activeSavedConversionId,
      ...(state.activeSavedConversionId === id ? { result: null, currentPdf: null, editedHtml: '', status: 'idle' as const } : {}),
    }));
  },

  clearSavedConversions: () => {
    clearAllSavedConversions();
    set(() => ({
      savedConversions: [],
      activeSavedConversionId: null,
    }));
  },

  restoreLastConversion: () => {
    const saved = get().savedConversions;
    if (saved.length > 0) {
      const activeId = getLastActiveConversionId();
      const target = (activeId && saved.find((s) => s.id === activeId)) || saved[0];
      get().loadSavedConversion(target);
    }
  },

  loadHistoryItem: (item) => {
    setLastActiveConversionId(item.id);
    set(() => ({
      activeSavedConversionId: item.id,
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
    }));
  },
}));
// ===== END NEW CODE: DOCUMENT & CONVERSION STORE WITH BULK QUEUE & LOCAL PERSISTENCE =====

