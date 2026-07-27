import { useEffect, useState, useMemo, useCallback, memo, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, Legend } from 'recharts'
import ThemeToggle from '../ThemeToggle'
import SlackThreadViewer from '../SlackThreadViewer'


const Icon = memo(function Icon({ paths, size = 16, style = {} }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" style={style}>
      {(Array.isArray(paths) ? paths : [paths]).map((d, i) => <path key={i} d={d} />)}
    </svg>
  )
})

const IC = {
  grid: ['M3 3h7v7H3z', 'M14 3h7v7h-7z', 'M14 14h7v7h-7z', 'M3 14h7v7H3z'],
  chart: ['M18 20V10', 'M12 20V4', 'M6 20v-6'],
  logout: ['M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4', 'M16 17l5-5-5-5', 'M21 12H9'],
  search: ['M11 17.25a6.25 6.25 0 1 1 0-12.5 6.25 6.25 0 0 1 0 12.5z', 'M16 16l4.5 4.5'],
  chevL: ['M15 18l-6-6 6-6'],
  chevR: ['M9 18l6-6-6-6'],
  pdf: ['M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z', 'M14 2v6h6', 'M16 13H8', 'M16 17H8', 'M10 9H8'],
  user: ['M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2', 'M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z'],
  calendar: ['M3 4h18v18H3z', 'M16 2v4', 'M8 2v4', 'M3 10h18'],
  filter: ['M22 3H2l8 9.46V19l4 2v-8.54L22 3z'],
  arrowR: ['M5 12h14', 'M12 5l7 7-7 7'],
  close: ['M18 6L6 18', 'M6 6l12 12'],
  info: ['M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z', 'M12 16v-4', 'M12 8h.01'],
  layers: ['M12 2L2 7l10 5 10-5-10-5z', 'M2 17l10 5 10-5', 'M2 12l10 5 10-5'],
  clock: ['M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z', 'M12 6v6l4 2'],
  download: ['M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4', 'M7 10l5 5 5-5', 'M12 15V3'],
  userPlus: ['M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2', 'M8.5 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z', 'M20 8v6', 'M23 11h-6'],
  shield: ['M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z'],
  check: ['M20 6L9 17l-5-5'],
  plus: ['M12 5v14', 'M5 12h14'],
}

const API = import.meta.env.VITE_API_BASE_URL
const PP = 50

const GRID_COLS = [
  { key: 'id', label: '#', w: 60 },
  { key: 'date', label: 'Date', w: 100 },
  { key: 'communication_medium', label: 'Medium', w: 140 },
  { key: 'project_name', label: 'Project', w: 80 },
  { key: 'department', label: 'Department', w: 140 },
  { key: 'type', label: 'Type', w: 100 },
  { key: 'propery-order', label: 'Order ID', w: 180 },
  { key: 'query-received_datetime', label: 'Received', w: 150 },
  { key: 'query-first-reply_datetime', label: '1st Reply', w: 150 },
  { key: 'qname', label: 'Entered By', w: 130 },
  { key: 'completed_by', label: 'Completed By', w: 130 },
  { key: 'query_done', label: 'Done At', w: 150 },
  { key: 'status', label: 'Status', w: 100 },
]

const STATUS_CFG = {
  completed: { bg: 'var(--status-success-bg)', color: 'var(--status-success)', border: 'var(--status-success)' },
  issue: { bg: 'var(--status-warning-bg)', color: 'var(--status-warning)', border: 'var(--status-warning)' },
}

function getPKTDateStr(d = new Date()) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Karachi', year: 'numeric', month: '2-digit', day: '2-digit' }).format(d);
}

function fmtDt(s) {
  if (!s) return '—'
  const d = new Date(s); if (isNaN(d)) return s
  const mon = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][d.getMonth()]
  let h = d.getHours(), ap = h >= 12 ? 'PM' : 'AM'; h = h % 12 || 12
  return `${d.getDate()} ${mon} ${d.getFullYear()}, ${h}:${String(d.getMinutes()).padStart(2, '0')} ${ap}`
}
function diffMin(a, b) {
  if (!a || !b) return null
  return (new Date(b) - new Date(a)) / 60000
}
function durStr(min) {
  if (min === null) return '—'
  const h = Math.floor(min / 60), m = Math.round(min % 60)
  return h ? `${h}h ${m}m` : `${m}m`
}

function classifyOrder(o, byUser) {
  const name = (o.completed_by || '').trim() || 'Unassigned'
  if (!byUser[name]) byUser[name] = {
    name, total: 0, newOrd: 0, amend: 0, orders: [],
    depts: {}, projects: {}, types: {},
    reply_5: 0, reply_15: 0, reply_30: 0, reply_over30: 0, reply_na: 0,
    done_45m: 0, done_2h: 0, done_6h: 0, done_8h: 0, done_12h: 0, done_over12: 0,
  }
  const u = byUser[name]
  u.total++
  u.orders.push(o)

  const type = (o.type || '').toLowerCase()
  if (type.includes('new')) u.newOrd++
  else if (type.includes('amend')) u.amend++

  const dept = o.department || 'Unknown'
  const proj = o.project_name || 'Unknown'
  const tp = o.type || 'Unknown'
  u.depts[dept] = (u.depts[dept] || 0) + 1
  u.projects[proj] = (u.projects[proj] || 0) + 1
  u.types[tp] = (u.types[tp] || 0) + 1

  const rm = diffMin(o['query-received_datetime'], o['query-first-reply_datetime'])
  if (!o['query-first-reply_datetime'] || rm === null) u.reply_na++
  else if (rm <= 5) u.reply_5++
  else if (rm <= 15) u.reply_15++
  else if (rm <= 30) u.reply_30++
  else u.reply_over30++

  const dm = diffMin(o['query-received_datetime'], o.query_done)
  if (dm !== null) {
    if (dm <= 45) u.done_45m++
    else if (dm <= 120) u.done_2h++
    else if (dm <= 360) u.done_6h++
    else if (dm <= 480) u.done_8h++
    else if (dm <= 720) u.done_12h++
    else u.done_over12++
  }
}

function buildReport(orders, completedByNames) {
  const byUser = {}
  orders.filter(o => o.query_done).forEach(o => {
    let name = (o.completed_by || '').trim()
    if (!name) name = 'Unassigned'
    else if (completedByNames && completedByNames.length) {
      const match = completedByNames.find(c => c.values && c.values.includes(name))
      if (match) name = match.display
    }
    classifyOrder({ ...o, completed_by: name }, byUser)
  })
  return byUser
}

async function exportUserPDF(u) {
  const [{ default: jsPDF }, { default: autoTable }] = await Promise.all([import('jspdf'), import('jspdf-autotable')])
  const doc = new jsPDF('p')
  doc.setFont('helvetica', 'bold'); doc.setFontSize(16); doc.setTextColor(15, 23, 42)
  doc.text(`${u.name} — Performance Report`, 14, 20)
  doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(100, 116, 139)
  doc.text(`Generated: ${new Date().toLocaleString()}  |  ${u.total} completed queries`, 14, 28)

  autoTable(doc, {
    startY: 36, theme: 'grid',
    head: [['Metric', 'Value']],
    body: [['Total', u.total], ['New Orders', u.newOrd], ['Amendments', u.amend]],
    headStyles: { fillColor: [15, 23, 42], textColor: 255, fontSize: 8, fontStyle: 'bold' },
    bodyStyles: { fontSize: 9 }, styles: { cellPadding: 3 },
  })

  autoTable(doc, {
    startY: doc.lastAutoTable.finalY + 10, theme: 'grid',
    head: [['1st Reply Time', '\u22645m', '5-15m', '15-30m', '>30m', 'N/A']],
    body: [[u.name, u.reply_5, u.reply_15, u.reply_30, u.reply_over30, u.reply_na]],
    headStyles: { fillColor: [30, 64, 175], textColor: 255, fontSize: 8, fontStyle: 'bold', halign: 'center' },
    bodyStyles: { fontSize: 9, halign: 'center' },
    columnStyles: { 0: { halign: 'left', fontStyle: 'bold' } },
    styles: { cellPadding: 3 },
  })

  autoTable(doc, {
    startY: doc.lastAutoTable.finalY + 10, theme: 'grid',
    head: [['Completion Time', '\u226445m', '\u22642h', '\u22646h', '\u22648h', '\u226412h', '>12h']],
    body: [[u.name, u.done_45m, u.done_2h, u.done_6h, u.done_8h, u.done_12h, u.done_over12]],
    headStyles: { fillColor: [30, 64, 175], textColor: 255, fontSize: 8, fontStyle: 'bold', halign: 'center' },
    bodyStyles: { fontSize: 9, halign: 'center' },
    columnStyles: { 0: { halign: 'left', fontStyle: 'bold' } },
    styles: { cellPadding: 3 },
  })

  const typeEntries = Object.entries(u.types).sort((a, b) => b[1] - a[1])
  if (typeEntries.length) {
    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + 10, theme: 'grid',
      head: [['Order Type', 'Count']],
      body: typeEntries,
      headStyles: { fillColor: [15, 23, 42], textColor: 255, fontSize: 8, fontStyle: 'bold' },
      bodyStyles: { fontSize: 9 }, styles: { cellPadding: 3 },
    })
  }

  const deptEntries = Object.entries(u.depts).sort((a, b) => b[1] - a[1])
  if (deptEntries.length) {
    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + 10, theme: 'grid',
      head: [['Department', 'Count']],
      body: deptEntries,
      headStyles: { fillColor: [15, 23, 42], textColor: 255, fontSize: 8, fontStyle: 'bold' },
      bodyStyles: { fontSize: 9 }, styles: { cellPadding: 3 },
    })
  }

  autoTable(doc, {
    startY: doc.lastAutoTable.finalY + 10, theme: 'striped',
    head: [['#', 'Order', 'Type', 'Time Taken']],
    body: u.orders.map((o, i) => {
      const dm = diffMin(o['query-received_datetime'], o.query_done)
      return [i + 1, o['propery-order'] || '\u2014', o.type || '\u2014', durStr(dm)]
    }),
    headStyles: { fillColor: [15, 23, 42], textColor: 255, fontSize: 7, fontStyle: 'bold' },
    bodyStyles: { fontSize: 7 },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    styles: { cellPadding: 2, overflow: 'ellipsize' },
    columnStyles: { 0: { cellWidth: 15 }, 1: { cellWidth: 85 } },
  })

  doc.setFontSize(7); doc.setTextColor(148, 163, 184)
  doc.text('QMS \u00a9 Benchmark Studio \u2014 Confidential', 14, doc.internal.pageSize.height - 8)
  doc.save(`QMS_${u.name.replace(/\s+/g, '_')}_Report_${new Date().toISOString().slice(0, 10)}.pdf`)
}

function QueryTimeline({ order, onClose }) {
  const [events, setEvents] = useState(null)
  const API = import.meta.env.VITE_API_BASE_URL

  useEffect(() => {
    fetch(`${API}/get-query-history.php?order_id=${order.id}`)
      .then(r => r.json())
      .then(d => setEvents(d.status === 'success' ? d.data : []))
      .catch(() => setEvents([]))
  }, [order.id])

  const getDotClass = (action) => {
    const a = (action || '').toLowerCase()
    if (a.includes('created')) return 'created'
    if (a.includes('completed') || a.includes('mark comp')) return 'completed'
    if (a.includes('issue') && !a.includes('resolved')) return 'issue'
    if (a.includes('resolved') || a.includes('resolve')) return 'resolved'
    if (a.includes('assigned') || a.includes('assign')) return 'assigned'
    return 'field'
  }
  const getBadgeClass = (action) => `badge-${getDotClass(action)}`

  const fmtTime = (ts) => {
    if (!ts) return '—'
    const d = new Date(ts)
    const mon = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][d.getMonth()]
    let h = d.getHours(), ap = h >= 12 ? 'PM' : 'AM'; h = h % 12 || 12
    return `${d.getDate()} ${mon} ${d.getFullYear()}, ${h}:${String(d.getMinutes()).padStart(2, '0')} ${ap}`
  }

  const fieldLabel = (f) => {
    const m = { status: 'Status', completed_by: 'Assigned To', instruction: 'Note', project_name: 'Project', department: 'Department' }
    return m[f] || f
  }

  return (
    <>
      <div className="timeline-drawer-overlay" onClick={onClose} />
      <div className="timeline-drawer" role="dialog" aria-label="Query Timeline">
        <div className="timeline-drawer-header">
          <div>
            <h2>Query Timeline</h2>
            <p>Order #{order.id} &nbsp;·&nbsp; {order['propery-order'] || '—'}</p>
          </div>
          <button className="timeline-close-btn" onClick={onClose} aria-label="Close">
            <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="timeline-body">
          {events === null ? (
            <div className="timeline-empty"><p>Loading…</p></div>
          ) : events.length === 0 ? (
            <div className="timeline-empty">
              <svg width={40} height={40} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}><path d="M12 8v4l3 3m6-3a9 9 0 1 1-18 0 9 9 0 0 1 18 0z" /></svg>
              <p>No history recorded yet for this query.</p>
              <p style={{ fontSize: 12, opacity: 0.6 }}>New changes will appear here going forward.</p>
            </div>
          ) : (
            <div className="timeline-track">
              {events.map((ev, i) => (
                <div key={ev.id} className="timeline-event" style={{ animationDelay: `${i * 0.05}s` }}>
                  <div className={`timeline-dot ${getDotClass(ev.action)}`} />
                  <div className="timeline-card">
                    <div className="timeline-card-top">
                      <span className={`timeline-action-badge ${getBadgeClass(ev.action)}`}>{ev.action}</span>
                      <span className="timeline-time">{fmtTime(ev.timestamp_pkt)}</span>
                    </div>
                    {ev.changed_by && <div className="timeline-by">by <strong>{ev.changed_by}</strong></div>}
                    {(ev.old_value !== null || ev.new_value) && (
                      <div className="timeline-diff">
                        <span className="timeline-diff-label">{fieldLabel(ev.field_changed)}:</span>
                        {ev.old_value && <span className="timeline-diff-old">{ev.old_value}</span>}
                        {ev.old_value && <span className="timeline-diff-arrow">→</span>}
                        <span className="timeline-diff-new">{ev.new_value || '—'}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  )
}

function DrillDown({ u, onClose }) {
  const replyBuckets = [
    { l: '≤5m', v: u.reply_5, good: true },
    { l: '5-15m', v: u.reply_15, good: true },
    { l: '15-30m', v: u.reply_30, good: false },
    { l: '>30m', v: u.reply_over30, good: false, bad: true },
    { l: 'N/A', v: u.reply_na, neutral: true },
  ]
  const doneBuckets = [
    { l: '≤45m', v: u.done_45m, good: true },
    { l: '≤2h', v: u.done_2h, good: true },
    { l: '≤6h', v: u.done_6h, good: false },
    { l: '≤8h', v: u.done_8h, good: false },
    { l: '≤12h', v: u.done_12h, good: false },
    { l: '>12h', v: u.done_over12, bad: true },
  ]
  const topDepts = Object.entries(u.depts).sort((a, b) => b[1] - a[1]).slice(0, 5)
  const topProjs = Object.entries(u.projects).sort((a, b) => b[1] - a[1]).slice(0, 5)
  const typeEntries = Object.entries(u.types).sort((a, b) => b[1] - a[1])
  const initials = u.name[0]?.toUpperCase() || '?'

  const bar = (v, max, color) => (
    <div style={{ flex: 1, height: 4, background: 'var(--border-subtle)', borderRadius: 2, overflow: 'hidden' }}>
      <div style={{ height: '100%', width: `${Math.round((v / Math.max(max, 1)) * 100)}%`, background: color, borderRadius: 2, transition: 'width 0.15s ease' }} />
    </div>
  )

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 60, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }} onClick={onClose}>
      <div className="anim-slide-right" onClick={e => e.stopPropagation()} style={{ width: 440, height: '100vh', background: 'var(--bg-panel)', borderLeft: '1px solid var(--border-strong)', overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>

        <div style={{ padding: '24px 28px', borderBottom: '1px solid var(--border-subtle)', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
            <span style={{ fontSize: 13, color: 'var(--text-main)', fontWeight: 600 }}>Performance Report</span>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => exportUserPDF(u)} style={{ background: 'transparent', border: '1px solid var(--border-strong)', borderRadius: 6, color: 'var(--text-main)', cursor: 'pointer', padding: '6px 12px', display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontFamily: 'inherit' }}>
                <Icon paths={IC.pdf} size={14} /> PDF
              </button>
              <button onClick={onClose} style={{ background: 'transparent', border: '1px solid var(--border-strong)', borderRadius: 6, color: 'var(--text-main)', cursor: 'pointer', padding: '6px 12px', display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontFamily: 'inherit' }}>
                <Icon paths={IC.close} size={14} /> Close
              </button>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ width: 48, height: 48, borderRadius: 6, background: 'var(--bg-hover)', border: '1px solid var(--border-strong)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 600, flexShrink: 0, color: 'var(--text-main)' }}>{initials}</div>
            <div>
              <h2 style={{ fontSize: 18, fontWeight: 600, margin: '0 0 4px', color: 'var(--text-main)' }}>{u.name}</h2>
              <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0 }}>Completed {u.total} quer{u.total === 1 ? 'y' : 'ies'}</p>
            </div>
          </div>

          <div className="stagger-parent" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginTop: 32 }}>
            {[{ l: 'Total', v: u.total }, { l: 'New', v: u.newOrd }, { l: 'Amend', v: u.amend }].map(x => (
              <div key={x.l} style={{ background: 'var(--bg-base)', border: '1px solid var(--border-strong)', borderRadius: 6, padding: '16px', textAlign: 'center' }}>
                <p style={{ fontSize: 24, fontWeight: 600, color: 'var(--text-main)', margin: '0 0 4px', fontVariantNumeric: 'tabular-nums' }}>{x.v}</p>
                <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0, fontWeight: 500 }}>{x.l}</p>
              </div>
            ))}
          </div>
        </div>

        <div style={{ padding: '32px 28px', display: 'flex', flexDirection: 'column', gap: 32 }}>

          <div>
            <h3 style={{ fontSize: 14, fontWeight: 600, margin: '0 0 16px', color: 'var(--text-main)' }}>1st Reply Time</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {replyBuckets.map(b => (
                <div key={b.l} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ width: 56, fontSize: 13, color: b.bad ? 'var(--status-danger)' : b.good ? 'var(--status-success)' : 'var(--text-muted)', textAlign: 'right', flexShrink: 0 }}>{b.l}</span>
                  {bar(b.v, u.total, b.bad ? 'var(--status-danger)' : b.good ? 'var(--status-success)' : 'var(--text-muted)')}
                  <span style={{ width: 32, fontSize: 13, fontWeight: 500, color: 'var(--text-main)', textAlign: 'right', flexShrink: 0 }}>{b.v}</span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h3 style={{ fontSize: 14, fontWeight: 600, margin: '0 0 16px', color: 'var(--text-main)' }}>Completion Time</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {doneBuckets.map(b => (
                <div key={b.l} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ width: 56, fontSize: 13, color: b.bad ? 'var(--status-danger)' : b.good ? 'var(--status-success)' : 'var(--text-muted)', textAlign: 'right', flexShrink: 0 }}>{b.l}</span>
                  {bar(b.v, u.total, b.bad ? 'var(--status-danger)' : b.good ? 'var(--status-success)' : 'var(--status-warning)')}
                  <span style={{ width: 32, fontSize: 13, fontWeight: 500, color: 'var(--text-main)', textAlign: 'right', flexShrink: 0 }}>{b.v}</span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h3 style={{ fontSize: 14, fontWeight: 600, margin: '0 0 16px', color: 'var(--text-main)' }}>By Type</h3>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {typeEntries.map(([t, v]) => (
                <div key={t} style={{ padding: '6px 12px', borderRadius: 6, background: 'var(--bg-base)', border: '1px solid var(--border-strong)', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-main)' }}>{v}</span>
                  <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{t}</span>
                </div>
              ))}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
            <div>
              <h3 style={{ fontSize: 14, fontWeight: 600, margin: '0 0 16px', color: 'var(--text-main)' }}>Departments</h3>
              {topDepts.map(([d, v]) => (
                <div key={d} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid var(--border-subtle)' }}>
                  <span style={{ fontSize: 13, color: 'var(--text-muted)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginRight: 12 }}>{d}</span>
                  <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-main)', flexShrink: 0 }}>{v}</span>
                </div>
              ))}
            </div>
            <div>
              <h3 style={{ fontSize: 14, fontWeight: 600, margin: '0 0 16px', color: 'var(--text-main)' }}>Top Projects</h3>
              {topProjs.map(([p, v]) => (
                <div key={p} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid var(--border-subtle)' }}>
                  <span style={{ fontSize: 13, color: 'var(--text-muted)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginRight: 12 }}>{p}</span>
                  <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-main)', flexShrink: 0 }}>{v}</span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h3 style={{ fontSize: 14, fontWeight: 600, margin: '0 0 16px', color: 'var(--text-main)' }}>All Completed Orders</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 480, overflowY: 'auto' }}>
              {u.orders.map(o => {
                const dm = diffMin(o['query-received_datetime'], o.query_done)
                const bad = dm !== null && dm > 120
                return (
                  <div key={o.id} style={{ display: 'grid', gridTemplateColumns: '1fr 80px 80px', gap: 12, padding: '12px 16px', background: 'var(--bg-base)', border: '1px solid var(--border-strong)', borderRadius: 6, fontSize: 13 }}>
                    <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--text-main)', fontWeight: 500 }}>{o['propery-order'] || '—'}</div>
                    <div style={{ color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{o.type}</div>
                    <div style={{ fontWeight: 500, color: bad ? 'var(--status-danger)' : 'var(--text-main)', textAlign: 'right', flexShrink: 0 }}>{durStr(dm)}</div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
export default function AdminPortal() {
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [orders, setOrders] = useState([])
  const [completedByNames, setCompletedByNames] = useState([])
  const [loading, setLoading] = useState(true)
  const [addCsr, setAddCsr] = useState(false)
  const [addAdmin, setAddAdmin] = useState(false)
  const [mForm, setMForm] = useState({ name: '', username: '', password: 'Bm123456' })
  const [mBusy, setMBusy] = useState(false)
  const [mFb, setMFb] = useState(null)
  const [csrList, setCsrList] = useState([])
  const [editCsr, setEditCsr] = useState(null)
  const [eForm, setEForm] = useState({ name: '', username: '', password: '', status: 'yes' })
  const [eBusy, setEBusy] = useState(false)
  const [eFb, setEFb] = useState(null)
  const [delCsr, setDelCsr] = useState(null)
  const [delBusy, setDelBusy] = useState(false)
  const [error, setError] = useState(null)
  const [toast, setToast] = useState(null)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [section, setSection] = useState('grid')

  const [search, setSearch] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [csrFilter, setCsrFilter] = useState('')
  const [page, setPage] = useState(1)

  const [reportFrom, setReportFrom] = useState('')
  const [reportTo, setReportTo] = useState('')
  const [reportCsr, setReportCsr] = useState('')
  const [drillUser, setDrillUser] = useState(null)
  const [timelineOrder, setTimelineOrder] = useState(null)
  const [selectedIds, setSelectedIds] = useState(new Set())
  const [bulkBusy, setBulkBusy] = useState(false)
  const [slackThreadOrder, setSlackThreadOrder] = useState(null)
  const searchRef = useRef(null)

  useEffect(() => {
    const s = sessionStorage.getItem('qmsUser'), r = sessionStorage.getItem('qmsRole')
    if (!s || r !== 'admin') { navigate('/'); return }
    setUser(JSON.parse(s))
  }, [navigate])

  const fetchCsrs = useCallback(() => {
    fetch(`${API}/get-users.php`).then(r => r.json()).then(d => {
      if (d.status === 'success') setCsrList(d.data || [])
    }).catch(() => { })
  }, [])

  useEffect(() => { fetchCsrs() }, [fetchCsrs])

  const fetchData = useCallback((isPolling = false) => {
    if (!user) return
    if (!isPolling) setLoading(true)
    fetch(`${API}/get-orders.php`).then(r => r.text()).then(raw => {
      const d = JSON.parse(raw)
      setOrders(Array.isArray(d.data) ? d.data : [])
      setLoading(false)
    }).catch(e => { setError(e.message); setLoading(false) })
  }, [user])
  useEffect(() => {
    fetchData()
    const interval = setInterval(() => fetchData(true), 10000)
    return () => clearInterval(interval)
  }, [fetchData])

  useEffect(() => {
    if (!user) return
    fetch(`${API}/get-completed-by-names.php`)
      .then(r => r.json())
      .then(data => { if (Array.isArray(data)) setCompletedByNames(data) })
      .catch(() => { })
  }, [user])

  useEffect(() => {
    const handler = (e) => {
      const tag = document.activeElement?.tagName
      const inInput = ['INPUT', 'TEXTAREA', 'SELECT'].includes(tag)
      const mod = e.ctrlKey || e.metaKey

      if (mod && e.key === 'f') {
        e.preventDefault()
        searchRef.current?.focus()
      }
      if (e.key === 'Escape') {
        setDrillUser(null)
        setTimelineOrder(null)
        setSlackThreadOrder(null)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  const bulkUpdate = useCallback(async (action) => {
    if (!selectedIds.size) return
    setBulkBusy(true)
    const ids = Array.from(selectedIds)
    await Promise.all(ids.map(id =>
      fetch(`${API}/mark-order.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, action, completed_by: user?.username || 'Admin' })
      })
    ))
    setSelectedIds(new Set())
    setBulkBusy(false)
    fetchData()
    setToast(`${ids.length} quer${ids.length === 1 ? 'y' : 'ies'} updated to "${action}"`)
  }, [selectedIds, user, fetchData])

  const [logs, setLogs] = useState([])
  const [logsLoading, setLogsLoading] = useState(false)
  const [logFilterUser, setLogFilterUser] = useState('')
  const [logFilterAction, setLogFilterAction] = useState('')

  const fetchLogs = useCallback((isPolling = false) => {
    if (user?.username !== 'Moh' && user?.username !== 'sajid csr admin login') return
    if (!isPolling) setLogsLoading(true)
    fetch(`${API}/get-activity-logs.php`).then(r => r.json()).then(d => {
      if (d.status === 'success') setLogs(d.data || [])
      setLogsLoading(false)
    }).catch(() => setLogsLoading(false))
  }, [user])

  useEffect(() => {
    if (section === 'logs') {
      fetchLogs()
      const interval = setInterval(() => fetchLogs(true), 10000)
      return () => clearInterval(interval)
    }
  }, [section, fetchLogs])

  const filtered = useMemo(() => {
    let d = orders
    if (dateFrom) d = d.filter(o => (o.date || '') >= dateFrom)
    if (dateTo) d = d.filter(o => (o.date || '') <= dateTo)
    if (csrFilter) {
      const selected = completedByNames.find(c => c.display === csrFilter)
      const vals = selected ? selected.values : [csrFilter]
      d = d.filter(o => vals.includes(o.qname) || vals.includes(o.completed_by))
    }
    if (search.trim()) { const q = search.toLowerCase(); d = d.filter(o => GRID_COLS.some(c => String(o[c.key] ?? '').toLowerCase().includes(q))) }
    return d
  }, [orders, search, dateFrom, dateTo, csrFilter])

  const totalPages = Math.ceil(filtered.length / PP)
  const visible = filtered.slice((page - 1) * PP, page * PP)

  const stagnantOrders = useMemo(() => {
    const now = new Date()
    return orders.filter(o => {
      if (String(o.status || '').toLowerCase() === 'completed' || o.query_done) return false
      if (!o['query-received_datetime']) return false
      const received = new Date(o['query-received_datetime'])
      const diffHours = (now - received) / (1000 * 60 * 60)
      if (diffHours >= 24) {
        o._aging_hours = Math.floor(diffHours)
        return true
      }
      return false
    }).sort((a, b) => b._aging_hours - a._aging_hours)
  }, [orders])

  const reportOrders = useMemo(() => {
    let d = orders.filter(o => o.query_done)
    if (reportFrom) d = d.filter(o => (o.date || '') >= reportFrom)
    if (reportTo) d = d.filter(o => (o.date || '') <= reportTo)
    if (reportCsr) {
      const selected = completedByNames.find(c => c.display === reportCsr)
      const vals = selected ? selected.values : [reportCsr]
      d = d.filter(o => vals.includes(o.completed_by))
    }
    return d
  }, [orders, reportFrom, reportTo, reportCsr])

  const reportByUser = useMemo(() => buildReport(reportOrders), [reportOrders])
  const sorted = useMemo(() => Object.values(reportByUser).sort((a, b) => b.total - a.total), [reportByUser])

  const chartDataVolume = useMemo(() => {
    const counts = {}
    const now = new Date()
    for (let i = 13; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 86400000)
      const ds = getPKTDateStr(d)
      counts[ds] = 0
    }
    orders.forEach(o => {
      if (o.date && counts[o.date] !== undefined) {
        counts[o.date]++
      }
    })
    return Object.keys(counts).map(k => ({ date: k.slice(5), queries: counts[k] }))
  }, [orders])

  const chartDataStatus = useMemo(() => {
    let pending = 0, issue = 0, done = 0, moreTime = 0, assign = 0
    orders.forEach(o => {
      const s = String(o.status || '').toLowerCase()
      if (s === 'completed') done++
      else if (s === 'issue') issue++
      else if (s === 'need more time') moreTime++
      else if (s === 'assign') assign++
      else pending++
    })
    return [
      { name: 'Pending', value: pending, color: '#f59e0b' },
      { name: 'Assigned', value: assign, color: '#3b82f6' },
      { name: 'Need More Time', value: moreTime, color: '#8b5cf6' },
      { name: 'Issue', value: issue, color: '#ef4444' },
      { name: 'Completed', value: done, color: '#10b981' }
    ].filter(d => d.value > 0)
  }, [orders])

  const chartDataCsr = useMemo(() => {
    return sorted.slice(0, 8).map(u => ({
      name: u.name,
      done: u.total,
      issues: u.amend // using amend as a proxy for issues/complexity
    }))
  }, [sorted])

  const logout = async () => {
    try { await fetch(`${API}/logout.php`); } catch (e) { }
    sessionStorage.removeItem('qmsUser');
    sessionStorage.removeItem('qmsRole');
    navigate('/');
  }

  const exportLogsPDF = async () => {
    const [{ default: jsPDF }, { default: autoTable }] = await Promise.all([import('jspdf'), import('jspdf-autotable')])
    const doc = new jsPDF('p', 'mm', 'a4')
    doc.setFont('helvetica', 'bold'); doc.setFontSize(18); doc.setTextColor(15, 23, 42)
    doc.text('QMS — Activity Logs (Super Admin)', 14, 20)
    doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(100, 116, 139)
    doc.text(`Exported: ${new Date().toLocaleString()}  |  ${logs.length} records`, 14, 28)
    autoTable(doc, {
      startY: 34, theme: 'grid',
      head: [['ID', 'Time (PKT)', 'User', 'Role', 'Action', 'Details']],
      body: logs.map(l => [l.id, l.timestamp_pkt, l.username, l.role.toUpperCase(), l.action, l.details]),
      headStyles: { fillColor: [15, 23, 42], textColor: 255, fontSize: 8, fontStyle: 'bold' },
      bodyStyles: { fontSize: 8, textColor: [51, 65, 85] },
      columnStyles: { 0: { cellWidth: 15 }, 1: { cellWidth: 35 }, 2: { cellWidth: 30 }, 3: { cellWidth: 20 }, 4: { cellWidth: 35 }, 5: { cellWidth: 'auto' } }
    })
    doc.save(`qms_activity_logs_${new Date().getTime()}.pdf`)
  }

  const exportOrdersPDF = async () => {
    const [{ default: jsPDF }, { default: autoTable }] = await Promise.all([import('jspdf'), import('jspdf-autotable')])
    const doc = new jsPDF('l', 'mm', 'a3')
    doc.setFont('helvetica', 'bold'); doc.setFontSize(18); doc.setTextColor(15, 23, 42)
    doc.text('QMS — All Orders Export', 14, 20)
    doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(100, 116, 139)
    doc.text(`Exported: ${new Date().toLocaleString()}  |  ${filtered.length} records`, 14, 28)
    autoTable(doc, {
      startY: 34, theme: 'striped',
      head: [GRID_COLS.map(c => c.label)],
      body: filtered.map(o => GRID_COLS.map(c => String(o[c.key] ?? '—'))),
      headStyles: { fillColor: [15, 23, 42], textColor: 255, fontSize: 7, fontStyle: 'bold' },
      bodyStyles: { fontSize: 7 },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      styles: { cellPadding: 2.5, overflow: 'ellipsize' },
    })
    doc.setFontSize(7); doc.setTextColor(148, 163, 184)
    doc.text('QMS © Benchmark Studio — Confidential', 14, doc.internal.pageSize.height - 8)
    doc.save(`QMS_Orders_${new Date().toISOString().slice(0, 10)}.pdf`)
  }

  const exportAllPDF = async () => {
    const [{ default: jsPDF }, { default: autoTable }] = await Promise.all([import('jspdf'), import('jspdf-autotable')])
    const doc = new jsPDF('l', 'mm', 'a3')
    doc.setFont('helvetica', 'bold'); doc.setFontSize(18); doc.setTextColor(15, 23, 42)
    doc.text('QMS Master Orders Export', 14, 20)
    doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(100, 116, 139)
    doc.text(`Generated: ${new Date().toLocaleString()}  |  ${filtered.length} total queries`, 14, 28)
    autoTable(doc, {
      startY: 34, theme: 'grid',
      head: [GRID_COLS.map(c => c.label)],
      body: filtered.map(o => GRID_COLS.map(c => String(o[c.key] ?? '—'))),
      headStyles: { fillColor: [15, 23, 42], textColor: 255, fontSize: 7, fontStyle: 'bold' },
      bodyStyles: { fontSize: 7 },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      styles: { cellPadding: 2.5, overflow: 'ellipsize' },
    })
    doc.setFontSize(7); doc.setTextColor(148, 163, 184)
    doc.text('QMS © Benchmark Studio — Confidential', 14, doc.internal.pageSize.height - 8)
    doc.save(`QMS_Orders_${new Date().toISOString().slice(0, 10)}.pdf`)
  }

  const exportReportPDF = async () => {
    const [{ default: jsPDF }, { default: autoTable }] = await Promise.all([import('jspdf'), import('jspdf-autotable')])
    const doc = new jsPDF('l')
    doc.setFont('helvetica', 'bold'); doc.setFontSize(18); doc.setTextColor(15, 23, 42)
    doc.text('QMS Performance Report', 14, 20)
    doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(100, 116, 139)
    const range = reportFrom || reportTo ? `${reportFrom || 'Start'} — ${reportTo || 'End'}` : 'All Time'
    doc.text(`Period: ${range}  |  Generated: ${new Date().toLocaleString()}  |  ${reportOrders.length} completed queries`, 14, 28)
    const rows = sorted.map(u => [u.name, u.total, u.newOrd, u.amend, u.reply_5, u.reply_15, u.reply_30, u.reply_over30, u.reply_na, u.done_45m, u.done_2h, u.done_6h, u.done_8h, u.done_12h, u.done_over12])
    autoTable(doc, {
      startY: 34, theme: 'grid',
      head: [['User', 'Total', 'New', 'Amend', 'Reply ≤5m', '5-15m', '15-30m', '>30m', 'N/A', 'Done ≤45m', '≤2h', '≤6h', '≤8h', '≤12h', '>12h']],
      body: rows,
      headStyles: { fillColor: [15, 23, 42], textColor: 255, fontSize: 7, fontStyle: 'bold', halign: 'center' },
      bodyStyles: { fontSize: 8, halign: 'center' },
      columnStyles: { 0: { halign: 'left', fontStyle: 'bold', cellWidth: 40 } },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      styles: { cellPadding: 3, overflow: 'ellipsize' },
    })
    doc.setFontSize(7); doc.setTextColor(148, 163, 184)
    doc.text('QMS © Benchmark Studio — Confidential', 14, doc.internal.pageSize.height - 8)
    doc.save(`QMS_Report_${new Date().toISOString().slice(0, 10)}.pdf`)
  }

  const generateExecReport = async () => {
    try {
      const [{ default: jsPDF }, { default: html2canvas }] = await Promise.all([import('jspdf'), import('html2canvas')])
      const el = document.getElementById('exec-report-node')
      if (!el) return
      
      const originalStyle = el.style.cssText
      el.style.padding = '24px'
      el.style.background = 'var(--bg-main)'
      
      const canvas = await html2canvas(el, { scale: 2, useCORS: true, backgroundColor: null })
      const imgData = canvas.toDataURL('image/png')
      
      el.style.cssText = originalStyle
      
      const pdf = new jsPDF({
        orientation: canvas.width > canvas.height ? 'l' : 'p',
        unit: 'px',
        format: [canvas.width, canvas.height]
      })
      
      pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height)
      pdf.save(`Executive_Report_${getPKTDateStr()}.pdf`)
    } catch (e) {
      console.error('Report Generation Error:', e)
      alert('Failed to generate report. Please check the console.')
    }
  }

  if (!user) return null

  const adminName = user.username || user.dname || user.name || 'Admin'
  const initials = adminName[0].toUpperCase()


  const handleAddUser = async e => {
    e.preventDefault()
    const tempUser = { d_id: 'temp_' + Date.now(), dname: mForm.name, dusername: mForm.username, dstatus: 'yes' }
    setCsrList(prev => [...prev, tempUser])
    setAddCsr(false); setMForm({ name: '', username: '', password: 'Bm123456' }); setMFb(null)
    try {
      const res = await fetch(`${API}/add-user.php`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: mForm.name, username: mForm.username, password: mForm.password }) })
      const data = await res.json()
      if (data.status === 'success') fetchCsrs()
      else { setToast(data.message || 'Failed to add user'); fetchCsrs() }
    } catch { setToast('Network error — user may not have been added'); fetchCsrs() }
  }

  const handleAddAdmin = async e => {
    e.preventDefault()
    setAddAdmin(false); setMForm({ name: '', username: '', password: 'Bm123456' }); setMFb(null)
    try {
      const res = await fetch(`${API}/add-admin.php`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ display_name: mForm.name, login_name: mForm.username, password: mForm.password, role: 'admin' }) })
      const data = await res.json()
      if (data.status !== 'success') setToast(data.message || 'Failed to add admin')
    } catch { setToast('Network error — admin may not have been added') }
  }

  const handleEditCsr = async e => {
    e.preventDefault()
    const editId = editCsr.d_id
    setCsrList(prev => prev.map(c => c.d_id === editId ? { ...c, dname: eForm.name, dusername: eForm.username, dstatus: eForm.status } : c))
    setEditCsr(null); setEFb(null)
    const body = { id: editId, name: eForm.name, username: eForm.username, status: eForm.status }
    if (eForm.password.trim()) body.password = eForm.password
    try {
      const res = await fetch(`${API}/update-user.php`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      const data = await res.json()
      if (data.status === 'success') fetchCsrs()
      else { setToast(data.message || 'Edit failed'); fetchCsrs() }
    } catch { setToast('Network error — edit may not have saved'); fetchCsrs() }
  }

  const handleDeleteCsr = async () => {
    const delId = delCsr.d_id
    const snapshot = csrList
    setCsrList(prev => prev.filter(c => c.d_id !== delId))
    setDelCsr(null)
    try {
      const res = await fetch(`${API}/delete-user.php`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: delId }) })
      const data = await res.json()
      if (data.status === 'success') fetchCsrs()
      else { setCsrList(snapshot); setToast(data.message || 'Delete failed') }
    } catch { setCsrList(snapshot); setToast('Network error — user was not deleted') }
  }

  const S = {
    inp: { padding: '9px 14px', background: 'var(--bg-input)', border: '1.5px solid var(--border-strong)', borderRadius: 'var(--radius-md)', color: 'var(--text-main)', fontSize: 13, outline: 'none', fontFamily: 'inherit', transition: 'border-color 0.2s ease, box-shadow 0.2s ease' },
    lbl: { display: 'block', textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: 10, fontWeight: 600, color: 'var(--text-faint)', marginBottom: 6 },
    th: { fontSize: 11, fontWeight: 600, color: 'var(--text-faint)', padding: '10px 14px', textAlign: 'left', whiteSpace: 'nowrap', borderBottom: '2px solid var(--border-strong)', background: 'var(--bg-panel)', textTransform: 'uppercase', letterSpacing: '0.04em' },
    td: { padding: '10px 14px', fontSize: 13, color: 'var(--text-main)', borderBottom: '1px solid var(--border-subtle)', whiteSpace: 'nowrap', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis' },
  }
  const SECTIONS = { grid: 'All Orders', cmd: 'Analytics', reports: 'Performance Reports', csrs: 'Manage Members', logs: 'Activity Monitor' }

  return (
    <div className="shell fade-in">
      {toast && <div className="toast-bar"><span className="dot dot-pulse" style={{ background: 'var(--status-danger)' }} />{toast}<button onClick={() => setToast(null)} style={{ background: 'none', border: 'none', color: 'var(--text-faint)', fontSize: 16, cursor: 'pointer', padding: '0 4px' }}>×</button></div>}

      {drillUser && <DrillDown u={drillUser} onClose={() => setDrillUser(null)} />}
      {timelineOrder && <QueryTimeline order={timelineOrder} onClose={() => setTimelineOrder(null)} />}
      {slackThreadOrder && <SlackThreadViewer slackTs={slackThreadOrder.slack_ts} orderId={slackThreadOrder['propery-order']} onClose={() => setSlackThreadOrder(null)} />}
      {mobileMenuOpen && <div className="overlay mobile-overlay" onClick={() => setMobileMenuOpen(false)} style={{ zIndex: 40 }} />}

      {/* ═══ SIDEBAR ═══ */}
      <aside className={`sb${mobileMenuOpen ? ' mobile-sb' : ''}`} id="admin-sidebar">
        <div className="sb-brand">
          <img src={`${import.meta.env.BASE_URL}favicon.ico`} alt="Logo" className="sb-logo" style={{ background: 'transparent', boxShadow: 'none', objectFit: 'contain', padding: 0 }} />
          <div>
            <div className="sb-title">Benchmark<em>Studio</em></div>
            <div className="sb-subtitle">Admin Console</div>
          </div>
        </div>

        <nav className="sb-nav stagger">
          <div className="sb-group">
            <div className="sb-group-label">Overview</div>
            {[{ id: 'grid', label: 'All Orders', icon: IC.grid }, { id: 'cmd', label: 'Analytics', icon: IC.chart }, { id: 'reports', label: 'Reports', icon: IC.layers }].map(n => (
              <button key={n.id} onClick={() => { setSection(n.id); setMobileMenuOpen(false) }} className={`sb-link${section === n.id ? ' active' : ''}`}>
                <Icon paths={n.icon} size={14} style={{ color: section === n.id ? 'var(--accent-primary)' : 'var(--text-faint)' }} />
                {n.label}
              </button>
            ))}
          </div>

          <div className="sb-group">
            <div className="sb-group-label">Team Management</div>
            <button onClick={() => { setSection('csrs'); fetchCsrs(); setMobileMenuOpen(false) }} className={`sb-link${section === 'csrs' ? ' active' : ''}`}>
              <Icon paths={IC.user} size={14} style={{ color: section === 'csrs' ? 'var(--accent-primary)' : 'var(--text-faint)' }} />Manage Members
            </button>
            {user?.username === 'Moh' && (
              <button onClick={() => { setSection('logs'); setMobileMenuOpen(false) }} className={`sb-link${section === 'logs' ? ' active' : ''}`}>
                <Icon paths={IC.clock} size={14} style={{ color: section === 'logs' ? 'var(--accent-primary)' : 'var(--text-faint)' }} />Activity Monitor
              </button>
            )}
          </div>
        </nav>

        <div className="sb-foot">
          <div className="sb-avatar">{initials}</div>
          <div className="sb-user-info">
            <div className="sb-user-name">{adminName}</div>
            <div className="sb-user-role">Administrator</div>
          </div>
          <ThemeToggle />
          <button onClick={logout} title="Sign out" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-faint)', padding: 4, display: 'flex' }}><Icon paths={IC.logout} size={14} /></button>
        </div>
      </aside>

      {/* ═══ MAIN ═══ */}
      <div className="main">
        <header className="topbar">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button onClick={() => setMobileMenuOpen(true)} className="hamburger">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M3 12h18M3 6h18M3 18h18" /></svg>
            </button>
            <h1>{SECTIONS[section] || 'All Orders'}</h1>
          </div>
          <div className="topbar-actions">
            <div className="live-sync-indicator" title="Connected and syncing in real-time">
              <div className="live-sync-inner">
                <div className="live-sync-dot"></div> Live Sync
              </div>
            </div>
            {section === 'grid' && <button onClick={exportOrdersPDF} className="btn btn-ghost btn-sm"><Icon paths={IC.download} size={12} />Export PDF</button>}
            {section === 'reports' && <button onClick={exportReportPDF} className="btn btn-ghost btn-sm"><Icon paths={IC.pdf} size={12} />Export PDF</button>}
          </div>
        </header>

        <main className="content">
          {error && <div className="fb fb-err fade-in" style={{ display: 'flex', alignItems: 'center', gap: 8 }}><span className="dot" style={{ background: 'currentColor' }} />{error}</div>}

          {/* ── ALL ORDERS GRID ── */}
          {section === 'grid' && (
            <>
              <div className="toolbar fade-up">
                <div><label className="lbl">From</label><input type="date" value={dateFrom} onChange={e => { setDateFrom(e.target.value); setPage(1) }} className="inp" /></div>
                <div><label className="lbl">To</label><input type="date" value={dateTo} onChange={e => { setDateTo(e.target.value); setPage(1) }} className="inp" /></div>
                <div>
                  <label className="lbl">Completed By</label>
                  <select value={csrFilter} onChange={e => { setCsrFilter(e.target.value); setPage(1) }} className="inp" style={{ minWidth: 160 }}>
                    <option value="">All Users</option>
                    {completedByNames.map(n => <option key={n.display} value={n.display}>{n.display}</option>)}
                  </select>
                </div>
                <div style={{ flex: '1 1 200px' }}>
                  <label className="lbl">Search</label>
                  <div className="inp-icon-wrap">
                    <Icon paths={IC.search} size={14} />
                    <input ref={searchRef} type="text" placeholder="Search any field… (Ctrl+F)" value={search} onChange={e => { setSearch(e.target.value); setPage(1) }} className="inp" />
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <span style={{ fontSize: 12, color: 'var(--text-faint)' }}>{filtered.length} records</span>
                  {(dateFrom || dateTo || csrFilter || search) && (
                    <button onClick={() => { setDateFrom(''); setDateTo(''); setCsrFilter(''); setSearch(''); setPage(1) }} className="btn btn-ghost btn-sm">Reset</button>
                  )}
                </div>
              </div>

              {/* Bulk Action Bar */}
              {selectedIds.size > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px', background: 'var(--accent-primary)', borderRadius: 10, marginBottom: 12, animation: 'fadeUp 0.2s ease' }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#fff', flex: 1 }}>
                    {selectedIds.size} quer{selectedIds.size === 1 ? 'y' : 'ies'} selected
                  </span>
                  <button onClick={() => bulkUpdate('complete')} disabled={bulkBusy}
                    style={{ background: '#10b981', color: '#fff', border: 'none', borderRadius: 7, padding: '6px 14px', fontWeight: 600, fontSize: 12, cursor: 'pointer', opacity: bulkBusy ? 0.6 : 1 }}>
                    ✓ Mark Done
                  </button>
                  <button onClick={() => bulkUpdate('issue')} disabled={bulkBusy}
                    style={{ background: '#ef4444', color: '#fff', border: 'none', borderRadius: 7, padding: '6px 14px', fontWeight: 600, fontSize: 12, cursor: 'pointer', opacity: bulkBusy ? 0.6 : 1 }}>
                    ⚠ Mark Issue
                  </button>
                  <button onClick={() => setSelectedIds(new Set())}
                    style={{ background: 'rgba(255,255,255,0.15)', color: '#fff', border: 'none', borderRadius: 7, padding: '6px 12px', fontWeight: 600, fontSize: 12, cursor: 'pointer' }}>
                    ✕ Clear
                  </button>
                </div>
              )}

              <div className="panel fade-up">
                {loading ? (
                  <div style={{ height: 280, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, color: 'var(--text-faint)' }}>
                    <div className="spinner" style={{ width: 20, height: 20, border: '2px solid var(--border-strong)', borderTopColor: 'var(--text-main)', borderRadius: '50%' }} />
                    <span style={{ fontSize: 13 }}>Loading records…</span>
                  </div>
                ) : (
                  <div style={{ overflowX: 'auto', maxHeight: 'calc(100vh - 280px)', overflowY: 'auto' }}>
                    <table className="tbl">
                      <thead>
                        <tr>
                          <th style={{ width: 36, textAlign: 'center' }}>
                            <input type="checkbox" title="Select all visible"
                              checked={visible.length > 0 && visible.every(o => selectedIds.has(o.id))}
                              onChange={e => {
                                if (e.target.checked) setSelectedIds(prev => { const n = new Set(prev); visible.forEach(o => n.add(o.id)); return n })
                                else setSelectedIds(prev => { const n = new Set(prev); visible.forEach(o => n.delete(o.id)); return n })
                              }}
                            />
                          </th>
                          {GRID_COLS.map(c => <th key={c.key} style={{ minWidth: c.w }}>{c.label}</th>)}
                          <th style={{ minWidth: 80, textAlign: 'center' }}>History</th>
                        </tr>
                      </thead>
                      <tbody className="stagger">
                        {visible.length === 0 ? (
                          <tr><td colSpan={GRID_COLS.length} style={{ textAlign: 'center', padding: 60, color: 'var(--text-faint)' }}>No orders found.</td></tr>
                        ) : visible.map(o => (
                          <tr key={o.id} style={{ background: selectedIds.has(o.id) ? 'var(--bg-hover)' : undefined, transition: 'background 0.1s' }}>
                            <td style={{ textAlign: 'center' }}>
                              <input type="checkbox" checked={selectedIds.has(o.id)}
                                onChange={e => setSelectedIds(prev => {
                                  const n = new Set(prev)
                                  e.target.checked ? n.add(o.id) : n.delete(o.id)
                                  return n
                                })}
                              />
                            </td>
                            {GRID_COLS.map(c => {
                              const v = o[c.key]
                              if (c.key === 'status') {
                                const cfg = STATUS_CFG[v?.toLowerCase()] || { bg: 'transparent', color: 'var(--text-muted)', border: 'var(--border-strong)' }
                                return <td key={c.key}><span className="pill" style={{ background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}` }}><span className={`dot dot-${(v || '').toLowerCase()}`} style={{ background: 'currentColor' }} />{v || '—'}</span></td>
                              }
                              if (c.key === 'project_name') return <td key={c.key} className="cell-bold">{v || '—'}</td>
                              if (c.key === 'completed_by') return <td key={c.key} className="cell-bold">{v || '—'}</td>
                              return <td key={c.key} title={String(v ?? '')}>{v || <span className="cell-muted">—</span>}</td>
                            })}
                            <td style={{ textAlign: 'center', display: 'flex', gap: '4px', justifyContent: 'center' }}>
                              <button onClick={() => setTimelineOrder(o)} title="View Query Timeline"
                                style={{ background: 'none', border: '1px solid var(--border-subtle)', borderRadius: 6, cursor: 'pointer', padding: '4px 8px', color: 'var(--accent-primary)', fontSize: 11, fontWeight: 600, transition: 'all 0.15s' }}
                                onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
                                onMouseLeave={e => e.currentTarget.style.background = 'none'}
                              >⏱ Log</button>
                              {o.slack_ts && (
                                <button onClick={() => setSlackThreadOrder(o)} title="View Slack Thread"
                                  style={{ background: 'none', border: '1px solid var(--border-subtle)', borderRadius: 6, cursor: 'pointer', padding: '4px 8px', color: '#10b981', fontSize: 11, fontWeight: 600, transition: 'all 0.15s' }}
                                  onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
                                  onMouseLeave={e => e.currentTarget.style.background = 'none'}
                                >💬 Chat</button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {!loading && totalPages > 1 && (
                <div className="pager">
                  <span className="pager-info">Page {page} of {totalPages}</span>
                  <div className="pager-btns">
                    <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="btn btn-ghost btn-sm"><Icon paths={IC.chevL} size={12} /> Prev</button>
                    <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="btn btn-ghost btn-sm">Next <Icon paths={IC.chevR} size={12} /></button>
                  </div>
                </div>
              )}
            </>
          )}
          {/* ── COMMAND CENTER ── */}
          {section === 'cmd' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-main)', margin: 0 }}>Command Center</h2>
                <button onClick={generateExecReport} className="btn btn-primary" style={{ padding: '8px 16px', fontSize: 13 }}>
                  <Icon paths={IC.pdf} size={16} /> Export Executive Report
                </button>
              </div>

              <div id="exec-report-node" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                <div className="metrics stagger">
                <div className="metric">
                  <div className="metric-title">Total Orders</div>
                  <div className="metric-val">{orders.length}</div>
                </div>
                <div className="metric">
                  <div className="metric-title">Completed Today</div>
                  <div className="metric-val cell-good">{orders.filter(o => o.query_done && o.date === getPKTDateStr()).length}</div>
                </div>
                <div className="metric">
                  <div className="metric-title">Pending Issues</div>
                  <div className="metric-val cell-bad">{orders.filter(o => String(o.status || '').toLowerCase() === 'issue').length}</div>
                </div>
                <div className="metric">
                  <div className="metric-title">Active Members</div>
                  <div className="metric-val" style={{ color: 'var(--accent-primary)' }}>{csrList.filter(c => c.status === 'yes').length}</div>
                </div>
              </div>

              {stagnantOrders.length > 0 && (
                <div className="panel fade-up" style={{ borderColor: 'var(--status-danger)', borderWidth: 1 }}>
                  <div className="panel-head" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Icon paths={IC.clock} size={18} style={{ color: 'var(--status-danger)' }} />
                      <h3 style={{ color: 'var(--status-danger)', fontWeight: 600, fontSize: 15 }}>Stagnant Orders ({stagnantOrders.length})</h3>
                    </div>
                    <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Unresolved &gt; 24h</span>
                  </div>
                  <div style={{ padding: '20px 24px', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
                    {stagnantOrders.map(o => (
                      <div key={o.id} className="alert-card-danger">
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-main)', letterSpacing: '-0.01em' }}>{o['propery-order'] || `Order #${o.id}`}</span>
                            <span className="alert-badge">{o._aging_hours}h</span>
                          </div>
                          <div style={{ fontSize: 13, color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: 2 }}>
                            <span><strong>Status:</strong> {o.status || 'Pending'}</span>
                            <span><strong>Assigned:</strong> {o.completed_by || 'Unassigned'}</span>
                            <span><strong>Project:</strong> {o.project_name || 'N/A'}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
                <div className="panel fade-up">
                  <div className="panel-head"><h3>Daily Volume (Last 14 Days)</h3></div>
                  <div style={{ height: 300, padding: 16 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={chartDataVolume}>
                        <defs>
                          <linearGradient id="colorVol" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="var(--accent-primary)" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="var(--accent-primary)" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-subtle)" />
                        <XAxis dataKey="date" tick={{ fill: 'var(--text-faint)', fontSize: 12 }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fill: 'var(--text-faint)', fontSize: 12 }} axisLine={false} tickLine={false} />
                        <RechartsTooltip contentStyle={{ backgroundColor: 'var(--bg-panel)', border: '1px solid var(--border-strong)', borderRadius: '8px', color: 'var(--text-main)' }} />
                        <Area type="monotone" dataKey="queries" stroke="var(--accent-primary)" strokeWidth={3} fillOpacity={1} fill="url(#colorVol)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="panel fade-up" style={{ animationDelay: '0.1s' }}>
                  <div className="panel-head"><h3>Status Distribution</h3></div>
                  <div style={{ height: 300, padding: 16 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={chartDataStatus} innerRadius={70} outerRadius={110} paddingAngle={4} dataKey="value">
                          {chartDataStatus.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} stroke="var(--bg-panel)" strokeWidth={2} />
                          ))}
                        </Pie>
                        <RechartsTooltip contentStyle={{ backgroundColor: 'var(--bg-panel)', border: '1px solid var(--border-strong)', borderRadius: '8px', color: 'var(--text-main)' }} />
                        <Legend wrapperStyle={{ fontSize: 13, color: 'var(--text-main)' }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="panel fade-up" style={{ gridColumn: '1 / -1', animationDelay: '0.2s' }}>
                  <div className="panel-head"><h3>Top CSR Performance</h3></div>
                  <div style={{ height: 320, padding: 16 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartDataCsr} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-subtle)" />
                        <XAxis dataKey="name" tick={{ fill: 'var(--text-faint)', fontSize: 12 }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fill: 'var(--text-faint)', fontSize: 12 }} axisLine={false} tickLine={false} />
                        <RechartsTooltip cursor={{ fill: 'var(--bg-sunken)' }} contentStyle={{ backgroundColor: 'var(--bg-panel)', border: '1px solid var(--border-strong)', borderRadius: '8px', color: 'var(--text-main)' }} />
                        <Legend wrapperStyle={{ fontSize: 13, color: 'var(--text-main)' }} />
                        <Bar dataKey="done" name="Completed Orders" fill="var(--status-success)" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="issues" name="Amendments" fill="var(--status-warning)" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </div>
            </div>
          )}

          {/* ── REPORTS ── */}
          {section === 'reports' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              <div className="toolbar fade-up">
                <div><label className="lbl">From Date</label><input type="date" value={reportFrom} onChange={e => setReportFrom(e.target.value)} className="inp" /></div>
                <div><label className="lbl">To Date</label><input type="date" value={reportTo} onChange={e => setReportTo(e.target.value)} className="inp" /></div>
                <div><label className="lbl">Completed By</label>
                  <select value={reportCsr} onChange={e => setReportCsr(e.target.value)} className="inp" style={{ minWidth: 160 }}>
                    <option value="">All Users</option>
                    {completedByNames.map(n => <option key={n.display} value={n.display}>{n.display}</option>)}
                  </select>
                </div>
                <div style={{ flex: 1 }} />
                <span style={{ fontSize: 13, color: 'var(--text-faint)' }}>{reportOrders.length.toLocaleString()} completed</span>
              </div>

              {[
                {
                  title: 'Summary', hint: 'Click a row for details', cols: ['User', 'Total', 'New', 'Amend', ''], render: u => (
                    <tr key={u.name} className="stagger" style={{ cursor: 'pointer' }} onClick={() => setDrillUser(u)}>
                      <td className="cell-bold">{u.name}</td>
                      <td style={{ textAlign: 'center', fontWeight: 600 }}>{u.total}</td>
                      <td style={{ textAlign: 'center' }} className="cell-good">{u.newOrd}</td>
                      <td style={{ textAlign: 'center' }} className="cell-warn">{u.amend}</td>
                      <td style={{ textAlign: 'center' }}><Icon paths={IC.arrowR} size={12} /></td>
                    </tr>
                  )
                },
                {
                  title: 'First Reply Distribution', cols: ['User', '≤5m', '5-15m', '15-30m', '>30m', 'N/A'], render: u => (
                    <tr key={u.name} style={{ cursor: 'pointer' }} onClick={() => setDrillUser(u)}>
                      <td className="cell-bold">{u.name}</td>
                      <td style={{ textAlign: 'center' }} className="cell-good">{u.reply_5}</td>
                      <td style={{ textAlign: 'center' }} className="cell-good">{u.reply_15}</td>
                      <td style={{ textAlign: 'center' }} className="cell-muted">{u.reply_30}</td>
                      <td style={{ textAlign: 'center' }} className={u.reply_over30 > 0 ? 'cell-bad' : 'cell-muted'}>{u.reply_over30}</td>
                      <td style={{ textAlign: 'center' }} className="cell-muted">{u.reply_na}</td>
                    </tr>
                  )
                },
                {
                  title: 'Completion Time Distribution', cols: ['User', '≤45m', '≤2h', '≤6h', '≤8h', '≤12h', '>12h'], render: u => (
                    <tr key={u.name} style={{ cursor: 'pointer' }} onClick={() => setDrillUser(u)}>
                      <td className="cell-bold">{u.name}</td>
                      <td style={{ textAlign: 'center' }} className="cell-good">{u.done_45m}</td>
                      <td style={{ textAlign: 'center' }} className="cell-good">{u.done_2h}</td>
                      <td style={{ textAlign: 'center' }} className="cell-muted">{u.done_6h}</td>
                      <td style={{ textAlign: 'center' }} className="cell-muted">{u.done_8h}</td>
                      <td style={{ textAlign: 'center' }} className="cell-muted">{u.done_12h}</td>
                      <td style={{ textAlign: 'center' }} className={u.done_over12 > 0 ? 'cell-bad' : 'cell-muted'}>{u.done_over12}</td>
                    </tr>
                  )
                },
              ].map(t => (
                <div className="panel fade-up" key={t.title}>
                  <div className="panel-head"><h3>{t.title}</h3>{t.hint && <span className="panel-hint">{t.hint}</span>}</div>
                  <div style={{ overflowX: 'auto' }}>
                    <table className="tbl">
                      <thead><tr>{t.cols.map((h, i) => <th key={i} style={{ textAlign: i > 0 ? 'center' : 'left' }}>{h}</th>)}</tr></thead>
                      <tbody>{sorted.length === 0 ? <tr><td colSpan={t.cols.length} style={{ textAlign: 'center', padding: 48, color: 'var(--text-faint)' }}>No data.</td></tr> : sorted.map(t.render)}</tbody>
                    </table>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ── CSR & ADMIN ACCOUNTS ── */}
          {section === 'csrs' && (
            <div className="panel fade-up">
              <div className="panel-head">
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-main)' }}>Team Members</span>
                  <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>({csrList.length})</span>
                </div>
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table className="tbl">
                  <thead>
                    <tr>{['ID', 'Role', 'Full Name', 'Username', 'Status', ''].map(h => <th key={h}>{h}</th>)}</tr>
                  </thead>
                  <tbody className="stagger">
                    {csrList.length === 0 ? (
                      <tr><td colSpan={6} style={{ textAlign: 'center', padding: 48, color: 'var(--text-faint)' }}>No accounts found.</td></tr>
                    ) : csrList.map(c => (
                      <tr key={`${c.role}_${c.id}`}>
                        <td>{c.id}</td>
                        <td>
                          <span className={`pill ${c.role === 'admin' ? 'pill-warning' : 'pill-info'}`}>
                            {c.role === 'admin' ? 'ADMIN' : 'CSR'}
                          </span>
                        </td>
                        <td className="cell-bold">{c.name}</td>
                        <td>{c.username}</td>
                        <td>
                          <span className={`pill ${c.status === 'yes' ? 'pill-success' : 'pill-danger'}`}>
                            <span className={`dot ${c.status === 'yes' ? '' : 'dot-pulse'}`} style={{ background: 'currentColor' }} />
                            {c.status === 'yes' ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: 8 }}>
                            {c.role === 'csr' && (
                              <>
                                <button onClick={() => { setEditCsr({ d_id: c.id }); setEForm({ name: c.name || '', username: c.username || '', password: '', status: c.status || 'yes' }); setEFb(null) }} className="btn btn-ghost btn-sm">Edit</button>
                                <button onClick={() => setDelCsr({ d_id: c.id })} className="btn btn-danger-outline btn-sm">Remove</button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── ACTIVITY MONITOR ── */}
          {section === 'logs' && user?.username === 'Moh' && (
            <div className="panel fade-up">
              <div className="panel-head" style={{ flexWrap: 'wrap', gap: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-main)' }}>System Activity Monitor</span>
                  <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>({logs.filter(l => (!logFilterUser || l.username === logFilterUser) && (!logFilterAction || l.action === logFilterAction)).length})</span>
                  {logsLoading && <span className="dot dot-pulse" style={{ background: 'var(--accent-primary)', marginLeft: 8 }} />}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1, justifyContent: 'flex-end' }}>
                  <select value={logFilterUser} onChange={e => setLogFilterUser(e.target.value)} className="inp" style={{ padding: '6px 10px', fontSize: 12 }}>
                    <option value="">All Users</option>
                    {Array.from(new Set(logs.map(l => l.username))).map(u => <option key={u} value={u}>{u}</option>)}
                  </select>
                  <select value={logFilterAction} onChange={e => setLogFilterAction(e.target.value)} className="inp" style={{ padding: '6px 10px', fontSize: 12 }}>
                    <option value="">All Actions</option>
                    {Array.from(new Set(logs.map(l => l.action))).map(a => <option key={a} value={a}>{a}</option>)}
                  </select>
                  <button onClick={exportLogsPDF} className="btn btn-ghost btn-sm">
                    <Icon paths={IC.download} size={12} />Export PDF
                  </button>
                </div>
              </div>
              <div style={{ overflowX: 'auto', maxHeight: 600 }}>
                <table className="tbl">
                  <thead style={{ position: 'sticky', top: 0, zIndex: 2 }}>
                    <tr>{['ID', 'Time (PKT)', 'User', 'Role', 'Action', 'Details'].map(h => <th key={h}>{h}</th>)}</tr>
                  </thead>
                  <tbody className="stagger">
                    {logs.filter(l => (!logFilterUser || l.username === logFilterUser) && (!logFilterAction || l.action === logFilterAction)).length === 0 ? (
                      <tr><td colSpan={6} style={{ textAlign: 'center', padding: 48, color: 'var(--text-faint)' }}>No activity logs match filters.</td></tr>
                    ) : logs.filter(l => (!logFilterUser || l.username === logFilterUser) && (!logFilterAction || l.action === logFilterAction)).map(l => (
                      <tr key={l.id}>
                        <td>{l.id}</td>
                        <td className="cell-muted">{l.timestamp_pkt}</td>
                        <td className="cell-bold">{l.username}</td>
                        <td><span className={`pill ${l.role === 'admin' ? 'pill-warning' : 'pill-info'}`}>{l.role.toUpperCase()}</span></td>
                        <td><span className="pill pill-success">{l.action}</span></td>
                        <td style={{ maxWidth: 400, whiteSpace: 'normal' }}>{l.details}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* ═══ MODALS ═══ */}

      {/* Edit CSR */}
      {editCsr && (
        <>
          <div className="overlay" onClick={() => !eBusy && setEditCsr(null)} />
          <div className="dialog-wrap">
            <div className="dialog" style={{ maxWidth: 420 }} onClick={e => e.stopPropagation()}>
              <div className="dialog-head">
                <h2>Edit CSR: {editCsr.dname}</h2>
                <button className="dialog-close" onClick={() => !eBusy && setEditCsr(null)}><Icon paths={IC.close} size={16} /></button>
              </div>
              <form onSubmit={handleEditCsr} className="dialog-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {[{ l: 'Full Name', k: 'name', t: 'text' }, { l: 'Username', k: 'username', t: 'text' }, { l: 'New Password (blank to keep)', k: 'password', t: 'text' }].map(f => (
                  <div key={f.k}><label className="lbl">{f.l}</label><input type={f.t} value={eForm[f.k]} onChange={e => setEForm(p => ({ ...p, [f.k]: e.target.value }))} className="inp" /></div>
                ))}
                <div>
                  <label className="lbl">Status</label>
                  <div style={{ display: 'flex', gap: 8 }}>
                    {[{ v: 'yes', l: 'Active' }, { v: 'no', l: 'Inactive' }].map(s => (
                      <button key={s.v} type="button" onClick={() => setEForm(p => ({ ...p, status: s.v }))} style={{ flex: 1, padding: 8, borderRadius: 8, border: `1.5px solid ${eForm.status === s.v ? 'var(--text-main)' : 'var(--border-strong)'}`, background: eForm.status === s.v ? 'var(--text-main)' : 'var(--bg-base)', color: eForm.status === s.v ? 'var(--bg-panel)' : 'var(--text-main)', fontSize: 12, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }}>{s.l}</button>
                    ))}
                  </div>
                </div>
                {eFb && <div className={`fb ${eFb.ok ? 'fb-ok' : 'fb-err'}`}>{eFb.msg}</div>}
                <button type="submit" disabled={eBusy} className="btn btn-primary" style={{ width: '100%', padding: 11, marginTop: 8 }}>{eBusy ? 'Saving…' : 'Save Changes'}</button>
              </form>
            </div>
          </div>
        </>
      )}

      {/* Delete CSR */}
      {delCsr && (
        <>
          <div className="overlay" onClick={() => !delBusy && setDelCsr(null)} />
          <div className="dialog-wrap">
            <div className="dialog" style={{ maxWidth: 380, padding: 28, textAlign: 'center' }} onClick={e => e.stopPropagation()}>
              <h2 style={{ fontSize: 16, fontWeight: 600, margin: '0 0 12px' }}>Remove CSR</h2>
              <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: '0 0 24px' }}>Remove <strong className="cell-bold">{delCsr.dname}</strong> entirely?</p>
              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={() => setDelCsr(null)} disabled={delBusy} className="btn btn-ghost" style={{ flex: 1, padding: 10 }}>Cancel</button>
                <button onClick={handleDeleteCsr} disabled={delBusy} className="btn btn-warn" style={{ flex: 1, padding: 10 }}>{delBusy ? 'Removing…' : 'Remove'}</button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Add User/Admin */}
      {(addCsr || addAdmin) && (
        <>
          <div className="overlay" onClick={() => { if (!mBusy) { setAddCsr(false); setAddAdmin(false) } }} />
          <div className="dialog-wrap">
            <div className="dialog" style={{ maxWidth: 420 }} onClick={e => e.stopPropagation()}>
              <div className="dialog-head">
                <h2>{addCsr ? 'Add CSR' : 'Add Admin'}</h2>
                <button className="dialog-close" onClick={() => { setAddCsr(false); setAddAdmin(false) }}><Icon paths={IC.close} size={16} /></button>
              </div>
              <form onSubmit={addCsr ? handleAddUser : handleAddAdmin} className="dialog-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {[{ l: addCsr ? 'Full Name' : 'Display Name', k: 'name', t: 'text' }, { l: addCsr ? 'Username' : 'Login Username', k: 'username', t: 'text' }, { l: 'Password', k: 'password', t: 'text' }].map(f => (
                  <div key={f.k}><label className="lbl">{f.l}</label><input type={f.t} value={mForm[f.k]} onChange={e => setMForm(p => ({ ...p, [f.k]: e.target.value }))} required className="inp" /></div>
                ))}
                {mFb && <div className={`fb ${mFb.ok ? 'fb-ok' : 'fb-err'}`}>{mFb.msg}</div>}
                <button type="submit" disabled={mBusy} className="btn btn-primary" style={{ width: '100%', padding: 11, marginTop: 8 }}>{mBusy ? 'Creating…' : 'Create Account'}</button>
              </form>
            </div>
          </div>
        </>
      )}

    </div>
  )
}




