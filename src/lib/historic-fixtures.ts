import { createClient } from '@/lib/supabase/server'
import type { GameweekGroup, Fixture } from '@/lib/fpl-api'

export type HistoricFlatFixture = {
  team1: string
  team1_alias: string
  score1: number
  team2: string
  team2_alias: string
  score2: number
}

// Las temporadas viejas (23/24, 24/25) se importaron desde Excel sin columna
// gameweek, así que no se pueden agrupar por jornada. Esta función devuelve
// la lista plana para usar como fallback.
export async function getHistoricFlatFixtures(seasonId: string): Promise<HistoricFlatFixture[]> {
  const supabase = await createClient()

  const [fixturesRes, teamSeasonsRes, managersRes] = await Promise.all([
    supabase
      .from('fixtures')
      .select('manager1_id, manager2_id, score1, score2')
      .eq('season_id', seasonId),
    supabase
      .from('team_seasons')
      .select('manager_id, team_name')
      .eq('season_id', seasonId),
    supabase
      .from('managers')
      .select('id, alias'),
  ])

  const aliasById = new Map((managersRes.data ?? []).map((m) => [m.id, m.alias]))
  const teamNameById = new Map((teamSeasonsRes.data ?? []).map((t) => [t.manager_id, t.team_name]))

  return (fixturesRes.data ?? []).map((f) => {
    const alias1 = aliasById.get(f.manager1_id) ?? ''
    const alias2 = aliasById.get(f.manager2_id) ?? ''
    return {
      team1:       teamNameById.get(f.manager1_id) ?? alias1,
      team1_alias: alias1,
      score1:      f.score1,
      team2:       teamNameById.get(f.manager2_id) ?? alias2,
      team2_alias: alias2,
      score2:      f.score2,
    }
  })
}

// Devuelve los fixtures de una temporada histórica agrupados por GW, con el mismo
// shape que `getLeagueFixtures()` para que las páginas puedan renderizar lo mismo.
// Si la temporada no tiene gameweek poblado (datos viejos de Excel), devuelve []
// y la página debe caer al fallback de lista plana (`getHistoricFlatFixtures`).
export async function getHistoricGameweekGroups(seasonId: string): Promise<GameweekGroup[]> {
  const supabase = await createClient()

  const [fixturesRes, teamSeasonsRes, managersRes] = await Promise.all([
    supabase
      .from('fixtures')
      .select('id, gameweek, manager1_id, manager2_id, score1, score2')
      .eq('season_id', seasonId),
    supabase
      .from('team_seasons')
      .select('manager_id, team_name')
      .eq('season_id', seasonId),
    supabase
      .from('managers')
      .select('id, alias'),
  ])

  const fixtures = fixturesRes.data ?? []
  const aliasById = new Map((managersRes.data ?? []).map((m) => [m.id, m.alias]))
  const teamNameById = new Map((teamSeasonsRes.data ?? []).map((t) => [t.manager_id, t.team_name]))

  const gwMap = new Map<number, Fixture[]>()
  for (const f of fixtures) {
    if (f.gameweek == null) continue
    const alias1 = aliasById.get(f.manager1_id) ?? ''
    const alias2 = aliasById.get(f.manager2_id) ?? ''
    const arr = gwMap.get(f.gameweek) ?? []
    arr.push({
      gw:          f.gameweek,
      finished:    true,
      team1:       teamNameById.get(f.manager1_id) ?? alias1,
      team1_alias: alias1,
      score1:      f.score1,
      team2:       teamNameById.get(f.manager2_id) ?? alias2,
      team2_alias: alias2,
      score2:      f.score2,
    })
    gwMap.set(f.gameweek, arr)
  }

  return Array.from(gwMap.entries())
    .sort((a, b) => a[0] - b[0])
    .map(([gw, fixtures]) => ({ gw, finished: true, fixtures }))
}
