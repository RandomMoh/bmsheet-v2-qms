import re

with open('/opt/lampp/htdocs/qms_pro/src/pages/Dev.jsx', 'r') as f:
    content = f.read()

# 1. Add workspaces state
state_code = """  const [channels, setChannels] = useState([])
  const [workspaces, setWorkspaces] = useState([])
  const [editingWsId, setEditingWsId] = useState(null)
  const [wsFormData, setWsFormData] = useState({ team_id: '', team_name: '', bot_token_shift1: '', bot_token_shift2: '', bot_token_shift3: '' })"""
content = content.replace("  const [channels, setChannels] = useState([])", state_code)

# 2. Modify channel formData to include workspace_id
content = content.replace(
    "const [formData, setFormData] = useState({ channel_id: '', channel_name: '', default_project: '', default_department: '', hint: '', is_active: 1 })",
    "const [formData, setFormData] = useState({ channel_id: '', channel_name: '', workspace_id: '', default_project: '', default_department: '', hint: '', is_active: 1 })"
)
content = content.replace(
    "setFormData({ channel_id: '', channel_name: '', default_project: '', default_department: '', hint: '', is_active: 1 })",
    "setFormData({ channel_id: '', channel_name: '', workspace_id: '', default_project: '', default_department: '', hint: '', is_active: 1 })"
)

# 3. Add handleEdit for channel to include workspace_id
content = content.replace(
    "channel_id: c.channel_id, channel_name: c.channel_name, default_project: c.default_project, default_department: c.default_department, hint: c.hint, is_active: c.is_active",
    "channel_id: c.channel_id, channel_name: c.channel_name, workspace_id: c.workspace_id || '', default_project: c.default_project, default_department: c.default_department, hint: c.hint, is_active: c.is_active"
)

# 4. Add fetchWorkspaces and handleSaveWs, handleDeleteWs, handleEditWs
fetch_channels_code = """  const fetchChannels = async () => {
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
        setWsFormData({ team_id: '', team_name: '', bot_token_shift1: '', bot_token_shift2: '', bot_token_shift3: '' })
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
  }"""
content = re.sub(r'  const fetchChannels = async \(\) => \{.*?\n  \}', fetch_channels_code, content, flags=re.DOTALL)

# 5. Call fetchWorkspaces in handleLogin
content = content.replace(
    "setIsAuthenticated(true)\n        fetchChannels()",
    "setIsAuthenticated(true)\n        fetchChannels()\n        fetchWorkspaces()"
)

# 6. UI for Workspaces
workspace_ui = """
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
                {editingWsId && <button type="button" onClick={() => { setEditingWsId(null); setWsFormData({ team_id: '', team_name: '', bot_token_shift1: '', bot_token_shift2: '', bot_token_shift3: '' }) }} className="brutalist-btn brutalist-btn-ghost">CANCEL</button>}
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
"""
content = content.replace(
    "<div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '60px', alignItems: 'start' }}>",
    workspace_ui + "\n      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '60px', alignItems: 'start' }}>"
)

# 7. Add workspace dropdown to channel form
workspace_dropdown = """
              <div>
                <label style={{ display: 'block', fontSize: '11px', marginBottom: '8px', color: '#71717A', letterSpacing: '0.1em' }}>WORKSPACE (OPTIONAL/DEFAULT)</label>
                <select value={formData.workspace_id} onChange={e=>setFormData({...formData, workspace_id: e.target.value})} className="brutalist-input" style={{ width: '100%', boxSizing: 'border-box', appearance: 'none', backgroundColor: '#050505', color: '#EAEAEA' }}>
                  <option value="">[ NONE_SELECTED ]</option>
                  {workspaces.map(w => <option key={w.id} value={w.id}>{w.team_name} ({w.team_id})</option>)}
                </select>
              </div>"""
              
content = content.replace(
    "<div>\n                <label style={{ display: 'block', fontSize: '11px', marginBottom: '8px', color: '#71717A', letterSpacing: '0.1em' }}>CHANNEL_NAME (REQ)</label>",
    workspace_dropdown + "\n              <div>\n                <label style={{ display: 'block', fontSize: '11px', marginBottom: '8px', color: '#71717A', letterSpacing: '0.1em' }}>CHANNEL_NAME (REQ)</label>"
)

with open('/opt/lampp/htdocs/qms_pro/src/pages/Dev.jsx', 'w') as f:
    f.write(content)

