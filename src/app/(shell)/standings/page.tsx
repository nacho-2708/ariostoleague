import { createClient } from "@/lib/supabase/server"
import { calcularTabla, type FixtureRow } from "@/lib/standings"
import { getLeagueStandings } from "@/lib/fpl-api"
import StandingsTable from "@/components/standings-table"

export default async function StandingsPage({
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

  if (!seasons?.length) {
    return <p className="text-destructive">No hay temporadas disponibles.</p>
  }

  const selectedName = seasonParam ?? seasons[0].name
  const season = seasons.find((s) => s.name === selectedName) ?? seasons[0]

  let tabla
  if (season.is_current) {
    tabla = await getLeagueStandings()
  } else {
    const { data: fixtures, error } = await supabase
      .from("fixtures")
      .select(`
        score1,
        score2,
        manager1:managers!fixtures_manager1_id_fkey(id, alias),
        manager2:managers!fixtures_manager2_id_fkey(id, alias)
      `)
      .eq("season_id", season.id)

    const { data: teamSeasons } = await supabase
      .from("team_seasons")
      .select("manager_id, team_name")
      .eq("season_id", season.id)

    if (error || !fixtures) {
      return <p className="text-destructive">Error al cargar los fixtures.</p>
    }

    const teamNames = new Map(teamSeasons?.map((t) => [t.manager_id, t.team_name]) ?? [])
    tabla = calcularTabla(fixtures as unknown as FixtureRow[], teamNames)
  }

  const leader = tabla[0]

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-end justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Temporada {season.name}
          </p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-foreground">
            Tabla de posiciones
          </h1>
        </div>
        {season.is_current && leader && (
          <div className="hidden rounded-xl border border-border bg-white p-3 text-right shadow-sm sm:block">
            <p className="text-xs font-medium text-muted-foreground">Líder actual</p>
            <p className="mt-0.5 font-bold text-foreground">{leader.team_name}</p>
            <p className="text-xs text-muted-foreground">{leader.pts} pts · {leader.pj} jornadas</p>
          </div>
        )}
      </div>

      <StandingsTable rows={tabla} />
    </div>
  )
}
