'use client'

import { ReactNode, useState } from 'react'
import { Table2, BarChart3 } from 'lucide-react'
import { INK } from '@/lib/viz'

/** Tooltip rows: the value leads, the series name follows, keyed by a short stroke. */
export function VizTooltip({
  active, payload, label, format, unit,
}: {
  active?: boolean
  payload?: { name?: string; value?: number | string; color?: string; payload?: Record<string, unknown> }[]
  label?: string | number
  format?: (v: number) => string
  unit?: string
}) {
  if (!active || !payload?.length) return null
  const fmt = format ?? ((v: number) => v.toLocaleString('en-US'))
  return (
    <div className="rounded-lg border border-slate-200 bg-white/98 px-3 py-2 shadow-lg backdrop-blur">
      {label !== undefined && (
        <div className="mb-1.5 text-[11px] font-medium uppercase tracking-wider text-slate-400">{String(label)}</div>
      )}
      <div className="space-y-1">
        {payload.filter((p) => p.value !== undefined && p.value !== null).map((p, i) => (
          <div key={i} className="flex items-baseline gap-2.5">
            <span className="mt-1.5 h-0.5 w-3 shrink-0 rounded-full" style={{ background: p.color }} />
            <span className="tabular text-sm font-semibold text-slate-900">
              {typeof p.value === 'number' ? fmt(p.value) : String(p.value)}
              {unit ? <span className="ml-0.5 text-xs font-normal text-slate-500">{unit}</span> : null}
            </span>
            <span className="ml-auto text-xs text-slate-500">{p.name}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

/** Legend: rect key for bars and areas, line key for lines. Always present at 2+ series. */
export function VizLegend({
  items, shape = 'rect',
}: { items: { name: string; color: string }[]; shape?: 'rect' | 'line' }) {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
      {items.map((s) => (
        <span key={s.name} className="inline-flex items-center gap-1.5 text-[11px] text-slate-600">
          {shape === 'rect' ? (
            <span className="h-2.5 w-2.5 rounded-sm" style={{ background: s.color }} />
          ) : (
            <span className="h-0.5 w-3.5 rounded-full" style={{ background: s.color }} />
          )}
          {s.name}
        </span>
      ))}
    </div>
  )
}

/**
 * Every chart ships with a table twin — required by the relief rule for the two
 * sub-3:1 categorical slots, and it is how a value stays reachable without hover.
 */
export function ChartCard({
  title, sub, legend, table, children, className = '', height = 260,
}: {
  title: string
  sub?: string
  legend?: ReactNode
  table?: { head: string[]; rows: (string | number)[][] }
  children: ReactNode
  className?: string
  height?: number
}) {
  const [asTable, setAsTable] = useState(false)
  return (
    <section className={`rounded-xl border border-slate-200 bg-white shadow-[0_1px_2px_rgba(16,37,58,0.04)] ${className}`}>
      <header className="flex items-start justify-between gap-4 px-5 pb-3 pt-4">
        <div className="min-w-0">
          <h3 className="text-[13px] font-semibold uppercase tracking-wide text-slate-800">{title}</h3>
          {sub && <p className="mt-0.5 text-xs leading-relaxed text-slate-500">{sub}</p>}
        </div>
        {table && (
          <button
            onClick={() => setAsTable((v) => !v)}
            aria-pressed={asTable}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-slate-200 px-2 py-1 text-[11px] font-medium text-slate-500 transition hover:border-slate-300 hover:text-slate-800"
          >
            {asTable ? <BarChart3 className="h-3.5 w-3.5" /> : <Table2 className="h-3.5 w-3.5" />}
            {asTable ? 'Chart' : 'Table'}
          </button>
        )}
      </header>

      {legend && <div className="px-5 pb-2">{legend}</div>}

      {asTable && table ? (
        <div className="max-h-[320px] overflow-auto px-2 pb-3">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-white">
              <tr className="border-b border-slate-100">
                {table.head.map((h, i) => (
                  <th key={h} className={`px-3 py-2 text-[11px] font-semibold uppercase tracking-wider text-slate-500 ${i === 0 ? 'text-left' : 'text-right'}`}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {table.rows.map((r, i) => (
                <tr key={i}>
                  {r.map((c, j) => (
                    <td key={j} className={`px-3 py-1.5 ${j === 0 ? 'text-slate-700' : 'tabular text-right text-slate-600'}`}>
                      {c}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="px-2 pb-3" style={{ height }}>
          {children}
        </div>
      )}
    </section>
  )
}

/** Stat tile: label · value · optional delta · optional sparkline. */
export function StatTile({
  label, value, delta, deltaGood, hint, spark, tone = 'default',
}: {
  label: string
  value: string
  delta?: string
  deltaGood?: boolean
  hint?: string
  spark?: number[]
  tone?: 'default' | 'good' | 'warn' | 'bad'
}) {
  const tones: Record<string, string> = {
    default: 'text-slate-900', good: 'text-emerald-700', warn: 'text-amber-700', bad: 'text-rose-700',
  }
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-[0_1px_2px_rgba(16,37,58,0.04)]">
      <div className="text-[11px] font-medium uppercase tracking-wider text-slate-500">{label}</div>
      <div className="mt-2 flex items-end justify-between gap-3">
        <span className={`text-[22px] font-semibold leading-none ${tones[tone]}`}>{value}</span>
        {spark && spark.length > 1 && <Sparkline points={spark} />}
      </div>
      <div className="mt-2 flex items-center gap-2 text-xs">
        {delta && (
          <span className={`font-medium ${deltaGood ? 'text-emerald-600' : 'text-rose-600'}`}>{delta}</span>
        )}
        {hint && <span className="text-slate-500">{hint}</span>}
      </div>
    </div>
  )
}

function Sparkline({ points }: { points: number[] }) {
  const w = 64, h = 22
  const min = Math.min(...points), max = Math.max(...points)
  const span = max - min || 1
  const d = points
    .map((p, i) => `${(i / (points.length - 1)) * w},${h - ((p - min) / span) * (h - 4) - 2}`)
    .join(' L ')
  const lastX = w
  const lastY = h - ((points[points.length - 1] - min) / span) * (h - 4) - 2
  return (
    <svg width={w} height={h} className="shrink-0 overflow-visible" aria-hidden>
      <path d={`M ${d}`} fill="none" stroke={INK.deemphasis} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={lastX} cy={lastY} r={3} fill="#159a97" stroke={INK.surface} strokeWidth={2} />
    </svg>
  )
}

/**
 * Recharts wraps long category ticks onto two lines. These labels are short
 * enough to fit on one, so render them ourselves and keep the rhythm even.
 */
export function CategoryTick({ x, y, payload }: { x?: number; y?: number; payload?: { value?: string } }) {
  return (
    <text
      x={x} y={y} dy={4} textAnchor="end"
      fill={INK.muted} fontSize={11}
    >
      {payload?.value}
    </text>
  )
}
