import { Suspense } from "react"
import { createClient } from "@/lib/supabase/server"
import { getManagerCompare } from "@/lib/stats/manager-compare"
import ManagerCompareClient from "@/components/stats/manager-compare-client"

export default async function StatsComparePage({
  searchParams,
}: {
  searchParams: Promise<{ season?: string; m1?: string; m2?: string; cmp?: string }>
}) {
  const sp = await searchParams
  const supabase = await createClient()

  const [{ data: seasons }, { data: managers }] = await Promise.all([
    supabase
      .from("seasons")
      .select("id, name")
      .eq("has_full_data", true)
      .order("start_year", { ascending: false }),
    supabase.from("managers").select("id, alias").order("alias"),
  ])

  if (!seasons?.length) {
    return <p className="text-destructive">No hay temporadas disponibles.</p>
  }

  const selected = seasons.find((s) => s.name === sp.season) ?? seasons[0]
  const m1 = sp.m1?.trim() ?? ""
  const m2 = sp.m2?.trim() ?? ""
  const cmpAll = sp.cmp === "all"

  let compareData = null as Awaited<ReturnType<typeof getManagerCompare>>
  if (m1 && m2 && m1 !== m2) {
    compareData = await getManagerCompare(supabase, m1, m2, {
      scope: cmpAll ? "all" : "season",
      seasonId: selected.id,
    })
  }

  const managerOptions = (managers ?? []).map((m) => ({ id: m.id, alias: m.alias }))

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          {cmpAll ? "Todas las temporadas con datos" : `Temporada ${selected.name}`}
        </p>
        <h2 className="mt-1 text-xl font-bold text-foreground">Comparar dos managers</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Estadísticas acumuladas y cara a cara directo. El ámbito «temporada» usa el selector global de temporada
          arriba; «todas las temporadas» ignora ese selector para los totales.
        </p>
      </div>

      <Suspense fallback={<div className="h-48 animate-pulse rounded-xl bg-muted" />}>
        <ManagerCompareClient managers={managerOptions} data={compareData} />
      </Suspense>
    </div>
  )
}
