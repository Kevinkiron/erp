import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'nodejs'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
// Prefer a service-role key if one is configured; otherwise the publishable key
// works because migration 0004 grants insert on the job tables.
const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

type Body = {
  client_code: string
  job: Record<string, unknown>
  purchase_orders: { po_no: string | null; invoice_no: string | null; currency: string | null; amount: number | null }[]
  document: { file_name: string; doc_type: string } | null
  engine: string
}

export async function POST(req: NextRequest) {
  const body = (await req.json()) as Body

  // Only write when the app is also *reading* from Postgres. Otherwise the new
  // job would land in the database while the registry still shows the bundled
  // dataset — a new job that vanishes is worse than one that was never saved.
  const live = process.env.NEXT_PUBLIC_DATA_SOURCE === 'supabase' && url && key
  if (!live) {
    return NextResponse.json({
      persisted: false,
      job_no: null,
      message:
        'Verified in the demo session. This deployment reads the bundled dataset, so the job was not written to the database — set NEXT_PUBLIC_DATA_SOURCE=supabase to persist new jobs.',
    })
  }

  const db = createClient(url!, key!, { auth: { persistSession: false } })

  const { data: client } = await db.from('clients').select('id').eq('code', body.client_code).maybeSingle()
  if (!client) {
    return NextResponse.json({ persisted: false, error: `Unknown client code "${body.client_code}".` }, { status: 400 })
  }

  // Next job number in the AFL/CC/<yy>/#### series.
  const yy = String(new Date().getFullYear()).slice(2)
  const prefix = `AFL/CC/${yy}/`
  const { data: latest } = await db
    .from('jobs')
    .select('job_no')
    .like('job_no', `${prefix}%`)
    .order('job_no', { ascending: false })
    .limit(1)
  const lastSeq = latest?.[0] ? Number(String(latest[0].job_no).split('/').pop()) : 0
  const job_no = prefix + String((Number.isFinite(lastSeq) ? lastSeq : 0) + 1).padStart(4, '0')

  const { data: inserted, error } = await db
    .from('jobs')
    .insert({ ...body.job, job_no, job_type: 'customs_clearance', client_id: client.id })
    .select('id, job_no')
    .maybeSingle()

  if (error || !inserted) {
    return NextResponse.json(
      { persisted: false, error: error?.message ?? 'Insert failed.', hint: 'Apply supabase/migrations/0004_intake_write_policies.sql' },
      { status: 500 },
    )
  }

  const lines = body.purchase_orders.filter((p) => p.po_no || p.invoice_no)
  if (lines.length) {
    await db.from('job_purchase_orders').insert(lines.map((p) => ({ ...p, job_id: inserted.id })))
  }

  if (body.document) {
    await db.from('job_documents').insert({
      job_id: inserted.id,
      doc_type: body.document.doc_type,
      file_name: body.document.file_name,
      uploaded_by: 'Intake',
      extracted: true,
    })
  }

  await db.from('job_history').insert({
    job_id: inserted.id,
    note: `Job created from an uploaded document (${body.engine} extraction), verified and saved by the operator.`,
    author: 'Intake',
  })

  return NextResponse.json({ persisted: true, job_no: inserted.job_no, id: inserted.id })
}
