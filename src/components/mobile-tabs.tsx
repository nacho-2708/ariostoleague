"use client"

import Link from "next/link"
import { usePathname, useSearchParams } from "next/navigation"
import { Home, Trophy, CalendarDays, Users, BarChart3, MessageCircle } from "lucide-react"

const TABS = [
  { label: "Inicio", href: "/", icon: Home },
  { label: "Tabla", href: "/standings", icon: Trophy },
  { label: "Fixtures", href: "/fixtures", icon: CalendarDays },
  { label: "Managers", href: "/managers", icon: Users },
  { label: "Stats", href: "/stats/records", icon: BarChart3 },
  { label: "Foro", href: "/forum", icon: MessageCircle },
]

export default function MobileTabs() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const season = searchParams.get("season")
  const qs = season ? `?season=${encodeURIComponent(season)}` : ""

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-white shadow-[0_-1px_12px_rgba(0,0,0,0.06)] md:hidden">
      <div className="flex h-16 items-center justify-around">
        {TABS.map((tab) => {
          const active =
            tab.href === "/"
              ? pathname === "/"
              : tab.href === "/stats/records"
                ? pathname.startsWith("/stats")
                : pathname.startsWith(tab.href)
          const Icon = tab.icon
          const href = tab.href === "/" ? "/" : `${tab.href}${qs}`
          return (
            <Link
              key={tab.href}
              href={href}
              className="flex flex-col items-center gap-1 px-2"
            >
              <div className={`flex h-8 w-8 items-center justify-center rounded-lg transition-colors ${
                active ? "bg-[#3e1a5b]" : "bg-transparent"
              }`}>
                <Icon
                  className={`h-4 w-4 transition-colors ${active ? "text-white" : "text-muted-foreground"}`}
                  strokeWidth={active ? 2.5 : 1.75}
                />
              </div>
              <span className={`text-[10px] font-medium transition-colors ${
                active ? "text-[#3e1a5b]" : "text-muted-foreground"
              }`}>
                {tab.label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
