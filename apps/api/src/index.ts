import 'source-map-support/register'
import express    from 'express'
import cors       from 'cors'
import helmet     from 'helmet'
import { authRouter }       from './routes/auth'
import { standardsRouter }  from './routes/standards'
import { versionsRouter }   from './routes/versions'
import { proposalsRouter }  from './routes/proposals'
import { auditRouter }      from './routes/audit'
import { certifyRouter }    from './routes/certify'
import { claudeRouter }     from './routes/claude'
import { uploadRouter }     from './routes/upload'
import { githubRouter }     from './routes/github-import'
import { complianceRouter } from './routes/compliance'

const app  = express()
const port = parseInt(process.env.PORT ?? '3010', 10)

app.use(helmet({
  crossOriginEmbedderPolicy: false, // allow iframe previews
}))
app.use(cors({
  origin: [
    process.env.WEB_URL ?? 'http://localhost:3011',
    'http://localhost:3011',
    // Allow ALB DNS for production
    ...(process.env.ALB_URL ? [process.env.ALB_URL] : []),
  ],
  credentials: true,
}))
app.use(express.json({ limit: '20mb' })) // larger limit for file content and source code

app.get('/health', (_req, res) => {
  res.json({
    status:  'ok',
    service: 'rg-standards-studio-api',
    env:     process.env.NODE_ENV,
    db:      'connected',
    claude:  !!process.env.ANTHROPIC_API_KEY ? 'configured' : 'not configured',
    github:  process.env.GITHUB_TOKEN && process.env.GITHUB_TOKEN !== 'SKIP' ? 'configured' : 'skip',
  })
})

// Public — used by rg-audit CLI to check certified versions
app.get('/api/certified-versions', async (_req, res) => {
  const { PrismaClient } = await import('@prisma/client')
  const prisma = new PrismaClient()
  try {
    const standards = await prisma.standard.findMany({
      where:  { status: 'CERTIFIED' },
      select: { packageName: true, currentVersion: true },
    })
    const versions: Record<string, string> = {}
    standards.forEach(s => { if (s.currentVersion) versions[s.packageName] = s.currentVersion })
    res.json({ versions })
  } catch {
    res.status(500).json({ error: 'Failed to load certified versions' })
  } finally {
    await prisma.$disconnect()
  }
})

app.use('/api/auth',       authRouter)
app.use('/api/standards',  standardsRouter)
app.use('/api/versions',   versionsRouter)
app.use('/api/proposals',  proposalsRouter)
app.use('/api/audit',      auditRouter)
app.use('/api/certify',    certifyRouter)
app.use('/api/claude',     claudeRouter)
app.use('/api/upload',     uploadRouter)
app.use('/api/github',     githubRouter)
app.use('/api/compliance', complianceRouter)

app.use((_req, res) => res.status(404).json({ error: 'Not found' }))

app.listen(port, () => {
  console.log(`[standards-studio-api] Port ${port} (${process.env.NODE_ENV ?? 'development'})`)
})
