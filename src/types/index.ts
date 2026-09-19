export type ConversionStatus = 
  | 'idle' 
  | 'analyzing' 
  | 'extracting_layout' 
  | 'rendering_doc' 
  | 'completed' 
  | 'error';

export type DeviceType = 'pc' | 'mobile' | 'console';

export type MonetizationTier = 'free' | 'pro';

export interface DetectedElements {
  headingsCount: number;
  tablesCount: number;
  bulletListsCount: number;
  fontsDetected: string[];
  colorPalette: string[];
}

export interface GoogleDocFormatStats {
  pages: number;
  wordCount: number;
  characterCount: number;
  fidelityScore: number; // 0-100%
}

export interface ConversionResult {
  documentTitle: string;
  htmlContent: string;
  markdownContent: string;
  stats: GoogleDocFormatStats;
  detectedElements: DetectedElements;
  conversionTimeMs: number;
  googleDocsBatchUpdates?: any[];
}

export interface PdfTechnicalMetadata {
  creatorTool?: string;
  producer?: string;
  creationDate?: string;
  modificationDate?: string;
  title?: string;
  author?: string;
  subject?: string;
  keywords?: string[];
  pageCount: number;
  pdfVersion?: string;
  isEncrypted: boolean;
  securitySettings?: {
    allowsPrinting: boolean;
    allowsCopying: boolean;
    allowsModifying: boolean;
  };
  fileSizeBytes: number;
}

export interface PdfDocument {
  id: string;
  name: string;
  size: number;
  base64Data: string;
  pageCount: number;
  uploadedAt: number;
  previewUrl?: string;
  technicalMetadata?: PdfTechnicalMetadata;
}

export interface QueueItem {
  id: string;
  name: string;
  size: number;
  base64Data: string;
  pageCount: number;
  status: 'queued' | 'processing' | 'completed' | 'error';
  progress: number;
  statusMessage?: string;
  errorMessage?: string;
  result?: ConversionResult;
  addedAt: number;
  samplePrecomputed?: string;
}

export interface ConversionHistoryItem {
  id: string;
  title: string;
  originalFileName?: string;
  fileSize?: number;
  timestamp: number;
  pageCount: number;
  tablesCount: number;
  headingsCount: number;
  htmlContent: string;
  markdownContent?: string;
  fidelityScore?: number;
  status: 'success' | 'failed';
  base64Data?: string;
  technicalMetadata?: PdfTechnicalMetadata;
}

export interface DeviceControlConfig {
  device: DeviceType;
  soundEnabled: boolean;
  soundVolume: number;
  hapticFeedback: boolean;
  virtualJoystickEnabled: boolean;
  virtualJoystickOpacity: number;
  gamepadDeadzone: number;
  gamepadSensitivity: number;
  activeScreenIndex: number;
  autoSaveDraft?: boolean;
}

export interface UserSubscription {
  tier: MonetizationTier;
  conversionsToday: number;
  dailyFreeLimit: number;
  lastResetDate: string;
  hasProLicense: boolean;
}

export interface GoogleDocsExportConfig {
  docTitle: string;
  includeStyles: boolean;
  includeTables: boolean;
  preservePageBreaks: boolean;
  targetFontFamily: string;
  fontSizeScale: number;
}

export interface SavedConversionRecord {
  id: string;
  title: string;
  originalFileName: string;
  timestamp: number;
  result: ConversionResult;
  editedHtml: string;
  fileSize?: number;
  pageCount?: number;
  pdfMetadata?: {
    id: string;
    name: string;
    size: number;
    pageCount: number;
    uploadedAt: number;
    base64Data?: string;
  };
}

export type ExportDocumentFormat = 'docx' | 'md' | 'txt';

export interface ComplexPhraseItem {
  phrase: string;
  suggestion: string;
  category: 'wordy' | 'passive' | 'jargon' | 'redundant' | 'complex';
  explanation: string;
  contextSnippet?: string;
}

export interface ReadabilityMetrics {
  fleschKincaidGradeLevel: number;
  fleschReadingEase: number;
  readingLevelLabel: string;
  interpretation: string;
  totalWords: number;
  totalSentences: number;
  totalSyllables: number;
  avgSentenceLength: number;
  avgSyllablesPerWord: number;
  complexWordsCount: number;
  complexWordsPercentage: number;
  complexPhrases: ComplexPhraseItem[];
}
