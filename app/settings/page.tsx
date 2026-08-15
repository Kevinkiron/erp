import { supabase } from '@/lib/supabase'
import { Card, CardHead, PageHead, Table, Row, Cell, Tag, Field } from '@/components/ui'
import { sar, num, titleCase } from '@/lib/format'
import { Bell, MapPinned, ScanBarcode, Sparkles, Link2 } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function Settings() {
  const [{ data: settings }, { data: slabs }, { data: clients }, { data: warehouses }] = await Promise.all([
    supabase.from('app_settings').select('*').order('key'),
    supabase.from('allowance_slabs').select('*').order('min_km'),
    supabase.from('clients').select('*').order('code'),
    supabase.from('warehouses').select('*').order('code'),
  ])

  const get = (k: string) => (settings ?? []).find((s) => s.key === k)?.value ?? '—'

  return (
    <>
      <PageHead title="Settings" sub="The rules the system enforces, kept where the business can change them." />

      <div className="grid gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHead title="Allowance slabs" sub="Editable — payroll follows whatever is set here" />
          <Table head={['Slab', 'From', 'To', 'Basis', 'Driver rate', 'Labour rate', 'Active']}>
            {(slabs ?? []).map((s) => (
              <Row key={s.id}>
                <Cell className="font-medium text-slate-800">{s.label}</Cell>
                <Cell className="tabular">{num(s.min_km)} km</Cell>
                <Cell className="tabular">{s.max_km ? `${num(s.max_km)} km` : 'no limit'}</Cell>
                <Cell><Tag tone={s.basis === 'overtime' ? 'slate' : 'brand'}>{titleCase(s.basis)}</Tag></Cell>
                <Cell className="tabular">{sar(s.driver_rate)}</Cell>
                <Cell className="tabular">{sar(s.labour_rate)}</Cell>
                <Cell>{s.active ? <Tag tone="brand">yes</Tag> : <Tag tone="rose">no</Tag>}</Cell>
              </Row>
            ))}
          </Table>
        </Card>

        <Card>
          <CardHead title="Alerts & automation" />
          <div className="space-y-5 p-5">
            <div className="flex items-start gap-3">
              <Bell className="mt-0.5 h-4 w-4 shrink-0 text-teal-600" />
              <div>
                <div className="text-sm font-medium text-slate-800">Duty advance threshold</div>
                <div className="tabular text-sm text-slate-600">{sar(get('duty_advance_alert_sar'))}</div>
                <p className="mt-0.5 text-xs text-slate-500">
                  Ops and accounts are notified when a client float drops below this, so a top-up is requested before payments stall.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-teal-600" />
              <div>
                <div className="text-sm font-medium text-slate-800">Document extraction</div>
                <div className="text-sm text-slate-600">{get('doc_extraction')}</div>
                <p className="mt-0.5 text-xs text-slate-500">
                  Drop a BL, AWB or commercial invoice on a job and the fields fill in. Staff verify, then save.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <MapPinned className="mt-0.5 h-4 w-4 shrink-0 text-teal-600" />
              <div>
                <div className="text-sm font-medium text-slate-800">Distance source</div>
                <div className="text-sm text-slate-600">{get('gps_provider')}</div>
                <p className="mt-0.5 text-xs text-slate-500">
                  Independent of the truck GPS subscription, so allowance calculations keep working.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <ScanBarcode className="mt-0.5 h-4 w-4 shrink-0 text-teal-600" />
              <div>
                <div className="text-sm font-medium text-slate-800">Warehouse scanning</div>
                <div className="text-sm text-slate-600">Barcode (phase 1) · RFID under evaluation</div>
                <p className="mt-0.5 text-xs text-slate-500">
                  Labels applied at the port so the warehouse receives without re-keying.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Link2 className="mt-0.5 h-4 w-4 shrink-0 text-teal-600" />
              <div>
                <div className="text-sm font-medium text-slate-800">SAP interface</div>
                <div className="text-sm text-slate-600">Export ready · live sync pending client approval</div>
                <p className="mt-0.5 text-xs text-slate-500">
                  Batch-level stock positions can be pushed to the client&apos;s SAP once the interface is agreed.
                </p>
              </div>
            </div>
          </div>
        </Card>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHead title="Clients" />
          <Table head={['Code', 'Name', 'Segment', 'Contact', 'Phone', 'Key account']}>
            {(clients ?? []).map((c) => (
              <Row key={c.id}>
                <Cell className="tabular font-medium text-slate-800">{c.code}</Cell>
                <Cell className="max-w-[240px] truncate">{c.name}</Cell>
                <Cell className="text-slate-500">{c.segment}</Cell>
                <Cell className="text-slate-500">{c.contact_name}</Cell>
                <Cell className="tabular text-xs text-slate-500">{c.contact_phone}</Cell>
                <Cell>{c.is_key_account ? <Tag tone="brand">yes</Tag> : <span className="text-slate-300">—</span>}</Cell>
              </Row>
            ))}
          </Table>
        </Card>

        <Card>
          <CardHead title="Company" />
          <dl className="grid grid-cols-1 gap-4 p-5">
            <Field label="Legal entity" value={get('company_name')} />
            <Field label="Reporting currency" value={get('base_currency')} />
            <Field label="VAT rate" value={`${get('vat_rate')}%`} />
            <Field label="Warehouses" value={`${(warehouses ?? []).length} sites`} />
          </dl>
        </Card>
      </div>
    </>
  )
}
