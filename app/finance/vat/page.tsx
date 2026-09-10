import { Card, CardHead, PageHead, Stat, Table, Row, Cell } from '@/components/ui'
import { num, sar, day } from '@/lib/format'
import { vat, docs } from '@/lib/finance-data'
import { COMPANY, openPeriod, periods } from '@/lib/finance'
import { VAT_RETURN_LINES } from '@/lib/zatca'
import { FileCheck2, AlertTriangle } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default function VatReturn() {
  const g = (n: number) => vat[n] ?? { amount: 0, vat: 0 }
  const net = g(16).vat
  const output = g(6).vat
  const input = g(12).vat
  const oosTotal = docs.reduce(
    (s, d) => s + d.sign * d.lines_c.filter((l) => l.tax_code === 'OOS').reduce((x, l) => x + l.net, 0), 0)

  const groups = [
    { key: 'output', label: 'Sales and all other outputs', ar: 'المبيعات والمخرجات الأخرى' },
    { key: 'input', label: 'Purchases and all other inputs', ar: 'المشتريات والمدخلات الأخرى' },
    { key: 'net', label: 'Net tax due', ar: 'صافي الضريبة المستحقة' },
  ]

  return (
    <>
      <PageHead
        title="VAT Return"
        sub={`Period ${openPeriod.period} · monthly filing · due by 30 September 2026 — filing and payment share the deadline`}
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat label="Output VAT" value={sar(output, { compact: true })} hint="Boxes 1 to 5" />
        <Stat label="Input VAT" value={sar(input, { compact: true })} hint="Boxes 7 to 11" />
        <Stat label="Net VAT due" value={sar(net, { compact: true })} tone={net > 0 ? 'warn' : 'good'} hint="Box 16" />
        <Stat label="Filing status" value="Not filed" tone="warn" hint={`${periods.filter((p) => p.vat_filed).length} periods filed to date`} />
      </div>

      <Card className="mt-6">
        <CardHead
          title="Return — form structure"
          sub="Every figure traces to posted documents. Nothing on this page is typed in."
          right={<span className="tabular text-xs text-slate-400">TIN {COMPANY.vat_no}</span>}
        />
        <Table head={['Box', 'Description', 'الوصف', 'Amount (SAR)', 'VAT (SAR)']}>
          {groups.flatMap((grp) => [
            <Row key={`h-${grp.key}`} className="bg-slate-50/80">
              <Cell />
              <Cell className="font-semibold text-slate-800">{grp.label}</Cell>
              <Cell className="text-right text-slate-500"><span dir="rtl">{grp.ar}</span></Cell>
              <Cell /><Cell />
            </Row>,
            ...VAT_RETURN_LINES.filter((l) => l.group === grp.key).map((l) => {
              const v = g(l.box)
              const isTotal = 'total' in l && l.total
              return (
                <Row key={l.box} className={isTotal ? 'bg-slate-50/60 font-semibold' : ''}>
                  <Cell className="tabular text-xs text-slate-400">{l.box}</Cell>
                  <Cell className={isTotal ? 'text-slate-900' : ''}>{l.label}</Cell>
                  <Cell className="text-right text-slate-500"><span dir="rtl">{l.ar}</span></Cell>
                  <Cell className="tabular">{l.group === 'net' ? '' : num(v.amount, 2)}</Cell>
                  <Cell className="tabular">{num(v.vat, 2)}</Cell>
                </Row>
              )
            }),
          ])}
        </Table>
        <div className="flex items-start gap-2 border-t border-slate-100 px-5 py-3 text-xs leading-relaxed text-slate-500">
          <FileCheck2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-teal-600" />
          Box 8 comes off the customs Bayan, not off a supplier invoice — import VAT is paid at the border and recovered here.
          Box 9 is the reverse charge on imported services, which appears on both sides of the return and nets to nil in cash terms.
        </div>
      </Card>

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHead title="Box 1 — where it comes from" sub="Drill down from any figure to the documents behind it" />
          <Table head={['Document', 'Client', 'Issued', 'Net', 'VAT']}>
            {docs.filter((d) => d.lines_c.some((l) => l.vat_rate > 0)).map((d) => (
              <Row key={d.doc_no}>
                <Cell className="tabular text-xs">{d.doc_no}</Cell>
                <Cell className="max-w-[170px] truncate">{d.client_name}</Cell>
                <Cell className="text-slate-500">{day(d.issue_date)}</Cell>
                <Cell className="tabular">{num(d.sign * d.lines_c.filter((l) => l.vat_rate > 0).reduce((s, l) => s + l.net, 0), 2)}</Cell>
                <Cell className="tabular">{num(d.sign * d.vat, 2)}</Cell>
              </Row>
            ))}
          </Table>
        </Card>

        <Card>
          <CardHead title="What is deliberately not here" sub="Two figures a naive system would wrongly pull onto this return" />
          <div className="space-y-5 p-5 text-sm leading-relaxed text-slate-600">
            <div>
              <div className="mb-1 flex items-center gap-2 font-semibold text-slate-800">
                <AlertTriangle className="h-4 w-4 shrink-0 text-amber-500" />
                Duty recharged to clients — {sar(oosTotal)}
              </div>
              <p>
                Recharged at cost, so it is outside the scope of VAT and reaches no box at all. If the Bayan were in
                Logistica&apos;s name instead of the client&apos;s, every riyal would be standard-rated. That is why the declaration
                holder is a field on the job, not a checkbox on the invoice.
              </p>
            </div>
            <div>
              <div className="mb-1 flex items-center gap-2 font-semibold text-slate-800">
                <AlertTriangle className="h-4 w-4 shrink-0 text-amber-500" />
                Import VAT on client Bayans — box 8 is nil
              </div>
              <p>
                Millions of riyals of import VAT pass through the duty ledger, and none of it is Logistica&apos;s to recover.
                It is paid in the client&apos;s name, so it is the client&apos;s input tax on the client&apos;s return. Box 8 here carries
                only VAT on goods Logistica imports for itself.
              </p>
            </div>
            <p className="border-t border-slate-100 pt-4 text-xs text-slate-500">
              Correction threshold: an error below SAR 5,000 is adjusted in box 14 of the next return. Above that, the original
              return must be amended.
            </p>
          </div>
        </Card>
      </div>
    </>
  )
}
