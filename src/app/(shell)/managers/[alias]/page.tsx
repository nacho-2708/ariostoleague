import { notFound } from "next/navigation"
import Link from "next/link"
import { ChevronLeft, Trophy, Swords, BarChart2 } from "lucide-react"
import { getManagerProfile } from "@/lib/manager-stats"
import { FormaTooltip } from "@/components/forma-tooltip"
import { ManagerCharts } from "@/components/manager-charts"
import ManagerPhoto from "@/components/broadcast/manager-photo"

function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-ink-2 p-4">
      <p className="font-meta text-[10px] font-semibold uppercase tracking-wider text-gray">{label}</p>
      <p className="mt-1 text-2xl font-black text-chalk">{value}</p>
      {sub && <p className="mt-0.5 font-meta text-xs text-gray">{sub}</p>}
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

  return (
    <div className="space-y-6">

      {/* Breadcrumb */}
      <div>
        <Link
          href="/managers"
          className="flex items-center gap-1 font-meta text-xs font-medium text-gray transition-colors hover:text-chalk"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
          Managers
        </Link>
      </div>

      {/* Hero card */}
      <div className="overflow-hidden rounded-2xl border border-white/10 bg-ink-2">
        <div className="h-2 w-full" style={{ background: "linear-gradient(90deg,var(--color-blue),var(--color-blue-deep))" }} />
        <div className="flex items-start gap-5 p-6">
          <ManagerPhoto alias={profile.alias} size={64} />
          <div className="flex-1">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-2xl font-black tracking-tight text-chalk">
                  {profile.current_team}
                </h1>
                <p className="font-meta text-sm text-gray">
                  {profile.full_name} · {profile.alias}
                </p>
              </div>
              {profile.titulos > 0 && (
                <div className="flex items-center gap-1.5 rounded-full border border-amber-400/40 bg-amber-400/10 px-3 py-1.5">
                  <Trophy className="h-4 w-4 text-lime" />
                  <span className="text-sm font-bold text-amber-300">
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
        <h2 className="mb-3 font-meta text-xs font-bold uppercase tracking-widest text-gray">
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
          <h2 className="mb-3 font-meta text-xs font-bold uppercase tracking-widest text-gray">
            Temporada actual — 2025/26
          </h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
            <div className="rounded-xl border border-blue/30 bg-ink-2 p-4 text-center">
              <p className="font-meta text-[10px] font-semibold uppercase tracking-wider text-gray">Posición</p>
              <p className="mt-1 font-display text-2xl text-lime">{currentPos}°</p>
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
          <h2 className="mb-3 font-meta text-xs font-bold uppercase tracking-widest text-gray">
            Historial por temporada
          </h2>
          <div className="overflow-hidden rounded-2xl border border-white/10 bg-ink-2">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10 bg-white/5">
                  <th className="px-4 py-3 text-left font-meta text-xs font-semibold uppercase tracking-wider text-gray">Temporada</th>
                  <th className="px-4 py-3 text-left font-meta text-xs font-semibold uppercase tracking-wider text-gray">Equipo</th>
                  <th className="px-3 py-3 text-center font-meta text-xs font-semibold uppercase tracking-wider text-gray">Pos</th>
                  <th className="px-3 py-3 text-center font-meta text-xs font-semibold uppercase tracking-wider text-gray">PJ</th>
                  <th className="px-3 py-3 text-center font-meta text-xs font-semibold uppercase tracking-wider text-gray">PG</th>
                  <th className="px-3 py-3 text-center font-meta text-xs font-semibold uppercase tracking-wider text-gray">PE</th>
                  <th className="px-3 py-3 text-center font-meta text-xs font-semibold uppercase tracking-wider text-gray">PP</th>
                  <th className="px-3 py-3 text-center font-meta text-xs font-semibold uppercase tracking-wider text-gray">PF</th>
                  <th className="px-3 py-3 text-center font-meta text-xs font-semibold uppercase tracking-wider text-lime">Pts</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {[...profile.seasons].reverse().map((s) => (
                  <tr key={s.name} className={`transition-colors hover:bg-white/5 ${s.champion ? "bg-amber-400/10" : ""}`}>
                    <td className="px-4 py-3 font-semibold text-chalk">
                      <div className="flex items-center gap-2">
                        {s.name}
                        {s.champion && <Trophy className="h-3.5 w-3.5 text-lime" />}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray">{s.team_name}</td>
                    <td className="px-3 py-3 text-center font-mono font-bold text-chalk">{s.pos}°</td>
                    <td className="px-3 py-3 text-center font-mono text-gray">{s.pj}</td>
                    <td className="px-3 py-3 text-center font-mono text-chalk">{s.pg}</td>
                    <td className="px-3 py-3 text-center font-mono text-gray">{s.pe}</td>
                    <td className="px-3 py-3 text-center font-mono text-gray">{s.pp}</td>
                    <td className="px-3 py-3 text-center font-mono text-gray">{s.pf}</td>
                    <td className="px-3 py-3 text-center">
                      <span className="inline-flex h-7 min-w-[2rem] items-center justify-center rounded-lg bg-lime px-2 text-xs font-bold text-ink">
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
          <h2 className="mb-3 flex items-center gap-2 font-meta text-xs font-bold uppercase tracking-widest text-gray">
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
          <h2 className="mb-3 flex items-center gap-2 font-meta text-xs font-bold uppercase tracking-widest text-gray">
            <Swords className="h-3.5 w-3.5" />
            Head to head
          </h2>
          <div className="overflow-hidden rounded-2xl border border-white/10 bg-ink-2">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10 bg-white/5">
                  <th className="px-4 py-3 text-left font-meta text-xs font-semibold uppercase tracking-wider text-gray">Rival</th>
                  <th className="px-3 py-3 text-center font-meta text-xs font-semibold uppercase tracking-wider text-gray">PG</th>
                  <th className="px-3 py-3 text-center font-meta text-xs font-semibold uppercase tracking-wider text-gray">PE</th>
                  <th className="px-3 py-3 text-center font-meta text-xs font-semibold uppercase tracking-wider text-gray">PP</th>
                  <th className="px-3 py-3 text-center font-meta text-xs font-semibold uppercase tracking-wider text-gray">DP</th>
                  <th className="px-3 py-3 text-center font-meta text-xs font-semibold uppercase tracking-wider text-gray">Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {profile.h2h.map((h) => {
                  const total = h.pg + h.pe + h.pp
                  const winPct = total > 0 ? Math.round((h.pg / total) * 100) : 0
                  const dp = h.pf - h.pc
                  const isPositive = h.pg > h.pp
                  const isNegative = h.pg < h.pp
                  return (
                    <tr key={h.rival_alias} className="transition-colors hover:bg-white/5">
                      <td className="px-4 py-3">
                        <Link href={`/managers/${h.rival_alias.toLowerCase()}`} className="transition-colors hover:text-lime">
                          <p className="font-semibold text-chalk">{h.rival_team}</p>
                          <p className="font-meta text-xs text-gray">{h.rival_alias}</p>
                        </Link>
                      </td>
                      <td className="px-3 py-3 text-center font-mono font-bold text-emerald-400">{h.pg}</td>
                      <td className="px-3 py-3 text-center font-mono text-gray">{h.pe}</td>
                      <td className="px-3 py-3 text-center font-mono text-rose-400">{h.pp}</td>
                      <td className={`px-3 py-3 text-center font-mono font-semibold ${dp > 0 ? "text-emerald-400" : dp < 0 ? "text-rose-400" : "text-gray"}`}>
                        {dp > 0 ? `+${dp}` : dp}
                      </td>
                      <td className="px-3 py-3 text-center">
                        <span className={`rounded-full px-2 py-0.5 font-meta text-[10px] font-bold ${
                          isPositive ? "bg-emerald-500/15 text-emerald-300"
                          : isNegative ? "bg-rose-500/15 text-rose-300"
                          : "bg-white/10 text-gray"
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
