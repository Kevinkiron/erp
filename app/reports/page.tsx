import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { getPnl } from '@/lib/db'
import { Card, CardHead, PageHead, Stat, Pill, Table, Row, Cell, Tag } from '@/components/ui'
import { RevenueVsCost, ServiceLineBars } from '@/components/charts/basic'
import { sar, num, day, JOB_TYPE_LABEL } from '@/lib/format'

export const dynamic = 'force-dynamic'

const MONTHS = ['2026-03', '2026-04', '2026-05', '2026-06', '2026-07', '2026-08']

export default async function Reports() {
  const [pnl, { data: invoices }, { data: fleet }, { data: drivers }] = await Promise.all([
    getPnl(),
    supabase.from('invoices').select('*'),
    supabase.from('v_fleet_utilisation').select('*'),
    supabase.from('v_driver_performance').select('*').eq('role', 'driver'),
  ])

  const revenue = pnl.reduce((s, p) => s + Number(p.revenue_sar), 0)
  const expense = pnl.reduce((s, p) => s + Number(p.expense_sar), 0)
  const net = revenue - expense
  const margin = revenue > 0 ? (net / revenue) * 100 : 0
  const unbilled = pnl.filter((p) => p.unbilled && Number(p.revenue_sar) > 0 && !['draft', 'cancelled'].includes(p.status))
  const overdue = (invoices ?? []).filter((i) => i.status === 'overdue')

  // by service line
  const lines = ['customs_clearance', 'warehousing', 'transport', 'installation', 'freight_forwarding'].map((k) => {
    const rows = pnl.filter((p) => p.job_type === k)
    const rev = rows.reduce((s, p) => s + Number(p.revenue_sar), 0)
    const exp = rows.reduce((s, p) => s + Number(p.expense_sar), 0)
    return { key: k, label: JOB_TYPE_LABEL[k], jobs: rows.length, rev, exp, net: rev - exp, margin: rev > 0 ? ((rev - exp) / rev) * 100 : 0 }
  }).filter((l) => l.jobs > 0)

  // monthly trend
  const months = MONTHS.map((m) => {
    const rows = pnl.filter((p) => (p.opened_on ?? '').startsWith(m))
    const rev = rows.reduce((s, p) => s + Number(p.revenue_sar), 0)
    const exp = rows.reduce((s, p) => s + Number(p.expense_sar), 0)
    return { m, label: new Date(`${m}-01`).toLocaleDateString('en-GB', { month: 'short' }), rev, exp, net: rev - exp }
  })

  return (
    <>
      <PageHead title="Reports" sub="Job profitability, service-line performance and asset utilisation." />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        <Stat label="Revenue" value={sar(revenue, { compact: true })} hint={`${pnl.length} jobs`} />
        <Stat label="Direct cost" value={sar(expense, { compact: true })} />
        <Stat label="Net P&L" value={sar(net, { compact: true })} tone={net >= 0 ? 'good' : 'bad'} />
        <Stat label="Margin" value={`${margin.toFixed(1)}%`} tone={margin > 30 ? 'good' : 'warn'} />
        <Stat label="Unbilled work" value={sar(unbilled.reduce((s, p) => s + Number(p.revenue_sar), 0), { compact: true })} tone="warn" hint={`${unbilled.length} jobs`} />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <ServiceLineBars
          data={lines.map((l) => ({ line: l.label, jobs: l.jobs, revenue: l.rev, cost: l.exp, net: l.net, margin: l.margin }))}
        />

        <RevenueVsCost
          data={months.map((m) => ({ month: m.label, Revenue: m.rev, 'Direct cost': m.exp }))}
        />
      </div>

      <Card className="mt-6">
        <CardHead title="Job profitability" sub="Every job carries its own revenue, cost and duty — unbilled jobs are flagged" />
        <Table head={['Job no', 'Type', 'Client', 'Opened', 'Revenue', 'Cost', 'Duty paid', 'Net', 'Margin', 'Billing', 'Status']}>
          {pnl.map((p) => {
            const m = Number(p.revenue_sar) > 0 ? (Number(p.net_pnl_sar) / Number(p.revenue_sar)) * 100 : 0
            return (
              <Row key={p.id}>
                <Cell>
                  <Link href={`/jobs/${encodeURIComponent(p.job_no)}`} className="font-medium text-teal-700 hover:underline">
                    {p.job_no}
                  </Link>
                </Cell>
                <Cell className="text-slate-500">{JOB_TYPE_LABEL[p.job_type]}</Cell>
                <Cell className="max-w-[170px] truncate">{p.client_name}</Cell>
                <Cell className="text-slate-500">{day(p.opened_on)}</Cell>
                <Cell className="tabular">{sar(p.revenue_sar, { compact: true })}</Cell>
                <Cell className="tabular text-slate-500">{sar(p.expense_sar, { compact: true })}</Cell>
                <Cell className="tabular text-slate-500">{Number(p.duty_paid_sar) ? sar(p.duty_paid_sar, { compact: true }) : '—'}</Cell>
                <Cell className={`tabular font-medium ${Number(p.net_pnl_sar) >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {sar(p.net_pnl_sar, { compact: true })}
                </Cell>
                <Cell className="tabular text-slate-500">{Number(p.revenue_sar) ? `${m.toFixed(0)}%` : '—'}</Cell>
                <Cell>{p.unbilled ? <Tag tone="amber">unbilled</Tag> : <Tag tone="brand">invoiced</Tag>}</Cell>
                <Cell><Pill status={p.status} /></Cell>
              </Row>
            )
          })}
        </Table>
      </Card>

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHead title="Receivables" sub={`${overdue.length} invoices past due`} />
          <Table head={['Invoice', 'Issued', 'Amount', 'Status']}>
            {(invoices ?? [])
              .slice()
              .sort((a, b) => (a.issued_on < b.issued_on ? 1 : -1))
              .map((i) => (
                <Row key={i.id}>
                  <Cell className="tabular font-medium text-slate-800">{i.invoice_no}</Cell>
                  <Cell className="text-slate-500">{day(i.issued_on)}</Cell>
                  <Cell className="tabular">{sar(i.amount)}</Cell>
                  <Cell><Pill status={i.status} /></Cell>
                </Row>
              ))}
          </Table>
        </Card>

        <Card>
          <CardHead title="Asset utilisation summary" sub="Feeds the buy-or-hire decision" />
          <div className="grid grid-cols-2 gap-4 p-5">
            <div className="rounded-lg bg-slate-50 p-4">
              <div className="text-[11px] uppercase tracking-wider text-slate-500">Trucks with zero trips</div>
              <div className="tabular mt-1 text-2xl font-semibold text-amber-600">
                {(fleet ?? []).filter((t) => t.active && Number(t.trips) === 0).length}
              </div>
              <div className="mt-1 text-xs text-slate-500">Capacity sitting idle</div>
            </div>
            <div className="rounded-lg bg-slate-50 p-4">
              <div className="text-[11px] uppercase tracking-wider text-slate-500">Hired truck legs</div>
              <div className="tabular mt-1 text-2xl font-semibold text-slate-900">
                {(fleet ?? []).filter((t) => t.ownership === 'outsourced').reduce((s, t) => s + Number(t.trips), 0)}
              </div>
              <div className="mt-1 text-xs text-slate-500">Paid to third parties</div>
            </div>
            <div className="rounded-lg bg-slate-50 p-4">
              <div className="text-[11px] uppercase tracking-wider text-slate-500">Total distance</div>
              <div className="tabular mt-1 text-2xl font-semibold text-slate-900">
                {num((fleet ?? []).reduce((s, t) => s + Number(t.km_run), 0))} km
              </div>
            </div>
            <div className="rounded-lg bg-slate-50 p-4">
              <div className="text-[11px] uppercase tracking-wider text-slate-500">Crew allowances paid</div>
              <div className="tabular mt-1 text-2xl font-semibold text-slate-900">
                {sar((drivers ?? []).reduce((s, d) => s + Number(d.allowances_sar), 0), { compact: true })}
              </div>
            </div>
          </div>
        </Card>
      </div>
    </>
  )
}
