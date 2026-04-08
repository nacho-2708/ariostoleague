import { createAdminClient } from '@/lib/supabase/admin'

const FPL_API = 'https://draft.premierleague.com/api'
export const LEAGUE_ID = 1722

// Mapeo entry_id (para picks API) → alias interno
const ENTRY_ID_TO_ALIAS: Record<number, string> = {
  5402:   'Marculi',
  5642:   'RG',
  6076:   'Papezar',
  6379:   'Sir Jagger',
  7561:   'Varela',
  13661:  'Canter',
  14319:  'Wawri',
  62362:  'Cunha',
  205685: 'Manoloto',
  205787: 'Ignagoat',
  208274: 'Bebito',
  228396: 'Comandante',
}

const POSITION_MAP: Record<number, string> = { 1: 'GKP', 2: 'DEF', 3: 'MID', 4: 'FWD' }

// ─── Tipos API ────────────────────────────────────────────────────────────────

type BootstrapElement = {
  id: number
  code: number
  first_name: string
  second_name: string
  web_name: string
  element_type: number  // 1=GKP 2=DEF 3=MID 4=FWD
  team: number
}

type BootstrapTeam = {
  id: number
  short_name: string
}

type LiveStats = {
  minutes: number
  goals_scored: number
  assists: number
  clean_sheets: number
  goals_conceded: number
  own_goals: number
  penalties_saved: number
  penalties_missed: number
  yellow_cards: number
  red_cards: number
  saves: number
  bonus: number
  bps: number
  influence: number
  creativity: number
  threat: number
  ict_index: number
  expected_goals: number
  expected_assists: number
  expected_goal_involvements: number
  expected_goals_conceded: number
  total_points: number
}

type LiveElement = {
  stats: LiveStats
}

type Pick = {
  element: number
  position: number   // 1-11 = titular, 12-15 = banco
  is_captain: boolean
  multiplier: number
}

export type SyncResult = {
  gw: number
  alias: string
  playersUpserted: number
  error?: string
}

// ─── Fetchers ─────────────────────────────────────────────────────────────────

async function fetchBootstrap(): Promise<{ elements: BootstrapElement[]; teams: BootstrapTeam[] }> {
  const res = await fetch(`${FPL_API}/bootstrap-static`, { next: { revalidate: 0 } })
  if (!res.ok) throw new Error(`bootstrap-static error: ${res.status}`)
  return res.json()
}

async function fetchLive(gw: number): Promise<Record<string, LiveElement>> {
  const res = await fetch(`${FPL_API}/event/${gw}/live`, { next: { revalidate: 0 } })
  if (!res.ok) throw new Error(`event/${gw}/live error: ${res.status}`)
  const data = await res.json()
  return data.elements
}

async function fetchPicks(entryId: number, gw: number): Promise<Pick[] | null> {
  const res = await fetch(`${FPL_API}/entry/${entryId}/event/${gw}`, { next: { revalidate: 0 } })
  if (!res.ok) return null
  const data = await res.json()
  return data.picks ?? null
}

// ─── Sync principal ───────────────────────────────────────────────────────────

export async function syncGW(gw: number, seasonName = '2025/26'): Promise<SyncResult[]> {
  const supabase = createAdminClient()
  const results: SyncResult[] = []

  // 1. Obtener info de jugadores y equipos de la PL
  const bootstrap = await fetchBootstrap()
  const teamMap = new Map(bootstrap.teams.map((t) => [t.id, t.short_name]))
  const elementMap = new Map(bootstrap.elements.map((e) => [e.id, e]))

  // 2. Stats en vivo de esta GW
  const liveData = await fetchLive(gw)

  // 3. Obtener season_id y manager IDs de Supabase
  const { data: season } = await supabase
    .from('seasons')
    .select('id')
    .eq('name', seasonName)
    .single()

  if (!season) throw new Error(`Temporada ${seasonName} no encontrada en DB`)

  const { data: managers } = await supabase
    .from('managers')
    .select('id, alias')

  if (!managers) throw new Error('No se pudieron obtener managers')

  const managerByAlias = new Map(managers.map((m) => [m.alias, m.id]))

  // 4. Para cada manager, procesar sus picks
  for (const [entryId, alias] of Object.entries(ENTRY_ID_TO_ALIAS)) {
    const managerId = managerByAlias.get(alias)
    if (!managerId) {
      results.push({ gw, alias, playersUpserted: 0, error: 'Manager no encontrado en DB' })
      continue
    }

    const picks = await fetchPicks(Number(entryId), gw)
    if (!picks) {
      results.push({ gw, alias, playersUpserted: 0, error: `Sin picks para GW${gw}` })
      continue
    }

    let playersUpserted = 0

    for (const pick of picks) {
      const element = elementMap.get(pick.element)
      const live = liveData[String(pick.element)]

      if (!element || !live) continue

      const position = POSITION_MAP[element.element_type]
      const club = teamMap.get(element.team) ?? 'UNK'
      const name = element.web_name
      const isStarter = pick.position <= 11

      // Upsert jugador en tabla players (fpl_code = elements[].code para fotos en el CDN)
      const { data: player, error: playerError } = await supabase
        .from('players')
        .upsert(
          { name, position, club, fpl_code: element.code },
          { onConflict: 'name,position,club', ignoreDuplicates: false }
        )
        .select('id')
        .single()

      if (playerError || !player) {
        // Intentar obtener si ya existe
        const { data: existing } = await supabase
          .from('players')
          .select('id')
          .eq('name', name)
          .eq('position', position)
          .eq('club', club)
          .single()

        if (!existing) continue
        await supabase.from('players').update({ fpl_code: element.code }).eq('id', existing.id)
        await upsertPlayerGW(supabase, existing.id, managerId, season.id, gw, isStarter, live.stats)
      } else {
        await upsertPlayerGW(supabase, player.id, managerId, season.id, gw, isStarter, live.stats)
      }

      playersUpserted++
    }

    results.push({ gw, alias, playersUpserted })
  }

  return results
}

async function upsertPlayerGW(
  supabase: ReturnType<typeof createAdminClient>,
  playerId: string,
  managerId: string,
  seasonId: string,
  gameweek: number,
  isStarter: boolean,
  stats: LiveStats,
) {
  await supabase.from('player_gameweeks').upsert({
    player_id:                    playerId,
    manager_id:                   managerId,
    season_id:                    seasonId,
    gameweek,
    is_starter:                   isStarter,
    minutes:                      stats.minutes,
    goals:                        stats.goals_scored,
    assists:                      stats.assists,
    clean_sheet:                  stats.clean_sheets,
    goals_conceded:               stats.goals_conceded,
    own_goals:                    stats.own_goals,
    penalties_saved:              stats.penalties_saved,
    penalties_missed:             stats.penalties_missed,
    yellow_cards:                 stats.yellow_cards,
    red_cards:                    stats.red_cards,
    saves:                        stats.saves,
    bonus:                        stats.bonus,
    bps:                          stats.bps,
    influence:                    stats.influence,
    creativity:                   stats.creativity,
    threat:                       stats.threat,
    ict_index:                    stats.ict_index,
    expected_goals:               stats.expected_goals,
    expected_assists:             stats.expected_assists,
    expected_goal_involvements:   stats.expected_goal_involvements,
    expected_goals_conceded:      stats.expected_goals_conceded,
  }, {
    onConflict: 'player_id,manager_id,season_id,gameweek',
  })
}

// ─── Sync de múltiples GWs ───────────────────────────────────────────────────

export async function syncAllGWs(upToGW: number, seasonName = '2025/26'): Promise<SyncResult[]> {
  const all: SyncResult[] = []
  for (let gw = 1; gw <= upToGW; gw++) {
    const results = await syncGW(gw, seasonName)
    all.push(...results)
  }
  return all
}
