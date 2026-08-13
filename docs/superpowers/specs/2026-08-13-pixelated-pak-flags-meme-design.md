# Pixelated Pakistani Flags Floating Meme Overlay Design Specification

> **Goal:** Create a lightweight, high-performance, pixelated Pakistani flag floating particle overlay (`PixelPakFlagsOverlay.jsx`) that drifts smoothly across all QMS pages (Login, User Dashboard, Dev Terminal) as a fun meme effect.

## 1. Visual & Component Architecture

### Component: `src/PixelPakFlagsOverlay.jsx`
- **Mount Point:** Mounted inside `<BrowserRouter>` in [`src/App.jsx`](file:///opt/lampp/htdocs/qms_pro/src/App.jsx) so it covers all routes.
- **Rendering:** Uses HTML5 Canvas (`requestAnimationFrame`) or GPU-accelerated floating CSS nodes with `pointer-events: none` and `z-index: 99998` (just below cursor trail).
- **Flag Artwork:** 8-bit retro pixelated Pakistani Flag SVG/Canvas rendering featuring:
  - Retro green field `#01411C`
  - Crisp white vertical bar `#FFFFFF`
  - Pixelated crescent & 5-point star
  - Pixelated border outline (`image-rendering: pixelated`)

## 2. Floating Physics & Motion
- **Quantity:** 8 to 12 drifting pixelated flags on screen simultaneously.
- **Movement:** Drifts upward/diagonally with subtle horizontal wobble, variable speeds (15px to 40px/sec), rotational drift (-15° to +15°), and scaling (24px to 48px width).
- **Looping:** When a flag floats off the top or side boundary, it seamlessly respawns at the bottom with randomized horizontal position, speed, and size.
- **Non-blocking:** `pointer-events: none` ensures zero interference with user clicks, inputs, modals, or cursor trails.

## 3. Integration Plan
1. Create [`src/PixelPakFlagsOverlay.jsx`](file:///opt/lampp/htdocs/qms_pro/src/PixelPakFlagsOverlay.jsx).
2. Mount `<PixelPakFlagsOverlay />` in [`src/App.jsx`](file:///opt/lampp/htdocs/qms_pro/src/App.jsx).
3. Test production build with `npm run build`.
4. Deploy to cPanel (`public_html/qms_react/`).
5. Commit and push to GitHub `main`.
