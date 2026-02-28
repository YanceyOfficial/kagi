import { apiError, requireSession, withAuth } from '@/lib/api-helpers'
import { NextRequest, NextResponse } from 'next/server'

const ALLOWED_TYPES = new Set([
  'text/plain',
  'application/json',
  'application/x-pem-file',
  'application/octet-stream'
])

const MAX_SIZE_BYTES = 1024 * 1024 // 1 MB — keys should be small

/**
 * POST /api/upload
 * Accepts a file upload (SSH key, JSON credential file) and returns its
 * content as a UTF-8 string. The caller is responsible for encrypting and
 * storing the content via POST /api/entries.
 *
 * This route does NOT store anything — it only reads and validates the file.
 */
export async function POST(request: NextRequest) {
  return withAuth(async () => {
    await requireSession()

    const formData = await request.formData()
    const file = formData.get('file')

    if (!(file instanceof File)) {
      return apiError('No file provided')
    }

    if (file.size > MAX_SIZE_BYTES) {
      return apiError(
        `File too large — maximum size is ${MAX_SIZE_BYTES / 1024} KB`
      )
    }

    // Allow common key/credential types plus unknown octet streams
    const contentType = file.type || 'application/octet-stream'
    if (!ALLOWED_TYPES.has(contentType) && !contentType.startsWith('text/')) {
      return apiError(`Unsupported file type: ${contentType}`)
    }

    const content = await file.text()

    return NextResponse.json({
      data: {
        fileName: file.name,
        contentType,
        content
      }
    })
  })
}
