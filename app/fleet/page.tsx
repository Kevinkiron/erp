import { supabase } from '@/lib/supabase'
import { Card, CardHead, PageHead, Stat, Table, Row, Cell, Tag, Bar } from '@/components/ui'
import { sar, num, stamp } from '@/lib/format'
import { Star } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function Fleet() {
  const [{ data: fleet }, { data: perf }, { data: staff }, { data: crew }] = await Promise.all([
    supabase.from('v_fleet_utilisation').select('*').order('km_run', { ascending: false }),
    supabase.from('v_driver_performance').select('*').order('km_run', { ascending: false }),
    supabase.from('staff').select('*').order('emp_no'),
    supabase.from('transport_crew').select('staff_id,hours,source'),
  ])

  const trucks = fleet ?? []
  const drivers = (perf ?? []).filter((p) => p.role === 'driver')
  const labour = (staff ?? []).filter((s) => s.role === 'labour')
  const hoursByStaff = new Map<string, number>()
  for (const c of crew ?? []) hoursByStaff.set(c.staff_id, (hoursByStaff.get(c.staff_id) ?? 0) + Number(c.hours ?? 0))

  const idle = trucks.filter((t) => t.active && Number(t.trips) === 0)
  const hired = trucks.filter((t) => t.ownership === 'outsourced')
  const hiredUsed = hired.filter((t) => Number(t.trips) > 0)
  const outsourcedLabour = labour.filter((l) => l.employment === 'outsourced')
  const maxKm = Math.max(...trucks.map((t) => Number(t.km_run)), 1)

  return (
    <>
      <PageHead
        title="Fleet & Crew"
        sub="The report that answers: do we buy another truck, or hire one more labourer?"
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        <Stat label="Own trucks" value={num(trucks.filter((t) => t.ownership === 'own').length)} hint={`${idle.length} idle`} tone={idle.length > 2 ? 'warn' : 'good'} />
        <Stat label="Hired trucks used" value={`${hiredUsed.length} / ${hired.length}`} hint="If this stays high, buy" tone={hiredUsed.length >= 2 ? 'warn' : 'good'} />
        <Stat label="Own labour" value={num(labour.filter((l) => l.employment === 'own').length)} />
        <Stat label="Outsourced labour" value={num(outsourcedLabour.length)} hint="Recruit if consistently needed" tone={outsourcedLabour.length >= 3 ? 'warn' : 'good'} />
        <Stat label="Total km run" value={num(trucks.reduce((s, t) => s + Number(t.km_run), 0))} />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHead title="Truck utilisation" sub="Trips and distance in the period" />
          <Table head={['Plate', 'Model', 'Cap.', 'Ownership', 'Trips', 'Km run', 'Last used', '']}>
            {trucks.map((t) => (
              <Row key={t.id}>
                <Cell className="tabular font-medium text-slate-800">{t.plate_no}</Cell>
                <Cell className="max-w-[150px] truncate text-slate-500">{t.model}</Cell>
                <Cell className="tabular text-slate-500">{num(t.capacity_tons, 1)} t</Cell>
                <Cell><Tag tone={t.ownership === 'own' ? 'brand' : 'amber'}>{t.ownership}</Tag></Cell>
                <Cell className="tabular">{num(t.trips)}</Cell>
                <Cell className="tabular">{num(t.km_run)}</Cell>
                <Cell className="text-xs text-slate-500">{t.last_used_at ? stamp(t.last_used_at) : <span className="text-amber-600">never</span>}</Cell>
                <Cell className="w-28"><Bar value={Number(t.km_run)} max={maxKm} tone={Number(t.km_run) === 0 ? 'slate' : 'brand'} /></Cell>
              </Row>
            ))}
          </Table>
        </Card>

        <Card>
          <CardHead title="Driver performance" sub="Trips, distance and allowances earned" />
          <Table head={['Emp no', 'Driver', 'Base', 'Type', 'Trips', 'Km', 'Allowances', 'Rating']}>
            {drivers.map((d) => (
              <Row key={d.id}>
                <Cell className="tabular text-xs text-slate-500">{d.emp_no}</Cell>
                <Cell className="font-medium text-slate-800">{d.full_name}</Cell>
                <Cell className="text-slate-500">{d.base_city}</Cell>
                <Cell><Tag tone={d.employment === 'own' ? 'brand' : 'amber'}>{d.employment}</Tag></Cell>
                <Cell className="tabular">{num(d.trips)}</Cell>
                <Cell className="tabular">{num(d.km_run)}</Cell>
                <Cell className="tabular">{sar(d.allowances_sar)}</Cell>
                <Cell>
                  <span className="inline-flex items-center gap-1 text-slate-700">
                    <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                    <span className="tabular">{Number(d.rating).toFixed(2)}</span>
                  </span>
                </Cell>
              </Row>
            ))}
          </Table>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHead title="Labour roster" sub="Hours logged on transport jobs — the basis for the hire-vs-recruit decision" />
        <Table head={['Emp no', 'Name', 'Base', 'Source', 'Hours on jobs', 'Rating', 'Active']}>
          {labour.map((l) => (
            <Row key={l.id}>
              <Cell className="tabular text-xs text-slate-500">{l.emp_no}</Cell>
              <Cell className="font-medium text-slate-800">{l.full_name}</Cell>
              <Cell className="text-slate-500">{l.base_city}</Cell>
              <Cell><Tag tone={l.employment === 'own' ? 'brand' : 'amber'}>{l.employment}</Tag></Cell>
              <Cell className="tabular">{num(hoursByStaff.get(l.id) ?? 0, 1)}</Cell>
              <Cell className="tabular">{Number(l.rating).toFixed(2)}</Cell>
              <Cell>{l.active ? <Tag tone="brand">yes</Tag> : <Tag tone="rose">no</Tag>}</Cell>
            </Row>
          ))}
        </Table>
      </Card>
    </>
  )
}
