"use client"

import { useRouter, useSearchParams } from "next/navigation"
import type {
  LeagueGwStarRow,
  ManagerPlayersBlock,
  PlayerBestGwForManager,
  PlayerGwPerformanceRow,
  PlayerListMode,
  PlayerPositionFilter,
  PlayerRowForManager,
} from "@/lib/stats/player-leaderboards"
import FplPlayerPhoto from "@/components/stats/fpl-player-photo"

const POSITIONS: { value: PlayerPositionFilter; label: string }[] = [
  { value: "ALL", label: "Todas" },
  { value: "GKP", label: "POR" },
  { value: "DEF", label: "DEF" },
  { value: "MID", label: "MED" },
  { value: "FWD", label: "DEL" },
]

const LIST_OPTIONS: { value: PlayerListMode; label: string; hint: string }[] = [
  {
    value: "gw_stars",
    label: "Actuaciones por jornada",
    hint: "Cada fila es una jornada; un jugador puede salir varias veces si rindió fuerte más de una vez.",
  },
  {
    value: "season_totals",
    label: "Totales de temporada",
    hint: "Una fila por jugador: puntos sumados en todas las jornadas en tu plantilla.",
  },
  {
    value: "best_gw_per_player",
    label: "Mejor jornada por jugador",
    hint: "Solo la mejor puntuación en una GW para cada jugador.",
  },
  {
    value: "league_stars",
    label: "Top de la liga",
    hint: "Las mejores puntuaciones de una sola jornada de cualquier manager (tabla única).",
  },
]

type Props = {
  managers: ManagerPlayersBlock[]
  leagueStars: LeagueGwStarRow[]
}

function RowTotal({ row, rank }: { row: PlayerRowForManager; rank: number }) {
  return (
    <tr className="border-b border-border/60 last:border-0">
      <td className="px-2 py-2 align-middle font-medium tabular-nums text-muted-foreground sm:px-3">{rank}</td>
      <td className="px-1 py-2 align-middle">
        <FplPlayerPhoto fplCode={row.fplCode} name={row.name} />
      </td>
      <td className="px-2 py-2 align-middle font-semibold text-foreground sm:px-3">{row.name}</td>
      <td className="hidden px-2 py-2 align-middle text-muted-foreground sm:table-cell sm:px-3">{row.club}</td>
      <td className="hidden px-2 py-2 align-middle text-muted-foreground md:table-cell md:px-3">{row.position}</td>
      <td className="px-2 py-2 text-right align-middle font-bold tabular-nums sm:px-3">{row.totalPoints}</td>
      <td className="px-2 py-2 text-right align-middle tabular-nums text-muted-foreground sm:px-3">{row.gameweeks}</td>
    </tr>
  )
}

function RowBestGw({ row, rank }: { row: PlayerBestGwForManager; rank: number }) {
  return (
    <tr className="border-b border-border/60 last:border-0">
      <td className="px-2 py-2 align-middle font-medium tabular-nums text-muted-foreground sm:px-3">{rank}</td>
      <td className="px-1 py-2 align-middle">
        <FplPlayerPhoto fplCode={row.fplCode} name={row.name} />
      </td>
      <td className="px-2 py-2 align-middle font-semibold text-foreground sm:px-3">{row.name}</td>
      <td className="hidden px-2 py-2 align-middle text-muted-foreground sm:table-cell sm:px-3">{row.club}</td>
      <td className="hidden px-2 py-2 align-middle text-muted-foreground md:table-cell md:px-3">{row.position}</td>
      <td className="px-2 py-2 text-right align-middle font-bold tabular-nums sm:px-3">{row.bestPoints}</td>
      <td className="px-2 py-2 align-middle tabular-nums text-muted-foreground sm:px-3">J{row.gameweek}</td>
    </tr>
  )
}

function RowGwStar({ row, rank }: { row: PlayerGwPerformanceRow; rank: number }) {
  return (
    <tr className="border-b border-border/60 last:border-0">
      <td className="px-2 py-2 align-middle font-medium tabular-nums text-muted-foreground sm:px-3">{rank}</td>
      <td className="px-1 py-2 align-middle">
        <FplPlayerPhoto fplCode={row.fplCode} name={row.name} />
      </td>
      <td className="px-2 py-2 align-middle font-semibold text-foreground sm:px-3">{row.name}</td>
      <td className="hidden px-2 py-2 align-middle text-muted-foreground sm:table-cell sm:px-3">{row.club}</td>
      <td className="hidden px-2 py-2 align-middle text-muted-foreground md:table-cell md:px-3">{row.position}</td>
      <td className="px-2 py-2 text-right align-middle font-bold tabular-nums sm:px-3">{row.points}</td>
      <td className="px-2 py-2 align-middle tabular-nums text-muted-foreground sm:px-3">J{row.gameweek}</td>
    </tr>
  )
}

function RowLeagueStar({ row, rank }: { row: LeagueGwStarRow; rank: number }) {
  return (
    <tr className="border-b border-border/60 last:border-0">
      <td className="px-2 py-2 align-middle font-medium tabular-nums text-muted-foreground sm:px-3">{rank}</td>
      <td className="px-1 py-2 align-middle">
        <FplPlayerPhoto fplCode={row.fplCode} name={row.name} />
      </td>
      <td className="px-2 py-2 align-middle font-semibold text-foreground sm:px-3">{row.name}</td>
      <td className="px-2 py-2 align-middle text-sm text-[#3e1a5b] sm:px-3">{row.managerAlias}</td>
      <td className="hidden px-2 py-2 align-middle text-muted-foreground sm:table-cell sm:px-3">{row.club}</td>
      <td className="px-2 py-2 text-right align-middle font-bold tabular-nums sm:px-3">{row.points}</td>
      <td className="px-2 py-2 align-middle tabular-nums text-muted-foreground sm:px-3">J{row.gameweek}</td>
    </tr>
  )
}

export default function PlayerLeaderboardTable({ managers, leagueStars }: Props) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const list = (searchParams.get("list") as PlayerListMode | null) ?? "gw_stars"
  const validList: PlayerListMode = ["gw_stars", "season_totals", "best_gw_per_player", "league_stars"].includes(list)
    ? list
    : "gw_stars"
  const pos = (searchParams.get("pos") as PlayerPositionFilter | null) ?? "ALL"
  const mgrFilter = searchParams.get("mgr")?.trim() ?? ""

  const listMeta = LIST_OPTIONS.find((o) => o.value === validList)

  function setParam(key: string, value: string) {
    const p = new URLSearchParams(searchParams.toString())
    if (value === "") p.delete(key)
    else p.set(key, value)
    router.push(`/stats/players?${p.toString()}`)
  }

  const filteredBlocks = mgrFilter ? managers.filter((m) => m.alias === mgrFilter) : managers

  const leagueFiltered = mgrFilter
    ? leagueStars.filter((r) => r.managerAlias === mgrFilter)
    : leagueStars

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end gap-3">
        <div className="min-w-[min(100%,280px)] flex-1">
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Listado
          </label>
          <select
            value={validList}
            onChange={(e) => setParam("list", e.target.value)}
            className="w-full max-w-md rounded-lg border border-border bg-white px-3 py-2 text-sm shadow-sm"
          >
            {LIST_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Posición
          </label>
          <select
            value={pos}
            onChange={(e) => setParam("pos", e.target.value)}
            className="rounded-lg border border-border bg-white px-3 py-2 text-sm shadow-sm"
          >
            {POSITIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Manager
          </label>
          <select
            value={mgrFilter}
            onChange={(e) => setParam("mgr", e.target.value)}
            className="min-w-[180px] rounded-lg border border-border bg-white px-3 py-2 text-sm shadow-sm"
          >
            <option value="">Todos</option>
            {managers.map((m) => (
              <option key={m.managerId} value={m.alias}>
                {m.alias}
              </option>
            ))}
          </select>
        </div>
      </div>

      {listMeta && (
        <p className="text-xs leading-relaxed text-muted-foreground">
          <span className="font-medium text-foreground">{listMeta.label}.</span> {listMeta.hint}
        </p>
      )}

      {validList === "league_stars" ? (
        <section className="rounded-xl border border-border bg-white shadow-sm">
          <div className="border-b border-border bg-[#3e1a5b]/5 px-4 py-3">
            <h3 className="text-base font-bold text-foreground">Liga — mejores actuaciones sueltas</h3>
            <p className="text-xs text-muted-foreground">
              {leagueFiltered.length} entradas
              {mgrFilter ? ` (filtrado: ${mgrFilter})` : ""}
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[380px] text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/40 text-left text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  <th className="px-2 py-2 sm:px-3">#</th>
                  <th className="px-1 py-2" aria-hidden />
                  <th className="px-2 py-2 sm:px-3">Jugador</th>
                  <th className="px-2 py-2 sm:px-3">Manager</th>
                  <th className="hidden px-2 py-2 sm:table-cell sm:px-3">Club</th>
                  <th className="px-2 py-2 text-right sm:px-3">Pts</th>
                  <th className="px-2 py-2 sm:px-3">GW</th>
                </tr>
              </thead>
              <tbody>
                {leagueFiltered.map((row, i) => (
                  <RowLeagueStar
                    key={`${row.managerId}-${row.playerId}-${row.gameweek}`}
                    row={row}
                    rank={i + 1}
                  />
                ))}
              </tbody>
            </table>
          </div>
          {leagueFiltered.length === 0 && (
            <p className="px-4 py-6 text-center text-sm text-muted-foreground">Sin datos para este filtro.</p>
          )}
        </section>
      ) : (
        <div className="space-y-8">
          {filteredBlocks.map((block) => {
            const rows =
              validList === "gw_stars"
                ? block.gwStars
                : validList === "season_totals"
                  ? block.byTotal
                  : block.bestSingleGw
            const subtitle =
              validList === "gw_stars"
                ? `${rows.length} mejores actuaciones sueltas (jugadores repetibles)`
                : validList === "season_totals"
                  ? `${rows.length} jugadores por puntos acumulados`
                  : `${rows.length} jugadores (solo su mejor GW)`

            return (
              <section key={block.managerId} className="rounded-xl border border-border bg-white shadow-sm">
                <div className="border-b border-border bg-[#3e1a5b]/5 px-4 py-3">
                  <h3 className="text-base font-bold text-foreground">{block.alias}</h3>
                  <p className="text-xs text-muted-foreground">{subtitle}</p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[340px] text-sm">
                    <thead>
                      <tr className="border-b border-border bg-muted/40 text-left text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                        <th className="px-2 py-2 sm:px-3">#</th>
                        <th className="px-1 py-2" aria-hidden />
                        <th className="px-2 py-2 sm:px-3">Jugador</th>
                        <th className="hidden px-2 py-2 sm:table-cell sm:px-3">Club</th>
                        <th className="hidden px-2 py-2 md:table-cell md:px-3">Pos</th>
                        {validList === "season_totals" ? (
                          <>
                            <th className="px-2 py-2 text-right sm:px-3">Pts</th>
                            <th className="px-2 py-2 text-right sm:px-3">Jorn.</th>
                          </>
                        ) : (
                          <>
                            <th className="px-2 py-2 text-right sm:px-3">Pts</th>
                            <th className="px-2 py-2 sm:px-3">GW</th>
                          </>
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {validList === "gw_stars" &&
                        (rows as PlayerGwPerformanceRow[]).map((row, i) => (
                          <RowGwStar key={`${row.playerId}-${row.gameweek}`} row={row} rank={i + 1} />
                        ))}
                      {validList === "season_totals" &&
                        (rows as PlayerRowForManager[]).map((row, i) => (
                          <RowTotal key={row.playerId} row={row} rank={i + 1} />
                        ))}
                      {validList === "best_gw_per_player" &&
                        (rows as PlayerBestGwForManager[]).map((row, i) => (
                          <RowBestGw key={row.playerId} row={row} rank={i + 1} />
                        ))}
                    </tbody>
                  </table>
                </div>
                {rows.length === 0 && (
                  <p className="px-4 py-6 text-center text-sm text-muted-foreground">Sin datos para este filtro.</p>
                )}
              </section>
            )
          })}
        </div>
      )}
    </div>
  )
}
