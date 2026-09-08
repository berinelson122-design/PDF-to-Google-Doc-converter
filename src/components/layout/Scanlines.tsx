import React, { useEffect, useRef } from 'react';

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
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', resize);
    resize();

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Procedural sweep line
      scanY = (scanY + 1.2) % canvas.height;
      const gradient = ctx.createLinearGradient(0, scanY - 30, 0, scanY);
      gradient.addColorStop(0, 'rgba(255, 0, 60, 0)');
      gradient.addColorStop(1, 'rgba(255, 0, 60, 0.04)');

      ctx.fillStyle = gradient;
      ctx.fillRect(0, scanY - 30, canvas.width, 30);

      // Fine scanline beam
      ctx.fillStyle = 'rgba(224, 86, 253, 0.08)';
      ctx.fillRect(0, scanY, canvas.width, 1);

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
