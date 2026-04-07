import Link from "next/link"
import { Trophy, TrendingUp, Percent } from "lucide-react"
import { getManagersOverview } from "@/lib/manager-stats"
import { getLeagueStandings } from "@/lib/fpl-api"

const FORMA_COLORS = {
  W: "bg-emerald-500 text-white",
  D: "bg-amber-400 text-white",
  L: "bg-rose-400 text-white",
}

// Color único por manager (consistente)
const ALIAS_COLORS: Record<string, string> = {
  Comandante: "bg-violet-600",
  Marculi:    "bg-blue-600",
  Varela:     "bg-emerald-600",
  Ignagoat:   "bg-orange-500",
  Manoloto:   "bg-cyan-600",
  Papezar:    "bg-rose-600",
  Bebito:     "bg-pink-500",
  Cunha:      "bg-teal-600",
  Wawri:      "bg-indigo-500",
  "Sir Jagger": "bg-amber-600",
  Canter:     "bg-red-600",
  RG:         "bg-lime-600",
}

function ManagerAvatar({ alias }: { alias: string }) {
  const color = ALIAS_COLORS[alias] ?? "bg-zinc-500"
  const initials = alias.slice(0, 2).toUpperCase()
  return (
    <div className={`flex h-12 w-12 items-center justify-center rounded-full ${color} text-sm font-bold text-white`}>
      {initials}
    </div>
  )
}

export default async function ManagersPage() {
  const [managers, standings] = await Promise.all([
    getManagersOverview(),
    getLeagueStandings(),
  ])

  // Enriquecer con posición y pts actuales desde la API
  const standingsMap = new Map(standings.map((s) => [s.alias, s]))
  const enriched = managers.map((m) => ({
    ...m,
    current_pos: standingsMap.get(m.alias)?.pj
      ? (standings.findIndex((s) => s.alias === m.alias) + 1)
      : null,
    current_pts: standingsMap.get(m.alias)?.pts ?? null,
  })).sort((a, b) => (a.current_pos ?? 99) - (b.current_pos ?? 99))

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Temporada 2025/26
        </p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight">Managers</h1>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {enriched.map((m) => (
          <Link
            key={m.id}
            href={`/managers/${m.alias.toLowerCase()}`}
            className="group rounded-2xl border border-border bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md hover:border-[#3e1a5b]/30"
          >
            {/* Header */}
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <ManagerAvatar alias={m.alias} />
                <div>
                  <p className="font-bold text-foreground">{m.current_team}</p>
                  <p className="text-xs text-muted-foreground">{m.alias}</p>
                </div>
              </div>
              <div className="text-right">
                {m.current_pos && (
                  <span className={`inline-flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
                    m.current_pos <= 4 ? "bg-[#3e1a5b] text-white"
                    : m.current_pos >= 10 ? "bg-rose-100 text-rose-600"
                    : "bg-muted text-muted-foreground"
                  }`}>
                    {m.current_pos}
                  </span>
                )}
              </div>
            </div>

            {/* Stats row */}
            <div className="mt-4 grid grid-cols-3 gap-2">
              <div className="rounded-lg bg-muted/40 px-3 py-2 text-center">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Pts</p>
                <p className="mt-0.5 text-lg font-black text-foreground">
                  {m.current_pts ?? "—"}
                </p>
              </div>
              <div className="rounded-lg bg-muted/40 px-3 py-2 text-center">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">% Vic</p>
                <p className="mt-0.5 text-lg font-black text-foreground">{m.win_pct}%</p>
              </div>
              <div className="rounded-lg bg-muted/40 px-3 py-2 text-center">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Títulos</p>
                <p className="mt-0.5 flex items-center justify-center gap-1 text-lg font-black text-foreground">
                  {m.titulos > 0 && <Trophy className="h-3.5 w-3.5 text-amber-500" />}
                  {m.titulos}
                </p>
              </div>
            </div>

            {/* Forma */}
            {m.forma.length > 0 && (
              <div className="mt-3 flex items-center gap-1.5">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mr-1">
                  Forma
                </span>
                {m.forma.map((r, i) => (
                  <span key={i} className={`flex h-5 w-5 items-center justify-center rounded-full text-[9px] font-bold ${FORMA_COLORS[r]}`}>
                    {r}
                  </span>
                ))}
              </div>
            )}
          </Link>
        ))}
      </div>
    </div>
  )
}
