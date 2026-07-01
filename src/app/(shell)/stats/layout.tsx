import { Suspense } from "react"
import StatsSubnav from "@/components/stats/stats-subnav"

export default function StatsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-gray">Estadísticas</p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight text-chalk">Ariosto League</h1>
        <p className="mt-1 text-sm text-gray">
          Récords de liga, jugadores fantasy y comparador H2H entre managers.
        </p>
      </div>
      <Suspense fallback={<div className="h-11 animate-pulse rounded-lg bg-muted/80" aria-hidden />}>
        <StatsSubnav />
      </Suspense>
      {children}
    </div>
  )
}
