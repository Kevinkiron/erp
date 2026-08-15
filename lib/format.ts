export const sar = (n: number | string | null | undefined, opts: { compact?: boolean } = {}) => {
  const v = Number(n ?? 0)
  if (opts.compact && Math.abs(v) >= 1_000_000) return `SAR ${(v / 1_000_000).toFixed(2)}M`
  if (opts.compact && Math.abs(v) >= 1_000) return `SAR ${(v / 1_000).toFixed(0)}k`
  return `SAR ${v.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export const num = (n: number | string | null | undefined, dp = 0) =>
  Number(n ?? 0).toLocaleString('en-US', { minimumFractionDigits: dp, maximumFractionDigits: dp })

export const day = (d: string | null | undefined) =>
  d ? new Date(d.length === 10 ? d + 'T00:00:00Z' : d).toLocaleDateString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC',
  }) : '—'

// Operational timestamps are shown in Riyadh time regardless of where the app runs.
export const stamp = (d: string | null | undefined) =>
  d ? new Date(d).toLocaleString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
    hour12: false, timeZone: 'Asia/Riyadh',
  }) : '—'

const ACRONYMS: Record<string, string> = { vat: 'VAT', po: 'PO', bl: 'BL', awb: 'AWB', dn: 'DN', hs: 'HS', cbm: 'CBM' }

export const titleCase = (s: string | null | undefined) =>
  (s ?? '')
    .replace(/_/g, ' ')
    .split(' ')
    .map((w) => ACRONYMS[w.toLowerCase()] ?? w.replace(/\b\w/g, (c) => c.toUpperCase()))
    .join(' ')

export const jobSlug = (jobNo: string) => encodeURIComponent(jobNo)
export const unslug = (slug: string) => decodeURIComponent(slug)

export const JOB_TYPE_LABEL: Record<string, string> = {
  customs_clearance: 'Customs Clearance',
  warehousing: 'Warehousing',
  transport: 'Transport',
  installation: 'Installation',
  freight_forwarding: 'Freight Forwarding',
}
