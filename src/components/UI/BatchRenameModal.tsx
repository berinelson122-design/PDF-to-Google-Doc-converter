// ===== START NEW CODE: BATCH RENAME MODAL FOR SELECTED CONVERSIONS =====
import React, { useState, useMemo } from 'react';
import { 
  X, 
  Edit3, 
  ArrowRight, 
  Check, 
  FileText, 
  Sliders, 
  RotateCcw,
  Sparkles
} from 'lucide-react';
import { ConversionHistoryItem, BatchRenameConfig } from '../../types/index.ts';
import { CyberButton } from '../common/CyberButton.tsx';
import { cyberAudio } from '../../utils/audioSynth.ts';

export interface BatchRenameModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedItems: ConversionHistoryItem[];
  onApplyRename: (config: BatchRenameConfig) => void;
}

export const BatchRenameModal: React.FC<BatchRenameModalProps> = ({
  isOpen,
  onClose,
  selectedItems,
  onApplyRename,
}) => {
  const [prefix, setPrefix] = useState('');
  const [suffix, setSuffix] = useState('');
  const [findText, setFindText] = useState('');
  const [replaceText, setReplaceText] = useState('');

  // Generate live preview of new names
  const renamedPreviews = useMemo(() => {
    return selectedItems.map((item) => {
      const origFileName = item.originalFileName || `${item.title}.pdf`;
      let baseName = origFileName.replace(/\.pdf$/i, '');

      if (findText) {
        baseName = baseName.split(findText).join(replaceText);
      }

      const newBaseName = `${prefix}${baseName}${suffix}`;
      const newFileName = `${newBaseName}.pdf`;

      return {
        id: item.id,
        original: origFileName,
        renamed: newFileName,
        hasChanged: origFileName !== newFileName,
      };
    });
  }, [selectedItems, prefix, suffix, findText, replaceText]);

  const hasAnyChanges = renamedPreviews.some((p) => p.hasChanged);

  if (!isOpen) return null;

  const handleReset = () => {
    cyberAudio.playCyberClick();
    setPrefix('');
    setSuffix('');
    setFindText('');
    setReplaceText('');
  };

  const handleApply = () => {
    if (!hasAnyChanges) {
      onClose();
      return;
    }
    cyberAudio.playSuccessChime();
    onApplyRename({
      prefix,
      suffix,
      findText,
      replaceText,
    });
    onClose();
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-200 font-mono"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-2xl bg-[#0A0A0D] border border-neutral-800 rounded-lg shadow-[0_0_35px_rgba(0,0,0,0.85)] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-800 bg-[#060608]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-[#FF003C]/10 border border-[#FF003C]/40 flex items-center justify-center text-[#FF003C]">
              <Edit3 className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm uppercase font-bold text-white tracking-wider">
                  BATCH RENAME CONVERTED FILES
                </h3>
                <span className="px-2 py-0.5 rounded bg-[#FF003C]/10 border border-[#FF003C]/40 text-[#FF003C] text-xs font-bold">
                  {selectedItems.length} SELECTED
                </span>
              </div>
              <p className="text-[11px] text-neutral-400 mt-0.5">
                Apply consistent naming rules, prefixes, and suffixes to multiple files prior to archive download
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-white rounded hover:bg-neutral-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Configuration Form Controls */}
        <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
          {/* Prefix and Suffix Inputs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs uppercase text-neutral-300 font-bold mb-1.5">
                Custom Prefix
              </label>
              <input
                type="text"
                value={prefix}
                onChange={(e) => setPrefix(e.target.value)}
                placeholder="e.g. 2026_Q3_ or CLIENT_"
                className="w-full bg-[#0E0E12] border border-neutral-700 focus:border-[#FF003C] rounded px-3 py-2 text-xs text-white placeholder-neutral-500 focus:outline-none focus:ring-1 focus:ring-[#FF003C]"
              />
              {/* Quick Preset Buttons */}
              <div className="flex flex-wrap gap-1 mt-1.5">
                {['2026_', 'Q3_', 'CLIENT_', 'FINAL_'].map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => {
                      cyberAudio.playCyberClick();
                      setPrefix(tag);
                    }}
                    className="px-1.5 py-0.5 rounded bg-neutral-900 border border-neutral-800 text-[10px] text-neutral-400 hover:text-white hover:border-neutral-700"
                  >
                    +{tag}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs uppercase text-neutral-300 font-bold mb-1.5">
                Custom Suffix
              </label>
              <input
                type="text"
                value={suffix}
                onChange={(e) => setSuffix(e.target.value)}
                placeholder="e.g. _FINAL or _APPROVED"
                className="w-full bg-[#0E0E12] border border-neutral-700 focus:border-[#FF003C] rounded px-3 py-2 text-xs text-white placeholder-neutral-500 focus:outline-none focus:ring-1 focus:ring-[#FF003C]"
              />
              {/* Quick Preset Buttons */}
              <div className="flex flex-wrap gap-1 mt-1.5">
                {['_FINAL', '_DOCX', '_VERIFIED', '_V2'].map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => {
                      cyberAudio.playCyberClick();
                      setSuffix(tag);
                    }}
                    className="px-1.5 py-0.5 rounded bg-neutral-900 border border-neutral-800 text-[10px] text-neutral-400 hover:text-white hover:border-neutral-700"
                  >
                    +{tag}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Optional Find and Replace */}
          <div className="p-3 bg-neutral-950 border border-neutral-800 rounded space-y-2.5">
            <div className="text-xs uppercase text-neutral-400 font-bold flex items-center justify-between">
              <span>Find and Replace in Filenames</span>
              <span className="text-[10px] text-neutral-500 lowercase">(optional)</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <input
                  type="text"
                  value={findText}
                  onChange={(e) => setFindText(e.target.value)}
                  placeholder="Find text (e.g. sample_ or draft)"
                  className="w-full bg-[#0E0E12] border border-neutral-700 focus:border-[#E056FD] rounded px-2.5 py-1.5 text-xs text-white placeholder-neutral-500 focus:outline-none"
                />
              </div>
              <div>
                <input
                  type="text"
                  value={replaceText}
                  onChange={(e) => setReplaceText(e.target.value)}
                  placeholder="Replace with (e.g. final)"
                  className="w-full bg-[#0E0E12] border border-neutral-700 focus:border-[#E056FD] rounded px-2.5 py-1.5 text-xs text-white placeholder-neutral-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Real-time Interactive Preview Table */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-neutral-300">
              <span className="font-bold uppercase tracking-wider">LIVE PREVIEW OF RESULTING FILENAMES</span>
              {hasAnyChanges && (
                <button
                  type="button"
                  onClick={handleReset}
                  className="text-[10px] text-neutral-400 hover:text-white flex items-center gap-1"
                >
                  <RotateCcw className="w-3 h-3" /> RESET FIELDS
                </button>
              )}
            </div>

            <div className="border border-neutral-800 rounded bg-[#060608] max-h-48 overflow-y-auto divide-y divide-neutral-900">
              {renamedPreviews.map((p) => (
                <div key={p.id} className="p-2.5 flex items-center justify-between gap-3 text-xs">
                  <div className="min-w-0 flex-1 truncate text-neutral-400 font-mono" title={p.original}>
                    {p.original}
                  </div>

                  <ArrowRight className={`w-3.5 h-3.5 shrink-0 ${p.hasChanged ? 'text-[#00FF66]' : 'text-neutral-600'}`} />

                  <div 
                    className={`min-w-0 flex-1 truncate font-mono font-bold ${
                      p.hasChanged ? 'text-[#00FF66]' : 'text-neutral-500'
                    }`} 
                    title={p.renamed}
                  >
                    {p.renamed}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Modal Footer Controls */}
        <div className="px-5 py-3.5 border-t border-neutral-800 bg-[#060608] flex items-center justify-between gap-3">
          <CyberButton
            variant="outline"
            size="sm"
            onClick={onClose}
          >
            CANCEL
          </CyberButton>

          <CyberButton
            variant="primary"
            size="sm"
            icon={<Check className="w-4 h-4" />}
            onClick={handleApply}
            disabled={!hasAnyChanges}
            className="!text-xs !py-2 !px-4 shadow-[0_0_12px_rgba(255,0,60,0.3)]"
          >
            APPLY BATCH RENAME ({selectedItems.length} FILES)
          </CyberButton>
        </div>
      </div>
    </div>
  );
};
// ===== END NEW CODE: BATCH RENAME MODAL FOR SELECTED CONVERSIONS =====
