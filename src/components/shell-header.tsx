"use client"

import Link from "next/link"
import Image from "next/image"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { Trophy, CalendarDays, Users, BarChart3, MessageCircle } from "lucide-react"

const NAV_ITEMS = [
  { label: "Standings", href: "/standings", icon: Trophy },
  { label: "Fixtures", href: "/fixtures", icon: CalendarDays },
  { label: "Managers", href: "/managers", icon: Users },
  { label: "Stats", href: "/stats/records", icon: BarChart3 },
  { label: "Foro", href: "/forum", icon: MessageCircle },
]

type Season = { id: string; name: string }

export default function ShellHeader({ seasons }: { seasons: Season[] }) {
  const pathname = usePathname()
  const router = useRouter()
  const searchParams = useSearchParams()
  const currentSeason = searchParams.get("season") ?? seasons[0]?.name ?? ""

  function onSeasonChange(name: string) {
    const params = new URLSearchParams(searchParams.toString())
    params.set("season", name)
    router.push(`${pathname}?${params.toString()}`)
  }

  return (
    <header className="sticky top-0 z-40 bg-[#3e1a5b] shadow-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 md:px-6">

        {/* Logo + nombre */}
        <Link href="/standings" className="flex shrink-0 items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10">
            <Image src="/logo.svg" alt="Ariosto League" width={26} height={26} />
          </div>
          <div className="hidden sm:block">
            <p className="text-sm font-bold leading-none text-white">Ariosto League</p>
            <p className="text-[10px] font-medium uppercase tracking-widest text-white/50">
              Fantasy Draft
            </p>
          </div>
        </Link>

        {/* Nav desktop */}
        <nav className="hidden items-center md:flex">
          {NAV_ITEMS.map((item) => {
            const active =
              item.href === "/stats/records"
                ? pathname.startsWith("/stats")
                : pathname.startsWith(item.href)
            return (
              <Link
                key={item.href}
                href={`${item.href}?season=${encodeURIComponent(currentSeason)}`}
                className={`relative flex items-center gap-1.5 px-4 py-5 text-sm font-medium transition-colors ${
                  active
                    ? "text-white after:absolute after:bottom-0 after:inset-x-4 after:h-0.5 after:rounded-full after:bg-white"
                    : "text-white/60 hover:text-white/90"
                }`}
              >
                <item.icon className="h-4 w-4" strokeWidth={1.75} />
                {item.label}
              </Link>
            )
          })}
        </nav>

        {/* Season selector */}
        <select
          value={currentSeason}
          onChange={(e) => onSeasonChange(e.target.value)}
          className="rounded-lg border border-white/20 bg-white/10 px-3 py-1.5 text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-white/30"
        >
          {seasons.map((s) => (
            <option key={s.id} value={s.name} className="bg-[#3e1a5b] text-white">
              {s.name}
            </option>
          ))}
        </select>
      </div>
    </header>
  )
}
