import React, { useEffect, useRef } from 'react';

// ===== START NEW CODE: HARDENED SCANLINE CANVAS SYSTEM =====
export const Scanlines: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let scanY = 0;

    const resize = () => {
      const w = window.innerWidth || document.documentElement?.clientWidth || 1920;
      const h = window.innerHeight || document.documentElement?.clientHeight || 1080;
      canvas.width = Math.max(1, w);
      canvas.height = Math.max(1, h);
    };

    window.addEventListener('resize', resize);
    resize();

    const render = () => {
      try {
        const width = canvas.width > 0 ? canvas.width : (window.innerWidth || 1920);
        const height = canvas.height > 0 ? canvas.height : (window.innerHeight || 1080);

        if (width <= 0 || height <= 0 || !Number.isFinite(width) || !Number.isFinite(height)) {
          animationFrameId = requestAnimationFrame(render);
          return;
        }

        ctx.clearRect(0, 0, width, height);

        // Procedural sweep line with strict numerical sanitization
        if (!Number.isFinite(scanY) || scanY < 0) {
          scanY = 0;
        }
        scanY = (scanY + 1.2) % height;
        if (!Number.isFinite(scanY)) {
          scanY = 0;
        }

        const yTop = Math.max(0, scanY - 30);
        const yBottom = Math.max(yTop + 0.1, scanY);

        if (Number.isFinite(yTop) && Number.isFinite(yBottom) && yBottom > yTop) {
          const gradient = ctx.createLinearGradient(0, yTop, 0, yBottom);
          gradient.addColorStop(0, 'rgba(255, 0, 60, 0)');
          gradient.addColorStop(1, 'rgba(255, 0, 60, 0.04)');

          ctx.fillStyle = gradient;
          ctx.fillRect(0, yTop, width, Math.max(1, yBottom - yTop));
        }

        // Fine scanline beam
        if (Number.isFinite(scanY)) {
          ctx.fillStyle = 'rgba(224, 86, 253, 0.08)';
          ctx.fillRect(0, scanY, width, 1);
        }
      } catch {
        // Defensive suppression for headless/iframe contexts
      }

      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <>
      <canvas
        ref={canvasRef}
        id="cyber-scanline-canvas"
        className="fixed inset-0 pointer-events-none z-40 opacity-70"
      />
      <div className="scanlines-overlay fixed inset-0 pointer-events-none z-30" />
    </>
  );
};
// ===== END NEW CODE: HARDENED SCANLINE CANVAS SYSTEM =====
