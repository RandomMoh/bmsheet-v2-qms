import { useEffect, useRef } from 'react';

/**
 * DevCursorTrail - Cyberpunk Industrial Crosshair & Data Burst Cursor Trail
 * Tailored specifically for the /dev Terminal Environment.
 * Features:
 * - Glowing Crimson Cyber Reticle & Lerped Particle Stream
 * - Hex/Binary Data Burst on Clicks & Terminal Interactions
 * - Dynamic Crosshair Expansion on Hovering Terminal Controls
 * - CRT Scanline Matrix Atmosphere
 */
export default function DevCursorTrail() {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const isTouch = window.matchMedia('(hover: none) and (pointer: coarse)').matches;
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (isTouch || prefersReducedMotion) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const mouse = { x: width / 2, y: height / 2, active: false, hovering: false };
    const pos = { x: width / 2, y: height / 2 };
    let crosshairAngle = 0;

    const TRAIL_SIZE = 14;
    const history = Array.from({ length: TRAIL_SIZE }, () => ({ x: width / 2, y: height / 2 }));

    // Data Spark & Hex Code Particles
    let dataParticles = [];
    const HEX_CHARS = ['0', '1', '0x', 'FF', '>>', 'OK', 'ERR', 'DB', 'SYS'];

    const handleResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize, { passive: true });

    const handleMouseMove = (e) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
      mouse.active = true;

      const target = e.target;
      if (target && target.closest) {
        const isInteractive = target.closest('button, input, textarea, a, label, .brutalist-btn, [role="button"]');
        mouse.hovering = !!isInteractive;
      }
    };

    const handleMouseLeave = () => {
      mouse.active = false;
    };

    const handleMouseDown = (e) => {
      // Spawn Cyber Data Burst
      const particleCount = 12;
      for (let i = 0; i < particleCount; i++) {
        const angle = (Math.PI * 2 * i) / particleCount + (Math.random() - 0.5) * 0.4;
        const speed = 2.5 + Math.random() * 4;
        const char = HEX_CHARS[Math.floor(Math.random() * HEX_CHARS.length)];

        dataParticles.push({
          x: e.clientX,
          y: e.clientY,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          char: char,
          size: 9 + Math.random() * 4,
          alpha: 1,
          decay: 0.035 + Math.random() * 0.02,
          color: Math.random() > 0.3 ? '#FF2A2A' : '#10B981', // Crimson or Matrix Green
        });
      }
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    document.addEventListener('mouseleave', handleMouseLeave, { passive: true });
    window.addEventListener('mousedown', handleMouseDown, { passive: true });

    // Render Loop
    const render = () => {
      animationFrameId = requestAnimationFrame(render);
      ctx.clearRect(0, 0, width, height);

      if (!mouse.active && history.length === 0 && dataParticles.length === 0) return;

      // Lerp Position
      const lerpSpeed = mouse.hovering ? 0.28 : 0.20;
      pos.x += (mouse.x - pos.x) * lerpSpeed;
      pos.y += (mouse.y - pos.y) * lerpSpeed;

      // Update History
      history.unshift({ x: pos.x, y: pos.y });
      if (history.length > TRAIL_SIZE) {
        history.pop();
      }

      // 1. Draw Cyber Crimson Ribbon Trail
      if (history.length > 1) {
        ctx.beginPath();
        ctx.moveTo(history[0].x, history[0].y);

        for (let i = 1; i < history.length - 1; i++) {
          const xc = (history[i].x + history[i + 1].x) / 2;
          const yc = (history[i].y + history[i + 1].y) / 2;
          ctx.quadraticCurveTo(history[i].x, history[i].y, xc, yc);
        }

        ctx.lineWidth = mouse.hovering ? 6 : 3.5;
        ctx.lineCap = 'square';
        ctx.lineJoin = 'miter';

        const gradient = ctx.createLinearGradient(
          history[0].x,
          history[0].y,
          history[history.length - 1].x,
          history[history.length - 1].y
        );
        gradient.addColorStop(0, 'rgba(255, 42, 42, 0.9)');
        gradient.addColorStop(0.5, 'rgba(255, 42, 42, 0.4)');
        gradient.addColorStop(1, 'rgba(255, 42, 42, 0)');

        ctx.strokeStyle = gradient;
        ctx.shadowColor = '#FF2A2A';
        ctx.shadowBlur = mouse.hovering ? 14 : 8;
        ctx.stroke();
        ctx.shadowBlur = 0;
      }

      // 2. Draw Reticle & HUD Target Box
      if (mouse.active) {
        crosshairAngle += mouse.hovering ? 0.05 : 0.02;
        const boxSize = mouse.hovering ? 18 : 10;

        ctx.save();
        ctx.translate(pos.x, pos.y);
        ctx.rotate(crosshairAngle);

        // Corner ticks
        ctx.strokeStyle = '#FF2A2A';
        ctx.lineWidth = 1.5;
        ctx.shadowColor = '#FF2A2A';
        ctx.shadowBlur = 10;

        // Draw HUD Corner Brackets
        const bracket = boxSize / 2;
        const len = 4;

        // Top-Left
        ctx.beginPath();
        ctx.moveTo(-bracket, -bracket + len);
        ctx.lineTo(-bracket, -bracket);
        ctx.lineTo(-bracket + len, -bracket);
        ctx.stroke();

        // Top-Right
        ctx.beginPath();
        ctx.moveTo(bracket - len, -bracket);
        ctx.lineTo(bracket, -bracket);
        ctx.lineTo(bracket, -bracket + len);
        ctx.stroke();

        // Bottom-Right
        ctx.beginPath();
        ctx.moveTo(bracket, bracket - len);
        ctx.lineTo(bracket, bracket);
        ctx.lineTo(bracket - len, bracket);
        ctx.stroke();

        // Bottom-Left
        ctx.beginPath();
        ctx.moveTo(-bracket + len, bracket);
        ctx.lineTo(-bracket, bracket);
        ctx.lineTo(-bracket, bracket - len);
        ctx.stroke();

        ctx.restore();

        // Center Crimson Dot
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, mouse.hovering ? 4 : 2.5, 0, Math.PI * 2);
        ctx.fillStyle = '#FF2A2A';
        ctx.shadowColor = '#FF2A2A';
        ctx.shadowBlur = 12;
        ctx.fill();
        ctx.shadowBlur = 0;

        // HUD Monospaced Coordinate Text
        if (mouse.hovering) {
          ctx.font = '9px "JetBrains Mono", monospace';
          ctx.fillStyle = 'rgba(255, 42, 42, 0.85)';
          ctx.fillText(`SYS::${Math.round(pos.x)},${Math.round(pos.y)}`, pos.x + 14, pos.y + 14);
        }
      }

      // 3. Render & Update Hex Data Burst Particles
      for (let i = dataParticles.length - 1; i >= 0; i--) {
        const p = dataParticles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vx *= 0.92;
        p.vy *= 0.92;
        p.alpha -= p.decay;

        if (p.alpha <= 0) {
          dataParticles.splice(i, 1);
          continue;
        }

        ctx.save();
        ctx.font = `700 ${p.size}px "JetBrains Mono", monospace`;
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.alpha;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 8;
        ctx.fillText(p.char, p.x, p.y);
        ctx.restore();
      }
    };

    animationFrameId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseleave', handleMouseLeave);
      window.removeEventListener('mousedown', handleMouseDown);
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
        zIndex: 99999,
      }}
    />
  );
}
