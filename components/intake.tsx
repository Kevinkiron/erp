'use client'

import { useRef, useState } from 'react'
import Link from 'next/link'
import {
  UploadCloud, FileText, Loader2, AlertTriangle, CheckCircle2, Sparkles,
  ScanLine, RotateCcw, ArrowRight,
} from 'lucide-react'
import { Card, CardHead, Pill } from '@/components/ui'
import {
  DOC_TYPE_LABELS, EMPTY_FIELDS, Extraction, ExtractedFields, FIELD_LABELS, REVIEW_THRESHOLD,
} from '@/lib/extract/schema'

type Client = { code: string; name: string }
type Result = Extraction & { file_name?: string }

const SAMPLES = [
  { file: 'sample-bill-of-lading.pdf', label: 'Bill of Lading', hint: 'PDF · Maersk · sea freight' },
  { file: 'sample-air-waybill.pdf', label: 'Air Waybill', hint: 'PDF · Lufthansa · air freight' },
  { file: 'sample-commercial-invoice.pdf', label: 'Commercial Invoice', hint: 'PDF · PO and values' },
  { file: 'sample-bill-of-lading-scan.jpg', label: 'Photographed BL', hint: 'JPEG · no text layer' },
]

const TEXT_FIELDS: (keyof ExtractedFields)[] = [
  'bl_awb_no', 'carrier', 'vessel_flight', 'port_of_loading', 'port_of_entry',
  'shipper', 'consignee', 'batch_no',
]
const NUM_FIELDS: (keyof ExtractedFields)[] = ['packages', 'gross_weight_kg', 'cbm']

export default function Intake({ clients }: { clients: Client[] }) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<Result | null>(null)
  const [fields, setFields] = useState<ExtractedFields>(EMPTY_FIELDS)
  const [touched, setTouched] = useState<Set<string>>(new Set())
  const [meta, setMeta] = useState({
    client_code: clients[0]?.code ?? '', revenue_sar: '', project_manager: '', sales_manager: '', remarks: '',
  })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState<{ job_no: string | null; persisted: boolean; message?: string } | null>(null)

  async function send(file: File) {
    setBusy(true); setError(null); setResult(null); setSaved(null); setTouched(new Set())
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await fetch('/api/extract', { method: 'POST', body: fd })
      const json = await res.json()
      if (!res.ok) {
        setError(json.error ?? 'The document could not be read.')
        return
      }
      setResult(json)
      setFields(json.fields)
      const guess = clients.find((c) =>
        json.fields.consignee?.toLowerCase().includes(c.name.split(' ')[0].toLowerCase()))
      if (guess) setMeta((m) => ({ ...m, client_code: guess.code }))
    } catch {
      setError('Upload failed. Check the connection and try again.')
    } finally {
      setBusy(false)
    }
  }

  async function loadSample(name: string) {
    setBusy(true)
    const res = await fetch(`/samples/${name}`)
    const blob = await res.blob()
    await send(new File([blob], name, { type: blob.type }))
  }

  const set = (k: keyof ExtractedFields, v: unknown) => {
    setFields((f) => ({ ...f, [k]: v }))
    setTouched((t) => new Set(t).add(k as string))
  }

  const conf = (k: keyof ExtractedFields) => result?.confidence?.[k] ?? 0
  const needsReview = (k: keyof ExtractedFields) =>
    !touched.has(k as string) && conf(k) > 0 && conf(k) < REVIEW_THRESHOLD
  const missing = (k: keyof ExtractedFields) => !touched.has(k as string) && conf(k) === 0

  const reviewCount = result
    ? (['trade', 'mode', ...TEXT_FIELDS, ...NUM_FIELDS, 'eta', 'goods_description'] as (keyof ExtractedFields)[])
        .filter((k) => needsReview(k) || missing(k)).length
    : 0

  async function save() {
    setSaving(true)
    try {
      const res = await fetch('/api/jobs', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          client_code: meta.client_code,
          engine: result?.engine ?? 'manual',
          document: result ? { file_name: result.file_name ?? 'upload', doc_type: DOC_TYPE_LABELS[result.doc_type] } : null,
          purchase_orders: fields.purchase_orders,
          job: {
            status: 'in_progress',
            batch_no: fields.batch_no,
            trade: fields.trade ?? 'import',
            mode: fields.mode,
            bl_awb_no: fields.bl_awb_no,
            carrier: fields.carrier,
            vessel_flight: fields.vessel_flight,
            port_of_loading: fields.port_of_loading,
            port_of_entry: fields.port_of_entry,
            shipper: fields.shipper,
            consignee: fields.consignee,
            goods_description: fields.goods_description,
            packages: fields.packages,
            gross_weight_kg: fields.gross_weight_kg,
            cbm: fields.cbm,
            eta: fields.eta,
            project_manager: meta.project_manager || null,
            sales_manager: meta.sales_manager || null,
            revenue_sar: Number(meta.revenue_sar || 0),
            remarks: meta.remarks || null,
          },
        }),
      })
      const json = await res.json()
      if (!res.ok) { setError(json.error ?? 'Could not save the job.'); return }
      setSaved(json)
    } finally {
      setSaving(false)
    }
  }

  function reset() {
    setResult(null); setFields(EMPTY_FIELDS); setSaved(null); setError(null); setTouched(new Set())
  }

  if (saved) {
    return (
      <Card className="mx-auto max-w-2xl p-8 text-center">
        <CheckCircle2 className="mx-auto h-10 w-10 text-emerald-500" />
        <h2 className="mt-4 text-xl font-semibold text-slate-900">
          {saved.job_no ? `Job ${saved.job_no} created` : 'Job verified'}
        </h2>
        <p className="mt-2 text-sm text-slate-500">
          {saved.persisted
            ? 'Saved to the job registry with the source document attached and the first history entry written.'
            : saved.message}
        </p>
        <div className="mt-6 flex justify-center gap-3">
          {saved.job_no && (
            <Link href={`/jobs/${encodeURIComponent(saved.job_no)}`}
              className="inline-flex items-center gap-1.5 rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700">
              Open the job file <ArrowRight className="h-4 w-4" />
            </Link>
          )}
          <button onClick={reset}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
            <RotateCcw className="h-4 w-4" /> Read another document
          </button>
        </div>
      </Card>
    )
  }

  if (!result) {
    return (
      <div className="mx-auto max-w-3xl">
        <div
          onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault(); setDragging(false)
            const f = e.dataTransfer.files?.[0]
            if (f) send(f)
          }}
          onClick={() => inputRef.current?.click()}
          className={`cursor-pointer rounded-xl border-2 border-dashed p-12 text-center transition ${
            dragging ? 'border-teal-500 bg-teal-50/60' : 'border-slate-300 bg-white hover:border-slate-400'
          }`}
        >
          <input ref={inputRef} type="file" accept="application/pdf,image/png,image/jpeg,image/webp"
            className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) send(f) }} />
          {busy ? (
            <>
              <ScanLine className="mx-auto h-9 w-9 animate-pulse text-teal-600" />
              <p className="mt-4 text-sm font-medium text-slate-800">Reading the document…</p>
              <p className="mt-1 text-xs text-slate-500">Pulling out the BL / AWB fields</p>
            </>
          ) : (
            <>
              <UploadCloud className="mx-auto h-9 w-9 text-slate-400" />
              <p className="mt-4 text-sm font-medium text-slate-800">
                Drop the Bill of Lading, Air Waybill or Commercial Invoice here
              </p>
              <p className="mt-1 text-xs text-slate-500">PDF, PNG or JPEG · up to 12 MB · or click to browse</p>
            </>
          )}
        </div>

        {error && (
          <div className="mt-4 flex items-start gap-2.5 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="mt-8">
          <div className="mb-3 text-[11px] font-semibold uppercase tracking-widest text-slate-400">
            Or try one of these sample documents
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {SAMPLES.map((s) => (
              <button key={s.file} disabled={busy} onClick={() => loadSample(s.file)}
                className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3 text-left transition hover:border-teal-400 hover:bg-teal-50/40 disabled:opacity-50">
                <FileText className="h-4 w-4 shrink-0 text-slate-400" />
                <span className="min-w-0">
                  <span className="block text-sm font-medium text-slate-800">{s.label}</span>
                  <span className="block text-xs text-slate-500">{s.hint}</span>
                </span>
              </button>
            ))}
          </div>
          <p className="mt-3 text-xs text-slate-400">
            These are synthetic documents built for the demo — no client paperwork is stored in this app.
          </p>
        </div>
      </div>
    )
  }

  const Confidence = ({ k }: { k: keyof ExtractedFields }) => {
    if (touched.has(k as string)) return <span className="text-[10px] font-medium text-slate-400">edited</span>
    const c = conf(k)
    if (c === 0) return <span className="text-[10px] font-medium text-slate-400">not found</span>
    if (c < REVIEW_THRESHOLD) return <span className="text-[10px] font-medium text-amber-600">check · {Math.round(c * 100)}%</span>
    return <span className="text-[10px] font-medium text-emerald-600">{Math.round(c * 100)}%</span>
  }

  const inputCls = (k: keyof ExtractedFields) =>
    `w-full rounded-lg border px-3 py-2 text-sm text-slate-800 outline-none transition focus:ring-2 focus:ring-teal-500/30 ${
      needsReview(k) ? 'border-amber-300 bg-amber-50/50 focus:border-amber-400'
      : missing(k) ? 'border-slate-200 bg-slate-50 focus:border-teal-500'
      : 'border-slate-200 bg-white focus:border-teal-500'
    }`

  const FieldRow = ({ k, children }: { k: keyof ExtractedFields; children: React.ReactNode }) => (
    <label className="block">
      <span className="mb-1 flex items-baseline justify-between">
        <span className="text-[11px] font-medium uppercase tracking-wider text-slate-500">{FIELD_LABELS[k]}</span>
        <Confidence k={k} />
      </span>
      {children}
    </label>
  )

  return (
    <div className="grid gap-6 xl:grid-cols-3">
      <div className="space-y-6 xl:col-span-2">
        <Card>
          <CardHead
            title="Verify before saving"
            sub="Nothing is saved until you confirm — this is the check step, not a form to retype"
            right={
              <button onClick={reset} className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-800">
                <RotateCcw className="h-3.5 w-3.5" /> Start over
              </button>
            }
          />

          <div className="space-y-4 p-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <FieldRow k="trade">
                <select value={fields.trade ?? ''} onChange={(e) => set('trade', e.target.value || null)} className={inputCls('trade')}>
                  <option value="">—</option><option value="import">Import</option>
                  <option value="export">Export</option><option value="local">Local</option>
                </select>
              </FieldRow>
              <FieldRow k="mode">
                <select value={fields.mode ?? ''} onChange={(e) => set('mode', e.target.value || null)} className={inputCls('mode')}>
                  <option value="">—</option><option value="sea">Sea</option>
                  <option value="air">Air</option><option value="land">Land</option>
                </select>
              </FieldRow>
              {TEXT_FIELDS.map((k) => (
                <FieldRow key={k} k={k}>
                  <input value={(fields[k] as string) ?? ''} onChange={(e) => set(k, e.target.value || null)}
                    className={inputCls(k)} placeholder="—" />
                </FieldRow>
              ))}
              {NUM_FIELDS.map((k) => (
                <FieldRow key={k} k={k}>
                  <input type="number" step="any" value={(fields[k] as number) ?? ''}
                    onChange={(e) => set(k, e.target.value === '' ? null : Number(e.target.value))}
                    className={inputCls(k)} placeholder="—" />
                </FieldRow>
              ))}
              <FieldRow k="eta">
                <input type="date" value={fields.eta ?? ''} onChange={(e) => set('eta', e.target.value || null)} className={inputCls('eta')} />
              </FieldRow>
            </div>

            <FieldRow k="goods_description">
              <textarea rows={3} value={fields.goods_description ?? ''}
                onChange={(e) => set('goods_description', e.target.value || null)} className={inputCls('goods_description')} />
            </FieldRow>
          </div>
        </Card>

        <Card>
          <CardHead title="PO & invoice lines" sub="Read from the document — add any that are missing" />
          <div className="space-y-3 p-5">
            {fields.purchase_orders.length === 0 && (
              <p className="text-sm text-slate-400">No PO or invoice reference found on this document.</p>
            )}
            {fields.purchase_orders.map((p, i) => (
              <div key={i} className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {(['po_no', 'invoice_no', 'currency'] as const).map((f) => (
                  <input key={f} value={p[f] ?? ''} placeholder={f.replace('_', ' ')}
                    onChange={(e) => {
                      const next = [...fields.purchase_orders]
                      next[i] = { ...next[i], [f]: e.target.value || null }
                      set('purchase_orders', next)
                    }}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/30" />
                ))}
                <input type="number" step="any" value={p.amount ?? ''} placeholder="amount"
                  onChange={(e) => {
                    const next = [...fields.purchase_orders]
                    next[i] = { ...next[i], amount: e.target.value === '' ? null : Number(e.target.value) }
                    set('purchase_orders', next)
                  }}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/30" />
              </div>
            ))}
            <button
              onClick={() => set('purchase_orders', [...fields.purchase_orders, { po_no: null, invoice_no: null, currency: 'EUR', amount: null }])}
              className="text-xs font-medium text-teal-700 hover:text-teal-800">
              + Add a line
            </button>
          </div>
        </Card>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHead title="Source document" />
          <div className="space-y-3 p-5">
            <div className="flex items-center gap-2.5">
              <FileText className="h-4 w-4 shrink-0 text-slate-400" />
              <span className="truncate text-sm text-slate-800">{result.file_name}</span>
            </div>
            <div className="flex flex-wrap gap-2">
              <Pill status="cleared">{DOC_TYPE_LABELS[result.doc_type]}</Pill>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-teal-50 px-2.5 py-0.5 text-[11px] font-medium text-teal-700 ring-1 ring-inset ring-teal-200">
                <Sparkles className="h-3 w-3" />
                {result.engine === 'claude' ? 'AI extraction' : 'Label parser'}
              </span>
            </div>
            {reviewCount > 0 ? (
              <div className="flex items-start gap-2 rounded-lg bg-amber-50 px-3 py-2.5 text-xs text-amber-800">
                <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                <span>{reviewCount} field{reviewCount === 1 ? '' : 's'} need a look before saving.</span>
              </div>
            ) : (
              <div className="flex items-start gap-2 rounded-lg bg-emerald-50 px-3 py-2.5 text-xs text-emerald-800">
                <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                <span>Every field read cleanly.</span>
              </div>
            )}
            {result.warnings?.map((w, i) => (
              <p key={i} className="text-xs leading-relaxed text-slate-500">{w}</p>
            ))}
            {result.notes && <p className="text-xs leading-relaxed text-slate-500">{result.notes}</p>}
          </div>
        </Card>

        <Card>
          <CardHead title="Job details" sub="The parts that don't come off the document" />
          <div className="space-y-4 p-5">
            <label className="block">
              <span className="mb-1 block text-[11px] font-medium uppercase tracking-wider text-slate-500">Client</span>
              <select value={meta.client_code} onChange={(e) => setMeta({ ...meta, client_code: e.target.value })}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/30">
                {clients.map((c) => <option key={c.code} value={c.code}>{c.name}</option>)}
              </select>
            </label>
            {([['revenue_sar', 'Quoted revenue (SAR)'], ['project_manager', 'Project manager'], ['sales_manager', 'Sales manager']] as const).map(([k, label]) => (
              <label key={k} className="block">
                <span className="mb-1 block text-[11px] font-medium uppercase tracking-wider text-slate-500">{label}</span>
                <input value={meta[k]} onChange={(e) => setMeta({ ...meta, [k]: e.target.value })}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/30" />
              </label>
            ))}
            <label className="block">
              <span className="mb-1 block text-[11px] font-medium uppercase tracking-wider text-slate-500">Remarks</span>
              <textarea rows={2} value={meta.remarks} onChange={(e) => setMeta({ ...meta, remarks: e.target.value })}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/30" />
            </label>
          </div>
          <div className="border-t border-slate-100 p-5">
            <button onClick={save} disabled={saving}
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-teal-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-teal-700 disabled:opacity-60">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
              {saving ? 'Saving…' : 'Verify & create job'}
            </button>
            {error && <p className="mt-3 text-xs text-rose-600">{error}</p>}
          </div>
        </Card>
      </div>
    </div>
  )
}
