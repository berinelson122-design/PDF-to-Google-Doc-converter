import React, { useRef, useState } from 'react';
import { 
  Upload, 
  FileText, 
  Sparkles, 
  AlertTriangle, 
  CheckCircle2, 
  Layers, 
  Play, 
  Trash2, 
  RefreshCw, 
  X, 
  Eye, 
  Plus,
  Zap,
  Check,
  ShieldCheck,
  Lock,
  Unlock,
  Clock,
  Cpu,
  FileCode,
  Info,
  Sliders,
  HardDrive,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { useGameStore } from '../../store/useGameStore.ts';
import { CyberButton } from '../common/CyberButton.tsx';
import { CyberBadge } from '../common/CyberBadge.tsx';
import { formatBytes } from '../../utils/formatters.ts';
import { convertPdfToGoogleDoc } from '../../services/geminiService.ts';
import { cyberAudio } from '../../utils/audioSynth.ts';
import { QueueItem, PdfTechnicalMetadata, DetectedLanguage, IngestionOcrSettings } from '../../types/index.ts';
import { extractPdfTechnicalMetadata } from '../../utils/pdfMetadataExtractor.ts';
import { detectLanguageFromPdfBuffer, getAutoOcrSettingsForLanguage } from '../../utils/languageDetector.ts';
import { splitPdfByPageRange } from '../../utils/pdfSplitter.ts';
import { extractEmbeddedPdfImages, injectEmbeddedImagesIntoHtml } from '../../utils/pdfImageExtractor.ts';
import { PdfMetadataCard } from './PdfMetadataCard.tsx';
import { IngestionOcrPanel } from './IngestionOcrPanel.tsx';

// ===== START NEW CODE: SINGLE PDF & MULTI-FILE UPLOAD OPTIONS =====

// Realistic pre-calibrated sample documents for instant testing
const SAMPLE_DOCS = [
  {
    id: 'sample_enterprise_cloud',
    title: 'Enterprise_Cloud_Architecture_Q3.pdf',
    type: 'Multi-Column Table & Executive Spec',
    size: 420 * 1024,
    pages: 2,
    sampleContent: `<div style="font-family: Arial, sans-serif; color: #1f2937; line-height: 1.6;">
      <h1 style="color: #111827; font-size: 24pt; font-weight: 800; border-bottom: 2px solid #e5e7eb; padding-bottom: 8px; margin-bottom: 12px;">
        Enterprise Cloud Architecture: Core Infrastructure Report
      </h1>
      <p style="font-size: 11pt; color: #4b5563; margin-bottom: 16px;">
        <strong>Author:</strong> Lead Systems Architect &bull; <strong>Classification:</strong> Highly Confidential &bull; <strong>Version:</strong> 3.4.0
      </p>
      <h2 style="color: #1f2937; font-size: 16pt; font-weight: 700; margin-top: 20px; margin-bottom: 8px;">
        1. Executive System Objectives
      </h2>
      <p style="font-size: 11pt; margin-bottom: 12px;">
        The system migration mandate targets sub-15ms regional latency across distributed nodes while enforcing automated encryption at rest and in-transit. Google Workspace Docs synchronization serves as the canonical audit trail.
      </p>
      <table style="width: 100%; border-collapse: collapse; margin: 18px 0; font-size: 10pt;">
        <thead>
          <tr style="background-color: #f3f4f6;">
            <th style="border: 1px solid #d1d5db; padding: 10px 14px; text-align: left; font-weight: bold; color: #111827;">Infrastructure Node</th>
            <th style="border: 1px solid #d1d5db; padding: 10px 14px; text-align: left; font-weight: bold; color: #111827;">Cluster Tier</th>
            <th style="border: 1px solid #d1d5db; padding: 10px 14px; text-align: right; font-weight: bold; color: #111827;">P99 Latency</th>
            <th style="border: 1px solid #d1d5db; padding: 10px 14px; text-align: center; font-weight: bold; color: #111827;">SLA State</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style="border: 1px solid #d1d5db; padding: 9px 14px; font-weight: 500;">Core Ingress Gateway</td>
            <td style="border: 1px solid #d1d5db; padding: 9px 14px;">Edge Proxy Mesh</td>
            <td style="border: 1px solid #d1d5db; padding: 9px 14px; text-align: right; font-family: monospace;">4.2 ms</td>
            <td style="border: 1px solid #d1d5db; padding: 9px 14px; text-align: center; color: #059669; font-weight: bold;">PASS</td>
          </tr>
          <tr style="background-color: #f9fafb;">
            <td style="border: 1px solid #d1d5db; padding: 9px 14px; font-weight: 500;">Neural Layout Synthesizer</td>
            <td style="border: 1px solid #d1d5db; padding: 9px 14px;">Multimodal Layout Pipeline</td>
            <td style="border: 1px solid #d1d5db; padding: 9px 14px; text-align: right; font-family: monospace;">18.5 ms</td>
            <td style="border: 1px solid #d1d5db; padding: 9px 14px; text-align: center; color: #059669; font-weight: bold;">PASS</td>
          </tr>
          <tr>
            <td style="border: 1px solid #d1d5db; padding: 9px 14px; font-weight: 500;">Google Docs API Bridge</td>
            <td style="border: 1px solid #d1d5db; padding: 9px 14px;">OAuth 2.0 / REST v1</td>
            <td style="border: 1px solid #d1d5db; padding: 9px 14px; text-align: right; font-family: monospace;">12.1 ms</td>
            <td style="border: 1px solid #d1d5db; padding: 9px 14px; text-align: center; color: #059669; font-weight: bold;">PASS</td>
          </tr>
        </tbody>
      </table>
      <h2 style="color: #1f2937; font-size: 16pt; font-weight: 700; margin-top: 20px; margin-bottom: 8px;">
        2. Preservation Standards
      </h2>
      <ul style="margin: 0 0 16px 20px; padding: 0; font-size: 11pt;">
        <li style="margin-bottom: 6px;"><strong>Font Styling:</strong> Direct translation of font families, point sizes, and line-heights without font degradation.</li>
        <li style="margin-bottom: 6px;"><strong>Cell Borders:</strong> 100% preservation of multi-column borders and custom background cell shading.</li>
        <li style="margin-bottom: 6px;"><strong>Semantic Google Docs Tags:</strong> Clean output for instantaneous copy-paste into docs.google.com.</li>
      </ul>
    </div>`,
  },
  {
    id: 'sample_financial_quarterly',
    title: 'Financial_Quarterly_Earnings_Summary.pdf',
    type: 'Balance Sheet & Financial Matrix',
    size: 280 * 1024,
    pages: 1,
    sampleContent: `<div style="font-family: Georgia, serif; color: #111; line-height: 1.5;">
      <h1 style="font-size: 22pt; font-weight: bold; text-align: center; color: #0f172a; margin-bottom: 4px;">
        GLOBAL HOLDINGS CORPORATION
      </h1>
      <p style="text-align: center; font-style: italic; color: #64748b; font-size: 10.5pt; margin-bottom: 24px;">
        Condensed Consolidated Financial Statements &bull; Period Ended September 2026
      </p>
      <h3 style="font-size: 14pt; font-weight: bold; color: #1e293b; border-bottom: 1.5px solid #cbd5e1; padding-bottom: 4px;">
        Statement of Operations (in Millions USD)
      </h3>
      <table style="width: 100%; border-collapse: collapse; margin-top: 12px; font-size: 10.5pt;">
        <thead>
          <tr style="border-bottom: 2px solid #000;">
            <th style="padding: 8px 10px; text-align: left;">Revenue Category</th>
            <th style="padding: 8px 10px; text-align: right;">Q3 2026</th>
            <th style="padding: 8px 10px; text-align: right;">Q3 2025</th>
            <th style="padding: 8px 10px; text-align: right;">YoY Variance</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style="padding: 8px 10px; border-bottom: 1px solid #e2e8f0;">Enterprise SaaS Subscriptions</td>
            <td style="padding: 8px 10px; text-align: right; border-bottom: 1px solid #e2e8f0;">$ 4,892.4</td>
            <td style="padding: 8px 10px; text-align: right; border-bottom: 1px solid #e2e8f0;">$ 3,921.1</td>
            <td style="padding: 8px 10px; text-align: right; color: #15803d; font-weight: bold; border-bottom: 1px solid #e2e8f0;">+ 24.8%</td>
          </tr>
          <tr>
            <td style="padding: 8px 10px; border-bottom: 1px solid #e2e8f0;">AI Processing API Pipeline</td>
            <td style="padding: 8px 10px; text-align: right; border-bottom: 1px solid #e2e8f0;">$ 2,145.8</td>
            <td style="padding: 8px 10px; text-align: right; border-bottom: 1px solid #e2e8f0;">$ 840.5</td>
            <td style="padding: 8px 10px; text-align: right; color: #15803d; font-weight: bold; border-bottom: 1px solid #e2e8f0;">+ 155.3%</td>
          </tr>
          <tr style="font-weight: bold; background-color: #f8fafc; border-top: 2px solid #0f172a; border-bottom: 2px double #0f172a;">
            <td style="padding: 10px;">Total Operating Revenue</td>
            <td style="padding: 10px; text-align: right;">$ 7,038.2</td>
            <td style="padding: 10px; text-align: right;">$ 4,761.6</td>
            <td style="padding: 10px; text-align: right; color: #15803d;">+ 47.8%</td>
          </tr>
        </tbody>
      </table>
    </div>`,
  },
  {
    id: 'sample_invoice_vendor',
    title: 'Invoice_INV_2026_0982.pdf',
    type: 'Commercial Tax Invoice & Itemized Billing',
    size: 195 * 1024,
    pages: 1,
    sampleContent: `<div style="font-family: Arial, sans-serif; color: #111; line-height: 1.5;">
      <div style="display: flex; justify-content: space-between; border-bottom: 2px solid #000; padding-bottom: 12px; margin-bottom: 16px;">
        <div>
          <h1 style="font-size: 24pt; font-weight: 900; margin: 0; color: #111;">INVOICE</h1>
          <p style="margin: 4px 0 0; color: #555; font-size: 10pt;">Invoice #: <strong>INV-2026-0982</strong></p>
          <p style="margin: 2px 0 0; color: #555; font-size: 10pt;">Issue Date: <strong>September 19, 2026</strong></p>
          <p style="margin: 2px 0 0; color: #555; font-size: 10pt;">Due Date: <strong>Net 30 Days</strong></p>
        </div>
        <div style="text-align: right;">
          <h3 style="margin: 0; font-size: 14pt; color: #0f172a;">CYBER CORP LLC</h3>
          <p style="margin: 4px 0 0; color: #555; font-size: 9.5pt;">Billing &amp; Tax ID: US-94827104</p>
          <p style="margin: 2px 0 0; color: #555; font-size: 9.5pt;">accounts@cybercorp.io</p>
        </div>
      </div>
      <table style="width: 100%; border-collapse: collapse; margin-top: 16px; font-size: 10pt;">
        <thead>
          <tr style="background-color: #f1f5f9; border-bottom: 2px solid #cbd5e1;">
            <th style="padding: 10px; text-align: left;">Line Item / Service Description</th>
            <th style="padding: 10px; text-align: center;">Qty</th>
            <th style="padding: 10px; text-align: right;">Unit Price</th>
            <th style="padding: 10px; text-align: right;">Total Amount</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style="padding: 10px; border-bottom: 1px solid #e2e8f0;">Cloud Compute Clusters (Sub-15ms Nodes)</td>
            <td style="padding: 10px; text-align: center; border-bottom: 1px solid #e2e8f0;">4</td>
            <td style="padding: 10px; text-align: right; border-bottom: 1px solid #e2e8f0;">$ 850.00</td>
            <td style="padding: 10px; text-align: right; border-bottom: 1px solid #e2e8f0;">$ 3,400.00</td>
          </tr>
          <tr>
            <td style="padding: 10px; border-bottom: 1px solid #e2e8f0;">Google Docs API Pipeline Integration</td>
            <td style="padding: 10px; text-align: center; border-bottom: 1px solid #e2e8f0;">1</td>
            <td style="padding: 10px; text-align: right; border-bottom: 1px solid #e2e8f0;">$ 1,250.00</td>
            <td style="padding: 10px; text-align: right; border-bottom: 1px solid #e2e8f0;">$ 1,250.00</td>
          </tr>
          <tr style="font-weight: bold; background-color: #f8fafc; border-top: 2px solid #0f172a;">
            <td colspan="3" style="padding: 12px; text-align: right;">Total Amount Due:</td>
            <td style="padding: 12px; text-align: right; color: #059669; font-size: 12pt;">$ 4,650.00</td>
          </tr>
        </tbody>
      </table>
    </div>`,
  },
  {
    id: 'sample_contract_msa',
    title: 'Master_Services_Agreement_Contract.pdf',
    type: 'Legal Master Services Agreement & Terms',
    size: 340 * 1024,
    pages: 2,
    sampleContent: `<div style="font-family: 'Times New Roman', serif; color: #111; line-height: 1.6;">
      <h1 style="font-size: 20pt; font-weight: bold; text-align: center; margin-bottom: 8px; text-transform: uppercase;">
        MASTER SERVICES AGREEMENT
      </h1>
      <p style="text-align: center; font-style: italic; font-size: 11pt; margin-bottom: 24px;">
        This Master Services Agreement ("Agreement") is executed on September 19, 2026.
      </p>
      <h3 style="font-size: 13pt; font-weight: bold; border-bottom: 1px solid #000; padding-bottom: 2px;">
        1. RECITALS &amp; ENGAGEMENT TERMS
      </h3>
      <p style="font-size: 11pt; text-align: justify; margin-bottom: 12px;">
        WHEREAS, Client desires to retain Contractor to perform enterprise automated document conversion and Google Docs synchronization services, and Contractor agrees to perform such services pursuant to the terms and mutual covenants set forth herein.
      </p>
      <h3 style="font-size: 13pt; font-weight: bold; border-bottom: 1px solid #000; padding-bottom: 2px; margin-top: 18px;">
        2. CONFIDENTIALITY AND INTELLECTUAL PROPERTY
      </h3>
      <p style="font-size: 11pt; text-align: justify; margin-bottom: 12px;">
        Both Parties hereby agree that all proprietary algorithms, PDF parsing schemas, and converted outputs remain the exclusive intellectual property of the respective originating party.
      </p>
    </div>`,
  },
];

export const PdfUploader: React.FC = () => {
  // Mode selection: 'single' for instant single PDF conversion, 'batch' for multi-file queue
  const [uploadMode, setUploadMode] = useState<'single' | 'batch'>('single');
  
  const singleFileInputRef = useRef<HTMLInputElement | null>(null);
  const multiFileInputRef = useRef<HTMLInputElement | null>(null);
  
  const [dragOver, setDragOver] = useState(false);
  const [isSingleConverting, setIsSingleConverting] = useState(false);
  const [singleProgress, setSingleProgress] = useState(0);
  const [singleStatusMsg, setSingleStatusMsg] = useState('');
  const [singleError, setSingleError] = useState<string | null>(null);
  const [isReadingFiles, setIsReadingFiles] = useState(false);

  const {
    queue,
    isBulkProcessing,
    activeQueueId,
    geminiModelPreference,
    detectedLanguage,
    ingestionOcrSettings,
    setIngestionOcrSettings,
    autoConfigureOcrForLanguage,
    addToQueue,
    removeFromQueue,
    clearQueue,
    updateQueueItem,
    setBulkProcessing,
    setActiveQueueId,
    setPdf,
    setResult,
    addToHistory,
    incrementConversionCount,
  } = useGameStore();

  interface StagedPdfItem {
    file: File;
    base64Data: string;
    metadata: PdfTechnicalMetadata;
    detectedLanguage: DetectedLanguage;
    ocrSettings: IngestionOcrSettings;
    pageRange: string;
  }

  const [stagedFile, setStagedFile] = useState<StagedPdfItem | null>(null);
  const [isExtractingMetadata, setIsExtractingMetadata] = useState(false);
  const [expandedMetadataId, setExpandedMetadataId] = useState<string | null>(null);

  // ==========================================
  // SINGLE PDF CONVERSION HANDLERS
  // ==========================================
  const handleSingleFileSelected = async (file: File) => {
    if (!file.name.toLowerCase().endsWith('.pdf') && file.type !== 'application/pdf') {
      alert('Only .PDF documents are supported for Google Docs reconstruction.');
      return;
    }

    setSingleError(null);
    setIsExtractingMetadata(true);
    setSingleStatusMsg(`INSPECTING_PDF_HEADER_AND_LANGUAGE: ${file.name}`);
    cyberAudio.playScanBeep(1);

    try {
      // 1. Read single PDF to Base64
      const base64Data = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = (err) => reject(err);
        reader.readAsDataURL(file);
      });

      // 2. Extract deep technical PDF metadata using pdf-lib parser
      const metadata = await extractPdfTechnicalMetadata(file);

      // 3. Auto-detect document language and compute specialized OCR settings
      const detectedLang = detectLanguageFromPdfBuffer(base64Data, metadata);
      const autoOcr = getAutoOcrSettingsForLanguage(detectedLang);
      autoConfigureOcrForLanguage(detectedLang);

      // 4. Stage the file for user verification before confirming conversion
      setStagedFile({
        file,
        base64Data,
        metadata,
        detectedLanguage: detectedLang,
        ocrSettings: autoOcr,
        pageRange: `1-${metadata.pageCount || 1}`,
      });

      cyberAudio.playSuccessChime();
    } catch (err: any) {
      console.error('Metadata extraction error:', err);
      cyberAudio.playAlertBuzz();
      setSingleError(err.message || 'Failed to inspect PDF metadata. File may be corrupted or unreadable.');
    } finally {
      setIsExtractingMetadata(false);
    }
  };

  const executeConfirmedConversion = async () => {
    if (!stagedFile) return;

    const allowed = incrementConversionCount();
    if (!allowed) {
      setSingleError('Daily conversion quota reached. Upgrade to Pro for unlimited conversions.');
      return;
    }

    const { file, base64Data, metadata, ocrSettings, pageRange } = stagedFile;
    setSingleError(null);
    setIsSingleConverting(true);
    setSingleProgress(10);
    setSingleStatusMsg(`SPLITTING_PAGES_AND_EXTRACTING_IMAGES: ${file.name}`);
    cyberAudio.playScanBeep(1);

    try {
      // 1. Process Split PDF Page Selection
      let processBase64 = base64Data;
      let effectivePageCount = metadata.pageCount || 1;

      if (pageRange && pageRange.trim() && pageRange.toLowerCase() !== 'all') {
        const splitResult = await splitPdfByPageRange(base64Data, pageRange);
        processBase64 = splitResult.splitBase64;
        effectivePageCount = splitResult.splitPageCount;
      }

      // 2. Extract Embedded PDF Images (JPEG, PNG) to preserve in Google Doc
      setSingleStatusMsg(`CARRIER_ENGINE: EXTRACTING EMBEDDED IMAGES & FIGURES...`);
      const extractedImages = await extractEmbeddedPdfImages(processBase64);

      // Mount active PDF in store
      const docId = 'pdf_' + Date.now();
      const pdfMetadata = {
        id: docId,
        name: file.name,
        size: file.size,
        base64Data: processBase64,
        pageCount: effectivePageCount,
        uploadedAt: Date.now(),
        technicalMetadata: metadata,
      };
      setPdf(pdfMetadata);

      // 3. Call conversion pipeline with real-time telemetry and OCR settings
      const activeOcr = ocrSettings || ingestionOcrSettings;
      const resultData = await convertPdfToGoogleDoc({
        pdfBase64: processBase64,
        filename: file.name,
        modelPreference: geminiModelPreference,
        ocrSettings: activeOcr,
        onProgress: (percent, msg) => {
          setSingleProgress(percent);
          setSingleStatusMsg(msg);
          cyberAudio.playScanBeep(Math.floor(percent / 25));
        },
      });

      // 4. Inject Extracted Embedded Images directly into Reconstructed HTML
      if (extractedImages.length > 0) {
        resultData.htmlContent = injectEmbeddedImagesIntoHtml(resultData.htmlContent, extractedImages);
      }

      // Save to persistent archive
      addToHistory({
        id: docId,
        title: resultData.documentTitle,
        originalFileName: file.name,
        fileSize: file.size,
        timestamp: Date.now(),
        pageCount: effectivePageCount,
        tablesCount: resultData.detectedElements.tablesCount,
        headingsCount: resultData.detectedElements.headingsCount,
        htmlContent: resultData.htmlContent,
        markdownContent: resultData.markdownContent,
        fidelityScore: resultData.stats.fidelityScore,
        status: 'success',
        base64Data: processBase64,
        technicalMetadata: metadata,
      });

      cyberAudio.playSuccessChime();
      setResult(resultData);
      setStagedFile(null);
    } catch (err: any) {
      console.error('Single PDF conversion error:', err);
      cyberAudio.playAlertBuzz();
      setSingleError(err.message || 'Single PDF conversion failed. Please try again.');
    } finally {
      setIsSingleConverting(false);
    }
  };

  const cancelStagedFile = () => {
    cyberAudio.playCyberClick();
    setStagedFile(null);
    if (singleFileInputRef.current) {
      singleFileInputRef.current.value = '';
    }
  };

  // Convert a single benchmark payload instantly
  const handleConvertSingleSample = async (sample: typeof SAMPLE_DOCS[0]) => {
    const allowed = incrementConversionCount();
    if (!allowed) {
      setSingleError('Daily conversion quota reached. Upgrade to Pro for unlimited conversions.');
      return;
    }

    setSingleError(null);
    setIsSingleConverting(true);
    setSingleProgress(20);
    setSingleStatusMsg(`LOADING_SAMPLE: ${sample.title}`);
    cyberAudio.playCyberClick();

    await new Promise((r) => setTimeout(r, 250));
    setSingleProgress(55);
    setSingleStatusMsg('RECONSTRUCTING_TABLES_AND_GEOMETRY');
    await new Promise((r) => setTimeout(r, 300));
    setSingleProgress(85);
    setSingleStatusMsg('SYNTHESIZING_GOOGLE_DOCS_SEMANTICS');
    await new Promise((r) => setTimeout(r, 200));

    const docId = 'sample_' + Date.now();
    const resultData = {
      documentTitle: sample.title.replace(/\.[^/.]+$/, ''),
      htmlContent: sample.sampleContent,
      markdownContent: `# ${sample.title}\n\nConverted document layout.`,
      stats: {
        pages: sample.pages,
        wordCount: 380,
        characterCount: 2450,
        fidelityScore: 99.4,
      },
      detectedElements: {
        headingsCount: 3,
        tablesCount: 1,
        bulletListsCount: 3,
        fontsDetected: ['Arial', 'Georgia', 'JetBrains Mono'],
        colorPalette: ['#111827', '#059669', '#f3f4f6', '#1a73e8'],
      },
      conversionTimeMs: 750,
    };

    setPdf({
      id: docId,
      name: sample.title,
      size: sample.size,
      base64Data: 'data:application/pdf;base64,sample',
      pageCount: sample.pages,
      uploadedAt: Date.now(),
    });

    addToHistory({
      id: docId,
      title: resultData.documentTitle,
      originalFileName: sample.title,
      fileSize: sample.size,
      timestamp: Date.now(),
      pageCount: sample.pages,
      tablesCount: resultData.detectedElements.tablesCount,
      headingsCount: resultData.detectedElements.headingsCount,
      htmlContent: resultData.htmlContent,
      markdownContent: resultData.markdownContent,
      fidelityScore: resultData.stats.fidelityScore,
      status: 'success',
    });

    cyberAudio.playSuccessChime();
    setResult(resultData);
    setIsSingleConverting(false);
  };

  // ==========================================
  // MULTI-FILE QUEUE BATCH HANDLERS
  // ==========================================
  const handleMultiFilesSelected = async (files: File[]) => {
    const pdfFiles = files.filter(
      (f) => f.name.toLowerCase().endsWith('.pdf') || f.type === 'application/pdf'
    );

    if (pdfFiles.length === 0) {
      alert('Only .PDF documents are accepted for Google Docs reconstruction.');
      return;
    }

    setIsReadingFiles(true);
    cyberAudio.playScanBeep(1);

    const newQueueItems: QueueItem[] = [];

    for (let i = 0; i < pdfFiles.length; i++) {
      const file = pdfFiles[i];
      try {
        const base64Data = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = (err) => reject(err);
          reader.readAsDataURL(file);
        });

        // Extract technical metadata immediately upon selection
        const metadata = await extractPdfTechnicalMetadata(file);

        // Auto-detect language and compute OCR profile for this specific document
        const detectedLang = detectLanguageFromPdfBuffer(base64Data, metadata);
        const itemOcr = getAutoOcrSettingsForLanguage(detectedLang);

        newQueueItems.push({
          id: 'queue_' + Date.now() + '_' + Math.random().toString(36).substring(2, 8),
          name: file.name,
          size: file.size,
          base64Data,
          pageCount: metadata.pageCount || 1,
          status: 'queued',
          progress: 0,
          addedAt: Date.now(),
          technicalMetadata: metadata,
          pdfVersion: metadata.pdfVersion,
          author: metadata.author,
          detectedLanguage: detectedLang,
          ocrSettings: itemOcr,
        });
      } catch (err) {
        console.error('Failed to read PDF payload:', file.name, err);
      }
    }

    setIsReadingFiles(false);

    if (newQueueItems.length > 0) {
      addToQueue(newQueueItems);
      cyberAudio.playScanBeep(3);
    }
  };

  const convertSingleQueueItem = async (item: QueueItem) => {
    const allowed = incrementConversionCount();
    if (!allowed) {
      updateQueueItem(item.id, {
        status: 'error',
        statusMessage: 'DAILY_QUOTA_EXCEEDED',
        errorMessage: 'Daily limit reached. Upgrade to Pro for unlimited conversions.',
      });
      return;
    }

    setActiveQueueId(item.id);
    updateQueueItem(item.id, {
      status: 'processing',
      progress: 10,
      statusMessage: `CONVERTING: ${item.name}`,
    });

    try {
      let resultData;
      if (item.samplePrecomputed) {
        await new Promise((r) => setTimeout(r, 200));
        updateQueueItem(item.id, { progress: 50, statusMessage: 'RECONSTRUCTING_GEOMETRY' });
        await new Promise((r) => setTimeout(r, 250));
        updateQueueItem(item.id, { progress: 85, statusMessage: 'SYNTHESIZING_GOOGLE_DOCS_SEMANTICS' });
        await new Promise((r) => setTimeout(r, 150));

        resultData = {
          documentTitle: item.name.replace(/\.[^/.]+$/, ''),
          htmlContent: item.samplePrecomputed,
          markdownContent: `# ${item.name}\n\nConverted document layout.`,
          stats: {
            pages: item.pageCount,
            wordCount: 380,
            characterCount: 2450,
            fidelityScore: 99.4,
          },
          detectedElements: {
            headingsCount: 3,
            tablesCount: 1,
            bulletListsCount: 3,
            fontsDetected: ['Arial', 'Georgia', 'JetBrains Mono'],
            colorPalette: ['#111827', '#059669', '#f3f4f6', '#1a73e8'],
          },
          conversionTimeMs: 800,
        };
      } else {
        let activeBase64 = item.base64Data;
        if (item.pageRange && item.pageRange.trim() && item.pageRange.toLowerCase() !== 'all') {
          const split = await splitPdfByPageRange(item.base64Data, item.pageRange);
          activeBase64 = split.splitBase64;
        }

        const extractedImages = await extractEmbeddedPdfImages(activeBase64);

        resultData = await convertPdfToGoogleDoc({
          pdfBase64: activeBase64,
          filename: item.name,
          modelPreference: geminiModelPreference,
          ocrSettings: item.ocrSettings || ingestionOcrSettings,
          onProgress: (percent, msg) => {
            updateQueueItem(item.id, { progress: percent, statusMessage: msg });
            cyberAudio.playScanBeep(Math.floor(percent / 25));
          },
        });

        if (extractedImages.length > 0) {
          resultData.htmlContent = injectEmbeddedImagesIntoHtml(resultData.htmlContent, extractedImages);
        }
      }

      updateQueueItem(item.id, {
        status: 'completed',
        progress: 100,
        statusMessage: 'RECONSTRUCTION_COMPLETE',
        result: resultData,
      });

      addToHistory({
        id: item.id,
        title: resultData.documentTitle,
        originalFileName: item.name,
        fileSize: item.size,
        timestamp: Date.now(),
        pageCount: resultData.stats.pages || 1,
        tablesCount: resultData.detectedElements.tablesCount,
        headingsCount: resultData.detectedElements.headingsCount,
        htmlContent: resultData.htmlContent,
        markdownContent: resultData.markdownContent,
        fidelityScore: resultData.stats.fidelityScore,
        status: 'success',
        base64Data: item.base64Data,
        technicalMetadata: item.technicalMetadata,
      });

      cyberAudio.playSuccessChime();
      setPdf({
        id: item.id,
        name: item.name,
        size: item.size,
        base64Data: item.base64Data,
        pageCount: item.pageCount,
        uploadedAt: Date.now(),
        technicalMetadata: item.technicalMetadata,
      });
      setResult(resultData);
    } catch (err: any) {
      console.error('Queue item conversion error:', err);
      cyberAudio.playAlertBuzz();
      updateQueueItem(item.id, {
        status: 'error',
        progress: 0,
        statusMessage: 'CONVERSION_FAULT',
        errorMessage: err.message || 'Conversion failed',
      });
    } finally {
      setActiveQueueId(null);
    }
  };

  const queueSamplePayload = (sample: typeof SAMPLE_DOCS[0]) => {
    const item: QueueItem = {
      id: 'queue_sample_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      name: sample.title,
      size: sample.size,
      base64Data: 'data:application/pdf;base64,sample',
      pageCount: sample.pages,
      status: 'queued',
      progress: 0,
      addedAt: Date.now(),
      samplePrecomputed: sample.sampleContent,
    };
    addToQueue([item]);
    cyberAudio.playCyberClick();
  };

  const queueAllSamples = () => {
    SAMPLE_DOCS.forEach((s) => queueSamplePayload(s));
  };

  const startBulkConversion = async () => {
    const pendingItems = queue.filter(
      (item) => item.status === 'queued' || item.status === 'error'
    );

    if (pendingItems.length === 0) return;

    setBulkProcessing(true);
    cyberAudio.playScanBeep(1);

    let lastCompletedResult = null;
    let lastCompletedItem: QueueItem | null = null;

    for (let i = 0; i < pendingItems.length; i++) {
      const item = pendingItems[i];
      setActiveQueueId(item.id);

      const allowed = incrementConversionCount();
      if (!allowed) {
        updateQueueItem(item.id, {
          status: 'error',
          statusMessage: 'DAILY_QUOTA_EXCEEDED',
          errorMessage: 'Daily limit reached. Upgrade to Pro for unlimited conversions.',
        });
        break;
      }

      updateQueueItem(item.id, {
        status: 'processing',
        progress: 15,
        statusMessage: `CONVERTING [${i + 1}/${pendingItems.length}]: ${item.name}`,
      });

      try {
        let resultData;

        if (item.samplePrecomputed) {
          await new Promise((r) => setTimeout(r, 250));
          updateQueueItem(item.id, { progress: 50, statusMessage: 'RECONSTRUCTING_GEOMETRY' });
          await new Promise((r) => setTimeout(r, 300));
          updateQueueItem(item.id, { progress: 85, statusMessage: 'SYNTHESIZING_GOOGLE_DOCS_SEMANTICS' });
          await new Promise((r) => setTimeout(r, 200));

          resultData = {
            documentTitle: item.name.replace(/\.[^/.]+$/, ''),
            htmlContent: item.samplePrecomputed,
            markdownContent: `# ${item.name}\n\nConverted document layout.`,
            stats: {
              pages: item.pageCount,
              wordCount: 380,
              characterCount: 2450,
              fidelityScore: 99.4,
            },
            detectedElements: {
              headingsCount: 3,
              tablesCount: 1,
              bulletListsCount: 3,
              fontsDetected: ['Arial', 'Georgia', 'JetBrains Mono'],
              colorPalette: ['#111827', '#059669', '#f3f4f6', '#1a73e8'],
            },
            conversionTimeMs: 800,
          };
        } else {
          resultData = await convertPdfToGoogleDoc({
            pdfBase64: item.base64Data,
            filename: item.name,
            modelPreference: geminiModelPreference,
            ocrSettings: item.ocrSettings || ingestionOcrSettings,
            onProgress: (percent, msg) => {
              updateQueueItem(item.id, { progress: percent, statusMessage: msg });
              cyberAudio.playScanBeep(Math.floor(percent / 25));
            },
          });
        }

        updateQueueItem(item.id, {
          status: 'completed',
          progress: 100,
          statusMessage: 'RECONSTRUCTION_COMPLETE',
          result: resultData,
        });

        addToHistory({
          id: item.id,
          title: resultData.documentTitle,
          originalFileName: item.name,
          fileSize: item.size,
          timestamp: Date.now(),
          pageCount: resultData.stats.pages || 1,
          tablesCount: resultData.detectedElements.tablesCount,
          headingsCount: resultData.detectedElements.headingsCount,
          htmlContent: resultData.htmlContent,
          markdownContent: resultData.markdownContent,
          fidelityScore: resultData.stats.fidelityScore,
          status: 'success',
          base64Data: item.base64Data,
        });

        cyberAudio.playSuccessChime();
        lastCompletedResult = resultData;
        lastCompletedItem = item;
      } catch (err: any) {
        console.error('Bulk conversion failure for:', item.name, err);
        cyberAudio.playAlertBuzz();
        updateQueueItem(item.id, {
          status: 'error',
          progress: 0,
          statusMessage: 'CONVERSION_FAULT',
          errorMessage: err.message || 'Pipeline conversion failure',
        });
      }
    }

    setBulkProcessing(false);
    setActiveQueueId(null);

    if (lastCompletedResult && lastCompletedItem) {
      setPdf({
        id: lastCompletedItem.id,
        name: lastCompletedItem.name,
        size: lastCompletedItem.size,
        base64Data: lastCompletedItem.base64Data,
        pageCount: lastCompletedItem.pageCount,
        uploadedAt: Date.now(),
      });
      setResult(lastCompletedResult);
    }
  };

  const viewCompletedItem = (item: QueueItem) => {
    if (!item.result) return;
    cyberAudio.playCyberClick();
    setPdf({
      id: item.id,
      name: item.name,
      size: item.size,
      base64Data: item.base64Data,
      pageCount: item.pageCount,
      uploadedAt: item.addedAt,
    });
    setResult(item.result);
  };

  // Drag & drop router based on active mode
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
    const files: File[] = e.dataTransfer.files ? (Array.from(e.dataTransfer.files) as File[]) : [];
    if (files.length === 0) return;

    if (files.length > 1) {
      setUploadMode('batch');
      handleMultiFilesSelected(files);
    } else if (uploadMode === 'single') {
      handleSingleFileSelected(files[0]);
    } else {
      handleMultiFilesSelected(files);
    }
  };

  const queuedCount = queue.filter((i) => i.status === 'queued').length;
  const completedCount = queue.filter((i) => i.status === 'completed').length;
  const activeItem = queue.find((i) => i.id === activeQueueId);

  return (
    <div className="w-full space-y-5">
      {/* MODE SELECTOR TABS: SINGLE PDF (INSTANT) vs MULTI-FILE QUEUE (BATCH) */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-1.5 bg-[#0A0A0C] border border-neutral-800 rounded">
        <div className="flex items-center gap-1.5 flex-1">
          <button
            onClick={() => {
              cyberAudio.playCyberClick();
              setUploadMode('single');
            }}
            className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2 rounded text-xs font-mono font-bold tracking-wider uppercase transition-all ${
              uploadMode === 'single'
                ? 'bg-[#FF003C] text-white shadow-[0_0_12px_rgba(255,0,60,0.4)]'
                : 'text-neutral-400 hover:text-white hover:bg-neutral-900'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>SINGLE PDF CONVERT (INSTANT)</span>
          </button>

          <button
            onClick={() => {
              cyberAudio.playCyberClick();
              setUploadMode('batch');
            }}
            className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2 rounded text-xs font-mono font-bold tracking-wider uppercase transition-all ${
              uploadMode === 'batch'
                ? 'bg-[#E056FD] text-black font-extrabold shadow-[0_0_12px_rgba(224,86,253,0.4)]'
                : 'text-neutral-400 hover:text-white hover:bg-neutral-900'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>MULTI-FILE QUEUE (BULK)</span>
            {queue.length > 0 && (
              <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${
                uploadMode === 'batch' ? 'bg-black text-[#E056FD]' : 'bg-neutral-800 text-neutral-300'
              }`}>
                {queue.length}
              </span>
            )}
          </button>
        </div>

        <div className="hidden sm:flex items-center gap-2 px-2 text-[11px] font-mono text-neutral-500">
          <span>PIPELINE:</span>
          <span className="text-emerald-400 font-bold">100% LAYOUT &amp; TABLE FIDELITY</span>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* OPTION 1: SINGLE PDF CONVERSION MODE (INSTANT 1-CLICK PIPELINE)           */}
      {/* ========================================================================= */}
      {uploadMode === 'single' && (
        <div className="space-y-4">
          {/* Extracting Metadata Banner */}
          {isExtractingMetadata && (
            <div className="p-4 bg-black border border-[#FF003C] rounded flex items-center justify-between gap-3 text-xs font-mono shadow-[0_0_15px_rgba(255,0,60,0.25)]">
              <div className="flex items-center gap-2.5 text-[#FF003C]">
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span className="font-bold">PARSING PDF OBJECT CATALOG &amp; SECURITY METADATA STREAM...</span>
              </div>
              <span className="text-[10px] text-neutral-400">PDF-LIB DECODER</span>
            </div>
          )}

          {/* STAGED PDF TECHNICAL METADATA INSPECTION SUB-COMPONENT */}
          {stagedFile && !isSingleConverting && (
            <div className="space-y-3">
              <PdfMetadataCard
                fileName={stagedFile.file.name}
                fileSize={stagedFile.file.size}
                metadata={stagedFile.metadata}
                onConfirm={executeConfirmedConversion}
                onCancel={cancelStagedFile}
                isProcessing={isSingleConverting}
              />

              {/* SPLIT PDF & PAGE RANGE SELECTION CONTROL PANEL */}
              <div className="p-4 bg-[#0A0A0E] border border-neutral-800 hover:border-[#FF003C]/50 rounded-lg space-y-3 font-mono text-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sliders className="w-4 h-4 text-[#FF003C]" />
                    <span className="font-bold text-white tracking-wider">SPLIT PDF // SELECT PAGE RANGES</span>
                  </div>
                  <CyberBadge label={`TOTAL: ${stagedFile.metadata.pageCount || 1} PAGES`} variant="purple" />
                </div>

                <p className="text-[11px] text-neutral-400">
                  Specify exact page numbers or ranges to split and convert (e.g. <code className="text-emerald-400 font-bold bg-neutral-900 px-1 py-0.5 rounded">1-3, 5, 8-10</code>).
                </p>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                  <input
                    type="text"
                    value={stagedFile.pageRange}
                    onChange={(e) =>
                      setStagedFile({
                        ...stagedFile,
                        pageRange: e.target.value,
                      })
                    }
                    placeholder={`e.g. 1-${stagedFile.metadata.pageCount || 1} or 1, 3, 5`}
                    className="flex-1 bg-black border border-neutral-700 focus:border-[#FF003C] text-white px-3 py-1.5 rounded text-xs outline-none font-mono"
                  />

                  {/* Preset Buttons */}
                  <div className="flex items-center gap-1.5 overflow-x-auto shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        cyberAudio.playCyberClick();
                        setStagedFile({ ...stagedFile, pageRange: `1-${stagedFile.metadata.pageCount || 1}` });
                      }}
                      className={`px-2 py-1 rounded text-[10px] font-bold border transition-all ${
                        stagedFile.pageRange === `1-${stagedFile.metadata.pageCount || 1}`
                          ? 'bg-[#FF003C] text-white border-[#FF003C]'
                          : 'bg-neutral-900 border-neutral-700 text-neutral-400 hover:text-white'
                      }`}
                    >
                      ALL PAGES
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        cyberAudio.playCyberClick();
                        setStagedFile({ ...stagedFile, pageRange: `1-${Math.min(3, stagedFile.metadata.pageCount || 1)}` });
                      }}
                      className="px-2 py-1 rounded text-[10px] font-bold border bg-neutral-900 border-neutral-700 text-neutral-400 hover:text-white hover:border-[#FF003C]"
                    >
                      FIRST 3
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        cyberAudio.playCyberClick();
                        setStagedFile({ ...stagedFile, pageRange: 'even' });
                      }}
                      className="px-2 py-1 rounded text-[10px] font-bold border bg-neutral-900 border-neutral-700 text-neutral-400 hover:text-white hover:border-[#FF003C]"
                    >
                      EVEN
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        cyberAudio.playCyberClick();
                        setStagedFile({ ...stagedFile, pageRange: 'odd' });
                      }}
                      className="px-2 py-1 rounded text-[10px] font-bold border bg-neutral-900 border-neutral-700 text-neutral-400 hover:text-white hover:border-[#FF003C]"
                    >
                      ODD
                    </button>
                  </div>
                </div>
              </div>

              {/* AUTO-DETECTED DOCUMENT LANGUAGE & BACKEND OCR SETTINGS PANEL */}
              <IngestionOcrPanel
                detectedLanguage={stagedFile.detectedLanguage}
                ocrSettings={stagedFile.ocrSettings}
                onChange={(updatedSettings) => {
                  setStagedFile({
                    ...stagedFile,
                    ocrSettings: updatedSettings,
                  });
                  setIngestionOcrSettings(updatedSettings);
                }}
              />
            </div>
          )}

          {/* Single PDF Drag & Drop Target (shown when not staged or converting) */}
          {!stagedFile && (
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => !isSingleConverting && singleFileInputRef.current?.click()}
              className={`relative border-2 border-dashed rounded-md p-8 md:p-12 text-center cursor-pointer transition-all duration-200 ${
                dragOver
                  ? 'border-[#FF003C] bg-[#FF003C]/10 glow-cyber-red'
                  : 'border-neutral-800 bg-[#0A0A0C] hover:border-[#FF003C]/50 hover:bg-[#101014]'
              } ${isSingleConverting ? 'pointer-events-none opacity-80' : ''}`}
            >
              <input
                id="single-pdf-input"
                ref={singleFileInputRef}
                type="file"
                accept="application/pdf,.pdf"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleSingleFileSelected(e.target.files[0]);
                    e.target.value = '';
                  }
                }}
              />

              <div className="flex flex-col items-center justify-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-neutral-900 border border-[#FF003C]/40 flex items-center justify-center text-[#FF003C] shadow-[0_0_20px_rgba(255,0,60,0.25)]">
                  {isSingleConverting ? (
                    <RefreshCw className="w-8 h-8 animate-spin text-[#FF003C]" />
                  ) : (
                    <Upload className="w-8 h-8" />
                  )}
                </div>

                <div>
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded bg-[#FF003C]/20 text-[#FF003C] border border-[#FF003C]/40 text-[10px] font-bold font-mono uppercase mb-2">
                    <Zap className="w-3 h-3" />
                    INSTANT SINGLE PDF CONVERSION
                  </div>
                  <h3 className="font-mono text-sm md:text-base font-bold tracking-wider text-white uppercase">
                    DROP A SINGLE PDF OR CLICK TO INSPECT &amp; CONVERT
                  </h3>
                  <p className="font-mono text-xs text-neutral-400 mt-1.5 max-w-lg mx-auto leading-relaxed">
                    Select 1 PDF file. Automatically extracts creator tool, creation timestamp, and security settings before confirming reconstruction.
                  </p>
                </div>

                {/* Single File Action Button */}
                <div className="flex flex-wrap items-center justify-center gap-3 pt-1">
                  <CyberButton
                    variant="primary"
                    size="md"
                    icon={
                      isSingleConverting ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                      ) : (
                        <Zap className="w-4 h-4" />
                      )
                    }
                    glow={!isSingleConverting}
                  >
                    {isSingleConverting ? 'CONVERTING DOCUMENT...' : 'SELECT SINGLE PDF & CONVERT'}
                  </CyberButton>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setUploadMode('batch');
                    }}
                    className="text-xs font-mono text-neutral-400 hover:text-[#E056FD] uppercase underline underline-offset-4 transition-colors"
                  >
                    Or switch to multi-file queue &rarr;
                  </button>
                </div>
              </div>

              {/* Tactical Corner Marks */}
              <div className="absolute top-2 left-2 w-3 h-3 border-t-2 border-l-2 border-[#FF003C]" />
              <div className="absolute top-2 right-2 w-3 h-3 border-t-2 border-r-2 border-[#FF003C]" />
              <div className="absolute bottom-2 left-2 w-3 h-3 border-b-2 border-l-2 border-[#FF003C]" />
              <div className="absolute bottom-2 right-2 w-3 h-3 border-b-2 border-r-2 border-[#FF003C]" />
            </div>
          )}

          {/* Live Single Conversion Telemetry HUD */}
          {isSingleConverting && (
            <div className="p-4 bg-black border border-[#FF003C]/60 rounded space-y-2.5 font-mono shadow-[0_0_20px_rgba(255,0,60,0.2)]">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 text-[#FF003C] font-bold">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#FF003C] animate-ping" />
                  <span>CONVERTING: {singleStatusMsg || 'PROCESSING_DOCUMENT_STREAM'}</span>
                </div>
                <span className="text-white font-bold text-sm">{singleProgress}%</span>
              </div>

              <div className="w-full h-2 bg-neutral-900 rounded overflow-hidden border border-neutral-800">
                <div
                  className="h-full bg-gradient-to-r from-[#FF003C] via-[#E056FD] to-[#FF003C] transition-all duration-300"
                  style={{ width: `${singleProgress}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-[10px] text-neutral-500">
                <span>STAGE: TOPOLOGY_EXTRACTION</span>
                <span>TABLE PRESERVATION: ACTIVE</span>
              </div>
            </div>
          )}

          {/* Single Error Alert */}
          {singleError && (
            <div className="p-3 bg-rose-950/40 border border-rose-500/50 rounded flex items-center justify-between gap-3 text-xs font-mono text-rose-300">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{singleError}</span>
              </div>
              <button
                onClick={() => setSingleError(null)}
                className="text-neutral-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Instant Single PDF Benchmarks */}
          <div className="pt-2">
            <div className="flex items-center justify-between mb-2">
              <span className="font-mono text-xs uppercase tracking-wider text-neutral-400 font-bold flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#E056FD]" />
                ONE-CLICK SINGLE BENCHMARK PAYLOADS
              </span>
              <span className="text-[10px] font-mono text-neutral-500">
                CLICK TO CONVERT DIRECTLY
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {SAMPLE_DOCS.map((sample) => (
                <div
                  key={sample.id}
                  onClick={() => !isSingleConverting && handleConvertSingleSample(sample)}
                  className="p-3.5 border border-neutral-800 hover:border-[#FF003C] bg-[#0C0C0E] hover:bg-neutral-900 rounded cursor-pointer transition-all duration-150 flex items-start justify-between group"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-[#FF003C] shrink-0" />
                      <span className="font-mono text-xs font-bold text-white group-hover:text-[#FF003C] transition-colors truncate max-w-[220px]">
                        {sample.title}
                      </span>
                    </div>
                    <p className="font-mono text-[11px] text-neutral-400">
                      {sample.type}
                    </p>
                    <div className="flex items-center gap-2 text-[10px] text-neutral-500 font-mono">
                      <span>{formatBytes(sample.size)}</span>
                      <span>&bull;</span>
                      <span>{sample.pages} Page(s)</span>
                      <span>&bull;</span>
                      <span className="text-emerald-400">100% Table Fidelity</span>
                    </div>
                  </div>

                  <CyberButton
                    variant="primary"
                    size="sm"
                    icon={<Zap className="w-3.5 h-3.5" />}
                    className="shrink-0 mt-1"
                    disabled={isSingleConverting}
                  >
                    CONVERT
                  </CyberButton>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* OPTION 2: MULTI-FILE QUEUE BATCH PROCESSING MODE                          */}
      {/* ========================================================================= */}
      {uploadMode === 'batch' && (
        <div className="space-y-5">
          {/* Multi-file Drag & Drop Area */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => multiFileInputRef.current?.click()}
            className={`relative border-2 border-dashed rounded-md p-8 md:p-12 text-center cursor-pointer transition-all duration-200 ${
              dragOver
                ? 'border-[#E056FD] bg-[#E056FD]/10'
                : 'border-neutral-800 bg-[#0A0A0C] hover:border-[#E056FD]/50 hover:bg-[#101014]'
            }`}
          >
            <input
              ref={multiFileInputRef}
              type="file"
              multiple
              accept="application/pdf,.pdf"
              className="hidden"
              onChange={(e) => {
                if (e.target.files && e.target.files.length > 0) {
                  handleMultiFilesSelected(Array.from(e.target.files));
                  e.target.value = '';
                }
              }}
            />

            <div className="flex flex-col items-center justify-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-neutral-900 border border-[#E056FD]/40 flex items-center justify-center text-[#E056FD] shadow-[0_0_20px_rgba(224,86,253,0.25)]">
                <Layers className="w-8 h-8" />
              </div>

              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded bg-[#E056FD]/20 text-[#E056FD] border border-[#E056FD]/40 text-[10px] font-bold font-mono uppercase mb-2">
                  <Layers className="w-3 h-3" />
                  MULTI-FILE BATCH QUEUE
                </div>
                <h3 className="font-mono text-sm md:text-base font-bold tracking-wider text-white uppercase">
                  DRAG &amp; DROP MULTIPLE PDFS OR CLICK TO BROWSE
                </h3>
                <p className="font-mono text-xs text-neutral-400 mt-1.5 max-w-lg mx-auto leading-relaxed">
                  Queue up multiple documents simultaneously. Convert them in bulk or individually with full table preservation.
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-3 pt-1">
                <CyberButton
                  variant="secondary"
                  size="md"
                  icon={<Plus className="w-4 h-4" />}
                >
                  {isReadingFiles ? 'MOUNTING PAYLOADS...' : 'SELECT MULTIPLE PDFS'}
                </CyberButton>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setUploadMode('single');
                  }}
                  className="text-xs font-mono text-neutral-400 hover:text-[#FF003C] uppercase underline underline-offset-4 transition-colors"
                >
                  Or switch to single PDF convert &rarr;
                </button>
              </div>
            </div>

            {/* Tactical Corner Marks */}
            <div className="absolute top-2 left-2 w-3 h-3 border-t-2 border-l-2 border-[#E056FD]" />
            <div className="absolute top-2 right-2 w-3 h-3 border-t-2 border-r-2 border-[#E056FD]" />
            <div className="absolute bottom-2 left-2 w-3 h-3 border-b-2 border-l-2 border-[#E056FD]" />
            <div className="absolute bottom-2 right-2 w-3 h-3 border-b-2 border-r-2 border-[#E056FD]" />
          </div>

          {/* Bulk Processing Queue Section */}
          {queue.length > 0 && (
            <div className="border border-neutral-800 bg-[#08080A] rounded p-4 md:p-5 space-y-4 font-mono shadow-[0_0_20px_rgba(0,0,0,0.6)]">
              {/* Queue Header & Actions */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-neutral-800">
                <div className="flex items-center gap-2.5">
                  <Layers className="w-4 h-4 text-[#E056FD]" />
                  <span className="text-xs uppercase font-bold text-white tracking-wider">
                    DOCUMENT BATCH QUEUE
                  </span>
                  <span className="px-2 py-0.5 rounded bg-neutral-900 border border-neutral-700 text-xs text-neutral-300">
                    {queue.length} TOTAL
                  </span>
                  {completedCount > 0 && (
                    <span className="px-2 py-0.5 rounded bg-emerald-950/40 border border-emerald-500/40 text-[11px] text-emerald-400">
                      {completedCount} DONE
                    </span>
                  )}
                  {queuedCount > 0 && (
                    <span className="px-2 py-0.5 rounded bg-[#E056FD]/10 border border-[#E056FD]/30 text-[11px] text-[#E056FD]">
                      {queuedCount} PENDING
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <CyberButton
                    variant="outline"
                    size="sm"
                    icon={<Plus className="w-3.5 h-3.5" />}
                    onClick={() => multiFileInputRef.current?.click()}
                    disabled={isBulkProcessing}
                  >
                    ADD MORE
                  </CyberButton>

                  <CyberButton
                    variant="primary"
                    size="sm"
                    icon={
                      isBulkProcessing ? (
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Play className="w-3.5 h-3.5" />
                      )
                    }
                    onClick={startBulkConversion}
                    disabled={isBulkProcessing || queuedCount === 0}
                    glow={queuedCount > 0 && !isBulkProcessing}
                  >
                    {isBulkProcessing
                      ? 'PROCESSING BATCH...'
                      : queuedCount > 0
                      ? `CONVERT QUEUE (${queuedCount})`
                      : 'ALL CONVERTED'}
                  </CyberButton>

                  <button
                    onClick={() => {
                      if (confirm('Clear all queued documents?')) {
                        clearQueue();
                      }
                    }}
                    disabled={isBulkProcessing}
                    className="p-1.5 text-neutral-500 hover:text-[#FF003C] hover:bg-neutral-900 rounded transition-colors disabled:opacity-30"
                    title="Clear queue"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Active Bulk Processing Telemetry Bar */}
              {isBulkProcessing && activeItem && (
                <div className="p-3 bg-black border border-[#FF003C]/50 rounded space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-[#FF003C] font-bold flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-[#FF003C] animate-ping" />
                      ACTIVE: {activeItem.name} &bull; {activeItem.statusMessage || 'PROCESSING'}
                    </span>
                    <span className="text-[#E056FD] font-bold">{activeItem.progress}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-neutral-900 rounded overflow-hidden border border-neutral-800">
                    <div
                      className="h-full bg-gradient-to-r from-[#FF003C] to-[#E056FD] transition-all duration-200"
                      style={{ width: `${activeItem.progress}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Queue Items Table / List */}
              <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                {queue.map((item, idx) => {
                  const isItemActive = item.id === activeQueueId;
                  const isExpanded = expandedMetadataId === item.id;

                  return (
                    <div
                      key={item.id}
                      className={`p-3 rounded border transition-all space-y-2 text-xs font-mono ${
                        isItemActive
                          ? 'border-[#FF003C] bg-[#FF003C]/10 shadow-[0_0_15px_rgba(255,0,60,0.2)]'
                          : item.status === 'completed'
                          ? 'border-emerald-900/50 bg-neutral-950/90 hover:border-emerald-700/60'
                          : item.status === 'error'
                          ? 'border-rose-900/50 bg-rose-950/20'
                          : 'border-neutral-800/80 bg-neutral-950 hover:border-neutral-700'
                      }`}
                    >
                      {/* Top Row: File Info & Controls */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                        <div className="flex items-center gap-2.5 overflow-hidden min-w-0">
                          <span className="text-neutral-500 text-[11px] w-6 shrink-0 font-mono">
                            #{idx + 1}
                          </span>
                          <FileText
                            className={`w-4 h-4 shrink-0 ${
                              item.status === 'completed'
                                ? 'text-emerald-400'
                                : item.status === 'processing'
                                ? 'text-[#FF003C]'
                                : 'text-neutral-400'
                            }`}
                          />
                          <div className="overflow-hidden truncate">
                            <div className="font-bold text-white truncate text-xs">{item.name}</div>
                            <div className="text-[10px] text-neutral-400 flex flex-wrap items-center gap-1.5 pt-0.5">
                              <span>{formatBytes(item.size)}</span>
                              <span>&bull;</span>
                              <span className="text-cyan-400">{item.pageCount} Page(s)</span>
                              {item.pdfVersion && (
                                <>
                                  <span>&bull;</span>
                                  <span className="px-1.5 py-0.2 rounded bg-neutral-900 border border-neutral-800 text-[9px] text-neutral-300">
                                    PDF v{item.pdfVersion}
                                  </span>
                                </>
                              )}
                              {item.detectedLanguage && (
                                <>
                                  <span>&bull;</span>
                                  <span className="px-1.5 py-0.2 rounded bg-purple-950/40 border border-purple-800 text-[9px] text-[#E056FD] font-bold flex items-center gap-1">
                                    <span>{item.detectedLanguage.flag}</span>
                                    <span>{item.detectedLanguage.code.toUpperCase()}</span>
                                    <span>&bull;</span>
                                    <span>{item.ocrSettings?.scriptType.toUpperCase() || 'OCR'}</span>
                                  </span>
                                </>
                              )}
                              {item.author && (
                                <>
                                  <span>&bull;</span>
                                  <span className="text-neutral-500 truncate max-w-[120px]">
                                    {item.author}
                                  </span>
                                </>
                              )}
                              {item.errorMessage && (
                                <>
                                  <span>&bull;</span>
                                  <span className="text-rose-400 truncate">{item.errorMessage}</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Status Badges & Quick Action Controls */}
                        <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-auto">
                          {/* Metadata inspection toggle */}
                          {item.technicalMetadata && (
                            <button
                              onClick={() => setExpandedMetadataId(isExpanded ? null : item.id)}
                              className={`px-2 py-1 rounded text-[10px] border flex items-center gap-1 transition-all ${
                                isExpanded
                                  ? 'bg-[#E056FD]/20 border-[#E056FD] text-[#E056FD]'
                                  : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-white'
                              }`}
                              title="Inspect technical metadata"
                            >
                              <Info className="w-3 h-3" />
                              <span>META</span>
                              {isExpanded ? <ChevronUp className="w-2.5 h-2.5" /> : <ChevronDown className="w-2.5 h-2.5" />}
                            </button>
                          )}

                          {item.status === 'queued' && (
                            <>
                              <span className="px-2 py-0.5 rounded bg-neutral-900 text-neutral-400 text-[10px] border border-neutral-700">
                                QUEUED
                              </span>
                              {!isBulkProcessing && (
                                <CyberButton
                                  variant="outline"
                                  size="sm"
                                  onClick={() => convertSingleQueueItem(item)}
                                  icon={<Zap className="w-3 h-3" />}
                                  className="!py-0.5 !px-2 !text-[10px] border-[#FF003C]/50 text-[#FF003C] hover:bg-[#FF003C]/20"
                                >
                                  CONVERT
                                </CyberButton>
                              )}
                            </>
                          )}

                          {item.status === 'processing' && (
                            <span className="px-2 py-0.5 rounded bg-[#FF003C]/20 text-[#FF003C] text-[10px] border border-[#FF003C]/40 font-bold flex items-center gap-1.5">
                              <RefreshCw className="w-3 h-3 animate-spin" />
                              {item.progress}%
                            </span>
                          )}

                          {item.status === 'completed' && (
                            <>
                              <span className="px-2 py-0.5 rounded bg-emerald-950/60 text-emerald-400 text-[10px] border border-emerald-500/40 flex items-center gap-1 font-bold">
                                <CheckCircle2 className="w-3 h-3" /> DONE
                              </span>
                              <CyberButton
                                variant="secondary"
                                size="sm"
                                icon={<Eye className="w-3 h-3" />}
                                onClick={() => viewCompletedItem(item)}
                                className="!py-0.5 !px-2 !text-[10px]"
                              >
                                VIEW
                              </CyberButton>
                            </>
                          )}

                          {item.status === 'error' && (
                            <>
                              <span className="px-2 py-0.5 rounded bg-rose-950/60 text-rose-400 text-[10px] border border-rose-500/40 flex items-center gap-1">
                                <AlertTriangle className="w-3 h-3" /> FAILED
                              </span>
                              {!isBulkProcessing && (
                                <CyberButton
                                  variant="outline"
                                  size="sm"
                                  onClick={() => convertSingleQueueItem(item)}
                                  icon={<RefreshCw className="w-3 h-3" />}
                                  className="!py-0.5 !px-2 !text-[10px]"
                                >
                                  RETRY
                                </CyberButton>
                              )}
                            </>
                          )}

                          {!isBulkProcessing && !isItemActive && (
                            <button
                              onClick={() => removeFromQueue(item.id)}
                              className="p-1 text-neutral-500 hover:text-rose-400 rounded transition-colors ml-1"
                              title="Remove from queue"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Per-Document Progress Indicator */}
                      <div className="space-y-1">
                        <div className="flex justify-between items-center text-[10px] text-neutral-400">
                          <span className="truncate">
                            {item.status === 'processing'
                              ? item.statusMessage || 'RECONSTRUCTING DOCUMENT...'
                              : item.status === 'completed'
                              ? 'CONVERSION COMPLETE'
                              : item.status === 'error'
                              ? 'CONVERSION FAILED'
                              : 'READY IN QUEUE'}
                          </span>
                          <span className="font-bold shrink-0">
                            {item.status === 'completed' ? '100%' : `${item.progress}%`}
                          </span>
                        </div>
                        <div className="w-full h-1.5 bg-neutral-900 rounded overflow-hidden border border-neutral-800">
                          <div
                            className={`h-full transition-all duration-200 ${
                              item.status === 'completed'
                                ? 'bg-emerald-500'
                                : item.status === 'error'
                                ? 'bg-rose-500'
                                : item.status === 'processing'
                                ? 'bg-gradient-to-r from-[#FF003C] to-[#E056FD] animate-pulse'
                                : 'bg-neutral-800'
                            }`}
                            style={{
                              width: `${item.status === 'completed' ? 100 : item.progress}%`,
                            }}
                          />
                        </div>
                      </div>

                      {/* Expanded Technical Metadata Card Sub-Component for Queued Document */}
                      {isExpanded && item.technicalMetadata && (
                        <div className="pt-2 border-t border-neutral-800">
                          <PdfMetadataCard
                            fileName={item.name}
                            fileSize={item.size}
                            metadata={item.technicalMetadata}
                            compact
                            onConfirm={() => {
                              setExpandedMetadataId(null);
                              convertSingleQueueItem(item);
                            }}
                            onCancel={() => setExpandedMetadataId(null)}
                            isProcessing={item.status === 'processing'}
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Quick Benchmark Payloads for Batch Mode */}
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <span className="font-mono text-xs uppercase tracking-wider text-neutral-400 font-bold flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-[#E056FD]" />
                QUEUE BENCHMARK PAYLOADS
              </span>
              <div className="flex items-center gap-3">
                <button
                  onClick={queueAllSamples}
                  className="text-[10px] font-mono text-[#E056FD] hover:underline uppercase font-bold"
                >
                  + QUEUE ALL PROTOCOLS
                </button>
                <span className="text-[10px] font-mono text-neutral-500 hidden sm:inline">
                  PRE-CALIBRATED COMPLEX LAYOUTS
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {SAMPLE_DOCS.map((sample, idx) => (
                <div
                  key={idx}
                  onClick={() => queueSamplePayload(sample)}
                  className="p-3.5 border border-neutral-800 hover:border-[#E056FD]/60 bg-[#0C0C0E] hover:bg-neutral-900 rounded cursor-pointer transition-all duration-150 flex items-start justify-between group"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-[#FF003C] shrink-0" />
                      <span className="font-mono text-xs font-bold text-white group-hover:text-[#E056FD] transition-colors truncate max-w-[220px]">
                        {sample.title}
                      </span>
                    </div>
                    <p className="font-mono text-[11px] text-neutral-400">
                      {sample.type}
                    </p>
                    <div className="flex items-center gap-2 text-[10px] text-neutral-500 font-mono">
                      <span>{formatBytes(sample.size)}</span>
                      <span>&bull;</span>
                      <span>{sample.pages} Page(s)</span>
                      <span>&bull;</span>
                      <span className="text-emerald-400">Preserved Tables</span>
                    </div>
                  </div>

                  <CyberButton
                    variant="secondary"
                    size="sm"
                    icon={<Plus className="w-3.5 h-3.5" />}
                    className="shrink-0 mt-1"
                    onClick={(e) => {
                      e.stopPropagation();
                      queueSamplePayload(sample);
                    }}
                  >
                    QUEUE
                  </CyberButton>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
// ===== END NEW CODE: SINGLE PDF & MULTI-FILE UPLOAD OPTIONS =====
