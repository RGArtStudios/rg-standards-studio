'use client'
import { useEffect, useState } from 'react'
import { api, type AuditLog } from '@/lib/api'
import { useAuth } from '@/app/providers'

const C = { primary: '#774435', border: '#E8C5B5', text: '#2C1810', muted: '#A0705A', surface: '#F9F0ED', success: '#059669', error: '#DC2626' }

export default function AdminPage() {
  const { user } = useAuth()
  const [tab,      setTab]      = useState<'registry' | 'audit'>('registry')
  const [versions, setVersions] = useState<Record<string, string>>({})
  const [logs,     setLogs]     = useState<AuditLog[]>([])
  const [loading,  setLoading]  = useState(true)

  useEffect(() => {
    if (!user || user.role !== 'ADMIN') return
    Promise.all([
      api.certifiedVersions(),
      api.auditLog(),
    ]).then(([v, a]) => {
      setVersions(v.versions)
      setLogs(a.logs)
    }).finally(() => setLoading(false))
  }, [user])

  if (!user || user.role !== 'ADMIN') {
    return <p style={{ color: C.error }}>Admin role required.</p>
  }

  const TABS = [
    { key: 'registry', label: 'Version Registry' },
    { key: 'audit',    label: 'Audit Log'         },
  ]

  return (
    <div style={{ maxWidth: '860px' }}>
      <h1 style={{ margin: '0 0 4px', fontSize: '22px', fontWeight: 800, color: C.text }}>Admin</h1>
      <p style={{ margin: '0 0 24px', fontSize: '13px', color: C.muted }}>Certified version registry and immutable audit log.</p>

      <div style={{ display: 'flex', borderBottom: `1px solid ${C.border}`, marginBottom: '24px' }}>
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key as any)}
            style={{ padding: '9px 20px', fontSize: '13px', fontWeight: 500, cursor: 'pointer', background: 'none', border: 'none', borderBottom: tab === t.key ? `2px solid ${C.primary}` : '2px solid transparent', color: tab === t.key ? C.primary : C.muted, marginBottom: '-1px' }}>
            {t.label}
          </button>
        ))}
      </div>

      {loading && <p style={{ color: C.muted }}>Loading…</p>}

      {!loading && tab === 'registry' && (
        <div>
          {Object.keys(versions).length === 0 ? (
            <p style={{ color: C.muted, fontSize: '13px' }}>No certified versions yet.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {Object.entries(versions).map(([pkg, ver]) => (
                <div key={pkg} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 18px', background: 'white', border: `1px solid ${C.border}`, borderRadius: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <code style={{ fontSize: '13px', fontWeight: 600, color: C.text }}>{pkg}</code>
                    <span style={{ fontSize: '11px', fontWeight: 700, padding: '2px 9px', borderRadius: '99px', background: 'rgba(5,150,105,.12)', color: C.success }}>CERTIFIED</span>
                  </div>
                  <span style={{ fontSize: '13px', fontWeight: 600, color: C.primary }}>v{ver}</span>
                </div>
              ))}
            </div>
          )}
          <p style={{ marginTop: '16px', fontSize: '11px', color: C.muted }}>
            {Object.keys(versions).length} package{Object.keys(versions).length !== 1 ? 's' : ''} certified. Versions are immutable once certified.
          </p>
        </div>
      )}

      {!loading && tab === 'audit' && (
        <div>
          {logs.length === 0 ? (
            <p style={{ color: C.muted, fontSize: '13px' }}>No audit entries yet.</p>
          ) : (
            <div style={{ background: 'white', border: `1px solid ${C.border}`, borderRadius: '10px', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead>
                  <tr style={{ background: C.surface, textAlign: 'left' }}>
                    <th style={thStyle}>Time</th>
                    <th style={thStyle}>User</th>
                    <th style={thStyle}>Action</th>
                    <th style={thStyle}>Entity</th>
                    <th style={thStyle}>Details</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map(log => (
                    <tr key={log.id} style={{ borderTop: `1px solid ${C.border}` }}>
                      <td style={tdStyle}>{new Date(log.createdAt).toLocaleString()}</td>
                      <td style={tdStyle}>{log.user?.name ?? '—'}</td>
                      <td style={tdStyle}>
                        <code style={{ fontSize: '11px', background: C.surface, padding: '1px 5px', borderRadius: '3px' }}>{log.action}</code>
                      </td>
                      <td style={tdStyle}>
                        <code style={{ fontSize: '11px', color: C.muted }}>{log.entity}</code>
                      </td>
                      <td style={tdStyle}>
                        {log.details ? (
                          <pre style={{ margin: 0, fontSize: '10px', maxWidth: 260, overflow: 'auto', whiteSpace: 'pre-wrap', color: C.muted }}>
                            {JSON.stringify(log.details, null, 1)}
                          </pre>
                        ) : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

const thStyle: React.CSSProperties = { padding: '10px 14px', fontWeight: 600, fontSize: '11px', color: '#A0705A', textTransform: 'uppercase', letterSpacing: '.05em' }
const tdStyle: React.CSSProperties = { padding: '10px 14px', verticalAlign: 'top' }
