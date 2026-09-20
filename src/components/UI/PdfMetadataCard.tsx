import React from 'react';
import { 
  FileText, 
  FileCode, 
  Clock, 
  Cpu, 
  ShieldCheck, 
  User, 
  Lock, 
  Unlock, 
  Layers, 
  CheckCircle2, 
  X, 
  Zap,
  HardDrive
} from 'lucide-react';
import { PdfTechnicalMetadata } from '../../types/index.ts';
import { formatBytes } from '../../utils/formatters.ts';
import { CyberButton } from '../common/CyberButton.tsx';

// ===== START NEW CODE: PDF METADATA DISPLAY SUB-COMPONENT =====

interface PdfMetadataCardProps {
  fileName: string;
  fileSize: number;
  metadata: PdfTechnicalMetadata;
  onConfirm?: () => void;
  onCancel?: () => void;
  isProcessing?: boolean;
  compact?: boolean;
}

/**
 * Dedicated sub-component for displaying extracted PDF metadata (PDF version, author, page count, security)
 * immediately after file selection. Designed with high text legibility and clean layout.
 */
export const PdfMetadataCard: React.FC<PdfMetadataCardProps> = ({
  fileName,
  fileSize,
  metadata,
  onConfirm,
  onCancel,
  isProcessing = false,
  compact = false,
}) => {
  const authorDisplay = metadata.author || 'Standard / Unspecified';
  const versionDisplay = metadata.pdfVersion || 'PDF v1.7';
  const pageCountDisplay = `${metadata.pageCount || 1} Page${(metadata.pageCount || 1) > 1 ? 's' : ''}`;

  if (compact) {
    return (
      <div className="p-3 bg-neutral-950 border border-neutral-800 rounded-md font-mono text-sm space-y-2">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 overflow-hidden truncate">
            <FileText className="w-4 h-4 text-[#FF003C] shrink-0" />
            <span className="font-bold text-white truncate text-sm">{fileName}</span>
          </div>
          <span className="px-2 py-0.5 rounded text-xs font-bold border border-neutral-700 bg-neutral-900 text-neutral-300 shrink-0">
            {versionDisplay}
          </span>
        </div>

        <div className="grid grid-cols-3 gap-2 text-xs pt-1 border-t border-neutral-800 text-neutral-400">
          <div>
            <span className="text-neutral-500 block text-[11px] font-bold">PAGES</span>
            <span className="text-white font-bold text-sm">{pageCountDisplay}</span>
          </div>
          <div>
            <span className="text-neutral-500 block text-[11px] font-bold">AUTHOR</span>
            <span className="text-white font-semibold truncate block text-xs">{authorDisplay}</span>
          </div>
          <div>
            <span className="text-neutral-500 block text-[11px] font-bold">SIZE</span>
            <span className="text-white font-semibold text-xs">{formatBytes(fileSize)}</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      id="pdf-metadata-inspector-card"
      className="p-5 md:p-6 bg-[#08080B] border-2 border-[#FF003C] rounded-md space-y-5 font-mono shadow-[0_0_25px_rgba(255,0,60,0.2)]"
    >
      {/* Card Header with Verified Badge */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-neutral-800">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded bg-[#FF003C]/20 border border-[#FF003C] text-[#FF003C]">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base md:text-lg font-bold text-white uppercase tracking-wider">
              PDF FILE METADATA INSPECTOR
            </h3>
            <p className="text-xs text-neutral-400">
              Verified document properties extracted directly from PDF binary stream
            </p>
          </div>
        </div>

        <span className="px-3 py-1 rounded text-xs font-bold border border-emerald-500/60 bg-emerald-950/40 text-emerald-400 uppercase flex items-center gap-1.5">
          <CheckCircle2 className="w-4 h-4" />
          FILE READY FOR RECONSTRUCTION
        </span>
      </div>

      {/* Primary Key Metadata Metrics (PDF Version, Author, Page Count) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        {/* Metric 1: PDF Specification Version */}
        <div className="p-4 bg-black border border-neutral-800 rounded-md space-y-1">
          <div className="flex items-center gap-2 text-xs font-bold text-cyan-400 uppercase">
            <Cpu className="w-4 h-4" />
            PDF VERSION
          </div>
          <div className="text-lg md:text-xl font-bold text-white pt-0.5">
            {versionDisplay}
          </div>
          <div className="text-xs text-neutral-500">
            Standard ISO 32000 specification
          </div>
        </div>

        {/* Metric 2: Document Author */}
        <div className="p-4 bg-black border border-neutral-800 rounded-md space-y-1">
          <div className="flex items-center gap-2 text-xs font-bold text-[#E056FD] uppercase">
            <User className="w-4 h-4" />
            DOCUMENT AUTHOR
          </div>
          <div className="text-base md:text-lg font-bold text-white pt-0.5 truncate" title={authorDisplay}>
            {authorDisplay}
          </div>
          <div className="text-xs text-neutral-500 truncate" title={metadata.creatorTool || 'Native Editor'}>
            Tool: {metadata.creatorTool || 'Standard Native Editor'}
          </div>
        </div>

        {/* Metric 3: Page Count */}
        <div className="p-4 bg-black border border-neutral-800 rounded-md space-y-1">
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 uppercase">
            <Layers className="w-4 h-4" />
            PAGE COUNT
          </div>
          <div className="text-lg md:text-xl font-bold text-white pt-0.5">
            {pageCountDisplay}
          </div>
          <div className="text-xs text-neutral-500">
            {formatBytes(fileSize)} payload volume
          </div>
        </div>
      </div>

      {/* Secondary Properties (File Identity, Timestamps, Security Settings) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-black p-4 rounded-md border border-neutral-800">
        {/* Left info: File Name and Creation Date */}
        <div className="space-y-2">
          <div>
            <span className="text-neutral-500 block font-bold text-[11px] uppercase">Selected File Name</span>
            <span className="text-white font-semibold text-sm break-all">{fileName}</span>
          </div>
          <div>
            <span className="text-neutral-500 block font-bold text-[11px] uppercase flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              Creation Timestamp
            </span>
            <span className="text-neutral-300 text-xs">
              {metadata.creationDate ? new Date(metadata.creationDate).toLocaleString() : 'Not stamped in PDF header'}
            </span>
          </div>
        </div>

        {/* Right info: Security and Extraction Matrix */}
        <div className="space-y-2">
          <span className="text-neutral-500 block font-bold text-[11px] uppercase flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5 text-emerald-400" />
            Security &amp; Permissions
          </span>
          <div className="flex flex-wrap gap-1.5 pt-0.5">
            <span className={`px-2 py-0.5 rounded text-xs font-bold border ${
              metadata.isEncrypted
                ? 'border-rose-600 bg-rose-950/40 text-rose-300'
                : 'border-emerald-600/60 bg-emerald-950/30 text-emerald-300'
            }`}>
              {metadata.isEncrypted ? 'ENCRYPTED' : 'CLEAR (UNENCRYPTED)'}
            </span>
            <span className="px-2 py-0.5 rounded text-xs font-semibold border border-neutral-800 bg-neutral-900 text-neutral-300">
              {metadata.securitySettings.allowsCopying ? 'TEXT EXTRACTION: ALLOWED' : 'EXTRACTION: RESTRICTED'}
            </span>
            <span className="px-2 py-0.5 rounded text-xs font-semibold border border-neutral-800 bg-neutral-900 text-neutral-300">
              {metadata.securitySettings.allowsPrinting ? 'PRINT: ALLOWED' : 'PRINT: RESTRICTED'}
            </span>
          </div>
        </div>
      </div>

      {/* Confirmation & Action Controls */}
      {(onConfirm || onCancel) && (
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-neutral-800">
          <div className="text-xs text-neutral-400">
            Review the extracted metadata above and click convert to generate your Google Doc.
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            {onCancel && (
              <CyberButton
                variant="outline"
                size="md"
                onClick={onCancel}
                disabled={isProcessing}
                icon={<X className="w-4 h-4" />}
              >
                DISCARD
              </CyberButton>
            )}

            {onConfirm && (
              <CyberButton
                variant="primary"
                size="md"
                onClick={onConfirm}
                disabled={isProcessing}
                icon={<Zap className="w-4 h-4" />}
                glow={!isProcessing}
                className="font-bold shadow-[0_0_15px_rgba(255,0,60,0.4)]"
              >
                {isProcessing ? 'CONVERTING...' : 'CONFIRM & CONVERT TO GOOGLE DOC'}
              </CyberButton>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// ===== END NEW CODE: PDF METADATA DISPLAY SUB-COMPONENT =====
