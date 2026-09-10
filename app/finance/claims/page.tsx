import Link from 'next/link'
import { Card, PageHead, Stat, Table, Row, Cell, Pill } from '@/components/ui'
import { num, sar, day } from '@/lib/format'
import { claimsC } from '@/lib/finance-data'
import { Receipt, XCircle, CheckCircle2, Clock } from 'lucide-react'

export const dynamic = 'force-dynamic'

const STATUS: Record<string, string> = {
  reimbursed: 'completed', approved: 'cleared', submitted: 'documents_pending', rejected: 'on_hold',
}

export default function Claims() {
  const totalValue = claimsC.reduce((s, c) => s + c.total, 0)
  const blocked = claimsC.reduce((s, c) => s + c.blocked, 0)
  const waiting = claimsC.filter((c) => c.status === 'submitted')

  return (
    <>
      <PageHead
        title="Expense Claims"
        sub="What staff spent in the field, what it cost the job, and whether the VAT on it can actually be recovered."
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat label="Claims" value={String(claimsC.length)} hint={`${waiting.length} awaiting approval`} />
        <Stat label="Value" value={sar(totalValue, { compact: true })} />
        <Stat label="Recoverable VAT" value={sar(claimsC.reduce((s, c) => s + c.vat, 0), { compact: true })} />
        <Stat label="Lines without a tax invoice" value={String(blocked)} tone={blocked ? 'warn' : 'good'} hint="VAT on these cannot be claimed" />
      </div>

      <div className="mt-6 space-y-4">
        {claimsC.map((c) => (
          <Card key={c.claim_no}>
            <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 px-5 py-3.5">
              <div>
                <div className="flex items-center gap-2">
                  <span className="tabular text-sm font-semibold text-slate-900">{c.claim_no}</span>
                  <Pill status={STATUS[c.status]}>{c.status}</Pill>
                </div>
                <p className="mt-0.5 text-xs text-slate-500">
                  {c.claimant} · {c.emp_no} · submitted {day(c.submitted_on)}
                  {c.approver && ` · ${c.status === 'rejected' ? 'rejected' : 'approved'} by ${c.approver}`}
                </p>
              </div>
              <div className="text-right">
                <div className="tabular text-sm font-semibold text-slate-900">{sar(c.total)}</div>
                <div className="tabular text-xs text-slate-500">{sar(c.net)} net · {sar(c.vat)} VAT</div>
              </div>
            </div>

            <Table head={['Date', 'Description', 'Job', 'Net', 'VAT', 'Receipt']}>
              {c.lines.map((l, i) => (
                <Row key={i}>
                  <Cell className="text-slate-500">{day(l.date)}</Cell>
                  <Cell className="max-w-[300px] truncate">{l.desc}</Cell>
                  <Cell className="text-xs">
                    {l.job_no ? <Link href={`/jobs/${encodeURIComponent(l.job_no)}`} className="tabular text-teal-700 hover:underline">{l.job_no}</Link> : <span className="text-slate-300">—</span>}
                  </Cell>
                  <Cell className="tabular">{num(l.net, 2)}</Cell>
                  <Cell className="tabular">
                    {l.recoverable ? num(l.vat, 2) : <span className="text-slate-400">blocked</span>}
                  </Cell>
                  <Cell>
                    {l.receipt
                      ? <span className="inline-flex items-center gap-1 text-[11px] text-emerald-600"><Receipt className="h-3 w-3" /> tax invoice</span>
                      : <span className="inline-flex items-center gap-1 text-[11px] text-amber-600"><XCircle className="h-3 w-3" /> none</span>}
                  </Cell>
                </Row>
              ))}
            </Table>

            {c.note && (
              <p className="border-t border-slate-100 px-5 py-3 text-xs leading-relaxed text-rose-700">{c.note}</p>
            )}
            {!c.note && c.blocked > 0 && (
              <p className="border-t border-slate-100 px-5 py-3 text-xs leading-relaxed text-amber-700">
                {c.blocked} line{c.blocked === 1 ? '' : 's'} without a supplier tax invoice — the cost still hits the job, but the
                VAT is not recoverable and is not claimed on the return.
              </p>
            )}
            {c.status === 'submitted' && (
              <p className="flex items-center gap-2 border-t border-slate-100 px-5 py-3 text-xs text-slate-500">
                <Clock className="h-3.5 w-3.5" /> Not yet in the ledger. A claim posts on approval, not on submission.
              </p>
            )}
            {(c.status === 'approved' || c.status === 'reimbursed') && (
              <p className="flex items-center gap-2 border-t border-slate-100 px-5 py-3 text-xs text-slate-500">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> Posted to the ledger as{' '}
                <span className="tabular">EX-{c.claim_no}</span>
                {c.status === 'reimbursed' ? ' and paid.' : ' — awaiting the reimbursement run.'}
              </p>
            )}
          </Card>
        ))}
      </div>
    </>
  )
}
