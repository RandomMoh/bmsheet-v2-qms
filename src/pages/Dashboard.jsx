import { useEffect, useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import ThemeToggle from '../ThemeToggle'
import './Dashboard.css'

const API = import.meta.env.VITE_API_BASE_URL

// --- HELPERS ---
function getPKTDateStr(d = new Date()) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Karachi', year: 'numeric', month: '2-digit', day: '2-digit' }).format(d);
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

function initUserStats(byUser, name) {
  if (!byUser[name]) {
    byUser[name] = {
      name, total: 0, enteredTotal: 0, completedTotal: 0, newOrd: 0, amend: 0, pending: 0, orders: [],
      depts: {}, projects: {}, types: {},
      reply_5: 0, reply_15: 0, reply_30: 0, reply_over30: 0, reply_na: 0,
      done_45m: 0, done_2h: 0, done_6h: 0, done_8h: 0, done_12h: 0, done_over12: 0,
    }
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
  cU.depts[dept] = (cU.depts[dept] || 0) + 1
  cU.projects[proj] = (cU.projects[proj] || 0) + 1
  cU.types[tp] = (cU.types[tp] || 0) + 1

  const dm = diffMin(o['query-received_datetime'], o.query_done)
  if (dm !== null) {
    if (dm <= 45) cU.done_45m++
    else if (dm <= 120) cU.done_2h++
    else if (dm <= 360) cU.done_6h++
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
  else fU.reply_over30++
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
    } else {
      // Pending logic - count as pending for the assigned completer
      if (completer !== 'Unassigned') {
        byUser[completer].pending++
      } else {
        // If unassigned, count as pending for enterer
        byUser[enterer].pending++
      }
    }
  })
  
  // Clean up 'Unassigned' if it's zero across the board, just keep the meaningful users
  return byUser
}


// --- ICONS ---
const Icon = ({ paths, size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
    {paths.map((d, i) => <path key={i} d={d} />)}
  </svg>
)
const IC = {
  logout: ['M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4', 'M16 17l5-5-5-5', 'M21 12H9'],
  list: ['M8 6h13', 'M8 12h13', 'M8 18h13', 'M3 6h.01', 'M3 12h.01', 'M3 18h.01'],
  chevronDown: ['M6 9l6 6 6-6'],
  chevronUp: ['M18 15l-6-6-6 6']
}

// --- COMPONENTS ---
function DetailedReport({ u }) {
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

  const bar = (v, max, color) => (
    <div style={{ flex: 1, height: 4, background: 'var(--border-subtle)', borderRadius: 2, overflow: 'hidden' }}>
      <div style={{ height: '100%', width: `${Math.round((v / Math.max(max, 1)) * 100)}%`, background: color, borderRadius: 2 }} />
    </div>
  )

  return (
    <div className="drilldown-container fade-down">
      <div className="drilldown-grid">
        {/* Timing Column */}
        <div className="drilldown-section">
          <h3 className="section-title">1st Reply Time</h3>
          <div className="bucket-list">
            {replyBuckets.map(b => (
              <div key={b.l} className="bucket-row">
                <span className="bucket-label" style={{ color: b.bad ? 'var(--status-danger)' : b.good ? 'var(--status-success)' : 'var(--text-muted)' }}>{b.l}</span>
                {bar(b.v, u.total, b.bad ? 'var(--status-danger)' : b.good ? 'var(--status-success)' : 'var(--text-muted)')}
                <span className="bucket-val">{b.v}</span>
              </div>
            ))}
          </div>

          <h3 className="section-title" style={{ marginTop: 24 }}>Completion Time</h3>
          <div className="bucket-list">
            {doneBuckets.map(b => (
              <div key={b.l} className="bucket-row">
                <span className="bucket-label" style={{ color: b.bad ? 'var(--status-danger)' : b.good ? 'var(--status-success)' : 'var(--text-muted)' }}>{b.l}</span>
                {bar(b.v, u.total, b.bad ? 'var(--status-danger)' : b.good ? 'var(--status-success)' : 'var(--status-warning)')}
                <span className="bucket-val">{b.v}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Categories Column */}
        <div className="drilldown-section">
          <h3 className="section-title">By Type</h3>
          <div className="tags-flex">
            {typeEntries.length === 0 ? <span className="empty-text">No data</span> : typeEntries.map(([t, v]) => (
              <div key={t} className="tag-chip">
                <span className="tag-val">{v}</span>
                <span className="tag-lbl">{t}</span>
              </div>
            ))}
          </div>
          
          <h3 className="section-title" style={{ marginTop: 24 }}>Top Departments</h3>
          <div className="top-list">
            {topDepts.length === 0 ? <span className="empty-text">No data</span> : topDepts.map(([d, v]) => (
              <div key={d} className="top-row">
                <span className="top-lbl">{d}</span>
                <span className="top-val">{v}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Orders Column */}
        <div className="drilldown-section">
          <h3 className="section-title">Recent Completed Orders</h3>
          <div className="recent-orders">
            {u.orders.length === 0 ? <span className="empty-text">No orders found.</span> : u.orders.slice(-10).reverse().map(o => {
              const dm = diffMin(o['query-received_datetime'], o.query_done)
              const bad = dm !== null && dm > 120
              return (
                <div key={o.id} className="recent-order-card">
                  <div className="roc-header">
                    <span className="roc-id">{o['propery-order'] || '—'}</span>
                    <span className="roc-time" style={{ color: bad ? 'var(--status-danger)' : 'var(--text-main)' }}>{durStr(dm)}</span>
                  </div>
                  <div className="roc-details">
                    <span>E: {o.qname ? o.qname.split(' ')[0] : '—'}</span>
                    <span>C: {o.completed_by ? o.completed_by.split(' ')[0] : '—'}</span>
                    <span>{o.type}</span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function Dashboard() {
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [orders, setOrders] = useState([])
  const [completedByNames, setCompletedByNames] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [expandedId, setExpandedId] = useState(null)

  // Filters
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  useEffect(() => {
    const s = sessionStorage.getItem('qmsUser')
    if (!s) { navigate('/'); return }
    setUser(JSON.parse(s))
  }, [navigate])

  const fetchData = () => {
    if (!user) return
    fetch(`${API}/get-orders.php`)
      .then(r => r.json())
      .then(d => {
        setOrders(Array.isArray(d.data) ? d.data : [])
        setLoading(false)
      })
      .catch(e => { setError(e.message); setLoading(false) })
  }

  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, 15000)
    return () => clearInterval(interval)
  }, [user])

  useEffect(() => {
    if (!user) return
    fetch(`${API}/get-completed-by-names.php`)
      .then(r => r.json())
      .then(data => { if (Array.isArray(data)) setCompletedByNames(data) })
      .catch(() => { })
  }, [user])

  const filteredOrders = useMemo(() => {
    let d = orders
    if (dateFrom) d = d.filter(o => (o.date || '') >= dateFrom)
    if (dateTo) d = d.filter(o => (o.date || '') <= dateTo)
    return d
  }, [orders, dateFrom, dateTo])

  const reportByUser = useMemo(() => buildReportWithPending(filteredOrders, completedByNames), [filteredOrders, completedByNames])
  
  // Exclude 'Unassigned' and sort by total credit
  const sortedUsers = useMemo(() => {
    return Object.values(reportByUser)
      .filter(u => u.name !== 'Unassigned' && (u.total > 0 || u.pending > 0))
      .sort((a, b) => b.total - a.total)
  }, [reportByUser])

  const logout = () => {
    sessionStorage.removeItem('qmsUser');
    sessionStorage.removeItem('qmsRole');
    navigate('/');
  }

  return (
    <div className="dash-shell fade-in">
      <header className="dash-header">
        <div className="dh-left">
          <div className="dh-logo">
            <img src={`${import.meta.env.BASE_URL}favicon.ico`} alt="Logo" />
            <div className="dh-titles">
              <h2>Benchmark<em>Studio</em></h2>
              <span>Reports Dashboard</span>
            </div>
          </div>
        </div>

        <div className="dh-center">
          <div className="dash-filters">
            <div className="filter-group">
              <label>From Date</label>
              <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
            </div>
            <div className="filter-group">
              <label>To Date</label>
              <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} />
            </div>
            {(dateFrom || dateTo) && (
              <button className="dash-btn-clear" onClick={() => { setDateFrom(''); setDateTo('') }}>Reset</button>
            )}
          </div>
        </div>

        <div className="dh-right">
          <button className="dash-nav-btn" onClick={() => navigate('/user')}>
            <Icon paths={IC.list} /> Current Queue
          </button>
          <div className="dh-divider" />
          <ThemeToggle />
          <button className="dash-nav-btn danger" onClick={logout} title="Sign Out">
            <Icon paths={IC.logout} />
          </button>
        </div>
      </header>

      <main className="dash-main">
        {error && <div className="dash-error">Error: {error}</div>}
        
        {loading ? (
          <div className="dash-loading">
            <div className="spinner" />
            <span>Loading Analytics...</span>
          </div>
        ) : (
          <div className="csr-container stagger-parent">
            {sortedUsers.length === 0 ? (
              <div className="empty-state">No records found for the selected dates.</div>
            ) : (
              sortedUsers.map(u => {
                const initials = u.name[0]?.toUpperCase() || '?'
                const isExpanded = expandedId === u.name
                
                return (
                  <div key={u.name} className={`csr-card ${isExpanded ? 'expanded' : ''}`}>
                    <div className="csr-card-header" onClick={() => setExpandedId(isExpanded ? null : u.name)}>
                      
                      <div className="csr-profile">
                        <div className="csr-avatar">{initials}</div>
                        <span className="csr-name">{u.name}</span>
                      </div>

                      <div className="csr-stats-row">
                        <div className="stat-pill">
                          <span className="stat-lbl">Entered</span>
                          <span className="stat-val">{u.enteredTotal}</span>
                        </div>
                        <div className="stat-pill">
                          <span className="stat-lbl">Completed</span>
                          <span className="stat-val">{u.completedTotal}</span>
                        </div>
                        <div className="stat-pill primary">
                          <span className="stat-lbl">Total Credit</span>
                          <span className="stat-val">{u.total}</span>
                        </div>
                        <div className="stat-pill success">
                          <span className="stat-lbl">New</span>
                          <span className="stat-val">{u.newOrd}</span>
                        </div>
                        <div className="stat-pill warning">
                          <span className="stat-lbl">Amends</span>
                          <span className="stat-val">{u.amend}</span>
                        </div>
                        <div className="stat-pill danger">
                          <span className="stat-lbl">Pending</span>
                          <span className="stat-val">{u.pending}</span>
                        </div>
                      </div>

                      <div className="csr-expand-icon">
                        <Icon paths={isExpanded ? IC.chevronUp : IC.chevronDown} />
                      </div>
                    </div>

                    {isExpanded && <DetailedReport u={u} />}
                  </div>
                )
              })
            )}
          </div>
        )}
      </main>
    </div>
  )
}
