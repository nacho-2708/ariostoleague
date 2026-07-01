import Link from "next/link"
import LeagueLogo from "@/components/broadcast/league-logo"

// Componente 8 · Footer. Roundel + wordmark + divisa de la liga, links, y la nota
// al pie del asterisco (el guiño de Marculi, "campeón de la primera, cuando
// éramos cinco").
const FOOT_LINKS = [
  { label: "Inicio", href: "/" },
  { label: "Tabla", href: "/standings" },
  { label: "Fixtures", href: "/fixtures" },
  { label: "Managers", href: "/managers" },
  { label: "Récords", href: "/stats/records" },
  { label: "Foro", href: "/forum" },
]

export default function HomeFooter() {
  return (
    <footer className="border-t border-white/10 bg-ink">
      <div className="mx-auto flex max-w-[1200px] flex-wrap items-start gap-8 px-6 pb-8 pt-10 md:px-10">
        <div className="flex flex-col gap-1.5 text-chalk">
          <LeagueLogo height={44} className="text-[22px]" />
          <div className="font-meta text-[10px] font-semibold uppercase tracking-[0.2em] text-gray-2">
            Fundada · MMXXI · Doce clubes
          </div>
        </div>

        <nav className="flex flex-wrap gap-6 md:ml-auto">
          {FOOT_LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="font-meta text-xs font-semibold uppercase tracking-[0.06em] text-gray hover:text-chalk"
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="w-full border-t border-white/10 pt-4 font-meta text-xs italic text-gray-2">
          <b className="not-italic font-bold text-gray">*</b> La estrella de Marculi (21/22) lleva
          asterisco: campeón de la primera, cuando éramos cinco. Tema cerrado entre los doce.
        </div>
      </div>
    </footer>
  )
}
