'use client'

import { useMemo, useState } from 'react'
import { Card, CardHead, PageHead, Stat, Table, Row, Cell, Tag, Field } from '@/components/ui'
import { num, sar, day } from '@/lib/format'
import { postings, ageing, banks, tb } from '@/lib/finance-data'
import { accounts, COMPANY } from '@/lib/finance'
import { ChevronRight, ChevronDown, Folder, FolderOpen, FileText, Search, Plus, List } from 'lucide-react'

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

/**
 * Laid out as a searchable, collapsible tree (root group -> sub-ledger ->
 * account) rather than our usual flat table — modelled on the account-setup
 * screen a client shared with us (a hospital ERP's Chart of Accounts), reskinned
 * onto our own brand, codes and account names. The grouping below is real:
 * it follows the 4-digit code ranges already in lib/seed/finance.ts, not an
 * invented structure.
 */

type CoaGroup = { label: string; codes: string[] }
const COA_TREE: Record<string, { label: string; groups: CoaGroup[] }> = {
  asset: {
    label: 'Assets',
    groups: [
      { label: 'Cash and bank', codes: ['1010', '1020', '1030'] },
      { label: 'Receivables', codes: ['1100', '1150'] },
      { label: 'VAT recoverable', codes: ['1200', '1210', '1220'] },
      { label: 'Prepayments and advances', codes: ['1250'] },
      { label: 'Customs duty paid on behalf of clients', codes: ['1300'] },
      { label: 'Fixed assets', codes: ['1500', '1510', '1520', '1521'] },
    ],
  },
  liability: {
    label: 'Liabilities',
    groups: [
      { label: 'Payables', codes: ['2010', '2020'] },
      { label: 'Customs duty payable', codes: ['2050'] },
      { label: 'VAT payable', codes: ['2100', '2110'] },
      { label: 'Customs duty advances held', codes: ['2150'] },
      { label: 'Customer advances (unearned revenue)', codes: ['2160'] },
      { label: 'Accrued and statutory', codes: ['2200', '2260', '2270', '2300', '2400'] },
    ],
  },
  equity: { label: 'Equity', groups: [{ label: 'Share capital and reserves', codes: ['3010', '3020', '3030'] }] },
  revenue: {
    label: 'Revenue',
    groups: [
      { label: 'Operating revenue', codes: ['4010', '4020', '4030', '4040', '4050', '4060'] },
      { label: 'Other income', codes: ['4900'] },
    ],
  },
  cost: { label: 'Direct costs', groups: [{ label: 'Direct costs', codes: ['5010', '5020', '5030', '5040', '5050', '5060', '5070', '5080'] }] },
  expense: { label: 'Operating expenses', groups: [{ label: 'Operating expenses', codes: ['6010', '6020', '6030', '6040', '6050', '6060', '6070', '6080', '6090', '6100', '6900'] }] },
}

const balanceOfAcc = (code: string) => tb.find((a) => a.code === code)?.balance ?? 0

function ChartOfAccounts() {
  const [q, setQ] = useState('')
  const [view, setView] = useState<'tree' | 'flat'>('tree')
  const [openRoots, setOpenRoots] = useState<Set<string>>(new Set(Object.keys(COA_TREE)))
  const [openGroups, setOpenGroups] = useState<Set<string>>(new Set())

  const query = q.trim().toLowerCase()
  const matches = (code: string, name: string) =>
    !query || code.includes(query) || name.toLowerCase().includes(query)

  const toggleRoot = (k: string) => setOpenRoots((s) => {
    const n = new Set(s); n.has(k) ? n.delete(k) : n.add(k); return n
  })
  const toggleGroup = (k: string) => setOpenGroups((s) => {
    const n = new Set(s); n.has(k) ? n.delete(k) : n.add(k); return n
  })

  const totalDebit = tb.reduce((s, a) => s + a.debit, 0)
  const totalCredit = tb.reduce((s, a) => s + a.credit, 0)
  const balanced = Math.abs(totalDebit - totalCredit) < 0.01

  return (
    <>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat label="Accounts" value={String(accounts.length)} hint={`${tb.length} with movement`} />
        <Stat label="Total debits" value={sar(totalDebit, { compact: true })} />
        <Stat label="Total credits" value={sar(totalCredit, { compact: true })} />
        <Stat label="Trial balance" value={balanced ? 'Balanced' : 'Out of balance'} tone={balanced ? 'good' : 'bad'} hint={`${postings.length} journals posted`} />
      </div>

      <Card className="mt-6">
      <CardHead
        title="Chart of Accounts"
        sub="Same ledger accounts as the rest of the finance module, laid out as a tree you can search and drill into."
        right={
          <button
            disabled
            title="Preview — account creation isn't wired up yet"
            className="flex cursor-not-allowed items-center gap-1.5 rounded-lg bg-teal-600/50 px-3 py-1.5 text-[13px] font-medium text-white"
          >
            <Plus className="h-3.5 w-3.5" /> New Account
          </button>
        }
      />

      <div className="flex flex-wrap items-center gap-2.5 border-b border-slate-100 px-5 py-3.5">
        <div className="relative">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search code or name"
            className="w-56 rounded-lg border border-slate-200 bg-white py-1.5 pl-8 pr-3 text-[13px] text-slate-700 placeholder:text-slate-400"
          />
        </div>
        <span className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-[13px] text-slate-600">
          {COMPANY.legal_name_en}
        </span>
        <div className="ml-auto flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 p-0.5">
          <button
            onClick={() => setView('tree')}
            className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[12px] font-medium ${view === 'tree' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500'}`}
          >
            <FolderOpen className="h-3.5 w-3.5" /> Tree
          </button>
          <button
            onClick={() => setView('flat')}
            className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[12px] font-medium ${view === 'flat' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500'}`}
          >
            <List className="h-3.5 w-3.5" /> Flat
          </button>
        </div>
      </div>

      {view === 'tree' ? (
        <div className="px-2 py-2">
          <div className="flex items-center gap-2 px-3 py-2 text-[13px] font-semibold text-slate-800">
            <Folder className="h-4 w-4 text-slate-300" />
            <span>{COMPANY.legal_name_en}</span>
          </div>
          {Object.entries(COA_TREE).map(([rootKey, root]) => {
            const rootOpen = openRoots.has(rootKey)
            const rootAccounts = root.groups.flatMap((g) => g.codes.map((c) => accounts.find((a) => a.code === c)!).filter(Boolean))
            const rootVisible = !query || rootAccounts.some((a) => matches(a.code, a.name_en))
            if (!rootVisible) return null
            const rootBalance = rootAccounts.reduce((s, a) => s + balanceOfAcc(a.code), 0)
            return (
              <div key={rootKey}>
                <button
                  onClick={() => toggleRoot(rootKey)}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-[13px] font-semibold text-slate-800 hover:bg-slate-50"
                >
                  {rootOpen ? <ChevronDown className="h-3.5 w-3.5 text-slate-400" /> : <ChevronRight className="h-3.5 w-3.5 text-slate-400" />}
                  {rootOpen ? <FolderOpen className="h-4 w-4 text-teal-600" /> : <Folder className="h-4 w-4 text-teal-600" />}
                  <span>{root.label}</span>
                  <span className="ml-auto tabular font-normal text-slate-400">{sar(rootBalance, { compact: true })}</span>
                </button>
                {rootOpen && root.groups.map((g) => {
                  const groupKey = `${rootKey}:${g.label}`
                  const groupOpen = openGroups.has(groupKey) || !!query
                  const groupAccs = g.codes.map((c) => accounts.find((a) => a.code === c)!).filter(Boolean)
                  const groupVisible = !query || groupAccs.some((a) => matches(a.code, a.name_en))
                  if (!groupVisible) return null
                  const groupBalance = groupAccs.reduce((s, a) => s + balanceOfAcc(a.code), 0)
                  return (
                    <div key={groupKey}>
                      <button
                        onClick={() => toggleGroup(groupKey)}
                        className="flex w-full items-center gap-2 rounded-lg py-1.5 pl-9 pr-3 text-left text-[13px] text-slate-700 hover:bg-slate-50"
                      >
                        {groupOpen ? <ChevronDown className="h-3.5 w-3.5 text-slate-400" /> : <ChevronRight className="h-3.5 w-3.5 text-slate-400" />}
                        {groupOpen ? <FolderOpen className="h-4 w-4 text-slate-400" /> : <Folder className="h-4 w-4 text-slate-400" />}
                        <span>{g.label}</span>
                        <span className="ml-auto tabular font-normal text-slate-400">{sar(groupBalance, { compact: true })}</span>
                      </button>
                      {groupOpen && groupAccs.filter((a) => matches(a.code, a.name_en)).map((a) => (
                        <div key={a.code} className="flex items-center gap-2 py-1.5 pl-16 pr-3 text-[13px] text-slate-600 hover:bg-slate-50">
                          <FileText className="h-3.5 w-3.5 text-slate-300" />
                          <span className="tabular text-xs text-slate-400">{a.code}</span>
                          <span>{a.name_en}</span>
                          {a.vat_box && <Tag tone="brand">box {a.vat_box}</Tag>}
                          <span className="ml-auto tabular text-slate-700">{sar(balanceOfAcc(a.code))}</span>
                        </div>
                      ))}
                    </div>
                  )
                })}
              </div>
            )
          })}
        </div>
      ) : (
        <Table head={['Code', 'Account', 'Type', 'VAT box', 'Balance']}>
          {accounts.filter((a) => matches(a.code, a.name_en)).map((a) => (
            <Row key={a.code}>
              <Cell className="tabular text-xs text-slate-500">{a.code}</Cell>
              <Cell>{a.name_en}</Cell>
              <Cell className="text-xs text-slate-400">{COA_TREE[a.type]?.label ?? a.type}</Cell>
              <Cell>{a.vat_box ? <Tag tone="brand">box {a.vat_box}</Tag> : <span className="text-slate-300">—</span>}</Cell>
              <Cell className="tabular font-medium">{sar(balanceOfAcc(a.code))}</Cell>
            </Row>
          ))}
        </Table>
      )}
      </Card>
    </>
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
        <Stat label="Root type" value={acc ? (COA_TREE[acc.type]?.label ?? acc.type) : '—'} />
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
