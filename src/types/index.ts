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

export interface PdfDocument {
  id: string;
  name: string;
  size: number;
  base64Data: string;
  pageCount: number;
  uploadedAt: number;
  previewUrl?: string;
}

export interface ConversionHistoryItem {
  id: string;
  title: string;
  timestamp: number;
  pageCount: number;
  tablesCount: number;
  headingsCount: number;
  htmlContent: string;
  status: 'success' | 'failed';
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
