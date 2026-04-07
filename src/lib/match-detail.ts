import { createClient } from '@/lib/supabase/server'
import { calcPuntosFantasy, statLabels, type PlayerStats } from '@/lib/fpl-points'

export type PlayerRow = {
  name: string
  position: string
  club: string
  is_starter: boolean
  minutes: number
  pts: number
  labels: string[]
}

export type MatchDetailData = {
  team1_name: string
  team2_name: string
  alias1: string
  alias2: string
  score1: number
  score2: number
  gw: number
  season: string
  players1: PlayerRow[]
  players2: PlayerRow[]
  // Features extra
  motm: PlayerRow & { team: string } | null  // Man of the match
  topScorer1: PlayerRow | null
  topScorer2: PlayerRow | null
}

// Si la temporada pedida no tiene datos, intenta con 2024/25 como fallback
export async function getMatchDetail(
  alias1: string,
  alias2: string,
  gw: number,
  seasonName: string,
  score1: number,
  score2: number,
  team1Name: string,
  team2Name: string,
): Promise<MatchDetailData | null> {
  const supabase = await createClient()

  // Buscar temporada
  const { data: season } = await supabase
    .from('seasons')
    .select('id')
    .eq('name', seasonName)
    .single()

  if (!season) return null

  // Buscar managers por alias
  const { data: managers } = await supabase
    .from('managers')
    .select('id, alias')
    .in('alias', [alias1, alias2])

  if (!managers || managers.length < 2) return null

  const m1 = managers.find((m) => m.alias === alias1)
  const m2 = managers.find((m) => m.alias === alias2)
  if (!m1 || !m2) return null

  // Buscar stats de jugadores para ambos managers, esta GW, esta temporada
  const { data: pgws } = await supabase
    .from('player_gameweeks')
    .select(`
      manager_id, is_starter, minutes,
      goals, assists, clean_sheet, goals_conceded,
      own_goals, penalties_saved, penalties_missed,
      yellow_cards, red_cards, saves, bonus,
      players(name, position, club)
    `)
    .eq('season_id', season.id)
    .eq('gameweek', gw)
    .in('manager_id', [m1.id, m2.id])

  if (!pgws || pgws.length === 0) return null

  function mapPlayers(managerId: string): PlayerRow[] {
    return (pgws ?? [])
      .filter((p: any) => p.manager_id === managerId)
      .map((p: any) => {
        const stats: PlayerStats = {
          minutes:           p.minutes,
          goals:             p.goals,
          assists:           p.assists,
          clean_sheet:       p.clean_sheet,
          goals_conceded:    p.goals_conceded,
          own_goals:         p.own_goals,
          penalties_saved:   p.penalties_saved,
          penalties_missed:  p.penalties_missed,
          yellow_cards:      p.yellow_cards,
          red_cards:         p.red_cards,
          saves:             p.saves,
          bonus:             p.bonus,
        }
        const pos = p.players.position
        return {
          name:       p.players.name,
          position:   pos,
          club:       p.players.club,
          is_starter: p.is_starter,
          minutes:    p.minutes,
          pts:        calcPuntosFantasy(stats, pos),
          labels:     statLabels(stats, pos),
        }
      })
      .sort((a: PlayerRow, b: PlayerRow) => {
        if (a.is_starter !== b.is_starter) return a.is_starter ? -1 : 1
        return b.pts - a.pts
      })
  }

  const players1 = mapPlayers(m1.id)
  const players2 = mapPlayers(m2.id)

  // Man of the match (mayor pts en cancha, entre ambos equipos)
  const starters1 = players1.filter((p) => p.is_starter).map((p) => ({ ...p, team: team1Name }))
  const starters2 = players2.filter((p) => p.is_starter).map((p) => ({ ...p, team: team2Name }))
  const allStarters = [...starters1, ...starters2]
  const motm = allStarters.length > 0
    ? allStarters.reduce((best, p) => p.pts > best.pts ? p : best)
    : null

  const topScorer1 = players1.filter((p) => p.is_starter)[0] ?? null
  const topScorer2 = players2.filter((p) => p.is_starter)[0] ?? null

  return {
    team1_name: team1Name,
    team2_name: team2Name,
    alias1,
    alias2,
    score1,
    score2,
    gw,
    season: seasonName,
    players1,
    players2,
    motm,
    topScorer1,
    topScorer2,
  }
}
