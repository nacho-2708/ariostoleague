import { createClient } from "@/lib/supabase/server"

export type SeasonChampion = {
  seasonId: string
  seasonName: string
  championAlias: string | null
  championFullName: string | null
  teamName: string | null
}

export async function getSeasonChampion(seasonId: string): Promise<SeasonChampion | null> {
  const supabase = await createClient()
  const { data: season } = await supabase
    .from("seasons")
    .select("id, name, champion_id")
    .eq("id", seasonId)
    .maybeSingle()

  if (!season) return null
  if (!season.champion_id) {
    return {
      seasonId: season.id,
      seasonName: season.name,
      championAlias: null,
      championFullName: null,
      teamName: null,
    }
  }

  const [{ data: manager }, { data: teamSeason }] = await Promise.all([
    supabase.from("managers").select("alias, full_name").eq("id", season.champion_id).maybeSingle(),
    supabase
      .from("team_seasons")
      .select("team_name")
      .eq("manager_id", season.champion_id)
      .eq("season_id", season.id)
      .maybeSingle(),
  ])

  return {
    seasonId: season.id,
    seasonName: season.name,
    championAlias: manager?.alias ?? null,
    championFullName: manager?.full_name ?? null,
    teamName: teamSeason?.team_name ?? null,
  }
}

// Historial de campeones para la franja del Hero, ordenado de la temporada más
// vieja a la más nueva (21/22 → 25/26).
export async function getChampionsHistory(): Promise<SeasonChampion[]> {
  const supabase = await createClient()
  const { data: seasons } = await supabase
    .from("seasons")
    .select("id, name, champion_id")
    .order("start_year", { ascending: true })

  if (!seasons?.length) return []

  const championIds = [...new Set(seasons.map((s) => s.champion_id).filter((id): id is string => id !== null))]

  if (championIds.length === 0) {
    return seasons.map((season) => ({
      seasonId: season.id,
      seasonName: season.name,
      championAlias: null,
      championFullName: null,
      teamName: null,
    }))
  }

  const [{ data: managers }, { data: teamSeasons }] = await Promise.all([
    supabase.from("managers").select("id, alias, full_name").in("id", championIds),
    supabase.from("team_seasons").select("manager_id, season_id, team_name").in("manager_id", championIds),
  ])

  const managerMap = new Map((managers ?? []).map((m) => [m.id, m]))
  const teamNameMap = new Map((teamSeasons ?? []).map((t) => [`${t.manager_id}:${t.season_id}`, t.team_name]))

  return seasons.map((season) => {
    const manager = season.champion_id ? managerMap.get(season.champion_id) : undefined
    return {
      seasonId: season.id,
      seasonName: season.name,
      championAlias: manager?.alias ?? null,
      championFullName: manager?.full_name ?? null,
      teamName: season.champion_id ? teamNameMap.get(`${season.champion_id}:${season.id}`) ?? null : null,
    }
  })
}
