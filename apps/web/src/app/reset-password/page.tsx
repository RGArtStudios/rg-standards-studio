'use client'
import { useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'

const C = { primary: '#774435', border: '#E8C5B5', text: '#2C1810', muted: '#A0705A', surface: '#F9F0ED', error: '#DC2626', success: '#059669' }

export default function ResetPasswordPage() {
  return <Suspense fallback={<div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: C.surface }}>Loading...</div>}><ResetForm /></Suspense>
}

function ResetForm() {
  const params = useSearchParams()
  const token  = params.get('token')
  const [password,  setPassword]  = useState('')
  const [confirm,   setConfirm]   = useState('')
  const [loading,   setLoading]   = useState(false)
  const [done,      setDone]      = useState(false)
  const [error,     setError]     = useState('')

  const inputStyle: React.CSSProperties = { width: '100%', padding: '10px 12px', borderRadius: '8px', border: `1.5px solid ${C.border}`, fontSize: '14px', outline: 'none', fontFamily: 'inherit', color: C.text, background: 'white', boxSizing: 'border-box' }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (password !== confirm) return setError('Passwords do not match')
    if (password.length < 8) return setError('Password must be at least 8 characters')
    setLoading(true)
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3010'}/api/auth/reset-password`,
        { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token, password }) }
      )
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Reset failed')
      setDone(true)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (!token) return (
    <div style={{ minHeight: '100vh', background: C.surface, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Inter', system-ui, sans-serif" }}>
      <div style={{ width: '380px', background: 'white', borderRadius: '16px', padding: '36px', textAlign: 'center', border: `1px solid ${C.border}` }}>
        <p style={{ fontSize: '32px', margin: '0 0 12px' }}>⚠️</p>
        <p style={{ fontWeight: 700, color: C.text }}>Invalid reset link</p>
        <p style={{ color: C.muted, fontSize: '13px' }}>This link is missing a token. Request a new password reset.</p>
        <a href="/login" style={{ display: 'block', marginTop: '16px', color: C.primary, fontSize: '13px' }}>← Back to sign in</a>
      </div>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: C.surface, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Inter', system-ui, sans-serif" }}>
      <div style={{ width: '380px', background: 'white', borderRadius: '16px', padding: '36px', boxShadow: '0 8px 32px rgba(119,68,53,.12)', border: `1px solid ${C.border}` }}>
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <p style={{ margin: '0 0 4px', fontSize: '20px', fontWeight: 800, color: C.primary }}>Set new password</p>
          <p style={{ margin: 0, fontSize: '13px', color: C.muted }}>RG Standards Studio</p>
        </div>

        {done ? (
          <div style={{ textAlign: 'center' }}>
            <p style={{ fontSize: '40px', margin: '0 0 12px' }}>✅</p>
            <p style={{ fontWeight: 700, color: C.success, margin: '0 0 8px' }}>Password updated</p>
            <p style={{ color: C.muted, fontSize: '13px', margin: '0 0 20px' }}>You can now sign in with your new password.</p>
            <a href="/login" style={{ display: 'block', padding: '11px', background: C.primary, color: 'white', borderRadius: '8px', textDecoration: 'none', fontWeight: 700, fontSize: '14px', textAlign: 'center' }}>Sign in</a>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: C.text, marginBottom: '5px' }}>New password</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} required minLength={8} placeholder="Min. 8 characters" autoFocus style={inputStyle} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: C.text, marginBottom: '5px' }}>Confirm password</label>
              <input type="password" value={confirm} onChange={e => setConfirm(e.target.value)} required placeholder="Repeat new password" style={inputStyle} />
            </div>
            {error && <p style={{ margin: 0, fontSize: '12px', color: C.error, background: '#FEF2F2', padding: '8px 12px', borderRadius: '7px' }}>{error}</p>}
            <button type="submit" disabled={loading}
              style={{ padding: '11px', background: C.primary, color: 'white', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1, fontFamily: 'inherit' }}>
              {loading ? 'Updating…' : 'Set new password'}
            </button>
            <a href="/login" style={{ textAlign: 'center', color: C.muted, fontSize: '13px', textDecoration: 'none' }}>← Back to sign in</a>
          </form>
        )}
      </div>
    </div>
  )
}
