// Offline demo dataset — mirrors the Supabase seed in supabase/migrations + seed SQL.
// Ids are stable strings so relations are readable.

export const clients = [
  { id: 'SIE', code: 'SIE', name: 'Siemens Healthineers Saudi Arabia', segment: 'Medical Equipment', country: 'Saudi Arabia', contact_name: 'Klaus Berger', contact_email: 'k.berger@demo-siemens.sa', contact_phone: '+966 11 220 4410', is_key_account: true },
  { id: 'GEH', code: 'GEH', name: 'GE HealthCare Arabia', segment: 'Medical Equipment', country: 'Saudi Arabia', contact_name: 'Faisal Al-Otaibi', contact_email: 'f.otaibi@demo-gehc.sa', contact_phone: '+966 11 488 7720', is_key_account: true },
  { id: 'PHL', code: 'PHL', name: 'Philips Medical Systems ME', segment: 'Medical Equipment', country: 'Saudi Arabia', contact_name: 'Marc de Vries', contact_email: 'm.devries@demo-philips.sa', contact_phone: '+966 11 265 3390', is_key_account: false },
  { id: 'DRG', code: 'DRG', name: 'Draeger Arabia Ltd', segment: 'Medical Equipment', country: 'Saudi Arabia', contact_name: 'Ahmed Nasser', contact_email: 'a.nasser@demo-draeger.sa', contact_phone: '+966 13 833 2210', is_key_account: false },
  { id: 'MOH', code: 'MOH', name: 'Ministry of Health - Riyadh Cluster', segment: 'Government', country: 'Saudi Arabia', contact_name: 'Dr. Saleh Al-Harbi', contact_email: 's.harbi@demo-moh.gov.sa', contact_phone: '+966 11 212 9000', is_key_account: false },
  { id: 'ALM', code: 'ALM', name: 'Almarai Medical Supplies', segment: 'Consumables', country: 'Saudi Arabia', contact_name: 'Tariq Bin Zayed', contact_email: 't.zayed@demo-alm.sa', contact_phone: '+966 11 470 1122', is_key_account: false },
]

export const sites = [
  { id: 'S1', client_id: 'SIE', name: 'King Faisal Specialist Hospital & Research Centre', city: 'Riyadh', address: 'Zahrawi St, Al Maather, Riyadh', lat: 24.6864, lng: 46.6745, contact_name: 'Eng. Nawaf Al-Dosari', contact_phone: '+966 55 210 4471' },
  { id: 'S2', client_id: 'SIE', name: 'King Fahad Medical City', city: 'Riyadh', address: 'Makkah Al Mukarramah Rd, Riyadh', lat: 24.6869, lng: 46.7123, contact_name: 'Eng. Bandar Al-Shehri', contact_phone: '+966 55 664 2210' },
  { id: 'S3', client_id: 'SIE', name: 'King Abdulaziz Medical City (NGHA)', city: 'Riyadh', address: 'Ar Rimayah, Riyadh', lat: 24.7841, lng: 46.6884, contact_name: 'Eng. Majed Al-Anazi', contact_phone: '+966 50 771 3388' },
  { id: 'S4', client_id: 'SIE', name: 'King Fahad Specialist Hospital', city: 'Dammam', address: 'Ammar Bin Thabit St, Dammam', lat: 26.4012, lng: 50.1088, contact_name: 'Eng. Hussain Al-Sayed', contact_phone: '+966 53 442 9910' },
  { id: 'S5', client_id: 'GEH', name: 'King Abdulaziz University Hospital', city: 'Jeddah', address: 'Al Sulaymaniyah, Jeddah', lat: 21.5022, lng: 39.2487, contact_name: 'Eng. Omar Bakhsh', contact_phone: '+966 56 330 7742' },
  { id: 'S6', client_id: 'GEH', name: 'Al Noor Specialist Hospital', city: 'Makkah', address: 'Al Aziziyah, Makkah', lat: 21.3945, lng: 39.8572, contact_name: 'Eng. Yasir Qureshi', contact_phone: '+966 55 118 2204' },
  { id: 'S7', client_id: 'PHL', name: 'Asir Central Hospital', city: 'Abha', address: 'King Faisal Rd, Abha', lat: 18.2169, lng: 42.5053, contact_name: 'Eng. Fahad Asiri', contact_phone: '+966 54 992 0071' },
  { id: 'S8', client_id: 'PHL', name: 'King Khalid Hospital', city: 'Najran', address: 'Najran City', lat: 17.5412, lng: 44.2226, contact_name: 'Eng. Saad Al-Yami', contact_phone: '+966 50 447 6620' },
  { id: 'S9', client_id: 'DRG', name: 'Prince Sultan Military Medical City', city: 'Riyadh', address: 'Sulaimaniyah, Riyadh', lat: 24.7033, lng: 46.7198, contact_name: 'Eng. Turki Al-Mutairi', contact_phone: '+966 55 880 3312' },
  { id: 'S10', client_id: 'MOH', name: 'Maternity & Children Hospital', city: 'Tabuk', address: 'Prince Fahad Bin Sultan Rd, Tabuk', lat: 28.3838, lng: 36.566, contact_name: 'Dr. Hani Al-Balawi', contact_phone: '+966 56 220 8845' },
  { id: 'S11', client_id: 'MOH', name: 'King Salman Hospital', city: 'Hail', address: 'Hail City', lat: 27.5209, lng: 41.6907, contact_name: 'Dr. Meshal Al-Rashidi', contact_phone: '+966 50 118 4409' },
  { id: 'S12', client_id: 'SIE', name: 'Al Fahad Central Warehouse - Al Sulay', city: 'Riyadh', address: 'Al Sulay Industrial Area, Riyadh', lat: 24.6061, lng: 46.8125, contact_name: 'Warehouse Desk', contact_phone: '+966 11 265 7788' },
]

export const warehouses = [
  { id: 'WH-RUH-01', code: 'WH-RUH-01', name: 'Al Fahad Central Warehouse - Al Sulay', city: 'Riyadh', capacity_pallets: 1200, operated_by: 'Siemens (SAP) - handover pending' },
  { id: 'WH-JED-01', code: 'WH-JED-01', name: 'Jeddah Islamic Port Bonded Store', city: 'Jeddah', capacity_pallets: 400, operated_by: 'Al Fahad' },
  { id: 'WH-DMM-01', code: 'WH-DMM-01', name: 'Dammam Transit Hub', city: 'Dammam', capacity_pallets: 300, operated_by: 'Al Fahad' },
  { id: 'WH-RUH-02', code: 'WH-RUH-02', name: 'Riyadh Free Zone Facility (planned)', city: 'Riyadh', capacity_pallets: 800, operated_by: 'Planned - Q4 2026' },
]

export const trucks = [
  { id: 'AHB 4821', plate_no: 'AHB 4821', model: 'Mercedes Actros 2645', capacity_tons: 25, body_type: 'Curtain side', ownership: 'own', active: true },
  { id: 'AHB 4822', plate_no: 'AHB 4822', model: 'Mercedes Actros 2645', capacity_tons: 25, body_type: 'Curtain side', ownership: 'own', active: true },
  { id: 'KRD 7310', plate_no: 'KRD 7310', model: 'Volvo FH 460', capacity_tons: 24, body_type: 'Box - air ride', ownership: 'own', active: true },
  { id: 'KRD 7311', plate_no: 'KRD 7311', model: 'Volvo FH 460', capacity_tons: 24, body_type: 'Box - air ride', ownership: 'own', active: true },
  { id: 'SLM 1194', plate_no: 'SLM 1194', model: 'Isuzu NPR 75', capacity_tons: 7.5, body_type: 'Box with tail-lift', ownership: 'own', active: true },
  { id: 'SLM 1195', plate_no: 'SLM 1195', model: 'Isuzu NPR 75', capacity_tons: 7.5, body_type: 'Box with tail-lift', ownership: 'own', active: true },
  { id: 'TRB 6602', plate_no: 'TRB 6602', model: 'Hino 500 Series', capacity_tons: 12, body_type: 'Flatbed', ownership: 'own', active: true },
  { id: 'TRB 6603', plate_no: 'TRB 6603', model: 'Hino 500 Series', capacity_tons: 12, body_type: 'Flatbed', ownership: 'own', active: false },
  { id: 'XPT 2280', plate_no: 'XPT 2280', model: 'MAN TGX 18.440', capacity_tons: 24, body_type: 'Curtain side', ownership: 'outsourced', active: true },
  { id: 'XPT 2281', plate_no: 'XPT 2281', model: 'Scania R450', capacity_tons: 24, body_type: 'Box', ownership: 'outsourced', active: true },
  { id: 'XPT 2282', plate_no: 'XPT 2282', model: 'Isuzu FVR', capacity_tons: 10, body_type: 'Box with tail-lift', ownership: 'outsourced', active: true },
  { id: 'XPT 2283', plate_no: 'XPT 2283', model: 'Mercedes Axor', capacity_tons: 18, body_type: 'Flatbed', ownership: 'outsourced', active: true },
]

const S = (emp_no: string, full_name: string, role: string, employment: string, phone: string, base_city: string, rating: number, licence_no: string | null = null) =>
  ({ id: emp_no, emp_no, full_name, role, employment, phone, base_city, rating, licence_no, iqama_no: employment === 'own' ? '245' + emp_no.replace(/\D/g, '') : null, active: true })

export const staff = [
  S('AF-D-101', 'Mohammed Al-Qahtani', 'driver', 'own', '+966 55 331 2201', 'Riyadh', 4.8, 'DL-4421093'),
  S('AF-D-102', 'Rafeeq Ahmed Kutty', 'driver', 'own', '+966 55 331 2202', 'Riyadh', 4.6, 'DL-4421094'),
  S('AF-D-103', 'Shibu Varghese', 'driver', 'own', '+966 55 331 2203', 'Riyadh', 4.9, 'DL-4421095'),
  S('AF-D-104', 'Abdul Rahman Siddiqui', 'driver', 'own', '+966 55 331 2204', 'Jeddah', 4.3, 'DL-4421096'),
  S('AF-D-105', 'Anil Kumar Nair', 'driver', 'own', '+966 55 331 2205', 'Riyadh', 4.7, 'DL-4421097'),
  S('AF-D-106', 'Sajid Iqbal Khan', 'driver', 'own', '+966 55 331 2206', 'Dammam', 4.1, 'DL-4421098'),
  S('AF-D-107', 'Yousef Al-Ghamdi', 'driver', 'own', '+966 55 331 2207', 'Jeddah', 4.5, 'DL-4421099'),
  S('AF-D-108', 'Ramesh Chandran', 'driver', 'own', '+966 55 331 2208', 'Riyadh', 4.4, 'DL-4421100'),
  S('AF-D-201', 'Imran Hafeez', 'driver', 'outsourced', '+966 56 774 1120', 'Riyadh', 3.9, 'DL-5580021'),
  S('AF-D-202', 'Bilal Mehmood', 'driver', 'outsourced', '+966 56 774 1121', 'Jeddah', 4.0, 'DL-5580022'),
  S('AF-L-301', 'Sunil Thomas', 'labour', 'own', '+966 57 220 1101', 'Riyadh', 4.6),
  S('AF-L-302', 'Jaseem Abdulla', 'labour', 'own', '+966 57 220 1102', 'Riyadh', 4.5),
  S('AF-L-303', 'Noufal Rahman', 'labour', 'own', '+966 57 220 1103', 'Riyadh', 4.7),
  S('AF-L-304', 'Prakash Menon', 'labour', 'own', '+966 57 220 1104', 'Jeddah', 4.2),
  S('AF-L-305', 'Hamza Sheikh', 'labour', 'own', '+966 57 220 1105', 'Riyadh', 4.4),
  S('AF-L-306', 'Vinod Pillai', 'labour', 'own', '+966 57 220 1106', 'Dammam', 4.3),
  S('AF-L-401', 'Zakir Hussain', 'labour', 'outsourced', '+966 58 991 2210', 'Riyadh', 3.8),
  S('AF-L-402', 'Naveed Akram', 'labour', 'outsourced', '+966 58 991 2211', 'Riyadh', 3.95),
  S('AF-L-403', 'Salim Basheer', 'labour', 'outsourced', '+966 58 991 2212', 'Jeddah', 4.05),
  S('AF-S-501', 'Abdulaziz Al-Shammari', 'supervisor', 'own', '+966 55 442 0011', 'Riyadh', 4.85),
  S('AF-S-502', 'Nithin Joseph', 'supervisor', 'own', '+966 55 442 0012', 'Jeddah', 4.55),
  S('AF-C-601', 'Khalid Al-Zahrani', 'clearance_agent', 'own', '+966 55 660 3301', 'Riyadh', 4.75),
  S('AF-C-602', 'Faris Al-Subaie', 'clearance_agent', 'own', '+966 55 660 3302', 'Jeddah', 4.65),
  S('AF-C-603', 'Mansoor Ali', 'clearance_agent', 'outsourced', '+966 56 118 4420', 'Dammam', 4.2),
  S('AF-I-701', 'Eng. Deepak Sharma', 'installer', 'own', '+966 55 909 1101', 'Riyadh', 4.9),
  S('AF-I-702', 'Eng. Waleed Al-Harbi', 'installer', 'own', '+966 55 909 1102', 'Riyadh', 4.7),
  S('AF-I-703', 'Eng. Arun Prasad', 'installer', 'own', '+966 55 909 1103', 'Jeddah', 4.6),
]

export const allowance_slabs = [
  { id: 'SL1', label: 'Local / same city (0-300 km)', min_km: 0, max_km: 300, basis: 'overtime', driver_rate: 150, labour_rate: 100, active: true },
  { id: 'SL2', label: 'Regional (300-500 km)', min_km: 300, max_km: 500, basis: 'trip_allowance', driver_rate: 250, labour_rate: 175, active: true },
  { id: 'SL3', label: 'Long haul (500-800 km)', min_km: 500, max_km: 800, basis: 'trip_allowance', driver_rate: 400, labour_rate: 300, active: true },
  { id: 'SL4', label: 'Extended (800-1200 km)', min_km: 800, max_km: 1200, basis: 'trip_allowance', driver_rate: 550, labour_rate: 425, active: true },
  { id: 'SL5', label: 'Cross-country (1200 km+)', min_km: 1200, max_km: null, basis: 'trip_allowance', driver_rate: 750, labour_rate: 600, active: true },
]

export const app_settings = [
  { key: 'base_currency', value: 'SAR', description: 'Reporting currency' },
  { key: 'company_name', value: 'Al Fahad Logistics & Clearing Est.', description: 'Legal entity shown on documents' },
  { key: 'doc_extraction', value: 'Enabled (BL / AWB / Commercial Invoice)', description: 'Drag-and-drop auto-fill, staff verify before save' },
  { key: 'duty_advance_alert_sar', value: '300000', description: 'Alert when a client duty-advance balance falls below this' },
  { key: 'duty_advance_critical_sar', value: '0', description: 'Critical when balance is overdrawn' },
  { key: 'gps_provider', value: 'Google Maps Distance Matrix', description: 'Used to compute point-to-point km for allowance slabs' },
  { key: 'vat_rate', value: '15', description: 'Saudi VAT %' },
]

export const stock_items = [
  { id: 'SIE-MR-3T-001', sku: 'SIE-MR-3T-001', description: 'MAGNETOM Sola 1.5T MRI System - main magnet crate', category: 'MRI', uom: 'CRATE', hs_code: '9018.13.00', unit_value_sar: 4850000 },
  { id: 'SIE-CT-64-014', sku: 'SIE-CT-64-014', description: 'SOMATOM go.Top 64-slice CT gantry', category: 'CT', uom: 'CRATE', hs_code: '9022.12.00', unit_value_sar: 2260000 },
  { id: 'SIE-XR-DR-220', sku: 'SIE-XR-DR-220', description: 'YSIO X.pree DR X-Ray - tube assembly', category: 'X-Ray', uom: 'CASE', hs_code: '9022.14.00', unit_value_sar: 412000 },
  { id: 'SIE-US-ACU-77', sku: 'SIE-US-ACU-77', description: 'ACUSON Sequoia Ultrasound console', category: 'Ultrasound', uom: 'BOX', hs_code: '9018.12.00', unit_value_sar: 298000 },
  { id: 'SIE-LAB-AT-45', sku: 'SIE-LAB-AT-45', description: 'Atellica Solution analyser module', category: 'Lab', uom: 'CRATE', hs_code: '9027.80.00', unit_value_sar: 735000 },
  { id: 'GEH-CT-RV-120', sku: 'GEH-CT-RV-120', description: 'Revolution CT - patient table', category: 'CT', uom: 'CRATE', hs_code: '9022.12.00', unit_value_sar: 389000 },
  { id: 'GEH-MON-B450', sku: 'GEH-MON-B450', description: 'CARESCAPE B450 patient monitor', category: 'Monitoring', uom: 'BOX', hs_code: '9018.19.00', unit_value_sar: 26500 },
  { id: 'PHL-XR-AZ-090', sku: 'PHL-XR-AZ-090', description: 'Azurion 7 C-arm assembly', category: 'Cath Lab', uom: 'CRATE', hs_code: '9022.14.00', unit_value_sar: 1720000 },
  { id: 'DRG-VEN-EV3', sku: 'DRG-VEN-EV3', description: 'Evita V300 ventilator', category: 'Critical Care', uom: 'BOX', hs_code: '9019.20.00', unit_value_sar: 148000 },
  { id: 'SIE-SPR-KIT-01', sku: 'SIE-SPR-KIT-01', description: 'Installation spares & accessory kit', category: 'Spares', uom: 'CARTON', hs_code: '8543.70.00', unit_value_sar: 18500 },
  { id: 'SIE-CON-CBL-77', sku: 'SIE-CON-CBL-77', description: 'High-voltage cable set', category: 'Consumables', uom: 'ROLL', hs_code: '8544.60.00', unit_value_sar: 9400 },
  { id: 'GEH-ACC-COIL-12', sku: 'GEH-ACC-COIL-12', description: 'MRI surface coil set', category: 'Accessories', uom: 'CASE', hs_code: '9018.13.00', unit_value_sar: 64000 },
]

export const storage_contracts = [
  { id: 'SC1', client_id: 'SIE', warehouse_id: 'WH-RUH-01', basis: 'per_pallet_month', rate_sar: 185, pallets: 600, starts_on: '2026-01-01', ends_on: '2026-12-31' },
  { id: 'SC2', client_id: 'GEH', warehouse_id: 'WH-JED-01', basis: 'per_pallet_month', rate_sar: 210, pallets: 60, starts_on: '2026-03-01', ends_on: '2027-02-28' },
  { id: 'SC3', client_id: 'PHL', warehouse_id: 'WH-RUH-01', basis: 'monthly_fixed', rate_sar: 28000, pallets: 120, starts_on: '2026-05-01', ends_on: '2027-04-30' },
  { id: 'SC4', client_id: 'DRG', warehouse_id: 'WH-DMM-01', basis: 'annual', rate_sar: 180000, pallets: 80, starts_on: '2026-01-01', ends_on: '2026-12-31' },
]
