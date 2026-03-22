'use client'
import { Inter } from 'next/font/google'
import { useRouter, usePathname } from 'next/navigation'
import { useEffect, useState, createContext, useContext } from 'react'
import { api, User } from '../lib/api'

const inter = Inter({ subsets: ['latin'] })

interface AuthCtx { user: User | null; logout: () => void; refresh: () => Promise<void> }
const AuthContext = createContext<AuthCtx>({ user: null, logout: () => {}, refresh: async () => {} })
export const useAuth = () => useContext(AuthContext)

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const pathname = usePathname()

  const refresh = async () => {
    try {
      const { user: u } = await api.me()
      setUser(u)
    } catch {
      setUser(null)
      localStorage.removeItem('studio_token')
    }
  }

  useEffect(() => {
    const token = localStorage.getItem('studio_token')
    if (!token) { setLoading(false); return }
    refresh().finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (!loading && !user && pathname !== '/login') router.replace('/login')
  }, [loading, user, pathname, router])

  const logout = () => {
    localStorage.removeItem('studio_token')
    setUser(null)
    router.push('/login')
  }

  return (
    <html lang="en">
      <body className={inter.className} style={{ margin: 0, background: '#f5f3f0' }}>
        <AuthContext.Provider value={{ user, logout, refresh }}>
          {user && <Nav user={user} logout={logout} pathname={pathname} />}
          <main style={{ maxWidth: 1100, margin: '0 auto', padding: '24px 20px' }}>
            {loading ? <p style={{ textAlign: 'center', marginTop: 80 }}>Loading...</p> : children}
          </main>
        </AuthContext.Provider>
      </body>
    </html>
  )
}

function Nav({ user, logout, pathname }: { user: User; logout: () => void; pathname: string }) {
  const link = (href: string, label: string) => (
    <a href={href} style={{
      color: pathname.startsWith(href) ? '#fff' : 'rgba(255,255,255,.7)',
      textDecoration: 'none', fontWeight: pathname.startsWith(href) ? 600 : 400,
    }}>{label}</a>
  )
  return (
    <nav style={{
      background: '#774435', color: '#fff', padding: '12px 24px',
      display: 'flex', alignItems: 'center', gap: 24, fontSize: 14,
    }}>
      <strong style={{ fontSize: 16, marginRight: 8 }}>Standards Studio</strong>
      {link('/standards', 'Standards')}
      {user.role === 'ADMIN' && link('/admin', 'Admin')}
      <span style={{ marginLeft: 'auto', opacity: 0.7 }}>{user.name} ({user.role})</span>
      <button onClick={logout} style={{
        background: 'rgba(255,255,255,.15)', border: 'none', color: '#fff',
        padding: '4px 12px', borderRadius: 4, cursor: 'pointer',
      }}>Logout</button>
    </nav>
  )
}
