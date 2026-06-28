import { createAdminClient } from '@/lib/supabase/admin'
import { getLeagueFixtures } from '@/lib/fpl-api'
import { expectedRowsPerGW, isGWComplete, type GWSyncReport } from '@/lib/fpl-sync-guards'

export type { GWSyncReport }

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

// Cuántos managers tiene la liga (= entries mapeados). Con SQUAD_SIZE define la
// completitud esperada de cada GW.
const EXPECTED_MANAGERS = Object.keys(ENTRY_ID_TO_ALIAS).length // 12
const EXPECTED_ROWS_PER_GW = expectedRowsPerGW(EXPECTED_MANAGERS) // 180

// ─── Retry para fallos transitorios de la FPL API ────────────────────────────
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

// Reintenta ante errores de red y respuestas 5xx/429. Devuelve la Response para
// que el caller decida sobre 404 (p.ej. "sin picks"). Lanza si agota reintentos
// — así un fallo transitorio NO se confunde con un dato ausente (la raíz del
// fallo silencioso del diagnóstico).
async function fetchWithRetry(url: string, retries = 3, label = url): Promise<Response> {
  let lastErr: unknown
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url, { next: { revalidate: 0 } })
      if (res.ok || res.status === 404) return res
      lastErr = new Error(`${label}: HTTP ${res.status}`)
    } catch (err) {
      lastErr = err
    }
    if (attempt < retries) await sleep(300 * attempt)
  }
  throw lastErr instanceof Error ? lastErr : new Error(`${label}: falló tras ${retries} intentos`)
}

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
  const res = await fetchWithRetry(`${FPL_API}/bootstrap-static`, 3, 'bootstrap-static')
  if (!res.ok) throw new Error(`bootstrap-static error: ${res.status}`)
  return res.json()
}

async function fetchLive(gw: number): Promise<Record<string, LiveElement>> {
  const res = await fetchWithRetry(`${FPL_API}/event/${gw}/live`, 3, `event/${gw}/live`)
  if (!res.ok) throw new Error(`event/${gw}/live error: ${res.status}`)
  const data = await res.json()
  return data.elements
}

// Devuelve null SOLO ante 404 (no hay picks para ese entry/gw — caso legítimo).
// Un fallo transitorio (5xx/red) ya se reintentó en fetchWithRetry y, si persiste,
// lanza: nunca se devuelve null por un error de red (eso era el fallo silencioso).
async function fetchPicks(entryId: number, gw: number): Promise<Pick[] | null> {
  const res = await fetchWithRetry(`${FPL_API}/entry/${entryId}/event/${gw}`, 3, `entry/${entryId}/event/${gw}`)
  if (res.status === 404) return null
  if (!res.ok) throw new Error(`entry/${entryId}/event/${gw} error: ${res.status}`)
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

    let picks: Pick[] | null
    try {
      picks = await fetchPicks(Number(entryId), gw)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'error desconocido'
      results.push({ gw, alias, playersUpserted: 0, error: `Picks GW${gw} falló: ${message}` })
      continue
    }
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

// ─── Verificación de completitud ─────────────────────────────────────────────

// Cuenta las filas REALMENTE guardadas en la DB para una GW (no lo que el loop
// cree que escribió). Es la base del chequeo de completitud: deja en evidencia
// los upserts que fallaron en silencio.
async function countSavedRows(
  supabase: ReturnType<typeof createAdminClient>,
  seasonId: string,
  gw: number,
): Promise<number> {
  const { count, error } = await supabase
    .from('player_gameweeks')
    .select('*', { count: 'exact', head: true })
    .eq('season_id', seasonId)
    .eq('gameweek', gw)
  if (error) throw new Error(`No se pudo verificar GW${gw}: ${error.message}`)
  return count ?? 0
}

// Sincroniza una GW y la verifica contra lo esperado (~180 filas). Devuelve un
// reporte con complete=false si quedó corta o si hubo errores por manager — el
// caller (route) lo traduce a ok:false / HTTP no-200, en vez de seguir verde.
export async function syncGWChecked(gw: number, seasonName = '2025/26'): Promise<GWSyncReport> {
  const supabase = createAdminClient()

  const { data: season } = await supabase
    .from('seasons')
    .select('id')
    .eq('name', seasonName)
    .single()
  if (!season) throw new Error(`Temporada ${seasonName} no encontrada en DB`)

  const results = await syncGW(gw, seasonName)
  const playersUpserted = results.reduce((sum, r) => sum + r.playersUpserted, 0)
  const errors = results
    .filter((r) => r.error)
    .map((r) => ({ alias: r.alias, error: r.error as string }))

  const savedRows = await countSavedRows(supabase, season.id, gw)
  const complete = isGWComplete(savedRows, EXPECTED_ROWS_PER_GW, errors.length)

  return { gw, expectedRows: EXPECTED_ROWS_PER_GW, savedRows, complete, playersUpserted, errors }
}

// ─── Sync de múltiples GWs ───────────────────────────────────────────────────
// NO se detiene en silencio: sincroniza todo el rango y devuelve un reporte por
// GW. El caller decide el status según completitud (ningún ok:true a ciegas).
export async function syncAllGWs(upToGW: number, seasonName = '2025/26'): Promise<GWSyncReport[]> {
  const reports: GWSyncReport[] = []
  for (let gw = 1; gw <= upToGW; gw++) {
    reports.push(await syncGWChecked(gw, seasonName))
  }
  return reports
}

// ─── Metadata de temporada ───────────────────────────────────────────────────
// Para decidir el rango de sync: una temporada terminada (is_current=false) se
// sincroniza por rango fijo 1..38 (ver resolveUpTo en fpl-sync-guards).
export async function getSeasonMeta(seasonName: string): Promise<{ id: string; isCurrent: boolean }> {
  const supabase = createAdminClient()
  const { data: season } = await supabase
    .from('seasons')
    .select('id, is_current')
    .eq('name', seasonName)
    .single()
  if (!season) throw new Error(`Temporada ${seasonName} no encontrada en DB`)
  return { id: season.id, isCurrent: season.is_current }
}

// ─── Finalización de temporada ───────────────────────────────────────────────
// Estas funciones existen porque el sync regular solo escribe `player_gameweeks`
// y `players`. Cuando una temporada termina y deja de ser `is_current`, las
// páginas históricas leen de `fixtures` y `team_seasons`, así que hay que
// poblar esas tablas desde la FPL API antes de flipear is_current=false.

async function loadSeasonAndManagers(seasonName: string) {
  const supabase = createAdminClient()

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

  return { supabase, season, managerByAlias: new Map(managers.map((m) => [m.alias, m.id])) }
}

export async function backfillFixtures(seasonName = '2025/26') {
  const { supabase, season, managerByAlias } = await loadSeasonAndManagers(seasonName)

  const gwGroups = await getLeagueFixtures()

  const rows = gwGroups.flatMap((group) =>
    group.fixtures.map((f) => {
      const m1 = managerByAlias.get(f.team1_alias)
      const m2 = managerByAlias.get(f.team2_alias)
      if (!m1 || !m2) {
        throw new Error(`Manager no mapeado: ${f.team1_alias} / ${f.team2_alias}`)
      }
      return {
        season_id:   season.id,
        gameweek:    f.gw,
        manager1_id: m1,
        manager2_id: m2,
        score1:      f.score1,
        score2:      f.score2,
      }
    })
  )

  // Idempotencia: limpiar fixtures previos de esta temporada antes de insertar
  const { error: delError } = await supabase.from('fixtures').delete().eq('season_id', season.id)
  if (delError) throw delError

  const { error: insError } = await supabase.from('fixtures').insert(rows)
  if (insError) throw insError

  return { fixturesInserted: rows.length }
}

export async function backfillTeamSeasons(seasonName = '2025/26') {
  const { supabase, season, managerByAlias } = await loadSeasonAndManagers(seasonName)

  // Deducir alias → team_name desde la lista de fixtures (cada entry aparece en varios partidos)
  const gwGroups = await getLeagueFixtures()
  const aliasToTeamName = new Map<string, string>()
  for (const group of gwGroups) {
    for (const f of group.fixtures) {
      if (f.team1_alias) aliasToTeamName.set(f.team1_alias, f.team1)
      if (f.team2_alias) aliasToTeamName.set(f.team2_alias, f.team2)
    }
  }

  const rows = Array.from(aliasToTeamName.entries()).map(([alias, team_name]) => {
    const managerId = managerByAlias.get(alias)
    if (!managerId) throw new Error(`Manager no mapeado: ${alias}`)
    return { manager_id: managerId, season_id: season.id, team_name }
  })

  const { error } = await supabase
    .from('team_seasons')
    .upsert(rows, { onConflict: 'manager_id,season_id' })
  if (error) throw error

  return { teamSeasonsUpserted: rows.length }
}

export async function finalizeSeason(seasonName: string, championAlias: string) {
  const { supabase, managerByAlias } = await loadSeasonAndManagers(seasonName)

  const championId = managerByAlias.get(championAlias)
  if (!championId) throw new Error(`Campeón ${championAlias} no encontrado en managers`)

  const { error } = await supabase
    .from('seasons')
    .update({ is_current: false, champion_id: championId, has_full_data: true })
    .eq('name', seasonName)
  if (error) throw error

  return { seasonFinalized: seasonName, championAlias }
}
