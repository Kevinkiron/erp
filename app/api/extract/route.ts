import { NextRequest, NextResponse } from 'next/server'
import { extractText, getDocumentProxy } from 'unpdf'
import { parseDocumentText } from '@/lib/extract/parser'
import { extractWithClaude } from '@/lib/extract/claude'
import { Extraction } from '@/lib/extract/schema'

export const runtime = 'nodejs'
export const maxDuration = 60

const MAX_BYTES = 12 * 1024 * 1024
const ACCEPTED = ['application/pdf', 'image/png', 'image/jpeg', 'image/webp']

export async function POST(req: NextRequest) {
  let file: File | null = null
  try {
    const form = await req.formData()
    file = form.get('file') as File | null
  } catch {
    return NextResponse.json({ error: 'Could not read the upload.' }, { status: 400 })
  }

  if (!file) return NextResponse.json({ error: 'No file was attached.' }, { status: 400 })
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: 'File is larger than 12 MB. Split or compress it first.' }, { status: 413 })
  }
  if (!ACCEPTED.includes(file.type)) {
    return NextResponse.json(
      { error: `Unsupported file type "${file.type || 'unknown'}". Upload a PDF, PNG or JPEG.` },
      { status: 415 },
    )
  }

  const buffer = Buffer.from(await file.arrayBuffer())

  // Preferred path: let Claude read the document as it is.
  if (process.env.ANTHROPIC_API_KEY) {
    try {
      const result = await extractWithClaude(buffer, file.type)
      return NextResponse.json({ ...result, file_name: file.name } satisfies Extraction & { file_name: string })
    } catch (err) {
      // fall through to the text parser rather than failing the upload
      console.error('[extract] Claude extraction failed, falling back:', err)
    }
  }

  // Fallback: pull the text layer out of the PDF and read the labels.
  if (file.type === 'application/pdf') {
    try {
      const pdf = await getDocumentProxy(new Uint8Array(buffer))
      const { text } = await extractText(pdf, { mergePages: true })
      if (text && text.trim().length > 40) {
        const result = parseDocumentText(text)
        if (!process.env.ANTHROPIC_API_KEY) {
          result.warnings = [
            ...result.warnings,
            'Running on the built-in label parser. Set ANTHROPIC_API_KEY to read scanned or non-standard layouts.',
          ]
        }
        return NextResponse.json({ ...result, file_name: file.name })
      }
    } catch (err) {
      console.error('[extract] PDF text extraction failed:', err)
    }
  }

  return NextResponse.json(
    {
      error:
        file.type === 'application/pdf'
          ? 'This PDF has no text layer — it is a scan. Scanned documents and images need AI extraction: set ANTHROPIC_API_KEY on the deployment.'
          : 'Images need AI extraction: set ANTHROPIC_API_KEY on the deployment.',
      code: 'needs_ai',
    },
    { status: 422 },
  )
}
