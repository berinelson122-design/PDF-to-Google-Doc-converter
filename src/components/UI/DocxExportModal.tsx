import React, { useState } from 'react';
import { 
  Download, 
  Copy, 
  ExternalLink, 
  Key, 
  Check, 
  FileText, 
  CloudUpload,
  AlertCircle
} from 'lucide-react';
import { useGameStore } from '../../store/useGameStore.ts';
import { CyberModal } from '../common/CyberModal.tsx';
import { CyberButton } from '../common/CyberButton.tsx';
import { GoogleDocsService } from '../../services/googleDocsService.ts';
import { cyberAudio } from '../../utils/audioSynth.ts';

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

  const [copied, setCopied] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
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

  const handleDownloadDoc = () => {
    cyberAudio.playButtonAction();
    GoogleDocsService.exportAsDoc(activeHtml, exportConfig.docTitle);
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

        {/* Method 3: Download Formats */}
        <div className="p-4 border border-neutral-800 bg-neutral-950 rounded space-y-3">
          <div className="text-xs font-bold text-neutral-300 uppercase flex items-center gap-2">
            <Download className="w-4 h-4 text-neutral-400" />
            Method 3: Direct File Export
          </div>

          <div className="grid grid-cols-2 gap-2 pt-1">
            <CyberButton
              variant="outline"
              size="sm"
              onClick={handleDownloadDoc}
              icon={<FileText className="w-3.5 h-3.5 text-[#FF003C]" />}
            >
              DOWNLOAD .DOC (NATIVE)
            </CyberButton>

            <CyberButton
              variant="outline"
              size="sm"
              onClick={handleDownloadHtml}
              icon={<FileText className="w-3.5 h-3.5 text-[#E056FD]" />}
            >
              DOWNLOAD .HTML
            </CyberButton>
          </div>
        </div>
      </div>
    </CyberModal>
  );
};
