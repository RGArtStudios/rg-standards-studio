import { Router } from 'express'
import { PrismaClient } from '@prisma/client'
import { requireAuth } from './auth'

const prisma = new PrismaClient()
export const complianceRouter = Router()

const APPS = ['verifiedpros','rgsaasops','rgas','groundwork','flowdesk','voltdesk','airdesk','vade']

// GET /api/compliance — matrix of app × standard compliance
complianceRouter.get('/', requireAuth, async (_req, res) => {
  try {
    const standards = await prisma.standard.findMany({
      where: { status: 'CERTIFIED' },
      select: {
        id: true, name: true, packageName: true,
        currentVersion: true, requiredBy: true,
        versions: {
          where: { certifiedAt: { not: null } },
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: { version: true, certifiedAt: true },
        },
      },
    })

    // Build compliance matrix
    const matrix = APPS.map(app => {
      const appStandards = standards.filter(s =>
        (s.requiredBy as string[]).includes(app)
      )
      const rows = appStandards.map(s => ({
        standardId:     s.id,
        standardName:   s.name,
        packageName:    s.packageName,
        certifiedVersion: s.currentVersion,
        certifiedAt:    s.versions[0]?.certifiedAt,
        required:       true,
        status:         s.currentVersion ? 'certified' : 'uncertified',
      }))
      const certified = rows.filter(r => r.status === 'certified').length
      return {
        app,
        total:     rows.length,
        certified,
        score:     rows.length ? Math.round((certified / rows.length) * 100) : 100,
        standards: rows,
      }
    })

    const totalStandards = standards.length
    const totalCertified = standards.filter(s => s.currentVersion).length

    res.json({
      summary: {
        totalStandards,
        totalCertified,
        platformScore: totalStandards ? Math.round((totalCertified / totalStandards) * 100) : 0,
        lastUpdated: new Date().toISOString(),
      },
      matrix,
    })
  } catch (err: any) {
    console.error('[compliance]', err)
    res.status(500).json({ error: err.message })
  }
})

// GET /api/compliance/:app — compliance for a single app
complianceRouter.get('/:app', requireAuth, async (req, res) => {
  try {
    const app = req.params.app
    if (!APPS.includes(app)) return res.status(404).json({ error: 'Unknown app' })
    const standards = await prisma.standard.findMany({
      where: {
        requiredBy: { has: app },
      },
      include: {
        versions: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    })
    res.json({ app, standards })
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})
