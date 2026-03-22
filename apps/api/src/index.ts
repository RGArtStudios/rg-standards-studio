import 'source-map-support/register'
import express from 'express'
import cors    from 'cors'
import helmet  from 'helmet'
import { authRouter }      from './routes/auth'
import { standardsRouter } from './routes/standards'
import { versionsRouter }  from './routes/versions'
import { proposalsRouter } from './routes/proposals'
import { auditRouter }     from './routes/audit'
import { certifyRouter }   from './routes/certify'

const app  = express()
const port = parseInt(process.env.PORT ?? '3010', 10)

app.use(helmet())
app.use(cors({
  origin:      [process.env.WEB_URL ?? 'http://localhost:3011', 'http://localhost:3011'],
  credentials: true,
}))
app.use(express.json({ limit: '2mb' }))

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'rg-standards-studio-api', env: process.env.NODE_ENV })
})

// Public — consumed by rg-audit CLI in every app's CI pipeline
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

app.use('/api/auth',      authRouter)
app.use('/api/standards', standardsRouter)
app.use('/api/versions',  versionsRouter)
app.use('/api/proposals', proposalsRouter)
app.use('/api/audit',     auditRouter)
app.use('/api/certify',   certifyRouter)

app.use((_req, res) => res.status(404).json({ error: 'Not found' }))

app.listen(port, () => {
  console.log(`[standards-studio-api] Port ${port} (${process.env.NODE_ENV ?? 'development'})`)
})
