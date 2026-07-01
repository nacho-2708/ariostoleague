import Link from "next/link"
import Eyebrow from "@/components/broadcast/eyebrow"

// Componente 7 · Closer / CTA band. Franja full-bleed lima con la mirada a la
// próxima temporada. Sin fecha confiable (getNextSeasonCountdown → null) el copy
// es sobrio: "Próximamente", nunca una fecha inventada.
export default function HomeCloser({
  seasonLabel,
  seasonName,
  countdown,
}: {
  seasonLabel: string
  seasonName: string
  countdown: { targetDate: string } | null
}) {
  return (
    <section className="mt-11 bg-lime text-ink">
      <div className="mx-auto flex max-w-[1200px] flex-col gap-6 px-6 py-11 md:flex-row md:items-center md:gap-8 md:px-10">
        <div>
          <Eyebrow tone="ink">Temporada {seasonName}</Eyebrow>
          <div className="mt-3 font-display text-[40px] uppercase leading-[0.86] sm:text-[52px]">
            {seasonLabel}
            <br />
            {countdown ? "Cuenta regresiva" : "Próximamente"}
          </div>
          <div className="mt-2.5 max-w-[44ch] font-meta text-sm text-ink/70">
            La 25/26 quedó en los libros. El Draft Day vuelve y los doce arrancan de nuevo a cero.
          </div>
        </div>
        <Link
          href="/standings"
          className="whitespace-nowrap rounded-md bg-ink px-[22px] py-[15px] font-meta text-xs font-bold uppercase tracking-[0.1em] text-lime md:ml-auto"
        >
          El Draft Day vuelve →
        </Link>
      </div>
    </section>
  )
}
