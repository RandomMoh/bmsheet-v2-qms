import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import './Dev.css' // Import the brutalist styles

const API_BASE = import.meta.env.VITE_API_BASE_URL

export default function Dev() {
  const [password, setPassword] = useState('')
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [channels, setChannels] = useState([])
  const [workspaces, setWorkspaces] = useState([])
  const [editingWsId, setEditingWsId] = useState(null)
  const [wsFormData, setWsFormData] = useState({ 
    team_id: '', 
    team_name: '', 
    bot_token_shift1: 'xoxb-2056924731457-10727441782816-ONexPALq6C1CYO6LPiAnsIiH', 
    bot_token_shift2: 'xoxb-2056924731457-10727441782816-ONexPALq6C1CYO6LPiAnsIiH', 
    bot_token_shift3: 'xoxb-2056924731457-10727441782816-ONexPALq6C1CYO6LPiAnsIiH' 
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [telemetry, setTelemetry] = useState(null)
  const [logs, setLogs] = useState([])
  const [logsLastMod, setLogsLastMod] = useState(null)
  const [logsPaused, setLogsPaused] = useState(false)
  const [webhookPaused, setWebhookPaused] = useState(false)
  const logsContainerRef = useState(null)
  
  const [activityLogs, setActivityLogs] = useState([])
  const [activityLoading, setActivityLoading] = useState(false)
  const [logFilterUser, setLogFilterUser] = useState('')
  const [logFilterAction, setLogFilterAction] = useState('')
  
  const [showPwdModal, setShowPwdModal] = useState(false)
  const [newPwd, setNewPwd] = useState('')
  const [pwdLoading, setPwdLoading] = useState(false)
  const [pwdMsg, setPwdMsg] = useState('')
  
  const [showMakerModal, setShowMakerModal] = useState(false)
  const [makerPwd, setMakerPwd] = useState('')
  const [makerLoading, setMakerLoading] = useState(false)
  const [makerMsg, setMakerMsg] = useState('')
  
  const navigate = useNavigate()

  useEffect(() => {
    let telInterval, logInterval;
    if (isAuthenticated) {
      fetchTelemetry()
      fetchLogs()
      fetchWebhookStatus()
      fetchActivityLogs()
      telInterval = setInterval(fetchTelemetry, 10000)
      logInterval = setInterval(() => { if (!logsPaused) fetchLogs() }, 3000)
    }
    return () => { clearInterval(telInterval); clearInterval(logInterval) }
  }, [isAuthenticated, logsPaused])

  const fetchTelemetry = async () => {
    try {
      const res = await fetch(`${API_BASE}/dev-telemetry.php`)
      if (res.ok) {
        const data = await res.json()
        setTelemetry(data)
      }
    } catch (err) { console.error(err) }
  }

  const fetchWebhookStatus = async () => {
    try {
      const res = await fetch(`${API_BASE}/dev-webhook-status.php`)
      if (res.ok) {
        const data = await res.json()
        setWebhookPaused(data.paused)
      }
    } catch (err) { console.error(err) }
  }

  const toggleWebhook = async () => {
    try {
      const res = await fetch(`${API_BASE}/dev-webhook-status.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paused: !webhookPaused })
      })
      if (res.ok) {
        const data = await res.json()
        setWebhookPaused(data.paused)
      }
    } catch (err) { console.error(err) }
  }

  const fetchLogs = async () => {
    try {
      const res = await fetch(`${API_BASE}/dev-logs.php?lines=80`)
      if (res.ok) {
        const data = await res.json()
        setLogs(data.logs || [])
        setLogsLastMod(data.last_modified || null)
        const el = logsContainerRef[0]
        if (el && !logsPaused) {
          const isNearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 80
          if (isNearBottom) el.scrollTop = el.scrollHeight
        }
      }
    } catch (err) { console.error(err) }
  }

  const fetchActivityLogs = async () => {
    setActivityLoading(true)
    try {
      const res = await fetch(`${API_BASE}/get-activity-logs.php`)
      if (res.ok) {
        const data = await res.json()
        setActivityLogs(data.data || [])
      }
    } catch (err) { console.error(err) }
    setActivityLoading(false)
  }

  const exportActivityLogsPDF = async () => {
    const [{ default: jsPDF }, { default: autoTable }] = await Promise.all([import('jspdf'), import('jspdf-autotable')])
    const doc = new jsPDF('p', 'mm', 'a4')
    doc.setFont('helvetica', 'bold'); doc.setFontSize(18); doc.setTextColor(15, 23, 42)
    doc.text('QMS — Activity Logs (Command Center)', 14, 20)
    doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(100, 116, 139)
    doc.text(`Exported: ${new Date().toLocaleString()}  |  ${activityLogs.length} records`, 14, 28)
    autoTable(doc, {
      startY: 34, theme: 'grid',
      head: [['ID', 'Time (PKT)', 'User', 'Role', 'Action', 'Details']],
      body: activityLogs.filter(l => (!logFilterUser || l.username === logFilterUser) && (!logFilterAction || l.action === logFilterAction)).map(l => [l.id, l.timestamp_pkt, l.username, l.role.toUpperCase(), l.action, l.details]),
      headStyles: { fillColor: [15, 23, 42], textColor: 255, fontSize: 8, fontStyle: 'bold' },
      bodyStyles: { fontSize: 8, textColor: [51, 65, 85] },
      columnStyles: { 0: { cellWidth: 15 }, 1: { cellWidth: 35 }, 2: { cellWidth: 30 }, 3: { cellWidth: 20 }, 4: { cellWidth: 35 }, 5: { cellWidth: 'auto' } }
    })
    doc.save(`qms_activity_logs_${new Date().getTime()}.pdf`)
  }

  const [editingId, setEditingId] = useState(null)
  const [formData, setFormData] = useState({ channel_id: '', channel_name: '', workspace_id: '', default_project: '', default_department: '', hint: '', is_active: 1 })

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPwdLoading(true);
    setPwdMsg('');
    try {
      const res = await fetch(`${API_BASE}/dev-change-password.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ new_password: newPwd })
      });
      const data = await res.json();
      setPwdMsg(data.message || (data.status === 'success' ? 'SUCCESS' : 'ERROR'));
      if (data.status === 'success') {
        setTimeout(() => {
          setShowPwdModal(false);
          setNewPwd('');
          setPwdMsg('');
        }, 2000);
      }
    } catch (err) {
      setPwdMsg('CONNECTION_ERROR');
    }
    setPwdLoading(false);
  }

  const handleUpdateMaker = async (e) => {
    e.preventDefault();
    setMakerLoading(true);
    setMakerMsg('');
    try {
      const res = await fetch(`${API_BASE}/dev-login-maker.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ new_password: makerPwd })
      });
      const data = await res.json();
      setMakerMsg(data.message || (data.status === 'success' ? 'SUCCESS' : 'ERROR'));
      if (data.status === 'success') {
        setTimeout(() => {
          setShowMakerModal(false);
          setMakerPwd('');
          setMakerMsg('');
        }, 2000);
      }
    } catch (err) {
      setMakerMsg('CONNECTION_ERROR');
    }
    setMakerLoading(false);
  }

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`${API_BASE}/dev-login.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      })
      const data = await res.json()
      if (data.status === 'success') {
        setIsAuthenticated(true)
        fetchChannels()
        fetchWorkspaces()
      } else {
        setError(data.message)
      }
    } catch (err) {
      setError('Connection failed')
    }
    setLoading(false)
  }

  const fetchChannels = async () => {
    try {
      const res = await fetch(`${API_BASE}/dev-channels.php`)
      if (res.status === 401) { setIsAuthenticated(false); return }
      const data = await res.json()
      setChannels(data)
    } catch (err) { console.error(err) }
  }

  const fetchWorkspaces = async () => {
    try {
      const res = await fetch(`${API_BASE}/dev-workspaces.php`)
      if (res.status === 401) { setIsAuthenticated(false); return }
      const data = await res.json()
      setWorkspaces(data)
    } catch (err) { console.error(err) }
  }

  const handleSaveWs = async (e) => {
    e.preventDefault()
    try {
      const res = await fetch(`${API_BASE}/dev-workspaces.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...wsFormData, id: editingWsId })
      })
      if (res.ok) {
        setEditingWsId(null)
        setWsFormData({ 
          team_id: '', 
          team_name: '', 
          bot_token_shift1: 'xoxb-2056924731457-10727441782816-ONexPALq6C1CYO6LPiAnsIiH', 
          bot_token_shift2: 'xoxb-2056924731457-10727441782816-ONexPALq6C1CYO6LPiAnsIiH', 
          bot_token_shift3: 'xoxb-2056924731457-10727441782816-ONexPALq6C1CYO6LPiAnsIiH' 
        })
        fetchWorkspaces()
      }
    } catch (err) { console.error(err) }
  }

  const handleDeleteWs = async (id) => {
    if (!window.confirm('Delete workspace? This will fail if channels are attached.')) return
    try {
      const res = await fetch(`${API_BASE}/dev-workspaces.php`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      })
      if (!res.ok) {
        const data = await res.json()
        alert(data.message)
      } else {
        fetchWorkspaces()
      }
    } catch (err) { console.error(err) }
  }

  const handleEditWs = (w) => {
    setEditingWsId(w.id)
    setWsFormData({
      team_id: w.team_id, team_name: w.team_name, bot_token_shift1: w.bot_token_shift1, bot_token_shift2: w.bot_token_shift2, bot_token_shift3: w.bot_token_shift3
    })
  }

  const handleSave = async (e) => {
    e.preventDefault()
    try {
      const res = await fetch(`${API_BASE}/dev-channels.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, id: editingId })
      })
      if (res.ok) {
        setEditingId(null)
        setFormData({ channel_id: '', channel_name: '', workspace_id: '', default_project: '', default_department: '', hint: '', is_active: 1 })
        fetchChannels()
      }
    } catch (err) { console.error(err) }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Delete channel configuration?')) return
    try {
      await fetch(`${API_BASE}/dev-channels.php`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      })
      fetchChannels()
    } catch (err) { console.error(err) }
  }

  const handleEdit = (c) => {
    setEditingId(c.id)
    setFormData({
      channel_id: c.channel_id, channel_name: c.channel_name, workspace_id: c.workspace_id || '', default_project: c.default_project, default_department: c.default_department, hint: c.hint, is_active: c.is_active
    })
  }

  if (!isAuthenticated) {
    return (
      <div className="dev-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="stagger-item brutalist-box" style={{ padding: '40px', width: '400px', position: 'relative' }}>
          <div style={{ position: 'absolute', top: '-10px', left: '-10px', color: '#E61919', fontSize: 24, lineHeight: 1 }}>+</div>
          <div style={{ position: 'absolute', top: '-10px', right: '-10px', color: '#E61919', fontSize: 24, lineHeight: 1 }}>+</div>
          <div style={{ position: 'absolute', bottom: '-10px', left: '-10px', color: '#E61919', fontSize: 24, lineHeight: 1 }}>+</div>
          <div style={{ position: 'absolute', bottom: '-10px', right: '-10px', color: '#E61919', fontSize: 24, lineHeight: 1 }}>+</div>

          <h2 className="dev-header-font" style={{ margin: '0 0 8px 0', fontSize: '32px', color: '#EAEAEA' }}>[ AUTH_SYS ]</h2>
          <p style={{ margin: '0 0 32px 0', fontSize: '13px', color: '#71717A', letterSpacing: '0.05em' }}>/// TACTICAL TELEMETRY TERMINAL V2.6</p>
          
          {error && <div style={{ color: '#E61919', marginBottom: '24px', fontSize: '14px', borderLeft: '4px solid #E61919', paddingLeft: '12px' }}>[ERR] {error}</div>}
          
          <form onSubmit={handleLogin}>
            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', fontSize: '12px', marginBottom: '8px', color: '#71717A', letterSpacing: '0.1em' }}>{'>'} PASSPHRASE_INPUT <span className="terminal-blink">_</span></label>
              <input 
                type="password" 
                value={password} 
                onChange={e => setPassword(e.target.value.slice(0, 20))} 
                maxLength={20}
                className="brutalist-input" 
                style={{ width: '100%', boxSizing: 'border-box' }} 
              />
            </div>
            <button type="submit" disabled={loading} className="brutalist-btn brutalist-btn-primary" style={{ width: '100%' }}>
              {loading ? 'VERIFYING...' : 'INITIATE CONNECTION'}
            </button>
          </form>
          <div className="brutalist-hr" style={{ marginTop: '32px', marginBottom: '24px' }}></div>
          <button onClick={() => navigate('/')} className="brutalist-btn brutalist-btn-ghost" style={{ width: '100%', fontSize: '12px' }}>
            {`<<<`} ABORT TO PORTAL
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="dev-container dev-main-pad">
      <div className="stagger-item dev-header-flex">
        <div>
          <h2 className="dev-header-font" style={{ margin: '0 0 12px 0', fontSize: 'clamp(2rem, 5vw, 4rem)', lineHeight: 0.9 }}>
            QMS_TELEMETRY<span style={{color: '#E61919'}}>.SYS</span>
          </h2>
          <p style={{ margin: 0, color: '#71717A', fontSize: '14px', letterSpacing: '0.1em' }}>
          </p>
        </div>
        <div className="dev-actions-group">
          {telemetry && (
            <div className="brutalist-box dev-telemetry-box">
              <div>
                <div style={{ fontSize: '10px', color: '#71717A', letterSpacing: '0.1em', marginBottom: '4px' }}>GROQ_REMAINING_REQS</div>
                <div className="dev-header-font" style={{ fontSize: '20px', color: '#EAEAEA' }}>{telemetry.remaining_requests !== null ? telemetry.remaining_requests.toLocaleString() : '---'}</div>
              </div>
              <div className="dev-telemetry-divider"></div>
              <div>
                <div style={{ fontSize: '10px', color: '#71717A', letterSpacing: '0.1em', marginBottom: '4px' }}>GROQ_REMAINING_TOKENS</div>
                <div className="dev-header-font" style={{ fontSize: '20px', color: '#EAEAEA' }}>{telemetry.remaining_tokens !== null ? telemetry.remaining_tokens.toLocaleString() : '---'}</div>
              </div>
            </div>
          )}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <button onClick={toggleWebhook} className="brutalist-btn brutalist-btn-ghost" style={{ height: 'fit-content', borderColor: webhookPaused ? '#E61919' : '#333', color: webhookPaused ? '#E61919' : '' }}>
              {webhookPaused ? 'RESUME_WEBHOOK' : 'PAUSE_WEBHOOK'}
            </button>
            <button onClick={() => setShowPwdModal(true)} className="brutalist-btn brutalist-btn-ghost" style={{ height: 'fit-content', borderColor: '#333' }}>
              CHG_PASSPHRASE
            </button>
            <button onClick={() => setShowMakerModal(true)} className="brutalist-btn brutalist-btn-ghost" style={{ height: 'fit-content', borderColor: '#333' }}>
              SET_LOGIN_MAKER_KEY
            </button>
          </div>
          <button onClick={() => setIsAuthenticated(false)} className="brutalist-btn brutalist-btn-ghost" style={{ height: 'fit-content' }}>
            TERMINATE_SESSION
          </button>
        </div>
      </div>

      <div className="brutalist-hr" style={{ marginBottom: '48px' }}></div>

      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '60px', alignItems: 'start', marginBottom: '60px' }}>
        <div className="dev-grid-layout" style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '60px', alignItems: 'start' }}>
          <div className="stagger-item brutalist-box" style={{ padding: '32px', position: 'relative' }}>
            <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '4px', backgroundColor: '#2DD4BF' }}></div>
            <h3 className="dev-header-font" style={{ margin: '0 0 32px 0', fontSize: '24px', borderBottom: '1px solid #333', paddingBottom: '16px' }}>
              {editingWsId ? '[ UPDATE_WORKSPACE ]' : '[ ADD_WORKSPACE ]'}
            </h3>
            <form onSubmit={handleSaveWs} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', marginBottom: '8px', color: '#71717A', letterSpacing: '0.1em' }}>TEAM_ID (REQ)</label>
                  <input required value={wsFormData.team_id} onChange={e=>setWsFormData({...wsFormData, team_id: e.target.value})} className="brutalist-input" style={{ width: '100%', boxSizing: 'border-box' }} placeholder="e.g. T061EG9R6" />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', marginBottom: '8px', color: '#71717A', letterSpacing: '0.1em' }}>TEAM_NAME (REQ)</label>
                  <input required value={wsFormData.team_name} onChange={e=>setWsFormData({...wsFormData, team_name: e.target.value})} className="brutalist-input" style={{ width: '100%', boxSizing: 'border-box' }} placeholder="e.g. Benchmark Studio" />
                </div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '11px', marginBottom: '8px', color: '#71717A', letterSpacing: '0.1em' }}>BOT_TOKEN_SHIFT1 (REQ)</label>
                <input required value={wsFormData.bot_token_shift1} onChange={e=>setWsFormData({...wsFormData, bot_token_shift1: e.target.value})} className="brutalist-input" style={{ width: '100%', boxSizing: 'border-box' }} placeholder="xoxb-..." />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '11px', marginBottom: '8px', color: '#71717A', letterSpacing: '0.1em' }}>BOT_TOKEN_SHIFT2 (REQ)</label>
                <input required value={wsFormData.bot_token_shift2} onChange={e=>setWsFormData({...wsFormData, bot_token_shift2: e.target.value})} className="brutalist-input" style={{ width: '100%', boxSizing: 'border-box' }} placeholder="xoxb-..." />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '11px', marginBottom: '8px', color: '#71717A', letterSpacing: '0.1em' }}>BOT_TOKEN_SHIFT3 (REQ)</label>
                <input required value={wsFormData.bot_token_shift3} onChange={e=>setWsFormData({...wsFormData, bot_token_shift3: e.target.value})} className="brutalist-input" style={{ width: '100%', boxSizing: 'border-box' }} placeholder="xoxb-..." />
              </div>
              <div className="dev-actions-group" style={{ marginTop: '16px' }}>
                <button type="submit" className="brutalist-btn brutalist-btn-primary" style={{ backgroundColor: '#2DD4BF', color: '#000' }}>{editingWsId ? 'COMMIT_UPDATE' : 'ENGAGE'}</button>
                {editingWsId && <button type="button" onClick={() => { setEditingWsId(null); setWsFormData({ 
                  team_id: '', 
                  team_name: '', 
                  bot_token_shift1: 'xoxb-2056924731457-10727441782816-ONexPALq6C1CYO6LPiAnsIiH', 
                  bot_token_shift2: 'xoxb-2056924731457-10727441782816-ONexPALq6C1CYO6LPiAnsIiH', 
                  bot_token_shift3: 'xoxb-2056924731457-10727441782816-ONexPALq6C1CYO6LPiAnsIiH' 
                }) }} className="brutalist-btn brutalist-btn-ghost">CANCEL</button>}
              </div>
            </form>
          </div>

          <div style={{ display: 'grid', gap: '1px', backgroundColor: '#333333', border: '1px solid #333333' }}>
            <div className="stagger-item dev-table-row" style={{ display: 'none', gap: '1px', backgroundColor: '#333333' }}>
              <div style={{ padding: '12px 16px', backgroundColor: '#050505', color: '#71717A', fontSize: '11px', letterSpacing: '0.1em' }}>TEAM_ID</div>
              <div style={{ padding: '12px 16px', backgroundColor: '#050505', color: '#71717A', fontSize: '11px', letterSpacing: '0.1em' }}>NAME</div>
              <div style={{ padding: '12px 16px', backgroundColor: '#050505', color: '#71717A', fontSize: '11px', letterSpacing: '0.1em', textAlign: 'right' }}>COMMANDS</div>
            </div>
            {workspaces.map((w, idx) => (
              <div key={w.id} className="stagger-item dev-table-row" style={{ display: 'grid', gridTemplateColumns: 'minmax(150px, 1fr) 1fr 180px', gap: '1px', backgroundColor: '#333333' }}>
                <div style={{ padding: '20px 16px', backgroundColor: '#0A0A0A', display: 'flex', alignItems: 'center' }}>
                  <span style={{ fontSize: '14px', color: '#EAEAEA', fontWeight: 700 }}>{w.team_id}</span>
                </div>
                <div style={{ padding: '20px 16px', backgroundColor: '#0A0A0A', display: 'flex', alignItems: 'center', fontSize: '13px' }}>{w.team_name}</div>
                <div style={{ padding: '20px 16px', backgroundColor: '#0A0A0A', display: 'flex', gap: '8px', alignItems: 'center', justifyContent: 'flex-end' }}>
                  <button onClick={() => handleEditWs(w)} className="brutalist-btn brutalist-btn-ghost" style={{ padding: '8px 12px', fontSize: '11px' }}>EDIT</button>
                  <button onClick={() => handleDeleteWs(w.id)} className="brutalist-btn brutalist-btn-danger" style={{ padding: '8px 12px', fontSize: '11px' }}>KILL</button>
                </div>
              </div>
            ))}
            {workspaces.length === 0 && (
              <div style={{ padding: '60px', backgroundColor: '#0A0A0A', textAlign: 'center', color: '#71717A', gridColumn: '1 / -1' }}>
                NO_WORKSPACES_FOUND.
              </div>
            )}
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '60px', alignItems: 'start' }}>
        <style>{`@media (min-width: 1024px) { .dev-grid-layout { grid-template-columns: 400px 1fr !important; } }`}</style>
        <div className="dev-grid-layout" style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '60px', alignItems: 'start' }}>
          {/* LEFT COLUMN: FORM */}
          <div className="stagger-item brutalist-box" style={{ padding: '32px', position: 'relative', animationDelay: '0.1s' }}>
            <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '4px', backgroundColor: '#E61919' }}></div>
            <h3 className="dev-header-font" style={{ margin: '0 0 32px 0', fontSize: '24px', borderBottom: '1px solid #333', paddingBottom: '16px' }}>
              {editingId ? '[ CONFIG_UPDATE ]' : '[ NEW_DIRECTIVE ]'}
            </h3>
            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '11px', marginBottom: '8px', color: '#71717A', letterSpacing: '0.1em' }}>CHANNEL_ID (REQ)</label>
                <input required value={formData.channel_id} onChange={e=>setFormData({...formData, channel_id: e.target.value})} className="brutalist-input" style={{ width: '100%', boxSizing: 'border-box' }} />
              </div>
              
              <div>
                <label style={{ display: 'block', fontSize: '11px', marginBottom: '8px', color: '#71717A', letterSpacing: '0.1em' }}>WORKSPACE (OPTIONAL/DEFAULT)</label>
                <select value={formData.workspace_id} onChange={e=>setFormData({...formData, workspace_id: e.target.value})} className="brutalist-input" style={{ width: '100%', boxSizing: 'border-box', appearance: 'none', backgroundColor: '#050505', color: '#EAEAEA' }}>
                  <option value="">[ NONE_SELECTED ]</option>
                  {workspaces.map(w => <option key={w.id} value={w.id}>{w.team_name} ({w.team_id})</option>)}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '11px', marginBottom: '8px', color: '#71717A', letterSpacing: '0.1em' }}>CHANNEL_NAME (REQ)</label>
                <input required value={formData.channel_name} onChange={e=>setFormData({...formData, channel_name: e.target.value})} className="brutalist-input" style={{ width: '100%', boxSizing: 'border-box' }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', marginBottom: '8px', color: '#71717A', letterSpacing: '0.1em' }}>DEF_PROJECT</label>
                  <input value={formData.default_project} onChange={e=>setFormData({...formData, default_project: e.target.value})} className="brutalist-input" style={{ width: '100%', boxSizing: 'border-box' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', marginBottom: '8px', color: '#71717A', letterSpacing: '0.1em' }}>DEF_DEPARTMENT</label>
                  <input value={formData.default_department} onChange={e=>setFormData({...formData, default_department: e.target.value})} className="brutalist-input" style={{ width: '100%', boxSizing: 'border-box' }} />
                </div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '11px', marginBottom: '8px', color: '#71717A', letterSpacing: '0.1em' }}>AI_CONTEXT_MATRIX</label>
                <textarea value={formData.hint} onChange={e=>setFormData({...formData, hint: e.target.value})} className="brutalist-input" style={{ width: '100%', boxSizing: 'border-box', height: '120px', resize: 'vertical' }} />
              </div>
              <label style={{ display: 'flex', gap: '12px', alignItems: 'center', fontSize: '13px', cursor: 'pointer', color: '#EAEAEA' }}>
                <input type="checkbox" checked={formData.is_active == 1} onChange={e=>setFormData({...formData, is_active: e.target.checked ? 1 : 0})} style={{ width: '20px', height: '20px', accentColor: '#E61919', cursor: 'pointer' }} />
                [ ACTIVE_STATUS ]
              </label>
              <div className="dev-actions-group" style={{ marginTop: '16px' }}>
                <button type="submit" className="brutalist-btn brutalist-btn-primary">{editingId ? 'COMMIT_UPDATE' : 'ENGAGE'}</button>
                {editingId && <button type="button" onClick={() => { setEditingId(null); setFormData({ channel_id: '', channel_name: '', workspace_id: '', default_project: '', default_department: '', hint: '', is_active: 1 }) }} className="brutalist-btn brutalist-btn-ghost">CANCEL</button>}
              </div>
            </form>
          </div>

          {/* RIGHT COLUMN: LIST */}
          <div style={{ display: 'grid', gap: '1px', backgroundColor: '#333333', border: '1px solid #333333' }}>
            <style>{`
              .dev-table-row { grid-template-columns: 1fr; }
              @media (min-width: 768px) { .dev-table-row { grid-template-columns: minmax(180px, 1fr) 1fr 1fr 1fr 180px !important; } }
            `}</style>
            
            {/* Header Row (Desktop Only) */}
            <div className="stagger-item dev-table-row" style={{ display: 'none', gap: '1px', backgroundColor: '#333333', animationDelay: '0.2s' }}>
              <style>{`@media (min-width: 768px) { .dev-table-row:first-of-type { display: grid !important; } }`}</style>
              <div style={{ padding: '12px 16px', backgroundColor: '#050505', color: '#71717A', fontSize: '11px', letterSpacing: '0.1em' }}>CHANNEL_ID</div>
              <div style={{ padding: '12px 16px', backgroundColor: '#050505', color: '#71717A', fontSize: '11px', letterSpacing: '0.1em' }}>NAME</div>
              <div style={{ padding: '12px 16px', backgroundColor: '#050505', color: '#71717A', fontSize: '11px', letterSpacing: '0.1em' }}>PROJECT</div>
              <div style={{ padding: '12px 16px', backgroundColor: '#050505', color: '#71717A', fontSize: '11px', letterSpacing: '0.1em' }}>DEPT</div>
              <div style={{ padding: '12px 16px', backgroundColor: '#050505', color: '#71717A', fontSize: '11px', letterSpacing: '0.1em', textAlign: 'right' }}>COMMANDS</div>
            </div>

            {channels.map((c, idx) => (
              <div key={c.id} className="stagger-item dev-table-row" style={{ display: 'grid', gap: '1px', backgroundColor: '#333333', animationDelay: `${0.25 + (idx * 0.05)}s` }}>
                <div style={{ padding: '20px 16px', backgroundColor: '#0A0A0A', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                  <span style={{ fontSize: '14px', color: '#EAEAEA', fontWeight: 700 }}>{c.channel_id}</span>
                  {!c.is_active && <span style={{ marginTop: '8px', fontSize: '10px', background: 'transparent', border: '1px solid #E61919', color: '#E61919', padding: '2px 6px', display: 'inline-block', width: 'fit-content' }}>OFFLINE</span>}
                </div>
                <div style={{ padding: '20px 16px', backgroundColor: '#0A0A0A', display: 'flex', alignItems: 'center', fontSize: '13px' }}>#{c.channel_name}</div>
                <div style={{ padding: '20px 16px', backgroundColor: '#0A0A0A', display: 'flex', alignItems: 'center', fontSize: '13px', color: '#71717A' }}>{c.default_project || 'NULL'}</div>
                <div style={{ padding: '20px 16px', backgroundColor: '#0A0A0A', display: 'flex', alignItems: 'center', fontSize: '13px', color: '#71717A' }}>{c.default_department || 'NULL'}</div>
                <div style={{ padding: '20px 16px', backgroundColor: '#0A0A0A', display: 'flex', gap: '8px', alignItems: 'center', justifyContent: 'flex-end' }}>
                  <button onClick={() => handleEdit(c)} className="brutalist-btn brutalist-btn-ghost" style={{ padding: '8px 12px', fontSize: '11px' }}>EDIT</button>
                  <button onClick={() => handleDelete(c.id)} className="brutalist-btn brutalist-btn-danger" style={{ padding: '8px 12px', fontSize: '11px' }}>KILL</button>
                </div>
                {c.hint && (
                  <div style={{ gridColumn: '1 / -1', padding: '16px', backgroundColor: '#050505', borderTop: '1px dashed #333333', fontSize: '12px', color: '#71717A' }}>
                    <span style={{ color: '#EAEAEA' }}>[AI_MATRIX]:</span> {c.hint}
                  </div>
                )}
              </div>
            ))}
            {channels.length === 0 && (
              <div style={{ padding: '60px', backgroundColor: '#0A0A0A', textAlign: 'center', color: '#71717A', gridColumn: '1 / -1' }}>
                NO_ACTIVE_CHANNELS_FOUND. AWAITING_INPUT...
              </div>
            )}
          </div>
        </div>

        {/* LIVE LOG VIEWER */}
        <div className="stagger-item" style={{ animationDelay: '0.4s' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div>
              <h3 className="dev-header-font" style={{ margin: '0 0 4px 0', fontSize: '20px' }}>
                [ LIVE_PROCESS_LOG ] <span className="terminal-blink" style={{ color: '#E61919', fontSize: '14px' }}>●</span>
              </h3>
              <p style={{ margin: 0, fontSize: '11px', color: '#71717A', letterSpacing: '0.05em' }}>
                {logsLastMod ? `LAST_UPDATE: ${logsLastMod}` : 'AWAITING_FIRST_TRIGGER...'} — AUTO-REFRESH: {logsPaused ? <span style={{ color: '#E61919' }}>PAUSED</span> : <span style={{ color: '#4CAF50' }}>3s</span>}
              </p>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={() => setLogsPaused(p => !p)} className="brutalist-btn brutalist-btn-ghost" style={{ padding: '6px 14px', fontSize: '11px' }}>
                {logsPaused ? 'RESUME' : 'PAUSE'}
              </button>
              <button onClick={fetchLogs} className="brutalist-btn brutalist-btn-ghost" style={{ padding: '6px 14px', fontSize: '11px' }}>↺ REFRESH</button>
              <button onClick={() => setLogs([])} className="brutalist-btn brutalist-btn-danger" style={{ padding: '6px 14px', fontSize: '11px' }}>CLEAR</button>
            </div>
          </div>
          <div
            ref={el => { if (el) logsContainerRef[0] = el }}
            style={{
            backgroundColor: '#010101',
            border: '1px solid #333',
            height: '380px',
            overflowY: 'auto',
            padding: '20px',
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: '12px',
            lineHeight: '1.8',
            position: 'relative',
          }}>
            {/* Top accent bar */}
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: 'linear-gradient(90deg, #E61919, transparent)' }} />
            {logs.length === 0 ? (
              <div style={{ color: '#333', textAlign: 'center', paddingTop: '140px' }}>
                NO_LOGS_FOUND. AWAITING_WEBHOOK_TRIGGER...<span className="terminal-blink">_</span>
              </div>
            ) : (
              logs.map((line, i) => {
                let color = '#71717A'
                let prefix = '>'
                if (line.includes('Webhook triggered')) { color = '#4CAF50'; prefix = '▶' }
                else if (line.includes('SKIPPED') || line.includes('failed') || line.includes('ERROR') || line.includes('error')) { color = '#E61919'; prefix = '✕' }
                else if (line.includes('SUCCESS') || line.includes('Inserted') || line.includes('reacted')) { color = '#2DD4BF'; prefix = '✓' }
                else if (line.includes('Bot/subtype') || line.includes('Ignoring') || line.includes('already has')) { color = '#555'; prefix = '—' }
                else if (line.includes('Groq') || line.includes('AI') || line.includes('Gemini')) { color = '#F59E0B'; prefix = '⚡' }
                else if (line.includes('Processing')) { color = '#A78BFA'; prefix = '⟳' }
                return (
                  <div key={i} style={{ display: 'flex', gap: '12px', marginBottom: '2px' }}>
                    <span style={{ color: '#333', flexShrink: 0, userSelect: 'none' }}>{String(i + 1).padStart(3, '0')}</span>
                    <span style={{ color: '#444', flexShrink: 0, userSelect: 'none' }}>{prefix}</span>
                    <span style={{ color, wordBreak: 'break-all' }}>{line}</span>
                  </div>
                )
              })
            )}
            <div />
          </div>
        </div>

        {/* SYSTEM ACTIVITY MONITOR */}
        <div className="stagger-item" style={{ animationDelay: '0.5s', marginTop: '60px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '16px', flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <h3 className="dev-header-font" style={{ margin: '0 0 4px 0', fontSize: '20px' }}>
                [ SYSTEM_ACTIVITY_MONITOR ] {activityLoading && <span className="terminal-blink" style={{ color: '#2DD4BF', fontSize: '14px' }}>●</span>}
              </h3>
              <p style={{ margin: 0, fontSize: '11px', color: '#71717A', letterSpacing: '0.05em' }}>
                TRACKING_USER_ACTIONS. DISPLAYING: {activityLogs.filter(l => (!logFilterUser || l.username === logFilterUser) && (!logFilterAction || l.action === logFilterAction)).length}
              </p>
            </div>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <select value={logFilterUser} onChange={e => setLogFilterUser(e.target.value)} className="brutalist-input" style={{ padding: '6px 14px', fontSize: '11px', backgroundColor: '#050505', color: '#EAEAEA' }}>
                <option value="">[ ALL_USERS ]</option>
                {Array.from(new Set(activityLogs.map(l => l.username))).map(u => <option key={u} value={u}>{u}</option>)}
              </select>
              <select value={logFilterAction} onChange={e => setLogFilterAction(e.target.value)} className="brutalist-input" style={{ padding: '6px 14px', fontSize: '11px', backgroundColor: '#050505', color: '#EAEAEA' }}>
                <option value="">[ ALL_ACTIONS ]</option>
                {Array.from(new Set(activityLogs.map(l => l.action))).map(a => <option key={a} value={a}>{a}</option>)}
              </select>
              <button onClick={fetchActivityLogs} className="brutalist-btn brutalist-btn-ghost" style={{ padding: '6px 14px', fontSize: '11px' }}>↺ REFRESH</button>
              <button onClick={exportActivityLogsPDF} className="brutalist-btn brutalist-btn-primary" style={{ padding: '6px 14px', fontSize: '11px', backgroundColor: '#2DD4BF', color: '#000' }}>EXPORT_PDF</button>
            </div>
          </div>
          
          <div style={{ display: 'grid', gap: '1px', backgroundColor: '#333333', border: '1px solid #333333' }}>
            <div className="dev-table-row" style={{ display: 'grid', gridTemplateColumns: 'minmax(60px, 80px) minmax(140px, 180px) minmax(120px, 150px) minmax(80px, 100px) minmax(120px, 160px) 1fr', gap: '1px', backgroundColor: '#333333' }}>
              {['ID', 'TIME_PKT', 'USER', 'ROLE', 'ACTION', 'DETAILS'].map(h => (
                <div key={h} style={{ padding: '12px 16px', backgroundColor: '#050505', color: '#71717A', fontSize: '11px', letterSpacing: '0.1em' }}>{h}</div>
              ))}
            </div>
            
            <div style={{ maxHeight: '400px', overflowY: 'auto', backgroundColor: '#010101', display: 'flex', flexDirection: 'column', gap: '1px' }}>
              {activityLogs.filter(l => (!logFilterUser || l.username === logFilterUser) && (!logFilterAction || l.action === logFilterAction)).length === 0 ? (
                <div style={{ padding: '60px', backgroundColor: '#0A0A0A', textAlign: 'center', color: '#71717A' }}>
                  NO_ACTIVITY_LOGS_FOUND.
                </div>
              ) : activityLogs.filter(l => (!logFilterUser || l.username === logFilterUser) && (!logFilterAction || l.action === logFilterAction)).map(l => (
                <div key={l.id} style={{ display: 'grid', gridTemplateColumns: 'minmax(60px, 80px) minmax(140px, 180px) minmax(120px, 150px) minmax(80px, 100px) minmax(120px, 160px) 1fr', gap: '1px', backgroundColor: '#333333' }}>
                  <div style={{ padding: '12px 16px', backgroundColor: '#0A0A0A', fontSize: '13px', color: '#EAEAEA' }}>{l.id}</div>
                  <div style={{ padding: '12px 16px', backgroundColor: '#0A0A0A', fontSize: '12px', color: '#71717A' }}>{l.timestamp_pkt}</div>
                  <div style={{ padding: '12px 16px', backgroundColor: '#0A0A0A', fontSize: '13px', color: '#EAEAEA', fontWeight: 600 }}>{l.username}</div>
                  <div style={{ padding: '12px 16px', backgroundColor: '#0A0A0A', fontSize: '11px' }}>
                    <span style={{ border: `1px solid ${l.role === 'admin' ? '#F59E0B' : '#3B82F6'}`, color: l.role === 'admin' ? '#F59E0B' : '#3B82F6', padding: '2px 6px' }}>{l.role.toUpperCase()}</span>
                  </div>
                  <div style={{ padding: '12px 16px', backgroundColor: '#0A0A0A', fontSize: '11px' }}>
                    <span style={{ border: '1px solid #10B981', color: '#10B981', padding: '2px 6px' }}>{l.action}</span>
                  </div>
                  <div style={{ padding: '12px 16px', backgroundColor: '#0A0A0A', fontSize: '12px', color: '#EAEAEA', wordBreak: 'break-word' }}>{l.details}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* PASSWORD CHANGE MODAL */}
      {showPwdModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(5,5,5,0.9)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="brutalist-box" style={{ padding: '32px', width: '400px' }}>
            <h3 className="dev-header-font" style={{ margin: '0 0 24px 0', fontSize: '24px', borderBottom: '1px solid #333', paddingBottom: '16px' }}>[ UPDATE_PASSPHRASE ]</h3>
            <form onSubmit={handleChangePassword}>
              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', fontSize: '11px', marginBottom: '8px', color: '#71717A', letterSpacing: '0.1em' }}>NEW_PASSPHRASE (MIN 8)</label>
                <input required type="password" value={newPwd} onChange={e=>setNewPwd(e.target.value)} className="brutalist-input" style={{ width: '100%', boxSizing: 'border-box' }} minLength={8} />
              </div>
              {pwdMsg && <div style={{ marginBottom: '16px', fontSize: '12px', color: pwdMsg.toLowerCase().includes('success') ? '#4ade80' : '#E61919' }}>{'>'} {pwdMsg}</div>}
              <div className="dev-actions-group">
                <button type="submit" disabled={pwdLoading} className="brutalist-btn brutalist-btn-primary">{pwdLoading ? 'UPDATING...' : 'CONFIRM'}</button>
                <button type="button" onClick={() => { setShowPwdModal(false); setPwdMsg(''); setNewPwd(''); }} className="brutalist-btn brutalist-btn-ghost">CANCEL</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* LOGIN MAKER MODAL */}
      {showMakerModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(5,5,5,0.9)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="brutalist-box" style={{ padding: '32px', width: '400px' }}>
            <h3 className="dev-header-font" style={{ margin: '0 0 24px 0', fontSize: '24px', borderBottom: '1px solid #333', paddingBottom: '16px' }}>[ SENIOR_LOGIN_KEY ]</h3>
            <form onSubmit={handleUpdateMaker}>
              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', fontSize: '11px', marginBottom: '8px', color: '#71717A', letterSpacing: '0.1em' }}>SET_SENIOR_KEY (MIN 6)</label>
                <input required type="text" value={makerPwd} onChange={e=>setMakerPwd(e.target.value)} className="brutalist-input" style={{ width: '100%', boxSizing: 'border-box' }} minLength={6} />
              </div>
              {makerMsg && <div style={{ marginBottom: '16px', fontSize: '12px', color: makerMsg.toLowerCase().includes('success') ? '#4ade80' : '#E61919' }}>{'>'} {makerMsg}</div>}
              <div className="dev-actions-group">
                <button type="submit" disabled={makerLoading} className="brutalist-btn brutalist-btn-primary">{makerLoading ? 'UPDATING...' : 'CONFIRM'}</button>
                <button type="button" onClick={() => { setShowMakerModal(false); setMakerMsg(''); setMakerPwd(''); }} className="brutalist-btn brutalist-btn-ghost">CANCEL</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
