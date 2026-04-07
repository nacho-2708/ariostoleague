import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { getLeagueFixtures, getGameInfo } from "@/lib/fpl-api"

// ─── Tipos para temporadas históricas ────────────────────────────────────────

type HistoricFixture = {
  id: string
  score1: number
  score2: number
  manager1: { alias: string }
  manager2: { alias: string }
  team1_name: string | null
  team2_name: string | null
}

async function getHistoricFixtures(seasonId: string): Promise<HistoricFixture[]> {
  const supabase = await createClient()

  const { data: fixtures } = await supabase
    .from("fixtures")
    .select(`
      id, score1, score2,
      manager1:managers!fixtures_manager1_id_fkey(alias),
      manager2:managers!fixtures_manager2_id_fkey(alias)
    `)
    .eq("season_id", seasonId)

  const { data: teamSeasons } = await supabase
    .from("team_seasons")
    .select("manager_id, team_name")
    .eq("season_id", seasonId)

  const teamMap = new Map(teamSeasons?.map((t) => [t.manager_id, t.team_name]) ?? [])

  // Enriquecer con nombres de equipo — necesitamos los IDs de manager
  const { data: fixturesWithIds } = await supabase
    .from("fixtures")
    .select("id, manager1_id, manager2_id")
    .eq("season_id", seasonId)

  const idMap = new Map(fixturesWithIds?.map((f) => [f.id, { m1: f.manager1_id, m2: f.manager2_id }]) ?? [])

  return (fixtures ?? []).map((f: any) => ({
    ...f,
    team1_name: teamMap.get(idMap.get(f.id)?.m1 ?? '') ?? null,
    team2_name: teamMap.get(idMap.get(f.id)?.m2 ?? '') ?? null,
  }))
}

// ─── Página ──────────────────────────────────────────────────────────────────

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

  // ── Temporada actual: datos de la API ──
  if (season.is_current) {
    const [gwGroups, gameInfo] = await Promise.all([
      getLeagueFixtures(),
      getGameInfo(),
    ])

    const currentGw = gameInfo.currentGw

    return (
      <div className="space-y-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Temporada {season.name}
          </p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight">Fixtures</h1>
        </div>

        {/* Info GW actual */}
        <div className="flex items-center gap-3 rounded-xl border border-border bg-white px-5 py-4 shadow-sm">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#3e1a5b] text-sm font-bold text-white">
            {currentGw}
          </div>
          <div>
            <p className="font-semibold text-foreground">Jornada {currentGw}</p>
            <p className="text-sm text-muted-foreground">
              {gameInfo.currentGwFinished
                ? "Finalizada · Próxima: Jornada " + gameInfo.nextGw
                : "En curso"}
            </p>
          </div>
        </div>

        {/* Grid de GWs */}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {gwGroups.map((group) => {
            const isCurrent = group.gw === currentGw
            return (
              <Link
                key={group.gw}
                href={`/fixtures/${group.gw}?season=${encodeURIComponent(season.name)}`}
                className={`group rounded-xl border bg-white p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md ${
                  isCurrent
                    ? "border-[#3e1a5b] ring-1 ring-[#3e1a5b]"
                    : "border-border"
                }`}
              >
                <div className="mb-3 flex items-center justify-between">
                  <span className={`text-xs font-bold uppercase tracking-wider ${isCurrent ? "text-[#3e1a5b]" : "text-muted-foreground"}`}>
                    Jornada {group.gw}
                  </span>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                    !group.finished
                      ? isCurrent
                        ? "bg-[#3e1a5b]/10 text-[#3e1a5b]"
                        : "bg-muted text-muted-foreground"
                      : "bg-emerald-50 text-emerald-700"
                  }`}>
                    {group.finished ? "Finalizada" : isCurrent ? "En curso" : "Pendiente"}
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
      </div>
    )
  }

  // ── Temporadas históricas: datos de Supabase ──
  const fixtures = await getHistoricFixtures(season.id)

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Temporada {season.name}
        </p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight">Fixtures</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {fixtures.length} partidos jugados
        </p>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-white shadow-sm">
        <div className="divide-y divide-border">
          {fixtures.map((f) => {
            const team1 = f.team1_name ?? f.manager1.alias
            const team2 = f.team2_name ?? f.manager2.alias
            const win1 = f.score1 > f.score2
            const win2 = f.score2 > f.score1
            return (
              <div key={f.id} className="flex items-center px-5 py-3 hover:bg-muted/30 transition-colors">
                <span className={`w-[40%] truncate text-sm font-medium ${win1 ? "text-foreground" : "text-muted-foreground"}`}>
                  {team1}
                </span>
                <span className="w-[20%] text-center font-mono text-sm font-bold text-foreground tabular-nums">
                  {f.score1} – {f.score2}
                </span>
                <span className={`w-[40%] truncate text-right text-sm font-medium ${win2 ? "text-foreground" : "text-muted-foreground"}`}>
                  {team2}
                </span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
