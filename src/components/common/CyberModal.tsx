import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { cyberAudio } from '../../utils/audioSynth.ts';

export interface CyberModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  maxWidth?: string;
}

export const CyberModal: React.FC<CyberModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  maxWidth = 'max-w-2xl',
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-150">
      <div 
        className={`w-full ${maxWidth} bg-[#0A0A0C] border border-[#FF003C]/60 shadow-[0_0_30px_rgba(255,0,60,0.2)] rounded flex flex-col max-h-[90vh] overflow-hidden`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-neutral-950 border-b border-neutral-800">
          <div className="flex items-center gap-2.5">
            <span className="w-2 h-2 bg-[#FF003C] rounded-none" />
            <div>
              <h3 className="font-mono text-xs md:text-sm font-bold tracking-widest text-white uppercase">
                {title}
              </h3>
              {subtitle && (
                <p className="font-mono text-[10px] text-neutral-400">
                  {subtitle}
                </p>
              )}
            </div>
          </div>
          <button
            onClick={() => {
              cyberAudio.playCyberClick();
              onClose();
            }}
            className="text-neutral-400 hover:text-[#FF003C] transition-colors p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 overflow-y-auto font-mono text-sm text-neutral-300">
          {children}
        </div>
      </div>
    </div>
  );
};
