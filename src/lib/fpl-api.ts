import type { StandingRow } from './standings'

const FPL_API = 'https://draft.premierleague.com/api'
export const LEAGUE_ID = 1722

// Mapeo de FPL league_entry ID → alias interno
const ENTRY_ALIAS: Record<number, string> = {
  5404:   'Marculi',
  5644:   'RG',
  6077:   'Papezar',
  6381:   'Sir Jagger',
  7564:   'Varela',
  13674:  'Canter',
  14332:  'Wawri',
  60400:  'Cunha',
  203543: 'Manoloto',
  203646: 'Ignagoat',
  206156: 'Bebito',
  226549: 'Comandante',
}

// ─── Tipos ───────────────────────────────────────────────────────────────────

type LeagueEntry = {
  id: number
  entry_name: string
}

type ApiMatch = {
  event: number
  finished: boolean
  started: boolean
  league_entry_1: number
  league_entry_1_points: number
  league_entry_2: number
  league_entry_2_points: number
}

type ApiStanding = {
  rank: number
  league_entry: number
  matches_won: number
  matches_drawn: number
  matches_lost: number
  points_for: number
  points_against: number
  total: number
}

type ApiGame = {
  current_event: number
  current_event_finished: boolean
  next_event: number
}

type LeagueDetails = {
  league_entries: LeagueEntry[]
  standings: ApiStanding[]
  matches: ApiMatch[]
}

export type Fixture = {
  gw: number
  finished: boolean
  team1: string
  team1_alias: string
  score1: number
  team2: string
  team2_alias: string
  score2: number
}

export type GameweekGroup = {
  gw: number
  finished: boolean
  fixtures: Fixture[]
}

export type GameInfo = {
  currentGw: number
  currentGwFinished: boolean
  nextGw: number
}

// ─── Fetcher compartido (cachea 5 min) ───────────────────────────────────────

async function fetchLeagueDetails(): Promise<LeagueDetails> {
  const res = await fetch(`${FPL_API}/league/${LEAGUE_ID}/details`, {
    next: { revalidate: 300 },
  })
  if (!res.ok) throw new Error(`FPL API error: ${res.status}`)
  return res.json()
}

// ─── Standings ────────────────────────────────────────────────────────────────

export async function getLeagueStandings(): Promise<StandingRow[]> {
  const data = await fetchLeagueDetails()
  const teamNames = new Map(data.league_entries.map((e) => [e.id, e.entry_name]))

  return [...data.standings]
    .sort((a, b) => a.rank - b.rank)
    .map((s) => ({
      manager_id: String(s.league_entry),
      alias:      ENTRY_ALIAS[s.league_entry] ?? String(s.league_entry),
      team_name:  teamNames.get(s.league_entry) ?? '',
      pj: s.matches_won + s.matches_drawn + s.matches_lost,
      pg: s.matches_won,
      pe: s.matches_drawn,
      pp: s.matches_lost,
      pf: s.points_for,
      pc: s.points_against,
      dp: s.points_for - s.points_against,
      pts: s.total,
    }))
}

// ─── Fixtures ─────────────────────────────────────────────────────────────────

export async function getLeagueFixtures(): Promise<GameweekGroup[]> {
  const data = await fetchLeagueDetails()
  const teamNames = new Map(data.league_entries.map((e) => [e.id, e.entry_name]))

  // Agrupar partidos por GW
  const gwMap = new Map<number, { finished: boolean; fixtures: Fixture[] }>()

  for (const m of data.matches) {
    if (!gwMap.has(m.event)) {
      gwMap.set(m.event, { finished: m.finished, fixtures: [] })
    }
    const group = gwMap.get(m.event)!
    // Una GW está terminada si todos sus partidos lo están
    if (!m.finished) group.finished = false

    group.fixtures.push({
      gw:          m.event,
      finished:    m.finished,
      team1:       teamNames.get(m.league_entry_1) ?? String(m.league_entry_1),
      team1_alias: ENTRY_ALIAS[m.league_entry_1] ?? '',
      score1:      m.league_entry_1_points,
      team2:       teamNames.get(m.league_entry_2) ?? String(m.league_entry_2),
      team2_alias: ENTRY_ALIAS[m.league_entry_2] ?? '',
      score2:      m.league_entry_2_points,
    })
  }

  return Array.from(gwMap.entries())
    .sort((a, b) => a[0] - b[0])
    .map(([gw, { finished, fixtures }]) => ({ gw, finished, fixtures }))
}

// ─── Helpers de slug para aliases ─────────────────────────────────────────────

// Convierte alias → slug URL-safe ("Sir Jagger" → "sir-jagger", "RG" → "rg")
export function aliasToSlug(alias: string): string {
  return alias.toLowerCase().replace(/\s+/g, '-')
}

// Convierte slug → alias canónico ("sir-jagger" → "Sir Jagger", "rg" → "RG")
const ALL_ALIASES = Object.values(ENTRY_ALIAS)
export function slugToAlias(slug: string): string {
  return ALL_ALIASES.find((a) => aliasToSlug(a) === slug)
    ?? (slug.charAt(0).toUpperCase() + slug.slice(1))
}

// ─── Info de juego (GW actual) ────────────────────────────────────────────────

export async function getGameInfo(): Promise<GameInfo> {
  const res = await fetch(`${FPL_API}/game`, {
    next: { revalidate: 300 },
  })
  if (!res.ok) throw new Error(`FPL API game error: ${res.status}`)
  const data: ApiGame = await res.json()
  return {
    currentGw:         data.current_event,
    currentGwFinished: data.current_event_finished,
    nextGw:            data.next_event,
  }
}
