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

export type GeminiModelPreference = 'auto' | 'gemini-2.5-flash' | 'gemini-2.5-flash-lite' | 'gemini-2.5-pro' | 'gemini-2.0-flash' | 'gemini-flash-latest' | 'gemini-3.1-flash-lite' | 'gemini-3.8-flash';

// ===== START NEW CODE: INGESTION OCR & AUTO-LANGUAGE SETTINGS TYPES =====
export type ScriptType = 'latin' | 'cjk' | 'rtl' | 'cyrillic' | 'devanagari' | 'greek' | 'hebrew' | 'universal';

export interface IngestionOcrSettings {
  autoLanguageDetection: boolean;
  detectedLanguageCode: string;
  detectedLanguageName: string;
  scriptType: ScriptType;
  enableBidiTextEngine: boolean;
  verticalTextOrientation: boolean;
  enhanceCharacterResolution: boolean;
  tabularMatrixMode: 'strict' | 'adaptive' | 'relaxed';
  preserveLigatures: boolean;
  diacriticsPreservation: boolean;
  handwritingPreprocessing: boolean;
  dictionaryAlignment: boolean;
}

export interface AppliedOcrSettings {
  languageCode: string;
  languageName: string;
  scriptType: ScriptType;
  bidiEnabled: boolean;
  verticalText: boolean;
  resolutionEnhanced: boolean;
  dictionaryAligned: boolean;
  appliedRules: string[];
}
// ===== END NEW CODE: INGESTION OCR & AUTO-LANGUAGE SETTINGS TYPES =====

export interface ConversionResult {
  documentTitle: string;
  htmlContent: string;
  markdownContent: string;
  stats: GoogleDocFormatStats;
  detectedElements: DetectedElements;
  conversionTimeMs: number;
  googleDocsBatchUpdates?: any[];
  modelUsed?: string;
  tags?: string[];
  // ===== START NEW CODE: DETECTED LANGUAGE & TRANSLATION METADATA =====
  detectedLanguage?: DetectedLanguage;
  originalLanguage?: DetectedLanguage;
  translatedAt?: number;
  isTranslated?: boolean;
  appliedOcrSettings?: AppliedOcrSettings;
  // ===== END NEW CODE: DETECTED LANGUAGE & TRANSLATION METADATA =====
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
  detectedLanguage?: DetectedLanguage;
  ocrSettings?: IngestionOcrSettings;
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
  technicalMetadata?: PdfTechnicalMetadata;
  pdfVersion?: string;
  author?: string;
  detectedLanguage?: DetectedLanguage;
  ocrSettings?: IngestionOcrSettings;
  pageRange?: string;
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
  // ===== START NEW CODE: AUTOMATED DOCUMENT CATEGORIZATION & TAGGING =====
  category?: DocumentCategory;
  tags?: string[];
  // ===== END NEW CODE: AUTOMATED DOCUMENT CATEGORIZATION & TAGGING =====
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

export type ExportDocumentFormat = 'pdf' | 'docx' | 'md' | 'txt' | 'epub' | 'csv';

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

// ===== START NEW CODE: DOCUMENT CATEGORIZATION, THEME & BATCH RENAME TYPES =====
export type DocumentCategory = 'Invoices' | 'Contracts' | 'Reports' | 'Legal' | 'Academic' | 'Invoice' | 'Contract' | 'Financial' | 'Technical' | 'General';

export type AppTheme = 'cyberpunk' | 'light';

export interface BatchRenameConfig {
  prefix: string;
  suffix: string;
  findText: string;
  replaceText: string;
}
// ===== END NEW CODE: DOCUMENT CATEGORIZATION, THEME & BATCH RENAME TYPES =====

// ===== START NEW CODE: ANNOTATION & OCR LOW-CONFIDENCE TYPES =====
export type AnnotationType = 'highlight' | 'underline' | 'strikethrough';

export type HighlightColor = 'yellow' | 'cyberRed' | 'neonGreen' | 'purple';

export interface LowConfidenceFlag {
  id: string;
  originalWord: string;
  certaintyScore: number; // 0 - 100%
  reason: string;
  suggestedCorrection?: string;
  isVerified?: boolean;
}

export interface AnnotationToolbarState {
  activeColor: HighlightColor;
  showLowConfidence: boolean;
  lowConfidenceCount: number;
  currentFlagIndex: number;
}
// ===== END NEW CODE: ANNOTATION & OCR LOW-CONFIDENCE TYPES =====

// ===== START NEW CODE: LANGUAGE DETECTION, TRANSLATION & WEB SPEECH API TTS TYPES =====
export interface DetectedLanguage {
  code: string;
  name: string;
  nativeName?: string;
  confidence: number; // 0.0 - 1.0
  flag?: string;
  isAutoDetected?: boolean;
}

export interface SupportedLanguage {
  code: string;
  name: string;
  nativeName: string;
  flag: string;
  speechCode: string;
}

export type TTSStatus = 'idle' | 'playing' | 'paused' | 'stopped';

export interface TTSState {
  status: TTSStatus;
  currentVoiceURI: string;
  rate: number; // 0.5 - 2.0
  pitch: number; // 0.5 - 1.5
  volume: number; // 0.0 - 1.0
  isHighlightEnabled: boolean;
  activeSpokenWord: string;
  activeCharIndex: number;
  activeWordIndex: number;
  totalWords: number;
  progressPercent: number;
  readTarget: 'all' | 'page' | 'selection';
  activePageNumber: number;
}

export interface TranslationState {
  isTranslating: boolean;
  sourceLanguage: DetectedLanguage;
  targetLanguage: SupportedLanguage;
  translationProgress: number; // 0 - 100
  originalBackupHtml: string;
  originalBackupTitle: string;
  isOfferBannerDismissed: boolean;
}
// ===== END NEW CODE: LANGUAGE DETECTION, TRANSLATION & WEB SPEECH API TTS TYPES =====

// ===== START NEW CODE: INTERACTIVE TABLE OF CONTENTS & DOCUMENT OUTLINE TYPES =====
export interface TocEntry {
  id: string;
  title: string;
  level: number; // 1 = H1, 2 = H2, 3 = H3, etc.
  tag: string; // 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'section'
  pageNumber: number; // 1-indexed page where this heading physically resides
  wordCount: number; // approximate word count in this section before next heading
  previewSnippet: string; // brief teaser of section text
}

export interface TocMetadata {
  headings: TocEntry[];
  totalPages: number;
  isEligibleForAutoToc: boolean; // true when totalPages > 5
  totalHeadings: number;
  maxDepth: number;
  estimatedReadMinutes: number;
}
// ===== END NEW CODE: INTERACTIVE TABLE OF CONTENTS & DOCUMENT OUTLINE TYPES =====


