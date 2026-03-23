'use client'
import { useState, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { api } from '../../lib/api'
import { useAuth } from '../providers'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const { login } = useAuth()

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(email, password)
    } catch (err: any) {
      setError(err.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ maxWidth: 380, margin: '80px auto', padding: 32, background: '#fff', borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,.08)' }}>
      <h1 style={{ fontSize: 22, marginBottom: 4, color: '#774435' }}>Standards Studio</h1>
      <p style={{ color: '#666', fontSize: 14, marginBottom: 24 }}>Sign in to manage @rg/* package standards</p>
      <form onSubmit={handleSubmit}>
        <label style={labelStyle}>Email</label>
        <input type="email" value={email} onChange={e => setEmail(e.target.value)} required style={inputStyle} />
        <label style={labelStyle}>Password</label>
        <input type="password" value={password} onChange={e => setPassword(e.target.value)} required style={inputStyle} />
        {error && <p style={{ color: '#c0392b', fontSize: 13 }}>{error}</p>}
        <button type="submit" disabled={loading} style={{
          width: '100%', padding: '10px 0', background: '#774435', color: '#fff',
          border: 'none', borderRadius: 6, fontSize: 15, cursor: 'pointer', marginTop: 8,
          opacity: loading ? 0.6 : 1,
        }}>{loading ? 'Signing in...' : 'Sign In'}</button>
      </form>
    </div>
  )
}

const labelStyle: React.CSSProperties = { display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 4, color: '#333' }
const inputStyle: React.CSSProperties = {
  width: '100%', padding: '8px 10px', border: '1px solid #ddd', borderRadius: 6,
  fontSize: 14, marginBottom: 14, boxSizing: 'border-box',
}
