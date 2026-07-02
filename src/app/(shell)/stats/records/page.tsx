import { Suspense } from "react"
import { createClient } from "@/lib/supabase/server"
import { getH2HRecords } from "@/lib/stats/h2h-records"
import RecordHighlights from "@/components/stats/record-highlights"
import RecordsScopeToggle from "@/components/stats/records-scope-toggle"

export default async function StatsRecordsPage({
  searchParams,
}: {
  searchParams: Promise<{ season?: string; scope?: string }>
}) {
  const sp = await searchParams
  const supabase = await createClient()

  const { data: seasons } = await supabase
    .from("seasons")
    .select("id, name")
    .eq("has_full_data", true)
    .order("start_year", { ascending: false })

  if (!seasons?.length) {
    return <p className="text-destructive">No hay temporadas disponibles.</p>
  }

  const selected = seasons.find((s) => s.name === sp.season) ?? seasons[0]
  const scopeAll = sp.scope === "all"

  const records = await getH2HRecords(
    supabase,
    scopeAll ? { scope: "all" } : { scope: "season", seasonId: selected.id },
  )

  return (
    <div className="space-y-10">
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-gray">
              {scopeAll ? "Todas las temporadas con datos" : `Temporada ${selected.name}`}
            </p>
            <h2 className="mt-1 text-xl font-bold text-chalk">Récords H2H</h2>
            <p className="mt-1 text-sm text-gray">
              Partidos a doble enfrentamiento y tabla de duelos entre managers.
            </p>
          </div>
          <Suspense fallback={<div className="h-10 w-56 animate-pulse rounded-lg bg-white/5" />}>
            <RecordsScopeToggle />
          </Suspense>
        </div>

        {!records ? (
          <p className="font-meta text-sm text-gray">No hay partidos suficientes para calcular récords.</p>
        ) : (
          <RecordHighlights data={records} />
        )}
      </div>
    </div>
  )
}
