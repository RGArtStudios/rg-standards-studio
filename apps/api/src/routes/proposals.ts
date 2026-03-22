import { Router } from 'express'
import { PrismaClient } from '@prisma/client'
import { z } from 'zod'
import { requireAuth, requireCertifier } from './auth'

const prisma = new PrismaClient()
export const proposalsRouter = Router()

const Schema = z.object({
  standardId:  z.string(),
  title:       z.string().min(5).max(200),
  description: z.string().min(20),
  diff:        z.string().optional(),
})

proposalsRouter.post('/', requireAuth, async (req, res) => {
  try {
    const data = Schema.parse(req.body)
    const standard = await prisma.standard.findUnique({ where: { id: data.standardId } })
    if (!standard) return res.status(404).json({ error: 'Standard not found' })
    if (standard.status === 'DEPRECATED') return res.status(409).json({ error: 'Cannot propose on deprecated standard' })
    const proposal = await prisma.proposal.create({
      data: { standardId: data.standardId, title: data.title, description: data.description, diff: data.diff, authorId: req.studioUser!.userId, status: 'OPEN' },
      include: { author: { select: { name: true, email: true } } },
    })
    await prisma.auditLog.create({ data: { userId: req.studioUser!.userId, action: 'PROPOSAL_SUBMITTED', entity: 'Proposal', entityId: proposal.id, details: { title: data.title } } })
    res.status(201).json({ proposal })
  } catch (err) {
    if (err instanceof z.ZodError) return res.status(400).json({ error: err.errors })
    res.status(500).json({ error: 'Failed' })
  }
})

proposalsRouter.get('/standard/:standardId', requireAuth, async (req, res) => {
  try {
    const proposals = await prisma.proposal.findMany({
      where:   { standardId: req.params.standardId },
      include: { author: { select: { name: true, email: true } } },
      orderBy: { createdAt: 'desc' },
    })
    res.json({ proposals })
  } catch { res.status(500).json({ error: 'Failed' }) }
})

proposalsRouter.patch('/:id', requireAuth, requireCertifier, async (req, res) => {
  try {
    const { status } = req.body
    if (!['INCORPORATED','REJECTED'].includes(status)) return res.status(400).json({ error: 'Invalid status' })
    const proposal = await prisma.proposal.update({
      where: { id: req.params.id },
      data:  { status, resolvedAt: new Date() },
    })
    await prisma.auditLog.create({ data: { userId: req.studioUser!.userId, action: `PROPOSAL_${status}`, entity: 'Proposal', entityId: proposal.id } })
    res.json({ proposal })
  } catch { res.status(500).json({ error: 'Failed' }) }
})
