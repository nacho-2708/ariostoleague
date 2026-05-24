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
    <nav className="flex flex-wrap gap-2 border-b border-border pb-3">
      {TABS.map((tab) => {
        const active = pathname === tab.href || pathname.startsWith(`${tab.href}/`)
        return (
          <Link
            key={tab.href}
            href={`${tab.href}${suffix}`}
            className={`rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
              active
                ? "bg-[#3e1a5b] text-white"
                : "bg-white text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            {tab.label}
          </Link>
        )
      })}
    </nav>
  )
}
