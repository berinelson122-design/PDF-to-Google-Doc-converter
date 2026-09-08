import React, { useRef, useState } from 'react';
import { Upload, FileText, Sparkles, AlertTriangle, CheckCircle, Database } from 'lucide-react';
import { useGameStore } from '../../store/useGameStore.ts';
import { CyberButton } from '../common/CyberButton.tsx';
import { formatBytes } from '../../utils/formatters.ts';
import { convertPdfToGoogleDoc } from '../../services/geminiService.ts';
import { cyberAudio } from '../../utils/audioSynth.ts';

// Sample PDF payloads with realistic structured documents
const SAMPLE_DOCS = [
  {
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
            <td style="border: 1px solid #d1d5db; padding: 9px 14px; font-weight: 500;">Gemini 3.8 Flash Synthesizer</td>
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
];

export const PdfUploader: React.FC = () => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const {
    currentPdf,
    setPdf,
    setStatus,
    setResult,
    status,
    progressPercent,
    statusMessage,
    addToHistory,
    incrementConversionCount,
  } = useGameStore();

  const handleProcessPayload = async (
    name: string,
    size: number,
    base64Data: string,
    samplePrecomputed?: string
  ) => {
    // Check user conversion limits
    const allowed = incrementConversionCount();
    if (!allowed) return;

    setIsProcessing(true);
    cyberAudio.playScanBeep(1);

    const pdfDoc = {
      id: 'doc_' + Date.now(),
      name,
      size,
      base64Data,
      pageCount: 1,
      uploadedAt: Date.now(),
    };
    setPdf(pdfDoc);

    try {
      setStatus('analyzing', 'UPLINK_INITIALIZED // TRANSMITTING_BYTE_STREAM', 20);

      let resultData;
      if (samplePrecomputed) {
        // High-speed simulated conversion pipeline for built-in sample
        await new Promise((r) => setTimeout(r, 400));
        setStatus('extracting_layout', 'GEMINI_3.8_FLASH // RECONSTRUCTING_GEOMETRY', 60);
        await new Promise((r) => setTimeout(r, 450));
        setStatus('rendering_doc', 'SYNTHESIZING_GOOGLE_DOCS_SEMANTIC_STRUCTURE', 90);
        await new Promise((r) => setTimeout(r, 300));

        resultData = {
          documentTitle: name.replace(/\.[^/.]+$/, ''),
          htmlContent: samplePrecomputed,
          markdownContent: `# ${name}\n\nConverted document layout.`,
          stats: {
            pages: 1,
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
          conversionTimeMs: 1150,
        };
      } else {
        // Real API call to server.ts -> Gemini 3.8 Flash
        resultData = await convertPdfToGoogleDoc({
          pdfBase64: base64Data,
          filename: name,
          onProgress: (percent, msg) => {
            setStatus('extracting_layout', msg, percent);
            cyberAudio.playScanBeep(Math.floor(percent / 20));
          },
        });
      }

      setResult(resultData);
      cyberAudio.playSuccessChime();

      addToHistory({
        id: pdfDoc.id,
        title: resultData.documentTitle,
        timestamp: Date.now(),
        pageCount: resultData.stats.pages,
        tablesCount: resultData.detectedElements.tablesCount,
        headingsCount: resultData.detectedElements.headingsCount,
        htmlContent: resultData.htmlContent,
        status: 'success',
      });
    } catch (err: any) {
      console.error('Extraction error:', err);
      cyberAudio.playAlertBuzz();
      setStatus('error', err.message || 'UPLINK_FAILURE');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      handleProcessPayload(file.name, file.size, base64);
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    if (!file.name.toLowerCase().endsWith('.pdf') && file.type !== 'application/pdf') {
      alert('Only .PDF files are supported for Google Docs reconstruction.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      handleProcessPayload(file.name, file.size, base64);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="w-full space-y-6">
      {/* Drag and Drop Zone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-md p-8 md:p-12 text-center cursor-pointer transition-all duration-200 ${
          dragOver
            ? 'border-[#FF003C] bg-[#FF003C]/10 glow-cyber-red'
            : 'border-neutral-800 bg-[#0A0A0C] hover:border-neutral-700 hover:bg-[#111114]'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="application/pdf,.pdf"
          className="hidden"
          onChange={handleFileChange}
        />

        <div className="flex flex-col items-center justify-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-neutral-900 border border-neutral-700 flex items-center justify-center text-[#FF003C] shadow-[0_0_15px_rgba(255,0,60,0.2)]">
            <Upload className="w-8 h-8" />
          </div>

          <div>
            <h3 className="font-mono text-sm md:text-base font-bold tracking-wider text-white uppercase">
              FEED PDF PAYLOAD INTO PIPELINE
            </h3>
            <p className="font-mono text-xs text-neutral-400 mt-1 max-w-md mx-auto">
              Drag & drop any PDF document, or click to browse. Preserves original tables, typography, headings, and color schemes.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <CyberButton variant="primary" size="sm" icon={<FileText className="w-4 h-4" />}>
              SELECT LOCAL PDF
            </CyberButton>
            <span className="font-mono text-[11px] text-neutral-500 uppercase">
              MAX 50 MB &bull; MULTI-PAGE
            </span>
          </div>
        </div>

        {/* Tactical Corner Marks */}
        <div className="absolute top-2 left-2 w-3 h-3 border-t-2 border-l-2 border-[#FF003C]" />
        <div className="absolute top-2 right-2 w-3 h-3 border-t-2 border-r-2 border-[#FF003C]" />
        <div className="absolute bottom-2 left-2 w-3 h-3 border-b-2 border-l-2 border-[#FF003C]" />
        <div className="absolute bottom-2 right-2 w-3 h-3 border-b-2 border-r-2 border-[#FF003C]" />
      </div>

      {/* Progress & Telemetry Bar */}
      {isProcessing && (
        <div className="p-4 border border-[#FF003C]/50 bg-black rounded shadow-[0_0_15px_rgba(255,0,60,0.15)] space-y-2.5">
          <div className="flex justify-between items-center text-xs font-mono">
            <span className="text-[#FF003C] font-bold flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#FF003C] animate-ping" />
              {statusMessage}
            </span>
            <span className="text-[#E056FD] font-bold">{progressPercent}%</span>
          </div>

          <div className="w-full h-2 bg-neutral-900 rounded overflow-hidden border border-neutral-800">
            <div
              className="h-full bg-gradient-to-r from-[#FF003C] via-[#ff3b68] to-[#E056FD] transition-all duration-300 shadow-[0_0_10px_#FF003C]"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          <div className="flex justify-between text-[10px] font-mono text-neutral-500">
            <span>MULTIMODAL_PARSING: GEMINI 3.8 FLASH</span>
            <span>TARGET_FORMAT: GOOGLE_DOCS_SEMANTIC_HTML</span>
          </div>
        </div>
      )}

      {/* Quick Test Payloads */}
      <div>
        <div className="flex items-center justify-between mb-2.5">
          <span className="font-mono text-xs uppercase tracking-wider text-neutral-400 font-bold flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-[#E056FD]" />
            PROTOTYPE PAYLOADS (INSTANT BENCHMARK)
          </span>
          <span className="text-[10px] font-mono text-neutral-500">PRE-CALIBRATED COMPLEX LAYOUTS</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {SAMPLE_DOCS.map((sample, idx) => (
            <div
              key={idx}
              onClick={() => handleProcessPayload(sample.title, sample.size, 'data:application/pdf;base64,sample', sample.sampleContent)}
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

              <CyberButton variant="secondary" size="sm" className="shrink-0 mt-1">
                TEST
              </CyberButton>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
