import ManagerPhoto from "@/components/broadcast/manager-photo"

// Componente 5 · Ranking / lower-third. Ranking histórico (todas las temporadas)
// ordenado por títulos y luego % de victorias. El líder lleva wash azul.
// getHomeRankingHistorico sólo expone alias (sin nombre de club), así que la fila
// muestra el alias como etiqueta principal.
export type RankingRow = {
  alias: string
  titulos: number
  winPct: number
  avgPf: number
}

const GRID = "grid grid-cols-[44px_1fr_auto] items-center gap-3.5 md:grid-cols-[52px_1fr_88px_88px_88px]"

export default function RankingTable({ rows }: { rows: RankingRow[] }) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className={`${GRID} hidden px-[18px] pb-2 pt-1 md:grid`}>
        <span className="text-right font-meta text-[9px] font-bold uppercase tracking-[0.14em] text-gray-2">
          #
        </span>
        <span className="text-left font-meta text-[9px] font-bold uppercase tracking-[0.14em] text-gray-2">
          Manager
        </span>
        <span className="text-right font-meta text-[9px] font-bold uppercase tracking-[0.14em] text-gray-2">
          Títulos
        </span>
        <span className="text-right font-meta text-[9px] font-bold uppercase tracking-[0.14em] text-gray-2">
          % Vic
        </span>
        <span className="text-right font-meta text-[9px] font-bold uppercase tracking-[0.14em] text-gray-2">
          PF prom.
        </span>
      </div>

      {rows.map((r, i) => {
        const champ = i === 0
        return (
          <div
            key={r.alias}
            className={`${GRID} rounded-lg border px-[18px] py-2.5 transition-colors ${
              champ ? "border-blue/50" : "border-white/10 bg-ink-2 hover:border-white/[0.18]"
            }`}
            style={
              champ
                ? { background: "linear-gradient(90deg,rgba(34,48,255,0.16),var(--color-ink-2) 46%)" }
                : undefined
            }
          >
            <span
              className={`text-right font-display text-[26px] ${champ ? "text-lime" : "text-gray"}`}
            >
              {String(i + 1).padStart(2, "0")}
            </span>
            <span className="flex min-w-0 items-center gap-3">
              <ManagerPhoto alias={r.alias} size={38} />
              <span className="truncate font-ui text-[15px] font-extrabold text-chalk">
                {r.alias}
              </span>
            </span>
            <span className="text-right font-meta text-[15px] font-bold tabular-nums">
              {r.titulos ? (
                <span className="font-ui text-[13px] tracking-[1px] text-lime">
                  {"★".repeat(r.titulos)}
                </span>
              ) : (
                <span className="text-gray">—</span>
              )}
            </span>
            <span className="hidden text-right font-meta text-[15px] font-bold tabular-nums text-chalk md:block">
              {r.winPct}%
            </span>
            <span className="hidden text-right font-meta text-[15px] font-bold tabular-nums text-gray md:block">
              {r.avgPf}
            </span>
          </div>
        )
      })}
    </div>
  )
}
