import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { getDutyBalances, DUTY_ALERT_THRESHOLD } from '@/lib/db'
import { Card, CardHead, PageHead, Stat, Table, Row, Cell, Tag, Bar } from '@/components/ui'
import { sar, num, day, titleCase } from '@/lib/format'
import { AlertTriangle, BellRing } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function Duty() {
  const [balances, { data: txns }, { data: charges }] = await Promise.all([
    getDutyBalances(),
    supabase.from('duty_advances').select('*, clients(code,name), jobs(job_no)').order('txn_date', { ascending: false }),
    supabase.from('duty_charges').select('type,amount'),
  ])

  const received = balances.reduce((s, b) => s + Number(b.advance_received), 0)
  const utilised = balances.reduce((s, b) => s + Number(b.advance_utilised), 0)
  const alerts = balances.filter((b) => Number(b.balance_sar) < DUTY_ALERT_THRESHOLD)

  const byType = new Map<string, number>()
  for (const c of charges ?? []) byType.set(c.type, (byType.get(c.type) ?? 0) + Number(c.amount))
  const typeRows = [...byType.entries()].sort((a, b) => b[1] - a[1])
  const maxType = Math.max(...typeRows.map((t) => t[1]), 1)

  return (
    <>
      <PageHead
        title="Customs Duty Advances"
        sub="Clients transfer a duty float. The system watches the balance so a top-up is requested before it runs dry."
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat label="Advances received" value={sar(received, { compact: true })} hint="All clients, YTD" />
        <Stat label="Duty utilised" value={sar(utilised, { compact: true })} hint="Paid to customs" />
        <Stat label="Float remaining" value={sar(received - utilised, { compact: true })} tone={received - utilised > 0 ? 'good' : 'bad'} />
        <Stat label="Accounts below threshold" value={num(alerts.length)} tone={alerts.length ? 'warn' : 'good'} hint={`Alert at ${sar(DUTY_ALERT_THRESHOLD, { compact: true })}`} />
      </div>

      <Card className="mt-6">
        <CardHead
          title="Balance by client"
          sub="The number that was missed last month — now it raises an alert on its own"
          right={
            <span className="inline-flex items-center gap-1.5 rounded-full bg-teal-50 px-2.5 py-1 text-[11px] font-medium text-teal-700 ring-1 ring-inset ring-teal-200">
              <BellRing className="h-3 w-3" /> Alerts on
            </span>
          }
        />
        <div className="divide-y divide-slate-100">
          {balances.map((b) => {
            const bal = Number(b.balance_sar)
            const pct = Number(b.advance_received) > 0 ? bal / Number(b.advance_received) : 0
            const state = bal < 0 ? 'bad' : bal < DUTY_ALERT_THRESHOLD ? 'warn' : 'good'
            return (
              <div key={b.client_id} className="px-5 py-4">
                <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-slate-900">{b.client_name}</span>
                    {state === 'bad' && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-2 py-0.5 text-[11px] font-medium text-rose-700">
                        <AlertTriangle className="h-3 w-3" /> Overdrawn — duty payments blocked
                      </span>
                    )}
                    {state === 'warn' && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-medium text-amber-800">
                        <AlertTriangle className="h-3 w-3" /> Below threshold — request a top-up
                      </span>
                    )}
                  </div>
                  <div className="tabular text-sm">
                    <span className="text-slate-400">received </span>
                    <span className="text-slate-700">{sar(b.advance_received, { compact: true })}</span>
                    <span className="mx-2 text-slate-300">·</span>
                    <span className="text-slate-400">utilised </span>
                    <span className="text-slate-700">{sar(b.advance_utilised, { compact: true })}</span>
                    <span className="mx-2 text-slate-300">·</span>
                    <span className="text-slate-400">balance </span>
                    <span className={`font-semibold ${state === 'bad' ? 'text-rose-600' : state === 'warn' ? 'text-amber-600' : 'text-emerald-600'}`}>
                      {sar(b.balance_sar)}
                    </span>
                  </div>
                </div>
                <Bar value={Math.max(pct, 0) * 100} max={100} tone={state === 'bad' ? 'rose' : state === 'warn' ? 'amber' : 'brand'} />
              </div>
            )
          })}
        </div>
      </Card>

      <div className="mt-6 grid gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHead title="Ledger" sub="Every transfer in and every customs payment out" />
          <Table head={['Date', 'Client', 'Direction', 'Reference', 'Job', 'Amount']}>
            {(txns ?? []).map((t) => (
              <Row key={t.id}>
                <Cell className="text-slate-500">{day(t.txn_date)}</Cell>
                <Cell className="max-w-[200px] truncate">{t.clients?.name}</Cell>
                <Cell><Tag tone={t.direction === 'received' ? 'brand' : 'amber'}>{t.direction}</Tag></Cell>
                <Cell className="tabular text-xs text-slate-500">{t.reference}</Cell>
                <Cell className="text-xs">
                  {t.jobs?.job_no ? (
                    <Link href={`/jobs/${encodeURIComponent(t.jobs.job_no)}`} className="text-teal-700 hover:underline">
                      {t.jobs.job_no}
                    </Link>
                  ) : (
                    <span className="text-slate-300">—</span>
                  )}
                </Cell>
                <Cell className={`tabular text-right font-medium ${t.direction === 'received' ? 'text-emerald-600' : 'text-slate-700'}`}>
                  {t.direction === 'received' ? '+' : '−'}{sar(t.amount)}
                </Cell>
              </Row>
            ))}
          </Table>
        </Card>

        <Card>
          <CardHead title="Where the money goes" sub="Split-wise, so a client asking for pure duty gets a clean answer" />
          <div className="space-y-3 p-5">
            {typeRows.map(([type, amt]) => (
              <div key={type}>
                <div className="mb-1 flex items-baseline justify-between text-xs">
                  <span className="text-slate-600">{titleCase(type)}</span>
                  <span className="tabular font-medium text-slate-800">{sar(amt, { compact: true })}</span>
                </div>
                <Bar value={amt} max={maxType} tone={type === 'customs_duty' ? 'brand' : type === 'demurrage' ? 'rose' : 'blue'} />
              </div>
            ))}
          </div>
        </Card>
      </div>
    </>
  )
}
