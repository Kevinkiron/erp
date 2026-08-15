/* eslint-disable @typescript-eslint/no-explicit-any */
// A tiny in-memory stand-in for the Supabase client, used when the app runs
// without a Supabase connection. It supports exactly the query surface the
// pages use: .from().select().eq().order().limit().maybeSingle()
// Relations are pre-joined, so the select() column string is informational.

import * as M from './seed/masters'
import * as JB from './seed/jobs'
import * as OP from './seed/operations'

const round2 = (n: number) => Math.round(n * 100) / 100
const addDays = (d: string, n: number) => {
  const t = new Date(d + 'T00:00:00Z')
  t.setUTCDate(t.getUTCDate() + n)
  return t.toISOString().slice(0, 10)
}
const by = <T>(rows: T[], key: keyof T) => new Map(rows.map((r) => [r[key] as any, r]))

// ---------- derived: expenses ----------
const expenses: any[] = []
let ei = 0
for (const j of JB.jobs) {
  for (const [category, description, vendor, ratio] of OP.EXPENSE_RULES[j.job_type] ?? []) {
    expenses.push({
      id: 'EX' + ei++, job_id: j.job_no, category, description, vendor,
      amount: round2(Math.max(Number(j.revenue_sar), 12000) * ratio),
      paid_on: j.closed_on ?? addDays(j.opened_on!, 9), entered_by: 'Accounts - Amal',
    })
  }
}
for (const jobNo of OP.OUTSOURCED_TRUCK_JOBS) {
  const j = JB.jobs.find((x) => x.job_no === jobNo)!
  expenses.push({
    id: 'EX' + ei++, job_id: jobNo, category: 'Outsourced truck hire',
    description: 'Hired 3rd-party trailer for the leg', vendor: 'Najd Transport Co',
    amount: round2(Number(j.revenue_sar) * 0.24), paid_on: addDays(j.opened_on!, 6), entered_by: 'Accounts - Amal',
  })
}
expenses.push(...OP.EXTRA_EXPENSES)

// ---------- derived: invoices ----------
const billable = JB.jobs
  .filter((j) => Number(j.revenue_sar) > 0 && ['completed', 'delivered', 'cleared'].includes(j.status) && !OP.UNBILLED_JOBS.includes(j.job_no))
  .sort((a, b) => (a.opened_on! < b.opened_on! ? -1 : 1))
const invoices = billable.map((j, i) => {
  const issued = j.closed_on ?? addDays(j.opened_on!, 12)
  return {
    id: 'INV' + i, job_id: j.job_no,
    invoice_no: 'INV-2026-' + String(i + 1).padStart(4, '0'),
    issued_on: issued, amount: Number(j.revenue_sar),
    status: issued < '2026-07-10' ? 'paid' : issued < '2026-07-25' ? 'overdue' : 'issued',
  }
})

// ---------- derived: duty advances (utilisation) ----------
const dutyByJob = new Map<string, { bayan: string; total: number; paid: string }>()
for (const d of JB.duty_charges) {
  const cur = dutyByJob.get(d.job_id) ?? { bayan: d.bayan_no, total: 0, paid: d.paid_on }
  cur.total += Number(d.amount)
  if (d.paid_on < cur.paid) cur.paid = d.paid_on
  dutyByJob.set(d.job_id, cur)
}
const jobByNo = by(JB.jobs, 'job_no')
const duty_advances = [
  ...JB.advances_received,
  ...[...dutyByJob.entries()].map(([jobNo, v], i) => ({
    id: 'ADVU' + i, client_id: jobByNo.get(jobNo)!.client_id, direction: 'utilised',
    reference: v.bayan, job_id: jobNo, amount: round2(v.total), txn_date: v.paid,
    note: 'Customs payment for ' + jobNo,
  })),
]

// ---------- derived: documents ----------
const DOCS: [string, string, boolean][] = [
  ['Bill of Lading / AWB', 'BL.pdf', true],
  ['Commercial Invoice', 'CI.pdf', true],
  ['Packing List', 'PL.pdf', true],
  ['Certificate of Origin', 'COO.pdf', false],
]
const job_documents: any[] = []
let di = 0
for (const j of JB.jobs) {
  if (j.job_type === 'customs_clearance') {
    for (const [doc_type, fn, extracted] of DOCS) {
      job_documents.push({ id: 'D' + di++, job_id: j.job_no, doc_type, file_name: j.job_no.replace(/\//g, '-') + '_' + fn, uploaded_by: 'Khalid Al-Zahrani', extracted })
    }
  }
  if (j.cleared_on) {
    job_documents.push({ id: 'D' + di++, job_id: j.job_no, doc_type: 'Customs Bayan', file_name: j.job_no.replace(/\//g, '-') + '_BAYAN.pdf', uploaded_by: 'Accounts - Amal', extracted: true })
  }
}

// ---------- derived: trip allowances ----------
const slabFor = (km: number) => M.allowance_slabs.find((s) => km >= s.min_km && (s.max_km === null || km < s.max_km))!
const trip_allowances: any[] = []
let ti = 0
for (const td of OP.transport_details) {
  const slab = slabFor(Number(td.distance_km))
  const on = (td.delivered_at ?? '2026-08-15').slice(0, 10)
  trip_allowances.push({ id: 'TA' + ti++, job_id: td.job_id, staff_id: td.driver_id, slab_id: slab.id, distance_km: td.distance_km, basis: slab.basis, amount: slab.driver_rate, computed_on: on })
  for (const c of OP.transport_crew.filter((x) => x.job_id === td.job_id)) {
    trip_allowances.push({ id: 'TA' + ti++, job_id: td.job_id, staff_id: c.staff_id, slab_id: slab.id, distance_km: td.distance_km, basis: slab.basis, amount: slab.labour_rate, computed_on: on })
  }
}

// ---------- relation enrichment ----------
const clientById = by(M.clients, 'id')
const staffById = by(M.staff, 'id')
const truckById = by(M.trucks, 'id')
const siteById = by(M.sites, 'id')
const itemById = by(M.stock_items, 'id')
const whById = by(M.warehouses, 'id')
const slabById = by(M.allowance_slabs, 'id')

const jobsE = JB.jobs.map((j) => ({ ...j, clients: clientById.get(j.client_id) ?? null }))
const jobsEById = by(jobsE, 'job_no')

const tables: Record<string, any[]> = {
  clients: M.clients,
  sites: M.sites,
  warehouses: M.warehouses,
  trucks: M.trucks,
  staff: M.staff,
  allowance_slabs: M.allowance_slabs,
  app_settings: M.app_settings,
  stock_items: M.stock_items,
  jobs: jobsE,
  job_purchase_orders: JB.job_purchase_orders,
  job_history: JB.job_history,
  duty_charges: JB.duty_charges,
  expenses,
  invoices,
  job_documents,
  duty_advances: duty_advances.map((a) => ({ ...a, clients: clientById.get(a.client_id) ?? null, jobs: a.job_id ? jobsEById.get(a.job_id) ?? null : null })),
  transport_details: OP.transport_details.map((t) => ({ ...t, trucks: truckById.get(t.truck_id) ?? null, staff: staffById.get(t.driver_id) ?? null, jobs: jobsEById.get(t.job_id) ?? null, sites: siteById.get(t.drop_site_id) ?? null })),
  transport_crew: OP.transport_crew.map((c) => ({ ...c, staff: staffById.get(c.staff_id) ?? null, source: staffById.get(c.staff_id)?.employment ?? 'own' })),
  trip_allowances: trip_allowances.map((a) => ({ ...a, staff: staffById.get(a.staff_id) ?? null, allowance_slabs: slabById.get(a.slab_id) ?? null })),
  delivery_notes: OP.delivery_notes.map((d) => ({ ...d, jobs: jobsEById.get(d.job_id) ?? null })),
  delivery_note_items: OP.delivery_note_items,
  installation_details: OP.installation_details.map((i) => ({ ...i, sites: siteById.get(i.site_id) ?? null })),
  storage_contracts: M.storage_contracts.map((s) => ({ ...s, clients: clientById.get(s.client_id) ?? null, warehouses: whById.get(s.warehouse_id) ?? null })),
  stock_movements: OP.stock_movements.map((m) => ({ ...m, stock_items: itemById.get(m.item_id) ?? null, warehouses: whById.get(m.warehouse_id) ?? null, jobs: m.job_id ? jobsEById.get(m.job_id) ?? null : null })),
}

// ---------- views ----------
const sumBy = (rows: any[], key: string, field: string) => {
  const m = new Map<string, number>()
  for (const r of rows) m.set(r[key], (m.get(r[key]) ?? 0) + Number(r[field]))
  return m
}
const expByJob = sumBy(expenses, 'job_id', 'amount')
const dutyByJobTotal = sumBy(JB.duty_charges, 'job_id', 'amount')
const invByJob = sumBy(invoices, 'job_id', 'amount')

tables.v_job_pnl = jobsE.map((j) => ({
  id: j.job_no, job_no: j.job_no, job_type: j.job_type, status: j.status, batch_no: j.batch_no,
  client_name: j.clients?.name ?? null, opened_on: j.opened_on, revenue_sar: Number(j.revenue_sar),
  expense_sar: round2(expByJob.get(j.job_no) ?? 0),
  duty_paid_sar: round2(dutyByJobTotal.get(j.job_no) ?? 0),
  invoiced_sar: round2(invByJob.get(j.job_no) ?? 0),
  net_pnl_sar: round2(Number(j.revenue_sar) - (expByJob.get(j.job_no) ?? 0)),
  unbilled: (invByJob.get(j.job_no) ?? 0) === 0,
}))

tables.v_duty_balance = M.clients
  .map((c) => {
    const rows = duty_advances.filter((a) => a.client_id === c.id)
    if (!rows.length) return null
    const sum = (dir: string) => rows.filter((r) => r.direction === dir).reduce((s, r) => s + Number(r.amount), 0)
    const received = sum('received'), utilised = sum('utilised'), refunded = sum('refunded')
    return { client_id: c.id, client_name: c.name, advance_received: received, advance_utilised: utilised, advance_refunded: refunded, balance_sar: round2(received - utilised - refunded) }
  })
  .filter(Boolean)

tables.v_fleet_utilisation = M.trucks.map((t) => {
  const legs = OP.transport_details.filter((l) => l.truck_id === t.id)
  return {
    id: t.id, plate_no: t.plate_no, model: t.model, capacity_tons: t.capacity_tons, ownership: t.ownership, active: t.active,
    trips: legs.length, km_run: round2(legs.reduce((s, l) => s + Number(l.distance_km), 0)),
    last_used_at: legs.length ? legs.map((l) => l.pickup_at).sort().at(-1) : null,
  }
})

tables.v_driver_performance = M.staff.map((s) => {
  const legs = OP.transport_details.filter((l) => l.driver_id === s.id)
  return {
    id: s.id, emp_no: s.emp_no, full_name: s.full_name, role: s.role, employment: s.employment,
    base_city: s.base_city, rating: s.rating, trips: legs.length,
    km_run: round2(legs.reduce((a, l) => a + Number(l.distance_km), 0)),
    allowances_sar: round2(trip_allowances.filter((a) => a.staff_id === s.id).reduce((x, a) => x + Number(a.amount), 0)),
  }
})

tables.v_status_board = jobsE.map((j) => ({
  id: j.job_no, job_no: j.job_no, batch_no: j.batch_no, job_type: j.job_type, status: j.status,
  client_name: j.clients?.name ?? null, bl_awb_no: j.bl_awb_no, mode: j.mode, carrier: j.carrier,
  vessel_flight: j.vessel_flight, port_of_entry: j.port_of_entry, eta: j.eta, ata: j.ata,
  cleared_on: j.cleared_on, goods_description: j.goods_description, packages: j.packages, remarks: j.remarks,
  has_delivery_note: OP.delivery_notes.some((d) => d.job_id === j.job_no),
  invoiced: invoices.some((i) => i.job_id === j.job_no),
}))

// ---------- query builder ----------
class Query implements PromiseLike<{ data: any[]; error: null }> {
  constructor(private rows: any[]) {}
  eq(col: string, val: any) { this.rows = this.rows.filter((r) => r[col] === val); return this }
  order(col: string, opts: { ascending?: boolean } = {}) {
    const dir = opts.ascending === false ? -1 : 1
    this.rows = [...this.rows].sort((a, b) => {
      const x = a[col], y = b[col]
      if (x === y) return 0
      if (x === null || x === undefined) return 1
      if (y === null || y === undefined) return -1
      return (x > y ? 1 : -1) * dir
    })
    return this
  }
  limit(n: number) { this.rows = this.rows.slice(0, n); return this }
  maybeSingle() { return Promise.resolve({ data: this.rows[0] ?? null, error: null }) }
  single() { return this.maybeSingle() }
  then<R1 = { data: any[]; error: null }, R2 = never>(
    onfulfilled?: ((v: { data: any[]; error: null }) => R1 | PromiseLike<R1>) | null,
    onrejected?: ((r: any) => R2 | PromiseLike<R2>) | null,
  ): PromiseLike<R1 | R2> {
    return Promise.resolve({ data: this.rows, error: null }).then(onfulfilled, onrejected)
  }
}

export const localClient = {
  from(table: string) {
    return {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      select: (_cols?: string) => new Query(tables[table] ?? []),
    }
  },
}
