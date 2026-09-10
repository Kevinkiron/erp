import Link from 'next/link'
import { Card, CardHead, PageHead, Stat, Table, Row, Cell, Tag, Pill } from '@/components/ui'
import { num, sar, day } from '@/lib/format'
import { billsC } from '@/lib/finance-data'
import { AlertTriangle, Globe2 } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default function Bills() {
  const outstanding = billsC.filter((b) => b.status !== 'paid')
  const inputVat = billsC.filter((b) => b.status !== 'pending_approval' && !b.reverseCharge).reduce((s, b) => s + b.vat, 0)
  const wht = billsC.reduce((s, b) => s + b.wht, 0)
  const nonResident = billsC.filter((b) => !b.is_resident)

  return (
    <>
      <PageHead
        title="Purchase Bills"
        sub="Supplier invoices, the input VAT they carry, and the withholding tax that comes off payments to non-residents."
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        <Stat label="Bills" value={String(billsC.length)} hint={`${outstanding.length} outstanding`} />
        <Stat label="Recoverable input VAT" value={sar(inputVat, { compact: true })} hint="Box 7 of the return" />
        <Stat label="Reverse charge" value={sar(billsC.filter((b) => b.reverseCharge).reduce((s, b) => s + b.vat, 0), { compact: true })} hint="Box 9 — both sides" />
        <Stat label="Withholding tax" value={sar(wht, { compact: true })} tone={wht > 0 ? 'warn' : 'good'} hint="Due by the 10th" />
        <Stat label="Non-resident suppliers" value={String(nonResident.length)} hint="WHT applies" />
      </div>

      {wht > 0 && (
        <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50/70 p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
            <div>
              <p className="text-sm font-semibold text-amber-900">{sar(wht)} of withholding tax is due</p>
              <p className="mt-1 text-xs leading-relaxed text-amber-800/85">
                WHT is triggered by <strong>payment</strong>, not by the invoice date, and the return is due within the first
                10 days of the following month. Late payment costs 1% per 30 days. Air and sea freight to a non-resident is 5%;
                management fees are 20%.
              </p>
            </div>
          </div>
        </div>
      )}

      <Card className="mt-6">
        <CardHead title="Bills" sub="An unapproved bill is not in the ledger and its input VAT is not claimed" />
        <Table head={['Bill', 'Supplier', 'Country', 'VAT no', 'Date', 'Due', 'Job', 'Net', 'VAT', 'WHT', 'Payable', 'Status']}>
          {billsC.map((b) => (
            <Row key={b.bill_no}>
              <Cell className="tabular font-medium text-slate-800">{b.bill_no}</Cell>
              <Cell className="max-w-[180px] truncate">
                {b.supplier}
                {!b.is_resident && <Globe2 className="ml-1.5 inline h-3 w-3 text-amber-500" />}
              </Cell>
              <Cell className="text-slate-500">{b.supplier_country}</Cell>
              <Cell className="tabular text-xs text-slate-500">{b.supplier_vat_no ?? '—'}</Cell>
              <Cell className="text-slate-500">{day(b.bill_date)}</Cell>
              <Cell className="text-slate-500">{day(b.due_date)}</Cell>
              <Cell className="text-xs">
                {b.job_no ? <Link href={`/jobs/${encodeURIComponent(b.job_no)}`} className="tabular text-teal-700 hover:underline">{b.job_no}</Link> : <span className="text-slate-300">—</span>}
              </Cell>
              <Cell className="tabular">{num(b.net, 2)}</Cell>
              <Cell className="tabular">
                {num(b.vat, 2)}
                {b.reverseCharge && <Tag tone="amber">RC</Tag>}
              </Cell>
              <Cell className="tabular">{b.wht ? num(b.wht, 2) : '—'}</Cell>
              <Cell className="tabular font-medium">{num(b.payable, 2)}</Cell>
              <Cell><Pill status={b.status === 'pending_approval' ? 'documents_pending' : b.status === 'paid' ? 'completed' : 'in_progress'}>{b.status.replace('_', ' ')}</Pill></Cell>
            </Row>
          ))}
        </Table>
        <p className="border-t border-slate-100 px-5 py-3 text-xs leading-relaxed text-slate-500">
          Kuehne+Nagel is a German supplier with no Saudi VAT number, so the import of services is self-accounted under the
          reverse charge: the same 15% appears as both output and input tax, no cash moves to the supplier for VAT, and 5%
          withholding tax comes off the payment.
        </p>
      </Card>
    </>
  )
}
