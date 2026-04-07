export type FixtureRow = {
  score1: number
  score2: number
  manager1: { id: string; alias: string }
  manager2: { id: string; alias: string }
}

export type StandingRow = {
  manager_id: string
  alias: string
  team_name: string
  pj: number  // jugados
  pg: number  // ganados
  pe: number  // empatados
  pp: number  // perdidos
  pf: number  // puntos a favor
  pc: number  // puntos en contra
  dp: number  // diferencia de puntos
  pts: number
}

export function calcularTabla(
  fixtures: FixtureRow[],
  teamNames: Map<string, string>
): StandingRow[] {
  const mapa = new Map<string, StandingRow>()

  function obtenerOCrear(id: string, alias: string): StandingRow {
    if (!mapa.has(id)) {
      const team_name = teamNames.get(id) ?? alias
      mapa.set(id, { manager_id: id, alias, team_name, pj: 0, pg: 0, pe: 0, pp: 0, pf: 0, pc: 0, dp: 0, pts: 0 })
    }
    return mapa.get(id)!
  }

  for (const f of fixtures) {
    const m1 = obtenerOCrear(f.manager1.id, f.manager1.alias)
    const m2 = obtenerOCrear(f.manager2.id, f.manager2.alias)

    m1.pj++; m2.pj++
    m1.pf += f.score1; m1.pc += f.score2
    m2.pf += f.score2; m2.pc += f.score1

    if (f.score1 > f.score2) {
      m1.pg++; m1.pts += 3
      m2.pp++
    } else if (f.score1 < f.score2) {
      m2.pg++; m2.pts += 3
      m1.pp++
    } else {
      m1.pe++; m1.pts++
      m2.pe++; m2.pts++
    }
  }

  for (const row of mapa.values()) {
    row.dp = row.pf - row.pc
  }

  return Array.from(mapa.values()).sort((a, b) => {
    if (b.pts !== a.pts) return b.pts - a.pts
    if (b.dp !== a.dp) return b.dp - a.dp
    return b.pf - a.pf
  })
}
