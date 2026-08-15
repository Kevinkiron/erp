import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { Card, CardHead, PageHead, Stat, Pill, Table, Row, Cell, Tag } from '@/components/ui'
import { sar, num, day } from '@/lib/format'
import { Plane, Ship } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function Clearance() {
  const [{ data: jobs }, { data: duties }] = await Promise.all([
    supabase.from('jobs').select('*, clients(code,name)').eq('job_type', 'customs_clearance').order('opened_on', { ascending: false }),
    supabase.from('duty_charges').select('job_id,type,amount'),
  ])

  const rows = jobs ?? []
  const dutyByJob = new Map<string, number>()
  const pureDutyByJob = new Map<string, number>()
  for (const d of duties ?? []) {
    dutyByJob.set(d.job_id, (dutyByJob.get(d.job_id) ?? 0) + Number(d.amount))
    if (d.type === 'customs_duty') pureDutyByJob.set(d.job_id, (pureDutyByJob.get(d.job_id) ?? 0) + Number(d.amount))
  }

  const totalCharges = [...dutyByJob.values()].reduce((a, b) => a + b, 0)
  const pureDuty = [...pureDutyByJob.values()].reduce((a, b) => a + b, 0)
  const open = rows.filter((j) => !['completed', 'cancelled'].includes(j.status))
  const held = rows.filter((j) => j.status === 'on_hold')
  const avgDays = (() => {
    const cleared = rows.filter((j) => j.ata && j.cleared_on)
    if (!cleared.length) return 0
    const total = cleared.reduce((s, j) => s + (new Date(j.cleared_on!).getTime() - new Date(j.ata!).getTime()) / 86400000, 0)
    return total / cleared.length
  })()

  return (
    <>
      <PageHead
        title="Customs Clearance"
        sub="Job registry built from the Bill of Lading / Air Waybill and the commercial invoice."
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        <Stat label="Clearance jobs" value={num(rows.length)} hint={`${open.length} still open`} />
        <Stat label="Held / on hold" value={num(held.length)} hint="SFDA or HS code queries" tone={held.length ? 'bad' : 'good'} />
        <Stat label="Total customs charges" value={sar(totalCharges, { compact: true })} hint="Duty + VAT + port + handling" />
        <Stat label="Pure customs duty" value={sar(pureDuty, { compact: true })} hint="Split out for client queries" />
        <Stat label="Avg. clearance time" value={`${avgDays.toFixed(1)} days`} hint="Arrival to customs release" tone={avgDays < 6 ? 'good' : 'warn'} />
      </div>

      <Card className="mt-6">
        <CardHead title="Job registry" sub="Click a job number to open the full file" />
        <Table head={['Job no', 'Client', 'Batch', 'Mode', 'BL / AWB', 'Carrier', 'Port of entry', 'ETA', 'Cleared', 'Charges', 'Status']}>
          {rows.map((j) => (
            <Row key={j.id}>
              <Cell>
                <Link href={`/jobs/${encodeURIComponent(j.job_no)}`} className="font-medium text-teal-700 hover:underline">
                  {j.job_no}
                </Link>
              </Cell>
              <Cell className="max-w-[190px] truncate">{j.clients?.name}</Cell>
              <Cell className="tabular text-xs text-slate-500">{j.batch_no}</Cell>
              <Cell>
                <span className="inline-flex items-center gap-1.5 text-slate-600">
                  {j.mode === 'air' ? <Plane className="h-3.5 w-3.5 text-slate-400" /> : <Ship className="h-3.5 w-3.5 text-slate-400" />}
                  <span className="capitalize">{j.mode}</span>
                </span>
              </Cell>
              <Cell className="tabular text-xs">{j.bl_awb_no}</Cell>
              <Cell className="text-slate-500">{j.carrier}</Cell>
              <Cell className="max-w-[170px] truncate text-slate-500">{j.port_of_entry}</Cell>
              <Cell className="text-slate-500">{day(j.eta)}</Cell>
              <Cell>{j.cleared_on ? day(j.cleared_on) : <Tag tone="amber">pending</Tag>}</Cell>
              <Cell className="tabular">{dutyByJob.get(j.id) ? sar(dutyByJob.get(j.id)!, { compact: true }) : '—'}</Cell>
              <Cell><Pill status={j.status} /></Cell>
            </Row>
          ))}
        </Table>
      </Card>
    </>
  )
}
