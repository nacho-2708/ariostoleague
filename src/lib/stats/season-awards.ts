import type { SupabaseClient } from "@supabase/supabase-js"
import { calcularTabla, type FixtureRow } from "@/lib/standings"
import { fetchAllWithRange } from "@/lib/supabase/fetch-all-range"
import { getH2HRecords } from "@/lib/stats/h2h-records"
import { getPlayerLeaderboard } from "@/lib/stats/player-leaderboards"

// Para no premiar un cruce de un solo partido como "verdugo" de temporada.
const MIN_PLAYED_FOR_BESTIA_NEGRA = 2

export type PlayerSeasonAward = {
  playerName: string
  managerAlias: string
  value: number
  gameweek?: number
} | null

export type PlayerTotalAward = { playerName: string; value: number } | null

export type BestiaNegraAward = {
  winnerAlias: string
  loserAlias: string
  wins: number
  losses: number
  played: number
} | null

export type StreakAward = { managerAlias: string; length: number } | null

export type FarolilloRojoAward = { managerAlias: string; teamName: string; pts: number } | null

// MVP: jugador con más puntos fantasy sumados en la temporada, sin importar el manager.
export async function getSeasonMVP(supabase: SupabaseClient, seasonId: string): Promise<PlayerSeasonAward> {
  const leaderboard = await getPlayerLeaderboard(supabase, seasonId, "ALL")
  if (!leaderboard.hasData) return null

  let best: PlayerSeasonAward = null
  for (const block of leaderboard.managers) {
    const top = block.byTotal[0]
    if (top && (!best || top.totalPoints > best.value)) {
      best = { playerName: top.name, managerAlias: block.alias, value: top.totalPoints }
    }
  }
  return best
}

// Mejor GW individual: la mejor actuación de una sola gameweek de toda la liga.
export async function getSeasonBestGw(supabase: SupabaseClient, seasonId: string): Promise<PlayerSeasonAward> {
  const leaderboard = await getPlayerLeaderboard(supabase, seasonId, "ALL")
  if (!leaderboard.hasData || !leaderboard.leagueStars.length) return null

  const best = leaderboard.leagueStars[0]
  return { playerName: best.name, managerAlias: best.managerAlias, value: best.points, gameweek: best.gameweek }
}

async function sumPlayerStat(
  supabase: SupabaseClient,
  seasonId: string,
  column: "goals" | "assists",
): Promise<PlayerTotalAward> {
  const { data: rows, error } = await fetchAllWithRange(async (from, to) =>
    supabase
      .from("player_gameweeks")
      .select(`player_id, ${column}, players(name)`)
      .eq("season_id", seasonId)
      .order("id", { ascending: true })
      .range(from, to),
  )

  if (error || !rows?.length) return null

  type Row = { player_id: string; players: { name: string } | null } & Record<typeof column, number | null>

  const totals = new Map<string, { name: string; value: number }>()
  for (const r of rows as unknown as Row[]) {
    if (!r.players) continue
    const cur = totals.get(r.player_id)
    const amount = r[column] ?? 0
    if (cur) {
      cur.value += amount
    } else {
      totals.set(r.player_id, { name: r.players.name, value: amount })
    }
  }

  let best: { name: string; value: number } | null = null
  for (const t of totals.values()) {
    if (!best || t.value > best.value) best = t
  }
  return best ? { playerName: best.name, value: best.value } : null
}

// Bota de oro: jugador con más goles marcados en la temporada.
export async function getSeasonTopScorer(supabase: SupabaseClient, seasonId: string): Promise<PlayerTotalAward> {
  return sumPlayerStat(supabase, seasonId, "goals")
}

// Rey de asistencias: jugador con más asistencias en la temporada.
export async function getSeasonTopAssister(supabase: SupabaseClient, seasonId: string): Promise<PlayerTotalAward> {
  return sumPlayerStat(supabase, seasonId, "assists")
}

// Bestia negra: el par de managers con mayor diferencia de victorias entre sí,
// exigiendo al menos MIN_PLAYED_FOR_BESTIA_NEGRA cruces en la temporada.
export async function getSeasonBestiaNegra(supabase: SupabaseClient, seasonId: string): Promise<BestiaNegraAward> {
  const h2h = await getH2HRecords(supabase, { scope: "season", seasonId })
  if (!h2h) return null

  let best: BestiaNegraAward = null
  let bestGap = 0
  for (const pair of h2h.h2hPairs) {
    if (pair.played < MIN_PLAYED_FOR_BESTIA_NEGRA) continue
    const gap = Math.abs(pair.winsA - pair.winsB)
    if (gap === 0 || gap <= bestGap) continue

    const aWins = pair.winsA > pair.winsB
    bestGap = gap
    best = {
      winnerAlias: aWins ? pair.aliasA : pair.aliasB,
      loserAlias: aWins ? pair.aliasB : pair.aliasA,
      wins: aWins ? pair.winsA : pair.winsB,
      losses: aWins ? pair.winsB : pair.winsA,
      played: pair.played,
    }
  }
  return best
}

// Racha más larga: la racha de victorias consecutivas más extensa de la temporada.
export async function getSeasonLongestStreak(supabase: SupabaseClient, seasonId: string): Promise<StreakAward> {
  const h2h = await getH2HRecords(supabase, { scope: "season", seasonId })
  if (!h2h || !h2h.longestWinStreaks.length) return null

  const best = h2h.longestWinStreaks[0]
  return { managerAlias: best.alias, length: best.length }
}

// Farolillo rojo: último puesto de la tabla final de la temporada.
export async function getSeasonFarolilloRojo(supabase: SupabaseClient, seasonId: string): Promise<FarolilloRojoAward> {
  const { data: fixtures } = await supabase
    .from("fixtures")
    .select(
      `
      score1, score2,
      manager1:managers!fixtures_manager1_id_fkey(id, alias),
      manager2:managers!fixtures_manager2_id_fkey(id, alias)
    `,
    )
    .eq("season_id", seasonId)

  if (!fixtures?.length) return null

  const { data: teamSeasons } = await supabase
    .from("team_seasons")
    .select("manager_id, team_name")
    .eq("season_id", seasonId)

  const teamNames = new Map((teamSeasons ?? []).map((t) => [t.manager_id, t.team_name]))
  const tabla = calcularTabla(fixtures as unknown as FixtureRow[], teamNames)
  if (!tabla.length) return null

  const last = tabla[tabla.length - 1]
  return { managerAlias: last.alias, teamName: last.team_name, pts: last.pts }
}
