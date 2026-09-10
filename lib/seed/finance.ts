/**
 * Finance seed data — Saudi/ZATCA.
 *
 * Documents are the source of truth; the general ledger, trial balance and VAT
 * return are all DERIVED from them in lib/local-client.ts. That mirrors how the
 * real thing has to work: the return is produced from the ledger, never typed in.
 */

export const COMPANY = {
  legal_name_en: 'Logistica Clearing & Forwarding Est.',
  legal_name_ar: 'مؤسسة لوجستيكا للتخليص والشحن',
  vat_no: '300123456789003',          // 15 digits, starts and ends with 3
  cr_no: '1010654321',
  address_en: 'Al Sulay Industrial Area, Riyadh 14271, Saudi Arabia',
  address_ar: 'المنطقة الصناعية بالسلي، الرياض ١٤٢٧١، المملكة العربية السعودية',
  building_no: '7842',
  short_address: 'RQAB7842',
  vat_period: 'monthly',              // > SAR 40m turnover
  zatca_wave: 8,                      // > SAR 40m — integration deadline 1 Mar 2024
  egs_serial: '1-Logistica|2-ERP|3-EGS-RUH-01',
}

/* ---------------------------------------------------------------- accounts */
type A = { code: string; name_en: string; name_ar: string; type: string; vat_box?: number }

const acc = (code: string, name_en: string, name_ar: string, type: string, vat_box?: number): A =>
  ({ code, name_en, name_ar, type, vat_box })

export const accounts: A[] = [
  acc('1010', 'Cash on hand', 'النقد في الصندوق', 'asset'),
  acc('1020', 'Bank — Riyad Bank current', 'بنك الرياض — الحساب الجاري', 'asset'),
  acc('1030', 'Bank — SNB collections', 'البنك الأهلي — حساب التحصيل', 'asset'),
  acc('1100', 'Trade receivables', 'الذمم المدينة التجارية', 'asset'),
  acc('1200', 'Input VAT recoverable', 'ضريبة القيمة المضافة على المشتريات', 'asset', 7),
  acc('1210', 'Input VAT — imports at customs', 'ضريبة المدخلات — الواردات بالجمارك', 'asset', 8),
  acc('1220', 'Input VAT — reverse charge', 'ضريبة المدخلات — الاحتساب العكسي', 'asset', 9),
  acc('1250', 'Prepayments and deposits', 'المصروفات المدفوعة مقدماً', 'asset'),
  acc('1300', 'Customs duty paid on behalf of clients', 'الرسوم الجمركية المدفوعة نيابة عن العملاء', 'asset'),
  acc('1500', 'Trucks and vehicles', 'الشاحنات والمركبات', 'asset'),
  acc('1510', 'Accumulated depreciation — vehicles', 'مجمع إهلاك المركبات', 'asset'),
  acc('1520', 'Warehouse equipment', 'معدات المستودع', 'asset'),

  acc('2010', 'Trade payables', 'الذمم الدائنة التجارية', 'liability'),
  acc('2020', 'Employee payables', 'مستحقات الموظفين', 'liability'),
  acc('2050', 'Customs duty payable', 'الرسوم الجمركية المستحقة', 'liability'),
  acc('2100', 'Output VAT payable', 'ضريبة القيمة المضافة على المبيعات', 'liability', 1),
  acc('2110', 'Output VAT — reverse charge', 'ضريبة المخرجات — الاحتساب العكسي', 'liability', 9),
  acc('2150', 'Client duty advances held', 'دفعات العملاء المقدمة للرسوم', 'liability'),
  acc('2200', 'Accrued expenses', 'المصروفات المستحقة', 'liability'),
  acc('2260', 'GOSI payable', 'التأمينات الاجتماعية المستحقة', 'liability'),
  acc('2270', 'End of service award provision', 'مخصص مكافأة نهاية الخدمة', 'liability'),
  acc('2300', 'Withholding tax payable', 'ضريبة الاستقطاع المستحقة', 'liability'),
  acc('2400', 'Zakat payable', 'الزكاة المستحقة', 'liability'),

  acc('3010', 'Share capital', 'رأس المال', 'equity'),
  acc('3020', 'Retained earnings', 'الأرباح المبقاة', 'equity'),
  acc('3030', 'Statutory reserve', 'الاحتياطي النظامي', 'equity'),

  acc('4010', 'Customs clearance revenue', 'إيرادات التخليص الجمركي', 'revenue', 1),
  acc('4020', 'Warehousing and storage revenue', 'إيرادات التخزين', 'revenue', 1),
  acc('4030', 'Transport revenue — domestic', 'إيرادات النقل المحلي', 'revenue', 1),
  acc('4040', 'Transport revenue — international', 'إيرادات النقل الدولي', 'revenue', 3),
  acc('4050', 'Installation revenue', 'إيرادات التركيب', 'revenue', 1),
  acc('4060', 'Freight forwarding revenue', 'إيرادات الشحن', 'revenue', 4),
  acc('4900', 'Disbursement recharges', 'استرداد المبالغ المدفوعة نيابة', 'revenue'),

  acc('5010', 'Clearance agent fees', 'أتعاب مخلص جمركي', 'cost'),
  acc('5020', 'Port and terminal handling', 'مناولة الموانئ', 'cost'),
  acc('5030', 'Fuel', 'الوقود', 'cost'),
  acc('5040', 'Driver and labour allowances', 'بدلات السائقين والعمال', 'cost'),
  acc('5050', 'Outsourced transport', 'النقل المستأجر', 'cost'),
  acc('5060', 'Crane and forklift hire', 'تأجير الرافعات', 'cost'),
  acc('5070', 'Warehouse labour', 'عمالة المستودع', 'cost'),
  acc('5080', 'Demurrage and port storage', 'أرضيات وغرامات التأخير', 'cost'),

  acc('6010', 'Salaries and wages', 'الرواتب والأجور', 'expense'),
  acc('6020', 'GOSI employer contribution', 'حصة صاحب العمل بالتأمينات', 'expense'),
  acc('6030', 'End of service award expense', 'مصروف مكافأة نهاية الخدمة', 'expense'),
  acc('6040', 'Rent', 'الإيجار', 'expense'),
  acc('6060', 'Insurance', 'التأمين', 'expense'),
  acc('6070', 'Vehicle repairs and maintenance', 'صيانة المركبات', 'expense'),
  acc('6080', 'Professional and legal fees', 'الأتعاب المهنية', 'expense'),
  acc('6090', 'Bank charges', 'الرسوم البنكية', 'expense'),
  acc('6100', 'Depreciation', 'الإهلاك', 'expense'),
  acc('6900', 'Other administrative expenses', 'مصروفات إدارية أخرى', 'expense'),
]

/* --------------------------------------------------------------- tax codes */
export type TaxCode = {
  code: string; label: string; rate: number
  category: 'standard' | 'zero' | 'exempt' | 'out_of_scope' | 'reverse_charge'
  side: 'output' | 'input'
  box: number | null
  reason?: string
}

export const taxCodes: TaxCode[] = [
  { code: 'SR15',    label: 'Standard rated 15%',                 rate: 15, category: 'standard',       side: 'output', box: 1 },
  { code: 'ZR-INTL', label: 'Zero-rated — international transport', rate: 0, category: 'zero',          side: 'output', box: 3, reason: 'intl_transport' },
  { code: 'ZR-EXP',  label: 'Zero-rated — export',                 rate: 0,  category: 'zero',          side: 'output', box: 4, reason: 'export_of_goods' },
  { code: 'EX',      label: 'Exempt',                              rate: 0,  category: 'exempt',        side: 'output', box: 5 },
  { code: 'OOS',     label: 'Out of scope — disbursement',         rate: 0,  category: 'out_of_scope',  side: 'output', box: null, reason: 'out_of_scope' },
  { code: 'PR15',    label: 'Purchases standard rated 15%',        rate: 15, category: 'standard',      side: 'input',  box: 7 },
  { code: 'IMP-CUS', label: 'Import VAT paid at customs',          rate: 15, category: 'standard',      side: 'input',  box: 8 },
  { code: 'IMP-RC',  label: 'Import of services — reverse charge', rate: 15, category: 'reverse_charge',side: 'input',  box: 9 },
  { code: 'PR0',     label: 'Purchases zero-rated',                rate: 0,  category: 'zero',          side: 'input',  box: 10 },
]

/* ------------------------------------------------------- sales tax invoices */
export type InvLine = {
  desc_en: string; desc_ar: string; qty: number; uom: string
  unit_price: number; tax_code: string; account: string
}
export type SalesDoc = {
  doc_no: string
  type: 'invoice' | 'credit_note' | 'debit_note'
  simplified?: boolean
  client_id: string
  job_no: string | null
  issue_date: string
  supply_date: string
  issue_time: string
  original_doc_no?: string
  reason_en?: string
  reason_ar?: string
  buyer_vat_no?: string | null
  icv: number
  uuid: string
  clearance: 'cleared' | 'cleared_with_warnings' | 'reported' | 'pending' | 'rejected'
  clearance_note?: string
  lines: InvLine[]
}

const L = (desc_en: string, desc_ar: string, qty: number, uom: string, unit_price: number, tax_code: string, account: string): InvLine =>
  ({ desc_en, desc_ar, qty, uom, unit_price, tax_code, account })

export const salesDocs: SalesDoc[] = [
  {
    doc_no: 'INV-2026-0412', type: 'invoice', client_id: 'SIE', job_no: 'LGT/CC/26/0412',
    issue_date: '2026-05-28', supply_date: '2026-04-27', issue_time: '11:42:07',
    buyer_vat_no: '300455667788003', icv: 412,
    uuid: '9d2f1a64-7c30-4b1e-9f22-6a0b58d31c07', clearance: 'cleared',
    lines: [
      L('Customs clearance service — MAGNETOM Sola MRI', 'خدمة التخليص الجمركي — جهاز رنين مغناطيسي', 1, 'JOB', 42000, 'SR15', '4010'),
      L('Port handling and documentation', 'المناولة والمستندات', 1, 'JOB', 18500, 'SR15', '4010'),
      L('International transport — Hamburg to Jeddah leg', 'النقل الدولي — هامبورغ إلى جدة', 1, 'JOB', 26000, 'ZR-INTL', '4040'),
      L('Customs duty paid on behalf of client — Bayan BYN-2026-4471203', 'رسوم جمركية مدفوعة نيابة عن العميل', 1, 'DISB', 1015375, 'OOS', '4900'),
    ],
  },
  {
    doc_no: 'INV-2026-0447', type: 'invoice', client_id: 'SIE', job_no: 'LGT/CC/26/0447',
    issue_date: '2026-08-02', supply_date: '2026-07-26', issue_time: '09:15:33',
    buyer_vat_no: '300455667788003', icv: 447,
    uuid: 'b71c4e08-2d5a-4f93-8811-0c3e94a7f552', clearance: 'cleared',
    lines: [
      L('Customs clearance service — SOMATOM CT gantry', 'خدمة التخليص الجمركي — جهاز أشعة مقطعية', 1, 'JOB', 31000, 'SR15', '4010'),
      L('Air freight handling and SFDA release', 'مناولة الشحن الجوي وإفراج الهيئة', 1, 'JOB', 21400, 'SR15', '4010'),
      L('Customs duty paid on behalf of client — Bayan BYN-2026-4489117', 'رسوم جمركية مدفوعة نيابة عن العميل', 1, 'DISB', 472510, 'OOS', '4900'),
    ],
  },
  {
    doc_no: 'INV-2026-0389', type: 'invoice', client_id: 'PHL', job_no: 'LGT/TR/26/0389',
    issue_date: '2026-07-19', supply_date: '2026-07-19', issue_time: '17:02:11',
    buyer_vat_no: '301998877665003', icv: 389,
    uuid: '4e88a2c1-6b7d-42fa-a0d3-71c5e9b40a18', clearance: 'cleared_with_warnings',
    clearance_note: 'BR-KSA-F-06: buyer additional identification not provided. Accepted with warning.',
    lines: [
      L('Long-haul transport Dammam to Abha — cath lab', 'نقل بري طويل من الدمام إلى أبها', 1, 'TRIP', 52000, 'SR15', '4030'),
      L('Crew and rigging at destination', 'العمالة والرفع بالموقع', 5, 'MAN-DAY', 1800, 'SR15', '4030'),
      L('Destination crane hire', 'تأجير رافعة بالموقع', 1, 'JOB', 7400, 'SR15', '4030'),
    ],
  },
  {
    doc_no: 'INV-2026-0455', type: 'invoice', client_id: 'SIE', job_no: 'LGT/CC/26/0455',
    issue_date: '2026-08-14', supply_date: '2026-08-06', issue_time: '13:28:44',
    buyer_vat_no: '300455667788003', icv: 455,
    uuid: 'c02d7f19-8a44-4c6b-bb51-2f9e6d3a8471', clearance: 'pending',
    clearance_note: 'Queued for clearance — ZATCA integration not connected in this demo build.',
    lines: [
      L('Customs clearance service — DR X-Ray systems', 'خدمة التخليص الجمركي — أجهزة أشعة رقمية', 1, 'JOB', 28900, 'SR15', '4010'),
      L('Warehouse storage — 8 days, 11 pallet positions', 'تخزين — ٨ أيام، ١١ منصة', 8, 'DAY', 2500, 'SR15', '4020'),
    ],
  },
  {
    doc_no: 'CRN-2026-0031', type: 'credit_note', client_id: 'DRG', job_no: 'LGT/TR/26/0394',
    issue_date: '2026-08-11', supply_date: '2026-08-03', issue_time: '10:04:52',
    original_doc_no: 'INV-2026-0394', buyer_vat_no: '302334455667003', icv: 461,
    uuid: 'f5a1b933-04c8-4d27-9e60-88a1c2704bd3', clearance: 'cleared',
    reason_en: 'Two ventilator crates returned undelivered — hospital stores closed.',
    reason_ar: 'إرجاع صندوقين من أجهزة التنفس — مستودع المستشفى مغلق.',
    lines: [
      L('Delivery charge reversed — 2 of 24 units', 'عكس رسوم التوصيل — ٢ من ٢٤ وحدة', 1, 'JOB', 740, 'SR15', '4030'),
    ],
  },
  {
    doc_no: 'DBN-2026-0009', type: 'debit_note', client_id: 'SIE', job_no: 'LGT/CC/26/0470',
    issue_date: '2026-08-13', supply_date: '2026-08-11', issue_time: '15:47:20',
    original_doc_no: 'INV-2026-0470', buyer_vat_no: '300455667788003', icv: 463,
    uuid: '17be9d40-3c62-4a85-b719-5d0f8ae62c94', clearance: 'cleared',
    reason_en: 'Additional port storage and detention during SFDA inspection hold, 24 days.',
    reason_ar: 'أرضيات وغرامات تأخير إضافية أثناء فحص الهيئة العامة للغذاء والدواء.',
    lines: [
      L('Port storage recharge — 24 days', 'إعادة تحميل أرضيات — ٢٤ يوماً', 24, 'DAY', 766.67, 'SR15', '4010'),
      L('Container detention recharge', 'إعادة تحميل غرامة تأخير الحاوية', 1, 'JOB', 26750, 'SR15', '4010'),
    ],
  },
  {
    doc_no: 'SIN-2026-1184', type: 'invoice', simplified: true, client_id: 'ALM', job_no: null,
    issue_date: '2026-08-15', supply_date: '2026-08-15', issue_time: '08:31:02',
    buyer_vat_no: null, icv: 466,
    uuid: '6d3c0817-91a2-4e5f-8c04-b2e71f96d8a5', clearance: 'reported',
    lines: [
      L('Counter document handling fee', 'رسوم مناولة مستندات', 1, 'JOB', 650, 'SR15', '4010'),
    ],
  },
]

/* --------------------------------------------------------- purchase bills */
export type BillLine = { desc: string; amount: number; tax_code: string; account: string }
export type Bill = {
  bill_no: string; supplier: string; supplier_vat_no: string | null
  supplier_country: string; is_resident: boolean
  bill_date: string; due_date: string; job_no: string | null
  status: 'paid' | 'approved' | 'pending_approval'
  wht_rate?: number; wht_type?: string
  lines: BillLine[]
}

export const bills: Bill[] = [
  { bill_no: 'PB-2026-0221', supplier: 'Riyadh Clearing Agency', supplier_vat_no: '300771122334003', supplier_country: 'SA', is_resident: true,
    bill_date: '2026-05-20', due_date: '2026-06-19', job_no: 'LGT/CC/26/0412', status: 'paid',
    lines: [{ desc: 'Third-party broker charge — MRI consignment', amount: 15570, tax_code: 'PR15', account: '5010' }] },
  { bill_no: 'PB-2026-0234', supplier: 'Jeddah Port Services', supplier_vat_no: '300884455667003', supplier_country: 'SA', is_resident: true,
    bill_date: '2026-05-22', due_date: '2026-06-21', job_no: 'LGT/CC/26/0412', status: 'paid',
    lines: [{ desc: 'Terminal handling and lift-on/lift-off', amount: 12110, tax_code: 'PR15', account: '5020' }] },
  { bill_no: 'PB-2026-0288', supplier: 'Najd Transport Co', supplier_vat_no: '301226677889003', supplier_country: 'SA', is_resident: true,
    bill_date: '2026-07-21', due_date: '2026-08-20', job_no: 'LGT/TR/26/0389', status: 'approved',
    lines: [{ desc: 'Hired trailer — Dammam to Abha', amount: 16416, tax_code: 'PR15', account: '5050' }] },
  { bill_no: 'PB-2026-0301', supplier: 'CMA CGM Agencies', supplier_vat_no: '300995544332003', supplier_country: 'SA', is_resident: true,
    bill_date: '2026-08-11', due_date: '2026-09-10', job_no: 'LGT/CC/26/0470', status: 'approved',
    lines: [
      { desc: 'Container detention — 24 days', amount: 26750, tax_code: 'PR15', account: '5080' },
      { desc: 'Extended port storage', amount: 18400, tax_code: 'PR15', account: '5080' },
    ] },
  { bill_no: 'PB-2026-0309', supplier: 'Kuehne+Nagel GmbH', supplier_vat_no: null, supplier_country: 'DE', is_resident: false,
    bill_date: '2026-08-04', due_date: '2026-09-03', job_no: 'LGT/CC/26/0447', status: 'approved',
    wht_rate: 5, wht_type: 'Air and sea freight',
    lines: [{ desc: 'Origin handling and export documentation, Frankfurt', amount: 38400, tax_code: 'IMP-RC', account: '5020' }] },
  { bill_no: 'PB-2026-0315', supplier: 'Al Jazira Cranes', supplier_vat_no: '301447788990003', supplier_country: 'SA', is_resident: true,
    bill_date: '2026-08-12', due_date: '2026-09-11', job_no: 'LGT/TR/26/0389', status: 'pending_approval',
    lines: [{ desc: 'Destination crane hire — Abha', amount: 7400, tax_code: 'PR15', account: '5060' }] },
]

/* --------------------------------------------------------- expense claims */
export type Claim = {
  claim_no: string; claimant: string; emp_no: string
  submitted_on: string; status: 'approved' | 'submitted' | 'reimbursed' | 'rejected'
  approver?: string; note?: string
  lines: { date: string; desc: string; amount: number; tax_code: string; account: string; job_no: string | null; receipt: boolean }[]
}

export const claims: Claim[] = [
  { claim_no: 'EXP-2026-0088', claimant: 'Khalid Al-Zahrani', emp_no: 'LG-C-601', submitted_on: '2026-08-03',
    status: 'reimbursed', approver: 'Abdulaziz Al-Shammari',
    lines: [
      { date: '2026-07-29', desc: 'Bayan filing fee — SADAD', amount: 1200, tax_code: 'PR15', account: '5010', job_no: 'LGT/CC/26/0458', receipt: true },
      { date: '2026-07-30', desc: 'Courier — original BL to Jeddah', amount: 185, tax_code: 'PR15', account: '6900', job_no: 'LGT/CC/26/0458', receipt: true },
    ] },
  { claim_no: 'EXP-2026-0094', claimant: 'Sajid Iqbal Khan', emp_no: 'LG-D-106', submitted_on: '2026-07-20',
    status: 'approved', approver: 'Abdulaziz Al-Shammari',
    lines: [
      { date: '2026-07-17', desc: 'Diesel — Riyadh depot stop', amount: 640, tax_code: 'PR15', account: '5030', job_no: 'LGT/TR/26/0389', receipt: true },
      { date: '2026-07-18', desc: 'Overnight accommodation, Khamis Mushait', amount: 380, tax_code: 'PR15', account: '5040', job_no: 'LGT/TR/26/0389', receipt: true },
      { date: '2026-07-18', desc: 'Meals — 2 crew', amount: 145, tax_code: 'PR15', account: '5040', job_no: 'LGT/TR/26/0389', receipt: false },
    ] },
  { claim_no: 'EXP-2026-0101', claimant: 'Faris Al-Subaie', emp_no: 'LG-C-602', submitted_on: '2026-08-12',
    status: 'submitted',
    lines: [
      { date: '2026-08-10', desc: 'SFDA sample submission fee', amount: 3500, tax_code: 'PR15', account: '5010', job_no: 'LGT/CC/26/0470', receipt: true },
    ] },
  { claim_no: 'EXP-2026-0103', claimant: 'Nithin Joseph', emp_no: 'LG-S-502', submitted_on: '2026-08-13',
    status: 'rejected', approver: 'Accounts - Amal',
    note: 'No tax invoice attached — input VAT cannot be recovered without one. Resubmit with the supplier tax invoice.',
    lines: [
      { date: '2026-08-09', desc: 'Warehouse consumables — cash purchase', amount: 890, tax_code: 'PR15', account: '5070', job_no: null, receipt: false },
    ] },
]

/* ------------------------------------------------------------------- bank */
export const bankAccounts = [
  { id: 'RB-CUR', account: '1020', name: 'Riyad Bank — current', iban: 'SA03 8000 0000 6080 1016 7519', currency: 'SAR', opening: 1840000 },
  { id: 'SNB-COL', account: '1030', name: 'SNB — collections', iban: 'SA44 1000 0004 5678 9012 3456', currency: 'SAR', opening: 620000 },
]

export type BankLine = {
  id: string; bank_id: string; date: string; description: string
  debit: number; credit: number
  matched_to: string | null; match_type: 'invoice' | 'bill' | 'claim' | 'journal' | null
}

export const bankLines: BankLine[] = [
  { id: 'BL01', bank_id: 'SNB-COL', date: '2026-08-01', description: 'INWARD TT SIEMENS HEALTHINEERS SA', debit: 0, credit: 530000, matched_to: 'TT-2026-0642', match_type: 'journal' },
  { id: 'BL02', bank_id: 'RB-CUR', date: '2026-08-02', description: 'SADAD ZATCA CUSTOMS 020', debit: 185200, credit: 0, matched_to: 'BYN-2026-4492886', match_type: 'journal' },
  { id: 'BL03', bank_id: 'SNB-COL', date: '2026-08-04', description: 'INWARD PHILIPS MEDICAL SYSTEMS ME', debit: 0, credit: 68400, matched_to: 'INV-2026-0389', match_type: 'invoice' },
  { id: 'BL04', bank_id: 'RB-CUR', date: '2026-08-05', description: 'TRF RIYADH CLEARING AGENCY', debit: 17905.5, credit: 0, matched_to: 'PB-2026-0221', match_type: 'bill' },
  { id: 'BL05', bank_id: 'RB-CUR', date: '2026-08-06', description: 'TRF JEDDAH PORT SERVICES', debit: 13926.5, credit: 0, matched_to: 'PB-2026-0234', match_type: 'bill' },
  { id: 'BL06', bank_id: 'RB-CUR', date: '2026-08-07', description: 'PAYROLL WPS BATCH AUG', debit: 412800, credit: 0, matched_to: 'JV-2026-0081', match_type: 'journal' },
  { id: 'BL07', bank_id: 'RB-CUR', date: '2026-08-09', description: 'GOSI CONTRIBUTION JUL', debit: 38640, credit: 0, matched_to: 'JV-2026-0082', match_type: 'journal' },
  { id: 'BL08', bank_id: 'SNB-COL', date: '2026-08-10', description: 'INWARD DRAEGER ARABIA LTD', debit: 0, credit: 34270, matched_to: null, match_type: null },
  { id: 'BL09', bank_id: 'RB-CUR', date: '2026-08-11', description: 'EXPENSE REIMB K AL-ZAHRANI', debit: 1593.75, credit: 0, matched_to: 'EXP-2026-0088', match_type: 'claim' },
  { id: 'BL10', bank_id: 'RB-CUR', date: '2026-08-12', description: 'BANK CHARGES AUG', debit: 385, credit: 0, matched_to: null, match_type: null },
  { id: 'BL11', bank_id: 'SNB-COL', date: '2026-08-13', description: 'INWARD MOH RIYADH CLUSTER', debit: 0, credit: 44200, matched_to: null, match_type: null },
  { id: 'BL12', bank_id: 'RB-CUR', date: '2026-08-14', description: 'FASAH PLATFORM FEE SADAD 135', debit: 2140, credit: 0, matched_to: null, match_type: null },
  { id: 'BL13', bank_id: 'RB-CUR', date: '2026-08-14', description: 'TRF NAJD TRANSPORT CO', debit: 18878.4, credit: 0, matched_to: 'PB-2026-0288', match_type: 'bill' },
  { id: 'BL14', bank_id: 'SNB-COL', date: '2026-08-15', description: 'INWARD UNIDENTIFIED REF 88213', debit: 0, credit: 12600, matched_to: null, match_type: null },
]

/* --------------------------------------------- manual journals (non-document) */
export type ManualJournal = {
  jv_no: string; date: string; memo: string; prepared_by: string; approved_by: string | null
  lines: { account: string; debit: number; credit: number; desc: string; job_no?: string | null }[]
}

export const manualJournals: ManualJournal[] = [
  { jv_no: 'JV-2026-0081', date: '2026-08-07', memo: 'August payroll — WPS batch', prepared_by: 'Accounts - Amal', approved_by: 'Ameer',
    lines: [
      { account: '6010', debit: 412800, credit: 0, desc: 'Salaries and wages — August' },
      { account: '6020', debit: 38640, credit: 0, desc: 'GOSI employer contribution' },
      { account: '2260', debit: 0, credit: 38640, desc: 'GOSI payable' },
      { account: '1020', debit: 0, credit: 412800, desc: 'WPS transfer, Riyad Bank' },
    ] },
  { jv_no: 'JV-2026-0082', date: '2026-08-09', memo: 'GOSI settlement for July', prepared_by: 'Accounts - Amal', approved_by: 'Ameer',
    lines: [
      { account: '2260', debit: 38640, credit: 0, desc: 'GOSI July settled' },
      { account: '1020', debit: 0, credit: 38640, desc: 'Riyad Bank' },
    ] },
  { jv_no: 'JV-2026-0083', date: '2026-08-15', memo: 'End of service award accrual — August', prepared_by: 'Accounts - Amal', approved_by: null,
    lines: [
      { account: '6030', debit: 47200, credit: 0, desc: 'EOSA charge, Article 84 accrual' },
      { account: '2270', debit: 0, credit: 47200, desc: 'EOSA provision' },
    ] },
  { jv_no: 'JV-2026-0084', date: '2026-08-15', memo: 'Depreciation — vehicles and equipment', prepared_by: 'Accounts - Amal', approved_by: null,
    lines: [
      { account: '6100', debit: 61500, credit: 0, desc: 'Monthly depreciation charge' },
      { account: '1510', debit: 0, credit: 61500, desc: 'Accumulated depreciation' },
    ] },
]

/* ------------------------------------------------------------- accounting periods */
export const periods = [
  { period: '2026-05', status: 'closed', vat_filed: true,  vat_ref: 'VAT-2026-05-88214' },
  { period: '2026-06', status: 'closed', vat_filed: true,  vat_ref: 'VAT-2026-06-91077' },
  { period: '2026-07', status: 'closed', vat_filed: true,  vat_ref: 'VAT-2026-07-94510' },
  { period: '2026-08', status: 'open',   vat_filed: false, vat_ref: null },
]
