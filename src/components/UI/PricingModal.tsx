import React from 'react';
import { Check, Zap, Crown, ShieldCheck, Sparkles } from 'lucide-react';
import { useGameStore } from '../../store/useGameStore.ts';
import { CyberModal } from '../common/CyberModal.tsx';
import { CyberButton } from '../common/CyberButton.tsx';
import { cyberAudio } from '../../utils/audioSynth.ts';

export const PricingModal: React.FC = () => {
  const { 
    isPricingModalOpen, 
    openPricingModal, 
    subscription, 
    upgradeToPro 
  } = useGameStore();

  const handleUpgrade = () => {
    cyberAudio.playSuccessChime();
    upgradeToPro();
  };

  return (
    <CyberModal
      isOpen={isPricingModalOpen}
      onClose={() => openPricingModal(false)}
      title="SYSTEM_ACCESS // SERVICE TIERS"
      subtitle="SCALE DOCUMENT PIPELINE & UNLOCK UNLIMITED CONVERSIONS"
      maxWidth="max-w-2xl"
    >
      <div className="space-y-6">
        <div className="text-center space-y-1">
          <h2 className="text-base font-bold text-white uppercase tracking-wider font-mono">
            UPGRADE FOR HIGH-THROUGHPUT PROCESSING
          </h2>
          <p className="text-xs text-neutral-400 font-mono">
            Direct PDF to Google Docs engine powered by Gemini 3.8 Flash multimodal reasoning.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Free Tier Card */}
          <div className={`p-5 rounded border flex flex-col justify-between ${
            subscription.tier === 'free'
              ? 'border-neutral-700 bg-neutral-950'
              : 'border-neutral-800 bg-neutral-950/40 opacity-70'
          }`}>
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="font-mono text-xs font-bold text-neutral-400 uppercase">
                  FREE TIER
                </span>
                {subscription.tier === 'free' && (
                  <span className="text-[10px] font-mono bg-neutral-800 text-neutral-300 px-2 py-0.5 rounded">
                    ACTIVE TIER
                  </span>
                )}
              </div>

              <div className="font-mono text-2xl font-bold text-white mb-4">
                $0 <span className="text-xs text-neutral-500 font-normal">/ month</span>
              </div>

              <ul className="space-y-2.5 text-xs font-mono text-neutral-300 mb-6">
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-[#FF003C]" />
                  <span>3 Free Document Conversions / day</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-[#FF003C]" />
                  <span>Tables & Font Layout Preservation</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-[#FF003C]" />
                  <span>One-Click Clipboard to docs.google.com</span>
                </li>
              </ul>
            </div>

            <div className="text-center font-mono text-[11px] text-neutral-500 py-2 border-t border-neutral-900">
              Conversions Today: {subscription.conversionsToday} / {subscription.dailyFreeLimit}
            </div>
          </div>

          {/* Pro Tier Card */}
          <div className="p-5 rounded border border-[#FF003C] bg-black shadow-[0_0_20px_rgba(255,0,60,0.2)] flex flex-col justify-between relative overflow-hidden">
            <div className="absolute top-0 right-0 bg-[#FF003C] text-white text-[9px] font-bold font-mono px-3 py-0.5 uppercase tracking-wider">
              RECOMMENDED
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="font-mono text-xs font-bold text-[#FF003C] uppercase flex items-center gap-1.5">
                  <Crown className="w-3.5 h-3.5" /> PRO OPERATOR
                </span>
              </div>

              <div className="font-mono text-2xl font-bold text-white mb-4">
                $4.99 <span className="text-xs text-neutral-500 font-normal">/ month</span>
                <span className="text-[11px] text-[#E056FD] ml-2 block font-normal">or $29 / year</span>
              </div>

              <ul className="space-y-2.5 text-xs font-mono text-neutral-200 mb-6">
                <li className="flex items-center gap-2">
                  <Zap className="w-3.5 h-3.5 text-[#FF003C]" />
                  <strong>Unlimited Batch Conversions</strong>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span>OCR for Complex Handwritten Notes</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Direct Google Drive API Integration</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span>High-Priority Multimodal Processing Queue</span>
                </li>
              </ul>
            </div>

            <CyberButton
              variant="primary"
              size="md"
              onClick={handleUpgrade}
              glow
              className="w-full"
            >
              {subscription.hasProLicense ? 'PRO ACTIVE' : 'UPGRADE TO PRO ($4.99)'}
            </CyberButton>
          </div>
        </div>
      </div>
    </CyberModal>
  );
};
