import type { Metadata } from 'next'
import './globals.css'
import Nav from '@/components/nav'

export const metadata: Metadata = {
  title: 'Logistica ERP',
  description: 'Customs clearance, warehousing, transport and installation — one job spine.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">
        <Nav />
        <div className="lg:pl-60">
          <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/85 backdrop-blur">
            <div className="flex h-14 items-center justify-between px-6">
              <div className="text-sm text-slate-500">
                Riyadh · Jeddah · Dammam
                <span className="mx-2 text-slate-300">|</span>
                <span className="text-slate-700">Saturday, 15 August 2026</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="hidden text-xs text-slate-500 sm:inline">Ameer · Managing Director</span>
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-teal-600 text-xs font-semibold text-white">
                  A
                </div>
              </div>
            </div>
          </header>
          <main className="px-6 py-7">{children}</main>
        </div>
      </body>
    </html>
  )
}
