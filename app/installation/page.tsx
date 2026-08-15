import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { Card, CardHead, PageHead, Stat, Pill, Field, Empty } from '@/components/ui'
import { sar, num, day } from '@/lib/format'
import { CheckCircle2, Clock } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function Installation() {
  const [{ data: jobs }, { data: details }] = await Promise.all([
    supabase.from('jobs').select('*, clients(name)').eq('job_type', 'installation').order('opened_on', { ascending: false }),
    supabase.from('installation_details').select('*, sites(name,city)'),
  ])

  const byJob = new Map((details ?? []).map((d) => [d.job_id, d]))
  const rows = jobs ?? []
  const done = rows.filter((j) => j.status === 'completed' || j.status === 'installed')
  const revenue = rows.reduce((s, j) => s + Number(j.revenue_sar), 0)

  return (
    <>
      <PageHead
        title="Installation"
        sub="The stage the team picks up after the equipment is delivered — commissioning through to signed handover."
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat label="Installation jobs" value={num(rows.length)} />
        <Stat label="Completed" value={num(done.length)} tone="good" />
        <Stat label="In progress" value={num(rows.length - done.length)} tone="warn" />
        <Stat label="Installation revenue" value={sar(revenue, { compact: true })} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        {rows.map((j) => {
          const d = byJob.get(j.id)
          return (
            <Card key={j.id}>
              <CardHead
                title={j.job_no}
                sub={`${j.clients?.name} · batch ${j.batch_no}`}
                right={<Pill status={j.status} />}
              />
              <dl className="grid grid-cols-2 gap-x-6 gap-y-4 p-5">
                <Field label="Site" value={d?.sites?.name} />
                <Field label="City" value={d?.sites?.city} />
                <Field label="Equipment" value={d?.equipment} />
                <Field label="Lead engineer" value={d?.lead_engineer} />
                <Field label="Team size" value={d?.team_size} />
                <Field label="Scheduled" value={day(d?.scheduled_on)} />
                <Field label="Completed" value={day(d?.completed_on)} />
                <Field label="Revenue" value={<span className="tabular">{sar(j.revenue_sar, { compact: true })}</span>} />
                <div className="col-span-2">
                  <Field label="Commissioning notes" value={d?.commissioning_notes} />
                </div>
              </dl>
              <div className="flex items-center justify-between border-t border-slate-100 px-5 py-3">
                <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${d?.handover_signed ? 'text-emerald-600' : 'text-amber-600'}`}>
                  {d?.handover_signed ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Clock className="h-3.5 w-3.5" />}
                  {d?.handover_signed ? 'Handover signed' : 'Handover pending'}
                </span>
                <Link href={`/jobs/${encodeURIComponent(j.job_no)}`} className="text-xs font-medium text-teal-700 hover:underline">
                  Open job file
                </Link>
              </div>
            </Card>
          )
        })}
        {rows.length === 0 && <Empty>No installation jobs.</Empty>}
      </div>
    </>
  )
}
