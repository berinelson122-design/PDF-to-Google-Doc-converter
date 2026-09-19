import React, { useState } from 'react';
import { 
  Download, 
  Copy, 
  ExternalLink, 
  Key, 
  Check, 
  FileText, 
  CloudUpload,
  AlertCircle,
  FileDown,
  FileCode,
  AlignLeft,
  Sparkles
} from 'lucide-react';
import { useGameStore } from '../../store/useGameStore.ts';
import { CyberModal } from '../common/CyberModal.tsx';
import { CyberButton } from '../common/CyberButton.tsx';
import { GoogleDocsService } from '../../services/googleDocsService.ts';
import { 
  downloadSingleDocx, 
  downloadSingleMarkdown, 
  downloadSinglePlainText 
} from '../../utils/docxExport.ts';
import { cyberAudio } from '../../utils/audioSynth.ts';
import { ExportDocumentFormat } from '../../types/index.ts';

// ===== START NEW CODE: MULTI-FORMAT EXPORT PROTOCOL WITH RADIO SELECTION =====
export const DocxExportModal: React.FC = () => {
  const { 
    isExportModalOpen, 
    openExportModal, 
    exportConfig, 
    setExportConfig, 
    editedHtml, 
    result,
    googleAccessToken,
    setGoogleAccessToken
  } = useGameStore();

  const [selectedFormat, setSelectedFormat] = useState<ExportDocumentFormat>('docx');
  const [copied, setCopied] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [uploadResult, setUploadResult] = useState<{ success: boolean; url?: string; error?: string } | null>(null);

  const activeHtml = editedHtml || result?.htmlContent || '';

  const handleCopy = async () => {
    cyberAudio.playButtonAction();
    const success = await GoogleDocsService.copyForDocs(activeHtml, exportConfig.docTitle);
    if (success) {
      setCopied(true);
      cyberAudio.playSuccessChime();
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleLaunchDocs = () => {
    cyberAudio.playButtonAction();
    handleCopy();
    GoogleDocsService.launchDocsNew();
  };

  const handleExecuteFormatExport = async () => {
    cyberAudio.playButtonAction();
    setIsDownloading(true);

    try {
      if (selectedFormat === 'docx') {
        await downloadSingleDocx(activeHtml, exportConfig.docTitle);
      } else if (selectedFormat === 'md') {
        downloadSingleMarkdown(activeHtml, exportConfig.docTitle, result?.markdownContent);
      } else if (selectedFormat === 'txt') {
        downloadSinglePlainText(activeHtml, exportConfig.docTitle);
      }
      cyberAudio.playSuccessChime();
    } catch (err) {
      console.error('Export download error:', err);
      cyberAudio.playAlertBuzz();
    } finally {
      setIsDownloading(false);
    }
  };

  const handleDownloadDocx = async () => {
    cyberAudio.playButtonAction();
    setIsDownloading(true);
    try {
      await downloadSingleDocx(activeHtml, exportConfig.docTitle);
      cyberAudio.playSuccessChime();
    } catch (err) {
      console.error('Docx download error:', err);
      cyberAudio.playAlertBuzz();
    } finally {
      setIsDownloading(false);
    }
  };

  const handleDownloadMd = () => {
    cyberAudio.playButtonAction();
    downloadSingleMarkdown(activeHtml, exportConfig.docTitle, result?.markdownContent);
    cyberAudio.playSuccessChime();
  };

  const handleDownloadTxt = () => {
    cyberAudio.playButtonAction();
    downloadSinglePlainText(activeHtml, exportConfig.docTitle);
    cyberAudio.playSuccessChime();
  };

  const handleDownloadHtml = () => {
    cyberAudio.playButtonAction();
    GoogleDocsService.exportAsHtml(activeHtml, exportConfig.docTitle);
  };

  const handleDriveUpload = async () => {
    if (!googleAccessToken) return;
    setIsUploading(true);
    cyberAudio.playScanBeep(2);
    setUploadResult(null);

    const res = await GoogleDocsService.uploadToGoogleDrive(
      googleAccessToken,
      activeHtml,
      exportConfig.docTitle
    );

    setIsUploading(false);
    if (res.success) {
      cyberAudio.playSuccessChime();
      setUploadResult({ success: true, url: res.documentUrl });
    } else {
      cyberAudio.playAlertBuzz();
      setUploadResult({ success: false, error: res.error });
    }
  };

  const FORMAT_OPTIONS = [
    {
      id: 'docx' as ExportDocumentFormat,
      label: 'Formatted Word Document (.docx)',
      ext: '.DOCX',
      icon: <FileDown className="w-4 h-4 text-emerald-400" />,
      tag: '100% TABLES & STYLES',
      tagColor: 'text-emerald-400 border-emerald-500/40 bg-emerald-950/30',
      description: 'Preserves font families, cell borders, backgrounds, and full document structure.',
    },
    {
      id: 'md' as ExportDocumentFormat,
      label: 'Structured Markdown (.md)',
      ext: '.MD',
      icon: <FileCode className="w-4 h-4 text-[#FF003C]" />,
      tag: 'GITHUB & DEVELOPER',
      tagColor: 'text-[#FF003C] border-red-500/40 bg-red-950/30',
      description: 'GitHub-flavored markdown syntax with pipe tables, bullet hierarchy, and bold markup.',
    },
    {
      id: 'txt' as ExportDocumentFormat,
      label: 'Clean Plain Text (.txt)',
      ext: '.TXT',
      icon: <AlignLeft className="w-4 h-4 text-[#E056FD]" />,
      tag: 'STREAM & LLM INGEST',
      tagColor: 'text-[#E056FD] border-[#E056FD]/40 bg-purple-950/30',
      description: 'Stripped plain-text without HTML noise, maintaining crisp paragraph spacing.',
    },
  ];

  return (
    <CyberModal
      isOpen={isExportModalOpen}
      onClose={() => openExportModal(false)}
      title="EXPORT TO GOOGLE DOCS // PROTOCOL"
      subtitle="SEAMLESS GOOGLE WORKSPACE DISPATCH"
      maxWidth="max-w-xl"
    >
      <div className="space-y-6">
        {/* Document Title Config */}
        <div>
          <label className="block text-xs uppercase text-neutral-400 mb-1.5 font-bold">
            Target Google Doc Title
          </label>
          <input
            type="text"
            value={exportConfig.docTitle}
            onChange={(e) => setExportConfig({ docTitle: e.target.value })}
            className="w-full bg-black border border-neutral-700 focus:border-[#FF003C] rounded px-3 py-2 text-xs font-mono text-white outline-none"
            placeholder="Document Name"
          />
        </div>

        {/* Primary Method 1: One-Click Paste Bridge */}
        <div className="p-4 border border-[#FF003C]/50 bg-black/60 rounded space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#FF003C]" />
              <span className="text-xs font-bold text-white uppercase">
                Method 1: Instant Google Docs Paste Bridge
              </span>
            </div>
            <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-500/30">
              ZERO CONFIG &bull; 100% FIDELITY
            </span>
          </div>

          <p className="text-xs text-neutral-400 leading-relaxed">
            Click <strong>COPY & OPEN DOCS.NEW</strong>. The clipboard writes formatted HTML tables and font hierarchies. Simply press <kbd className="text-[#FF003C] font-bold">Ctrl+V</kbd> (or <kbd className="text-[#FF003C] font-bold">Cmd+V</kbd>) inside Google Docs!
          </p>

          <div className="flex items-center gap-2 pt-1">
            <CyberButton
              variant="primary"
              size="md"
              onClick={handleLaunchDocs}
              icon={<ExternalLink className="w-4 h-4" />}
            >
              {copied ? 'COPIED! OPENING DOCS.NEW...' : 'COPY & OPEN DOCS.NEW'}
            </CyberButton>

            <CyberButton
              variant="secondary"
              size="md"
              onClick={handleCopy}
              icon={copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            >
              {copied ? 'COPIED' : 'COPY CLIPBOARD'}
            </CyberButton>
          </div>
        </div>

        {/* Primary Method 2: Direct Google Drive API Upload */}
        <div className="p-4 border border-neutral-800 bg-neutral-950 rounded space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-neutral-200 uppercase">
            <CloudUpload className="w-4 h-4 text-[#E056FD]" />
            Method 2: Direct Google Drive API Uplink
          </div>

          <p className="text-xs text-neutral-400">
            If you have a Google OAuth 2.0 Access Token (with <code>drive.file</code> scope), paste it below to create the Google Doc automatically in your Google Drive.
          </p>

          <div className="flex items-center gap-2">
            <input
              type="password"
              value={googleAccessToken}
              onChange={(e) => setGoogleAccessToken(e.target.value)}
              placeholder="Paste Google OAuth Bearer Token (ya29...)"
              className="flex-1 bg-black border border-neutral-800 focus:border-[#E056FD] rounded px-3 py-1.5 text-xs font-mono text-white outline-none"
            />
            <CyberButton
              variant="secondary"
              size="sm"
              disabled={!googleAccessToken || isUploading}
              onClick={handleDriveUpload}
              icon={<CloudUpload className="w-3.5 h-3.5" />}
            >
              {isUploading ? 'UPLOADING...' : 'UPLOAD TO DRIVE'}
            </CyberButton>
          </div>

          {uploadResult && (
            <div className={`p-2.5 rounded border text-xs font-mono flex items-center justify-between ${
              uploadResult.success 
                ? 'border-emerald-500/50 bg-emerald-950/30 text-emerald-400' 
                : 'border-[#FF003C]/50 bg-red-950/30 text-[#FF003C]'
            }`}>
              <span>{uploadResult.success ? 'Document created in Drive!' : uploadResult.error}</span>
              {uploadResult.url && (
                <a
                  href={uploadResult.url}
                  target="_blank"
                  rel="noreferrer"
                  className="underline font-bold flex items-center gap-1"
                >
                  OPEN DOC <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>
          )}
        </div>

        {/* Method 3: Multi-Format Radio Selection Export Protocol */}
        <div className="p-4 border border-neutral-800 bg-neutral-950 rounded space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="text-xs font-bold text-white uppercase flex items-center gap-2">
              <Download className="w-4 h-4 text-[#FF003C]" />
              Method 3: Direct Multi-Format File Export
            </div>
            <span className="text-[10px] font-mono text-neutral-400">
              SELECT DESIRED FORMAT:
            </span>
          </div>

          {/* Radio Group Selection */}
          <div className="space-y-2">
            {FORMAT_OPTIONS.map((fmt) => {
              const isSelected = selectedFormat === fmt.id;
              return (
                <label
                  key={fmt.id}
                  onClick={() => cyberAudio.playCyberClick()}
                  className={`flex items-start gap-3 p-3 rounded border cursor-pointer transition-all ${
                    isSelected
                      ? 'border-[#FF003C] bg-red-950/20 shadow-[0_0_12px_rgba(255,0,60,0.15)]'
                      : 'border-neutral-800/80 bg-black/60 hover:border-neutral-700 hover:bg-black'
                  }`}
                >
                  <div className="pt-0.5">
                    <input
                      type="radio"
                      name="export_format_selection"
                      value={fmt.id}
                      checked={isSelected}
                      onChange={() => setSelectedFormat(fmt.id)}
                      className="accent-[#FF003C] w-4 h-4 cursor-pointer"
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center justify-between gap-1.5">
                      <div className="flex items-center gap-2 font-bold text-xs text-white">
                        {fmt.icon}
                        <span>{fmt.label}</span>
                      </div>
                      <span className={`text-[9px] font-mono px-2 py-0.5 rounded border uppercase font-semibold ${fmt.tagColor}`}>
                        {fmt.tag}
                      </span>
                    </div>
                    <p className="text-[11px] text-neutral-400 mt-1 leading-relaxed">
                      {fmt.description}
                    </p>
                  </div>
                </label>
              );
            })}
          </div>

          {/* Primary Format Execution Button */}
          <div className="pt-2 border-t border-neutral-800/80 flex flex-col sm:flex-row items-center gap-2">
            <CyberButton
              variant="primary"
              size="md"
              disabled={isDownloading}
              onClick={handleExecuteFormatExport}
              icon={<Download className="w-4 h-4" />}
              className="w-full sm:w-auto flex-1 font-bold shadow-[0_0_12px_rgba(255,0,60,0.3)]"
            >
              {isDownloading 
                ? 'GENERATING EXPORT...' 
                : `EXPORT AS ${selectedFormat.toUpperCase()} (${selectedFormat === 'docx' ? '.DOCX' : selectedFormat === 'md' ? '.MD' : '.TXT'})`
              }
            </CyberButton>

            {/* Quick 1-Click Format Badges */}
            <div className="flex items-center gap-1.5 w-full sm:w-auto justify-end">
              <button
                type="button"
                onClick={handleDownloadDocx}
                className="px-2 py-1 bg-black border border-neutral-800 hover:border-emerald-500 text-[10px] font-mono text-emerald-400 rounded transition-colors"
                title="Direct 1-Click .DOCX Download"
              >
                .DOCX
              </button>
              <button
                type="button"
                onClick={handleDownloadMd}
                className="px-2 py-1 bg-black border border-neutral-800 hover:border-[#FF003C] text-[10px] font-mono text-[#FF003C] rounded transition-colors"
                title="Direct 1-Click .MD Download"
              >
                .MD
              </button>
              <button
                type="button"
                onClick={handleDownloadTxt}
                className="px-2 py-1 bg-black border border-neutral-800 hover:border-[#E056FD] text-[10px] font-mono text-[#E056FD] rounded transition-colors"
                title="Direct 1-Click .TXT Download"
              >
                .TXT
              </button>
              <button
                type="button"
                onClick={handleDownloadHtml}
                className="px-2 py-1 bg-black border border-neutral-800 hover:border-neutral-600 text-[10px] font-mono text-neutral-400 rounded transition-colors"
                title="Direct 1-Click .HTML Download"
              >
                .HTML
              </button>
            </div>
          </div>
        </div>
      </div>
    </CyberModal>
  );
};
