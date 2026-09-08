import React from 'react';
import { History, FileText, CheckCircle2, RotateCcw } from 'lucide-react';
import { useGameStore } from '../../store/useGameStore.ts';
import { formatTimestamp } from '../../utils/formatters.ts';
import { CyberButton } from '../common/CyberButton.tsx';
import { cyberAudio } from '../../utils/audioSynth.ts';

export const ConversionHistory: React.FC = () => {
  const { history, loadHistoryItem } = useGameStore();

  if (history.length === 0) return null;

  return (
    <div className="w-full bg-[#0A0A0C] border border-neutral-800 rounded p-4 space-y-3 font-mono">
      <div className="flex items-center justify-between">
        <span className="text-xs uppercase text-neutral-400 font-bold flex items-center gap-2">
          <History className="w-3.5 h-3.5 text-[#E056FD]" />
          CONVERSION TELEMETRY LOGS ({history.length})
        </span>
        <span className="text-[10px] text-neutral-500">SESSION CACHE</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
        {history.map((item) => (
          <div
            key={item.id}
            onClick={() => {
              cyberAudio.playCyberClick();
              loadHistoryItem(item);
            }}
            className="p-3 border border-neutral-800 hover:border-[#FF003C]/50 bg-black/60 rounded cursor-pointer transition-all flex items-center justify-between group"
          >
            <div className="space-y-1 overflow-hidden">
              <div className="flex items-center gap-1.5 text-xs text-white font-bold truncate group-hover:text-[#FF003C] transition-colors">
                <FileText className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                <span className="truncate">{item.title}</span>
              </div>
              <div className="flex items-center gap-2 text-[10px] text-neutral-500">
                <span>{formatTimestamp(item.timestamp)}</span>
                <span>&bull;</span>
                <span className="text-emerald-400">{item.tablesCount} Tables</span>
                <span>&bull;</span>
                <span>{item.headingsCount} Headings</span>
              </div>
            </div>

            <RotateCcw className="w-3.5 h-3.5 text-neutral-600 group-hover:text-[#FF003C] shrink-0 ml-2" />
          </div>
        ))}
      </div>
    </div>
  );
};
