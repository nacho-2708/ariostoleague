import ClubCrest from "@/components/broadcast/club-crest"
import Roundel from "@/components/broadcast/roundel"

// Componente 4 · Award card + bento. Grid de 4 columnas; el MVP featured ocupa 2
// columnas con la cifra grande y watermark del león. Premios sin manager (bota /
// asistencias) no muestran escudo; premios sin datos degradan a empty state.
export type Award = {
  label: string
  /** alias del manager para el escudo; null = premio sin manager asociado */
  crestAlias: string | null
  /** nombre de club para la inicial del escudo (si hay alias) */
  crestClub?: string
  who: string
  sub?: string
  value: string
  unit?: string
  feat?: boolean
  empty?: boolean
}

function AwardCard({ award }: { award: Award }) {
  const { feat, empty } = award

  return (
    <div
      className={`relative flex flex-col gap-3 overflow-hidden rounded-xl border p-4 transition-colors ${
        feat
          ? "border-white/[0.18] sm:col-span-2"
          : "border-white/10 hover:border-white/[0.18]"
      }`}
      style={
        feat
          ? { background: "linear-gradient(150deg,var(--color-ink-3),var(--color-ink-2))" }
          : { background: "var(--color-ink-2)" }
      }
    >
      {feat && (
        <Roundel
          size={170}
          ring="#C6FF3A"
          lionFill="#C6FF3A"
          lionCut="#12172A"
          className="pointer-events-none absolute -bottom-8 -right-8 opacity-10"
        />
      )}

      <div className="flex items-center gap-2.5">
        {award.crestAlias ? (
          <ClubCrest
            club={award.crestClub ?? award.crestAlias}
            alias={award.crestAlias}
            size={feat ? 54 : 40}
          />
        ) : null}
        <div className="font-meta text-[10px] font-bold uppercase tracking-[0.12em] text-lime">
          {award.label}
        </div>
      </div>

      <div className="mt-auto">
        {empty ? (
          <div className="font-meta text-[13px] text-gray-2">Sin datos esta temporada</div>
        ) : (
          <>
            <div
              className={`truncate font-ui font-extrabold tracking-[0.01em] text-chalk ${
                feat ? "text-2xl" : "text-base"
              }`}
            >
              {award.who}
            </div>
            {award.sub && (
              <div className="mt-0.5 font-meta text-[11px] text-gray">{award.sub}</div>
            )}
            <div
              className={`mt-2.5 flex items-baseline gap-[7px] font-display text-chalk ${
                feat ? "text-[54px]" : "text-[32px]"
              }`}
            >
              {award.value}
              {award.unit && (
                <span className="font-meta text-[11px] font-bold uppercase tracking-[0.04em] text-gray">
                  {award.unit}
                </span>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default function AwardsGrid({ awards }: { awards: Award[] }) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {awards.map((a) => (
        <AwardCard key={a.label} award={a} />
      ))}
    </div>
  )
}
