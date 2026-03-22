'use client'
import { useEffect, useState } from 'react'
import { api, AuditLog } from '../../lib/api'
import { useAuth } from '../layout'
import { useRouter } from 'next/navigation'

export default function AdminPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [page, setPage] = useState(1)
  const [pages, setPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const [versions, setVersions] = useState<Record<string, string>>({})

  useEffect(() => {
    if (user && user.role !== 'ADMIN') { router.replace('/standards'); return }
    api.auditLog(page).then(r => { setLogs(r.logs); setPages(r.pages) }).finally(() => setLoading(false))
  }, [page, user, router])

  useEffect(() => {
    api.certifiedVersions().then(r => setVersions(r.versions))
  }, [])

  if (loading) return <p>Loading...</p>

  return (
    <div>
      <h1 style={{ fontSize: 22, marginBottom: 20 }}>Admin Dashboard</h1>

      <section style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: 16, marginBottom: 10 }}>Certified Versions</h2>
        <div style={{ background: '#fff', borderRadius: 8, padding: 16, boxShadow: '0 1px 3px rgba(0,0,0,.05)' }}>
          {Object.keys(versions).length === 0 ? (
            <p style={{ color: '#999' }}>No certified versions yet.</p>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ textAlign: 'left', fontSize: 13, color: '#666' }}>
                  <th style={{ padding: '6px 12px' }}>Package</th>
                  <th style={{ padding: '6px 12px' }}>Version</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(versions).map(([pkg, ver]) => (
                  <tr key={pkg} style={{ borderTop: '1px solid #eee' }}>
                    <td style={{ padding: '8px 12px', fontSize: 14 }}><code>{pkg}</code></td>
                    <td style={{ padding: '8px 12px', fontSize: 14 }}>v{ver}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>

      <section>
        <h2 style={{ fontSize: 16, marginBottom: 10 }}>Audit Log</h2>
        <div style={{ background: '#fff', borderRadius: 8, overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,.05)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f8f6f4', textAlign: 'left', fontSize: 13, color: '#666' }}>
                <th style={thStyle}>Time</th>
                <th style={thStyle}>User</th>
                <th style={thStyle}>Action</th>
                <th style={thStyle}>Entity</th>
                <th style={thStyle}>Details</th>
              </tr>
            </thead>
            <tbody>
              {logs.map(log => (
                <tr key={log.id} style={{ borderTop: '1px solid #eee' }}>
                  <td style={tdStyle}>{new Date(log.createdAt).toLocaleString()}</td>
                  <td style={tdStyle}>{log.user?.name ?? '—'}</td>
                  <td style={tdStyle}><code style={{ fontSize: 12 }}>{log.action}</code></td>
                  <td style={tdStyle}><code style={{ fontSize: 12 }}>{log.entity}</code></td>
                  <td style={tdStyle}>
                    {log.details ? <pre style={{ margin: 0, fontSize: 11, maxWidth: 300, overflow: 'auto', whiteSpace: 'pre-wrap' }}>{JSON.stringify(log.details, null, 1)}</pre> : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {pages > 1 && (
          <div style={{ display: 'flex', gap: 8, marginTop: 12, justifyContent: 'center' }}>
            <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} style={pgBtn}>Prev</button>
            <span style={{ fontSize: 13, lineHeight: '30px' }}>Page {page} of {pages}</span>
            <button disabled={page >= pages} onClick={() => setPage(p => p + 1)} style={pgBtn}>Next</button>
          </div>
        )}
      </section>
    </div>
  )
}

const thStyle: React.CSSProperties = { padding: '8px 12px', fontWeight: 500 }
const tdStyle: React.CSSProperties = { padding: '8px 12px', fontSize: 13 }
const pgBtn: React.CSSProperties = {
  background: '#774435', color: '#fff', border: 'none', padding: '4px 14px',
  borderRadius: 5, cursor: 'pointer', fontSize: 13,
}
