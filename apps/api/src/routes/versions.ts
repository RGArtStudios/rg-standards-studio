import { Router } from 'express'
import { PrismaClient } from '@prisma/client'
import { z } from 'zod'
import { requireAuth } from './auth'

const prisma = new PrismaClient()
export const versionsRouter = Router()

const VersionSchema = z.object({
  sourceCode:    z.string().min(1),
  visualSpec:    z.string().min(1),
  usageExamples: z.string().min(1),
  testCases:     z.string().min(1),
})

versionsRouter.get('/:versionId', requireAuth, async (req, res) => {
  try {
    const version = await prisma.standardVersion.findUnique({
      where:   { id: req.params.versionId },
      include: { standard: true, certifiedBy: { select: { name: true, email: true } } },
    })
    if (!version) return res.status(404).json({ error: 'Not found' })
    res.json({ version })
  } catch { res.status(500).json({ error: 'Failed' }) }
})

versionsRouter.post('/standard/:standardId', requireAuth, async (req, res) => {
  try {
    const data = VersionSchema.parse(req.body)
    const latest = await prisma.standardVersion.findFirst({
      where: { standardId: req.params.standardId }, orderBy: { createdAt: 'desc' },
    })
    const nextVersion = latest ? `v${parseInt(latest.version.replace('v','')) + 1}` : 'v1'
    const version = await prisma.standardVersion.create({
      data: { standardId: req.params.standardId, version: nextVersion, ...data },
    })
    await prisma.auditLog.create({ data: { userId: req.studioUser!.userId, action: 'VERSION_CREATED', entity: 'StandardVersion', entityId: version.id, details: { version: nextVersion } } })
    res.status(201).json({ version })
  } catch (err) {
    if (err instanceof z.ZodError) return res.status(400).json({ error: err.errors })
    res.status(500).json({ error: 'Failed' })
  }
})

versionsRouter.patch('/:versionId', requireAuth, async (req, res) => {
  try {
    const version = await prisma.standardVersion.findUnique({ where: { id: req.params.versionId } })
    if (!version) return res.status(404).json({ error: 'Not found' })
    if (version.certifiedAt) return res.status(409).json({ error: 'Only uncertified versions can be edited' })
    const ALLOWED = ['sourceCode','visualSpec','usageExamples','testCases']
    const data: Record<string, unknown> = {}
    for (const key of ALLOWED) { if (key in req.body) data[key] = req.body[key] }
    const updated = await prisma.standardVersion.update({ where: { id: req.params.versionId }, data })
    res.json({ version: updated })
  } catch { res.status(500).json({ error: 'Update failed' }) }
})
