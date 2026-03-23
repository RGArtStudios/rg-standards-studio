'use client'
import { useState } from 'react'
const C = { primary: '#774435', border: '#E8C5B5', text: '#2C1810', muted: '#A0705A', surface: '#F9F0ED' }
export default function HelpWidget() {
  const [open, setOpen] = useState(false)
  const [q, setQ] = useState('')
  return (
    <>
      <button onClick={() => setOpen(o => !o)} title="Help (Cmd+?)"
        style={{ position:'fixed', bottom:'80px', right:'24px', width:'44px', height:'44px', borderRadius:'50%', background:C.primary, color:'white', border:'none', cursor:'pointer', fontSize:'18px', fontWeight:700, boxShadow:'0 4px 14px rgba(119,68,53,.35)', zIndex:999, display:'flex', alignItems:'center', justifyContent:'center' }}>
        ?
      </button>
      {open && (
        <div style={{ position:'fixed', bottom:'134px', right:'24px', width:'340px', background:'white', border:`1px solid ${C.border}`, borderRadius:'14px', boxShadow:'0 8px 32px rgba(119,68,53,.18)', zIndex:1000, fontFamily:"'Inter',system-ui,sans-serif", overflow:'hidden' }}>
          <div style={{ padding:'14px 16px', background:C.primary, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <p style={{ margin:0, color:'white', fontWeight:700, fontSize:'14px' }}>Help & Support</p>
            <button onClick={() => setOpen(false)} style={{ background:'none', border:'none', color:'rgba(255,255,255,.8)', cursor:'pointer', fontSize:'18px' }}>×</button>
          </div>
          <div style={{ padding:'14px' }}>
            <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search help articles..."
              style={{ width:'100%', padding:'8px 10px', borderRadius:'7px', border:`1.5px solid ${C.border}`, fontSize:'13px', outline:'none', marginBottom:'12px', boxSizing:'border-box' as const, fontFamily:'inherit' }} />
            {[
              { title:'Getting started guide', icon:'📖' },
              { title:'Managing contacts and CRM', icon:'👥' },
              { title:'Keyboard shortcuts', icon:'⌨' },
              { title:'Contact support', icon:'💬' },
            ].filter(a => !q || a.title.toLowerCase().includes(q.toLowerCase())).map(a => (
              <div key={a.title} style={{ display:'flex', alignItems:'center', gap:'10px', padding:'9px 10px', borderRadius:'8px', cursor:'pointer', marginBottom:'4px', background:C.surface }}>
                <span style={{ fontSize:'16px' }}>{a.icon}</span>
                <span style={{ fontSize:'13px', color:C.text }}>{a.title}</span>
              </div>
            ))}
          </div>
          <div style={{ padding:'10px 14px', borderTop:`1px solid ${C.border}`, background:C.surface }}>
            <p style={{ margin:0, fontSize:'11px', color:C.muted }}>Press Cmd+? to open help anytime</p>
          </div>
        </div>
      )}
    </>
  )
}
