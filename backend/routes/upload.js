import express from 'express'
import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { requireAuth } from '../middleware/auth.js'

const router = express.Router()

const r2 = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
})

const BUCKET = process.env.R2_BUCKET_NAME || 'resources'
const PUBLIC_URL = process.env.R2_PUBLIC_URL

/**
 * POST /api/upload/presigned-url
 * Generates a presigned PUT URL for direct upload to R2
 */
router.post('/presigned-url', requireAuth, async (req, res) => {
  try {
    const { fileName, contentType, folder } = req.body

    if (!fileName || !contentType) {
      return res.status(400).json({ error: 'fileName and contentType are required' })
    }

    // Build the key: folder/userId/randomId_timestamp.ext
    const ext = fileName.split('.').pop()
    const randomId = Math.random().toString(36).substring(2, 15)
    const key = `${folder || 'coach-resources'}/${req.user.id}/${randomId}_${Date.now()}.${ext}`

    const command = new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      ContentType: contentType,
    })

    const presignedUrl = await getSignedUrl(r2, command, { expiresIn: 3600 })

    // Build the public URL for reading
    const publicUrl = PUBLIC_URL
      ? `${PUBLIC_URL}/${key}`
      : presignedUrl.split('?')[0] // fallback: unsigned URL (only works if bucket is public)

    res.json({
      uploadUrl: presignedUrl,
      publicUrl,
      key,
    })
  } catch (error) {
    console.error('R2 presigned URL error:', error)
    res.status(500).json({ error: 'Failed to generate upload URL' })
  }
})

/**
 * DELETE /api/upload/file
 * Deletes a file from R2 by key
 */
router.delete('/file', requireAuth, async (req, res) => {
  try {
    const { key } = req.body

    if (!key) {
      return res.status(400).json({ error: 'key is required' })
    }

    await r2.send(new DeleteObjectCommand({
      Bucket: BUCKET,
      Key: key,
    }))

    res.json({ success: true })
  } catch (error) {
    console.error('R2 delete error:', error)
    res.status(500).json({ error: 'Failed to delete file' })
  }
})

export default router
