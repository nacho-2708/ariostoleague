// Lógica pura (sin DB ni red) de los guardas anti-fallo-silencioso del sync de
// player_gameweeks. Vive aislada de fpl-sync.ts (que importa Supabase y la FPL
// API) para poder testearla sin levantar Next ni tocar la DB.
//
// Contexto: el sync venía goteando datos y devolvía "todo OK" igual
// (diagnóstico Fase 1, commit 6acc6bb). Estas funciones son los chequeos que
// convierten un sync incompleto en un fallo ruidoso.

// Una plantilla de FPL Draft tiene 15 jugadores (11 titulares + 4 banco).
export const SQUAD_SIZE = 15
// Una temporada de Premier League tiene 38 gameweeks.
export const TOTAL_GAMEWEEKS = 38

export type GWSyncReport = {
  gw: number
  expectedRows: number
  savedRows: number
  complete: boolean
  playersUpserted: number
  errors: { alias: string; error: string }[]
}

// Filas esperadas para una GW completa = managers × tamaño de plantilla.
export function expectedRowsPerGW(managerCount: number): number {
  return SQUAD_SIZE * managerCount
}

// (a) Chequeo de completitud: una GW está completa solo si guardó al menos lo
// esperado Y no hubo ningún error por manager. Cualquier faltante = incompleta.
export function isGWComplete(savedRows: number, expectedRows: number, errorCount: number): boolean {
  return savedRows >= expectedRows && errorCount === 0
}

// (b) Decisión de status del endpoint. Si alguna GW quedó incompleta, el sync
// NO devuelve verde: ok:false + HTTP 422. Antes devolvía 200 ok:true siempre.
export function summarizeReports(reports: GWSyncReport[]): {
  ok: boolean
  status: number
  totalSavedRows: number
  incompleteGws: { gw: number; saved: number; expected: number; errors: GWSyncReport['errors'] }[]
} {
  const incompleteGws = reports
    .filter((r) => !r.complete)
    .map((r) => ({ gw: r.gw, saved: r.savedRows, expected: r.expectedRows, errors: r.errors }))
  const ok = incompleteGws.length === 0
  const totalSavedRows = reports.reduce((sum, r) => sum + r.savedRows, 0)
  return { ok, status: ok ? 200 : 422, totalSavedRows, incompleteGws }
}

// (c) Rango de GWs a sincronizar. Una temporada terminada (is_current=false) se
// sincroniza por rango fijo 1..38, ignorando la GW en vivo: tras la rotación a
// la temporada siguiente, getGameInfo() devolvería una GW baja de la nueva
// temporada y under-syncaría la vieja en silencio.
export function resolveUpTo(
  isCurrent: boolean,
  live: { currentGw: number; currentGwFinished: boolean },
): number {
  if (!isCurrent) return TOTAL_GAMEWEEKS
  return live.currentGwFinished ? live.currentGw : live.currentGw - 1
}
