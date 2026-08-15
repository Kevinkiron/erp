-- =========================================================
-- Document intake: allow the app to create clearance jobs.
--
-- Demo-grade. The publishable (anon) key can insert into the job tables so the
-- intake screen works without a service-role secret. For production, drop these
-- policies and route writes through an authenticated role instead.
-- =========================================================

create policy intake_insert_jobs        on jobs                 for insert to anon, authenticated with check (job_type = 'customs_clearance');
create policy intake_insert_pos         on job_purchase_orders  for insert to anon, authenticated with check (true);
create policy intake_insert_docs        on job_documents        for insert to anon, authenticated with check (true);
create policy intake_insert_history     on job_history          for insert to anon, authenticated with check (true);
