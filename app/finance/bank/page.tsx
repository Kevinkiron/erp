import { Card, CardHead, PageHead, Stat, Table, Row, Cell } from '@/components/ui'
import { num, sar, day } from '@/lib/format'
import { banks } from '@/lib/finance-data'
import { balanceOf } from '@/lib/finance-data'
import { Link2, CircleDashed } from 'lucide-react'

export const dynamic = 'force-dynamic'

const MATCH_LABEL: Record<string, string> = {
  invoice: 'Sales invoice', bill: 'Purchase bill', claim: 'Expense claim', journal: 'Journal',
}

export default function Bank() {
  const cash = banks.reduce((s, b) => s + b.closing, 0)
  const unmatched = banks.reduce((s, b) => s + b.unmatched, 0)
  const unmatchedValue = banks.reduce((s, b) => s + b.unmatchedValue, 0)
  const ledgerCash = balanceOf('1020') + balanceOf('1030')

  return (
    <>
      <PageHead
        title="Bank Reconciliation"
        sub="Statement lines against the ledger. Anything unmatched is either a missing document or a bank error — both need answering before the period closes."
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat label="Closing balance" value={sar(cash, { compact: true })} hint={`${banks.length} accounts`} />
        <Stat label="Matched lines" value={String(banks.reduce((s, b) => s + b.matched, 0))} tone="good" />
        <Stat label="Unmatched" value={String(unmatched)} tone={unmatched ? 'warn' : 'good'} hint={sar(unmatchedValue)} />
        <Stat label="Ledger movement" value={sar(ledgerCash, { compact: true })} hint="Accounts 1020 and 1030" />
      </div>

      <div className="mt-6 space-y-6">
        {banks.map((b) => (
          <Card key={b.id}>
            <CardHead
              title={b.name}
              sub={`${b.iban} · ${b.currency}`}
              right={
                <span className="text-right text-xs">
                  <span className="block text-slate-400">closing balance</span>
                  <span className="tabular text-sm font-semibold text-slate-900">{sar(b.closing)}</span>
                </span>
              }
            />
            <Table head={['Date', 'Statement narrative', 'Debit', 'Credit', 'Matched to', 'Type']}>
              {b.lines.map((l) => (
                <Row key={l.id} className={l.matched_to ? '' : 'bg-amber-50/40'}>
                  <Cell className="text-slate-500">{day(l.date)}</Cell>
                  <Cell className="max-w-[320px] truncate font-mono text-xs text-slate-700">{l.description}</Cell>
                  <Cell className="tabular">{l.debit ? num(l.debit, 2) : ''}</Cell>
                  <Cell className="tabular">{l.credit ? num(l.credit, 2) : ''}</Cell>
                  <Cell>
                    {l.matched_to
                      ? <span className="inline-flex items-center gap-1.5 text-xs"><Link2 className="h-3 w-3 text-emerald-500" /><span className="tabular text-slate-700">{l.matched_to}</span></span>
                      : <span className="inline-flex items-center gap-1.5 text-xs text-amber-700"><CircleDashed className="h-3 w-3" /> unmatched</span>}
                  </Cell>
                  <Cell className="text-xs text-slate-500">{l.match_type ? MATCH_LABEL[l.match_type] : '—'}</Cell>
                </Row>
              ))}
              <Row className="bg-slate-50 font-semibold">
                <Cell className="text-slate-900">Opening {sar(b.opening, { compact: true })}</Cell>
                <Cell />
                <Cell className="tabular text-slate-900">{num(b.lines.reduce((s, l) => s + l.debit, 0), 2)}</Cell>
                <Cell className="tabular text-slate-900">{num(b.lines.reduce((s, l) => s + l.credit, 0), 2)}</Cell>
                <Cell className="text-slate-900">Closing {sar(b.closing, { compact: true })}</Cell>
                <Cell />
              </Row>
            </Table>
            {b.unmatched > 0 && (
              <p className="border-t border-slate-100 px-5 py-3 text-xs leading-relaxed text-amber-700">
                {b.unmatched} line{b.unmatched === 1 ? '' : 's'} unmatched, {sar(b.unmatchedValue)}. Two receipts have no invoice
                raised against them yet, the FASAH platform fee has no bill, and one inward transfer cannot be identified at all.
              </p>
            )}
          </Card>
        ))}
      </div>
    </>
  )
}
