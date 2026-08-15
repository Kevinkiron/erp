-- =========================================================
-- Reporting views + demo-grade RLS
-- =========================================================

-- Per-job P&L. Unbilled jobs surface as revenue_sar = 0.
create view v_job_pnl as
select j.id,
       j.job_no,
       j.job_type,
       j.status,
       j.batch_no,
       c.name                                    as client_name,
       j.opened_on,
       j.revenue_sar,
       coalesce(e.total,0)                       as expense_sar,
       coalesce(d.total,0)                       as duty_paid_sar,
       coalesce(i.total,0)                       as invoiced_sar,
       j.revenue_sar - coalesce(e.total,0)       as net_pnl_sar,
       (coalesce(i.total,0) = 0)                 as unbilled
from jobs j
left join clients c on c.id = j.client_id
left join (select job_id, sum(amount) total from expenses      group by 1) e on e.job_id = j.id
left join (select job_id, sum(amount) total from duty_charges  group by 1) d on d.job_id = j.id
left join (select job_id, sum(amount) total from invoices      group by 1) i on i.job_id = j.id;

-- Customs duty advance ledger balance per client.
create view v_duty_balance as
select c.id as client_id,
       c.name as client_name,
       sum(case when a.direction = 'received'  then a.amount else 0 end) as advance_received,
       sum(case when a.direction = 'utilised'  then a.amount else 0 end) as advance_utilised,
       sum(case when a.direction = 'refunded'  then a.amount else 0 end) as advance_refunded,
       sum(case when a.direction = 'received'  then a.amount
                when a.direction = 'refunded'  then -a.amount
                else -a.amount end)                                      as balance_sar
from clients c
join duty_advances a on a.client_id = c.id
group by c.id, c.name;

-- Truck utilisation over the trailing period.
create view v_fleet_utilisation as
select t.id, t.plate_no, t.model, t.capacity_tons, t.ownership, t.active,
       count(td.job_id)                          as trips,
       coalesce(sum(td.distance_km),0)           as km_run,
       max(td.pickup_at)                         as last_used_at
from trucks t
left join transport_details td on td.truck_id = t.id
group by t.id;

-- Driver / labour performance.
create view v_driver_performance as
select s.id, s.emp_no, s.full_name, s.role, s.employment, s.base_city, s.rating,
       count(td.job_id)                          as trips,
       coalesce(sum(td.distance_km),0)           as km_run,
       coalesce(sum(ta.amount),0)                as allowances_sar,
       count(*) filter (where dn.status = 'delivered') as deliveries_signed
from staff s
left join transport_details td on td.driver_id = s.id
left join trip_allowances  ta on ta.staff_id  = s.id
left join delivery_notes   dn on dn.job_id    = td.job_id
group by s.id;

-- Client-facing status board (replaces the Monday.com sheet).
create view v_status_board as
select j.id, j.job_no, j.batch_no, j.job_type, j.status, c.name as client_name,
       j.bl_awb_no, j.mode, j.carrier, j.vessel_flight, j.port_of_entry,
       j.eta, j.ata, j.cleared_on, j.goods_description, j.packages, j.remarks,
       exists (select 1 from delivery_notes dn where dn.job_id = j.id) as has_delivery_note,
       exists (select 1 from invoices iv where iv.job_id = j.id)       as invoiced
from jobs j left join clients c on c.id = j.client_id;

-- ---------- demo RLS ----------
-- Read-only for the anon key; the demo app never writes.
do $$
declare t text;
begin
  foreach t in array array[
    'clients','sites','warehouses','trucks','staff','jobs','job_purchase_orders',
    'job_documents','job_history','status_events','duty_charges','duty_advances',
    'expenses','invoices','transport_details','transport_crew','allowance_slabs',
    'trip_allowances','delivery_notes','delivery_note_items','stock_items',
    'stock_movements','storage_contracts','installation_details','app_settings'
  ]
  loop
    execute format('alter table %I enable row level security', t);
    execute format('create policy demo_read on %I for select to anon, authenticated using (true)', t);
  end loop;
end $$;
