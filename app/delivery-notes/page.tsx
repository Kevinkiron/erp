import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { Card, CardHead, PageHead, Stat, Pill, Table, Row, Cell } from '@/components/ui'
import { num, day, stamp } from '@/lib/format'
import { Signature } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function DeliveryNotes() {
  const { data: dns } = await supabase
    .from('delivery_notes')
    .select('*, jobs(job_no,job_type,batch_no,clients(name))')
    .order('issued_on', { ascending: false })

  const rows = dns ?? []
  const signed = rows.filter((d) => d.signature_captured)

  return (
    <>
      <PageHead
        title="Delivery Notes"
        sub="Raised from the job, amended if the drop point changes, signed on the driver's phone at the door."
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat label="Delivery notes" value={num(rows.length)} />
        <Stat label="Signed digitally" value={num(signed.length)} tone="good" hint="Signature captured in the app" />
        <Stat label="Awaiting signature" value={num(rows.length - signed.length)} tone="warn" />
        <Stat label="With condition remarks" value={num(rows.filter((d) => d.condition_remarks).length)} hint="Damage or shortage noted" />
      </div>

      <Card className="mt-6">
        <CardHead title="All delivery notes" />
        <Table head={['DN no', 'Job', 'Consignee', 'Vehicle', 'Driver', 'Issued', 'Delivered', 'Received by', 'Signature', 'Status']}>
          {rows.map((d) => (
            <Row key={d.id}>
              <Cell>
                <Link href={`/delivery-notes/${encodeURIComponent(d.dn_no)}`} className="tabular font-medium text-teal-700 hover:underline">
                  {d.dn_no}
                </Link>
              </Cell>
              <Cell>
                <Link href={`/jobs/${encodeURIComponent(d.jobs?.job_no ?? '')}`} className="tabular text-xs text-slate-600 hover:text-teal-700">
                  {d.jobs?.job_no}
                </Link>
              </Cell>
              <Cell className="max-w-[220px] truncate">{d.consignee}</Cell>
              <Cell className="tabular text-slate-500">{d.vehicle_no}</Cell>
              <Cell className="text-slate-500">{d.driver_name}</Cell>
              <Cell className="text-slate-500">{day(d.issued_on)}</Cell>
              <Cell className="text-xs text-slate-500">{stamp(d.delivered_at)}</Cell>
              <Cell className="text-slate-600">{d.receiver_name ?? '—'}</Cell>
              <Cell>
                <Signature className={`h-4 w-4 ${d.signature_captured ? 'text-emerald-500' : 'text-slate-300'}`} />
              </Cell>
              <Cell><Pill status={d.status} /></Cell>
            </Row>
          ))}
        </Table>
      </Card>
    </>
  )
}
