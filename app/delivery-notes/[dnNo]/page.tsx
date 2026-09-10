import Link from 'next/link'
import { notFound } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Card, CardHead, Pill, Table, Row, Cell, Field } from '@/components/ui'
import { num, day, stamp } from '@/lib/format'
import { ArrowLeft, Printer, Signature } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function DeliveryNote({ params }: { params: Promise<{ dnNo: string }> }) {
  const { dnNo } = await params
  const decoded = decodeURIComponent(dnNo)

  const { data: dn } = await supabase
    .from('delivery_notes')
    .select('*, jobs(job_no,batch_no,consignee,clients(name))')
    .eq('dn_no', decoded)
    .maybeSingle()

  if (!dn) notFound()

  const { data: items } = await supabase.from('delivery_note_items').select('*').eq('dn_id', dn.id)

  return (
    <>
      <Link href="/delivery-notes" className="mb-4 inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-800">
        <ArrowLeft className="h-3.5 w-3.5" /> All delivery notes
      </Link>

      <div className="mx-auto max-w-3xl">
        <Card>
          <div className="flex items-start justify-between border-b border-slate-100 px-8 py-6">
            <div>
              <div className="text-lg font-semibold text-slate-900">Logistica Clearing &amp; Forwarding Est.</div>
              <div className="mt-0.5 text-xs text-slate-500">Al Sulay Industrial Area, Riyadh · CR 1010XXXXXX · VAT 3XXXXXXXXXXXX3</div>
            </div>
            <div className="text-right">
              <div className="text-[11px] uppercase tracking-widest text-slate-400">Delivery Note</div>
              <div className="tabular text-lg font-semibold text-slate-900">{dn.dn_no}</div>
              <div className="mt-1"><Pill status={dn.status} /></div>
            </div>
          </div>

          <dl className="grid grid-cols-2 gap-x-8 gap-y-5 px-8 py-6 md:grid-cols-3">
            <Field
              label="Job reference"
              value={
                <Link href={`/jobs/${encodeURIComponent(dn.jobs?.job_no ?? '')}`} className="tabular text-teal-700 hover:underline">
                  {dn.jobs?.job_no}
                </Link>
              }
            />
            <Field label="Batch no" value={<span className="tabular">{dn.jobs?.batch_no}</span>} />
            <Field label="Issued on" value={day(dn.issued_on)} />
            <div className="col-span-2">
              <Field label="Consignee" value={<>{dn.consignee}<br /><span className="text-slate-500">{dn.delivery_address}</span></>} />
            </div>
            <Field label="Vehicle" value={<span className="tabular">{dn.vehicle_no}</span>} />
            <Field label="Driver" value={dn.driver_name} />
            <Field label="Delivered at" value={stamp(dn.delivered_at)} />
            <Field label="Received by" value={dn.receiver_name ? `${dn.receiver_name} · ${dn.receiver_designation}` : 'Pending'} />
          </dl>

          <div className="border-t border-slate-100">
            <CardHead title="Consignment" />
            <Table head={['#', 'Description', 'Batch', 'Serial', 'Qty', 'UoM', 'Remarks']}>
              {(items ?? []).map((it, i) => (
                <Row key={it.id}>
                  <Cell className="text-slate-400">{i + 1}</Cell>
                  <Cell className="max-w-[280px] truncate font-medium text-slate-800">{it.description}</Cell>
                  <Cell className="tabular text-xs text-slate-500">{it.batch_no}</Cell>
                  <Cell className="tabular text-xs text-slate-500">{it.serial_no}</Cell>
                  <Cell className="tabular">{num(it.qty)}</Cell>
                  <Cell className="text-slate-500">{it.uom}</Cell>
                  <Cell className="text-xs text-slate-500">{it.remarks ?? '—'}</Cell>
                </Row>
              ))}
            </Table>
          </div>

          {dn.condition_remarks && (
            <div className="border-t border-slate-100 px-8 py-4">
              <div className="text-[11px] font-medium uppercase tracking-wider text-slate-400">Condition on receipt</div>
              <p className="mt-1 text-sm text-slate-700">{dn.condition_remarks}</p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-8 border-t border-slate-100 px-8 py-6">
            <div>
              <div className="text-[11px] font-medium uppercase tracking-wider text-slate-400">Delivered by</div>
              <div className="mt-6 border-t border-slate-300 pt-1.5 text-xs text-slate-600">{dn.driver_name}</div>
            </div>
            <div>
              <div className="text-[11px] font-medium uppercase tracking-wider text-slate-400">Received by</div>
              {dn.signature_captured ? (
                <div className="mt-2 flex h-12 items-end">
                  <svg viewBox="0 0 200 40" className="h-10 w-40 text-slate-800">
                    <path
                      d="M4 30 C 20 6, 30 34, 44 20 S 66 4, 78 24 S 96 34, 110 14 S 132 6, 142 26 S 164 30, 196 10"
                      fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"
                    />
                  </svg>
                </div>
              ) : (
                <div className="mt-2 flex h-12 items-end text-xs text-slate-300">Awaiting signature on the driver app</div>
              )}
              <div className="border-t border-slate-300 pt-1.5 text-xs text-slate-600">
                {dn.receiver_name ?? '—'}
                {dn.receiver_designation && <span className="text-slate-400"> · {dn.receiver_designation}</span>}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/60 px-8 py-3 text-xs text-slate-500">
            <span className="inline-flex items-center gap-1.5">
              <Signature className="h-3.5 w-3.5" />
              {dn.signature_captured ? 'Signature captured on the driver app and synced automatically.' : 'Not yet signed.'}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Printer className="h-3.5 w-3.5" /> Print / PDF
            </span>
          </div>
        </Card>
      </div>
    </>
  )
}
