'use client'

import {
  Bar, BarChart, CartesianGrid, Cell, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts'
import { CategoryTick, ChartCard, VizLegend, VizTooltip } from './chrome'
import { AXIS_TICK, BAR_MAX, BAR_RADIUS, BAR_RADIUS_H, INK, SERIES, TEAL_RAMP, sarAxis, sarFull } from '@/lib/viz'

export function RevenueVsCost({
  data, title = 'Revenue vs direct cost', sub = 'Jobs grouped by the month they were opened', height = 260,
}: {
  data: { month: string; Revenue: number; 'Direct cost': number }[]
  title?: string; sub?: string; height?: number
}) {
  return (
    <ChartCard
      title={title} sub={sub} height={height}
      legend={<VizLegend items={[{ name: 'Revenue', color: SERIES[0] }, { name: 'Direct cost', color: SERIES[1] }]} />}
      table={{
        head: ['Month', 'Revenue', 'Direct cost', 'Net'],
        rows: data.map((r) => [r.month, sarFull(r.Revenue), sarFull(r['Direct cost']), sarFull(r.Revenue - r['Direct cost'])]),
      }}
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 12, bottom: 4, left: 4 }} barGap={2}>
          <CartesianGrid vertical={false} stroke={INK.grid} />
          <XAxis dataKey="month" tick={AXIS_TICK} tickLine={false} axisLine={{ stroke: INK.axis }} />
          <YAxis tickFormatter={sarAxis} tick={AXIS_TICK} tickLine={false} axisLine={false} width={44} />
          <Tooltip cursor={{ fill: 'rgba(15,36,56,0.04)' }} content={<VizTooltip format={sarFull} />} />
          <Bar dataKey="Revenue" fill={SERIES[0]} maxBarSize={BAR_MAX} radius={BAR_RADIUS} />
          <Bar dataKey="Direct cost" fill={SERIES[1]} maxBarSize={BAR_MAX} radius={BAR_RADIUS} />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  )
}

export function ServiceLineBars({
  data, height = 260,
}: {
  data: { line: string; jobs: number; revenue: number; cost: number; net: number; margin: number }[]
  height?: number
}) {
  // Sorted by value: the comparison the reader is making is "which earns most",
  // so the ranking should be visible without measuring bar lengths against each other.
  const sorted = [...data].sort((a, b) => b.net - a.net)
  return (
    <ChartCard
      title="Net profit by service line" sub="Which part of the business actually earns" height={height}
      table={{
        head: ['Service line', 'Jobs', 'Revenue', 'Cost', 'Net', 'Margin'],
        rows: sorted.map((l) => [l.line, l.jobs, sarFull(l.revenue), sarFull(l.cost), sarFull(l.net), `${l.margin.toFixed(0)}%`]),
      }}
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={sorted} layout="vertical" margin={{ top: 4, right: 64, bottom: 4, left: 4 }}>
          <CartesianGrid horizontal={false} stroke={INK.grid} />
          <XAxis type="number" tickFormatter={sarAxis} tick={AXIS_TICK} tickLine={false} axisLine={false} />
          <YAxis type="category" dataKey="line" interval={0} tick={<CategoryTick />} tickLine={false} axisLine={{ stroke: INK.axis }} width={128} />
          <Tooltip cursor={{ fill: 'rgba(15,36,56,0.04)' }} content={<VizTooltip format={sarFull} />} />
          <Bar dataKey="net" name="Net profit" fill={SERIES[0]} maxBarSize={BAR_MAX} radius={BAR_RADIUS_H}>
            <LabelList
              dataKey="net" position="right" offset={8}
              formatter={(v: unknown) => sarAxis(Number(v))}
              style={{ fill: INK.secondary, fontSize: 11, fontWeight: 600 }}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  )
}

/**
 * The four service lines are an ordered pipeline, so this is the one place an
 * ordinal ramp is right — one hue, light→dark, validated with --ordinal.
 */
export function Pipeline({
  data,
}: { data: { stage: string; open: number; total: number }[] }) {
  return (
    <div className="space-y-3 p-5 pt-4">
      <div style={{ height: 168 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ top: 0, right: 86, bottom: 0, left: 0 }}>
            <XAxis type="number" hide />
            <YAxis
              type="category" dataKey="stage" interval={0} tick={<CategoryTick />}
              tickLine={false} axisLine={false} width={126}
            />
            <Tooltip
              cursor={{ fill: 'rgba(15,36,56,0.04)' }}
              content={<VizTooltip format={(v) => String(v)} unit="jobs" />}
            />
            <Bar dataKey="total" name="Jobs" maxBarSize={18} radius={BAR_RADIUS_H} minPointSize={2}>
              {data.map((d, i) => (
                <Cell key={d.stage} fill={TEAL_RAMP[Math.min(i, TEAL_RAMP.length - 1)]} />
              ))}
              <LabelList
                dataKey="label" position="right" offset={8}
                style={{ fill: INK.secondary, fontSize: 11 }}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="rounded-lg bg-slate-50 p-3 text-xs leading-relaxed text-slate-600">
        A consignment keeps the same <strong>batch number</strong> as it moves from clearance to warehouse to
        transport to installation — so one search returns the whole chain.
      </div>
    </div>
  )
}

