import Anthropic from '@anthropic-ai/sdk'
import { EMPTY_FIELDS, Extraction, ExtractedFields } from './schema'
import { toIsoDate } from './parser'

const MODEL = process.env.ANTHROPIC_MODEL ?? 'claude-sonnet-5'

const TOOL = {
  name: 'record_shipping_document',
  description: 'Record every field read from the shipping document.',
  input_schema: {
    type: 'object' as const,
    properties: {
      doc_type: { type: 'string', enum: ['bill_of_lading', 'air_waybill', 'commercial_invoice', 'packing_list', 'unknown'] },
      trade: { type: ['string', 'null'], enum: ['import', 'export', 'local', null] },
      mode: { type: ['string', 'null'], enum: ['air', 'sea', 'land', null] },
      bl_awb_no: { type: ['string', 'null'], description: 'Bill of Lading or Air Waybill number exactly as printed' },
      carrier: { type: ['string', 'null'], description: 'Shipping line or airline' },
      vessel_flight: { type: ['string', 'null'] },
      port_of_loading: { type: ['string', 'null'] },
      port_of_entry: { type: ['string', 'null'], description: 'Port or airport of discharge / destination' },
      shipper: { type: ['string', 'null'] },
      consignee: { type: ['string', 'null'] },
      goods_description: { type: ['string', 'null'] },
      packages: { type: ['number', 'null'] },
      gross_weight_kg: { type: ['number', 'null'], description: 'Convert to kilograms' },
      cbm: { type: ['number', 'null'], description: 'Volume in cubic metres' },
      eta: { type: ['string', 'null'], description: 'ISO date YYYY-MM-DD' },
      batch_no: { type: ['string', 'null'] },
      purchase_orders: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            po_no: { type: ['string', 'null'] },
            invoice_no: { type: ['string', 'null'] },
            currency: { type: ['string', 'null'] },
            amount: { type: ['number', 'null'] },
          },
        },
      },
      confidence: {
        type: 'object',
        description: 'For each field you filled, a 0–1 score for how certain the reading is. Be honest: use below 0.75 for anything inferred, handwritten, cut off, or ambiguous.',
        additionalProperties: { type: 'number' },
      },
      notes: { type: ['string', 'null'], description: 'Anything the operator should check before saving' },
    },
    required: ['doc_type', 'confidence'],
  },
}

const PROMPT = `You are reading a freight document for a Saudi customs clearance agent.

Extract only what is actually printed on the document. Never invent a value: if a
field is absent, illegible, or you are guessing, return null for it rather than a
plausible-looking value — a wrong number here becomes a wrong customs declaration.

Notes on this operation:
- Weights may be printed in KGS or LBS; convert to kilograms.
- Volume may be printed as MEASUREMENT, CBM or M3.
- The batch number is the identifier that follows the consignment across jobs.
- Ports are often written in shorthand; return them as printed.

Call record_shipping_document exactly once with your reading.`

export async function extractWithClaude(
  buffer: Buffer,
  mime: string,
): Promise<Extraction> {
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })
  const data = buffer.toString('base64')

  const block =
    mime === 'application/pdf'
      ? { type: 'document' as const, source: { type: 'base64' as const, media_type: 'application/pdf' as const, data } }
      : { type: 'image' as const, source: { type: 'base64' as const, media_type: mime as 'image/png', data } }

  const res = await client.messages.create({
    model: MODEL,
    max_tokens: 2000,
    tools: [TOOL],
    tool_choice: { type: 'tool', name: TOOL.name },
    messages: [{ role: 'user', content: [block, { type: 'text', text: PROMPT }] }],
  })

  const call = res.content.find((c) => c.type === 'tool_use')
  if (!call || call.type !== 'tool_use') throw new Error('Model did not return an extraction')

  const out = call.input as Record<string, unknown>
  const conf = (out.confidence ?? {}) as Record<string, number>

  const fields: ExtractedFields = {
    ...EMPTY_FIELDS,
    trade: (out.trade as ExtractedFields['trade']) ?? null,
    mode: (out.mode as ExtractedFields['mode']) ?? null,
    bl_awb_no: (out.bl_awb_no as string) ?? null,
    carrier: (out.carrier as string) ?? null,
    vessel_flight: (out.vessel_flight as string) ?? null,
    port_of_loading: (out.port_of_loading as string) ?? null,
    port_of_entry: (out.port_of_entry as string) ?? null,
    shipper: (out.shipper as string) ?? null,
    consignee: (out.consignee as string) ?? null,
    goods_description: (out.goods_description as string) ?? null,
    packages: (out.packages as number) ?? null,
    gross_weight_kg: (out.gross_weight_kg as number) ?? null,
    cbm: (out.cbm as number) ?? null,
    eta: toIsoDate((out.eta as string) ?? null),
    batch_no: (out.batch_no as string) ?? null,
    purchase_orders: Array.isArray(out.purchase_orders) ? (out.purchase_orders as ExtractedFields['purchase_orders']) : [],
  }

  const confidence: Extraction['confidence'] = {}
  for (const k of Object.keys(fields) as (keyof ExtractedFields)[]) {
    const v = fields[k]
    const empty = k === 'purchase_orders' ? !(v as unknown[]).length : v === null || v === ''
    confidence[k] = empty ? 0 : typeof conf[k] === 'number' ? conf[k] : 0.8
  }

  const warnings: string[] = []
  const low = (Object.keys(confidence) as (keyof ExtractedFields)[])
    .filter((k) => (confidence[k] ?? 0) > 0 && (confidence[k] ?? 0) < 0.75)
  if (low.length) warnings.push(`${low.length} field(s) read with low confidence — check them against the document.`)

  return {
    doc_type: (out.doc_type as Extraction['doc_type']) ?? 'unknown',
    fields,
    confidence,
    engine: 'claude',
    notes: (out.notes as string) ?? null,
    warnings,
  }
}
