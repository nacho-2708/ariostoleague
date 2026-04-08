import { Suspense } from "react"
import { createClient } from "@/lib/supabase/server"
import { getPlayerLeaderboard, type PlayerPositionFilter } from "@/lib/stats/player-leaderboards"
import PlayerLeaderboardTable from "@/components/stats/player-leaderboard-table"

export default async function StatsPlayersPage({
  searchParams,
}: {
  searchParams: Promise<{ season?: string; pos?: string; list?: string; view?: string }>
}) {
  const sp = await searchParams
  const supabase = await createClient()

  const { data: seasons } = await supabase
    .from("seasons")
    .select("id, name")
    .eq("has_full_data", true)
    .order("start_year", { ascending: false })

  if (!seasons?.length) {
    return <p className="text-destructive">No hay temporadas disponibles.</p>
  }

  const selected = seasons.find((s) => s.name === sp.season) ?? seasons[0]
  const pos = (sp.pos as PlayerPositionFilter | undefined) ?? "ALL"
  const validPos: PlayerPositionFilter = ["GKP", "DEF", "MID", "FWD", "ALL"].includes(pos)
    ? pos
    : "ALL"

  const board = await getPlayerLeaderboard(supabase, selected.id, validPos)

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Temporada {selected.name}
        </p>
        <h2 className="mt-1 text-xl font-bold text-foreground">Jugadores fantasy</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Elige el tipo de listado arriba: actuaciones por jornada (jugadores repetibles), totales de temporada, mejor GW
          por jugador o top de la liga. Mismo reglamento FPL que en el detalle de partidos.
        </p>
      </div>

      {!board.hasData ? (
        <div className="rounded-xl border border-dashed border-border bg-muted/30 px-6 py-10 text-center">
          <p className="font-medium text-foreground">Sin datos de jugadores para esta temporada.</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Cuando se sincronicen las jornadas en Supabase, aparecerán los leaderboards.
          </p>
        </div>
      ) : (
        <Suspense fallback={<div className="h-40 animate-pulse rounded-xl bg-muted" />}>
          <PlayerLeaderboardTable managers={board.managers} leagueStars={board.leagueStars} />
        </Suspense>
      )}
    </div>
  )
}
