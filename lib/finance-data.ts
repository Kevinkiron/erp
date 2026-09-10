import { clients } from './seed/masters'
import {
  buildSalesDocs, buildPostings, trialBalance, vatReturn,
  receivablesAgeing, bankReconciliation, computeBill, computeClaim,
} from './finance'
import { bills, claims } from './seed/finance'

const nameOf = (code: string) => clients.find((c) => c.id === code)?.name ?? code

export const docs = buildSalesDocs(nameOf)
export const postings = buildPostings(docs)
export const tb = trialBalance(postings)
export const vat = vatReturn(docs)
export const ageing = receivablesAgeing(docs)
export const banks = bankReconciliation()
export const billsC = bills.map(computeBill)
export const claimsC = claims.map(computeClaim)

export const balanceOf = (code: string) => tb.find((a) => a.code === code)?.balance ?? 0
