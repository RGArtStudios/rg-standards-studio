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
  login:            (email: string, password: string) =>
    request<{ token: string; user: User }>('/api/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  me:               () => request<{ user: User }>('/api/auth/me'),
  listStandards:    () => request<{ standards: Standard[] }>('/api/standards'),
  getStandard:      (id: string) => request<{ standard: Standard }>(`/api/standards/${id}`),
  createStandard:   (data: CreateStandardInput) => request<{ standard: Standard }>('/api/standards', { method: 'POST', body: JSON.stringify(data) }),
  updateStandard:   (id: string, data: Partial<Standard>) => request<{ standard: Standard }>(`/api/standards/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  deprecate:        (id: string) => request<{ standard: Standard }>(`/api/standards/${id}/deprecate`, { method: 'POST' }),
  getVersion:       (id: string) => request<{ version: StandardVersion }>(`/api/versions/${id}`),
  createVersion:    (standardId: string, data: VersionInput) => request<{ version: StandardVersion }>(`/api/versions/standard/${standardId}`, { method: 'POST', body: JSON.stringify(data) }),
  updateVersion:    (id: string, data: Partial<VersionInput>) => request<{ version: StandardVersion }>(`/api/versions/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  certify:          (versionId: string) => request<{ certified: boolean; version: string; prUrl: string | null; message: string }>(`/api/certify/${versionId}`, { method: 'POST' }),
  markPrMerged:     (versionId: string) => request<{ merged: boolean }>(`/api/certify/${versionId}/pr-merged`, { method: 'POST' }),
  submitProposal:   (data: ProposalInput) => request<{ proposal: Proposal }>('/api/proposals', { method: 'POST', body: JSON.stringify(data) }),
  listProposals:    (standardId: string) => request<{ proposals: Proposal[] }>(`/api/proposals/standard/${standardId}`),
  updateProposal:   (id: string, data: { status: 'INCORPORATED' | 'REJECTED' }) =>
    request<{ proposal: Proposal }>(`/api/proposals/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  certifiedVersions: () => request<{ versions: Record<string, string> }>('/api/certified-versions'),
  auditLog:         (page = 1) => request<{ logs: AuditLog[]; total: number; pages: number }>(`/api/audit?page=${page}`),
}

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
  sourceCode: string; visualSpec: string | null; usageExamples: string | null; testCases: string | null
  githubPrUrl: string | null; githubPrMerged: boolean
  certifiedAt: string | null; certifiedBy?: { name: string; email: string }
  createdAt: string
}
export interface Proposal {
  id: string; standardId: string; title: string; description: string
  diff?: string; status: 'OPEN' | 'INCORPORATED' | 'REJECTED'
  resolvedAt: string | null; author: { name: string; email: string }; createdAt: string
}
export interface AuditLog {
  id: string; action: string; entity: string; entityId: string
  details: Record<string, unknown> | null; createdAt: string
  user?: { name: string; email: string }
}
export interface CreateStandardInput {
  name: string; packageName: string; description: string; requiredBy: string[]
  sourceCode: string; visualSpec: string; usageExamples: string; testCases: string
}
export interface VersionInput {
  sourceCode: string; visualSpec: string; usageExamples: string; testCases: string
}
export interface ProposalInput {
  standardId: string; title: string; description: string; diff?: string
}
