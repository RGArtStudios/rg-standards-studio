'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { api, Standard } from '../../lib/api'
import { useAuth } from '../providers'

export default function StandardsListPage() {
  const [standards, setStandards] = useState<Standard[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const { user } = useAuth()

  useEffect(() => {
    api.listStandards().then(r => setStandards(r.standards)).finally(() => setLoading(false))
  }, [])

  const statusColor: Record<string, string> = { CERTIFIED: '#27ae60', DRAFT: '#f39c12', DEPRECATED: '#95a5a6' }

  if (loading) return <p>Loading standards...</p>

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h1 style={{ fontSize: 22, margin: 0 }}>Standards Registry</h1>
        {user && user.role !== 'PROPOSER' && (
          <button onClick={() => router.push('/standards/new')} style={btnStyle}>+ New Standard</button>
        )}
      </div>
      <table style={{ width: '100%', borderCollapse: 'collapse', background: '#fff', borderRadius: 8, overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,.06)' }}>
        <thead>
          <tr style={{ background: '#f8f6f4', textAlign: 'left', fontSize: 13, color: '#666' }}>
            <th style={thStyle}>Package</th>
            <th style={thStyle}>Name</th>
            <th style={thStyle}>Version</th>
            <th style={thStyle}>Status</th>
            <th style={thStyle}>Proposals</th>
          </tr>
        </thead>
        <tbody>
          {standards.map(s => (
            <tr key={s.id} onClick={() => router.push(`/standards/${s.id}`)}
              style={{ cursor: 'pointer', borderTop: '1px solid #eee' }}
              onMouseEnter={e => (e.currentTarget.style.background = '#faf8f6')}
              onMouseLeave={e => (e.currentTarget.style.background = '')}>
              <td style={tdStyle}><code style={{ fontSize: 13 }}>{s.packageName}</code></td>
              <td style={tdStyle}>{s.name}</td>
              <td style={tdStyle}>{s.currentVersion ?? '—'}</td>
              <td style={tdStyle}>
                <span style={{ color: statusColor[s.status] ?? '#333', fontWeight: 600, fontSize: 12 }}>{s.status}</span>
              </td>
              <td style={tdStyle}>{s._count?.proposals ?? 0}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

const btnStyle: React.CSSProperties = {
  background: '#774435', color: '#fff', border: 'none', padding: '8px 16px',
  borderRadius: 6, cursor: 'pointer', fontSize: 14,
}
const thStyle: React.CSSProperties = { padding: '10px 14px', fontWeight: 500 }
const tdStyle: React.CSSProperties = { padding: '10px 14px', fontSize: 14 }
