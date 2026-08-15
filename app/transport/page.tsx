import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { Card, CardHead, PageHead, Stat, Pill, Table, Row, Cell, Tag, Bar } from '@/components/ui'
import { sar, num, stamp, titleCase } from '@/lib/format'
import { MapPin, Camera, Signature } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function Transport() {
  const [{ data: jobs }, { data: legs }, { data: allowances }, { data: slabs }, { data: dns }] = await Promise.all([
    supabase.from('jobs').select('*, clients(name)').eq('job_type', 'transport').order('opened_on', { ascending: false }),
    supabase.from('transport_details').select('*, trucks(plate_no,model,ownership), staff(full_name,base_city)'),
    supabase.from('trip_allowances').select('job_id,amount,basis'),
    supabase.from('allowance_slabs').select('*').order('min_km'),
    supabase.from('delivery_notes').select('job_id,dn_no,status,signature_captured'),
  ])

  const legByJob = new Map((legs ?? []).map((l) => [l.job_id, l]))
  const dnByJob = new Map((dns ?? []).map((d) => [d.job_id, d]))
  const allowByJob = new Map<string, number>()
  for (const a of allowances ?? []) allowByJob.set(a.job_id, (allowByJob.get(a.job_id) ?? 0) + Number(a.amount))

  const rows = jobs ?? []
  const totalKm = (legs ?? []).reduce((s, l) => s + Number(l.distance_km ?? 0), 0)
  const totalAllow = [...allowByJob.values()].reduce((a, b) => a + b, 0)
  const outsourced = (legs ?? []).filter((l) => l.trucks?.ownership === 'outsourced').length
  const active = rows.filter((j) => ['in_transit', 'in_progress'].includes(j.status)).length

  return (
    <>
      <PageHead
        title="Transport"
        sub="Every leg carries its own crew, distance and allowance calculation — not just a truck."
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        <Stat label="Transport jobs" value={num(rows.length)} hint={`${active} active right now`} />
        <Stat label="Distance run" value={`${num(totalKm)} km`} hint="Point-to-point, from the map" />
        <Stat label="Crew allowances" value={sar(totalAllow, { compact: true })} hint="Auto-calculated per slab" />
        <Stat label="Hired trucks used" value={num(outsourced)} hint={`of ${(legs ?? []).length} legs`} tone={outsourced > 2 ? 'warn' : 'good'} />
        <Stat label="Signed delivery notes" value={num((dns ?? []).filter((d) => d.signature_captured).length)} hint={`${(dns ?? []).length} issued`} />
      </div>

      <Card className="mt-6">
        <CardHead title="Transport jobs" sub="Pickup, destination, crew and the allowance the trip triggers" />
        <Table head={['Job no', 'Client', 'Route', 'Truck / Driver', 'Distance', 'Pickup', 'Delivered', 'Allowance', 'Proof', 'Status']}>
          {rows.map((j) => {
            const l = legByJob.get(j.id)
            const dn = dnByJob.get(j.id)
            return (
              <Row key={j.id}>
                <Cell>
                  <Link href={`/jobs/${encodeURIComponent(j.job_no)}`} className="font-medium text-teal-700 hover:underline">
                    {j.job_no}
                  </Link>
                </Cell>
                <Cell className="max-w-[160px] truncate">{j.clients?.name}</Cell>
                <Cell className="max-w-[300px]">
                  <span className="flex items-center gap-1.5 text-xs text-slate-600">
                    <MapPin className="h-3 w-3 shrink-0 text-slate-400" />
                    <span className="truncate">{l?.pickup_name}</span>
                    <span className="text-slate-300">→</span>
                    <span className="truncate font-medium text-slate-800">{j.consignee}</span>
                  </span>
                </Cell>
                <Cell className="text-xs text-slate-500">
                  <span className="tabular text-slate-700">{l?.trucks?.plate_no ?? '—'}</span>
                  {l?.trucks?.ownership === 'outsourced' && <Tag tone="amber">hired</Tag>}
                  <br />
                  {l?.staff?.full_name}
                </Cell>
                <Cell className="tabular font-medium">{l ? `${num(l.distance_km)} km` : '—'}</Cell>
                <Cell className="text-xs text-slate-500">{stamp(l?.pickup_at)}</Cell>
                <Cell className="text-xs text-slate-500">{stamp(l?.delivered_at)}</Cell>
                <Cell className="tabular">{allowByJob.get(j.id) ? sar(allowByJob.get(j.id)!) : '—'}</Cell>
                <Cell>
                  <span className="flex items-center gap-2 text-xs text-slate-500">
                    <span className="inline-flex items-center gap-1">
                      <Camera className="h-3.5 w-3.5 text-slate-400" />
                      {(l?.loading_photos ?? 0) + (l?.delivery_photos ?? 0)}
                    </span>
                    {dn?.signature_captured ? (
                      <Signature className="h-3.5 w-3.5 text-emerald-500" />
                    ) : (
                      <Signature className="h-3.5 w-3.5 text-slate-300" />
                    )}
                  </span>
                </Cell>
                <Cell><Pill status={j.status} /></Cell>
              </Row>
            )
          })}
        </Table>
      </Card>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHead title="Allowance slabs" sub="Distance decides overtime vs. trip allowance — no manual judgement" />
          <Table head={['Slab', 'Basis', 'Driver', 'Labour']}>
            {(slabs ?? []).map((s) => (
              <Row key={s.id}>
                <Cell className="font-medium text-slate-800">{s.label}</Cell>
                <Cell><Tag tone={s.basis === 'overtime' ? 'slate' : 'brand'}>{titleCase(s.basis)}</Tag></Cell>
                <Cell className="tabular">{sar(s.driver_rate)}</Cell>
                <Cell className="tabular">{sar(s.labour_rate)}</Cell>
              </Row>
            ))}
          </Table>
          <p className="border-t border-slate-100 px-5 py-3 text-xs leading-relaxed text-slate-500">
            Under 300 km and back the same day, the crew is paid overtime. Beyond that the trip allowance slab applies
            automatically — the distance comes from the pickup and drop pins, so it does not depend on the third-party
            GPS subscription staying live.
          </p>
        </Card>

        <Card>
          <CardHead title="Distance by leg" />
          <div className="space-y-3 p-5">
            {(legs ?? [])
              .slice()
              .sort((a, b) => Number(b.distance_km) - Number(a.distance_km))
              .map((l) => {
                const job = rows.find((j) => j.id === l.job_id)
                const max = Math.max(...(legs ?? []).map((x) => Number(x.distance_km)), 1)
                return (
                  <div key={l.job_id}>
                    <div className="mb-1 flex items-baseline justify-between text-xs">
                      <span className="truncate text-slate-600">
                        {job?.job_no} · {job?.consignee}
                      </span>
                      <span className="tabular font-medium text-slate-800">{num(l.distance_km)} km</span>
                    </div>
                    <Bar value={Number(l.distance_km)} max={max} tone={Number(l.distance_km) > 500 ? 'amber' : 'brand'} />
                  </div>
                )
              })}
          </div>
        </Card>
      </div>
    </>
  )
}
