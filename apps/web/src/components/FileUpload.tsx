'use client'
import { useState, useCallback, useRef } from 'react'
import { api, type AnalysisResult } from '@/lib/api'

const C = { primary: '#774435', border: '#E8C5B5', text: '#2C1810', muted: '#A0705A', surface: '#F9F0ED', success: '#059669', error: '#DC2626' }

interface Props {
  standardId?: string
  onAnalyzed?: (result: AnalysisResult, content: string, filename: string) => void
  onSourceExtracted?: (source: string) => void
  onSpecExtracted?: (spec: string) => void
}

export default function FileUpload({ standardId, onAnalyzed, onSourceExtracted, onSpecExtracted }: Props) {
  const [dragging,  setDragging]  = useState(false)
  const [uploading, setUploading] = useState(false)
  const [analyzing, setAnalyzing] = useState(false)
  const [result,    setResult]    = useState<AnalysisResult | null>(null)
  const [filename,  setFilename]  = useState('')
  const [content,   setContent]   = useState('')
  const [error,     setError]     = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const processFile = useCallback(async (file: File) => {
    setError(''); setResult(null); setUploading(true); setFilename(file.name)
    try {
      const uploaded = await api.uploadFile(file, standardId)
      const fileContent = uploaded.content ?? ''
      setContent(fileContent)
      setUploading(false); setAnalyzing(true)
      const analysis = await api.claudeAnalyze(fileContent, file.name, standardId)
      setResult(analysis)
      onAnalyzed?.(analysis, fileContent, file.name)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setUploading(false); setAnalyzing(false)
    }
  }, [standardId, onAnalyzed])

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) processFile(file)
  }, [processFile])

  const onPick = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) processFile(file)
  }, [processFile])

  const INTENT_LABELS: Record<string, string> = {
    create_standard: '+ Create new standard from this file',
    update_source:   '↑ Replace source code with this file',
    update_spec:     '↑ Replace visual spec with this file',
    update_tests:    '↑ Replace test cases with this file',
    reconcile:       '⟳ Reconcile with existing standards',
    unknown:         '? Unknown — review manually',
  }

  return (
    <div>
      {/* Drop zone */}
      <div
        onDragOver={e => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
        style={{ border: `2px dashed ${dragging ? C.primary : C.border}`, borderRadius: '10px', padding: '24px', textAlign: 'center', cursor: 'pointer', background: dragging ? C.surface : 'white', transition: 'all .15s' }}>
        <input ref={inputRef} type="file" onChange={onPick} style={{ display: 'none' }}
          accept=".ts,.tsx,.md,.txt,.json,.js,.jsx,.docx" />
        <p style={{ fontSize: '28px', margin: '0 0 6px' }}>{uploading || analyzing ? '⏳' : '📄'}</p>
        <p style={{ margin: '0 0 4px', fontSize: '13px', fontWeight: 600, color: C.text }}>
          {uploading ? 'Uploading...' : analyzing ? 'Claude is analyzing...' : 'Drop a file or click to browse'}
        </p>
        <p style={{ margin: 0, fontSize: '11px', color: C.muted }}>
          .ts .tsx .md .txt .json .docx — Claude will analyze and suggest what to do with it
        </p>
      </div>

      {error && <p style={{ margin: '8px 0 0', fontSize: '12px', color: C.error, background: '#FEF2F2', padding: '8px 12px', borderRadius: '7px' }}>{error}</p>}

      {/* Analysis result */}
      {result && (
        <div style={{ marginTop: '14px', padding: '16px', background: C.surface, border: `1px solid ${C.border}`, borderRadius: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', marginBottom: '10px' }}>
            <div style={{ flex: 1 }}>
              <p style={{ margin: '0 0 3px', fontSize: '13px', fontWeight: 700, color: C.text }}>{filename}</p>
              <p style={{ margin: 0, fontSize: '12px', color: C.muted }}>{result.summary}</p>
            </div>
            <span style={{ fontSize: '11px', fontWeight: 700, padding: '3px 9px', borderRadius: '99px', background: 'rgba(5,150,105,.12)', color: C.success, flexShrink: 0 }}>
              {INTENT_LABELS[result.intent] ?? result.intent}
            </span>
          </div>

          {(result.suggestedName || result.suggestedPackage) && (
            <div style={{ fontSize: '12px', color: C.text, marginBottom: '10px', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              {result.suggestedName    && <span><b>Name:</b> {result.suggestedName}</span>}
              {result.suggestedPackage && <span><b>Package:</b> <code style={{ background: 'white', padding: '1px 5px', borderRadius: '3px', fontSize: '11px' }}>{result.suggestedPackage}</code></span>}
            </div>
          )}

          {/* Action buttons */}
          <div style={{ display: 'flex', gap: '7px', flexWrap: 'wrap' }}>
            {result.extractedSourceCode && onSourceExtracted && (
              <button onClick={() => onSourceExtracted(result.extractedSourceCode!)}
                style={{ padding: '6px 14px', background: C.primary, color: 'white', border: 'none', borderRadius: '7px', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>
                Use as Source Code
              </button>
            )}
            {result.extractedSpec && onSpecExtracted && (
              <button onClick={() => onSpecExtracted(result.extractedSpec!)}
                style={{ padding: '6px 14px', background: C.primary, color: 'white', border: 'none', borderRadius: '7px', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>
                Use as Visual Spec
              </button>
            )}
            {content && onSourceExtracted && !result.extractedSourceCode && (
              <button onClick={() => onSourceExtracted(content)}
                style={{ padding: '6px 14px', background: 'white', color: C.primary, border: `1.5px solid ${C.primary}`, borderRadius: '7px', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>
                Use Raw Content as Source
              </button>
            )}
            <button onClick={() => { setResult(null); setFilename(''); setContent('') }}
              style={{ padding: '6px 14px', background: 'white', color: C.muted, border: `1px solid ${C.border}`, borderRadius: '7px', fontSize: '12px', cursor: 'pointer' }}>
              Clear
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
