export type PlayerStats = {
  minutes: number
  goals: number
  assists: number
  clean_sheet: number
  goals_conceded: number
  own_goals: number
  penalties_saved: number
  penalties_missed: number
  yellow_cards: number
  red_cards: number
  saves: number
  bonus: number
}

export function calcPuntosFantasy(stats: PlayerStats, position: string): number {
  let pts = 0

  // Minutos jugados
  if (stats.minutes >= 60) pts += 2
  else if (stats.minutes > 0) pts += 1

  // Goles
  if (position === 'GKP' || position === 'DEF') pts += stats.goals * 6
  else if (position === 'MID') pts += stats.goals * 5
  else pts += stats.goals * 4 // FWD

  // Asistencias
  pts += stats.assists * 3

  // Clean sheet
  if (stats.clean_sheet > 0) {
    if (position === 'GKP' || position === 'DEF') pts += 4
    else if (position === 'MID') pts += 1
  }

  // Goles recibidos (GKP/DEF: -1 cada 2)
  if (position === 'GKP' || position === 'DEF') {
    pts -= Math.floor(stats.goals_conceded / 2)
  }

  // Tarjetas
  pts -= stats.yellow_cards * 1
  pts -= stats.red_cards * 3

  // Goles en propia
  pts -= stats.own_goals * 2

  // Penales
  pts += stats.penalties_saved * 5
  pts -= stats.penalties_missed * 2

  // Atajadas (GKP: +1 cada 3)
  if (position === 'GKP') {
    pts += Math.floor(stats.saves / 3)
  }

  // Bonus
  pts += stats.bonus

  return pts
}

export function statLabels(stats: PlayerStats, position: string): string[] {
  const labels: string[] = []

  if (stats.goals > 0) labels.push(`${stats.goals} gol${stats.goals > 1 ? 'es' : ''}`)
  if (stats.assists > 0) labels.push(`${stats.assists} asist${stats.assists > 1 ? 's' : ''}`)
  if (stats.clean_sheet > 0 && (position === 'GKP' || position === 'DEF' || position === 'MID'))
    labels.push('CS')
  if (stats.saves >= 3) labels.push(`${stats.saves} atajadas`)
  if (stats.penalties_saved > 0) labels.push('Penal atajado')
  if (stats.bonus > 0) labels.push(`+${stats.bonus} bonus`)
  if (stats.yellow_cards > 0) labels.push('TA')
  if (stats.red_cards > 0) labels.push('TR')
  if (stats.own_goals > 0) labels.push('AG')
  if (stats.penalties_missed > 0) labels.push('Penal fallado')

  return labels
}
