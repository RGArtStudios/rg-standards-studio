import { Router, Request, Response, NextFunction } from 'express'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import jwt    from 'jsonwebtoken'

const prisma = new PrismaClient()
const secret = () => process.env.JWT_SECRET ?? 'dev-secret'

export interface StudioUser {
  userId: string
  email:  string
  role:   'PROPOSER' | 'CERTIFIER' | 'ADMIN'
}

declare global {
  namespace Express {
    interface Request { studioUser?: StudioUser }
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization
  if (!header?.startsWith('Bearer ')) return res.status(401).json({ error: 'Authentication required' })
  try {
    req.studioUser = jwt.verify(header.slice(7), secret()) as StudioUser
    next()
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' })
  }
}

export function requireCertifier(req: Request, res: Response, next: NextFunction) {
  if (!req.studioUser) return res.status(401).json({ error: 'Authentication required' })
  if (!['CERTIFIER', 'ADMIN'].includes(req.studioUser.role))
    return res.status(403).json({ error: 'Certifier or Admin role required' })
  next()
}

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.studioUser) return res.status(401).json({ error: 'Authentication required' })
  if (req.studioUser.role !== 'ADMIN') return res.status(403).json({ error: 'Admin role required' })
  next()
}

export const authRouter = Router()

authRouter.post('/login', async (req, res) => {
  const { email, password } = req.body
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' })
  try {
    const user = await prisma.user.findUnique({ where: { email } })
    if (!user || !(await bcrypt.compare(password, user.passwordHash)))
      return res.status(401).json({ error: 'Invalid credentials' })
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role } satisfies StudioUser,
      secret(), { expiresIn: '8h' }
    )
    res.json({ token, user: { id: user.id, email: user.email, name: user.name, role: user.role } })
  } catch {
    res.status(500).json({ error: 'Login failed' })
  }
})

authRouter.get('/me', requireAuth, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where:  { id: req.studioUser!.userId },
      select: { id: true, email: true, name: true, role: true },
    })
    if (!user) return res.status(404).json({ error: 'Not found' })
    res.json({ user })
  } catch {
    res.status(500).json({ error: 'Failed' })
  }
})
