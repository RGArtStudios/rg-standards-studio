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

const C = { primary: '#774435', hover: '#5C3228', surface: '#F9F0ED', border: '#E8C5B5', text: '#2C1810', muted: '#A0705A' }
const COLLAPSED_W = 56
const EXPANDED_W  = 220

const NAV_GROUPS = [
  {
    id: 'standards',
    icon: '📐',
    label: 'Standards',
    items: [
      { href: '/',           icon: '▤', label: 'All Standards'   },
      { href: '/standards/new', icon: '+', label: 'New Standard', roles: ['CERTIFIER','ADMIN'] },
      { href: '/compliance', icon: '✓', label: 'Compliance'      },
    ],
  },
  {
    id: 'admin',
    icon: '⚙',
    label: 'Admin',
    roles: ['ADMIN'],
    items: [
      { href: '/admin', icon: '⊞', label: 'Registry'  },
    ],
  },
]

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

function Sidebar({ user, onLogout }: { user: User | null; onLogout: () => void }) {
  const pathname = usePathname()
  const [expanded,     setExpanded]     = useState(false)
  const [openGroup,    setOpenGroup]    = useState<string | null>('standards')

  const filteredGroups = NAV_GROUPS.filter(g =>
    !g.roles || (user && g.roles.includes(user.role))
  )

  const toggleGroup = (id: string) => {
    setOpenGroup(prev => prev === id ? null : id)
  }

  return (
    <div style={{
      width:      expanded ? EXPANDED_W : COLLAPSED_W,
      minHeight:  '100vh',
      background: C.primary,
      display:    'flex',
      flexDirection: 'column',
      flexShrink: 0,
      transition: 'width 0.2s ease',
      overflow:   'hidden',
      position:   'relative',
      zIndex:     100,
    }}>

      {/* Logo + toggle */}
      <div style={{ padding: expanded ? '16px 14px 12px' : '16px 0 12px', borderBottom: '1px solid rgba(255,255,255,.15)', display: 'flex', alignItems: 'center', justifyContent: expanded ? 'space-between' : 'center' }}>
        {expanded && (
          <div>
            <p style={{ margin: 0, color: 'white', fontWeight: 800, fontSize: '13px', whiteSpace: 'nowrap' }}>RG Standards</p>
            <p style={{ margin: 0, color: 'rgba(255,255,255,.55)', fontSize: '10px' }}>Certification Studio</p>
          </div>
        )}
        <button onClick={() => setExpanded(e => !e)}
          style={{ background: 'rgba(255,255,255,.15)', border: 'none', borderRadius: '6px', color: 'white', cursor: 'pointer', width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', flexShrink: 0 }}>
          {expanded ? '←' : '→'}
        </button>
      </div>

      {/* Nav groups */}
      <nav style={{ flex: 1, padding: '8px 0', overflowY: 'auto', overflowX: 'hidden' }}>
        {filteredGroups.map(group => {
          const filteredItems = group.items.filter(item =>
            !(item as any).roles || (user && (item as any).roles.includes(user.role))
          )
          const isOpen = openGroup === group.id

          return (
            <div key={group.id}>
              {/* Group header */}
              <button
                onClick={() => {
                  if (!expanded) setExpanded(true)
                  toggleGroup(group.id)
                }}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center',
                  justifyContent: expanded ? 'space-between' : 'center',
                  padding: expanded ? '8px 14px' : '10px 0',
                  background: isOpen && expanded ? 'rgba(255,255,255,.1)' : 'none',
                  border: 'none', cursor: 'pointer',
                  color: 'white', fontFamily: 'inherit',
                }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: expanded ? '9px' : '0' }}>
                  <span style={{ fontSize: '15px', width: '20px', textAlign: 'center', flexShrink: 0 }}>{group.icon}</span>
                  {expanded && <span style={{ fontSize: '12px', fontWeight: 600, whiteSpace: 'nowrap', color: 'rgba(255,255,255,.9)' }}>{group.label}</span>}
                </div>
                {expanded && <span style={{ fontSize: '10px', color: 'rgba(255,255,255,.5)', transform: isOpen ? 'rotate(90deg)' : 'none', transition: 'transform .15s' }}>▶</span>}
              </button>

              {/* Group items — only shown when expanded AND group is open */}
              {expanded && isOpen && (
                <div style={{ borderBottom: '1px solid rgba(255,255,255,.08)', paddingBottom: '4px', marginBottom: '4px' }}>
                  {filteredItems.map(item => {
                    const active = pathname === item.href
                    return (
                      <a key={item.href} href={item.href}
                        style={{
                          display: 'flex', alignItems: 'center', gap: '9px',
                          padding: '7px 14px 7px 28px',
                          color: active ? 'white' : 'rgba(255,255,255,.65)',
                          background: active ? 'rgba(255,255,255,.15)' : 'none',
                          borderLeft: active ? '3px solid white' : '3px solid transparent',
                          textDecoration: 'none', fontSize: '12px', fontWeight: active ? 600 : 400,
                          whiteSpace: 'nowrap',
                        }}>
                        <span style={{ fontSize: '12px', width: '16px', textAlign: 'center' }}>{item.icon}</span>
                        {item.label}
                      </a>
                    )
                  })}
                </div>
              )}

              {/* Collapsed: show individual item icons as tooltip buttons */}
              {!expanded && filteredItems.map(item => {
                const active = pathname === item.href
                return (
                  <a key={item.href} href={item.href} title={item.label}
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      padding: '9px 0',
                      color: active ? 'white' : 'rgba(255,255,255,.55)',
                      background: active ? 'rgba(255,255,255,.15)' : 'none',
                      borderLeft: active ? '3px solid white' : '3px solid transparent',
                      textDecoration: 'none', fontSize: '13px',
                    }}>
                    {item.icon}
                  </a>
                )
              })}
            </div>
          )
        })}
      </nav>

      {/* User footer */}
      <div style={{ padding: expanded ? '12px 14px' : '12px 0', borderTop: '1px solid rgba(255,255,255,.15)', display: 'flex', alignItems: 'center', justifyContent: expanded ? 'space-between' : 'center', gap: '8px' }}>
        {expanded && user && (
          <div style={{ minWidth: 0 }}>
            <p style={{ margin: 0, fontSize: '12px', fontWeight: 600, color: 'white', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.name}</p>
            <p style={{ margin: 0, fontSize: '10px', color: 'rgba(255,255,255,.5)' }}>{user.role}</p>
          </div>
        )}
        <button onClick={onLogout} title="Sign out"
          style={{ background: 'rgba(255,255,255,.12)', border: 'none', borderRadius: '6px', color: 'rgba(255,255,255,.7)', cursor: 'pointer', width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', flexShrink: 0 }}>
          ⏻
        </button>
      </div>
    </div>
  )
}

function Shell({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth()
  const pathname = usePathname()
  if (pathname === '/login') return <>{children}</>

  return (
    <div style={{ display: 'flex', minHeight: '100vh', fontFamily: "'Inter', system-ui, sans-serif" }}>
      <Sidebar user={user} onLogout={logout} />
      <main style={{ flex: 1, overflow: 'auto', padding: '28px 32px', background: 'var(--color-background-tertiary, #F9F0ED)', minWidth: 0 }}>
        {children}
      </main>
    </div>
  )
}

export function Providers({ children }: { children: ReactNode }) {
  return <AuthProvider><Shell>{children}</Shell></AuthProvider>
}
