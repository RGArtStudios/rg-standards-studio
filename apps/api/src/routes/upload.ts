import { Router } from 'express'
import { PrismaClient } from '@prisma/client'
import multer from 'multer'
import mammoth from 'mammoth'
import { requireAuth } from './auth'

const prisma = new PrismaClient()
export const uploadRouter = Router()

const storage = multer.memoryStorage()
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (_req, file, cb) => {
    const allowed = [
      'text/plain', 'text/markdown', 'text/typescript', 'text/javascript',
      'application/typescript', 'application/javascript',
      'application/json',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/octet-stream', // fallback for .ts files
    ]
    const ext = file.originalname.split('.').pop()?.toLowerCase()
    const allowedExts = ['ts', 'tsx', 'md', 'txt', 'json', 'js', 'jsx', 'docx']
    if (allowed.includes(file.mimetype) || allowedExts.includes(ext ?? '')) {
      cb(null, true)
    } else {
      cb(new Error(`File type not supported: ${file.mimetype} (.${ext})`))
    }
  },
})

async function extractText(buffer: Buffer, filename: string): Promise<string> {
  const ext = filename.split('.').pop()?.toLowerCase()
  if (ext === 'docx') {
    const result = await mammoth.extractRawText({ buffer })
    return result.value
  }
  return buffer.toString('utf-8')
}

// POST /api/upload — upload a file, extract text, store, return for analysis
uploadRouter.post('/', requireAuth, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' })

    const { standardId } = req.body
    const filename = req.file.originalname
    const content = await extractText(req.file.buffer, filename)

    // Store in DB
    const record = await prisma.uploadedFile.create({
      data: {
        filename,
        mimeType:   req.file.mimetype,
        sizeBytes:  req.file.size,
        content,
        standardId: standardId || null,
        uploadedById: (req as any).studioUser?.userId,
      },
    })

    res.json({
      id:       record.id,
      filename: record.filename,
      sizeBytes: record.sizeBytes,
      content,
      preview:  content.slice(0, 500),
    })
  } catch (err: any) {
    console.error('[upload]', err)
    res.status(500).json({ error: err.message })
  }
})

// GET /api/upload/:id — retrieve a stored upload
uploadRouter.get('/:id', requireAuth, async (req, res) => {
  try {
    const file = await prisma.uploadedFile.findUnique({ where: { id: req.params.id } })
    if (!file) return res.status(404).json({ error: 'Not found' })
    res.json(file)
  } catch {
    res.status(500).json({ error: 'Failed' })
  }
})

// GET /api/upload/standard/:standardId — all uploads for a standard
uploadRouter.get('/standard/:standardId', requireAuth, async (req, res) => {
  try {
    const files = await prisma.uploadedFile.findMany({
      where: { standardId: req.params.standardId },
      orderBy: { createdAt: 'desc' },
      select: { id: true, filename: true, sizeBytes: true, mimeType: true, createdAt: true },
    })
    res.json({ files })
  } catch {
    res.status(500).json({ error: 'Failed' })
  }
})

// DELETE /api/upload/:id
uploadRouter.delete('/:id', requireAuth, async (req, res) => {
  try {
    await prisma.uploadedFile.delete({ where: { id: req.params.id } })
    res.json({ deleted: true })
  } catch {
    res.status(500).json({ error: 'Failed' })
  }
})
