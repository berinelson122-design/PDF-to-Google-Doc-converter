import React from 'react';
import { 
  FileText, 
  Settings, 
  Volume2, 
  VolumeX, 
  Crown, 
  Zap, 
  Sparkles,
  Monitor,
  Smartphone,
  Gamepad2
} from 'lucide-react';
import { useGameStore } from '../../store/useGameStore.ts';
import { useInputStore } from '../../store/useInputStore.ts';
import { CyberButton } from '../common/CyberButton.tsx';
import { CyberBadge } from '../common/CyberBadge.tsx';
import { cyberAudio } from '../../utils/audioSynth.ts';

export const Navbar: React.FC = () => {
  const { 
    openSettings, 
    openPricingModal, 
    subscription, 
    result,
    openExportModal 
  } = useGameStore();

  const { config, toggleSound } = useInputStore();

  const handleSoundToggle = () => {
    toggleSound();
    cyberAudio.playCyberClick();
  };

  return (
    <header className="w-full bg-[#050507] border-b border-neutral-800 px-4 py-3 flex items-center justify-between gap-4 sticky top-0 z-30 select-none">
      {/* Brand Identity */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded bg-black border border-[#FF003C] flex items-center justify-center text-[#FF003C] shadow-[0_0_12px_rgba(255,0,60,0.3)]">
          <FileText className="w-5 h-5" />
        </div>

        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-mono text-xs md:text-sm font-bold text-white tracking-widest uppercase">
              PDF <span className="text-[#FF003C]">➔</span> GOOGLE DOCS
            </h1>
            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-[#FF003C]/10 text-[#FF003C] border border-[#FF003C]/30 font-semibold">
              NEURAL V3
            </span>
          </div>
          <p className="font-mono text-[10px] text-neutral-400 hidden sm:block">
            DIRECT SEMANTIC RECONSTRUCTION // LAYOUT &amp; FONT FIDELITY
          </p>
        </div>
      </div>

      {/* Center Engine Telemetry */}
      <div className="hidden lg:flex items-center gap-3 font-mono text-xs">
        <CyberBadge label="AI: NEURAL ENGINE V3" variant="red" pulse />
        <CyberBadge label="LAYOUT: TABLES &amp; FONTS PRESERVED" variant="purple" />
        <CyberBadge 
          label={`TIER: ${subscription.tier.toUpperCase()} (${subscription.conversionsToday}/${subscription.tier === 'pro' ? '∞' : subscription.dailyFreeLimit})`} 
          variant={subscription.tier === 'pro' ? 'purple' : 'neutral'} 
        />
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-2">
        {/* Device indicator & Quick Switch */}
        <button
          onClick={() => openSettings(true)}
          title="Hardware Calibrator"
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded border border-neutral-800 bg-neutral-950 text-neutral-400 hover:text-white hover:border-neutral-700 text-xs font-mono transition-colors"
        >
          {config.device === 'pc' && <Monitor className="w-3.5 h-3.5 text-[#FF003C]" />}
          {config.device === 'mobile' && <Smartphone className="w-3.5 h-3.5 text-[#E056FD]" />}
          {config.device === 'console' && <Gamepad2 className="w-3.5 h-3.5 text-emerald-400" />}
          <span className="uppercase text-[11px] font-bold">{config.device}</span>
        </button>

        {/* Audio Toggle */}
        <button
          onClick={handleSoundToggle}
          title={config.soundEnabled ? 'Mute Procedural Audio' : 'Unmute Procedural Audio'}
          className="p-1.5 rounded border border-neutral-800 bg-neutral-950 text-neutral-400 hover:text-white hover:border-neutral-700 transition-colors"
        >
          {config.soundEnabled ? (
            <Volume2 className="w-4 h-4 text-[#FF003C]" />
          ) : (
            <VolumeX className="w-4 h-4 text-neutral-600" />
          )}
        </button>

        {/* Settings button */}
        <button
          onClick={() => {
            cyberAudio.playCyberClick();
            openSettings(true);
          }}
          title="Hardware Control Settings"
          className="p-1.5 rounded border border-neutral-800 bg-neutral-950 text-neutral-400 hover:text-white hover:border-neutral-700 transition-colors"
        >
          <Settings className="w-4 h-4" />
        </button>

        {/* Pro Tier Button */}
        <CyberButton
          variant={subscription.tier === 'pro' ? 'secondary' : 'primary'}
          size="sm"
          onClick={() => {
            cyberAudio.playCyberClick();
            openPricingModal(true);
          }}
          icon={<Crown className="w-3.5 h-3.5" />}
        >
          {subscription.tier === 'pro' ? 'PRO ACTIVE' : 'UPGRADE'}
        </CyberButton>

        {/* Quick Export Button if result ready */}
        {result && (
          <CyberButton
            variant="primary"
            size="sm"
            onClick={() => {
              cyberAudio.playButtonAction();
              openExportModal(true);
            }}
            glow
          >
            EXPORT
          </CyberButton>
        )}
      </div>
    </header>
  );
};
