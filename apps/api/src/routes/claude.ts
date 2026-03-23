import { Router } from 'express'
import { PrismaClient } from '@prisma/client'
import { requireAuth } from './auth'

const prisma = new PrismaClient()
export const claudeRouter = Router()

const ANTHROPIC_API = 'https://api.anthropic.com/v1/messages'
const MODEL = 'claude-sonnet-4-20250514'

async function callClaude(system: string, messages: {role: string; content: string}[], maxTokens = 2000) {
  const key = process.env.ANTHROPIC_API_KEY
  if (!key) throw new Error('ANTHROPIC_API_KEY not set')
  const res = await fetch(ANTHROPIC_API, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-api-key': key, 'anthropic-version': '2023-06-01' },
    body: JSON.stringify({ model: MODEL, max_tokens: maxTokens, system, messages }),
  })
  if (!res.ok) throw new Error(`Anthropic API error: ${res.status} ${await res.text()}`)
  const data = await res.json()
  return data.content?.[0]?.text ?? ''
}

// Platform context injected into every Claude call
async function getPlatformContext(standardId?: string): Promise<string> {
  const standards = await prisma.standard.findMany({
    include: { versions: { orderBy: { createdAt: 'desc' }, take: 1 } },
  })
  const stdList = standards.map(s =>
    `- ${s.packageName} (${s.status}${s.currentVersion ? ' ' + s.currentVersion : ''}): ${s.description}`
  ).join('\n')

  let currentStd = ''
  if (standardId) {
    const s = await prisma.standard.findUnique({
      where: { id: standardId },
      include: { versions: { orderBy: { createdAt: 'desc' }, take: 3 } },
    })
    if (s) {
      const latest = s.versions[0]
      currentStd = `
CURRENT STANDARD BEING VIEWED:
Name: ${s.name}
Package: ${s.packageName}
Status: ${s.status} ${s.currentVersion ?? ''}
Description: ${s.description}
Required by: ${(s.requiredBy as string[]).join(', ')}
Latest version source code:
\`\`\`typescript
${latest?.sourceCode ?? '// No source yet'}
\`\`\`
Visual spec:
${latest?.visualSpec ?? '// No spec yet'}
Test cases:
${latest?.testCases ?? '// No tests yet'}
`
    }
  }

  return `You are the AI assistant embedded in the Rainier Gardens Standards Certification Studio.

The Rainier Gardens platform is a multi-app SaaS system. All apps share a set of certified @rg/* npm packages defined here as "standards". Every standard has: source code (TypeScript/React), a visual spec, usage examples, and test cases. Standards are versioned. Certifying a standard commits it to the rg-platform GitHub repo and enforces it across all apps via the rg-audit CI gate.

PLATFORM STANDARDS LIBRARY:
${stdList}

APPS THAT USE THESE STANDARDS:
- verifiedpros: VerifiedPros Directory — public business directory
- rgsaasops: Core SaaS operations platform
- rgas: Rainier Gardens Art Studio
- groundwork: Landscape/construction vertical
- flowdesk: Plumbing vertical
- voltdesk: Electrical vertical
- airdesk: HVAC vertical
- vade: VADE deployment and audit engine

${currentStd}

When generating TypeScript/React source code for standards:
- Use React.createElement (not JSX) for components that need to preview in sandboxed iframes
- Import from @rg/branding for all colors, typography, spacing
- Export named functions/classes (not default exports) for components
- Keep code clean, well-commented, and production-ready
- Follow the existing patterns from the standards library above`
}

// POST /api/claude/chat — conversational assistant with standard context
claudeRouter.post('/chat', requireAuth, async (req, res) => {
  try {
    const { messages, standardId } = req.body
    if (!messages?.length) return res.status(400).json({ error: 'messages required' })
    const system = await getPlatformContext(standardId)
    const reply = await callClaude(system, messages, 2000)
    res.json({ reply })
  } catch (err: any) {
    console.error('[claude/chat]', err)
    res.status(500).json({ error: err.message })
  }
})

// POST /api/claude/generate — plain English → full standard
claudeRouter.post('/generate', requireAuth, async (req, res) => {
  try {
    const { description, packageName, name, requiredBy } = req.body
    if (!description) return res.status(400).json({ error: 'description required' })
    const system = await getPlatformContext()
    const prompt = `Generate a complete Rainier Gardens platform standard based on this description:

Name: ${name ?? 'Unknown'}
Package: ${packageName ?? '@rg/unknown'}
Required by: ${(requiredBy ?? []).join(', ')}
Description: ${description}

Respond with a JSON object with exactly these fields:
{
  "sourceCode": "// complete TypeScript source",
  "visualSpec": "# Markdown visual specification",
  "usageExamples": "## Markdown usage examples with code blocks",
  "testCases": "- [ ] checklist of test cases"
}

Respond ONLY with the JSON object. No preamble, no markdown fences, no explanation.`

    const raw = await callClaude(system, [{ role: 'user', content: prompt }], 3000)
    const clean = raw.replace(/^```json\n?/, '').replace(/\n?```$/, '').trim()
    const result = JSON.parse(clean)
    res.json(result)
  } catch (err: any) {
    console.error('[claude/generate]', err)
    res.status(500).json({ error: err.message })
  }
})

// POST /api/claude/analyze — analyze uploaded file content, return intent + extracted fields
claudeRouter.post('/analyze', requireAuth, async (req, res) => {
  try {
    const { content, filename, standardId } = req.body
    if (!content) return res.status(400).json({ error: 'content required' })
    const system = await getPlatformContext(standardId)
    const prompt = `Analyze this file and determine how it relates to the Rainier Gardens standards platform.

Filename: ${filename ?? 'unknown'}
Content:
${content.slice(0, 8000)}${content.length > 8000 ? '\n... (truncated)' : ''}

Respond with a JSON object:
{
  "intent": "create_standard | update_source | update_spec | update_tests | reconcile | unknown",
  "suggestedName": "string or null",
  "suggestedPackage": "@rg/xxx or null",
  "suggestedDescription": "string or null",
  "extractedSourceCode": "TypeScript source if this is a .ts/.tsx file, else null",
  "extractedSpec": "Markdown spec if this is a .md file, else null",
  "summary": "2-3 sentence plain English summary of what this file is and what to do with it",
  "matchingStandardId": "id of existing standard this likely belongs to, or null",
  "requiredBy": ["app names this standard should apply to"]
}

Respond ONLY with the JSON object.`

    const raw = await callClaude(system, [{ role: 'user', content: prompt }], 1500)
    const clean = raw.replace(/^```json\n?/, '').replace(/\n?```$/, '').trim()
    const result = JSON.parse(clean)
    res.json(result)
  } catch (err: any) {
    console.error('[claude/analyze]', err)
    res.status(500).json({ error: err.message })
  }
})

// POST /api/claude/validate — cross-check source code against visual spec
claudeRouter.post('/validate', requireAuth, async (req, res) => {
  try {
    const { sourceCode, visualSpec, testCases, standardName } = req.body
    if (!sourceCode || !visualSpec) return res.status(400).json({ error: 'sourceCode and visualSpec required' })
    const system = await getPlatformContext()
    const prompt = `Validate this Rainier Gardens standard: does the source code correctly implement the visual specification?

Standard: ${standardName ?? 'Unknown'}

SOURCE CODE:
\`\`\`typescript
${sourceCode}
\`\`\`

VISUAL SPEC:
${visualSpec}

TEST CASES:
${testCases ?? 'None provided'}

Respond with a JSON object:
{
  "valid": true | false,
  "score": 0-100,
  "issues": ["list of specific problems found"],
  "suggestions": ["list of specific improvements"],
  "passedTests": ["test cases that appear to be satisfied"],
  "failedTests": ["test cases that appear to fail or be unverifiable"],
  "summary": "2-3 sentence overall assessment"
}

Respond ONLY with the JSON object.`

    const raw = await callClaude(system, [{ role: 'user', content: prompt }], 1500)
    const clean = raw.replace(/^```json\n?/, '').replace(/\n?```$/, '').trim()
    const result = JSON.parse(clean)
    res.json(result)
  } catch (err: any) {
    console.error('[claude/validate]', err)
    res.status(500).json({ error: err.message })
  }
})

// POST /api/claude/review — Claude reviews a standard and suggests improvements
claudeRouter.post('/review', requireAuth, async (req, res) => {
  try {
    const { standardId } = req.body
    if (!standardId) return res.status(400).json({ error: 'standardId required' })
    const system = await getPlatformContext(standardId)
    const prompt = `Review the current standard shown in the context above. Provide:
1. An assessment of the source code quality and completeness
2. Whether the visual spec is clear and actionable
3. Whether the test cases are sufficient
4. Specific improvement suggestions
5. Any missing pieces for production certification

Be specific, technical, and actionable. Format as markdown.`

    const review = await callClaude(system, [{ role: 'user', content: prompt }], 1500)
    res.json({ review })
  } catch (err: any) {
    console.error('[claude/review]', err)
    res.status(500).json({ error: err.message })
  }
})
