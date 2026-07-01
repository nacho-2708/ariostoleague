"use client"

import Link from "next/link"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { Home, Trophy, CalendarDays, Users, BarChart3, MessageCircle } from "lucide-react"
import LeagueLogo from "@/components/broadcast/league-logo"

const NAV_ITEMS = [
  { label: "Inicio", href: "/", icon: Home },
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
  // El Home (/) es cross-temporada: el selector confunde, así que se oculta
  // pero se reserva su espacio (invisible + inerte) para que el nav quede en la
  // misma posición horizontal que en el resto de las secciones.
  const onHome = pathname === "/"

  function onSeasonChange(name: string) {
    const params = new URLSearchParams(searchParams.toString())
    params.set("season", name)
    router.push(`${pathname}?${params.toString()}`)
  }

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-ink/[0.86] backdrop-blur-md backdrop-saturate-150">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 md:px-6">

        {/* Logo */}
        <Link href="/" className="flex shrink-0 items-center text-chalk">
          <LeagueLogo height={28} className="text-[18px]" />
        </Link>

        {/* Nav desktop */}
        <nav className="hidden items-center gap-1 md:flex">
          {NAV_ITEMS.map((item) => {
            const active =
              item.href === "/"
                ? pathname === "/"
                : item.href === "/stats/records"
                  ? pathname.startsWith("/stats")
                  : pathname.startsWith(item.href)
            const href =
              item.href === "/" ? "/" : `${item.href}?season=${encodeURIComponent(currentSeason)}`
            return (
              <Link
                key={item.href}
                href={href}
                className={`flex items-center gap-1.5 rounded-[5px] px-3 py-2 font-meta text-xs font-semibold uppercase tracking-[0.06em] transition-colors ${
                  active
                    ? "bg-lime text-ink"
                    : "text-gray hover:bg-ink-2 hover:text-chalk"
                }`}
              >
                <item.icon className="h-3.5 w-3.5" strokeWidth={2} />
                {item.label}
              </Link>
            )
          })}
        </nav>

        {/* Season selector — oculto (pero reservando su ancho) en el Home */}
        <select
          value={currentSeason}
          onChange={(e) => onSeasonChange(e.target.value)}
          disabled={onHome}
          aria-hidden={onHome}
          tabIndex={onHome ? -1 : undefined}
          className={`rounded-[5px] border border-white/10 bg-ink-2 px-3 py-1.5 font-meta text-xs font-semibold uppercase tracking-[0.06em] text-chalk focus:outline-none focus:ring-2 focus:ring-lime/40 ${
            onHome ? "invisible" : ""
          }`}
        >
          {seasons.map((s) => (
            <option key={s.id} value={s.name} className="bg-ink-2 text-chalk">
              {s.name}
            </option>
          ))}
        </select>
      </div>
    </header>
  )
}
