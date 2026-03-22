'use client'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { api, Standard, StandardVersion, Proposal } from '../../../lib/api'
import { useAuth } from '../../layout'

export default function StandardDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { user } = useAuth()
  const [standard, setStandard] = useState<Standard | null>(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'versions' | 'proposals'>('versions')

  const load = () => api.getStandard(id).then(r => setStandard(r.standard)).finally(() => setLoading(false))
  useEffect(() => { load() }, [id])

  if (loading || !standard) return <p>Loading...</p>

  const isCertifier = user?.role === 'CERTIFIER' || user?.role === 'ADMIN'

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 4 }}>
        <h1 style={{ fontSize: 22, margin: 0 }}>{standard.name}</h1>
        <code style={{ fontSize: 14, color: '#774435' }}>{standard.packageName}</code>
        <StatusBadge status={standard.status} />
      </div>
      <p style={{ color: '#666', fontSize: 14, marginBottom: 20 }}>{standard.description}</p>

      {standard.requiredBy.length > 0 && (
        <p style={{ fontSize: 13, color: '#888', marginBottom: 16 }}>
          Required by: {standard.requiredBy.map(r => <code key={r} style={{ marginRight: 6 }}>{r}</code>)}
        </p>
      )}

      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <TabBtn active={tab === 'versions'} onClick={() => setTab('versions')}>Versions</TabBtn>
        <TabBtn active={tab === 'proposals'} onClick={() => setTab('proposals')}>Proposals</TabBtn>
      </div>

      {tab === 'versions' && (
        <VersionsTab standard={standard} isCertifier={isCertifier} onRefresh={load} />
      )}
      {tab === 'proposals' && (
        <ProposalsTab standardId={standard.id} isCertifier={isCertifier} />
      )}
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const color: Record<string, string> = { CERTIFIED: '#27ae60', DRAFT: '#f39c12', DEPRECATED: '#95a5a6' }
  return <span style={{ fontSize: 12, fontWeight: 600, color: color[status] ?? '#333' }}>{status}</span>
}

function TabBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick} style={{
      padding: '6px 14px', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 13,
      background: active ? '#774435' : '#e8e4e0', color: active ? '#fff' : '#555', fontWeight: 500,
    }}>{children}</button>
  )
}

function VersionsTab({ standard, isCertifier, onRefresh }: { standard: Standard; isCertifier: boolean; onRefresh: () => void }) {
  const versions = standard.versions ?? []
  const [showNew, setShowNew] = useState(false)
  const [certifying, setCertifying] = useState<string | null>(null)

  const handleCertify = async (vId: string) => {
    setCertifying(vId)
    try {
      const r = await api.certify(vId)
      alert(r.message)
      onRefresh()
    } catch (err: any) { alert(err.message) }
    finally { setCertifying(null) }
  }

  const handleMerged = async (vId: string) => {
    try { await api.markPrMerged(vId); onRefresh() } catch (err: any) { alert(err.message) }
  }

  return (
    <div>
      {isCertifier && <button onClick={() => setShowNew(!showNew)} style={smallBtn}>+ New Version</button>}
      {showNew && <NewVersionForm standardId={standard.id} onDone={() => { setShowNew(false); onRefresh() }} />}
      {versions.length === 0 && <p style={{ color: '#999' }}>No versions yet.</p>}
      {versions.map(v => (
        <div key={v.id} style={{ background: '#fff', padding: 16, borderRadius: 8, marginTop: 10, boxShadow: '0 1px 3px rgba(0,0,0,.05)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <strong>v{v.version}</strong>
            <span style={{ fontSize: 12, color: v.certifiedAt ? '#27ae60' : '#f39c12', fontWeight: 600 }}>
              {v.certifiedAt ? `Certified ${new Date(v.certifiedAt).toLocaleDateString()}` : 'Draft'}
            </span>
          </div>
          {v.sourceCode && <pre style={preStyle}>{v.sourceCode.slice(0, 300)}{v.sourceCode.length > 300 ? '...' : ''}</pre>}
          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            {isCertifier && !v.certifiedAt && (
              <button onClick={() => handleCertify(v.id)} disabled={certifying === v.id} style={smallBtn}>
                {certifying === v.id ? 'Certifying...' : 'Certify'}
              </button>
            )}
            {v.githubPrUrl && !v.githubPrMerged && isCertifier && (
              <button onClick={() => handleMerged(v.id)} style={smallBtn}>Mark PR Merged</button>
            )}
            {v.githubPrUrl && (
              <a href={v.githubPrUrl} target="_blank" rel="noreferrer" style={{ fontSize: 13, color: '#774435' }}>GitHub PR</a>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}

function NewVersionForm({ standardId, onDone }: { standardId: string; onDone: () => void }) {
  const [saving, setSaving] = useState(false)
  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    const val = (k: string) => (fd.get(k) as string).trim()
    setSaving(true)
    try {
      await api.createVersion(standardId, {
        sourceCode: val('sourceCode'),
        visualSpec: val('visualSpec'),
        usageExamples: val('usageExamples'),
        testCases: val('testCases'),
      })
      onDone()
    } catch (err: any) { alert(err.message) }
    finally { setSaving(false) }
  }
  return (
    <form onSubmit={submit} style={{ background: '#fff', padding: 16, borderRadius: 8, marginTop: 10 }}>
      <h3 style={{ margin: '0 0 12px', fontSize: 15 }}>New Version</h3>
      <textarea name="sourceCode" placeholder="Source code" rows={6} required style={taStyle} />
      <textarea name="visualSpec" placeholder="Visual spec (optional)" rows={3} style={taStyle} />
      <textarea name="usageExamples" placeholder="Usage examples (optional)" rows={3} style={taStyle} />
      <textarea name="testCases" placeholder="Test cases (optional)" rows={3} style={taStyle} />
      <button type="submit" disabled={saving} style={smallBtn}>{saving ? 'Saving...' : 'Create Version'}</button>
    </form>
  )
}

function ProposalsTab({ standardId, isCertifier }: { standardId: string; isCertifier: boolean }) {
  const [proposals, setProposals] = useState<Proposal[]>([])
  const [showNew, setShowNew] = useState(false)

  const load = () => api.listProposals(standardId).then(r => setProposals(r.proposals))
  useEffect(() => { load() }, [standardId])

  const updateStatus = async (id: string, status: 'INCORPORATED' | 'REJECTED') => {
    try { await api.updateProposal(id, { status }); load() } catch (err: any) { alert(err.message) }
  }

  return (
    <div>
      <button onClick={() => setShowNew(!showNew)} style={smallBtn}>+ Submit Proposal</button>
      {showNew && <NewProposalForm standardId={standardId} onDone={() => { setShowNew(false); load() }} />}
      {proposals.length === 0 && <p style={{ color: '#999' }}>No proposals yet.</p>}
      {proposals.map(p => (
        <div key={p.id} style={{ background: '#fff', padding: 14, borderRadius: 8, marginTop: 10, boxShadow: '0 1px 3px rgba(0,0,0,.05)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <strong style={{ fontSize: 14 }}>{p.title}</strong>
            <span style={{ fontSize: 12, color: p.status === 'OPEN' ? '#3498db' : p.status === 'INCORPORATED' ? '#27ae60' : '#e74c3c', fontWeight: 600 }}>{p.status}</span>
          </div>
          <p style={{ fontSize: 13, color: '#666', margin: '4px 0' }}>{p.description}</p>
          {p.diff && <pre style={preStyle}>{p.diff}</pre>}
          <div style={{ fontSize: 12, color: '#999', marginTop: 4 }}>
            by {p.author.name} &middot; {new Date(p.createdAt).toLocaleDateString()}
          </div>
          {isCertifier && p.status === 'OPEN' && (
            <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
              <button onClick={() => updateStatus(p.id, 'INCORPORATED')} style={{ ...smallBtn, background: '#27ae60' }}>Incorporate</button>
              <button onClick={() => updateStatus(p.id, 'REJECTED')} style={{ ...smallBtn, background: '#e74c3c' }}>Reject</button>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

function NewProposalForm({ standardId, onDone }: { standardId: string; onDone: () => void }) {
  const [saving, setSaving] = useState(false)
  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    setSaving(true)
    try {
      await api.submitProposal({
        standardId,
        title: (fd.get('title') as string).trim(),
        description: (fd.get('description') as string).trim(),
        diff: (fd.get('diff') as string).trim() || undefined,
      })
      onDone()
    } catch (err: any) { alert(err.message) }
    finally { setSaving(false) }
  }
  return (
    <form onSubmit={submit} style={{ background: '#fff', padding: 16, borderRadius: 8, marginTop: 10 }}>
      <h3 style={{ margin: '0 0 12px', fontSize: 15 }}>Submit Proposal</h3>
      <input name="title" placeholder="Proposal title" required style={{ width: '100%', padding: '8px 10px', border: '1px solid #ddd', borderRadius: 6, fontSize: 14, marginBottom: 10, boxSizing: 'border-box' }} />
      <textarea name="description" placeholder="Describe the proposed change" rows={3} required style={taStyle} />
      <textarea name="diff" placeholder="Diff / code snippet (optional)" rows={4} style={taStyle} />
      <button type="submit" disabled={saving} style={smallBtn}>{saving ? 'Submitting...' : 'Submit'}</button>
    </form>
  )
}

const smallBtn: React.CSSProperties = {
  background: '#774435', color: '#fff', border: 'none', padding: '6px 14px',
  borderRadius: 5, cursor: 'pointer', fontSize: 13,
}
const preStyle: React.CSSProperties = {
  background: '#f8f6f4', padding: 10, borderRadius: 6, fontSize: 12,
  overflow: 'auto', maxHeight: 200, fontFamily: 'monospace', whiteSpace: 'pre-wrap',
}
const taStyle: React.CSSProperties = {
  width: '100%', padding: '8px 10px', border: '1px solid #ddd', borderRadius: 6,
  fontSize: 13, fontFamily: 'monospace', marginBottom: 10, boxSizing: 'border-box', resize: 'vertical',
}
