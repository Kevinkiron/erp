import { DocType, EMPTY_FIELDS, Extraction, ExtractedFields, POLine } from './schema'

/**
 * Label-driven reader for text-bearing PDFs — the fallback used when no
 * ANTHROPIC_API_KEY is configured. It genuinely reads the file rather than
 * guessing, but only recognises the standard freight-document vocabulary below.
 *
 * Freight PDFs put the caption and the value on separate lines, and letter-spaced
 * captions come out of the text layer as "B / L  N O". So labels are matched on a
 * squashed form (alphanumerics only, uppercased) and the value is taken from the
 * same line after a colon, or from the lines that follow.
 */

const squash = (s: string) => s.replace(/[^A-Za-z0-9]/g, '').toUpperCase()

const LABELS: Record<string, string[]> = {
  bl_awb_no: ['BLNO', 'BILLOFLADINGNO', 'AWBNO', 'AIRWAYBILLNO', 'MAWBNO', 'DOCUMENTNO'],
  carrier: ['CARRIER', 'SHIPPINGLINE', 'AIRLINE'],
  vessel_flight: ['VESSELVOYAGE', 'VESSEL', 'VOYAGE', 'FLIGHTNO', 'FLIGHT'],
  port_of_loading: ['PORTOFLOADING', 'AIRPORTOFDEPARTURE', 'PLACEOFRECEIPT', 'PORTOFORIGIN'],
  port_of_entry: ['PORTOFDISCHARGE', 'AIRPORTOFDESTINATION', 'PORTOFENTRY', 'PLACEOFDELIVERY', 'FINALDESTINATION'],
  shipper: ['SHIPPER', 'EXPORTER', 'SELLER', 'CONSIGNOR'],
  consignee: ['CONSIGNEE', 'BUYER', 'IMPORTER'],
  goods_description: ['DESCRIPTIONOFGOODS', 'NATUREANDQUANTITYOFGOODS', 'DESCRIPTION', 'COMMODITY'],
  packages: ['NOOFPACKAGES', 'NUMBEROFPACKAGES', 'PACKAGES', 'NOOFPIECES', 'NOOFPKGS', 'PIECES'],
  gross_weight_kg: ['GROSSWEIGHT', 'GROSSWT', 'WEIGHT'],
  cbm: ['MEASUREMENT', 'VOLUME', 'CBM'],
  eta: ['ETA', 'ESTIMATEDTIMEOFARRIVAL', 'ESTIMATEDARRIVAL', 'ARRIVALDATE'],
  batch_no: ['BATCHNO', 'BATCHNUMBER', 'BATCH'],
  po_no: ['PONO', 'PURCHASEORDERNO', 'CUSTOMERPONO'],
  invoice_no: ['INVOICENO', 'INVOICENUMBER'],
  currency: ['CURRENCY'],
  invoice_value: ['INVOICEVALUE', 'TOTALVALUE', 'TOTALAMOUNT', 'TOTAL'],
}

/** Every caption we know about — used to tell a value line from the next caption. */
const ALL_LABELS = new Set(Object.values(LABELS).flat())
/** Captions that appear on these documents but that we do not read. */
const OTHER_CAPTIONS = new Set([
  'MARKSNUMBERS', 'CONTAINERNO', 'SEALNO', 'FREIGHT', 'DATEOFISSUE', 'SHIPPEDONBOARD',
  'NOTIFYPARTY', 'NUMBEROFORIGINALBLS', 'PLACEANDDATEOFISSUE', 'HANDLINGINFORMATION',
  'DECLAREDVALUEFORCARRIAGE', 'INCOTERMS', 'COUNTRYOFORIGIN', 'INVOICEDATE', 'ITEM',
  'HSCODE', 'QTY', 'UNITPRICE', 'AMOUNT', 'PARTICULARSFURNISHEDBYTHESHIPPER',
])

/** Captions whose value runs over several lines, and how many lines to take. */
const MULTILINE: Record<string, number> = { shipper: 3, consignee: 3, goods_description: 5 }

type Hit = { value: string; source: 'inline' | 'next-line' }

function readLabels(text: string): Record<string, Hit> {
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean)
  const isCaption = (l: string) => {
    const s = squash(l)
    return ALL_LABELS.has(s) || OTHER_CAPTIONS.has(s)
  }

  const out: Record<string, Hit> = {}

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]

    // "Label: value" on one line
    const colon = line.indexOf(':')
    if (colon > 0) {
      const key = Object.keys(LABELS).find((k) => LABELS[k].includes(squash(line.slice(0, colon))))
      const value = line.slice(colon + 1).trim()
      if (key && value && !out[key]) { out[key] = { value, source: 'inline' }; continue }
    }

    // Caption on its own line, value on the following line(s)
    const key = Object.keys(LABELS).find((k) => LABELS[k].includes(squash(line)))
    if (!key || out[key]) continue

    const take = MULTILINE[key] ?? 1
    const parts: string[] = []
    for (let j = i + 1; j < lines.length && parts.length < take; j++) {
      if (isCaption(lines[j])) break
      parts.push(lines[j])
    }
    if (parts.length) out[key] = { value: parts.join(' ').replace(/\s{2,}/g, ' ').trim(), source: 'next-line' }
  }

  return out
}

const toNumber = (s: string | undefined | null): number | null => {
  if (!s) return null
  const m = s.replace(/,/g, '').match(/-?\d+(\.\d+)?/)
  return m ? Number(m[0]) : null
}

/** Weights are sometimes printed in pounds. */
const toKg = (s: string | undefined | null): number | null => {
  const n = toNumber(s)
  if (n === null) return null
  return /\b(lbs?|pounds?)\b/i.test(s ?? '') ? Math.round(n * 0.45359237 * 100) / 100 : n
}

const MONTHS: Record<string, string> = {
  jan: '01', feb: '02', mar: '03', apr: '04', may: '05', jun: '06',
  jul: '07', aug: '08', sep: '09', oct: '10', nov: '11', dec: '12',
}

export const toIsoDate = (s: string | null | undefined): string | null => {
  if (!s) return null
  const iso = s.match(/(\d{4})-(\d{2})-(\d{2})/)
  if (iso) return iso[0]
  const dmy = s.match(/(\d{1,2})[ \-/]+([A-Za-z]{3,})[ \-/]+(\d{4})/)
  if (dmy) {
    const mm = MONTHS[dmy[2].slice(0, 3).toLowerCase()]
    if (mm) return `${dmy[3]}-${mm}-${dmy[1].padStart(2, '0')}`
  }
  const num = s.match(/(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{4})/)
  if (num) return `${num[3]}-${num[2].padStart(2, '0')}-${num[1].padStart(2, '0')}`
  return null
}

export const detectDocType = (text: string): DocType => {
  const t = squash(text)
  if (t.includes('AIRWAYBILL')) return 'air_waybill'
  if (t.includes('BILLOFLADING')) return 'bill_of_lading'
  if (t.includes('COMMERCIALINVOICE')) return 'commercial_invoice'
  if (t.includes('PACKINGLIST')) return 'packing_list'
  return 'unknown'
}

export function parseDocumentText(text: string): Extraction {
  const doc_type = detectDocType(text)
  const hits = readLabels(text)
  const v = (k: string) => hits[k]?.value ?? null

  // Batch numbers follow a house pattern, so look for them anywhere on the page.
  const batchPattern = text.match(/\bBN-[A-Z]{2,4}-\d{4}-\d{3,5}\b/)
  const batch_no = v('batch_no') ?? batchPattern?.[0] ?? null

  const fields: ExtractedFields = {
    ...EMPTY_FIELDS,
    trade: /\bexport\b/i.test(text) && !/\bimport\b/i.test(text) ? 'export' : 'import',
    mode: doc_type === 'air_waybill' ? 'air' : doc_type === 'bill_of_lading' ? 'sea' : null,
    bl_awb_no: v('bl_awb_no'),
    carrier: v('carrier'),
    vessel_flight: v('vessel_flight'),
    port_of_loading: v('port_of_loading'),
    port_of_entry: v('port_of_entry'),
    shipper: v('shipper'),
    consignee: v('consignee'),
    goods_description: v('goods_description'),
    packages: toNumber(v('packages')),
    gross_weight_kg: toKg(v('gross_weight_kg')),
    cbm: toNumber(v('cbm')),
    eta: toIsoDate(v('eta')),
    batch_no,
    purchase_orders: [],
  }

  const po = v('po_no')
  const inv = v('invoice_no')
  const amount = toNumber(v('invoice_value'))
  const currency = v('currency') ?? v('invoice_value')?.match(/\b(EUR|USD|SAR|GBP|AED)\b/)?.[1] ?? null
  const poLine: POLine = { po_no: po, invoice_no: inv, currency, amount }
  if (po || inv) fields.purchase_orders = [poLine]

  const confidence: Extraction['confidence'] = {}
  for (const k of Object.keys(fields) as (keyof ExtractedFields)[]) {
    const value = fields[k]
    if (k === 'purchase_orders') {
      confidence[k] = (value as POLine[]).length ? 0.86 : 0
    } else if (value === null || value === '') {
      confidence[k] = 0
    } else if (k === 'trade') {
      confidence[k] = 0.7                                   // inferred, not printed as such
    } else if (k === 'mode') {
      confidence[k] = doc_type === 'unknown' ? 0.4 : 0.92
    } else if (k === 'batch_no' && !v('batch_no')) {
      confidence[k] = 0.62                                  // found by pattern, not by caption
    } else {
      confidence[k] = hits[k]?.source === 'inline' ? 0.92 : 0.88
    }
  }

  const warnings: string[] = []
  if (doc_type === 'unknown') warnings.push('Document type could not be identified — check the mode and trade fields.')
  const missing = (Object.keys(fields) as (keyof ExtractedFields)[])
    .filter((k) => k !== 'purchase_orders' && !fields[k])
  if (missing.length) warnings.push(`${missing.length} field(s) were not found on this document — enter them by hand.`)

  return {
    doc_type,
    fields,
    confidence,
    engine: 'text-parser',
    notes: null,
    warnings,
  }
}
