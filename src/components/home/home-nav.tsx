import Link from "next/link"
import LeagueLogo from "@/components/broadcast/league-logo"

// Componente 1 · Shell / nav Broadcast del Home. Barra sticky con roundel +
// wordmark y links hacia el resto de la app (que conserva su shell violeta).
// "Inicio" es el ítem activo porque este nav sólo vive en el Home.
const LINKS = [
  { label: "Inicio", href: "/", active: true },
  { label: "Tabla", href: "/standings" },
  { label: "Fixtures", href: "/fixtures" },
  { label: "Managers", href: "/managers" },
  { label: "Récords", href: "/stats/records" },
  { label: "Foro", href: "/forum" },
]

export default function HomeNav({
  seasonName,
  statusLabel,
}: {
  seasonName: string | null
  statusLabel: string
}) {
  return (
    <header className="sticky top-0 z-20 border-b border-white/10 bg-ink/[0.86] backdrop-blur-md backdrop-saturate-150">
      <div className="mx-auto flex h-[68px] max-w-[1200px] items-center gap-4 px-6 md:gap-7 md:px-10">
        <Link href="/" className="flex shrink-0 items-center gap-3 text-chalk">
          <LeagueLogo height={30} className="text-[19px]" />
        </Link>

        <nav className="flex flex-1 items-center gap-1 overflow-x-auto md:ml-2 md:flex-none [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={`shrink-0 rounded-[5px] px-3 py-2 font-meta text-xs font-semibold uppercase tracking-[0.06em] transition-colors ${
                l.active
                  ? "bg-lime text-ink"
                  : "text-gray hover:bg-ink-2 hover:text-chalk"
              }`}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto hidden items-center gap-2 font-meta text-[11px] font-semibold uppercase tracking-[0.12em] text-gray md:flex">
          <span className="h-1.5 w-1.5 rounded-full bg-gray-2" />
          {seasonName ? (
            <span>
              Temporada <b className="font-bold text-chalk">{seasonName}</b> · {statusLabel}
            </span>
          ) : (
            <span>{statusLabel}</span>
          )}
        </div>
      </div>
    </header>
  )
}
