-- =========================================================
-- Operational extensions: transport, delivery notes,
-- warehouse/inventory, installation, settings
-- =========================================================

-- ---------- transport ----------
create table transport_details (
  job_id          uuid primary key references jobs(id) on delete cascade,
  scope           transport_scope not null default 'local',
  pickup_name     text,
  pickup_address  text,
  pickup_lat      numeric(9,6),
  pickup_lng      numeric(9,6),
  pickup_contact  text,
  drop_site_id    uuid references sites(id),
  drop_address    text,
  drop_lat        numeric(9,6),
  drop_lng        numeric(9,6),
  drop_contact    text,
  distance_km     numeric(10,2),
  pickup_at       timestamptz,
  delivered_at    timestamptz,
  truck_id        uuid references trucks(id),
  driver_id       uuid references staff(id),
  requires_forklift boolean default true,
  loading_photos  int default 0,
  delivery_photos int default 0
);

create table transport_crew (
  id        uuid primary key default gen_random_uuid(),
  job_id    uuid references jobs(id) on delete cascade,
  staff_id  uuid references staff(id),
  source    employment default 'own',
  hours     numeric(6,2)
);

-- driver / labour allowance slabs (km based)
create table allowance_slabs (
  id           uuid primary key default gen_random_uuid(),
  label        text not null,
  min_km       numeric(10,2) not null,
  max_km       numeric(10,2),
  basis        text not null,               -- 'overtime' | 'trip_allowance'
  driver_rate  numeric(10,2) not null,
  labour_rate  numeric(10,2) not null,
  active       boolean default true
);

create table trip_allowances (
  id           uuid primary key default gen_random_uuid(),
  job_id       uuid references jobs(id) on delete cascade,
  staff_id     uuid references staff(id),
  slab_id      uuid references allowance_slabs(id),
  distance_km  numeric(10,2),
  basis        text,
  amount       numeric(12,2),
  computed_on  date default current_date
);

-- ---------- delivery notes ----------
create table delivery_notes (
  id            uuid primary key default gen_random_uuid(),
  dn_no         text unique not null,
  job_id        uuid references jobs(id) on delete cascade,
  issued_on     date default current_date,
  consignee     text,
  delivery_address text,
  vehicle_no    text,
  driver_name   text,
  delivered_at  timestamptz,
  receiver_name text,
  receiver_designation text,
  signature_captured boolean default false,
  condition_remarks text,
  status        text default 'pending'      -- pending | delivered | partially_delivered
);

create table delivery_note_items (
  id          uuid primary key default gen_random_uuid(),
  dn_id       uuid references delivery_notes(id) on delete cascade,
  description text not null,
  batch_no    text,
  serial_no   text,
  qty         numeric(12,2) default 1,
  uom         text default 'PCS',
  remarks     text
);

-- ---------- warehouse / inventory ----------
create table stock_items (
  id            uuid primary key default gen_random_uuid(),
  sku           text unique not null,
  description   text not null,
  category      text,
  uom           text default 'PCS',
  hs_code       text,
  unit_value_sar numeric(14,2)
);

create table stock_movements (
  id            uuid primary key default gen_random_uuid(),
  warehouse_id  uuid references warehouses(id),
  item_id       uuid references stock_items(id),
  job_id        uuid references jobs(id) on delete set null,
  batch_no      text,
  po_no         text,
  direction     movement_dir not null,
  qty           numeric(12,2) not null,
  pallet_no     text,
  barcode       text,
  location_bin  text,
  moved_at      timestamptz default now(),
  handled_by    text
);
create index on stock_movements (batch_no);
create index on stock_movements (warehouse_id);

create table storage_contracts (
  id            uuid primary key default gen_random_uuid(),
  client_id     uuid references clients(id),
  warehouse_id  uuid references warehouses(id),
  basis         text not null,               -- per_pallet_month | monthly_fixed | annual
  rate_sar      numeric(12,2) not null,
  pallets       int,
  starts_on     date,
  ends_on       date
);

-- ---------- installation ----------
create table installation_details (
  job_id        uuid primary key references jobs(id) on delete cascade,
  site_id       uuid references sites(id),
  equipment     text,
  scheduled_on  date,
  completed_on  date,
  lead_engineer text,
  team_size     int,
  handover_signed boolean default false,
  commissioning_notes text
);

-- ---------- settings ----------
create table app_settings (
  key         text primary key,
  value       text not null,
  description text
);
