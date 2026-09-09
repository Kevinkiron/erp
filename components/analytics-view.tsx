'use client'

import { useState } from 'react'
import {
  Bar, BarChart, CartesianGrid, Cell, Line, LineChart, ReferenceLine,
  ResponsiveContainer, Tooltip, XAxis, YAxis, LabelList,
} from 'recharts'
import { AlertTriangle, CheckCircle2, TrendingDown } from 'lucide-react'
import { CategoryTick, ChartCard, StatTile, VizLegend, VizTooltip } from '@/components/charts/chrome'
import {
  AXIS_TICK, BAR_MAX, BAR_RADIUS, BAR_RADIUS_H, INK, SERIES, STATUS, sarAxis, sarFull,
} from '@/lib/viz'
import { titleCase } from '@/lib/format'

type Pnl = {
  job_no: string; job_type: string; status: string; client_name: string | null
  opened_on: string | null; revenue_sar: number; expense_sar: number
  duty_paid_sar: number; net_pnl_sar: number; unbilled: boolean
}
type Duty = { type: string; amount: number; paid_on: string | null; client_name: string | null }
type Cycle = { job_no: string; client_name: string | null; mode: string | null; cleared_on: string; days: number }
type Fleet = { plate_no: string; model: string; ownership: string; active: boolean; trips: number; km_run: number }
type Balance = { client_id: string; client_name: string; advance_received: number; advance_utilised: number; balance_sar: number }
type Invoice = { invoice_no: string; issued_on: string; amount: number; status: string }

const TODAY = '2026-08-15'
const RANGES = [
  { key: 'all', label: 'All time', from: '2026-01-01' },
  { key: 'ytd', label: 'Year to date', from: '2026-01-01' },
  { key: '90', label: 'Last 90 days', from: '2026-05-17' },
  { key: '30', label: 'Last 30 days', from: '2026-07-16' },
] as const

const MONTHS = ['2026-03', '2026-04', '2026-05', '2026-06', '2026-07', '2026-08']
const monthLabel = (m: string) =>
  new Date(`${m}-01T00:00:00Z`).toLocaleDateString('en-GB', { month: 'short', timeZone: 'UTC' })

const DUTY_TYPES = ['customs_duty', 'vat', 'port_storage', 'handling', 'other'] as const
const DUTY_LABEL: Record<string, string> = {
  customs_duty: 'Customs duty', vat: 'VAT', port_storage: 'Port storage',
  handling: 'Handling', other: 'Other charges',
}
const DUTY_ALERT = 300000
const CLEARANCE_TARGET = 5

export default function AnalyticsView({
  pnl, duty, cycle, fleet, balances, invoices, clients,
}: {
  pnl: Pnl[]; duty: Duty[]; cycle: Cycle[]; fleet: Fleet[]
  balances: Balance[]; invoices: Invoice[]; clients: string[]
}) {
  const [range, setRange] = useState<(typeof RANGES)[number]['key']>('all')
  const [client, setClient] = useState<string>('all')

  const from = RANGES.find((r) => r.key === range)!.from
  const inScope = (date: string | null | undefined) => !!date && date >= from && date <= TODAY
  const forClient = (name: string | null | undefined) => client === 'all' || name === client

  // ---------------------------------------------------------------- slices
  // The dataset is small enough to re-slice on every render; memoising it would
  // only add a stale-closure trap around the two filter values.
  const jobs = pnl.filter((p) => inScope(p.opened_on) && forClient(p.client_name))
  const dutyRows = duty.filter((d) => inScope(d.paid_on) && forClient(d.client_name))
  const cycleRows = cycle.filter((c) => inScope(c.cleared_on) && forClient(c.client_name))
  const months = MONTHS.filter((m) => `${m}-28` >= from)

  // ---------------------------------------------------------------- headline
  const revenue = jobs.reduce((s, j) => s + Number(j.revenue_sar), 0)
  const cost = jobs.reduce((s, j) => s + Number(j.expense_sar), 0)
  const net = revenue - cost
  const margin = revenue > 0 ? (net / revenue) * 100 : 0
  const unbilled = jobs.filter((j) => j.unbilled && Number(j.revenue_sar) > 0)
  const unbilledValue = unbilled.reduce((s, j) => s + Number(j.revenue_sar), 0)
  const avgDays = cycleRows.length
    ? cycleRows.reduce((s, c) => s + c.days, 0) / cycleRows.length
    : 0

  const netByMonth = months.map((m) => {
    const rows = jobs.filter((j) => (j.opened_on ?? '').startsWith(m))
    return rows.reduce((s, j) => s + Number(j.net_pnl_sar), 0)
  })

  // ---------------------------------------------------------------- series
  const revenueVsCost = months.map((m) => {
    const rows = jobs.filter((j) => (j.opened_on ?? '').startsWith(m))
    return {
      month: monthLabel(m),
      Revenue: rows.reduce((s, j) => s + Number(j.revenue_sar), 0),
      'Direct cost': rows.reduce((s, j) => s + Number(j.expense_sar), 0),
    }
  })

  const byLine = ['customs_clearance', 'warehousing', 'transport', 'installation', 'freight_forwarding']
    .map((k) => {
      const rows = jobs.filter((j) => j.job_type === k)
      const rev = rows.reduce((s, j) => s + Number(j.revenue_sar), 0)
      const exp = rows.reduce((s, j) => s + Number(j.expense_sar), 0)
      return { line: titleCase(k), jobs: rows.length, revenue: rev, cost: exp, net: rev - exp,
               margin: rev > 0 ? ((rev - exp) / rev) * 100 : 0 }
    })
    .filter((l) => l.jobs > 0)
    .sort((a, b) => b.net - a.net)

  const cycleByMonth = months
    .map((m) => {
      const rows = cycleRows.filter((c) => c.cleared_on.startsWith(m))
      return {
        month: monthLabel(m),
        days: rows.length ? Number((rows.reduce((s, c) => s + c.days, 0) / rows.length).toFixed(1)) : null,
        jobs: rows.length,
      }
    })
    .filter((r) => r.days !== null)
  const cycleSeries = cycleByMonth.map((r, i) => ({
    ...r,
    endLabel: i === cycleByMonth.length - 1 ? `${r.days}d` : '',
  }))

  // Split by client rather than by month: the question this answers is the one
  // Ameer's clients ask — "what was the pure duty, without the other charges?" —
  // and full-width rows give the small charge types enough pixels to be seen.
  const dutyByClient = [...new Set(dutyRows.map((d) => d.client_name).filter(Boolean))]
    .map((name) => {
      const rows = dutyRows.filter((d) => d.client_name === name)
      const bucket = (t: string) => rows.filter((r) => r.type === t).reduce((s, r) => s + r.amount, 0)
      const shortName = (name as string)
        .replace(/ - Riyadh Cluster$/, '')
        .replace(/ (Saudi Arabia|Arabia|Ltd|LLC|Medical Systems ME|HealthCare Arabia)$/, '')
        .replace(/^GE HealthCare.*/, 'GE HealthCare')
      return {
        client: shortName.length > 20 ? `${shortName.slice(0, 19)}…` : shortName,
        fullName: name as string,
        total: rows.reduce((s, r) => s + r.amount, 0),
        [DUTY_LABEL.customs_duty]: bucket('customs_duty'),
        [DUTY_LABEL.vat]: bucket('vat'),
        [DUTY_LABEL.port_storage]: bucket('port_storage'),
        [DUTY_LABEL.handling]: bucket('handling'),
        [DUTY_LABEL.other]: rows
          .filter((r) => !DUTY_TYPES.includes(r.type as never))
          .reduce((s, r) => s + r.amount, 0),
      }
    })
    .sort((a, b) => b.total - a.total)

  const fleetRows = [...fleet]
    .filter((t) => t.active)
    .sort((a, b) => Number(b.km_run) - Number(a.km_run))
    .map((t) => ({ plate: t.plate_no, km: Number(t.km_run), trips: t.trips, model: t.model, idle: t.trips === 0 }))
  const idleCount = fleetRows.filter((t) => t.idle).length

  const headroom = balances
    .filter((b) => forClient(b.client_name))
    .map((b) => {
      const bal = Number(b.balance_sar)
      return {
        ...b,
        bal,
        pct: Number(b.advance_received) > 0 ? Math.max(0, bal / Number(b.advance_received)) : 0,
        state: bal < 0 ? 'critical' : bal < DUTY_ALERT ? 'warning' : 'good',
      }
    })
    .sort((a, b) => a.bal - b.bal)

  const overdue = invoices.filter((i) => i.status === 'overdue')
  const outstanding = invoices.filter((i) => i.status !== 'paid').reduce((s, i) => s + Number(i.amount), 0)

  // ---------------------------------------------------------------- render
  return (
    <>
      {/* One filter row, above everything it scopes. */}
      <div className="mb-6 flex flex-wrap items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3">
        <div className="inline-flex rounded-lg border border-slate-200 p-0.5">
          {RANGES.map((r) => (
            <button
              key={r.key}
              onClick={() => setRange(r.key)}
              aria-pressed={range === r.key}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition ${
                range === r.key ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
        <select
          value={client}
          onChange={(e) => setClient(e.target.value)}
          className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-700 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/25"
        >
          <option value="all">All clients</option>
          {clients.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <span className="ml-auto text-xs text-slate-400">
          {jobs.length} jobs in this slice
        </span>
      </div>

      {/* Hero figure — exactly one per view — plus the supporting tiles. */}
      <div className="mb-6 grid gap-4 lg:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-[0_1px_2px_rgba(16,37,58,0.04)] lg:col-span-1">
          <div className="text-[11px] font-medium uppercase tracking-wider text-slate-500">Net profit</div>
          <div className={`mt-2 text-5xl font-semibold leading-none tracking-tight ${net >= 0 ? 'text-slate-900' : 'text-rose-700'}`}>
            {net >= 1_000_000 ? `${(net / 1_000_000).toFixed(2)}M` : `${Math.round(net / 1000)}k`}
          </div>
          <div className="mt-2 text-xs text-slate-500">
            SAR · {margin.toFixed(1)}% margin · {sarFull(cost)} direct cost
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-3 lg:col-span-3">
          <StatTile
            label="Revenue" value={sarFull(revenue)}
            hint={`${jobs.length} jobs`} spark={netByMonth.map((v) => Math.max(v, 0))}
          />
          <StatTile
            label="Avg. clearance time" value={`${avgDays.toFixed(1)} days`}
            tone={avgDays <= CLEARANCE_TARGET ? 'good' : 'warn'}
            hint={`target ${CLEARANCE_TARGET} days · ${cycleRows.length} released`}
          />
          <StatTile
            label="Unbilled work" value={sarFull(unbilledValue)}
            tone={unbilled.length ? 'warn' : 'good'}
            hint={`${unbilled.length} jobs · ${sarFull(outstanding)} outstanding`}
          />
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        {/* Two series, one SAR axis — never two scales. */}
        <ChartCard
          title="Revenue vs direct cost"
          sub="Jobs grouped by the month they were opened"
          legend={<VizLegend items={[{ name: 'Revenue', color: SERIES[0] }, { name: 'Direct cost', color: SERIES[1] }]} />}
          table={{
            head: ['Month', 'Revenue', 'Direct cost', 'Net'],
            rows: revenueVsCost.map((r) => [
              r.month, sarFull(r.Revenue), sarFull(r['Direct cost']), sarFull(r.Revenue - r['Direct cost']),
            ]),
          }}
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={revenueVsCost} margin={{ top: 8, right: 12, bottom: 4, left: 4 }} barGap={2}>
              <CartesianGrid vertical={false} stroke={INK.grid} />
              <XAxis dataKey="month" tick={AXIS_TICK} tickLine={false} axisLine={{ stroke: INK.axis }} />
              <YAxis tickFormatter={sarAxis} tick={AXIS_TICK} tickLine={false} axisLine={false} width={44} />
              <Tooltip cursor={{ fill: 'rgba(15,36,56,0.04)' }} content={<VizTooltip format={sarFull} />} />
              <Bar dataKey="Revenue" fill={SERIES[0]} maxBarSize={BAR_MAX} radius={BAR_RADIUS} />
              <Bar dataKey="Direct cost" fill={SERIES[1]} maxBarSize={BAR_MAX} radius={BAR_RADIUS} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* One series → one colour for every bar, value direct-labelled at the tip. */}
        <ChartCard
          title="Net profit by service line"
          sub="Which part of the business actually earns"
          table={{
            head: ['Service line', 'Jobs', 'Revenue', 'Cost', 'Net', 'Margin'],
            rows: byLine.map((l) => [
              l.line, l.jobs, sarFull(l.revenue), sarFull(l.cost), sarFull(l.net), `${l.margin.toFixed(0)}%`,
            ]),
          }}
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={byLine} layout="vertical" margin={{ top: 4, right: 64, bottom: 4, left: 4 }}>
              <CartesianGrid horizontal={false} stroke={INK.grid} />
              <XAxis type="number" tickFormatter={sarAxis} tick={AXIS_TICK} tickLine={false} axisLine={false} />
              <YAxis
                type="category" dataKey="line" interval={0} tick={<CategoryTick />} tickLine={false}
                axisLine={{ stroke: INK.axis }} width={128}
              />
              <Tooltip cursor={{ fill: 'rgba(15,36,56,0.04)' }} content={<VizTooltip format={sarFull} />} />
              <Bar dataKey="net" name="Net profit" fill={SERIES[0]} maxBarSize={BAR_MAX} radius={BAR_RADIUS_H}>
                <LabelList
                  dataKey="net" position="right" offset={8}
                  formatter={(v: unknown) => sarAxis(Number(v))}
                  style={{ fill: INK.secondary, fontSize: 11, fontWeight: 600 }}
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Single series → no legend box; the title names it. Endpoint labelled only. */}
        <ChartCard
          title="Customs clearance time"
          sub="Average days from vessel or flight arrival to customs release"
          table={{
            head: ['Month', 'Avg. days', 'Jobs released'],
            rows: cycleByMonth.map((r) => [r.month, String(r.days), r.jobs]),
          }}
        >
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={cycleSeries} margin={{ top: 14, right: 28, bottom: 4, left: 4 }}>
              <CartesianGrid vertical={false} stroke={INK.grid} />
              <XAxis dataKey="month" tick={AXIS_TICK} tickLine={false} axisLine={{ stroke: INK.axis }} />
              <YAxis
                tick={AXIS_TICK} tickLine={false} axisLine={false} width={30}
                domain={[0, (d: number) => Math.max(d + 2, CLEARANCE_TARGET + 2)]}
              />
              <ReferenceLine
                y={CLEARANCE_TARGET} stroke={INK.muted} strokeWidth={1}
                label={{ value: `target ${CLEARANCE_TARGET}d`, position: 'insideTopRight', fill: INK.muted, fontSize: 10 }}
              />
              <Tooltip
                cursor={{ stroke: INK.axis, strokeWidth: 1 }}
                content={<VizTooltip format={(v) => String(v)} unit="days" />}
              />
              <Line
                type="monotone" dataKey="days" name="Avg. clearance" stroke={SERIES[0]} strokeWidth={2}
                dot={{ r: 4, fill: SERIES[0], stroke: INK.surface, strokeWidth: 2 }}
                activeDot={{ r: 6, fill: SERIES[0], stroke: INK.surface, strokeWidth: 2 }}
              >
                {/* Only the endpoint is labelled — a number on every point goes unread. */}
                <LabelList
                  dataKey="endLabel" position="top" offset={10}
                  style={{ fill: INK.secondary, fontSize: 11, fontWeight: 600 }}
                />
              </Line>
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Five stacked series: 2px surface gaps do the separating, legend carries identity. */}
        <ChartCard
          title="What each client is actually charged"
          sub="Customs payments split the way a client asks for them — pure duty apart from the rest"
          legend={
            <VizLegend
              items={DUTY_TYPES.map((t, i) => ({ name: DUTY_LABEL[t], color: SERIES[i] }))}
            />
          }
          table={{
            head: ['Client', ...DUTY_TYPES.map((t) => DUTY_LABEL[t]), 'Total'],
            rows: dutyByClient.map((r) => [
              r.fullName,
              ...DUTY_TYPES.map((t) => sarFull(Number(r[DUTY_LABEL[t]] ?? 0))),
              sarFull(r.total),
            ]),
          }}
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={dutyByClient} layout="vertical" margin={{ top: 4, right: 12, bottom: 4, left: 4 }}>
              <CartesianGrid horizontal={false} stroke={INK.grid} />
              <XAxis type="number" tickFormatter={sarAxis} tick={AXIS_TICK} tickLine={false} axisLine={false} />
              <YAxis
                type="category" dataKey="client" interval={0} tick={<CategoryTick />} tickLine={false}
                axisLine={{ stroke: INK.axis }} width={146}
              />
              <Tooltip cursor={{ fill: 'rgba(15,36,56,0.04)' }} content={<VizTooltip format={sarFull} />} />
              {DUTY_TYPES.map((t, i) => (
                <Bar
                  key={t} dataKey={DUTY_LABEL[t]} stackId="duty" fill={SERIES[i]}
                  maxBarSize={20} stroke={INK.surface} strokeWidth={2}
                  radius={i === DUTY_TYPES.length - 1 ? BAR_RADIUS_H : undefined}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        {/* Emphasis form: the idle trucks are the story, so everything else recedes. */}
        <ChartCard
          title="Truck utilisation"
          sub={`Distance run per truck. ${idleCount} of ${fleetRows.length} active trucks have not moved.`}
          height={334}
          legend={
            <VizLegend items={[
              { name: 'In service', color: SERIES[0] },
              { name: 'Idle — no trips', color: INK.deemphasis },
            ]} />
          }
          table={{
            head: ['Truck', 'Model', 'Trips', 'Km run'],
            rows: fleetRows.map((t) => [t.plate, t.model, t.trips, Math.round(t.km).toLocaleString('en-US')]),
          }}
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={fleetRows} layout="vertical" margin={{ top: 4, right: 78, bottom: 4, left: 4 }}>
              <CartesianGrid horizontal={false} stroke={INK.grid} />
              <XAxis type="number" tick={AXIS_TICK} tickLine={false} axisLine={false} />
              <YAxis type="category" dataKey="plate" interval={0} tick={<CategoryTick />} tickLine={false} axisLine={{ stroke: INK.axis }} width={72} />
              <Tooltip
                cursor={{ fill: 'rgba(15,36,56,0.04)' }}
                content={<VizTooltip format={(v) => `${Math.round(v).toLocaleString('en-US')}`} unit="km" />}
              />
              {/* minPointSize keeps a 2px stub on idle trucks so the row still has a mark to label */}
              <Bar dataKey="km" name="Distance run" maxBarSize={18} radius={BAR_RADIUS_H} minPointSize={2}>
                {fleetRows.map((t) => (
                  <Cell key={t.plate} fill={t.idle ? INK.deemphasis : SERIES[0]} />
                ))}
                <LabelList
                  dataKey="km" position="right" offset={8}
                  formatter={(v: unknown) => (Number(v) > 0 ? `${Math.round(Number(v)).toLocaleString('en-US')} km` : 'idle')}
                  style={{ fill: INK.secondary, fontSize: 11 }}
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Meters, not a chart: one ratio against a limit, per client. Status + icon + label. */}
        <section className="rounded-xl border border-slate-200 bg-white shadow-[0_1px_2px_rgba(16,37,58,0.04)]">
          <header className="px-5 pb-3 pt-4">
            <h3 className="text-[13px] font-semibold uppercase tracking-wide text-slate-800">Duty float headroom</h3>
            <p className="mt-0.5 text-xs text-slate-500">
              Balance left of each client&apos;s customs advance, against the {sarFull(DUTY_ALERT)} top-up threshold
            </p>
          </header>
          <div className="space-y-4 px-5 pb-5">
            {headroom.map((b) => {
              const color = b.state === 'critical' ? STATUS.critical : b.state === 'warning' ? STATUS.warning : STATUS.good
              const Icon = b.state === 'critical' ? TrendingDown : b.state === 'warning' ? AlertTriangle : CheckCircle2
              return (
                <div key={b.client_id}>
                  <div className="mb-1.5 flex flex-wrap items-baseline justify-between gap-2">
                    <span className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-800">
                      <Icon className="h-3.5 w-3.5" style={{ color }} aria-hidden />
                      {b.client_name}
                      <span className="text-xs font-normal" style={{ color }}>
                        {b.state === 'critical' ? 'overdrawn' : b.state === 'warning' ? 'below threshold' : 'healthy'}
                      </span>
                    </span>
                    <span className="tabular text-sm font-semibold text-slate-900">{sarFull(b.bal)}</span>
                  </div>
                  <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ width: `${Math.max(b.pct * 100, b.state === 'critical' ? 3 : 2)}%`, background: color }}
                    />
                  </div>
                  <div className="tabular mt-1 text-[11px] text-slate-400">
                    {sarFull(b.advance_utilised)} used of {sarFull(b.advance_received)} received
                  </div>
                </div>
              )
            })}
            {headroom.length === 0 && (
              <p className="py-6 text-center text-sm text-slate-400">No duty float for this client.</p>
            )}
          </div>
          {overdue.length > 0 && (
            <div className="border-t border-slate-100 px-5 py-3 text-xs text-slate-500">
              Separately, {overdue.length} invoice{overdue.length === 1 ? '' : 's'} past due —{' '}
              {sarFull(overdue.reduce((s, i) => s + Number(i.amount), 0))}.
            </div>
          )}
        </section>
      </div>
    </>
  )
}
