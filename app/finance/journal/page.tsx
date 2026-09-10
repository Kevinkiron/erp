import Link from 'next/link'
import { Card, PageHead, Stat, Table, Row, Cell, Tag } from '@/components/ui'
import { num, sar, day } from '@/lib/format'
import { postings } from '@/lib/finance-data'
import { CheckCircle2, Clock } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default function Journal() {
  const total = postings.reduce((s, p) => s + p.lines.reduce((x, l) => x + l.debit, 0), 0)
  const unapproved = postings.filter((p) => !p.approved_by)
  const bySource = (jv: string) =>
    jv.startsWith('AR-') ? { label: 'Sales', tone: 'brand' }
    : jv.startsWith('AP-') ? { label: 'Purchases', tone: 'amber' }
    : jv.startsWith('EX-') ? { label: 'Expense claim', tone: 'slate' }
    : { label: 'Manual', tone: 'rose' }

  return (
    <>
      <PageHead
        title="General Journal"
        sub="Every entry is balanced and every entry names where it came from. Manual journals are the exception, not the rule."
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat label="Journals posted" value={String(postings.length)} />
        <Stat label="Value posted" value={sar(total, { compact: true })} hint="Total debits" />
        <Stat label="Manual entries" value={String(postings.filter((p) => p.source === 'Manual').length)} hint="Everything else is document-driven" />
        <Stat label="Awaiting approval" value={String(unapproved.length)} tone={unapproved.length ? 'warn' : 'good'} />
      </div>

      <div className="mt-6 space-y-4">
        {postings.map((p) => {
          const dr = p.lines.reduce((s, l) => s + l.debit, 0)
          const cr = p.lines.reduce((s, l) => s + l.credit, 0)
          const src = bySource(p.jv_no)
          return (
            <Card key={p.jv_no}>
              <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 px-5 py-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="tabular text-sm font-semibold text-slate-900">{p.jv_no}</span>
                    <Tag tone={src.tone}>{src.label}</Tag>
                    {p.approved_by ? (
                      <span className="inline-flex items-center gap-1 text-[11px] text-emerald-600"><CheckCircle2 className="h-3 w-3" /> approved by {p.approved_by}</span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] text-amber-600"><Clock className="h-3 w-3" /> awaiting approval</span>
                    )}
                  </div>
                  <p className="mt-0.5 text-xs text-slate-500">{p.memo} · prepared by {p.prepared_by}</p>
                </div>
                <div className="text-right text-xs text-slate-500">
                  <div>{day(p.date)}</div>
                  <div className={`tabular ${Math.abs(dr - cr) < 0.01 ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {Math.abs(dr - cr) < 0.01 ? 'balanced' : 'OUT OF BALANCE'} · {num(dr, 2)}
                  </div>
                </div>
              </div>
              <Table head={['Account', 'Description', 'Job', 'Debit', 'Credit']}>
                {p.lines.map((l, i) => (
                  <Row key={i}>
                    <Cell>
                      <span className="tabular text-xs text-slate-400">{l.account}</span>{' '}
                      <span className="text-slate-700">{l.account_name}</span>
                    </Cell>
                    <Cell className="max-w-[320px] truncate text-slate-500">{l.desc}</Cell>
                    <Cell className="text-xs">
                      {l.job_no ? <Link href={`/jobs/${encodeURIComponent(l.job_no)}`} className="tabular text-teal-700 hover:underline">{l.job_no}</Link> : <span className="text-slate-300">—</span>}
                    </Cell>
                    <Cell className="tabular">{l.debit ? num(l.debit, 2) : ''}</Cell>
                    <Cell className="tabular">{l.credit ? num(l.credit, 2) : ''}</Cell>
                  </Row>
                ))}
              </Table>
            </Card>
          )
        })}
      </div>
    </>
  )
}
