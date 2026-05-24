import type { SupabaseClient } from '@supabase/supabase-js'
import { getApiStatsFixturesForCurrentSeason } from '@/lib/stats/api-fixtures'

export type ManagerCompareSide = {
  id: string
  alias: string
  teamName: string
  pj: number
  pg: number
  pe: number
  pp: number
  pf: number
  pc: number
  pts: number
  winPct: number
  avgPf: number
}

export type ManagerH2HBlock = {
  m1Wins: number
  m2Wins: number
  draws: number
  pf1: number
  pf2: number
  fixtures: number
}

export type ManagerCompareResult = {
  seasonLabel: string
  scopeAll: boolean
  m1: ManagerCompareSide
  m2: ManagerCompareSide
  h2h: ManagerH2HBlock
}

function accumulate(
  fixtures: {
    manager1_id: string
    manager2_id: string
    score1: number
    score2: number
  }[],
  id1: string,
  id2: string,
): { side1: Omit<ManagerCompareSide, 'alias' | 'id' | 'teamName'>; h2h: ManagerH2HBlock } {
  let pj = 0,
    pg = 0,
    pe = 0,
    pp = 0,
    pf = 0,
    pc = 0,
    pts = 0
  let h2h1 = 0,
    h2h2 = 0,
    h2hd = 0,
    h2hpf1 = 0,
    h2hpf2 = 0,
    h2hn = 0

  for (const f of fixtures) {
    const is1 = f.manager1_id === id1
    const is2 = f.manager2_id === id1
    if (!is1 && !is2) continue

    const my = is1 ? f.score1 : f.score2
    const their = is1 ? f.score2 : f.score1
    pj++
    pf += my
    pc += their
    if (my > their) {
      pg++
      pts += 3
    } else if (my === their) {
      pe++
      pts += 1
    } else {
      pp++
    }

    const isH2h =
      (f.manager1_id === id1 && f.manager2_id === id2) ||
      (f.manager1_id === id2 && f.manager2_id === id1)
    if (isH2h) {
      h2hn++
      const s1 = f.manager1_id === id1 ? f.score1 : f.score2
      const s2 = f.manager1_id === id1 ? f.score2 : f.score1
      h2hpf1 += s1
      h2hpf2 += s2
      if (s1 > s2) h2h1++
      else if (s1 < s2) h2h2++
      else h2hd++
    }
  }

  const winPct = pj > 0 ? Math.round((pg / pj) * 100) : 0
  const avgPf = pj > 0 ? Math.round((pf / pj) * 10) / 10 : 0

  return {
    side1: { pj, pg, pe, pp, pf, pc, pts, winPct, avgPf },
    h2h: {
      m1Wins: h2h1,
      m2Wins: h2h2,
      draws: h2hd,
      pf1: h2hpf1,
      pf2: h2hpf2,
      fixtures: h2hn,
    },
  }
}

export async function getManagerCompare(
  supabase: SupabaseClient,
  alias1: string,
  alias2: string,
  opts: { scope: 'season' | 'all'; seasonId?: string },
): Promise<ManagerCompareResult | null> {
  if (alias1 === alias2) return null

  const { data: managers } = await supabase
    .from('managers')
    .select('id, alias')
    .in('alias', [alias1, alias2])

  if (!managers || managers.length < 2) return null

  const m1 = managers.find((m) => m.alias === alias1)
  const m2 = managers.find((m) => m.alias === alias2)
  if (!m1 || !m2) return null

  const { data: seasons } = await supabase
    .from('seasons')
    .select('id, name, has_full_data, start_year, is_current')
    .eq('has_full_data', true)
    .order('start_year', { ascending: true })

  if (!seasons?.length) return null

  const currentSeason = seasons.find((s) => s.is_current) ?? null

  let seasonIds: string[]
  let seasonLabel: string
  let scopeAll: boolean

  if (opts.scope === 'all') {
    seasonIds = seasons.map((s) => s.id)
    seasonLabel = 'Todas las temporadas'
    scopeAll = true
  } else {
    const sid = opts.seasonId
    const s = seasons.find((x) => x.id === sid)
    if (!s) return null
    seasonIds = [s.id]
    seasonLabel = s.name
    scopeAll = false
  }

  const { data: fixtures } = await supabase
    .from('fixtures')
    .select('season_id, manager1_id, manager2_id, score1, score2')
    .in('season_id', seasonIds)

  type Row = {
    season_id: string
    manager1_id: string
    manager2_id: string
    score1: number
    score2: number
  }

  let list: Row[] = (fixtures ?? []) as Row[]

  if (currentSeason && seasonIds.includes(currentSeason.id)) {
    const apiRows = await getApiStatsFixturesForCurrentSeason(supabase, currentSeason.id)
    const apiMinimal: Row[] = apiRows.map((r) => ({
      season_id: r.season_id,
      manager1_id: r.manager1_id,
      manager2_id: r.manager2_id,
      score1: r.score1,
      score2: r.score2,
    }))
    list = [...list.filter((r) => r.season_id !== currentSeason.id), ...apiMinimal]
  }

  if (opts.scope === "season" && seasonIds.length === 1) {
    const only = seasonIds[0]
    const count = list.filter((r) => r.season_id === only).length
    if (count === 0) {
      const apiRows = await getApiStatsFixturesForCurrentSeason(supabase, only)
      const apiMinimal: Row[] = apiRows.map((r) => ({
        season_id: r.season_id,
        manager1_id: r.manager1_id,
        manager2_id: r.manager2_id,
        score1: r.score1,
        score2: r.score2,
      }))
      if (apiMinimal.length) {
        list = apiMinimal
      }
    }
  }

  const { data: teamSeasons } = await supabase
    .from('team_seasons')
    .select('manager_id, season_id, team_name')
    .in('manager_id', [m1.id, m2.id])
    .in('season_id', seasonIds)

  const teamName = (mid: string) => {
    const rows = (teamSeasons ?? []).filter((t) => t.manager_id === mid)
    if (!rows.length) return mid === m1.id ? m1.alias : m2.alias
    return rows[rows.length - 1].team_name
  }

  const r1 = accumulate(list, m1.id, m2.id)
  const r2 = accumulate(list, m2.id, m1.id)

  return {
    seasonLabel,
    scopeAll,
    m1: {
      id: m1.id,
      alias: m1.alias,
      teamName: teamName(m1.id),
      ...r1.side1,
    },
    m2: {
      id: m2.id,
      alias: m2.alias,
      teamName: teamName(m2.id),
      ...r2.side1,
    },
    h2h: r1.h2h,
  }
}
