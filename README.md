# Al Fahad Logistics ERP — working demo

A Next.js + Supabase demo of the ERP discussed with Ameer: **customs clearance →
warehousing → transport → installation**, all hanging off a single job spine
threaded by batch number.

Everything is dummy data modelled on the client's actual operation — Siemens
Healthineers medical equipment, Saudi hospitals, Riyadh / Jeddah / Dammam,
SAR duty amounts, real-looking BL and AWB references.

## Run it

```bash
npm install
npm run dev        # http://localhost:3000
```

That's it. The demo ships with a complete bundled dataset (`lib/seed/`), so
it runs offline with no database, no keys and no setup — useful when you're
presenting from a hotel wifi.

### Running against the live Postgres instead

A Supabase project is already provisioned and seeded with the same data.

```bash
cp .env.example .env.local
sed -i '' 's/DATA_SOURCE=local/DATA_SOURCE=supabase/' .env.local   # or edit by hand
npm run dev
```

Supabase project ref: `kkkkdwficvcbjhcbvlpc` (region eu-central-1).
Schema lives in `supabase/migrations/` — three migrations: core schema,
operations schema, views + row-level security.

Note: free-tier Supabase projects pause after a week of inactivity. That is why
the offline dataset is the default — the demo can never fail in front of a client.

## What's in it

| Screen | What it demonstrates |
|---|---|
| **Command Centre** | Open jobs, in transit, held at port, revenue, duty paid, unbilled work. Duty-advance alert banner at the top. |
| **Customs Clearance** | Job registry from the BL / AWB. Average clearance time, total charges, pure duty split out. |
| **New job from a document** | Drop a Bill of Lading, Air Waybill or Commercial Invoice in — PDF or photo — and the job fields fill themselves. Every field carries a confidence score; anything uncertain is flagged amber for the operator to check before saving. |
| **Job file** | Auto-extracted shipment fields, split-wise duty with a Bayan cross-check, PO/invoice refs, expenses, per-job P&L, documents, the job history timeline, and the **batch chain** linking clearance → warehouse → transport → installation. |
| **Duty Advances** | Per-client float balances with the threshold alert. GE HealthCare is deliberately overdrawn; Siemens is below threshold. This is the miss Ameer described. |
| **Transport** | Route, crew, distance, and the **allowance slab calculation** — overtime under 300 km, trip allowance beyond. Photo and signature proof indicators. |
| **Warehouse** | Batch-tracked stock on hand, occupancy by site, barcode/pallet movement log, storage contracts on three different quotation bases. |
| **Delivery Notes** | Printable DN with line items and a captured signature. |
| **Fleet & Crew** | Truck utilisation (4 trucks idle), hired-vs-own split, driver performance, labour roster hours — the buy-or-hire report. |
| **Client Status Board** | The read-only view for Siemens. Same data as the registry, grouped by stage — replaces the Monday.com sheet. |
| **Analytics** | The numbers screen: net-profit hero, revenue vs cost by month, profit by service line, customs clearance time against target, duty split per client, truck utilisation, and duty-float meters. Date-range and client filters scope every chart at once. |
| **Reports** | Job profitability with unbilled flags, service-line margins, monthly revenue vs cost, receivables, asset utilisation. |
| **Settings** | Allowance slabs, alert thresholds, extraction/GPS/scanning/SAP configuration. |

## Document intake

`/clearance/new` is the screen that replaces manual job entry. Drop a shipping
document in and the fields are read off it; the operator verifies and saves.

Two reading engines, chosen automatically:

| | When it runs | What it handles |
|---|---|---|
| **AI extraction** | `ANTHROPIC_API_KEY` is set | Anything — scans, photos, unfamiliar layouts, non-English forms. Returns a per-field confidence score and is instructed to return null rather than guess. |
| **Label parser** | No key set, PDF has a text layer | Standard freight vocabulary (B/L No, Port of Discharge, Gross Weight, …). Reads the file for real; can't read scans or images. |

Set the key on Vercel to enable the AI path:

| Name | Value |
|---|---|
| `ANTHROPIC_API_KEY` | your key from console.anthropic.com |
| `ANTHROPIC_MODEL` | optional, defaults to `claude-sonnet-5` |

Four synthetic documents ship in `public/samples/` so the flow can be demoed
without touching client paperwork — a sea BL, an air waybill, a commercial
invoice, and a photographed BL with no text layer (that last one deliberately
fails on the label parser and needs the AI path, which is a useful thing to show).

**Saving.** A verified job is written to Postgres — job row, PO lines, the source
document, and the first job-history entry — but only when
`NEXT_PUBLIC_DATA_SOURCE=supabase`. On the bundled dataset the screen confirms
the verification without writing, so a new job can never appear to save and then
vanish. Insert policies live in `supabase/migrations/0004_intake_write_policies.sql`
and are demo-grade: they let the publishable key insert clearance jobs. Replace
them with authenticated-role policies before this goes anywhere near production.

## Charts

Built with Recharts against a fixed set of tokens in `lib/viz.ts`. Three rules
hold across every chart, and they are the difference between a dashboard that
looks busy and one that can be read:

- **One axis, always.** Revenue and cost share a single SAR scale. A second
  y-axis invents a correlation that isn't in the data.
- **The colour order is fixed and validated, not chosen by eye.** The six
  categorical hues were run through a colourblind-separation check against the
  white card surface: adjacent-pair ΔE 13.0 under protanopia and 19.6 under
  normal vision, both clear of the floors. Slots are assigned in order and never
  cycled or reassigned by rank, so a series keeps its colour when a filter
  changes what's on screen.
- **Every chart has a table view.** Two of the six hues sit below 3:1 contrast on
  white, so the values must be reachable without relying on the fill — press
  *Table* on any card. It doubles as the accessible twin and as the thing to
  screenshot into an email.

Form follows the job rather than variety: ordered stages (the job pipeline) use a
single-hue ordinal ramp, magnitude comparisons use one colour for every bar,
"which trucks are idle" uses emphasis rather than a second hue, and the duty-float
balances are meters with status colours that always ship with an icon and a word,
never colour alone.

Tooltips enhance and never gate — hovering a bar shows every series at that
point, with the value leading and the series name secondary.

## Deliberate demo moments

- **AFL/CC/26/0470** is held at Jeddah on an SFDA HS-code query, with demurrage
  accruing and the whole story in the job history.
- **GE HealthCare** duty float is overdrawn, and job **AFL/CC/26/0466** shows the
  payment blocked as a result.
- **AFL/TR/26/0389** is the 1,320 km Dammam → Abha run: two drivers rotated, four
  outsourced labourers, cross-country allowance slab applied automatically.
- **AFL/CC/26/0412** is a complete MRI lifecycle — clearance, warehouse,
  transport, installation — all on batch `BN-SIE-2026-0431`.

## Not in this demo

The driver mobile app (photo capture, e-signature, GPS) is represented here by
its outputs only — photo counts, the signature on the delivery note, and the
distance figures. That is the remaining Phase 1 build item.

## Stack

Next.js 15 (App Router, server components) · TypeScript · Tailwind v4 ·
Supabase (Postgres + RLS) · Recharts · lucide-react. Pages fetch on the server
and hand plain data to small client components for the interactive charts.

## Deploying to Vercel

The Next.js app is at the repository root, so Vercel needs no configuration —
framework, build command and output directory are all detected automatically.

**Option A — GitHub (recommended, gives you preview URLs on every push)**

```bash
git init && git add -A && git commit -m "Al Fahad Logistics ERP demo"
gh repo create alfahad-erp --private --source=. --push     # or push to a repo you made in the UI
```

Then at vercel.com → **Add New → Project** → import the repo → **Deploy**.
Leave every setting at its default. First build takes about two minutes.

**Option B — straight from your machine, no GitHub**

```bash
npm i -g vercel
vercel login
vercel          # preview deployment
vercel --prod   # production URL
```

**Environment variables:** none are required. The demo runs on its bundled
dataset by default. To point the deployment at the live Supabase instead, add
these three under Project → Settings → Environment Variables and redeploy:

| Name | Value |
|---|---|
| `NEXT_PUBLIC_DATA_SOURCE` | `supabase` |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://kkkkdwficvcbjhcbvlpc.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `sb_publishable_Ig7G6G0a5eq1BfCG2qSsdA_EiXuLgNH` |

Every page is server-rendered on demand (`force-dynamic`), so it runs on
Vercel's Node runtime with no caching surprises during a live demo.
