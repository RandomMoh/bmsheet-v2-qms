import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import DevCursorTrail from './DevCursorTrail';

/**
 * CursorTrail - Premium, Hardware-Accelerated, Theme-Dynamic Cursor Trail Component
 * Features:
 * - Automatically renders DevCursorTrail on /dev terminal route
 * - Fluid lerped spring physics with trailing ribbon points on standard pages
 * - Theme-reactive (observes dark/light class changes on html element)
 * - Click particle explosion ripple
 * - Magnetic hover expansion on interactive elements (buttons, inputs, links)
 * - Auto-disables on touch devices & reduced-motion settings
 */
export default function CursorTrail() {
  const location = useLocation();
  const isDevPage = location && location.pathname && location.pathname.includes('/dev');

  if (isDevPage) {
    return <DevCursorTrail />;
  }

  const canvasRef = useRef(null);

  useEffect(() => {
    // 1. Accessibility & Touch Guardrails
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

    // Mouse coordinates & lerped pointer position
    const mouse = { x: width / 2, y: height / 2, active: false, hovering: false };
    const pos = { x: width / 2, y: height / 2 };

    // History trail for smooth ribbon
    const TRAIL_SIZE = 16;
    const history = Array.from({ length: TRAIL_SIZE }, () => ({ x: width / 2, y: height / 2 }));

    // Click particle bursts
    let particles = [];

    // Theme color cache
    let primaryColor = { r: 16, g: 185, b: 129 }; // Emerald fallback
    let glowColor = 'rgba(16, 185, 129, 0.2)';

    // Hex/RGB parsing utility
    const parseColor = (str) => {
      if (!str) return { r: 16, g: 185, b: 129 };
      str = str.trim();
      if (str.startsWith('#')) {
        let hex = str.slice(1);
        if (hex.length === 3) hex = hex.split('').map(c => c + c).join('');
        const num = parseInt(hex, 16);
        return { r: (num >> 16) & 255, g: (num >> 8) & 255, b: num & 255 };
      }
      const match = str.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
      if (match) {
        return { r: parseInt(match[1]), g: parseInt(match[2]), b: parseInt(match[3]) };
      }
      return { r: 16, g: 185, b: 129 };
    };

    // Update colors from current CSS variables
    const updateThemeColors = () => {
      const computed = getComputedStyle(document.documentElement);
      const accentStr = computed.getPropertyValue('--accent-primary').trim() || '#10b981';
      primaryColor = parseColor(accentStr);
      glowColor = `rgba(${primaryColor.r}, ${primaryColor.g}, ${primaryColor.b}, 0.25)`;
    };

    updateThemeColors();

    // Listen to theme mutations on <html> element
    const observer = new MutationObserver(() => {
      updateThemeColors();
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class', 'data-theme'] });

    // Handle Window Resize
    const handleResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize, { passive: true });

    // Handle Mouse Move
    const handleMouseMove = (e) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
      mouse.active = true;

      // Check if hovering interactive element
      const target = e.target;
      if (target && target.closest) {
        const isInteractive = target.closest('button, a, input, select, textarea, .btn, .note-chip, .clickable, [role="button"]');
        mouse.hovering = !!isInteractive;
      }
    };

    // Handle Mouse Leave
    const handleMouseLeave = () => {
      mouse.active = false;
    };

    // Handle Mouse Click Burst
    const handleMouseDown = (e) => {
      const count = 10;
      for (let i = 0; i < count; i++) {
        const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.5;
        const speed = 2 + Math.random() * 3.5;
        particles.push({
          x: e.clientX,
          y: e.clientY,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          size: 3 + Math.random() * 3,
          alpha: 1,
          decay: 0.03 + Math.random() * 0.02,
        });
      }
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    document.addEventListener('mouseleave', handleMouseLeave, { passive: true });
    window.addEventListener('mousedown', handleMouseDown, { passive: true });

    // Render Loop
    let lastTime = performance.now();

    const render = (time) => {
      animationFrameId = requestAnimationFrame(render);

      ctx.clearRect(0, 0, width, height);
      if (!mouse.active && history.length === 0 && particles.length === 0) return;

      // Smooth Lerp Position
      const lerpSpeed = mouse.hovering ? 0.22 : 0.16;
      pos.x += (mouse.x - pos.x) * lerpSpeed;
      pos.y += (mouse.y - pos.y) * lerpSpeed;

      // Update History Array
      history.unshift({ x: pos.x, y: pos.y });
      if (history.length > TRAIL_SIZE) {
        history.pop();
      }

      // Draw Ribbon Trail
      if (history.length > 1) {
        ctx.beginPath();
        ctx.moveTo(history[0].x, history[0].y);

        for (let i = 1; i < history.length - 1; i++) {
          const xc = (history[i].x + history[i + 1].x) / 2;
          const yc = (history[i].y + history[i + 1].y) / 2;
          ctx.quadraticCurveTo(history[i].x, history[i].y, xc, yc);
        }

        const baseWidth = mouse.hovering ? 12 : 7;
        ctx.lineWidth = baseWidth;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        // Gradient Stroke along the trail
        const gradient = ctx.createLinearGradient(
          history[0].x,
          history[0].y,
          history[history.length - 1].x,
          history[history.length - 1].y
        );
        gradient.addColorStop(0, `rgba(${primaryColor.r}, ${primaryColor.g}, ${primaryColor.b}, 0.75)`);
        gradient.addColorStop(0.5, `rgba(${primaryColor.r}, ${primaryColor.g}, ${primaryColor.b}, 0.35)`);
        gradient.addColorStop(1, `rgba(${primaryColor.r}, ${primaryColor.g}, ${primaryColor.b}, 0)`);

        ctx.strokeStyle = gradient;
        ctx.shadowColor = `rgba(${primaryColor.r}, ${primaryColor.g}, ${primaryColor.b}, 0.5)`;
        ctx.shadowBlur = mouse.hovering ? 16 : 8;
        ctx.stroke();
        ctx.shadowBlur = 0; // Reset shadow for clean rendering
      }

      // Draw Leading Glowing Cursor Dot
      if (mouse.active) {
        const dotRadius = mouse.hovering ? 8 : 4.5;
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, dotRadius, 0, Math.PI * 2);
        ctx.fillStyle = `rgb(${primaryColor.r}, ${primaryColor.g}, ${primaryColor.b})`;
        ctx.shadowColor = `rgba(${primaryColor.r}, ${primaryColor.g}, ${primaryColor.b}, 0.8)`;
        ctx.shadowBlur = mouse.hovering ? 18 : 10;
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      // Render & Update Click Burst Particles
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vx *= 0.95;
        p.vy *= 0.95;
        p.alpha -= p.decay;

        if (p.alpha <= 0) {
          particles.splice(i, 1);
          continue;
        }

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * p.alpha, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${primaryColor.r}, ${primaryColor.g}, ${primaryColor.b}, ${p.alpha})`;
        ctx.shadowColor = glowColor;
        ctx.shadowBlur = 6;
        ctx.fill();
        ctx.shadowBlur = 0;
      }
    };

    animationFrameId = requestAnimationFrame(render);

    // Cleanup listeners & RAF loop
    return () => {
      cancelAnimationFrame(animationFrameId);
      observer.disconnect();
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
