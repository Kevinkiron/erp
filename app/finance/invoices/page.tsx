import Link from 'next/link'
import { Card, CardHead, PageHead, Stat, Table, Row, Cell, Tag } from '@/components/ui'
import { ZatcaPill } from '@/components/zatca-pill'
import { sar, day } from '@/lib/format'
import { docs } from '@/lib/finance-data'
import { VAT_CATEGORY_LABEL } from '@/lib/zatca'

export const dynamic = 'force-dynamic'

const TYPE_LABEL: Record<string, string> = { invoice: 'Tax invoice', credit_note: 'Credit note', debit_note: 'Debit note' }

export default function Invoices() {
  const cleared = docs.filter((d) => d.clearance.startsWith('cleared') || d.clearance === 'reported')
  const output = docs.reduce((s, d) => s + d.sign * d.vat, 0)
  const oos = docs.reduce((s, d) => s + d.sign * d.lines_c.filter((l) => l.tax_code === 'OOS').reduce((x, l) => x + l.net, 0), 0)
  const zero = docs.reduce((s, d) => s + d.sign * d.lines_c.filter((l) => l.vat_rate === 0 && l.tax_code !== 'OOS').reduce((x, l) => x + l.net, 0), 0)

  return (
    <>
      <PageHead
        title="Sales Documents"
        sub="Tax invoices, credit notes and debit notes — the ZATCA register. Saudi recognises debit notes; the UAE does not."
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        <Stat label="Documents" value={String(docs.length)} hint={`${cleared.length} cleared or reported`} />
        <Stat label="Output VAT" value={sar(output, { compact: true })} hint="Goes to box 1 of the return" />
        <Stat label="Zero-rated" value={sar(zero, { compact: true })} hint="International transport — box 3" tone="good" />
        <Stat label="Out of scope" value={sar(oos, { compact: true })} hint="Duty disbursements — never on the return" />
        <Stat label="Not cleared" value={String(docs.filter((d) => d.clearance === 'pending').length)} tone="warn" hint="Not valid until ZATCA clears" />
      </div>

      <Card className="mt-6">
        <CardHead title="Register" sub="ICV is the invoice counter for this EGS unit — it never resets and never repeats" />
        <Table head={['Document', 'Type', 'Client', 'Buyer VAT', 'Issued', 'Supply', 'ICV', 'Net', 'VAT', 'Total', 'ZATCA']}>
          {docs.map((d) => (
            <Row key={d.doc_no}>
              <Cell>
                <Link href={`/finance/invoices/${encodeURIComponent(d.doc_no)}`} className="tabular font-medium text-teal-700 hover:underline">{d.doc_no}</Link>
              </Cell>
              <Cell>
                <span className="text-slate-600">{TYPE_LABEL[d.type]}</span>
                {d.simplified && <Tag tone="slate">simplified</Tag>}
              </Cell>
              <Cell className="max-w-[190px] truncate">{d.client_name}</Cell>
              <Cell className="tabular text-xs text-slate-500">{d.buyer_vat_no ?? '—'}</Cell>
              <Cell className="text-slate-500">{day(d.issue_date)}</Cell>
              <Cell className="text-slate-500">{day(d.supply_date)}</Cell>
              <Cell className="tabular text-xs text-slate-500">{d.icv}</Cell>
              <Cell className="tabular">{sar(d.sign * d.net, { compact: true })}</Cell>
              <Cell className="tabular">{sar(d.sign * d.vat, { compact: true })}</Cell>
              <Cell className="tabular font-medium">{sar(d.sign * d.total, { compact: true })}</Cell>
              <Cell><ZatcaPill status={d.clearance} /></Cell>
            </Row>
          ))}
        </Table>
      </Card>

      <Card className="mt-6">
        <CardHead title="How each line is treated" sub="The tax code decides the rate, the return box, and whether an exemption reason is required" />
        <Table head={['Line', 'Document', 'Tax code', 'Treatment', 'Net', 'VAT']}>
          {docs.flatMap((d) => d.lines_c.map((l, i) => (
            <Row key={`${d.doc_no}-${i}`}>
              <Cell className="max-w-[320px] truncate">{l.desc_en}</Cell>
              <Cell className="tabular text-xs text-slate-500">{d.doc_no}</Cell>
              <Cell><Tag tone={l.vat_rate > 0 ? 'brand' : l.tax_code === 'OOS' ? 'slate' : 'amber'}>{l.tax_code}</Tag></Cell>
              <Cell className="text-slate-500">
                {l.tax_code === 'OOS' ? VAT_CATEGORY_LABEL.out_of_scope : l.vat_rate > 0 ? VAT_CATEGORY_LABEL.standard : VAT_CATEGORY_LABEL.zero}
              </Cell>
              <Cell className="tabular">{sar(l.net)}</Cell>
              <Cell className="tabular">{l.vat > 0 ? sar(l.vat) : '—'}</Cell>
            </Row>
          )))}
        </Table>
      </Card>
    </>
  )
}
