import React, { useState, useEffect, useMemo } from 'react'

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

function getEventMeta(action = '') {
  const a = action.toLowerCase()
  if (a.includes('created')) {
    return {
      type: 'created',
      label: 'Query Created',
      icon: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 5v14M5 12h14"/>
        </svg>
      ),
      color: '#3b82f6',
      bg: 'rgba(59, 130, 246, 0.16)',
      border: 'rgba(59, 130, 246, 0.4)',
      cardBg: 'rgba(59, 130, 246, 0.05)',
      cardBorder: 'rgba(59, 130, 246, 0.25)',
      glow: '0 0 16px rgba(59, 130, 246, 0.35)'
    }
  }
  if (a.includes('reply')) {
    return {
      type: 'reply',
      label: '1st Reply Sent',
      icon: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
        </svg>
      ),
      color: '#06b6d4',
      bg: 'rgba(6, 182, 212, 0.16)',
      border: 'rgba(6, 182, 212, 0.4)',
      cardBg: 'rgba(6, 182, 212, 0.05)',
      cardBorder: 'rgba(6, 182, 212, 0.25)',
      glow: '0 0 16px rgba(6, 182, 212, 0.35)'
    }
  }
  if (a.includes('completed') || a.includes('mark comp')) {
    return {
      type: 'completed',
      label: 'Query Completed',
      icon: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20 6 9 17 4 12"/>
        </svg>
      ),
      color: '#10b981',
      bg: 'rgba(16, 185, 129, 0.16)',
      border: 'rgba(16, 185, 129, 0.4)',
      cardBg: 'rgba(16, 185, 129, 0.05)',
      cardBorder: 'rgba(16, 185, 129, 0.25)',
      glow: '0 0 16px rgba(16, 185, 129, 0.35)'
    }
  }
  if (a.includes('issue') && !a.includes('resolved')) {
    return {
      type: 'issue',
      label: 'Issue Marked',
      icon: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
          <line x1="12" y1="9" x2="12" y2="13"/>
          <line x1="12" y1="17" x2="12.01" y2="17"/>
        </svg>
      ),
      color: '#ef4444',
      bg: 'rgba(239, 68, 68, 0.16)',
      border: 'rgba(239, 68, 68, 0.4)',
      cardBg: 'rgba(239, 68, 68, 0.05)',
      cardBorder: 'rgba(239, 68, 68, 0.25)',
      glow: '0 0 16px rgba(239, 68, 68, 0.35)'
    }
  }
  if (a.includes('resolved') || a.includes('resolve')) {
    return {
      type: 'resolved',
      label: 'Issue Resolved',
      icon: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
          <polyline points="22 4 12 14.01 9 11.01"/>
        </svg>
      ),
      color: '#8b5cf6',
      bg: 'rgba(139, 92, 246, 0.16)',
      border: 'rgba(139, 92, 246, 0.4)',
      cardBg: 'rgba(139, 92, 246, 0.05)',
      cardBorder: 'rgba(139, 92, 246, 0.25)',
      glow: '0 0 16px rgba(139, 92, 246, 0.35)'
    }
  }
  if (a.includes('extended') || a.includes('time')) {
    return {
      type: 'extended',
      label: 'Deadline Extended',
      icon: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"/>
          <polyline points="12 6 12 12 16 14"/>
        </svg>
      ),
      color: '#f59e0b',
      bg: 'rgba(245, 158, 11, 0.16)',
      border: 'rgba(245, 158, 11, 0.4)',
      cardBg: 'rgba(245, 158, 11, 0.05)',
      cardBorder: 'rgba(245, 158, 11, 0.25)',
      glow: '0 0 16px rgba(245, 158, 11, 0.35)'
    }
  }
  if (a.includes('assigned') || a.includes('assign')) {
    return {
      type: 'assigned',
      label: 'Assignment Updated',
      icon: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
          <circle cx="12" cy="7" r="4"/>
        </svg>
      ),
      color: '#6366f1',
      bg: 'rgba(99, 102, 241, 0.16)',
      border: 'rgba(99, 102, 241, 0.4)',
      cardBg: 'rgba(99, 102, 241, 0.05)',
      cardBorder: 'rgba(99, 102, 241, 0.25)',
      glow: '0 0 16px rgba(99, 102, 241, 0.35)'
    }
  }
  return {
    type: 'field',
    label: action || 'Field Updated',
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
      </svg>
    ),
    color: '#ec4899',
    bg: 'rgba(236, 72, 153, 0.16)',
    border: 'rgba(236, 72, 153, 0.4)',
    cardBg: 'rgba(236, 72, 153, 0.05)',
    cardBorder: 'rgba(236, 72, 153, 0.25)',
    glow: '0 0 16px rgba(236, 72, 153, 0.35)'
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
      const meta = getEventMeta(ev.action)
      if (filterTab === 'status' && !['completed', 'issue', 'resolved', 'assigned', 'created'].includes(meta.type)) return false
      if (filterTab === 'fields' && meta.type !== 'field' && meta.type !== 'extended') return false
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

  const statusLower = (targetOrder.status || 'pending').toLowerCase()
  const statusColor = statusLower === 'completed' ? '#10b981' : statusLower === 'issue' ? '#ef4444' : '#f59e0b'

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
                <span className="vtm-status-dot" style={{ backgroundColor: statusColor, boxShadow: `0 0 8px ${statusColor}` }} />
                {targetOrder.status || 'Pending'}
              </span>
            </div>
            <div className="vtm-subtitle-row">
              {targetOrder.project_name && <span className="vtm-meta-chip project-chip">{targetOrder.project_name}</span>}
              {targetOrder.department && <span className="vtm-meta-chip dept-chip">{targetOrder.department}</span>}
              {targetOrder.type && <span className="vtm-meta-chip type-chip">{targetOrder.type}</span>}
              {targetOrder.communication_medium && <span className="vtm-meta-chip medium-chip">Channel: {targetOrder.communication_medium}</span>}
            </div>
          </div>
          <button className="vtm-close-btn" onClick={onClose} aria-label="Close timeline modal">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Executive Summary Cards */}
        <div className="vtm-summary-bar">
          <div className="vtm-summary-card card-entered">
            <span className="vtm-summary-label">Query Entered By</span>
            <span className="vtm-summary-val val-blue">{targetOrder.qname || '—'}</span>
            <span className="vtm-summary-sub">{formatDateTime(targetOrder['query-received_datetime'])}</span>
          </div>

          <div className="vtm-summary-card card-reply">
            <span className="vtm-summary-label">1st Reply SLA</span>
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
            <span className="vtm-summary-label">Completed / Assigned</span>
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
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"/>
              <line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input
              type="text"
              placeholder="Search timeline..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="vtm-search-input"
            />
            {searchQuery && (
              <button className="vtm-clear-search" onClick={() => setSearchQuery('')}>✕</button>
            )}
          </div>
        </div>

        {/* Timeline Content Body */}
        <div className="vtm-body">
          {loading ? (
            <div className="vtm-loading-state">
              <div className="vtm-spinner" />
              <span>Loading query history timeline...</span>
            </div>
          ) : filteredEvents.length === 0 ? (
            <div className="vtm-empty-state">
              <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <circle cx="12" cy="12" r="10"/>
                <path d="M12 8v4l3 3"/>
              </svg>
              <p className="vtm-empty-title">No timeline events found</p>
              <p className="vtm-empty-desc">
                {searchQuery ? `No activity matching "${searchQuery}"` : 'No history events recorded yet for this query.'}
              </p>
            </div>
          ) : (
            <div className="vtm-track">
              {filteredEvents.map((ev, index) => {
                const meta = getEventMeta(ev.action)
                const isDiff = ev.old_value !== null || (ev.new_value !== null && ev.new_value !== '')
                const fieldName = fieldReadableName(ev.field_changed)

                return (
                  <div key={ev.id || index} className="vtm-event-node" style={{ animationDelay: `${index * 0.04}s` }}>
                    {/* Node Dot with Custom Icon and Glow */}
                    <div className="vtm-node-dot" style={{ backgroundColor: meta.bg, borderColor: meta.border, color: meta.color, boxShadow: meta.glow }}>
                      {meta.icon}
                    </div>

                    {/* Timeline Event Card with Custom Color Accent Border and Background Tint */}
                    <div className="vtm-card" style={{ backgroundColor: meta.cardBg, borderColor: meta.cardBorder }}>
                      <div className="vtm-card-header">
                        <div className="vtm-action-wrap">
                          <span className="vtm-action-pill" style={{ color: meta.color, backgroundColor: meta.bg, borderColor: meta.border }}>
                            {meta.label}
                          </span>
                          {ev.is_synthetic && (
                            <span className="vtm-milestone-tag" title="Key lifecycle milestone synthesized from record timestamps">
                              Milestone
                            </span>
                          )}
                        </div>

                        <span className="vtm-time-stamp" title={ev.timestamp_pkt}>
                          {formatDateTime(ev.timestamp_pkt)}
                        </span>
                      </div>

                      {/* Changed By User line */}
                      <div className="vtm-user-row">
                        <span className="vtm-user-avatar" style={{ backgroundColor: meta.color }}>
                          {(ev.changed_by || 'CSR').charAt(0).toUpperCase()}
                        </span>
                        <span className="vtm-user-name">{ev.changed_by || 'CSR / System'}</span>
                        <span className="vtm-user-role">performed action</span>
                      </div>

                      {/* Event Details / Diff Viewer */}
                      {isDiff && (
                        <div className="vtm-diff-box" style={{ borderColor: meta.cardBorder }}>
                          {ev.field_changed && (
                            <div className="vtm-field-tag" style={{ color: meta.color }}>{fieldName}</div>
                          )}
                          <div className="vtm-diff-content">
                            {ev.old_value && (
                              <span className="vtm-diff-old">{ev.old_value}</span>
                            )}
                            {ev.old_value && ev.new_value && (
                              <span className="vtm-diff-arrow">→</span>
                            )}
                            {ev.new_value && (
                              <span className="vtm-diff-new" style={{ color: meta.color }}>{ev.new_value}</span>
                            )}
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

        {/* Footer info bar */}
        <div className="vtm-footer">
          <div className="vtm-footer-info">
            Showing {filteredEvents.length} of {events.length} timeline actions · Timestamps in PKT (UTC+5)
          </div>
          <button className="vtm-btn-primary" onClick={onClose}>
            Done
          </button>
        </div>
      </div>
    </div>
  )
}
