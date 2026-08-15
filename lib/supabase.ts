/* eslint-disable @typescript-eslint/no-explicit-any */
import { createClient } from '@supabase/supabase-js'
import { localClient } from './local-client'

type Res = { data: any[] | null; error: any }

export interface Builder extends PromiseLike<Res> {
  eq(col: string, val: any): Builder
  order(col: string, opts?: { ascending?: boolean }): Builder
  limit(n: number): Builder
  maybeSingle(): Promise<{ data: any; error: any }>
  single(): Promise<{ data: any; error: any }>
}

export interface Client {
  from(table: string): { select(cols?: string): Builder }
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const source = process.env.NEXT_PUBLIC_DATA_SOURCE ?? 'local'

// Default: the bundled offline dataset, so the demo runs with `npm run dev`
// and nothing else. Set NEXT_PUBLIC_DATA_SOURCE=supabase (with the URL and key
// in .env.local) to point the same screens at the live Postgres instead.
export const supabase: Client =
  source === 'supabase' && url && key
    ? (createClient(url, key, { auth: { persistSession: false } }) as unknown as Client)
    : (localClient as unknown as Client)
