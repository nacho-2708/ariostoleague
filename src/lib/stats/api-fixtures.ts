import type { SupabaseClient } from "@supabase/supabase-js"
import { getLeagueFixtures } from "@/lib/fpl-api"

/** Misma forma que las filas de `fixtures` en Supabase, para reutilizar la lógica de stats. */
export type StatsFixtureRow = {
  id: string
  season_id: string
  gameweek: number | null
  created_at: string
  score1: number
  score2: number
  manager1_id: string
  manager2_id: string
  manager1: { alias: string }
  manager2: { alias: string }
}

/**
 * Partidos ya jugados (finished) de la temporada en curso desde la API Draft.
 * Supabase suele no tener aún esos fixtures para `is_current`; el resto de la app ya usa esta API.
 */
export async function getApiStatsFixturesForCurrentSeason(
  supabase: SupabaseClient,
  currentSeasonId: string,
): Promise<StatsFixtureRow[]> {
  const [groups, { data: managers }] = await Promise.all([
    getLeagueFixtures(),
    supabase.from("managers").select("id, alias"),
  ])

  const aliasToId = new Map((managers ?? []).map((m) => [m.alias, m.id]))

  const out: StatsFixtureRow[] = []
  for (const g of groups) {
    for (const f of g.fixtures) {
      if (!f.finished) continue
      const id1 = aliasToId.get(f.team1_alias)
      const id2 = aliasToId.get(f.team2_alias)
      if (!id1 || !id2) continue

      out.push({
        id: `api-${g.gw}-${id1}-${id2}`,
        season_id: currentSeasonId,
        gameweek: g.gw,
        created_at: `2000-01-01T00:${String(g.gw).padStart(2, "0")}:00.000Z`,
        score1: f.score1,
        score2: f.score2,
        manager1_id: id1,
        manager2_id: id2,
        manager1: { alias: f.team1_alias },
        manager2: { alias: f.team2_alias },
      })
    }
  }
  return out
}
