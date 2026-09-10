import { Card, CardHead, PageHead, Stat, Table, Row, Cell, Tag } from '@/components/ui'
import { num, sar } from '@/lib/format'
import { tb, postings } from '@/lib/finance-data'
import { accounts, taxCodes } from '@/lib/finance'

export const dynamic = 'force-dynamic'

const GROUPS = [
  { key: 'asset', label: 'Assets', ar: 'الأصول' },
  { key: 'liability', label: 'Liabilities', ar: 'الالتزامات' },
  { key: 'equity', label: 'Equity', ar: 'حقوق الملكية' },
  { key: 'revenue', label: 'Revenue', ar: 'الإيرادات' },
  { key: 'cost', label: 'Direct costs', ar: 'التكاليف المباشرة' },
  { key: 'expense', label: 'Operating expenses', ar: 'المصروفات التشغيلية' },
]

export default function Accounts() {
  const totalDebit = tb.reduce((s, a) => s + a.debit, 0)
  const totalCredit = tb.reduce((s, a) => s + a.credit, 0)
  const balanced = Math.abs(totalDebit - totalCredit) < 0.01

  return (
    <>
      <PageHead
        title="Chart of Accounts"
        sub="Bilingual, and structured backwards from the outputs — the 16 VAT return lines, the Zakat base, and withholding tax."
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat label="Accounts" value={String(accounts.length)} hint={`${tb.length} with movement`} />
        <Stat label="Total debits" value={sar(totalDebit, { compact: true })} />
        <Stat label="Total credits" value={sar(totalCredit, { compact: true })} />
        <Stat label="Trial balance" value={balanced ? 'Balanced' : 'Out of balance'} tone={balanced ? 'good' : 'bad'} hint={`${postings.length} journals posted`} />
      </div>

      <Card className="mt-6">
        <CardHead title="Trial balance" sub="Derived from every posted document — nothing here is entered by hand" />
        <Table head={['Code', 'Account', 'الحساب', 'Type', 'VAT box', 'Debit', 'Credit', 'Balance']}>
          {GROUPS.flatMap((g) => {
            const rows = tb.filter((a) => a.type === g.key)
            if (!rows.length) return []
            return [
              <Row key={`h-${g.key}`} className="bg-slate-50/80">
                <Cell className="font-semibold text-slate-800">{g.label}</Cell>
                <Cell /><Cell className="text-right text-slate-500" ><span dir="rtl">{g.ar}</span></Cell>
                <Cell /><Cell /><Cell /><Cell /><Cell />
              </Row>,
              ...rows.map((a) => (
                <Row key={a.code}>
                  <Cell className="tabular text-xs text-slate-500">{a.code}</Cell>
                  <Cell>{a.name_en}</Cell>
                  <Cell className="text-slate-500" ><span dir="rtl">{a.name_ar}</span></Cell>
                  <Cell className="text-xs text-slate-400">{a.type}</Cell>
                  <Cell>{a.vat_box ? <Tag tone="brand">box {a.vat_box}</Tag> : <span className="text-slate-300">—</span>}</Cell>
                  <Cell className="tabular">{a.debit ? num(a.debit, 2) : ''}</Cell>
                  <Cell className="tabular">{a.credit ? num(a.credit, 2) : ''}</Cell>
                  <Cell className="tabular font-medium">{num(a.balance, 2)}</Cell>
                </Row>
              )),
            ]
          })}
          <Row className="bg-slate-50 font-semibold">
            <Cell className="text-slate-900">Total</Cell>
            <Cell /><Cell /><Cell /><Cell />
            <Cell className="tabular text-slate-900">{num(totalDebit, 2)}</Cell>
            <Cell className="tabular text-slate-900">{num(totalCredit, 2)}</Cell>
            <Cell className="tabular text-slate-900">{num(totalDebit - totalCredit, 2)}</Cell>
          </Row>
        </Table>
      </Card>

      <Card className="mt-6">
        <CardHead title="Tax codes" sub="Every document line carries one. It decides the rate, the return box, and whether an exemption reason is needed." />
        <Table head={['Code', 'Treatment', 'Rate', 'Side', 'VAT return box', 'Exemption reason']}>
          {taxCodes.map((t) => (
            <Row key={t.code}>
              <Cell><Tag tone={t.category === 'standard' ? 'brand' : t.category === 'out_of_scope' ? 'slate' : 'amber'}>{t.code}</Tag></Cell>
              <Cell>{t.label}</Cell>
              <Cell className="tabular">{t.rate}%</Cell>
              <Cell className="text-slate-500">{t.side}</Cell>
              <Cell className="text-slate-500">{t.box ? `Box ${t.box}` : 'Not reported'}</Cell>
              <Cell className="text-xs text-slate-500">{t.reason ?? '—'}</Cell>
            </Row>
          ))}
        </Table>
      </Card>
    </>
  )
}
