# Floating Pixelated Pakistani Flags Meme Overlay Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build and integrate a lightweight, high-performance pixelated Pakistani flag particle overlay component (`PixelPakFlagsOverlay.jsx`) that floats across all QMS pages.

**Architecture:** Create `src/PixelPakFlagsOverlay.jsx` with an HTML5 Canvas loop rendering 10 drifting, rotating, pixelated 8-bit Pakistani flags. Mount the component inside `<BrowserRouter>` in [`src/App.jsx`](file:///opt/lampp/htdocs/qms_pro/src/App.jsx).

**Tech Stack:** React, HTML5 Canvas 2D API, Vite, rsync SCP deployment.

## Global Constraints

- `pointer-events: none` on overlay container to ensure 0 interference with UI clicks/inputs.
- `z-index: 99998` to sit right below the top-level cursor trail (`z-index: 99999`).
- Auto-disable on `prefers-reduced-motion: reduce`.

---

### Task 1: Create `PixelPakFlagsOverlay.jsx` Component

**Files:**
- Create: `src/PixelPakFlagsOverlay.jsx`

**Interfaces:**
- Consumes: None (Self-contained Canvas component)
- Produces: `<PixelPakFlagsOverlay />` React component

- [ ] **Step 1: Write `src/PixelPakFlagsOverlay.jsx`**

```jsx
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
    const flagW = 40;
    const flagH = 26;
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
    octx.fillRect(0, 0, 10, flagH);

    // Crescent
    octx.beginPath();
    octx.arc(26, 13, 8, 0, Math.PI * 2);
    octx.fill();
    octx.fillStyle = '#01411C';
    octx.beginPath();
    octx.arc(28, 11, 7, 0, Math.PI * 2);
    octx.fill();

    // Star
    octx.fillStyle = '#FFFFFF';
    octx.beginPath();
    octx.arc(30, 9, 2.5, 0, Math.PI * 2);
    octx.fill();

    // Create 10 floating flag particles
    const flags = Array.from({ length: 10 }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      vy: -(0.6 + Math.random() * 0.8),
      vx: (Math.random() - 0.5) * 0.4,
      scale: 0.8 + Math.random() * 0.6,
      rot: (Math.random() - 0.5) * 0.3,
      vRot: (Math.random() - 0.5) * 0.005,
      opacity: 0.65 + Math.random() * 0.3,
      wobble: Math.random() * Math.PI * 2,
      wobbleSpeed: 0.02 + Math.random() * 0.02,
    }));

    const render = () => {
      animId = requestAnimationFrame(render);
      ctx.clearRect(0, 0, w, h);

      for (let f of flags) {
        f.y += f.vy;
        f.wobble += f.wobbleSpeed;
        f.x += f.vx + Math.sin(f.wobble) * 0.5;
        f.rot += f.vRot;

        // Wrap around top
        if (f.y < -50) {
          f.y = h + 50;
          f.x = Math.random() * w;
        }

        ctx.save();
        ctx.translate(f.x, f.y);
        ctx.rotate(f.rot);
        ctx.scale(f.scale, f.scale);
        ctx.globalAlpha = f.opacity;
        ctx.imageSmoothingEnabled = false; // Keep pixelated look

        // Border outline
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
```

- [ ] **Step 2: Commit file**

```bash
git add src/PixelPakFlagsOverlay.jsx
git commit -m "feat(ui): add PixelPakFlagsOverlay component for floating pixelated Pakistani flags meme"
```

---

### Task 2: Mount Component in `App.jsx`, Build & Deploy

**Files:**
- Modify: `src/App.jsx:5-35`

- [ ] **Step 1: Update `src/App.jsx` to mount `<PixelPakFlagsOverlay />`**

Import `PixelPakFlagsOverlay` and render it right next to `<CursorTrail />` inside `<BrowserRouter>`.

- [ ] **Step 2: Build project bundle**

Run: `npm run build`
Expected: `built in X.XXs` with exit code 0.

- [ ] **Step 3: Deploy to production cPanel**

Run python script to rsync `dist/` to `public_html/qms_react/`.

- [ ] **Step 4: Commit and push git**

```bash
git add src/App.jsx
git commit -m "feat(ui): mount PixelPakFlagsOverlay in App.jsx"
git push origin main
```
