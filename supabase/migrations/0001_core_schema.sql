-- =========================================================
-- Al Fahad Logistics ERP - core schema
-- Job spine: customs clearance -> warehousing -> transport -> installation
-- Consignments are threaded across job types by batch_no (Siemens SOP)
-- =========================================================

create type job_type      as enum ('customs_clearance','warehousing','transport','installation','freight_forwarding');
create type job_status    as enum ('draft','documents_pending','in_progress','cleared','in_warehouse','in_transit','delivered','installed','completed','on_hold','cancelled');
create type transport_mode as enum ('air','sea','land');
create type trade_type    as enum ('import','export','local');
create type staff_role    as enum ('driver','labour','supervisor','clearance_agent','installer');
create type employment    as enum ('own','outsourced');
create type charge_type   as enum ('customs_duty','vat','port_storage','handling','inspection','security','demurrage','other');
create type advance_dir   as enum ('received','utilised','refunded');
create type movement_dir  as enum ('in','out','adjustment');
create type transport_scope as enum ('local','long_haul','cross_border');

-- ---------- masters ----------
create table clients (
  id            uuid primary key default gen_random_uuid(),
  code          text unique not null,
  name          text not null,
  segment       text,
  country       text default 'Saudi Arabia',
  contact_name  text,
  contact_email text,
  contact_phone text,
  is_key_account boolean default false,
  created_at    timestamptz default now()
);

create table sites (                       -- hospitals / delivery destinations
  id          uuid primary key default gen_random_uuid(),
  client_id   uuid references clients(id) on delete set null,
  name        text not null,
  city        text,
  address     text,
  lat         numeric(9,6),
  lng         numeric(9,6),
  contact_name text,
  contact_phone text
);

create table warehouses (
  id        uuid primary key default gen_random_uuid(),
  code      text unique not null,
  name      text not null,
  city      text,
  capacity_pallets int,
  operated_by text default 'Al Fahad'
);

create table trucks (
  id            uuid primary key default gen_random_uuid(),
  plate_no      text unique not null,
  model         text,
  capacity_tons numeric(6,2),
  body_type     text,
  ownership     employment default 'own',
  active        boolean default true
);

create table staff (
  id            uuid primary key default gen_random_uuid(),
  emp_no        text unique,
  full_name     text not null,
  role          staff_role not null,
  employment    employment default 'own',
  phone         text,
  iqama_no      text,
  licence_no    text,
  base_city     text,
  rating        numeric(3,2) default 4.50,
  active        boolean default true
);

-- ---------- the job spine ----------
create table jobs (
  id              uuid primary key default gen_random_uuid(),
  job_no          text unique not null,
  job_type        job_type not null,
  status          job_status not null default 'in_progress',
  client_id       uuid references clients(id),
  batch_no        text,                         -- threads a consignment across job types
  trade           trade_type default 'import',
  mode            transport_mode,
  bl_awb_no       text,                         -- Bill of Lading / Air Waybill
  carrier         text,                         -- shipping line or airline
  vessel_flight   text,
  port_of_loading text,
  port_of_entry   text,
  shipper         text,
  consignee       text,
  goods_description text,
  packages        int,
  gross_weight_kg numeric(12,2),
  cbm             numeric(12,3),
  eta             date,
  ata             date,
  cleared_on      date,
  opened_on       date default current_date,
  closed_on       date,
  project_manager text,
  sales_manager   text,
  revenue_sar     numeric(14,2) default 0,
  remarks         text,
  created_at      timestamptz default now()
);
create index on jobs (job_type);
create index on jobs (batch_no);
create index on jobs (client_id);

create table job_purchase_orders (
  id          uuid primary key default gen_random_uuid(),
  job_id      uuid references jobs(id) on delete cascade,
  po_no       text not null,
  invoice_no  text,
  currency    text default 'EUR',
  amount      numeric(14,2),
  amount_sar  numeric(14,2)
);

create table job_documents (
  id         uuid primary key default gen_random_uuid(),
  job_id     uuid references jobs(id) on delete cascade,
  doc_type   text not null,               -- BL, AWB, Commercial Invoice, Packing List, Bayan, DN
  file_name  text not null,
  uploaded_by text,
  uploaded_at timestamptz default now(),
  extracted  boolean default false        -- was it auto-read by the OCR/LLM extractor
);

create table job_history (
  id         uuid primary key default gen_random_uuid(),
  job_id     uuid references jobs(id) on delete cascade,
  entry_date date not null default current_date,
  note       text not null,
  author     text
);

create table status_events (
  id         uuid primary key default gen_random_uuid(),
  job_id     uuid references jobs(id) on delete cascade,
  status     job_status not null,
  note       text,
  created_at timestamptz default now()
);

-- ---------- customs duty ----------
create table duty_charges (
  id        uuid primary key default gen_random_uuid(),
  job_id    uuid references jobs(id) on delete cascade,
  type      charge_type not null,
  bayan_no  text,                          -- customs declaration ref
  amount    numeric(14,2) not null default 0,
  paid_on   date
);

create table duty_advances (
  id         uuid primary key default gen_random_uuid(),
  client_id  uuid references clients(id) on delete cascade,
  direction  advance_dir not null,
  reference  text,
  job_id     uuid references jobs(id) on delete set null,
  amount     numeric(14,2) not null,
  txn_date   date not null default current_date,
  note       text
);

-- ---------- money ----------
create table expenses (
  id          uuid primary key default gen_random_uuid(),
  job_id      uuid references jobs(id) on delete cascade,
  category    text not null,
  description text,
  vendor      text,
  amount      numeric(14,2) not null,
  paid_on     date,
  entered_by  text
);

create table invoices (
  id         uuid primary key default gen_random_uuid(),
  job_id     uuid references jobs(id) on delete cascade,
  invoice_no text unique not null,
  issued_on  date,
  amount     numeric(14,2) not null,
  status     text default 'issued'          -- issued | paid | overdue
);
