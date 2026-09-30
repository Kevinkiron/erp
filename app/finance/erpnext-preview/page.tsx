'use client'

import { useMemo, useState } from 'react'
import { Card, CardHead, PageHead, Stat, Table, Row, Cell, Tag, Field } from '@/components/ui'
import { num, sar, day } from '@/lib/format'
import { postings, ageing, banks } from '@/lib/finance-data'
import { accounts } from '@/lib/finance'

export const dynamic = 'force-dynamic'

/**
 * Preview only — not linked from the sidebar.
 *
 * This models how our ledger would look once it sits on ERPNext's real
 * doctypes (Chart of Accounts, GL Entry, Journal Entry, Accounts Receivable,
 * Bank Reconciliation Tool) instead of our own finance.ts. It reads from the
 * SAME demo data the rest of the app already uses (lib/finance-data, seeded
 * from lib/seed/finance) — nothing here is a separate invented dataset — so
 * the only thing that changes when we actually integrate is where that data
 * comes from, not the shape of these screens.
 */

const ROOT_TYPE: Record<string, string> = {
  asset: 'Asset', liability: 'Liability', equity: 'Equity', revenue: 'Income', cost: 'Expense', expense: 'Expense',
}

const TABS = [
  { key: 'coa', label: 'Chart of Accounts' },
  { key: 'gl', label: 'General Ledger' },
  { key: 'je', label: 'Journal Entries' },
  { key: 'ar', label: 'Accounts Receivable' },
  { key: 'bank', label: 'Bank Reconciliation' },
] as const

type TabKey = (typeof TABS)[number]['key']

export default function ErpNextPreview() {
  const [tab, setTab] = useState<TabKey>('coa')
  const [glAccount, setGlAccount] = useState('1300')
  const [selectedJv, setSelectedJv] = useState<string | null>(postings[0]?.jv_no ?? null)

  return (
    <>
      <PageHead
        title="ERPNext Preview"
        sub="A model of how the ledger reads once it lives on ERPNext's own doctypes — built from our existing demo ledger, ahead of the real integration."
        right={<Tag tone="amber">Preview · not connected to ERPNext</Tag>}
      />

      <Card className="mb-6">
        <div className="flex flex-wrap gap-1.5 px-5 py-3">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`rounded-lg px-3 py-1.5 text-[13px] font-medium transition ${
                tab === t.key ? 'bg-teal-600 text-white' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </Card>

      {tab === 'coa' && <ChartOfAccounts />}
      {tab === 'gl' && <GeneralLedger account={glAccount} onAccount={setGlAccount} />}
      {tab === 'je' && <JournalEntries selected={selectedJv} onSelect={setSelectedJv} />}
      {tab === 'ar' && <AccountsReceivable />}
      {tab === 'bank' && <BankReconciliation />}
    </>
  )
}

/* ------------------------------------------------------------ Chart of Accounts */

function ChartOfAccounts() {
  const groups = ['asset', 'liability', 'equity', 'revenue', 'cost', 'expense']
  return (
    <Card>
      <CardHead
        title="Chart of Accounts"
        sub="Same accounts as our finance module, relabelled onto ERPNext's fields — account number, root type, account type."
      />
      <Table head={['Account Number', 'Account Name', 'Root Type', 'Account Type', 'VAT box']}>
        {groups.flatMap((g) => {
          const rows = accounts.filter((a) => a.type === g)
          if (!rows.length) return []
          return [
            <Row key={`h-${g}`} className="bg-slate-50/80">
              <Cell className="font-semibold text-slate-800">{ROOT_TYPE[g]}</Cell>
              <Cell /><Cell /><Cell /><Cell />
            </Row>,
            ...rows.map((a) => (
              <Row key={a.code}>
                <Cell className="tabular text-xs text-slate-500">{a.code}</Cell>
                <Cell>{a.name_en}</Cell>
                <Cell className="text-xs text-slate-400">{ROOT_TYPE[a.type]}</Cell>
                <Cell className="text-xs text-slate-400">{a.type === 'asset' && a.code.startsWith('10') ? 'Bank' : a.type === 'asset' ? 'Current Asset' : a.type === 'liability' ? 'Current Liability' : a.type === 'revenue' ? 'Income Account' : a.type === 'cost' ? 'Cost of Goods Sold' : a.type === 'expense' ? 'Expense Account' : 'Equity'}</Cell>
                <Cell>{a.vat_box ? <Tag tone="brand">box {a.vat_box}</Tag> : <span className="text-slate-300">—</span>}</Cell>
              </Row>
            )),
          ]
        })}
      </Table>
    </Card>
  )
}

/* ------------------------------------------------------------ General Ledger */

function GeneralLedger({ account, onAccount }: { account: string; onAccount: (v: string) => void }) {
  const glRows = useMemo(() => {
    const ordered = [...postings].sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : a.jv_no < b.jv_no ? -1 : 1))
    let bal = 0
    const rows: { date: string; jv_no: string; memo: string; debit: number; credit: number; balance: number }[] = []
    for (const p of ordered) {
      for (const l of p.lines) {
        if (l.account !== account) continue
        bal += l.debit - l.credit
        rows.push({ date: p.date, jv_no: p.jv_no, memo: l.desc || p.memo, debit: l.debit, credit: l.credit, balance: bal })
      }
    }
    return rows
  }, [account])

  const acc = accounts.find((a) => a.code === account)
  const closing = glRows.at(-1)?.balance ?? 0

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <label className="text-xs font-medium uppercase tracking-wider text-slate-500">Account</label>
        <select
          value={account}
          onChange={(e) => onAccount(e.target.value)}
          className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-800"
        >
          {accounts.map((a) => (
            <option key={a.code} value={a.code}>{a.code} · {a.name_en}</option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat label="Account" value={account} hint={acc?.name_en} />
        <Stat label="GL entries" value={String(glRows.length)} />
        <Stat label="Closing balance" value={sar(closing, { compact: true })} tone={closing >= 0 ? 'default' : 'bad'} />
        <Stat label="Root type" value={acc ? ROOT_TYPE[acc.type] : '—'} />
      </div>

      <Card className="mt-6">
        <CardHead title="General Ledger" sub="One row per posted GL Entry against this account, oldest first, with a running balance." />
        <Table head={['Date', 'Voucher No', 'Remarks', 'Debit', 'Credit', 'Balance']}>
          {glRows.map((r, i) => (
            <Row key={`${r.jv_no}-${i}`}>
              <Cell className="text-slate-500">{day(r.date)}</Cell>
              <Cell className="tabular text-xs text-teal-700">{r.jv_no}</Cell>
              <Cell className="max-w-[320px] truncate">{r.memo}</Cell>
              <Cell className="tabular">{r.debit ? num(r.debit, 2) : ''}</Cell>
              <Cell className="tabular">{r.credit ? num(r.credit, 2) : ''}</Cell>
              <Cell className="tabular font-medium">{num(r.balance, 2)}</Cell>
            </Row>
          ))}
        </Table>
      </Card>
    </>
  )
}

/* ------------------------------------------------------------ Journal Entries */

function JournalEntries({ selected, onSelect }: { selected: string | null; onSelect: (v: string) => void }) {
  const sel = postings.find((p) => p.jv_no === selected) ?? postings[0]
  return (
    <>
      <Card>
        <CardHead title="Journal Entries" sub="Every voucher posted to the ledger — sales, purchases, expense claims and manual journals alike." />
        <Table head={['Voucher No', 'Date', 'Type', 'Remarks', 'Prepared by', 'Total']}>
          {postings.map((p) => {
            const total = p.lines.reduce((s, l) => s + l.debit, 0)
            return (
              <Row
                key={p.jv_no}
                className={`cursor-pointer ${sel?.jv_no === p.jv_no ? 'bg-teal-50/60' : ''}`}
                onClick={() => onSelect(p.jv_no)}
              >
                <Cell className="tabular text-xs font-medium text-teal-700">{p.jv_no}</Cell>
                <Cell className="text-slate-500">{day(p.date)}</Cell>
                <Cell className="text-xs text-slate-400">{p.source}</Cell>
                <Cell className="max-w-[280px] truncate">{p.memo}</Cell>
                <Cell className="text-xs text-slate-500">{p.prepared_by}</Cell>
                <Cell className="tabular font-medium">{sar(total, { compact: true })}</Cell>
              </Row>
            )
          })}
        </Table>
      </Card>

      {sel && (
        <Card className="mt-6">
          <CardHead
            title={`Journal Entry — ${sel.jv_no}`}
            sub={sel.memo}
            right={sel.approved_by ? <Tag tone="brand">approved by {sel.approved_by}</Tag> : <Tag tone="amber">pending approval</Tag>}
          />
          <div className="grid grid-cols-2 gap-4 px-5 py-4 sm:grid-cols-4">
            <Field label="Posting date" value={day(sel.date)} />
            <Field label="Reference" value={sel.source} />
            <Field label="Prepared by" value={sel.prepared_by} />
            <Field label="Approved by" value={sel.approved_by ?? '—'} />
          </div>
          <Table head={['Account', 'Job', 'Description', 'Debit', 'Credit']}>
            {sel.lines.map((l, i) => (
              <Row key={i}>
                <Cell>{l.account} · {l.account_name}</Cell>
                <Cell className="text-xs text-slate-400">{l.job_no ?? '—'}</Cell>
                <Cell className="max-w-[280px] truncate text-xs text-slate-500">{l.desc}</Cell>
                <Cell className="tabular">{l.debit ? num(l.debit, 2) : ''}</Cell>
                <Cell className="tabular">{l.credit ? num(l.credit, 2) : ''}</Cell>
              </Row>
            ))}
            <Row className="bg-slate-50 font-semibold">
              <Cell className="text-slate-900">Total</Cell>
              <Cell /><Cell />
              <Cell className="tabular">{num(sel.lines.reduce((s, l) => s + l.debit, 0), 2)}</Cell>
              <Cell className="tabular">{num(sel.lines.reduce((s, l) => s + l.credit, 0), 2)}</Cell>
            </Row>
          </Table>
        </Card>
      )}
    </>
  )
}

/* ------------------------------------------------------------ Accounts Receivable */

function AccountsReceivable() {
  const bucket = (age: number) => (age <= 0 ? 'current' : age <= 30 ? 'b1' : age <= 60 ? 'b2' : 'b3')
  const totals = ageing.reduce(
    (s, r) => {
      s[bucket(r.age)] += r.total
      s.total += r.total
      return s
    },
    { current: 0, b1: 0, b2: 0, b3: 0, total: 0 } as Record<string, number>,
  )

  return (
    <>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        <Stat label="Total outstanding" value={sar(totals.total, { compact: true })} hint={`${ageing.length} open invoices`} />
        <Stat label="Current" value={sar(totals.current, { compact: true })} tone="good" />
        <Stat label="1–30 days" value={sar(totals.b1, { compact: true })} />
        <Stat label="31–60 days" value={sar(totals.b2, { compact: true })} tone="warn" />
        <Stat label="60+ days" value={sar(totals.b3, { compact: true })} tone="bad" />
      </div>

      <Card className="mt-6">
        <CardHead title="Accounts Receivable Ageing" sub="Open sales invoices as of the demo period end, oldest first." />
        <Table head={['Invoice', 'Customer', 'Posting Date', 'Age (days)', 'Bucket', 'Outstanding']}>
          {ageing.map((r) => (
            <Row key={r.doc_no}>
              <Cell className="tabular text-xs text-teal-700">{r.doc_no}</Cell>
              <Cell>{r.client}</Cell>
              <Cell className="text-slate-500">{day(r.issue_date)}</Cell>
              <Cell className="tabular">{r.age}</Cell>
              <Cell>
                {bucket(r.age) === 'current' && <Tag tone="brand">current</Tag>}
                {bucket(r.age) === 'b1' && <Tag>1–30</Tag>}
                {bucket(r.age) === 'b2' && <Tag tone="amber">31–60</Tag>}
                {bucket(r.age) === 'b3' && <Tag tone="rose">60+</Tag>}
              </Cell>
              <Cell className="tabular font-medium">{sar(r.total)}</Cell>
            </Row>
          ))}
        </Table>
      </Card>
    </>
  )
}

/* ------------------------------------------------------------ Bank Reconciliation */

function BankReconciliation() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHead title="Bank Reconciliation Tool" sub="Statement lines matched against Payment Entries and Journal Entries, per bank account." />
      </Card>
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
          <Table head={['Date', 'Bank Statement Narration', 'Debit', 'Credit', 'Matched Voucher', 'Status']}>
            {b.lines.map((l) => (
              <Row key={l.id} className={l.matched_to ? '' : 'bg-amber-50/40'}>
                <Cell className="text-slate-500">{day(l.date)}</Cell>
                <Cell className="max-w-[300px] truncate font-mono text-xs text-slate-700">{l.description}</Cell>
                <Cell className="tabular">{l.debit ? num(l.debit, 2) : ''}</Cell>
                <Cell className="tabular">{l.credit ? num(l.credit, 2) : ''}</Cell>
                <Cell className="tabular text-xs">{l.matched_to ?? '—'}</Cell>
                <Cell>{l.matched_to ? <Tag tone="brand">reconciled</Tag> : <Tag tone="amber">unreconciled</Tag>}</Cell>
              </Row>
            ))}
          </Table>
        </Card>
      ))}
    </div>
  )
}
