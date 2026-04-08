import type { SupabaseClient } from "@supabase/supabase-js"
import { getApiStatsFixturesForCurrentSeason, type StatsFixtureRow } from "@/lib/stats/api-fixtures"

export type H2HMatchHighlight = {
  fixtureId: string
  seasonName: string
  gameweek: number | null
  score1: number
  score2: number
  alias1: string
  alias2: string
}

export type StreakWinDetail = {
  gameweek: number | null
  seasonName: string
  rivalAlias: string
  myScore: number
  rivalScore: number
}

export type H2HStreakInfo = {
  alias: string
  length: number
  streakType: "W"
  wins: StreakWinDetail[]
}

export type H2HPairSummary = {
  aliasA: string
  aliasB: string
  winsA: number
  winsB: number
  draws: number
  pfA: number
  pfB: number
  played: number
  matches: {
    seasonName: string
    gameweek: number | null
    scoreA: number
    scoreB: number
  }[]
}

export type H2HRecordsResult = {
  biggestWin: {
    margin: number
    winnerAlias: string
    loserAlias: string
    winnerScore: number
    loserScore: number
    match: H2HMatchHighlight
  } | null
  highestSingleScore: {
    points: number
    alias: string
    rivalAlias: string
    rivalScore: number
    match: H2HMatchHighlight
  }
  highestCombined: {
    total: number
    match: H2HMatchHighlight
  }
  highestScoringDraw: {
    points: number
    match: H2HMatchHighlight
  } | null
  h2hPairs: H2HPairSummary[]
  longestWinStreaks: H2HStreakInfo[]
  streaksApproximate: boolean
  fixtureCount: number
}

type FixtureRow = StatsFixtureRow

type SeasonMeta = { id: string; name: string; start_year: number }

function toHighlight(f: FixtureRow, seasonName: string): H2HMatchHighlight {
  return {
    fixtureId: f.id,
    seasonName,
    gameweek: f.gameweek,
    score1: f.score1,
    score2: f.score2,
    alias1: f.manager1?.alias ?? "",
    alias2: f.manager2?.alias ?? "",
  }
}

type ManagerEvent = {
  result: "W" | "D" | "L"
  startYear: number
  gw: number | null
  created: string
  seasonName: string
  rivalAlias: string
  myScore: number
  rivalScore: number
}

function findLongestWinStreakEvents(events: ManagerEvent[]): ManagerEvent[] {
  const sorted = [...events].sort((a, b) => {
    if (a.startYear !== b.startYear) return a.startYear - b.startYear
    const ga = a.gw ?? 999
    const gb = b.gw ?? 999
    if (ga !== gb) return ga - gb
    return a.created.localeCompare(b.created)
  })

  let bestStart = -1
  let bestEnd = -1
  let bestLen = 0
  let i = 0
  while (i < sorted.length) {
    if (sorted[i].result !== "W") {
      i++
      continue
    }
    let j = i
    while (j < sorted.length && sorted[j].result === "W") j++
    const len = j - i
    if (len > bestLen) {
      bestLen = len
      bestStart = i
      bestEnd = j - 1
    }
    i = j
  }
  if (bestStart < 0) return []
  return sorted.slice(bestStart, bestEnd + 1)
}

function computeLongestStreaks(
  fixtures: FixtureRow[],
  seasonMap: Map<string, SeasonMeta>,
): { streaks: H2HStreakInfo[]; approximate: boolean } {
  const byManager = new Map<string, ManagerEvent[]>()
  let anyNullGw = false

  for (const f of fixtures) {
    const meta = seasonMap.get(f.season_id)
    if (!meta) continue
    const a1 = f.manager1?.alias
    const a2 = f.manager2?.alias
    if (!a1 || !a2) continue
    if (f.gameweek == null) anyNullGw = true

    const sn = meta.name
    const isDraw = f.score1 === f.score2
    const m1Win = f.score1 > f.score2

    if (!byManager.has(f.manager1_id)) byManager.set(f.manager1_id, [])
    if (!byManager.has(f.manager2_id)) byManager.set(f.manager2_id, [])

    byManager.get(f.manager1_id)!.push({
      result: isDraw ? "D" : m1Win ? "W" : "L",
      startYear: meta.start_year,
      gw: f.gameweek,
      created: f.created_at,
      seasonName: sn,
      rivalAlias: a2,
      myScore: f.score1,
      rivalScore: f.score2,
    })
    byManager.get(f.manager2_id)!.push({
      result: isDraw ? "D" : m1Win ? "L" : "W",
      startYear: meta.start_year,
      gw: f.gameweek,
      created: f.created_at,
      seasonName: sn,
      rivalAlias: a1,
      myScore: f.score2,
      rivalScore: f.score1,
    })
  }

  const idToAlias = new Map<string, string>()
  for (const f of fixtures) {
    if (f.manager1?.alias) idToAlias.set(f.manager1_id, f.manager1.alias)
    if (f.manager2?.alias) idToAlias.set(f.manager2_id, f.manager2.alias)
  }

  const streakDetails: H2HStreakInfo[] = []
  for (const [id, arr] of byManager) {
    const winEvents = findLongestWinStreakEvents(arr)
    const len = winEvents.length
    if (len === 0) continue
    streakDetails.push({
      alias: idToAlias.get(id) ?? id,
      length: len,
      streakType: "W",
      wins: winEvents.map((e) => ({
        gameweek: e.gw,
        seasonName: e.seasonName,
        rivalAlias: e.rivalAlias,
        myScore: e.myScore,
        rivalScore: e.rivalScore,
      })),
    })
  }
  streakDetails.sort((a, b) => b.length - a.length)
  const top = streakDetails.slice(0, 5)

  return { streaks: top, approximate: anyNullGw }
}

function computeH2hPairs(fixtures: FixtureRow[], seasonMap: Map<string, SeasonMeta>): H2HPairSummary[] {
  type Agg = {
    aliasLo: string
    aliasHi: string
    winsLo: number
    winsHi: number
    draws: number
    pfLo: number
    pfHi: number
    matches: {
      seasonName: string
      gameweek: number | null
      scoreLo: number
      scoreHi: number
      startYear: number
      created: string
    }[]
  }

  const map = new Map<string, Agg>()

  for (const f of fixtures) {
    const meta = seasonMap.get(f.season_id)
    if (!meta) continue
    const a1 = f.manager1?.alias ?? ""
    const a2 = f.manager2?.alias ?? ""
    if (!a1 || !a2) continue

    const id1 = f.manager1_id
    const id2 = f.manager2_id
    const lo = id1 < id2 ? id1 : id2
    const hi = id1 < id2 ? id2 : id1

    let aliasLo: string
    let aliasHi: string
    let sLo: number
    let sHi: number
    if (f.manager1_id === lo) {
      aliasLo = a1
      aliasHi = a2
      sLo = f.score1
      sHi = f.score2
    } else {
      aliasLo = a2
      aliasHi = a1
      sLo = f.score2
      sHi = f.score1
    }

    const key = `${lo}::${hi}`
    let entry = map.get(key)
    if (!entry) {
      entry = {
        aliasLo,
        aliasHi,
        winsLo: 0,
        winsHi: 0,
        draws: 0,
        pfLo: 0,
        pfHi: 0,
        matches: [],
      }
      map.set(key, entry)
    }

    entry.pfLo += sLo
    entry.pfHi += sHi
    if (sLo > sHi) entry.winsLo++
    else if (sHi > sLo) entry.winsHi++
    else entry.draws++

    entry.matches.push({
      seasonName: meta.name,
      gameweek: f.gameweek,
      scoreLo: sLo,
      scoreHi: sHi,
      startYear: meta.start_year,
      created: f.created_at,
    })
  }

  const rows: H2HPairSummary[] = []
  for (const agg of map.values()) {
    const sortedMatches = [...agg.matches].sort((a, b) => {
      if (a.startYear !== b.startYear) return a.startYear - b.startYear
      const ga = a.gameweek ?? 999
      const gb = b.gameweek ?? 999
      if (ga !== gb) return ga - gb
      return a.created.localeCompare(b.created)
    })

    let row: H2HPairSummary = {
      aliasA: agg.aliasLo,
      aliasB: agg.aliasHi,
      winsA: agg.winsLo,
      winsB: agg.winsHi,
      draws: agg.draws,
      pfA: agg.pfLo,
      pfB: agg.pfHi,
      played: agg.winsLo + agg.winsHi + agg.draws,
      matches: sortedMatches.map((m) => ({
        seasonName: m.seasonName,
        gameweek: m.gameweek,
        scoreA: m.scoreLo,
        scoreB: m.scoreHi,
      })),
    }

    if (row.aliasA.localeCompare(row.aliasB, "es") > 0) {
      row = {
        aliasA: row.aliasB,
        aliasB: row.aliasA,
        winsA: row.winsB,
        winsB: row.winsA,
        draws: row.draws,
        pfA: row.pfB,
        pfB: row.pfA,
        played: row.played,
        matches: row.matches.map((m) => ({
          seasonName: m.seasonName,
          gameweek: m.gameweek,
          scoreA: m.scoreB,
          scoreB: m.scoreA,
        })),
      }
    }

    rows.push(row)
  }

  rows.sort((a, b) => {
    if (b.played !== a.played) return b.played - a.played
    return a.aliasA.localeCompare(b.aliasA) || a.aliasB.localeCompare(b.aliasB)
  })

  return rows
}

export async function getH2HRecords(
  supabase: SupabaseClient,
  opts: { scope: "season" | "all"; seasonId?: string },
): Promise<H2HRecordsResult | null> {
  const { data: seasons } = await supabase
    .from("seasons")
    .select("id, name, start_year, has_full_data, is_current")
    .eq("has_full_data", true)
    .order("start_year", { ascending: true })

  if (!seasons?.length) return null

  const currentSeason = seasons.find((s) => s.is_current) ?? null

  let seasonIds: string[]
  if (opts.scope === "season") {
    if (!opts.seasonId || !seasons.some((s) => s.id === opts.seasonId)) return null
    seasonIds = [opts.seasonId]
  } else {
    seasonIds = seasons.map((s) => s.id)
  }

  const seasonMap = new Map(seasons.map((s) => [s.id, s]))

  const { data: rawFromDb } = await supabase
    .from("fixtures")
    .select(
      `
      id, season_id, gameweek, created_at, score1, score2,
      manager1_id, manager2_id,
      manager1:managers!fixtures_manager1_id_fkey(alias),
      manager2:managers!fixtures_manager2_id_fkey(alias)
    `,
    )
    .in("season_id", seasonIds)

  let fixtures: FixtureRow[] = (rawFromDb ?? []) as unknown as FixtureRow[]

  if (currentSeason && seasonIds.includes(currentSeason.id)) {
    const apiRows = await getApiStatsFixturesForCurrentSeason(supabase, currentSeason.id)
    fixtures = [
      ...fixtures.filter((f) => f.season_id !== currentSeason.id),
      ...apiRows,
    ]
  }

  if (opts.scope === "season" && seasonIds.length === 1) {
    const only = seasonIds[0]
    const count = fixtures.filter((f) => f.season_id === only).length
    if (count === 0) {
      const apiRows = await getApiStatsFixturesForCurrentSeason(supabase, only)
      if (apiRows.length) {
        fixtures = apiRows
      }
    }
  }

  if (!fixtures.length) {
    return null
  }

  let biggestWin: H2HRecordsResult["biggestWin"] = null
  let highestSingle: H2HRecordsResult["highestSingleScore"] | null = null
  let highestCombined: H2HRecordsResult["highestCombined"] | null = null
  let highestDraw: H2HRecordsResult["highestScoringDraw"] | null = null

  for (const f of fixtures) {
    const sn = seasonMap.get(f.season_id)?.name ?? ""
    const h = toHighlight(f, sn)
    const s1 = f.score1
    const s2 = f.score2
    const a1 = f.manager1?.alias ?? ""
    const a2 = f.manager2?.alias ?? ""

    if (s1 !== s2) {
      const margin = Math.abs(s1 - s2)
      const m1Win = s1 > s2
      const winAlias = m1Win ? a1 : a2
      const loseAlias = m1Win ? a2 : a1
      const winScore = m1Win ? s1 : s2
      const loseScore = m1Win ? s2 : s1

      if (!biggestWin || margin > biggestWin.margin) {
        biggestWin = {
          margin,
          winnerAlias: winAlias,
          loserAlias: loseAlias,
          winnerScore: winScore,
          loserScore: loseScore,
          match: h,
        }
      }
    }

    const hi = Math.max(s1, s2)
    const hiAlias = s1 >= s2 ? a1 : a2
    const loAlias = s1 >= s2 ? a2 : a1
    const loScore = s1 >= s2 ? s2 : s1

    if (!highestSingle || hi > highestSingle.points) {
      highestSingle = {
        points: hi,
        alias: hiAlias,
        rivalAlias: loAlias,
        rivalScore: loScore,
        match: h,
      }
    }

    const sum = s1 + s2
    if (!highestCombined || sum > highestCombined.total) {
      highestCombined = { total: sum, match: h }
    }

    if (s1 === s2) {
      if (!highestDraw || s1 > highestDraw.points) {
        highestDraw = { points: s1, match: h }
      }
    }
  }

  if (!highestSingle || !highestCombined) {
    return null
  }

  const { streaks, approximate } = computeLongestStreaks(fixtures, seasonMap)
  const h2hPairs = computeH2hPairs(fixtures, seasonMap)

  return {
    biggestWin,
    highestSingleScore: highestSingle,
    highestCombined,
    highestScoringDraw: highestDraw,
    h2hPairs,
    longestWinStreaks: streaks,
    streaksApproximate: approximate,
    fixtureCount: fixtures.length,
  }
}
