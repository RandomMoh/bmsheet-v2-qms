import { useState, lazy, Suspense } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import ThemeToggle from '../ThemeToggle'

const WebGLBackground = lazy(() => import('../components/WebGLBackground'))

const API_BASE = import.meta.env.VITE_API_BASE_URL

export default function Login() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)
  const [focusField, setFocusField] = useState(null)
  const [authModalVisible, setAuthModalVisible] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()

  const handleLogin = async e => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    setAuthModalVisible(true)

    try {
      const res = await fetch(`${API_BASE}/login.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      })
      const data = await res.json()
      
      setTimeout(() => {
        if (data.status === 'success') {
          sessionStorage.setItem('qmsUser', JSON.stringify(data.user))
          sessionStorage.setItem('qmsRole', data.role)
          if (data.deploy_version) sessionStorage.setItem('qmsDeployVersion', data.deploy_version)
          localStorage.setItem('qmsLastActive', Date.now().toString())
          window.dispatchEvent(new Event('auth_change'))
          navigate(`/user`)
        } else {
          setAuthModalVisible(false)
          setError(data.message)
        }
        setLoading(false)
      }, 1200)

    } catch (err) {
      setTimeout(() => {
        setAuthModalVisible(false)
        setError('Connection failed. Please try again.')
        setLoading(false)
      }, 1200)
    }
  }



  return (
    <div style={{ fontFamily: "'Inter', -apple-system, system-ui, sans-serif", minHeight: '100vh', display: 'flex', backgroundColor: 'var(--bg-base)', overflow: 'hidden' }}>
      {authModalVisible && (
        <div className="maintenance-overlay">
          <div className="maintenance-card">
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 }}>
              <div className="spinner" style={{ width: 32, height: 32, border: '3px solid var(--border-strong)', borderTopColor: 'var(--accent-primary)', borderRadius: '50%' }} />
              <div style={{ fontSize: 15, fontWeight: 500, color: 'var(--text-main)' }}>Authenticating...</div>
            </div>
          </div>
        </div>
      )}

      <div style={{ position: 'fixed', top: 24, right: 32, zIndex: 100 }}>
        <ThemeToggle />
      </div>

      {/* Left — Immersive brand panel */}
      <div className="login-left-panel" style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '56px 64px', background: 'linear-gradient(160deg, #031e1e 0%, #063f3f 20%, #0a5c5c 40%, #0b6b6f 60%, #094f52 80%, #042f2e 100%)', position: 'relative', overflow: 'hidden', minHeight: '100vh' }}>

        {/* Noise texture overlay */}
        <div style={{ position: 'absolute', inset: 0, opacity: 0.03, backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`, backgroundSize: '128px', pointerEvents: 'none', zIndex: 1 }} />

        {/* Cinematic WebGL Sphere */}
        <Suspense fallback={null}>
          <WebGLBackground />
        </Suspense>

        <div className="glass-block-1" style={{ position: 'absolute', top: '12%', left: '6%', width: 280, height: 180, background: 'rgba(255,255,255,0.03)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', borderRadius: 20, border: '1px solid rgba(255,255,255,0.06)', pointerEvents: 'none' }} />
        <div className="glass-block-2" style={{ position: 'absolute', bottom: '15%', right: '8%', width: 220, height: 140, background: 'rgba(255,255,255,0.02)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', borderRadius: 16, border: '1px solid rgba(255,255,255,0.05)', pointerEvents: 'none' }} />
        <div className="glass-block-3" style={{ position: 'absolute', top: '52%', left: '25%', width: 160, height: 100, background: 'rgba(255,255,255,0.02)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', borderRadius: 14, border: '1px solid rgba(255,255,255,0.04)', pointerEvents: 'none' }} />
        <div className="glass-block-4" style={{ position: 'absolute', top: '35%', right: '20%', width: 120, height: 120, background: 'rgba(255,255,255,0.025)', backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)', borderRadius: 18, border: '1px solid rgba(255,255,255,0.05)', pointerEvents: 'none' }} />
        <div className="glass-block-5" style={{ position: 'absolute', bottom: '40%', left: '50%', width: 90, height: 70, background: 'rgba(255,255,255,0.015)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)', borderRadius: 12, border: '1px solid rgba(255,255,255,0.03)', pointerEvents: 'none' }} />

        {/* Subtle grid */}
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(255,255,255,0.015) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.015) 1px, transparent 1px)', backgroundSize: '56px 56px', pointerEvents: 'none' }} />

        <div style={{ position: 'relative', zIndex: 2 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <img src={`${import.meta.env.BASE_URL}favicon.ico`} alt="Logo" style={{ width: 32, height: 32, borderRadius: 8, objectFit: 'contain' }} />
            <h2 style={{ fontSize: 16, fontWeight: 600, margin: 0, letterSpacing: '-0.02em' }}>
              <span style={{ color: '#f0fdfa' }}>Benchmark</span>
              <span style={{ fontWeight: 400, color: 'rgba(153,246,228,0.5)', marginLeft: 5 }}>Studio</span>
            </h2>
          </div>
        </div>

        <div className="login-text-float" style={{ position: 'relative', zIndex: 2, maxWidth: 500 }}>
          <div style={{ display: 'inline-flex', padding: '4px 12px', borderRadius: 20, background: 'rgba(45,212,191,0.1)', border: '1px solid rgba(45,212,191,0.15)', marginBottom: 24 }}>
            <span style={{ fontSize: 12, fontWeight: 500, color: 'rgba(153,246,228,0.8)', letterSpacing: '0.02em' }}>QMS</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 24 }}>
            <h1 className="brand-line"><span style={{ animationDelay: '0.1s' }}>Query</span></h1>
            <h1 className="brand-line"><span style={{ animationDelay: '0.2s' }}>Management</span></h1>
            <h1 className="brand-line"><span style={{ animationDelay: '0.3s', background: 'linear-gradient(90deg, #5eead4, #14b8a6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', paddingRight: '10px' }}>System</span></h1>
          </div>
          <p className="fade-up" style={{ fontSize: 16, color: 'rgba(153,246,228,0.45)', margin: 0, lineHeight: 1.6, fontWeight: 400, animationDelay: '0.5s', maxWidth: 420 }}>
            Engineered exclusively for Benchmark Studio. Elevating operational excellence and workflow intelligence.
          </p>
        </div>

        <div style={{ position: 'relative', zIndex: 2, display: 'flex', alignItems: 'center', gap: 24 }}>
          <p style={{ fontSize: 12, color: 'rgba(153,246,228,0.25)', margin: 0 }}>© {new Date().getFullYear()} Benchmark Studio</p>
          <div style={{ width: 1, height: 12, background: 'rgba(153,246,228,0.12)' }} />
          <p style={{ fontSize: 12, color: 'rgba(153,246,228,0.25)', margin: 0 }}>QMS v2.0</p>
        </div>
      </div>

      {/* Right — Premium form */}
      <div className="login-right-panel" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--bg-base)', padding: '48px 32px', minHeight: '100vh' }}>
        <div className="anim-fade-up login-card" style={{ width: '100%', maxWidth: 400, backgroundColor: 'var(--bg-panel)', boxShadow: 'var(--shadow-lg)', borderRadius: 'var(--radius-xl)', border: '1px solid var(--border-subtle)', padding: '44px 40px' }}>

          <div style={{ marginBottom: 28 }}>
            <h2 style={{ fontSize: 24, fontWeight: 600, letterSpacing: '-0.03em', color: 'var(--text-main)', margin: '0 0 6px' }}>Welcome back</h2>
            <p style={{ fontSize: 14, color: 'var(--text-faint)', margin: '0 0 10px' }}>Sign in to access your dashboard</p>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--status-warning)', fontWeight: 500, background: 'var(--status-warning-bg)', border: '1px solid var(--status-warning-border)', padding: '4px 10px', borderRadius: 6 }}>
              <span>💡 Tip: Press</span>
              <kbd className="login-update-kbd" style={{ fontSize: 11, padding: '1px 5px' }}>CTRL + SHIFT + R</kbd>
              <span>then login</span>
            </div>
          </div>



          {location.state?.message && location.state.message !== 'Logged out successfully.' && !error && (
            <div className="anim-fade-in login-update-alert">
              <div className="login-update-alert-title">
                <span className="login-update-alert-dot" />
                <span>System Notification</span>
              </div>
              <div>
                {location.state.message.includes('CTRL + SHIFT + R') ? (
                  <>System was updated. Kindly press <kbd className="login-update-kbd">CTRL + SHIFT + R</kbd> then login.</>
                ) : (
                  location.state.message
                )}
              </div>
            </div>
          )}

          {error && (
            <div className="anim-fade-in" style={{ marginBottom: 20, padding: '10px 14px', background: 'var(--status-danger-bg)', border: '1px solid var(--status-danger)', borderRadius: 'var(--radius-md)', color: 'var(--status-danger)', fontSize: 13, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--status-danger)', flexShrink: 0 }} />
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {[
              { l: 'Username', t: 'text', v: username, s: e => setUsername(e.target.value.slice(0, 15)), k: 'user', max: 15 },
              { l: 'Password', t: 'password', v: password, s: e => setPassword(e.target.value.slice(0, 15)), k: 'pass', max: 15 },
            ].map(f => (
              <div key={f.k} style={{ position: 'relative' }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: focusField === f.k ? 'var(--accent-primary)' : 'var(--text-main)', marginBottom: 8, transition: 'color 0.15s ease' }}>{f.l}</label>
                <input type={f.t} value={f.v} onChange={f.s} maxLength={f.max} required
                  style={{
                    width: '100%', padding: '10px 14px', background: 'var(--bg-input)', border: `1.5px solid ${focusField === f.k ? 'var(--accent-primary)' : 'var(--border-strong)'}`, borderRadius: 'var(--radius-md)', color: 'var(--text-main)', fontSize: 14, outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit',
                    transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
                    boxShadow: focusField === f.k ? '0 0 0 3px var(--accent-glow)' : 'none',
                  }}
                  onFocus={() => setFocusField(f.k)}
                  onBlur={() => setFocusField(null)} />
              </div>
            ))}

            <button type="submit" disabled={loading} className="btn-primary"
              style={{
                width: '100%', padding: '11px', borderRadius: 'var(--radius-md)', border: 'none', cursor: loading ? 'not-allowed' : 'pointer', fontSize: 14, fontWeight: 600, color: 'var(--accent-btn-text)', marginTop: 4, opacity: loading ? 0.6 : 1,
                background: 'var(--accent-gradient)',
                boxShadow: '0 2px 12px var(--accent-glow)',
                fontFamily: 'inherit', letterSpacing: '-0.01em',
              }}>
              {loading ? (
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                  <span className="spinner" style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', display: 'inline-block' }} />
                  Authenticating…
                </span>
              ) : 'Sign in →'}
            </button>
          </form>

        </div>
      </div>
      
      {/* Dev Login trigger */}
      <div 
        onClick={() => navigate('/dev')} 
        style={{ position: 'fixed', bottom: 20, right: 32, cursor: 'pointer', zIndex: 99, fontSize: '11px', color: 'var(--text-faint)', letterSpacing: '0.1em', opacity: 0.4, transition: 'opacity 0.2s ease, color 0.2s ease' }} 
        title="Developer Terminal"
        onMouseEnter={(e) => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.color = 'var(--text-main)'; }}
        onMouseLeave={(e) => { e.currentTarget.style.opacity = '0.4'; e.currentTarget.style.color = 'var(--text-faint)'; }}
      >
        [ DEV_TERMINAL ]
      </div>
    </div>
  )
}
