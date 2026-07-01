import { getGameInfo } from "@/lib/fpl-api"
import { createClient } from "@/lib/supabase/server"

export type LeagueState = {
  state: "offseason" | "in_season"
  // Siempre false hoy. Reservado para la tarjeta de modo en-vivo (diferida a la 26/27).
  live: boolean
  currentGw: number | null
  nextGw: number | null
  currentSeason: { id: string; name: string } | null
}

export async function getLeagueState(): Promise<LeagueState> {
  const supabase = await createClient()
  const [{ data: seasons }, gameInfo] = await Promise.all([
    supabase.from("seasons").select("id, name").eq("is_current", true).limit(1),
    getGameInfo(),
  ])

  const currentSeason = seasons?.[0] ?? null
  const seasonFinished = gameInfo.nextGw === null && gameInfo.currentGwFinished
  const state: LeagueState["state"] = !currentSeason || seasonFinished ? "offseason" : "in_season"

  return {
    state,
    live: false,
    currentGw: gameInfo.currentGw,
    nextGw: gameInfo.nextGw,
    currentSeason,
  }
}

export type NextSeasonCountdown = { targetDate: string } | null

// La FPL Draft API (getGameInfo) no expone ninguna fecha de inicio de temporada,
// solo el número de gameweek. Sin fuente confiable, se devuelve null a propósito
// para que el visual muestre un copy sobrio en vez de una fecha inventada.
export function getNextSeasonCountdown(): NextSeasonCountdown {
  return null
}
