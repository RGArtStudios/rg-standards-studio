const API = () => process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3010'

function getToken(): string | null {
  if (typeof localStorage === 'undefined') return null
  return localStorage.getItem('studio_token')
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken()
  const res = await fetch(`${API()}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: `HTTP ${res.status}` }))
    throw new Error(err.error ?? `Request failed: ${res.status}`)
  }
  return res.json()
}

export const api = {
  // Auth
  login:             (email: string, password: string) =>
    request<{ token: string; user: User }>('/api/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  me:                () => request<{ user: User }>('/api/auth/me'),

  // Standards
  listStandards:     () => request<{ standards: Standard[] }>('/api/standards'),
  getStandard:       (id: string) => request<{ standard: Standard }>(`/api/standards/${id}`),
  createStandard:    (data: CreateStandardInput) => request<{ standard: Standard }>('/api/standards', { method: 'POST', body: JSON.stringify(data) }),
  updateStandard:    (id: string, data: Partial<Standard>) => request<{ standard: Standard }>(`/api/standards/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  deprecate:         (id: string) => request<{ standard: Standard }>(`/api/standards/${id}/deprecate`, { method: 'POST' }),

  // Versions
  getVersion:        (id: string) => request<{ version: StandardVersion }>(`/api/versions/${id}`),
  createVersion:     (standardId: string, data: VersionInput) =>
    request<{ version: StandardVersion }>(`/api/versions/standard/${standardId}`, { method: 'POST', body: JSON.stringify(data) }),
  updateVersion:     (id: string, data: Partial<VersionInput>) =>
    request<{ version: StandardVersion }>(`/api/versions/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),

  // Certify
  certify:           (versionId: string) =>
    request<{ certified: boolean; version: string; prUrl: string | null; message: string }>(`/api/certify/${versionId}`, { method: 'POST' }),
  markPrMerged:      (versionId: string) =>
    request<{ merged: boolean }>(`/api/certify/${versionId}/pr-merged`, { method: 'POST' }),

  // Proposals
  submitProposal:    (data: ProposalInput) => request<{ proposal: Proposal }>('/api/proposals', { method: 'POST', body: JSON.stringify(data) }),
  listProposals:     (standardId: string) => request<{ proposals: Proposal[] }>(`/api/proposals/standard/${standardId}`),
  updateProposal:    (id: string, data: { status: 'INCORPORATED' | 'REJECTED'; rejectionNote?: string }) =>
    request<{ proposal: Proposal }>(`/api/proposals/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),

  // Certified versions (public)
  certifiedVersions: () => request<{ versions: Record<string, string> }>('/api/certified-versions'),

  // Audit log
  auditLog:          (page = 1) => request<{ logs: AuditLog[]; total: number; pages: number }>(`/api/audit?page=${page}`),

  // Claude AI
  claudeChat:        (messages: ChatMessage[], standardId?: string) =>
    request<{ reply: string }>('/api/claude/chat', { method: 'POST', body: JSON.stringify({ messages, standardId }) }),
  claudeGenerate:    (data: { description: string; name: string; packageName: string; requiredBy: string[] }) =>
    request<GeneratedStandard>('/api/claude/generate', { method: 'POST', body: JSON.stringify(data) }),
  claudeAnalyze:     (content: string, filename: string, standardId?: string) =>
    request<AnalysisResult>('/api/claude/analyze', { method: 'POST', body: JSON.stringify({ content, filename, standardId }) }),
  claudeValidate:    (data: { sourceCode: string; visualSpec: string; testCases?: string; standardName?: string }) =>
    request<ValidationResult>('/api/claude/validate', { method: 'POST', body: JSON.stringify(data) }),
  claudeReview:      (standardId: string) =>
    request<{ review: string }>('/api/claude/review', { method: 'POST', body: JSON.stringify({ standardId }) }),

  // File upload
  uploadFile:        async (file: File, standardId?: string) => {
    const token = getToken()
    const form = new FormData()
    form.append('file', file)
    if (standardId) form.append('standardId', standardId)
    const res = await fetch(`${API()}/api/upload`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: form,
    })
    if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.error ?? 'Upload failed') }
    return res.json() as Promise<UploadedFile>
  },
  listUploads:       (standardId: string) => request<{ files: UploadedFile[] }>(`/api/upload/standard/${standardId}`),
  deleteUpload:      (id: string) => request<{ deleted: boolean }>(`/api/upload/${id}`, { method: 'DELETE' }),

  // GitHub import
  githubPackages:    () => request<{ packages: GithubPackage[] }>('/api/github/packages'),
  githubFile:        (pkg: string) => request<{ content: string; path: string }>(`/api/github/file/${encodeURIComponent(pkg)}`),
  githubStatus:      () => request<{ configured: boolean; repo?: string }>('/api/github/status'),

  // Compliance dashboard
  compliance:        () => request<ComplianceResult>('/api/compliance'),
}

// ── Types ─────────────────────────────────────────────────────────────────────

export type UserRole = 'PROPOSER' | 'CERTIFIER' | 'ADMIN'
export interface User { id: string; email: string; name: string; role: UserRole }
export interface Standard {
  id: string; name: string; packageName: string; description: string
  requiredBy: string[]; currentVersion: string | null
  status: 'DRAFT' | 'CERTIFIED' | 'DEPRECATED'
  createdAt: string; updatedAt: string
  versions?: StandardVersion[]; proposals?: Proposal[]
  _count?: { proposals: number }
}
export interface StandardVersion {
  id: string; standardId: string; version: string
  status: 'DRAFT' | 'CERTIFIED' | 'DEPRECATED'
  sourceCode: string; visualSpec: string; usageExamples: string; testCases: string
  changelog?: string; prUrl?: string; prMerged: boolean
  certifiedAt?: string; certifiedBy?: { name: string; email: string }
  createdAt: string; updatedAt: string
}
export interface Proposal {
  id: string; standardId: string; title: string; description: string
  sourceCodeDraft?: string; status: 'OPEN' | 'INCORPORATED' | 'REJECTED'
  rejectionNote?: string; proposedBy: { name: string; email: string }; createdAt: string
}
export interface AuditLog {
  id: string; action: string; createdAt: string
  standard?: { name: string }; user?: { name: string; email: string }
}
export interface ChatMessage { role: 'user' | 'assistant'; content: string }
export interface GeneratedStandard { sourceCode: string; visualSpec: string; usageExamples: string; testCases: string }
export interface AnalysisResult {
  intent: string; suggestedName: string | null; suggestedPackage: string | null
  suggestedDescription: string | null; extractedSourceCode: string | null
  extractedSpec: string | null; summary: string
  matchingStandardId: string | null; requiredBy: string[]
}
export interface ValidationResult {
  valid: boolean; score: number; issues: string[]; suggestions: string[]
  passedTests: string[]; failedTests: string[]; summary: string
}
export interface UploadedFile { id: string; filename: string; sizeBytes: number; mimeType: string; content?: string; createdAt: string }
export interface GithubPackage { name: string; path: string; slug: string }
export interface ComplianceResult {
  summary: { totalStandards: number; totalCertified: number; platformScore: number; lastUpdated: string }
  matrix: Array<{ app: string; total: number; certified: number; score: number; standards: any[] }>
}
export interface CreateStandardInput {
  name: string; packageName: string; description: string; requiredBy: string[]
  sourceCode: string; visualSpec: string; usageExamples: string; testCases: string
}
export interface VersionInput {
  sourceCode: string; visualSpec: string; usageExamples: string; testCases: string; changelog?: string
}
export interface ProposalInput {
  standardId: string; title: string; description: string
  sourceCodeDraft?: string; visualSpecDraft?: string
}
