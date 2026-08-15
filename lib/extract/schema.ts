// Contract between the document reader and the intake form.

export type DocType =
  | 'bill_of_lading'
  | 'air_waybill'
  | 'commercial_invoice'
  | 'packing_list'
  | 'unknown'

export type POLine = {
  po_no: string | null
  invoice_no: string | null
  currency: string | null
  amount: number | null
}

export type ExtractedFields = {
  trade: 'import' | 'export' | 'local' | null
  mode: 'air' | 'sea' | 'land' | null
  bl_awb_no: string | null
  carrier: string | null
  vessel_flight: string | null
  port_of_loading: string | null
  port_of_entry: string | null
  shipper: string | null
  consignee: string | null
  goods_description: string | null
  packages: number | null
  gross_weight_kg: number | null
  cbm: number | null
  eta: string | null
  batch_no: string | null
  purchase_orders: POLine[]
}

export type Extraction = {
  doc_type: DocType
  fields: ExtractedFields
  /** 0–1 per field key. Anything below REVIEW_THRESHOLD is flagged for the operator. */
  confidence: Partial<Record<keyof ExtractedFields, number>>
  engine: 'claude' | 'text-parser' | 'sample'
  notes: string | null
  warnings: string[]
}

export const REVIEW_THRESHOLD = 0.75

export const EMPTY_FIELDS: ExtractedFields = {
  trade: null, mode: null, bl_awb_no: null, carrier: null, vessel_flight: null,
  port_of_loading: null, port_of_entry: null, shipper: null, consignee: null,
  goods_description: null, packages: null, gross_weight_kg: null, cbm: null,
  eta: null, batch_no: null, purchase_orders: [],
}

export const FIELD_LABELS: Record<keyof ExtractedFields, string> = {
  trade: 'Trade',
  mode: 'Mode',
  bl_awb_no: 'BL / AWB no',
  carrier: 'Carrier',
  vessel_flight: 'Vessel / flight',
  port_of_loading: 'Port of loading',
  port_of_entry: 'Port of entry',
  shipper: 'Shipper',
  consignee: 'Consignee',
  goods_description: 'Goods description',
  packages: 'Packages',
  gross_weight_kg: 'Gross weight (kg)',
  cbm: 'Volume (cbm)',
  eta: 'ETA',
  batch_no: 'Batch no',
  purchase_orders: 'PO / invoice lines',
}

export const DOC_TYPE_LABELS: Record<DocType, string> = {
  bill_of_lading: 'Bill of Lading',
  air_waybill: 'Air Waybill',
  commercial_invoice: 'Commercial Invoice',
  packing_list: 'Packing List',
  unknown: 'Unrecognised document',
}
