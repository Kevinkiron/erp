import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { Card, CardHead, PageHead, Stat, Pill, Table, Row, Cell, Tag, Bar } from '@/components/ui'
import { sar, num, day, stamp, titleCase } from '@/lib/format'
import { ScanBarcode } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function WarehousePage() {
  const [{ data: warehouses }, { data: movements }, { data: contracts }, { data: jobs }] = await Promise.all([
    supabase.from('warehouses').select('*').order('code'),
    supabase.from('stock_movements').select('*, stock_items(sku,description,category,unit_value_sar), warehouses(code,name), jobs(job_no)').order('moved_at', { ascending: false }),
    supabase.from('storage_contracts').select('*, clients(name), warehouses(code,name)'),
    supabase.from('jobs').select('*, clients(name)').eq('job_type', 'warehousing').order('opened_on', { ascending: false }),
  ])

  const mv = movements ?? []
  const signed = (d: string, q: number) => (d === 'out' ? -q : q)

  // stock on hand by batch
  const byBatch = new Map<string, { batch: string; item: string; sku: string; qty: number; value: number; wh: string; pallet: string }>()
  for (const m of mv) {
    const k = `${m.batch_no}|${m.item_id}`
    const cur = byBatch.get(k) ?? {
      batch: m.batch_no, item: m.stock_items?.description ?? '', sku: m.stock_items?.sku ?? '',
      qty: 0, value: 0, wh: m.warehouses?.code ?? '', pallet: m.pallet_no ?? '',
    }
    cur.qty += signed(m.direction, Number(m.qty))
    cur.value = cur.qty * Number(m.stock_items?.unit_value_sar ?? 0)
    byBatch.set(k, cur)
  }
  const onHand = [...byBatch.values()].filter((b) => b.qty > 0).sort((a, b) => b.value - a.value)
  const totalValue = onHand.reduce((s, b) => s + b.value, 0)
  const totalQty = onHand.reduce((s, b) => s + b.qty, 0)

  const occByWh = new Map<string, number>()
  for (const b of onHand) occByWh.set(b.wh, (occByWh.get(b.wh) ?? 0) + b.qty)

  return (
    <>
      <PageHead
        title="Warehouse"
        sub="Batch-tracked inventory with barcode and pallet references — the layer Siemens currently runs in SAP."
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat label="Stock on hand" value={num(totalQty)} hint="Packages across all sites" />
        <Stat label="Inventory value" value={sar(totalValue, { compact: true })} hint="At declared unit value" />
        <Stat label="Movements logged" value={num(mv.length)} hint="Scanned in and out" />
        <Stat label="Storage contracts" value={num((contracts ?? []).length)} hint="Per-pallet, monthly and annual" />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-4">
        {(warehouses ?? []).map((w) => {
          const used = occByWh.get(w.code) ?? 0
          return (
            <Card key={w.id} className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-sm font-semibold text-slate-900">{w.name}</div>
                  <div className="text-xs text-slate-500">{w.city} · {w.code}</div>
                </div>
                <Tag tone={w.operated_by?.startsWith('Al Fahad') ? 'brand' : 'amber'}>{w.operated_by}</Tag>
              </div>
              <div className="mt-4 mb-1.5 flex items-baseline justify-between text-xs">
                <span className="text-slate-500">Occupancy</span>
                <span className="tabular text-slate-800">{num(used)} / {num(w.capacity_pallets)} pallets</span>
              </div>
              <Bar value={used} max={w.capacity_pallets} tone="brand" />
            </Card>
          )
        })}
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHead title="Stock on hand by batch" sub="Batch number is the identifier that survives across PO splits" />
          <Table head={['Batch', 'SKU', 'Item', 'Warehouse', 'Pallet', 'Qty', 'Value']}>
            {onHand.map((b) => (
              <Row key={b.batch + b.sku}>
                <Cell className="tabular text-xs font-medium text-slate-800">{b.batch}</Cell>
                <Cell className="tabular text-xs text-slate-500">{b.sku}</Cell>
                <Cell className="max-w-[240px] truncate">{b.item}</Cell>
                <Cell className="text-slate-500">{b.wh}</Cell>
                <Cell className="tabular text-xs text-slate-500">{b.pallet}</Cell>
                <Cell className="tabular">{num(b.qty)}</Cell>
                <Cell className="tabular">{sar(b.value, { compact: true })}</Cell>
              </Row>
            ))}
          </Table>
        </Card>

        <Card>
          <CardHead title="Storage contracts" sub="Quotation basis varies by client" />
          <div className="divide-y divide-slate-100">
            {(contracts ?? []).map((c) => (
              <div key={c.id} className="px-5 py-3.5">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-800">{c.clients?.name}</span>
                  <Tag tone="brand">{titleCase(c.basis)}</Tag>
                </div>
                <div className="tabular mt-1 text-xs text-slate-500">
                  {sar(c.rate_sar)} · {num(c.pallets)} pallets · {c.warehouses?.code}
                </div>
                <div className="mt-0.5 text-xs text-slate-400">
                  {day(c.starts_on)} → {day(c.ends_on)}
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHead
          title="Movement log"
          sub="Every in and out is scanned at the pallet"
          right={
            <span className="inline-flex items-center gap-1.5 text-xs text-slate-500">
              <ScanBarcode className="h-3.5 w-3.5" /> Barcode captured on the handheld
            </span>
          }
        />
        <Table head={['When', 'Dir', 'Item', 'Batch', 'PO', 'Qty', 'Pallet', 'Barcode', 'Bin', 'Job', 'By']}>
          {mv.map((m) => (
            <Row key={m.id}>
              <Cell className="text-xs text-slate-500">{stamp(m.moved_at)}</Cell>
              <Cell><Tag tone={m.direction === 'in' ? 'brand' : m.direction === 'out' ? 'amber' : 'rose'}>{m.direction}</Tag></Cell>
              <Cell className="max-w-[220px] truncate">{m.stock_items?.description}</Cell>
              <Cell className="tabular text-xs text-slate-500">{m.batch_no}</Cell>
              <Cell className="tabular text-xs text-slate-500">{m.po_no}</Cell>
              <Cell className="tabular">{num(m.qty)}</Cell>
              <Cell className="tabular text-xs text-slate-500">{m.pallet_no}</Cell>
              <Cell className="tabular text-xs text-slate-500">{m.barcode}</Cell>
              <Cell className="text-slate-500">{m.location_bin}</Cell>
              <Cell className="text-xs">
                {m.jobs?.job_no ? (
                  <Link href={`/jobs/${encodeURIComponent(m.jobs.job_no)}`} className="text-teal-700 hover:underline">
                    {m.jobs.job_no}
                  </Link>
                ) : (
                  <span className="text-slate-300">—</span>
                )}
              </Cell>
              <Cell className="text-xs text-slate-500">{m.handled_by}</Cell>
            </Row>
          ))}
        </Table>
      </Card>

      <Card className="mt-6">
        <CardHead title="Warehousing jobs" />
        <Table head={['Job no', 'Client', 'Batch', 'Description', 'Opened', 'Revenue', 'Status']}>
          {(jobs ?? []).map((j) => (
            <Row key={j.id}>
              <Cell>
                <Link href={`/jobs/${encodeURIComponent(j.job_no)}`} className="font-medium text-teal-700 hover:underline">
                  {j.job_no}
                </Link>
              </Cell>
              <Cell className="max-w-[180px] truncate">{j.clients?.name}</Cell>
              <Cell className="tabular text-xs text-slate-500">{j.batch_no}</Cell>
              <Cell className="max-w-[320px] truncate text-slate-600">{j.goods_description}</Cell>
              <Cell className="text-slate-500">{day(j.opened_on)}</Cell>
              <Cell className="tabular">{sar(j.revenue_sar, { compact: true })}</Cell>
              <Cell><Pill status={j.status} /></Cell>
            </Row>
          ))}
        </Table>
      </Card>
    </>
  )
}
