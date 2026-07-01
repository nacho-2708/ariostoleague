import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { getLeagueFixtures, getGameInfo } from "@/lib/fpl-api"
import { getHistoricGameweekGroups, getHistoricFlatFixtures } from "@/lib/historic-fixtures"
import type { GameweekGroup } from "@/lib/fpl-api"
import type { HistoricFlatFixture } from "@/lib/historic-fixtures"

export default async function FixturesPage({
  searchParams,
}: {
  searchParams: Promise<{ season?: string }>
}) {
  const { season: seasonParam } = await searchParams
  const supabase = await createClient()

  const { data: seasons } = await supabase
    .from("seasons")
    .select("id, name, is_current")
    .eq("has_full_data", true)
    .order("start_year", { ascending: false })

  if (!seasons?.length) return null

  const selectedName = seasonParam ?? seasons[0].name
  const season = seasons.find((s) => s.name === selectedName) ?? seasons[0]

  let gwGroups: GameweekGroup[]
  let currentGw: number | null = null
  let flatFixtures: HistoricFlatFixture[] = []

  if (season.is_current) {
    const [groups, gameInfo] = await Promise.all([getLeagueFixtures(), getGameInfo()])
    gwGroups = groups
    currentGw = gameInfo.currentGw
  } else {
    gwGroups = await getHistoricGameweekGroups(season.id)
    // Fallback: temporadas viejas sin columna gameweek (importadas de Excel)
    if (gwGroups.length === 0) {
      flatFixtures = await getHistoricFlatFixtures(season.id)
    }
  }

  const useFlatView = !season.is_current && gwGroups.length === 0
  // Para temporadas finalizadas con GW data, "destacada" = la última (final de temporada)
  const highlightGw = currentGw ?? gwGroups.at(-1)?.gw ?? null

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-gray">
          Temporada {season.name}
        </p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight text-chalk">Fixtures</h1>
      </div>

      {/* Info de estado */}
      {useFlatView ? (
        <div className="flex items-center gap-3 rounded-xl border border-border bg-white px-5 py-4 shadow-sm">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-sm font-bold text-emerald-700">
            ✓
          </div>
          <div>
            <p className="font-semibold text-foreground">Temporada finalizada</p>
            <p className="text-sm text-muted-foreground">
              {flatFixtures.length} partidos jugados
            </p>
          </div>
        </div>
      ) : season.is_current && currentGw != null ? (
        <div className="flex items-center gap-3 rounded-xl border border-border bg-white px-5 py-4 shadow-sm">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#3e1a5b] text-sm font-bold text-white">
            {currentGw}
          </div>
          <div>
            <p className="font-semibold text-foreground">Jornada {currentGw}</p>
            <p className="text-sm text-muted-foreground">
              {gwGroups.find((g) => g.gw === currentGw)?.finished ? "Finalizada" : "En curso"}
            </p>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-3 rounded-xl border border-border bg-white px-5 py-4 shadow-sm">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-sm font-bold text-emerald-700">
            ✓
          </div>
          <div>
            <p className="font-semibold text-foreground">Temporada finalizada</p>
            <p className="text-sm text-muted-foreground">
              {gwGroups.length} jornada{gwGroups.length === 1 ? "" : "s"} jugadas
            </p>
          </div>
        </div>
      )}

      {/* Vista plana para temporadas sin GW data (Excel viejo) */}
      {useFlatView && (
        <div className="overflow-hidden rounded-2xl border border-border bg-white shadow-sm">
          <div className="divide-y divide-border">
            {flatFixtures.map((f, idx) => {
              const win1 = f.score1 > f.score2
              const win2 = f.score2 > f.score1
              return (
                <div key={idx} className="flex items-center px-5 py-3 hover:bg-muted/30 transition-colors">
                  <span className={`w-[40%] truncate text-sm font-medium ${win1 ? "text-foreground" : "text-muted-foreground"}`}>
                    {f.team1}
                  </span>
                  <span className="w-[20%] text-center font-mono text-sm font-bold text-foreground tabular-nums">
                    {f.score1} – {f.score2}
                  </span>
                  <span className={`w-[40%] truncate text-right text-sm font-medium ${win2 ? "text-foreground" : "text-muted-foreground"}`}>
                    {f.team2}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Grid de GWs (temporada actual o histórica con GW data) */}
      {!useFlatView && (
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {gwGroups.map((group) => {
          const isHighlight = group.gw === highlightGw && season.is_current
          return (
            <Link
              key={group.gw}
              href={`/fixtures/${group.gw}?season=${encodeURIComponent(season.name)}`}
              className={`group rounded-xl border bg-white p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md ${
                isHighlight ? "border-[#3e1a5b] ring-1 ring-[#3e1a5b]" : "border-border"
              }`}
            >
              <div className="mb-3 flex items-center justify-between">
                <span className={`text-xs font-bold uppercase tracking-wider ${isHighlight ? "text-[#3e1a5b]" : "text-muted-foreground"}`}>
                  Jornada {group.gw}
                </span>
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                  !group.finished
                    ? isHighlight
                      ? "bg-[#3e1a5b]/10 text-[#3e1a5b]"
                      : "bg-muted text-muted-foreground"
                    : "bg-emerald-50 text-emerald-700"
                }`}>
                  {group.finished ? "Finalizada" : isHighlight ? "En curso" : "Pendiente"}
                </span>
              </div>

              <div className="space-y-1.5">
                {group.fixtures.map((f, idx) => (
                  <div key={idx} className="flex items-center justify-between text-xs">
                    <span className="truncate text-foreground font-medium max-w-[35%]">{f.team1}</span>
                    {group.finished ? (
                      <span className="font-mono font-bold text-foreground tabular-nums">
                        {f.score1} – {f.score2}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">vs</span>
                    )}
                    <span className="truncate text-right text-foreground font-medium max-w-[35%]">{f.team2}</span>
                  </div>
                ))}
              </div>
            </Link>
          )
        })}
      </div>
      )}
    </div>
  )
}
