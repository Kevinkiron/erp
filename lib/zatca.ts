/**
 * ZATCA (Fatoora) helpers — Phase 2 shapes, computed for real rather than mocked.
 *
 * Scope note: the TLV/QR encoding below is the genuine article and will scan.
 * The cryptographic stamp, CSID onboarding and the clearance API call are NOT
 * implemented here — those need a private key in a security module and a live
 * ZATCA connection. Everything that depends on them is clearly marked as
 * simulated in the UI so nobody mistakes this demo for a compliant EGS.
 */

/** UN/CEFACT document type codes used by ZATCA. */
export const DOC_TYPE = {
  invoice: '388',
  credit_note: '381',
  debit_note: '383',
  prepayment: '386',
} as const

/**
 * The 7-digit `name` attribute on InvoiceTypeCode.
 * Positions 1–2: 01 standard, 02 simplified.
 * Positions 3–7: third-party · nominal · exports · summary · self-billed.
 */
export function invoiceTypeName(opts: {
  simplified?: boolean; thirdParty?: boolean; nominal?: boolean
  exports?: boolean; summary?: boolean; selfBilled?: boolean
}) {
  const b = (v?: boolean) => (v ? '1' : '0')
  return (opts.simplified ? '02' : '01') +
    b(opts.thirdParty) + b(opts.nominal) + b(opts.exports) + b(opts.summary) + b(opts.selfBilled)
}

/** ZATCA VAT category codes (subset in use here). */
export const VAT_CATEGORY = {
  standard: 'S',        // 15%
  zero: 'Z',            // zero-rated
  exempt: 'E',
  out_of_scope: 'O',
  reverse_charge: 'B',
} as const

export type VatCategory = keyof typeof VAT_CATEGORY

export const VAT_CATEGORY_LABEL: Record<VatCategory, string> = {
  standard: 'Standard 15%',
  zero: 'Zero-rated',
  exempt: 'Exempt',
  out_of_scope: 'Out of scope',
  reverse_charge: 'Reverse charge',
}

/** Exemption reason codes must accompany anything not standard-rated. */
export const EXEMPTION_REASON: Record<string, { code: string; en: string; ar: string }> = {
  export_of_goods: { code: 'VATEX-SA-32', en: 'Export of goods outside the GCC', ar: 'تصدير السلع خارج دول المجلس' },
  intl_transport: { code: 'VATEX-SA-33', en: 'International transport of goods', ar: 'النقل الدولي للسلع' },
  intl_transport_svc: { code: 'VATEX-SA-34-1', en: 'Services related to international transport', ar: 'الخدمات المرتبطة بالنقل الدولي' },
  out_of_scope: { code: 'VATEX-SA-OOS', en: 'Outside the scope of tax — disbursement', ar: 'خارج نطاق الضريبة — مبلغ مدفوع نيابة عن العميل' },
}

/* ------------------------------------------------------------------ *
 * QR code — TLV, base64
 * Tag | Content
 *  1  | Seller name
 *  2  | Seller VAT registration number
 *  3  | Invoice timestamp (ISO 8601, Zulu)
 *  4  | Invoice total including VAT
 *  5  | VAT total
 *  6  | Hash of the XML invoice        (Phase 2)
 *  7  | ECDSA signature of that hash   (Phase 2)
 *  8  | ECDSA public key               (Phase 2)
 *  9  | ZATCA's signature over the key (Phase 2, simplified invoices only)
 * ------------------------------------------------------------------ */

function tlv(tag: number, value: Uint8Array): Uint8Array {
  if (value.length > 255) throw new Error(`ZATCA TLV tag ${tag} exceeds the 255-byte length field`)
  const out = new Uint8Array(2 + value.length)
  out[0] = tag
  out[1] = value.length
  out.set(value, 2)
  return out
}

const utf8 = (s: string) => new TextEncoder().encode(s)

const toBase64 = (bytes: Uint8Array) =>
  typeof Buffer !== 'undefined'
    ? Buffer.from(bytes).toString('base64')
    : btoa(String.fromCharCode(...bytes))

export type QrInput = {
  sellerName: string
  sellerVatNo: string
  timestamp: string       // ISO 8601 with Z
  totalWithVat: string    // as printed, e.g. "99475.00"
  vatTotal: string
}

/** Phase 1 payload — tags 1 to 5. Genuinely scannable. */
export function zatcaQrPayload(i: QrInput): string {
  const parts = [
    tlv(1, utf8(i.sellerName)),
    tlv(2, utf8(i.sellerVatNo)),
    tlv(3, utf8(i.timestamp)),
    tlv(4, utf8(i.totalWithVat)),
    tlv(5, utf8(i.vatTotal)),
  ]
  const total = parts.reduce((n, p) => n + p.length, 0)
  const buf = new Uint8Array(total)
  let off = 0
  for (const p of parts) { buf.set(p, off); off += p.length }
  return toBase64(buf)
}

/** Decode a payload back into readable tags — used by the demo's QR inspector. */
export function decodeQrPayload(b64: string): { tag: number; label: string; value: string }[] {
  const LABELS: Record<number, string> = {
    1: 'Seller name', 2: 'Seller VAT number', 3: 'Timestamp',
    4: 'Total including VAT', 5: 'VAT total', 6: 'XML hash',
    7: 'Cryptographic stamp', 8: 'Public key', 9: 'ZATCA stamp on key',
  }
  const bytes = typeof Buffer !== 'undefined'
    ? new Uint8Array(Buffer.from(b64, 'base64'))
    : Uint8Array.from(atob(b64), (c) => c.charCodeAt(0))
  const out: { tag: number; label: string; value: string }[] = []
  let i = 0
  while (i + 1 < bytes.length) {
    const tag = bytes[i], len = bytes[i + 1]
    const value = bytes.slice(i + 2, i + 2 + len)
    out.push({
      tag,
      label: LABELS[tag] ?? `Tag ${tag}`,
      value: tag <= 5 ? new TextDecoder().decode(value) : toBase64(value),
    })
    i += 2 + len
  }
  return out
}

/**
 * The genesis Previous Invoice Hash: base64 of the hex SHA-256 of the string "0".
 * Every EGS chain starts here.
 */
export const GENESIS_PIH =
  'NWZlY2ViNjZmZmM4NmYzOGQ5NTI3ODZjNmQ2OTZjNzljMmRiYzIzOWRkNGU5MWI0NjcyOWQ3M2EyN2ZiNTdlOQ=='

/** Saudi VAT registration numbers are 15 digits and start and end with 3. */
export const isValidVatNo = (v: string) => /^3\d{13}3$/.test(v.replace(/\s/g, ''))

/** VAT is computed per line and rounded to halalas, then summed. */
export const lineVat = (net: number, rate: number) => Math.round(net * rate) / 100

/* ------------------------------------------------------------------ *
 * VAT return — the 16 lines of the ZATCA return
 * ------------------------------------------------------------------ */

export const VAT_RETURN_LINES = [
  { box: 1, group: 'output', label: 'Standard-rated sales', ar: 'المبيعات الخاضعة للنسبة الأساسية' },
  { box: 2, group: 'output', label: 'Private healthcare / education / first house to citizens', ar: 'الرعاية الصحية والتعليم الخاص' },
  { box: 3, group: 'output', label: 'Zero-rated domestic sales', ar: 'المبيعات المحلية الخاضعة لنسبة الصفر' },
  { box: 4, group: 'output', label: 'Exports', ar: 'الصادرات' },
  { box: 5, group: 'output', label: 'Exempt sales', ar: 'المبيعات المعفاة' },
  { box: 6, group: 'output', label: 'Total sales', ar: 'إجمالي المبيعات', total: true },
  { box: 7, group: 'input', label: 'Standard-rated domestic purchases', ar: 'المشتريات المحلية الخاضعة للضريبة' },
  { box: 8, group: 'input', label: 'Imports — VAT paid at customs', ar: 'الواردات — ضريبة مدفوعة بالجمارك' },
  { box: 9, group: 'input', label: 'Imports — VAT under reverse charge', ar: 'الواردات — آلية الاحتساب العكسي' },
  { box: 10, group: 'input', label: 'Zero-rated purchases', ar: 'المشتريات الخاضعة لنسبة الصفر' },
  { box: 11, group: 'input', label: 'Exempt purchases', ar: 'المشتريات المعفاة' },
  { box: 12, group: 'input', label: 'Total purchases', ar: 'إجمالي المشتريات', total: true },
  { box: 13, group: 'net', label: 'Total VAT due for the period', ar: 'إجمالي الضريبة المستحقة' },
  { box: 14, group: 'net', label: 'Corrections from previous period (within SAR 5,000)', ar: 'تصحيحات من فترة سابقة' },
  { box: 15, group: 'net', label: 'VAT credit carried forward', ar: 'رصيد ضريبي مرحل' },
  { box: 16, group: 'net', label: 'Net VAT due', ar: 'صافي الضريبة المستحقة', total: true },
] as const
