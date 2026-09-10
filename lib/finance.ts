/**
 * Derives the ledger from the documents.
 *
 * The point of doing it this way rather than seeding a journal table directly:
 * in the real system the VAT return has to be produced FROM the ledger, and the
 * ledger has to be produced FROM the documents. If the demo hard-coded either,
 * it would be showing something the production build can't do.
 */

import { accounts, bills, claims, manualJournals, salesDocs, taxCodes, COMPANY, bankLines, bankAccounts, periods } from './seed/finance'
import type { Bill, Claim, SalesDoc } from './seed/finance'
import { lineVat, zatcaQrPayload, GENESIS_PIH } from './zatca'

const r2 = (n: number) => Math.round(n * 100) / 100
const codeOf = (c: string) => taxCodes.find((t) => t.code === c)

/* ------------------------------------------------------------- documents */

export type ComputedLine = {
  desc_en: string; desc_ar: string; qty: number; uom: string; unit_price: number
  tax_code: string; account: string
  net: number; vat_rate: number; vat: number; gross: number
}

export type ComputedDoc = SalesDoc & {
  client_name: string
  lines_c: ComputedLine[]
  net: number; vat: number; total: number
  sign: 1 | -1
  qr: string
  pih: string
  invoice_hash: string
}

/** VAT is computed and rounded per line, then summed — never on the total. */
function computeDoc(d: SalesDoc, clientName: string, pih: string): ComputedDoc {
  const lines_c: ComputedLine[] = d.lines.map((l) => {
    const rate = codeOf(l.tax_code)?.rate ?? 0
    const net = r2(l.qty * l.unit_price)
    const vat = lineVat(net, rate)
    return { ...l, net, vat_rate: rate, vat, gross: r2(net + vat) }
  })
  const net = r2(lines_c.reduce((s, l) => s + l.net, 0))
  const vat = r2(lines_c.reduce((s, l) => s + l.vat, 0))
  const total = r2(net + vat)
  const timestamp = `${d.issue_date}T${d.issue_time}Z`

  return {
    ...d,
    client_name: clientName,
    lines_c, net, vat, total,
    sign: d.type === 'credit_note' ? -1 : 1,
    qr: zatcaQrPayload({
      sellerName: COMPANY.legal_name_en,
      sellerVatNo: COMPANY.vat_no,
      timestamp,
      totalWithVat: total.toFixed(2),
      vatTotal: vat.toFixed(2),
    }),
    pih,
    // A real hash is base64 of the hex SHA-256 of the canonicalised XML. There is
    // no XML here, so this is a deterministic stand-in and is labelled as such.
    invoice_hash: Buffer.from(`${d.uuid}:${d.icv}:${total.toFixed(2)}`).toString('base64').slice(0, 44),
  }
}

export function buildSalesDocs(clientName: (code: string) => string): ComputedDoc[] {
  const ordered = [...salesDocs].sort((a, b) => a.icv - b.icv)
  const out: ComputedDoc[] = []
  let pih = GENESIS_PIH
  for (const d of ordered) {
    const c = computeDoc(d, clientName(d.client_id), pih)
    out.push(c)
    pih = c.invoice_hash            // each document chains to the previous one
  }
  return out.sort((a, b) => (a.issue_date < b.issue_date ? 1 : -1))
}

export function computeBill(b: Bill) {
  const lines = b.lines.map((l) => {
    const tc = codeOf(l.tax_code)
    const vat = lineVat(l.amount, tc?.rate ?? 0)
    return { ...l, net: l.amount, vat, gross: r2(l.amount + vat), category: tc?.category ?? 'standard' }
  })
  const net = r2(lines.reduce((s, l) => s + l.net, 0))
  const vat = r2(lines.reduce((s, l) => s + l.vat, 0))
  const reverseCharge = lines.some((l) => l.category === 'reverse_charge')
  const wht = b.wht_rate ? r2(net * (b.wht_rate / 100)) : 0
  // Reverse charge is self-accounted: no cash VAT to the supplier.
  const payable = r2(net + (reverseCharge ? 0 : vat) - wht)
  return { ...b, lines, net, vat, reverseCharge, wht, payable, total: r2(net + vat) }
}

export function computeClaim(c: Claim) {
  const lines = c.lines.map((l) => {
    const rate = codeOf(l.tax_code)?.rate ?? 0
    // Input VAT is only recoverable against a valid tax invoice.
    const vat = l.receipt ? lineVat(l.amount, rate) : 0
    return { ...l, net: l.amount, vat, recoverable: l.receipt }
  })
  const net = r2(lines.reduce((s, l) => s + l.net, 0))
  const vat = r2(lines.reduce((s, l) => s + l.vat, 0))
  const blocked = lines.filter((l) => !l.recoverable).length
  return { ...c, lines, net, vat, total: r2(net + vat), blocked }
}

/* --------------------------------------------------------------- postings */

export type Posting = {
  jv_no: string; date: string; memo: string; source: string
  prepared_by: string; approved_by: string | null
  lines: { account: string; account_name: string; debit: number; credit: number; desc: string; job_no?: string | null }[]
}

const accName = (code: string) => accounts.find((a) => a.code === code)?.name_en ?? code

export function buildPostings(docs: ComputedDoc[]): Posting[] {
  const out: Posting[] = []

  for (const d of docs) {
    const s = d.sign
    const lines: Posting['lines'] = []
    lines.push({ account: '1100', account_name: accName('1100'), debit: s > 0 ? d.total : 0, credit: s < 0 ? d.total : 0, desc: `${d.client_name} — ${d.doc_no}`, job_no: d.job_no })
    for (const l of d.lines_c) {
      // A disbursement is not revenue. Recharging it clears the asset created
      // when the duty was paid on the client's behalf.
      const acct = l.tax_code === 'OOS' ? '1300' : l.account
      lines.push({ account: acct, account_name: accName(acct), debit: s < 0 ? l.net : 0, credit: s > 0 ? l.net : 0, desc: l.desc_en, job_no: d.job_no })
    }
    if (d.vat > 0) {
      lines.push({ account: '2100', account_name: accName('2100'), debit: s < 0 ? d.vat : 0, credit: s > 0 ? d.vat : 0, desc: 'Output VAT 15%', job_no: d.job_no })
    }
    out.push({
      jv_no: `AR-${d.doc_no}`, date: d.issue_date, source: d.doc_no,
      memo: `${d.type === 'credit_note' ? 'Credit note' : d.type === 'debit_note' ? 'Debit note' : 'Sales invoice'} — ${d.client_name}`,
      prepared_by: 'Accounts - Amal', approved_by: 'Ameer', lines,
    })
  }

  for (const raw of bills) {
    const b = computeBill(raw)
    if (b.status === 'pending_approval') continue
    const lines: Posting['lines'] = []
    for (const l of b.lines) {
      lines.push({ account: l.account, account_name: accName(l.account), debit: l.net, credit: 0, desc: l.desc, job_no: b.job_no })
    }
    if (b.reverseCharge) {
      lines.push({ account: '1220', account_name: accName('1220'), debit: b.vat, credit: 0, desc: 'Input VAT — reverse charge' })
      lines.push({ account: '2110', account_name: accName('2110'), debit: 0, credit: b.vat, desc: 'Output VAT — reverse charge' })
    } else if (b.vat > 0) {
      lines.push({ account: '1200', account_name: accName('1200'), debit: b.vat, credit: 0, desc: 'Input VAT recoverable' })
    }
    if (b.wht > 0) {
      lines.push({ account: '2300', account_name: accName('2300'), debit: 0, credit: b.wht, desc: `Withholding tax ${b.wht_rate}% — ${b.wht_type}` })
    }
    lines.push({ account: '2010', account_name: accName('2010'), debit: 0, credit: b.payable, desc: b.supplier })
    out.push({
      jv_no: `AP-${b.bill_no}`, date: b.bill_date, source: b.bill_no,
      memo: `Purchase bill — ${b.supplier}`, prepared_by: 'Accounts - Amal', approved_by: 'Ameer', lines,
    })
  }

  for (const raw of claims) {
    const c = computeClaim(raw)
    if (c.status === 'submitted' || c.status === 'rejected') continue
    const lines: Posting['lines'] = []
    for (const l of c.lines) {
      lines.push({ account: l.account, account_name: accName(l.account), debit: l.net, credit: 0, desc: l.desc, job_no: l.job_no })
    }
    if (c.vat > 0) lines.push({ account: '1200', account_name: accName('1200'), debit: c.vat, credit: 0, desc: 'Input VAT on claim' })
    lines.push({ account: '2020', account_name: accName('2020'), debit: 0, credit: c.total, desc: `${c.claimant} — ${c.claim_no}` })
    out.push({
      jv_no: `EX-${c.claim_no}`, date: c.submitted_on, source: c.claim_no,
      memo: `Expense claim — ${c.claimant}`, prepared_by: c.claimant, approved_by: c.approver ?? null, lines,
    })
  }

  for (const j of manualJournals) {
    out.push({
      jv_no: j.jv_no, date: j.date, memo: j.memo, source: 'Manual',
      prepared_by: j.prepared_by, approved_by: j.approved_by,
      lines: j.lines.map((l) => ({ ...l, account_name: accName(l.account) })),
    })
  }

  return out.sort((a, b) => (a.date < b.date ? 1 : -1))
}

/* ---------------------------------------------------------- trial balance */

export function trialBalance(postings: Posting[]) {
  const m = new Map<string, { debit: number; credit: number }>()
  for (const p of postings) {
    for (const l of p.lines) {
      const cur = m.get(l.account) ?? { debit: 0, credit: 0 }
      cur.debit += l.debit
      cur.credit += l.credit
      m.set(l.account, cur)
    }
  }
  return accounts
    .map((a) => {
      const v = m.get(a.code) ?? { debit: 0, credit: 0 }
      const net = r2(v.debit - v.credit)
      return { ...a, debit: r2(v.debit), credit: r2(v.credit), balance: net, movement: v.debit + v.credit > 0 }
    })
    .filter((a) => a.movement)
}

/* ------------------------------------------------------------- VAT return */

export function vatReturn(docs: ComputedDoc[]) {
  const box: Record<number, { amount: number; vat: number }> = {}
  const add = (n: number, amount: number, vat = 0) => {
    box[n] = box[n] ?? { amount: 0, vat: 0 }
    box[n].amount = r2(box[n].amount + amount)
    box[n].vat = r2(box[n].vat + vat)
  }

  for (const d of docs) {
    const s = d.sign
    for (const l of d.lines_c) {
      const tc = codeOf(l.tax_code)
      if (!tc || tc.box === null) continue          // out of scope never reaches the return
      add(tc.box, s * l.net, s * l.vat)
    }
  }

  for (const raw of bills) {
    const b = computeBill(raw)
    if (b.status === 'pending_approval') continue
    for (const l of b.lines) {
      const tc = codeOf(l.tax_code)
      if (!tc || tc.box === null) continue
      add(tc.box, l.net, l.vat)
      if (tc.category === 'reverse_charge') add(1, 0, l.vat)   // self-accounted output side
    }
  }

  for (const raw of claims) {
    const c = computeClaim(raw)
    if (c.status === 'submitted' || c.status === 'rejected') continue
    for (const l of c.lines) {
      const tc = codeOf(l.tax_code)
      if (!tc || tc.box === null) continue
      add(tc.box, l.net, l.vat)
    }
  }

  // Box 8 is deliberately NOT filled from the customs duty ledger.
  //
  // The import VAT on these Bayans is paid in the CLIENT's name as a disbursement,
  // so it is the client's input tax to recover on the client's own return — not
  // Logistica's. Pulling it in here would overstate recoverable tax by millions
  // and produce a refund claim that does not belong to this taxpayer. Box 8 only
  // carries import VAT on goods Logistica imports for itself.
  add(8, 0, 0)

  const g = (n: number) => box[n] ?? { amount: 0, vat: 0 }
  add(6, g(1).amount + g(2).amount + g(3).amount + g(4).amount + g(5).amount,
         g(1).vat + g(2).vat + g(3).vat + g(4).vat + g(5).vat)
  add(12, g(7).amount + g(8).amount + g(9).amount + g(10).amount + g(11).amount,
          g(7).vat + g(8).vat + g(9).vat + g(10).vat + g(11).vat)
  add(13, 0, g(6).vat)
  add(15, 0, 0)
  add(16, 0, r2(g(13).vat - g(12).vat + g(14).vat - g(15).vat))

  return box
}

/* ------------------------------------------------------------- ageing/bank */

export function receivablesAgeing(docs: ComputedDoc[], asOf = '2026-08-15') {
  const settled = new Set(bankLines.filter((b) => b.match_type === 'invoice').map((b) => b.matched_to))
  const days = (d: string) => Math.round((new Date(asOf).getTime() - new Date(d).getTime()) / 86400000)
  return docs
    .filter((d) => d.type !== 'credit_note' && !settled.has(d.doc_no))
    .map((d) => ({ doc_no: d.doc_no, client: d.client_name, issue_date: d.issue_date, total: d.total, age: days(d.issue_date) }))
    .sort((a, b) => b.age - a.age)
}

export function bankReconciliation() {
  return bankAccounts.map((a) => {
    const lines = bankLines.filter((l) => l.bank_id === a.id)
    const movement = lines.reduce((s, l) => s + l.credit - l.debit, 0)
    const unmatched = lines.filter((l) => !l.matched_to)
    return {
      ...a,
      lines,
      closing: r2(a.opening + movement),
      matched: lines.length - unmatched.length,
      unmatched: unmatched.length,
      unmatchedValue: r2(unmatched.reduce((s, l) => s + Math.abs(l.credit - l.debit), 0)),
    }
  })
}

export const openPeriod = periods.find((p) => p.status === 'open')!
export { accounts, taxCodes, COMPANY, periods, bills, claims, bankLines }
