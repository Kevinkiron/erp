import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { PageHead } from '@/components/ui'
import Intake from '@/components/intake'
import { ArrowLeft } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function NewClearanceJob() {
  const { data: clients } = await supabase.from('clients').select('code,name').order('name')

  return (
    <>
      <Link href="/clearance" className="mb-4 inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-800">
        <ArrowLeft className="h-3.5 w-3.5" /> Back to registry
      </Link>
      <PageHead
        title="New Clearance Job"
        sub="Drop the shipping document in. The fields fill themselves — you check them and save."
      />
      <Intake clients={(clients ?? []) as { code: string; name: string }[]} />
    </>
  )
}
