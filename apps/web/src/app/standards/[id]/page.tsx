'use client'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { api, type Standard, type StandardVersion, type Proposal } from '@/lib/api'
import { useAuth } from '@/app/layout'

const C = {
  primary: '#774435', border: '#E8C5B5', text: '#2C1810',
  muted: '#A0705A', surface: '#F9F0ED',
  success: '#059669', error: '#DC2626', warning: '#D97706',
}

const STATUS: Record<string, { bg: string; color: string }> = {
  CERTIFIED:  { bg: 'rgba(5,150,105,.12)',   color: '#059669' },
  DRAFT:      { bg: 'rgba(217,119,6,.12)',   color: '#D97706' },
  DEPRECATED: { bg: 'rgba(107,114,128,.12)', color: '#6B7280' },
}

export default function StandardDetailPage() {
  const params   = useParams()
  const { user } = useAuth()
  const [standard,   setStandard]   = useState<Standard | null>(null)
  const [activeTab,  setActiveTab]  = useState('preview')
  const [activeVer,  setActiveVer]  = useState<StandardVersion | null>(null)
  const [certifying, setCertifying] = useState(false)
  const [certMsg,    setCertMsg]    = useState('')
  const [loading,    setLoading]    = useState(true)

  const load = () => {
    api.getStandard(params.id as string)
      .then(d => { setStandard(d.standard); setActiveVer(d.standard.versions?.[0] ?? null) })
      .catch(console.error)
      .finally(() => setLoading(false))
  }
  useEffect(load, [params.id])

  const certify = async () => {
    if (!activeVer) return
    setCertifying(true); setCertMsg('')
    try {
      const r = await api.certify(activeVer.id)
      setCertMsg(r.message); load()
    } catch (e: any) {
      setCertMsg(`Error: ${e.message}`)
    } finally { setCertifying(false) }
  }

  if (loading) return <p style={{ color: C.muted, padding: '20px' }}>Loading…</p>
  if (!standard) return <p style={{ color: C.error, padding: '20px' }}>Standard not found.</p>

  const isCertifier = user && ['CERTIFIER', 'ADMIN'].includes(user.role)
  const draftVer    = standard.versions?.find(v => !v.certifiedAt)
  const openCount   = standard.proposals?.filter(p => p.status === 'OPEN').length ?? 0

  const TABS = [
    { key: 'preview',   label: '▶ Preview' },
    { key: 'spec',      label: '📐 Spec' },
    { key: 'examples',  label: '💡 Usage' },
    { key: 'tests',     label: '✓ Tests' },
    { key: 'history',   label: '🕐 History' },
    { key: 'proposals', label: `💬 Proposals${openCount > 0 ? ` (${openCount})` : ''}` },
  ]

  return (
    <div style={{ maxWidth: '920px' }}>
      <a href="/" style={{ fontSize: '12px', color: C.muted, textDecoration: 'none' }}>← All Standards</a>

      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', margin: '12px 0 20px', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '3px' }}>
            <h1 style={{ margin: 0, fontSize: '20px', fontWeight: 800, color: C.text }}>{standard.name}</h1>
            <span style={{ fontSize: '11px', fontWeight: 700, padding: '2px 9px', borderRadius: '99px', background: STATUS[standard.status]?.bg, color: STATUS[standard.status]?.color }}>
              {standard.status}{standard.currentVersion ? ` ${standard.currentVersion}` : ''}
            </span>
          </div>
          <p style={{ margin: '0 0 6px', fontSize: '12px', color: C.muted, fontFamily: 'monospace' }}>{standard.packageName}</p>
          <p style={{ margin: 0, fontSize: '13px', color: C.text, lineHeight: 1.6 }}>{standard.description}</p>
          {standard.requiredBy?.length > 0 && (
            <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap', marginTop: '8px' }}>
              {standard.requiredBy.map(app => (
                <span key={app} style={{ fontSize: '11px', background: C.surface, color: C.muted, padding: '2px 7px', borderRadius: '99px', border: `1px solid ${C.border}` }}>{app}</span>
              ))}
            </div>
          )}
        </div>
        {isCertifier && draftVer && activeVer && !activeVer.certifiedAt && (
          <button onClick={certify} disabled={certifying}
            style={{ flexShrink: 0, padding: '9px 18px', background: C.success, color: 'white', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: 700, cursor: certifying ? 'not-allowed' : 'pointer', opacity: certifying ? 0.7 : 1 }}>
            {certifying ? 'Certifying…' : `Certify ${draftVer.version}`}
          </button>
        )}
      </div>

      {certMsg && (
        <div style={{ padding: '10px 14px', borderRadius: '8px', background: certMsg.startsWith('Error') ? '#FEF2F2' : '#F0FDF4', color: certMsg.startsWith('Error') ? C.error : C.success, fontSize: '13px', marginBottom: '16px' }}>
          {certMsg}
          {!certMsg.startsWith('Error') && activeVer && (
            <button onClick={() => api.markPrMerged(activeVer.id).then(load)}
              style={{ marginLeft: '12px', fontSize: '12px', background: 'none', border: '1px solid currentColor', borderRadius: '6px', padding: '2px 8px', cursor: 'pointer', color: 'inherit' }}>
              Mark PR Merged
            </button>
          )}
        </div>
      )}

      {(standard.versions?.length ?? 0) > 1 && (
        <div style={{ display: 'flex', gap: '6px', marginBottom: '14px', flexWrap: 'wrap' }}>
          {standard.versions?.map(v => (
            <button key={v.id} onClick={() => setActiveVer(v)}
              style={{ padding: '4px 12px', borderRadius: '99px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', border: `1.5px solid ${activeVer?.id === v.id ? C.primary : C.border}`, background: activeVer?.id === v.id ? C.surface : 'white', color: activeVer?.id === v.id ? C.primary : C.muted }}>
              {v.version}{v.certifiedAt ? ' ✓' : ' (draft)'}
            </button>
          ))}
        </div>
      )}

      <div style={{ display: 'flex', borderBottom: `1px solid ${C.border}`, marginBottom: '20px' }}>
        {TABS.map(t => (
          <button key={t.key} onClick={() => setActiveTab(t.key)}
            style={{ padding: '9px 16px', fontSize: '12px', fontWeight: 500, cursor: 'pointer', background: 'none', border: 'none', borderBottom: activeTab === t.key ? `2px solid ${C.primary}` : '2px solid transparent', color: activeTab === t.key ? C.primary : C.muted, marginBottom: '-1px' }}>
            {t.label}
          </button>
        ))}
      </div>

      {activeVer && (
        <>
          {activeTab === 'preview'   && <LivePreview sourceCode={activeVer.sourceCode} packageName={standard.packageName} />}
          {activeTab === 'spec'      && <MDView content={activeVer.visualSpec} />}
          {activeTab === 'examples'  && <MDView content={activeVer.usageExamples} />}
          {activeTab === 'tests'     && <MDView content={activeVer.testCases} />}
          {activeTab === 'history'   && <HistoryView versions={standard.versions ?? []} onMerged={load} />}
          {activeTab === 'proposals' && <ProposalsView standardId={standard.id} proposals={standard.proposals ?? []} isCertifier={!!isCertifier} onUpdate={load} />}
        </>
      )}
    </div>
  )
}

function LivePreview({ sourceCode, packageName }: { sourceCode: string; packageName: string }) {
  const prepared = sourceCode
    .replace(/import\s+.*?from\s+['"]@rg\/branding['"]/g, '// branding tokens available: colors, typography, radii, shadows, spacing')
    .replace(/export default /g, 'window.__default__=')
    .replace(/export (function|class|const) ([A-Za-z]+)/g, 'window.__exp__=window.__exp__||{};window.__exp__.$2=$2;$1 $2')

  const html = [
    '<!DOCTYPE html><html><head><meta charset="utf-8"/>',
    '<script src="https://unpkg.com/react@18/umd/react.development.js"><\/script>',
    '<script src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"><\/script>',
    '<script src="https://unpkg.com/@babel/standalone/babel.min.js"><\/script>',
    '<style>body{margin:16px;font-family:Inter,system-ui,sans-serif;background:#F9F0ED;color:#2C1810}</style>',
    '</head><body><div id="root"></div><script type="text/babel">',
    'const colors={primary:"#774435",surfaceAlt:"#F9F0ED",border:"#E8C5B5",text:"#2C1810",textMuted:"#A0705A",verified:"#059669",white:"#fff",black:"#000"};',
    'const typography={fontSans:"Inter,system-ui,sans-serif",fontMono:"monospace"};',
    'const radii={sm:"4px",md:"6px",lg:"10px",xl:"14px","2xl":"20px",full:"9999px"};',
    'const shadows={sm:"0 1px 2px rgba(0,0,0,.05)",md:"0 4px 6px rgba(0,0,0,.1)"};',
    'const spacing={"0":"0","1":"4px","2":"8px","3":"12px","4":"16px","5":"20px","6":"24px","8":"32px"};',
    prepared,
    'const exp=window.__exp__||{};',
    'const name=Object.keys(exp).find(k=>/^[A-Z]/.test(k)&&typeof exp[k]==="function");',
    'const Comp=name?exp[name]:window.__default__;',
    'const root=document.getElementById("root");',
    'if(typeof Comp==="function"){ReactDOM.createRoot(root).render(React.createElement("div",null,React.createElement("p",{style:{fontSize:"11px",color:"#A0705A",marginBottom:"10px"}},"Preview: "+(name||"default")),React.createElement(Comp,null)));}',
    'else{root.innerHTML="<p style=\'color:#A0705A;font-size:13px\'>No renderable component — exports utilities or types. See the Usage tab.</p>";}',
    '<\/script></body></html>',
  ].join('\n')

  return (
    <div>
      <p style={{ fontSize: '12px', color: C.muted, marginBottom: '10px' }}>
        Live render of <code style={{ background: C.surface, padding: '2px 5px', borderRadius: '4px', fontSize: '11px' }}>{packageName}</code>. Branding tokens stubbed.
      </p>
      <iframe srcDoc={html} style={{ width: '100%', height: '380px', border: `1px solid ${C.border}`, borderRadius: '10px', background: C.surface }} sandbox="allow-scripts" />
      <details style={{ marginTop: '12px' }}>
        <summary style={{ fontSize: '12px', color: C.muted, cursor: 'pointer' }}>View source</summary>
        <pre style={{ marginTop: '8px', padding: '14px', background: '#1E1B4B', color: '#C4B5FD', borderRadius: '8px', fontSize: '11px', overflow: 'auto', lineHeight: 1.6 }}>{sourceCode}</pre>
      </details>
    </div>
  )
}

function MDView({ content }: { content: string | null }) {
  if (!content) return <p style={{ color: C.muted, fontSize: '13px' }}>No content.</p>
  const html = content
    .replace(/```[\w]*\n([\s\S]*?)```/g, (_m, c) => `<pre style="background:#1E1B4B;color:#C4B5FD;padding:14px;border-radius:8px;font-size:11px;overflow:auto;line-height:1.6">${c.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</pre>`)
    .replace(/^### (.+)$/gm, '<h3 style="color:#2C1810;font-size:14px;margin:16px 0 6px">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 style="color:#2C1810;font-size:16px;margin:20px 0 8px">$1</h2>')
    .replace(/^# (.+)$/gm, '<h1 style="color:#2C1810;font-size:20px;margin:0 0 14px">$1</h1>')
    .replace(/`([^`]+)`/g, '<code style="background:#F9F0ED;padding:1px 5px;border-radius:3px;font-size:11px">$1</code>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/^- \[ \] (.+)$/gm, '<div style="display:flex;gap:7px;align-items:center;margin:4px 0"><input type="checkbox" disabled/> $1</div>')
    .replace(/^- \[x\] (.+)$/gm, '<div style="display:flex;gap:7px;align-items:center;margin:4px 0"><input type="checkbox" checked disabled/> $1</div>')
    .replace(/^- (.+)$/gm, '<li style="margin:3px 0">$1</li>')
    .replace(/\n\n/g, '<br/><br/>')
  return <div style={{ fontSize: '13px', lineHeight: 1.7, color: C.text }} dangerouslySetInnerHTML={{ __html: html }} />
}

function HistoryView({ versions, onMerged }: { versions: StandardVersion[]; onMerged: () => void }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      {versions.length === 0 && <p style={{ color: C.muted, fontSize: '13px' }}>No versions yet.</p>}
      {versions.map(v => (
        <div key={v.id} style={{ padding: '14px 18px', background: 'white', border: `1px solid ${C.border}`, borderRadius: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontWeight: 800, fontSize: '14px', color: C.text }}>{v.version}</span>
              <span style={{ fontSize: '11px', fontWeight: 700, padding: '2px 7px', borderRadius: '99px', background: v.certifiedAt ? STATUS.CERTIFIED.bg : STATUS.DRAFT.bg, color: v.certifiedAt ? STATUS.CERTIFIED.color : STATUS.DRAFT.color }}>
                {v.certifiedAt ? 'CERTIFIED' : 'DRAFT'}
              </span>
            </div>
            <span style={{ fontSize: '11px', color: C.muted }}>
              {v.certifiedAt
                ? `Certified ${new Date(v.certifiedAt).toLocaleDateString()}${v.certifiedBy ? ` by ${v.certifiedBy.name}` : ''}`
                : `Created ${new Date(v.createdAt).toLocaleDateString()}`}
            </span>
          </div>
          {v.githubPrUrl && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '8px' }}>
              <a href={v.githubPrUrl} target="_blank" rel="noreferrer" style={{ fontSize: '12px', color: C.primary }}>
                View PR → {v.githubPrMerged ? '(merged)' : '(pending merge)'}
              </a>
              {!v.githubPrMerged && (
                <button onClick={() => api.markPrMerged(v.id).then(onMerged)}
                  style={{ fontSize: '11px', padding: '2px 8px', border: `1px solid ${C.success}`, borderRadius: '6px', background: 'none', color: C.success, cursor: 'pointer' }}>
                  Mark Merged
                </button>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

function ProposalsView({ standardId, proposals, isCertifier, onUpdate }: { standardId: string; proposals: Proposal[]; isCertifier: boolean; onUpdate: () => void }) {
  const [showForm, setShowForm] = useState(false)
  const [title,    setTitle]    = useState('')
  const [desc,     setDesc]     = useState('')
  const [sub,      setSub]      = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setSub(true)
    try {
      await api.submitProposal({ standardId, title, description: desc })
      setShowForm(false); setTitle(''); setDesc(''); onUpdate()
    } catch (err: any) { alert(err.message) }
    finally { setSub(false) }
  }

  const resolve = async (id: string, status: 'INCORPORATED' | 'REJECTED') => {
    try { await api.updateProposal(id, { status }); onUpdate() }
    catch (err: any) { alert(err.message) }
  }

  const PS: Record<string, { bg: string; color: string }> = {
    OPEN:         { bg: 'rgba(37,99,235,.1)',    color: '#1D4ED8' },
    INCORPORATED: { bg: 'rgba(5,150,105,.12)',   color: C.success },
    REJECTED:     { bg: 'rgba(107,114,128,.12)', color: C.muted   },
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
        <p style={{ margin: 0, fontSize: '13px', color: C.muted }}>
          {proposals.filter(p => p.status === 'OPEN').length} open proposal{proposals.filter(p => p.status === 'OPEN').length !== 1 ? 's' : ''}
        </p>
        <button onClick={() => setShowForm(!showForm)}
          style={{ padding: '7px 14px', background: C.primary, color: 'white', border: 'none', borderRadius: '7px', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>
          + Propose Change
        </button>
      </div>

      {showForm && (
        <form onSubmit={submit} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: '10px', padding: '16px', marginBottom: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <input value={title} onChange={e => setTitle(e.target.value)} required placeholder="Proposal title"
            style={{ padding: '8px 10px', borderRadius: '7px', border: `1.5px solid ${C.border}`, fontSize: '13px', outline: 'none', fontFamily: 'inherit' }} />
          <textarea value={desc} onChange={e => setDesc(e.target.value)} required rows={3} placeholder="Describe what should change and why…"
            style={{ padding: '8px 10px', borderRadius: '7px', border: `1.5px solid ${C.border}`, fontSize: '13px', outline: 'none', resize: 'vertical' as const, fontFamily: 'inherit' }} />
          <div style={{ display: 'flex', gap: '8px' }}>
            <button type="submit" disabled={sub}
              style={{ padding: '7px 16px', background: C.primary, color: 'white', border: 'none', borderRadius: '7px', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>
              {sub ? 'Submitting…' : 'Submit'}
            </button>
            <button type="button" onClick={() => setShowForm(false)}
              style={{ padding: '7px 12px', background: 'none', border: `1px solid ${C.border}`, borderRadius: '7px', fontSize: '12px', cursor: 'pointer' }}>
              Cancel
            </button>
          </div>
        </form>
      )}

      {proposals.length === 0 && <p style={{ color: C.muted, fontSize: '13px' }}>No proposals yet. Be the first to propose a change.</p>}

      {proposals.map(p => (
        <div key={p.id} style={{ padding: '14px 18px', background: 'white', border: `1px solid ${C.border}`, borderRadius: '10px', marginBottom: '8px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <p style={{ margin: '0 0 2px', fontWeight: 600, fontSize: '14px', color: C.text }}>{p.title}</p>
              <p style={{ margin: 0, fontSize: '11px', color: C.muted }}>by {p.author.name} · {new Date(p.createdAt).toLocaleDateString()}</p>
            </div>
            <span style={{ fontSize: '11px', fontWeight: 700, padding: '2px 7px', borderRadius: '99px', background: PS[p.status]?.bg, color: PS[p.status]?.color }}>{p.status}</span>
          </div>
          <p style={{ margin: '8px 0 0', fontSize: '13px', color: C.text, lineHeight: 1.5 }}>{p.description}</p>
          {isCertifier && p.status === 'OPEN' && (
            <div style={{ display: 'flex', gap: '6px', marginTop: '10px' }}>
              <button onClick={() => resolve(p.id, 'INCORPORATED')}
                style={{ padding: '4px 12px', background: 'rgba(5,150,105,.12)', color: C.success, border: 'none', borderRadius: '6px', fontSize: '11px', fontWeight: 600, cursor: 'pointer' }}>
                Incorporate
              </button>
              <button onClick={() => resolve(p.id, 'REJECTED')}
                style={{ padding: '4px 12px', background: 'rgba(220,38,38,.08)', color: C.error, border: 'none', borderRadius: '6px', fontSize: '11px', fontWeight: 600, cursor: 'pointer' }}>
                Reject
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
