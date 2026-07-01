import ClubCrest from "./club-crest"

// Componente 3 · Franja / timeline de campeones (una celda por temporada).
// La temporada vigente se rellena en azul; el asterisco lima marca el guiño de
// Marculi (21/22, "campeón de la primera, cuando éramos cinco").
export type ChampionCell = {
  /** temporada corta, ej. "21/22" */
  season: string
  alias: string | null
  teamName: string | null
  /** títulos de carrera del campeón → estrellas del escudo */
  titles: number
  current: boolean
  asterisk: boolean
}

export default function ChampionsStrip({ cells }: { cells: ChampionCell[] }) {
  return (
    <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 md:grid-cols-5">
      {cells.map((c) => {
        const empty = !c.alias
        return (
          <div
            key={c.season}
            className={`relative rounded-lg border px-3.5 pb-4 pt-[18px] text-center transition-colors ${
              c.current
                ? "border-blue"
                : "border-white/10 bg-ink-2 hover:border-white/[0.18]"
            }`}
            style={
              c.current
                ? { background: "linear-gradient(180deg,var(--color-blue),var(--color-blue-deep))" }
                : undefined
            }
          >
            <div className="mb-3 flex justify-center">
              {empty ? (
                <div className="h-[52px] w-[46px]" aria-hidden />
              ) : (
                <ClubCrest
                  club={c.teamName ?? c.alias ?? "?"}
                  alias={c.alias ?? undefined}
                  titles={c.titles}
                  size={46}
                />
              )}
            </div>
            <div
              className={`font-meta text-xs font-bold tracking-[0.06em] ${
                c.current ? "text-white/80" : "text-gray"
              }`}
            >
              {c.season}
            </div>
            <div className="mt-2 font-display text-[19px] uppercase text-chalk">
              {c.alias ?? "—"}
              {c.asterisk && <span className="align-super text-[11px] text-lime">*</span>}
            </div>
            <div
              className={`mt-1.5 font-meta text-[9px] font-semibold uppercase tracking-[0.14em] ${
                c.current ? "text-white/70" : "text-gray-2"
              }`}
            >
              {empty ? "Sin campeón" : c.current ? "Campeón vigente" : "Campeón"}
            </div>
          </div>
        )
      })}
    </div>
  )
}
