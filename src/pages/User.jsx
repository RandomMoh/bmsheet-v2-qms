import { useEffect, useState, useMemo, useRef, useCallback, memo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import ThemeToggle from '../ThemeToggle'
import SlackThreadViewer from '../SlackThreadViewer'
import { User as UserIcon } from 'lucide-react'


const Icon = memo(function Icon({ paths, size = 16, style = {} }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" style={style}>
      {(Array.isArray(paths) ? paths : [paths]).map((d, i) => <path key={i} d={d} />)}
    </svg>
  )
})
const IC = {
  bolt: ['M13 2L3 14h9l-1 8 10-12h-9l1-8z'],
  mail: ['M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z', 'M22 6l-10 7L2 6'],
  check: ['M22 11.08V12a10 10 0 1 1-5.93-9.14', 'M22 4L12 14.01l-3-3'],
  user: ['M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2', 'M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z'],
  plus: ['M12 5v14', 'M5 12h14'],
  search: ['M11 17.25a6.25 6.25 0 1 1 0-12.5 6.25 6.25 0 0 1 0 12.5z', 'M16 16l4.5 4.5'],
  logout: ['M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4', 'M16 17l5-5-5-5', 'M21 12H9'],
  clock: ['M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z', 'M12 6v6l4 2'],
  eye: ['M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z', 'M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z'],
  chevL: ['M15 18l-6-6 6-6'],
  chevR: ['M9 18l6-6-6-6'],
  chevD: ['M6 9l6 6 6-6'],
  bell: ['M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9', 'M13.73 21a2 2 0 0 1-3.46 0'],
  chart: ['M18 20V10', 'M12 20V4', 'M6 20v-6'],
  arrowR: ['M5 12h14', 'M12 5l7 7-7 7'],
  close: ['M18 6L6 18', 'M6 6l12 12'],
  download: ['M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4', 'M7 10l5 5 5-5', 'M12 15V3'],
  pdf: ['M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z', 'M14 2v6h6', 'M16 13H8', 'M16 17H8', 'M10 9H8'],
}

const MEDIUMS = ['Slack', 'Skype', 'MS Teams', 'BR Outlook Account', 'Outlook Email Order Account', 'Outlook Email BM Support Account', 'Outlook Email Portal Account', 'Queries Center Gmail', 'HelpScout', 'Focal MP Mailbox', 'TD Support Email', 'Cubi Chat', 'PHOTO BR OUTLOOK MAIL', 'FP BR OUTLOOK MAIL']
const COUNTRY_MAP = {
  'UK': [
    { p: 'Focal CRM', d: 'Photo Enhancement' },
    { p: 'PB', d: 'Photo Enhancement' },
    { p: 'Prestige', d: 'Photo Enhancement' },
    { p: 'HDR', d: 'Photo Enhancement' },
    { p: 'Code', d: 'Photo Enhancement' },
    { p: 'Single', d: 'Photo Enhancement' },
    { p: 'Scan', d: 'Photo Enhancement' },
    { p: 'JH', d: 'Photo Enhancement' },
    { p: 'AH', d: 'Photo Enhancement' },
    { p: 'GF', d: 'Photo Enhancement' },
    { p: 'BR', d: 'Photo Enhancement' },

    { p: 'PB', d: 'Floor Plan' },
    { p: 'Code', d: 'Floor Plan' },
    { p: 'Focal MP', d: 'Floor Plan' },
    { p: 'Single', d: 'Floor Plan' },
    { p: 'Capture', d: 'Floor Plan' },
    { p: 'Simple', d: 'Floor Plan' },
    { p: 'BB', d: 'Floor Plan' },
    { p: 'MA', d: 'Floor Plan' },
    { p: 'CB', d: 'Floor Plan' },
    { p: 'Scan', d: 'Floor Plan' },
    { p: 'Creative', d: 'Floor Plan' },
    { p: 'JH', d: 'Floor Plan' },
    { p: 'HC', d: 'Floor Plan' },
    { p: 'CT', d: 'Floor Plan' },
    { p: 'AH', d: 'Floor Plan' },
    { p: 'GF', d: 'Floor Plan' },
    { p: 'BR', d: 'Floor Plan' },
    { p: 'GP', d: 'Floor Plan' },
    { p: 'ME', d: 'Floor Plan' },
    { p: 'Now', d: 'Floor Plan' },

    { p: 'PB', d: 'Video Editing' },
    { p: 'Focal', d: 'Video Editing' },
    { p: 'Focal Video', d: 'Video Editing' },

    { p: 'Capture', d: 'Virtual Staging' },
    { p: 'Code', d: 'Virtual Staging' }
  ],
  'AUS': [
    { p: 'PRO', d: 'Photo Enhancement' },
    { p: 'FS', d: 'Photo Enhancement' },
    { p: 'Metro', d: 'Photo Enhancement' },
    { p: 'HSA', d: 'Photo Enhancement' },

    { p: 'TIFF', d: 'Floor Plan' },
    { p: 'CK', d: 'Floor Plan' },
    { p: 'REFP', d: 'Floor Plan' },
    { p: 'SB', d: 'Floor Plan' },
    { p: 'PRO', d: 'Floor Plan' },
    { p: 'TQ', d: 'Floor Plan' },
    { p: 'SM', d: 'Floor Plan' },
    { p: 'SKM', d: 'Floor Plan' },
    { p: 'MD', d: 'Floor Plan' },
    { p: 'FS', d: 'Floor Plan' },
    { p: 'JL', d: 'Floor Plan' },
    { p: 'Mi', d: 'Floor Plan' },
    { p: 'Metro', d: 'Floor Plan' },
    { p: 'xactimate', d: 'Floor Plan' },
    { p: 'roomio', d: 'Floor Plan' },
    { p: 'schematic', d: 'Floor Plan' },
    { p: 'Faro', d: 'Floor Plan' },
    { p: 'HSA', d: 'Floor Plan' },

    { p: 'HSA', d: 'Video Editing' },

    { p: 'PRO', d: 'Virtual Staging' },
    { p: 'Metro', d: 'Virtual Staging' },
    { p: 'HSA', d: 'Virtual Staging' },
    { p: 'TIFF', d: 'Virtual Staging' }
  ],
  'SA': [
    { p: 'SA', d: 'Photo Enhancement' },
    
    { p: 'SA', d: 'Floor Plan' },
    { p: 'FF', d: 'Floor Plan' },
    
    { p: 'SA', d: 'Video Editing' }
  ],
  'Canada / US': [
    { p: 'HM', d: 'Photo Enhancement' },
    { p: 'Open House', d: 'Photo Enhancement' },

    { p: 'HM', d: 'Floor Plan' },
    { p: 'Open House', d: 'Floor Plan' },
    { p: 'WIN', d: 'Floor Plan' },
    { p: 'Nat3D', d: 'Floor Plan' },
    { p: 'PM', d: 'Floor Plan' },

    { p: 'HM', d: 'Video Editing' },
    { p: 'PM', d: 'Video Editing' }
  ],
  'Veitnam': [
    { p: 'Cubi', d: 'Photo Enhancement' },
    { p: 'Esoft', d: 'Photo Enhancement' },

    { p: 'Cubi', d: 'Floor Plan', label: 'Cubi - 2D Floor Plan' },
    { p: 'Cubi', d: '3D Floor Plan', label: 'Cubi - 3D Floor Plan' },
    { p: 'Esoft', d: 'Floor Plan', label: 'Esoft - 2D Floor Plan' },
    { p: 'Esoft', d: '3D Floor Plan', label: 'Esoft - 3D Floor Plan' },

    { p: 'Esoft', d: 'Video Editing' }
  ]
};

const COUNTRIES = Object.keys(COUNTRY_MAP);
const ALL_PROJECTS = [...new Set(Object.values(COUNTRY_MAP).flatMap(c => c.map(i => i.p)))];
const DEPTS = ['Floor Plan', 'Photo Enhancement', '3D Floor Plan', 'Video Editing', 'Virtual Staging']
const PROJECTS = ALL_PROJECTS
const TYPES = ['Amend', 'New Order']
const API = import.meta.env.VITE_API_BASE_URL
const NAVS = [
  { id: 'qms_dashboard', label: 'Dashboard', icon: IC.chart },
  { id: 'current', label: 'Current Queue', icon: IC.bolt },
  { id: 'issue', label: 'Emailed / Issue', icon: IC.mail },
  { id: 'done', label: 'Done Queries', icon: IC.check },
  { id: 'reports', label: 'Legacy Reports', icon: IC.chart },
  { id: 'profile', label: 'Profile', icon: IC.user },
]

function fmtDt(s) {
  if (!s) return '—'
  const d = new Date(s); if (isNaN(d)) return s
  const mon = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][d.getMonth()]
  let h = d.getHours(), ap = h >= 12 ? 'PM' : 'AM'; h = h % 12 || 12
  return `${d.getDate()} ${mon}, ${h}:${String(d.getMinutes()).padStart(2, '0')} ${ap}`
}
function elapsedStr(from, to = Date.now()) {
  const ms = (typeof to === 'number' ? to : new Date(to).getTime()) - new Date(from).getTime()
  if (ms < 0) return '—'
  const s = Math.floor(ms / 1000), m = Math.floor(s / 60), h = Math.floor(m / 60), d = Math.floor(h / 24)
  if (d > 0) return `${d}d ${h % 24}h`
  if (h > 0) return `${h}h ${m % 60}m`
  return `${m}m ${s % 60}s`
}
function nowPKT() {
  const d = new Date(), p = n => String(n).padStart(2, '0')
  return { date: `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`, h: d.getHours() % 12 || 12, m: d.getMinutes(), ap: d.getHours() >= 12 ? 'PM' : 'AM' }
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
function parseDurH(s) {
  if (!s || s === '—') return 0
  let h = 0
  if (s.includes('d')) { const [d, rest] = s.split('d '); h += parseInt(d) * 24; s = rest }
  if (s.includes('h')) { const [hr] = s.split('h'); h += parseInt(hr) }
  return h
}
const getCountryForProject = (proj, dept) => {
  if (!proj || !dept || proj === 'Unknown' || dept === 'Unknown') return '—'
  const pLower = String(proj).trim().toLowerCase();
  const dLower = String(dept).trim().toLowerCase();
  for (const [country, items] of Object.entries(COUNTRY_MAP)) {
    if (items.some(i => i.p.toLowerCase() === pLower && i.d.toLowerCase() === dLower)) return country;
  }
  return '—';
}
function initUserStats(byUser, name) {
  if (!byUser[name]) byUser[name] = {
    name, total: 0, enteredTotal: 0, completedTotal: 0, newOrd: 0, amend: 0, pending: 0, orders: [],
    projDepts: {}, types: {}, botCompleted: 0, botAssigned: 0,
    reply_5: 0, reply_15: 0, reply_30: 0, reply_1h: 0, reply_over1h: 0, reply_na: 0,
    done_45m: 0, done_2h: 0, done_4h: 0, done_8h: 0, done_12h: 0, done_over12: 0,
  }
}

function classifyOrder(o, byUser, firstOwner, completionOwner) {
  const cName = completionOwner || 'Unassigned'
  initUserStats(byUser, cName)
  const cU = byUser[cName]
  cU.total++
  cU.orders.push(o)
  const type = (o.type || '').toLowerCase()
  if (type.includes('new')) cU.newOrd++
  else if (type.includes('amend')) cU.amend++
  const dept = o.department || 'Unknown'
  const proj = o.project_name || 'Unknown'
  const tp = o.type || 'Unknown'
  const pd = `${proj} - ${dept}`
  cU.projDepts[pd] = (cU.projDepts[pd] || 0) + 1
  cU.types[tp] = (cU.types[tp] || 0) + 1

  const dm = diffMin(o['query-received_datetime'], o.query_done)
  if (dm !== null) {
    if (dm <= 45) cU.done_45m++
    else if (dm <= 120) cU.done_2h++
    else if (dm <= 240) cU.done_4h++
    else if (dm <= 480) cU.done_8h++
    else if (dm <= 720) cU.done_12h++
    else cU.done_over12++
  }

  const fName = firstOwner || 'Unassigned'
  initUserStats(byUser, fName)
  const fU = byUser[fName]
  const rm = diffMin(o['query-received_datetime'], o['query-first-reply_datetime'])
  if (!o['query-first-reply_datetime'] || rm === null) fU.reply_na++
  else if (rm <= 5) fU.reply_5++
  else if (rm <= 15) fU.reply_15++
  else if (rm <= 30) fU.reply_30++
  else if (rm <= 60) fU.reply_1h++
  else fU.reply_over1h++
}

const API_URL = import.meta.env.VITE_API_BASE_URL
function QueryTimeline({ order, onClose }) {
  const [events, setEvents] = useState(null)
  useEffect(() => {
    fetch(`${API_URL}/get-query-history.php?order_id=${order.id}`)
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
    const mon = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][d.getMonth()]
    let h = d.getHours(), ap = h >= 12 ? 'PM' : 'AM'; h = h % 12 || 12
    return `${d.getDate()} ${mon} ${d.getFullYear()}, ${h}:${String(d.getMinutes()).padStart(2,'0')} ${ap}`
  }
  const fieldLabel = (f) => {
    const m = { status: 'Status', completed_by: 'Assigned To', instruction: 'Note', project_name: 'Project', department: 'Department' }
    return m[f] || f
  }
  return (
    <>
      <div className="timeline-drawer-overlay" onClick={onClose} />
      <div className="timeline-drawer" role="dialog">
        <div className="timeline-drawer-header">
          <div>
            <h2>Query Timeline</h2>
            <p>Order #{order.id} &nbsp;·&nbsp; {order['propery-order'] || '—'}</p>
          </div>
          <button className="timeline-close-btn" onClick={onClose}>
            <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12" /></svg>
          </button>
        </div>
        <div className="timeline-body">
          {events === null ? (
            <div className="timeline-empty"><p>Loading…</p></div>
          ) : events.length === 0 ? (
            <div className="timeline-empty">
              <svg width={40} height={40} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}><path d="M12 8v4l3 3m6-3a9 9 0 1 1-18 0 9 9 0 0 1 18 0z"/></svg>
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

function buildReport(orders, completedByNames) {
  const byUser = {}
  orders.filter(o => o.query_done).forEach(o => {
    let enterer = (o.qname || '').trim()
    if (!enterer) enterer = 'Unassigned'
    else if (completedByNames && completedByNames.length) {
      const match = completedByNames.find(c => c.values && c.values.includes(enterer))
      if (match) enterer = match.display
    }

    let completer = (o.completed_by || '').trim()
    if (!completer) completer = 'Unassigned'

    const isSlack = (o.communication_medium === 'Slack' || (o.qname || '').toLowerCase().includes('slack'))
    
    const completionOwner = isSlack ? completer : enterer
    const firstOwner = enterer

    classifyOrder(o, byUser, firstOwner, completionOwner)

    if (!isSlack) {
      initUserStats(byUser, enterer)
      byUser[enterer].enteredTotal++
    }
    initUserStats(byUser, completer)
    byUser[completer].completedTotal++
    if (isSlack) {
      byUser[completer].botCompleted++
      byUser[completer].botAssigned++
    }
  })
  return byUser
}

function buildReportWithPending(orders, completedByNames) {
  const byUser = {}

  orders.forEach(o => {
    let enterer = (o.qname || '').trim()
    if (!enterer) enterer = 'Unassigned'
    else if (completedByNames && completedByNames.length) {
      const match = completedByNames.find(c => c.values && c.values.includes(enterer))
      if (match) enterer = match.display
    }

    let completer = (o.completed_by || '').trim()
    if (!completer) completer = 'Unassigned'

    const isSlack = (o.communication_medium === 'Slack' || (o.qname || '').toLowerCase().includes('slack'))
    const completionOwner = isSlack ? completer : enterer
    const firstOwner = enterer

    initUserStats(byUser, completionOwner)
    initUserStats(byUser, enterer)
    initUserStats(byUser, completer)

    const isDone = o.query_done || (o.status && o.status.toLowerCase() === 'completed')

    if (isDone) {
      classifyOrder(o, byUser, firstOwner, completionOwner)
      if (!isSlack) byUser[enterer].enteredTotal++
      byUser[completer].completedTotal++
      if (isSlack) {
        byUser[completer].botCompleted++
        byUser[completer].botAssigned++
      }
    } else {
      if (completer !== 'Unassigned') {
        byUser[completer].pending++
        if (isSlack) byUser[completer].botAssigned++
      } else {
        byUser[enterer].pending++
      }
    }
  })
  
  return byUser
}

async function exportUserPDF(u) {
  const [{ default: jsPDF }, { default: autoTable }] = await Promise.all([import('jspdf'), import('jspdf-autotable')])
  const doc = new jsPDF('p')
  
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(22)
  doc.setTextColor(20, 20, 20)
  doc.text(u.name, 14, 24)
  
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(120, 120, 120)
  doc.text(`Performance Report   //   Generated: ${new Date().toLocaleString()}`, 14, 32)

  autoTable(doc, {
    startY: 42,
    theme: 'plain',
    head: [['Total Credit', 'Entered', 'Completed', 'New', 'Amend']],
    body: [[u.total, u.enteredTotal, u.completedTotal, u.newOrd, u.amend]],
    headStyles: { textColor: [120, 120, 120], fontSize: 8, fontStyle: 'bold', cellPadding: { top: 4, bottom: 4 } },
    bodyStyles: { textColor: [20, 20, 20], fontSize: 16, fontStyle: 'bold' },
    styles: { cellPadding: 2 },
    margin: { left: 14 }
  })

  autoTable(doc, {
    startY: doc.lastAutoTable.finalY + 16,
    theme: 'plain',
    head: [['1st Reply Time', '<5m', '5-15m', '15-30m', '>30m', 'N/A']],
    body: [['Count', u.reply_5, u.reply_15, u.reply_30, u.reply_over30, u.reply_na]],
    headStyles: { textColor: [20, 20, 20], fontSize: 8, fontStyle: 'bold', halign: 'center' },
    bodyStyles: { fontSize: 10, halign: 'center', textColor: [80, 80, 80] },
    columnStyles: { 0: { halign: 'left', fontStyle: 'bold', textColor: [120, 120, 120], fontSize: 8 } },
    alternateRowStyles: { fillColor: [251, 252, 253] },
    styles: { cellPadding: 6, lineColor: [235, 235, 235], lineWidth: { bottom: 0.1 } },
    margin: { left: 14 }
  })

  autoTable(doc, {
    startY: doc.lastAutoTable.finalY + 12,
    theme: 'plain',
    head: [['Completion Time', '<45m', '<2h', '<6h', '<8h', '<12h', '>12h']],
    body: [['Count', u.done_45m, u.done_2h, u.done_6h, u.done_8h, u.done_12h, u.done_over12]],
    headStyles: { textColor: [20, 20, 20], fontSize: 8, fontStyle: 'bold', halign: 'center' },
    bodyStyles: { fontSize: 10, halign: 'center', textColor: [80, 80, 80] },
    columnStyles: { 0: { halign: 'left', fontStyle: 'bold', textColor: [120, 120, 120], fontSize: 8 } },
    alternateRowStyles: { fillColor: [251, 252, 253] },
    styles: { cellPadding: 6, lineColor: [235, 235, 235], lineWidth: { bottom: 0.1 } },
    margin: { left: 14 }
  })

  const typeEntries = Object.entries(u.types).sort((a, b) => b[1] - a[1])
  if (typeEntries.length) {
    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + 12, theme: 'plain',
      head: [['Order Type', 'Count']],
      body: typeEntries.slice(0, 5),
      headStyles: { textColor: [20, 20, 20], fontSize: 8, fontStyle: 'bold' },
      bodyStyles: { fontSize: 9, textColor: [80, 80, 80] },
      alternateRowStyles: { fillColor: [251, 252, 253] },
      styles: { cellPadding: 5, lineColor: [235, 235, 235], lineWidth: { bottom: 0.1 } },
      margin: { left: 14 }
    })
  }

  autoTable(doc, {
    startY: doc.lastAutoTable.finalY + 16,
    theme: 'plain',
    head: [['#', 'Order', 'Entered By', 'Completed By', 'Type', 'Time Taken']],
    body: u.orders.map((o, i) => {
      const dm = diffMin(o['query-received_datetime'], o.query_done)
      return [i + 1, o['propery-order'] || '\u2014', o.qname || '\u2014', o.completed_by || '\u2014', o.type || '\u2014', durStr(dm)]
    }),
    headStyles: { textColor: [20, 20, 20], fontSize: 7, fontStyle: 'bold' },
    bodyStyles: { fontSize: 7, textColor: [80, 80, 80] },
    alternateRowStyles: { fillColor: [251, 252, 253] },
    styles: { cellPadding: 4, lineColor: [235, 235, 235], lineWidth: { bottom: 0.1 }, overflow: 'ellipsize' },
    columnStyles: { 
      0: { cellWidth: 10 },
      1: { cellWidth: 50, fontStyle: 'bold', textColor: [20, 20, 20] },
      5: { fontStyle: 'bold' }
    },
    margin: { left: 14 }
  })

  doc.setFontSize(8)
  doc.setTextColor(150, 150, 150)
  doc.text('QMS \u00a9 Benchmark Studio \u2014 Confidential', 14, doc.internal.pageSize.height - 12)
  doc.save(`${u.name.replace(/\s+/g, '_')}_Report_${new Date().toISOString().slice(0, 10)}.pdf`)
}

function DrillDown({ u, onClose }) {
  const replyBuckets = [
    { l: '≤5m', v: u.reply_5, good: true },
    { l: '5-15m', v: u.reply_15, good: true },
    { l: '15-30m', v: u.reply_30, good: false },
    { l: '30m-1h', v: u.reply_1h, good: false },
    { l: '>1h', v: u.reply_over1h, good: false, bad: true },
    { l: 'N/A', v: u.reply_na, neutral: true },
  ]
  const doneBuckets = [
    { l: '≤45m', v: u.done_45m, good: true },
    { l: '≤2h', v: u.done_2h, good: true },
    { l: '≤4h', v: u.done_4h, good: false },
    { l: '≤8h', v: u.done_8h, good: false },
    { l: '≤12h', v: u.done_12h, good: false },
    { l: '>12h', v: u.done_over12, bad: true },
  ]
  const topProjDepts = Object.entries(u.projDepts).sort((a, b) => b[1] - a[1]).slice(0, 10)
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
            <div className="csr-avatar-wrapper" style={{ width: 48, height: 48, borderRadius: 6, background: 'var(--bg-hover)', border: '1px solid var(--border-strong)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: 'var(--accent-primary)' }}>
              <UserIcon className="csr-avatar-icon" size={24} strokeWidth={2} />
            </div>
            <div>
              <h2 style={{ fontSize: 18, fontWeight: 600, margin: '0 0 4px', color: 'var(--text-main)' }}>{u.name}</h2>
              <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0 }}>Total Credit: {u.total} queries</p>
            </div>
          </div>
          <div className="stagger-parent" style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 12, marginTop: 32 }}>
            {[{ l: 'Entered', v: u.enteredTotal }, { l: 'Completed', v: u.completedTotal }, { l: 'Bot Done', v: u.botCompleted }, { l: 'New', v: u.newOrd }, { l: 'Amend', v: u.amend }].map(x => (
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
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 24 }}>
            <div>
              <h3 style={{ fontSize: 14, fontWeight: 600, margin: '0 0 16px', color: 'var(--text-main)' }}>Top Projects</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 32px' }}>
                {topProjDepts.map(([pd, v]) => (
                  <div key={pd} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid var(--border-subtle)' }}>
                    <span style={{ fontSize: 13, color: 'var(--text-muted)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginRight: 12 }}>{pd}</span>
                    <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-main)', flexShrink: 0 }}>{v}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div>
            <h3 style={{ fontSize: 14, fontWeight: 600, margin: '0 0 16px', color: 'var(--text-main)' }}>All Completed Orders</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 480, overflowY: 'auto' }}>
              {u.orders.map(o => {
                const dm = diffMin(o['query-received_datetime'], o.query_done)
                const bad = dm !== null && dm > 120
                return (
                  <div key={o.id} style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr 80px 70px', gap: 12, padding: '12px 16px', background: 'var(--bg-base)', border: '1px solid var(--border-strong)', borderRadius: 6, fontSize: 12 }}>
                    <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--text-main)', fontWeight: 600 }}>{o['propery-order'] || '—'}</div>
                    <div style={{ color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={`Entered by: ${o.qname || '—'}`}>E: {o.qname ? o.qname.split(' ')[0] : '—'}</div>
                    <div style={{ color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={`Completed by: ${o.completed_by || '—'}`}>C: {o.completed_by ? o.completed_by.split(' ')[0] : '—'}</div>
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

function Countdown({ deadline }) {
  const now = Math.floor(Date.now() / 1000)
  const diff = deadline - now
  if (diff <= 0) return <span style={{ color: 'var(--status-danger)', fontWeight: 600, fontSize: 13 }}>EXPIRED</span>
  const h = Math.floor(diff / 3600), m = Math.floor((diff % 3600) / 60)
  return <span style={{ fontFamily: 'monospace', fontSize: 13, fontWeight: 500, color: diff < 1800 ? 'var(--status-warning)' : 'var(--text-main)' }}>{String(h).padStart(2, '0')}h {String(m).padStart(2, '0')}m</span>
}
function LiveElapsed({ since }) {
  const ms = Date.now() - new Date(since).getTime()
  const m = Math.floor(ms / 60000), h = Math.floor(m / 60)
  const bad = h >= 2
  return <span style={{ fontFamily: 'monospace', fontSize: 13, fontWeight: 500, color: bad ? 'var(--status-danger)' : h >= 1 ? 'var(--status-warning)' : 'var(--text-main)' }}>{elapsedStr(since)}</span>
}
function Toast({ msg, onClose }) {
  useEffect(() => { const t = setTimeout(onClose, 5000); return () => clearTimeout(t) }, [onClose])
  return (
    <div className="toast" style={{ display: 'flex', alignItems: 'center', gap: 12, background: 'var(--bg-elevated)', border: '1px solid var(--border-strong)', color: 'var(--text-main)', padding: '14px 20px', borderRadius: 'var(--radius-lg)', fontSize: 13, fontWeight: 500, boxShadow: 'var(--shadow-lg)' }}>
      <Icon paths={IC.bell} size={14} style={{ color: 'var(--accent-primary)' }} />{msg}
      <button onClick={onClose} style={{ marginLeft: 4, background: 'none', border: 'none', color: 'var(--text-faint)', fontSize: 16, cursor: 'pointer' }}>×</button>
    </div>
  )
}
function defaultPKTDL() {
  const t = new Date(Date.now() + 4 * 3600000)
  let h = t.getHours(), m = t.getMinutes()
  const ap = h >= 12 ? 'PM' : 'AM'
  h = h % 12 || 12
  const min = String(Math.floor(m / 5) * 5).padStart(2, '0')
  return { h: String(h), min, ap }
}

const DL_PRESETS = [
  { label: '30 Mins', hours: 0.5 },
  { label: '2 Hours', hours: 2 },
  { label: '4 Hours', hours: 4 },
  { label: '6 Hours', hours: 6 },
  { label: '8 Hours', hours: 8 },
]

const METRIC_COLORS = ['m-teal', 'm-amber', 'm-green', 'm-blue']
const METRIC_ICONS = [IC.bolt, IC.mail, IC.check, IC.chart]
const NAV_GROUPS = [
  { label: 'Workspace', items: [
    { id: 'current', label: 'Current Queue', icon: IC.bolt },
    { id: 'issue', label: 'Emailed / Issue', icon: IC.mail },
    { id: 'done', label: 'Done Queries', icon: IC.check },
  ]},
  { label: 'Analytics', items: [
    { id: 'qms_dashboard', label: 'Dashboard', icon: IC.chart },
    { id: 'reports', label: 'Legacy Reports', icon: IC.chart }
  ] },
  { label: 'Account', items: [{ id: 'profile', label: 'Profile', icon: IC.user }] },
]
const togBtn = a => ({ background: a ? 'var(--text-main)' : 'var(--bg-input)', border: `1.5px solid ${a ? 'var(--text-main)' : 'var(--border-strong)'}`, color: a ? 'var(--bg-panel)' : 'var(--text-main)', borderRadius: 8, padding: '8px 0', fontSize: 12, fontWeight: 500, cursor: 'pointer', transition: 'all .2s ease', flex: 1, fontFamily: 'inherit' })

function ProjectSelect({ selected, onChange, allProjects }) {
  const [open, setOpen] = useState(false)
  const wrapRef = useRef(null)
  
  useEffect(() => {
    const clickOut = e => { if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', clickOut)
    return () => document.removeEventListener('mousedown', clickOut)
  }, [])

  const toggle = (p) => {
    if (selected.includes(p)) onChange(selected.filter(x => x !== p))
    else onChange([...selected, p])
  }

  return (
    <div ref={wrapRef} style={{ position: 'relative', width: 220, flexShrink: 0, zIndex: open ? 50 : 1 }}>
      <label className="lbl">Projects Filter</label>
      <div 
        className="inp" 
        style={{ cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }} 
        onClick={() => setOpen(!open)}
      >
        <span style={{ overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis', color: selected.length ? 'inherit' : 'var(--text-faint)' }}>
          {selected.length === 0 ? 'All Projects' : selected.length === 1 ? selected[0] : `${selected.length} Selected`}
        </span>
        <Icon paths={IC.chevD} size={16} style={{ transform: open ? 'rotate(180deg)' : 'none', transition: '0.2s cubic-bezier(0.16, 1, 0.3, 1)', color: 'var(--text-faint)' }} />
      </div>
      {open && (
        <div className="anim-slide-down" style={{ position: 'absolute', top: '100%', left: 0, right: 0, marginTop: 6, zIndex: 50, background: 'var(--bg-panel)', border: '1px solid var(--border-strong)', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-lg)', maxHeight: 300, overflowY: 'auto', padding: 6, display: 'flex', flexDirection: 'column', gap: 2, transformOrigin: 'top center' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 8px', borderBottom: '1px solid var(--border-subtle)', marginBottom: 4 }}>
            <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)' }}>{selected.length} Selected</span>
            {selected.length > 0 && <button onClick={() => onChange([])} style={{ background: 'none', border: 'none', color: 'var(--accent-primary)', fontSize: 11, cursor: 'pointer', fontWeight: 600 }}>Clear</button>}
          </div>
          {allProjects.map(p => (
            <div key={p} onClick={() => toggle(p)} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', borderRadius: 6, cursor: 'pointer', background: selected.includes(p) ? 'var(--bg-hover)' : 'transparent', fontSize: 13, transition: '0.15s ease' }} onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'} onMouseLeave={e => e.currentTarget.style.background = selected.includes(p) ? 'var(--bg-hover)' : 'transparent'}>
              <div style={{ width: 16, height: 16, borderRadius: 4, border: `1.5px solid ${selected.includes(p) ? 'var(--accent-primary)' : 'var(--border-strong)'}`, background: selected.includes(p) ? 'var(--accent-primary)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: '0.15s ease' }}>
                {selected.includes(p) && (
                  <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                    <path d="M1.5 4L3.5 6.5L8.5 1.5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </div>
              <span style={{ fontWeight: selected.includes(p) ? 500 : 400, color: selected.includes(p) ? 'var(--text-main)' : 'var(--text-muted)' }}>{p}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default function CSRPortal() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [user, setUser] = useState(null)
  const [section, setSection] = useState('qms_dashboard')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [selectedProjects, setSelectedProjects] = useState([])
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const PP = 50

  const [reportFrom, setReportFrom] = useState('')
  const [reportTo, setReportTo] = useState('')
  const [dashFrom, setDashFrom] = useState('')
  const [dashTo, setDashTo] = useState('')
  const [reportCsr, setReportCsr] = useState('')
  const [drillUser, setDrillUser] = useState(null)
  const [timelineOrder, setTimelineOrder] = useState(null)
  const [slackThreadOrder, setSlackThreadOrder] = useState(null)
  const [expandedCsr, setExpandedCsr] = useState(null)
  const searchRef = useRef(null)

  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({ medium: MEDIUMS[0], country: COUNTRIES[0], project: COUNTRY_MAP[COUNTRIES[0]][0].p, department: COUNTRY_MAP[COUNTRIES[0]][0].d, type: TYPES[0], order_id: '' })
  const [dlH, setDlH] = useState('12')
  const [dlMin, setDlMin] = useState('00')
  const [dlAp, setDlAp] = useState('PM')
  const [dlMode, setDlMode] = useState('4')
  const [recvTime, setRecvTime] = useState('')
  const [firstReplyTime, setFirstReplyTime] = useState('')
  const [busy, setBusy] = useState(false)
  const [fb, setFb] = useState(null)

  const [det, setDet] = useState(null)
  const [dNotes, setDNotes] = useState('')
  const [dManual, setDManual] = useState('')
  const [dBusy, setDBusy] = useState(false)
  const [dFb, setDFb] = useState(null)

  const [resOrd, setResOrd] = useState(null)
  const [resText, setResText] = useState('')
  const [resBusy, setResBusy] = useState(false)
  const [resFb, setResFb] = useState(null)

  const [ext, setExt] = useState(null)
  const [extH, setExtH] = useState(1)
  const [extBusy, setExtBusy] = useState(false)

  const [toast, setToast] = useState(null)
  const prevCount = useRef(0)

  const playBell = useRef(null)
  useEffect(() => {
    playBell.current = (times = 1) => {
      const ctx = new (window.AudioContext || window.webkitAudioContext)()
      for (let i = 0; i < times; i++) {
        setTimeout(() => {
          const osc = ctx.createOscillator()
          const gain = ctx.createGain()
          osc.connect(gain)
          gain.connect(ctx.destination)
          osc.type = 'sine'
          osc.frequency.value = 880 // A5 note — clear, audible
          gain.gain.setValueAtTime(0.35, ctx.currentTime) // moderate volume
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5)
          osc.start(ctx.currentTime)
          osc.stop(ctx.currentTime + 0.5)
        }, i * 600) // 600ms between each ping
      }
    }
  }, [])

  useEffect(() => {
    const s = sessionStorage.getItem('qmsUser'), r = sessionStorage.getItem('qmsRole')
    if (!s || r !== 'user') { navigate('/'); return }
    const u = JSON.parse(s)
    setUser(u)
    if (u.project_filter) {
      try { setSelectedProjects(JSON.parse(u.project_filter)) } catch (e) {}
    }
  }, [navigate])

  const handleProjectFilterChange = (newProjects) => {
    setSelectedProjects(newProjects)
    setPage(1)
    fetch(`${API}/update-project-filter.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ projects: newProjects })
    }).then(r => r.json()).then(data => {
      if (data.status === 'success') {
         const u = { ...user, project_filter: JSON.stringify(newProjects) }
         setUser(u)
         sessionStorage.setItem('qmsUser', JSON.stringify(u))
      }
    }).catch(console.error)
  }

  const dp = (fromDate || toDate) ? `?from_date=${encodeURIComponent(fromDate)}&to_date=${encodeURIComponent(toDate)}` : ''
  const donep = (reportFrom || reportTo) ? `?from_date=${encodeURIComponent(reportFrom)}&to_date=${encodeURIComponent(reportTo)}` : ''

  const statsQuery = useQuery({
    queryKey: ['stats', fromDate, toDate],
    queryFn: () => fetch(`${API}/get-stats.php${dp}`).then(r => r.json()),
    enabled: !!user, refetchInterval: 10000,
  })

  const currentQuery = useQuery({
    queryKey: ['currentOrders', fromDate, toDate],
    queryFn: async () => {
      const res = await fetch(`${API}/get-current-orders.php${dp}`)
      const data = await res.json()
      const ca = Array.isArray(data) ? data : []
      const newCount = ca.length - prevCount.current
      if (prevCount.current > 0 && newCount > 0) {
        playBell.current?.(newCount)
        setToast(`${newCount} new quer${newCount > 1 ? 'ies' : 'y'} added!`)
      }
      prevCount.current = ca.length
      return data
    },
    enabled: !!user, refetchInterval: 10000,
  })

  const issueQuery = useQuery({
    queryKey: ['issueOrders'],
    queryFn: () => fetch(`${API}/get-issue-orders.php`).then(r => r.json()),
    enabled: !!user, refetchInterval: 10000,
  })

  const doneQuery = useQuery({
    queryKey: ['doneOrders', reportFrom, reportTo],
    queryFn: () => fetch(`${API}/get-done-orders.php${donep}`).then(r => r.json()),
    enabled: !!user, refetchInterval: 10000,
  })

  const dashQ = (dashFrom || dashTo) ? `?from_date=${encodeURIComponent(dashFrom)}&to_date=${encodeURIComponent(dashTo)}` : ''
  const dashQuery = useQuery({
    queryKey: ['dashOrders', dashFrom, dashTo],
    queryFn: () => fetch(`${API}/get-orders.php${dashQ}`).then(r => r.json()),
    enabled: !!user && section === 'qms_dashboard', refetchInterval: 10000,
  })

  const { data: completedByNames = [] } = useQuery({
    queryKey: ['completedByNames'],
    queryFn: () => fetch(`${API}/get-completed-by-names.php`).then(r => r.json()),
    enabled: !!user, staleTime: Infinity,
  })

  const stats = statsQuery.data || null
  const curOrds = Array.isArray(currentQuery.data) ? currentQuery.data : []
  const issOrds = Array.isArray(issueQuery.data) ? issueQuery.data : []
  const doneOrds = Array.isArray(doneQuery.data) ? doneQuery.data : []
  const loading = !statsQuery.data && statsQuery.isLoading

  const dashOrdersData = dashQuery.data?.data || (Array.isArray(dashQuery.data) ? dashQuery.data : [])
  const dashReport = useMemo(() => buildReportWithPending(dashOrdersData, completedByNames), [dashOrdersData, completedByNames])
  const dashSorted = useMemo(() => Object.values(dashReport).sort((a, b) => b.completedTotal - a.completedTotal), [dashReport])
  const dashAgg = useMemo(() => {
    let totComp = 0, totPend = 0, totNew = 0, totAmend = 0
    dashSorted.forEach(u => {
      totComp += u.completedTotal
      totPend += u.pending
      totNew += u.newOrd
      totAmend += u.amend
    })
    return { totComp, totPend, totNew, totAmend }
  }, [dashSorted])

  const list = section === 'current' ? curOrds : section === 'issue' ? issOrds : doneOrds
  const filtered = useMemo(() => {
    let res = list;
    if (selectedProjects.length > 0) {
      res = res.filter(o => selectedProjects.includes(o.project_name))
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      res = res.filter(o => Object.values(o).some(v => String(v ?? '').toLowerCase().includes(q)))
    }
    return res;
  }, [list, search, selectedProjects])
  const totalPages = Math.ceil(filtered.length / PP), visible = filtered.slice((page - 1) * PP, page * PP)

  const reportOrders = useMemo(() => {
    let d = doneOrds.filter(o => o.query_done)
    if (reportFrom) d = d.filter(o => (o.date || '') >= reportFrom)
    if (reportTo) d = d.filter(o => (o.date || '') <= reportTo)
    if (reportCsr) {
      const selected = completedByNames.find(c => c.display === reportCsr)
      const vals = selected ? selected.values : [reportCsr]
      d = d.filter(o => vals.includes(o.qname))
    }
    return d
  }, [doneOrds, reportFrom, reportTo, reportCsr])
  const reportByUser = useMemo(() => buildReport(reportOrders, completedByNames), [reportOrders, completedByNames])
  const sorted = useMemo(() => Object.values(reportByUser).sort((a, b) => b.total - a.total), [reportByUser])

  const reportByCountry = useMemo(() => {
    const pStats = {}
    for (const [country, items] of Object.entries(COUNTRY_MAP)) {
      if (!pStats[country]) pStats[country] = {}
      items.forEach(i => {
        const code = `${i.p} - ${i.d}`
        pStats[country][code] = {
          country, code, 
          total: 0,
          firstReplyTotalMins: 0, firstReplyCount: 0,
          lastReplyTotalMins: 0, lastReplyCount: 0
        }
      })
    }
    reportOrders.forEach(o => {
      let c = getCountryForProject(o.project_name, o.department)
      if (c === '—') c = 'Other'
      let code = `${o.project_name} - ${o.department}`
      
      if (!pStats[c]) pStats[c] = {}
      if (!pStats[c][code]) pStats[c][code] = { country: c, code, total: 0, firstReplyTotalMins: 0, firstReplyCount: 0, lastReplyTotalMins: 0, lastReplyCount: 0 }
      
      const ps = pStats[c][code]
      ps.total++

      const fm = diffMin(o['query-received_datetime'], o['query-first-reply_datetime'])
      if (fm !== null) {
        ps.firstReplyTotalMins += fm
        ps.firstReplyCount++
      }

      const lm = diffMin(o['query-received_datetime'], o.query_done)
      if (lm !== null) {
        ps.lastReplyTotalMins += lm
        ps.lastReplyCount++
      }
    })
    return Object.entries(pStats).map(([country, projs]) => ({
      country,
      projects: Object.values(projs).filter(p => p.total > 0).sort((a, b) => b.total - a.total)
    })).filter(c => c.projects.length > 0)
  }, [reportOrders])

  const exportReportPDF = async () => {
    const [{ default: jsPDF }, { default: autoTable }] = await Promise.all([import('jspdf'), import('jspdf-autotable')])
    const doc = new jsPDF('l')
    doc.setFont('helvetica', 'bold'); doc.setFontSize(18); doc.setTextColor(15, 23, 42)
    doc.text('QMS Performance Report', 14, 20)
    doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(100, 116, 139)
    const range = reportFrom || reportTo ? `${reportFrom || 'Start'} — ${reportTo || 'End'}` : 'All Time'
    doc.text(`Period: ${range}  |  Generated: ${new Date().toLocaleString()}  |  ${reportOrders.length} completed queries`, 14, 28)
    const rows = sorted.map(u => [u.name, u.total, u.newOrd, u.amend, u.reply_5, u.reply_15, u.reply_30, u.reply_1h, u.reply_over1h, u.reply_na, u.done_45m, u.done_2h, u.done_4h, u.done_8h, u.done_12h, u.done_over12])
    autoTable(doc, {
      startY: 34, theme: 'grid',
      head: [['User', 'Total', 'New', 'Amend', 'Reply ≤5m', '5-15m', '15-30m', '30m-1h', '>1h', 'N/A', 'Done ≤45m', '≤2h', '≤4h', '≤8h', '≤12h', '>12h']],
      body: rows,
      headStyles: { fillColor: [15, 23, 42], textColor: 255, fontSize: 7, fontStyle: 'bold', halign: 'center' },
      bodyStyles: { fontSize: 8, halign: 'center' },
      columnStyles: { 0: { halign: 'left', fontStyle: 'bold', cellWidth: 40 } },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      styles: { cellPadding: 3, overflow: 'ellipsize' },
    })

    reportByCountry.forEach(cStats => {
      autoTable(doc, {
        startY: doc.lastAutoTable.finalY + 14,
        theme: 'grid',
        head: [[`${cStats.country} - Projects`, 'Total Queries', 'Avg 1st Reply', 'Avg Last Reply']],
        body: cStats.projects.map(p => [
          p.code,
          p.total,
          p.firstReplyCount > 0 ? durStr(p.firstReplyTotalMins / p.firstReplyCount) : '—',
          p.lastReplyCount > 0 ? durStr(p.lastReplyTotalMins / p.lastReplyCount) : '—'
        ]),
        headStyles: { fillColor: [30, 41, 59], textColor: 255, fontSize: 8, fontStyle: 'bold' },
        bodyStyles: { fontSize: 8 },
        columnStyles: { 
          0: { fontStyle: 'bold' },
          1: { halign: 'center' },
          2: { halign: 'center' },
          3: { halign: 'center' }
        },
        alternateRowStyles: { fillColor: [251, 252, 253] },
        styles: { cellPadding: 4 }
      })
    })
    doc.setFontSize(7); doc.setTextColor(148, 163, 184)
    doc.text('QMS © Benchmark Studio — Confidential', 14, doc.internal.pageSize.height - 8)
    doc.save(`QMS_Report_${new Date().toISOString().slice(0, 10)}.pdf`)
  }

  const logout = async () => {
    try { await fetch(`${API}/logout.php`); } catch (e) {}
    sessionStorage.removeItem('qmsUser');
    sessionStorage.removeItem('qmsRole');
    navigate('/');
  }
  const openNew = () => {
    const d = defaultPKTDL()
    setDlH(d.h); setDlMin(d.min); setDlAp(d.ap); setDlMode('4')
    setForm({ medium: MEDIUMS[0], country: COUNTRIES[0], project: COUNTRY_MAP[COUNTRIES[0]][0].p, department: COUNTRY_MAP[COUNTRIES[0]][0].d, type: TYPES[0], order_id: '' })
    setRecvTime(''); setFirstReplyTime('')
    setFb(null); setOpen(true)
  }
  const fc = e => setForm(p => ({ ...p, [e.target.name]: e.target.value }))

  const displayName = user ? (user.dname || user.name || user.dusername || 'CSR') : 'CSR'

  const handleSubmit = async e => {
    e.preventDefault(); setBusy(true); setFb(null)
    const now = new Date()
    let tH = parseInt(dlH) % 12
    if (dlAp === 'PM') tH += 12
    const target = new Date(); target.setHours(tH, parseInt(dlMin), 0, 0)
    if (target <= now) target.setDate(target.getDate() + 1)
    const reminder_hours = Math.max(0.25, (target - now) / 3600000)
    const payload = {
      ...form,
      qname: displayName,
      reminder_hours,
      received_datetime: recvTime ? recvTime.replace('T', ' ') + ':00' : '',
      first_reply_datetime: firstReplyTime ? firstReplyTime.replace('T', ' ') + ':00' : '',
    }
    try {
      const res = await fetch(`${API}/add-order.php`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      const data = await res.json()
      if (data.status === 'success') {
        setFb({ ok: true, msg: data.message })
        setTimeout(() => {
          setOpen(false)
          queryClient.refetchQueries({ queryKey: ['currentOrders'] })
          queryClient.refetchQueries({ queryKey: ['stats'] })
        }, 1200)
      }
      else setFb({ ok: false, msg: data.message })
    } catch { setFb({ ok: false, msg: 'Network error.' }) } finally { setBusy(false) }
  }

  const openDet = o => { setDet(o); setDNotes(o.instruction || ''); setDManual(''); setDFb(null) }

  const invalidateAll = () => {
    queryClient.refetchQueries({ queryKey: ['currentOrders'] })
    queryClient.refetchQueries({ queryKey: ['issueOrders'] })
    queryClient.refetchQueries({ queryKey: ['doneOrders'] })
    queryClient.refetchQueries({ queryKey: ['stats'] })
  }

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
        setDet(null)
        setExt(null)
        setResOrd(null)
        setOpen(false)
        setTimelineOrder(null)
        setSlackThreadOrder(null)
        setDrillUser(null)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [section, openNew])

  const updateField = (orderId, field, value) => {
    const patch = old => (old || []).map(o => o.id === orderId ? { ...o, [field]: value } : o)
    queryClient.setQueryData(['currentOrders', fromDate, toDate], patch)
    queryClient.setQueryData(['issueOrders'], patch)
    queryClient.setQueryData(['doneOrders', reportFrom, reportTo], patch)
    fetch(`${API}/update-field.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: orderId, field, value }),
    }).catch(() => setToast('Failed to save — please retry'))
  }

  const isUnassigned = v => !v || v === 'Unassigned' || v === 'Unknown'

  const FieldSelect = ({ order, field, options, style }) => (
    <select
      value=""
      onChange={e => updateField(order.id, field, e.target.value)}
      onClick={e => e.stopPropagation()}
      style={{ ...style, appearance: 'auto', cursor: 'pointer', maxWidth: '100%', boxSizing: 'border-box' }}
    >
      <option value="" disabled>— Pick —</option>
      {options.map(v => <option key={v} value={v}>{v}</option>)}
    </select>
  )

  const submitAction = async action => {
    const orderId = det.id
    setDet(null)
    queryClient.setQueryData(['currentOrders', fromDate, toDate], old => (old || []).filter(o => o.id !== orderId))
    queryClient.setQueryData(['issueOrders'], old => (old || []).filter(o => o.id !== orderId))
    try {
      const res = await fetch(`${API}/mark-order.php`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: orderId, action, instruction: dNotes, completed_by: displayName, manual_date: dManual ? dManual.replace('T', ' ') + ':00' : '' }) })
      const data = await res.json()
      if (data.status !== 'success') setToast(data.message || 'Action failed')
    } catch { setToast('Network error — changes may not have saved') }
    finally { invalidateAll() }
  }

  const submitExt = async () => {
    const extId = ext.id
    setExtBusy(true)
    try { 
      const res = await fetch(`${API}/extend-time.php`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ order_id: extId, extra_hours: extH }) }) 
      const data = await res.json()
      if (data.status !== 'success') setToast(data.message || 'Extension failed')
    }
    catch { setToast('Extension failed — network error') }
    finally { setExtBusy(false); setExt(null); invalidateAll() }
  }

  const submitResolve = async () => {
    if (!resOrd) return
    const orderId = resOrd.id
    setResOrd(null); setResText('')
    queryClient.setQueryData(['issueOrders'], old => (old || []).filter(o => o.id !== orderId))
    try {
      const res = await fetch(`${API}/mark-order.php`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: orderId, action: 'resolve', resolution: resText, instruction: resOrd.instruction || '', completed_by: displayName }) })
      const data = await res.json()
      if (data.status !== 'success') setToast(data.message || 'Resolve failed')
    } catch { setToast('Network error — changes may not have saved') }
    finally { invalidateAll() }
  }


  if (!user) return null
  const initials = displayName[0].toUpperCase()
  const CARDS = stats ? [
    { l: 'Total Received', n: stats.total_received, sub: `${stats.total_new} new · ${stats.total_amend} amends` },
    { l: 'Issues', n: stats.issues, sub: `${stats.issue_new} new · ${stats.issue_amend} amends` },
    { l: 'Done Today', n: stats.done, sub: `${stats.done_new} new · ${stats.done_amend} amends` },
    { l: 'Pending', n: stats.pending, sub: `${stats.pending_new} new · ${stats.pending_amend} amends` },
  ] : []
  const SECTION_TITLES = { current: 'Current Queue', issue: 'Emailed / Issue', done: 'Done Queries', reports: 'Reports', profile: 'Profile' }
  const sectionBadge = id => id === 'current' ? curOrds.length : id === 'issue' ? issOrds.length : null

  return (
    <div className="shell fade-in">
      {toast && <Toast msg={toast} onClose={() => setToast(null)} />}
      {drillUser && <DrillDown u={drillUser} onClose={() => setDrillUser(null)} />}
      {timelineOrder && <QueryTimeline order={timelineOrder} onClose={() => setTimelineOrder(null)} />}
      {slackThreadOrder && <SlackThreadViewer slackTs={slackThreadOrder.slack_ts} orderId={slackThreadOrder['propery-order']} onClose={() => setSlackThreadOrder(null)} />}
      {mobileMenuOpen && <div className="mobile-overlay" onClick={() => setMobileMenuOpen(false)} />}

      {/* ═══ SIDEBAR ═══ */}
      <aside className={`sb${mobileMenuOpen ? ' mobile-sb' : ''}`} id="user-sidebar">
        <div className="sb-brand">
          <img src={`${import.meta.env.BASE_URL}favicon.ico`} alt="Logo" className="sb-logo" style={{ background: 'transparent', boxShadow: 'none', objectFit: 'contain', padding: 0 }} />
          <div>
            <div className="sb-title">Benchmark<em>Studio</em></div>
            <div className="sb-subtitle">CSR</div>
          </div>
        </div>
        <nav className="sb-nav">
          {NAV_GROUPS.map(g => (
            <div className="sb-group" key={g.label}>
              <div className="sb-group-label">{g.label}</div>
              {g.items.map(n => {
                const badge = sectionBadge(n.id)
                return (
                  <button key={n.id} onClick={() => { 
                      setSection(n.id); setMobileMenuOpen(false); setPage(1); setSearch('');
                    }}
                    className={`sb-link${section === n.id ? ' active' : ''}`}>
                    <Icon paths={n.icon} size={14} style={{ color: section === n.id ? 'var(--accent-primary)' : 'var(--text-faint)' }} />
                    {n.label}
                    {badge > 0 && <span className={`sb-badge ${n.id === 'issue' ? 'sb-badge-amber' : 'sb-badge-teal'}`}>{badge}</span>}
                  </button>
                )
              })}
            </div>
          ))}
        </nav>
        <div className="sb-foot">
          <div className="sb-avatar csr-avatar-wrapper" style={{background:'var(--bg-hover)', color:'var(--accent-primary)', display:'flex', alignItems:'center', justifyContent:'center'}}><UserIcon className="csr-avatar-icon" size={16} strokeWidth={2} /></div>
          <div className="sb-user-info">
            <div className="sb-user-name">{displayName}</div>
            <div className="sb-user-role">CSR</div>
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
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M3 12h18M3 6h18M3 18h18"/></svg>
            </button>
            <h1>{SECTION_TITLES[section]}</h1>
            {section === 'current' && <span className="topbar-sub">{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}</span>}
          </div>
          <div className="topbar-actions">
            <div className="live-sync-indicator" title="Connected and syncing in real-time">
              <div className="live-sync-inner">
                <div className="live-sync-dot"></div> Live Sync
              </div>
            </div>
            {section === 'reports' && <button onClick={exportReportPDF} className="btn btn-ghost btn-sm"><Icon paths={IC.pdf} size={12} />Export PDF</button>}
            {!['profile', 'reports'].includes(section) && <button onClick={openNew} className="btn btn-primary"><Icon paths={IC.plus} size={13} />New Entry</button>}
          </div>
        </header>

        <main className="content">
          {section === 'qms_dashboard' && (
            <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              <div className="toolbar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-panel)', padding: '16px 24px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-subtle)', boxShadow: 'var(--shadow-sm)' }}>
                <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                  <div>
                    <label className="lbl" style={{ marginBottom: 4, display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Date From</label>
                    <input type="date" value={dashFrom} onChange={e => setDashFrom(e.target.value)} className="inp" style={{ background: 'var(--bg-input)', border: '1px solid var(--border-strong)', color: 'var(--text-main)', padding: '8px 12px', borderRadius: 'var(--radius-md)' }} />
                  </div>
                  <div>
                    <label className="lbl" style={{ marginBottom: 4, display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Date To</label>
                    <input type="date" value={dashTo} onChange={e => setDashTo(e.target.value)} className="inp" style={{ background: 'var(--bg-input)', border: '1px solid var(--border-strong)', color: 'var(--text-main)', padding: '8px 12px', borderRadius: 'var(--radius-md)' }} />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'flex-end', paddingBottom: 2 }}>
                     {(dashFrom || dashTo) && <button onClick={() => { setDashFrom(''); setDashTo('') }} className="btn btn-ghost btn-sm" style={{ height: 38 }}>Reset Dates</button>}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <h2 style={{ margin: 0, fontSize: 18, color: 'var(--text-main)', fontWeight: 600 }}>Performance Dashboard</h2>
                  <p style={{ margin: 0, fontSize: 13, color: 'var(--text-muted)' }}>Real-time metrics</p>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
                {[
                  { l: 'Total Completed', v: dashAgg.totComp, c: 'm-teal', i: IC.check },
                  { l: 'Total Pending', v: dashAgg.totPend, c: 'm-amber', i: IC.bolt },
                  { l: 'Total New', v: dashAgg.totNew, c: 'm-blue', i: IC.chart },
                  { l: 'Total Amends', v: dashAgg.totAmend, c: 'm-green', i: IC.mail }
                ].map((s, i) => (
                  <div key={i} className={`metric ${s.c}`} style={{ padding: 24, borderRadius: 'var(--radius-lg)' }}>
                    <div className="metric-icon" style={{ marginBottom: 12 }}><Icon paths={s.i} size={20} /></div>
                    {dashQuery.isLoading ? (
                      <div className="skeleton" style={{ height: 38, width: 60, marginBottom: 4, borderRadius: 6 }} />
                    ) : (
                      <div className="metric-val" style={{ fontSize: 32, marginBottom: 4 }}>{s.v}</div>
                    )}
                    <div className="metric-label" style={{ fontSize: 14 }}>{s.l}</div>
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <h3 style={{ margin: '8px 0 0', fontSize: 16, fontWeight: 600, color: 'var(--text-main)' }}>Team Overview</h3>
                {dashQuery.isLoading ? (
                  Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} style={{ background: 'var(--bg-panel)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)', overflow: 'hidden', padding: '6px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
                       <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 160 }}>
                          <div className="skeleton" style={{ width: 28, height: 28, borderRadius: '50%' }} />
                          <div className="skeleton" style={{ height: 14, width: 100, borderRadius: 4 }} />
                       </div>
                       <div style={{ display: 'flex', flex: 1, justifyContent: 'space-between', padding: '0 24px' }}>
                         {Array.from({ length: 7 }).map((_, j) => (
                           <div key={j} style={{ textAlign: 'center' }}>
                             <div className="skeleton" style={{ height: 14, width: 20, margin: '0 auto 2px', borderRadius: 4 }} />
                             <div className="skeleton" style={{ height: 10, width: 28, borderRadius: 4 }} />
                           </div>
                         ))}
                       </div>
                       <div style={{ width: 24 }}></div>
                    </div>
                  ))
                ) : dashSorted.map(u => (
                  <div key={u.name} style={{ background: 'var(--bg-panel)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
                    <div 
                      onClick={() => setExpandedCsr(expandedCsr === u.name ? null : u.name)}
                      style={{ padding: '4px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', background: expandedCsr === u.name ? 'var(--bg-hover)' : 'transparent', transition: 'background 0.2s ease' }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, width: 160, flexShrink: 0 }}>
                        <div className="csr-avatar-wrapper" style={{ width: 24, height: 24, borderRadius: '50%', background: 'var(--bg-hover)', border: '1px solid var(--border-strong)', color: 'var(--accent-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <UserIcon className="csr-avatar-icon" size={12} strokeWidth={2} />
                        </div>
                        <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{u.name}</div>
                      </div>
                      
                      <div style={{ display: 'flex', flex: 1, justifyContent: 'space-between', padding: '0 16px', minWidth: 0 }}>
                        <div style={{ textAlign: 'center' }}>
                          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-main)' }}>{u.total}</div>
                          <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>Total Handled</div>
                        </div>
                        <div style={{ textAlign: 'center' }}>
                          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-main)' }}>{u.enteredTotal}</div>
                          <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>Entered</div>
                        </div>
                        <div style={{ textAlign: 'center' }}>
                          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-main)' }}>{u.completedTotal}</div>
                          <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>Done</div>
                        </div>
                        <div style={{ textAlign: 'center' }}>
                          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-main)' }}>{u.botAssigned}</div>
                          <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>Bot Entered</div>
                        </div>
                        <div style={{ textAlign: 'center' }}>
                          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-main)' }}>{u.botCompleted}</div>
                          <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>Bot Done</div>
                        </div>
                        <div style={{ textAlign: 'center' }}>
                          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--status-warning)' }}>{u.pending}</div>
                          <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>Pending</div>
                        </div>
                        <div style={{ textAlign: 'center' }}>
                          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-main)' }}>{u.newOrd}</div>
                          <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>New Orders</div>
                        </div>
                        <div style={{ textAlign: 'center' }}>
                          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-main)' }}>{u.amend}</div>
                          <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>Amends</div>
                        </div>
                      </div>

                      <div style={{ width: 24, display: 'flex', justifyContent: 'flex-end', color: 'var(--text-faint)' }}>
                        <Icon paths={IC.chevD} size={14} style={{ transform: expandedCsr === u.name ? 'rotate(180deg)' : 'none', transition: 'transform 0.3s ease' }} />
                      </div>
                    </div>

                    {expandedCsr === u.name && (
                      <div style={{ padding: '0 24px 24px', borderTop: '1px solid var(--border-subtle)', animation: 'fadeIn 0.3s ease' }}>
                        <div style={{ marginTop: 24 }}>
                          <div>
                            <h4 style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-main)', marginBottom: 16, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Projects Overview</h4>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 24, alignItems: 'flex-start' }}>
                              {(() => {
                                const pStats = {}
                                u.orders.forEach(o => {
                                  let c = getCountryForProject(o.project_name, o.department)
                                  if (c === '—') c = 'Other'
                                  let code = `${o.project_name} - ${o.department}`
                                  if (!pStats[c]) pStats[c] = {}
                                  if (!pStats[c][code]) pStats[c][code] = { count: 0, firstMins: 0, firstCount: 0, lastMins: 0, lastCount: 0 }
                                  const ps = pStats[c][code]
                                  ps.count++
                                  const fm = diffMin(o['query-received_datetime'], o['query-first-reply_datetime'])
                                  if (fm !== null) { ps.firstMins += fm; ps.firstCount++ }
                                  const lm = diffMin(o['query-received_datetime'], o.query_done)
                                  if (lm !== null) { ps.lastMins += lm; ps.lastCount++ }
                                })
                                const res = Object.entries(pStats).map(([country, projs]) => ({
                                  country,
                                  projects: Object.entries(projs).sort((a,b) => b[1].count - a[1].count)
                                })).filter(c => c.projects.length > 0)
                                
                                if (res.length === 0) return <div style={{ color: 'var(--text-muted)' }}>No projects</div>
                                return res.map(cStats => (
                                  <div key={cStats.country} style={{ flex: '1 1 300px', minWidth: 280 }}>
                                    <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-main)', textTransform: 'uppercase', marginBottom: 8, letterSpacing: '0.05em', borderBottom: '2px solid var(--border-subtle)', paddingBottom: 4 }}>
                                      {cStats.country}
                                    </div>
                                    <table style={{ width: '100%', fontSize: 12, borderCollapse: 'collapse' }}>
                                      <thead>
                                        <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                                          <th style={{ padding: '6px 0', textAlign: 'left', fontWeight: 600, color: 'var(--text-muted)' }}>Project</th>
                                          <th style={{ padding: '6px 0', textAlign: 'center', fontWeight: 600, color: 'var(--text-muted)', width: 80 }}>First Reply</th>
                                          <th style={{ padding: '6px 0', textAlign: 'center', fontWeight: 600, color: 'var(--text-muted)', width: 80 }}>Last Reply</th>
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {cStats.projects.map(([code, ps]) => (
                                          <tr key={code} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                                            <td style={{ padding: '6px 0', color: 'var(--text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 120 }} title={code}>
                                              {code}
                                            </td>
                                            <td style={{ padding: '6px 0', textAlign: 'center' }} className={ps.firstCount > 0 ? 'cell-good' : 'cell-muted'}>{ps.firstCount > 0 ? durStr(ps.firstMins / ps.firstCount) : '—'}</td>
                                            <td style={{ padding: '6px 0', textAlign: 'center' }} className={ps.lastCount > 0 ? 'cell-good' : 'cell-muted'}>{ps.lastCount > 0 ? durStr(ps.lastMins / ps.lastCount) : '—'}</td>
                                          </tr>
                                        ))}
                                      </tbody>
                                    </table>
                                  </div>
                                ))
                              })()}
                            </div>
                          </div>

                        </div>
                      </div>
                    )}
                  </div>
                ))}
                {dashSorted.length === 0 && (
                  <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-faint)', fontSize: 14 }}>No data for selected period</div>
                )}
              </div>
            </div>
          )}

          {/* ── STAT CARDS ── */}
          {section === 'current' && CARDS.length > 0 && (
            <div className="metrics fade-up">
              {CARDS.map((c, i) => (
                <div key={c.l} className={`metric ${METRIC_COLORS[i]}`}>
                  <div className="metric-icon"><Icon paths={METRIC_ICONS[i]} size={16} /></div>
                  <div className="metric-label">{c.l}</div>
                  <div className="metric-val">{c.n ?? '—'}</div>
                  <div className="metric-sub">{c.sub}</div>
                </div>
              ))}
            </div>
          )}

          {/* ── FILTER TOOLBAR ── */}
          {['current', 'issue', 'done'].includes(section) && (
            <div className="toolbar fade-up" style={{ position: 'relative', zIndex: 20 }}>
              {section === 'current' && <>
                <div><label className="lbl">From</label><input type="date" value={fromDate} onChange={e => { setFromDate(e.target.value); setPage(1) }} className="inp" /></div>
                <div><label className="lbl">To</label><input type="date" value={toDate} onChange={e => { setToDate(e.target.value); setPage(1) }} className="inp" /></div>
              </>}
              <ProjectSelect selected={selectedProjects} onChange={handleProjectFilterChange} allProjects={PROJECTS} />
              <div style={{ flex: '1 1 200px' }}>
                <label className="lbl">Search</label>
                <div className="inp-icon-wrap">
                  <Icon paths={IC.search} size={14} />
                  <input ref={searchRef} type="text" placeholder="Search any field… (Ctrl+F)" value={search} onChange={e => { setSearch(e.target.value); setPage(1) }} className="inp" />
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <span style={{ fontSize: 12, color: 'var(--text-faint)' }}>{filtered.length} records</span>
                {(fromDate || toDate || search) && <button onClick={() => { setFromDate(''); setToDate(''); setSearch(''); setPage(1) }} className="btn btn-ghost btn-sm">Reset</button>}
              </div>
            </div>
          )}

          {/* ── DATA TABLE ── */}
          {['current', 'issue', 'done'].includes(section) && (
            <div className="panel fade-up">
              {loading ? (
                <div style={{ height: 256, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, color: 'var(--text-faint)' }}>
                  <div className="spinner" style={{ width: 20, height: 20, border: '2px solid var(--border-strong)', borderTopColor: 'var(--text-main)', borderRadius: '50%' }} />
                  <span style={{ fontSize: 13 }}>Loading…</span>
                </div>
              ) : (
                <div style={{ overflowX: 'auto', maxHeight: 'calc(100vh - 340px)', overflowY: 'auto' }}>
                  <table className="tbl">
                    <thead><tr>
                      {section === 'current' && ['Received','Age','Medium','Country','Project Code','Type','Order ID','Deadline','1st Reply','Entered By'].map(h => <th key={h}>{h}</th>)}
                      {section === 'issue' && ['Received','Age','Medium','Country','Project Code','Type','Order ID','Entered By','Issue / Notes'].map(h => <th key={h}>{h}</th>)}
                      {section === 'done' && ['Received','Medium','Country','Project Code','Type','Order ID','1st Reply','Last Reply','Entered By','Completed By','Duration','History'].map(h => <th key={h}>{h}</th>)}
                      <th style={{ width: 60 }}></th>
                    </tr></thead>
                    <tbody className="stagger">
                      {visible.length === 0 ? (
                        <tr><td colSpan={20} style={{ textAlign: 'center', padding: 60, color: 'var(--text-faint)' }}>No records found.</td></tr>
                      ) : visible.map(o => {
                        if (section === 'current') {
                          const age = elapsedStr(o['query-received_datetime'])
                          const overdue = o.overdue === 1 || o.overdue === '1'
                          return (
                            <tr key={o.id} style={{ cursor: 'pointer' }} onClick={() => openDet(o)}>
                              <td>{fmtDt(o['query-received_datetime'])}</td>
                              <td><span className={`pill ${overdue ? 'pill-danger' : 'pill-neutral'}`}>{age}</span></td>
                              <td>{isUnassigned(o.communication_medium) ? <FieldSelect order={o} field="communication_medium" options={MEDIUMS} style={{ fontSize: 12, padding: '4px 6px', borderRadius: 6, border: '1px solid var(--status-warning)', background: 'var(--status-warning-bg)', color: 'var(--status-warning)' }} /> : o.communication_medium}</td>
                              <td><span className="pill pill-neutral" style={{ fontSize: 11 }}>{getCountryForProject(o.project_name, o.department)}</span></td>
                              <td className="cell-bold">
                                {isUnassigned(o.project_name) ? <FieldSelect order={o} field="project_name" options={PROJECTS} style={{ fontSize: 12, padding: '4px 6px', borderRadius: 6, border: '1px solid var(--status-warning)', background: 'var(--status-warning-bg)', color: 'var(--status-warning)' }} /> : o.project_name}
                                {' - '}
                                {isUnassigned(o.department) ? <FieldSelect order={o} field="department" options={DEPTS} style={{ fontSize: 12, padding: '4px 6px', borderRadius: 6, border: '1px solid var(--status-warning)', background: 'var(--status-warning-bg)', color: 'var(--status-warning)' }} /> : o.department}
                              </td>
                              <td>{isUnassigned(o.type) ? <FieldSelect order={o} field="type" options={TYPES} style={{ fontSize: 12, padding: '4px 6px', borderRadius: 6, border: '1px solid var(--status-warning)', background: 'var(--status-warning-bg)', color: 'var(--status-warning)' }} /> : o.type}</td>
                              <td className="cell-bold">{o['propery-order'] || '—'}</td>
                              <td style={{ color: overdue ? 'var(--status-danger)' : 'var(--text-muted)', fontWeight: overdue ? 600 : 400 }}><Countdown deadline={o._deadline} /></td>
                              <td>{fmtDt(o['query-first-reply_datetime'])}</td>
                              <td>{o.qname}</td>
                              <td style={{ display: 'flex', gap: 4 }} onClick={e => e.stopPropagation()}>
                                <button onClick={() => setExt(o)} className="btn btn-ghost btn-sm" title="Extend"><Icon paths={IC.clock} size={12} /></button>
                                {o.slack_ts && (
                                  <button onClick={() => setSlackThreadOrder(o)} className="btn btn-ghost btn-sm" style={{ color: '#10b981' }} title="View Slack Thread">
                                    <Icon paths={['M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z']} size={12} />
                                  </button>
                                )}
                              </td>
                            </tr>
                          )
                        }
                        if (section === 'issue') {
                          return (
                            <tr key={o.id}>
                              <td>{fmtDt(o['query-received_datetime'])}</td>
                              <td><span className="pill pill-warning">{elapsedStr(o['query-received_datetime'])}</span></td>
                              <td>{o.communication_medium}</td>
                              <td><span className="pill pill-neutral" style={{ fontSize: 11 }}>{getCountryForProject(o.project_name, o.department)}</span></td>
                              <td className="cell-bold">{o.project_name} - {o.department}</td>
                              <td>{o.type}</td>
                              <td className="cell-bold">{o['propery-order'] || '—'}</td>
                              <td>{o.qname}</td>
                              <td className="cell-trunc" title={o.instruction}>{o.instruction || '—'}</td>
                              <td><button onClick={() => { setResOrd(o); setResText(''); setResFb(null) }} className="btn btn-primary btn-sm">Resolve</button></td>
                            </tr>
                          )
                        }
                        return (() => {
                          const dur = elapsedStr(o['query-received_datetime'], o.query_done)
                          const bad = parseDurH(dur) > 8
                          return (
                            <tr key={o.id}>
                              <td>{fmtDt(o['query-received_datetime'])}</td>
                              <td>{o.communication_medium}</td>
                              <td><span className="pill pill-neutral" style={{ fontSize: 11 }}>{getCountryForProject(o.project_name, o.department)}</span></td>
                              <td className="cell-bold">{o.project_name} - {o.department}</td>
                              <td>{o.type}</td>
                              <td className="cell-bold">{o['propery-order'] || '—'}</td>
                              <td>{fmtDt(o['query-first-reply_datetime'])}</td>
                              <td>{fmtDt(o.query_done)}</td>
                              <td>{o.qname}</td>
                              <td className="cell-good">{o.completed_by || '—'}</td>
                              <td><span className={`pill ${bad ? 'pill-danger' : 'pill-neutral'}`}>{dur}</span></td>
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
                          )
                        })()
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* ── PAGINATION ── */}
          {['current', 'issue', 'done'].includes(section) && !loading && totalPages > 1 && (
            <div className="pager">
              <span className="pager-info">Page {page} of {totalPages}</span>
              <div className="pager-btns">
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="btn btn-ghost btn-sm"><Icon paths={IC.chevL} size={12} /> Prev</button>
                <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="btn btn-ghost btn-sm">Next <Icon paths={IC.chevR} size={12} /></button>
              </div>
            </div>
          )}

          {/* ── REPORTS ── */}
          {section === 'reports' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div className="toolbar fade-up">
                <div><label className="lbl">From</label><input type="date" value={reportFrom} onChange={e => setReportFrom(e.target.value)} className="inp" /></div>
                <div><label className="lbl">To</label><input type="date" value={reportTo} onChange={e => setReportTo(e.target.value)} className="inp" /></div>
                <div><label className="lbl">Completed By</label>
                  <select value={reportCsr} onChange={e => setReportCsr(e.target.value)} className="inp">
                    <option value="">All Users</option>
                    {completedByNames.map(n => <option key={n.display} value={n.display}>{n.display}</option>)}
                  </select>
                </div>
                <div style={{ flex: 1 }} />
                <span style={{ fontSize: 12, color: 'var(--text-faint)' }}>{reportOrders.length} completed</span>
              </div>

              {[
                { title: 'Summary', hint: 'Click a row for details', cols: ['User','Entered','Completed','Total Credit','New','Amend',''], render: u => (
                  <tr key={u.name} className="stagger" style={{ cursor: 'pointer' }} onClick={() => setDrillUser(u)}>
                    <td className="cell-bold">{u.name}</td>
                    <td style={{ textAlign: 'center', fontWeight: 600 }}>{u.enteredTotal}</td>
                    <td style={{ textAlign: 'center', fontWeight: 600 }}>{u.completedTotal}</td>
                    <td style={{ textAlign: 'center', fontWeight: 600, color: 'var(--accent-primary)' }}>{u.total}</td>
                    <td style={{ textAlign: 'center' }} className="cell-good">{u.newOrd}</td>
                    <td style={{ textAlign: 'center' }} className="cell-warn">{u.amend}</td>
                    <td style={{ textAlign: 'center' }}><Icon paths={IC.arrowR} size={12} /></td>
                  </tr>
                )},
                { title: 'First Reply Distribution', cols: ['User','≤5m','5-15m','15-30m','30m-1h','>1h','N/A'], render: u => (
                  <tr key={u.name} style={{ cursor: 'pointer' }} onClick={() => setDrillUser(u)}>
                    <td className="cell-bold">{u.name}</td>
                    <td style={{ textAlign: 'center' }} className="cell-good">{u.reply_5}</td>
                    <td style={{ textAlign: 'center' }} className="cell-good">{u.reply_15}</td>
                    <td style={{ textAlign: 'center' }} className="cell-muted">{u.reply_30}</td>
                    <td style={{ textAlign: 'center' }} className="cell-muted">{u.reply_1h}</td>
                    <td style={{ textAlign: 'center' }} className={u.reply_over1h > 0 ? 'cell-bad' : 'cell-muted'}>{u.reply_over1h}</td>
                    <td style={{ textAlign: 'center' }} className="cell-muted">{u.reply_na}</td>
                  </tr>
                )},
                { title: 'Completion Time Distribution', cols: ['User','≤45m','≤2h','≤4h','≤8h','≤12h','>12h'], render: u => (
                  <tr key={u.name} style={{ cursor: 'pointer' }} onClick={() => setDrillUser(u)}>
                    <td className="cell-bold">{u.name}</td>
                    <td style={{ textAlign: 'center' }} className="cell-good">{u.done_45m}</td>
                    <td style={{ textAlign: 'center' }} className="cell-good">{u.done_2h}</td>
                    <td style={{ textAlign: 'center' }} className="cell-muted">{u.done_4h}</td>
                    <td style={{ textAlign: 'center' }} className="cell-muted">{u.done_8h}</td>
                    <td style={{ textAlign: 'center' }} className="cell-muted">{u.done_12h}</td>
                    <td style={{ textAlign: 'center' }} className={u.done_over12 > 0 ? 'cell-bad' : 'cell-muted'}>{u.done_over12}</td>
                  </tr>
                )},
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
              
              {/* ── COUNTRY PROJECT REPORTS ── */}
              {reportByCountry.map(cStats => (
                <div className="panel fade-up" key={`country-${cStats.country}`}>
                  <div className="panel-head"><h3>{cStats.country} Projects</h3></div>
                  <div style={{ overflowX: 'auto' }}>
                    <table className="tbl">
                      <thead>
                        <tr>
                          <th style={{ textAlign: 'left' }}>Project Code</th>
                          <th style={{ textAlign: 'center' }}>Total Queries</th>
                          <th style={{ textAlign: 'center' }}>Avg 1st Reply</th>
                          <th style={{ textAlign: 'center' }}>Avg Last Reply</th>
                        </tr>
                      </thead>
                      <tbody>
                        {cStats.projects.length === 0 ? <tr><td colSpan={4} style={{ textAlign: 'center', padding: 48, color: 'var(--text-faint)' }}>No data.</td></tr> : cStats.projects.map(p => (
                          <tr key={p.code}>
                            <td className="cell-bold">{p.code}</td>
                            <td style={{ textAlign: 'center', fontWeight: 600 }}>{p.total}</td>
                            <td style={{ textAlign: 'center' }} className={p.firstReplyCount > 0 ? 'cell-good' : 'cell-muted'}>
                              {p.firstReplyCount > 0 ? durStr(p.firstReplyTotalMins / p.firstReplyCount) : '—'}
                            </td>
                            <td style={{ textAlign: 'center' }} className={p.lastReplyCount > 0 ? 'cell-good' : 'cell-muted'}>
                              {p.lastReplyCount > 0 ? durStr(p.lastReplyTotalMins / p.lastReplyCount) : '—'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ── PROFILE ── */}
          {section === 'profile' && (
            <div className="profile-card fade-up">
              <div className="panel" style={{ padding: 24 }}>
                <div className="profile-avatar csr-avatar-wrapper" style={{background:'var(--bg-hover)', color:'var(--accent-primary)', display:'flex', alignItems:'center', justifyContent:'center'}}><UserIcon className="csr-avatar-icon" size={32} strokeWidth={1.5} /></div>
                {[['Display Name', displayName], ['Username', user.dusername || user.username || '—'], ['Role', 'CSR'], ['Status', 'Active']].map(([l, v]) => (
                  <div key={l} className="profile-row"><span className="profile-label">{l}</span><span className="profile-val">{v}</span></div>
                ))}
              </div>
            </div>
          )}
        </main>
      </div>

      {/* ═══ NEW QUERY MODAL ═══ */}
      {open && (<>
        <div className="overlay" onClick={() => !busy && setOpen(false)} />
        <div className="dialog-wrap">
          <div className="dialog scale-in" style={{ maxWidth: 480 }} onClick={e => e.stopPropagation()}>
            <div className="dialog-head">
              <h2>New Query</h2>
              <button className="dialog-close" onClick={() => !busy && setOpen(false)}><Icon paths={IC.close} size={16} /></button>
            </div>
            <form onSubmit={handleSubmit} className="dialog-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {[
                { l: 'Communication Medium', k: 'medium', opts: MEDIUMS },
                { l: 'Project Name', k: 'project', opts: PROJECTS },
                { l: 'Department', k: 'department', opts: DEPTS },
                { l: 'Type', k: 'type', opts: TYPES },
              ].map(f => (
                <div key={f.k}><label className="lbl">{f.l}</label>
                  <select name={f.k} value={form[f.k]} onChange={fc} className="inp">{f.opts.map(v => <option key={v} value={v}>{v}</option>)}</select>
                </div>
              ))}
              <div><label className="lbl">Order ID</label><input name="order_id" value={form.order_id} onChange={fc} placeholder="e.g. ORD-1234" className="inp" /></div>
              <div><label className="lbl">Received At (optional)</label><input type="datetime-local" value={recvTime} onChange={e => setRecvTime(e.target.value)} className="inp" /></div>
              <div><label className="lbl">First Reply At (optional)</label><input type="datetime-local" value={firstReplyTime} onChange={e => setFirstReplyTime(e.target.value)} className="inp" /></div>
              <div>
                <label className="lbl">Deadline</label>
                <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
                  {DL_PRESETS.map(p => <button key={p.hours} type="button" onClick={() => { setDlMode(String(p.hours)); const d = defaultPKTDL(p.hours); setDlH(d.h); setDlMin(d.min); setDlAp(d.ap) }} style={togBtn(dlMode === String(p.hours))}>{p.label}</button>)}
                </div>
                {(() => {
                  const now = nowPKT()
                  let h = parseInt(dlH) % 12; if (dlAp === 'PM') h += 12
                  const t = new Date(); t.setHours(h, parseInt(dlMin), 0, 0)
                  if (t <= now) t.setDate(t.getDate() + 1)
                  const rem = Math.max(0, (t - now) / 3600000)
                  return <p style={{ fontSize: 12, color: 'var(--text-faint)', margin: '6px 0 0' }}>Deadline: {dlH}:{dlMin} {dlAp} PKT — {rem.toFixed(1)}h from now</p>
                })()}
              </div>
              {fb && <div className={`fb ${fb.ok ? 'fb-ok' : 'fb-err'}`}>{fb.msg}</div>}
              <button type="submit" disabled={busy} className="btn btn-primary" style={{ width: '100%', padding: '11px', marginTop: 4 }}>{busy ? 'Submitting…' : 'Submit Query'}</button>
            </form>
          </div>
        </div>
      </>)}

      {/* ═══ ORDER DETAIL MODAL ═══ */}
      {det && (<>
        <div className="overlay" onClick={() => !dBusy && setDet(null)} />
        <div className="dialog-wrap">
          <div className="dialog scale-in" style={{ maxWidth: 520 }} onClick={e => e.stopPropagation()}>
            <div className="dialog-head">
              <h2>Order #{det.id}</h2>
              <button className="dialog-close" onClick={() => !dBusy && setDet(null)}><Icon paths={IC.close} size={16} /></button>
            </div>
            <div className="dialog-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="detail-grid">
                {[['Received', fmtDt(det['query-received_datetime'])], ['Medium', det.communication_medium], ['Project', det.project_name], ['Dept', det.department], ['Type', det.type], ['Order ID', det['propery-order']], ['1st Reply', fmtDt(det['query-first-reply_datetime'])], ['Entered By', det.qname]].map(([l, v]) => (
                  <div key={l} className="detail-cell"><div className="detail-cell-label">{l}</div><div className="detail-cell-val">{v || '—'}</div></div>
                ))}
              </div>
              <div><label className="lbl">Notes / Issue Description</label><textarea value={dNotes} onChange={e => setDNotes(e.target.value)} rows={3} placeholder="Add notes…" className="inp" style={{ resize: 'none' }} /></div>
              {dFb && <div className={`fb ${dFb.ok ? 'fb-ok' : 'fb-err'}`}>{dFb.msg}</div>}
              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={() => submitAction('complete')} disabled={dBusy} className="btn btn-primary" style={{ flex: 1, padding: 11 }}>Mark Complete</button>
                {dNotes.trim().length > 0 && det.status !== 'issue' && <button onClick={() => submitAction('issue')} disabled={dBusy} className="btn btn-warn" style={{ flex: 1, padding: 11 }}>Report Issue</button>}
              </div>
            </div>
          </div>
        </div>
      </>)}

      {/* ═══ EXTEND DEADLINE ═══ */}
      {ext && (<>
        <div className="overlay" onClick={() => !extBusy && setExt(null)} />
        <div className="dialog-wrap">
          <div className="dialog scale-in" style={{ maxWidth: 360, padding: 24 }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Icon paths={IC.clock} size={14} />
                <h2 style={{ fontSize: 16, fontWeight: 600, margin: 0 }}>Extend Deadline</h2>
              </div>
              <button className="dialog-close" onClick={() => !extBusy && setExt(null)}><Icon paths={IC.close} size={16} /></button>
            </div>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 20 }}>#{ext.id} — {ext['propery-order']}</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8, marginBottom: 20 }}>
              {[0.5, 1, 2, 3, 4, 6].map(h => <button key={h} type="button" onClick={() => setExtH(h)} style={togBtn(extH === h)}>{h < 1 ? '30m' : `${h}h`}</button>)}
            </div>
            <button onClick={submitExt} disabled={extBusy} className="btn btn-primary" style={{ width: '100%', padding: 11 }}>{extBusy ? 'Extending…' : 'Apply Extension'}</button>
          </div>
        </div>
      </>)}

      {/* ═══ RESOLVE ISSUE ═══ */}
      {resOrd && (<>
        <div className="overlay" onClick={() => !resBusy && setResOrd(null)} />
        <div className="dialog-wrap">
          <div className="dialog scale-in" style={{ maxWidth: 480 }} onClick={e => e.stopPropagation()}>
            <div className="dialog-head">
              <h2>Resolve Issue: #{resOrd.id}</h2>
              <button className="dialog-close" onClick={() => !resBusy && setResOrd(null)}><Icon paths={IC.close} size={16} /></button>
            </div>
            <div className="dialog-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {resOrd.instruction && <div style={{ padding: '12px 14px', background: 'var(--status-warning-bg)', border: '1px solid var(--status-warning)', borderRadius: 8, fontSize: 13, color: 'var(--status-warning-text)' }}><strong>Issue:</strong> {resOrd.instruction}</div>}
              <div><label className="lbl">Resolution Notes</label><textarea value={resText} onChange={e => setResText(e.target.value)} rows={3} placeholder="How was this resolved?" className="inp" style={{ resize: 'none' }} /></div>
              {resFb && <div className={`fb ${resFb.ok ? 'fb-ok' : 'fb-err'}`}>{resFb.msg}</div>}
              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={() => setResOrd(null)} disabled={resBusy} className="btn btn-ghost" style={{ flex: 1, padding: 10 }}>Cancel</button>
                <button onClick={submitResolve} disabled={resBusy || !resText.trim()} className="btn btn-primary" style={{ flex: 2, padding: 11 }}>{resBusy ? 'Resolving…' : 'Mark as Resolved'}</button>
              </div>
            </div>
          </div>
        </div>
      </>)}
    </div>
  )
}
