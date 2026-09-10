'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, FileCheck2, Truck, Warehouse, Wrench, Wallet,
  ClipboardSignature, MonitorDot, BarChart3, Settings, Users, Ship, LineChart,
} from 'lucide-react'

const NAV = [
  { section: 'Operations', items: [
    { href: '/', label: 'Command Centre', icon: LayoutDashboard },
    { href: '/clearance', label: 'Customs Clearance', icon: FileCheck2 },
    { href: '/transport', label: 'Transport', icon: Truck },
    { href: '/warehouse', label: 'Warehouse', icon: Warehouse },
    { href: '/installation', label: 'Installation', icon: Wrench },
    { href: '/delivery-notes', label: 'Delivery Notes', icon: ClipboardSignature },
  ]},
  { section: 'Finance', items: [
    { href: '/analytics', label: 'Analytics', icon: LineChart },
    { href: '/duty', label: 'Duty Advances', icon: Wallet },
    { href: '/reports', label: 'Reports', icon: BarChart3 },
  ]},
  { section: 'Resources', items: [
    { href: '/fleet', label: 'Fleet & Crew', icon: Users },
    { href: '/status-board', label: 'Client Status Board', icon: MonitorDot },
    { href: '/settings', label: 'Settings', icon: Settings },
  ]},
]

export default function Nav() {
  const path = usePathname()
  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col bg-[#0b1b2b] text-slate-300 lg:flex">
      <div className="flex items-center gap-2.5 px-5 py-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-teal-500/15 ring-1 ring-teal-400/30">
          <Ship className="h-[18px] w-[18px] text-teal-300" />
        </div>
        <div className="leading-tight">
          <div className="text-[13px] font-semibold text-white">Logistica</div>
          <div className="text-[10px] uppercase tracking-widest text-teal-300/80">ERP Suite</div>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 pb-6">
        {NAV.map((group) => (
          <div key={group.section} className="mb-5">
            <div className="px-2 pb-1.5 text-[10px] font-semibold uppercase tracking-widest text-slate-500">
              {group.section}
            </div>
            {group.items.map(({ href, label, icon: Icon }) => {
              const active = href === '/' ? path === '/' : path.startsWith(href)
              return (
                <Link
                  key={href}
                  href={href}
                  className={`mb-0.5 flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] transition ${
                    active
                      ? 'bg-teal-500/15 font-medium text-white ring-1 ring-inset ring-teal-400/25'
                      : 'text-slate-400 hover:bg-white/5 hover:text-slate-100'
                  }`}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {label}
                </Link>
              )
            })}
          </div>
        ))}
      </nav>

      <div className="border-t border-white/5 px-5 py-3.5 text-[11px] leading-relaxed text-slate-500">
        Demo environment
        <br />
        <span className="text-slate-400">Dummy data · Aug 2026</span>
      </div>
    </aside>
  )
}
