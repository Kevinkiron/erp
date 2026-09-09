import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { getPnl, getDutyBalances, DUTY_ALERT_THRESHOLD } from '@/lib/db'
import { Card, CardHead, PageHead, Stat, Pill, Table, Row, Cell, Empty } from '@/components/ui'
import { Pipeline } from '@/components/charts/basic'
import { sar, num, day, stamp, JOB_TYPE_LABEL } from '@/lib/format'
import { AlertTriangle, ArrowRight, Truck, PackageSearch } from 'lucide-react'

export const dynamic = 'force-dynamic'

const OPEN = ['draft', 'documents_pending', 'in_progress', 'cleared', 'in_warehouse', 'in_transit', 'on_hold']

export default async function Dashboard() {
  const [{ data: jobs }, pnl, balances, { data: trips }, { data: fleet }] = await Promise.all([
    supabase.from('jobs').select('*, clients(code,name)').order('opened_on', { ascending: false }),
    getPnl(),
    getDutyBalances(),
    supabase
      .from('transport_details')
      .select('*, jobs(job_no,status,consignee,clients(name)), trucks(plate_no), staff(full_name)')
      .order('pickup_at', { ascending: false })
      .limit(6),
    supabase.from('v_fleet_utilisation').select('*'),
  ])

  const all = jobs ?? []
  const open = all.filter((j) => OPEN.includes(j.status))
  const alerts = balances.filter((b) => Number(b.balance_sar) < DUTY_ALERT_THRESHOLD)
  const critical = balances.filter((b) => Number(b.balance_sar) < 0)
  const unbilled = pnl.filter((p) => p.unbilled && Number(p.revenue_sar) > 0 && !['draft', 'cancelled'].includes(p.status))
  const mtd = pnl.filter((p) => (p.opened_on ?? '') >= '2026-07-01')
  const mtdNet = mtd.reduce((s, p) => s + Number(p.net_pnl_sar), 0)
  const mtdRev = mtd.reduce((s, p) => s + Number(p.revenue_sar), 0)
  const dutyPaid = pnl.reduce((s, p) => s + Number(p.duty_paid_sar), 0)
  const idle = (fleet ?? []).filter((t) => t.active && Number(t.trips) === 0)

  const stages = [
    { key: 'customs_clearance', label: 'Customs Clearance' },
    { key: 'warehousing', label: 'Warehousing' },
    { key: 'transport', label: 'Transport' },
    { key: 'installation', label: 'Installation' },
  ].map((s) => ({
    ...s,
    open: open.filter((j) => j.job_type === s.key).length,
    total: all.filter((j) => j.job_type === s.key).length,
  }))
  const pipeline = stages.map((s) => ({
    stage: s.label,
    open: s.open,
    total: s.total,
    label: `${s.open} open / ${s.total}`,
  }))

  return (
    <>
      <PageHead
        title="Command Centre"
        sub="Every consignment, from customs release through to installation handover."
      />

      {alerts.length > 0 && (
        <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50/70 p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-amber-900">
                {alerts.length} customs duty advance {alerts.length === 1 ? 'account needs' : 'accounts need'} a top-up
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {alerts.map((b) => (
                  <span
                    key={b.client_id}
                    className={`tabular rounded-lg px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${
                      Number(b.balance_sar) < 0
                        ? 'bg-rose-100 text-rose-800 ring-rose-300'
                        : 'bg-white text-amber-800 ring-amber-300'
                    }`}
                  >
                    {b.client_name}: {sar(b.balance_sar)}
                    {Number(b.balance_sar) < 0 && ' — overdrawn'}
                  </span>
                ))}
              </div>
              <p className="mt-2 text-xs text-amber-800/80">
                Threshold is {sar(DUTY_ALERT_THRESHOLD)}. {critical.length > 0 && 'Duty payments on overdrawn accounts are blocked until a transfer is received. '}
                <Link href="/duty" className="font-medium underline underline-offset-2">
                  Open the duty ledger
                </Link>
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-6">
        <Stat label="Open jobs" value={num(open.length)} hint={`${all.length} total this year`} />
        <Stat label="In transit now" value={num(all.filter((j) => j.status === 'in_transit').length)} hint="Trucks on the road" href="/transport" />
        <Stat label="Held at port" value={num(all.filter((j) => j.status === 'on_hold').length)} hint="Demurrage accruing" tone="bad" href="/clearance" />
        <Stat label="Revenue (Jul–Aug)" value={sar(mtdRev, { compact: true })} hint={`Net ${sar(mtdNet, { compact: true })}`} tone="good" href="/reports" />
        <Stat label="Duty paid YTD" value={sar(dutyPaid, { compact: true })} hint="Across all clients" href="/duty" />
        <Stat label="Unbilled jobs" value={num(unbilled.length)} hint="Work done, no invoice raised" tone={unbilled.length ? 'warn' : 'good'} href="/reports" />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-1">
          <CardHead title="Job pipeline" sub="Jobs per stage, in the order they flow" />
          <Pipeline data={pipeline} />
        </Card>

        <Card className="xl:col-span-2">
          <CardHead
            title="Movements"
            sub="Latest pickups and deliveries"
            right={
              <Link href="/transport" className="inline-flex items-center gap-1 text-xs font-medium text-teal-700 hover:text-teal-800">
                All transport <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            }
          />
          {(trips ?? []).length === 0 ? (
            <Empty>No movements recorded.</Empty>
          ) : (
            <Table head={['Job', 'Destination', 'Truck / Driver', 'Distance', 'Picked up', 'Status']}>
              {(trips ?? []).map((t) => (
                <Row key={t.job_id}>
                  <Cell>
                    <Link href={`/jobs/${encodeURIComponent(t.jobs?.job_no ?? '')}`} className="font-medium text-teal-700 hover:underline">
                      {t.jobs?.job_no}
                    </Link>
                  </Cell>
                  <Cell className="max-w-[220px] truncate">{t.jobs?.consignee ?? t.drop_address}</Cell>
                  <Cell className="text-slate-500">
                    <span className="text-slate-700">{t.trucks?.plate_no}</span> · {t.staff?.full_name}
                  </Cell>
                  <Cell className="tabular">{num(t.distance_km)} km</Cell>
                  <Cell className="text-slate-500">{stamp(t.pickup_at)}</Cell>
                  <Cell><Pill status={t.jobs?.status} /></Cell>
                </Row>
              ))}
            </Table>
          )}
        </Card>
      </div>

      <div className="mt-6 grid items-start gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHead
            title="Recently opened jobs"
            right={
              <Link href="/clearance" className="inline-flex items-center gap-1 text-xs font-medium text-teal-700 hover:text-teal-800">
                Clearance registry <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            }
          />
          <Table head={['Job no', 'Type', 'Client', 'Batch', 'BL / AWB', 'Opened', 'Status']}>
            {all.slice(0, 9).map((j) => (
              <Row key={j.id}>
                <Cell>
                  <Link href={`/jobs/${encodeURIComponent(j.job_no)}`} className="font-medium text-teal-700 hover:underline">
                    {j.job_no}
                  </Link>
                </Cell>
                <Cell className="text-slate-500">{JOB_TYPE_LABEL[j.job_type]}</Cell>
                <Cell className="max-w-[180px] truncate">{j.clients?.name}</Cell>
                <Cell className="tabular text-xs text-slate-500">{j.batch_no ?? '—'}</Cell>
                <Cell className="tabular text-xs text-slate-500">{j.bl_awb_no ?? '—'}</Cell>
                <Cell className="text-slate-500">{day(j.opened_on)}</Cell>
                <Cell><Pill status={j.status} /></Cell>
              </Row>
            ))}
          </Table>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHead title="Fleet at a glance" sub="Utilisation drives the buy-or-hire call" />
            <div className="p-5">
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="rounded-lg bg-slate-50 py-3">
                  <div className="tabular text-lg font-semibold text-slate-900">{(fleet ?? []).filter((t) => t.ownership === 'own').length}</div>
                  <div className="text-[11px] text-slate-500">Own trucks</div>
                </div>
                <div className="rounded-lg bg-slate-50 py-3">
                  <div className="tabular text-lg font-semibold text-slate-900">{(fleet ?? []).filter((t) => t.ownership === 'outsourced').length}</div>
                  <div className="text-[11px] text-slate-500">Hired</div>
                </div>
                <div className="rounded-lg bg-amber-50 py-3">
                  <div className="tabular text-lg font-semibold text-amber-700">{idle.length}</div>
                  <div className="text-[11px] text-amber-700">Idle</div>
                </div>
              </div>
              <div className="mt-4 space-y-2">
                {idle.slice(0, 5).map((t) => (
                  <div key={t.id} className="flex items-center justify-between rounded-lg border border-slate-100 px-3 py-2 text-xs">
                    <span className="flex items-center gap-2 text-slate-700">
                      <Truck className="h-3.5 w-3.5 text-slate-400" />
                      {t.plate_no}
                    </span>
                    <span className="text-slate-400">{t.model}</span>
                  </div>
                ))}
              </div>
              <Link href="/fleet" className="mt-4 inline-flex items-center gap-1 text-xs font-medium text-teal-700 hover:text-teal-800">
                Fleet &amp; crew performance <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </Card>

          <Card>
            <CardHead title="Needs attention" />
            <div className="divide-y divide-slate-100">
              {unbilled.slice(0, 4).map((p) => (
                <div key={p.id} className="flex items-start gap-3 px-5 py-3">
                  <PackageSearch className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
                  <div className="min-w-0 flex-1">
                    <Link href={`/jobs/${encodeURIComponent(p.job_no)}`} className="text-sm font-medium text-slate-800 hover:text-teal-700">
                      {p.job_no}
                    </Link>
                    <p className="text-xs text-slate-500">
                      {p.client_name} · {sar(p.revenue_sar, { compact: true })} of work with no invoice raised
                    </p>
                  </div>
                </div>
              ))}
              {unbilled.length === 0 && <Empty>Everything is billed.</Empty>}
            </div>
          </Card>
        </div>
      </div>
    </>
  )
}
