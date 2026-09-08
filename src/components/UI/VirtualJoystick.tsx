import React, { useRef, useEffect, useState } from 'react';
import { useInputStore } from '../../store/useInputStore.ts';
import { cyberAudio } from '../../utils/audioSynth.ts';

// ===== START NEW CODE: VIRTUAL JOYSTICK MOBILE TOUCH NODE =====
export const VirtualJoystick: React.FC = () => {
  const { config, setJoystickVector } = useInputStore();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [knobPos, setKnobPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isActive, setIsActive] = useState(false);

  const radius = 45;

  // Show if mobile mode or touch supported
  const shouldRender = config.device === 'mobile' && config.virtualJoystickEnabled;

  useEffect(() => {
    if (!shouldRender) return;

    const handleTouchMove = (e: TouchEvent) => {
      if (!isActive || !containerRef.current) return;
      const touch = e.targetTouches[0];
      const rect = containerRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      const dx = touch.clientX - centerX;
      const dy = touch.clientY - centerY;
      const distance = Math.hypot(dx, dy);

      const clampedDistance = Math.min(distance, radius);
      const angle = Math.atan2(dy, dx);
      const knobX = Math.cos(angle) * clampedDistance;
      const knobY = Math.sin(angle) * clampedDistance;

      setKnobPos({ x: knobX, y: knobY });

      const normX = knobX / radius;
      const normY = knobY / radius;
      setJoystickVector({ x: normX, y: normY });

      // Pan scroll document if active
      const docScroller = document.getElementById('google-doc-scroll-viewport');
      if (docScroller) {
        docScroller.scrollTop += normY * 12;
        docScroller.scrollLeft += normX * 12;
      }
    };

    const handleTouchEnd = () => {
      setIsActive(false);
      setKnobPos({ x: 0, y: 0 });
      setJoystickVector({ x: 0, y: 0 });
    };

    window.addEventListener('touchmove', handleTouchMove, { passive: false });
    window.addEventListener('touchend', handleTouchEnd);
    window.addEventListener('touchcancel', handleTouchEnd);

    return () => {
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
      window.removeEventListener('touchcancel', handleTouchEnd);
    };
  }, [isActive, radius, setJoystickVector, shouldRender]);

  if (!shouldRender) return null;

  return (
    <div
      ref={containerRef}
      id="mobile-virtual-joystick"
      onTouchStart={(e) => {
        setIsActive(true);
        cyberAudio.playJoystickPulse();
      }}
      style={{ opacity: config.virtualJoystickOpacity }}
      className="fixed bottom-6 left-6 z-50 w-28 h-28 rounded-full border border-[#E056FD]/60 bg-black/60 backdrop-blur-md flex items-center justify-center select-none touch-none shadow-[0_0_20px_rgba(224,86,253,0.3)]"
    >
      {/* Target Crosshair */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-40">
        <div className="w-full h-px bg-[#E056FD]" />
        <div className="h-full w-px bg-[#E056FD] absolute" />
      </div>

      {/* Center Knob */}
      <div
        style={{
          transform: `translate(${knobPos.x}px, ${knobPos.y}px)`,
          transition: isActive ? 'none' : 'transform 0.15s ease-out',
        }}
        className="w-10 h-10 rounded-full bg-[#FF003C] border-2 border-white shadow-[0_0_12px_#FF003C] pointer-events-none"
      />
    </div>
  );
};
// ===== END NEW CODE: VIRTUAL JOYSTICK MOBILE TOUCH NODE =====
