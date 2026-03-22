import { Router } from 'express'
import { PrismaClient } from '@prisma/client'
import { requireAuth, requireAdmin } from './auth'

const prisma = new PrismaClient()
export const auditRouter = Router()

auditRouter.get('/', requireAuth, requireAdmin, async (req, res) => {
  try {
    const page  = parseInt(String(req.query.page ?? '1'))
    const limit = 50
    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        skip: (page - 1) * limit, take: limit,
        include: { user: { select: { name: true, email: true } } },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.auditLog.count(),
    ])
    res.json({ logs, total, page, pages: Math.ceil(total / limit) })
  } catch { res.status(500).json({ error: 'Failed' }) }
})
