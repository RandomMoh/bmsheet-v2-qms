import React, { useState, useEffect } from 'react'

const API = import.meta.env.VITE_API_URL || '/qms_react/api'

export default function SlackThreadViewer({ slackTs, orderId, onClose }) {
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!slackTs) {
      setError("No Slack timestamp available for this order.")
      setLoading(false)
      return
    }

    fetch(`${API}/get-slack-thread.php?ts=${slackTs}`)
      .then(r => r.json())
      .then(d => {
        if (d.status === 'success') setMessages(d.messages)
        else setError(d.message || "Could not fetch thread.")
        setLoading(false)
      })
      .catch(e => {
        setError("Network error fetching thread.")
        setLoading(false)
      })
  }, [slackTs])

  return (
    <>
      <div className="overlay" style={{ zIndex: 100 }} />
      <div className="dialog-wrap" style={{ zIndex: 101 }}>
        <div className="dialog fade-up" style={{ maxWidth: 600, background: 'var(--bg-panel)', border: '2px solid var(--border-strong)', borderRadius: 0, boxShadow: '8px 8px 0px rgba(0,0,0,0.2)' }} onClick={e => e.stopPropagation()}>
          <div className="dialog-head" style={{ borderBottom: '2px solid var(--border-strong)', padding: '16px 20px', background: 'var(--bg-sunken)' }}>
            <h2 style={{ fontFamily: 'monospace', margin: 0, fontSize: 16, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              SLACK_SYNC // ORDER {orderId || 'UNKNOWN'}
            </h2>
            <button className="dialog-close" onClick={onClose} style={{ background: 'var(--text-main)', color: 'var(--bg-panel)', border: 'none', borderRadius: 0, padding: '4px 10px', fontFamily: 'monospace', fontWeight: 'bold', cursor: 'pointer' }}>[X]</button>
          </div>
          <div className="dialog-body" style={{ padding: 0, maxHeight: '60vh', overflowY: 'auto' }}>
            {loading && (
              <div style={{ padding: 40, textAlign: 'center', fontFamily: 'monospace', color: 'var(--text-faint)' }}>
                <span className="terminal-blink">_</span> FETCHING_SECURE_THREAD...
              </div>
            )}
            {error && (
              <div style={{ padding: 40, textAlign: 'center', fontFamily: 'monospace', color: '#E61919' }}>
                [ERR] {error}
              </div>
            )}
            {!loading && !error && messages.length === 0 && (
              <div style={{ padding: 40, textAlign: 'center', fontFamily: 'monospace', color: 'var(--text-faint)' }}>
                NO_MESSAGES_FOUND.
              </div>
            )}
            {!loading && !error && messages.length > 0 && (
              <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {messages.map((m, i) => (
                  <div key={i} style={{ 
                    padding: '12px 16px', 
                    background: 'var(--bg-base)', 
                    borderLeft: '4px solid var(--accent-primary)',
                    fontFamily: 'monospace'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '11px', color: 'var(--text-faint)' }}>
                      <span style={{ fontWeight: 'bold', color: 'var(--text-main)' }}>USER: {m.user}</span>
                      <span>{m.date}</span>
                    </div>
                    <div style={{ fontSize: '13px', lineHeight: 1.5, color: 'var(--text-main)', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                      {m.text}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
