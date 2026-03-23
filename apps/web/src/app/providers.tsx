'use client'
import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { api, type User } from '@/lib/api'

interface AuthCtx {
  user: User | null; token: string | null; loading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => void
}
const Ctx = createContext<AuthCtx>({ user: null, token: null, loading: true, login: async () => {}, logout: () => {} })
export const useAuth = () => useContext(Ctx)

const C = { primary: '#774435', border: '#E8C5B5', text: '#2C1810', muted: '#A0705A', surface: '#F9F0ED' }

function AuthProvider({ children }: { children: ReactNode }) {
  const [user,    setUser]    = useState<User | null>(null)
  const [token,   setToken]   = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const router   = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    const t = localStorage.getItem('studio_token')
    if (!t) { setLoading(false); if (pathname !== '/login') router.replace('/login'); return }
    setToken(t)
    api.me()
      .then(d => { setUser(d.user); setLoading(false) })
      .catch(() => { localStorage.removeItem('studio_token'); setLoading(false); router.replace('/login') })
  }, [])

  const login = async (email: string, password: string) => {
    const d = await api.login(email, password)
    localStorage.setItem('studio_token', d.token)
    setToken(d.token); setUser(d.user)
    router.replace('/')
  }

  const logout = () => {
    localStorage.removeItem('studio_token')
    setUser(null); setToken(null); router.replace('/login')
  }

  return <Ctx.Provider value={{ user, token, loading, login, logout }}>{children}</Ctx.Provider>
}

function Shell({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth()
  const pathname = usePathname()
  if (pathname === '/login') return <>{children}</>

  const NAV = [
    { href: '/',       label: 'Standards' },
    { href: '/admin',  label: 'Admin',    roles: ['ADMIN'] as const },
  ].filter(n => !n.roles || (user && n.roles.includes(user.role as any)))

  return (
    <div style={{ minHeight: '100vh', display: 'flex', fontFamily: "'Inter', system-ui, sans-serif" }}>
      <aside style={{ width: '200px', background: C.primary, color: 'white', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
        <div style={{ padding: '20px 16px 14px', borderBottom: '1px solid rgba(255,255,255,.15)' }}>
          <p style={{ margin: 0, fontWeight: 800, fontSize: '14px' }}>RG Standards</p>
          <p style={{ margin: '2px 0 0', fontSize: '11px', opacity: 0.6 }}>Studio</p>
        </div>
        <nav style={{ flex: 1, padding: '10px 0' }}>
          {NAV.map(n => (
            <a key={n.href} href={n.href} style={{ display: 'block', padding: '9px 16px', fontSize: '13px', fontWeight: 500, textDecoration: 'none', color: pathname === n.href ? 'white' : 'rgba(255,255,255,.7)', background: pathname === n.href ? 'rgba(255,255,255,.15)' : 'transparent', borderLeft: pathname === n.href ? '3px solid white' : '3px solid transparent' }}>
              {n.label}
            </a>
          ))}
        </nav>
        {user && (
          <div style={{ padding: '14px 16px', borderTop: '1px solid rgba(255,255,255,.15)' }}>
            <p style={{ margin: '0 0 2px', fontSize: '12px', fontWeight: 600, color: 'white' }}>{user.name}</p>
            <p style={{ margin: '0 0 8px', fontSize: '11px', opacity: 0.55 }}>{user.role}</p>
            <button onClick={logout} style={{ fontSize: '11px', color: 'rgba(255,255,255,.55)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>Sign out</button>
          </div>
        )}
      </aside>
      <main style={{ flex: 1, overflow: 'auto', padding: '28px 32px', background: C.surface }}>{children}</main>
    </div>
  )
}

export function Providers({ children }: { children: ReactNode }) {
  return <AuthProvider><Shell>{children}</Shell></AuthProvider>
}
