import Link from 'next/link'
import { notFound } from 'next/navigation'
import QRCode from 'qrcode'
import { Card, CardHead, Table, Row, Cell, Field } from '@/components/ui'
import { ZatcaPill } from '@/components/zatca-pill'
import { sar, num, day } from '@/lib/format'
import { docs, postings } from '@/lib/finance-data'
import { COMPANY } from '@/lib/finance'
import { decodeQrPayload, DOC_TYPE, EXEMPTION_REASON, invoiceTypeName } from '@/lib/zatca'
import { ArrowLeft, ShieldCheck, AlertTriangle, Link2 } from 'lucide-react'

export const dynamic = 'force-dynamic'

const TITLE: Record<string, { en: string; ar: string; code: string }> = {
  invoice: { en: 'Tax Invoice', ar: 'فاتورة ضريبية', code: DOC_TYPE.invoice },
  credit_note: { en: 'Tax Credit Note', ar: 'إشعار دائن ضريبي', code: DOC_TYPE.credit_note },
  debit_note: { en: 'Tax Debit Note', ar: 'إشعار مدين ضريبي', code: DOC_TYPE.debit_note },
}

export default async function InvoiceDetail({ params }: { params: Promise<{ docNo: string }> }) {
  const { docNo } = await params
  const d = docs.find((x) => x.doc_no === decodeURIComponent(docNo))
  if (!d) notFound()

  const t = TITLE[d.type]
  const qrPng = await QRCode.toDataURL(d.qr, { margin: 1, width: 320, errorCorrectionLevel: 'M' })
  const tags = decodeQrPayload(d.qr)
  const posting = postings.find((p) => p.source === d.doc_no)
  const typeName = invoiceTypeName({ simplified: d.simplified })

  return (
    <>
      <Link href="/finance/invoices" className="mb-4 inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-800">
        <ArrowLeft className="h-3.5 w-3.5" /> Sales documents
      </Link>

      <div className="grid gap-6 xl:grid-cols-3">
        {/* ---------------- the document itself ---------------- */}
        <div className="xl:col-span-2">
          <Card>
            <div className="flex items-start justify-between gap-6 border-b border-slate-100 px-8 py-6">
              <div>
                <div className="text-lg font-semibold text-slate-900">{COMPANY.legal_name_en}</div>
                <div dir="rtl" className="text-base text-slate-800">{COMPANY.legal_name_ar}</div>
                <div className="mt-2 text-xs leading-relaxed text-slate-500">
                  {COMPANY.address_en}<br />
                  <span className="tabular">CR {COMPANY.cr_no} · VAT {COMPANY.vat_no}</span>
                </div>
              </div>
              <div className="text-right">
                <div className="text-[11px] uppercase tracking-widest text-slate-400">{t.en}</div>
                <div dir="rtl" className="text-sm font-semibold text-slate-700">{t.ar}</div>
                <div className="tabular mt-1 text-lg font-semibold text-slate-900">{d.doc_no}</div>
                <div className="mt-1.5"><ZatcaPill status={d.clearance} /></div>
              </div>
            </div>

            <dl className="grid grid-cols-2 gap-x-8 gap-y-5 px-8 py-6 md:grid-cols-3">
              <div className="col-span-2">
                <Field label="Buyer / المشتري" value={<>{d.client_name}<br /><span className="tabular text-xs text-slate-500">{d.buyer_vat_no ? `VAT ${d.buyer_vat_no}` : 'Not VAT registered'}</span></>} />
              </div>
              <Field label="Date of issue / تاريخ الإصدار" value={day(d.issue_date)} />
              <Field label="Date of supply / تاريخ التوريد" value={day(d.supply_date)} />
              <Field label="Invoice type code" value={<span className="tabular">{t.code} · {typeName}</span>} />
              {d.job_no && (
                <Field label="Job reference" value={<Link href={`/jobs/${encodeURIComponent(d.job_no)}`} className="tabular text-teal-700 hover:underline">{d.job_no}</Link>} />
              )}
              {d.original_doc_no && (
                <Field label="Original invoice / الفاتورة الأصلية" value={<span className="tabular">{d.original_doc_no}</span>} />
              )}
            </dl>

            {(d.reason_en || d.reason_ar) && (
              <div className="border-t border-slate-100 px-8 py-4">
                <div className="text-[11px] font-medium uppercase tracking-wider text-slate-400">Reason for issue / سبب الإصدار</div>
                <p className="mt-1 text-sm text-slate-700">{d.reason_en}</p>
                <p dir="rtl" className="text-sm text-slate-600">{d.reason_ar}</p>
              </div>
            )}

            <div className="border-t border-slate-100">
              <Table head={['#', 'Description / الوصف', 'Qty', 'Unit price', 'Rate', 'VAT', 'Line total']}>
                {d.lines_c.map((l, i) => (
                  <Row key={i}>
                    <Cell className="text-slate-400">{i + 1}</Cell>
                    <Cell className="max-w-[300px]">
                      <span className="block truncate font-medium text-slate-800">{l.desc_en}</span>
                      <span dir="rtl" className="block truncate text-xs text-slate-500">{l.desc_ar}</span>
                      {l.vat_rate === 0 && (
                        <span className="mt-1 inline-block text-[10px] text-slate-400">
                          {EXEMPTION_REASON[l.tax_code === 'OOS' ? 'out_of_scope' : 'intl_transport']?.code} ·{' '}
                          {EXEMPTION_REASON[l.tax_code === 'OOS' ? 'out_of_scope' : 'intl_transport']?.en}
                        </span>
                      )}
                    </Cell>
                    <Cell className="tabular">{num(l.qty)} {l.uom}</Cell>
                    <Cell className="tabular">{num(l.unit_price, 2)}</Cell>
                    <Cell className="tabular">{l.vat_rate}%</Cell>
                    <Cell className="tabular">{num(l.vat, 2)}</Cell>
                    <Cell className="tabular font-medium">{num(l.gross, 2)}</Cell>
                  </Row>
                ))}
              </Table>
            </div>

            <div className="flex justify-end border-t border-slate-100 px-8 py-5">
              <dl className="w-full max-w-xs space-y-1.5 text-sm">
                <div className="flex justify-between"><dt className="text-slate-500">Total excluding VAT</dt><dd className="tabular">{sar(d.net)}</dd></div>
                <div className="flex justify-between"><dt className="text-slate-500">VAT 15%</dt><dd className="tabular">{sar(d.vat)}</dd></div>
                <div className="flex justify-between border-t border-slate-200 pt-1.5 text-base font-semibold">
                  <dt>Total including VAT</dt><dd className="tabular">{sar(d.total)}</dd>
                </div>
                <div dir="rtl" className="pt-1 text-xs text-slate-500">الإجمالي شامل ضريبة القيمة المضافة</div>
              </dl>
            </div>
          </Card>
        </div>

        {/* ---------------- the ZATCA machinery ---------------- */}
        <div className="space-y-6">
          <Card>
            <CardHead title="QR code" sub="TLV encoded, base64 — this one is real and will scan" />
            <div className="flex flex-col items-center gap-3 p-5">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={qrPng} alt={`ZATCA QR code for ${d.doc_no}`} width={176} height={176} className="rounded-lg border border-slate-200" />
              <p className="break-all text-center font-mono text-[10px] leading-relaxed text-slate-400">{d.qr}</p>
            </div>
            <div className="border-t border-slate-100">
              <Table head={['Tag', 'Field', 'Value']}>
                {tags.map((t2) => (
                  <Row key={t2.tag}>
                    <Cell className="tabular text-xs text-slate-400">{t2.tag}</Cell>
                    <Cell className="text-xs text-slate-600">{t2.label}</Cell>
                    <Cell className="max-w-[150px] truncate font-mono text-[11px]">{t2.value}</Cell>
                  </Row>
                ))}
              </Table>
            </div>
            <p className="border-t border-slate-100 px-5 py-3 text-[11px] leading-relaxed text-slate-500">
              Tags 1–5 are Phase 1 and are computed here from the document. Tags 6–9 carry the XML hash,
              the cryptographic stamp and the public key — they need a CSID from ZATCA.
            </p>
          </Card>

          <Card>
            <CardHead title="Chain and clearance" />
            <dl className="space-y-4 p-5">
              <Field label="UUID" value={<span className="break-all font-mono text-[11px]">{d.uuid}</span>} />
              <Field label="Invoice counter (ICV)" value={<span className="tabular">{d.icv}</span>} />
              <Field label="Invoice hash" value={<span className="break-all font-mono text-[11px]">{d.invoice_hash}</span>} />
              <Field label="Previous invoice hash (PIH)" value={<span className="break-all font-mono text-[11px]">{d.pih.slice(0, 44)}…</span>} />
            </dl>
            <div className="border-t border-slate-100 px-5 py-4">
              {d.clearance === 'pending' ? (
                <p className="flex items-start gap-2 text-xs leading-relaxed text-amber-700">
                  <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  {d.clearance_note}
                </p>
              ) : (
                <p className="flex items-start gap-2 text-xs leading-relaxed text-slate-600">
                  <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-teal-600" />
                  {d.clearance_note ?? (d.simplified
                    ? 'Simplified invoices are reported to ZATCA within 24 hours of issue, not cleared in advance.'
                    : 'Standard invoices are cleared by ZATCA before being sent to the buyer. ZATCA returns the stamped XML.')}
                </p>
              )}
            </div>
          </Card>

          {posting && (
            <Card>
              <CardHead title="Ledger posting" sub="Generated from this document — not typed in" right={<Link href="/finance/journal" className="text-xs font-medium text-teal-700 hover:underline">Journal</Link>} />
              <div className="divide-y divide-slate-100">
                {posting.lines.map((l, i) => (
                  <div key={i} className="flex items-baseline justify-between gap-3 px-5 py-2.5">
                    <span className="min-w-0">
                      <span className="tabular text-[11px] text-slate-400">{l.account}</span>{' '}
                      <span className="text-[13px] text-slate-700">{l.account_name}</span>
                    </span>
                    <span className={`tabular shrink-0 text-[13px] ${l.debit ? 'text-slate-900' : 'text-slate-500'}`}>
                      {l.debit ? num(l.debit, 2) : `(${num(l.credit, 2)})`}
                    </span>
                  </div>
                ))}
              </div>
              <p className="border-t border-slate-100 px-5 py-2 text-[11px] text-slate-400">
                Debits shown plain, credits in brackets.
              </p>
              {d.lines_c.some((l) => l.tax_code === 'OOS') && (
                <div className="border-t border-slate-100 px-5 py-3 text-[11px] leading-relaxed text-slate-500">
                  <Link2 className="mr-1.5 inline h-3.5 w-3.5 align-[-2px] text-slate-400" />
                  The duty line credits <span className="font-medium text-slate-700">1300 Customs duty paid on behalf of clients</span>, not
                  revenue. A disbursement recharged at cost is outside the scope of VAT and never reaches the return.
                </div>
              )}
            </Card>
          )}
        </div>
      </div>
    </>
  )
}
