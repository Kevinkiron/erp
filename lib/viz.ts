/**
 * Chart design tokens.
 *
 * The categorical order below was validated with the data-viz palette checker
 * against the white card surface (#ffffff), light mode:
 *   lightness band PASS · chroma floor PASS · adjacent CVD ΔE 13.0 PASS
 *   normal-vision ΔE 19.6 PASS · contrast WARN on slots 4 and 5
 *
 * The contrast WARN on yellow (2.17:1) and magenta (2.69:1) is the reason every
 * chart on the analytics page has a table view: the relief rule requires values
 * to be reachable without relying on those two fills.
 *
 * Slot order is the colourblind-safety mechanism — assign in order, never cycle,
 * never reassign by rank.
 */

export const SERIES = [
  '#159a97', // 1 teal — the house colour
  '#eb6834', // 2 orange
  '#2a78d6', // 3 blue
  '#eda100', // 4 yellow   (sub-3:1 — needs the table view)
  '#e87ba4', // 5 magenta  (sub-3:1 — needs the table view)
  '#4a3aa7', // 6 violet
] as const

/** Ordinal ramp, one hue, light→dark. Validated with --ordinal (light end 2.37:1). */
export const TEAL_RAMP = ['#45b9b5', '#159a97', '#12837f', '#0f6d6a', '#0c5754'] as const

/** Reserved for state, never for identity. Always shipped with an icon + label. */
export const STATUS = {
  good: '#0ca30c',
  warning: '#fab219',
  serious: '#ec835a',
  critical: '#d03b3b',
} as const

export const INK = {
  primary: '#0f2438',
  secondary: '#4c5f78',
  muted: '#8496aa',
  grid: '#e8edf2',
  axis: '#d7dfe8',
  surface: '#ffffff',
  deemphasis: '#c2ccd8',
}

export const AXIS_TICK = { fill: INK.muted, fontSize: 11 }
export const GRID = { stroke: INK.grid, strokeWidth: 1 }

/** Bars are capped rather than filling the band — the leftover is deliberate air. */
export const BAR_MAX = 24
export const BAR_RADIUS: [number, number, number, number] = [4, 4, 0, 0]
export const BAR_RADIUS_H: [number, number, number, number] = [0, 4, 4, 0]

export const sarAxis = (v: number) =>
  Math.abs(v) >= 1_000_000 ? `${(v / 1_000_000).toFixed(1)}M`
  : Math.abs(v) >= 1_000 ? `${Math.round(v / 1_000)}k`
  : String(v)

export const sarFull = (v: number) =>
  `SAR ${Number(v).toLocaleString('en-US', { maximumFractionDigits: 0 })}`
