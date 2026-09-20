import { create } from 'zustand';
import { 
  ConversionResult, 
  ConversionStatus, 
  PdfDocument, 
  ConversionHistoryItem, 
  UserSubscription,
  GoogleDocsExportConfig,
  QueueItem,
  SavedConversionRecord,
  DocumentCategory,
  AppTheme,
  BatchRenameConfig,
  LowConfidenceFlag,
  GeminiModelPreference,
  DetectedLanguage,
  SupportedLanguage,
  TTSState,
  TTSStatus,
  IngestionOcrSettings,
  AppliedOcrSettings,
  ScriptType,
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
import { classifyDocument } from '../utils/documentClassifier.ts';
import { 
  scanAndInjectLowConfidenceMarkers, 
  stripLowConfidenceMarkers 
} from '../utils/ocrConfidenceScanner.ts';
import { 
  detectLanguageFromText, 
  getSupportedLanguage, 
  SUPPORTED_LANGUAGES,
  getAutoOcrSettingsForLanguage,
  DEFAULT_INGESTION_OCR_SETTINGS,
  detectLanguageFromPdfBuffer,
} from '../utils/languageDetector.ts';
import { translateDocumentContent } from '../utils/documentTranslator.ts';
import { speechSynth } from '../utils/speechSynth.ts';

// ===== START NEW CODE: DOCUMENT & CONVERSION STORE WITH BULK QUEUE, THEME & LOCAL PERSISTENCE =====
const HISTORY_STORAGE_KEY = 'cyber_pdf_conversion_history_v1';
const SUBSCRIPTION_STORAGE_KEY = 'cyber_pdf_subscription_v1';
export const AUTOSAVE_SETTINGS_KEY = 'cyber_pdf_autosave_setting_v1';
export const DRAFT_STORAGE_KEY = 'cyber_pdf_draft_autosave_v1';
export const THEME_STORAGE_KEY = 'cyber_pdf_theme_v1';

function applyThemeToDocument(theme: AppTheme) {
  try {
    if (typeof document !== 'undefined') {
      const root = document.documentElement;
      if (theme === 'light') {
        root.classList.remove('dark');
        root.classList.add('light', 'theme-light');
        document.body.classList.remove('bg-black');
        document.body.classList.add('theme-light');
      } else {
        root.classList.remove('light', 'theme-light');
        root.classList.add('dark', 'theme-cyberpunk');
        document.body.classList.add('bg-black');
        document.body.classList.remove('theme-light');
      }
    }
  } catch (e) {
    console.error('Failed to apply theme to document:', e);
  }
}

function getSystemThemePreference(): AppTheme {
  try {
    if (typeof window !== 'undefined' && window.matchMedia) {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'cyberpunk' : 'light';
    }
  } catch (e) {
    console.error('Failed to query matchMedia system theme:', e);
  }
  return 'cyberpunk';
}

function loadInitialTheme(): AppTheme {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const stored = localStorage.getItem(THEME_STORAGE_KEY) as AppTheme | null;
      if (stored === 'light' || stored === 'cyberpunk') {
        applyThemeToDocument(stored);
        return stored;
      }
    }
  } catch (e) {
    console.error('Failed to load theme from localStorage:', e);
  }
  const sysTheme = getSystemThemePreference();
  applyThemeToDocument(sysTheme);
  return sysTheme;
}

/**
 * System preference observer that detects OS dark/light mode changes
 * and automatically updates the application theme when no manual theme lock exists.
 */
export function initSystemThemeObserver(setTheme: (theme: AppTheme) => void) {
  if (typeof window === 'undefined' || !window.matchMedia) return () => {};

  try {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e: MediaQueryListEvent | MediaQueryList) => {
      // Check if user explicitly manually set theme in localStorage
      const hasStoredOverride = localStorage.getItem(THEME_STORAGE_KEY) !== null;
      if (!hasStoredOverride) {
        const newTheme: AppTheme = e.matches ? 'cyberpunk' : 'light';
        setTheme(newTheme);
      }
    };

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handler);
      return () => mediaQuery.removeEventListener('change', handler);
    } else if (mediaQuery.addListener) {
      mediaQuery.addListener(handler);
      return () => mediaQuery.removeListener(handler);
    }
  } catch (err) {
    console.error('Failed to attach system theme mediaQuery listener:', err);
  }
  return () => {};
}

function loadInitialAutoSave(): boolean {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const val = localStorage.getItem(AUTOSAVE_SETTINGS_KEY);
      if (val !== null) {
        return val === 'true';
      }
    }
  } catch (e) {
    console.error('Failed to load autosave setting:', e);
  }
  return true; // Default auto-save enabled
}

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

const DEFAULT_SEED_DOCUMENTS: ConversionHistoryItem[] = [
  {
    id: 'seed_inv_2026',
    title: 'INV-2026-0982-Global-Logistics',
    originalFileName: 'INV-2026-0982-Global-Logistics.pdf',
    fileSize: 342000,
    timestamp: Date.now() - 1000 * 60 * 60 * 3,
    pageCount: 2,
    tablesCount: 1,
    headingsCount: 3,
    category: 'Invoices',
    status: 'success',
    fidelityScore: 99.2,
    htmlContent: `<div style="font-family: Arial, sans-serif; line-height: 1.6; color: #1f2937; max-width: 800px; margin: 0 auto;">
      <div style="display: flex; justify-content: space-between; border-bottom: 2px solid #e5e7eb; padding-bottom: 16px; margin-bottom: 20px;">
        <div>
          <h1 style="margin: 0; font-size: 22pt; color: #111827; font-weight: 700;">INVOICE</h1>
          <p style="margin: 4px 0 0 0; color: #6b7280; font-size: 10pt;">INVOICE ID: <strong>INV-2026-0982</strong></p>
          <p style="margin: 2px 0 0 0; color: #6b7280; font-size: 10pt;">BILLING TAX ID: <strong>US-94827104</strong></p>
        </div>
        <div style="text-align: right;">
          <p style="margin: 0; font-weight: bold; color: #111827;">Global Logistics & Cloud Proxies Ltd.</p>
          <p style="margin: 2px 0 0 0; color: #6b7280; font-size: 10pt;">Date: March 15, 2026</p>
          <p style="margin: 2px 0 0 0; color: #6b7280; font-size: 10pt;">Payment Terms: Net 30 Days</p>
        </div>
      </div>

      <h2 style="font-size: 14pt; color: #1f2937; margin-top: 16px; margin-bottom: 8px;">1. Billed Services & Itemized Units</h2>
      <p style="font-size: 10pt; color: #4b5563; margin-bottom: 12px;">
        Below is the itemized breakdown of dedicated cloud transit and secure gateway endpoints provisioned during the billing cycle.
      </p>

      <table style="width: 100%; border-collapse: collapse; margin-top: 10px; margin-bottom: 20px; font-size: 10pt;">
        <thead>
          <tr style="background-color: #f3f4f6;">
            <th style="border: 1px solid #d1d5db; padding: 8px 12px; text-align: left;">Line Item Description</th>
            <th style="border: 1px solid #d1d5db; padding: 8px 12px; text-align: center;">Qty</th>
            <th style="border: 1px solid #d1d5db; padding: 8px 12px; text-align: right;">Unit Rate</th>
            <th style="border: 1px solid #d1d5db; padding: 8px 12px; text-align: right;">Total Cost</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style="border: 1px solid #d1d5db; padding: 8px 12px;">Low-Latency Neural Pipeline Gateway (Sub-15ms)</td>
            <td style="border: 1px solid #d1d5db; padding: 8px 12px; text-align: center;">2</td>
            <td style="border: 1px solid #d1d5db; padding: 8px 12px; text-align: right;">$1,200.00</td>
            <td style="border: 1px solid #d1d5db; padding: 8px 12px; text-align: right;">$2,400.00</td>
          </tr>
          <tr style="background-color: #f9fafb;">
            <td style="border: 1px solid #d1d5db; padding: 8px 12px;">High-Fidelity Optical Layout Recognition Node</td>
            <td style="border: 1px solid #d1d5db; padding: 8px 12px; text-align: center;">1</td>
            <td style="border: 1px solid #d1d5db; padding: 8px 12px; text-align: right;">$1,850.00</td>
            <td style="border: 1px solid #d1d5db; padding: 8px 12px; text-align: right;">$1,850.00</td>
          </tr>
          <tr>
            <td style="border: 1px solid #d1d5db; padding: 8px 12px;">Regional Storage Mirroring & Encryption Cluster</td>
            <td style="border: 1px solid #d1d5db; padding: 8px 12px; text-align: center;">1</td>
            <td style="border: 1px solid #d1d5db; padding: 8px 12px; text-align: right;">$400.00</td>
            <td style="border: 1px solid #d1d5db; padding: 8px 12px; text-align: right;">$400.00</td>
          </tr>
          <tr style="background-color: #f3f4f6; font-weight: bold;">
            <td colspan="3" style="border: 1px solid #d1d5db; padding: 8px 12px; text-align: right;">TOTAL PAYABLE DUE:</td>
            <td style="border: 1px solid #d1d5db; padding: 8px 12px; text-align: right; color: #1e3a8a;">$4,650.00</td>
          </tr>
        </tbody>
      </table>

      <div class="page-break" style="page-break-after: always; height: 0; border: none; margin: 0; padding: 0;"></div>

      <h2 style="font-size: 13pt; color: #1f2937; margin-top: 18px; margin-bottom: 6px;">2. Remittance & Wire Instructions</h2>
      <p style="font-size: 10pt; color: #4b5563; margin-bottom: 14px;">
        Please transmit payment to routing transit number <strong>#021000021</strong> referencing invoice voucher <strong>INV-2026-0982</strong>. All terms are subject to standard vendor covenants and service level agreements.
      </p>

      <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 4px; padding: 16px; margin-top: 12px; font-size: 10pt;">
        <p style="margin: 0 0 6px 0; font-weight: bold; color: #0f172a;">Bank Beneficiary Information:</p>
        <p style="margin: 2px 0; color: #475569;">Beneficiary Account: <strong>8829-1094-3982</strong></p>
        <p style="margin: 2px 0; color: #475569;">SWIFT / BIC Code: <strong>GLCLUS33XXX</strong></p>
        <p style="margin: 2px 0; color: #475569;">Bank Name: First International Cyber Federal Reserve</p>
        <p style="margin: 8px 0 0 0; font-size: 9pt; color: #94a3b8;">Payments received after Net 30 will incur a standard 1.5% monthly compliance rate.</p>
      </div>

      <div style="margin-top: 40px; display: flex; justify-content: space-between; font-size: 10pt; color: #4b5563;">
        <div style="border-top: 1px solid #cbd5e1; width: 220px; padding-top: 6px; text-align: center;">
          Authorized Corporate Signatory
        </div>
        <div style="border-top: 1px solid #cbd5e1; width: 220px; padding-top: 6px; text-align: center;">
          Enterprise Client Verification
        </div>
      </div>
    </div>`,
    markdownContent: '# INVOICE INV-2026-0982\n\nTotal Due: $4,650.00\nTax ID: US-94827104'
  },
  {
    id: 'seed_contract_msa',
    title: 'Master-Services-Agreement-Final',
    originalFileName: 'Master-Services-Agreement-Final.pdf',
    fileSize: 512000,
    timestamp: Date.now() - 1000 * 60 * 60 * 24,
    pageCount: 3,
    tablesCount: 1,
    headingsCount: 4,
    category: 'Contracts',
    status: 'success',
    fidelityScore: 98.7,
    htmlContent: `<div style="font-family: Arial, sans-serif; line-height: 1.6; color: #1f2937; max-width: 800px; margin: 0 auto;">
      <h1 style="font-size: 20pt; font-weight: 700; color: #111827; border-bottom: 2px solid #e5e7eb; padding-bottom: 8px;">MASTER SERVICES AGREEMENT</h1>
      <p style="font-size: 10.5pt; color: #4b5563; margin-bottom: 16px;">This Master Services Agreement is entered into between Provider and Enterprise Client effective March 2026.</p>
      <h2 style="font-size: 14pt; color: #1f2937; margin-top: 16px;">Section 1. Confidentiality &amp; Restrictive Covenants</h2>
      <p style="font-size: 10pt; color: #4b5563; margin-bottom: 12px;">Each party agrees to maintain strict confidentiality over proprietary technical documentation, biometric credentials, neural dataset keys, and cryptographic key materials. These covenants survive termination of this agreement for five (5) full calendar years.</p>
      <p style="font-size: 10pt; color: #4b5563;">Neither party shall disclose, directly or indirectly, confidential technical disclosures without prior written notarized consent from the Chief Information Security Officer.</p>

      <div class="page-break" style="page-break-after: always; height: 0; border: none; margin: 0; padding: 0;"></div>

      <h2 style="font-size: 14pt; color: #1f2937; margin-top: 16px;">Section 2. Deliverables &amp; Performance Milestones</h2>
      <p style="font-size: 10pt; color: #4b5563; margin-bottom: 12px;">The Provider agrees to deploy dedicated hardware clusters with sub-15ms regional latency guarantees. Milestones are formally tracked via weekly encrypted telemetric digests.</p>
      <ul style="font-size: 10pt; color: #4b5563; margin-left: 20px; margin-bottom: 16px;">
        <li><strong>Milestone A:</strong> Provision of secure edge gateways within 48 hours of execution.</li>
        <li><strong>Milestone B:</strong> 99.99% availability of Google Docs bidirectional synchronizer.</li>
        <li><strong>Milestone C:</strong> Automated monthly OCR accuracy audits exceeding 98.5% fidelity.</li>
      </ul>

      <div class="page-break" style="page-break-after: always; height: 0; border: none; margin: 0; padding: 0;"></div>

      <h2 style="font-size: 14pt; color: #1f2937; margin-top: 16px;">Section 3. Indemnification &amp; Governing Law</h2>
      <p style="font-size: 10pt; color: #4b5563; margin-bottom: 12px;">This agreement is governed by the laws of the State of Delaware, without regard to conflict of laws principles. The parties submit to exclusive jurisdiction in federal and state venues.</p>
      <div style="margin-top: 36px; display: flex; justify-content: space-between; font-size: 10pt; color: #4b5563;">
        <div style="border-top: 1px solid #cbd5e1; width: 220px; padding-top: 8px; text-align: center;">
          Provider: Void Systems Inc.<br />Date: March 15, 2026
        </div>
        <div style="border-top: 1px solid #cbd5e1; width: 220px; padding-top: 8px; text-align: center;">
          Client: Apex Enterprise Corp.<br />Date: March 15, 2026
        </div>
      </div>
    </div>`,
    markdownContent: '# MASTER SERVICES AGREEMENT\n\nEffective March 2026.'
  },
  {
    id: 'seed_report_audit',
    title: 'Q3-Cyber-Telemetry-Audit',
    originalFileName: 'Q3-Cyber-Telemetry-Audit.pdf',
    fileSize: 680000,
    timestamp: Date.now() - 1000 * 60 * 60 * 48,
    pageCount: 4,
    tablesCount: 2,
    headingsCount: 5,
    category: 'Reports',
    status: 'success',
    fidelityScore: 99.5,
    htmlContent: `<div style="font-family: Arial, sans-serif; line-height: 1.6; color: #1f2937; max-width: 800px; margin: 0 auto;">
      <h1 style="font-size: 20pt; font-weight: 700; color: #111827; border-bottom: 2px solid #e5e7eb; padding-bottom: 8px;">Q3 CYBER TELEMETRY &amp; LATENCY AUDIT</h1>
      <p style="font-size: 10.5pt; color: #4b5563; margin-bottom: 14px;">Comprehensive analysis of round-trip network response times, document conversion speed, and memory pressure on M2 Silicon architectures.</p>
      <h2 style="font-size: 14pt; color: #1f2937; margin-top: 16px;">1. System Throughput &amp; Benchmarks</h2>
      <p style="font-size: 10pt; color: #4b5563;">All edge gateways verified at Sub-15ms packet latency with 99.99% uptime compliance.</p>

      <div class="page-break" style="page-break-after: always; height: 0; border: none; margin: 0; padding: 0;"></div>

      <h2 style="font-size: 14pt; color: #1f2937; margin-top: 16px;">2. Memory Pressure &amp; M2 Hardware Telemetry</h2>
      <p style="font-size: 10pt; color: #4b5563; margin-bottom: 12px;">Hardware cache coherence observed within nominal boundaries across unified memory sub-systems.</p>
      <table style="width: 100%; border-collapse: collapse; font-size: 10pt; margin-bottom: 16px;">
        <thead>
          <tr style="background-color: #f3f4f6;">
            <th style="border: 1px solid #d1d5db; padding: 8px; text-align: left;">Cluster Node</th>
            <th style="border: 1px solid #d1d5db; padding: 8px; text-align: center;">RAM Peak</th>
            <th style="border: 1px solid #d1d5db; padding: 8px; text-align: right;">P99 Latency</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style="border: 1px solid #d1d5db; padding: 8px;">Worker Alpha-01</td>
            <td style="border: 1px solid #d1d5db; padding: 8px; text-align: center;">184 MB</td>
            <td style="border: 1px solid #d1d5db; padding: 8px; text-align: right; color: #059669;">8.4 ms</td>
          </tr>
          <tr style="background-color: #f9fafb;">
            <td style="border: 1px solid #d1d5db; padding: 8px;">Worker Beta-02</td>
            <td style="border: 1px solid #d1d5db; padding: 8px; text-align: center;">212 MB</td>
            <td style="border: 1px solid #d1d5db; padding: 8px; text-align: right; color: #059669;">11.2 ms</td>
          </tr>
        </tbody>
      </table>

      <div class="page-break" style="page-break-after: always; height: 0; border: none; margin: 0; padding: 0;"></div>

      <h2 style="font-size: 14pt; color: #1f2937; margin-top: 16px;">3. Optical Character Recognition Integrity</h2>
      <p style="font-size: 10pt; color: #4b5563; margin-bottom: 12px;">Verification of complex tabular alignment and custom serif font detection against Google Docs benchmark suite.</p>
      <p style="font-size: 10pt; color: #4b5563;">Overall document layout retention achieved 99.5% fidelity score under zero-packet-drop stress testing.</p>

      <div class="page-break" style="page-break-after: always; height: 0; border: none; margin: 0; padding: 0;"></div>

      <h2 style="font-size: 14pt; color: #1f2937; margin-top: 16px;">4. Compliance Certification &amp; Sign-Off</h2>
      <p style="font-size: 10pt; color: #4b5563; margin-bottom: 24px;">Lead Architect confirms that all telemetry specifications satisfy the architectural mandate for low-latency execution.</p>
      <div style="border-top: 1px solid #cbd5e1; width: 240px; padding-top: 8px; font-size: 10pt; color: #4b5563;">
        ARCHITECT // VOID_WEAVER<br />Certified Lead Automation Engineer
      </div>
    </div>`,
    markdownContent: '# Q3 CYBER TELEMETRY AUDIT\n\nLatency verified at Sub-15ms.'
  },
  {
    id: 'seed_enterprise_spec_8page',
    title: 'Enterprise-Cyber-Architecture-Specification',
    originalFileName: 'Enterprise-Cyber-Architecture-Specification.pdf',
    fileSize: 1240000,
    timestamp: Date.now() - 1000 * 60 * 30,
    pageCount: 8,
    tablesCount: 3,
    headingsCount: 12,
    category: 'Technical',
    tags: ['Technical', 'Long-Form', 'Architecture', 'Specification'],
    status: 'success',
    fidelityScore: 99.8,
    htmlContent: `<div style="font-family: Arial, sans-serif; line-height: 1.6; color: #1f2937; max-width: 800px; margin: 0 auto;">
      <h1 style="font-size: 24pt; font-weight: 800; color: #111827; border-bottom: 3px solid #FF003C; padding-bottom: 12px; margin-bottom: 8px;">ENTERPRISE CYBER ARCHITECTURE SPECIFICATION</h1>
      <p style="font-size: 11pt; color: #4b5563; margin-bottom: 16px;">Standard Technical Blueprint for High-Throughput Optical Neural Parsing, Real-Time Bidirectional Synchronization, and Zero-Trust Document Pipelines.</p>

      <h2 style="font-size: 15pt; color: #1f2937; margin-top: 20px; margin-bottom: 8px;">1. Executive Summary &amp; Architectural Objectives</h2>
      <p style="font-size: 10pt; color: #4b5563; margin-bottom: 12px;">This document establishes the official engineering guidelines for document reconstruction, vector typography replication, and Google Docs API schema fidelity on M2 Silicon edge hardware.</p>

      <div class="page-break" style="page-break-after: always; height: 0; border: none; margin: 0; padding: 0;"></div>

      <h2 style="font-size: 15pt; color: #1f2937; margin-top: 18px; margin-bottom: 8px;">2. Low-Latency Neural Ingestion Engine</h2>
      <p style="font-size: 10pt; color: #4b5563; margin-bottom: 10px;">The optical character recognition pipeline processes multi-page PDF documents through a cascading model topology.</p>
      <h3 style="font-size: 12pt; color: #374151; margin-top: 14px; margin-bottom: 6px;">2.1 Model Routing &amp; Latency Profiles</h3>
      <p style="font-size: 10pt; color: #4b5563; margin-bottom: 12px;">Sub-15ms regional edge gateways guarantee zero loss in structural hierarchy across arbitrary page geometries.</p>

      <div class="page-break" style="page-break-after: always; height: 0; border: none; margin: 0; padding: 0;"></div>

      <h2 style="font-size: 15pt; color: #1f2937; margin-top: 18px; margin-bottom: 8px;">3. Multi-Column &amp; Complex Table Extraction</h2>
      <p style="font-size: 10pt; color: #4b5563; margin-bottom: 12px;">Tables spanning page boundaries are normalized into semantic HTML matrix elements with synchronized border styles.</p>
      <table style="width: 100%; border-collapse: collapse; font-size: 10pt; margin: 12px 0;">
        <thead>
          <tr style="background-color: #f3f4f6;">
            <th style="border: 1px solid #d1d5db; padding: 8px; text-align: left;">Pipeline Component</th>
            <th style="border: 1px solid #d1d5db; padding: 8px; text-align: center;">Target Execution</th>
            <th style="border: 1px solid #d1d5db; padding: 8px; text-align: right;">Fidelity Threshold</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style="border: 1px solid #d1d5db; padding: 8px;">Tabular Grid Decomposer</td>
            <td style="border: 1px solid #d1d5db; padding: 8px; text-align: center;">4.2 ms</td>
            <td style="border: 1px solid #d1d5db; padding: 8px; text-align: right; color: #059669;">99.8%</td>
          </tr>
          <tr style="background-color: #f9fafb;">
            <td style="border: 1px solid #d1d5db; padding: 8px;">Vector Shape Extractor</td>
            <td style="border: 1px solid #d1d5db; padding: 8px; text-align: center;">6.1 ms</td>
            <td style="border: 1px solid #d1d5db; padding: 8px; text-align: right; color: #059669;">99.4%</td>
          </tr>
        </tbody>
      </table>

      <div class="page-break" style="page-break-after: always; height: 0; border: none; margin: 0; padding: 0;"></div>

      <h2 style="font-size: 15pt; color: #1f2937; margin-top: 18px; margin-bottom: 8px;">4. Typography &amp; Font Matching Hierarchy</h2>
      <p style="font-size: 10pt; color: #4b5563; margin-bottom: 10px;">Optical character metrics automatically map embedded Type 1 and TrueType postscript glyphs to universally supported Google Docs core typography families.</p>
      <h3 style="font-size: 12pt; color: #374151; margin-top: 12px; margin-bottom: 6px;">4.1 Proportional Kerning &amp; Line Heights</h3>
      <p style="font-size: 10pt; color: #4b5563;">Maintains optical step ratios of at least 1.25 for crisp document readability.</p>

      <div class="page-break" style="page-break-after: always; height: 0; border: none; margin: 0; padding: 0;"></div>

      <h2 style="font-size: 15pt; color: #1f2937; margin-top: 18px; margin-bottom: 8px;">5. Google Workspace API &amp; Drive Integration</h2>
      <p style="font-size: 10pt; color: #4b5563; margin-bottom: 12px;">The bidirectional clipboard and REST dispatchers format payloads for single-click insertion directly into Google Docs.</p>
      <h3 style="font-size: 12pt; color: #374151; margin-top: 12px; margin-bottom: 6px;">5.1 OAuth Token Lifecycle Management</h3>
      <p style="font-size: 10pt; color: #4b5563;">Tokens are safely managed client-side with zero exposure to external telemetry.</p>

      <div class="page-break" style="page-break-after: always; height: 0; border: none; margin: 0; padding: 0;"></div>

      <h2 style="font-size: 15pt; color: #1f2937; margin-top: 18px; margin-bottom: 8px;">6. Internationalization &amp; Neural Translation</h2>
      <p style="font-size: 10pt; color: #4b5563; margin-bottom: 12px;">Automatic language detection identifies source scripts and enables localized exports preserving native layout geometry.</p>

      <div class="page-break" style="page-break-after: always; height: 0; border: none; margin: 0; padding: 0;"></div>

      <h2 style="font-size: 15pt; color: #1f2937; margin-top: 18px; margin-bottom: 8px;">7. Security, Compliance &amp; Local Isolation</h2>
      <p style="font-size: 10pt; color: #4b5563; margin-bottom: 12px;">Local-first memory isolation ensures that sensitive client documents never leak beyond the container boundary.</p>

      <div class="page-break" style="page-break-after: always; height: 0; border: none; margin: 0; padding: 0;"></div>

      <h2 style="font-size: 15pt; color: #1f2937; margin-top: 18px; margin-bottom: 8px;">8. System Architecture Sign-Off &amp; Audit Log</h2>
      <p style="font-size: 10pt; color: #4b5563; margin-bottom: 24px;">All criteria verified and authorized for production deployment.</p>
      <div style="border-top: 1px solid #cbd5e1; width: 260px; padding-top: 8px; font-size: 10pt; color: #4b5563;">
        ARCHITECT // VOID_WEAVER<br />Lead Systems Architect
      </div>
    </div>`,
    markdownContent: '# ENTERPRISE CYBER ARCHITECTURE SPECIFICATION\n\n8-Page Long-form Technical Specification.'
  }
];

function loadInitialHistory(): ConversionHistoryItem[] {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const raw = localStorage.getItem(HISTORY_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Retroactively classify items that don't have a category assigned
          const normalized = parsed.map((item: ConversionHistoryItem) => {
            if (!item.category) {
              const classification = classifyDocument(
                item.title || item.originalFileName || '',
                item.htmlContent || ''
              );
              return { ...item, category: classification.category };
            }
            return item;
          });
          return normalized;
        }
      }
    }
  } catch (e) {
    console.error('Failed to load history from localStorage:', e);
  }
  // If empty, return default seeds so user immediately has documents to inspect
  saveHistoryToStorage(DEFAULT_SEED_DOCUMENTS);
  return DEFAULT_SEED_DOCUMENTS;
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
  
  viewMode: 'split' | 'doc_only' | 'pdf_only' | 'code' | 'readability';
  history: ConversionHistoryItem[];
  subscription: UserSubscription;
  exportConfig: GoogleDocsExportConfig;
  googleAccessToken: string;
  isExportModalOpen: boolean;
  isSettingsOpen: boolean;
  isPricingModalOpen: boolean;
  isShortcutsModalOpen: boolean;
  setIsShortcutsModalOpen: (open: boolean) => void;
  toggleShortcutsModal: () => void;

  // Local Storage Persistence Layer for Last 5 Conversions
  savedConversions: SavedConversionRecord[];
  activeSavedConversionId: string | null;

  // Draft Auto-Save Configuration
  isAutoSaveEnabled: boolean;
  lastAutoSavedAt: number | null;

  // Queue & Bulk Processing State
  queue: QueueItem[];
  isBulkProcessing: boolean;
  activeQueueId: string | null;

  // ===== START NEW CODE: THEME & BATCH RENAME STATE =====
  appTheme: AppTheme;
  setAppTheme: (theme: AppTheme) => void;
  toggleAppTheme: () => void;
  updateHistoryItemCategory: (id: string, category: DocumentCategory) => void;
  batchRenameHistoryItems: (ids: string[], config: BatchRenameConfig) => void;
  // ===== END NEW CODE: THEME & BATCH RENAME STATE =====

  // ===== START NEW CODE: OCR LOW-CONFIDENCE HIGHLIGHTER & VERIFICATION STATE =====
  isLowConfidenceHighlightEnabled: boolean;
  lowConfidenceFlags: LowConfidenceFlag[];
  activeFlagIndex: number;
  toggleLowConfidenceHighlight: () => void;
  setLowConfidenceFlags: (flags: LowConfidenceFlag[]) => void;
  setActiveFlagIndex: (index: number) => void;
  verifyFlag: (id: string, correctedText?: string) => void;
  dismissFlag: (id: string) => void;
  verifyAllFlags: () => void;
  // ===== END NEW CODE: OCR LOW-CONFIDENCE HIGHLIGHTER & VERIFICATION STATE =====
  
  // ===== START NEW CODE: FULLSCREEN, THUMBNAIL SIDEBAR, SEARCH & MODEL CASCADE STATE =====
  isFullscreen: boolean;
  toggleFullscreen: () => void;
  setIsFullscreen: (val: boolean) => void;

  isThumbnailSidebarOpen: boolean;
  toggleThumbnailSidebar: () => void;
  setIsThumbnailSidebarOpen: (val: boolean) => void;

  currentActivePage: number;
  setCurrentActivePage: (page: number) => void;

  searchQuery: string;
  setSearchQuery: (query: string) => void;
  searchMatchCount: number;
  setSearchMatchCount: (count: number) => void;
  currentSearchMatchIndex: number;
  setCurrentSearchMatchIndex: (idx: number) => void;

  geminiModelPreference: GeminiModelPreference;
  setGeminiModelPreference: (pref: GeminiModelPreference) => void;
  activeModelUsed: string;
  setActiveModelUsed: (model: string) => void;
  // ===== END NEW CODE: FULLSCREEN, THUMBNAIL SIDEBAR, SEARCH & MODEL CASCADE STATE =====

  // ===== START NEW CODE: LANGUAGE DETECTION, TRANSLATION & WEB SPEECH API TTS STATE =====
  detectedLanguage: DetectedLanguage | null;
  setDetectedLanguage: (lang: DetectedLanguage | null) => void;
  isTranslationModalOpen: boolean;
  setIsTranslationModalOpen: (open: boolean) => void;
  isTranslating: boolean;
  isTranslationOfferDismissed: boolean;
  dismissTranslationOffer: () => void;
  originalBackupHtml: string | null;
  originalBackupTitle: string | null;
  translateDocument: (targetLangCode: string) => Promise<boolean>;
  undoTranslation: () => void;

  ttsState: TTSState;
  isTTSPlayerOpen: boolean;
  setIsTTSPlayerOpen: (open: boolean) => void;
  toggleTTSPlayer: () => void;
  startTTS: (target?: 'all' | 'page' | 'selection', customContent?: string, pageNumber?: number) => void;
  pauseTTS: () => void;
  resumeTTS: () => void;
  stopTTS: () => void;
  setTTSRate: (rate: number) => void;
  setTTSPitch: (pitch: number) => void;
  setTTSVolume: (volume: number) => void;
  setTTSVoice: (voiceURI: string) => void;
  toggleTTSHighlight: () => void;
  // ===== END NEW CODE: LANGUAGE DETECTION, TRANSLATION & WEB SPEECH API TTS STATE =====

  // ===== START NEW CODE: AUTO-OCR SETTINGS & INGESTION TUNING STATE =====
  ingestionOcrSettings: IngestionOcrSettings;
  setIngestionOcrSettings: (settings: IngestionOcrSettings) => void;
  updateIngestionOcrSetting: <K extends keyof IngestionOcrSettings>(key: K, value: IngestionOcrSettings[K]) => void;
  autoConfigureOcrForLanguage: (lang: DetectedLanguage) => void;
  isOcrSettingsDrawerOpen: boolean;
  setIsOcrSettingsDrawerOpen: (open: boolean) => void;
  toggleOcrSettingsDrawer: () => void;
  // ===== END NEW CODE: AUTO-OCR SETTINGS & INGESTION TUNING STATE =====

  // ===== START NEW CODE: HIGH CONTRAST & CUSTOM TABLE MAPPING STATE =====
  isDocHighContrastEnabled: boolean;
  setIsDocHighContrastEnabled: (enabled: boolean) => void;
  toggleDocHighContrast: () => void;

  isCustomTableMappingOpen: boolean;
  setIsCustomTableMappingOpen: (open: boolean) => void;
  toggleCustomTableMapping: () => void;
  detectedTables: any[];
  setDetectedTables: (tables: any[]) => void;
  applyCustomTableColumnMapping: (updatedTables: any[]) => void;
  // ===== END NEW CODE: HIGH CONTRAST & CUSTOM TABLE MAPPING STATE =====

  // ===== START NEW CODE: INTERACTIVE TABLE OF CONTENTS STATE =====
  isTocPanelOpen: boolean;
  setIsTocPanelOpen: (open: boolean) => void;
  toggleTocPanel: () => void;
  // ===== END NEW CODE: INTERACTIVE TABLE OF CONTENTS STATE =====

  // Actions
  setPdf: (pdf: PdfDocument | null) => void;
  setStatus: (status: ConversionStatus, message?: string, progress?: number) => void;
  setResult: (result: ConversionResult) => void;
  setEditedHtml: (html: string) => void;
  setViewMode: (mode: 'split' | 'doc_only' | 'pdf_only' | 'code' | 'readability') => void;
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

  // Auto-Save Actions
  toggleAutoSaveDraft: () => void;
  setAutoSaveDraft: (enabled: boolean) => void;
  saveDraftToStorage: () => void;

  // Bulk Local Storage Purge Action
  clearAllSessionData: () => void;

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

const initialSavedRecords = getInitialSavedConversions();
const initialActiveSavedId = getLastActiveConversionId() || (initialSavedRecords.length > 0 ? initialSavedRecords[0].id : null);
const initialActiveRecord = initialSavedRecords.find((r) => r.id === initialActiveSavedId) || initialSavedRecords[0] || null;

let initialResult: ConversionResult | null = null;
let initialEditedHtml = '';
let initialFlags: LowConfidenceFlag[] = [];
let initialDetectedLanguage: DetectedLanguage | null = null;

if (initialActiveRecord) {
  initialResult = initialActiveRecord.result;
  const rawHtml = initialActiveRecord.editedHtml || initialActiveRecord.result.htmlContent || '';
  const scanned = scanAndInjectLowConfidenceMarkers(rawHtml);
  initialEditedHtml = scanned.flaggedHtml;
  initialFlags = scanned.flags;
  initialDetectedLanguage = initialResult.detectedLanguage || detectLanguageFromText(rawHtml);
}

export const useGameStore = create<GameStoreState>((set, get) => ({
  currentPdf: null,
  status: 'idle',
  progressPercent: 0,
  statusMessage: 'SYSTEM_STANDBY // WAITING_FOR_PDF_PAYLOAD',
  errorMessage: null,
  result: initialResult,
  editedHtml: initialEditedHtml,
  
  viewMode: 'doc_only',
  history: loadInitialHistory(),
  subscription: loadInitialSubscription(),
  exportConfig: initialResult ? { ...DEFAULT_EXPORT_CONFIG, docTitle: initialResult.documentTitle } : DEFAULT_EXPORT_CONFIG,
  googleAccessToken: '',
  isExportModalOpen: false,
  isSettingsOpen: false,
  isPricingModalOpen: false,
  isShortcutsModalOpen: false,
  setIsShortcutsModalOpen: (open: boolean) => set({ isShortcutsModalOpen: open }),
  toggleShortcutsModal: () => set((state) => ({ isShortcutsModalOpen: !state.isShortcutsModalOpen })),

  // Local Storage Persistence Layer for Last 5 Conversions
  savedConversions: initialSavedRecords,
  activeSavedConversionId: initialActiveSavedId,

  // Draft Auto-Save Configuration
  isAutoSaveEnabled: loadInitialAutoSave(),
  lastAutoSavedAt: null,

  // Queue State
  queue: [],
  isBulkProcessing: false,
  activeQueueId: null,

  // ===== START NEW CODE: THEME & BATCH RENAME ACTIONS =====
  appTheme: loadInitialTheme(),

  // ===== START NEW CODE: FULLSCREEN, THUMBNAIL SIDEBAR, SEARCH & MODEL CASCADE IMPLEMENTATION =====
  isFullscreen: false,
  toggleFullscreen: () => set((state) => ({ isFullscreen: !state.isFullscreen })),
  setIsFullscreen: (val: boolean) => set(() => ({ isFullscreen: val })),

  isThumbnailSidebarOpen: true,
  toggleThumbnailSidebar: () => set((state) => ({ isThumbnailSidebarOpen: !state.isThumbnailSidebarOpen })),
  setIsThumbnailSidebarOpen: (val: boolean) => set(() => ({ isThumbnailSidebarOpen: val })),

  currentActivePage: 1,
  setCurrentActivePage: (page: number) => set(() => ({ currentActivePage: page })),

  searchQuery: '',
  setSearchQuery: (query: string) => set(() => ({ searchQuery: query })),
  searchMatchCount: 0,
  setSearchMatchCount: (count: number) => set(() => ({ searchMatchCount: count })),
  currentSearchMatchIndex: 0,
  setCurrentSearchMatchIndex: (idx: number) => set(() => ({ currentSearchMatchIndex: idx })),

  geminiModelPreference: 'auto',
  setGeminiModelPreference: (pref: GeminiModelPreference) => set(() => ({ geminiModelPreference: pref })),
  activeModelUsed: initialResult?.modelUsed || 'gemini-flash-latest',
  setActiveModelUsed: (model: string) => set(() => ({ activeModelUsed: model })),
  // ===== END NEW CODE: FULLSCREEN, THUMBNAIL SIDEBAR, SEARCH & MODEL CASCADE IMPLEMENTATION =====

  // ===== START NEW CODE: HIGH CONTRAST & CUSTOM TABLE MAPPING IMPLEMENTATION =====
  isDocHighContrastEnabled: false,
  setIsDocHighContrastEnabled: (enabled: boolean) => set(() => ({ isDocHighContrastEnabled: enabled })),
  toggleDocHighContrast: () => set((state) => ({ isDocHighContrastEnabled: !state.isDocHighContrastEnabled })),

  isCustomTableMappingOpen: false,
  setIsCustomTableMappingOpen: (open: boolean) => set(() => ({ isCustomTableMappingOpen: open })),
  toggleCustomTableMapping: () => set((state) => ({ isCustomTableMappingOpen: !state.isCustomTableMappingOpen })),
  detectedTables: [],
  setDetectedTables: (tables: any[]) => set(() => ({ detectedTables: tables })),
  applyCustomTableColumnMapping: (updatedTables: any[]) => {
    set(() => ({ detectedTables: updatedTables }));

    // Transform active document HTML table headers with updated custom column names
    const currentHtml = get().editedHtml || get().result?.htmlContent || '';
    if (!currentHtml) return;

    let modifiedHtml = currentHtml;
    updatedTables.forEach((tbl) => {
      tbl.columns.forEach((col: any) => {
        if (col.originalName && col.mappedName && col.originalName !== col.mappedName) {
          // Replace matching <th> headers
          const thRegex = new RegExp(`<th([^>]*)>\\s*${col.originalName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*</th>`, 'gi');
          modifiedHtml = modifiedHtml.replace(thRegex, `<th$1>${col.mappedName}</th>`);
        }
      });
    });

    set(() => ({ editedHtml: modifiedHtml }));
  },
  // ===== END NEW CODE: HIGH CONTRAST & CUSTOM TABLE MAPPING IMPLEMENTATION =====

  // ===== START NEW CODE: INTERACTIVE TABLE OF CONTENTS IMPLEMENTATION =====
  isTocPanelOpen: false,
  setIsTocPanelOpen: (open: boolean) => set(() => ({ isTocPanelOpen: open })),
  toggleTocPanel: () => set((state) => ({ isTocPanelOpen: !state.isTocPanelOpen })),
  // ===== END NEW CODE: INTERACTIVE TABLE OF CONTENTS IMPLEMENTATION =====

  // ===== START NEW CODE: LANGUAGE DETECTION, TRANSLATION & WEB SPEECH API TTS IMPLEMENTATION =====
  detectedLanguage: initialDetectedLanguage,
  setDetectedLanguage: (lang: DetectedLanguage | null) => set(() => ({ detectedLanguage: lang })),

  isTranslationModalOpen: false,
  setIsTranslationModalOpen: (open: boolean) => set(() => ({ isTranslationModalOpen: open })),
  isTranslating: false,
  isTranslationOfferDismissed: false,
  dismissTranslationOffer: () => set(() => ({ isTranslationOfferDismissed: true })),
  originalBackupHtml: null,
  originalBackupTitle: null,

  translateDocument: async (targetLangCode: string) => {
    const currentHtml = get().editedHtml || get().result?.htmlContent || '';
    const currentResult = get().result;
    if (!currentHtml || !currentResult) return false;

    set(() => ({ isTranslating: true, isTranslationOfferDismissed: true }));
    const currentTitle = currentResult.documentTitle;
    const currentLang = get().detectedLanguage?.code || 'en';

    try {
      const currentModelPref = get().geminiModelPreference;
      const response = await translateDocumentContent(currentHtml, targetLangCode, currentLang, currentTitle, currentModelPref);
      
      const prevHtml = get().originalBackupHtml || currentHtml;
      const prevTitle = get().originalBackupTitle || currentTitle;

      const updatedResult: ConversionResult = {
        ...currentResult,
        documentTitle: response.translatedTitle,
        htmlContent: response.translatedHtml,
        isTranslated: true,
        detectedLanguage: response.targetLanguage ? {
          code: response.targetLanguage.code,
          name: response.targetLanguage.name,
          nativeName: response.targetLanguage.nativeName,
          flag: response.targetLanguage.flag,
          confidence: 1.0,
          isAutoDetected: false,
        } : currentResult.detectedLanguage,
        originalLanguage: currentResult.originalLanguage || get().detectedLanguage || undefined,
        translatedAt: Date.now(),
        modelUsed: response.modelUsed || currentResult.modelUsed,
      };

      // Rescan for low confidence markers if active
      let finalEdited = response.translatedHtml;
      let newFlags: LowConfidenceFlag[] = [];
      if (get().isLowConfidenceHighlightEnabled) {
        const scanned = scanAndInjectLowConfidenceMarkers(finalEdited);
        finalEdited = scanned.flaggedHtml;
        newFlags = scanned.flags;
      }

      const activeId = get().activeSavedConversionId;
      if (activeId) {
        updateRecentConversionHtml(activeId, finalEdited);
      }

      set(() => ({
        result: updatedResult,
        editedHtml: finalEdited,
        lowConfidenceFlags: newFlags,
        originalBackupHtml: prevHtml,
        originalBackupTitle: prevTitle,
        detectedLanguage: updatedResult.detectedLanguage || null,
        exportConfig: {
          ...get().exportConfig,
          docTitle: response.translatedTitle,
        },
        isTranslating: false,
        isTranslationModalOpen: false,
      }));
      return true;
    } catch (err) {
      console.error('Document translation error:', err);
      set(() => ({ isTranslating: false }));
      return false;
    }
  },

  undoTranslation: () => {
    const backupHtml = get().originalBackupHtml;
    const backupTitle = get().originalBackupTitle;
    const currentResult = get().result;
    if (!backupHtml || !currentResult) return;

    let restoredHtml = backupHtml;
    let newFlags: LowConfidenceFlag[] = [];
    if (get().isLowConfidenceHighlightEnabled) {
      const scanned = scanAndInjectLowConfidenceMarkers(restoredHtml);
      restoredHtml = scanned.flaggedHtml;
      newFlags = scanned.flags;
    }

    const originalLang = currentResult.originalLanguage || detectLanguageFromText(backupHtml);

    const revertedResult: ConversionResult = {
      ...currentResult,
      documentTitle: backupTitle || currentResult.documentTitle.replace(/\s*\[.*?\]|\s*\(.*?\)/g, ''),
      htmlContent: backupHtml,
      isTranslated: false,
      detectedLanguage: originalLang,
    };

    const activeId = get().activeSavedConversionId;
    if (activeId) {
      updateRecentConversionHtml(activeId, restoredHtml);
    }

    set(() => ({
      result: revertedResult,
      editedHtml: restoredHtml,
      lowConfidenceFlags: newFlags,
      detectedLanguage: originalLang,
      originalBackupHtml: null,
      originalBackupTitle: null,
      exportConfig: {
        ...get().exportConfig,
        docTitle: revertedResult.documentTitle,
      },
    }));
  },

  // Web Speech API Text-to-Speech
  ttsState: {
    status: 'idle',
    currentVoiceURI: '',
    rate: 1.0,
    pitch: 1.0,
    volume: 1.0,
    isHighlightEnabled: true,
    activeSpokenWord: '',
    activeCharIndex: 0,
    activeWordIndex: 0,
    totalWords: 0,
    progressPercent: 0,
    readTarget: 'all',
    activePageNumber: 1,
  },
  isTTSPlayerOpen: false,
  setIsTTSPlayerOpen: (open: boolean) => set(() => ({ isTTSPlayerOpen: open })),
  toggleTTSPlayer: () => set((state) => ({ isTTSPlayerOpen: !state.isTTSPlayerOpen })),

  startTTS: (target = 'all', customContent?: string, pageNumber = 1) => {
    const rawHtml = customContent || get().editedHtml || get().result?.htmlContent || '';
    if (!rawHtml) return;

    const lang = get().detectedLanguage?.code || 'en';
    const state = get().ttsState;

    speechSynth.speak(rawHtml, {
      langCode: lang,
      voiceURI: state.currentVoiceURI || undefined,
      rate: state.rate,
      pitch: state.pitch,
      volume: state.volume,
      isHtml: true,
    });

    set((s) => ({
      isTTSPlayerOpen: true,
      ttsState: {
        ...s.ttsState,
        status: 'playing',
        readTarget: target,
        activePageNumber: pageNumber,
      },
    }));
  },

  pauseTTS: () => {
    speechSynth.pause();
    set((s) => ({ ttsState: { ...s.ttsState, status: 'paused' } }));
  },

  resumeTTS: () => {
    speechSynth.resume();
    set((s) => ({ ttsState: { ...s.ttsState, status: 'playing' } }));
  },

  stopTTS: () => {
    speechSynth.stop();
    set((s) => ({
      ttsState: {
        ...s.ttsState,
        status: 'idle',
        activeSpokenWord: '',
        progressPercent: 0,
        activeCharIndex: 0,
        activeWordIndex: 0,
      },
    }));
  },

  setTTSRate: (rate: number) => {
    speechSynth.setRate(rate);
    set((s) => ({ ttsState: { ...s.ttsState, rate } }));
  },

  setTTSPitch: (pitch: number) => {
    speechSynth.setPitch(pitch);
    set((s) => ({ ttsState: { ...s.ttsState, pitch } }));
  },

  setTTSVolume: (volume: number) => {
    speechSynth.setVolume(volume);
    set((s) => ({ ttsState: { ...s.ttsState, volume } }));
  },

  setTTSVoice: (voiceURI: string) => {
    speechSynth.setVoice(voiceURI);
    set((s) => ({ ttsState: { ...s.ttsState, currentVoiceURI: voiceURI } }));
  },

  toggleTTSHighlight: () => {
    set((s) => ({
      ttsState: {
        ...s.ttsState,
        isHighlightEnabled: !s.ttsState.isHighlightEnabled,
      },
    }));
  },
  // ===== END NEW CODE: LANGUAGE DETECTION, TRANSLATION & WEB SPEECH API TTS IMPLEMENTATION =====

  // ===== START NEW CODE: AUTO-OCR SETTINGS & INGESTION TUNING IMPLEMENTATION =====
  ingestionOcrSettings: DEFAULT_INGESTION_OCR_SETTINGS,

  setIngestionOcrSettings: (settings: IngestionOcrSettings) => set(() => ({ ingestionOcrSettings: settings })),

  updateIngestionOcrSetting: <K extends keyof IngestionOcrSettings>(key: K, value: IngestionOcrSettings[K]) => {
    set((state) => ({
      ingestionOcrSettings: {
        ...state.ingestionOcrSettings,
        [key]: value,
      },
    }));
  },

  autoConfigureOcrForLanguage: (lang: DetectedLanguage) => {
    const computed = getAutoOcrSettingsForLanguage(lang);
    set(() => ({
      detectedLanguage: lang,
      ingestionOcrSettings: computed,
    }));
  },

  isOcrSettingsDrawerOpen: false,
  setIsOcrSettingsDrawerOpen: (open: boolean) => set(() => ({ isOcrSettingsDrawerOpen: open })),
  toggleOcrSettingsDrawer: () => set((state) => ({ isOcrSettingsDrawerOpen: !state.isOcrSettingsDrawerOpen })),
  // ===== END NEW CODE: AUTO-OCR SETTINGS & INGESTION TUNING IMPLEMENTATION =====

  // ===== START NEW CODE: OCR LOW-CONFIDENCE HIGHLIGHTER & VERIFICATION ACTIONS =====
  isLowConfidenceHighlightEnabled: true,
  lowConfidenceFlags: initialFlags,
  activeFlagIndex: initialFlags.length > 0 ? 0 : 0,

  toggleLowConfidenceHighlight: () => {
    const nextState = !get().isLowConfidenceHighlightEnabled;
    const currentHtml = get().editedHtml || get().result?.htmlContent || '';
    
    if (nextState) {
      // Re-scan and inject markers
      const { flaggedHtml, flags } = scanAndInjectLowConfidenceMarkers(currentHtml);
      set(() => ({
        isLowConfidenceHighlightEnabled: true,
        editedHtml: flaggedHtml,
        lowConfidenceFlags: flags,
        activeFlagIndex: 0,
      }));
    } else {
      // Strip markers so editor displays clean text
      const clean = stripLowConfidenceMarkers(currentHtml);
      set(() => ({
        isLowConfidenceHighlightEnabled: false,
        editedHtml: clean,
      }));
    }
  },

  setLowConfidenceFlags: (flags: LowConfidenceFlag[]) => set(() => ({ lowConfidenceFlags: flags })),
  setActiveFlagIndex: (index: number) => set(() => ({ activeFlagIndex: index })),

  verifyFlag: (flagId: string, correctedText?: string) => {
    const flags = get().lowConfidenceFlags;
    const currentHtml = get().editedHtml;
    const flag = flags.find((f) => f.id === flagId);
    if (!flag) return;

    let updatedHtml = currentHtml;
    const regex = new RegExp(`<mark[^>]*id="${flagId}"[^>]*>([\\s\\S]*?)<\\/mark>`, 'i');
    const replacementText = correctedText !== undefined ? correctedText : flag.originalWord;
    updatedHtml = updatedHtml.replace(regex, replacementText);

    const updatedFlags = flags.map((f) => (f.id === flagId ? { ...f, isVerified: true } : f));
    set(() => ({
      editedHtml: updatedHtml,
      lowConfidenceFlags: updatedFlags,
    }));
  },

  dismissFlag: (flagId: string) => {
    get().verifyFlag(flagId);
  },

  verifyAllFlags: () => {
    const currentHtml = get().editedHtml;
    const clean = stripLowConfidenceMarkers(currentHtml);
    const updatedFlags = get().lowConfidenceFlags.map((f) => ({ ...f, isVerified: true }));
    set(() => ({
      editedHtml: clean,
      lowConfidenceFlags: updatedFlags,
    }));
  },
  // ===== END NEW CODE: OCR LOW-CONFIDENCE HIGHLIGHTER & VERIFICATION ACTIONS =====

  setAppTheme: (theme: AppTheme) => {
    applyThemeToDocument(theme);
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem(THEME_STORAGE_KEY, theme);
      }
    } catch (e) {
      console.error('Failed to persist theme:', e);
    }
    set(() => ({ appTheme: theme }));
  },

  toggleAppTheme: () => {
    const current = get().appTheme;
    const next: AppTheme = current === 'cyberpunk' ? 'light' : 'cyberpunk';
    get().setAppTheme(next);
  },

  updateHistoryItemCategory: (id: string, category: DocumentCategory) => {
    const current = get().history;
    const updated = current.map((item) => {
      if (item.id === id) {
        return { ...item, category };
      }
      return item;
    });
    saveHistoryToStorage(updated);
    set(() => ({ history: updated }));
  },

  batchRenameHistoryItems: (ids: string[], config: BatchRenameConfig) => {
    const targetIds = new Set(ids);
    const current = get().history;
    const { prefix, suffix, findText, replaceText } = config;

    const updated = current.map((item) => {
      if (!targetIds.has(item.id)) return item;

      let currentBaseName = (item.originalFileName || item.title).replace(/\.pdf$/i, '');

      // Apply find and replace if provided
      if (findText) {
        try {
          // Replace all occurrences
          currentBaseName = currentBaseName.split(findText).join(replaceText);
        } catch (err) {
          console.warn('Regex or string replace error:', err);
        }
      }

      // Apply prefix and suffix
      const newBaseName = `${prefix || ''}${currentBaseName}${suffix || ''}`;
      const newTitle = newBaseName;
      const newFileName = `${newBaseName}.pdf`;

      return {
        ...item,
        title: newTitle,
        originalFileName: newFileName,
      };
    });

    saveHistoryToStorage(updated);

    // Also update current active document title if active document was renamed
    const activeDoc = get().result;
    const activeId = get().activeSavedConversionId;
    let nextResult = activeDoc;
    if (activeDoc && activeId && targetIds.has(activeId)) {
      const matchingRenamed = updated.find((u) => u.id === activeId);
      if (matchingRenamed) {
        nextResult = {
          ...activeDoc,
          documentTitle: matchingRenamed.title,
        };
      }
    }

    set(() => ({
      history: updated,
      result: nextResult,
      exportConfig: nextResult ? { ...get().exportConfig, docTitle: nextResult.documentTitle } : get().exportConfig,
    }));
  },
  // ===== END NEW CODE: THEME & BATCH RENAME ACTIONS =====

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

    // Automatically detect primary language and metadata tags if not provided
    const detectedLang = result.detectedLanguage || detectLanguageFromText(result.htmlContent);
    const classification = classifyDocument(
      result.documentTitle,
      result.htmlContent
    );
    const enrichedResult: ConversionResult = {
      ...result,
      detectedLanguage: detectedLang,
      tags: result.tags && result.tags.length > 0 ? result.tags : classification.tags,
    };

    // Automatically scan and inject low-confidence OCR markers if enabled
    const isLowConfEnabled = get().isLowConfidenceHighlightEnabled;
    let initialHtml = enrichedResult.htmlContent;
    let detectedFlags: LowConfidenceFlag[] = [];

    if (isLowConfEnabled) {
      const scanResult = scanAndInjectLowConfidenceMarkers(initialHtml);
      initialHtml = scanResult.flaggedHtml;
      detectedFlags = scanResult.flags;
    }

    // Automatically persist to the last 5 conversion results layer
    const savedRecord: SavedConversionRecord = {
      id: docId,
      title: enrichedResult.documentTitle,
      originalFileName: fileName,
      timestamp: Date.now(),
      result: enrichedResult,
      editedHtml: initialHtml,
      fileSize: activePdf?.size || 150000,
      pageCount: enrichedResult.stats.pages || 1,
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
      result: enrichedResult,
      editedHtml: initialHtml,
      lowConfidenceFlags: detectedFlags,
      activeFlagIndex: 0,
      status: 'completed',
      progressPercent: 100,
      statusMessage: 'CONVERSION_SUCCESSFUL // DOCUMENT_READY',
      savedConversions: updatedSaved,
      activeSavedConversionId: docId,
      detectedLanguage: detectedLang,
      isTranslationOfferDismissed: false,
      activeModelUsed: enrichedResult.modelUsed || get().activeModelUsed,
      exportConfig: {
        ...get().exportConfig,
        docTitle: enrichedResult.documentTitle,
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
    // Ensure item has automated category and tags assigned based on content and title
    const classification = classifyDocument(
      item.title || item.originalFileName || '',
      item.htmlContent || item.markdownContent || ''
    );
    const resolvedCategory = item.category || classification.category;
    const resolvedTags = item.tags && item.tags.length > 0 ? item.tags : classification.tags;

    const categorizedItem: ConversionHistoryItem = {
      ...item,
      category: resolvedCategory,
      tags: resolvedTags,
    };

    const current = get().history;
    const filtered = current.filter((h) => h.id !== categorizedItem.id);
    const updated = [categorizedItem, ...filtered].slice(0, 50);
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
    let targetHtml = item.editedHtml || item.result.htmlContent;
    let detectedFlags: LowConfidenceFlag[] = [];
    if (get().isLowConfidenceHighlightEnabled) {
      const scanResult = scanAndInjectLowConfidenceMarkers(targetHtml);
      targetHtml = scanResult.flaggedHtml;
      detectedFlags = scanResult.flags;
    }

    set(() => ({
      activeSavedConversionId: item.id,
      editedHtml: targetHtml,
      lowConfidenceFlags: detectedFlags,
      activeFlagIndex: 0,
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
    let targetHtml = item.htmlContent;
    let detectedFlags: LowConfidenceFlag[] = [];
    if (get().isLowConfidenceHighlightEnabled) {
      const scanResult = scanAndInjectLowConfidenceMarkers(targetHtml);
      targetHtml = scanResult.flaggedHtml;
      detectedFlags = scanResult.flags;
    }

    set(() => ({
      activeSavedConversionId: item.id,
      editedHtml: targetHtml,
      lowConfidenceFlags: detectedFlags,
      activeFlagIndex: 0,
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

  // ===== START NEW CODE: DRAFT AUTO-SAVE TO LOCAL STORAGE ACTIONS =====
  toggleAutoSaveDraft: () => {
    const nextState = !get().isAutoSaveEnabled;
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem(AUTOSAVE_SETTINGS_KEY, String(nextState));
      }
    } catch (e) {
      console.error('Failed to save autosave setting:', e);
    }
    set(() => ({ isAutoSaveEnabled: nextState }));
    if (nextState) {
      get().saveDraftToStorage();
    }
  },

  setAutoSaveDraft: (enabled: boolean) => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem(AUTOSAVE_SETTINGS_KEY, String(enabled));
      }
    } catch (e) {
      console.error('Failed to set autosave setting:', e);
    }
    set(() => ({ isAutoSaveEnabled: enabled }));
    if (enabled) {
      get().saveDraftToStorage();
    }
  },

  saveDraftToStorage: () => {
    const { editedHtml, result, currentPdf, activeSavedConversionId, isAutoSaveEnabled } = get();
    if (!isAutoSaveEnabled || !editedHtml) return;

    try {
      const draftPayload = {
        html: editedHtml,
        title: result?.documentTitle || currentPdf?.name || 'Untitled Reconstructed Document',
        timestamp: Date.now(),
        id: activeSavedConversionId || ('draft_' + Date.now()),
      };
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draftPayload));
      }
      if (activeSavedConversionId) {
        updateRecentConversionHtml(activeSavedConversionId, editedHtml);
      }
      set(() => ({ lastAutoSavedAt: Date.now() }));
    } catch (err) {
      console.warn('[AutoSave] Quota or storage write warning:', err);
    }
  },
  // ===== END NEW CODE: DRAFT AUTO-SAVE TO LOCAL STORAGE ACTIONS =====

  // ===== START NEW CODE: BULK CLEAR ALL SAVED SESSION DATA (SINGLE CLICK) =====
  clearAllSessionData: () => {
    saveHistoryToStorage([]);
    clearAllSavedConversions();
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.removeItem(DRAFT_STORAGE_KEY);
        localStorage.removeItem('cyber_pdf_recent_conversions_v5');
        localStorage.removeItem('cyber_pdf_last_active_doc_id_v5');
        localStorage.removeItem('cyber_pdf_conversion_history_v1');
      }
    } catch (e) {
      console.error('Failed to flush local storage session data:', e);
    }
    set(() => ({
      history: [],
      savedConversions: [],
      activeSavedConversionId: null,
      editedHtml: '',
      result: null,
      currentPdf: null,
      status: 'idle',
      statusMessage: 'ALL_SESSION_DATA_PURGED // LOCAL_STORAGE_CLEARED',
    }));
  },
  // ===== END NEW CODE: BULK CLEAR ALL SAVED SESSION DATA (SINGLE CLICK) =====
}));

// ===== START NEW CODE: BIND SPEECH SYNTHESIS REAL-TIME CALLBACKS TO ZUSTAND STORE =====
speechSynth.setCallbacks({
  onStatusChange: (status) => {
    useGameStore.setState((state) => ({
      ttsState: { ...state.ttsState, status },
    }));
  },
  onWordBoundary: (word, charIndex, wordIndex, totalWords) => {
    const progress = totalWords > 0 ? Math.min(100, Math.round(((wordIndex + 1) / totalWords) * 100)) : 0;
    useGameStore.setState((state) => ({
      ttsState: {
        ...state.ttsState,
        activeSpokenWord: word,
        activeCharIndex: charIndex,
        activeWordIndex: wordIndex,
        totalWords,
        progressPercent: progress,
      },
    }));
  },
  onEnd: () => {
    useGameStore.setState((state) => ({
      ttsState: {
        ...state.ttsState,
        status: 'idle',
        activeSpokenWord: '',
        progressPercent: 100,
      },
    }));
  },
  onError: (err) => {
    console.warn('[WebSpeechSynth] Error event:', err);
    useGameStore.setState((state) => ({
      ttsState: {
        ...state.ttsState,
        status: 'idle',
      },
    }));
  },
});
// ===== END NEW CODE: BIND SPEECH SYNTHESIS REAL-TIME CALLBACKS TO ZUSTAND STORE =====

// ===== END NEW CODE: DOCUMENT & CONVERSION STORE WITH BULK QUEUE & LOCAL PERSISTENCE =====

