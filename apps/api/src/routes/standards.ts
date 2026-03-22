import { Router } from 'express'
import { PrismaClient } from '@prisma/client'
import { z } from 'zod'
import { requireAuth, requireAdmin } from './auth'

const prisma = new PrismaClient()
export const standardsRouter = Router()

const CreateSchema = z.object({
  name:          z.string().min(2).max(100),
  packageName:   z.string().regex(/^@rg\/[a-z-]+$/),
  description:   z.string().min(10),
  requiredBy:    z.array(z.string()).default([]),
  sourceCode:    z.string().min(1),
  visualSpec:    z.string().min(1),
  usageExamples: z.string().min(1),
  testCases:     z.string().min(1),
})

standardsRouter.get('/', requireAuth, async (_req, res) => {
  try {
    const standards = await prisma.standard.findMany({
      include: {
        versions:  { orderBy: { createdAt: 'desc' }, take: 1, select: { version: true, certifiedAt: true } },
        _count:    { select: { proposals: true } },
      },
      orderBy: { name: 'asc' },
    })
    res.json({ standards })
  } catch { res.status(500).json({ error: 'Failed to load standards' }) }
})

standardsRouter.get('/:id', requireAuth, async (req, res) => {
  try {
    const standard = await prisma.standard.findUnique({
      where:   { id: req.params.id },
      include: {
        versions:  { orderBy: { createdAt: 'desc' } },
        proposals: { where: { status: 'OPEN' }, include: { author: { select: { name: true, email: true } } }, orderBy: { createdAt: 'desc' } },
      },
    })
    if (!standard) return res.status(404).json({ error: 'Not found' })
    res.json({ standard })
  } catch { res.status(500).json({ error: 'Failed' }) }
})

standardsRouter.post('/', requireAuth, async (req, res) => {
  try {
    const data = CreateSchema.parse(req.body)
    const existing = await prisma.standard.findUnique({ where: { packageName: data.packageName } })
    if (existing) return res.status(409).json({ error: `${data.packageName} already exists` })
    const standard = await prisma.standard.create({
      data: {
        name: data.name, packageName: data.packageName,
        description: data.description, requiredBy: data.requiredBy,
        status: 'DRAFT',
        versions: {
          create: {
            version: 'v1',
            sourceCode: data.sourceCode, visualSpec: data.visualSpec,
            usageExamples: data.usageExamples, testCases: data.testCases,
          },
        },
      },
      include: { versions: true },
    })
    await prisma.auditLog.create({ data: { userId: req.studioUser!.userId, action: 'STANDARD_CREATED', entity: 'Standard', entityId: standard.id, details: { name: data.name } } })
    res.status(201).json({ standard })
  } catch (err) {
    if (err instanceof z.ZodError) return res.status(400).json({ error: err.errors })
    res.status(500).json({ error: 'Failed to create' })
  }
})

standardsRouter.patch('/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    const allowed = ['name', 'description', 'requiredBy']
    const data: Record<string, unknown> = {}
    for (const key of allowed) { if (key in req.body) data[key] = req.body[key] }
    const standard = await prisma.standard.update({ where: { id: req.params.id }, data })
    res.json({ standard })
  } catch { res.status(500).json({ error: 'Update failed' }) }
})

standardsRouter.post('/:id/deprecate', requireAuth, requireAdmin, async (req, res) => {
  try {
    const standard = await prisma.standard.update({ where: { id: req.params.id }, data: { status: 'DEPRECATED' } })
    await prisma.auditLog.create({ data: { userId: req.studioUser!.userId, action: 'STANDARD_DEPRECATED', entity: 'Standard', entityId: standard.id } })
    res.json({ standard })
  } catch { res.status(500).json({ error: 'Failed' }) }
})
