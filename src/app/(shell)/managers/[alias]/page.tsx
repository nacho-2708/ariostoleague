import { notFound } from "next/navigation"
import Link from "next/link"
import { ChevronLeft, Trophy, Swords, BarChart2 } from "lucide-react"
import { getManagerProfile } from "@/lib/manager-stats"
import { FormaTooltip } from "@/components/forma-tooltip"
import { ManagerCharts } from "@/components/manager-charts"

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

function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="rounded-xl border border-border bg-white p-4 shadow-sm">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-black text-foreground">{value}</p>
      {sub && <p className="mt-0.5 text-xs text-muted-foreground">{sub}</p>}
    </div>
  )
}

// Capitalizar alias desde el URL param
function normalizeAlias(raw: string): string {
  return raw.charAt(0).toUpperCase() + raw.slice(1)
}

export default async function ManagerProfilePage({
  params,
}: {
  params: Promise<{ alias: string }>
}) {
  const { alias: rawAlias } = await params
  const alias = normalizeAlias(decodeURIComponent(rawAlias))

  const profile = await getManagerProfile(alias)

  if (!profile) notFound()

  const currentPos = profile.current_pos

  const color = ALIAS_COLORS[profile.alias] ?? "bg-zinc-500"
  const initials = profile.alias.slice(0, 2).toUpperCase()

  return (
    <div className="space-y-6">

      {/* Breadcrumb */}
      <div>
        <Link
          href="/managers"
          className="flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
          Managers
        </Link>
      </div>

      {/* Hero card */}
      <div className="overflow-hidden rounded-2xl border border-border bg-white shadow-sm">
        <div className="h-2 w-full bg-[#3e1a5b]" />
        <div className="flex items-start gap-5 p-6">
          <div className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl ${color} text-xl font-black text-white`}>
            {initials}
          </div>
          <div className="flex-1">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-2xl font-black tracking-tight text-foreground">
                  {profile.current_team}
                </h1>
                <p className="text-sm text-muted-foreground">
                  {profile.full_name} · {profile.alias}
                </p>
              </div>
              {profile.titulos > 0 && (
                <div className="flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1.5 border border-amber-200">
                  <Trophy className="h-4 w-4 text-amber-500" />
                  <span className="text-sm font-bold text-amber-700">
                    {profile.titulos} {profile.titulos === 1 ? "título" : "títulos"}
                  </span>
                </div>
              )}
            </div>

            {/* Forma con tooltip */}
            <FormaTooltip formaDetalle={profile.formaDetalle} />
          </div>
        </div>
      </div>

      {/* Stats all-time */}
      <div>
        <h2 className="mb-3 text-xs font-bold uppercase tracking-widest text-gray">
          Estadísticas all-time
        </h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard label="Partidos" value={profile.pj} />
          <StatCard label="Victorias" value={profile.pg} sub={`${profile.win_pct}% tasa de victoria`} />
          <StatCard label="Prom. PF" value={profile.avg_pf} sub="puntos por partido" />
          <StatCard
            label="Mejor temporada"
            value={profile.best_season_pts}
            sub={`pts en ${profile.best_season_name}`}
          />
        </div>
      </div>

      {/* Temporada actual */}
      {profile.current_pts !== null && (
        <div>
          <h2 className="mb-3 text-xs font-bold uppercase tracking-widest text-gray">
            Temporada actual — 2025/26
          </h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
            <div className="rounded-xl border border-[#3e1a5b]/20 bg-white p-4 text-center shadow-sm">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-[#3e1a5b]/70">Posición</p>
              <p className="mt-1 text-2xl font-black text-[#3e1a5b]">{currentPos}°</p>
            </div>
            <StatCard label="Puntos" value={profile.current_pts} />
            <StatCard label="PJ" value={profile.seasons.find(s => s.name === '2025/26')?.pj ?? '—'} />
            <StatCard label="PF" value={profile.seasons.find(s => s.name === '2025/26')?.pf ?? '—'} />
            <StatCard label="DP" value={(() => { const dp = profile.seasons.find(s => s.name === '2025/26')?.pf ?? 0; const pc = profile.seasons.find(s => s.name === '2025/26')?.pc ?? 0; const d = dp - pc; return d > 0 ? `+${d}` : d })()}  />
          </div>
        </div>
      )}

      {/* Historial por temporada */}
      {profile.seasons.length > 0 && (
        <div>
          <h2 className="mb-3 text-xs font-bold uppercase tracking-widest text-gray">
            Historial por temporada
          </h2>
          <div className="overflow-hidden rounded-2xl border border-border bg-white shadow-sm">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Temporada</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Equipo</th>
                  <th className="px-3 py-3 text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground">Pos</th>
                  <th className="px-3 py-3 text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground">PJ</th>
                  <th className="px-3 py-3 text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground">PG</th>
                  <th className="px-3 py-3 text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground">PE</th>
                  <th className="px-3 py-3 text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground">PP</th>
                  <th className="px-3 py-3 text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground">PF</th>
                  <th className="px-3 py-3 text-center text-xs font-semibold uppercase tracking-wider text-[#3e1a5b]">Pts</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {[...profile.seasons].reverse().map((s) => (
                  <tr key={s.name} className={`hover:bg-muted/30 transition-colors ${s.champion ? "bg-amber-50/60" : ""}`}>
                    <td className="px-4 py-3 font-semibold text-foreground">
                      <div className="flex items-center gap-2">
                        {s.name}
                        {s.champion && <Trophy className="h-3.5 w-3.5 text-amber-500" />}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{s.team_name}</td>
                    <td className="px-3 py-3 text-center font-mono font-bold text-foreground">{s.pos}°</td>
                    <td className="px-3 py-3 text-center font-mono text-muted-foreground">{s.pj}</td>
                    <td className="px-3 py-3 text-center font-mono text-foreground">{s.pg}</td>
                    <td className="px-3 py-3 text-center font-mono text-muted-foreground">{s.pe}</td>
                    <td className="px-3 py-3 text-center font-mono text-muted-foreground">{s.pp}</td>
                    <td className="px-3 py-3 text-center font-mono text-muted-foreground">{s.pf}</td>
                    <td className="px-3 py-3 text-center">
                      <span className="inline-flex h-7 min-w-[2rem] items-center justify-center rounded-lg bg-[#3e1a5b] px-2 font-bold text-white text-xs">
                        {s.pts}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Analytics charts */}
      {profile.gwData.length > 0 && (
        <div>
          <h2 className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-gray">
            <BarChart2 className="h-3.5 w-3.5" />
            Análisis temporada 2025/26
          </h2>
          <ManagerCharts
            alias={profile.alias}
            gwData={profile.gwData}
            allManagersGW={profile.allManagersGW}
          />
        </div>
      )}

      {/* H2H */}
      {profile.h2h.length > 0 && (
        <div>
          <h2 className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-gray">
            <Swords className="h-3.5 w-3.5" />
            Head to head
          </h2>
          <div className="overflow-hidden rounded-2xl border border-border bg-white shadow-sm">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Rival</th>
                  <th className="px-3 py-3 text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground">PG</th>
                  <th className="px-3 py-3 text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground">PE</th>
                  <th className="px-3 py-3 text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground">PP</th>
                  <th className="px-3 py-3 text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground">DP</th>
                  <th className="px-3 py-3 text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground">Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {profile.h2h.map((h) => {
                  const total = h.pg + h.pe + h.pp
                  const winPct = total > 0 ? Math.round((h.pg / total) * 100) : 0
                  const dp = h.pf - h.pc
                  const isPositive = h.pg > h.pp
                  const isNegative = h.pg < h.pp
                  return (
                    <tr key={h.rival_alias} className="hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3">
                        <Link href={`/managers/${h.rival_alias.toLowerCase()}`} className="hover:text-[#3e1a5b]">
                          <p className="font-semibold text-foreground">{h.rival_team}</p>
                          <p className="text-xs text-muted-foreground">{h.rival_alias}</p>
                        </Link>
                      </td>
                      <td className="px-3 py-3 text-center font-mono font-bold text-emerald-600">{h.pg}</td>
                      <td className="px-3 py-3 text-center font-mono text-muted-foreground">{h.pe}</td>
                      <td className="px-3 py-3 text-center font-mono text-rose-500">{h.pp}</td>
                      <td className={`px-3 py-3 text-center font-mono font-semibold ${dp > 0 ? "text-emerald-600" : dp < 0 ? "text-rose-500" : "text-muted-foreground"}`}>
                        {dp > 0 ? `+${dp}` : dp}
                      </td>
                      <td className="px-3 py-3 text-center">
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                          isPositive ? "bg-emerald-50 text-emerald-700"
                          : isNegative ? "bg-rose-50 text-rose-600"
                          : "bg-muted text-muted-foreground"
                        }`}>
                          {winPct}%
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
