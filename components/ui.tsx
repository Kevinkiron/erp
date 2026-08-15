import Link from 'next/link'
import { ReactNode } from 'react'

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`rounded-xl border border-slate-200 bg-white shadow-[0_1px_2px_rgba(16,37,58,0.04)] ${className}`}>
      {children}
    </div>
  )
}

export function CardHead({ title, sub, right }: { title: string; sub?: string; right?: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-5 py-3.5">
      <div>
        <h3 className="text-[13px] font-semibold tracking-wide text-slate-800 uppercase">{title}</h3>
        {sub && <p className="mt-0.5 text-xs text-slate-500">{sub}</p>}
      </div>
      {right}
    </div>
  )
}

export function PageHead({ title, sub, right }: { title: string; sub?: string; right?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">{title}</h1>
        {sub && <p className="mt-1 text-sm text-slate-500">{sub}</p>}
      </div>
      {right}
    </div>
  )
}

export function Stat({
  label, value, hint, tone = 'default', href,
}: { label: string; value: string; hint?: string; tone?: 'default' | 'good' | 'warn' | 'bad'; href?: string }) {
  const tones: Record<string, string> = {
    default: 'text-slate-900',
    good: 'text-emerald-600',
    warn: 'text-amber-600',
    bad: 'text-rose-600',
  }
  const body = (
    <Card className="p-4 transition hover:border-slate-300">
      <div className="text-[11px] font-medium uppercase tracking-wider text-slate-500">{label}</div>
      <div className={`tabular mt-2 text-[22px] font-semibold leading-none ${tones[tone]}`}>{value}</div>
      {hint && <div className="mt-2 text-xs text-slate-500">{hint}</div>}
    </Card>
  )
  return href ? <Link href={href}>{body}</Link> : body
}

const STATUS_TONE: Record<string, string> = {
  completed: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  delivered: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  installed: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  cleared: 'bg-teal-50 text-teal-700 ring-teal-200',
  in_progress: 'bg-blue-50 text-blue-700 ring-blue-200',
  in_transit: 'bg-indigo-50 text-indigo-700 ring-indigo-200',
  in_warehouse: 'bg-violet-50 text-violet-700 ring-violet-200',
  documents_pending: 'bg-amber-50 text-amber-700 ring-amber-200',
  on_hold: 'bg-rose-50 text-rose-700 ring-rose-200',
  cancelled: 'bg-slate-100 text-slate-600 ring-slate-200',
  draft: 'bg-slate-100 text-slate-600 ring-slate-200',
  paid: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  issued: 'bg-blue-50 text-blue-700 ring-blue-200',
  overdue: 'bg-rose-50 text-rose-700 ring-rose-200',
  pending: 'bg-amber-50 text-amber-700 ring-amber-200',
}

export function Pill({ status, children }: { status?: string; children?: ReactNode }) {
  const key = (status ?? '').toLowerCase()
  const cls = STATUS_TONE[key] ?? 'bg-slate-100 text-slate-700 ring-slate-200'
  const label = children ?? (status ?? '').replace(/_/g, ' ')
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium capitalize ring-1 ring-inset ${cls}`}>
      {label}
    </span>
  )
}

export function Tag({ children, tone = 'slate' }: { children: ReactNode; tone?: string }) {
  const map: Record<string, string> = {
    slate: 'bg-slate-100 text-slate-600',
    brand: 'bg-teal-50 text-teal-700',
    amber: 'bg-amber-50 text-amber-700',
    rose: 'bg-rose-50 text-rose-700',
  }
  return <span className={`inline-flex rounded px-1.5 py-0.5 text-[11px] font-medium ${map[tone]}`}>{children}</span>
}

export function Table({ head, children }: { head: (string | ReactNode)[]; children: ReactNode }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-100 bg-slate-50/60">
            {head.map((h, i) => (
              <th key={i} className="whitespace-nowrap px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">{children}</tbody>
      </table>
    </div>
  )
}

export function Row({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <tr className={`hover:bg-slate-50/70 ${className}`}>{children}</tr>
}

export function Cell({ children, className = '' }: { children?: ReactNode; className?: string }) {
  return <td className={`whitespace-nowrap px-4 py-2.5 text-slate-700 ${className}`}>{children}</td>
}

export function Field({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div>
      <dt className="text-[11px] font-medium uppercase tracking-wider text-slate-400">{label}</dt>
      <dd className="mt-1 text-sm text-slate-800">{value ?? '—'}</dd>
    </div>
  )
}

export function Empty({ children }: { children: ReactNode }) {
  return <div className="px-5 py-10 text-center text-sm text-slate-400">{children}</div>
}

export function Bar({ value, max, tone = 'brand' }: { value: number; max: number; tone?: string }) {
  const pct = max > 0 ? Math.max(2, Math.round((value / max) * 100)) : 0
  const map: Record<string, string> = {
    brand: 'bg-teal-500', blue: 'bg-blue-500', amber: 'bg-amber-500', rose: 'bg-rose-500', slate: 'bg-slate-400',
  }
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
      <div className={`h-full rounded-full ${map[tone]}`} style={{ width: `${pct}%` }} />
    </div>
  )
}
