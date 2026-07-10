import { useEffect, useRef } from 'react';

export default function CursorTrail() {
  const dotRef = useRef(null);
  const ringRef = useRef(null);
  
  // Physics state
  const target = useRef({ x: -100, y: -100 });
  const pos = useRef({ x: -100, y: -100 }); // Ring position
  const dotPos = useRef({ x: -100, y: -100 }); // Dot position
  
  // Interaction state
  const isHovered = useRef(false);
  const isClicking = useRef(false);
  const isHidden = useRef(false);

  useEffect(() => {
    if (typeof window === 'undefined' || 'ontouchstart' in window) return;

    const onMove = (e) => {
      target.current = { x: e.clientX, y: e.clientY };
      isHidden.current = false;
    };

    const onEnter = () => { isHidden.current = false; };
    const onLeave = () => { isHidden.current = true; };
    const onDown = () => { isClicking.current = true; };
    const onUp = () => { isClicking.current = false; };

    const CLICKABLE = 'a, button, input, select, textarea, [role="button"], label, [onclick], .btn, .sb-link, .tbl tr, .metric, .pill, .course-card';

    const onOver = (e) => {
      if (e.target.closest(CLICKABLE)) isHovered.current = true;
    };
    const onOut = (e) => {
      if (e.target.closest(CLICKABLE)) isHovered.current = false;
    };

    window.addEventListener('mousemove', onMove, { passive: true });
    document.addEventListener('mouseenter', onEnter, { passive: true });
    document.addEventListener('mouseleave', onLeave, { passive: true });
    document.addEventListener('mousedown', onDown, { passive: true });
    document.addEventListener('mouseup', onUp, { passive: true });
    document.addEventListener('mouseover', onOver, { passive: true });
    document.addEventListener('mouseout', onOut, { passive: true });

    // Hide default cursor globally
    document.body.style.cursor = 'none';
    const style = document.createElement('style');
    style.id = 'cursor-hide';
    style.textContent = '*, *::before, *::after { cursor: none !important; }';
    document.head.appendChild(style);

    let raf;
    const lerp = (a, b, n) => a + (b - a) * n;

    const animate = () => {
      // Responsive but slightly heavy physics
      // Dot is very fast but has a tiny bit of weight
      dotPos.current.x = lerp(dotPos.current.x, target.current.x, 0.6);
      dotPos.current.y = lerp(dotPos.current.y, target.current.y, 0.6);
      
      // Ring is heavier and trails behind smoothly
      pos.current.x = lerp(pos.current.x, target.current.x, 0.15);
      pos.current.y = lerp(pos.current.y, target.current.y, 0.15);

      if (dotRef.current) {
        dotRef.current.style.transform = `translate(${dotPos.current.x}px, ${dotPos.current.y}px) translate(-50%, -50%)`;
        dotRef.current.style.opacity = isHidden.current ? '0' : '1';
      }
      
      if (ringRef.current) {
        const scale = isHovered.current ? 1.8 : (isClicking.current ? 0.75 : 1);
        ringRef.current.style.transform = `translate(${pos.current.x}px, ${pos.current.y}px) translate(-50%, -50%) scale(${scale})`;
        ringRef.current.style.opacity = isHidden.current ? '0' : '0.7';
        
        // Direct style mutations for hover effects
        if (isHovered.current) {
          ringRef.current.style.background = 'rgba(45, 212, 191, 0.08)';
          ringRef.current.style.borderColor = 'var(--accent-primary, #2dd4bf)';
        } else {
          ringRef.current.style.background = 'transparent';
          ringRef.current.style.borderColor = 'rgba(255,255,255,0.35)';
        }
      }

      raf = requestAnimationFrame(animate);
    };
    
    animate();

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
  }, []);

  if (typeof window !== 'undefined' && 'ontouchstart' in window) return null;

  return (
    <>
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
          willChange: 'transform',
        }}
      />
      <div
        ref={ringRef}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: 28,
          height: 28,
          borderRadius: '50%',
          border: '1.5px solid rgba(255,255,255,0.35)',
          background: 'transparent',
          pointerEvents: 'none',
          zIndex: 999998,
          transition: 'width 0.3s ease, height 0.3s ease',
          willChange: 'transform, opacity',
        }}
      />
    </>
  );
}
