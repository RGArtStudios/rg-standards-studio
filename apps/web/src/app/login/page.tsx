'use client'
import { useState } from 'react'
import { useAuth } from '@/app/providers'

const C = { primary: '#774435', hover: '#5C3228', border: '#E8C5B5', text: '#2C1810', muted: '#A0705A', surface: '#F9F0ED', error: '#DC2626', success: '#059669' }

type Mode = 'login' | 'forgot' | 'forgot-sent'

export default function LoginPage() {
  const { login }   = useAuth()
  const [mode,      setMode]      = useState<Mode>('login')
  const [email,     setEmail]     = useState('')
  const [password,  setPassword]  = useState('')
  const [resetEmail,setResetEmail]= useState('')
  const [error,     setError]     = useState('')
  const [loading,   setLoading]   = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(''); setLoading(true)
    try { await login(email, password) }
    catch (err: any) { setError(err.message ?? 'Login failed') }
    finally { setLoading(false) }
  }

  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(''); setLoading(true)
    try {
      // Call the password reset endpoint
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3010'}/api/auth/forgot-password`,
        { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: resetEmail }) }
      )
      // Always show success (security best practice — don't reveal if email exists)
      setMode('forgot-sent')
    } catch {
      setMode('forgot-sent')
    } finally {
      setLoading(false)
    }
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '10px 12px', borderRadius: '8px',
    border: `1.5px solid ${C.border}`, fontSize: '14px',
    outline: 'none', fontFamily: 'inherit', color: C.text,
    background: 'white', boxSizing: 'border-box',
  }

  const btnStyle: React.CSSProperties = {
    width: '100%', padding: '11px', background: C.primary, color: 'white',
    border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: 700,
    cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1,
    fontFamily: 'inherit',
  }

  return (
    <div style={{ minHeight: '100vh', background: C.surface, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Inter', system-ui, sans-serif" }}>
      <div style={{ width: '380px', background: 'white', borderRadius: '16px', padding: '36px', boxShadow: '0 8px 32px rgba(119,68,53,.12)', border: `1px solid ${C.border}` }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <p style={{ margin: '0 0 2px', fontSize: '22px', fontWeight: 800, color: C.primary }}>RG Standards Studio</p>
          <p style={{ margin: 0, fontSize: '13px', color: C.muted }}>Rainier Gardens LLC</p>
        </div>

        {/* ── LOGIN ── */}
        {mode === 'login' && (
          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: C.text, marginBottom: '5px' }}>Email address</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
                placeholder="you@rainiergardens.io" autoFocus style={inputStyle} />
            </div>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
                <label style={{ fontSize: '12px', fontWeight: 600, color: C.text }}>Password</label>
                <button type="button" onClick={() => { setResetEmail(email); setMode('forgot'); setError('') }}
                  style={{ background: 'none', border: 'none', color: C.primary, fontSize: '12px', cursor: 'pointer', fontFamily: 'inherit', padding: 0 }}>
                  Forgot password?
                </button>
              </div>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} required
                placeholder="••••••••" style={inputStyle} />
            </div>
            {error && <p style={{ margin: 0, fontSize: '12px', color: C.error, background: '#FEF2F2', padding: '8px 12px', borderRadius: '7px' }}>{error}</p>}
            <button type="submit" disabled={loading} style={btnStyle}>
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>
        )}

        {/* ── FORGOT PASSWORD ── */}
        {mode === 'forgot' && (
          <form onSubmit={handleForgot} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ padding: '12px', background: C.surface, borderRadius: '8px', border: `1px solid ${C.border}` }}>
              <p style={{ margin: 0, fontSize: '13px', color: C.text, lineHeight: 1.6 }}>
                Enter your email address and we will send you a link to reset your password.
              </p>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: C.text, marginBottom: '5px' }}>Email address</label>
              <input type="email" value={resetEmail} onChange={e => setResetEmail(e.target.value)} required
                placeholder="you@rainiergardens.io" autoFocus style={inputStyle} />
            </div>
            {error && <p style={{ margin: 0, fontSize: '12px', color: C.error, background: '#FEF2F2', padding: '8px 12px', borderRadius: '7px' }}>{error}</p>}
            <button type="submit" disabled={loading} style={btnStyle}>
              {loading ? 'Sending…' : 'Send reset link'}
            </button>
            <button type="button" onClick={() => { setMode('login'); setError('') }}
              style={{ background: 'none', border: 'none', color: C.muted, fontSize: '13px', cursor: 'pointer', fontFamily: 'inherit', textAlign: 'center' }}>
              ← Back to sign in
            </button>
          </form>
        )}

        {/* ── FORGOT SENT ── */}
        {mode === 'forgot-sent' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', textAlign: 'center' }}>
            <div style={{ fontSize: '40px' }}>📬</div>
            <div>
              <p style={{ margin: '0 0 6px', fontWeight: 700, fontSize: '15px', color: C.text }}>Check your inbox</p>
              <p style={{ margin: 0, fontSize: '13px', color: C.muted, lineHeight: 1.6 }}>
                If an account exists for <strong>{resetEmail}</strong>, a password reset link has been sent. Check your email and follow the instructions.
              </p>
            </div>
            <div style={{ padding: '10px', background: C.surface, borderRadius: '8px', border: `1px solid ${C.border}` }}>
              <p style={{ margin: 0, fontSize: '12px', color: C.muted }}>
                Didn't receive it? Check your spam folder or contact your system administrator at <strong>admin@rainiergardens.io</strong>
              </p>
            </div>
            <button type="button" onClick={() => { setMode('login'); setError('') }}
              style={{ ...btnStyle, background: 'white', color: C.primary, border: `1.5px solid ${C.primary}` }}>
              ← Back to sign in
            </button>
          </div>
        )}

        <p style={{ margin: '20px 0 0', textAlign: 'center', fontSize: '11px', color: C.muted }}>
          Rainier Gardens LLC — Staff access only
        </p>
      </div>
    </div>
  )
}
