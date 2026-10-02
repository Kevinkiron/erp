'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { Card, CardHead, PageHead, Table, Row, Cell, Tag, Field } from '@/components/ui'
import { num, sar, day } from '@/lib/format'
import { postings } from '@/lib/finance-data'
import { accounts } from '@/lib/finance'
import { Plus, X, Pencil } from 'lucide-react'

export const dynamic = 'force-dynamic'

/**
 * Post, edit and review every journal voucher on the ledger. Split out of the
 * ERPNext Preview into its own section — Chart of Accounts and the other
 * read-oriented tabs stay in the preview, while day-to-day journal work gets
 * its own place in the nav. Reads and writes the same demo ledger
 * (lib/finance-data, seeded from lib/seed/finance) as the rest of the app;
 * edits and new entries here are session-only, same as the rest of this
 * preview build — nothing is written back to the ledger file yet.
 */

export default function JournalEntriesPage() {
  return (
    <>
      <PageHead
        title="Journal Entries"
        sub="Post, review and edit every voucher on the ledger — sales, purchases, expense claims and manual journals alike."
        right={<Tag tone="amber">Preview · not connected to ERPNext</Tag>}
      />
      <JournalEntries />
    </>
  )
}

/* ------------------------------------------------------------ Journal Entries */

type JeLine = { id: number; account: string; desc: string; debit: string; credit: string }

function JournalEntryForm({
  mode, jvNo, initial, onCancel, onSave,
}: {
  mode: 'new' | 'edit'
  jvNo: string
  initial?: (typeof postings)[number]
  onCancel: () => void
  onSave: (entry: (typeof postings)[number]) => void
}) {
  const [date, setDate] = useState(initial?.date ?? '2026-08-15')
  const [reference, setReference] = useState('')
  const [memo, setMemo] = useState(initial?.memo ?? '')
  const [lines, setLines] = useState<JeLine[]>(
    initial
      ? initial.lines.map((l, i) => ({ id: i + 1, account: l.account, desc: l.desc, debit: l.debit ? String(l.debit) : '', credit: l.credit ? String(l.credit) : '' }))
      : [
          { id: 1, account: accounts[0]?.code ?? '', desc: '', debit: '', credit: '' },
          { id: 2, account: accounts[1]?.code ?? '', desc: '', debit: '', credit: '' },
        ],
  )
  const [error, setError] = useState('')

  const updateLine = (id: number, patch: Partial<JeLine>) => setLines((ls) => ls.map((l) => (l.id === id ? { ...l, ...patch } : l)))
  const addLine = () => setLines((ls) => [...ls, { id: (ls.at(-1)?.id ?? 0) + 1, account: accounts[0]?.code ?? '', desc: '', debit: '', credit: '' }])
  const removeLine = (id: number) => setLines((ls) => (ls.length > 2 ? ls.filter((l) => l.id !== id) : ls))

  const totalDebit = lines.reduce((s, l) => s + (Number(l.debit) || 0), 0)
  const totalCredit = lines.reduce((s, l) => s + (Number(l.credit) || 0), 0)
  const diff = Math.round((totalDebit - totalCredit) * 100) / 100
  const balanced = diff === 0 && totalDebit > 0

  const save = () => {
    if (!memo.trim()) { setError('A narration is required so this entry is auditable later.'); return }
    if (!balanced) { setError('Total debit and total credit must match before saving.'); return }
    const postedLines = lines
      .filter((l) => (Number(l.debit) || 0) > 0 || (Number(l.credit) || 0) > 0)
      .map((l) => {
        const acc = accounts.find((a) => a.code === l.account)
        return { account: l.account, account_name: acc?.name_en ?? l.account, job_no: null, desc: l.desc, debit: Number(l.debit) || 0, credit: Number(l.credit) || 0 }
      })
    onSave({
      jv_no: jvNo,
      date,
      memo: mode === 'new' && reference ? `${memo} (${reference})` : memo,
      prepared_by: initial?.prepared_by ?? 'Accounts - Amal',
      approved_by: initial?.approved_by ?? null,
      source: initial?.source ?? 'Manual journal',
      lines: postedLines,
    } as (typeof postings)[number])
  }

  return (
    <Card className="mb-6">
      <CardHead
        title={mode === 'new' ? 'New Journal Entry' : `Edit Journal Entry — ${jvNo}`}
        sub="Standard double-entry capture — one row per ledger account touched. Debit and credit must balance before this can save."
      />
      <div className="grid grid-cols-2 gap-4 px-5 py-4 sm:grid-cols-4">
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-slate-500">Posting date</span>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-800" />
        </label>
        {mode === 'new' && (
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-slate-500">Reference (optional)</span>
            <input value={reference} onChange={(e) => setReference(e.target.value)} placeholder="PO / invoice / claim no." className="w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-800" />
          </label>
        )}
        <label className={`block ${mode === 'new' ? 'col-span-2' : 'col-span-3'}`}>
          <span className="mb-1 block text-xs font-medium text-slate-500">Narration</span>
          <input value={memo} onChange={(e) => setMemo(e.target.value)} placeholder="What this entry records, in plain words" className="w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-800" />
        </label>
      </div>

      <Table head={['Account', 'Description', 'Debit', 'Credit', '']}>
        {lines.map((l) => (
          <Row key={l.id}>
            <Cell>
              <select value={l.account} onChange={(e) => updateLine(l.id, { account: e.target.value })} className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs text-slate-800">
                {accounts.map((a) => <option key={a.code} value={a.code}>{a.code} · {a.name_en}</option>)}
              </select>
            </Cell>
            <Cell>
              <input value={l.desc} onChange={(e) => updateLine(l.id, { desc: e.target.value })} placeholder="Line description" className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs text-slate-700" />
            </Cell>
            <Cell>
              <input value={l.debit} onChange={(e) => updateLine(l.id, { debit: e.target.value, credit: e.target.value ? '' : l.credit })} type="number" placeholder="0.00" className="w-24 rounded-lg border border-slate-200 bg-white px-2 py-1 text-right text-xs tabular text-slate-800" />
            </Cell>
            <Cell>
              <input value={l.credit} onChange={(e) => updateLine(l.id, { credit: e.target.value, debit: e.target.value ? '' : l.debit })} type="number" placeholder="0.00" className="w-24 rounded-lg border border-slate-200 bg-white px-2 py-1 text-right text-xs tabular text-slate-800" />
            </Cell>
            <Cell>
              {lines.length > 2 && (
                <button onClick={() => removeLine(l.id)} className="rounded-md p-1 text-slate-300 hover:bg-slate-100 hover:text-red-500"><X className="h-3.5 w-3.5" /></button>
              )}
            </Cell>
          </Row>
        ))}
        <Row className="bg-slate-50 font-semibold">
          <Cell>
            <button onClick={addLine} className="flex items-center gap-1 text-[12px] font-medium text-teal-700 hover:text-teal-800"><Plus className="h-3.5 w-3.5" /> Add line</button>
          </Cell>
          <Cell className="text-slate-500">Total</Cell>
          <Cell className="tabular">{num(totalDebit, 2)}</Cell>
          <Cell className="tabular">{num(totalCredit, 2)}</Cell>
          <Cell />
        </Row>
      </Table>

      <div className="flex items-center justify-between border-t border-slate-100 px-5 py-3.5">
        <div className="text-[13px]">
          {balanced ? (
            <span className="font-medium text-teal-700">Balanced — ready to save</span>
          ) : (
            <span className="font-medium text-amber-700">Out of balance by {num(Math.abs(diff), 2)} SAR</span>
          )}
          {error && <span className="ml-3 text-red-600">{error}</span>}
        </div>
        <div className="flex gap-2">
          <button onClick={onCancel} className="rounded-lg px-3.5 py-1.5 text-[13px] font-medium text-slate-600 hover:bg-slate-50">Cancel</button>
          <button onClick={save} disabled={!balanced} className="rounded-lg bg-teal-600 px-3.5 py-1.5 text-[13px] font-medium text-white hover:bg-teal-700 disabled:cursor-not-allowed disabled:bg-teal-600/40">
            {mode === 'new' ? 'Post entry' : 'Save changes'}
          </button>
        </div>
      </div>
    </Card>
  )
}

function JournalEntries() {
  const [customPostings, setCustomPostings] = useState<typeof postings>([])
  const [overrides, setOverrides] = useState<Record<string, (typeof postings)[number]>>({})
  const [formMode, setFormMode] = useState<'none' | 'new' | 'edit'>('none')
  const [selected, onSelect] = useState<string | null>(postings[0]?.jv_no ?? null)
  const formRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (formMode !== 'none') formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [formMode])

  const basePostings = useMemo(() => [...customPostings, ...postings], [customPostings])
  const allPostings = useMemo(() => basePostings.map((p) => overrides[p.jv_no] ?? p), [basePostings, overrides])
  const sel = allPostings.find((p) => p.jv_no === selected) ?? allPostings[0]

  const nextJvNo = useMemo(() => {
    const nums = postings.map((p) => Number(p.jv_no.split('-').at(-1))).filter((n) => !Number.isNaN(n))
    const next = Math.max(0, ...nums) + 1 + customPostings.length
    return `JV-2026-${String(next).padStart(4, '0')}`
  }, [customPostings.length])

  return (
    <>
      <Card>
        <CardHead
          title="Journal Entries"
          sub="Every voucher posted to the ledger — sales, purchases, expense claims and manual journals alike."
          right={
            formMode === 'none' ? (
              <button onClick={() => setFormMode('new')} className="flex items-center gap-1.5 rounded-lg bg-teal-600 px-3 py-1.5 text-[13px] font-medium text-white hover:bg-teal-700">
                <Plus className="h-3.5 w-3.5" /> New Journal Entry
              </button>
            ) : undefined
          }
        />
        <Table head={['Voucher No', 'Date', 'Type', 'Remarks', 'Prepared by', 'Total']}>
          {allPostings.map((p) => {
            const total = p.lines.reduce((s, l) => s + l.debit, 0)
            return (
              <Row
                key={p.jv_no}
                className={`cursor-pointer ${sel?.jv_no === p.jv_no ? 'bg-teal-50/60' : ''}`}
                onClick={() => { onSelect(p.jv_no); setFormMode('none') }}
              >
                <Cell className="tabular text-xs font-medium text-teal-700">{p.jv_no}</Cell>
                <Cell className="text-slate-500">{day(p.date)}</Cell>
                <Cell className="text-xs text-slate-400">{p.source}</Cell>
                <Cell className="max-w-[280px] truncate">{p.memo}{overrides[p.jv_no] && <Tag tone="amber">edited</Tag>}</Cell>
                <Cell className="text-xs text-slate-500">{p.prepared_by}</Cell>
                <Cell className="tabular font-medium">{sar(total, { compact: true })}</Cell>
              </Row>
            )
          })}
        </Table>
      </Card>

      {formMode === 'new' && (
        <div ref={formRef}>
        <JournalEntryForm
          mode="new"
          jvNo={nextJvNo}
          onCancel={() => setFormMode('none')}
          onSave={(entry) => {
            setCustomPostings((c) => [entry, ...c])
            onSelect(entry.jv_no)
            setFormMode('none')
          }}
        />
        </div>
      )}

      {formMode === 'edit' && sel && (
        <div ref={formRef}>
        <JournalEntryForm
          mode="edit"
          jvNo={sel.jv_no}
          initial={sel}
          onCancel={() => setFormMode('none')}
          onSave={(entry) => {
            setOverrides((o) => ({ ...o, [entry.jv_no]: entry }))
            setFormMode('none')
          }}
        />
        </div>
      )}

      {sel && formMode !== 'edit' && (
        <Card className="mt-6">
          <CardHead
            title={`Journal Entry — ${sel.jv_no}`}
            sub={sel.memo}
            right={
              <div className="flex items-center gap-2">
                {sel.approved_by ? <Tag tone="brand">approved by {sel.approved_by}</Tag> : <Tag tone="amber">pending approval</Tag>}
                <button
                  onClick={() => setFormMode('edit')}
                  className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 py-1 text-[12px] font-medium text-slate-600 hover:bg-slate-50"
                >
                  <Pencil className="h-3.5 w-3.5" /> Edit
                </button>
              </div>
            }
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

