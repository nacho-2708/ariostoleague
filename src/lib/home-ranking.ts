import { getManagersOverview } from "@/lib/manager-stats"

export type HomeRankingRow = {
  managerId: string
  alias: string
  titulos: number
  winPct: number
  avgPf: number
}

// Ranking histórico del Home: recorte de getManagersOverview() (ya existe)
// a solo lo que necesita esa tarjeta, ordenado por títulos.
export async function getHomeRankingHistorico(): Promise<HomeRankingRow[]> {
  const overview = await getManagersOverview()

  return overview
    .map((m) => ({
      managerId: m.id,
      alias: m.alias,
      titulos: m.titulos,
      winPct: m.win_pct,
      avgPf: m.avg_pf,
    }))
    .sort((a, b) => b.titulos - a.titulos || b.winPct - a.winPct)
}
