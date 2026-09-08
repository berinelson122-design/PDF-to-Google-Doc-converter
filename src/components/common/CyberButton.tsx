import React from 'react';
import { cyberAudio } from '../../utils/audioSynth.ts';
import { useInputStore } from '../../store/useInputStore.ts';

export interface CyberButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
  glow?: boolean;
}

export const CyberButton: React.FC<CyberButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  icon,
  glow = false,
  className = '',
  onClick,
  disabled,
  ...props
}) => {
  const { config } = useInputStore();

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (disabled) return;
    if (config.soundEnabled) {
      if (variant === 'primary') {
        cyberAudio.playButtonAction();
      } else {
        cyberAudio.playCyberClick();
      }
    }
    if (config.hapticFeedback && typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(15);
    }
    onClick?.(e);
  };

  const baseStyles = 'inline-flex items-center justify-center font-mono font-medium uppercase tracking-wider transition-all duration-150 select-none cursor-pointer disabled:cursor-not-allowed disabled:opacity-40';

  const sizeStyles = {
    sm: 'text-xs px-2.5 py-1.5 gap-1.5',
    md: 'text-xs px-4 py-2 gap-2',
    lg: 'text-sm px-6 py-3 gap-2.5 font-bold',
  }[size];

  const variantStyles = {
    primary: 'bg-[#FF003C] hover:bg-[#ff1f54] text-white border border-[#FF003C] shadow-[0_0_10px_rgba(255,0,60,0.3)]',
    secondary: 'bg-[#18181b] hover:bg-[#27272a] text-[#E056FD] border border-[#E056FD]/50 shadow-[0_0_8px_rgba(224,86,253,0.2)]',
    outline: 'bg-transparent hover:bg-white/5 text-gray-200 border border-neutral-700 hover:border-[#FF003C]',
    ghost: 'bg-transparent hover:bg-neutral-900 text-neutral-400 hover:text-white',
  }[variant];

  const glowStyle = glow ? 'glow-cyber-red' : '';

  return (
    <button
      className={`${baseStyles} ${sizeStyles} ${variantStyles} ${glowStyle} ${className}`}
      onClick={handleClick}
      disabled={disabled}
      {...props}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      <span className="whitespace-nowrap">{children}</span>
    </button>
  );
};
