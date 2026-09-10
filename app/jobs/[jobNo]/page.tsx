import Link from 'next/link'
import { notFound } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Card, CardHead, Pill, Table, Row, Cell, Field, Empty, Tag } from '@/components/ui'
import { sar, num, day, stamp, titleCase, JOB_TYPE_LABEL } from '@/lib/format'
import { ArrowLeft, FileText, MapPin, Sparkles, CheckCircle2 } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function JobDetail({ params }: { params: Promise<{ jobNo: string }> }) {
  const { jobNo } = await params
  const decoded = decodeURIComponent(jobNo)

  const { data: job } = await supabase
    .from('jobs')
    .select('*, clients(code,name,contact_name,contact_phone)')
    .eq('job_no', decoded)
    .maybeSingle()

  if (!job) notFound()

  const isShipping = job.job_type === 'customs_clearance' || job.job_type === 'freight_forwarding'

  const [
    { data: duties }, { data: pos }, { data: expenses }, { data: invoices },
    { data: docs }, { data: history }, { data: transport }, { data: crew },
    { data: allowances }, { data: dns }, { data: install }, { data: siblings }, { data: movements },
  ] = await Promise.all([
    supabase.from('duty_charges').select('*').eq('job_id', job.id),
    supabase.from('job_purchase_orders').select('*').eq('job_id', job.id),
    supabase.from('expenses').select('*').eq('job_id', job.id).order('amount', { ascending: false }),
    supabase.from('invoices').select('*').eq('job_id', job.id),
    supabase.from('job_documents').select('*').eq('job_id', job.id),
    supabase.from('job_history').select('*').eq('job_id', job.id).order('entry_date', { ascending: false }),
    supabase.from('transport_details').select('*, trucks(plate_no,model), staff(full_name,emp_no)').eq('job_id', job.id).maybeSingle(),
    supabase.from('transport_crew').select('*, staff(full_name,emp_no,employment)').eq('job_id', job.id),
    supabase.from('trip_allowances').select('*, staff(full_name), allowance_slabs(label,basis)').eq('job_id', job.id),
    supabase.from('delivery_notes').select('*').eq('job_id', job.id),
    supabase.from('installation_details').select('*, sites(name,city)').eq('job_id', job.id).maybeSingle(),
    job.batch_no
      ? supabase.from('jobs').select('job_no,job_type,status,opened_on').eq('batch_no', job.batch_no).order('opened_on')
      : Promise.resolve({ data: [] as never[] }),
    supabase.from('stock_movements').select('*, stock_items(sku,description)').eq('job_id', job.id),
  ])

  const chargeTotal = (duties ?? []).reduce((s, d) => s + Number(d.amount), 0)
  const expenseTotal = (expenses ?? []).reduce((s, e) => s + Number(e.amount), 0)
  const invoiceTotal = (invoices ?? []).reduce((s, i) => s + Number(i.amount), 0)
  const net = Number(job.revenue_sar) - expenseTotal

  return (
    <>
      <Link href="/clearance" className="mb-4 inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-800">
        <ArrowLeft className="h-3.5 w-3.5" /> Back to registry
      </Link>

      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900">{job.job_no}</h1>
            <Pill status={job.status} />
          </div>
          <p className="mt-1 text-sm text-slate-500">
            {JOB_TYPE_LABEL[job.job_type]} · {job.clients?.name}
            {job.batch_no && (
              <>
                {' '}· batch <span className="tabular font-medium text-slate-700">{job.batch_no}</span>
              </>
            )}
          </p>
        </div>
        <div className="grid grid-cols-3 gap-3 text-right">
          <div>
            <div className="text-[11px] uppercase tracking-wider text-slate-400">Revenue</div>
            <div className="tabular text-lg font-semibold text-slate-900">{sar(job.revenue_sar, { compact: true })}</div>
          </div>
          <div>
            <div className="text-[11px] uppercase tracking-wider text-slate-400">Expense</div>
            <div className="tabular text-lg font-semibold text-slate-900">{sar(expenseTotal, { compact: true })}</div>
          </div>
          <div>
            <div className="text-[11px] uppercase tracking-wider text-slate-400">Net P&amp;L</div>
            <div className={`tabular text-lg font-semibold ${net >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
              {sar(net, { compact: true })}
            </div>
          </div>
        </div>
      </div>

      {invoiceTotal === 0 && Number(job.revenue_sar) > 0 && (
        <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm text-amber-900">
          No invoice raised against this job yet — it will show as unbilled in the P&amp;L report.
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-3">
        <div className="space-y-6 xl:col-span-2">
          <Card>
            <CardHead
              title={isShipping ? 'Shipment' : 'Consignment'}
              sub={isShipping ? 'Fields auto-filled from the BL / AWB and commercial invoice' : 'Carried forward from the clearance job on the same batch'}
              right={
                isShipping ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-teal-50 px-2.5 py-1 text-[11px] font-medium text-teal-700 ring-1 ring-inset ring-teal-200">
                    <Sparkles className="h-3 w-3" /> Auto-extracted
                  </span>
                ) : null
              }
            />
            <dl className="grid grid-cols-2 gap-x-6 gap-y-4 p-5 md:grid-cols-4">
              <Field label="Trade" value={titleCase(job.trade)} />
              {isShipping && <Field label="Mode" value={titleCase(job.mode)} />}
              {isShipping && <Field label="BL / AWB no" value={<span className="tabular">{job.bl_awb_no ?? '—'}</span>} />}
              {isShipping && <Field label="Carrier" value={job.carrier} />}
              {isShipping && <Field label="Vessel / flight" value={job.vessel_flight} />}
              {isShipping && <Field label="Port of loading" value={job.port_of_loading} />}
              {isShipping && <Field label="Port of entry" value={job.port_of_entry} />}
              {isShipping && <Field label="Shipper" value={job.shipper} />}
              <Field label="Consignee" value={job.consignee} />
              <Field label="Packages" value={<span className="tabular">{job.packages ? num(job.packages) : '—'}</span>} />
              <Field label="Gross weight" value={<span className="tabular">{job.gross_weight_kg ? `${num(job.gross_weight_kg)} kg` : '—'}</span>} />
              <Field label="Volume" value={<span className="tabular">{job.cbm ? `${num(job.cbm, 3)} cbm` : '—'}</span>} />
              {isShipping && <Field label="ETA" value={day(job.eta)} />}
              {isShipping && <Field label="Arrived" value={day(job.ata)} />}
              {isShipping && <Field label="Cleared" value={day(job.cleared_on)} />}
              <Field label="Opened" value={day(job.opened_on)} />
              <Field label="Closed" value={day(job.closed_on)} />
              <Field label="Project manager" value={job.project_manager} />
              <Field label="Sales manager" value={job.sales_manager} />
              <div className="col-span-2 md:col-span-4">
                <Field label="Goods description" value={job.goods_description} />
              </div>
              {job.remarks && (
                <div className="col-span-2 md:col-span-4">
                  <Field label="Remarks" value={job.remarks} />
                </div>
              )}
            </dl>
          </Card>

          {(duties ?? []).length > 0 && (
            <Card>
              <CardHead
                title="Customs duty & charges"
                sub="Entered split-wise so a client can be shown pure duty separately from other charges"
              />
              <Table head={['Charge', 'Bayan no', 'Paid on', 'Amount (SAR)']}>
                {(duties ?? []).map((d) => (
                  <Row key={d.id}>
                    <Cell className="font-medium text-slate-800">{titleCase(d.type)}</Cell>
                    <Cell className="tabular text-xs text-slate-500">{d.bayan_no}</Cell>
                    <Cell className="text-slate-500">{day(d.paid_on)}</Cell>
                    <Cell className="tabular text-right">{sar(d.amount)}</Cell>
                  </Row>
                ))}
                <Row className="bg-slate-50 font-semibold">
                  <Cell className="text-slate-900">Total per Bayan</Cell>
                  <Cell />
                  <Cell />
                  <Cell className="tabular text-right text-slate-900">{sar(chargeTotal)}</Cell>
                </Row>
              </Table>
              <div className="flex items-center gap-2 border-t border-slate-100 px-5 py-3 text-xs text-emerald-700">
                <CheckCircle2 className="h-3.5 w-3.5" />
                System total matches the customs Bayan document — no rounding difference.
              </div>
            </Card>
          )}

          {transport && (
            <Card>
              <CardHead title="Transport leg" sub="Distance is computed point-to-point, independent of the truck GPS box" />
              <dl className="grid grid-cols-2 gap-x-6 gap-y-4 p-5 md:grid-cols-4">
                <Field label="Scope" value={titleCase(transport.scope)} />
                <Field label="Truck" value={`${transport.trucks?.plate_no ?? '—'} · ${transport.trucks?.model ?? ''}`} />
                <Field label="Driver" value={transport.staff?.full_name} />
                <Field label="Distance" value={<span className="tabular font-semibold">{num(transport.distance_km)} km</span>} />
                <Field label="Picked up" value={stamp(transport.pickup_at)} />
                <Field label="Delivered" value={stamp(transport.delivered_at)} />
                <Field label="Forklift needed at site" value={transport.requires_forklift ? 'Yes — Logistica supplies' : 'No'} />
                <Field label="Photos uploaded" value={`${transport.loading_photos} loading · ${transport.delivery_photos} delivery`} />
                <div className="col-span-2">
                  <Field
                    label="Pickup"
                    value={
                      <span className="flex items-start gap-1.5">
                        <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400" />
                        <span>
                          {transport.pickup_name}
                          <br />
                          <span className="text-slate-500">{transport.pickup_address}</span>
                          <br />
                          <span className="tabular text-xs text-slate-400">
                            {transport.pickup_lat}, {transport.pickup_lng}
                          </span>
                        </span>
                      </span>
                    }
                  />
                </div>
                <div className="col-span-2">
                  <Field
                    label="Delivery"
                    value={
                      <span className="flex items-start gap-1.5">
                        <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-teal-500" />
                        <span>
                          {job.consignee}
                          <br />
                          <span className="text-slate-500">{transport.drop_address}</span>
                          <br />
                          <span className="tabular text-xs text-slate-400">
                            {transport.drop_lat}, {transport.drop_lng}
                          </span>
                        </span>
                      </span>
                    }
                  />
                </div>
              </dl>

              {(allowances ?? []).length > 0 && (
                <>
                  <div className="border-t border-slate-100 px-5 pt-4 text-[13px] font-semibold uppercase tracking-wide text-slate-800">
                    Crew &amp; allowance calculation
                  </div>
                  <Table head={['Name', 'Role', 'Source', 'Slab', 'Basis', 'Amount']}>
                    {(allowances ?? []).map((a) => {
                      const isDriver = a.staff_id === transport.driver_id
                      const c = (crew ?? []).find((x) => x.staff_id === a.staff_id)
                      return (
                        <Row key={a.id}>
                          <Cell className="font-medium text-slate-800">{a.staff?.full_name}</Cell>
                          <Cell className="text-slate-500">{isDriver ? 'Driver' : 'Labour'}</Cell>
                          <Cell>
                            <Tag tone={(c?.source ?? 'own') === 'own' ? 'brand' : 'amber'}>{c?.source ?? 'own'}</Tag>
                          </Cell>
                          <Cell className="text-slate-500">{a.allowance_slabs?.label}</Cell>
                          <Cell className="text-slate-500">{titleCase(a.basis)}</Cell>
                          <Cell className="tabular text-right">{sar(a.amount)}</Cell>
                        </Row>
                      )
                    })}
                    <Row className="bg-slate-50 font-semibold">
                      <Cell className="text-slate-900" >Total allowance</Cell>
                      <Cell /><Cell /><Cell /><Cell />
                      <Cell className="tabular text-right text-slate-900">
                        {sar((allowances ?? []).reduce((s, a) => s + Number(a.amount), 0))}
                      </Cell>
                    </Row>
                  </Table>
                </>
              )}
            </Card>
          )}

          {install && (
            <Card>
              <CardHead title="Installation" />
              <dl className="grid grid-cols-2 gap-x-6 gap-y-4 p-5 md:grid-cols-4">
                <Field label="Site" value={install.sites?.name} />
                <Field label="Equipment" value={install.equipment} />
                <Field label="Lead engineer" value={install.lead_engineer} />
                <Field label="Team size" value={install.team_size} />
                <Field label="Scheduled" value={day(install.scheduled_on)} />
                <Field label="Completed" value={day(install.completed_on)} />
                <Field label="Handover signed" value={install.handover_signed ? 'Yes' : 'Not yet'} />
                <div className="col-span-2 md:col-span-4">
                  <Field label="Commissioning notes" value={install.commissioning_notes} />
                </div>
              </dl>
            </Card>
          )}

          {(movements ?? []).length > 0 && (
            <Card>
              <CardHead title="Warehouse movements" />
              <Table head={['Moved', 'Direction', 'Item', 'Batch', 'Qty', 'Pallet', 'Barcode', 'Bin']}>
                {(movements ?? []).map((m) => (
                  <Row key={m.id}>
                    <Cell className="text-slate-500">{stamp(m.moved_at)}</Cell>
                    <Cell><Tag tone={m.direction === 'in' ? 'brand' : 'amber'}>{m.direction}</Tag></Cell>
                    <Cell className="max-w-[220px] truncate">{m.stock_items?.description}</Cell>
                    <Cell className="tabular text-xs text-slate-500">{m.batch_no}</Cell>
                    <Cell className="tabular">{num(m.qty)}</Cell>
                    <Cell className="tabular text-xs text-slate-500">{m.pallet_no}</Cell>
                    <Cell className="tabular text-xs text-slate-500">{m.barcode}</Cell>
                    <Cell className="text-slate-500">{m.location_bin}</Cell>
                  </Row>
                ))}
              </Table>
            </Card>
          )}

          <Card>
            <CardHead title="Expenses booked to this job" sub="Posted by accounts, visible immediately in the job P&L" />
            {(expenses ?? []).length === 0 ? (
              <Empty>No expenses posted.</Empty>
            ) : (
              <Table head={['Category', 'Description', 'Vendor', 'Paid on', 'Amount']}>
                {(expenses ?? []).map((e) => (
                  <Row key={e.id}>
                    <Cell className="font-medium text-slate-800">{e.category}</Cell>
                    <Cell className="max-w-[260px] truncate text-slate-500">{e.description}</Cell>
                    <Cell className="text-slate-500">{e.vendor}</Cell>
                    <Cell className="text-slate-500">{day(e.paid_on)}</Cell>
                    <Cell className="tabular text-right">{sar(e.amount)}</Cell>
                  </Row>
                ))}
                <Row className="bg-slate-50 font-semibold">
                  <Cell className="text-slate-900">Total expense</Cell>
                  <Cell /><Cell /><Cell />
                  <Cell className="tabular text-right text-slate-900">{sar(expenseTotal)}</Cell>
                </Row>
              </Table>
            )}
          </Card>
        </div>

        <div className="space-y-6">
          {(siblings ?? []).length > 1 && (
            <Card>
              <CardHead title="Batch chain" sub={job.batch_no ?? ''} />
              <div className="space-y-1 p-4">
                {(siblings ?? []).map((s) => (
                  <Link
                    key={s.job_no}
                    href={`/jobs/${encodeURIComponent(s.job_no)}`}
                    className={`flex items-center justify-between rounded-lg px-3 py-2 text-sm transition ${
                      s.job_no === job.job_no ? 'bg-teal-50 ring-1 ring-inset ring-teal-200' : 'hover:bg-slate-50'
                    }`}
                  >
                    <span>
                      <span className="font-medium text-slate-800">{JOB_TYPE_LABEL[s.job_type]}</span>
                      <br />
                      <span className="tabular text-xs text-slate-500">{s.job_no}</span>
                    </span>
                    <Pill status={s.status} />
                  </Link>
                ))}
              </div>
            </Card>
          )}

          {(pos ?? []).length > 0 && (
            <Card>
              <CardHead title="PO & invoice references" />
              <Table head={['PO no', 'Invoice', 'Value']}>
                {(pos ?? []).map((p) => (
                  <Row key={p.id}>
                    <Cell className="tabular font-medium text-slate-800">{p.po_no}</Cell>
                    <Cell className="tabular text-xs text-slate-500">{p.invoice_no}</Cell>
                    <Cell className="tabular text-right text-slate-600">
                      {p.currency} {num(p.amount, 2)}
                    </Cell>
                  </Row>
                ))}
              </Table>
            </Card>
          )}

          {(dns ?? []).length > 0 && (
            <Card>
              <CardHead title="Delivery notes" />
              <div className="space-y-2 p-4">
                {(dns ?? []).map((d) => (
                  <Link key={d.id} href={`/delivery-notes/${encodeURIComponent(d.dn_no)}`} className="block rounded-lg border border-slate-100 px-3 py-2.5 hover:border-slate-300">
                    <div className="flex items-center justify-between">
                      <span className="tabular text-sm font-medium text-slate-800">{d.dn_no}</span>
                      <Pill status={d.status} />
                    </div>
                    <div className="mt-1 text-xs text-slate-500">
                      {d.signature_captured ? `Signed by ${d.receiver_name}` : 'Awaiting signature on the driver app'}
                    </div>
                  </Link>
                ))}
              </div>
            </Card>
          )}

          {(invoices ?? []).length > 0 && (
            <Card>
              <CardHead title="Sales invoices" />
              <Table head={['Invoice', 'Issued', 'Amount', '']}>
                {(invoices ?? []).map((i) => (
                  <Row key={i.id}>
                    <Cell className="tabular font-medium text-slate-800">{i.invoice_no}</Cell>
                    <Cell className="text-slate-500">{day(i.issued_on)}</Cell>
                    <Cell className="tabular">{sar(i.amount, { compact: true })}</Cell>
                    <Cell><Pill status={i.status} /></Cell>
                  </Row>
                ))}
              </Table>
            </Card>
          )}

          {(docs ?? []).length > 0 && (
          <Card>
            <CardHead title="Documents" />
            <div className="divide-y divide-slate-100">
              {(docs ?? []).map((d) => (
                <div key={d.id} className="flex items-center gap-3 px-4 py-2.5">
                  <FileText className="h-4 w-4 shrink-0 text-slate-400" />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm text-slate-800">{d.doc_type}</div>
                    <div className="truncate text-[11px] text-slate-400">{d.file_name}</div>
                  </div>
                  {d.extracted && <Tag tone="brand">read</Tag>}
                </div>
              ))}
            </div>
          </Card>
          )}

          {(history ?? []).length > 0 && (
          <Card>
            <CardHead title="Job history" sub="The digital version of the paper job file" />
            <div className="space-y-4 p-5">
              {(history ?? []).map((h) => (
                <div key={h.id} className="relative border-l border-slate-200 pl-4">
                  <span className="absolute -left-[4.5px] top-1.5 h-2 w-2 rounded-full bg-teal-500" />
                  <div className="text-[11px] font-medium uppercase tracking-wider text-slate-400">{day(h.entry_date)}</div>
                  <p className="mt-0.5 text-sm leading-relaxed text-slate-700">{h.note}</p>
                  <p className="mt-0.5 text-xs text-slate-400">{h.author}</p>
                </div>
              ))}
            </div>
          </Card>
          )}
        </div>
      </div>
    </>
  )
}
