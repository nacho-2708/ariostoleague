import ClubCrest from "@/components/broadcast/club-crest"
import Eyebrow from "@/components/broadcast/eyebrow"
import ManagerPhoto from "@/components/broadcast/manager-photo"
import Pill from "@/components/broadcast/pill"
import Roundel from "@/components/broadcast/roundel"

// Componente 2 · Hero campeón. Panel oscuro con degradé sutil de "luz de estudio"
// + roundel watermark del león. En offseason muestra al último campeón, sin
// jornada en curso.
export type HeroStat = {
  k: string
  value: string
  unit?: string
  stars?: number
  accent?: boolean
}

export type HeroPill = { label: string; variant: "lime" | "blue" | "ghost" }

export type HeroData = {
  seasonName: string | null
  statusLabel: string
  teamName: string
  alias: string
  managerSubline: string
  pills: HeroPill[]
  stats: HeroStat[]
  titles: number
}

export default function HomeHero({ hero }: { hero: HeroData }) {
  return (
    <section
      className="relative overflow-hidden border-b border-white/10"
      style={{
        background:
          "radial-gradient(120% 140% at 82% -20%, #182046 0%, var(--color-ink-2) 34%, var(--color-ink) 72%)",
      }}
    >
      <Roundel
        size={380}
        ring="#C6FF3A"
        className="pointer-events-none absolute right-[-90px] top-1/2 -translate-y-1/2 opacity-[0.06]"
      />
      <div className="relative mx-auto grid max-w-[1200px] grid-cols-1 items-center gap-10 px-6 py-12 md:grid-cols-[1fr_auto] md:px-10">
        {/* Columna izquierda */}
        <div className="min-w-0">
          <Eyebrow>
            Temporada {hero.seasonName ?? "—"} · {hero.statusLabel}
          </Eyebrow>

          {hero.pills.length > 0 && (
            <div className="mt-4 mb-3.5 flex flex-wrap gap-2">
              {hero.pills.map((p) => (
                <Pill key={p.label} variant={p.variant}>
                  {p.label}
                </Pill>
              ))}
            </div>
          )}

          <div className="flex items-center gap-6">
            <ClubCrest club={hero.teamName} alias={hero.alias} titles={hero.titles} size={92} />
            <div className="min-w-0">
              <div className="font-display text-[52px] uppercase leading-[0.84] tracking-[0.005em] text-chalk sm:text-[72px] lg:text-[88px]">
                {hero.teamName}
              </div>
              <div className="mt-4 flex flex-wrap items-center gap-3">
                <span className="font-ui text-base font-extrabold tracking-[0.02em] text-chalk">
                  {hero.alias}
                </span>
                <span className="font-meta text-[13px] tracking-[0.04em] text-gray">
                  {hero.managerSubline}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-2.5">
            {hero.stats.map((s) => (
              <div
                key={s.k}
                className="min-w-[96px] rounded-r-md bg-white/[0.04] px-[18px] pb-3 pt-[11px]"
                style={{ borderLeft: `3px solid ${s.accent ? "var(--color-lime)" : "var(--color-blue)"}` }}
              >
                <div className="font-meta text-[9px] font-semibold uppercase tracking-[0.16em] text-gray">
                  {s.k}
                </div>
                <div className="mt-[5px] flex items-baseline gap-1.5 font-display text-[34px] text-chalk">
                  {s.value}
                  {s.unit && (
                    <span className="font-meta text-[11px] font-bold tracking-[0.04em] text-gray">
                      {s.unit}
                    </span>
                  )}
                  {s.stars ? (
                    <span className="font-ui text-base tracking-[2px] text-lime">
                      {"★".repeat(s.stars)}
                    </span>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Columna derecha */}
        <div className="flex flex-col items-center gap-3.5">
          <ManagerPhoto alias={hero.alias} size={150} />
          <Pill variant="blue">{hero.alias}</Pill>
        </div>
      </div>
    </section>
  )
}
