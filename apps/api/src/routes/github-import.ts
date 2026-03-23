import { Router } from 'express'
import { requireAuth } from './auth'

export const githubRouter = Router()

const OWNER = process.env.GITHUB_OWNER         ?? 'RGArtStudios'
const REPO  = process.env.GITHUB_PLATFORM_REPO ?? 'rg-platform'

async function githubGet(path: string) {
  const token = process.env.GITHUB_TOKEN
  const headers: Record<string, string> = {
    'Accept': 'application/vnd.github.v3+json',
    'User-Agent': 'rg-standards-studio',
  }
  if (token && token !== 'SKIP') headers['Authorization'] = `Bearer ${token}`
  const res = await fetch(`https://api.github.com/repos/${OWNER}/${REPO}/${path}`, { headers })
  if (!res.ok) throw new Error(`GitHub API ${res.status}: ${await res.text()}`)
  return res.json()
}

// GET /api/github/packages — list all @rg/* packages in rg-platform
githubRouter.get('/packages', requireAuth, async (_req, res) => {
  try {
    const contents = await githubGet('contents/packages')
    const packages = contents
      .filter((f: any) => f.type === 'dir')
      .map((f: any) => ({ name: `@rg/${f.name}`, path: f.path, slug: f.name }))
    res.json({ packages })
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

// GET /api/github/file/:package — get source of a package's index.ts
githubRouter.get('/file/:pkg', requireAuth, async (req, res) => {
  try {
    const slug = req.params.pkg.replace('@rg/', '')
    const filePath = `packages/${slug}/src/index.ts`
    const data = await githubGet(`contents/${filePath}`)
    if (!data.content) return res.status(404).json({ error: 'File not found' })
    const content = Buffer.from(data.content, 'base64').toString('utf-8')
    res.json({ content, path: filePath, sha: data.sha })
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

// GET /api/github/file-path?path=... — get any file by path
githubRouter.get('/file-path', requireAuth, async (req, res) => {
  try {
    const filePath = req.query.path as string
    if (!filePath) return res.status(400).json({ error: 'path required' })
    const data = await githubGet(`contents/${filePath}`)
    if (!data.content) return res.status(404).json({ error: 'File not found' })
    const content = Buffer.from(data.content, 'base64').toString('utf-8')
    res.json({ content, path: filePath, sha: data.sha })
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

// GET /api/github/status — check if GitHub token is configured
githubRouter.get('/status', requireAuth, async (_req, res) => {
  const token = process.env.GITHUB_TOKEN
  const configured = !!token && token !== 'SKIP'
  if (!configured) {
    res.json({ configured: false, message: 'GitHub token not set — PR generation disabled' })
    return
  }
  try {
    const repo = await githubGet('')
    res.json({ configured: true, repo: repo.full_name, defaultBranch: repo.default_branch })
  } catch (err: any) {
    res.status(500).json({ configured: false, error: err.message })
  }
})
