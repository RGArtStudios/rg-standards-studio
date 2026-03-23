'use client'
import React, { createContext, useContext, useState, useEffect, useRef, type ReactNode } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { api, type User } from '@/lib/api'
import HelpWidget from '@/components/HelpWidget'
import BugReporter from '@/components/BugReporter'

interface AuthCtx {
  user: User | null; token: string | null; loading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => void
}
const Ctx = createContext<AuthCtx>({ user: null, token: null, loading: true, login: async () => {}, logout: () => {} })
export const useAuth = () => useContext(Ctx)

const C = { primary: '#774435', hover: '#5C3228', surface: '#F9F0ED', border: '#E8C5B5', text: '#2C1810', muted: '#A0705A' }

// ── Nav group definitions with help text ─────────────────────────────────────

const NAV_GROUPS = [
  {
    id: 'standards', icon: '📐', label: 'Standards',
    help: 'Manage and certify @rg/* platform standards. Every standard defines shared behavior all apps must follow.',
    items: [
      { href: '/',              icon: '▤', label: 'All Standards',  help: 'Browse all platform standards — certified, draft, and deprecated. Click any standard to view source code, spec, test cases, and history.' },
      { href: '/standards/new', icon: '+', label: 'New Standard',   help: 'Create a new platform standard. Describe it in plain English and Claude AI will generate the source code, visual spec, and test cases automatically.', roles: ['CERTIFIER','ADMIN'] },
      { href: '/compliance',    icon: '✓', label: 'Compliance',     help: 'View the compliance matrix — which apps have adopted each certified standard. Any app falling behind is blocked from deploying.' },
    ],
  },
  {
    id: 'admin', icon: '⚙', label: 'Admin',
    help: 'Administrative tools for managing the standards registry, audit log, and user accounts.',
    roles: ['ADMIN'],
    items: [
      { href: '/admin', icon: '⊞', label: 'Registry', help: 'View the certified version registry and immutable audit log of all certification events.' },
    ],
  },
]

// ── Menu Help Icon ────────────────────────────────────────────────────────────

function MenuHelpIcon({ helpText, expanded }: { helpText: string; expanded: boolean }) {
  const [showTooltip, setShowTooltip] = useState(false)
  const [showPanel,   setShowPanel]   = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setShowPanel(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  if (!expanded) return null

  return (
    <div ref={ref} style={{ position: 'relative', marginLeft: '4px', flexShrink: 0 }}>
      <button
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        onClick={e => { e.preventDefault(); e.stopPropagation(); setShowPanel(p => !p); setShowTooltip(false) }}
        style={{ background: 'rgba(255,255,255,.15)', border: 'none', borderRadius: '50%', color: 'rgba(255,255,255,.7)', cursor: 'pointer', width: '16px', height: '16px', fontSize: '10px', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1, flexShrink: 0 }}>
        ?
      </button>

      {/* Hover tooltip */}
      {showTooltip && !showPanel && (
        <div style={{ position: 'absolute', left: '22px', top: '-4px', background: 'rgba(44,24,16,.95)', color: 'white', padding: '6px 10px', borderRadius: '7px', fontSize: '11px', lineHeight: 1.5, width: '200px', zIndex: 2000, pointerEvents: 'none', whiteSpace: 'normal' }}>
          {helpText}
          <div style={{ position: 'absolute', left: '-5px', top: '10px', width: 0, height: 0, borderTop: '5px solid transparent', borderBottom: '5px solid transparent', borderRight: '5px solid rgba(44,24,16,.95)' }} />
        </div>
      )}

      {/* Click panel */}
      {showPanel && (
        <div style={{ position: 'absolute', left: '22px', top: '-4px', background: 'white', border: `1px solid ${C.border}`, borderRadius: '10px', padding: '12px 14px', fontSize: '12px', lineHeight: 1.6, width: '240px', zIndex: 2000, color: C.text, boxShadow: '0 4px 16px rgba(119,68,53,.2)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
            <span style={{ fontWeight: 700, fontSize: '12px', color: C.primary }}>About this section</span>
            <button onClick={() => setShowPanel(false)} style={{ background: 'none', border: 'none', color: C.muted, cursor: 'pointer', fontSize: '14px', lineHeight: 1, padding: 0 }}>×</button>
          </div>
          {helpText}
        </div>
      )}
    </div>
  )
}

// ── Auth Provider ─────────────────────────────────────────────────────────────

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

// ── Sidebar ───────────────────────────────────────────────────────────────────

function Sidebar({ user, onLogout }: { user: User | null; onLogout: () => void }) {
  const pathname   = usePathname()
  const [expanded,  setExpanded]  = useState(false)
  const [openGroup, setOpenGroup] = useState<string | null>('standards')

  const filteredGroups = NAV_GROUPS.filter(g =>
    !(g as any).roles || (user && (g as any).roles.includes(user.role))
  )

  return (
    <div style={{ width: expanded ? 240 : 56, minHeight: '100vh', background: C.primary, display: 'flex', flexDirection: 'column', flexShrink: 0, transition: 'width 0.2s ease', overflow: 'hidden' }}>

      {/* Logo + toggle */}
      <div style={{ padding: expanded ? '12px 14px' : '12px 0', borderBottom: '1px solid rgba(255,255,255,.15)', display: 'flex', alignItems: 'center', justifyContent: expanded ? 'space-between' : 'center' }}>
        {expanded && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
            <img src="/logo.png" alt="Rainier Gardens" style={{ height: '32px', objectFit: 'contain', flexShrink: 0 }} />
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
          const items   = group.items.filter(i => !(i as any).roles || (user && (i as any).roles.includes(user.role)))
          const isOpen  = openGroup === group.id

          return (
            <div key={group.id}>
              {/* Group header */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: expanded ? 'space-between' : 'center' }}>
                <button
                  onClick={() => { if (!expanded) setExpanded(true); setOpenGroup(p => p === group.id ? null : group.id) }}
                  style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: expanded ? 'space-between' : 'center', padding: expanded ? '8px 14px' : '10px 0', background: isOpen && expanded ? 'rgba(255,255,255,.1)' : 'none', border: 'none', cursor: 'pointer', color: 'white', fontFamily: 'inherit' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: expanded ? '9px' : '0' }}>
                    <span style={{ fontSize: '15px', width: '20px', textAlign: 'center', flexShrink: 0 }}>{group.icon}</span>
                    {expanded && <span style={{ fontSize: '12px', fontWeight: 600, whiteSpace: 'nowrap' }}>{group.label}</span>}
                  </div>
                  {expanded && <span style={{ fontSize: '10px', color: 'rgba(255,255,255,.5)', display: 'inline-block', transform: isOpen ? 'rotate(90deg)' : 'none', transition: 'transform .15s' }}>▶</span>}
                </button>
                {expanded && <MenuHelpIcon helpText={group.help} expanded={expanded} />}
                {expanded && <div style={{ width: '8px' }} />}
              </div>

              {/* Expanded items */}
              {expanded && isOpen && (
                <div style={{ borderBottom: '1px solid rgba(255,255,255,.08)', paddingBottom: '4px', marginBottom: '4px' }}>
                  {items.map(item => {
                    const active = pathname === item.href
                    return (
                      <div key={item.href} style={{ display: 'flex', alignItems: 'center', paddingRight: '8px' }}>
                        <a href={item.href}
                          style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '9px', padding: '7px 14px 7px 28px', color: active ? 'white' : 'rgba(255,255,255,.65)', background: active ? 'rgba(255,255,255,.15)' : 'none', borderLeft: active ? '3px solid white' : '3px solid transparent', textDecoration: 'none', fontSize: '12px', fontWeight: active ? 600 : 400, whiteSpace: 'nowrap' }}>
                          <span style={{ fontSize: '12px', width: '16px', textAlign: 'center' }}>{item.icon}</span>
                          {item.label}
                        </a>
                        <MenuHelpIcon helpText={item.help} expanded={expanded} />
                      </div>
                    )
                  })}
                </div>
              )}

              {/* Collapsed icons */}
              {!expanded && items.map(item => {
                const active = pathname === item.href
                return (
                  <a key={item.href} href={item.href} title={item.label}
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '9px 0', color: active ? 'white' : 'rgba(255,255,255,.55)', background: active ? 'rgba(255,255,255,.15)' : 'none', borderLeft: active ? '3px solid white' : '3px solid transparent', textDecoration: 'none', fontSize: '13px' }}>
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

// ── Shell ─────────────────────────────────────────────────────────────────────

function Shell({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth()
  const pathname = usePathname()
  if (pathname === '/login') return <>{children}</>

  return (
    <div style={{ display: 'flex', minHeight: '100vh', fontFamily: "'Inter', system-ui, sans-serif" }}>
      <Sidebar user={user} onLogout={logout} />
      <main style={{ flex: 1, overflow: 'auto', padding: '28px 32px', background: '#F9F0ED', minWidth: 0 }}>
        {children}
      </main>
      <HelpWidget />
      <BugReporter />
    </div>
  )
}

export default function Providers({ children }: { children: ReactNode }) {
  return <AuthProvider><Shell>{children}</Shell></AuthProvider>
}
