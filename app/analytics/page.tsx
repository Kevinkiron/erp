import { supabase } from '@/lib/supabase'
import { PageHead } from '@/components/ui'
import AnalyticsView from '@/components/analytics-view'

export const dynamic = 'force-dynamic'

export default async function AnalyticsPage() {
  const [{ data: pnl }, { data: jobs }, { data: duties }, { data: fleet }, { data: balances }, { data: invoices }] =
    await Promise.all([
      supabase.from('v_job_pnl').select('*'),
      supabase.from('jobs').select('*, clients(code,name)'),
      supabase.from('duty_charges').select('*'),
      supabase.from('v_fleet_utilisation').select('*'),
      supabase.from('v_duty_balance').select('*'),
      supabase.from('invoices').select('*'),
    ])

  const jobById = new Map((jobs ?? []).map((j) => [j.id, j]))

  // Duty charges carry no date of their own worth trusting — anchor each one to
  // its job so the month and client filters apply to it too.
  const dutyRows = (duties ?? []).map((d) => {
    const j = jobById.get(d.job_id)
    return {
      type: d.type as string,
      amount: Number(d.amount),
      paid_on: (d.paid_on ?? j?.opened_on ?? null) as string | null,
      client_name: (j?.clients?.name ?? null) as string | null,
    }
  })

  const cycleRows = (jobs ?? [])
    .filter((j) => j.job_type === 'customs_clearance' && j.ata && j.cleared_on)
    .map((j) => ({
      job_no: j.job_no as string,
      client_name: (j.clients?.name ?? null) as string | null,
      mode: j.mode as string | null,
      cleared_on: j.cleared_on as string,
      days: Math.max(
        0,
        Math.round((new Date(j.cleared_on).getTime() - new Date(j.ata).getTime()) / 86400000),
      ),
    }))

  return (
    <>
      <PageHead
        title="Analytics"
        sub="Where the money and the time actually go, across clearance, warehousing, transport and installation."
      />
      <AnalyticsView
        pnl={(pnl ?? []) as never[]}
        duty={dutyRows as never[]}
        cycle={cycleRows as never[]}
        fleet={(fleet ?? []) as never[]}
        balances={(balances ?? []) as never[]}
        invoices={(invoices ?? []) as never[]}
        clients={[...new Set((pnl ?? []).map((p) => p.client_name).filter(Boolean))] as string[]}
      />
    </>
  )
}
