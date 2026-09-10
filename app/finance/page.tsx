import Link from 'next/link'
import { Card, CardHead, PageHead, Stat, Table, Row, Cell, Tag } from '@/components/ui'
import { sar, day } from '@/lib/format'
import { docs, vat, ageing, banks, billsC, claimsC, balanceOf } from '@/lib/finance-data'
import { COMPANY, openPeriod, periods } from '@/lib/finance'
import { ZatcaPill } from '@/components/zatca-pill'
import { AlertTriangle, ArrowRight, ShieldCheck, Clock } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default function FinanceHome() {
  const g = (n: number) => vat[n] ?? { amount: 0, vat: 0 }
  const netVat = g(16).vat
  const arOpen = ageing.reduce((s, a) => s + a.total, 0)
  const apOpen = billsC.filter((b) => b.status !== 'paid').reduce((s, b) => s + b.payable, 0)
  const cash = banks.reduce((s, b) => s + b.closing, 0)
  const unmatched = banks.reduce((s, b) => s + b.unmatched, 0)
  const pending = docs.filter((d) => d.clearance === 'pending' || d.clearance === 'rejected')
  const claimsWaiting = claimsC.filter((c) => c.status === 'submitted')

  return (
    <>
      <PageHead
        title="Finance"
        sub={`${COMPANY.legal_name_en} · VAT ${COMPANY.vat_no} · monthly filing · period ${openPeriod.period} open`}
      />

      {pending.length > 0 && (
        <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50/70 p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
            <div>
              <p className="text-sm font-semibold text-amber-900">
                {pending.length} document{pending.length === 1 ? '' : 's'} not yet cleared with ZATCA
              </p>
              <p className="mt-1 text-xs leading-relaxed text-amber-800/85">
                A standard tax invoice is not legally valid until ZATCA clears it. This build simulates clearance —
                connecting a real Fatoora integration is a separate piece of work.{' '}
                <Link href="/finance/invoices" className="font-medium underline underline-offset-2">Open the invoice register</Link>
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        <Stat label="Net VAT due" value={sar(netVat, { compact: true })} hint={`Period ${openPeriod.period} · due 30 Sep`} tone={netVat > 0 ? 'warn' : 'good'} href="/finance/vat" />
        <Stat label="Receivables" value={sar(arOpen, { compact: true })} hint={`${ageing.length} open documents`} href="/finance/invoices" />
        <Stat label="Payables" value={sar(apOpen, { compact: true })} hint={`${billsC.filter((b) => b.status !== 'paid').length} bills outstanding`} href="/finance/bills" />
        <Stat label="Cash at bank" value={sar(cash, { compact: true })} hint={`${unmatched} unmatched lines`} tone={unmatched > 3 ? 'warn' : 'good'} href="/finance/bank" />
        <Stat label="Duty held for clients" value={sar(balanceOf('1300'), { compact: true })} hint="Paid on behalf, not yet recharged" href="/duty" />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHead
            title="Latest documents"
            sub="Every one posts to the ledger and lands in a VAT return box"
            right={<Link href="/finance/invoices" className="inline-flex items-center gap-1 text-xs font-medium text-teal-700 hover:text-teal-800">Invoice register <ArrowRight className="h-3.5 w-3.5" /></Link>}
          />
          <Table head={['Document', 'Type', 'Client', 'Issued', 'Net', 'VAT', 'Total', 'ZATCA']}>
            {docs.slice(0, 8).map((d) => (
              <Row key={d.doc_no}>
                <Cell>
                  <Link href={`/finance/invoices/${encodeURIComponent(d.doc_no)}`} className="tabular font-medium text-teal-700 hover:underline">{d.doc_no}</Link>
                </Cell>
                <Cell className="text-slate-500">
                  {d.type === 'credit_note' ? 'Credit note' : d.type === 'debit_note' ? 'Debit note' : d.simplified ? 'Simplified' : 'Tax invoice'}
                </Cell>
                <Cell className="max-w-[190px] truncate">{d.client_name}</Cell>
                <Cell className="text-slate-500">{day(d.issue_date)}</Cell>
                <Cell className="tabular">{sar(d.sign * d.net, { compact: true })}</Cell>
                <Cell className="tabular">{sar(d.sign * d.vat, { compact: true })}</Cell>
                <Cell className="tabular font-medium">{sar(d.sign * d.total, { compact: true })}</Cell>
                <Cell><ZatcaPill status={d.clearance} /></Cell>
              </Row>
            ))}
          </Table>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHead title="Period status" sub="Filed periods are locked" />
            <div className="divide-y divide-slate-100">
              {[...periods].reverse().map((p) => (
                <div key={p.period} className="flex items-center justify-between px-5 py-3">
                  <span className="tabular text-sm text-slate-800">{p.period}</span>
                  <span className="flex items-center gap-2">
                    {p.vat_ref && <span className="tabular text-[11px] text-slate-400">{p.vat_ref}</span>}
                    <Tag tone={p.status === 'open' ? 'amber' : 'brand'}>{p.status}</Tag>
                  </span>
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <CardHead title="Waiting on someone" />
            <div className="divide-y divide-slate-100">
              {claimsWaiting.map((c) => (
                <div key={c.claim_no} className="flex items-start gap-3 px-5 py-3">
                  <Clock className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
                  <div className="min-w-0">
                    <Link href="/finance/claims" className="text-sm font-medium text-slate-800 hover:text-teal-700">{c.claim_no}</Link>
                    <p className="text-xs text-slate-500">{c.claimant} · {sar(c.total)} awaiting approval</p>
                  </div>
                </div>
              ))}
              {billsC.filter((b) => b.status === 'pending_approval').map((b) => (
                <div key={b.bill_no} className="flex items-start gap-3 px-5 py-3">
                  <Clock className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
                  <div className="min-w-0">
                    <Link href="/finance/bills" className="text-sm font-medium text-slate-800 hover:text-teal-700">{b.bill_no}</Link>
                    <p className="text-xs text-slate-500">{b.supplier} · {sar(b.payable)} unapproved — not yet in the ledger</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <CardHead title="ZATCA integration" />
            <div className="space-y-2.5 p-5 text-xs leading-relaxed text-slate-600">
              <p className="flex items-start gap-2">
                <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-teal-600" />
                <span>Wave {COMPANY.zatca_wave} — turnover above SAR 40m. Phase 2 integration has been mandatory since <strong>1 March 2024</strong>.</span>
              </p>
              <p className="tabular text-slate-500">EGS unit · {COMPANY.egs_serial}</p>
              <p className="text-slate-500">QR codes on this build are generated for real. Cryptographic stamping and clearance need a CSID and a live connection.</p>
            </div>
          </Card>
        </div>
      </div>
    </>
  )
}
