import { useEffect, useRef } from 'react';

/**
 * PixelPakFlagsOverlay - Drifting Pixelated Pakistani Flags Floating Overlay (Meme)
 */
export default function PixelPakFlagsOverlay() {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId;
    let w = (canvas.width = window.innerWidth);
    let h = (canvas.height = window.innerHeight);

    const handleResize = () => {
      w = canvas.width = window.innerWidth;
      h = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize, { passive: true });

    // Pre-render pixelated Pakistani flag onto offscreen canvas for max performance
    const flagW = 44;
    const flagH = 28;
    const offscreen = document.createElement('canvas');
    offscreen.width = flagW;
    offscreen.height = flagH;
    const octx = offscreen.getContext('2d');

    // Draw Flag
    // Green field
    octx.fillStyle = '#01411C';
    octx.fillRect(0, 0, flagW, flagH);

    // White stripe
    octx.fillStyle = '#FFFFFF';
    octx.fillRect(0, 0, 11, flagH);

    // Crescent
    octx.fillStyle = '#FFFFFF';
    octx.beginPath();
    octx.arc(26, 14, 8.5, 0, Math.PI * 2);
    octx.fill();
    octx.fillStyle = '#01411C';
    octx.beginPath();
    octx.arc(28.5, 12, 7.5, 0, Math.PI * 2);
    octx.fill();

    // 5-Point Star
    octx.fillStyle = '#FFFFFF';
    const drawStar = (cx, cy, spikes, outerRadius, innerRadius) => {
      let rot = (Math.PI / 2) * 3;
      let x = cx;
      let y = cy;
      let step = Math.PI / spikes;

      octx.beginPath();
      octx.moveTo(cx, cy - outerRadius);
      for (let i = 0; i < spikes; i++) {
        x = cx + Math.cos(rot) * outerRadius;
        y = cy + Math.sin(rot) * outerRadius;
        octx.lineTo(x, y);
        rot += step;

        x = cx + Math.cos(rot) * innerRadius;
        y = cy + Math.sin(rot) * innerRadius;
        octx.lineTo(x, y);
        rot += step;
      }
      octx.lineTo(cx, cy - outerRadius);
      octx.closePath();
      octx.fill();
    };
    drawStar(30, 9.5, 5, 3.5, 1.8);

    // Create 10 floating flag particles
    const flags = Array.from({ length: 10 }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      vy: -(0.5 + Math.random() * 0.7),
      vx: (Math.random() - 0.5) * 0.4,
      scale: 0.85 + Math.random() * 0.5,
      rot: (Math.random() - 0.5) * 0.3,
      vRot: (Math.random() - 0.5) * 0.006,
      opacity: 0.7 + Math.random() * 0.25,
      wobble: Math.random() * Math.PI * 2,
      wobbleSpeed: 0.02 + Math.random() * 0.02,
    }));

    const render = () => {
      animId = requestAnimationFrame(render);
      ctx.clearRect(0, 0, w, h);

      for (let f of flags) {
        f.y += f.vy;
        f.wobble += f.wobbleSpeed;
        f.x += f.vx + Math.sin(f.wobble) * 0.6;
        f.rot += f.vRot;

        // Wrap around top
        if (f.y < -60) {
          f.y = h + 60;
          f.x = Math.random() * w;
        }

        ctx.save();
        ctx.translate(f.x, f.y);
        ctx.rotate(f.rot);
        ctx.scale(f.scale, f.scale);
        ctx.globalAlpha = f.opacity;
        ctx.imageSmoothingEnabled = false; // Pixelated aesthetic

        // Subtle drop shadow & border outline
        ctx.shadowColor = 'rgba(0,0,0,0.4)';
        ctx.shadowBlur = 6;

        ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.lineWidth = 1;
        ctx.strokeRect(-flagW / 2 - 1, -flagH / 2 - 1, flagW + 2, flagH + 2);

        ctx.drawImage(offscreen, -flagW / 2, -flagH / 2);
        ctx.restore();
      }
    };

    animId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        pointerEvents: 'none',
        zIndex: 99998,
      }}
    />
  );
}
