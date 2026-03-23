'use client'
import { useState, useRef, useEffect } from 'react'
import { api, type ChatMessage } from '@/lib/api'

const C = { primary: '#774435', border: '#E8C5B5', text: '#2C1810', muted: '#A0705A', surface: '#F9F0ED' }

interface Props {
  standardId?: string
  standardName?: string
  onInsert?: (content: string, field: 'sourceCode' | 'visualSpec' | 'usageExamples' | 'testCases') => void
}

export default function ClaudeAssistant({ standardId, standardName, onInsert }: Props) {
  const [open,     setOpen]     = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input,    setInput]    = useState('')
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const send = async () => {
    const text = input.trim()
    if (!text || loading) return
    const next: ChatMessage[] = [...messages, { role: 'user', content: text }]
    setMessages(next)
    setInput('')
    setLoading(true)
    setError('')
    try {
      const { reply } = await api.claudeChat(next, standardId)
      setMessages([...next, { role: 'assistant', content: reply }])
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  const quickActions = [
    { label: 'Review this standard',   msg: 'Please review this standard and suggest improvements.' },
    { label: 'Explain what this does',  msg: 'Explain what this standard does and why it exists.' },
    { label: 'Write better tests',      msg: 'Write comprehensive test cases for this standard.' },
    { label: 'Improve the spec',        msg: 'Rewrite the visual spec to be clearer and more actionable.' },
    { label: 'Check for issues',        msg: 'Validate that the source code matches the visual spec and identify any gaps.' },
  ]

  // Parse assistant reply for insertable code blocks
  const extractInsertable = (content: string) => {
    const blocks: { lang: string; code: string }[] = []
    const regex = /```(\w*)\n([\s\S]*?)```/g
    let m
    while ((m = regex.exec(content)) !== null) {
      blocks.push({ lang: m[1], code: m[2].trim() })
    }
    return blocks
  }

  const fieldFromLang = (lang: string): 'sourceCode' | 'visualSpec' | 'usageExamples' | 'testCases' => {
    if (lang === 'typescript' || lang === 'tsx' || lang === 'ts') return 'sourceCode'
    if (lang === 'markdown' || lang === 'md') return 'visualSpec'
    return 'sourceCode'
  }

  if (!open) {
    return (
      <button onClick={() => setOpen(true)}
        style={{ position: 'fixed', bottom: '24px', right: '24px', width: '52px', height: '52px', borderRadius: '50%', background: C.primary, color: 'white', border: 'none', cursor: 'pointer', fontSize: '20px', boxShadow: '0 4px 16px rgba(119,68,53,.35)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        ✦
      </button>
    )
  }

  return (
    <div style={{ position: 'fixed', bottom: '20px', right: '20px', width: '400px', maxHeight: '600px', background: 'white', border: `1px solid ${C.border}`, borderRadius: '16px', boxShadow: '0 8px 32px rgba(119,68,53,.2)', zIndex: 1000, display: 'flex', flexDirection: 'column', fontFamily: "'Inter',system-ui,sans-serif" }}>

      {/* Header */}
      <div style={{ padding: '14px 16px', background: C.primary, borderRadius: '16px 16px 0 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <p style={{ margin: 0, color: 'white', fontWeight: 700, fontSize: '14px' }}>✦ Claude Assistant</p>
          {standardName && <p style={{ margin: 0, color: 'rgba(255,255,255,.7)', fontSize: '11px', marginTop: '1px' }}>{standardName}</p>}
        </div>
        <button onClick={() => setOpen(false)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,.8)', cursor: 'pointer', fontSize: '18px', lineHeight: 1 }}>×</button>
      </div>

      {/* Quick actions */}
      {messages.length === 0 && (
        <div style={{ padding: '12px', borderBottom: `1px solid ${C.border}` }}>
          <p style={{ margin: '0 0 8px', fontSize: '11px', color: C.muted, fontWeight: 600 }}>QUICK ACTIONS</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
            {quickActions.map(a => (
              <button key={a.label} onClick={() => { setInput(a.msg); setTimeout(()=>{ setInput(''); const m=[{role:'user' as const,content:a.msg}]; setMessages(m); setLoading(true); api.claudeChat(m,standardId).then(r=>{ setMessages([...m,{role:'assistant',content:r.reply}]) }).catch(e=>setError(e.message)).finally(()=>setLoading(false)) },0) }}
                style={{ fontSize: '11px', padding: '4px 10px', borderRadius: '99px', background: C.surface, border: `1px solid ${C.border}`, cursor: 'pointer', color: C.text }}>
                {a.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Messages */}
      <div style={{ flex: 1, overflow: 'auto', padding: '12px', minHeight: '200px', maxHeight: '380px' }}>
        {messages.map((m, i) => (
          <div key={i} style={{ marginBottom: '12px' }}>
            <p style={{ margin: '0 0 4px', fontSize: '10px', fontWeight: 700, color: m.role === 'user' ? C.primary : C.muted, textTransform: 'uppercase', letterSpacing: '.06em' }}>
              {m.role === 'user' ? 'You' : '✦ Claude'}
            </p>
            <div style={{ fontSize: '13px', lineHeight: 1.6, color: C.text, background: m.role === 'user' ? C.surface : 'white', padding: '10px 12px', borderRadius: '8px', border: `1px solid ${C.border}`, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
              {m.role === 'assistant' ? (
                <div>
                  {m.content.split(/(```[\w]*\n[\s\S]*?```)/g).map((part, pi) => {
                    if (part.startsWith('```')) {
                      const langMatch = part.match(/^```(\w*)/)
                      const lang = langMatch?.[1] ?? ''
                      const code = part.replace(/^```\w*\n/, '').replace(/\n```$/, '')
                      const field = fieldFromLang(lang)
                      return (
                        <div key={pi} style={{ marginTop: '6px' }}>
                          <pre style={{ background: '#1E1B4B', color: '#C4B5FD', padding: '10px', borderRadius: '6px', fontSize: '11px', overflow: 'auto', margin: '0 0 4px' }}>{code}</pre>
                          {onInsert && (
                            <button onClick={() => onInsert(code, field)}
                              style={{ fontSize: '11px', padding: '3px 10px', background: C.primary, color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>
                              Insert into {field === 'sourceCode' ? 'Source Code' : field === 'visualSpec' ? 'Visual Spec' : field}
                            </button>
                          )}
                        </div>
                      )
                    }
                    return <span key={pi}>{part}</span>
                  })}
                </div>
              ) : m.content}
            </div>
          </div>
        ))}
        {loading && (
          <div style={{ display: 'flex', gap: '4px', padding: '8px 12px' }}>
            {[0,1,2].map(i => <div key={i} style={{ width: '7px', height: '7px', borderRadius: '50%', background: C.muted, animation: `pulse 1.2s ${i*0.2}s infinite` }} />)}
          </div>
        )}
        {error && <p style={{ color: '#DC2626', fontSize: '12px', padding: '8px' }}>{error}</p>}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={{ padding: '10px 12px', borderTop: `1px solid ${C.border}`, display: 'flex', gap: '8px' }}>
        <textarea
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }}
          placeholder="Ask about this standard… (Enter to send)"
          rows={2}
          style={{ flex: 1, padding: '8px 10px', borderRadius: '7px', border: `1.5px solid ${C.border}`, fontSize: '13px', outline: 'none', resize: 'none', fontFamily: 'inherit', color: C.text, background: 'white' }}
        />
        <button onClick={send} disabled={loading || !input.trim()}
          style={{ padding: '8px 14px', background: C.primary, color: 'white', border: 'none', borderRadius: '7px', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.6 : 1, fontSize: '13px', fontWeight: 600, alignSelf: 'flex-end' }}>
          Send
        </button>
      </div>
      <style>{`@keyframes pulse{0%,100%{opacity:.3}50%{opacity:1}}`}</style>
    </div>
  )
}
