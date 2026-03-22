import { Router } from 'express'
import { PrismaClient } from '@prisma/client'
import { requireAuth, requireCertifier } from './auth'
import { openCertificationPR } from '../services/github'

const prisma = new PrismaClient()
export const certifyRouter = Router()

certifyRouter.post('/:versionId', requireAuth, requireCertifier, async (req, res) => {
  try {
    const version = await prisma.standardVersion.findUnique({
      where: { id: req.params.versionId }, include: { standard: true },
    })
    if (!version) return res.status(404).json({ error: 'Version not found' })
    if (version.certifiedAt) return res.status(409).json({ error: 'Already certified' })

    const missing: string[] = []
    if (!version.sourceCode?.trim())    missing.push('sourceCode')
    if (!version.visualSpec?.trim())    missing.push('visualSpec')
    if (!version.usageExamples?.trim()) missing.push('usageExamples')
    if (!version.testCases?.trim())     missing.push('testCases')
    if (missing.length) return res.status(400).json({ error: `Missing: ${missing.join(', ')}` })

    // Certify
    const certified = await prisma.standardVersion.update({
      where: { id: req.params.versionId },
      data:  { certifiedById: req.studioUser!.userId, certifiedAt: new Date() },
    })

    await prisma.standard.update({
      where: { id: version.standardId },
      data:  { status: 'CERTIFIED', currentVersion: version.version },
    })

    // Open GitHub PR
    let prUrl: string | null = null
    try {
      prUrl = await openCertificationPR({ standard: version.standard, version: certified, certifierEmail: req.studioUser!.email })
      await prisma.standardVersion.update({ where: { id: req.params.versionId }, data: { githubPrUrl: prUrl } })
    } catch (err) {
      console.error('[certify] PR failed:', err)
    }

    await prisma.auditLog.create({
      data: { userId: req.studioUser!.userId, action: 'VERSION_CERTIFIED', entity: 'StandardVersion', entityId: version.id, details: { version: version.version, prUrl } },
    })

    res.json({
      certified: true, version: version.version, prUrl,
      message: prUrl ? `${version.version} certified. PR: ${prUrl}` : `${version.version} certified. Create PR manually.`,
    })
  } catch (err) {
    console.error('[certify]', err)
    res.status(500).json({ error: 'Certification failed' })
  }
})

certifyRouter.post('/:versionId/pr-merged', requireAuth, requireCertifier, async (req, res) => {
  try {
    const version = await prisma.standardVersion.update({
      where: { id: req.params.versionId },
      data:  { githubPrMerged: true },
    })
    await prisma.auditLog.create({ data: { userId: req.studioUser!.userId, action: 'PR_MERGED', entity: 'StandardVersion', entityId: version.id, details: { version: version.version } } })
    res.json({ merged: true })
  } catch { res.status(500).json({ error: 'Failed' }) }
})
