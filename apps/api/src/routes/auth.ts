import { Router } from 'express'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import jwt    from 'jsonwebtoken'
import { z }  from 'zod'

const prisma = new PrismaClient()
export const authRouter = Router()

declare global { namespace Express { interface Request { rgUser?: any } } }

export function requireAuth(req: any, res: any, next: any) {
  const h = req.headers.authorization
  if (!h?.startsWith('Bearer ')) return res.status(401).json({ error: 'Authentication required' })
  try {
    req.rgUser = jwt.verify(h.slice(7), process.env.JWT_SECRET!)
    next()
  } catch { res.status(401).json({ error: 'Invalid token' }) }
}

authRouter.post('/login', async (req, res) => {
  try {
    const { email, password } = z.object({ email: z.string().email(), password: z.string() }).parse(req.body)
    const user = await prisma.user.findUnique({ where: { email } })
    if (!user || !user.isActive) return res.status(401).json({ error: 'Invalid credentials' })
    const valid = await bcrypt.compare(password, user.passwordHash)
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' })
    const token = jwt.sign(
      { userId: user.id, email: user.email, name: user.name, role: user.role },
      process.env.JWT_SECRET!, { expiresIn: '8h' }
    )
    await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } })
    res.json({ token, user: { id: user.id, email: user.email, name: user.name, role: user.role } })
  } catch (e: any) { res.status(400).json({ error: e.message }) }
})

authRouter.get('/me', requireAuth, async (req: any, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.rgUser.userId },
      select: { id: true, email: true, name: true, role: true, isActive: true }
    })
    if (!user) return res.status(404).json({ error: 'Not found' })
    res.json({ user })
  } catch { res.status(500).json({ error: 'Failed' }) }
})

// Forgot password — always returns 200 (security: don't reveal if email exists)
authRouter.post('/forgot-password', async (req, res) => {
  try {
    const { email } = z.object({ email: z.string().email() }).parse(req.body)
    const user = await prisma.user.findUnique({ where: { email } })
    if (user) {
      // Generate a short-lived reset token (1 hour)
      const resetToken = jwt.sign(
        { userId: user.id, purpose: 'password-reset' },
        process.env.JWT_SECRET!, { expiresIn: '1h' }
      )
      // In production: send email via Resend
      // For now: log to console so admin can relay it
      console.log(`[password-reset] Token for ${email}: ${resetToken}`)
      console.log(`[password-reset] Reset URL: ${process.env.WEB_URL ?? 'http://localhost:3011'}/reset-password?token=${resetToken}`)
    }
    // Always return success
    res.json({ message: 'If an account exists for this email, a reset link has been sent.' })
  } catch (e: any) { res.status(400).json({ error: e.message }) }
})

// Reset password with token
authRouter.post('/reset-password', async (req, res) => {
  try {
    const { token, password } = z.object({ token: z.string(), password: z.string().min(8) }).parse(req.body)
    const payload = jwt.verify(token, process.env.JWT_SECRET!) as any
    if (payload.purpose !== 'password-reset') return res.status(400).json({ error: 'Invalid token' })
    const hash = await bcrypt.hash(password, 12)
    await prisma.user.update({ where: { id: payload.userId }, data: { passwordHash: hash } })
    res.json({ message: 'Password updated. You can now sign in.' })
  } catch (e: any) { res.status(400).json({ error: 'Invalid or expired reset link' }) }
})
