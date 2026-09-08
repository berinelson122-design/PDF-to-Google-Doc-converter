import React from 'react';

export const Watermark: React.FC = () => {
  return (
    <div 
      id="system-watermark"
      className="fixed bottom-3 right-4 z-50 pointer-events-none select-none flex items-center gap-2 px-2.5 py-1 rounded bg-black/80 border border-[#E056FD]/30 backdrop-blur-sm"
    >
      <span className="w-1.5 h-1.5 rounded-full bg-[#FF003C] animate-pulse" />
      <span className="font-mono text-[10px] tracking-widest text-[#E056FD] font-semibold">
        ARCHITECT // VOID_WEAVER
      </span>
    </div>
  );
};
