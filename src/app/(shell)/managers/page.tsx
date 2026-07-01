import Link from "next/link"
import { Trophy } from "lucide-react"
import { getManagersOverview } from "@/lib/manager-stats"
import { getLeagueStandings } from "@/lib/fpl-api"
import ManagerPhoto from "@/components/broadcast/manager-photo"

const FORMA_COLORS = {
  W: "bg-emerald-500 text-white",
  D: "bg-amber-400 text-white",
  L: "bg-rose-400 text-white",
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
        <p className="text-xs font-semibold uppercase tracking-widest text-gray">
          Temporada 2025/26
        </p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight text-chalk">Managers</h1>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {enriched.map((m) => (
          <Link
            key={m.id}
            href={`/managers/${m.alias.toLowerCase()}`}
            className="group rounded-2xl border border-white/10 bg-ink-2 p-5 transition-all hover:-translate-y-0.5 hover:border-white/25"
          >
            {/* Header */}
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <ManagerPhoto alias={m.alias} size={48} />
                <div>
                  <p className="font-bold text-chalk">{m.current_team}</p>
                  <p className="font-meta text-xs text-gray">{m.alias}</p>
                </div>
              </div>
              <div className="text-right">
                {m.current_pos && (
                  <span className={`inline-flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
                    m.current_pos <= 4 ? "bg-blue text-white"
                    : m.current_pos >= 10 ? "bg-rose-500/20 text-rose-300"
                    : "bg-white/10 text-gray"
                  }`}>
                    {m.current_pos}
                  </span>
                )}
              </div>
            </div>

            {/* Stats row */}
            <div className="mt-4 grid grid-cols-3 gap-2">
              <div className="rounded-lg bg-white/5 px-3 py-2 text-center">
                <p className="font-meta text-[10px] font-semibold uppercase tracking-wider text-gray">Pts</p>
                <p className="mt-0.5 text-lg font-black text-chalk">
                  {m.current_pts ?? "—"}
                </p>
              </div>
              <div className="rounded-lg bg-white/5 px-3 py-2 text-center">
                <p className="font-meta text-[10px] font-semibold uppercase tracking-wider text-gray">% Vic</p>
                <p className="mt-0.5 text-lg font-black text-chalk">{m.win_pct}%</p>
              </div>
              <div className="rounded-lg bg-white/5 px-3 py-2 text-center">
                <p className="font-meta text-[10px] font-semibold uppercase tracking-wider text-gray">Títulos</p>
                <p className="mt-0.5 flex items-center justify-center gap-1 text-lg font-black text-chalk">
                  {m.titulos > 0 && <Trophy className="h-3.5 w-3.5 text-lime" />}
                  {m.titulos}
                </p>
              </div>
            </div>

            {/* Forma */}
            {m.forma.length > 0 && (
              <div className="mt-3 flex items-center gap-1.5">
                <span className="mr-1 font-meta text-[10px] font-semibold uppercase tracking-wider text-gray">
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
