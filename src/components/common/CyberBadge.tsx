import React from 'react';

export interface CyberBadgeProps {
  label: string;
  variant?: 'red' | 'purple' | 'green' | 'neutral';
  icon?: React.ReactNode;
  pulse?: boolean;
}

export const CyberBadge: React.FC<CyberBadgeProps> = ({
  label,
  variant = 'neutral',
  icon,
  pulse = false,
}) => {
  const variantStyles = {
    red: 'bg-[#FF003C]/10 text-[#FF003C] border-[#FF003C]/40',
    purple: 'bg-[#E056FD]/10 text-[#E056FD] border-[#E056FD]/40',
    green: 'bg-emerald-950/40 text-emerald-400 border-emerald-500/40',
    neutral: 'bg-neutral-900 text-neutral-300 border-neutral-700',
  }[variant];

  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 text-[11px] font-mono border rounded-sm ${variantStyles}`}>
      {pulse && (
        <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${
          variant === 'red' ? 'bg-[#FF003C]' : variant === 'purple' ? 'bg-[#E056FD]' : 'bg-emerald-400'
        }`} />
      )}
      {icon && <span className="shrink-0">{icon}</span>}
      <span className="tracking-wider">{label}</span>
    </span>
  );
};
