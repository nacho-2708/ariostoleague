import { createClient } from '@/lib/supabase/server'
import { getLeagueStandings, getLeagueFixtures, type Fixture } from '@/lib/fpl-api'

export type ManagerOverview = {
  id: string
  alias: string
  full_name: string
  // All-time stats (todas las temporadas con datos)
  titulos: number
  pj: number
  pg: number
  pe: number
  pp: number
  pf: number
  win_pct: number
  avg_pf: number   // promedio puntos a favor por partido
  best_season_pts: number
  best_season_name: string
  // Temporada actual
  current_team: string
  current_pos: number | null
  current_pts: number | null
  // Forma: últimos 5 resultados all-time ['W','D','L',...]
  forma: ('W' | 'D' | 'L')[]
}

export type FormaMatch = {
  gw?: number
  result: 'W' | 'D' | 'L'
  my_score: number
  rival_score: number
  rival_alias: string
  rival_team: string
}

export type GWDataPoint = {
  gw: number
  pf: number        // points scored this GW
  cumPF: number     // cumulative points for (fantasy pts)
  cumPts: number    // cumulative league points (3W+D)
  pos: number       // rank at end of this GW
}

export type ManagerProfile = ManagerOverview & {
  formaDetalle: FormaMatch[]  // last 5 with details
  seasons: {
    name: string
    team_name: string
    pos: number
    pj: number
    pg: number
    pe: number
    pp: number
    pf: number
    pc: number
    pts: number
    champion: boolean
  }[]
  h2h: {
    rival_alias: string
    rival_team: string
    pg: number
    pe: number
    pp: number
    pf: number
    pc: number
  }[]
  // Chart data — current season
  gwData: GWDataPoint[]
  allManagersGW: {
    alias: string
    team: string
    gwData: { gw: number; pos: number; cumPts: number }[]
  }[]
}

// ─── Overview de todos los managers (para el grid) ───────────────────────────

export async function getManagersOverview(): Promise<ManagerOverview[]> {
  const supabase = await createClient()

  const [
    { data: managers },
    { data: seasons },
    { data: fixtures },
    { data: teamSeasons },
    apiStandings,
    apiFixtureGroups,
  ] = await Promise.all([
    supabase.from('managers').select('id, alias, full_name'),
    supabase.from('seasons').select('id, name, champion_id, is_current, has_full_data'),
    supabase.from('fixtures').select(`
      season_id, score1, score2,
      manager1_id, manager2_id,
      manager1:managers!fixtures_manager1_id_fkey(id, alias),
      manager2:managers!fixtures_manager2_id_fkey(id, alias)
    `),
    supabase.from('team_seasons').select('manager_id, season_id, team_name'),
    getLeagueStandings(),
    getLeagueFixtures(),
  ])

  if (!managers || !seasons || !fixtures) return []

  const seasonsWithData = seasons.filter((s) => s.has_full_data)
  const teamMap = new Map(
    (teamSeasons ?? []).map((t) => [`${t.manager_id}:${t.season_id}`, t.team_name])
  )
  const currentSeason = seasons.find((s) => s.is_current)
  // Nombre de equipo actual desde la API (más preciso que team_seasons)
  const apiTeamMap = new Map(apiStandings.map((s) => [s.alias, s.team_name]))

  return managers.map((m) => {
    const titulos = seasons.filter((s) => s.champion_id === m.id).length

    // Stats all-time de fixtures históricos
    let pj = 0, pg = 0, pe = 0, pp = 0, pf = 0
    const historial: { score: number; rival: number; gw?: number; season_id: string }[] = []

    for (const f of fixtures as any[]) {
      const isM1 = f.manager1_id === m.id
      const isM2 = f.manager2_id === m.id
      if (!isM1 && !isM2) continue

      const myScore = isM1 ? f.score1 : f.score2
      const rivalScore = isM1 ? f.score2 : f.score1

      pj++; pf += myScore
      if (myScore > rivalScore) pg++
      else if (myScore === rivalScore) pe++
      else pp++

      historial.push({ score: myScore, rival: rivalScore, season_id: f.season_id })
    }

    // Agregar forma de la temporada actual (API)
    const apiCurrentFixtures = apiFixtureGroups
      .flatMap((g) => g.fixtures.filter((f) => f.finished && (f.team1_alias === m.alias || f.team2_alias === m.alias)))
    for (const f of apiCurrentFixtures) {
      const isT1 = f.team1_alias === m.alias
      historial.push({ score: isT1 ? f.score1 : f.score2, rival: isT1 ? f.score2 : f.score1, season_id: 'current' })
    }

    const forma = historial.slice(-5).map((h) =>
      h.score > h.rival ? 'W' : h.score === h.rival ? 'D' : 'L'
    ) as ('W' | 'D' | 'L')[]

    // Mejor temporada
    let best_season_pts = 0
    let best_season_name = ''
    for (const s of seasonsWithData) {
      const seasonFixtures = (fixtures as any[]).filter((f) => f.season_id === s.id)
      let pts = 0
      for (const f of seasonFixtures) {
        const isM1 = f.manager1_id === m.id
        const isM2 = f.manager2_id === m.id
        if (!isM1 && !isM2) continue
        const myScore = isM1 ? f.score1 : f.score2
        const rivalScore = isM1 ? f.score2 : f.score1
        if (myScore > rivalScore) pts += 3
        else if (myScore === rivalScore) pts += 1
      }
      if (pts > best_season_pts) {
        best_season_pts = pts
        best_season_name = s.name
      }
    }

    // Equipo actual: primero desde la API (más actualizado), luego team_seasons, luego alias
    const currentTeam = apiTeamMap.get(m.alias)
      ?? (currentSeason ? teamMap.get(`${m.id}:${currentSeason.id}`) : null)
      ?? m.alias

    return {
      id: m.id,
      alias: m.alias,
      full_name: m.full_name,
      titulos,
      pj,
      pg,
      pe,
      pp,
      pf,
      win_pct: pj > 0 ? Math.round((pg / pj) * 100) : 0,
      avg_pf: pj > 0 ? Math.round(pf / pj) : 0,
      best_season_pts,
      best_season_name,
      current_team: currentTeam,
      current_pos: null,
      current_pts: null,
      forma,
    }
  })
}

// ─── Perfil completo de un manager ───────────────────────────────────────────

export async function getManagerProfile(alias: string): Promise<ManagerProfile | null> {
  const supabase = await createClient()

  const [
    { data: manager },
    { data: allManagers },
    { data: seasons },
    { data: allFixtures },
    { data: teamSeasons },
  ] = await Promise.all([
    supabase.from('managers').select('id, alias, full_name').ilike('alias', alias).single(),
    supabase.from('managers').select('id, alias'),
    supabase.from('seasons').select('id, name, champion_id, is_current, has_full_data').order('start_year'),
    supabase.from('fixtures').select(`
      season_id, score1, score2, manager1_id, manager2_id
    `),
    supabase.from('team_seasons').select('manager_id, season_id, team_name'),
  ])

  if (!manager || !allFixtures || !seasons) return null

  const teamMap = new Map(
    (teamSeasons ?? []).map((t) => [`${t.manager_id}:${t.season_id}`, t.team_name])
  )
  const currentSeason = seasons.find((s) => s.is_current)

  // Datos de la temporada actual desde la API
  const [apiStandings, apiFixtures] = await Promise.all([
    getLeagueStandings(),
    getLeagueFixtures(),
  ])

  // Mapa alias → datos de la API
  const apiStandingMap = new Map(apiStandings.map((s) => [s.alias, s]))
  const myApiStanding = apiStandingMap.get(manager.alias)

  // Nombre de equipo actual desde la API
  const currentTeamName = myApiStanding?.team_name ?? manager.alias

  // Mapa id → alias para historial detallado
  const managerIdToAlias = new Map((allManagers ?? []).map((m) => [m.id, m.alias]))

  // Stats all-time (históricas de Supabase)
  let pj = 0, pg = 0, pe = 0, pp = 0, pf = 0, titulos = 0
  const historial: { score: number; rival: number }[] = []
  // Historial con info de rival para formaDetalle
  const historialDetallado: { score: number; rival: number; rival_alias: string; rival_team: string; gw?: number }[] = []

  // Stats por temporada — históricas (Supabase)
  const seasonStats = seasons
    .filter((s) => s.has_full_data && !s.is_current)
    .map((s) => {
      const sf = allFixtures.filter(
        (f) => f.season_id === s.id && (f.manager1_id === manager.id || f.manager2_id === manager.id)
      )
      let spj = 0, spg = 0, spe = 0, spp = 0, spf = 0, spc = 0, spts = 0
      for (const f of sf) {
        const isM1 = f.manager1_id === manager.id
        const my = isM1 ? f.score1 : f.score2
        const rv = isM1 ? f.score2 : f.score1
        spj++; spf += my; spc += rv
        if (my > rv) { spg++; spts += 3 }
        else if (my === rv) { spe++; spts++ }
        else spp++
        const rivalId = isM1 ? f.manager2_id : f.manager1_id
        const rivalAlias = managerIdToAlias.get(rivalId) ?? ''
        historial.push({ score: my, rival: rv })
        historialDetallado.push({ score: my, rival: rv, rival_alias: rivalAlias, rival_team: rivalAlias })
        pj++; pf += my
        if (my > rv) pg++
        else if (my === rv) pe++
        else pp++
      }
      const isChamp = s.champion_id === manager.id
      if (isChamp) titulos++

      // Posición: calcular tabla de esa temporada
      const allTeamFixtures = allFixtures.filter((f) => f.season_id === s.id)
      const ptsMap = new Map<string, number>()
      for (const f of allTeamFixtures) {
        if (!ptsMap.has(f.manager1_id)) ptsMap.set(f.manager1_id, 0)
        if (!ptsMap.has(f.manager2_id)) ptsMap.set(f.manager2_id, 0)
        const my1 = f.score1 > f.score2 ? 3 : f.score1 === f.score2 ? 1 : 0
        const my2 = f.score2 > f.score1 ? 3 : f.score1 === f.score2 ? 1 : 0
        ptsMap.set(f.manager1_id, (ptsMap.get(f.manager1_id) ?? 0) + my1)
        ptsMap.set(f.manager2_id, (ptsMap.get(f.manager2_id) ?? 0) + my2)
      }
      const sorted = [...ptsMap.entries()].sort((a, b) => b[1] - a[1])
      const pos = sorted.findIndex(([id]) => id === manager.id) + 1

      return {
        name: s.name,
        team_name: teamMap.get(`${manager.id}:${s.id}`) ?? manager.alias,
        pos,
        pj: spj, pg: spg, pe: spe, pp: spp,
        pf: spf, pc: spc, pts: spts,
        champion: isChamp,
      }
    })

  // Todos los fixtures finalizados de este manager en la temporada actual (orden cronológico por GW)
  const allMyApiFixtures = apiFixtures
    .sort((a, b) => a.gw - b.gw)
    .flatMap((g) =>
      g.fixtures
        .filter((f) => f.finished && (f.team1_alias === manager.alias || f.team2_alias === manager.alias))
        .map((f) => ({ ...f, gw: g.gw }))
    )

  // Agregar temporada actual desde la API
  if (myApiStanding && currentSeason) {
    const currentPos = apiStandings.findIndex((s) => s.alias === manager.alias) + 1

    for (const f of allMyApiFixtures) {
      const isT1 = f.team1_alias === manager.alias
      const my = isT1 ? f.score1 : f.score2
      const rv = isT1 ? f.score2 : f.score1
      const rivalAlias = isT1 ? f.team2_alias : f.team1_alias
      const rivalTeam = isT1 ? f.team2 : f.team1
      historial.push({ score: my, rival: rv })
      historialDetallado.push({ score: my, rival: rv, rival_alias: rivalAlias, rival_team: rivalTeam, gw: f.gw })
      pj++; pf += my
      if (my > rv) pg++
      else if (my === rv) pe++
      else pp++
    }

    seasonStats.push({
      name: currentSeason.name,
      team_name: currentTeamName,
      pos: currentPos,
      pj: myApiStanding.pj,
      pg: myApiStanding.pg,
      pe: myApiStanding.pe,
      pp: myApiStanding.pp,
      pf: myApiStanding.pf,
      pc: myApiStanding.pc,
      pts: myApiStanding.pts,
      champion: false,
    })
  }

  const forma = historial.slice(-5).map((h) =>
    h.score > h.rival ? 'W' : h.score === h.rival ? 'D' : 'L'
  ) as ('W' | 'D' | 'L')[]

  // FormaDetalle: últimos 5 partidos con info de rival
  // Priorizar los de la temporada actual (tienen rival_team), complementar con históricos genéricos
  const formaDetalle: FormaMatch[] = historialDetallado.slice(-5).map((h) => ({
    gw: h.gw,
    result: (h.score > h.rival ? 'W' : h.score === h.rival ? 'D' : 'L') as 'W' | 'D' | 'L',
    my_score: h.score,
    rival_score: h.rival,
    rival_alias: h.rival_alias,
    rival_team: h.rival_team,
  }))

  // H2H contra cada rival (históricas + API actual)
  const h2h = (allManagers ?? [])
    .filter((m) => m.id !== manager.id)
    .map((rival) => {
      // Histórico desde Supabase
      const rf = allFixtures.filter(
        (f) =>
          (f.manager1_id === manager.id && f.manager2_id === rival.id) ||
          (f.manager2_id === manager.id && f.manager1_id === rival.id)
      )
      let rpg = 0, rpe = 0, rpp = 0, rpf = 0, rpc = 0
      for (const f of rf) {
        const isM1 = f.manager1_id === manager.id
        const my = isM1 ? f.score1 : f.score2
        const rv = isM1 ? f.score2 : f.score1
        rpf += my; rpc += rv
        if (my > rv) rpg++
        else if (my === rv) rpe++
        else rpp++
      }

      // Agregar partidos de la temporada actual desde la API
      const rivalApiStanding = apiStandingMap.get(rival.alias)
      if (rivalApiStanding) {
        const h2hApiFixtures = apiFixtures
          .flatMap((g) => g.fixtures.filter((f) =>
            f.finished && (
              (f.team1_alias === manager.alias && f.team2_alias === rival.alias) ||
              (f.team2_alias === manager.alias && f.team1_alias === rival.alias)
            )
          ))
        for (const f of h2hApiFixtures) {
          const isT1 = f.team1_alias === manager.alias
          const my = isT1 ? f.score1 : f.score2
          const rv = isT1 ? f.score2 : f.score1
          rpf += my; rpc += rv
          if (my > rv) rpg++
          else if (my === rv) rpe++
          else rpp++
        }
      }

      const rivalCurrentTeam = apiStandingMap.get(rival.alias)?.team_name
        ?? (currentSeason ? teamMap.get(`${rival.id}:${currentSeason.id}`) : null)
        ?? rival.alias

      return {
        rival_alias: rival.alias,
        rival_team: rivalCurrentTeam,
        pg: rpg, pe: rpe, pp: rpp, pf: rpf, pc: rpc,
      }
    })
    .sort((a, b) => (b.pg + b.pe + b.pp) - (a.pg + a.pe + a.pp))

  const best = seasonStats.reduce(
    (b, s) => (s.pts > b.pts ? s : b),
    { pts: 0, name: '' }
  )

  const currentPos = myApiStanding
    ? apiStandings.findIndex((s) => s.alias === manager.alias) + 1
    : null

  // ── Chart data: GW-by-GW progression para la temporada actual ──────────────
  // Builds cumulative table at each GW using the API fixtures
  const gwData: GWDataPoint[] = []
  const allManagersGW: { alias: string; team: string; gwData: { gw: number; pos: number; cumPts: number }[] }[] = []

  const sortedGWGroups = [...apiFixtures].sort((a, b) => a.gw - b.gw).filter((g) => g.finished)

  if (sortedGWGroups.length > 0) {
    // Track cumulative wins/draws/losses and PF for all managers
    const cumWins = new Map<string, number>()
    const cumDraws = new Map<string, number>()
    const cumPF = new Map<string, number>()
    const allAliases = apiStandings.map((s) => s.alias)

    for (const alias of allAliases) {
      cumWins.set(alias, 0)
      cumDraws.set(alias, 0)
      cumPF.set(alias, 0)
    }

    // Track per-manager GW arrays
    const aliasGWData = new Map<string, { gw: number; pos: number; cumPts: number }[]>(
      allAliases.map((a) => [a, []])
    )

    for (const group of sortedGWGroups) {
      for (const f of group.fixtures) {
        if (!f.team1_alias || !f.team2_alias) continue
        cumPF.set(f.team1_alias, (cumPF.get(f.team1_alias) ?? 0) + f.score1)
        cumPF.set(f.team2_alias, (cumPF.get(f.team2_alias) ?? 0) + f.score2)
        if (f.score1 > f.score2) {
          cumWins.set(f.team1_alias, (cumWins.get(f.team1_alias) ?? 0) + 1)
        } else if (f.score1 === f.score2) {
          cumDraws.set(f.team1_alias, (cumDraws.get(f.team1_alias) ?? 0) + 1)
          cumDraws.set(f.team2_alias, (cumDraws.get(f.team2_alias) ?? 0) + 1)
        } else {
          cumWins.set(f.team2_alias, (cumWins.get(f.team2_alias) ?? 0) + 1)
        }
      }

      // Rank all managers at this GW
      const ranked = allAliases
        .map((a) => ({
          alias: a,
          pts: (cumWins.get(a) ?? 0) * 3 + (cumDraws.get(a) ?? 0),
          pf: cumPF.get(a) ?? 0,
        }))
        .sort((a, b) => b.pts - a.pts || b.pf - a.pf)

      for (const [idx, entry] of ranked.entries()) {
        aliasGWData.get(entry.alias)?.push({ gw: group.gw, pos: idx + 1, cumPts: entry.pts })
      }

      // Add this manager's data point
      const myGWFixture = group.fixtures.find(
        (f) => f.team1_alias === manager.alias || f.team2_alias === manager.alias
      )
      if (myGWFixture) {
        const isT1 = myGWFixture.team1_alias === manager.alias
        const myPF = isT1 ? myGWFixture.score1 : myGWFixture.score2
        const myPos = ranked.findIndex((r) => r.alias === manager.alias) + 1
        const myCumPts = ranked.find((r) => r.alias === manager.alias)?.pts ?? 0
        gwData.push({
          gw: group.gw,
          pf: myPF,
          cumPF: cumPF.get(manager.alias) ?? 0,
          cumPts: myCumPts,
          pos: myPos,
        })
      }
    }

    // Build allManagersGW
    const teamNameMap = new Map(apiStandings.map((s) => [s.alias, s.team_name]))
    for (const alias of allAliases) {
      allManagersGW.push({
        alias,
        team: teamNameMap.get(alias) ?? alias,
        gwData: aliasGWData.get(alias) ?? [],
      })
    }
  }

  return {
    id: manager.id,
    alias: manager.alias,
    full_name: manager.full_name,
    titulos,
    pj,
    pg,
    pe,
    pp,
    pf,
    win_pct: pj > 0 ? Math.round((pg / pj) * 100) : 0,
    avg_pf: pj > 0 ? Math.round(pf / pj) : 0,
    best_season_pts: best.pts,
    best_season_name: best.name,
    current_team: currentTeamName,
    current_pos: currentPos,
    current_pts: myApiStanding?.pts ?? null,
    forma,
    formaDetalle,
    seasons: seasonStats,
    h2h,
    gwData,
    allManagersGW,
  }
}
