import { useEffect, useRef, useState } from 'react';

export default function CursorTrail() {
  const dotRef = useRef(null);
  const ringRef = useRef(null);
  const pos = useRef({ x: -100, y: -100 });
  const target = useRef({ x: -100, y: -100 });
  const [hovered, setHovered] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [clicking, setClicking] = useState(false);

  useEffect(() => {
    // Hide on touch devices
    if ('ontouchstart' in window) return;

    const onMove = (e) => {
      target.current = { x: e.clientX, y: e.clientY };
      setHidden(false);
    };

    const onEnter = () => setHidden(false);
    const onLeave = () => setHidden(true);
    const onDown = () => setClicking(true);
    const onUp = () => setClicking(false);

    // Detect hoverable elements
    const CLICKABLE = 'a, button, input, select, textarea, [role="button"], label, [onclick], .btn, .sb-link, .tbl tr, .metric, .pill, .course-card';

    const onOver = (e) => {
      if (e.target.closest(CLICKABLE)) setHovered(true);
    };
    const onOut = (e) => {
      if (e.target.closest(CLICKABLE)) setHovered(false);
    };

    window.addEventListener('mousemove', onMove);
    document.addEventListener('mouseenter', onEnter);
    document.addEventListener('mouseleave', onLeave);
    document.addEventListener('mousedown', onDown);
    document.addEventListener('mouseup', onUp);
    document.addEventListener('mouseover', onOver);
    document.addEventListener('mouseout', onOut);

    // Smooth animation loop
    let raf;
    const lerp = (a, b, n) => a + (b - a) * n;

    const animate = () => {
      pos.current.x = lerp(pos.current.x, target.current.x, 0.25);
      pos.current.y = lerp(pos.current.y, target.current.y, 0.25);

      if (dotRef.current) {
        dotRef.current.style.transform = `translate(${target.current.x}px, ${target.current.y}px) translate(-50%, -50%)`;
      }
      if (ringRef.current) {
        ringRef.current.style.transform = `translate(${pos.current.x}px, ${pos.current.y}px) translate(-50%, -50%) scale(${hovered ? 1.8 : clicking ? 0.75 : 1})`;
      }

      raf = requestAnimationFrame(animate);
    };
    animate();

    // Hide default cursor globally
    document.body.style.cursor = 'none';
    const style = document.createElement('style');
    style.id = 'cursor-hide';
    style.textContent = '*, *::before, *::after { cursor: none !important; }';
    document.head.appendChild(style);

    return () => {
      window.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseenter', onEnter);
      document.removeEventListener('mouseleave', onLeave);
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('mouseup', onUp);
      document.removeEventListener('mouseover', onOver);
      document.removeEventListener('mouseout', onOut);
      cancelAnimationFrame(raf);
      document.body.style.cursor = '';
      document.getElementById('cursor-hide')?.remove();
    };
  }, [hovered, clicking]);

  // Don't render on touch
  if (typeof window !== 'undefined' && 'ontouchstart' in window) return null;

  return (
    <>
      {/* Inner dot — snaps to cursor instantly */}
      <div
        ref={dotRef}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: 10,
          height: 10,
          borderRadius: '50%',
          background: 'var(--accent-primary, #2dd4bf)',
          pointerEvents: 'none',
          zIndex: 999999,
          opacity: hidden ? 0 : 1,
          transition: 'opacity 0.2s, width 0.25s, height 0.25s, background 0.25s',
          willChange: 'transform',
        }}
      />
      {/* Outer ring — follows with smooth lag */}
      <div
        ref={ringRef}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: 28,
          height: 28,
          borderRadius: '50%',
          border: `1.5px solid ${hovered ? 'var(--accent-primary, #2dd4bf)' : 'rgba(255,255,255,0.35)'}`,
          background: hovered ? 'rgba(45, 212, 191, 0.08)' : 'transparent',
          pointerEvents: 'none',
          zIndex: 999998,
          opacity: hidden ? 0 : 0.7,
          transition: 'opacity 0.2s, border 0.3s, background 0.3s, width 0.3s ease, height 0.3s ease',
          willChange: 'transform',
        }}
      />
    </>
  );
}
