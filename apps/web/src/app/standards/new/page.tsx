'use client'
import { useState, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { api } from '../../../lib/api'

export default function NewStandardPage() {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    const val = (k: string) => (fd.get(k) as string).trim()
    setSaving(true)
    setError('')
    try {
      const { standard } = await api.createStandard({
        name: val('name'),
        packageName: val('packageName'),
        description: val('description'),
        requiredBy: val('requiredBy').split(',').map(s => s.trim()).filter(Boolean),
        sourceCode: val('sourceCode'),
        visualSpec: val('visualSpec'),
        usageExamples: val('usageExamples'),
        testCases: val('testCases'),
      })
      router.push(`/standards/${standard.id}`)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={{ maxWidth: 700 }}>
      <h1 style={{ fontSize: 22, marginBottom: 20 }}>Create New Standard</h1>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <Field label="Standard Name" name="name" placeholder="e.g. Branding" required />
        <Field label="Package Name" name="packageName" placeholder="e.g. @rg/branding" required />
        <Field label="Description" name="description" placeholder="What this standard defines" required />
        <Field label="Required By (comma-separated)" name="requiredBy" placeholder="@rg/ui, @rg/analytics" />
        <TextArea label="Source Code" name="sourceCode" placeholder="TypeScript source for the canonical implementation" rows={8} required />
        <TextArea label="Visual Spec" name="visualSpec" placeholder="Design tokens, layout rules, etc." rows={4} />
        <TextArea label="Usage Examples" name="usageExamples" placeholder="How to import and use this standard" rows={4} />
        <TextArea label="Test Cases" name="testCases" placeholder="Vitest test code" rows={4} />
        {error && <p style={{ color: '#c0392b', fontSize: 13, margin: 0 }}>{error}</p>}
        <button type="submit" disabled={saving} style={{
          background: '#774435', color: '#fff', border: 'none', padding: '10px 20px',
          borderRadius: 6, cursor: 'pointer', fontSize: 15, alignSelf: 'flex-start',
          opacity: saving ? 0.6 : 1,
        }}>{saving ? 'Creating...' : 'Create Standard'}</button>
      </form>
    </div>
  )
}

function Field({ label, name, placeholder, required }: { label: string; name: string; placeholder?: string; required?: boolean }) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 4 }}>{label}</label>
      <input name={name} placeholder={placeholder} required={required} style={{
        width: '100%', padding: '8px 10px', border: '1px solid #ddd', borderRadius: 6, fontSize: 14, boxSizing: 'border-box',
      }} />
    </div>
  )
}

function TextArea({ label, name, placeholder, rows, required }: { label: string; name: string; placeholder?: string; rows?: number; required?: boolean }) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 4 }}>{label}</label>
      <textarea name={name} placeholder={placeholder} rows={rows ?? 4} required={required} style={{
        width: '100%', padding: '8px 10px', border: '1px solid #ddd', borderRadius: 6, fontSize: 13,
        fontFamily: 'monospace', boxSizing: 'border-box', resize: 'vertical',
      }} />
    </div>
  )
}
