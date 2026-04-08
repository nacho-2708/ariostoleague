import type { SupabaseClient } from '@supabase/supabase-js'
import { calcPuntosFantasy, type PlayerStats } from '@/lib/fpl-points'
import { fetchAllWithRange } from '@/lib/supabase/fetch-all-range'

export type PlayerPositionFilter = 'GKP' | 'DEF' | 'MID' | 'FWD' | 'ALL'

/** Qué listado muestra la página Jugadores (query `list`). */
export type PlayerListMode = 'gw_stars' | 'season_totals' | 'best_gw_per_player' | 'league_stars'

export const PLAYER_LIST_MODES: PlayerListMode[] = [
  'gw_stars',
  'season_totals',
  'best_gw_per_player',
  'league_stars',
]

export function parsePlayerListMode(raw: string | undefined): PlayerListMode {
  if (raw && PLAYER_LIST_MODES.includes(raw as PlayerListMode)) return raw as PlayerListMode
  return 'gw_stars'
}

const TOP_PER_MANAGER = 40
const TOP_LEAGUE_STARS = 100

export type PlayerRowForManager = {
  playerId: string
  name: string
  position: string
  club: string
  fplCode: number | null
  totalPoints: number
  gameweeks: number
}

export type PlayerBestGwForManager = {
  playerId: string
  name: string
  position: string
  club: string
  fplCode: number | null
  bestPoints: number
  gameweek: number
}

/** Una fila por jornada: el mismo jugador puede repetirse (varias GWs fuertes). */
export type PlayerGwPerformanceRow = {
  playerId: string
  name: string
  position: string
  club: string
  fplCode: number | null
  gameweek: number
  points: number
}

export type LeagueGwStarRow = PlayerGwPerformanceRow & {
  managerId: string
  managerAlias: string
}

export type ManagerPlayersBlock = {
  managerId: string
  alias: string
  byTotal: PlayerRowForManager[]
  bestSingleGw: PlayerBestGwForManager[]
  gwStars: PlayerGwPerformanceRow[]
}

export type PlayerLeaderboardResult = {
  hasData: boolean
  managerOptions: { managerId: string; alias: string }[]
  managers: ManagerPlayersBlock[]
  leagueStars: LeagueGwStarRow[]
}

function rowToStats(p: {
  minutes: number | null
  goals: number | null
  assists: number | null
  clean_sheet: number | null
  goals_conceded: number | null
  own_goals: number | null
  penalties_saved: number | null
  penalties_missed: number | null
  yellow_cards: number | null
  red_cards: number | null
  saves: number | null
  bonus: number | null
}): PlayerStats {
  return {
    minutes: p.minutes ?? 0,
    goals: p.goals ?? 0,
    assists: p.assists ?? 0,
    clean_sheet: p.clean_sheet ?? 0,
    goals_conceded: p.goals_conceded ?? 0,
    own_goals: p.own_goals ?? 0,
    penalties_saved: p.penalties_saved ?? 0,
    penalties_missed: p.penalties_missed ?? 0,
    yellow_cards: p.yellow_cards ?? 0,
    red_cards: p.red_cards ?? 0,
    saves: p.saves ?? 0,
    bonus: p.bonus ?? 0,
  }
}

function sortPerformanceRows(a: PlayerGwPerformanceRow, b: PlayerGwPerformanceRow): number {
  if (b.points !== a.points) return b.points - a.points
  if (a.gameweek !== b.gameweek) return a.gameweek - b.gameweek
  return a.name.localeCompare(b.name, 'es')
}

const PLAYER_GW_SELECT = `
  gameweek,
  minutes, goals, assists, clean_sheet, goals_conceded,
  own_goals, penalties_saved, penalties_missed,
  yellow_cards, red_cards, saves, bonus,
  player_id,
  manager_id,
  players(name, position, club, fpl_code)
`

export async function getPlayerLeaderboard(
  supabase: SupabaseClient,
  seasonId: string,
  position: PlayerPositionFilter,
): Promise<PlayerLeaderboardResult> {
  const { data: managers } = await supabase.from('managers').select('id, alias').order('alias')
  const aliasById = new Map((managers ?? []).map((m) => [m.id, m.alias]))
  const managerOptions = (managers ?? []).map((m) => ({ managerId: m.id, alias: m.alias }))

  const empty = (): PlayerLeaderboardResult => ({
    hasData: false,
    managerOptions,
    managers: [],
    leagueStars: [],
  })

  const { data: rows, error } = await fetchAllWithRange(async (from, to) =>
    supabase
      .from('player_gameweeks')
      .select(PLAYER_GW_SELECT)
      .eq('season_id', seasonId)
      .order('id', { ascending: true })
      .range(from, to),
  )

  if (error || !rows?.length) {
    return empty()
  }

  type Row = (typeof rows)[number] & {
    players: { name: string; position: string; club: string; fpl_code: number | null } | null
  }

  const filtered = (rows as Row[]).filter((r) => {
    const pos = r.players?.position
    if (!pos) return false
    if (position === 'ALL') return true
    return pos === position
  })

  if (!filtered.length) {
    return empty()
  }

  type Tot = {
    name: string
    position: string
    club: string
    fplCode: number | null
    pts: number
    gws: number
  }

  const totalsByManager = new Map<string, Map<string, Tot>>()
  const performancesByManager = new Map<string, PlayerGwPerformanceRow[]>()
  const allGw: (PlayerBestGwForManager & { managerId: string })[] = []
  const allPerformancesForLeague: LeagueGwStarRow[] = []

  for (const r of filtered) {
    const pl = r.players
    if (!pl) continue
    const pos = pl.position
    const stats = rowToStats(r)
    const pts = calcPuntosFantasy(stats, pos)
    const pid = r.player_id
    const mid = r.manager_id
    const fplCode = pl.fpl_code ?? null
    const alias = aliasById.get(mid) ?? ''

    const perf: PlayerGwPerformanceRow = {
      playerId: pid,
      name: pl.name,
      position: pos,
      club: pl.club,
      fplCode,
      gameweek: r.gameweek,
      points: pts,
    }

    if (!performancesByManager.has(mid)) performancesByManager.set(mid, [])
    performancesByManager.get(mid)!.push(perf)

    allPerformancesForLeague.push({ ...perf, managerId: mid, managerAlias: alias })

    if (!totalsByManager.has(mid)) totalsByManager.set(mid, new Map())
    const mMap = totalsByManager.get(mid)!
    const cur = mMap.get(pid)
    if (cur) {
      cur.pts += pts
      cur.gws += 1
    } else {
      mMap.set(pid, {
        name: pl.name,
        position: pos,
        club: pl.club,
        fplCode,
        pts,
        gws: 1,
      })
    }

    allGw.push({
      managerId: mid,
      playerId: pid,
      name: pl.name,
      position: pos,
      club: pl.club,
      fplCode,
      bestPoints: pts,
      gameweek: r.gameweek,
    })
  }

  const managerIds = [...new Set(filtered.map((r) => r.manager_id))].sort((a, b) => {
    const aa = aliasById.get(a) ?? ''
    const bb = aliasById.get(b) ?? ''
    return aa.localeCompare(bb, 'es')
  })

  const managersOut: ManagerPlayersBlock[] = []

  for (const mid of managerIds) {
    const alias = aliasById.get(mid) ?? mid
    const tMap = totalsByManager.get(mid)

    const byTotal: PlayerRowForManager[] = !tMap
      ? []
      : [...tMap.entries()]
          .map(([playerId, v]) => ({
            playerId,
            name: v.name,
            position: v.position,
            club: v.club,
            fplCode: v.fplCode,
            totalPoints: v.pts,
            gameweeks: v.gws,
          }))
          .sort((a, b) => b.totalPoints - a.totalPoints || a.name.localeCompare(b.name, 'es'))
          .slice(0, TOP_PER_MANAGER)

    const bestForM = allGw.filter((x) => x.managerId === mid)
    const bestByPlayer = new Map<string, PlayerBestGwForManager>()
    for (const row of bestForM) {
      const prev = bestByPlayer.get(row.playerId)
      if (!prev || row.bestPoints > prev.bestPoints) {
        bestByPlayer.set(row.playerId, {
          playerId: row.playerId,
          name: row.name,
          position: row.position,
          club: row.club,
          fplCode: row.fplCode,
          bestPoints: row.bestPoints,
          gameweek: row.gameweek,
        })
      }
    }

    const bestSingleGw = [...bestByPlayer.values()]
      .sort((a, b) => b.bestPoints - a.bestPoints || a.name.localeCompare(b.name, 'es'))
      .slice(0, TOP_PER_MANAGER)

    const rawStars = performancesByManager.get(mid) ?? []
    const gwStars = [...rawStars].sort(sortPerformanceRows).slice(0, TOP_PER_MANAGER)

    managersOut.push({
      managerId: mid,
      alias,
      byTotal,
      bestSingleGw,
      gwStars,
    })
  }

  const leagueStars = [...allPerformancesForLeague]
    .sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points
      if (a.gameweek !== b.gameweek) return a.gameweek - b.gameweek
      const ac = a.managerAlias.localeCompare(b.managerAlias, 'es')
      if (ac !== 0) return ac
      return a.name.localeCompare(b.name, 'es')
    })
    .slice(0, TOP_LEAGUE_STARS)

  return {
    hasData: true,
    managerOptions,
    managers: managersOut,
    leagueStars,
  }
}
