'use client'
import { useEffect, useState } from 'react'
import { api, type Standard } from '@/lib/api'
import { useAuth } from '@/app/providers'

const C = { primary: '#774435', border: '#E8C5B5', text: '#2C1810', muted: '#A0705A', surface: '#F9F0ED' }

const S: Record<string, { bg: string; color: string; label: string }> = {
  CERTIFIED:  { bg: 'rgba(5,150,105,.12)',   color: '#059669', label: 'Certified'  },
  DRAFT:      { bg: 'rgba(217,119,6,.12)',   color: '#D97706', label: 'Draft'      },
  DEPRECATED: { bg: 'rgba(107,114,128,.12)', color: '#6B7280', label: 'Deprecated' },
}

export default function HomePage() {
  const { user }  = useAuth()
  const [standards, setStandards] = useState<Standard[]>([])
  const [loading,   setLoading]   = useState(true)
  const [error,     setError]     = useState('')

  useEffect(() => {
    api.listStandards().then(d => setStandards(d.standards)).catch(e => setError(e.message)).finally(() => setLoading(false))
  }, [])

  const groups = ['CERTIFIED','DRAFT','DEPRECATED'] as const

  return (
    <div style={{ maxWidth: '860px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '28px' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '22px', fontWeight: 800, color: C.text }}>Standards Library</h1>
          <p style={{ margin: '4px 0 0', fontSize: '13px', color: C.muted }}>
            {standards.filter(s => s.status === 'CERTIFIED').length} certified ·{' '}
            {standards.filter(s => s.status === 'DRAFT').length} draft
          </p>
        </div>
        {user && ['CERTIFIER','ADMIN'].includes(user.role) && (
          <a href="/standards/new" style={{ padding: '9px 18px', background: C.primary, color: 'white', borderRadius: '8px', textDecoration: 'none', fontSize: '13px', fontWeight: 600 }}>
            + New Standard
          </a>
        )}
      </div>

      {loading && <p style={{ color: C.muted }}>Loading…</p>}
      {error   && <p style={{ color: '#DC2626' }}>{error}</p>}

      {groups.map(status => {
        const group = standards.filter(s => s.status === status)
        if (!group.length) return null
        const ss = S[status]
        return (
          <div key={status} style={{ marginBottom: '28px' }}>
            <p style={{ margin: '0 0 12px', fontSize: '11px', fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: '.07em' }}>{ss.label}</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {group.map(s => (
                <a key={s.id} href={`/standards/${s.id}`}
                  style={{ display: 'block', background: 'white', border: `1px solid ${C.border}`, borderRadius: '10px', padding: '16px 20px', textDecoration: 'none', transition: 'box-shadow .15s' }}
                  onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 4px 12px rgba(119,68,53,.1)')}
                  onMouseLeave={e => (e.currentTarget.style.boxShadow = 'none')}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                      <span style={{ fontSize: '15px', fontWeight: 700, color: C.text }}>{s.name}</span>
                      <span style={{ marginLeft: '10px', fontSize: '12px', color: C.muted, fontFamily: 'monospace' }}>{s.packageName}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      {(s._count?.proposals ?? 0) > 0 && (
                        <span style={{ fontSize: '11px', background: 'rgba(217,119,6,.12)', color: '#D97706', padding: '2px 8px', borderRadius: '99px', fontWeight: 600 }}>
                          {s._count!.proposals} proposal{s._count!.proposals !== 1 ? 's' : ''}
                        </span>
                      )}
                      {s.currentVersion && <span style={{ fontSize: '12px', color: C.muted }}>{s.currentVersion}</span>}
                      <span style={{ fontSize: '11px', fontWeight: 700, background: ss.bg, color: ss.color, padding: '2px 9px', borderRadius: '99px' }}>{ss.label}</span>
                    </div>
                  </div>
                  <p style={{ margin: '8px 0 0', fontSize: '13px', color: C.muted, lineHeight: 1.5 }}>{s.description}</p>
                  {s.requiredBy?.length > 0 && (
                    <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap', marginTop: '8px' }}>
                      {s.requiredBy.map(app => (
                        <span key={app} style={{ fontSize: '11px', background: C.surface, color: C.muted, padding: '2px 7px', borderRadius: '99px', border: `1px solid ${C.border}` }}>{app}</span>
                      ))}
                    </div>
                  )}
                </a>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}
