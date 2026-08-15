import { supabase } from '@/lib/supabase'
import { Card, CardHead, PageHead, Table, Row, Cell, Tag } from '@/components/ui'
import { num, day, JOB_TYPE_LABEL } from '@/lib/format'
import { Eye } from 'lucide-react'

export const dynamic = 'force-dynamic'

const GROUPS = [
  { key: 'awaiting', label: 'Shipment in hand — documents pending', tone: 'amber', match: (s: string) => ['documents_pending', 'draft'].includes(s) },
  { key: 'clearing', label: 'Under customs clearance', tone: 'blue', match: (s: string) => ['in_progress'].includes(s) },
  { key: 'held', label: 'Held / query raised', tone: 'rose', match: (s: string) => ['on_hold'].includes(s) },
  { key: 'warehouse', label: 'Cleared — in warehouse', tone: 'violet', match: (s: string) => ['cleared', 'in_warehouse'].includes(s) },
  { key: 'transit', label: 'Out for delivery', tone: 'indigo', match: (s: string) => ['in_transit'].includes(s) },
  { key: 'done', label: 'Delivered / completed', tone: 'emerald', match: (s: string) => ['delivered', 'installed', 'completed'].includes(s) },
]

export default async function StatusBoard() {
  const { data } = await supabase.from('v_status_board').select('*').order('eta', { ascending: true })
  const rows = data ?? []

  return (
    <>
      <PageHead
        title="Client Status Board"
        sub="What Siemens sees. Same data as the job registry — no second spreadsheet to keep in step."
        right={
          <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-600">
            <Eye className="h-3.5 w-3.5" /> Read-only client login
          </span>
        }
      />

      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-6">
        {GROUPS.map((g) => {
          const n = rows.filter((r) => g.match(r.status)).length
          return (
            <Card key={g.key} className="p-4">
              <div className="tabular text-2xl font-semibold text-slate-900">{n}</div>
              <div className="mt-1 text-[11px] leading-snug text-slate-500">{g.label}</div>
            </Card>
          )
        })}
      </div>

      <div className="space-y-6">
        {GROUPS.map((g) => {
          const group = rows.filter((r) => g.match(r.status))
          if (!group.length) return null
          return (
            <Card key={g.key}>
              <CardHead title={g.label} sub={`${group.length} ${group.length === 1 ? 'shipment' : 'shipments'}`} />
              <Table head={['Job no', 'Batch', 'Stage', 'Client', 'BL / AWB', 'Carrier', 'Port', 'ETA', 'Arrived', 'Cleared', 'Pkgs', 'DN', 'Remarks']}>
                {group.map((r) => (
                  <Row key={r.id}>
                    <Cell className="tabular font-medium text-slate-800">{r.job_no}</Cell>
                    <Cell className="tabular text-xs text-slate-500">{r.batch_no}</Cell>
                    <Cell className="text-slate-500">{JOB_TYPE_LABEL[r.job_type]}</Cell>
                    <Cell className="max-w-[170px] truncate">{r.client_name}</Cell>
                    <Cell className="tabular text-xs">{r.bl_awb_no ?? '—'}</Cell>
                    <Cell className="text-slate-500">{r.carrier ?? '—'}</Cell>
                    <Cell className="max-w-[150px] truncate text-slate-500">{r.port_of_entry ?? '—'}</Cell>
                    <Cell className="text-slate-500">{day(r.eta)}</Cell>
                    <Cell className="text-slate-500">{day(r.ata)}</Cell>
                    <Cell className="text-slate-500">{day(r.cleared_on)}</Cell>
                    <Cell className="tabular">{r.packages ? num(r.packages) : '—'}</Cell>
                    <Cell>{r.has_delivery_note ? <Tag tone="brand">issued</Tag> : <span className="text-slate-300">—</span>}</Cell>
                    <Cell className="max-w-[280px] truncate text-xs text-slate-500">{r.remarks ?? '—'}</Cell>
                  </Row>
                ))}
              </Table>
            </Card>
          )
        })}
      </div>
    </>
  )
}
