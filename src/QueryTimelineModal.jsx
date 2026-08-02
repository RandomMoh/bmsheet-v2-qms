import React, { useState, useEffect, useMemo } from 'react'
import {
  Clock,
  CheckCircle2,
  AlertTriangle,
  PlusCircle,
  MessageSquare,
  UserCheck,
  FileEdit,
  ShieldCheck,
  Timer,
  Search,
  X,
  ArrowRight,
  Sparkles,
  Layers,
  Calendar,
  Tag,
  Download,
  Copy,
  Check,
  FileSpreadsheet,
  ChevronDown,
  ChevronUp,
  Share2
} from 'lucide-react'

const API_URL = import.meta.env.VITE_API_BASE_URL || '/qms_react/api'

function formatDateTime(ts) {
  if (!ts || ts === '0000-00-00 00:00:00') return '—'
  const d = new Date(ts.replace(/-/g, '/'))
  if (isNaN(d.getTime())) return ts
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
  let h = d.getHours()
  const ampm = h >= 12 ? 'PM' : 'AM'
  h = h % 12 || 12
  const mins = String(d.getMinutes()).padStart(2, '0')
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()} at ${h}:${mins} ${ampm}`
}

function timeDifference(startTs, endTs) {
  if (!startTs || !endTs) return null
  const s = new Date(startTs.replace(/-/g, '/')).getTime()
  const e = new Date(endTs.replace(/-/g, '/')).getTime()
  if (isNaN(s) || isNaN(e) || e < s) return null
  const diffMins = Math.round((e - s) / 60000)
  if (diffMins < 60) return `${diffMins} min${diffMins === 1 ? '' : 's'}`
  const hrs = (diffMins / 60).toFixed(1)
  return `${hrs} hr${hrs === '1.0' ? '' : 's'}`
}

function getEventConfig(action = '') {
  const a = action.toLowerCase()
  if (a.includes('created')) {
    return {
      type: 'created',
      label: 'Query Created',
      icon: PlusCircle,
      accentColor: '#3b82f6',
      badgeBg: 'rgba(59, 130, 246, 0.15)',
      badgeText: '#60a5fa',
      badgeBorder: 'rgba(59, 130, 246, 0.35)',
      nodeBg: '#1e3a8a',
      cardBorder: 'rgba(59, 130, 246, 0.3)'
    }
  }
  if (a.includes('reply')) {
    return {
      type: 'reply',
      label: '1st Reply Sent',
      icon: MessageSquare,
      accentColor: '#06b6d4',
      badgeBg: 'rgba(6, 182, 212, 0.15)',
      badgeText: '#22d3ee',
      badgeBorder: 'rgba(6, 182, 212, 0.35)',
      nodeBg: '#164e63',
      cardBorder: 'rgba(6, 182, 212, 0.3)'
    }
  }
  if (a.includes('completed') || a.includes('mark comp')) {
    return {
      type: 'completed',
      label: 'Query Completed',
      icon: CheckCircle2,
      accentColor: '#10b981',
      badgeBg: 'rgba(16, 185, 129, 0.15)',
      badgeText: '#34d399',
      badgeBorder: 'rgba(16, 185, 129, 0.35)',
      nodeBg: '#064e3b',
      cardBorder: 'rgba(16, 185, 129, 0.3)'
    }
  }
  if (a.includes('issue') && !a.includes('resolved')) {
    return {
      type: 'issue',
      label: 'Issue Marked',
      icon: AlertTriangle,
      accentColor: '#ef4444',
      badgeBg: 'rgba(239, 68, 68, 0.15)',
      badgeText: '#f87171',
      badgeBorder: 'rgba(239, 68, 68, 0.35)',
      nodeBg: '#7f1d1d',
      cardBorder: 'rgba(239, 68, 68, 0.3)'
    }
  }
  if (a.includes('resolved') || a.includes('resolve')) {
    return {
      type: 'resolved',
      label: 'Issue Resolved',
      icon: ShieldCheck,
      accentColor: '#a855f7',
      badgeBg: 'rgba(168, 85, 247, 0.15)',
      badgeText: '#c084fc',
      badgeBorder: 'rgba(168, 85, 247, 0.35)',
      nodeBg: '#581c87',
      cardBorder: 'rgba(168, 85, 247, 0.3)'
    }
  }
  if (a.includes('extended') || a.includes('time')) {
    return {
      type: 'extended',
      label: 'Deadline Extended',
      icon: Clock,
      accentColor: '#f59e0b',
      badgeBg: 'rgba(245, 158, 11, 0.15)',
      badgeText: '#fbbf24',
      badgeBorder: 'rgba(245, 158, 11, 0.35)',
      nodeBg: '#78350f',
      cardBorder: 'rgba(245, 158, 11, 0.3)'
    }
  }
  if (a.includes('assigned') || a.includes('assign')) {
    return {
      type: 'assigned',
      label: 'Assignment Updated',
      icon: UserCheck,
      accentColor: '#6366f1',
      badgeBg: 'rgba(99, 102, 241, 0.15)',
      badgeText: '#818cf8',
      badgeBorder: 'rgba(99, 102, 241, 0.35)',
      nodeBg: '#312e81',
      cardBorder: 'rgba(99, 102, 241, 0.3)'
    }
  }
  return {
    type: 'field',
    label: action || 'Field Updated',
    icon: FileEdit,
    accentColor: '#ec4899',
    badgeBg: 'rgba(236, 72, 153, 0.15)',
    badgeText: '#f472b6',
    badgeBorder: 'rgba(236, 72, 153, 0.35)',
    nodeBg: '#831843',
    cardBorder: 'rgba(236, 72, 153, 0.3)'
  }
}

function fieldReadableName(f = '') {
  const map = {
    status: 'Status',
    completed_by: 'Assigned / Completed By',
    instruction: 'Notes & Instructions',
    project_name: 'Project',
    department: 'Department',
    'propery-order': 'Property Order',
    'query-received_datetime': 'Received Datetime',
    'query-first-reply_datetime': '1st Reply Datetime',
    reminder_hours: 'Reminder Deadline',
    type: 'Order Type',
    communication_medium: 'Communication Channel'
  }
  return map[f] || f
}

export default function QueryTimelineModal({ order, onClose }) {
  const [loading, setLoading] = useState(true)
  const [events, setEvents] = useState([])
  const [fullOrderData, setFullOrderData] = useState(order)
  const [filterTab, setFilterTab] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [copied, setCopied] = useState(false)
  const [expandedNodes, setExpandedNodes] = useState({})

  useEffect(() => {
    let mounted = true
    setLoading(true)
    fetch(`${API_URL}/get-query-history.php?order_id=${order.id}`, { credentials: 'same-origin' })
      .then(res => res.json())
      .then(data => {
        if (!mounted) return
        if (data.status === 'success') {
          setEvents(data.data || [])
          if (data.order) {
            setFullOrderData(prev => ({ ...prev, ...data.order }))
          }
        } else {
          setEvents([])
        }
        setLoading(false)
      })
      .catch(() => {
        if (!mounted) return
        setEvents([])
        setLoading(false)
      })
    return () => { mounted = false }
  }, [order.id])

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  const targetOrder = fullOrderData || order

  const filteredEvents = useMemo(() => {
    return events.filter(ev => {
      const config = getEventConfig(ev.action)
      if (filterTab === 'status' && !['completed', 'issue', 'resolved', 'assigned', 'created'].includes(config.type)) return false
      if (filterTab === 'fields' && config.type !== 'field' && config.type !== 'extended') return false
      if (filterTab === 'notes' && !ev.field_changed?.includes('instruction') && !ev.action?.toLowerCase().includes('note')) return false

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase()
        const matchUser = (ev.changed_by || '').toLowerCase().includes(q)
        const matchAction = (ev.action || '').toLowerCase().includes(q)
        const matchOld = (ev.old_value || '').toLowerCase().includes(q)
        const matchNew = (ev.new_value || '').toLowerCase().includes(q)
        const matchField = (ev.field_changed || '').toLowerCase().includes(q)
        if (!matchUser && !matchAction && !matchOld && !matchNew && !matchField) return false
      }
      return true
    })
  }, [events, filterTab, searchQuery])

  const firstReplyDuration = timeDifference(targetOrder['query-received_datetime'], targetOrder['query-first-reply_datetime'])
  const completionDuration = timeDifference(targetOrder['query-received_datetime'], targetOrder['query_done'] || targetOrder['query_manual_done'])
  const replyToCompleteDuration = timeDifference(targetOrder['query-first-reply_datetime'], targetOrder['query_done'] || targetOrder['query_manual_done'])

  const statusLower = (targetOrder.status || 'pending').toLowerCase()
  const statusColor = statusLower === 'completed' ? '#10b981' : statusLower === 'issue' ? '#ef4444' : '#f59e0b'

  const toggleNodeExpand = (id) => {
    setExpandedNodes(prev => ({ ...prev, [id]: !prev[id] }))
  }

  // Copy Timeline Summary to Clipboard
  const handleCopySummary = () => {
    const lines = [
      `=== QMS QUERY AUDIT TRAIL ===`,
      `Order ID: #${targetOrder.id}`,
      `Property: ${targetOrder['propery-order'] || 'N/A'}`,
      `Status: ${targetOrder.status || 'Pending'}`,
      `Project: ${targetOrder.project_name || 'N/A'} | Department: ${targetOrder.department || 'N/A'}`,
      `Entered By: ${targetOrder.qname || 'CSR'} on ${formatDateTime(targetOrder['query-received_datetime'])}`,
      `1st Reply SLA: ${firstReplyDuration || 'Pending'} (${formatDateTime(targetOrder['query-first-reply_datetime'])})`,
      `Assigned / Completed By: ${targetOrder.completed_by || 'Unassigned'}`,
      `----------------------------------------`,
      `TIMELINE EVENTS (${events.length}):`,
      ...events.map(ev => {
        const time = formatDateTime(ev.timestamp_pkt)
        const user = ev.changed_by || 'System'
        const act = ev.action
        const diff = ev.field_changed ? ` [${fieldReadableName(ev.field_changed)}: ${ev.old_value || 'None'} -> ${ev.new_value || 'None'}]` : ''
        return `- [${time}] ${act} by ${user}${diff}`
      })
    ]
    navigator.clipboard.writeText(lines.join('\n'))
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // Export CSV
  const handleExportCSV = () => {
    const headers = ['Order ID', 'Property Order', 'Timestamp PKT', 'Action', 'Performed By', 'Field Changed', 'Old Value', 'New Value']
    const rows = events.map(ev => [
      targetOrder.id,
      `"${(targetOrder['propery-order'] || '').replace(/"/g, '""')}"`,
      `"${ev.timestamp_pkt || ''}"`,
      `"${(ev.action || '').replace(/"/g, '""')}"`,
      `"${(ev.changed_by || '').replace(/"/g, '""')}"`,
      `"${(ev.field_changed || '').replace(/"/g, '""')}"`,
      `"${(ev.old_value || '').replace(/"/g, '""')}"`,
      `"${(ev.new_value || '').replace(/"/g, '""')}"`
    ])

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n')
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `query_audit_${targetOrder.id}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Export PDF Report using jsPDF + autoTable
  const handleExportPDF = async () => {
    try {
      const [{ default: jsPDF }, { default: autoTable }] = await Promise.all([
        import('jspdf'),
        import('jspdf-autotable')
      ])
      const doc = new jsPDF()

      // Header Banner
      doc.setFillColor(15, 23, 42)
      doc.rect(0, 0, 210, 28, 'F')
      doc.setTextColor(255, 255, 255)
      doc.setFontSize(16)
      doc.setFont('helvetica', 'bold')
      doc.text(`QMS Audit Trail Report — Order #${targetOrder.id}`, 14, 18)

      // Summary Details
      doc.setTextColor(30, 41, 59)
      doc.setFontSize(10)
      doc.setFont('helvetica', 'normal')

      let y = 36
      doc.setFont('helvetica', 'bold')
      doc.text(`Property / Order:`, 14, y)
      doc.setFont('helvetica', 'normal')
      doc.text(`${targetOrder['propery-order'] || 'N/A'}`, 55, y)

      y += 6
      doc.setFont('helvetica', 'bold')
      doc.text(`Status:`, 14, y)
      doc.setFont('helvetica', 'normal')
      doc.text(`${targetOrder.status || 'Pending'}`, 55, y)

      y += 6
      doc.setFont('helvetica', 'bold')
      doc.text(`Entered By / Datetime:`, 14, y)
      doc.setFont('helvetica', 'normal')
      doc.text(`${targetOrder.qname || 'CSR'} on ${formatDateTime(targetOrder['query-received_datetime'])}`, 55, y)

      y += 6
      doc.setFont('helvetica', 'bold')
      doc.text(`1st Reply SLA:`, 14, y)
      doc.setFont('helvetica', 'normal')
      doc.text(`${firstReplyDuration || 'Pending'} (${formatDateTime(targetOrder['query-first-reply_datetime'])})`, 55, y)

      y += 6
      doc.setFont('helvetica', 'bold')
      doc.text(`Completed / Assigned To:`, 14, y)
      doc.setFont('helvetica', 'normal')
      doc.text(`${targetOrder.completed_by || 'Unassigned'}`, 55, y)

      y += 10

      // Table of events
      const tableData = events.map(ev => [
        formatDateTime(ev.timestamp_pkt),
        ev.action || '—',
        ev.changed_by || 'CSR/System',
        ev.field_changed ? fieldReadableName(ev.field_changed) : '—',
        ev.old_value || '—',
        ev.new_value || '—'
      ])

      autoTable(doc, {
        startY: y,
        head: [['Timestamp (PKT)', 'Action', 'User', 'Field', 'Old Value', 'New Value']],
        body: tableData,
        theme: 'striped',
        headStyles: { fillStyle: 'F', fillColor: [15, 23, 42], textColor: [255, 255, 255], fontStyle: 'bold' },
        styles: { fontSize: 8, cellPadding: 3 }
      })

      doc.save(`QMS_Audit_Order_${targetOrder.id}.pdf`)
    } catch (err) {
      console.error('PDF export failed:', err)
    }
  }

  return (
    <div className="vtm-overlay" onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="vtm-title">
      <div className="vtm-modal" onClick={e => e.stopPropagation()}>
        {/* Header Bar */}
        <div className="vtm-header">
          <div className="vtm-header-left">
            <div className="vtm-title-row">
              <span className="vtm-order-badge">#{targetOrder.id}</span>
              <h2 id="vtm-title" className="vtm-order-property">
                {targetOrder['propery-order'] || 'Order History Timeline'}
              </h2>
              <span className="vtm-status-pill" style={{ color: statusColor, backgroundColor: `${statusColor}22`, borderColor: `${statusColor}55` }}>
                <span className="vtm-status-dot" style={{ backgroundColor: statusColor, boxShadow: `0 0 10px ${statusColor}` }} />
                {targetOrder.status || 'Pending'}
              </span>
            </div>
            <div className="vtm-subtitle-row">
              {targetOrder.project_name && (
                <span className="vtm-meta-chip project-chip">
                  <Tag size={11} className="inline mr-1 opacity-70" />
                  {targetOrder.project_name}
                </span>
              )}
              {targetOrder.department && (
                <span className="vtm-meta-chip dept-chip">
                  <Layers size={11} className="inline mr-1 opacity-70" />
                  {targetOrder.department}
                </span>
              )}
              {targetOrder.type && (
                <span className="vtm-meta-chip type-chip">
                  {targetOrder.type}
                </span>
              )}
              {targetOrder.communication_medium && (
                <span className="vtm-meta-chip medium-chip">
                  Channel: {targetOrder.communication_medium}
                </span>
              )}
            </div>
          </div>
          <button className="vtm-close-btn" onClick={onClose} aria-label="Close timeline modal">
            <X size={18} />
          </button>
        </div>

        {/* Stage-by-Stage SLA Duration Bar */}
        {(firstReplyDuration || replyToCompleteDuration) && (
          <div className="vtm-sla-stages-bar">
            <span className="vtm-sla-title">Stage Durations:</span>
            <div className="vtm-sla-chip">
              <span className="vtm-sla-label">Stage 1 (Entry → 1st Reply):</span>
              <span className="vtm-sla-val">{firstReplyDuration || 'Pending'}</span>
            </div>
            {replyToCompleteDuration && (
              <div className="vtm-sla-chip">
                <span className="vtm-sla-label">Stage 2 (1st Reply → Resolution):</span>
                <span className="vtm-sla-val">{replyToCompleteDuration}</span>
              </div>
            )}
          </div>
        )}

        {/* Executive Summary Cards */}
        <div className="vtm-summary-bar">
          <div className="vtm-summary-card card-entered">
            <div className="vtm-summary-header">
              <span className="vtm-summary-label">Query Entered By</span>
              <UserCheck size={14} className="text-blue-400 opacity-80" />
            </div>
            <span className="vtm-summary-val val-blue">{targetOrder.qname || '—'}</span>
            <span className="vtm-summary-sub">{formatDateTime(targetOrder['query-received_datetime'])}</span>
          </div>

          <div className="vtm-summary-card card-reply">
            <div className="vtm-summary-header">
              <span className="vtm-summary-label">1st Reply SLA</span>
              <Timer size={14} className="text-cyan-400 opacity-80" />
            </div>
            <span className="vtm-summary-val">
              {firstReplyDuration ? (
                <span className="vtm-reply-badge">{firstReplyDuration}</span>
              ) : (
                <span className="vtm-pending-tag">Pending</span>
              )}
            </span>
            <span className="vtm-summary-sub">{formatDateTime(targetOrder['query-first-reply_datetime'])}</span>
          </div>

          <div className="vtm-summary-card card-completed">
            <div className="vtm-summary-header">
              <span className="vtm-summary-label">Completed / Assigned</span>
              <CheckCircle2 size={14} className="text-emerald-400 opacity-80" />
            </div>
            <span className="vtm-summary-val val-green">{targetOrder.completed_by || 'Unassigned'}</span>
            <span className="vtm-summary-sub">
              {completionDuration ? `Total time: ${completionDuration}` : (targetOrder.status === 'completed' ? formatDateTime(targetOrder.query_done) : 'Active in Queue')}
            </span>
          </div>
        </div>

        {/* Controls: Search & Category Tabs */}
        <div className="vtm-controls">
          <div className="vtm-tabs">
            <button className={`vtm-tab ${filterTab === 'all' ? 'active' : ''}`} onClick={() => setFilterTab('all')}>
              All Events ({events.length})
            </button>
            <button className={`vtm-tab ${filterTab === 'status' ? 'active' : ''}`} onClick={() => setFilterTab('status')}>
              Status & Assignment
            </button>
            <button className={`vtm-tab ${filterTab === 'fields' ? 'active' : ''}`} onClick={() => setFilterTab('fields')}>
              Field Updates
            </button>
            <button className={`vtm-tab ${filterTab === 'notes' ? 'active' : ''}`} onClick={() => setFilterTab('notes')}>
              Notes
            </button>
          </div>

          <div className="vtm-search-box">
            <Search size={14} className="vtm-search-icon" />
            <input
              type="text"
              placeholder="Search timeline..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="vtm-search-input"
            />
            {searchQuery && (
              <button className="vtm-clear-search" onClick={() => setSearchQuery('')}>
                <X size={12} />
              </button>
            )}
          </div>
        </div>

        {/* Timeline Content Body */}
        <div className="vtm-body">
          {loading ? (
            <div className="vtm-loading-state">
              <div className="vtm-spinner" />
              <span>Fetching query audit history...</span>
            </div>
          ) : filteredEvents.length === 0 ? (
            <div className="vtm-empty-state">
              <Clock size={40} className="text-zinc-500 opacity-60" />
              <p className="vtm-empty-title">No timeline events found</p>
              <p className="vtm-empty-desc">
                {searchQuery ? `No activity matching "${searchQuery}"` : 'No history events recorded yet for this query.'}
              </p>
            </div>
          ) : (
            <div className="vtm-track">
              {filteredEvents.map((ev, index) => {
                const config = getEventConfig(ev.action)
                const IconComp = config.icon
                const isDiff = ev.old_value !== null || (ev.new_value !== null && ev.new_value !== '')
                const fieldName = fieldReadableName(ev.field_changed)
                const isExpanded = expandedNodes[ev.id || index]

                return (
                  <div key={ev.id || index} className="vtm-event-node" style={{ animationDelay: `${index * 0.04}s` }}>
                    {/* Node Dot with Lucide Icon */}
                    <div className="vtm-node-dot" style={{ backgroundColor: config.nodeBg, borderColor: config.accentColor, color: config.accentColor }}>
                      <IconComp size={15} />
                    </div>

                    {/* Timeline Event Card */}
                    <div className="vtm-card" style={{ borderColor: config.cardBorder }} onClick={() => toggleNodeExpand(ev.id || index)}>
                      <div className="vtm-card-header">
                        <div className="vtm-action-wrap">
                          <span className="vtm-action-pill" style={{ color: config.badgeText, backgroundColor: config.badgeBg, borderColor: config.badgeBorder }}>
                            {config.label}
                          </span>
                          {ev.is_synthetic && (
                            <span className="vtm-milestone-tag" title="Key lifecycle milestone synthesized from record timestamps">
                              <Sparkles size={10} className="inline mr-1" />
                              Milestone
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="vtm-time-stamp" title={ev.timestamp_pkt}>
                            <Calendar size={12} className="inline mr-1.5 opacity-60" />
                            {formatDateTime(ev.timestamp_pkt)}
                          </span>
                          <button className="vtm-expand-btn">
                            {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                          </button>
                        </div>
                      </div>

                      {/* Changed By User line */}
                      <div className="vtm-user-row">
                        <span className="vtm-user-avatar" style={{ backgroundColor: config.accentColor }}>
                          {(ev.changed_by || 'CSR').charAt(0).toUpperCase()}
                        </span>
                        <span className="vtm-user-name">{ev.changed_by || 'CSR / System'}</span>
                        <span className="vtm-user-role">performed action</span>
                      </div>

                      {/* Event Details / Diff Viewer */}
                      {isDiff && (
                        <div className="vtm-diff-box">
                          {ev.field_changed && (
                            <div className="vtm-field-tag" style={{ color: config.badgeText }}>{fieldName}</div>
                          )}
                          <div className="vtm-diff-content">
                            {ev.old_value && (
                              <span className="vtm-diff-old">{ev.old_value}</span>
                            )}
                            {ev.old_value && ev.new_value && (
                              <ArrowRight size={13} className="vtm-diff-arrow" />
                            )}
                            {ev.new_value && (
                              <span className="vtm-diff-new" style={{ color: config.accentColor }}>{ev.new_value}</span>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Expanded Technical Inspection Details */}
                      {isExpanded && (
                        <div className="vtm-expanded-details">
                          <div className="vtm-detail-row">
                            <span className="vtm-detail-key">Action Type:</span>
                            <span className="vtm-detail-val">{ev.action}</span>
                          </div>
                          <div className="vtm-detail-row">
                            <span className="vtm-detail-key">Raw Timestamp:</span>
                            <span className="vtm-detail-val">{ev.timestamp_pkt}</span>
                          </div>
                          <div className="vtm-detail-row">
                            <span className="vtm-detail-key">Event ID:</span>
                            <span className="vtm-detail-val">#{ev.id || 'N/A'}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Footer Toolbar: PDF, CSV, Copy Summary */}
        <div className="vtm-footer">
          <div className="vtm-footer-actions">
            <button className="vtm-btn-secondary" onClick={handleCopySummary} title="Copy Markdown summary to clipboard">
              {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
              <span>{copied ? 'Copied!' : 'Copy Summary'}</span>
            </button>
            <button className="vtm-btn-secondary" onClick={handleExportCSV} title="Export audit trail as CSV spreadsheet">
              <FileSpreadsheet size={14} />
              <span>CSV</span>
            </button>
            <button className="vtm-btn-secondary" onClick={handleExportPDF} title="Download official PDF report">
              <Download size={14} />
              <span>PDF Report</span>
            </button>
          </div>

          <button className="vtm-btn-primary" onClick={onClose}>
            Done
          </button>
        </div>
      </div>
    </div>
  )
}
