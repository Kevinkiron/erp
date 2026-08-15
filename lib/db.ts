import { supabase } from './supabase'

export type Job = {
  id: string
  job_no: string
  job_type: string
  status: string
  batch_no: string | null
  trade: string | null
  mode: string | null
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
  ata: string | null
  cleared_on: string | null
  opened_on: string | null
  closed_on: string | null
  project_manager: string | null
  sales_manager: string | null
  revenue_sar: number
  remarks: string | null
  clients?: { code: string; name: string } | null
}

export type JobPnl = {
  id: string
  job_no: string
  job_type: string
  status: string
  batch_no: string | null
  client_name: string | null
  opened_on: string | null
  revenue_sar: number
  expense_sar: number
  duty_paid_sar: number
  invoiced_sar: number
  net_pnl_sar: number
  unbilled: boolean
}

export type DutyBalance = {
  client_id: string
  client_name: string
  advance_received: number
  advance_utilised: number
  advance_refunded: number
  balance_sar: number
}

export const DUTY_ALERT_THRESHOLD = 300000

export async function getSettings() {
  const { data } = await supabase.from('app_settings').select('*').order('key')
  return data ?? []
}

export async function getJobs(jobType?: string) {
  let q = supabase
    .from('jobs')
    .select('*, clients(code,name)')
    .order('opened_on', { ascending: false })
  if (jobType) q = q.eq('job_type', jobType)
  const { data } = await q
  return (data ?? []) as Job[]
}

export async function getJobByNo(jobNo: string) {
  const { data } = await supabase
    .from('jobs')
    .select('*, clients(code,name)')
    .eq('job_no', jobNo)
    .maybeSingle()
  return data as Job | null
}

export async function getPnl() {
  const { data } = await supabase.from('v_job_pnl').select('*').order('opened_on', { ascending: false })
  return (data ?? []) as JobPnl[]
}

export async function getDutyBalances() {
  const { data } = await supabase.from('v_duty_balance').select('*').order('balance_sar')
  return (data ?? []) as DutyBalance[]
}
