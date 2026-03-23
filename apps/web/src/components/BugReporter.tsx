'use client'
import { useState } from 'react'
const C = { primary: '#774435', border: '#E8C5B5', text: '#2C1810', muted: '#A0705A', surface: '#F9F0ED', error: '#DC2626', success: '#059669' }
const TYPES = [
  { value:'bug',         label:'Bug Report',          icon:'🐞' },
  { value:'enhancement', label:'Enhancement Request',  icon:'✨' },
  { value:'review',      label:'Review / Feedback',    icon:'⭐' },
]
export default function BugReporter() {
  const [open,    setOpen]    = useState(false)
  const [type,    setType]    = useState('bug')
  const [title,   setTitle]   = useState('')
  const [desc,    setDesc]    = useState('')
  const [sent,    setSent]    = useState(false)
  const [sending, setSending] = useState(false)
  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setSending(true)
    await new Promise(r => setTimeout(r, 800))
    setSent(true); setSending(false)
    setTimeout(() => { setSent(false); setTitle(''); setDesc(''); setOpen(false) }, 2000)
  }
  return (
    <>
      <button onClick={() => setOpen(o => !o)} title="Report a bug or request an enhancement"
        style={{ position:'fixed', bottom:'24px', right:'24px', width:'44px', height:'44px', borderRadius:'50%', background:'#DC2626', color:'white', border:'none', cursor:'pointer', fontSize:'20px', boxShadow:'0 4px 14px rgba(220,38,38,.35)', zIndex:999, display:'flex', alignItems:'center', justifyContent:'center' }}>
        🐞
      </button>
      {open && (
        <div style={{ position:'fixed', bottom:'78px', right:'24px', width:'360px', background:'white', border:`1px solid ${C.border}`, borderRadius:'14px', boxShadow:'0 8px 32px rgba(119,68,53,.18)', zIndex:1000, fontFamily:"'Inter',system-ui,sans-serif", overflow:'hidden' }}>
          <div style={{ padding:'14px 16px', background:C.primary, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <p style={{ margin:0, color:'white', fontWeight:700, fontSize:'14px' }}>🐞 Feedback</p>
            <button onClick={() => setOpen(false)} style={{ background:'none', border:'none', color:'rgba(255,255,255,.8)', cursor:'pointer', fontSize:'18px' }}>×</button>
          </div>
          {sent ? (
            <div style={{ padding:'32px', textAlign:'center' as const }}>
              <p style={{ fontSize:'32px', margin:'0 0 8px' }}>✓</p>
              <p style={{ margin:0, fontWeight:600, color:C.success }}>Submitted — thank you!</p>
            </div>
          ) : (
            <form onSubmit={submit} style={{ padding:'14px', display:'flex', flexDirection:'column' as const, gap:'10px' }}>
              <div style={{ display:'flex', gap:'6px' }}>
                {TYPES.map(t => (
                  <button key={t.value} type="button" onClick={() => setType(t.value)}
                    style={{ flex:1, padding:'7px 4px', borderRadius:'7px', border:`1.5px solid ${type===t.value?C.primary:C.border}`, background:type===t.value?C.surface:'white', cursor:'pointer', fontSize:'11px', fontWeight:600, color:type===t.value?C.primary:C.muted, fontFamily:'inherit' }}>
                    {t.icon} {t.label.split(' ')[0]}
                  </button>
                ))}
              </div>
              <input value={title} onChange={e => setTitle(e.target.value)} required placeholder="Brief title..."
                style={{ padding:'8px 10px', borderRadius:'7px', border:`1.5px solid ${C.border}`, fontSize:'13px', outline:'none', fontFamily:'inherit' }} />
              <textarea value={desc} onChange={e => setDesc(e.target.value)} required rows={4} placeholder="Describe the issue or request in detail..."
                style={{ padding:'8px 10px', borderRadius:'7px', border:`1.5px solid ${C.border}`, fontSize:'13px', outline:'none', resize:'vertical' as const, fontFamily:'inherit' }} />
              <button type="submit" disabled={sending}
                style={{ padding:'9px', background:C.primary, color:'white', border:'none', borderRadius:'7px', fontSize:'13px', fontWeight:700, cursor:'pointer', opacity:sending?0.7:1, fontFamily:'inherit' }}>
                {sending ? 'Submitting...' : 'Submit'}
              </button>
            </form>
          )}
        </div>
      )}
    </>
  )
}
