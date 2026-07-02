"use client"

import Link from "next/link"
import { usePathname, useSearchParams } from "next/navigation"

const TABS = [
  { href: "/stats/records", label: "Récords" },
  { href: "/stats/players", label: "Jugadores" },
  { href: "/stats/compare", label: "Comparar" },
]

export default function StatsSubnav() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const qs = searchParams.toString()
  const suffix = qs ? `?${qs}` : ""

  return (
    <nav className="flex flex-wrap gap-2 border-b border-white/10 pb-3">
      {TABS.map((tab) => {
        const active = pathname === tab.href || pathname.startsWith(`${tab.href}/`)
        return (
          <Link
            key={tab.href}
            href={`${tab.href}${suffix}`}
            className={`rounded-lg px-4 py-2 font-meta text-sm font-semibold transition-colors ${
              active
                ? "bg-lime text-ink"
                : "bg-ink-2 text-gray hover:bg-white/5 hover:text-chalk"
            }`}
          >
            {tab.label}
          </Link>
        )
      })}
    </nav>
  )
}
