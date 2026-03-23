'use client'
import { useEffect, useState } from 'react'
import { api, type ComplianceResult } from '@/lib/api'
import { useAuth } from '@/app/layout'

const C = { primary: '#774435', border: '#E8C5B5', text: '#2C1810', muted: '#A0705A', surface: '#F9F0ED', success: '#059669', error: '#DC2626', warning: '#D97706' }

export default function CompliancePage() {
  const { user }    = useAuth()
  const [data,    setData]    = useState<ComplianceResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState('')

  useEffect(() => {
    api.compliance()
      .then(setData)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <p style={{ color: C.muted }}>Loading compliance data…</p>
  if (error)   return <p style={{ color: C.error }}>{error}</p>
  if (!data)   return null

  const scoreColor = (score: number) => score === 100 ? C.success : score >= 75 ? C.warning : C.error
  const scoreBg    = (score: number) => score === 100 ? 'rgba(5,150,105,.1)' : score >= 75 ? 'rgba(217,119,6,.1)' : 'rgba(220,38,38,.1)'

  return (
    <div style={{ maxWidth: '1000px' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '20px', fontWeight: 800, color: C.text }}>Compliance Dashboard</h1>
          <p style={{ margin: '4px 0 0', fontSize: '13px', color: C.muted }}>
            Standards adoption across all Rainier Gardens apps · updated {new Date(data.summary.lastUpdated).toLocaleTimeString()}
          </p>
        </div>
        <button onClick={() => { setLoading(true); api.compliance().then(setData).catch(e=>setError(e.message)).finally(()=>setLoading(false)) }}
          style={{ padding: '7px 14px', background: 'white', color: C.primary, border: `1.5px solid ${C.primary}`, borderRadius: '7px', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>
          Refresh
        </button>
      </div>

      {/* Summary cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '24px' }}>
        {[
          { label: 'Total Standards',   value: data.summary.totalStandards },
          { label: 'Certified',         value: data.summary.totalCertified },
          { label: 'Platform Score',    value: data.summary.platformScore + '%' },
        ].map(card => (
          <div key={card.label} style={{ background: 'white', border: `1px solid ${C.border}`, borderRadius: '10px', padding: '16px' }}>
            <p style={{ margin: '0 0 4px', fontSize: '11px', color: C.muted, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.06em' }}>{card.label}</p>
            <p style={{ margin: 0, fontSize: '28px', fontWeight: 800, color: C.text }}>{card.value}</p>
          </div>
        ))}
      </div>

      {/* App compliance matrix */}
      <div style={{ background: 'white', border: `1px solid ${C.border}`, borderRadius: '12px', overflow: 'hidden' }}>
        <div style={{ padding: '14px 18px', borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', gap: '8px' }}>
          <h2 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: C.text }}>App Compliance Matrix</h2>
          <span style={{ fontSize: '11px', color: C.muted }}>— required standards per app</span>
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse' as const, fontSize: '13px' }}>
          <thead>
            <tr style={{ background: C.surface }}>
              <th style={{ padding: '10px 18px', textAlign: 'left' as const, fontSize: '11px', fontWeight: 700, color: C.muted, textTransform: 'uppercase' as const, letterSpacing: '.05em' }}>App</th>
              <th style={{ padding: '10px 18px', textAlign: 'center' as const, fontSize: '11px', fontWeight: 700, color: C.muted, textTransform: 'uppercase' as const, letterSpacing: '.05em' }}>Score</th>
              <th style={{ padding: '10px 18px', textAlign: 'left' as const, fontSize: '11px', fontWeight: 700, color: C.muted, textTransform: 'uppercase' as const, letterSpacing: '.05em' }}>Standards</th>
            </tr>
          </thead>
          <tbody>
            {data.matrix.filter(row => row.total > 0).map(row => (
              <tr key={row.app} style={{ borderTop: `1px solid ${C.border}` }}>
                <td style={{ padding: '12px 18px', fontWeight: 600, color: C.text }}>
                  <span style={{ fontFamily: 'monospace', fontSize: '12px' }}>{row.app}</span>
                </td>
                <td style={{ padding: '12px 18px', textAlign: 'center' as const }}>
                  <span style={{ display: 'inline-block', padding: '3px 12px', borderRadius: '99px', fontSize: '12px', fontWeight: 700, background: scoreBg(row.score), color: scoreColor(row.score) }}>
                    {row.score}%
                  </span>
                  <p style={{ margin: '2px 0 0', fontSize: '10px', color: C.muted }}>{row.certified}/{row.total}</p>
                </td>
                <td style={{ padding: '12px 18px' }}>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                    {row.standards.map(s => (
                      <span key={s.standardId}
                        style={{ fontSize: '10px', padding: '2px 7px', borderRadius: '99px', fontFamily: 'monospace', background: s.status === 'certified' ? 'rgba(5,150,105,.1)' : 'rgba(220,38,38,.08)', color: s.status === 'certified' ? C.success : C.error, border: `1px solid ${s.status === 'certified' ? 'rgba(5,150,105,.2)' : 'rgba(220,38,38,.15)'}` }}
                        title={`${s.packageName} — ${s.certifiedVersion ?? 'not certified'}`}>
                        {s.packageName.replace('@rg/', '')}
                        {s.certifiedVersion ? ` ${s.certifiedVersion}` : ' ✗'}
                      </span>
                    ))}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* rg-audit instructions */}
      <div style={{ marginTop: '20px', padding: '16px 20px', background: C.surface, borderRadius: '10px', border: `1px solid ${C.border}` }}>
        <p style={{ margin: '0 0 8px', fontSize: '13px', fontWeight: 700, color: C.text }}>Enforce in CI with rg-audit</p>
        <p style={{ margin: '0 0 8px', fontSize: '12px', color: C.muted }}>Add this to each app's CI pipeline to block deploys when standards are not met:</p>
        <pre style={{ margin: 0, background: '#1E1B4B', color: '#C4B5FD', padding: '12px 16px', borderRadius: '8px', fontSize: '12px', overflow: 'auto' }}>
          {`npx rg-audit --app verifiedpros --env staging \\
  --studio-url http://rg-standards-studio-alb-1196848513.us-west-2.elb.amazonaws.com`}
        </pre>
      </div>
    </div>
  )
}
