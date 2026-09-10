/* eslint-disable @typescript-eslint/no-explicit-any */

export const transport_details = ([
  ['LGT/TR/26/0341','local','Logistica Central Warehouse - Al Sulay','Al Sulay Industrial Area, Riyadh',24.6061,46.8125,'Warehouse Desk','S1','Zahrawi St, Al Maather, Riyadh',24.6864,46.6745,'Eng. Nawaf Al-Dosari',28.4,'2026-05-15T05:30:00+03:00','2026-05-16T14:20:00+03:00','AHB 4821','LG-D-101',true,6,4],
  ['LGT/TR/26/0398','local','Logistica Central Warehouse - Al Sulay','Al Sulay Industrial Area, Riyadh',24.6061,46.8125,'Warehouse Desk','S2','Makkah Al Mukarramah Rd, Riyadh',24.6869,46.7123,'Eng. Bandar Al-Shehri',22.1,'2026-08-15T21:40:00+03:00',null,'KRD 7310','LG-D-103',true,5,0],
  ['LGT/TR/26/0376','local','Jeddah Islamic Port Bonded Store','Jeddah Islamic Port',21.4788,39.1662,'Faris Al-Subaie','S5','Al Sulaymaniyah, Jeddah',21.5022,39.2487,'Eng. Omar Bakhsh',14.6,'2026-07-03T07:00:00+03:00','2026-07-04T11:10:00+03:00','SLM 1194','LG-D-104',true,4,3],
  ['LGT/TR/26/0389','long_haul','Dammam bonded yard','King Abdulaziz Port, Dammam',26.4949,50.2028,'Mansoor Ali','S7','King Faisal Rd, Abha',18.2169,42.5053,'Eng. Fahad Asiri',1320,'2026-07-16T04:00:00+03:00','2026-07-19T16:45:00+03:00','XPT 2280','LG-D-106',true,9,7],
  ['LGT/TR/26/0394','local','King Khalid Intl Cargo Village','Airport Rd, Riyadh',24.9576,46.7003,'Khalid Al-Zahrani','S9','Sulaimaniyah, Riyadh',24.7033,46.7198,'Eng. Turki Al-Mutairi',34.8,'2026-08-03T08:15:00+03:00','2026-08-03T13:05:00+03:00','SLM 1195','LG-D-105',false,3,3],
  ['LGT/TR/26/0401','long_haul','Jeddah Islamic Port Bonded Store','Jeddah Islamic Port',21.4788,39.1662,'Faris Al-Subaie','S10','Prince Fahad Bin Sultan Rd, Tabuk',28.3838,36.566,'Dr. Hani Al-Balawi',1050,'2026-08-13T05:00:00+03:00',null,'XPT 2281','LG-D-107',true,8,0],
  ['LGT/TR/26/0403','long_haul','Logistica Central Warehouse - Al Sulay','Al Sulay Industrial Area, Riyadh',24.6061,46.8125,'Warehouse Desk','S11','Hail City',27.5209,41.6907,'Dr. Meshal Al-Rashidi',640,'2026-08-16T06:00:00+03:00',null,'TRB 6602','LG-D-108',true,0,0],
  ['LGT/TR/26/0362','local','King Abdulaziz Port - Dammam','King Abdulaziz Port, Dammam',26.4949,50.2028,'Mansoor Ali','S4','Ammar Bin Thabit St, Dammam',26.4012,50.1088,'Eng. Hussain Al-Sayed',19.2,'2026-06-17T06:30:00+03:00','2026-06-18T12:00:00+03:00','TRB 6602','LG-D-102',true,7,5],
] as any[]).map((r) => ({
  job_id: r[0], scope: r[1], pickup_name: r[2], pickup_address: r[3], pickup_lat: r[4], pickup_lng: r[5],
  pickup_contact: r[6], drop_site_id: r[7], drop_address: r[8], drop_lat: r[9], drop_lng: r[10], drop_contact: r[11],
  distance_km: r[12], pickup_at: r[13], delivered_at: r[14], truck_id: r[15], driver_id: r[16],
  requires_forklift: r[17], loading_photos: r[18], delivery_photos: r[19],
}))

export const transport_crew = ([
  ['LGT/TR/26/0341','LG-L-301',14],['LGT/TR/26/0341','LG-L-302',14],['LGT/TR/26/0341','LG-L-303',14],
  ['LGT/TR/26/0341','LG-L-401',14],['LGT/TR/26/0341','LG-L-402',14],
  ['LGT/TR/26/0398','LG-L-303',8],['LGT/TR/26/0398','LG-L-305',8],
  ['LGT/TR/26/0376','LG-L-304',9.5],['LGT/TR/26/0376','LG-L-403',9.5],
  ['LGT/TR/26/0389','LG-L-306',62],['LGT/TR/26/0389','LG-L-401',62],['LGT/TR/26/0389','LG-L-402',62],['LGT/TR/26/0389','LG-L-403',62],
  ['LGT/TR/26/0394','LG-L-301',5],['LGT/TR/26/0394','LG-L-305',5],
  ['LGT/TR/26/0401','LG-L-302',40],['LGT/TR/26/0401','LG-L-401',40],
  ['LGT/TR/26/0362','LG-L-306',11],['LGT/TR/26/0362','LG-L-303',11],
] as any[]).map((r, i) => ({ id: 'TC' + i, job_id: r[0], staff_id: r[1], hours: r[2] }))

export const delivery_notes = ([
  ['DN-2026-0451','LGT/TR/26/0341','2026-05-15','King Faisal Specialist Hospital & Research Centre','Zahrawi St, Al Maather, Riyadh','AHB 4821','Mohammed Al-Qahtani','2026-05-16T14:20:00+03:00','Eng. Nawaf Al-Dosari','Biomedical Engineer',true,'All 14 packages received in good condition. Crane offload witnessed.','delivered'],
  ['DN-2026-0462','LGT/TR/26/0376','2026-07-03','GE HealthCare Arabia','Al Sulaymaniyah, Jeddah','SLM 1194','Abdul Rahman Siddiqui','2026-07-04T11:10:00+03:00','Eng. Omar Bakhsh','Project Engineer',true,'2 crates re-strapped on arrival, contents verified intact.','delivered'],
  ['DN-2026-0474','LGT/TR/26/0389','2026-07-16','Philips Medical Systems ME','King Faisal Rd, Abha','XPT 2280','Sajid Iqbal Khan','2026-07-19T16:45:00+03:00','Eng. Fahad Asiri','Site Engineer',true,'18 packages delivered. Minor scuff on crate 11 photographed at loading.','delivered'],
  ['DN-2026-0479','LGT/TR/26/0394','2026-08-03','Draeger Arabia Ltd','Sulaimaniyah, Riyadh','SLM 1195','Anil Kumar Nair','2026-08-03T13:05:00+03:00','Sgt. Mohammed Al-Otaibi','Stores Supervisor',true,'24 ventilators received, seals intact.','delivered'],
  ['DN-2026-0468','LGT/TR/26/0362','2026-06-17','Siemens Healthineers Saudi Arabia','Ammar Bin Thabit St, Dammam','TRB 6602','Rafeeq Ahmed Kutty','2026-06-18T12:00:00+03:00','Eng. Hussain Al-Sayed','Project Manager',true,'Delivered complete.','delivered'],
  ['DN-2026-0483','LGT/TR/26/0398','2026-08-15','Siemens Healthineers Saudi Arabia','Makkah Al Mukarramah Rd, Riyadh','KRD 7310','Shibu Varghese',null,null,null,false,null,'pending'],
  ['DN-2026-0484','LGT/TR/26/0401','2026-08-13','Ministry of Health - Riyadh Cluster','Prince Fahad Bin Sultan Rd, Tabuk','XPT 2281','Yousef Al-Ghamdi',null,null,null,false,null,'pending'],
] as any[]).map((r) => ({
  id: r[0], dn_no: r[0], job_id: r[1], issued_on: r[2], consignee: r[3], delivery_address: r[4], vehicle_no: r[5],
  driver_name: r[6], delivered_at: r[7], receiver_name: r[8], receiver_designation: r[9],
  signature_captured: r[10], condition_remarks: r[11], status: r[12],
}))

export const delivery_note_items = ([
  ['DN-2026-0451','MAGNETOM Sola 1.5T magnet assembly','BN-SIE-2026-0431','MG-114203-01',1,'CRATE',null],
  ['DN-2026-0451','Gradient and RF cabinet','BN-SIE-2026-0431','GC-114203-02',2,'CRATE',null],
  ['DN-2026-0451','Operator console and workstation','BN-SIE-2026-0431','OC-114203-03',3,'BOX',null],
  ['DN-2026-0451','Chiller and cabling set','BN-SIE-2026-0431','CH-114203-04',8,'BOX',null],
  ['DN-2026-0462','Revolution CT patient table','BN-GEH-2026-0112','PT-55120-01',1,'CRATE',null],
  ['DN-2026-0462','Gantry covers and trim','BN-GEH-2026-0112','GV-55120-02',5,'BOX','2 boxes re-strapped'],
  ['DN-2026-0474','Azurion 7 C-arm assembly','BN-PHL-2026-0077','CA-88014-01',1,'CRATE',null],
  ['DN-2026-0474','Table and detector modules','BN-PHL-2026-0077','TD-88014-02',4,'CRATE',null],
  ['DN-2026-0474','Monitors, cabling and spares','BN-PHL-2026-0077','MS-88014-03',13,'BOX','Crate 11 minor scuff'],
  ['DN-2026-0479','Evita V300 ventilator','BN-DRG-2026-0031','EV-33107',24,'BOX',null],
  ['DN-2026-0468','Angiography system components','BN-SIE-2026-0429','AG-116770',15,'CRATE',null],
  ['DN-2026-0483','SOMATOM go.Top CT gantry','BN-SIE-2026-0438','CT-118877-01',1,'CRATE','Night delivery'],
  ['DN-2026-0483','Patient table and console','BN-SIE-2026-0438','PT-118877-02',8,'BOX',null],
  ['DN-2026-0484','Mobile X-Ray units','BN-MOH-2026-0205','MX-119902-01',12,'CRATE',null],
  ['DN-2026-0484','Monitoring carts','BN-MOH-2026-0205','MC-119902-02',14,'BOX',null],
] as any[]).map((r, i) => ({ id: 'DNI' + i, dn_id: r[0], description: r[1], batch_no: r[2], serial_no: r[3], qty: r[4], uom: r[5], remarks: r[6] }))

export const installation_details = [
  { job_id: 'LGT/IN/26/0092', site_id: 'S1', equipment: 'MAGNETOM Sola 1.5T MRI', scheduled_on: '2026-05-17', completed_on: '2026-05-28', lead_engineer: 'Eng. Deepak Sharma', team_size: 6, handover_signed: true, commissioning_notes: 'Magnet ramped, helium level 94%. QA phantom scans passed. Handover signed by biomedical dept.' },
  { job_id: 'LGT/IN/26/0104', site_id: 'S7', equipment: 'Azurion 7 cath lab', scheduled_on: '2026-07-21', completed_on: null, lead_engineer: 'Eng. Arun Prasad', team_size: 4, handover_signed: false, commissioning_notes: 'Mechanical install complete. Waiting on hospital civil works for shielded door before calibration.' },
]

export const stock_movements = ([
  ['WH-RUH-01','SIE-MR-3T-001','LGT/WH/26/0188','BN-SIE-2026-0431','4500221871','in',14,'PLT-RUH-1102','LG-BC-00011024','A-01-03','2026-04-28T09:20:00+03:00','Sunil Thomas'],
  ['WH-RUH-01','SIE-MR-3T-001','LGT/WH/26/0188','BN-SIE-2026-0431','4500221871','out',14,'PLT-RUH-1102','LG-BC-00011024','A-01-03','2026-05-15T05:10:00+03:00','Sunil Thomas'],
  ['WH-RUH-01','SIE-CT-64-014','LGT/WH/26/0231','BN-SIE-2026-0438','4500229104','in',9,'PLT-RUH-1188','LG-BC-00011880','B-02-01','2026-07-27T11:05:00+03:00','Jaseem Abdulla'],
  ['WH-RUH-01','SIE-XR-DR-220','LGT/WH/26/0236','BN-SIE-2026-0442','4500231550','in',11,'PLT-RUH-1204','LG-BC-00012041','B-03-04','2026-08-07T08:40:00+03:00','Noufal Rahman'],
  ['WH-RUH-01','SIE-XR-DR-220','LGT/WH/26/0236','BN-SIE-2026-0442','4500231550','out',6,'PLT-RUH-1204','LG-BC-00012041','B-03-04','2026-08-12T15:30:00+03:00','Noufal Rahman'],
  ['WH-JED-01','GEH-ACC-COIL-12','LGT/WH/26/0242','BN-GEH-2026-0112','4400118820','in',4,'PLT-JED-0331','LG-BC-00033107','C-01-02','2026-07-03T10:15:00+03:00','Prakash Menon'],
  ['WH-RUH-01','SIE-SPR-KIT-01',null,'BN-SIE-2026-0426','4500223117','in',18,'PLT-RUH-1150','LG-BC-00011501','D-04-01','2026-05-12T13:00:00+03:00','Hamza Sheikh'],
  ['WH-RUH-01','SIE-SPR-KIT-01',null,'BN-SIE-2026-0426','4500223117','out',7,'PLT-RUH-1150','LG-BC-00011501','D-04-01','2026-06-22T09:45:00+03:00','Hamza Sheikh'],
  ['WH-RUH-01','SIE-CON-CBL-77',null,'BN-SIE-2026-0426','4500223117','in',26,'PLT-RUH-1151','LG-BC-00011502','D-04-02','2026-05-12T13:20:00+03:00','Hamza Sheikh'],
  ['WH-RUH-01','SIE-CON-CBL-77',null,'BN-SIE-2026-0426','4500223117','out',9,'PLT-RUH-1151','LG-BC-00011502','D-04-02','2026-07-08T10:05:00+03:00','Hamza Sheikh'],
  ['WH-RUH-01','SIE-LAB-AT-45',null,'BN-SIE-2026-0429','4500226009','in',6,'PLT-RUH-1170','LG-BC-00011711','A-02-04','2026-06-16T14:10:00+03:00','Sunil Thomas'],
  ['WH-DMM-01','DRG-VEN-EV3',null,'BN-DRG-2026-0031','9900112044','in',24,'PLT-DMM-0210','LG-BC-00021002','A-01-01','2026-07-31T16:20:00+03:00','Vinod Pillai'],
  ['WH-DMM-01','DRG-VEN-EV3',null,'BN-DRG-2026-0031','9900112044','out',24,'PLT-DMM-0210','LG-BC-00021002','A-01-01','2026-08-03T07:50:00+03:00','Vinod Pillai'],
  ['WH-RUH-01','SIE-US-ACU-77',null,'BN-SIE-2026-0421','4500218440','in',10,'PLT-RUH-1080','LG-BC-00010801','C-02-03','2026-04-11T09:00:00+03:00','Jaseem Abdulla'],
  ['WH-RUH-01','SIE-US-ACU-77',null,'BN-SIE-2026-0421','4500218440','out',10,'PLT-RUH-1080','LG-BC-00010801','C-02-03','2026-04-26T11:30:00+03:00','Jaseem Abdulla'],
  ['WH-JED-01','GEH-MON-B450',null,'BN-GEH-2026-0112','4400118820','in',12,'PLT-JED-0340','LG-BC-00033220','C-01-05','2026-07-05T09:10:00+03:00','Prakash Menon'],
  ['WH-RUH-01','PHL-XR-AZ-090',null,'BN-PHL-2026-0077','7700334120','in',18,'PLT-RUH-1195','LG-BC-00011955','A-03-01','2026-07-14T12:00:00+03:00','Hamza Sheikh'],
  ['WH-RUH-01','PHL-XR-AZ-090',null,'BN-PHL-2026-0077','7700334120','out',18,'PLT-RUH-1195','LG-BC-00011955','A-03-01','2026-07-16T04:20:00+03:00','Hamza Sheikh'],
  ['WH-RUH-01','GEH-CT-RV-120',null,'BN-GEH-2026-0112','4400118820','in',6,'PLT-RUH-1210','LG-BC-00012100','B-01-02','2026-07-02T08:30:00+03:00','Noufal Rahman'],
  ['WH-RUH-01','SIE-SPR-KIT-01',null,'BN-SIE-2026-0455','4500234002','adjustment',3,'PLT-RUH-1150','LG-BC-00011501','D-04-01','2026-08-10T17:00:00+03:00','Abdulaziz Al-Shammari'],
] as any[]).map((r, i) => ({
  id: 'SM' + i, warehouse_id: r[0], item_id: r[1], job_id: r[2], batch_no: r[3], po_no: r[4], direction: r[5],
  qty: r[6], pallet_no: r[7], barcode: r[8], location_bin: r[9], moved_at: r[10], handled_by: r[11],
}))

// expense ratios applied per job type — mirrors the seed SQL
export const EXPENSE_RULES: Record<string, [string, string, string, number][]> = {
  customs_clearance: [
    ['Clearance agent fee', 'Third-party broker charge', 'Riyadh Clearing Agency', 0.18],
    ['Port handling', 'Terminal handling and lift-on/lift-off', 'Jeddah Port Services', 0.14],
    ['Transport to warehouse', 'Port to Al Sulay warehouse haulage', 'Internal fleet', 0.12],
    ['Documentation', 'Bayan filing, SFDA and courier', 'Logistica Admin', 0.045],
  ],
  transport: [
    ['Fuel', 'Diesel for the trip', 'Aldrees Petroleum', 0.19],
    ['Driver & labour allowance', 'Overtime / trip allowance per slab', 'Payroll', 0.23],
    ['Crane / forklift hire', 'Destination handling equipment', 'Al Jazira Cranes', 0.11],
  ],
  warehousing: [
    ['Warehouse labour', 'Put-away, picking and stock counts', 'Payroll', 0.26],
    ['Racking & consumables', 'Pallets, shrink wrap and labels', 'Sulay Trading', 0.09],
  ],
  installation: [
    ['Engineer time', 'Installation engineers on site', 'Payroll', 0.3],
    ['Rigging & tools', 'Rigging, lifting gear and calibration tools', 'Al Jazira Cranes', 0.15],
  ],
  freight_forwarding: [['Airline freight', 'Air freight charge', 'Saudia Cargo', 0.52]],
}

export const OUTSOURCED_TRUCK_JOBS = ['LGT/TR/26/0389', 'LGT/TR/26/0401', 'LGT/TR/26/0341']

export const EXTRA_EXPENSES = ([
  ['LGT/CC/26/0470','Demurrage','Container detention 24 days at CMA CGM','CMA CGM',26750,'2026-08-11'],
  ['LGT/CC/26/0470','Port storage','Extended yard storage during SFDA hold','Jeddah Port Services',18400,'2026-08-11'],
  ['LGT/CC/26/0470','Inspection charges','SFDA laboratory testing of cable sets','SFDA',3500,'2026-08-11'],
] as any[]).map((r, i) => ({ id: 'EX-X' + i, job_id: r[0], category: r[1], description: r[2], vendor: r[3], amount: r[4], paid_on: r[5], entered_by: 'Accounts - Amal' }))

export const UNBILLED_JOBS = ['LGT/TR/26/0362', 'LGT/CC/26/0458']
