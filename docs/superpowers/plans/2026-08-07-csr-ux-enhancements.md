# CSR UX Enhancements & Modal Visual Revamp Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a non-intrusive Due Soon Alert Bar (Lucide SVG, zero emojis), 1-tap Quick Note Chips with a custom `+ Add` chip creator (saved in localStorage), and modernize modal dialog visuals in `src/pages/User.jsx` while preserving 100% of existing business logic and options.

**Architecture:** Frontend React enhancements in `src/pages/User.jsx` and styling in `src/index.css`. Uses `localStorage` for custom chips persistence and Lucide SVG components for icon graphics.

**Tech Stack:** React 18, Lucide React icons, Vanilla CSS variables, Vite build tool.

## Global Constraints

- **Zero Emojis**: All icons must use Lucide SVG components (`Clock`, `AlertTriangle`, `Plus`, `X`, `FileText`, `Check`).
- **Zero Logic Alterations**:
  - The "Report Issue" button in Order Detail modal must remain hidden until `dNotes.trim().length > 0`.
  - Form validation, deadline preset options, and backend API endpoints remain identical.

---

### Task 1: CSS Design Tokens & Animation Styles

**Files:**
- Modify: `src/index.css`

**Interfaces:**
- Produces: CSS utility classes `.due-soon-bar`, `.due-soon-pulse`, `.chip-container`, `.note-chip`, `.chip-add-btn`, `.modal-glass-overlay`

- [ ] **Step 1: Add CSS rules for Due Soon bar, Note Chips, and glassmorphic dialogs**

Add the following CSS rules to `src/index.css`:
```css
/* ── DUE SOON ALERT BAR ── */
.due-soon-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 16px;
  margin-bottom: 16px;
  background: var(--status-warning-bg, rgba(245, 158, 11, 0.08));
  border: 1px solid var(--status-warning-border, rgba(245, 158, 11, 0.25));
  border-radius: 8px;
  color: var(--text-main);
  font-size: 13px;
  transition: all 0.2s ease;
}

@keyframes dueSoonPulse {
  0% { transform: scale(1); opacity: 0.9; }
  50% { transform: scale(1.15); opacity: 1; color: var(--status-danger, #ef4444); }
  100% { transform: scale(1); opacity: 0.9; }
}

.due-soon-pulse {
  animation: dueSoonPulse 2s infinite ease-in-out;
  color: var(--status-warning, #f59e0b);
}

/* ── QUICK NOTE CHIPS ── */
.chip-container {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 8px;
  align-items: center;
}

.note-chip {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  font-size: 11px;
  font-weight: 500;
  border-radius: 14px;
  background: var(--bg-hover, rgba(255, 255, 255, 0.06));
  border: 1px solid var(--border-subtle, rgba(255, 255, 255, 0.12));
  color: var(--text-main);
  cursor: pointer;
  user-select: none;
  transition: background 0.15s ease, border-color 0.15s ease;
}

.note-chip:hover {
  background: var(--accent-primary-alpha, rgba(59, 130, 246, 0.15));
  border-color: var(--accent-primary, #3b82f6);
  color: var(--accent-primary, #3b82f6);
}

.chip-add-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  font-size: 11px;
  font-weight: 600;
  border-radius: 14px;
  background: transparent;
  border: 1px dashed var(--border-strong, #52525b);
  color: var(--text-muted, #a1a1aa);
  cursor: pointer;
  transition: all 0.15s ease;
}

.chip-add-btn:hover {
  border-color: var(--text-main, #ffffff);
  color: var(--text-main, #ffffff);
}
```

- [ ] **Step 2: Verify CSS builds cleanly**

Run: `cd /opt/lampp/htdocs/qms_pro && npm run build 2>&1 | tail -5`
Expected: `exit 0`

- [ ] **Step 3: Commit CSS additions**

Run:
```bash
git add src/index.css
git commit -m "style: add CSS for Due Soon bar, Note Chips, and dialog enhancements"
```

---

### Task 2: Due Soon Alert Bar & Queue Filter (`src/pages/User.jsx`)

**Files:**
- Modify: `src/pages/User.jsx`

**Interfaces:**
- Consumes: `nowPKT()`, `currentOrders`, `fromDate`, `toDate`
- Produces: `DueSoonAlertBar` component, `filterDueSoon` state & table filtering

- [ ] **Step 1: Implement `filterDueSoon` state and Due Soon Alert Bar in `User.jsx`**

In `src/pages/User.jsx`:
1. Add state: `const [filterDueSoon, setFilterDueSoon] = useState(false)`
2. Calculate due soon items in `currentOrders`:
   ```javascript
   const dueSoonOrders = useMemo(() => {
     const now = nowPKT()
     return (currentOrders || []).filter(o => {
       if (!o['query-received_datetime']) return false
       const r = new Date(o['query-received_datetime'].replace(/-/g, '/'))
       const remMs = (r.getTime() + (parseFloat(o.reminder_hours || 4) * 3600000)) - now.getTime()
       return remMs > 0 && remMs <= 30 * 60000
     })
   }, [currentOrders])
   ```
3. Update filtered table list when `filterDueSoon` is enabled.
4. Render `DueSoonAlertBar` right below top stats in the `current` section:
   ```jsx
   {dueSoonOrders.length > 0 && (
     <div className="due-soon-bar fade-up">
       <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
         <Clock className="due-soon-pulse" size={16} />
         <span><strong>{dueSoonOrders.length} {dueSoonOrders.length === 1 ? 'query' : 'queries'}</strong> due within 30 minutes</span>
       </div>
       <button
         type="button"
         onClick={() => setFilterDueSoon(!filterDueSoon)}
         className="btn btn-ghost"
         style={{ fontSize: 12, padding: '4px 10px', height: 'auto' }}
       >
         {filterDueSoon ? 'Show All Queue' : 'View Due Soon Only'}
       </button>
     </div>
   )}
   ```

- [ ] **Step 2: Verify build passes**

Run: `cd /opt/lampp/htdocs/qms_pro && npm run build 2>&1 | tail -5`
Expected: `exit 0`

- [ ] **Step 3: Commit Due Soon Bar implementation**

Run:
```bash
git add src/pages/User.jsx
git commit -m "feat: add Due Soon alert bar and queue filter to User.jsx"
```

---

### Task 3: 1-Tap Quick Note Chips & Custom Chip Creator (`src/pages/User.jsx`)

**Files:**
- Modify: `src/pages/User.jsx`

**Interfaces:**
- Consumes: `dNotes`, `setDNotes`, `localStorage`
- Produces: `QuickNoteChips` UI component inside Order Detail and Resolve modals

- [ ] **Step 1: Implement custom chip persistence and `QuickNoteChips` component**

In `src/pages/User.jsx`:
1. Add custom chip state initialized from `localStorage`:
   ```javascript
   const DEFAULT_CHIPS = ['Missing Files', 'Client Revision', 'Wrong Dimensions', 'Duplicate Query', 'Urgent Priority']
   const [customChips, setCustomChips] = useState(() => {
     try {
       return JSON.parse(localStorage.getItem('qms_custom_note_chips')) || []
     } catch { return [] }
   })

   const addCustomChip = () => {
     const text = prompt('Enter custom note chip label:')
     if (text && text.trim()) {
       const cleaned = text.trim()
       if (!DEFAULT_CHIPS.includes(cleaned) && !customChips.includes(cleaned)) {
         const next = [...customChips, cleaned]
         setCustomChips(next)
         localStorage.setItem('qms_custom_note_chips', JSON.stringify(next))
       }
     }
   }

   const removeCustomChip = (chipToRemove, e) => {
     e.stopPropagation()
     const next = customChips.filter(c => c !== chipToRemove)
     setCustomChips(next)
     localStorage.setItem('qms_custom_note_chips', JSON.stringify(next))
   }

   const appendChip = (chipText) => {
     setDNotes(prev => {
       if (!prev || !prev.trim()) return chipText
       if (prev.includes(chipText)) return prev
       return `${prev.trim()}, ${chipText}`
     })
   }
   ```
2. Render `QuickNoteChips` above the Notes textarea in Order Detail Modal:
   ```jsx
   <div className="chip-container">
     {DEFAULT_CHIPS.concat(customChips).map(chip => (
       <span key={chip} className="note-chip" onClick={() => appendChip(chip)}>
         {chip}
         {customChips.includes(chip) && (
           <X size={12} onClick={e => removeCustomChip(chip, e)} style={{ marginLeft: 2, opacity: 0.6 }} />
         )}
       </span>
     ))}
     <button type="button" className="chip-add-btn" onClick={addCustomChip}>
       <Plus size={12} /> Add
     </button>
   </div>
   ```

- [ ] **Step 2: Verify strict preservation of conditional "Report Issue" button**

Verify line in `User.jsx`:
```jsx
{dNotes.trim().length > 0 && det.status !== 'issue' && (
  <button onClick={() => submitAction('issue')} disabled={dBusy} className="btn btn-warn" style={{ flex: 1, padding: 11 }}>Report Issue</button>
)}
```
Confirm: "Report Issue" button is strictly hidden when `dNotes` is empty, and becomes visible as soon as text is typed or a chip is clicked.

- [ ] **Step 3: Verify build passes**

Run: `cd /opt/lampp/htdocs/qms_pro && npm run build 2>&1 | tail -5`
Expected: `exit 0`

- [ ] **Step 4: Commit Quick Note Chips**

Run:
```bash
git add src/pages/User.jsx
git commit -m "feat: add 1-tap note chips and custom chip creator in User.jsx"
```

---

### Task 4: Revamp Modal Dialog Visuals (`src/pages/User.jsx`)

**Files:**
- Modify: `src/pages/User.jsx`

**Interfaces:**
- Consumes: Modal state variables (`open`, `det`, `ext`, `resOrd`)
- Produces: Enhanced Lucide SVG iconography and modern glassmorphic dialog headers

- [ ] **Step 1: Update modal headers and icons to use Lucide SVGs**

In `src/pages/User.jsx`:
1. New Query Modal: Update header icon to Lucide `FileText` SVG.
2. Order Detail Modal: Update header icon to Lucide `FileText` SVG.
3. Extend Deadline Modal: Update header icon to Lucide `Clock` SVG.
4. Resolve Issue Modal: Update header icon to Lucide `CheckCircle` SVG.
5. All close buttons use Lucide `X` SVG.

- [ ] **Step 2: Verify build passes**

Run: `cd /opt/lampp/htdocs/qms_pro && npm run build 2>&1 | tail -5`
Expected: `exit 0`

- [ ] **Step 3: Commit modal visual revamp**

Run:
```bash
git add src/pages/User.jsx
git commit -m "style: revamp modal dialog headers with Lucide SVG graphics"
```

---

### Task 5: Build Verification, Git Push & cPanel Deployment

**Files:**
- Deploy: `dist` bundle & `src/pages/User.jsx`

- [ ] **Step 1: Run full production build**

Run: `cd /opt/lampp/htdocs/qms_pro && npm run build`
Expected: Exit code 0, dist generated.

- [ ] **Step 2: Push changes to GitHub**

Run: `git push origin main`
Expected: Successfully pushed to `origin/main`.

- [ ] **Step 3: Deploy updated dist bundle to cPanel**

Run Python deploy script to upload `dist.tar.gz` to `public_html/qms_react/` on cPanel.
Expected: `Live cPanel Deployment Complete!`
