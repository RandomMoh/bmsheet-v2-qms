# CSR UX Enhancements & Modal Visual Revamp Design Spec

> **Date:** 2026-08-07  
> **Target:** `src/pages/User.jsx` & `src/index.css`  
> **Design Register:** App UI / Dashboard (Anti-AI, Crisp Lucide SVGs, Zero Emojis)

---

## 1. Goal

Enhance CSR workflow efficiency and visual elegance in QMS without introducing technical complexity or altering existing business logic:
1. **Due Soon Alert Bar**: Provide a sleek, non-intrusive alert bar in the Current Queue displaying queries due within 30 minutes, utilizing Lucide SVG icons (zero emojis).
2. **1-Tap Quick Note Chips + Custom Chip Creator**: Provide pre-set and user-created note chips for fast issue reporting and notes, preserving the mandatory text-before-issue conditional button logic.
3. **Modal Visual Revamp**: Elevate the visual craftsmanship of all modals (New Query, Order Detail, Extend Deadline, Resolve Issue) with crisp 1px borders, subtle frosted glass overlays, and refined typography while keeping all form fields, options, and submission handlers 100% identical.

---

## 2. Global Constraints & Principles

- **Zero Emojis**: All icons must use Lucide SVG components (e.g. `Clock`, `AlertTriangle`, `Plus`, `Check`, `X`, `FileText`). Emojis are strictly banned.
- **Zero Business Logic Alteration**:
  - The "Report Issue" button in the Order Detail modal must remain hidden until text exists in the Notes textarea (`dNotes.trim().length > 0`).
  - Modal submission endpoints (`add-order.php`, `mark-order.php`, `extend-time.php`) remain untouched.
- **Anti-AI Aesthetic**: High-contrast, clean agency typography, OKLCH/CSS variable-based subtle fills, no garish side-stripe borders or gradient text.

---

## 3. Detailed Component Specifications

### 3.1 Due Soon Alert Bar (`src/pages/User.jsx`)

- **Location**: Rendered directly below the top KPI statistics summary cards in the Current Queue section.
- **Trigger**: Active when 1 or more pending queries have deadline $\le 30$ minutes from `nowPKT()`.
- **Visibility**: Automatically hidden (`null` rendered) when 0 queries are due within 30 minutes to preserve vertical space.
- **Visual Structure**:
  - Container: Low-saturation amber background (`var(--status-warning-bg)` / `rgba(245, 158, 11, 0.08)`), 1px subtle border (`var(--status-warning-border)`), 8px border-radius, flex layout.
  - Icon: Lucide `Clock` SVG with subtle pulsing keyframe animation.
  - Label: `N queries due within 30 minutes` (crisp 13px font).
  - Quick Action Button: `[Filter Due Soon]` toggle button that filters the current queue table view to display only due-soon items.

### 3.2 1-Tap Quick Note Chips & Custom Chip Creator (`src/pages/User.jsx`)

- **Location**: Positioned directly above the **Notes / Issue Description** textarea in the Order Detail modal and Resolve modal.
- **Default Chips**:
  - `Missing Files`
  - `Client Revision`
  - `Wrong Dimensions`
  - `Duplicate Query`
  - `Urgent Priority`
- **Custom "+ Add" Chip Button**:
  - Includes a `+ Add` button styled with a Lucide `Plus` SVG icon.
  - Tapping `+ Add` opens a lightweight inline prompt to enter a custom note chip label.
  - Custom chips are saved to `localStorage` under `qms_custom_note_chips` and appended alongside default chips.
  - Includes a subtle `x` delete icon on custom chips allowing CSRs to remove custom chips they created.
- **1-Tap Insertion**: Tapping any chip appends its text to the current textarea value (`dNotes`), separating entries with commas if notes already exist.
- **Strict Logic Constraint**: The "Report Issue" button remains conditionally rendered (`dNotes.trim().length > 0 && det.status !== 'issue'`). Tapping a chip populates `dNotes`, immediately making the "Report Issue" button visible naturally.

### 3.3 Modal Visual Revamp (`src/pages/User.jsx` & `src/index.css`)

- **Modals Covered**:
  1. New Query Modal (`open`)
  2. Order Detail Modal (`det`)
  3. Extend Deadline Modal (`ext`)
  4. Resolve Issue Modal (`resOrd`)
- **Aesthetic Refinements**:
  - Overlay: Glassmorphic backdrop (`backdrop-filter: blur(8px)`, dark semi-transparent tint).
  - Dialog Frame: Crisp 1px border (`var(--border-strong)`), subtle box-shadow elevation, clean header with monospaced title tag & Lucide `X` close icon.
  - Preset Buttons (Deadline 30m, 1h, 2h, 4h, etc.): Modernized segmented pill toggle buttons with smooth hover and active highlight states.
  - Input Fields: Refined select dropdowns and datetime-local inputs with consistent padding and focus outlines.

---

## 4. State & Data Flow

- `customChips`: State initialized from `localStorage.getItem('qms_custom_note_chips')` (defaulting to empty array `[]`).
- `filterDueSoon`: Boolean state in `User.jsx` toggled by the Due Soon bar to filter `currentOrders`.
- `dNotes`: Existing state in `User.jsx`. Appended to when chips are clicked.

---

## 5. File Modification Summary

- `src/pages/User.jsx`: Implement `DueSoonAlertBar`, `QuickNoteChips`, custom chip persistence, `filterDueSoon` toggle, and updated modal CSS classes.
- `src/index.css`: Add keyframe animation for Lucide SVG pulsing and refined dialog styling classes.
